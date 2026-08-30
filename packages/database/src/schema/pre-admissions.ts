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
import { schools } from './schools.js';
import { branches } from './branches.js';

/**
 * Pre-Admissions Schema
 *
 * Operational / Transactional Entity for Pre-Admission Applications.
 * ScopeMode: CAMPUS_REQUIRED
 *
 * Invariants:
 * - organization_id NOT NULL (Tenant isolation)
 * - school_id NOT NULL (Parent school ownership)
 * - campus_id NOT NULL (Physical campus branch ownership)
 * - application_number UNIQUE per organization
 * - original_submission_snapshot stores immutable historical submission truth
 */
export const preAdmissions = pgTable(
  'pre_admissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // ── Mandatory Ownership Anchors (CAMPUS_REQUIRED) ───────────────
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    campusId: uuid('campus_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),

    // ── Application Identifiers ─────────────────────────────────────
    applicationNumber: varchar('application_number', { length: 64 }).notNull(),

    // ── Academic Master References ──────────────────────────────────
    academicYearId: varchar('academic_year_id', { length: 128 }).notNull(),
    academicYearName: varchar('academic_year_name', { length: 255 }),
    classId: varchar('class_id', { length: 128 }).notNull(),
    className: varchar('class_name', { length: 255 }),
    boardId: varchar('board_id', { length: 128 }),
    boardName: varchar('board_name', { length: 255 }),

    // ── Dynamic Form Reference ──────────────────────────────────────
    formDefinitionId: varchar('form_definition_id', { length: 128 }).notNull(),
    formName: varchar('form_name', { length: 255 }),
    publishedFormVersionId: varchar('published_form_version_id', { length: 128 }),
    formVersionNumber: integer('form_version_number').default(1),

    // ── Canonical Applicant Details ─────────────────────────────────
    studentName: varchar('student_name', { length: 255 }).notNull(),
    gender: varchar('gender', { length: 16 }).default('MALE').notNull(),
    dateOfBirth: varchar('date_of_birth', { length: 32 }).notNull(), // YYYY-MM-DD
    fatherOrGuardianName: varchar('father_or_guardian_name', { length: 255 }).notNull(),
    fatherCnic: varchar('father_cnic', { length: 32 }),
    primaryMobile: varchar('primary_mobile', { length: 32 }).notNull(),
    primaryEmail: varchar('primary_email', { length: 255 }),

    // ── Operational Lifecycle & Verification ─────────────────────────
    source: varchar('source', { length: 32 }).default('ONLINE').notNull(),
    status: varchar('status', { length: 32 }).default('SUBMITTED').notNull(), // DRAFT, SUBMITTED, IN_PROGRESS, ON_HOLD, APPROVED, REJECTED, CANCELLED, COMPLETED
    verificationStatus: varchar('verification_status', { length: 32 }).default('UNVERIFIED').notNull(), // UNVERIFIED, AUTO_VERIFIED, STAFF_VERIFIED, NEEDS_REVIEW, POSSIBLE_DUPLICATE, INVALID, REJECTED
    verifiedBy: varchar('verified_by', { length: 255 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verificationMethod: varchar('verification_method', { length: 32 }), // AUTO, STAFF, OVERRIDE
    verificationOverrideReason: text('verification_override_reason'),
    verificationIssues: jsonb('verification_issues').default([]).notNull(),
    isCorrected: boolean('is_corrected').default(false).notNull(),

    // ── Submitted Data & Immutable Snapshot ─────────────────────────
    submissionData: jsonb('submission_data').default({}).notNull(),
    originalSubmissionSnapshot: jsonb('original_submission_snapshot').default({}).notNull(),
    customFieldsData: jsonb('custom_fields_data').default({}).notNull(),

    // ── Admission Process & Journey Integration ─────────────────────
    processDefinitionId: varchar('process_definition_id', { length: 128 }),
    processName: varchar('process_name', { length: 255 }),
    processVersionId: varchar('process_version_id', { length: 128 }),
    processVersionNumber: integer('process_version_number'),
    currentStepId: varchar('current_step_id', { length: 128 }),
    currentStepName: varchar('current_step_name', { length: 255 }),
    currentStepType: varchar('current_step_type', { length: 64 }),
    journeyStatus: varchar('journey_status', { length: 32 }).default('NO_PROCESS').notNull(), // NO_PROCESS, IN_PROGRESS, COMPLETED, HELD, CANCELLED
    journeyData: jsonb('journey_data'),

    // ── Submission Metadata & Audit ──────────────────────────────────
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
    submittedByUserId: uuid('submitted_by_user_id'),
    submittedByRole: varchar('submitted_by_role', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqAppNumberOrg: uniqueIndex('uq_preadmission_org_app_no').on(
      t.organizationId,
      t.applicationNumber
    ),
    idxPreAdmOrgCampus: index('idx_preadmission_org_campus').on(t.organizationId, t.campusId),
    idxPreAdmOrgCampusSubmitted: index('idx_preadmission_org_campus_submitted').on(
      t.organizationId,
      t.campusId,
      t.submittedAt
    ),
    idxPreAdmOrgCampusStatus: index('idx_preadmission_org_campus_status').on(
      t.organizationId,
      t.campusId,
      t.status
    ),
    idxPreAdmOrgSchool: index('idx_preadmission_org_school').on(t.organizationId, t.schoolId),
    idxPreAdmOrgStatus: index('idx_preadmission_org_status').on(t.organizationId, t.status),
    idxPreAdmOrgVerStatus: index('idx_preadmission_org_ver_status').on(
      t.organizationId,
      t.verificationStatus
    ),
    idxPreAdmOrgClassYear: index('idx_preadmission_org_class_year').on(
      t.organizationId,
      t.classId,
      t.academicYearId
    ),
    idxPreAdmOrgMobile: index('idx_preadmission_org_mobile').on(
      t.organizationId,
      t.primaryMobile
    ),
    idxPreAdmOrgCnic: index('idx_preadmission_org_cnic').on(
      t.organizationId,
      t.fatherCnic
    ),
  })
);

/**
 * Pre-Admissions Dynamic List View Configs Table
 */
export const preAdmissionsListViewConfigs = pgTable(
  'pre_admissions_list_view_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: varchar('user_id', { length: 128 }).notNull(),
    viewKey: varchar('view_key', { length: 64 }).default('DEFAULT').notNull(),
    columnsConfig: jsonb('columns_config').notNull(),
    rowsPerPage: integer('rows_per_page').default(25).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uqOrgUserView: uniqueIndex('uq_preadmission_view_config').on(
      t.organizationId,
      t.userId,
      t.viewKey
    ),
  })
);

/**
 * Pre-Admission Uploaded Documents Table
 * Stores metadata and secure storage references for Application Review documents.
 */
export const preAdmissionDocuments = pgTable(
  'pre_admission_documents',
  {
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
    applicationId: uuid('application_id')
      .notNull()
      .references(() => preAdmissions.id, { onDelete: 'cascade' }),
    documentCode: varchar('document_code', { length: 64 }).notNull(),
    documentName: varchar('document_name', { length: 255 }).notNull(),
    fileKey: varchar('file_key', { length: 512 }).notNull(),
    fileUrl: varchar('file_url', { length: 512 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileSize: integer('file_size').default(0).notNull(),
    mimeType: varchar('mime_type', { length: 128 }).default('application/octet-stream').notNull(),
    isRequired: boolean('is_required').default(true).notNull(),
    systemVerificationStatus: varchar('system_verification_status', { length: 32 }).default('PENDING').notNull(),
    systemCheckRemarks: text('system_check_remarks'),
    extractedData: jsonb('extracted_data'),
    staffVerificationStatus: varchar('staff_verification_status', { length: 32 }).default('UNVERIFIED').notNull(),
    staffNotes: text('staff_notes'),
    overrideReason: text('override_reason'),
    verifiedBy: varchar('verified_by', { length: 255 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxDocOrgApp: index('idx_preadm_doc_org_app').on(t.organizationId, t.applicationId),
    idxDocOrgCampusStaffStatus: index('idx_preadm_doc_org_campus_status').on(t.organizationId, t.campusId, t.staffVerificationStatus),
  })
);

/**
 * Pre-Admission Application Fee Payments Table
 * Tracks dynamic per-school Application Fee processing and reconciliation.
 */
export const preAdmissionFeePayments = pgTable(
  'pre_admission_fee_payments',
  {
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
    applicationId: uuid('application_id')
      .notNull()
      .references(() => preAdmissions.id, { onDelete: 'cascade' }),
    feeName: varchar('fee_name', { length: 255 }).default('Application Processing Fee').notNull(),
    amount: integer('amount').default(0).notNull(),
    currency: varchar('currency', { length: 16 }).default('PKR').notNull(),
    collectionRule: varchar('collection_rule', { length: 64 }).default('PAYMENT_REQUIRED_BEFORE_TEST').notNull(),
    paymentStatus: varchar('payment_status', { length: 32 }).default('PENDING').notNull(),
    paymentMethod: varchar('payment_method', { length: 64 }),
    transactionReference: varchar('transaction_reference', { length: 128 }),
    voucherReference: varchar('voucher_reference', { length: 128 }),
    paymentDate: varchar('payment_date', { length: 32 }),
    receiptFileUrl: varchar('receipt_file_url', { length: 512 }),
    payerName: varchar('payer_name', { length: 255 }),
    payerMobile: varchar('payer_mobile', { length: 32 }),
    verifiedBy: varchar('verified_by', { length: 255 }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verificationNotes: text('verification_notes'),
    waiverReason: text('waiver_reason'),
    waivedBy: varchar('waived_by', { length: 255 }),
    waivedAt: timestamp('waived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxFeeOrgApp: index('idx_preadm_fee_org_app').on(t.organizationId, t.applicationId),
    idxFeeOrgTxRef: index('idx_preadm_fee_org_tx').on(t.organizationId, t.transactionReference),
    idxFeeOrgVchRef: index('idx_preadm_fee_org_vch').on(t.organizationId, t.voucherReference),
    idxFeeOrgCampusStatus: index('idx_preadm_fee_org_campus_status').on(t.organizationId, t.campusId, t.paymentStatus),
  })
);

/**
 * Application Fee Rules Table
 * Defines dynamic multi-campus, multi-class Application Fee policies and collection rules.
 */
export const applicationFeeRules = pgTable(
  'application_fee_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    schoolId: uuid('school_id')
      .references(() => schools.id, { onDelete: 'cascade' }),
    academicYearId: varchar('academic_year_id', { length: 64 }).notNull(),
    campusIds: jsonb('campus_ids').default([]).notNull(),
    classIds: jsonb('class_ids').default([]).notNull(),
    feeAmount: integer('fee_amount').default(0).notNull(),
    currency: varchar('currency', { length: 16 }).default('PKR').notNull(),
    instructions: text('instructions').default('').notNull(),
    bankDetails: jsonb('bank_details'),
    mobileWalletDetails: jsonb('mobile_wallet_details'),
    collectionRule: varchar('collection_rule', { length: 64 }).default('PAYMENT_REQUIRED_BEFORE_TEST').notNull(),
    feeNotRequired: boolean('fee_not_required').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    effectiveFrom: timestamp('effective_from', { withTimezone: true }),
    effectiveTo: timestamp('effective_to', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    idxFeeRuleOrg: index('idx_fee_rule_org').on(t.organizationId),
    idxFeeRuleOrgYear: index('idx_fee_rule_org_year').on(t.organizationId, t.academicYearId),
  })
);


