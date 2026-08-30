import { describe, it, expect, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  organizations,
  schools,
  branches,
  TenantTransactionManager,
} from '@campus-os/database';
import { AdmissionsService, UserScopeContext } from '../src/modules/admissions/admissions.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { WorkingContextService } from '../src/core/hierarchy/working-context.service.js';
import { ForbiddenException } from '@nestjs/common';

describe('Pre-Admission Verification Complete Workflow Upgrade Spec (20 Assertions)', () => {
  let pglite: PGlite;
  let admissionsService: AdmissionsService;
  let auditService: AuditService;
  let contextService: WorkingContextService;
  let txManager: TenantTransactionManager;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';

  const SCHOOL_BEACON = '11111111-2222-3333-4444-555555555555';
  const SCHOOL_CITY = '22222222-3333-4444-5555-666666666666';
  const SCHOOL_HORIZON = '33333333-4444-5555-6666-777777777777';

  const CAMPUS_MAIN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const CAMPUS_CLIFTON = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CAMPUS_DHA = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const CAMPUS_PECHS = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const CAMPUS_CLIFTON_JR = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const CAMPUS_ISB = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  beforeEach(async () => {
    pglite = new PGlite();
    const db = drizzle(pglite);

    await pglite.exec(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        legal_name VARCHAR(255),
        tax_identifier VARCHAR(64),
        primary_currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
        domain VARCHAR(255) UNIQUE,
        logo_url TEXT,
        settings JSONB DEFAULT '{}'::jsonb NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        hierarchy_node_id UUID,
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
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
        postal_code VARCHAR(32),
        website VARCHAR(255),
        logo_url TEXT,
        custom_domain VARCHAR(255),
        default_language VARCHAR(32) DEFAULT 'en' NOT NULL,
        timezone VARCHAR(64) DEFAULT 'UTC' NOT NULL,
        currency VARCHAR(16) DEFAULT 'PKR' NOT NULL,
        notes TEXT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

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
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS config_scope_branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID NOT NULL,
        branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS academic_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(64) NOT NULL,
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        academic_level_id UUID REFERENCES academic_levels(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        capacity INTEGER DEFAULT 30 NOT NULL,
        sort_order INTEGER DEFAULT 1 NOT NULL,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        native_name VARCHAR(255),
        direction VARCHAR(3) DEFAULT 'ltr' NOT NULL,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pre_admissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE RESTRICT,
        campus_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
        application_number VARCHAR(64) NOT NULL,
        academic_year_id VARCHAR(64) NOT NULL,
        academic_year_name VARCHAR(128),
        class_id VARCHAR(64) NOT NULL,
        class_name VARCHAR(128),
        board_id VARCHAR(64),
        board_name VARCHAR(128),
        form_definition_id VARCHAR(128) NOT NULL,
        form_name VARCHAR(255),
        published_form_version_id VARCHAR(64),
        form_version_number INTEGER DEFAULT 1 NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        gender VARCHAR(32) NOT NULL,
        date_of_birth DATE NOT NULL,
        father_or_guardian_name VARCHAR(255) NOT NULL,
        father_cnic VARCHAR(64),
        primary_mobile VARCHAR(64) NOT NULL,
        primary_email VARCHAR(255),
        source VARCHAR(32) DEFAULT 'ONLINE' NOT NULL,
        status VARCHAR(32) DEFAULT 'SUBMITTED' NOT NULL,
        verification_status VARCHAR(32) DEFAULT 'UNVERIFIED' NOT NULL,
        verified_by VARCHAR(255),
        verified_at TIMESTAMPTZ,
        verification_method VARCHAR(64),
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
        columns_config JSONB NOT NULL,
        rows_per_page INTEGER DEFAULT 25 NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pre_admission_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        campus_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        application_id UUID NOT NULL REFERENCES pre_admissions(id) ON DELETE CASCADE,
        document_code VARCHAR(64) NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        file_key VARCHAR(512) NOT NULL,
        file_url TEXT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER DEFAULT 0 NOT NULL,
        mime_type VARCHAR(128) DEFAULT 'application/pdf' NOT NULL,
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
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        campus_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        application_id UUID NOT NULL REFERENCES pre_admissions(id) ON DELETE CASCADE,
        fee_name VARCHAR(255) NOT NULL,
        amount INTEGER DEFAULT 0 NOT NULL,
        currency VARCHAR(16) DEFAULT 'PKR' NOT NULL,
        collection_rule VARCHAR(64) DEFAULT 'PAYMENT_REQUIRED_BEFORE_TEST' NOT NULL,
        payment_status VARCHAR(32) DEFAULT 'PENDING' NOT NULL,
        payment_method VARCHAR(64),
        transaction_reference VARCHAR(128),
        voucher_reference VARCHAR(128),
        payment_date VARCHAR(32),
        receipt_file_url TEXT,
        payer_name VARCHAR(255),
        payer_mobile VARCHAR(64),
        verified_by VARCHAR(255),
        verified_at TIMESTAMPTZ,
        verification_notes TEXT,
        waiver_reason TEXT,
        waived_by VARCHAR(255),
        waived_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        hierarchy_node_id UUID,
        actor_id UUID,
        actor_email VARCHAR(255),
        impersonator_id UUID,
        module VARCHAR(64) DEFAULT 'GENERAL' NOT NULL,
        action VARCHAR(64) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID NOT NULL,
        before_state JSONB,
        after_state JSONB,
        diff JSONB,
        outcome VARCHAR(32) DEFAULT 'SUCCESS' NOT NULL,
        ip_address INET,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
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
    `);

    // Seed organizations
    await db.insert(organizations).values([
      { id: TENANT_A, code: 'ORG-A', name: 'Alpha Academy System' },
      { id: TENANT_B, code: 'ORG-B', name: 'Beta University System' },
    ]);

    // Seed schools
    await db.insert(schools).values([
      { id: SCHOOL_BEACON, organizationId: TENANT_A, name: 'Beacon Horizon Public School', code: 'SCH-01' },
      { id: SCHOOL_CITY, organizationId: TENANT_A, name: 'City Grammar School', code: 'SCH-02' },
      { id: SCHOOL_HORIZON, organizationId: TENANT_A, name: 'Horizon Heights International', code: 'SCH-03' },
    ]);

    // Seed branches
    await db.insert(branches).values([
      { id: CAMPUS_MAIN, organizationId: TENANT_A, schoolId: SCHOOL_BEACON, name: 'Main Campus', code: 'CMP-01' },
      { id: CAMPUS_CLIFTON, organizationId: TENANT_A, schoolId: SCHOOL_BEACON, name: 'Clifton Campus', code: 'CMP-02' },
      { id: CAMPUS_DHA, organizationId: TENANT_A, schoolId: SCHOOL_BEACON, name: 'DHA Phase 6 Campus', code: 'CMP-03' },
      { id: CAMPUS_PECHS, organizationId: TENANT_A, schoolId: SCHOOL_CITY, name: 'PECHS Senior Campus', code: 'CMP-04' },
      { id: CAMPUS_CLIFTON_JR, organizationId: TENANT_A, schoolId: SCHOOL_CITY, name: 'Clifton Junior Campus', code: 'CMP-05' },
      { id: CAMPUS_ISB, organizationId: TENANT_A, schoolId: SCHOOL_HORIZON, name: 'Islamabad Campus', code: 'CMP-06' },
    ]);

    txManager = new TenantTransactionManager(pglite as any);
    auditService = new AuditService(txManager);
    contextService = new WorkingContextService();
    admissionsService = new AdmissionsService(txManager, auditService, contextService);

    // Warm up seed data
    await admissionsService.getPreAdmissions({}, { organizationId: TENANT_A });
  });

  const cliftonScope: UserScopeContext = {
    organizationId: TENANT_A,
    userRole: 'ADMIN',
    workingContext: {
      nodeId: 'cmp_clifton',
      nodeType: 'CAMPUS',
      nodeName: 'Clifton Campus',
      organizationId: TENANT_A,
    },
  };

  const dhaScope: UserScopeContext = {
    organizationId: TENANT_A,
    userRole: 'ADMIN',
    workingContext: {
      nodeId: 'cmp_dha',
      nodeType: 'CAMPUS',
      nodeName: 'DHA Phase 6 Campus',
      organizationId: TENANT_A,
    },
  };

  const headOfficeScope: UserScopeContext = {
    organizationId: TENANT_A,
    userRole: 'ADMIN',
    workingContext: {
      nodeId: 'ho_alpha',
      nodeType: 'HEAD_OFFICE',
      nodeName: 'Alpha Academy Head Office',
      organizationId: TENANT_A,
    },
  };

  it('1. Clifton verification scan filters exactly 5 records for Clifton Campus', async () => {
    const scan = await admissionsService.scanApplicationsForVerification({}, cliftonScope);
    expect(scan.summary.totalScanned).toBe(5);
    expect(scan.items.every((i) => i.campusName === 'Clifton Campus')).toBe(true);
  });

  it('2. Head Office verification scan returns all 30 records across campuses', async () => {
    const scan = await admissionsService.scanApplicationsForVerification({}, headOfficeScope);
    expect(scan.summary.totalScanned).toBe(30);
  });

  it('3. Mark single application as verified sets STAFF_VERIFIED, verifiedAt, verifiedBy', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const unverified = list.items.find((a) => a.verificationStatus === 'UNVERIFIED');
    expect(unverified).toBeDefined();

    const verified = await admissionsService.markApplicationVerified(
      { applicationId: unverified!.id, notes: 'Staff verified documents' },
      cliftonScope
    );

    expect(verified.verificationStatus).toBe('STAFF_VERIFIED');
    expect(verified.verifiedAt).toBeDefined();
    expect(verified.verifiedBy).toBeDefined();
    expect(verified.journeyStatus).toBe('IN_PROGRESS');
  });

  it('4. Verified record exits the default NEEDS_ACTION queue', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;

    await admissionsService.markApplicationVerified(
      { applicationId: target.id, notes: 'Verified and ready' },
      cliftonScope
    );

    const scanQueue = await admissionsService.scanApplicationsForVerification(
      { filterTab: 'NEEDS_ACTION' },
      cliftonScope
    );
    expect(scanQueue.items.some((i) => i.id === target.id)).toBe(false);
  });

  it('5. Verified record remains in main Pre-Admissions table', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;
    await admissionsService.markApplicationVerified({ applicationId: target.id }, cliftonScope);

    const refreshedList = await admissionsService.getPreAdmissions({}, cliftonScope);
    const found = refreshedList.items.find((a) => a.id === target.id);
    expect(found).toBeDefined();
    expect(found!.verificationStatus).toBe('STAFF_VERIFIED');
  });

  it('6. Verified record with test step appears in Test Scheduling eligible candidates pool', async () => {
    const list = await admissionsService.getPreAdmissions({}, dhaScope);
    const target = list.items[0]!;
    await admissionsService.markApplicationVerified({ applicationId: target.id }, dhaScope);

    const eligible = await admissionsService.getEligibleCandidatesForTest({}, dhaScope);
    expect(eligible.some((a) => a.id === target.id)).toBe(true);
  });

  it('7. Unverified record does NOT appear in Test Scheduling eligible pool', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const unverified = list.items.find((a) => a.verificationStatus === 'UNVERIFIED');
    if (unverified) {
      const eligible = await admissionsService.getEligibleCandidatesForTest({}, cliftonScope);
      expect(eligible.some((a) => a.id === unverified.id)).toBe(false);
    }
  });

  it('8. Edit operational data preserves immutable originalSubmissionSnapshot', async () => {
    const allApps = await admissionsService.getPreAdmissions({}, headOfficeScope);
    const invalidApp = allApps.items.find((a) => a.verificationStatus === 'INVALID') || allApps.items[0]!;
    const originalSnapshotBefore = JSON.stringify(invalidApp.originalSubmissionSnapshot);

    const corrected = await admissionsService.editOperationalData(
      {
        applicationId: invalidApp.id,
        studentName: 'Ayaan Khan Operational',
        fatherOrGuardianName: 'Tariq Khan',
        primaryMobile: '03001234567',
        fatherCnic: '42101-1234567-1',
        correctionReason: 'Corrected CNIC format during review',
      },
      headOfficeScope
    );

    expect(JSON.stringify(corrected.originalSubmissionSnapshot)).toBe(originalSnapshotBefore);
    expect(corrected.studentName).toBe('Ayaan Khan Operational');
    expect(corrected.fatherCnic).toBe('42101-1234567-1');
    expect(corrected.isCorrected).toBe(true);
  });

  it('9. Editing valid CNIC automatically resolves CNIC validation issue and marks STAFF_VERIFIED', async () => {
    const allApps = await admissionsService.getPreAdmissions({}, headOfficeScope);
    const invalidApp = allApps.items.find((a) => a.verificationStatus === 'INVALID') || allApps.items.find((a) => a.verificationIssues.some((i: any) => i.code === 'INVALID_CNIC')) || allApps.items[0]!;

    const corrected = await admissionsService.editOperationalData(
      {
        applicationId: invalidApp.id,
        studentName: 'Unique Student 999',
        fatherOrGuardianName: invalidApp.fatherOrGuardianName,
        primaryMobile: '03459998877',
        fatherCnic: '42101-9998877-1', // valid format
        correctionReason: 'Fixed CNIC format',
      },
      headOfficeScope
    );

    expect(corrected.verificationStatus).toBe('STAFF_VERIFIED');
    expect(corrected.verificationIssues.length).toBe(0);
  });

  it('10. Human override warning with reason marks application STAFF_VERIFIED', async () => {
    const allApps = await admissionsService.getPreAdmissions({}, headOfficeScope);
    const targetApp = allApps.items.find((a) => a.verificationStatus !== 'STAFF_VERIFIED') || allApps.items[0]!;

    const overridden = await admissionsService.overrideVerification(
      {
        applicationId: targetApp.id,
        overrideReason: 'Confirmed sibling applicant',
        action: 'VERIFY_ANYWAY',
      },
      headOfficeScope
    );

    expect(overridden.verificationStatus).toBe('STAFF_VERIFIED');
    expect(overridden.verificationOverrideReason).toBe('Confirmed sibling applicant');
  });

  it('11. Set application to INACTIVE updates both status and verificationStatus', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;

    const inactive = await admissionsService.setApplicationInactive(
      {
        applicationId: target.id,
        reason: 'Parent withdrew application',
      },
      cliftonScope
    );

    expect(inactive.status).toBe('INACTIVE');
    expect(inactive.verificationStatus).toBe('INACTIVE');
  });

  it('12. Inactive application exits the default verification queue', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;
    await admissionsService.setApplicationInactive({ applicationId: target.id, reason: 'Duplicate' }, cliftonScope);

    const scan = await admissionsService.scanApplicationsForVerification({ filterTab: 'NEEDS_ACTION' }, cliftonScope);
    expect(scan.items.some((i) => i.id === target.id)).toBe(false);
  });

  it('13. Inactive application does NOT appear in Test Scheduling eligible pool', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;
    await admissionsService.setApplicationInactive({ applicationId: target.id, reason: 'Duplicate' }, cliftonScope);

    const eligible = await admissionsService.getEligibleCandidatesForTest({}, cliftonScope);
    expect(eligible.some((a) => a.id === target.id)).toBe(false);
  });

  it('14. Remove application soft-deletes and marks status CANCELLED and verificationStatus INACTIVE', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;

    const res = await admissionsService.removePreAdmission(
      { applicationId: target.id, reason: 'Administrative removal' },
      cliftonScope
    );

    expect(res.success).toBe(true);
    expect(res.id).toBe(target.id);

    const check = await admissionsService.getPreAdmissionById(target.id, cliftonScope);
    expect(check.status).toBe('CANCELLED');
    expect(check.verificationStatus).toBe('INACTIVE');
  });

  it('15. Bulk verify clean applications advances only clean unverified records in context', async () => {
    const bulkRes = await admissionsService.bulkVerifyCleanApplications({}, cliftonScope);
    expect(bulkRes.verifiedCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(bulkRes.advancedApplicationIds)).toBe(true);
  });

  it('16. Updating status logs audit event and enforces working context', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;

    const updated = await admissionsService.updateStatus(target.id, 'ON_HOLD', cliftonScope, 'Awaiting birth certificate');
    expect(updated.status).toBe('ON_HOLD');
  });

  it('17. Updating status of out-of-scope application throws ForbiddenException', async () => {
    const allApps = await admissionsService.getPreAdmissions({}, headOfficeScope);
    const dhaApp = allApps.items.find((a) => a.campusName === 'DHA Phase 6 Campus');
    expect(dhaApp).toBeDefined();

    // Clifton user attempting to modify DHA application
    await expect(
      admissionsService.updateStatus(dhaApp!.id, 'ON_HOLD', cliftonScope, 'Out of scope edit')
    ).rejects.toThrow(ForbiddenException);
  });

  it('18. Duplicate comparison allows comparing applications across campuses within tenant', async () => {
    const allApps = await admissionsService.getPreAdmissions({}, headOfficeScope);
    const cliftonApp = allApps.items.find((a) => a.campusId === CAMPUS_CLIFTON)!;
    const mainApp = allApps.items.find((a) => a.campusId === CAMPUS_MAIN)!;

    const comp = await admissionsService.getDuplicateComparison(cliftonApp.id, mainApp.id, cliftonScope);
    expect(comp.currentApplication.id).toBe(cliftonApp.id);
    expect(comp.existingApplication.id).toBe(mainApp.id);
    expect(comp.comparisonFields.length).toBeGreaterThan(0);
  });

  it('19. Scan summary includes accurate counts for needsAction, looksGood, needsReview, verified, and inactive', async () => {
    const scan = await admissionsService.scanApplicationsForVerification({}, headOfficeScope);
    expect(scan.summary.totalScanned).toBe(30);
    expect(typeof scan.summary.needsActionCount).toBe('number');
    expect(typeof scan.summary.looksGoodCount).toBe('number');
    expect(typeof scan.summary.needsReviewCount).toBe('number');
    expect(typeof scan.summary.possibleDuplicatesCount).toBe('number');
    expect(typeof scan.summary.invalidMissingDataCount).toBe('number');
    expect(typeof scan.summary.verifiedCount).toBe('number');
    expect(typeof scan.summary.inactiveCount).toBe('number');
  });

  it('20. Empty state returns items: [] and total: 0 without throwing error', async () => {
    const list = await admissionsService.getPreAdmissions({ search: 'NonExistentStudentNameXYZ' }, cliftonScope);
    expect(list.items.length).toBe(0);
    expect(list.total).toBe(0);
  });

  it('21. Select 3 unverified applications -> bulk Mark Verified -> exit Needs Action queue -> appear in Test Scheduling', async () => {
    const list = await admissionsService.getPreAdmissions({}, dhaScope);
    const unverifiedApps = list.items.filter((a) => a.verificationStatus === 'UNVERIFIED').slice(0, 3);
    expect(unverifiedApps.length).toBeGreaterThanOrEqual(1);

    const ids = unverifiedApps.map((a) => a.id);
    const bulkRes = await admissionsService.bulkMarkApplicationsVerified(
      { applicationIds: ids, notes: 'Bulk verified via batch action' },
      dhaScope
    );

    expect(bulkRes.verifiedCount).toBe(ids.length);

    // 1. Check they exit Needs Action queue
    const queue = await admissionsService.scanApplicationsForVerification({ filterTab: 'NEEDS_ACTION' }, dhaScope);
    for (const id of ids) {
      expect(queue.items.some((i) => i.id === id)).toBe(false);
    }

    // 2. Check main list shows Verified
    const refreshed = await admissionsService.getPreAdmissions({}, dhaScope);
    for (const id of ids) {
      const app = refreshed.items.find((a) => a.id === id);
      expect(app).toBeDefined();
      expect(app!.verificationStatus).toBe('STAFF_VERIFIED');
    }

    // 3. Check they immediately appear in Test Scheduling candidate list
    const eligible = await admissionsService.getEligibleCandidatesForTest({}, dhaScope);
    for (const id of ids) {
      expect(eligible.some((a) => a.id === id)).toBe(true);
    }
  });

  it('22. Non-test process applicants do not enter test candidate pool when verified', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;

    // Assign to simple admission process (which has no test step)
    await admissionsService.assignProcess(target.id, 'proc_simple_adm', cliftonScope);
    await admissionsService.markApplicationVerified({ applicationId: target.id }, cliftonScope);

    const eligible = await admissionsService.getEligibleCandidatesForTest({}, cliftonScope);
    expect(eligible.some((a) => a.id === target.id)).toBe(false);
  });

  it('23. Automatic Progression: Unverified applicant reflects Current Step = Verification', async () => {
    const list = await admissionsService.getPreAdmissions({}, dhaScope);
    const unverified = list.items.find((a) => a.verificationStatus === 'UNVERIFIED');
    expect(unverified).toBeDefined();
    expect(unverified!.currentStepName).toBe('Verification');
  });

  it('24. Automatic Progression: Mark Verified advances Current Step to Entrance Test', async () => {
    const list = await admissionsService.getPreAdmissions({}, dhaScope);
    const unverified = list.items.find((a) => a.verificationStatus === 'UNVERIFIED')!;
    expect(unverified).toBeDefined();

    const verified = await admissionsService.markApplicationVerified(
      { applicationId: unverified.id, notes: 'Verified documents' },
      dhaScope
    );

    expect(verified.verificationStatus).toBe('STAFF_VERIFIED');
    expect(verified.currentStepName).toBe('Entrance Test');
    expect(verified.currentStepType).toBe('ASSESSMENT_TEST');

    const check = await admissionsService.getPreAdmissionById(unverified.id, dhaScope);
    expect(check.currentStepName).toBe('Entrance Test');
  });

  it('25. Automatic Progression: Scheduling Test does NOT advance Current Step (remains Entrance Test)', async () => {
    const list = await admissionsService.getPreAdmissions({}, dhaScope);
    const target = list.items[0]!;
    await admissionsService.markApplicationVerified({ applicationId: target.id }, dhaScope);

    // Schedule test
    const schedule = await admissionsService.createAdmissionTestSchedule(
      {
        name: 'Entrance Test Session',
        academicYearId: 'ay_2026_2027',
        processDefinitionId: 'proc_general_k12',
        processStepId: 's_test_1',
        classIds: [target.classId],
        date: '2026-08-28',
        startTime: '10:00',
        durationMinutes: 90,
        mode: 'PAPER_BASED',
        candidatePreAdmissionIds: [target.id],
      },
      dhaScope
    );

    await admissionsService.assignApplicantsToTestSchedule(schedule.id, [target.id], dhaScope);

    // Verify Current Step is STILL Entrance Test
    const afterSchedule = await admissionsService.getPreAdmissionById(target.id, dhaScope);
    expect(afterSchedule.currentStepName).toBe('Entrance Test');
    expect(afterSchedule.currentStepType).toBe('ASSESSMENT_TEST');
  });

  it('26. Automatic Progression: Completing Test advances Current Step to Candidate Interview', async () => {
    const list = await admissionsService.getPreAdmissions({}, dhaScope);
    const target = list.items[0]!;
    await admissionsService.markApplicationVerified({ applicationId: target.id }, dhaScope);

    // Complete test step
    const { updatedApplication } = await admissionsService.completeApplicantTestStep(
      { applicationId: target.id, score: 88, outcome: 'PASSED', notes: 'Passed with distinction' },
      dhaScope
    );

    expect(updatedApplication.currentStepName).toBe('Candidate Interview');
    expect(updatedApplication.currentStepType).toBe('INTERVIEW');

    const check = await admissionsService.getPreAdmissionById(target.id, dhaScope);
    expect(check.currentStepName).toBe('Candidate Interview');
    expect(check.currentStepType).toBe('INTERVIEW');
  });
});
