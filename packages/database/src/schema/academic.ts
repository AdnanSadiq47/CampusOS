import { pgTable, uuid, varchar, text, boolean, integer, timestamp, date, numeric, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.js';
import { branches } from './branches.js';

// ── 0. REUSABLE CONFIGURATION SCOPE JUNCTION (Selected Campuses) ──────────────
export const configScopeBranches = pgTable(
  'config_scope_branches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 64 }).notNull(), // 'academic_year' | 'board' | 'academic_level' | 'subject' | 'class' | 'section' | 'language'
    entityId: uuid('entity_id').notNull(),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqScopeOrgEntityBranch: uniqueIndex('uq_scope_org_entity_branch').on(
      t.organizationId,
      t.entityType,
      t.entityId,
      t.branchId
    ),
    idxScopeLookup: index('idx_scope_lookup').on(t.organizationId, t.entityType, t.entityId),
    idxScopeBranch: index('idx_scope_branch').on(t.organizationId, t.branchId, t.entityType),
  })
);

// ── 1. ACADEMIC YEARS MASTER ──────────────────────────────────────────────────
export const academicYears = pgTable(
  'academic_years',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 64 }).notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    isCurrent: boolean('is_current').default(false).notNull(),
    sortOrder: integer('sort_order').default(1).notNull(),
    description: text('description'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(), // 'ALL_CAMPUSES' | 'SELECTED_CAMPUSES'
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqAcademicYearOrgCode: uniqueIndex('uq_academic_year_org_code').on(t.organizationId, t.code),
    idxAcademicYearOrgOrder: index('idx_academic_year_org_order').on(t.organizationId, t.sortOrder, t.name),
  })
);

// ── 2. BOARDS MASTER ─────────────────────────────────────────────────────────
export const boards = pgTable(
  'boards',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    shortName: varchar('short_name', { length: 64 }).notNull(),
    code: varchar('code', { length: 64 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    description: text('description'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqBoardOrgName: uniqueIndex('uq_board_org_name').on(t.organizationId, t.name),
    idxBoardOrgOrder: index('idx_board_org_order').on(t.organizationId, t.sortOrder, t.name),
  })
);

// ── 3. ACADEMIC LEVELS / STAGES MASTER ────────────────────────────────────────
export const academicLevels = pgTable(
  'academic_levels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    shortName: varchar('short_name', { length: 64 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    description: text('description'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqAcademicLevelOrgName: uniqueIndex('uq_academic_level_org_name').on(t.organizationId, t.name),
    idxAcademicLevelOrgOrder: index('idx_academic_level_org_order').on(t.organizationId, t.sortOrder, t.name),
  })
);

// ── 4. SUBJECTS MASTER ────────────────────────────────────────────────────────
export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    shortName: varchar('short_name', { length: 64 }),
    code: varchar('code', { length: 64 }),
    type: varchar('type', { length: 64 }).default('Theory').notNull(), // 'Theory' | 'Practical' | 'Theory + Practical' | 'Activity'
    category: varchar('category', { length: 64 }).default('Core').notNull(), // 'Core' | 'Elective' | 'Language' | 'Science' | 'Commerce' | 'Arts' | 'Lab' | 'Activity' | 'Other'
    defaultMaxMarks: numeric('default_max_marks', { precision: 6, scale: 2 }),
    defaultPassingMarks: numeric('default_passing_marks', { precision: 6, scale: 2 }),
    hasPractical: boolean('has_practical').default(false).notNull(),
    practicalMaxMarks: numeric('practical_max_marks', { precision: 6, scale: 2 }),
    creditWeight: numeric('credit_weight', { precision: 4, scale: 2 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    description: text('description'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqSubjectOrgName: uniqueIndex('uq_subject_org_name').on(t.organizationId, t.name),
    idxSubjectOrgOrder: index('idx_subject_org_order').on(t.organizationId, t.sortOrder, t.name),
  })
);

// ── 5. CLASSES / GRADES MASTER ────────────────────────────────────────────────
export const classes = pgTable(
  'classes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    levelId: uuid('level_id')
      .notNull()
      .references(() => academicLevels.id, { onDelete: 'restrict' }),
    name: varchar('name', { length: 255 }).notNull(),
    shortName: varchar('short_name', { length: 64 }),
    code: varchar('code', { length: 64 }),
    fromAge: numeric('from_age', { precision: 4, scale: 1 }),
    toAge: numeric('to_age', { precision: 4, scale: 1 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    description: text('description'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqClassOrgName: uniqueIndex('uq_class_org_name').on(t.organizationId, t.name),
    idxClassOrgLevel: index('idx_class_org_level').on(t.organizationId, t.levelId, t.sortOrder, t.name),
  })
);

// ── 5B. CLASS SUBJECT MAPPINGS (Compulsory & Optional Default Mappings) ────────
export const classSubjectMappings = pgTable(
  'class_subject_mappings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id')
      .notNull()
      .references(() => subjects.id, { onDelete: 'cascade' }),
    isCompulsory: boolean('is_compulsory').default(true).notNull(), // true = Compulsory, false = Optional
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqClassSubject: uniqueIndex('uq_class_subject').on(t.organizationId, t.classId, t.subjectId),
    idxClassSubjectClass: index('idx_class_subject_class').on(t.organizationId, t.classId),
  })
);

// ── 6. SECTIONS MASTER ────────────────────────────────────────────────────────
export const sections = pgTable(
  'sections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 64 }).notNull(),
    sortOrder: integer('sort_order').default(1).notNull(),
    description: text('description'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqSectionOrgName: uniqueIndex('uq_section_org_name').on(t.organizationId, t.name),
    idxSectionOrgOrder: index('idx_section_org_order').on(t.organizationId, t.sortOrder, t.name),
  })
);

// ── 7. LANGUAGES MASTER ───────────────────────────────────────────────────────
export const languages = pgTable(
  'languages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 64 }),
    sortOrder: integer('sort_order').default(1).notNull(),
    description: text('description'),
    applyTo: varchar('apply_to', { length: 32 }).default('ALL_CAMPUSES').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqLanguageOrgName: uniqueIndex('uq_language_org_name').on(t.organizationId, t.name),
    idxLanguageOrgOrder: index('idx_language_org_order').on(t.organizationId, t.sortOrder, t.name),
  })
);
