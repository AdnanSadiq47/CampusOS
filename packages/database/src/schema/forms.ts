import { pgTable, uuid, varchar, text, boolean, integer, jsonb, timestamp, uniqueIndex, foreignKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { entityDefinitions } from './entities.js';
import { identityUsers } from './identity.js';

export const formDefinitions = pgTable(
  'form_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    entityId: uuid('entity_id').notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_form_org_id').on(t.organizationId, t.id),
    uqOrgCode: uniqueIndex('uq_form_org_code').on(t.organizationId, t.code),
    fkEntity: foreignKey({
      columns: [t.organizationId, t.entityId],
      foreignColumns: [entityDefinitions.organizationId, entityDefinitions.id],
      name: 'fk_form_entity',
    }).onDelete('cascade'),
  })
);

export const formVersions = pgTable(
  'form_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    formId: uuid('form_id').notNull(),
    version: integer('version').notNull(),
    status: varchar('status', { length: 32 }).default('DRAFT').notNull(), // DRAFT, PUBLISHED, ARCHIVED
    schemaAst: jsonb('schema_ast').notNull(),
    rules: jsonb('rules').default([]).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    publishedBy: uuid('published_by').references(() => identityUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_form_version_org_id').on(t.organizationId, t.id),
    uqOrgFormVersion: uniqueIndex('uq_form_version_number').on(t.organizationId, t.formId, t.version),
    fkForm: foreignKey({
      columns: [t.organizationId, t.formId],
      foreignColumns: [formDefinitions.organizationId, formDefinitions.id],
      name: 'fk_form_versions_form',
    }).onDelete('cascade'),
  })
);
