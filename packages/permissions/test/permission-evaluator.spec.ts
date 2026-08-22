import { describe, it, expect } from 'vitest';
import { PermissionEvaluator } from '../src/evaluator.js';
import { AuthUserContext, PermissionRuleDTO } from '@campus-os/types';

describe('PermissionEvaluator with Tri-State & Multi-Node Support', () => {
  const mockUser: AuthUserContext = {
    identityId: 'user-123',
    email: 'ali@campus.edu',
    firstName: 'Ali',
    lastName: 'Hassan',
    organizationId: 'org-111',
    organizationCode: 'univ_main',
    membershipId: 'mem-111',
    sessionId: 'sess-111',
    assignments: [
      {
        id: 'assign-head-office',
        organizationId: 'org-111',
        membershipId: 'mem-111',
        hierarchyNodeId: 'node-ho',
        nodePath: 'root.head_office',
        isPrimary: false,
        status: 'ACTIVE',
        validFrom: new Date('2026-01-01'),
        roles: [
          {
            id: 'ar-1',
            organizationId: 'org-111',
            assignmentId: 'assign-head-office',
            roleId: 'role-finance-officer',
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'assign-campus-a',
        organizationId: 'org-111',
        membershipId: 'mem-111',
        hierarchyNodeId: 'node-campus-a',
        nodePath: 'root.region_south.campus_a',
        isPrimary: true,
        status: 'ACTIVE',
        validFrom: new Date('2026-01-01'),
        roles: [
          {
            id: 'ar-2',
            organizationId: 'org-111',
            assignmentId: 'assign-campus-a',
            roleId: 'role-accountant',
            createdAt: new Date(),
          },
          {
            id: 'ar-3',
            organizationId: 'org-111',
            assignmentId: 'assign-campus-a',
            roleId: 'role-auditor-restricted',
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  it('1. Grants access when role on exact node has explicit ALLOW', () => {
    const rolesMap = new Map<string, PermissionRuleDTO[]>([
      [
        'role-accountant',
        [
          {
            moduleCode: 'finance',
            entityCode: 'voucher',
            action: 'CREATE',
            effect: 'ALLOW',
            dataScope: 'EXACT_NODE',
          },
        ],
      ],
    ]);

    const result = PermissionEvaluator.evaluate(
      {
        user: mockUser,
        moduleCode: 'finance',
        entityCode: 'voucher',
        action: 'CREATE',
        record: { nodePath: 'root.region_south.campus_a' },
      },
      rolesMap
    );

    expect(result.granted).toBe(true);
    expect(result.effectiveScope).toBe('EXACT_NODE');
  });

  it('2. Enforces Tri-State Precedence: Explicit DENY overrides Explicit ALLOW', () => {
    const rolesMap = new Map<string, PermissionRuleDTO[]>([
      [
        'role-accountant',
        [
          {
            moduleCode: 'finance',
            entityCode: 'voucher',
            action: 'DELETE',
            effect: 'ALLOW',
            dataScope: 'EXACT_NODE',
          },
        ],
      ],
      [
        'role-auditor-restricted',
        [
          {
            moduleCode: 'finance',
            entityCode: 'voucher',
            action: 'DELETE',
            effect: 'DENY', // Explicit DENY overrides ALLOW
            dataScope: 'EXACT_NODE',
          },
        ],
      ],
    ]);

    const result = PermissionEvaluator.evaluate(
      {
        user: mockUser,
        moduleCode: 'finance',
        entityCode: 'voucher',
        action: 'DELETE',
        record: { nodePath: 'root.region_south.campus_a' },
      },
      rolesMap
    );

    expect(result.granted).toBe(false);
    expect(result.reason).toBe('DENY_EXPLICIT_OVERRIDE');
  });

  it('3. Fails closed (Default DENY) when action is not in scope of node or roles', () => {
    const rolesMap = new Map<string, PermissionRuleDTO[]>([
      [
        'role-accountant',
        [
          {
            moduleCode: 'finance',
            entityCode: 'voucher',
            action: 'CREATE',
            effect: 'ALLOW',
            dataScope: 'EXACT_NODE',
          },
        ],
      ],
    ]);

    // Record is at Campus B (user only has Campus A and Head Office)
    const result = PermissionEvaluator.evaluate(
      {
        user: mockUser,
        moduleCode: 'finance',
        entityCode: 'voucher',
        action: 'CREATE',
        record: { nodePath: 'root.region_south.campus_b' },
      },
      rolesMap
    );

    expect(result.granted).toBe(false);
    expect(result.reason).toBe('DENY_DEFAULT_NO_MATCHING_RULE');
  });

  it('4. Fails closed when assignment status is not ACTIVE', () => {
    const inactiveUser: AuthUserContext = {
      ...mockUser,
      assignments: [
        {
          ...mockUser.assignments[0]!,
          status: 'EXPIRED',
        },
      ],
    };

    const rolesMap = new Map<string, PermissionRuleDTO[]>([
      [
        'role-finance-officer',
        [
          {
            moduleCode: 'finance',
            entityCode: 'report',
            action: 'READ',
            effect: 'ALLOW',
            dataScope: 'ORGANIZATION_WIDE',
          },
        ],
      ],
    ]);

    const result = PermissionEvaluator.evaluate(
      {
        user: inactiveUser,
        moduleCode: 'finance',
        entityCode: 'report',
        action: 'READ',
      },
      rolesMap
    );

    expect(result.granted).toBe(false);
  });

  describe('5. Real-World Multi-Node Employee Assignment Scenarios', () => {
    const rolesMap = new Map<string, PermissionRuleDTO[]>([
      [
        'role-accountant-exact',
        [
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
        'role-regional-approver',
        [
          {
            moduleCode: 'finance',
            entityCode: 'fee_concession',
            action: 'APPROVE',
            effect: 'ALLOW',
            dataScope: 'HIERARCHY_SUBTREE',
          },
        ],
      ],
      [
        'role-finance-director',
        [
          {
            moduleCode: 'finance',
            entityCode: 'financial_statement',
            action: 'READ',
            effect: 'ALLOW',
            dataScope: 'HIERARCHY_SUBTREE',
          },
        ],
      ],
      [
        'role-auditor-deny',
        [
          {
            moduleCode: 'finance',
            entityCode: 'fee_concession',
            action: 'APPROVE',
            effect: 'DENY',
            dataScope: 'EXACT_NODE',
          },
        ],
      ],
    ]);

    it('Employee A: Head Office Accountant can only access Head Office vouchers (EXACT_NODE)', () => {
      const employeeA: AuthUserContext = {
        identityId: 'emp-a',
        email: 'emp.a@campus.edu',
        firstName: 'Employee',
        lastName: 'A',
        organizationId: 'org-111',
        organizationCode: 'univ_main',
        membershipId: 'mem-a',
        sessionId: 'sess-a',
        assignments: [
          {
            id: 'asgn-ho',
            organizationId: 'org-111',
            membershipId: 'mem-a',
            hierarchyNodeId: 'node-ho',
            nodePath: 'root.head_office',
            isPrimary: true,
            status: 'ACTIVE',
            roles: [{ id: 'r-1', organizationId: 'org-111', assignmentId: 'asgn-ho', roleId: 'role-accountant-exact', createdAt: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      // Can access Head Office
      const hoResult = PermissionEvaluator.evaluate(
        { user: employeeA, moduleCode: 'finance', entityCode: 'voucher', action: 'CREATE', record: { nodePath: 'root.head_office' } },
        rolesMap
      );
      expect(hoResult.granted).toBe(true);

      // CANNOT access Campus Karachi
      const karachiResult = PermissionEvaluator.evaluate(
        { user: employeeA, moduleCode: 'finance', entityCode: 'voucher', action: 'CREATE', record: { nodePath: 'root.region_south.campus_karachi' } },
        rolesMap
      );
      expect(karachiResult.granted).toBe(false);
    });

    it('Employee C: Assigned simultaneously to 2 Campuses (Karachi + Lahore)', () => {
      const employeeC: AuthUserContext = {
        identityId: 'emp-c',
        email: 'emp.c@campus.edu',
        firstName: 'Employee',
        lastName: 'C',
        organizationId: 'org-111',
        organizationCode: 'univ_main',
        membershipId: 'mem-c',
        sessionId: 'sess-c',
        assignments: [
          {
            id: 'asgn-karachi',
            organizationId: 'org-111',
            membershipId: 'mem-c',
            hierarchyNodeId: 'node-karachi',
            nodePath: 'root.region_south.campus_karachi',
            isPrimary: true,
            status: 'ACTIVE',
            roles: [{ id: 'r-2', organizationId: 'org-111', assignmentId: 'asgn-karachi', roleId: 'role-accountant-exact', createdAt: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'asgn-lahore',
            organizationId: 'org-111',
            membershipId: 'mem-c',
            hierarchyNodeId: 'node-lahore',
            nodePath: 'root.region_north.campus_lahore',
            isPrimary: false,
            status: 'ACTIVE',
            roles: [{ id: 'r-3', organizationId: 'org-111', assignmentId: 'asgn-lahore', roleId: 'role-accountant-exact', createdAt: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      // Can access Karachi
      expect(
        PermissionEvaluator.evaluate(
          { user: employeeC, moduleCode: 'finance', entityCode: 'voucher', action: 'CREATE', record: { nodePath: 'root.region_south.campus_karachi' } },
          rolesMap
        ).granted
      ).toBe(true);

      // Can access Lahore
      expect(
        PermissionEvaluator.evaluate(
          { user: employeeC, moduleCode: 'finance', entityCode: 'voucher', action: 'CREATE', record: { nodePath: 'root.region_north.campus_lahore' } },
          rolesMap
        ).granted
      ).toBe(true);

      // CANNOT access Campus Islamabad (neither Karachi nor Lahore)
      expect(
        PermissionEvaluator.evaluate(
          { user: employeeC, moduleCode: 'finance', entityCode: 'voucher', action: 'CREATE', record: { nodePath: 'root.region_north.campus_islamabad' } },
          rolesMap
        ).granted
      ).toBe(false);
    });

    it('Employee D: Multi-Node complex assignment across 4 hierarchy nodes with Subtree & Explicit DENY', () => {
      const employeeD: AuthUserContext = {
        identityId: 'emp-d',
        email: 'emp.d@campus.edu',
        firstName: 'Employee',
        lastName: 'D',
        organizationId: 'org-111',
        organizationCode: 'univ_main',
        membershipId: 'mem-d',
        sessionId: 'sess-d',
        assignments: [
          {
            // Tier 1: Head Office -> Finance Director (Subtree on root.head_office)
            id: 'asgn-ho-d',
            organizationId: 'org-111',
            membershipId: 'mem-d',
            hierarchyNodeId: 'node-ho',
            nodePath: 'root.head_office',
            isPrimary: true,
            status: 'ACTIVE',
            roles: [{ id: 'r-4', organizationId: 'org-111', assignmentId: 'asgn-ho-d', roleId: 'role-finance-director', createdAt: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            // Tier 2: Regional Office South -> Regional Approver (Subtree on root.region_south)
            id: 'asgn-reg-south',
            organizationId: 'org-111',
            membershipId: 'mem-d',
            hierarchyNodeId: 'node-reg-south',
            nodePath: 'root.region_south',
            isPrimary: false,
            status: 'ACTIVE',
            roles: [{ id: 'r-5', organizationId: 'org-111', assignmentId: 'asgn-reg-south', roleId: 'role-regional-approver', createdAt: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            // Tier 3: Campus Karachi -> Lead Accountant (Exact node)
            id: 'asgn-karachi-d',
            organizationId: 'org-111',
            membershipId: 'mem-d',
            hierarchyNodeId: 'node-karachi',
            nodePath: 'root.region_south.campus_karachi',
            isPrimary: false,
            status: 'ACTIVE',
            roles: [{ id: 'r-6', organizationId: 'org-111', assignmentId: 'asgn-karachi-d', roleId: 'role-accountant-exact', createdAt: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            // Tier 4: Campus Hyderabad -> Suspended/Restricted (Explicit DENY on node)
            id: 'asgn-hyd-d',
            organizationId: 'org-111',
            membershipId: 'mem-d',
            hierarchyNodeId: 'node-hyd',
            nodePath: 'root.region_south.campus_hyderabad',
            isPrimary: false,
            status: 'ACTIVE',
            roles: [{ id: 'r-7', organizationId: 'org-111', assignmentId: 'asgn-hyd-d', roleId: 'role-auditor-deny', createdAt: new Date() }],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      // 1. Regional Approver can approve in South Region descendant (Campus Karachi)
      expect(
        PermissionEvaluator.evaluate(
          { user: employeeD, moduleCode: 'finance', entityCode: 'fee_concession', action: 'APPROVE', record: { nodePath: 'root.region_south.campus_karachi' } },
          rolesMap
        ).granted
      ).toBe(true);

      // 2. Explicit DENY on Campus Hyderabad blocks approval despite Region South subtree ALLOW
      const hydResult = PermissionEvaluator.evaluate(
        { user: employeeD, moduleCode: 'finance', entityCode: 'fee_concession', action: 'APPROVE', record: { nodePath: 'root.region_south.campus_hyderabad' } },
        rolesMap
      );
      expect(hydResult.granted).toBe(false);
      expect(hydResult.reason).toBe('DENY_EXPLICIT_OVERRIDE');

      // 3. CANNOT approve in Region North (Campus Peshawar) because Region South subtree does not cover Region North
      expect(
        PermissionEvaluator.evaluate(
          { user: employeeD, moduleCode: 'finance', entityCode: 'fee_concession', action: 'APPROVE', record: { nodePath: 'root.region_north.campus_peshawar' } },
          rolesMap
        ).granted
      ).toBe(false);
    });
  });
});

