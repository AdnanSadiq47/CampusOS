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
  parentId: uuid('parent_id').notNull(), // references hierarchy_nodes(id) — any eligible parent node (HO, root, or other non-leaf)

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
  country: varchar('country', { length: 128 }).default('Pakistan'),
  address: text('address'),
  area: varchar('area', { length: 128 }),
  city: varchar('city', { length: 128 }),
  province: varchar('province', { length: 128 }),
  postalCode: varchar('postal_code', { length: 32 }),
  countryId: uuid('country_id'),
  stateId: uuid('state_id'),
  cityId: uuid('city_id'),
  areaId: uuid('area_id'),

  // ── Configuration ─────────────────────────────────────────────────
  notes: text('notes'),

  // ── Status & Audit Standard (at END of table) ─────────────────────
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
