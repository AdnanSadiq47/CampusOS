export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATE_TRANSITION' | 'AUTH_LOGIN' | 'AUTH_LOGOUT';

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  entityType: string;
  entityId: string;
  action: AuditAction;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  diff?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}
