'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminModal } from './ui/AdminModal';

export interface ConnectedUnitItem {
  id: string;
  name: string;
  code?: string;
  entityType: 'REGION' | 'SCHOOL' | 'BRANCH' | 'USER';
  parentName?: string;
  location?: string;
  status?: boolean | string;
  email?: string;
  phone?: string;
  extraInfo?: string;
}

export interface ConnectedUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentEntityId: string;
  parentEntityName: string;
  parentEntityCode?: string;
  parentEntityType: 'HEAD_OFFICE' | 'REGIONAL_OFFICE' | 'SCHOOL' | 'BRANCH';
  hierarchyNodeId?: string;
  expectedCount?: number;
  zIndex?: number;
  onViewRecord?: (item: ConnectedUnitItem) => void;
}

const ENTITY_ICONS: Record<string, string> = {
  HEAD_OFFICE: '🏢',
  REGIONAL_OFFICE: '🌐',
  REGION: '🌐',
  SCHOOL: '🏫',
  BRANCH: '🏢',
  USER: '👤',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  REGION: 'Regional Office',
  SCHOOL: 'School Institution',
  BRANCH: 'Branch / Campus',
  USER: 'User Assignment',
};

export function ConnectedUnitsModal({
  isOpen,
  onClose,
  parentEntityId,
  parentEntityName,
  parentEntityCode,
  parentEntityType,
  hierarchyNodeId,
  expectedCount,
  zIndex = 120,
  onViewRecord,
}: ConnectedUnitsModalProps) {
  const [items, setItems] = useState<ConnectedUnitItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'REGION' | 'SCHOOL' | 'BRANCH'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchConnectedRecords = useCallback(async () => {
    if (!parentEntityId || !isOpen) return;
    setIsLoading(true);

    const authHeaders = {
      'x-tenant-id': '11111111-1111-1111-1111-111111111111',
      'x-user-id': '99999999-9999-9999-9999-999999999999',
      'x-user-permissions': 'HEAD_OFFICE_VIEW,REGIONAL_OFFICE_VIEW,SCHOOL_VIEW,BRANCH_VIEW',
    };

    const loadedItems: ConnectedUnitItem[] = [];

    try {
      if (parentEntityType === 'HEAD_OFFICE') {
        // 1. Fetch direct regions
        const regRes = await fetch(`/api/regions?parentId=${hierarchyNodeId || parentEntityId}`, {
          headers: authHeaders,
        }).catch(() => null);
        if (regRes && regRes.ok) {
          const regData = await regRes.json();
          if (Array.isArray(regData)) {
            regData.forEach((r: any) => {
              loadedItems.push({
                id: r.id,
                name: r.name,
                code: r.code,
                entityType: 'REGION',
                parentName: parentEntityName,
                location: [r.city, r.province, r.country].filter(Boolean).join(', '),
                status: r.isActive ?? r.status,
                email: r.email,
                phone: r.phone,
              });
            });
          }
        }

        // 2. Fetch schools under this Head Office (direct or under its regions)
        const schRes = await fetch(`/api/schools?headOfficeId=${parentEntityId}`, {
          headers: authHeaders,
        }).catch(() => null);
        if (schRes && schRes.ok) {
          const schData = await schRes.json();
          if (Array.isArray(schData)) {
            schData.forEach((s: any) => {
              loadedItems.push({
                id: s.id,
                name: s.name,
                code: s.code,
                entityType: 'SCHOOL',
                parentName: s.parentName || (s.regionName ? `${s.regionName} (Region)` : parentEntityName),
                location: [s.city, s.province, s.country].filter(Boolean).join(', '),
                status: s.isActive,
                email: s.principalEmail || s.contactEmail,
                phone: s.contactPhone,
                extraInfo: s.level ? `Level: ${s.level}` : undefined,
              });
            });
          }
        }
      } else if (parentEntityType === 'REGIONAL_OFFICE') {
        // Fetch schools under this region
        const schRes = await fetch(`/api/schools?regionId=${parentEntityId}`, {
          headers: authHeaders,
        }).catch(() => null);
        if (schRes && schRes.ok) {
          const schData = await schRes.json();
          if (Array.isArray(schData)) {
            schData.forEach((s: any) => {
              loadedItems.push({
                id: s.id,
                name: s.name,
                code: s.code,
                entityType: 'SCHOOL',
                parentName: parentEntityName,
                location: [s.city, s.province, s.country].filter(Boolean).join(', '),
                status: s.isActive,
                email: s.principalEmail || s.contactEmail,
                phone: s.contactPhone,
                extraInfo: s.level ? `Level: ${s.level}` : undefined,
              });
            });
          }
        }
      } else if (parentEntityType === 'SCHOOL') {
        // Fetch branches / campuses under this school
        const branchRes = await fetch(`/api/branches?schoolId=${parentEntityId}`, {
          headers: authHeaders,
        }).catch(() => null);
        if (branchRes && branchRes.ok) {
          const branchData = await branchRes.json();
          if (Array.isArray(branchData)) {
            branchData.forEach((b: any) => {
              loadedItems.push({
                id: b.id,
                name: b.name,
                code: b.code,
                entityType: 'BRANCH',
                parentName: parentEntityName,
                location: [b.city, b.state, b.country].filter(Boolean).join(', '),
                status: b.isActive ?? b.status ?? 'ACTIVE',
                email: b.email,
                phone: b.phone,
                extraInfo: b.type ? `Type: ${b.type}` : undefined,
              });
            });
          }
        }
      }

      setItems(loadedItems);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [parentEntityId, parentEntityName, parentEntityType, hierarchyNodeId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedFilter('ALL');
      setSearchQuery('');
      fetchConnectedRecords();
    }
  }, [isOpen, fetchConnectedRecords]);

  // Filtering
  const filteredItems = items.filter((item) => {
    if (selectedFilter !== 'ALL' && item.entityType !== selectedFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.code && item.code.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q))
    );
  });

  const availableTypes = Array.from(new Set(items.map((i) => i.entityType)));

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      zIndex={zIndex}
      title={
        <div className="flex items-center gap-2">
          <span>🔗</span>
          <span>Connected Units</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {items.length} {items.length === 1 ? 'Unit' : 'Units'}
          </span>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>{ENTITY_ICONS[parentEntityType] || '🏛️'}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{parentEntityName}</span>
          {parentEntityCode && <span className="font-mono text-[11px] text-slate-400">({parentEntityCode})</span>}
          {expectedCount !== undefined && (
            <span className="ml-2 text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              Expected: {expectedCount}
            </span>
          )}
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-400">
            Showing {filteredItems.length} of {items.length} connected record{items.length === 1 ? '' : 's'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search & Filter Header (if multiple types exist) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search connected units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {availableTypes.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs self-end">
              <button
                type="button"
                onClick={() => setSelectedFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                All ({items.length})
              </button>
              {availableTypes.map((t) => {
                const count = items.filter((i) => i.entityType === t).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedFilter(t as any)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      selectedFilter === t
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {ENTITY_ICONS[t]} {ENTITY_TYPE_LABELS[t] || t} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* List of Connected Units */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <div className="animate-spin text-xl">⏳</div>
            <p className="text-xs">Loading connected units from database...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center space-y-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="text-2xl">🔗</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No Connected Units Found
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'No connected records match your search filter.'
                : `There are currently no active downstream units connected to ${parentEntityName}.`}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item, idx) => {
              const isActive =
                item.status === true ||
                item.status === 'ACTIVE' ||
                item.status === 'active' ||
                item.status === undefined;
              return (
                <div
                  key={item.id || idx}
                  className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base shrink-0 border border-slate-200 dark:border-slate-700/60">
                      {ENTITY_ICONS[item.entityType] || '🏢'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate">
                          {item.name}
                        </span>
                        {item.code && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                            {item.code}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">
                          {ENTITY_TYPE_LABELS[item.entityType] || item.entityType}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        {item.location && <span>📍 {item.location}</span>}
                        {item.parentName && item.parentName !== parentEntityName && (
                          <span>🏛️ Parent: {item.parentName}</span>
                        )}
                        {item.email && <span className="truncate max-w-[160px]">✉️ {item.email}</span>}
                        {item.phone && <span>📞 {item.phone}</span>}
                        {item.extraInfo && <span className="text-slate-400">• {item.extraInfo}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {isActive ? 'Active' : 'Inactive'}
                    </span>

                    {onViewRecord && (
                      <button
                        type="button"
                        onClick={() => onViewRecord(item)}
                        title="View Record Details"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                      >
                        View ↗
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminModal>
  );
}
