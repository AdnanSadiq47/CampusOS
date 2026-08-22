import { z } from 'zod';
import { MembershipNodeAssignmentDTO } from './assignment.js';

export const ActionCodeEnum = z.enum([
  'READ',
  'CREATE',
  'UPDATE',
  'DELETE',
  'SUBMIT',
  'APPROVE',
  'REJECT',
  'CANCEL',
  'POST_FINANCIAL',
  'CLOSE',
  'REOPEN',
  'EXPORT',
  'IMPORT',
]);

export type ActionCode = z.infer<typeof ActionCodeEnum>;

export const DataScopeEnum = z.enum([
  'EXACT_NODE',
  'HIERARCHY_SUBTREE',
  'ORGANIZATION_WIDE',
  'OWN_RECORDS',
  'ASSIGNED_RECORDS',
  'CUSTOM_SCOPE',
]);

export type DataScope = z.infer<typeof DataScopeEnum>;

export const PermissionEffectEnum = z.enum(['ALLOW', 'DENY']);
export type PermissionEffect = z.infer<typeof PermissionEffectEnum>;

export interface FieldRule {
  fieldName: string;
  access: 'VISIBLE' | 'READ_ONLY' | 'HIDDEN' | 'MASKED';
}

export interface PermissionRuleDTO {
  moduleCode: string;
  entityCode: string;
  action: ActionCode;
  effect: PermissionEffect;
  dataScope: DataScope;
  fieldRules?: FieldRule[];
  conditions?: Record<string, unknown>;
}


export interface AuthUserContext {
  identityId: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organizationCode: string;
  membershipId: string;
  sessionId: string;
  assignments: MembershipNodeAssignmentDTO[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
