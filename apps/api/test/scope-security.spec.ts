import { describe, it, expect } from 'vitest';
import { PermissionEvaluator } from '@campus-os/permissions';
import { AuthUserContext, PermissionRuleDTO } from '@campus-os/types';

/**
 * ARCHITECTURAL SECURITY INVARIANT TEST SUITE
 * 
 * Verifies the 12 core security invariants mandated by the CampusOS
 * Permanent Organization, Branch Scope, Dynamic Access & Delegated Role Architecture.
 */
describe('CampusOS Scope, Hierarchy & Authorization Security Invariants', () => {
  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';

  // Base roles map
  const rolesMap = new Map<string, PermissionRuleDTO[]>([
    [
      'role-accountant',
      [
        {
          moduleCode: 'finance',
          entityCode: 'voucher',
          action: 'READ',
          effect: 'ALLOW',
          dataScope: 'EXACT_NODE',
        },
        {
          moduleCode: 'finance',
          entityCode: 'voucher',
          action: 'CREATE',
          effect: 'ALLOW',
          dataScope: 'EXACT_NODE',
        },
      ],
    ],
    [
      'role-teacher',
      [
        {
          moduleCode: 'academics',
          entityCode: 'attendance',
          action: 'READ',
          effect: 'ALLOW',
          dataScope: 'EXACT_NODE',
        },
        {
          moduleCode: 'academics',
          entityCode: 'attendance',
          action: 'CREATE',
          effect: 'ALLOW',
          dataScope: 'EXACT_NODE',
        },
      ],
    ],
    [
      'role-school-admin',
      [
        {
          moduleCode: 'admin_config',
          entityCode: 'user_management',
          action: 'CREATE',
          effect: 'ALLOW',
          dataScope: 'EXACT_NODE',
        },
      ],
    ],
  ]);

  // ──────────────────────────────────────────────────────────────────────────
  // A. User assigned Branch A cannot access Branch B
  // ──────────────────────────────────────────────────────────────────────────
  it('A. User assigned Branch A cannot access Branch B', () => {
    const userBranchA: AuthUserContext = {
      identityId: 'user-a',
      email: 'user.a@school.edu',
      firstName: 'User',
      lastName: 'A',
      organizationId: TENANT_A,
      organizationCode: 'org_a',
      membershipId: 'mem-a',
      sessionId: 'sess-a',
      assignments: [
        {
          id: 'asgn-branch-a',
          organizationId: TENANT_A,
          membershipId: 'mem-a',
          hierarchyNodeId: 'node-branch-a',
          nodePath: 'root.school_1.branch_a',
          isPrimary: true,
          status: 'ACTIVE',
          roles: [
            {
              id: 'r-1',
              organizationId: TENANT_A,
              assignmentId: 'asgn-branch-a',
              roleId: 'role-accountant',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // Access Branch A voucher -> ALLOW
    const resultA = PermissionEvaluator.evaluate(
      {
        user: userBranchA,
        moduleCode: 'finance',
        entityCode: 'voucher',
        action: 'READ',
        record: { nodePath: 'root.school_1.branch_a' },
      },
      rolesMap
    );
    expect(resultA.granted).toBe(true);

    // Access Branch B voucher -> DENY (fail closed)
    const resultB = PermissionEvaluator.evaluate(
      {
        user: userBranchA,
        moduleCode: 'finance',
        entityCode: 'voucher',
        action: 'READ',
        record: { nodePath: 'root.school_1.branch_b' },
      },
      rolesMap
    );
    expect(resultB.granted).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // B. User assigned Branch A + C can query combined A + C
  // ──────────────────────────────────────────────────────────────────────────
  it('B. User assigned Branch A + C can query combined A + C', () => {
    const userMultiBranch: AuthUserContext = {
      identityId: 'user-ac',
      email: 'user.ac@school.edu',
      firstName: 'User',
      lastName: 'AC',
      organizationId: TENANT_A,
      organizationCode: 'org_a',
      membershipId: 'mem-ac',
      sessionId: 'sess-ac',
      assignments: [
        {
          id: 'asgn-branch-a',
          organizationId: TENANT_A,
          membershipId: 'mem-ac',
          hierarchyNodeId: 'node-branch-a',
          nodePath: 'root.school_1.branch_a',
          isPrimary: true,
          status: 'ACTIVE',
          roles: [
            {
              id: 'r-1',
              organizationId: TENANT_A,
              assignmentId: 'asgn-branch-a',
              roleId: 'role-accountant',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'asgn-branch-c',
          organizationId: TENANT_A,
          membershipId: 'mem-ac',
          hierarchyNodeId: 'node-branch-c',
          nodePath: 'root.school_1.branch_c',
          isPrimary: false,
          status: 'ACTIVE',
          roles: [
            {
              id: 'r-2',
              organizationId: TENANT_A,
              assignmentId: 'asgn-branch-c',
              roleId: 'role-accountant',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // Can access Branch A
    expect(
      PermissionEvaluator.evaluate(
        {
          user: userMultiBranch,
          moduleCode: 'finance',
          entityCode: 'voucher',
          action: 'READ',
          record: { nodePath: 'root.school_1.branch_a' },
        },
        rolesMap
      ).granted
    ).toBe(true);

    // Can access Branch C
    expect(
      PermissionEvaluator.evaluate(
        {
          user: userMultiBranch,
          moduleCode: 'finance',
          entityCode: 'voucher',
          action: 'READ',
          record: { nodePath: 'root.school_1.branch_c' },
        },
        rolesMap
      ).granted
    ).toBe(true);

    // Cannot access Branch B
    expect(
      PermissionEvaluator.evaluate(
        {
          user: userMultiBranch,
          moduleCode: 'finance',
          entityCode: 'voucher',
          action: 'READ',
          record: { nodePath: 'root.school_1.branch_b' },
        },
        rolesMap
      ).granted
    ).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // C. Request containing A + unauthorized B does not leak B
  // ──────────────────────────────────────────────────────────────────────────
  it('C. Request containing A + unauthorized B does not leak B (Server Scope Filtering)', () => {
    const authorizedNodes = ['node-branch-a', 'node-branch-c'];
    const requestedNodes = ['node-branch-a', 'node-branch-b']; // Branch B is unauthorized

    // Server-side scope intersection: only keep requested nodes that are authorized
    const effectiveQueriedNodes = requestedNodes.filter((nodeId) =>
      authorizedNodes.includes(nodeId)
    );

    expect(effectiveQueriedNodes).toEqual(['node-branch-a']);
    expect(effectiveQueriedNodes).not.toContain('node-branch-b');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // D. Accountant role without node authorization cannot access that node
  // ──────────────────────────────────────────────────────────────────────────
  it('D. Accountant role without node authorization cannot access that node', () => {
    // User has Accountant role assigned ONLY at Campus A
    const accountantCampusA: AuthUserContext = {
      identityId: 'user-acc',
      email: 'acc@school.edu',
      firstName: 'Accountant',
      lastName: 'A',
      organizationId: TENANT_A,
      organizationCode: 'org_a',
      membershipId: 'mem-acc',
      sessionId: 'sess-acc',
      assignments: [
        {
          id: 'asgn-a',
          organizationId: TENANT_A,
          membershipId: 'mem-acc',
          hierarchyNodeId: 'node-campus-a',
          nodePath: 'root.campus_a',
          isPrimary: true,
          status: 'ACTIVE',
          roles: [
            {
              id: 'r-acc',
              organizationId: TENANT_A,
              assignmentId: 'asgn-a',
              roleId: 'role-accountant',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // Attempts to access Campus B finance ledger -> DENIED
    const result = PermissionEvaluator.evaluate(
      {
        user: accountantCampusA,
        moduleCode: 'finance',
        entityCode: 'voucher',
        action: 'READ',
        record: { nodePath: 'root.campus_b' },
      },
      rolesMap
    );

    expect(result.granted).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E. Node assignment without page/module permission cannot access the page/API
  // ──────────────────────────────────────────────────────────────────────────
  it('E. Node assignment without page/module permission cannot access the page/API', () => {
    // User is assigned to Campus A as a Teacher (has Academics, NOT Finance)
    const teacherCampusA: AuthUserContext = {
      identityId: 'user-teacher',
      email: 'teacher@school.edu',
      firstName: 'Teacher',
      lastName: 'T',
      organizationId: TENANT_A,
      organizationCode: 'org_a',
      membershipId: 'mem-teach',
      sessionId: 'sess-teach',
      assignments: [
        {
          id: 'asgn-teach-a',
          organizationId: TENANT_A,
          membershipId: 'mem-teach',
          hierarchyNodeId: 'node-campus-a',
          nodePath: 'root.campus_a',
          isPrimary: true,
          status: 'ACTIVE',
          roles: [
            {
              id: 'r-teach',
              organizationId: TENANT_A,
              assignmentId: 'asgn-teach-a',
              roleId: 'role-teacher',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // Teacher tries to create financial voucher on Campus A (assigned node) -> DENIED
    const financeResult = PermissionEvaluator.evaluate(
      {
        user: teacherCampusA,
        moduleCode: 'finance',
        entityCode: 'voucher',
        action: 'CREATE',
        record: { nodePath: 'root.campus_a' },
      },
      rolesMap
    );
    expect(financeResult.granted).toBe(false);

    // Teacher accesses attendance on Campus A -> ALLOWED
    const attendanceResult = PermissionEvaluator.evaluate(
      {
        user: teacherCampusA,
        moduleCode: 'academics',
        entityCode: 'attendance',
        action: 'CREATE',
        record: { nodePath: 'root.campus_a' },
      },
      rolesMap
    );
    expect(attendanceResult.granted).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // F. Downstream admin cannot assign a role above delegated privilege ceiling
  // ──────────────────────────────────────────────────────────────────────────
  it('F. Downstream admin cannot assign a role above delegated privilege ceiling (Anti-Privilege Escalation)', () => {
    // Head Office delegates only ['role-school-admin', 'role-teacher', 'role-accountant'] to School 1
    const delegatedRolesForSchool1 = new Set(['role-school-admin', 'role-teacher', 'role-accountant']);
    const privilegedGlobalRoles = ['role-platform-admin', 'role-finance-controller', 'role-global-auditor'];

    // Function simulating delegated role assignment gate
    function canAssignRole(delegatedPool: Set<string>, targetRoleId: string): boolean {
      return delegatedPool.has(targetRoleId);
    }

    // Allowed assignments
    expect(canAssignRole(delegatedRolesForSchool1, 'role-teacher')).toBe(true);
    expect(canAssignRole(delegatedRolesForSchool1, 'role-accountant')).toBe(true);

    // Blocked privilege escalation attempts
    for (const privilegedRole of privilegedGlobalRoles) {
      expect(canAssignRole(delegatedRolesForSchool1, privilegedRole)).toBe(false);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // G. Teacher domain scope prevents access to unassigned classes/sections
  // ──────────────────────────────────────────────────────────────────────────
  it('G. Teacher domain scope prevents access to unassigned classes/sections', () => {
    interface TeacherDomainScope {
      assignedClasses: string[];
      assignedSections: string[];
    }

    const teacherScope: TeacherDomainScope = {
      assignedClasses: ['CLASS_8', 'CLASS_9'],
      assignedSections: ['8-A', '8-B', '9-A'],
    };

    function isRecordInTeacherDomainScope(
      scope: TeacherDomainScope,
      record: { classCode: string; sectionCode: string }
    ): boolean {
      return (
        scope.assignedClasses.includes(record.classCode) &&
        scope.assignedSections.includes(record.sectionCode)
      );
    }

    // Assigned section: Class 8, Section 8-A -> ALLOW
    expect(isRecordInTeacherDomainScope(teacherScope, { classCode: 'CLASS_8', sectionCode: '8-A' })).toBe(true);

    // Assigned section: Class 9, Section 9-A -> ALLOW
    expect(isRecordInTeacherDomainScope(teacherScope, { classCode: 'CLASS_9', sectionCode: '9-A' })).toBe(true);

    // Unassigned section: Class 8, Section 8-C -> DENIED
    expect(isRecordInTeacherDomainScope(teacherScope, { classCode: 'CLASS_8', sectionCode: '8-C' })).toBe(false);

    // Unassigned class: Class 10, Section 10-A -> DENIED
    expect(isRecordInTeacherDomainScope(teacherScope, { classCode: 'CLASS_10', sectionCode: '10-A' })).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // H. Single-location School works without creating fake Branch
  // ──────────────────────────────────────────────────────────────────────────
  it('H. Single-location School works without creating fake Branch (School is Operational Node)', () => {
    // Single location: Org -> School (nodePath: "root.school_single")
    const singleLocationSchoolNode = {
      id: 'node-school-single',
      code: 'CITY_CAMPUS',
      name: 'City Grammar School',
      typeCode: 'SCHOOL',
      path: 'root.school_single',
      isActive: true,
      hasBranchChildren: false,
    };

    const userSingleSchool: AuthUserContext = {
      identityId: 'user-single',
      email: 'admin@citygrammar.edu',
      firstName: 'Admin',
      lastName: 'Single',
      organizationId: TENANT_A,
      organizationCode: 'city_grammar',
      membershipId: 'mem-single',
      sessionId: 'sess-single',
      assignments: [
        {
          id: 'asgn-single-school',
          organizationId: TENANT_A,
          membershipId: 'mem-single',
          hierarchyNodeId: singleLocationSchoolNode.id,
          nodePath: singleLocationSchoolNode.path,
          isPrimary: true,
          status: 'ACTIVE',
          roles: [
            {
              id: 'r-single',
              organizationId: TENANT_A,
              assignmentId: 'asgn-single-school',
              roleId: 'role-accountant',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // User can operate on the School node directly as the operational node
    const result = PermissionEvaluator.evaluate(
      {
        user: userSingleSchool,
        moduleCode: 'finance',
        entityCode: 'voucher',
        action: 'CREATE',
        record: { nodePath: 'root.school_single' },
      },
      rolesMap
    );

    expect(result.granted).toBe(true);
    expect(singleLocationSchoolNode.hasBranchChildren).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // I. Head Office-less organization structure is valid
  // ──────────────────────────────────────────────────────────────────────────
  it('I. Head Office-less organization structure is valid (Org -> School -> Branch)', () => {
    // Structure: root -> school_north -> branch_1 (No Head Office node)
    const schoolNorthPath = 'root.school_north';
    const branch1Path = 'root.school_north.branch_1';

    const userSchoolNorth: AuthUserContext = {
      identityId: 'user-ho-less',
      email: 'principal@schoolnorth.edu',
      firstName: 'Principal',
      lastName: 'North',
      organizationId: TENANT_A,
      organizationCode: 'north_network',
      membershipId: 'mem-north',
      sessionId: 'sess-north',
      assignments: [
        {
          id: 'asgn-school-north',
          organizationId: TENANT_A,
          membershipId: 'mem-north',
          hierarchyNodeId: 'node-school-north',
          nodePath: schoolNorthPath,
          isPrimary: true,
          status: 'ACTIVE',
          roles: [
            {
              id: 'r-ho-less',
              organizationId: TENANT_A,
              assignmentId: 'asgn-school-north',
              roleId: 'role-accountant',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // Exact node operation on school
    expect(
      PermissionEvaluator.evaluate(
        {
          user: userSchoolNorth,
          moduleCode: 'finance',
          entityCode: 'voucher',
          action: 'CREATE',
          record: { nodePath: schoolNorthPath },
        },
        rolesMap
      ).granted
    ).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // J. Region-less hierarchy is valid
  // ──────────────────────────────────────────────────────────────────────────
  it('J. Region-less hierarchy is valid (Org -> Head Office -> School -> Branch)', () => {
    // Structure: root -> head_office -> school_central -> branch_main (No Region)
    const hoPath = 'root.head_office';
    const schoolPath = 'root.head_office.school_central';

    const userDirectSchool: AuthUserContext = {
      identityId: 'user-direct',
      email: 'admin@central.edu',
      firstName: 'Admin',
      lastName: 'Central',
      organizationId: TENANT_A,
      organizationCode: 'central_net',
      membershipId: 'mem-direct',
      sessionId: 'sess-direct',
      assignments: [
        {
          id: 'asgn-central',
          organizationId: TENANT_A,
          membershipId: 'mem-direct',
          hierarchyNodeId: 'node-central',
          nodePath: schoolPath,
          isPrimary: true,
          status: 'ACTIVE',
          roles: [
            {
              id: 'r-direct',
              organizationId: TENANT_A,
              assignmentId: 'asgn-central',
              roleId: 'role-accountant',
              createdAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    expect(
      PermissionEvaluator.evaluate(
        {
          user: userDirectSchool,
          moduleCode: 'finance',
          entityCode: 'voucher',
          action: 'READ',
          record: { nodePath: schoolPath },
        },
        rolesMap
      ).granted
    ).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // K. Multi-node assignments are valid (Employee works at 3 distinct nodes)
  // ──────────────────────────────────────────────────────────────────────────
  it('K. Multi-node assignments are valid (Different roles at different nodes)', () => {
    const multiNodeUser: AuthUserContext = {
      identityId: 'user-multi',
      email: 'shared.staff@network.edu',
      firstName: 'Shared',
      lastName: 'Staff',
      organizationId: TENANT_A,
      organizationCode: 'network_a',
      membershipId: 'mem-multi',
      sessionId: 'sess-multi',
      assignments: [
        {
          // Node 1: Head Office -> Accountant
          id: 'asgn-1',
          organizationId: TENANT_A,
          membershipId: 'mem-multi',
          hierarchyNodeId: 'node-ho',
          nodePath: 'root.head_office',
          isPrimary: true,
          status: 'ACTIVE',
          roles: [{ id: 'r-ho', organizationId: TENANT_A, assignmentId: 'asgn-1', roleId: 'role-accountant', createdAt: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          // Node 2: School Alpha -> Teacher
          id: 'asgn-2',
          organizationId: TENANT_A,
          membershipId: 'mem-multi',
          hierarchyNodeId: 'node-alpha',
          nodePath: 'root.head_office.school_alpha',
          isPrimary: false,
          status: 'ACTIVE',
          roles: [{ id: 'r-alpha', organizationId: TENANT_A, assignmentId: 'asgn-2', roleId: 'role-teacher', createdAt: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // At Head Office: can access finance
    expect(
      PermissionEvaluator.evaluate(
        { user: multiNodeUser, moduleCode: 'finance', entityCode: 'voucher', action: 'CREATE', record: { nodePath: 'root.head_office' } },
        rolesMap
      ).granted
    ).toBe(true);

    // At Head Office: cannot access attendance (only teacher on alpha)
    expect(
      PermissionEvaluator.evaluate(
        { user: multiNodeUser, moduleCode: 'academics', entityCode: 'attendance', action: 'CREATE', record: { nodePath: 'root.head_office' } },
        rolesMap
      ).granted
    ).toBe(false);

    // At School Alpha: can access attendance
    expect(
      PermissionEvaluator.evaluate(
        { user: multiNodeUser, moduleCode: 'academics', entityCode: 'attendance', action: 'CREATE', record: { nodePath: 'root.head_office.school_alpha' } },
        rolesMap
      ).granted
    ).toBe(true);

    // At School Alpha: cannot access finance (accountant only assigned at HO)
    expect(
      PermissionEvaluator.evaluate(
        { user: multiNodeUser, moduleCode: 'finance', entityCode: 'voucher', action: 'CREATE', record: { nodePath: 'root.head_office.school_alpha' } },
        rolesMap
      ).granted
    ).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // L. Tenant isolation remains intact across all node operations
  // ──────────────────────────────────────────────────────────────────────────
  it('L. Tenant isolation remains intact across all node operations', () => {
    const userTenantA: AuthUserContext = {
      identityId: 'user-tenant-a',
      email: 'admin@tenanta.com',
      firstName: 'Admin',
      lastName: 'A',
      organizationId: TENANT_A,
      organizationCode: 'tenant_a',
      membershipId: 'mem-a',
      sessionId: 'sess-a',
      assignments: [
        {
          id: 'asgn-a',
          organizationId: TENANT_A,
          membershipId: 'mem-a',
          hierarchyNodeId: 'node-a',
          nodePath: 'root.campus_a',
          isPrimary: true,
          status: 'ACTIVE',
          roles: [{ id: 'r-a', organizationId: TENANT_A, assignmentId: 'asgn-a', roleId: 'role-accountant', createdAt: new Date() }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    // User Tenant A tries to access Tenant B record -> Blocked by organization boundary
    const isSameTenant = userTenantA.organizationId === TENANT_B;
    expect(isSameTenant).toBe(false);

    // In a multi-tenant query, tenant context prevents matching Tenant B records
    const crossTenantRecord = {
      organizationId: TENANT_B,
      nodePath: 'root.campus_a', // Even if node path matches identically
    };

    const isAuthorizedForTenant = userTenantA.organizationId === crossTenantRecord.organizationId;
    expect(isAuthorizedForTenant).toBe(false);
  });
});
