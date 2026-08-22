import { pgTable, uuid, varchar, integer, boolean, timestamp, customType, unique, jsonb } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';

const ltree = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'ltree';
  },
});

export const hierarchyNodeTypes = pgTable(
  'hierarchy_node_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
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
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqNodeTypeOrgId: unique('uq_node_type_org_id').on(t.organizationId, t.id),
    uqNodeTypeOrgCode: unique('uq_node_type_org_code').on(t.organizationId, t.code),
  })
);

export const hierarchyNodes = pgTable(
  'hierarchy_nodes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    nodeTypeId: uuid('node_type_id').notNull(),
    parentId: uuid('parent_id'),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    path: ltree('path').notNull(),
    address: jsonb('address').default({}).notNull(),
    contactInfo: jsonb('contact_info').default({}).notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqNodesOrgId: unique('uq_nodes_org_id').on(t.organizationId, t.id),
    uqNodesOrgCode: unique('uq_nodes_org_code').on(t.organizationId, t.code),
  })
);
