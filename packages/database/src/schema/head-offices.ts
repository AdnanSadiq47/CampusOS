import { pgTable, uuid, varchar, text, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

/**
 * Head Offices
 *
 * A Head Office is an optional top-level institutional administrative unit.
 * Organization / Network → [Head Office - OPTIONAL] → [Region - OPTIONAL] → School → Branch
 *
 * Each Head Office creates and stays linked to a hierarchy_nodes entry of configurable type HEAD_OFFICE.
 * Tenant isolation is enforced via composite (organization_id, id) foreign key convention
 * and PostgreSQL RLS policies.
 *
 * ARCHITECTURAL INVARIANTS:
 * - Head Office is OPTIONAL. Organizations may be structured directly as Org → School or Org → Region → School.
 * - organization_id is ALWAYS set server-side from the authenticated tenant context.
 * - Credentials are NOT stored here (belong strictly to identity_users).
 * - Deactivating a Head Office does not delete child regions or schools.
 */
export const headOffices = pgTable(
  'head_offices',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // ── Tenant anchor ────────────────────────────────────────────────
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // ── Hierarchy engine link ─────────────────────────────────────────
    hierarchyNodeId: uuid('hierarchy_node_id').notNull(),
    parentId: uuid('parent_id'), // Optional parent hierarchy node (e.g. org root)

    // ── Identity ──────────────────────────────────────────────────────
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    shortName: varchar('short_name', { length: 128 }),
    description: text('description'),

    // ── Administration & Leadership ───────────────────────────────────
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

    // ── Status & Audit ──────────────────────────────────────────────
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqHeadOfficeOrgCode: uniqueIndex('uq_head_office_org_code').on(t.organizationId, t.code),
    uqHeadOfficeOrgId: uniqueIndex('uq_head_office_org_id').on(t.organizationId, t.id),
  })
);
