import { pgTable, uuid, varchar, boolean, integer, jsonb, timestamp, uniqueIndex, foreignKey, AnyPgColumn } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const navigationMenus = pgTable(
  'navigation_menus',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_nav_menu_org_id').on(t.organizationId, t.id),
    uqOrgCode: uniqueIndex('uq_nav_menu_code').on(t.organizationId, t.code),
  })
);

export const navigationItems = pgTable(
  'navigation_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    menuId: uuid('menu_id').notNull(),
    parentId: uuid('parent_id'),
    label: varchar('label', { length: 128 }).notNull(),
    icon: varchar('icon', { length: 64 }),
    routePath: varchar('route_path', { length: 255 }).notNull(),
    requiredModule: varchar('required_module', { length: 64 }),
    requiredPermissions: jsonb('required_permissions').default([]).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_nav_item_org_id').on(t.organizationId, t.id),
    fkMenu: foreignKey({
      columns: [t.organizationId, t.menuId],
      foreignColumns: [navigationMenus.organizationId, navigationMenus.id],
      name: 'fk_nav_items_menu',
    }).onDelete('cascade'),
    fkParent: foreignKey({
      columns: [t.organizationId, t.parentId as AnyPgColumn],
      foreignColumns: [t.organizationId, t.id],
      name: 'fk_nav_items_parent',
    }).onDelete('cascade'),
  })
);
