import { pgTable, uuid, varchar, text, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

/**
 * School Types Master
 *
 * An organization-level configuration master defining the types of institutions
 * (e.g. K12, Primary, Secondary, College, University, Academy) that Schools can reference.
 *
 * SECURITY & ARCHITECTURAL INVARIANTS:
 * - organization_id is ALWAYS set server-side from the authenticated tenant context.
 * - Shared configuration master (not branch-owned).
 * - Code is unique per organization.
 * - Changing status or deactivating does NOT corrupt historical school records.
 */
export const schoolTypes = pgTable(
  'school_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqSchoolTypeOrgCode: uniqueIndex('uq_school_type_org_code').on(t.organizationId, t.code),
    uqSchoolTypeOrgId: uniqueIndex('uq_school_type_org_id').on(t.organizationId, t.id),
  })
);
