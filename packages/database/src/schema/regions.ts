import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

/**
 * Regional Offices
 *
 * A Region is an optional intermediate hierarchy tier between Head Office and Schools.
 * Organization / Network → Head Office → [Region - OPTIONAL] → School → Branch
 *
 * Each region creates and stays linked to a hierarchy_nodes entry of configurable type REGION.
 * Tenant isolation is enforced via composite (organization_id, id) foreign key convention
 * and PostgreSQL RLS policies.
 *
 * SECURITY INVARIANTS:
 * - organization_id is ALWAYS set server-side from the authenticated tenant context
 * - user credentials are NOT stored here (belong to identity_users)
 * - no hardcoded campus_id or branch_id fields
 */
export const regions = pgTable('regions', {
  id: uuid('id').defaultRandom().primaryKey(),

  // ── Tenant anchor ────────────────────────────────────────────────
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // ── Hierarchy engine link ─────────────────────────────────────────
  hierarchyNodeId: uuid('hierarchy_node_id').notNull(),
  parentId: uuid('parent_id').notNull(), // references hierarchy_nodes(id) of type HEAD_OFFICE

  // ── Identity ──────────────────────────────────────────────────────
  code: varchar('code', { length: 64 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  shortName: varchar('short_name', { length: 128 }),

  // ── Administration ────────────────────────────────────────────────
  directorName: varchar('director_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 64 }),
  alternatePhone: varchar('alternate_phone', { length: 64 }),
  website: varchar('website', { length: 255 }),

  // ── Location ──────────────────────────────────────────────────────
  address: text('address'),
  area: varchar('area', { length: 128 }),
  city: varchar('city', { length: 128 }),
  province: varchar('province', { length: 128 }),
  postalCode: varchar('postal_code', { length: 32 }),

  // ── Configuration ─────────────────────────────────────────────────
  notes: text('notes'),

  // ── Status ────────────────────────────────────────────────────────
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
