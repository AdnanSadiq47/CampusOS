import path from 'path';
import fs from 'fs';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import { TenantTransactionManager } from './tenant-transaction-manager.js';
import { StructuredLogger } from '@campus-os/logger';

const logger = new StructuredLogger('DatabaseClient');

export const CANONICAL_LIVE_DB_NAME = '.pglite-data';

export function findWorkspaceRoot(startDir = process.cwd()): string {
  let cur = path.resolve(startDir);
  while (cur && cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, 'pnpm-workspace.yaml'))) {
      return cur;
    }
    cur = path.dirname(cur);
  }
  const defaultRoot = 'C:\\Users\\Adi\\Desktop\\CampusOS';
  if (fs.existsSync(path.join(defaultRoot, 'pnpm-workspace.yaml'))) {
    return defaultRoot;
  }
  return startDir;
}

export function getCanonicalLiveDbPath(): string {
  const root = findWorkspaceRoot();
  return path.resolve(root, CANONICAL_LIVE_DB_NAME);
}

export function getPgLiteDataDir(): string {
  if (process.env['PGLITE_DATA_DIR']) {
    return path.resolve(process.env['PGLITE_DATA_DIR']);
  }
  const dataDir = getCanonicalLiveDbPath();
  if (!fs.existsSync(dataDir)) {
    throw new Error(
      `CANONICAL DATABASE PATH NOT FOUND: "${dataDir}". Fail closed to prevent creating an unlinked empty database.`
    );
  }
  return dataDir;
}

export function assertAuthorizedDbAccess(targetDir?: string): void {
  if (!targetDir) return; // In-memory tests allowed
  const resolvedTarget = path.resolve(targetDir).toLowerCase();
  const canonicalLivePath = getCanonicalLiveDbPath().toLowerCase();

  if (resolvedTarget === canonicalLivePath) {
    if (process.env['CAMPUSOS_AUTHORIZED_DB_OWNER'] !== 'API_CORE') {
      throw new Error(
        'LIVE CAMPUSOS DATABASE DIRECT ACCESS BLOCKED.\n' +
        `Target path "${targetDir}" is the canonical live CampusOS database.\n` +
        'Direct instantiation from scratch/test/UI processes is forbidden to prevent WAL corruption.\n' +
        'Access data via CampusOS API (http://localhost:4000) or operate on an isolated database clone.'
      );
    }
  }
}

let sharedPgLiteInstance: PGlite | null = null;
let pgliteInitialized = false;

export async function closeSharedDatabase(): Promise<void> {
  if (sharedPgLiteInstance) {
    logger.info('Gracefully closing shared PGlite database connection...');
    const inst = sharedPgLiteInstance;
    sharedPgLiteInstance = null;
    pgliteInitialized = false;
    try {
      await inst.close();
      logger.info('Shared PGlite database connection closed cleanly.');
    } catch (err) {
      logger.error('Error during PGlite database close', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export const CANONICAL_ORG_ID_A = '11111111-1111-1111-1111-111111111111';
export const CANONICAL_ORG_ID_B = '22222222-2222-2222-2222-222222222222';

export const CANONICAL_SCHOOL_IDS = {
  BEACON: '11111111-2222-3333-4444-555555555555',
  CITY: '22222222-3333-4444-5555-666666666666',
  HORIZON: '33333333-4444-5555-6666-777777777777',
  INDEPENDENT: '44444444-5555-6666-7777-888888888888',
  BETA_COLLEGE: '55555555-6666-7777-8888-999999999999',
};

export const CANONICAL_CAMPUS_IDS = {
  MAIN_CAMPUS: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  CLIFTON_CAMPUS: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  DHA_CAMPUS: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  PECHS_CAMPUS: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  CLIFTON_JR_CAMPUS: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  ISLAMABAD_CAMPUS: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  INDEPENDENT_CAMPUS: '11112222-3333-4444-5555-666677778888',
  BETA_MAIN_CAMPUS: '88888888-8888-8888-8888-888888888888',
};

import { ensureDatabaseIdentity } from './safety/identity.js';
import { verifySchemaCompatibility } from './migration/index.js';

export async function bootstrapPgLiteSchema(pglite: PGlite) {
  if (pgliteInitialized) return;

  // Ensure WASM engine is fully loaded and ready
  await pglite.waitReady;

  // 1. Verify Database Identity & Integrity (Fail Closed)
  await ensureDatabaseIdentity(pglite);

  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(64) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(128),
      slug VARCHAR(128) UNIQUE NOT NULL,
      domain VARCHAR(255),
      country VARCHAR(128) DEFAULT 'Pakistan' NOT NULL,
      status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS countries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      iso2 VARCHAR(2) NOT NULL,
      iso3 VARCHAR(3),
      numeric_code VARCHAR(10),
      dial_code VARCHAR(16),
      currency_code VARCHAR(10),
      currency_symbol VARCHAR(10),
      nationality VARCHAR(100),
      sort_order INTEGER DEFAULT 1 NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS states (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64),
      type VARCHAR(64) DEFAULT 'Province' NOT NULL,
      sort_order INTEGER DEFAULT 1 NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
      state_id UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64),
      sort_order INTEGER DEFAULT 1 NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS areas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      country_id UUID NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
      state_id UUID NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
      city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64),
      postal_code VARCHAR(32),
      sort_order INTEGER DEFAULT 1 NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schools (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      hierarchy_node_id UUID,
      parent_id UUID,
      head_office_id UUID,
      region_id UUID,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(128),
      description TEXT,
      school_type VARCHAR(64) DEFAULT 'K12',
      registration_number VARCHAR(128),
      education_board VARCHAR(128),
      principal_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(64),
      alternate_phone VARCHAR(64),
      address TEXT,
      area VARCHAR(128),
      city VARCHAR(128),
      province VARCHAR(128),
      country VARCHAR(128) DEFAULT 'Pakistan',
      postal_code VARCHAR(32),
      website VARCHAR(255),
      logo_url TEXT,
      custom_domain VARCHAR(255),
      default_language VARCHAR(32) DEFAULT 'en' NOT NULL,
      timezone VARCHAR(64) DEFAULT 'UTC' NOT NULL,
      currency VARCHAR(16) DEFAULT 'PKR' NOT NULL,
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_by UUID,
      updated_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    ALTER TABLE schools ADD COLUMN IF NOT EXISTS head_office_id UUID;
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS region_id UUID;
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS short_name VARCHAR(128);
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS country VARCHAR(128) DEFAULT 'Pakistan';
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS website_url VARCHAR(255);
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(255);
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(64);
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS created_by UUID;
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS updated_by UUID;

    CREATE TABLE IF NOT EXISTS branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      hierarchy_node_id UUID,
      school_id UUID,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(128),
      description TEXT,
      sort_order INTEGER DEFAULT 1 NOT NULL,
      logo_url TEXT,
      phone VARCHAR(64),
      alternate_phone VARCHAR(64),
      email VARCHAR(255),
      website VARCHAR(255),
      country VARCHAR(128) DEFAULT 'Pakistan',
      province VARCHAR(128),
      city VARCHAR(128),
      area VARCHAR(128),
      address TEXT,
      postal_code VARCHAR(32),
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_by UUID,
      updated_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    ALTER TABLE branches ADD COLUMN IF NOT EXISTS created_by UUID;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS updated_by UUID;

    CREATE TABLE IF NOT EXISTS config_scope_branches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      entity_type VARCHAR(64) NOT NULL,
      entity_id UUID NOT NULL,
      branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64) NOT NULL,
      start_date VARCHAR(32) NOT NULL,
      end_date VARCHAR(32) NOT NULL,
      is_current BOOLEAN DEFAULT FALSE NOT NULL,
      sort_order INTEGER DEFAULT 1 NOT NULL,
      description TEXT,
      owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
      owner_id UUID,
      apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS boards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(64) NOT NULL,
      code VARCHAR(64),
      sort_order INTEGER DEFAULT 1 NOT NULL,
      description TEXT,
      owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
      owner_id UUID,
      apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_levels (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(64) NOT NULL,
      sort_order INTEGER DEFAULT 1 NOT NULL,
      description TEXT,
      owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
      owner_id UUID,
      apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS classes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      level_id UUID NOT NULL REFERENCES academic_levels(id) ON DELETE RESTRICT,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(64),
      code VARCHAR(64),
      from_age NUMERIC(4, 1),
      to_age NUMERIC(4, 1),
      sort_order INTEGER DEFAULT 1 NOT NULL,
      description TEXT,
      owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
      owner_id UUID,
      apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      class_id UUID,
      name VARCHAR(255) NOT NULL,
      sort_order INTEGER DEFAULT 1 NOT NULL,
      owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
      owner_id UUID,
      apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64) NOT NULL,
      sort_order INTEGER DEFAULT 1 NOT NULL,
      owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
      owner_id UUID,
      apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS languages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(64) NOT NULL,
      sort_order INTEGER DEFAULT 1 NOT NULL,
      owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
      owner_id UUID,
      apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pre_admissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      school_id UUID NOT NULL,
      campus_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      application_number VARCHAR(64) NOT NULL,
      academic_year_id VARCHAR(128) NOT NULL,
      academic_year_name VARCHAR(255),
      class_id VARCHAR(128) NOT NULL,
      class_name VARCHAR(255),
      board_id VARCHAR(128),
      board_name VARCHAR(255),
      form_definition_id VARCHAR(128) NOT NULL,
      form_name VARCHAR(255),
      published_form_version_id VARCHAR(128),
      form_version_number INTEGER DEFAULT 1,
      student_name VARCHAR(255) NOT NULL,
      gender VARCHAR(16) DEFAULT 'MALE' NOT NULL,
      date_of_birth VARCHAR(32) NOT NULL,
      father_or_guardian_name VARCHAR(255) NOT NULL,
      father_cnic VARCHAR(32),
      primary_mobile VARCHAR(32) NOT NULL,
      primary_email VARCHAR(255),
      source VARCHAR(32) DEFAULT 'ONLINE' NOT NULL,
      status VARCHAR(32) DEFAULT 'SUBMITTED' NOT NULL,
      verification_status VARCHAR(32) DEFAULT 'UNVERIFIED' NOT NULL,
      verified_by VARCHAR(255),
      verified_at TIMESTAMPTZ,
      verification_method VARCHAR(32),
      verification_override_reason TEXT,
      verification_issues JSONB DEFAULT '[]'::jsonb NOT NULL,
      is_corrected BOOLEAN DEFAULT FALSE NOT NULL,
      submission_data JSONB DEFAULT '{}'::jsonb NOT NULL,
      original_submission_snapshot JSONB DEFAULT '{}'::jsonb NOT NULL,
      custom_fields_data JSONB DEFAULT '{}'::jsonb NOT NULL,
      process_definition_id VARCHAR(128),
      process_name VARCHAR(255),
      process_version_id VARCHAR(128),
      process_version_number INTEGER,
      current_step_id VARCHAR(128),
      current_step_name VARCHAR(255),
      current_step_type VARCHAR(64),
      journey_status VARCHAR(32) DEFAULT 'NO_PROCESS' NOT NULL,
      journey_data JSONB,
      submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      submitted_by_user_id UUID,
      submitted_by_role VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pre_admissions_list_view_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id VARCHAR(128) NOT NULL,
      view_key VARCHAR(64) DEFAULT 'DEFAULT' NOT NULL,
      columns_config JSONB DEFAULT '[]'::jsonb NOT NULL,
      rows_per_page INTEGER DEFAULT 25 NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT unq_user_org_pre_adm_view UNIQUE (organization_id, user_id, view_key)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      hierarchy_node_id UUID,
      actor_id UUID,
      actor_email VARCHAR(255),
      impersonator_id UUID,
      module VARCHAR(64) NOT NULL,
      action VARCHAR(64) NOT NULL,
      entity_type VARCHAR(64) NOT NULL,
      entity_id UUID NOT NULL,
      before_state JSONB,
      after_state JSONB,
      diff JSONB,
      outcome VARCHAR(32) DEFAULT 'SUCCESS' NOT NULL,
      ip_address VARCHAR(64),
      user_agent TEXT,
      metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pre_admission_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      school_id UUID NOT NULL,
      campus_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      application_id UUID NOT NULL REFERENCES pre_admissions(id) ON DELETE CASCADE,
      document_code VARCHAR(64) NOT NULL,
      document_name VARCHAR(255) NOT NULL,
      file_key VARCHAR(512) NOT NULL,
      file_url VARCHAR(512) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size INTEGER DEFAULT 0 NOT NULL,
      mime_type VARCHAR(128) DEFAULT 'application/octet-stream' NOT NULL,
      is_required BOOLEAN DEFAULT TRUE NOT NULL,
      system_verification_status VARCHAR(32) DEFAULT 'PENDING' NOT NULL,
      system_check_remarks TEXT,
      extracted_data JSONB,
      staff_verification_status VARCHAR(32) DEFAULT 'UNVERIFIED' NOT NULL,
      staff_notes TEXT,
      override_reason TEXT,
      verified_by VARCHAR(255),
      verified_at TIMESTAMPTZ,
      version INTEGER DEFAULT 1 NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pre_admission_fee_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      school_id UUID NOT NULL,
      campus_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
      application_id UUID NOT NULL REFERENCES pre_admissions(id) ON DELETE CASCADE,
      fee_name VARCHAR(255) DEFAULT 'Application Processing Fee' NOT NULL,
      amount INTEGER DEFAULT 0 NOT NULL,
      currency VARCHAR(16) DEFAULT 'PKR' NOT NULL,
      collection_rule VARCHAR(64) DEFAULT 'PAYMENT_REQUIRED_BEFORE_TEST' NOT NULL,
      payment_status VARCHAR(32) DEFAULT 'PENDING' NOT NULL,
      payment_method VARCHAR(64),
      transaction_reference VARCHAR(128),
      voucher_reference VARCHAR(128),
      payment_date VARCHAR(32),
      receipt_file_url VARCHAR(512),
      payer_name VARCHAR(255),
      payer_mobile VARCHAR(32),
      verified_by VARCHAR(255),
      verified_at TIMESTAMPTZ,
      verification_notes TEXT,
      waiver_reason TEXT,
      waived_by VARCHAR(255),
      waived_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS application_fee_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
      academic_year_id VARCHAR(64) NOT NULL,
      campus_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
      class_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
      fee_amount INTEGER DEFAULT 0 NOT NULL,
      currency VARCHAR(16) DEFAULT 'PKR' NOT NULL,
      instructions TEXT DEFAULT '' NOT NULL,
      bank_details JSONB,
      mobile_wallet_details JSONB,
      collection_rule VARCHAR(64) DEFAULT 'PAYMENT_REQUIRED_BEFORE_TEST' NOT NULL,
      fee_not_required BOOLEAN DEFAULT FALSE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      effective_from TIMESTAMPTZ,
      effective_to TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hierarchy_node_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(128) NOT NULL,
      level_order INTEGER NOT NULL,
      allow_financial_posting BOOLEAN DEFAULT TRUE NOT NULL,
      allow_user_assignment BOOLEAN DEFAULT TRUE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_node_type_org_code UNIQUE (organization_id, code)
    );

    CREATE TABLE IF NOT EXISTS hierarchy_nodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      node_type_id UUID NOT NULL,
      parent_id UUID,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      path TEXT NOT NULL,
      address JSONB DEFAULT '{}'::jsonb NOT NULL,
      contact_info JSONB DEFAULT '{}'::jsonb NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_nodes_org_code UNIQUE (organization_id, code)
    );

    CREATE TABLE IF NOT EXISTS head_offices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      hierarchy_node_id UUID NOT NULL,
      parent_id UUID,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(128),
      description TEXT,
      director_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(64),
      alternate_phone VARCHAR(64),
      website VARCHAR(255),
      country VARCHAR(128) DEFAULT 'Pakistan',
      address TEXT,
      area VARCHAR(128),
      city VARCHAR(128),
      province VARCHAR(128),
      postal_code VARCHAR(32),
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_by UUID,
      updated_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_head_office_org_code UNIQUE (organization_id, code)
    );

    ALTER TABLE head_offices ADD COLUMN IF NOT EXISTS created_by UUID;
    ALTER TABLE head_offices ADD COLUMN IF NOT EXISTS updated_by UUID;

    CREATE TABLE IF NOT EXISTS regions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      hierarchy_node_id UUID NOT NULL,
      parent_id UUID NOT NULL,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(128),
      director_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(64),
      alternate_phone VARCHAR(64),
      website VARCHAR(255),
      country VARCHAR(128) DEFAULT 'Pakistan',
      address TEXT,
      area VARCHAR(128),
      city VARCHAR(128),
      province VARCHAR(128),
      postal_code VARCHAR(32),
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_by UUID,
      updated_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT uq_regions_org_code UNIQUE (organization_id, code)
    );

    ALTER TABLE regions ADD COLUMN IF NOT EXISTS country VARCHAR(128) DEFAULT 'Pakistan';
    ALTER TABLE regions ADD COLUMN IF NOT EXISTS created_by UUID;
    ALTER TABLE regions ADD COLUMN IF NOT EXISTS updated_by UUID;
    ALTER TABLE regions ADD COLUMN IF NOT EXISTS country_id UUID;
    ALTER TABLE regions ADD COLUMN IF NOT EXISTS state_id UUID;
    ALTER TABLE regions ADD COLUMN IF NOT EXISTS city_id UUID;
    ALTER TABLE regions ADD COLUMN IF NOT EXISTS area_id UUID;

    ALTER TABLE branches ADD COLUMN IF NOT EXISTS created_by UUID;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS updated_by UUID;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS country_id UUID;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS state_id UUID;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS city_id UUID;
    ALTER TABLE branches ADD COLUMN IF NOT EXISTS area_id UUID;

    ALTER TABLE schools ADD COLUMN IF NOT EXISTS country_id UUID;
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS state_id UUID;
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS city_id UUID;
    ALTER TABLE schools ADD COLUMN IF NOT EXISTS area_id UUID;

    ALTER TABLE head_offices ADD COLUMN IF NOT EXISTS country_id UUID;
    ALTER TABLE head_offices ADD COLUMN IF NOT EXISTS state_id UUID;
    ALTER TABLE head_offices ADD COLUMN IF NOT EXISTS city_id UUID;
    ALTER TABLE head_offices ADD COLUMN IF NOT EXISTS area_id UUID;

    CREATE INDEX IF NOT EXISTS idx_preadmission_org_campus_submitted ON pre_admissions (organization_id, campus_id, submitted_at DESC);
    CREATE INDEX IF NOT EXISTS idx_preadmission_org_campus_status ON pre_admissions (organization_id, campus_id, status);
    CREATE INDEX IF NOT EXISTS idx_preadmission_org_ver_status ON pre_admissions (organization_id, verification_status);
    CREATE INDEX IF NOT EXISTS idx_preadmission_org_mobile ON pre_admissions (organization_id, primary_mobile);
    CREATE INDEX IF NOT EXISTS idx_preadmission_org_cnic ON pre_admissions (organization_id, father_cnic);
    CREATE INDEX IF NOT EXISTS idx_preadmission_org_app_no ON pre_admissions (organization_id, application_number);
    CREATE INDEX IF NOT EXISTS idx_audit_org_created ON audit_logs (organization_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_org_entity ON audit_logs (organization_id, entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_org_node ON audit_logs (organization_id, hierarchy_node_id);
    CREATE INDEX IF NOT EXISTS idx_preadm_doc_org_app ON pre_admission_documents (organization_id, application_id);
    CREATE INDEX IF NOT EXISTS idx_preadm_doc_org_campus_status ON pre_admission_documents (organization_id, campus_id, staff_verification_status);
    CREATE INDEX IF NOT EXISTS idx_preadm_fee_org_app ON pre_admission_fee_payments (organization_id, application_id);
    CREATE INDEX IF NOT EXISTS idx_preadm_fee_org_tx ON pre_admission_fee_payments (organization_id, transaction_reference);
    CREATE INDEX IF NOT EXISTS idx_preadm_fee_org_vch ON pre_admission_fee_payments (organization_id, voucher_reference);
    CREATE INDEX IF NOT EXISTS idx_preadm_fee_org_campus_status ON pre_admission_fee_payments (organization_id, campus_id, payment_status);
    CREATE INDEX IF NOT EXISTS idx_fee_rule_org ON application_fee_rules (organization_id);
    CREATE INDEX IF NOT EXISTS idx_fee_rule_org_year ON application_fee_rules (organization_id, academic_year_id);

    CREATE TABLE IF NOT EXISTS identity_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(32),
      mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
      mfa_secret_encrypted BYTEA,
      mfa_secret_iv BYTEA,
      mfa_key_version INTEGER DEFAULT 1 NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      email_verified_at TIMESTAMPTZ,
      failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
      locked_until TIMESTAMPTZ,
      security_stamp UUID DEFAULT gen_random_uuid() NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS organization_memberships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      identity_user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE CASCADE,
      membership_type VARCHAR(32) DEFAULT 'STAFF' NOT NULL,
      status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
      valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      valid_until TIMESTAMPTZ,
      version INTEGER DEFAULT 1 NOT NULL,
      joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    ALTER TABLE organization_memberships ADD COLUMN IF NOT EXISTS membership_type VARCHAR(32) DEFAULT 'STAFF' NOT NULL;
    ALTER TABLE organization_memberships ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

    CREATE TABLE IF NOT EXISTS membership_node_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      membership_id UUID NOT NULL,
      hierarchy_node_id UUID NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE NOT NULL,
      status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
      valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      valid_until TIMESTAMPTZ,
      assigned_by UUID REFERENCES identity_users(id),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(128) NOT NULL,
      description VARCHAR(500),
      is_system BOOLEAN DEFAULT FALSE NOT NULL,
      is_active BOOLEAN DEFAULT TRUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT unq_org_role_code UNIQUE (organization_id, code)
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      module_code VARCHAR(64) NOT NULL,
      entity_code VARCHAR(64) NOT NULL,
      action VARCHAR(32) NOT NULL,
      effect VARCHAR(16) DEFAULT 'ALLOW' NOT NULL,
      data_scope VARCHAR(32) DEFAULT 'HIERARCHY_SUBTREE' NOT NULL,
      field_rules JSONB DEFAULT '[]'::jsonb NOT NULL,
      conditions JSONB DEFAULT '{}'::jsonb NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assignment_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      assignment_id UUID NOT NULL,
      role_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  // 3. Verify Schema Compatibility & Table Presence (Zero Startup Data Mutation)
  await verifySchemaCompatibility(pglite);

  pgliteInitialized = true;
  logger.info('PGlite PostgreSQL schema verified and database connection established (Zero startup data mutations)');
}

export function createDatabasePool(connectionString?: string): pg.Pool {
  const url = connectionString || process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  return new pg.Pool({
    connectionString: url,
    max: Number(process.env['DATABASE_POOL_MAX'] || 20),
    min: Number(process.env['DATABASE_POOL_MIN'] || 2),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export function createTenantManager(pool?: pg.Pool | any): TenantTransactionManager {
  if (pool) {
    return new TenantTransactionManager(pool);
  }

  if (process.env['DATABASE_URL']) {
    try {
      const activePool = createDatabasePool();
      return new TenantTransactionManager(activePool);
    } catch (err) {
      logger.warn('Failed to connect to external DATABASE_URL, falling back to embedded PGlite PostgreSQL engine', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Embedded PostgreSQL instance with persistent physical disk storage
  if (!sharedPgLiteInstance) {
    const dataDir = getPgLiteDataDir();
    process.env['CAMPUSOS_AUTHORIZED_DB_OWNER'] = 'API_CORE';
    assertAuthorizedDbAccess(dataDir);
    sharedPgLiteInstance = new PGlite(dataDir);
    logger.info(`Initialized embedded PostgreSQL (PGlite) engine at ${dataDir}`);
  }

  // Asynchronously ensure database identity & schema compatibility (Strictly Read-Only, Zero Mutation)
  const verifyPromise = (async () => {
    await sharedPgLiteInstance!.waitReady;
    await verifySchemaCompatibility(sharedPgLiteInstance!);
  })().catch((err) => {
    logger.error('Failed to verify database schema compatibility on startup', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  });
  (sharedPgLiteInstance as any).__bootstrapPromise = verifyPromise;

  return new TenantTransactionManager(sharedPgLiteInstance);
}
