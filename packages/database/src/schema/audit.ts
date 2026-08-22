import { pgTable, uuid, varchar, text, jsonb, timestamp, inet } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id'),
  actorEmail: varchar('actor_email', { length: 255 }),
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 32 }).notNull(),
  beforeState: jsonb('before_state'),
  afterState: jsonb('after_state'),
  diff: jsonb('diff'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
