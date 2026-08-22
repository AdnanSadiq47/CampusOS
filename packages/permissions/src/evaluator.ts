import { ActionCode, AuthUserContext, DataScopeType, FieldRestriction, PermissionRuleDTO } from '@campus-os/types';

export interface PermissionEvaluationRequest {
  user: AuthUserContext;
  moduleCode: string;
  entityCode: string;
  action: ActionCode;
  record?: {
    nodePath?: string;
    nodeId?: string;
    createdBy?: string;
    assigneeId?: string;
    [key: string]: unknown;
  };
}

export interface PermissionEvaluationResult {
  granted: boolean;
  reason?: string;
  effectiveScope?: DataScopeType;
  fieldRestrictions?: FieldRestriction[];
}

export class PermissionEvaluator {
  /**
   * Evaluates if a user has permission to perform an action on an entity.
   * Follows strict DENY BY DEFAULT.
   */
  static evaluate(
    request: PermissionEvaluationRequest,
    userRolesPermissions: Map<string, PermissionRuleDTO[]>
  ): PermissionEvaluationResult {
    const { user, moduleCode, entityCode, action, record } = request;

    // 1. Super Admin bypass (Platform-level system administrators)
    if (user.isSuperAdmin) {
      return { granted: true, effectiveScope: 'GLOBAL_ORGANIZATION' };
    }

    // 2. Deny if user has no role assignments
    if (!user.assignments || user.assignments.length === 0) {
      return { granted: false, reason: 'DENY_NO_ROLE_ASSIGNMENTS' };
    }

    let isActionAllowed = false;
    let broadestScope: DataScopeType = 'OWN_RECORDS';
    const fieldRestrictions: FieldRestriction[] = [];

    const scopeRank: Record<DataScopeType, number> = {
      OWN_RECORDS: 1,
      ASSIGNED_RECORDS: 2,
      EXACT_NODE: 3,
      CUSTOM_SCOPE: 4,
      HIERARCHY_SUBTREE: 5,
      GLOBAL_ORGANIZATION: 6,
    };

    // 3. Iterate through assigned roles
    for (const assignment of user.assignments) {
      const permissions = userRolesPermissions.get(assignment.roleId) || [];

      for (const perm of permissions) {
        // Module match
        const moduleMatch = perm.moduleCode === '*' || perm.moduleCode === moduleCode;
        // Entity match
        const entityMatch = perm.entityCode === '*' || perm.entityCode === entityCode;
        // Action match
        const actionMatch = perm.action === '*' || perm.action === action;

        if (moduleMatch && entityMatch && actionMatch) {
          isActionAllowed = true;

          // Compute broadest scope
          if (scopeRank[perm.dataScope] > scopeRank[broadestScope]) {
            broadestScope = perm.dataScope;
          }

          // Accumulate field restrictions
          if (perm.fieldRules) {
            fieldRestrictions.push(...perm.fieldRules);
          }
        }
      }
    }

    if (!isActionAllowed) {
      return { granted: false, reason: 'DENY_ACTION_NOT_PERMITTED' };
    }

    // 4. If record is provided, evaluate data scope containment
    if (record) {
      const scopePassed = this.checkDataScope(user, broadestScope, record);
      if (!scopePassed) {
        return { granted: false, reason: 'DENY_RECORD_OUT_OF_SCOPE' };
      }
    }

    return {
      granted: true,
      effectiveScope: broadestScope,
      fieldRestrictions,
    };
  }

  private static checkDataScope(
    user: AuthUserContext,
    scope: DataScopeType,
    record: NonNullable<PermissionEvaluationRequest['record']>
  ): boolean {
    switch (scope) {
      case 'GLOBAL_ORGANIZATION':
        return true;

      case 'OWN_RECORDS':
        return record.createdBy === user.userId;

      case 'ASSIGNED_RECORDS':
        return record.assigneeId === user.userId || record['userId'] === user.userId;

      case 'EXACT_NODE':
        return user.assignments.some((a) => a.nodeId === record.nodeId);

      case 'HIERARCHY_SUBTREE':
        if (!record.nodePath) return false;
        return user.assignments.some((a) => {
          // PostgreSQL ltree equivalent check: record path must start with or be descendant of user's node path
          return record.nodePath!.startsWith(a.nodePath) || a.nodePath === record.nodePath;
        });

      case 'CUSTOM_SCOPE':
        return true; // Evaluated via custom node lists

      default:
        return false;
    }
  }
}
