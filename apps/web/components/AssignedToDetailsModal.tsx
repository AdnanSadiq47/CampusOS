'use client';

import React, { useState, useMemo } from 'react';
import {
  HierarchyNodeItem,
  SAMPLE_AUTHORIZED_HIERARCHY,
  SelectedHierarchyState,
  EffectiveCoverageItem,
  resolveEffectiveCoverageDetails,
  getHierarchyScopeSummary,
} from './HierarchyScopePickerModal';

interface AssignedToDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
  scopeState?: SelectedHierarchyState | null;
  authorizedHierarchy?: HierarchyNodeItem[];
  currentContextName?: string;
  currentContextCampusIds?: string[];
}

export function AssignedToDetailsModal({
  isOpen,
  onClose,
  formName,
  scopeState = {
    isEntireOrg: false,
    selectedHeadOfficeIds: [],
    selectedRegionIds: ['reg_south'],
    selectedSchoolIds: ['sch_alpha', 'sch_gamma'],
    selectedCampusIds: [],
  },
  authorizedHierarchy = SAMPLE_AUTHORIZED_HIERARCHY,
  currentContextName,
  currentContextCampusIds,
}: AssignedToDetailsModalProps) {
  const [search, setSearch] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<'ALL' | 'DIRECT' | 'INHERITED'>('ALL');
  const [showAllDirectChips, setShowAllDirectChips] = useState(false);

  const safeScope = scopeState || {
    isEntireOrg: false,
    selectedHeadOfficeIds: [],
    selectedRegionIds: [],
    selectedSchoolIds: [],
    selectedCampusIds: [],
  };

  const isUniversal = safeScope.isEntireOrg;

  const effectiveCoverage: EffectiveCoverageItem[] = useMemo(() => {
    return resolveEffectiveCoverageDetails(safeScope, authorizedHierarchy);
  }, [safeScope, authorizedHierarchy]);

  // Lookup map for parent hierarchy names
  const flatLookup = useMemo(() => {
    const map = new Map<string, HierarchyNodeItem>();
    const traverse = (node: HierarchyNodeItem) => {
      if (!node) return;
      map.set(node.id, node);
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(traverse);
      }
    };
    (authorizedHierarchy || []).forEach(traverse);
    return map;
  }, [authorizedHierarchy]);

  // Collect compact direct assignment items
  const directAssignmentItems = useMemo(() => {
    const items: Array<{ id: string; name: string; type: string; icon: string }> = [];

    safeScope.selectedHeadOfficeIds.forEach((id) => {
      const n = flatLookup.get(id);
      items.push({ id, name: n?.name || id, type: 'HEAD OFFICE', icon: '🏛️' });
    });
    safeScope.selectedRegionIds.forEach((id) => {
      const n = flatLookup.get(id);
      items.push({ id, name: n?.name || id, type: 'REGION', icon: '🗺️' });
    });
    safeScope.selectedSchoolIds.forEach((id) => {
      const n = flatLookup.get(id);
      items.push({ id, name: n?.name || id, type: 'SCHOOL', icon: '🏫' });
    });
    safeScope.selectedCampusIds.forEach((id) => {
      const n = flatLookup.get(id);
      items.push({ id, name: n?.name || id, type: 'CAMPUS', icon: '📍' });
    });

    return items;
  }, [safeScope, flatLookup]);

  // Filtering coverage list
  const filteredCoverage = useMemo(() => {
    return effectiveCoverage.filter((item) => {
      if (coverageFilter === 'DIRECT' && item.coverageType !== 'DIRECT') return false;
      if (coverageFilter === 'INHERITED' && item.coverageType !== 'INHERITED' && item.coverageType !== 'UNIVERSAL') return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.campusName.toLowerCase().includes(q) ||
          item.schoolName.toLowerCase().includes(q) ||
          (item.regionName && item.regionName.toLowerCase().includes(q)) ||
          (item.headOfficeName && item.headOfficeName.toLowerCase().includes(q)) ||
          item.appliedVia.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [effectiveCoverage, coverageFilter, search]);

  const isEffectiveInCurrentContext = useMemo(() => {
    if (isUniversal) return true;
    if (!currentContextCampusIds || currentContextCampusIds.length === 0) return true;
    return effectiveCoverage.some((c) => currentContextCampusIds.includes(c.campusId));
  }, [isUniversal, currentContextCampusIds, effectiveCoverage]);

  if (!isOpen) return null;

  const visibleDirectChips = showAllDirectChips ? directAssignmentItems : directAssignmentItems.slice(0, 6);
  const hiddenDirectCount = directAssignmentItems.length - 6;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-3.5 max-h-[88vh] sm:max-h-[85vh] flex flex-col justify-between animate-in fade-in zoom-in-95 my-auto">
        {/* 1. Modal Header (Compact & Fixed) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Assigned To
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <strong className="text-slate-800 dark:text-slate-200">{formName}</strong> — See where this configuration is assigned and effective.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Working Context Scope Status Banner */}
        {currentContextName && (
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs shrink-0 ${
            isEffectiveInCurrentContext
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <span>{isEffectiveInCurrentContext ? '✅' : '⚠️'}</span>
              <span className="truncate">
                Working Context: <strong className="font-semibold">{currentContextName}</strong>
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
              isEffectiveInCurrentContext
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
            }`}>
              {isUniversal ? 'Universal' : isEffectiveInCurrentContext ? 'Direct / Active' : 'Not In Context'}
            </span>
          </div>
        )}

        {/* 2. Directly Assigned To (Flattened & Compact Strip ~10-15% height) */}
        <div className="shrink-0 space-y-1.5">
          {isUniversal ? (
            <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🌐</span>
                <div>
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">Entire Organization</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Universal availability with dynamic inheritance to all present and future campuses.
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full shrink-0">
                Universal
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Directly Assigned To
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {getHierarchyScopeSummary(safeScope)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {directAssignmentItems.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No direct units configured</span>
                ) : (
                  visibleDirectChips.map((item) => (
                    <span
                      key={`${item.type}_${item.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <span className="text-xs">{item.icon}</span>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        {item.type} ·
                      </span>
                      <span className="truncate max-w-[200px]">{item.name}</span>
                    </span>
                  ))
                )}

                {hiddenDirectCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllDirectChips(!showAllDirectChips)}
                    className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                  >
                    {showAllDirectChips ? 'Show less' : `+${hiddenDirectCount} more`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Also Available At (Primary Flex-1 Scrollable Area) */}
        <div className="flex-1 flex flex-col min-h-0 space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Header & Filter Pills */}
          <div className="flex items-center justify-between text-xs shrink-0">
            <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Also Available At</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                ({effectiveCoverage.length} Campuses)
              </span>
            </span>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              {(['ALL', 'DIRECT', 'INHERITED'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setCoverageFilter(mode)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
                    coverageFilter === mode
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {mode === 'ALL' ? 'All' : mode === 'DIRECT' ? 'Direct' : 'Inherited'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative shrink-0">
            <span className="absolute left-3 top-2 text-xs text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search school or campus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Main Scrollable Campus List */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 pr-1">
            {filteredCoverage.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 space-y-1">
                <span className="text-xl block">🔍</span>
                <span>No campuses found matching search criteria.</span>
              </div>
            ) : (
              filteredCoverage.map((item) => (
                <div
                  key={item.campusId}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="min-w-0 mr-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      📍 {item.campusName}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                      {item.schoolName} {item.regionName ? `› ${item.regionName}` : ''}
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block mt-0.5">
                      {item.coverageType === 'DIRECT'
                        ? 'Directly Assigned'
                        : `Assigned through: ${item.appliedVia}`}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      item.coverageType === 'DIRECT'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : item.coverageType === 'UNIVERSAL'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {item.coverageType}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. Modal Footer Actions (Fixed) */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
