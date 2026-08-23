'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
              { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'DHA Phase 6 Campus', code: 'CAMPUS-C', type: 'CAMPUS', parentId: 'sch_alpha' },
              { id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', name: 'Gulshan Senior Campus', code: 'CAMPUS-D', type: 'CAMPUS', parentId: 'sch_alpha' },
            ],
          },
          {
            id: 'sch_gamma',
            name: 'City School Gamma',
            code: 'SCH-GAM',
            type: 'SCHOOL',
            parentId: 'reg_south',
            children: [
              { id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', name: 'DHA Phase 8 Campus', code: 'CAMPUS-E', type: 'CAMPUS', parentId: 'sch_gamma' },
              { id: 'ffffffff-ffff-ffff-ffff-ffffffffffff', name: 'Tipu Sultan Campus', code: 'CAMPUS-F', type: 'CAMPUS', parentId: 'sch_gamma' },
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
              { id: '11111111-2222-3333-4444-555555555555', name: 'Lahore Main Campus', code: 'CAMPUS-G', type: 'CAMPUS', parentId: 'sch_beta' },
              { id: '22222222-3333-4444-5555-666666666666', name: 'Cantt Lahore Campus', code: 'CAMPUS-H', type: 'CAMPUS', parentId: 'sch_beta' },
              { id: '33333333-4444-5555-6666-777777777777', name: 'Johar Town Campus', code: 'CAMPUS-I', type: 'CAMPUS', parentId: 'sch_beta' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ho_aps',
    name: 'Army Public Schools Directorate (No-Region Network)',
    code: 'HO-APS',
    type: 'HEAD_OFFICE',
    children: [
      {
        id: 'sch_aps_central',
        name: 'APS Central School (Direct)',
        code: 'APS-CEN',
        type: 'SCHOOL',
        parentId: 'ho_aps',
        children: [
          { id: '66666666-7777-8888-9999-000000000001', name: 'Peshawar Main Campus', code: 'APS-PES', type: 'CAMPUS', parentId: 'sch_aps_central' },
          { id: '66666666-7777-8888-9999-000000000002', name: 'Rawalpindi Campus', code: 'APS-RWP', type: 'CAMPUS', parentId: 'sch_aps_central' },
        ],
      },
      {
        id: 'sch_aps_south',
        name: 'APS Southern School (Direct)',
        code: 'APS-SOU',
        type: 'SCHOOL',
        parentId: 'ho_aps',
        children: [
          { id: '66666666-7777-8888-9999-000000000003', name: 'Karachi Cantt Campus', code: 'APS-KHI', type: 'CAMPUS', parentId: 'sch_aps_south' },
          { id: '66666666-7777-8888-9999-000000000004', name: 'Malir Garrison Campus', code: 'APS-MLR', type: 'CAMPUS', parentId: 'sch_aps_south' },
        ],
      },
    ],
  },
  {
    id: 'sch_delta_direct',
    name: 'St. Patrick Direct School (Independent / Single School)',
    code: 'SCH-PAT',
    type: 'SCHOOL',
    children: [
      { id: '44444444-5555-6666-7777-888888888888', name: 'Main Campus (Saddar)', code: 'CAMPUS-J', type: 'CAMPUS', parentId: 'sch_delta_direct' },
      { id: '55555555-6666-7777-8888-999999999999', name: 'North Campus', code: 'CAMPUS-K', type: 'CAMPUS', parentId: 'sch_delta_direct' },
    ],
  },
];

// Helper to generate a human-friendly compact scope summary string
export function getHierarchyScopeSummary(state?: SelectedHierarchyState | null): string {
  if (!state) return 'No locations selected';
  if (state.isEntireOrg) {
    return 'Entire Organization (Universal)';
  }

  const parts: string[] = [];
  const hoCount = state.selectedHeadOfficeIds?.length || 0;
  const regCount = state.selectedRegionIds?.length || 0;
  const schCount = state.selectedSchoolIds?.length || 0;
  const campCount = state.selectedCampusIds?.length || 0;

  if (hoCount > 0) parts.push(`${hoCount} Head Office${hoCount > 1 ? 's' : ''}`);
  if (regCount > 0) parts.push(`${regCount} Region${regCount > 1 ? 's' : ''}`);
  if (schCount > 0) parts.push(`${schCount} School${schCount > 1 ? 's' : ''}`);
  if (campCount > 0) parts.push(`${campCount} Campus${campCount > 1 ? 'es' : ''}`);

  if (parts.length === 0) {
    return 'No locations selected';
  }

  return parts.join(' · ');
}

// Helper to resolve all effective descendant campus IDs from mixed selection
export function resolveEffectiveBranchIds(
  state?: SelectedHierarchyState | null,
  hierarchy: HierarchyNodeItem[] = SAMPLE_AUTHORIZED_HIERARCHY
): string[] {
  if (!state || state.isEntireOrg) return [];

  const branchSet = new Set<string>();

  // Add directly selected campuses
  (state.selectedCampusIds || []).forEach((id) => branchSet.add(id));

  // Traverse tree to add descendant campuses of selected parents
  const collectCampuses = (node: HierarchyNodeItem) => {
    if (!node) return;
    if (node.type === 'CAMPUS') {
      branchSet.add(node.id);
    }
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(collectCampuses);
    }
  };

  const findAndCollect = (nodeId: string, node: HierarchyNodeItem) => {
    if (!node) return false;
    if (node.id === nodeId) {
      collectCampuses(node);
      return true;
    }
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        if (findAndCollect(nodeId, child)) return true;
      }
    }
    return false;
  };

  const allParentIds = [
    ...(state.selectedHeadOfficeIds || []),
    ...(state.selectedRegionIds || []),
    ...(state.selectedSchoolIds || []),
  ];

  allParentIds.forEach((pId) => {
    (hierarchy || []).forEach((root) => findAndCollect(pId, root));
  });

  return Array.from(branchSet);
}

// Recursive helper to count total descendant campuses under a node
export function countCampuses(node: HierarchyNodeItem): number {
  if (!node) return 0;
  if (node.type === 'CAMPUS') return 1;
  if (!node.children || !Array.isArray(node.children)) return 0;
  return node.children.reduce((sum, child) => sum + countCampuses(child), 0);
}

interface HierarchyScopePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialState: SelectedHierarchyState;
  onApply: (state: SelectedHierarchyState, scopeType: ConfigScopeType, resolvedBranchIds: string[]) => void;
  authorizedHierarchy?: HierarchyNodeItem[];
  userRole?: string;
}

export function HierarchyScopePickerModal({
  isOpen,
  onClose,
  initialState,
  onApply,
  authorizedHierarchy = SAMPLE_AUTHORIZED_HIERARCHY,
  userRole = 'SCHOOL_ADMIN',
}: HierarchyScopePickerModalProps) {
  // ── ALL HOOKS UNCONDITIONALLY AT COMPONENT TOP LEVEL ──

  const [scopeState, setScopeState] = useState<SelectedHierarchyState>(initialState);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'SELECTED_ONLY'>('ALL');
  const [showSelectedDrawer, setShowSelectedDrawer] = useState(false);
  const [selectedDrawerSearch, setSelectedDrawerSearch] = useState('');

  // Default expansion: Top level collapsed / only first HO open for scalability
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    ho_central: true,
  });

  // Sync on modal open
  useEffect(() => {
    if (isOpen) {
      setScopeState(initialState);
      setSearchTerm('');
      setViewFilter('ALL');
      setShowSelectedDrawer(false);
    }
  }, [isOpen, initialState]);

  const safeHierarchy = useMemo(() => {
    return Array.isArray(authorizedHierarchy) ? authorizedHierarchy : [];
  }, [authorizedHierarchy]);

  // Flattened lookup map with parent & descendant relations for O(1) checks
  const { flatLookup, descendantCampusMap, breadcrumbMap } = useMemo(() => {
    const flat = new Map<string, HierarchyNodeItem>();
    const descMap = new Map<string, string[]>();
    const bcrumb = new Map<string, string>();

    const getCampuses = (n: HierarchyNodeItem): string[] => {
      if (n.type === 'CAMPUS') return [n.id];
      if (!n.children || !Array.isArray(n.children)) return [];
      return n.children.flatMap(getCampuses);
    };

    const traverse = (node: HierarchyNodeItem, path: string[] = []) => {
      if (!node) return;
      flat.set(node.id, node);
      const currentPath = [...path, node.name];
      bcrumb.set(node.id, currentPath.join(' › '));
      descMap.set(node.id, getCampuses(node));

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((c) => traverse(c, currentPath));
      }
    };

    safeHierarchy.forEach((root) => traverse(root, []));
    return { flatLookup: flat, descendantCampusMap: descMap, breadcrumbMap: bcrumb };
  }, [safeHierarchy]);

  // Check if a node is covered by an ancestor
  const getCoveringAncestor = useCallback(
    (nodeId: string): string | null => {
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
    },
    [flatLookup, scopeState]
  );

  // Tri-state selection check: 'NONE' | 'PARTIAL' | 'FULL'
  const getNodeSelectionState = useCallback(
    (node: HierarchyNodeItem): 'NONE' | 'PARTIAL' | 'FULL' => {
      if (scopeState.isEntireOrg) return 'FULL';
      const coveredBy = getCoveringAncestor(node.id);
      if (coveredBy) return 'FULL';

      if (node.type === 'CAMPUS') {
        return scopeState.selectedCampusIds.includes(node.id) ? 'FULL' : 'NONE';
      }

      const isDirectlySelected =
        (node.type === 'HEAD_OFFICE' && scopeState.selectedHeadOfficeIds.includes(node.id)) ||
        (node.type === 'REGION' && scopeState.selectedRegionIds.includes(node.id)) ||
        (node.type === 'SCHOOL' && scopeState.selectedSchoolIds.includes(node.id));

      if (isDirectlySelected) return 'FULL';

      // Check descendant campuses for partial selection
      const descendantCampusIds = descendantCampusMap.get(node.id) || [];
      if (descendantCampusIds.length === 0) return 'NONE';

      const selectedDescendantCount = descendantCampusIds.filter((cId) =>
        scopeState.selectedCampusIds.includes(cId)
      ).length;

      if (selectedDescendantCount === descendantCampusIds.length && descendantCampusIds.length > 0) {
        return 'FULL';
      }
      if (selectedDescendantCount > 0) {
        return 'PARTIAL';
      }

      // Check if any intermediate child region/school is selected
      const hasAnySelectedChild = (n: HierarchyNodeItem): boolean => {
        if (!n.children) return false;
        return n.children.some((c) => {
          if (c.type === 'REGION' && scopeState.selectedRegionIds.includes(c.id)) return true;
          if (c.type === 'SCHOOL' && scopeState.selectedSchoolIds.includes(c.id)) return true;
          return hasAnySelectedChild(c);
        });
      };

      if (hasAnySelectedChild(node)) return 'PARTIAL';

      return 'NONE';
    },
    [scopeState, getCoveringAncestor, descendantCampusMap]
  );

  // Search filter helper
  const matchesSearch = useCallback(
    (node: HierarchyNodeItem): boolean => {
      if (!node) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      if (node.name?.toLowerCase().includes(q) || (node.code && node.code.toLowerCase().includes(q))) {
        return true;
      }
      if (node.children && Array.isArray(node.children)) {
        return node.children.some(matchesSearch);
      }
      return false;
    },
    [searchTerm]
  );

  // "Selected Only" filter check
  const matchesSelectedOnly = useCallback(
    (node: HierarchyNodeItem): boolean => {
      if (viewFilter === 'ALL') return true;
      const selState = getNodeSelectionState(node);
      if (selState !== 'NONE') return true;
      if (node.children && Array.isArray(node.children)) {
        return node.children.some(matchesSelectedOnly);
      }
      return false;
    },
    [viewFilter, getNodeSelectionState]
  );

  const canApplyUniversal = userRole !== 'CAMPUS_ADMIN';

  const handleToggleEntireOrg = (checked: boolean) => {
    if (!canApplyUniversal) return;
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
    if (scopeState.isEntireOrg || !node) return;

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
    (scopeState.selectedHeadOfficeIds?.length || 0) +
    (scopeState.selectedRegionIds?.length || 0) +
    (scopeState.selectedSchoolIds?.length || 0) +
    (scopeState.selectedCampusIds?.length || 0);

  const handleSave = () => {
    const scopeType: ConfigScopeType = scopeState.isEntireOrg ? 'ALL_CAMPUSES' : 'SELECTED_CAMPUSES';
    const effectiveBranches = resolveEffectiveBranchIds(scopeState, safeHierarchy);
    onApply(scopeState, scopeType, effectiveBranches);
    onClose();
  };

  // Compile list of selected items for the "View Selected" list
  const selectedItemsList = useMemo(() => {
    const list: Array<{ id: string; name: string; type: HierarchyNodeType; breadcrumb: string }> = [];
    scopeState.selectedHeadOfficeIds.forEach((id) => {
      const n = flatLookup.get(id);
      if (n) list.push({ id: n.id, name: n.name, type: 'HEAD_OFFICE', breadcrumb: breadcrumbMap.get(n.id) || n.name });
    });
    scopeState.selectedRegionIds.forEach((id) => {
      const n = flatLookup.get(id);
      if (n) list.push({ id: n.id, name: n.name, type: 'REGION', breadcrumb: breadcrumbMap.get(n.id) || n.name });
    });
    scopeState.selectedSchoolIds.forEach((id) => {
      const n = flatLookup.get(id);
      if (n) list.push({ id: n.id, name: n.name, type: 'SCHOOL', breadcrumb: breadcrumbMap.get(n.id) || n.name });
    });
    scopeState.selectedCampusIds.forEach((id) => {
      const n = flatLookup.get(id);
      if (n) list.push({ id: n.id, name: n.name, type: 'CAMPUS', breadcrumb: breadcrumbMap.get(n.id) || n.name });
    });
    return list;
  }, [scopeState, flatLookup, breadcrumbMap]);

  const filteredSelectedDrawerList = useMemo(() => {
    if (!selectedDrawerSearch.trim()) return selectedItemsList;
    const q = selectedDrawerSearch.toLowerCase();
    return selectedItemsList.filter(
      (item) => item.name.toLowerCase().includes(q) || item.breadcrumb.toLowerCase().includes(q)
    );
  }, [selectedItemsList, selectedDrawerSearch]);

  // ── CONDITIONAL RENDER AFTER ALL HOOKS ──
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col justify-between relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏛️</span>
              <span>Configure Hierarchy Applicability</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mixed multi-level selection with automatic inheritance across large school networks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Entire Organization Quick Toggle */}
        <div
          onClick={() => canApplyUniversal && handleToggleEntireOrg(!scopeState.isEntireOrg)}
          className={`p-3 rounded-2xl border transition-all flex items-center justify-between shrink-0 ${
            canApplyUniversal ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
          } ${
            scopeState.isEntireOrg
              ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={scopeState.isEntireOrg}
              disabled={!canApplyUniversal}
              onChange={(e) => handleToggleEntireOrg(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 disabled:opacity-50 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🌐</span>
                <span>Entire Organization (Universal Scope)</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {canApplyUniversal
                  ? 'Applies to all current branches and automatically inherits to future campuses.'
                  : 'Universal scope requires Head Office / Platform Administrator authority.'}
              </p>
            </div>
          </div>
          {scopeState.isEntireOrg && (
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
              Universal Active
            </span>
          )}
        </div>

        {/* Search Bar & View Filter Toolbar */}
        {!scopeState.isEntireOrg && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search Head Office, Region, School or Campus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Filter Pill (All | Selected) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setViewFilter('ALL')}
                className={`px-2.5 py-1.5 rounded-lg transition-all ${
                  viewFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('SELECTED_ONLY')}
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                  viewFilter === 'SELECTED_ONLY'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>Selected</span>
                {totalSelectedCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-full text-[10px]">
                    {totalSelectedCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Hierarchy Tree Body (Scrollable viewport) */}
        {!scopeState.isEntireOrg ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-white dark:bg-slate-900/60 flex-1 overflow-y-auto space-y-2.5 min-h-[220px] max-h-[360px]">
            {safeHierarchy.filter(matchesSearch).filter(matchesSelectedOnly).length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 space-y-1">
                <span className="text-xl block">🔍</span>
                <span>No matching locations found in this view.</span>
                {viewFilter === 'SELECTED_ONLY' && (
                  <button
                    type="button"
                    onClick={() => setViewFilter('ALL')}
                    className="text-indigo-600 underline block mx-auto text-xs mt-1 cursor-pointer"
                  >
                    Switch to All Locations
                  </button>
                )}
              </div>
            ) : (
              safeHierarchy.filter(matchesSearch).filter(matchesSelectedOnly).map((rootNode) => {
                const rootSelState = getNodeSelectionState(rootNode);
                const campusCount = countCampuses(rootNode);

                return (
                  <div key={rootNode.id} className="space-y-1.5">
                    {/* Level 1: Head Office / Direct School */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 min-w-0">
                        {rootNode.children && rootNode.children.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNodes((p) => ({ ...p, [rootNode.id]: !p[rootNode.id] }))
                            }
                            className="text-xs text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            {expandedNodes[rootNode.id] ? '▼' : '▶'}
                          </button>
                        )}
                        <input
                          type="checkbox"
                          checked={rootSelState === 'FULL'}
                          ref={(el) => {
                            if (el) el.indeterminate = rootSelState === 'PARTIAL';
                          }}
                          onChange={() => handleToggleNode(rootNode)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {rootNode.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {campusCount} {campusCount === 1 ? 'Campus' : 'Campuses'}
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          {rootNode.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Level 2: Regions / Schools */}
                    {expandedNodes[rootNode.id] && rootNode.children && rootNode.children.length > 0 && (
                      <div className="pl-4 sm:pl-6 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                        {rootNode.children.filter(matchesSearch).filter(matchesSelectedOnly).map((childNode) => {
                          const childSelState = getNodeSelectionState(childNode);
                          const childCampusCount = countCampuses(childNode);
                          const coveredByParent = getCoveringAncestor(childNode.id);

                          return (
                            <div key={childNode.id} className="space-y-1">
                              <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <div className="flex items-center gap-2 min-w-0">
                                  {childNode.children && childNode.children.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedNodes((p) => ({ ...p, [childNode.id]: !p[childNode.id] }))
                                      }
                                      className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                      {expandedNodes[childNode.id] ? '▼' : '▶'}
                                    </button>
                                  )}
                                  <input
                                    type="checkbox"
                                    checked={childSelState === 'FULL'}
                                    disabled={!!coveredByParent}
                                    ref={(el) => {
                                      if (el) el.indeterminate = childSelState === 'PARTIAL';
                                    }}
                                    onChange={() => handleToggleNode(childNode)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 disabled:opacity-40 cursor-pointer"
                                  />
                                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                    {childNode.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {coveredByParent ? (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                      Covered by {coveredByParent}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {childCampusCount} {childCampusCount === 1 ? 'Campus' : 'Campuses'}
                                    </span>
                                  )}
                                  <span className="text-[9px] uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                                    {childNode.type}
                                  </span>
                                </div>
                              </div>

                              {/* Level 3: Schools & Campuses */}
                              {expandedNodes[childNode.id] && childNode.children && childNode.children.length > 0 && (
                                <div className="pl-4 sm:pl-5 space-y-1 border-l border-slate-100 dark:border-slate-800 ml-2">
                                  {childNode.children.filter(matchesSearch).filter(matchesSelectedOnly).map((grandChild) => {
                                    const grandChildSelState = getNodeSelectionState(grandChild);
                                    const grandChildCampuses = countCampuses(grandChild);
                                    const coveredBy = getCoveringAncestor(grandChild.id);

                                    return (
                                      <div key={grandChild.id} className="space-y-1">
                                        <div className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs">
                                          <div className="flex items-center gap-2 truncate">
                                            {grandChild.children && grandChild.children.length > 0 && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setExpandedNodes((p) => ({
                                                    ...p,
                                                    [grandChild.id]: !p[grandChild.id],
                                                  }))
                                                }
                                                className="text-[10px] text-slate-400 cursor-pointer"
                                              >
                                                {expandedNodes[grandChild.id] ? '▼' : '▶'}
                                              </button>
                                            )}
                                            <input
                                              type="checkbox"
                                              checked={grandChildSelState === 'FULL'}
                                              disabled={!!coveredBy}
                                              ref={(el) => {
                                                if (el) el.indeterminate = grandChildSelState === 'PARTIAL';
                                              }}
                                              onChange={() => handleToggleNode(grandChild)}
                                              className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5 disabled:opacity-40 cursor-pointer"
                                            />
                                            <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                                              {grandChild.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1.5 shrink-0">
                                            {coveredBy ? (
                                              <span className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                                Covered
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 font-medium">
                                                {grandChildCampuses} {grandChildCampuses === 1 ? 'Campus' : 'Campuses'}
                                              </span>
                                            )}
                                            <span className="text-[9px] uppercase text-slate-400">
                                              {grandChild.type}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Level 4: Individual Campuses */}
                                        {expandedNodes[grandChild.id] &&
                                          grandChild.children &&
                                          grandChild.children.length > 0 && (
                                            <div className="pl-4 sm:pl-5 space-y-1 border-l border-slate-100 dark:border-slate-800 ml-2">
                                              {grandChild.children
                                                .filter(matchesSearch)
                                                .filter(matchesSelectedOnly)
                                                .map((campusNode) => {
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
                                                          className="rounded border-slate-300 text-indigo-600 h-3.5 w-3.5 disabled:opacity-40 cursor-pointer"
                                                        />
                                                        <span className="truncate text-slate-600 dark:text-slate-400">
                                                          {campusNode.name}
                                                        </span>
                                                      </div>
                                                      {coveredCampus && (
                                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 italic shrink-0">
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
                );
              })
            )}
          </div>
        ) : null}

        {/* Adaptive Selected Scope Summary (No Huge Chip Wall for 60+ Campuses) */}
        {!scopeState.isEntireOrg && totalSelectedCount > 0 && (
          <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Selected Targets:</span>
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[11px]">
                  {totalSelectedCount}
                </span>
              </span>
              <div className="flex items-center gap-2">
                {totalSelectedCount > 4 && (
                  <button
                    type="button"
                    onClick={() => setShowSelectedDrawer(true)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    View Selected ({totalSelectedCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] text-slate-400 hover:text-rose-500 font-medium cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* If small count (<= 4), show inline chips. If large count (> 4), show clean collapsed summary */}
            {totalSelectedCount <= 4 ? (
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {scopeState.selectedHeadOfficeIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>🏛️ {flatLookup.get(id)?.name || id}</span>
                    <button onClick={() => handleRemoveChip(id, 'HEAD_OFFICE')} className="text-xs font-bold cursor-pointer">✕</button>
                  </span>
                ))}
                {scopeState.selectedRegionIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>🗺️ {flatLookup.get(id)?.name || id}</span>
                    <button onClick={() => handleRemoveChip(id, 'REGION')} className="text-xs font-bold cursor-pointer">✕</button>
                  </span>
                ))}
                {scopeState.selectedSchoolIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>🏫 {flatLookup.get(id)?.name || id}</span>
                    <button onClick={() => handleRemoveChip(id, 'SCHOOL')} className="text-xs font-bold cursor-pointer">✕</button>
                  </span>
                ))}
                {scopeState.selectedCampusIds.map((id) => (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                  >
                    <span>📍 {flatLookup.get(id)?.name || id}</span>
                    <button onClick={() => handleRemoveChip(id, 'CAMPUS')} className="text-xs font-bold cursor-pointer">✕</button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <span className="truncate mr-2">
                  {getHierarchyScopeSummary(scopeState)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowSelectedDrawer(true)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-semibold text-xs shrink-0 hover:bg-indigo-100"
                >
                  Manage List
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Selected Drawer Modal Layer */}
        {showSelectedDrawer && (
          <div className="absolute inset-0 z-20 bg-white dark:bg-slate-900 rounded-3xl p-5 flex flex-col justify-between animate-in fade-in zoom-in-95 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Selected Locations ({totalSelectedCount})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSelectedDrawer(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <input
                type="text"
                placeholder="Filter selected locations..."
                value={selectedDrawerSearch}
                onChange={(e) => setSelectedDrawerSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {filteredSelectedDrawerList.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No items match your filter.</div>
                ) : (
                  filteredSelectedDrawerList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="truncate mr-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.breadcrumb}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChip(item.id, item.type)}
                        className="text-rose-500 hover:text-rose-700 font-bold p-1 shrink-0 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowSelectedDrawer(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium truncate max-w-xs sm:max-w-sm">
            Summary: <span className="font-bold text-slate-800 dark:text-slate-200">{getHierarchyScopeSummary(scopeState)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!scopeState.isEntireOrg && totalSelectedCount === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer transition-all"
            >
              Apply Scope
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
