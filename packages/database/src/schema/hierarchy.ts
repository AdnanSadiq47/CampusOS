import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb, unique, customType, AnyPgColumn } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

export const customLtree = customType<{ data: string }>({
  dataType() {
    return 'ltree';
  },
});

export const hierarchyNodeTypes = pgTable(
  'hierarchy_node_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    levelOrder: integer('level_order').notNull(),
    allowFinancialPosting: boolean('allow_financial_posting').default(true).notNull(),
    allowUserAssignment: boolean('allow_user_assignment').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgCodeUnique: unique('hierarchy_node_types_org_code_unique').on(table.organizationId, table.code),
  })
);

export const hierarchyNodes = pgTable(
  'hierarchy_nodes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    nodeTypeId: uuid('node_type_id')
      .notNull()
      .references(() => hierarchyNodeTypes.id, { onDelete: 'restrict' }),
    parentId: uuid('parent_id').references((): AnyPgColumn => hierarchyNodes.id, { onDelete: 'restrict' }),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    path: customLtree('path').notNull(),
    address: jsonb('address').default({}).notNull(),
    contactInfo: jsonb('contact_info').default({}).notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgCodeUnique: unique('hierarchy_nodes_org_code_unique').on(table.organizationId, table.code),
  })
);
