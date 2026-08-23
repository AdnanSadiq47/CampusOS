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

export type FormApplyMode =
  | 'ENTIRE_ORGANIZATION'
  | 'SELECTED_HEAD_OFFICES'
  | 'SELECTED_REGIONS'
  | 'SELECTED_SCHOOLS'
  | 'SELECTED_CAMPUSES'
  | 'CUSTOM_SELECTION';

export const SAMPLE_ORGANIZATION_HIERARCHY: HierarchyNodeItem[] = [
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

interface FormHierarchyScopeSelectorProps {
  applyMode: FormApplyMode;
  onChangeApplyMode: (mode: FormApplyMode, scopeType: ConfigScopeType) => void;
  selectedBranchIds: string[];
  onChangeBranchIds: (branchIds: string[]) => void;
  disabled?: boolean;
}

export function FormHierarchyScopeSelector({
  applyMode,
  onChangeApplyMode,
  selectedBranchIds,
  onChangeBranchIds,
  disabled = false,
}: FormHierarchyScopeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParentNodes, setSelectedParentNodes] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    ho_central: true,
    reg_south: true,
  });

  // Flattened items by type
  const flatNodes = useMemo(() => {
    const headOffices: HierarchyNodeItem[] = [];
    const regions: HierarchyNodeItem[] = [];
    const schools: HierarchyNodeItem[] = [];
    const campuses: HierarchyNodeItem[] = [];

    const traverse = (node: HierarchyNodeItem) => {
      if (node.type === 'HEAD_OFFICE') headOffices.push(node);
      if (node.type === 'REGION') regions.push(node);
      if (node.type === 'SCHOOL') schools.push(node);
      if (node.type === 'CAMPUS') campuses.push(node);
      if (node.children) node.children.forEach(traverse);
    };

    SAMPLE_ORGANIZATION_HIERARCHY.forEach(traverse);
    return { headOffices, regions, schools, campuses };
  }, []);

  // Helper to find all descendant campus IDs for any node
  const getDescendantCampusIds = (nodeId: string): string[] => {
    const results: string[] = [];
    const findNodeAndCollect = (node: HierarchyNodeItem) => {
      if (node.id === nodeId) {
        const collect = (curr: HierarchyNodeItem) => {
          if (curr.type === 'CAMPUS') results.push(curr.id);
          if (curr.children) curr.children.forEach(collect);
        };
        collect(node);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findNodeAndCollect(child)) return true;
        }
      }
      return false;
    };

    SAMPLE_ORGANIZATION_HIERARCHY.forEach(findNodeAndCollect);
    return results;
  };

  // Check if a campus is covered by an active parent selection
  const isCampusCoveredByParent = (campusId: string): string | null => {
    for (const parentId of selectedParentNodes) {
      const descendants = getDescendantCampusIds(parentId);
      if (descendants.includes(campusId)) {
        // Find parent label
        const allItems = [...flatNodes.headOffices, ...flatNodes.regions, ...flatNodes.schools];
        const matchedParent = allItems.find((p) => p.id === parentId);
        return matchedParent?.name || parentId;
      }
    }
    return null;
  };

  // Toggle single item in list modes
  const handleToggleItem = (itemId: string, nodeType: HierarchyNodeType) => {
    if (nodeType === 'CAMPUS') {
      if (selectedBranchIds.includes(itemId)) {
        onChangeBranchIds(selectedBranchIds.filter((id) => id !== itemId));
      } else {
        onChangeBranchIds([...selectedBranchIds, itemId]);
      }
    } else {
      // Parent level selection (Head Office, Region, School)
      const campusIds = getDescendantCampusIds(itemId);
      const isAlreadySelected = selectedParentNodes.includes(itemId);

      if (isAlreadySelected) {
        setSelectedParentNodes(selectedParentNodes.filter((id) => id !== itemId));
        // Remove only campus IDs belonging to this parent that aren't covered by other selected parents
        onChangeBranchIds(selectedBranchIds.filter((id) => !campusIds.includes(id)));
      } else {
        setSelectedParentNodes([...selectedParentNodes, itemId]);
        // Add all unique descendant campus IDs
        const newSet = new Set([...selectedBranchIds, ...campusIds]);
        onChangeBranchIds(Array.from(newSet));
      }
    }
  };

  const handleSelectAllInMode = (items: HierarchyNodeItem[]) => {
    const allCampusIds = new Set<string>();
    items.forEach((item) => {
      const ids = item.type === 'CAMPUS' ? [item.id] : getDescendantCampusIds(item.id);
      ids.forEach((id) => allCampusIds.add(id));
    });
    onChangeBranchIds(Array.from(allCampusIds));
    if (applyMode === 'SELECTED_HEAD_OFFICES') setSelectedParentNodes(items.map((i) => i.id));
    if (applyMode === 'SELECTED_REGIONS') setSelectedParentNodes(items.map((i) => i.id));
    if (applyMode === 'SELECTED_SCHOOLS') setSelectedParentNodes(items.map((i) => i.id));
  };

  const handleClearAll = () => {
    onChangeBranchIds([]);
    setSelectedParentNodes([]);
  };

  // Get current list of items based on active mode
  const currentModeItems = useMemo(() => {
    let list: HierarchyNodeItem[] = [];
    if (applyMode === 'SELECTED_HEAD_OFFICES') list = flatNodes.headOffices;
    else if (applyMode === 'SELECTED_REGIONS') list = flatNodes.regions;
    else if (applyMode === 'SELECTED_SCHOOLS') list = flatNodes.schools;
    else if (applyMode === 'SELECTED_CAMPUSES') list = flatNodes.campuses;

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter((i) => i.name.toLowerCase().includes(q) || (i.code && i.code.toLowerCase().includes(q)));
  }, [applyMode, flatNodes, searchTerm]);

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-1">
          Apply Form To *
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Determine the governance scope and applicability of this form across your institutional hierarchy.
        </p>
      </div>

      {/* ── 6 Applicability Mode Options ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {[
          {
            mode: 'ENTIRE_ORGANIZATION' as FormApplyMode,
            scopeType: 'ALL_CAMPUSES' as ConfigScopeType,
            label: 'Entire Organization',
            desc: 'Applies dynamically to all current & future branches',
            icon: '🌐',
          },
          {
            mode: 'SELECTED_HEAD_OFFICES' as FormApplyMode,
            scopeType: 'SELECTED_CAMPUSES' as ConfigScopeType,
            label: 'Selected Head Offices',
            desc: 'Applies to branches under chosen Head Offices',
            icon: '🏛️',
          },
          {
            mode: 'SELECTED_REGIONS' as FormApplyMode,
            scopeType: 'SELECTED_CAMPUSES' as ConfigScopeType,
            label: 'Selected Regions',
            desc: 'Applies to branches under chosen Regions',
            icon: '🗺️',
          },
          {
            mode: 'SELECTED_SCHOOLS' as FormApplyMode,
            scopeType: 'SELECTED_CAMPUSES' as ConfigScopeType,
            label: 'Selected Schools',
            desc: 'Applies across all campuses of chosen Schools',
            icon: '🏫',
          },
          {
            mode: 'SELECTED_CAMPUSES' as FormApplyMode,
            scopeType: 'SELECTED_CAMPUSES' as ConfigScopeType,
            label: 'Selected Campuses',
            desc: 'Target specific individual branch campuses',
            icon: '📍',
          },
          {
            mode: 'CUSTOM_SELECTION' as FormApplyMode,
            scopeType: 'SELECTED_CAMPUSES' as ConfigScopeType,
            label: 'Custom Selection',
            desc: 'Mix and match variable-depth hierarchy targets',
            icon: '🔀',
          },
        ].map((opt) => {
          const isSelected = applyMode === opt.mode;

          return (
            <div
              key={opt.mode}
              onClick={() => {
                if (!disabled) {
                  onChangeApplyMode(opt.mode, opt.scopeType);
                  if (opt.mode === 'ENTIRE_ORGANIZATION') {
                    onChangeBranchIds([]);
                    setSelectedParentNodes([]);
                  }
                }
              }}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 ring-2 ring-indigo-500/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{opt.icon}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {opt.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                {opt.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── ENTIRE ORGANIZATION INFORMATIONAL BANNER ── */}
      {applyMode === 'ENTIRE_ORGANIZATION' && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5">
          <span className="text-lg">✓</span>
          <span>
            This form will apply universally across all campuses in the organization. Any newly created campus will automatically inherit this published form.
          </span>
        </div>
      )}

      {/* ── SEARCHABLE MULTI-SELECT (FOR HEAD OFFICES / REGIONS / SCHOOLS / CAMPUSES) ── */}
      {(applyMode === 'SELECTED_HEAD_OFFICES' ||
        applyMode === 'SELECTED_REGIONS' ||
        applyMode === 'SELECTED_SCHOOLS' ||
        applyMode === 'SELECTED_CAMPUSES') && (
        <div className="pt-2 space-y-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Select {applyMode.replace('SELECTED_', '').replace(/_/g, ' ')} *
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectAllInMode(currentModeItems)}
                disabled={disabled}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Select All ({currentModeItems.length})
              </button>
              <span className="text-slate-300 dark:text-slate-700 text-xs">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={disabled}
                className="text-[11px] font-semibold text-slate-500 hover:text-rose-500 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search locations by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />

          {/* Selected Chips */}
          {selectedBranchIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedBranchIds.map((bId) => {
                const item =
                  flatNodes.campuses.find((c) => c.id === bId) ||
                  flatNodes.schools.find((s) => s.id === bId) ||
                  flatNodes.regions.find((r) => r.id === bId) ||
                  flatNodes.headOffices.find((h) => h.id === bId);

                return (
                  <span
                    key={bId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>{item?.name || bId}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleItem(bId, item?.type || 'CAMPUS')}
                      className="hover:text-rose-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Checkbox List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {currentModeItems.map((item) => {
              const isChecked =
                item.type === 'CAMPUS'
                  ? selectedBranchIds.includes(item.id)
                  : selectedParentNodes.includes(item.id);

              return (
                <label
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 font-semibold text-indigo-950 dark:text-indigo-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(item.id, item.type)}
                      disabled={disabled}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.code && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 ml-1 shrink-0">
                      {item.code}
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {selectedBranchIds.length === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              ⚠️ Please select at least one location.
            </p>
          )}
        </div>
      )}

      {/* ── CUSTOM SELECTION (HIERARCHY-AWARE TREE) ── */}
      {applyMode === 'CUSTOM_SELECTION' && (
        <div className="pt-2 space-y-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Custom Hierarchy Selection Tree
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-slate-500 hover:text-rose-500 cursor-pointer"
            >
              Clear All
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900 max-h-56 overflow-y-auto space-y-3">
            {SAMPLE_ORGANIZATION_HIERARCHY.map((rootNode) => (
              <div key={rootNode.id} className="space-y-1.5">
                {/* Root / Head Office Level */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedNodes((p) => ({ ...p, [rootNode.id]: !p[rootNode.id] }))
                      }
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      {expandedNodes[rootNode.id] ? '▼' : '▶'}
                    </button>
                    <input
                      type="checkbox"
                      checked={selectedParentNodes.includes(rootNode.id)}
                      onChange={() => handleToggleItem(rootNode.id, rootNode.type)}
                      className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {rootNode.name}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    {rootNode.type.replace('_', ' ')}
                  </span>
                </div>

                {/* Descendant Tree */}
                {expandedNodes[rootNode.id] && rootNode.children && (
                  <div className="pl-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                    {rootNode.children.map((childNode) => (
                      <div key={childNode.id} className="space-y-1">
                        <div className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={
                                selectedParentNodes.includes(childNode.id) ||
                                selectedParentNodes.includes(rootNode.id)
                              }
                              onChange={() => handleToggleItem(childNode.id, childNode.type)}
                              className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5"
                            />
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                              {childNode.name}
                            </span>
                          </div>
                          <span className="text-[9px] uppercase text-slate-400">
                            {childNode.type}
                          </span>
                        </div>

                        {/* Grandchildren (Schools & Campuses) */}
                        {childNode.children && (
                          <div className="pl-5 space-y-1 border-l border-slate-100 dark:border-slate-800 ml-2">
                            {childNode.children.map((grandChild) => {
                              const coveredBy =
                                isCampusCoveredByParent(grandChild.id) ||
                                (selectedParentNodes.includes(childNode.id) ? childNode.name : null);
                              const isChecked =
                                selectedBranchIds.includes(grandChild.id) ||
                                selectedParentNodes.includes(grandChild.id) ||
                                !!coveredBy;

                              return (
                                <div
                                  key={grandChild.id}
                                  className="flex items-center justify-between p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30 text-xs"
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={!!coveredBy}
                                      onChange={() => handleToggleItem(grandChild.id, grandChild.type)}
                                      className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5 disabled:opacity-40"
                                    />
                                    <span className="truncate text-slate-600 dark:text-slate-400">
                                      {grandChild.name}
                                    </span>
                                  </div>
                                  {coveredBy && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                      Covered by {coveredBy}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {selectedBranchIds.length === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              ⚠️ Please select at least one location.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
