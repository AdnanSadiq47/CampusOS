'use client';

import React, { useState, useMemo } from 'react';
import { ConfigScopeType } from '@campus-os/types';

export type HierarchyNodeType = 'HEAD_OFFICE' | 'REGION' | 'SCHOOL' | 'CAMPUS';

export interface HierarchyNodeItem {
  id: string;
  name: string;
  type: HierarchyNodeType;
  code?: string;
  parentId?: string | null;
  children?: HierarchyNodeItem[];
}

export interface SelectedHierarchyState {
  isEntireOrg: boolean;
  selectedHeadOfficeIds: string[];
  selectedRegionIds: string[];
  selectedSchoolIds: string[];
  selectedCampusIds: string[];
}

export const SAMPLE_AUTHORIZED_HIERARCHY: HierarchyNodeItem[] = [
  {
    id: 'ho_central',
    name: 'Central Head Office',
    code: 'HO-CEN',
    type: 'HEAD_OFFICE',
    children: [
      {
        id: 'reg_south',
        name: 'Region South (Sindh & Balochistan)',
        code: 'REG-SOU',
        type: 'REGION',
        parentId: 'ho_central',
        children: [
          {
            id: 'sch_alpha',
            name: 'Beaconhouse School Alpha',
            code: 'SCH-ALP',
            type: 'SCHOOL',
            parentId: 'reg_south',
            children: [
              { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', name: 'Main Campus (Gulshan)', code: 'CAMPUS-A', type: 'CAMPUS', parentId: 'sch_alpha' },
              { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', name: 'Clifton Campus', code: 'CAMPUS-B', type: 'CAMPUS', parentId: 'sch_alpha' },
            ],
          },
          {
            id: 'sch_gamma',
            name: 'City School Gamma',
            code: 'SCH-GAM',
            type: 'SCHOOL',
            parentId: 'reg_south',
            children: [
              { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'DHA Phase 8 Campus', code: 'CAMPUS-C', type: 'CAMPUS', parentId: 'sch_gamma' },
            ],
          },
        ],
      },
      {
        id: 'reg_north',
        name: 'Region North (Punjab & KPK)',
        code: 'REG-NOR',
        type: 'REGION',
        parentId: 'ho_central',
        children: [
          {
            id: 'sch_beta',
            name: 'Bloomfield Hall School Beta',
            code: 'SCH-BET',
            type: 'SCHOOL',
            parentId: 'reg_north',
            children: [
              { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Gulberg Campus (Lahore)', code: 'CAMPUS-D', type: 'CAMPUS', parentId: 'sch_beta' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'sch_delta_direct',
    name: 'St. Patrick Direct School (Independent)',
    code: 'SCH-PAT',
    type: 'SCHOOL',
    children: [
      { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'Saddar Campus', code: 'CAMPUS-E', type: 'CAMPUS', parentId: 'sch_delta_direct' },
    ],
  },
];

// Helper to generate a human-friendly compact scope summary string
export function getHierarchyScopeSummary(state: SelectedHierarchyState): string {
  if (state.isEntireOrg) {
    return 'Entire Organization (Universal)';
  }

  const parts: string[] = [];
  if (state.selectedHeadOfficeIds.length > 0) {
    parts.push(`${state.selectedHeadOfficeIds.length} Head Office${state.selectedHeadOfficeIds.length > 1 ? 's' : ''}`);
  }
  if (state.selectedRegionIds.length > 0) {
    parts.push(`${state.selectedRegionIds.length} Region${state.selectedRegionIds.length > 1 ? 's' : ''}`);
  }
  if (state.selectedSchoolIds.length > 0) {
    parts.push(`${state.selectedSchoolIds.length} School${state.selectedSchoolIds.length > 1 ? 's' : ''}`);
  }
  if (state.selectedCampusIds.length > 0) {
    parts.push(`${state.selectedCampusIds.length} Campus${state.selectedCampusIds.length > 1 ? 'es' : ''}`);
  }

  if (parts.length === 0) {
    return 'No locations selected';
  }

  return parts.join(' · ');
}

// Helper to resolve all effective descendant campus IDs from mixed selection
export function resolveEffectiveBranchIds(state: SelectedHierarchyState): string[] {
  if (state.isEntireOrg) return [];

  const branchSet = new Set<string>();

  // Add directly selected campuses
  state.selectedCampusIds.forEach((id) => branchSet.add(id));

  // Traverse tree to add descendant campuses of selected parents
  const collectCampuses = (node: HierarchyNodeItem) => {
    if (node.type === 'CAMPUS') {
      branchSet.add(node.id);
    }
    if (node.children) {
      node.children.forEach(collectCampuses);
    }
  };

  const findAndCollect = (nodeId: string, node: HierarchyNodeItem) => {
    if (node.id === nodeId) {
      collectCampuses(node);
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (findAndCollect(nodeId, child)) return true;
      }
    }
    return false;
  };

  const allParentIds = [
    ...state.selectedHeadOfficeIds,
    ...state.selectedRegionIds,
    ...state.selectedSchoolIds,
  ];

  allParentIds.forEach((pId) => {
    SAMPLE_AUTHORIZED_HIERARCHY.forEach((root) => findAndCollect(pId, root));
  });

  return Array.from(branchSet);
}

interface HierarchyScopePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialState: SelectedHierarchyState;
  onApply: (state: SelectedHierarchyState, scopeType: ConfigScopeType, resolvedBranchIds: string[]) => void;
}

export function HierarchyScopePickerModal({
  isOpen,
  onClose,
  initialState,
  onApply,
}: HierarchyScopePickerModalProps) {
  const [scopeState, setScopeState] = useState<SelectedHierarchyState>(initialState);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    ho_central: true,
    reg_south: true,
    reg_north: true,
    sch_delta_direct: true,
  });

  // Reset local state on open
  React.useEffect(() => {
    if (isOpen) {
      setScopeState(initialState);
      setSearchTerm('');
    }
  }, [isOpen, initialState]);

  if (!isOpen) return null;

  // Flattened items lookup
  const flatLookup = useMemo(() => {
    const map = new Map<string, HierarchyNodeItem>();
    const traverse = (node: HierarchyNodeItem) => {
      map.set(node.id, node);
      if (node.children) node.children.forEach(traverse);
    };
    SAMPLE_AUTHORIZED_HIERARCHY.forEach(traverse);
    return map;
  }, []);

  // Check if a node is covered by an ancestor
  const getCoveringAncestor = (nodeId: string): string | null => {
    const node = flatLookup.get(nodeId);
    if (!node || !node.parentId) return null;

    let currentParentId: string | null | undefined = node.parentId;
    while (currentParentId) {
      if (
        scopeState.selectedHeadOfficeIds.includes(currentParentId) ||
        scopeState.selectedRegionIds.includes(currentParentId) ||
        scopeState.selectedSchoolIds.includes(currentParentId)
      ) {
        return flatLookup.get(currentParentId)?.name || 'Parent Organization';
      }
      const parentNode = flatLookup.get(currentParentId);
      currentParentId = parentNode?.parentId;
    }
    return null;
  };

  const handleToggleEntireOrg = (checked: boolean) => {
    if (checked) {
      setScopeState({
        isEntireOrg: true,
        selectedHeadOfficeIds: [],
        selectedRegionIds: [],
        selectedSchoolIds: [],
        selectedCampusIds: [],
      });
    } else {
      setScopeState((prev) => ({ ...prev, isEntireOrg: false }));
    }
  };

  const handleToggleNode = (node: HierarchyNodeItem) => {
    if (scopeState.isEntireOrg) return;

    if (node.type === 'HEAD_OFFICE') {
      const isSelected = scopeState.selectedHeadOfficeIds.includes(node.id);
      setScopeState((prev) => ({
        ...prev,
        selectedHeadOfficeIds: isSelected
          ? prev.selectedHeadOfficeIds.filter((id) => id !== node.id)
          : [...prev.selectedHeadOfficeIds, node.id],
      }));
    } else if (node.type === 'REGION') {
      const isSelected = scopeState.selectedRegionIds.includes(node.id);
      setScopeState((prev) => ({
        ...prev,
        selectedRegionIds: isSelected
          ? prev.selectedRegionIds.filter((id) => id !== node.id)
          : [...prev.selectedRegionIds, node.id],
      }));
    } else if (node.type === 'SCHOOL') {
      const isSelected = scopeState.selectedSchoolIds.includes(node.id);
      setScopeState((prev) => ({
        ...prev,
        selectedSchoolIds: isSelected
          ? prev.selectedSchoolIds.filter((id) => id !== node.id)
          : [...prev.selectedSchoolIds, node.id],
      }));
    } else if (node.type === 'CAMPUS') {
      const isSelected = scopeState.selectedCampusIds.includes(node.id);
      setScopeState((prev) => ({
        ...prev,
        selectedCampusIds: isSelected
          ? prev.selectedCampusIds.filter((id) => id !== node.id)
          : [...prev.selectedCampusIds, node.id],
      }));
    }
  };

  const handleRemoveChip = (id: string, type: HierarchyNodeType) => {
    if (type === 'HEAD_OFFICE') {
      setScopeState((p) => ({ ...p, selectedHeadOfficeIds: p.selectedHeadOfficeIds.filter((x) => x !== id) }));
    } else if (type === 'REGION') {
      setScopeState((p) => ({ ...p, selectedRegionIds: p.selectedRegionIds.filter((x) => x !== id) }));
    } else if (type === 'SCHOOL') {
      setScopeState((p) => ({ ...p, selectedSchoolIds: p.selectedSchoolIds.filter((x) => x !== id) }));
    } else if (type === 'CAMPUS') {
      setScopeState((p) => ({ ...p, selectedCampusIds: p.selectedCampusIds.filter((x) => x !== id) }));
    }
  };

  const handleClearAll = () => {
    setScopeState({
      isEntireOrg: false,
      selectedHeadOfficeIds: [],
      selectedRegionIds: [],
      selectedSchoolIds: [],
      selectedCampusIds: [],
    });
  };

  const totalSelectedCount =
    (scopeState.isEntireOrg ? 1 : 0) +
    scopeState.selectedHeadOfficeIds.length +
    scopeState.selectedRegionIds.length +
    scopeState.selectedSchoolIds.length +
    scopeState.selectedCampusIds.length;

  const handleSave = () => {
    const scopeType: ConfigScopeType = scopeState.isEntireOrg ? 'ALL_CAMPUSES' : 'SELECTED_CAMPUSES';
    const effectiveBranches = resolveEffectiveBranchIds(scopeState);
    onApply(scopeState, scopeType, effectiveBranches);
    onClose();
  };

  // Node matching search helper
  const matchesSearch = (node: HierarchyNodeItem): boolean => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    if (node.name.toLowerCase().includes(q) || (node.code && node.code.toLowerCase().includes(q))) return true;
    if (node.children) return node.children.some(matchesSearch);
    return false;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏛️</span>
              <span>Configure Hierarchy Applicability</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select any combination of Head Offices, Regions, Schools, or Campuses.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Entire Organization Quick Toggle */}
        <div
          onClick={() => handleToggleEntireOrg(!scopeState.isEntireOrg)}
          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
            scopeState.isEntireOrg
              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={scopeState.isEntireOrg}
              onChange={(e) => handleToggleEntireOrg(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🌐</span>
                <span>Entire Organization (Universal Scope)</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically applies to all current schools and dynamically inherits to future branches.
              </p>
            </div>
          </div>
          {scopeState.isEntireOrg && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
              Universal Active
            </span>
          )}
        </div>

        {/* Search Bar */}
        {!scopeState.isEntireOrg && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <input
                type="text"
                placeholder="Search Head Office, Region, School or Campus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Unified Hierarchy Tree List */}
        {!scopeState.isEntireOrg ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-white dark:bg-slate-900/60 max-h-64 overflow-y-auto space-y-2.5">
            {SAMPLE_AUTHORIZED_HIERARCHY.filter(matchesSearch).map((rootNode) => (
              <div key={rootNode.id} className="space-y-1.5">
                {/* Level 1: Head Office */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedNodes((p) => ({ ...p, [rootNode.id]: !p[rootNode.id] }))
                      }
                      className="text-xs text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {expandedNodes[rootNode.id] ? '▼' : '▶'}
                    </button>
                    <input
                      type="checkbox"
                      checked={scopeState.selectedHeadOfficeIds.includes(rootNode.id)}
                      onChange={() => handleToggleNode(rootNode)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {rootNode.name}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    Head Office
                  </span>
                </div>

                {/* Level 2: Regions / Schools */}
                {expandedNodes[rootNode.id] && rootNode.children && (
                  <div className="pl-5 sm:pl-6 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                    {rootNode.children.filter(matchesSearch).map((childNode) => {
                      const coveredByHO = getCoveringAncestor(childNode.id);
                      const isRegionSelected =
                        scopeState.selectedRegionIds.includes(childNode.id) || !!coveredByHO;

                      return (
                        <div key={childNode.id} className="space-y-1">
                          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <div className="flex items-center gap-2">
                              {childNode.children && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedNodes((p) => ({ ...p, [childNode.id]: !p[childNode.id] }))
                                  }
                                  className="text-[11px] text-slate-400 hover:text-slate-600"
                                >
                                  {expandedNodes[childNode.id] ? '▼' : '▶'}
                                </button>
                              )}
                              <input
                                type="checkbox"
                                checked={isRegionSelected}
                                disabled={!!coveredByHO}
                                onChange={() => handleToggleNode(childNode)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 disabled:opacity-40"
                              />
                              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                {childNode.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {coveredByHO && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                  Covered by {coveredByHO}
                                </span>
                              )}
                              <span className="text-[9px] uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                                {childNode.type}
                              </span>
                            </div>
                          </div>

                          {/* Level 3: Schools & Campuses */}
                          {expandedNodes[childNode.id] && childNode.children && (
                            <div className="pl-5 space-y-1 border-l border-slate-100 dark:border-slate-800 ml-2">
                              {childNode.children.filter(matchesSearch).map((grandChild) => {
                                const coveredBy = getCoveringAncestor(grandChild.id);
                                const isSchoolSelected =
                                  scopeState.selectedSchoolIds.includes(grandChild.id) || !!coveredBy;

                                return (
                                  <div key={grandChild.id} className="space-y-1">
                                    <div className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                                      <div className="flex items-center gap-2 truncate">
                                        {grandChild.children && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setExpandedNodes((p) => ({
                                                ...p,
                                                [grandChild.id]: !p[grandChild.id],
                                              }))
                                            }
                                            className="text-[10px] text-slate-400"
                                          >
                                            {expandedNodes[grandChild.id] ? '▼' : '▶'}
                                          </button>
                                        )}
                                        <input
                                          type="checkbox"
                                          checked={isSchoolSelected}
                                          disabled={!!coveredBy}
                                          onChange={() => handleToggleNode(grandChild)}
                                          className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5 disabled:opacity-40"
                                        />
                                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                                          {grandChild.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {coveredBy && (
                                          <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                            Covered
                                          </span>
                                        )}
                                        <span className="text-[9px] uppercase text-slate-400">
                                          {grandChild.type}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Level 4: Individual Campuses */}
                                    {expandedNodes[grandChild.id] && grandChild.children && (
                                      <div className="pl-5 space-y-1 border-l border-slate-100 dark:border-slate-800 ml-2">
                                        {grandChild.children.filter(matchesSearch).map((campusNode) => {
                                          const coveredCampus = getCoveringAncestor(campusNode.id);
                                          const isCampusChecked =
                                            scopeState.selectedCampusIds.includes(campusNode.id) ||
                                            !!coveredCampus;

                                          return (
                                            <div
                                              key={campusNode.id}
                                              className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs"
                                            >
                                              <div className="flex items-center gap-2 truncate">
                                                <input
                                                  type="checkbox"
                                                  checked={isCampusChecked}
                                                  disabled={!!coveredCampus}
                                                  onChange={() => handleToggleNode(campusNode)}
                                                  className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5 disabled:opacity-40"
                                                />
                                                <span className="truncate text-slate-600 dark:text-slate-400">
                                                  {campusNode.name}
                                                </span>
                                              </div>
                                              {coveredCampus && (
                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                                  Covered by {coveredCampus}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Selected Items Summary / Chips */}
        {!scopeState.isEntireOrg && totalSelectedCount > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Selected Scope Targets ({totalSelectedCount}):</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {scopeState.selectedHeadOfficeIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                >
                  <span>🏛️ {flatLookup.get(id)?.name || id}</span>
                  <button onClick={() => handleRemoveChip(id, 'HEAD_OFFICE')} className="text-xs">✕</button>
                </span>
              ))}
              {scopeState.selectedRegionIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                >
                  <span>🗺️ {flatLookup.get(id)?.name || id}</span>
                  <button onClick={() => handleRemoveChip(id, 'REGION')} className="text-xs">✕</button>
                </span>
              ))}
              {scopeState.selectedSchoolIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                >
                  <span>🏫 {flatLookup.get(id)?.name || id}</span>
                  <button onClick={() => handleRemoveChip(id, 'SCHOOL')} className="text-xs">✕</button>
                </span>
              ))}
              {scopeState.selectedCampusIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                >
                  <span>📍 {flatLookup.get(id)?.name || id}</span>
                  <button onClick={() => handleRemoveChip(id, 'CAMPUS')} className="text-xs">✕</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-sm">
            Summary: <span className="font-bold text-slate-800 dark:text-slate-200">{getHierarchyScopeSummary(scopeState)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!scopeState.isEntireOrg && totalSelectedCount === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Apply Scope
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
