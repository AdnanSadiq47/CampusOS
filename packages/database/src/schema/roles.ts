import { pgTable, uuid, varchar, boolean, timestamp, jsonb, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    description: varchar('description', { length: 500 }),
    isSystem: boolean('is_system').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqRolesOrgId: unique('uq_roles_org_id').on(t.organizationId, t.id),
    uqRolesOrgCode: unique('uq_roles_org_code').on(t.organizationId, t.code),
  })
);

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  moduleCode: varchar('module_code', { length: 64 }).notNull(),
  entityCode: varchar('entity_code', { length: 64 }).notNull(),
  action: varchar('action', { length: 32 }).notNull(),
  effect: varchar('effect', { length: 16 }).default('ALLOW').notNull(), // ALLOW, DENY
  dataScope: varchar('data_scope', { length: 32 }).default('HIERARCHY_SUBTREE').notNull(),
  fieldRules: jsonb('field_rules').default([]).notNull(),
  conditions: jsonb('conditions').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
