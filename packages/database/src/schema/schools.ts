import { pgTable, uuid, varchar, text, boolean, timestamp, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { hierarchyNodes } from './hierarchy.js';

export const schools = pgTable(
  'schools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    hierarchyNodeId: uuid('hierarchy_node_id').notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    parentId: uuid('parent_id').notNull(), // Parent Hierarchy Node (Head Office or Region)
    schoolType: varchar('school_type', { length: 64 }).default('K12'), // PRIMARY, SECONDARY, HIGHER_SECONDARY, K12, COMPREHENSIVE, OTHER
    registrationNumber: varchar('registration_number', { length: 128 }),
    educationBoard: varchar('education_board', { length: 128 }),
    principalName: varchar('principal_name', { length: 255 }),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 64 }),
    alternatePhone: varchar('alternate_phone', { length: 64 }),
    address: text('address'),
    area: varchar('area', { length: 128 }),
    city: varchar('city', { length: 128 }),
    province: varchar('province', { length: 128 }),
    postalCode: varchar('postal_code', { length: 32 }),
    website: varchar('website', { length: 255 }),
    logoUrl: text('logo_url'),
    customDomain: varchar('custom_domain', { length: 255 }),
    defaultLanguage: varchar('default_language', { length: 32 }).default('en').notNull(),
    timezone: varchar('timezone', { length: 64 }).default('UTC').notNull(),
    currency: varchar('currency', { length: 16 }).default('PKR').notNull(),
    notes: text('notes'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqSchoolOrgId: uniqueIndex('uq_school_org_id').on(t.organizationId, t.id),
    uqSchoolOrgCode: uniqueIndex('uq_school_org_code').on(t.organizationId, t.code),
    fkSchoolHierarchyNode: foreignKey({
      columns: [t.organizationId, t.hierarchyNodeId],
      foreignColumns: [hierarchyNodes.organizationId, hierarchyNodes.id],
      name: 'fk_school_hierarchy_node',
    }).onDelete('cascade'),
    fkSchoolParentNode: foreignKey({
      columns: [t.organizationId, t.parentId],
      foreignColumns: [hierarchyNodes.organizationId, hierarchyNodes.id],
      name: 'fk_school_parent_node',
    }),
  })
);
