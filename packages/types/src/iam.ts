import { z } from 'zod';

export type ActionCode =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'PRINT'
  | 'EXPORT'
  | 'IMPORT'
  | 'CONFIGURE'
  | 'AUDIT_VIEW'
  | '*';

export type DataScopeType =
  | 'GLOBAL_ORGANIZATION'
  | 'HIERARCHY_SUBTREE'
  | 'EXACT_NODE'
  | 'OWN_RECORDS'
  | 'ASSIGNED_RECORDS'
  | 'CUSTOM_SCOPE';

export interface FieldRestriction {
  fieldName: string;
  access: 'DEFAULT' | 'READ_ONLY' | 'HIDDEN' | 'MASKED';
}

export interface PermissionRuleDTO {
  moduleCode: string;
  entityCode: string;
  action: ActionCode;
  dataScope: DataScopeType;
  fieldRules?: FieldRestriction[];
}

export interface RoleDTO {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string | null;
  isSystemTemplate: boolean;
  isActive: boolean;
  permissions?: PermissionRuleDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignmentDTO {
  id: string;
  userId: string;
  roleId: string;
  roleCode: string;
  nodeId: string;
  nodePath: string;
  createdAt: Date;
}

export interface AuthUserContext {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  organizationCode: string;
  assignments: UserRoleAssignmentDTO[];
  isSuperAdmin?: boolean;
}

export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  organizationCode: z.string().min(2),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
