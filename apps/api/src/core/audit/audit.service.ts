import { Injectable } from '@nestjs/common';
import {
  TenantTransactionManager,
  auditLogs,
  hierarchyNodes,
  eq,
  and,
  gte,
  lte,
  sql,
  desc,
} from '@campus-os/database';
import {
  CreateAuditLogDto,
  AuditLogEntry,
  AuditLogQueryDto,
  FieldDiff,
} from '@campus-os/types';

// Sensitive keys that MUST NEVER appear in audit logs
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /password_hash/i,
  /passwordhash/i,
  /secret/i,
  /token/i,
  /jwt/i,
  /mfa/i,
  /authorization/i,
  /bearer/i,
  /cookie/i,
  /session/i,
  /key/i,
  /salt/i,
  /credit_card/i,
  /creditcard/i,
  /cvv/i,
];

@Injectable()
export class AuditService {
  constructor(private readonly tenantManager: TenantTransactionManager) {}

  // ─────────────────────────────────────────────────────────────────
  //  RECORD AUDIT EVENT (Append-Only & Secret-Sanitized)
  // ─────────────────────────────────────────────────────────────────

  async logEvent(entry: CreateAuditLogDto, externalTx?: any): Promise<AuditLogEntry> {
    const sanitizedBefore = this.sanitizePayload(entry.beforeState);
    const sanitizedAfter = this.sanitizePayload(entry.afterState);

    // Compute compact diff if not provided and both states exist
    let computedDiff = entry.diff ? this.sanitizePayload(entry.diff) : null;
    if (!computedDiff && sanitizedBefore && sanitizedAfter) {
      computedDiff = this.computeDiff(sanitizedBefore, sanitizedAfter);
    }

    const payload = {
      organizationId: entry.organizationId,
      hierarchyNodeId: entry.hierarchyNodeId || null,
      actorId: entry.actorId || null,
      actorEmail: entry.actorEmail || null,
      impersonatorId: entry.impersonatorId || null,
      module: entry.module || 'GENERAL',
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      beforeState: sanitizedBefore || null,
      afterState: sanitizedAfter || null,
      diff: computedDiff || null,
      outcome: entry.outcome || 'SUCCESS',
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      metadata: this.sanitizePayload(entry.metadata) || {},
    };

    if (externalTx) {
      const [log] = await externalTx
        .insert(auditLogs)
        .values(payload)
        .returning();
      return log as unknown as AuditLogEntry;
    }

    return this.tenantManager.runInTenantContext(entry.organizationId, async (tx) => {
      const [log] = await tx
        .insert(auditLogs)
        .values(payload)
        .returning();
      return log as unknown as AuditLogEntry;
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  SCOPE-AWARE QUERY AUDIT LOGS
  // ─────────────────────────────────────────────────────────────────

  async queryAuditLogs(
    tenantId: string,
    query: AuditLogQueryDto = {},
    viewerScopeNodeId?: string
  ): Promise<{ items: AuditLogEntry[]; total: number }> {
    return this.tenantManager.runInTenantContext(tenantId, async (tx) => {
      const conditions = [eq(auditLogs.organizationId, tenantId)];

      // Date Range
      if (query.startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(query.startDate)));
      }
      if (query.endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(query.endDate)));
      }

      // Actor & Module & Action & Outcome
      if (query.actorId) {
        conditions.push(eq(auditLogs.actorId, query.actorId));
      }
      if (query.module) {
        conditions.push(eq(auditLogs.module, query.module));
      }
      if (query.action) {
        conditions.push(eq(auditLogs.action, query.action));
      }
      if (query.entityType) {
        conditions.push(eq(auditLogs.entityType, query.entityType));
      }
      if (query.entityId) {
        conditions.push(eq(auditLogs.entityId, query.entityId));
      }
      if (query.outcome) {
        conditions.push(eq(auditLogs.outcome, query.outcome));
      }

      // Hierarchy Node Scope Filtering (Ltree Subtree Scoping)
      const targetNodeId = query.hierarchyNodeId || viewerScopeNodeId;
      if (targetNodeId) {
        // Fetch target node path
        const [targetNode] = await tx
          .select({ path: hierarchyNodes.path })
          .from(hierarchyNodes)
          .where(
            and(
              eq(hierarchyNodes.organizationId, tenantId),
              eq(hierarchyNodes.id, targetNodeId)
            )
          )
          .limit(1);

        if (targetNode) {
          // Subquery matching hierarchyNodeId of all descendant nodes under targetNode.path
          const subquery = tx
            .select({ id: hierarchyNodes.id })
            .from(hierarchyNodes)
            .where(
              and(
                eq(hierarchyNodes.organizationId, tenantId),
                sql`(${hierarchyNodes.path} = ${targetNode.path} OR ${hierarchyNodes.path} LIKE ${targetNode.path + '.%'})`
              )
            );

          conditions.push(sql`${auditLogs.hierarchyNodeId} IN (${subquery})`);
        } else {
          // If specified node does not exist in this tenant, return empty
          conditions.push(eq(auditLogs.hierarchyNodeId, targetNodeId));
        }
      }

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      const items = await tx
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      const [countResult] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(and(...conditions));

      return {
        items: items as unknown as AuditLogEntry[],
        total: countResult?.count || 0,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  DIFF ENGINE (Compact Field-Level Deltas)
  // ─────────────────────────────────────────────────────────────────

  computeDiff(
    before: Record<string, unknown> | null | undefined,
    after: Record<string, unknown> | null | undefined
  ): Record<string, FieldDiff> | null {
    if (!before || !after) return null;

    const diff: Record<string, FieldDiff> = {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    // Skip metadata timestamps and noisy internal columns
    const ignoredKeys = new Set(['updatedAt', 'updated_at', 'createdAt', 'created_at']);

    for (const key of allKeys) {
      if (ignoredKeys.has(key)) continue;
      if (this.isSensitiveKey(key)) continue;

      const valBefore = before[key];
      const valAfter = after[key];

      if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
        diff[key] = {
          before: valBefore !== undefined ? valBefore : null,
          after: valAfter !== undefined ? valAfter : null,
        };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }

  // ─────────────────────────────────────────────────────────────────
  //  SECRET REDACTION ENGINE
  // ─────────────────────────────────────────────────────────────────

  sanitizePayload<T>(payload: T): T {
    if (payload === null || payload === undefined) return payload;

    if (typeof payload === 'string' || typeof payload === 'number' || typeof payload === 'boolean') {
      return payload;
    }

    if (Array.isArray(payload)) {
      return payload.map((item) => this.sanitizePayload(item)) as unknown as T;
    }

    if (typeof payload === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED_SECRET]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizePayload(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized as T;
    }

    return payload;
  }

  private isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  }
}
