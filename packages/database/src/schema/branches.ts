import { pgTable, uuid, varchar, text, boolean, timestamp, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { hierarchyNodes } from './hierarchy.js';
import { schools } from './schools.js';

/**
 * Branches / Campuses Schema
 *
 * A Branch is a physical or operational campus location belonging to a School.
 * Organization / Network → [Head Office - OPTIONAL] → [Region - OPTIONAL] → School → Branch
 *
 * Each Branch creates and stays linked to a hierarchy_nodes entry of configurable type BRANCH / CAMPUS.
 * Tenant isolation is enforced via composite (organization_id, id) foreign key convention
 * and PostgreSQL RLS policies.
 *
 * ARCHITECTURAL INVARIANTS:
 * - Every Branch belongs to a School (school_id).
 * - A School can have multiple Branches.
 * - Credentials are NOT stored on this record (provisioned via identity_users -> membership_node_assignments).
 * - organization_id is ALWAYS set server-side from the authenticated tenant context.
 */
export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ── Tenant anchor ────────────────────────────────────────────────
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // ── Hierarchy engine link ─────────────────────────────────────────
    hierarchyNodeId: uuid('hierarchy_node_id').notNull(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),

    // ── Identity ──────────────────────────────────────────────────────
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    shortName: varchar('short_name', { length: 128 }),
    description: text('description'),

    // ── Branding ──────────────────────────────────────────────────────
    logoUrl: text('logo_url'),

    // ── Contact Information ───────────────────────────────────────────
    phone: varchar('phone', { length: 64 }),
    alternatePhone: varchar('alternate_phone', { length: 64 }),
    email: varchar('email', { length: 255 }),
    website: varchar('website', { length: 255 }),

    // ── Location & Geography ──────────────────────────────────────────
    country: varchar('country', { length: 128 }).default('Pakistan'),
    province: varchar('province', { length: 128 }),
    city: varchar('city', { length: 128 }),
    area: varchar('area', { length: 128 }),
    address: text('address'),
    postalCode: varchar('postal_code', { length: 32 }),

    // ── Configuration ─────────────────────────────────────────────────
    notes: text('notes'),

    // ── Status ────────────────────────────────────────────────────────
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqBranchOrgId: uniqueIndex('uq_branch_org_id').on(t.organizationId, t.id),
    uqBranchOrgCode: uniqueIndex('uq_branch_org_code').on(t.organizationId, t.code),
    fkBranchHierarchyNode: foreignKey({
      columns: [t.organizationId, t.hierarchyNodeId],
      foreignColumns: [hierarchyNodes.organizationId, hierarchyNodes.id],
      name: 'fk_branch_hierarchy_node',
    }).onDelete('cascade'),
  })
);
