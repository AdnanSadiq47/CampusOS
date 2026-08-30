import { Injectable, ForbiddenException } from '@nestjs/common';
import {
  WorkingContextNodeType,
  WorkingContextDto,
  EffectiveScopeDto,
} from '@campus-os/types';

export interface HierarchyTreeNode {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  type: WorkingContextNodeType;
  organizationId: string;
  parentId?: string | null;
  childIds: string[];
}

export interface UserScopeContext {
  organizationId: string;
  userRole?: string;
  authorizedHeadOfficeIds?: string[];
  authorizedRegionIds?: string[];
  authorizedSchoolIds?: string[];
  authorizedCampusIds?: string[];
  isSuperAdmin?: boolean;
  workingContext?: WorkingContextDto;
}

export const CANONICAL_ORG_ID_A = '11111111-1111-1111-1111-111111111111';
export const CANONICAL_ORG_ID_B = '22222222-2222-2222-2222-222222222222';

// Canonical Campuses
export const CAMPUS_IDS = {
  MAIN_CAMPUS: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  CLIFTON_CAMPUS: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  DHA_CAMPUS: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  PECHS_CAMPUS: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  CLIFTON_JR_CAMPUS: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  ISLAMABAD_CAMPUS: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  INDEPENDENT_CAMPUS: '11112222-3333-4444-5555-666677778888',
  BETA_MAIN_CAMPUS: '88888888-8888-8888-8888-888888888888',
};

// Aliases for context picker string IDs
export const CONTEXT_ALIASES: Record<string, string> = {
  cmp_clifton: CAMPUS_IDS.CLIFTON_CAMPUS,
  cmp_main: CAMPUS_IDS.MAIN_CAMPUS,
  cmp_dha: CAMPUS_IDS.DHA_CAMPUS,
  cmp_pechs: CAMPUS_IDS.PECHS_CAMPUS,
  cmp_clifton_jr: CAMPUS_IDS.CLIFTON_JR_CAMPUS,
  cmp_isb: CAMPUS_IDS.ISLAMABAD_CAMPUS,
  cmp_beta_main: CAMPUS_IDS.BETA_MAIN_CAMPUS,
  'cmp-beta-main': CAMPUS_IDS.BETA_MAIN_CAMPUS,
  sch_beacon: 'sch-1',
  sch_grammar: 'sch-2',
  sch_stjude: 'sch-3',
  reg_south: 'reg-south',
  reg_north: 'reg-north',
  ho_alpha: 'ho-alpha',
  ho_beta: 'ho-beta',
};

// Reverse alias for UI display
export const CONTEXT_REVERSE_ALIASES: Record<string, string> = {
  [CAMPUS_IDS.CLIFTON_CAMPUS]: 'cmp_clifton',
  [CAMPUS_IDS.MAIN_CAMPUS]: 'cmp_main',
  [CAMPUS_IDS.DHA_CAMPUS]: 'cmp_dha',
  [CAMPUS_IDS.PECHS_CAMPUS]: 'cmp_pechs',
  [CAMPUS_IDS.CLIFTON_JR_CAMPUS]: 'cmp_clifton_jr',
  [CAMPUS_IDS.ISLAMABAD_CAMPUS]: 'cmp_isb',
  'sch-1': 'sch_beacon',
  'sch-2': 'sch_grammar',
  'sch-3': 'sch_stjude',
  'reg-south': 'reg_south',
  'reg-north': 'reg_north',
  'ho-alpha': 'ho_alpha',
  'ho-beta': 'ho_beta',
};

@Injectable()
export class WorkingContextService {
  private hierarchyNodes: Map<string, HierarchyTreeNode> = new Map();

  constructor() {
    this.seedHierarchy();
  }

  private seedHierarchy() {
    const nodes: HierarchyTreeNode[] = [
      // ── TENANT A: ALPHA ACADEMY ──────────────────────────────────────────
      {
        id: 'ho-alpha',
        code: 'HO-01',
        name: 'Alpha Academy Head Office',
        subtitle: 'Central Governance',
        type: 'HEAD_OFFICE',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: null,
        childIds: ['reg-south', 'reg-north', 'sch-independent'],
      },
      // Regions
      {
        id: 'reg-south',
        code: 'REG-S',
        name: 'South Region',
        subtitle: 'Alpha Academy • Karachi & Hyderabad',
        type: 'REGION',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'ho-alpha',
        childIds: ['sch-1', 'sch-2'],
      },
      {
        id: 'reg-north',
        code: 'REG-N',
        name: 'North Region',
        subtitle: 'Alpha Academy • Lahore & Islamabad',
        type: 'REGION',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'ho-alpha',
        childIds: ['sch-3'],
      },
      // Schools
      {
        id: 'sch-1',
        code: 'SCH-01',
        name: 'Beacon Horizon Public School',
        subtitle: 'South Region • Cambridge & Matric',
        type: 'SCHOOL',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'reg-south',
        childIds: [CAMPUS_IDS.MAIN_CAMPUS, CAMPUS_IDS.CLIFTON_CAMPUS, CAMPUS_IDS.DHA_CAMPUS],
      },
      {
        id: 'sch-2',
        code: 'SCH-02',
        name: 'City Grammar School',
        subtitle: 'South Region • Matric Syllabus',
        type: 'SCHOOL',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'reg-south',
        childIds: [CAMPUS_IDS.PECHS_CAMPUS, CAMPUS_IDS.CLIFTON_JR_CAMPUS],
      },
      {
        id: 'sch-3',
        code: 'SCH-03',
        name: 'St. Jude Model School',
        subtitle: 'North Region • Oxford Syllabus',
        type: 'SCHOOL',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'reg-north',
        childIds: [CAMPUS_IDS.ISLAMABAD_CAMPUS],
      },
      // Direct School -> Campus (No Region Hierarchy test case)
      {
        id: 'sch-independent',
        code: 'SCH-IND',
        name: 'Independent Model School',
        subtitle: 'Direct School • No Region Layer',
        type: 'SCHOOL',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'ho-alpha',
        childIds: [CAMPUS_IDS.INDEPENDENT_CAMPUS],
      },
      // Campuses
      {
        id: CAMPUS_IDS.MAIN_CAMPUS,
        code: 'CMP-01',
        name: 'Main Campus (Gulshan)',
        subtitle: 'Beacon Horizon Public School • Karachi',
        type: 'CAMPUS',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'sch-1',
        childIds: [],
      },
      {
        id: CAMPUS_IDS.CLIFTON_CAMPUS,
        code: 'CMP-02',
        name: 'Clifton Campus',
        subtitle: 'Beacon Horizon Public School • Karachi',
        type: 'CAMPUS',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'sch-1',
        childIds: [],
      },
      {
        id: CAMPUS_IDS.DHA_CAMPUS,
        code: 'CMP-03',
        name: 'DHA Phase 6 Campus',
        subtitle: 'Beacon Horizon Public School • Karachi',
        type: 'CAMPUS',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'sch-1',
        childIds: [],
      },
      {
        id: CAMPUS_IDS.PECHS_CAMPUS,
        code: 'CMP-04',
        name: 'PECHS Senior Campus',
        subtitle: 'City Grammar School • Karachi',
        type: 'CAMPUS',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'sch-2',
        childIds: [],
      },
      {
        id: CAMPUS_IDS.CLIFTON_JR_CAMPUS,
        code: 'CMP-05',
        name: 'Clifton Junior Campus',
        subtitle: 'City Grammar School • Karachi',
        type: 'CAMPUS',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'sch-2',
        childIds: [],
      },
      {
        id: CAMPUS_IDS.ISLAMABAD_CAMPUS,
        code: 'CMP-06',
        name: 'Islamabad Capital Campus',
        subtitle: 'St. Jude Model School • Islamabad',
        type: 'CAMPUS',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'sch-3',
        childIds: [],
      },
      {
        id: CAMPUS_IDS.INDEPENDENT_CAMPUS,
        code: 'CMP-IND-1',
        name: 'Independent Main Campus',
        subtitle: 'Independent Model School',
        type: 'CAMPUS',
        organizationId: CANONICAL_ORG_ID_A,
        parentId: 'sch-independent',
        childIds: [],
      },

      // ── TENANT B: BETA UNIVERSITY SYSTEM (Tenant Isolation) ───────────────
      {
        id: 'ho-beta',
        code: 'HO-02',
        name: 'Beta University System',
        subtitle: 'National Higher Ed',
        type: 'HEAD_OFFICE',
        organizationId: CANONICAL_ORG_ID_B,
        parentId: null,
        childIds: ['sch-beta-1'],
      },
      {
        id: 'sch-beta-1',
        code: 'SCH-B1',
        name: 'Beta College of Technology',
        subtitle: 'Higher Ed Department',
        type: 'SCHOOL',
        organizationId: CANONICAL_ORG_ID_B,
        parentId: 'ho-beta',
        childIds: [CAMPUS_IDS.BETA_MAIN_CAMPUS],
      },
      {
        id: CAMPUS_IDS.BETA_MAIN_CAMPUS,
        code: 'CMP-B01',
        name: 'Beta Tech Main Campus',
        subtitle: 'Lahore Tech Park',
        type: 'CAMPUS',
        organizationId: CANONICAL_ORG_ID_B,
        parentId: 'sch-beta-1',
        childIds: [],
      },
    ];

    for (const node of nodes) {
      this.hierarchyNodes.set(node.id, node);
    }
  }

  /**
   * Dynamically register or update a hierarchy node (for scale testing & dynamic tree extensions)
   */
  public registerNode(node: HierarchyTreeNode): void {
    this.hierarchyNodes.set(node.id, node);
    if (node.parentId) {
      const parent = this.hierarchyNodes.get(node.parentId);
      if (parent && !parent.childIds.includes(node.id)) {
        parent.childIds.push(node.id);
      }
    }
  }

  /**
   * Resolves a raw node identifier (handling ID or aliases)
   */
  public findNode(nodeIdOrAlias: string): HierarchyTreeNode | undefined {
    const resolvedId = CONTEXT_ALIASES[nodeIdOrAlias] || nodeIdOrAlias;
    return this.hierarchyNodes.get(resolvedId);
  }

  /**
   * Recursively get all descendant campus IDs for a given node
   */
  public getDescendantCampusIds(nodeIdOrAlias: string): string[] {
    const node = this.findNode(nodeIdOrAlias);
    if (!node) return [];

    if (node.type === 'CAMPUS') {
      return [node.id];
    }

    const result: string[] = [];
    const stack = [...node.childIds];

    while (stack.length > 0) {
      const childId = stack.pop()!;
      const child = this.hierarchyNodes.get(childId);
      if (child) {
        if (child.type === 'CAMPUS') {
          result.push(child.id);
        } else {
          stack.push(...child.childIds);
        }
      }
    }

    return Array.from(new Set(result));
  }

  /**
   * Recursively get all descendant school IDs for a given node
   */
  public getDescendantSchoolIds(nodeIdOrAlias: string): string[] {
    const node = this.findNode(nodeIdOrAlias);
    if (!node) return [];

    if (node.type === 'SCHOOL') {
      return [node.id];
    }
    if (node.type === 'CAMPUS') {
      return node.parentId ? [node.parentId] : [];
    }

    const result: string[] = [];
    const stack = [...node.childIds];

    while (stack.length > 0) {
      const childId = stack.pop()!;
      const child = this.hierarchyNodes.get(childId);
      if (child) {
        if (child.type === 'SCHOOL') {
          result.push(child.id);
        } else if (child.type === 'REGION') {
          stack.push(...child.childIds);
        }
      }
    }

    return Array.from(new Set(result));
  }

  /**
   * Get all authorized campus IDs for a given user context
   */
  public getUserAuthorizedCampusIds(userScope: UserScopeContext): string[] {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;

    // SuperAdmin or Head Office Admin has access to all campuses in their tenant
    if (userScope.isSuperAdmin || (userScope.authorizedHeadOfficeIds && userScope.authorizedHeadOfficeIds.length > 0)) {
      const allCampusesInOrg: string[] = [];
      for (const node of this.hierarchyNodes.values()) {
        if (node.organizationId === orgId && node.type === 'CAMPUS') {
          allCampusesInOrg.push(node.id);
        }
      }
      return allCampusesInOrg;
    }

    const authorizedCampuses = new Set<string>();

    // 1. Direct authorized campuses
    if (userScope.authorizedCampusIds && userScope.authorizedCampusIds.length > 0) {
      for (const cid of userScope.authorizedCampusIds) {
        const resolved = CONTEXT_ALIASES[cid] || cid;
        authorizedCampuses.add(resolved);
      }
    }

    // 2. Direct authorized schools -> add all child campuses
    if (userScope.authorizedSchoolIds && userScope.authorizedSchoolIds.length > 0) {
      for (const sid of userScope.authorizedSchoolIds) {
        const childCampuses = this.getDescendantCampusIds(sid);
        for (const cid of childCampuses) authorizedCampuses.add(cid);
      }
    }

    // 3. Direct authorized regions -> add all descendant campuses
    if (userScope.authorizedRegionIds && userScope.authorizedRegionIds.length > 0) {
      for (const rid of userScope.authorizedRegionIds) {
        const childCampuses = this.getDescendantCampusIds(rid);
        for (const cid of childCampuses) authorizedCampuses.add(cid);
      }
    }

    // If no explicit scopes are set, default to all in tenant for standard admin roles
    if (authorizedCampuses.size === 0) {
      for (const node of this.hierarchyNodes.values()) {
        if (node.organizationId === orgId && node.type === 'CAMPUS') {
          authorizedCampuses.add(node.id);
        }
      }
    }

    return Array.from(authorizedCampuses);
  }

  /**
   * Resolve Effective Data Scope:
   * effectiveRequestScope = authorizedScope ∩ workingContextScope
   */
  public resolveEffectiveScope(
    userScope: UserScopeContext,
    requestedNodeId?: string,
    requestedNodeType?: WorkingContextNodeType
  ): EffectiveScopeDto {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    const userAuthorizedCampuses = this.getUserAuthorizedCampusIds(userScope);

    // If no specific context is requested, find appropriate default
    let activeNodeId = requestedNodeId;
    if (!activeNodeId || activeNodeId === 'DEFAULT' || activeNodeId === 'ALL') {
      if (userScope.workingContext?.nodeId) {
        activeNodeId = userScope.workingContext.nodeId;
      } else if (userAuthorizedCampuses.length === 1 && userAuthorizedCampuses[0]) {
        // Single campus user defaults to that campus
        activeNodeId = userAuthorizedCampuses[0];
      } else {
        // Default to Head Office if available, or first authorized school/campus
        activeNodeId = 'ho-alpha';
      }
    }

    const safeNodeId = activeNodeId || 'ho-alpha';
    const resolvedId = CONTEXT_ALIASES[safeNodeId] || safeNodeId;
    let node = this.hierarchyNodes.get(resolvedId);

    // If node is not found, fallback to safe authorized default
    if (!node) {
      if (userAuthorizedCampuses.length > 0 && userAuthorizedCampuses[0]) {
        node = this.hierarchyNodes.get(userAuthorizedCampuses[0]);
      }
      if (!node) {
        node = this.hierarchyNodes.get('ho-alpha')!;
      }
    }

    // TENANT ISOLATION CHECK
    if (node.organizationId !== orgId && !userScope.isSuperAdmin) {
      throw new ForbiddenException(
        `Tenant Isolation Violation: Requested node '${node.id}' belongs to organization '${node.organizationId}', but active session is in '${orgId}'.`
      );
    }

    // Compute working context scope
    const contextDescendantCampuses = this.getDescendantCampusIds(node.id);

    // PERMISSION INTERSECTION
    // effectiveRequestScope = userAuthorizedCampuses ∩ contextDescendantCampuses
    const effectiveCampuses = contextDescendantCampuses.filter((cid) =>
      userAuthorizedCampuses.includes(cid)
    );

    // If intersection is empty, user is attempting to access an unauthorized branch
    if (effectiveCampuses.length === 0 && contextDescendantCampuses.length > 0) {
      throw new ForbiddenException(
        `Working Context Authorization Violation: User is not authorized to access scope of node '${node.name}' (${node.id}).`
      );
    }

    // Total campuses in tenant
    const totalOrgCampuses = Array.from(this.hierarchyNodes.values()).filter(
      (n) => n.organizationId === orgId && n.type === 'CAMPUS'
    ).length;

    const effectiveSchools = this.getDescendantSchoolIds(node.id);
    const effectiveRegions = node.type === 'REGION' ? [node.id] : (node.type === 'HEAD_OFFICE' ? ['reg-south', 'reg-north'] : []);
    const effectiveHeadOffices = node.type === 'HEAD_OFFICE' ? [node.id] : [];

    return {
      organizationId: orgId,
      selectedNodeId: node.id,
      selectedNodeType: requestedNodeType || node.type,
      nodeType: requestedNodeType || node.type,
      selectedNodeName: node.name,
      isAllCampuses: effectiveCampuses.length >= totalOrgCampuses,
      effectiveCampusIds: effectiveCampuses,
      effectiveSchoolIds: effectiveSchools,
      effectiveRegionIds: effectiveRegions,
      effectiveHeadOfficeIds: effectiveHeadOffices,
    };
  }

  /**
   * List all available authorized context options for a user (for the Context Picker)
   */
  public listAuthorizedContexts(userScope: UserScopeContext): {
    recent: WorkingContextDto[];
    headOffices: WorkingContextDto[];
    regions: WorkingContextDto[];
    schools: WorkingContextDto[];
    campuses: WorkingContextDto[];
  } {
    const orgId = userScope.organizationId || CANONICAL_ORG_ID_A;
    const userAuthorizedCampuses = this.getUserAuthorizedCampusIds(userScope);

    const headOffices: WorkingContextDto[] = [];
    const regions: WorkingContextDto[] = [];
    const schools: WorkingContextDto[] = [];
    const campuses: WorkingContextDto[] = [];

    for (const node of this.hierarchyNodes.values()) {
      if (node.organizationId !== orgId) continue;

      const descendantCampuses = this.getDescendantCampusIds(node.id);
      const isAuthorized = descendantCampuses.some((cid) => userAuthorizedCampuses.includes(cid));
      if (!isAuthorized) continue;

      const uiId = CONTEXT_REVERSE_ALIASES[node.id] || node.id;
      const effectiveCampuses = descendantCampuses.filter((cid) => userAuthorizedCampuses.includes(cid));

      const dto: WorkingContextDto = {
        nodeId: uiId,
        nodeType: node.type,
        nodeName: node.name,
        nodeCode: node.code,
        subtitle: node.subtitle,
        organizationId: orgId,
        effectiveCampusIds: effectiveCampuses,
      };

      switch (node.type) {
        case 'HEAD_OFFICE':
          // Only show Head Office if user has broader access than just 1 campus
          if (effectiveCampuses.length > 1 || userScope.isSuperAdmin) {
            headOffices.push(dto);
          }
          break;
        case 'REGION':
          if (effectiveCampuses.length > 1 || userScope.isSuperAdmin) {
            regions.push(dto);
          }
          break;
        case 'SCHOOL':
          schools.push(dto);
          break;
        case 'CAMPUS':
          campuses.push(dto);
          break;
      }
    }

    return {
      recent: campuses.slice(0, 2),
      headOffices,
      regions,
      schools,
      campuses,
    };
  }
}
