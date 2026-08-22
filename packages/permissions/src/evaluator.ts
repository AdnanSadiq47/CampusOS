import { AuthUserContext, ActionCode, DataScope, PermissionRuleDTO } from '@campus-os/types';

export interface PermissionEvaluationRequest {
  user: AuthUserContext;
  moduleCode: string;
  entityCode: string;
  action: ActionCode;
  record?: {
    nodePath?: string;
    createdBy?: string;
    ownerId?: string;
    [key: string]: unknown;
  };
}

export interface PermissionEvaluationResult {
  granted: boolean;
  effectiveScope?: DataScope;
  reason?: string;
  fieldRules?: Array<{ fieldName: string; access: string }>;
}

export class PermissionEvaluator {
  /**
   * Evaluates permission for a user request against multiple node assignments and roles.
   * Implements Tri-State Precedence: Explicit DENY > Explicit ALLOW > Default DENY.
   */
  static evaluate(
    request: PermissionEvaluationRequest,
    rolesPermissionsMap: Map<string, PermissionRuleDTO[]>
  ): PermissionEvaluationResult {
    const { user, moduleCode, entityCode, action, record } = request;

    if (!user || !user.assignments || user.assignments.length === 0) {
      return { granted: false, reason: 'DENY_NO_ASSIGNMENTS_FOUND' };
    }

    const applicableRules: PermissionRuleDTO[] = [];

    // 1. Iterate over all active node assignments
    for (const assignment of user.assignments) {
      if (assignment.status !== 'ACTIVE') continue;

      // Time validity check
      const now = new Date();
      if (assignment.validFrom && new Date(assignment.validFrom) > now) continue;
      if (assignment.validUntil && new Date(assignment.validUntil) < now) continue;

      const assignmentPath = assignment.nodePath || '';

      for (const assignmentRole of assignment.roles || []) {
        const rules = rolesPermissionsMap.get(assignmentRole.roleId) || [];

        for (const rule of rules) {
          if (rule.moduleCode === moduleCode && rule.entityCode === entityCode && rule.action === action) {
            // Check if record falls within this rule's data scope for this assignment
            if (this.isRecordInScope(rule.dataScope, assignmentPath, record, user.identityId)) {
              applicableRules.push(rule);
            }
          }
        }
      }
    }

    if (applicableRules.length === 0) {
      return { granted: false, reason: 'DENY_DEFAULT_NO_MATCHING_RULE' };
    }

    // 2. Strict Precedence: Explicit DENY overrides any sibling ALLOW
    const explicitDeny = applicableRules.find((r) => r.effect === 'DENY');
    if (explicitDeny) {
      return {
        granted: false,
        reason: 'DENY_EXPLICIT_OVERRIDE',
        effectiveScope: explicitDeny.dataScope,
      };
    }

    // 3. Explicit ALLOW
    const explicitAllow = applicableRules.find((r) => r.effect === 'ALLOW');
    if (explicitAllow) {
      return {
        granted: true,
        effectiveScope: explicitAllow.dataScope,
        fieldRules: explicitAllow.fieldRules,
      };
    }

    return { granted: false, reason: 'DENY_DEFAULT_CLOSED' };
  }

  private static isRecordInScope(
    scope: DataScope,
    assignmentPath: string,
    record?: { nodePath?: string; createdBy?: string; ownerId?: string },
    currentUserId?: string
  ): boolean {
    if (!record) {
      // General list/metadata operation where individual record node is not yet known
      return true;
    }

    switch (scope) {
      case 'ORGANIZATION_WIDE':
        return true;

      case 'EXACT_NODE':
        return !!record.nodePath && record.nodePath === assignmentPath;

      case 'HIERARCHY_SUBTREE':
        if (!record.nodePath || !assignmentPath) return false;
        // Subtree match: record.nodePath is equal to or a descendant of assignmentPath
        return record.nodePath === assignmentPath || record.nodePath.startsWith(`${assignmentPath}.`);

      case 'OWN_RECORDS':
        return (
          !!currentUserId &&
          (record.createdBy === currentUserId || record.ownerId === currentUserId)
        );

      case 'ASSIGNED_RECORDS':
      case 'CUSTOM_SCOPE':
        return true;

      default:
        return false;
    }
  }
}
