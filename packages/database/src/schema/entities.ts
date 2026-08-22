import { pgTable, uuid, varchar, text, boolean, integer, jsonb, timestamp, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { hierarchyNodes } from './hierarchy.js';
import { identityUsers } from './identity.js';

export const entityDefinitions = pgTable(
  'entity_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_entity_org_id').on(t.organizationId, t.id),
    uqOrgCode: uniqueIndex('uq_entity_org_code').on(t.organizationId, t.code),
  })
);

export const entityFields = pgTable(
  'entity_fields',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    entityId: uuid('entity_id').notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    fieldType: varchar('field_type', { length: 32 }).notNull(), // TEXT, NUMBER, DECIMAL, BOOLEAN, DATE, DATETIME, SELECT, MULTI_SELECT, REFERENCE, FILE, JSON
    isRequired: boolean('is_required').default(false).notNull(),
    isUnique: boolean('is_unique').default(false).notNull(),
    isSearchable: boolean('is_searchable').default(false).notNull(),
    defaultValue: jsonb('default_value'),
    validationRules: jsonb('validation_rules').default({}).notNull(),
    options: jsonb('options').default([]).notNull(),
    referenceEntityId: uuid('reference_entity_id'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_entity_field_org_id').on(t.organizationId, t.id),
    uqOrgEntityCode: uniqueIndex('uq_entity_field_code').on(t.organizationId, t.entityId, t.code),
    fkEntity: foreignKey({
      columns: [t.organizationId, t.entityId],
      foreignColumns: [entityDefinitions.organizationId, entityDefinitions.id],
      name: 'fk_entity_fields_entity',
    }).onDelete('cascade'),
  })
);

export const entityRecords = pgTable(
  'entity_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    entityId: uuid('entity_id').notNull(),
    hierarchyNodeId: uuid('hierarchy_node_id').notNull(),
    data: jsonb('data').default({}).notNull(),
    createdBy: uuid('created_by').references(() => identityUsers.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => identityUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_entity_record_org_id').on(t.organizationId, t.id),
    fkEntity: foreignKey({
      columns: [t.organizationId, t.entityId],
      foreignColumns: [entityDefinitions.organizationId, entityDefinitions.id],
      name: 'fk_entity_records_entity',
    }).onDelete('cascade'),
    fkNode: foreignKey({
      columns: [t.organizationId, t.hierarchyNodeId],
      foreignColumns: [hierarchyNodes.organizationId, hierarchyNodes.id],
      name: 'fk_entity_records_node',
    }).onDelete('restrict'),
  })
);
