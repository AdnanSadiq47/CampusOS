-- ==============================================================================
-- Migration 0003: Reconcile Authoritative Drizzle Schema
-- ==============================================================================
-- Dual-Target Forward Migration:
-- 1. Fresh database path: (0000 -> 0001 -> 0002 -> 0003) creates all 25 remaining
--    authoritative Drizzle tables with exact data types, constraints, and RLS.
-- 2. Legacy database path: Reconciles pre-existing bootstrap tables with
--    deterministic catalog checks, adding canonical geography columns and FKs.
-- ==============================================================================

-- ── 1. Shared Reference Geography Masters (L2) ──────────────────────────────

CREATE TABLE IF NOT EXISTS "countries" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "iso2" varchar(2) NOT NULL,
    "iso3" varchar(3),
    "numeric_code" varchar(10),
    "dial_code" varchar(16),
    "currency_code" varchar(10),
    "currency_symbol" varchar(10),
    "nationality" varchar(100),
    "sort_order" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "states" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "country_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "code" varchar(64),
    "type" varchar(64) DEFAULT 'Province' NOT NULL,
    "sort_order" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "cities" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "country_id" uuid NOT NULL,
    "state_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "code" varchar(64),
    "sort_order" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "areas" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "country_id" uuid NOT NULL,
    "state_id" uuid NOT NULL,
    "city_id" uuid NOT NULL,
    "name" varchar(255) NOT NULL,
    "code" varchar(64),
    "postal_code" varchar(32),
    "sort_order" integer DEFAULT 1 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ── 2. Organizational Hierarchy Operational Entities (L3) ───────────────────

CREATE TABLE IF NOT EXISTS "head_offices" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "hierarchy_node_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(255) NOT NULL,
    "short_name" varchar(128),
    "description" text,
    "logo_url" text,
    "phone" varchar(64),
    "email" varchar(255),
    "website" varchar(255),
    "tax_identifier" varchar(64),
    "country" varchar(128) DEFAULT 'Pakistan',
    "province" varchar(128),
    "city" varchar(128),
    "area" varchar(128),
    "address" text,
    "postal_code" varchar(32),
    "country_id" uuid,
    "state_id" uuid,
    "city_id" uuid,
    "area_id" uuid,
    "notes" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "regions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "hierarchy_node_id" uuid NOT NULL,
    "parent_id" uuid,
    "head_office_id" uuid,
    "code" varchar(64) NOT NULL,
    "name" varchar(255) NOT NULL,
    "short_name" varchar(128),
    "description" text,
    "country" varchar(128) DEFAULT 'Pakistan',
    "province" varchar(128),
    "city" varchar(128),
    "area" varchar(128),
    "address" text,
    "postal_code" varchar(32),
    "country_id" uuid,
    "state_id" uuid,
    "city_id" uuid,
    "area_id" uuid,
    "notes" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "schools" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "hierarchy_node_id" uuid NOT NULL,
    "parent_id" uuid NOT NULL,
    "head_office_id" uuid,
    "region_id" uuid,
    "code" varchar(64) NOT NULL,
    "name" varchar(255) NOT NULL,
    "short_name" varchar(128),
    "description" text,
    "school_type" varchar(64) DEFAULT 'K12',
    "registration_number" varchar(128),
    "education_board" varchar(128),
    "principal_name" varchar(255),
    "email" varchar(255),
    "phone" varchar(64),
    "alternate_phone" varchar(64),
    "address" text,
    "area" varchar(128),
    "city" varchar(128),
    "province" varchar(128),
    "country" varchar(128) DEFAULT 'Pakistan',
    "postal_code" varchar(32),
    "country_id" uuid,
    "state_id" uuid,
    "city_id" uuid,
    "area_id" uuid,
    "website" varchar(255),
    "website_url" varchar(255),
    "facebook_url" varchar(255),
    "linkedin_url" varchar(255),
    "whatsapp_number" varchar(64),
    "logo_url" text,
    "custom_domain" varchar(255),
    "default_language" varchar(32) DEFAULT 'en' NOT NULL,
    "timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
    "currency" varchar(16) DEFAULT 'PKR' NOT NULL,
    "notes" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "branches" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "hierarchy_node_id" uuid NOT NULL,
    "school_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(255) NOT NULL,
    "short_name" varchar(128),
    "description" text,
    "logo_url" text,
    "phone" varchar(64),
    "alternate_phone" varchar(64),
    "email" varchar(255),
    "website" varchar(255),
    "country" varchar(128) DEFAULT 'Pakistan',
    "province" varchar(128),
    "city" varchar(128),
    "area" varchar(128),
    "address" text,
    "postal_code" varchar(32),
    "country_id" uuid,
    "state_id" uuid,
    "city_id" uuid,
    "area_id" uuid,
    "sort_order" integer DEFAULT 1 NOT NULL,
    "notes" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_by" uuid,
    "updated_by" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ── 3. Academic Structure Masters (L6) ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "academic_years" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "is_current" boolean DEFAULT false NOT NULL,
    "is_closed" boolean DEFAULT false NOT NULL,
    "scope_type" varchar(32) DEFAULT 'ORGANIZATION' NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "boards" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "description" text,
    "scope_type" varchar(32) DEFAULT 'ORGANIZATION' NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "academic_levels" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "description" text,
    "scope_type" varchar(32) DEFAULT 'ORGANIZATION' NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "subjects" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "subject_type" varchar(32) DEFAULT 'CORE' NOT NULL,
    "description" text,
    "scope_type" varchar(32) DEFAULT 'ORGANIZATION' NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "classes" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "academic_level_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "description" text,
    "scope_type" varchar(32) DEFAULT 'ORGANIZATION' NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "class_subject_mappings" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "class_id" uuid NOT NULL,
    "subject_id" uuid NOT NULL,
    "is_compulsory" boolean DEFAULT true NOT NULL,
    "credit_hours" integer DEFAULT 1 NOT NULL,
    "max_marks" integer DEFAULT 100 NOT NULL,
    "pass_marks" integer DEFAULT 40 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sections" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "branch_id" uuid NOT NULL,
    "class_id" uuid NOT NULL,
    "academic_year_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "capacity" integer DEFAULT 30 NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "languages" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "native_name" varchar(128),
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "config_scope_branches" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "entity_type" varchar(64) NOT NULL,
    "entity_id" uuid NOT NULL,
    "branch_id" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ── 4. Dynamic Forms Library & Display Preferences (L7) ─────────────────────

CREATE TABLE IF NOT EXISTS "field_definitions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "field_type" varchar(32) NOT NULL,
    "is_required" boolean DEFAULT false NOT NULL,
    "is_searchable" boolean DEFAULT false NOT NULL,
    "options" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "validation_rules" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "form_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "code" varchar(64) NOT NULL,
    "name" varchar(128) NOT NULL,
    "description" text,
    "template_type" varchar(64) NOT NULL,
    "schema_ast" jsonb NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "display_preferences" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "entity_type" varchar(64) NOT NULL,
    "entity_id" uuid NOT NULL,
    "date_format" varchar(32) DEFAULT 'YYYY-MM-DD' NOT NULL,
    "time_format" varchar(32) DEFAULT '24h' NOT NULL,
    "timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
    "currency_symbol_position" varchar(16) DEFAULT 'BEFORE' NOT NULL,
    "academic_year_display" varchar(32) DEFAULT 'CODE' NOT NULL,
    "student_id_format" varchar(64) DEFAULT 'AUTO' NOT NULL,
    "employee_id_format" varchar(64) DEFAULT 'AUTO' NOT NULL,
    "primary_color" varchar(32) DEFAULT '#3B82F6' NOT NULL,
    "accent_color" varchar(32) DEFAULT '#10B981' NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ── 5. Admissions Subsystem (L9) ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "pre_admissions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "school_id" uuid NOT NULL,
    "campus_id" uuid NOT NULL,
    "application_number" varchar(64) NOT NULL,
    "academic_year_id" varchar(128) NOT NULL,
    "academic_year_name" varchar(255),
    "class_id" varchar(128) NOT NULL,
    "class_name" varchar(255),
    "board_id" varchar(128),
    "board_name" varchar(255),
    "form_definition_id" varchar(128) NOT NULL,
    "form_name" varchar(255),
    "published_form_version_id" varchar(128),
    "form_version_number" integer DEFAULT 1,
    "student_name" varchar(255) NOT NULL,
    "gender" varchar(16) DEFAULT 'MALE' NOT NULL,
    "date_of_birth" varchar(32) NOT NULL,
    "father_or_guardian_name" varchar(255) NOT NULL,
    "father_cnic" varchar(32),
    "primary_mobile" varchar(32) NOT NULL,
    "primary_email" varchar(255),
    "source" varchar(32) DEFAULT 'ONLINE' NOT NULL,
    "status" varchar(32) DEFAULT 'SUBMITTED' NOT NULL,
    "verification_status" varchar(32) DEFAULT 'UNVERIFIED' NOT NULL,
    "verified_by" varchar(255),
    "verified_at" timestamp with time zone,
    "verification_method" varchar(32),
    "verification_override_reason" text,
    "verification_issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "is_corrected" boolean DEFAULT false NOT NULL,
    "submission_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "original_submission_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "custom_fields_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
    "process_definition_id" varchar(128),
    "process_name" varchar(255),
    "process_version_id" varchar(128),
    "process_version_number" integer,
    "current_step_id" varchar(128),
    "current_step_name" varchar(255),
    "current_step_type" varchar(64),
    "journey_status" varchar(32) DEFAULT 'NO_PROCESS' NOT NULL,
    "journey_data" jsonb,
    "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
    "submitted_by_user_id" uuid,
    "submitted_by_role" varchar(64),
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pre_admissions_list_view_configs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "user_id" varchar(128) NOT NULL,
    "view_key" varchar(64) DEFAULT 'DEFAULT' NOT NULL,
    "columns_config" jsonb NOT NULL,
    "rows_per_page" integer DEFAULT 25 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pre_admission_documents" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "school_id" uuid NOT NULL,
    "campus_id" uuid NOT NULL,
    "application_id" uuid NOT NULL,
    "document_code" varchar(64) NOT NULL,
    "document_name" varchar(255) NOT NULL,
    "file_key" varchar(512) NOT NULL,
    "file_url" varchar(512) NOT NULL,
    "file_name" varchar(255) NOT NULL,
    "file_size" integer DEFAULT 0 NOT NULL,
    "mime_type" varchar(128) DEFAULT 'application/octet-stream' NOT NULL,
    "is_required" boolean DEFAULT true NOT NULL,
    "system_verification_status" varchar(32) DEFAULT 'PENDING' NOT NULL,
    "system_check_remarks" text,
    "extracted_data" jsonb,
    "staff_verification_status" varchar(32) DEFAULT 'UNVERIFIED' NOT NULL,
    "staff_notes" text,
    "override_reason" text,
    "verified_by" varchar(255),
    "verified_at" timestamp with time zone,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pre_admission_fee_payments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "school_id" uuid NOT NULL,
    "campus_id" uuid NOT NULL,
    "application_id" uuid NOT NULL,
    "fee_name" varchar(255) DEFAULT 'Application Processing Fee' NOT NULL,
    "amount" integer DEFAULT 0 NOT NULL,
    "currency" varchar(16) DEFAULT 'PKR' NOT NULL,
    "collection_rule" varchar(64) DEFAULT 'PAYMENT_REQUIRED_BEFORE_TEST' NOT NULL,
    "payment_status" varchar(32) DEFAULT 'PENDING' NOT NULL,
    "payment_method" varchar(64),
    "transaction_reference" varchar(128),
    "voucher_reference" varchar(128),
    "payment_date" varchar(32),
    "receipt_file_url" varchar(512),
    "payer_name" varchar(255),
    "payer_mobile" varchar(32),
    "verified_by" varchar(255),
    "verified_at" timestamp with time zone,
    "verification_notes" text,
    "waiver_reason" text,
    "waived_by" varchar(255),
    "waived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "application_fee_rules" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "organization_id" uuid NOT NULL,
    "school_id" uuid,
    "academic_year_id" varchar(64) NOT NULL,
    "campus_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "class_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "fee_amount" integer DEFAULT 0 NOT NULL,
    "currency" varchar(16) DEFAULT 'PKR' NOT NULL,
    "instructions" text DEFAULT '' NOT NULL,
    "bank_details" jsonb,
    "mobile_wallet_details" jsonb,
    "collection_rule" varchar(64) DEFAULT 'PAYMENT_REQUIRED_BEFORE_TEST' NOT NULL,
    "fee_not_required" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "effective_from" timestamp with time zone,
    "effective_to" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ── 6. Legacy Table Column Reconciliations (Safe Conditional ADD COLUMN) ─────

DO $$
BEGIN
  -- Reconcile schools table geography columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'country_id') THEN
    ALTER TABLE "schools" ADD COLUMN "country_id" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'state_id') THEN
    ALTER TABLE "schools" ADD COLUMN "state_id" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'city_id') THEN
    ALTER TABLE "schools" ADD COLUMN "city_id" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'area_id') THEN
    ALTER TABLE "schools" ADD COLUMN "area_id" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'school_type') THEN
    ALTER TABLE "schools" ADD COLUMN "school_type" varchar(64) DEFAULT 'K12';
  END IF;

  -- Reconcile branches table geography columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'country_id') THEN
    ALTER TABLE "branches" ADD COLUMN "country_id" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'state_id') THEN
    ALTER TABLE "branches" ADD COLUMN "state_id" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'city_id') THEN
    ALTER TABLE "branches" ADD COLUMN "city_id" uuid;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'branches' AND column_name = 'area_id') THEN
    ALTER TABLE "branches" ADD COLUMN "area_id" uuid;
  END IF;
END $$;

-- ── 7. Unique Constraints & Indexes ─────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS "uq_country_org_iso2" ON "countries" ("organization_id", "iso2");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_state_org_name" ON "states" ("organization_id", "country_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_city_org_name" ON "cities" ("organization_id", "state_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_area_org_name" ON "areas" ("organization_id", "city_id", "name");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_head_office_org_id" ON "head_offices" ("organization_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_head_office_org_code" ON "head_offices" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_region_org_id" ON "regions" ("organization_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_region_org_code" ON "regions" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_school_org_id" ON "schools" ("organization_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_school_org_code" ON "schools" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_branch_org_id" ON "branches" ("organization_id", "id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_branch_org_code" ON "branches" ("organization_id", "code");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_academic_year_org_code" ON "academic_years" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_board_org_code" ON "boards" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_academic_level_org_code" ON "academic_levels" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_subject_org_code" ON "subjects" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_class_org_code" ON "classes" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_class_subject_mapping" ON "class_subject_mappings" ("organization_id", "class_id", "subject_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_section_org_branch_class_year_code" ON "sections" ("organization_id", "branch_id", "class_id", "academic_year_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_language_org_code" ON "languages" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_config_scope_branch_unique" ON "config_scope_branches" ("organization_id", "entity_type", "entity_id", "branch_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_field_def_org_code" ON "field_definitions" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_form_template_org_code" ON "form_templates" ("organization_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_display_preference_unique" ON "display_preferences" ("organization_id", "entity_type", "entity_id");

CREATE UNIQUE INDEX IF NOT EXISTS "uq_preadmission_org_app_no" ON "pre_admissions" ("organization_id", "application_number");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_campus" ON "pre_admissions" ("organization_id", "campus_id");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_campus_submitted" ON "pre_admissions" ("organization_id", "campus_id", "submitted_at");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_campus_status" ON "pre_admissions" ("organization_id", "campus_id", "status");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_school" ON "pre_admissions" ("organization_id", "school_id");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_status" ON "pre_admissions" ("organization_id", "status");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_ver_status" ON "pre_admissions" ("organization_id", "verification_status");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_class_year" ON "pre_admissions" ("organization_id", "class_id", "academic_year_id");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_mobile" ON "pre_admissions" ("organization_id", "primary_mobile");
CREATE INDEX IF NOT EXISTS "idx_preadmission_org_cnic" ON "pre_admissions" ("organization_id", "father_cnic");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_preadmission_view_config" ON "pre_admissions_list_view_configs" ("organization_id", "user_id", "view_key");
CREATE INDEX IF NOT EXISTS "idx_preadm_doc_org_app" ON "pre_admission_documents" ("organization_id", "application_id");
CREATE INDEX IF NOT EXISTS "idx_preadm_doc_org_campus_status" ON "pre_admission_documents" ("organization_id", "campus_id", "staff_verification_status");
CREATE INDEX IF NOT EXISTS "idx_preadm_fee_org_app" ON "pre_admission_fee_payments" ("organization_id", "application_id");
CREATE INDEX IF NOT EXISTS "idx_preadm_fee_org_tx" ON "pre_admission_fee_payments" ("organization_id", "transaction_reference");
CREATE INDEX IF NOT EXISTS "idx_preadm_fee_org_vch" ON "pre_admission_fee_payments" ("organization_id", "voucher_reference");
CREATE INDEX IF NOT EXISTS "idx_preadm_fee_org_campus_status" ON "pre_admission_fee_payments" ("organization_id", "campus_id", "payment_status");
CREATE INDEX IF NOT EXISTS "idx_fee_rule_org" ON "application_fee_rules" ("organization_id");
CREATE INDEX IF NOT EXISTS "idx_fee_rule_org_year" ON "application_fee_rules" ("organization_id", "academic_year_id");

-- ── 8. Foreign Key Constraints (Deterministic Checks) ───────────────────────

DO $$
BEGIN
  -- Geography tree FKs
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'countries_organization_id_organizations_id_fk') THEN
    ALTER TABLE "countries" ADD CONSTRAINT "countries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'states_organization_id_organizations_id_fk') THEN
    ALTER TABLE "states" ADD CONSTRAINT "states_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'states_country_id_countries_id_fk') THEN
    ALTER TABLE "states" ADD CONSTRAINT "states_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE restrict;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cities_organization_id_organizations_id_fk') THEN
    ALTER TABLE "cities" ADD CONSTRAINT "cities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cities_country_id_countries_id_fk') THEN
    ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE restrict;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'cities_state_id_states_id_fk') THEN
    ALTER TABLE "cities" ADD CONSTRAINT "cities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE restrict;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'areas_organization_id_organizations_id_fk') THEN
    ALTER TABLE "areas" ADD CONSTRAINT "areas_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'areas_country_id_countries_id_fk') THEN
    ALTER TABLE "areas" ADD CONSTRAINT "areas_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE restrict;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'areas_state_id_states_id_fk') THEN
    ALTER TABLE "areas" ADD CONSTRAINT "areas_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE restrict;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'areas_city_id_cities_id_fk') THEN
    ALTER TABLE "areas" ADD CONSTRAINT "areas_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE restrict;
  END IF;

  -- Hierarchy node composite FKs
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_head_office_hierarchy_node') THEN
    ALTER TABLE "head_offices" ADD CONSTRAINT "fk_head_office_hierarchy_node" FOREIGN KEY ("organization_id", "hierarchy_node_id") REFERENCES "hierarchy_nodes"("organization_id", "id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_region_hierarchy_node') THEN
    ALTER TABLE "regions" ADD CONSTRAINT "fk_region_hierarchy_node" FOREIGN KEY ("organization_id", "hierarchy_node_id") REFERENCES "hierarchy_nodes"("organization_id", "id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_school_hierarchy_node') THEN
    ALTER TABLE "schools" ADD CONSTRAINT "fk_school_hierarchy_node" FOREIGN KEY ("organization_id", "hierarchy_node_id") REFERENCES "hierarchy_nodes"("organization_id", "id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_branch_hierarchy_node') THEN
    ALTER TABLE "branches" ADD CONSTRAINT "fk_branch_hierarchy_node" FOREIGN KEY ("organization_id", "hierarchy_node_id") REFERENCES "hierarchy_nodes"("organization_id", "id") ON DELETE cascade;
  END IF;

  -- Academic & Admissions FKs
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'branches_school_id_schools_id_fk') THEN
    ALTER TABLE "branches" ADD CONSTRAINT "branches_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classes_academic_level_id_academic_levels_id_fk') THEN
    ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_level_id_academic_levels_id_fk" FOREIGN KEY ("academic_level_id") REFERENCES "academic_levels"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'class_subject_mappings_class_id_classes_id_fk') THEN
    ALTER TABLE "class_subject_mappings" ADD CONSTRAINT "class_subject_mappings_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'class_subject_mappings_subject_id_subjects_id_fk') THEN
    ALTER TABLE "class_subject_mappings" ADD CONSTRAINT "class_subject_mappings_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sections_branch_id_branches_id_fk') THEN
    ALTER TABLE "sections" ADD CONSTRAINT "sections_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sections_class_id_classes_id_fk') THEN
    ALTER TABLE "sections" ADD CONSTRAINT "sections_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'sections_academic_year_id_academic_years_id_fk') THEN
    ALTER TABLE "sections" ADD CONSTRAINT "sections_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admissions_school_id_schools_id_fk') THEN
    ALTER TABLE "pre_admissions" ADD CONSTRAINT "pre_admissions_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admissions_campus_id_branches_id_fk') THEN
    ALTER TABLE "pre_admissions" ADD CONSTRAINT "pre_admissions_campus_id_branches_id_fk" FOREIGN KEY ("campus_id") REFERENCES "branches"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admissions_organization_id_organizations_id_fk') THEN
    ALTER TABLE "pre_admissions" ADD CONSTRAINT "pre_admissions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admissions_list_view_configs_organization_id_organizations_id_fk') THEN
    ALTER TABLE "pre_admissions_list_view_configs" ADD CONSTRAINT "pre_admissions_list_view_configs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admission_documents_organization_id_organizations_id_fk') THEN
    ALTER TABLE "pre_admission_documents" ADD CONSTRAINT "pre_admission_documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admission_documents_school_id_schools_id_fk') THEN
    ALTER TABLE "pre_admission_documents" ADD CONSTRAINT "pre_admission_documents_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admission_documents_campus_id_branches_id_fk') THEN
    ALTER TABLE "pre_admission_documents" ADD CONSTRAINT "pre_admission_documents_campus_id_branches_id_fk" FOREIGN KEY ("campus_id") REFERENCES "branches"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admission_documents_application_id_pre_admissions_id_fk') THEN
    ALTER TABLE "pre_admission_documents" ADD CONSTRAINT "pre_admission_documents_application_id_pre_admissions_id_fk" FOREIGN KEY ("application_id") REFERENCES "pre_admissions"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admission_fee_payments_organization_id_organizations_id_fk') THEN
    ALTER TABLE "pre_admission_fee_payments" ADD CONSTRAINT "pre_admission_fee_payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admission_fee_payments_school_id_schools_id_fk') THEN
    ALTER TABLE "pre_admission_fee_payments" ADD CONSTRAINT "pre_admission_fee_payments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admission_fee_payments_campus_id_branches_id_fk') THEN
    ALTER TABLE "pre_admission_fee_payments" ADD CONSTRAINT "pre_admission_fee_payments_campus_id_branches_id_fk" FOREIGN KEY ("campus_id") REFERENCES "branches"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pre_admission_fee_payments_application_id_pre_admissions_id_fk') THEN
    ALTER TABLE "pre_admission_fee_payments" ADD CONSTRAINT "pre_admission_fee_payments_application_id_pre_admissions_id_fk" FOREIGN KEY ("application_id") REFERENCES "pre_admissions"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'application_fee_rules_organization_id_organizations_id_fk') THEN
    ALTER TABLE "application_fee_rules" ADD CONSTRAINT "application_fee_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'application_fee_rules_school_id_schools_id_fk') THEN
    ALTER TABLE "application_fee_rules" ADD CONSTRAINT "application_fee_rules_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE cascade;
  END IF;
END $$;

-- ── 9. Row-Level Security (RLS) & Runtime User Grants ───────────────────────

DO $$
DECLARE
  tbl text;
  policy_rec RECORD;
  expected_policy_name text;
  tables text[] := ARRAY[
    'countries', 'states', 'cities', 'areas',
    'head_offices', 'regions', 'schools', 'branches',
    'academic_years', 'boards', 'academic_levels', 'subjects', 'classes',
    'class_subject_mappings', 'sections', 'languages', 'config_scope_branches',
    'field_definitions', 'form_templates', 'display_preferences',
    'pre_admissions', 'pre_admissions_list_view_configs',
    'pre_admission_documents', 'pre_admission_fee_payments', 'application_fee_rules'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
    
    expected_policy_name := tbl || '_tenant_isolation';

    -- Deterministic check in pg_policies
    SELECT policyname, qual INTO policy_rec
    FROM pg_policies
    WHERE tablename = tbl AND policyname = expected_policy_name;

    IF NOT FOUND THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (organization_id = NULLIF(current_setting(''app.current_tenant_id'', true), '''')::uuid);',
        expected_policy_name, tbl
      );
    ELSE
      -- Policy already exists: verify tenant isolation semantics
      IF policy_rec.qual IS NOT NULL AND policy_rec.qual NOT LIKE '%current_tenant_id%' THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Conflicting policy % on table % does not enforce current_tenant_id isolation.', expected_policy_name, tbl;
      END IF;
    END IF;
  END LOOP;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  "countries", "states", "cities", "areas",
  "head_offices", "regions", "schools", "branches",
  "academic_years", "boards", "academic_levels", "subjects", "classes",
  "class_subject_mappings", "sections", "languages", "config_scope_branches",
  "field_definitions", "form_templates", "display_preferences",
  "pre_admissions", "pre_admissions_list_view_configs",
  "pre_admission_documents", "pre_admission_fee_payments", "application_fee_rules"
TO campus_app_user;