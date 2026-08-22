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
});
