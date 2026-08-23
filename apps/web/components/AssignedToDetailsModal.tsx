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
}: AssignedToDetailsModalProps) {
  const [search, setSearch] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<'ALL' | 'DIRECT' | 'INHERITED'>('ALL');

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col justify-between animate-in fade-in zoom-in-95 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Assigned To
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <strong className="text-slate-800 dark:text-slate-200">{formName}</strong> — See where this form is assigned and where it is currently available.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Middle Details Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {/* Universal Scope Banner */}
          {isUniversal ? (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <span>🌐</span>
                  <span>Entire Organization</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full">
                  Universal Availability
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                This form is available across all current schools and campuses ({effectiveCoverage.length} Campuses). New eligible schools and campuses will automatically have access to this form.
              </p>
            </div>
          ) : (
            /* Directly Assigned Section */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Directly Assigned To
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {getHierarchyScopeSummary(safeScope)}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                {/* Region Assignments */}
                {safeScope.selectedRegionIds && safeScope.selectedRegionIds.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Regions ({safeScope.selectedRegionIds.length})
                    </span>
                    <div className="space-y-1">
                      {safeScope.selectedRegionIds.map((id) => (
                        <div key={id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">
                            🗺️ {id === 'reg_south' ? 'Region South (Sindh & Balochistan)' : 'Region North (Punjab & KPK)'}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">Central Head Office</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* School Assignments */}
                {safeScope.selectedSchoolIds && safeScope.selectedSchoolIds.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Schools ({safeScope.selectedSchoolIds.length})
                    </span>
                    <div className="space-y-1">
                      {safeScope.selectedSchoolIds.map((id) => (
                        <div key={id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">
                            🏫 {id === 'sch_alpha' ? 'Beaconhouse School Alpha' : id === 'sch_beta' ? 'Bloomfield Hall School Beta' : 'City School Gamma'}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {id === 'sch_beta' ? 'Region North › Central Head Office' : 'Region South › Central Head Office'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Campus Assignments */}
                {safeScope.selectedCampusIds && safeScope.selectedCampusIds.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Direct Campuses ({safeScope.selectedCampusIds.length})
                    </span>
                    <div className="space-y-1">
                      {safeScope.selectedCampusIds.map((id) => (
                        <div key={id} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                          <span className="font-bold text-slate-900 dark:text-white">
                            📍 Main Campus (Saddar)
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            St. Patrick Direct School
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Also Available At Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Also Available At ({effectiveCoverage.length} Campuses)
              </span>
              <div className="flex items-center gap-1">
                {(['ALL', 'DIRECT', 'INHERITED'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setCoverageFilter(mode)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors ${
                      coverageFilter === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {mode === 'ALL' ? 'All' : mode === 'DIRECT' ? 'Direct' : 'Inherited'}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Input inside Popup */}
            <div className="relative">
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

            {/* Campus List */}
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {filteredCoverage.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No matching campuses found.
                </div>
              ) : (
                filteredCoverage.map((item) => (
                  <div
                    key={item.campusId}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 mr-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate block">
                        📍 {item.campusName}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                        {item.schoolName} {item.regionName ? `› ${item.regionName}` : ''}
                      </span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium block mt-0.5">
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
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
