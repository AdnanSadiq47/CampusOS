/**
 * Enterprise Audit Types & Interfaces
 */

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DEACTIVATE'
  | 'ACTIVATE'
  | 'ARCHIVE'
  | 'CANCEL'
  | 'REVERSE'
  | 'APPROVE'
  | 'REJECT'
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'ROLE_ASSIGN'
  | 'ROLE_REVOKE'
  | 'SCOPE_ASSIGN'
  | 'HARD_DELETE'
  | 'SECURITY_DENIED'
  | string;

export type AuditOutcome = 'SUCCESS' | 'DENIED' | 'FAILED';

export interface FieldDiff {
  before: unknown;
  after: unknown;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  hierarchyNodeId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  impersonatorId?: string | null;
  module: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  diff?: Record<string, FieldDiff> | null;
  outcome: AuditOutcome;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateAuditLogDto {
  organizationId: string;
  hierarchyNodeId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  impersonatorId?: string | null;
  module?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  diff?: Record<string, FieldDiff> | null;
  outcome?: AuditOutcome;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogQueryDto {
  startDate?: string;
  endDate?: string;
  actorId?: string;
  hierarchyNodeId?: string;
  module?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  outcome?: AuditOutcome;
  search?: string;
  limit?: number;
  offset?: number;
}
