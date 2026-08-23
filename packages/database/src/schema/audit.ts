import { pgTable, uuid, varchar, text, jsonb, timestamp, inet, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

/**
 * Enterprise Audit Logs Schema
 *
 * Permanent, tamper-resistant append-only audit trail for business, security,
 * and organizational actions.
 *
 * ARCHITECTURAL INVARIANTS:
 * - Append-only: No UPDATE or DELETE operations are exposed.
 * - Tenant Isolated: organization_id is always mandatory and filtered via RLS.
 * - Scope-Aware: hierarchy_node_id preserves the effective School/Branch/Campus context.
 * - Compact Diffs: Updates store structured field-level deltas { before, after }, not full table dumps.
 * - Secret Sanitization: Passwords, tokens, hashes, and encryption keys are strictly redacted.
 * - Partitioning-ready: Indexed by (organization_id, created_at) for efficient time-series range queries and archival.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // ── Tenant Anchor ────────────────────────────────────────────────
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // ── Organizational Context / Node Scope ──────────────────────────
    hierarchyNodeId: uuid('hierarchy_node_id'),

    // ── Actor Details ────────────────────────────────────────────────
    actorId: uuid('actor_id'),
    actorEmail: varchar('actor_email', { length: 255 }),
    impersonatorId: uuid('impersonator_id'),

    // ── Action & Target ──────────────────────────────────────────────
    module: varchar('module', { length: 64 }).default('GENERAL').notNull(), // ORGANIZATION, IAM, ACADEMICS, FEES, HR, ETC.
    action: varchar('action', { length: 64 }).notNull(), // CREATE, UPDATE, DEACTIVATE, ACTIVATE, ARCHIVE, AUTH_LOGIN, etc.
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: uuid('entity_id').notNull(),

    // ── Compact Change Payloads ──────────────────────────────────────
    beforeState: jsonb('before_state'),
    afterState: jsonb('after_state'),
    diff: jsonb('diff'), // { fieldName: { before: valA, after: valB } }

    // ── Outcome & Diagnostics ────────────────────────────────────────
    outcome: varchar('outcome', { length: 32 }).default('SUCCESS').notNull(), // SUCCESS, DENIED, FAILED
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').default({}).notNull(),

    // ── Timestamp ────────────────────────────────────────────────────
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxAuditOrgCreated: index('idx_audit_org_created').on(t.organizationId, t.createdAt),
    idxAuditOrgEntity: index('idx_audit_org_entity').on(t.organizationId, t.entityType, t.entityId),
    idxAuditOrgNode: index('idx_audit_org_node').on(t.organizationId, t.hierarchyNodeId),
    idxAuditOrgActor: index('idx_audit_org_actor').on(t.organizationId, t.actorId),
    idxAuditOrgModuleAction: index('idx_audit_org_module_action').on(t.organizationId, t.module, t.action),
  })
);
