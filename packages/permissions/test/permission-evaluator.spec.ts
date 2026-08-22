import { describe, it, expect } from 'vitest';
import { PermissionEvaluator } from '../src/evaluator.js';
import { AuthUserContext, PermissionRuleDTO } from '@campus-os/types';

describe('PermissionEvaluator (Negative & Scope Tests)', () => {
  const mockUser: AuthUserContext = {
    userId: 'user-123',
    email: 'faculty@campus.edu',
    firstName: 'John',
    lastName: 'Doe',
    organizationId: 'org-111',
    organizationCode: 'univ_main',
    assignments: [
      {
        id: 'assign-1',
        userId: 'user-123',
        roleId: 'role-teacher',
        roleCode: 'TEACHER',
        nodeId: 'node-cs-dept',
        nodePath: 'root.campus_north.cs_dept',
        createdAt: new Date(),
      },
    ],
  };

  it('fails closed (Deny by Default) when role has no matching permissions', () => {
    const rolesPermissionsMap = new Map<string, PermissionRuleDTO[]>([
      [
        'role-teacher',
        [
          {
            moduleCode: 'academics',
            entityCode: 'course',
            action: 'READ',
            dataScope: 'HIERARCHY_SUBTREE',
          },
        ],
      ],
    ]);

    // Requesting DELETE on course (only READ is granted)
    const result = PermissionEvaluator.evaluate(
      {
        user: mockUser,
        moduleCode: 'academics',
        entityCode: 'course',
        action: 'DELETE',
      },
      rolesPermissionsMap
    );

    expect(result.granted).toBe(false);
    expect(result.reason).toBe('DENY_ACTION_NOT_PERMITTED');
  });

  it('denies access when record is outside of user hierarchy subtree scope', () => {
    const rolesPermissionsMap = new Map<string, PermissionRuleDTO[]>([
      [
        'role-teacher',
        [
          {
            moduleCode: 'academics',
            entityCode: 'grade',
            action: 'UPDATE',
            dataScope: 'HIERARCHY_SUBTREE',
          },
        ],
      ],
    ]);

    // Record in South Campus (user is in North Campus)
    const outOfScopeRecord = {
      nodePath: 'root.campus_south.ee_dept',
      createdBy: 'other-user',
    };

    const result = PermissionEvaluator.evaluate(
      {
        user: mockUser,
        moduleCode: 'academics',
        entityCode: 'grade',
        action: 'UPDATE',
        record: outOfScopeRecord,
      },
      rolesPermissionsMap
    );

    expect(result.granted).toBe(false);
    expect(result.reason).toBe('DENY_RECORD_OUT_OF_SCOPE');
  });

  it('grants access when record is strictly within user hierarchy subtree scope', () => {
    const rolesPermissionsMap = new Map<string, PermissionRuleDTO[]>([
      [
        'role-teacher',
        [
          {
            moduleCode: 'academics',
            entityCode: 'grade',
            action: 'UPDATE',
            dataScope: 'HIERARCHY_SUBTREE',
          },
        ],
      ],
    ]);

    // Record inside North Campus CS Dept Section A (child of root.campus_north.cs_dept)
    const inScopeRecord = {
      nodePath: 'root.campus_north.cs_dept.sec_a',
      createdBy: 'user-123',
    };

    const result = PermissionEvaluator.evaluate(
      {
        user: mockUser,
        moduleCode: 'academics',
        entityCode: 'grade',
        action: 'UPDATE',
        record: inScopeRecord,
      },
      rolesPermissionsMap
    );

    expect(result.granted).toBe(true);
    expect(result.effectiveScope).toBe('HIERARCHY_SUBTREE');
  });
});
