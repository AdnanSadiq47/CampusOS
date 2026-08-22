import { Injectable } from '@nestjs/common';
import { TenantTransactionManager, auditLogs } from '@campus-os/database';
import { AuditLogEntry } from '@campus-os/types';

@Injectable()
export class AuditService {
  constructor(private readonly tenantManager: TenantTransactionManager) {}

  async logEvent(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) {
    return this.tenantManager.runInTenantContext(entry.organizationId, async (tx) => {
      const [log] = await tx
        .insert(auditLogs)
        .values({
          organizationId: entry.organizationId,
          actorId: entry.actorId || null,
          actorEmail: entry.actorEmail || null,
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          beforeState: entry.beforeState || null,
          afterState: entry.afterState || null,
          diff: entry.diff || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
        })
        .returning();
      return log;
    });
  }
}
