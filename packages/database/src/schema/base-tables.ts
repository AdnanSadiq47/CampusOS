import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  PgTableExtraConfig,
  PgColumnBuilderBase,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { schools } from './schools.js';
import { branches } from './branches.js';

/**
 * CampusOS — Base Schema Builders & Architecture Guardrails
 *
 * Enforces mandatory database ownership columns, foreign keys, and indexes
 * so developers cannot accidentally create un-anchored tables.
 */

// ── 1. TENANT_WIDE TABLE BUILDER ─────────────────────────────────────────────
/**
 * Creates a tenant-scoped table that enforces `organization_id NOT NULL REFERENCES organizations(id)`.
 */
export function tenantScopedTable<
  TName extends string,
  TColumns extends Record<string, PgColumnBuilderBase>
>(
  tableName: TName,
  columns: TColumns,
  extraConfig?: (self: any) => PgTableExtraConfig
) {
  const mergedColumns = {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    ...columns,
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  };

  return pgTable(tableName, mergedColumns, (t) => {
    const defaultIndexes: Record<string, any> = {
      [`idx_${tableName}_org`]: index(`idx_${tableName}_org`).on(t.organizationId),
    };
    if (extraConfig) {
      const userExtra = extraConfig(t);
      return { ...defaultIndexes, ...userExtra };
    }
    return defaultIndexes;
  });
}

// ── 2. CAMPUS_REQUIRED (TRANSACTIONAL) TABLE BUILDER ──────────────────────────
/**
 * Creates a campus-scoped transactional table that enforces:
 * - `organization_id NOT NULL REFERENCES organizations(id)`
 * - `school_id NOT NULL REFERENCES schools(id)`
 * - `campus_id NOT NULL REFERENCES branches(id)`
 * - Index on `(organization_id, campus_id)`
 * - Index on `(organization_id, school_id)`
 */
export function campusScopedTable<
  TName extends string,
  TColumns extends Record<string, PgColumnBuilderBase>
>(
  tableName: TName,
  columns: TColumns,
  extraConfig?: (self: any) => PgTableExtraConfig
) {
  const mergedColumns = {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    campusId: uuid('campus_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    ...columns,
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  };

  return pgTable(tableName, mergedColumns, (t) => {
    const defaultIndexes: Record<string, any> = {
      [`idx_${tableName}_org_campus`]: index(`idx_${tableName}_org_campus`).on(
        t.organizationId,
        t.campusId
      ),
      [`idx_${tableName}_org_school`]: index(`idx_${tableName}_org_school`).on(
        t.organizationId,
        t.schoolId
      ),
    };
    if (extraConfig) {
      const userExtra = extraConfig(t);
      return { ...defaultIndexes, ...userExtra };
    }
    return defaultIndexes;
  });
}

// ── 3. HIERARCHY_SCOPED CONFIGURATION TABLE BUILDER ──────────────────────────
/**
 * Creates a hierarchy-aware configuration master table that enforces:
 * - `organization_id NOT NULL REFERENCES organizations(id)`
 * - `owner_type NOT NULL` ('PLATFORM' | 'HEAD_OFFICE' | 'REGION' | 'SCHOOL' | 'CAMPUS')
 * - `owner_id` (polymorphic UUID)
 * - `apply_to NOT NULL` ('ALL_CAMPUSES' | 'SELECTED_CAMPUSES' | 'LOCAL_SCOPE')
 * - `is_active NOT NULL`
 * - Index on `(organization_id, owner_type, apply_to)`
 */
export function hierarchyScopedConfigTable<
  TName extends string,
  TColumns extends Record<string, PgColumnBuilderBase>
>(
  tableName: TName,
  columns: TColumns,
  extraConfig?: (self: any) => PgTableExtraConfig
) {
  const mergedColumns = {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    ownerType: varchar('owner_type', { length: 32 }).default('SCHOOL').notNull(),
    ownerId: uuid('owner_id'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(),
    ...columns,
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  };

  return pgTable(tableName, mergedColumns, (t) => {
    const defaultIndexes: Record<string, any> = {
      [`idx_${tableName}_gov`]: index(`idx_${tableName}_gov`).on(
        t.organizationId,
        t.ownerType,
        t.applyTo
      ),
    };
    if (extraConfig) {
      const userExtra = extraConfig(t);
      return { ...defaultIndexes, ...userExtra };
    }
    return defaultIndexes;
  });
}
