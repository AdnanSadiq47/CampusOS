'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export type WorkingContextNodeType = 'HEAD_OFFICE' | 'REGION' | 'SCHOOL' | 'CAMPUS';

export interface WorkingContextItem {
  id: string;
  name: string;
  subtitle?: string;
  type: WorkingContextNodeType;
  code?: string;
  organizationId?: string;
  effectiveCampusIds: string[];
}

// Canonical Campuses
export const CANONICAL_CAMPUS_IDS = {
  MAIN_CAMPUS: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  CLIFTON_CAMPUS: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  DHA_CAMPUS: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  PECHS_CAMPUS: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  CLIFTON_JR_CAMPUS: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  ISLAMABAD_CAMPUS: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
};

export interface CampusMetadata {
  id: string;
  name: string;
  code: string;
  schoolId: string;
  schoolName: string;
  regionId: string;
  regionName: string;
}

export const ALL_CAMPUSES_METADATA: CampusMetadata[] = [
  {
    id: CANONICAL_CAMPUS_IDS.MAIN_CAMPUS,
    name: 'Main Campus (Gulshan)',
    code: 'CMP-01',
    schoolId: 'sch-1',
    schoolName: 'Beacon Horizon Public School',
    regionId: 'reg_south',
    regionName: 'South Region',
  },
  {
    id: CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS,
    name: 'Clifton Campus',
    code: 'CMP-02',
    schoolId: 'sch-1',
    schoolName: 'Beacon Horizon Public School',
    regionId: 'reg_south',
    regionName: 'South Region',
  },
  {
    id: CANONICAL_CAMPUS_IDS.DHA_CAMPUS,
    name: 'DHA Phase 6 Campus',
    code: 'CMP-03',
    schoolId: 'sch-1',
    schoolName: 'Beacon Horizon Public School',
    regionId: 'reg_south',
    regionName: 'South Region',
  },
  {
    id: CANONICAL_CAMPUS_IDS.PECHS_CAMPUS,
    name: 'PECHS Senior Campus',
    code: 'CMP-04',
    schoolId: 'sch-2',
    schoolName: 'City Grammar School',
    regionId: 'reg_south',
    regionName: 'South Region',
  },
  {
    id: CANONICAL_CAMPUS_IDS.CLIFTON_JR_CAMPUS,
    name: 'Clifton Junior Campus',
    code: 'CMP-05',
    schoolId: 'sch-2',
    schoolName: 'City Grammar School',
    regionId: 'reg_south',
    regionName: 'South Region',
  },
  {
    id: CANONICAL_CAMPUS_IDS.ISLAMABAD_CAMPUS,
    name: 'Islamabad Capital Campus',
    code: 'CMP-06',
    schoolId: 'sch-3',
    schoolName: 'St. Jude Model School',
    regionId: 'reg_north',
    regionName: 'North Region',
  },
];

export const DEFAULT_CONTEXT_NODES: WorkingContextItem[] = [
  // Head Offices
  {
    id: 'ho_alpha',
    name: 'Alpha Academy Head Office',
    subtitle: 'Central Governance • Consolidated View',
    type: 'HEAD_OFFICE',
    code: 'HO-01',
    effectiveCampusIds: [
      CANONICAL_CAMPUS_IDS.MAIN_CAMPUS,
      CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS,
      CANONICAL_CAMPUS_IDS.DHA_CAMPUS,
      CANONICAL_CAMPUS_IDS.PECHS_CAMPUS,
      CANONICAL_CAMPUS_IDS.CLIFTON_JR_CAMPUS,
      CANONICAL_CAMPUS_IDS.ISLAMABAD_CAMPUS,
    ],
  },
  {
    id: 'ho_beta',
    name: 'Beta University System',
    subtitle: 'National Higher Ed',
    type: 'HEAD_OFFICE',
    code: 'HO-02',
    effectiveCampusIds: [],
  },

  // Regions
  {
    id: 'reg_south',
    name: 'South Region',
    subtitle: 'Alpha Academy • Karachi & Hyderabad',
    type: 'REGION',
    code: 'REG-S',
    effectiveCampusIds: [
      CANONICAL_CAMPUS_IDS.MAIN_CAMPUS,
      CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS,
      CANONICAL_CAMPUS_IDS.DHA_CAMPUS,
      CANONICAL_CAMPUS_IDS.PECHS_CAMPUS,
      CANONICAL_CAMPUS_IDS.CLIFTON_JR_CAMPUS,
    ],
  },
  {
    id: 'reg_north',
    name: 'North Region',
    subtitle: 'Alpha Academy • Lahore & Islamabad',
    type: 'REGION',
    code: 'REG-N',
    effectiveCampusIds: [CANONICAL_CAMPUS_IDS.ISLAMABAD_CAMPUS],
  },

  // Schools
  {
    id: 'sch_beacon',
    name: 'Beacon Horizon Public School',
    subtitle: 'South Region • Cambridge & Matric (3 Campuses)',
    type: 'SCHOOL',
    code: 'SCH-01',
    effectiveCampusIds: [
      CANONICAL_CAMPUS_IDS.MAIN_CAMPUS,
      CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS,
      CANONICAL_CAMPUS_IDS.DHA_CAMPUS,
    ],
  },
  {
    id: 'sch_stjude',
    name: 'St. Jude Model School',
    subtitle: 'North Region • Oxford Syllabus (1 Campus)',
    type: 'SCHOOL',
    code: 'SCH-02',
    effectiveCampusIds: [CANONICAL_CAMPUS_IDS.ISLAMABAD_CAMPUS],
  },
  {
    id: 'sch_grammar',
    name: 'City Grammar School',
    subtitle: 'South Region • Matric Syllabus (2 Campuses)',
    type: 'SCHOOL',
    code: 'SCH-03',
    effectiveCampusIds: [
      CANONICAL_CAMPUS_IDS.PECHS_CAMPUS,
      CANONICAL_CAMPUS_IDS.CLIFTON_JR_CAMPUS,
    ],
  },

  // Campuses
  {
    id: 'cmp_clifton',
    name: 'Clifton Campus',
    subtitle: 'Beacon Horizon Public School • Karachi',
    type: 'CAMPUS',
    code: 'CMP-01',
    effectiveCampusIds: [CANONICAL_CAMPUS_IDS.CLIFTON_CAMPUS],
  },
  {
    id: 'cmp_main',
    name: 'Main Campus (Gulshan)',
    subtitle: 'Beacon Horizon Public School • Karachi',
    type: 'CAMPUS',
    code: 'CMP-02',
    effectiveCampusIds: [CANONICAL_CAMPUS_IDS.MAIN_CAMPUS],
  },
  {
    id: 'cmp_dha',
    name: 'DHA Phase 6 Campus',
    subtitle: 'Beacon Horizon Public School • Karachi',
    type: 'CAMPUS',
    code: 'CMP-03',
    effectiveCampusIds: [CANONICAL_CAMPUS_IDS.DHA_CAMPUS],
  },
  {
    id: 'cmp_pechs',
    name: 'PECHS Senior Campus',
    subtitle: 'City Grammar School • Karachi',
    type: 'CAMPUS',
    code: 'CMP-04',
    effectiveCampusIds: [CANONICAL_CAMPUS_IDS.PECHS_CAMPUS],
  },
  {
    id: 'cmp_clifton_jr',
    name: 'Clifton Junior Campus',
    subtitle: 'City Grammar School • Karachi',
    type: 'CAMPUS',
    code: 'CMP-05',
    effectiveCampusIds: [CANONICAL_CAMPUS_IDS.CLIFTON_JR_CAMPUS],
  },
  {
    id: 'cmp_isb',
    name: 'Islamabad Capital Campus',
    subtitle: 'St. Jude Model School • Islamabad',
    type: 'CAMPUS',
    code: 'CMP-06',
    effectiveCampusIds: [CANONICAL_CAMPUS_IDS.ISLAMABAD_CAMPUS],
  },
];

interface WorkingContextState {
  currentContext: WorkingContextItem;
  availableNodes: WorkingContextItem[];
  switchContext: (nodeId: string) => void;
  isCampusInEffectiveScope: (campusId: string) => boolean;
  getAuthorizedCampusesForWrite: () => CampusMetadata[];
  /**
   * Returns true if a HIERARCHY_SCOPED config record is effective in the current
   * working context. Used by all Admin Config pages to enforce Working Context scoping.
   *
   * Rules:
   *   ALL_CAMPUSES → always true (Universal)
   *   SELECTED_CAMPUSES + any branchId in effectiveCampusIds → true (Direct)
   *   Otherwise → false (Not Applicable — hide in Current Context view)
   */
  isConfigEffectiveForContext: (applyTo: string, branchIds: string[]) => boolean;
  /**
   * Returns a human-readable label for a config record's effective status in this context.
   */
  getConfigSourceLabel: (applyTo: string, branchIds: string[]) => 'Universal' | 'Direct' | 'Not Applicable';
  isLoaded: boolean;
}

const WorkingContextContext = createContext<WorkingContextState | undefined>(undefined);

const STORAGE_KEY = 'campus_os_working_context_node_id';

export function WorkingContextProvider({ children }: { children: React.ReactNode }) {
  const [selectedId, setSelectedId] = useState<string>('cmp_clifton');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && DEFAULT_CONTEXT_NODES.some((n) => n.id === stored)) {
        setSelectedId(stored);
      }
    } catch {
      // ignore SSR/localStorage errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const currentContext = useMemo(() => {
    return DEFAULT_CONTEXT_NODES.find((c) => c.id === selectedId) || DEFAULT_CONTEXT_NODES[7]!; // cmp_clifton
  }, [selectedId]);

  const switchContext = useCallback((nodeId: string) => {
    const target = DEFAULT_CONTEXT_NODES.find((c) => c.id === nodeId);
    if (!target) return;

    setSelectedId(nodeId);
    try {
      localStorage.setItem(STORAGE_KEY, nodeId);
      window.dispatchEvent(
        new CustomEvent('campus-os-working-context-changed', {
          detail: { nodeId, nodeType: target.type, name: target.name },
        })
      );
    } catch {
      // ignore storage error
    }
  }, []);

  const isCampusInEffectiveScope = useCallback(
    (campusId: string): boolean => {
      // Handle UUID or alias
      const resolved =
        Object.entries(CANONICAL_CAMPUS_IDS).find(([k, v]) => k === campusId || v === campusId)?.[1] ||
        campusId;

      return currentContext.effectiveCampusIds.includes(resolved);
    },
    [currentContext]
  );

  const getAuthorizedCampusesForWrite = useCallback((): CampusMetadata[] => {
    return ALL_CAMPUSES_METADATA.filter((c) => currentContext.effectiveCampusIds.includes(c.id));
  }, [currentContext]);

  /**
   * Returns true if a config record (by its applyTo + branchIds) is effective in
   * the current working context. Used by all HIERARCHY_SCOPED Admin Config pages.
   */
  const isConfigEffectiveForContext = useCallback(
    (applyTo: string, branchIds: string[]): boolean => {
      if (applyTo === 'ALL_CAMPUSES') return true;
      if (applyTo === 'SELECTED_CAMPUSES') {
        return branchIds.some((bid) => currentContext.effectiveCampusIds.includes(bid));
      }
      return true; // TENANT_WIDE or unknown — default visible
    },
    [currentContext]
  );

  /**
   * Returns a display label for a config record's effective status in this context.
   */
  const getConfigSourceLabel = useCallback(
    (applyTo: string, branchIds: string[]): 'Universal' | 'Direct' | 'Not Applicable' => {
      if (applyTo === 'ALL_CAMPUSES') return 'Universal';
      if (applyTo === 'SELECTED_CAMPUSES') {
        return branchIds.some((bid) => currentContext.effectiveCampusIds.includes(bid))
          ? 'Direct'
          : 'Not Applicable';
      }
      return 'Universal';
    },
    [currentContext]
  );

  const value = useMemo<WorkingContextState>(() => {
    return {
      currentContext,
      availableNodes: DEFAULT_CONTEXT_NODES,
      switchContext,
      isCampusInEffectiveScope,
      getAuthorizedCampusesForWrite,
      isConfigEffectiveForContext,
      getConfigSourceLabel,
      isLoaded,
    };
  }, [currentContext, switchContext, isCampusInEffectiveScope, getAuthorizedCampusesForWrite, isConfigEffectiveForContext, getConfigSourceLabel, isLoaded]);

  return <WorkingContextContext.Provider value={value}>{children}</WorkingContextContext.Provider>;
}

export function useWorkingContext(): WorkingContextState {
  const ctx = useContext(WorkingContextContext);
  if (!ctx) {
    // Graceful fallback for non-wrapped or SSR rendering
    const fallback = DEFAULT_CONTEXT_NODES[7]!; // cmp_clifton
    return {
      currentContext: fallback,
      availableNodes: DEFAULT_CONTEXT_NODES,
      switchContext: () => {},
      isCampusInEffectiveScope: (cid) => fallback.effectiveCampusIds.includes(cid),
      getAuthorizedCampusesForWrite: () =>
        ALL_CAMPUSES_METADATA.filter((c) => fallback.effectiveCampusIds.includes(c.id)),
      isConfigEffectiveForContext: (applyTo, branchIds) => {
        if (applyTo === 'ALL_CAMPUSES') return true;
        return branchIds.some((bid) => fallback.effectiveCampusIds.includes(bid));
      },
      getConfigSourceLabel: (applyTo, branchIds): 'Universal' | 'Direct' | 'Not Applicable' => {
        if (applyTo === 'ALL_CAMPUSES') return 'Universal';
        return branchIds.some((bid) => fallback.effectiveCampusIds.includes(bid)) ? 'Direct' : 'Not Applicable';
      },
      isLoaded: true,
    };
  }
  return ctx;
}
