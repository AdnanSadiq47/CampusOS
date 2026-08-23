import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { identityUsers } from './identity.js';

/**
 * 1. Form Definitions Table (with Governance Engine metadata)
 */
export const formDefinitions = pgTable(
  'form_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    entityId: uuid('entity_id'),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    formPurpose: varchar('form_purpose', { length: 64 }).default('PRE_REGISTRATION').notNull(), // PRE_REGISTRATION, ADMISSION, CUSTOM
    description: text('description'),
    ownerType: varchar('owner_type', { length: 32 }).default('SCHOOL').notNull(), // PLATFORM, HEAD_OFFICE, REGION, SCHOOL, CAMPUS
    ownerId: uuid('owner_id'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(), // ALL_CAMPUSES, SELECTED_CAMPUSES, LOCAL_SCOPE
    currentVersionId: uuid('current_version_id'),
    publishedVersionId: uuid('published_version_id'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_form_org_id').on(t.organizationId, t.id),
    uqOrgCode: uniqueIndex('uq_form_org_code').on(t.organizationId, t.code),
    idxOrgPurpose: index('idx_form_org_purpose').on(t.organizationId, t.formPurpose),
    idxOrgOwner: index('idx_form_org_owner').on(t.organizationId, t.ownerType, t.ownerId),
    idxOrgApplyTo: index('idx_form_org_apply_to').on(t.organizationId, t.applyTo),
  })
);

/**
 * 2. Form Versions Table (Immutable Versioned Schemas)
 */
export const formVersions = pgTable(
  'form_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    formDefinitionId: uuid('form_definition_id').notNull(),
    versionNumber: integer('version_number').default(1).notNull(),
    status: varchar('status', { length: 32 }).default('DRAFT').notNull(), // DRAFT, PUBLISHED, ARCHIVED
    schemaPayload: jsonb('schema_payload').notNull(), // Sections, controls, rules, settings
    changelogSummary: text('changelog_summary'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    publishedByUserId: uuid('published_by_user_id').references(() => identityUsers.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgId: uniqueIndex('uq_form_version_org_id').on(t.organizationId, t.id),
  })
);

/**
 * 3. Master & Custom Field Definitions Table
 */
export const fieldDefinitions = pgTable(
  'field_definitions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }), // Nullable for global platform catalog
    code: varchar('code', { length: 64 }).notNull(),
    canonicalKey: varchar('canonical_key', { length: 128 }), // Immutable concept identity across Pre-Reg and Admission
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 64 }).default('OTHER').notNull(),
    origin: varchar('origin', { length: 32 }).default('STANDARD').notNull(), // CANONICAL, STANDARD, CUSTOM
    dataType: varchar('data_type', { length: 64 }).default('TEXT').notNull(),
    masterBinding: varchar('master_binding', { length: 64 }), // COUNTRY, STATE, CITY, AREA, BOARD, etc.
    defaultLabel: varchar('default_label', { length: 255 }).notNull(),
    defaultPlaceholder: text('default_placeholder'),
    defaultHelpText: text('default_help_text'),
    defaultOptions: jsonb('default_options').default([]),
    defaultValidation: jsonb('default_validation').default({}),
    isSystemProtected: boolean('is_system_protected').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqFieldCode: uniqueIndex('uq_field_definition_code').on(t.organizationId, t.code),
    idxFieldCategory: index('idx_field_definition_category').on(t.organizationId, t.category),
    idxFieldCanonical: index('idx_field_definition_canonical').on(t.canonicalKey),
  })
);

/**
 * 4. Form Templates Table
 */
export const formTemplates = pgTable(
  'form_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }), // Nullable for system templates
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    formPurpose: varchar('form_purpose', { length: 64 }).default('PRE_REGISTRATION').notNull(),
    category: varchar('category', { length: 64 }).default('Standard').notNull(),
    icon: varchar('icon', { length: 64 }).default('📝').notNull(),
    description: text('description').notNull(),
    schemaPayload: jsonb('schema_payload').notNull(),
    isSystem: boolean('is_system').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqTemplateCode: uniqueIndex('uq_form_template_code').on(t.organizationId, t.code),
  })
);
