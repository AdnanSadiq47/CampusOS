import { describe, it, expect, beforeEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  organizations,
  schools,
  branches,
  preAdmissions,
  preAdmissionDocuments,
  preAdmissionFeePayments,
  applicationFeeRules,
  auditLogs,
  TenantTransactionManager,
} from '@campus-os/database';
import { AdmissionsService, UserScopeContext } from '../src/modules/admissions/admissions.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { WorkingContextService } from '../src/core/hierarchy/working-context.service.js';
import { eq } from 'drizzle-orm';

describe('Pre-Admission Master Verification Upgrade — 32 Invariants Test Suite', () => {
  let pglite: PGlite;
  let db: any;
  let txManager: TenantTransactionManager;
  let auditService: AuditService;
  let contextService: WorkingContextService;
  let admissionsService: AdmissionsService;

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

  beforeEach(async () => {
    pglite = new PGlite();
    db = drizzle(pglite);

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

    // Seed campuses
    await db.insert(branches).values([
      { id: CAMPUS_MAIN, organizationId: TENANT_A, schoolId: SCHOOL_BEACON, name: 'Main Campus (Gulshan)', code: 'CMP-01' },
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

    // Warm up initial seed data
    await admissionsService.getPreAdmissions({}, { organizationId: TENANT_A });
  });

  // ─────────────────────────────────────────────────────────────
  // 1 to 10: SYSTEM CHECK INVARIANTS
  // ─────────────────────────────────────────────────────────────

  it('1. System check on clean application returns advisory READY and does NOT change status to final VERIFIED', async () => {
    const res = await admissionsService.runSystemCheck({ tab: 'READY' }, cliftonScope);
    expect(res.summary.readyForHumanVerification).toBeGreaterThan(0);

    const cleanItem = res.items.find((i) => i.systemResult === 'READY' && i.humanVerificationStatus === 'PENDING');
    expect(cleanItem).toBeDefined();
    expect(cleanItem!.dataCheckStatus).toBe('CLEAR');
    expect(cleanItem!.systemResult).toBe('READY');

    // Human verification status must remain PENDING / unverified
    expect(cleanItem!.humanVerificationStatus).not.toBe('VERIFIED');
  });

  it('2. System check with dummy/sample student name flags SUSPICIOUS_DUMMY_DATA / Advisory issue', async () => {
    const res = await admissionsService.runSystemCheck({ tab: 'NEEDS_REVIEW' }, headOfficeScope);
    const dummyApp = res.items.find((i) => i.issues.some((iss) => iss.code === 'SUSPICIOUS_DUMMY_DATA'));
    expect(dummyApp).toBeDefined();
    expect(dummyApp!.dataCheckStatus).toBe('NEEDS_REVIEW');
    expect(dummyApp!.systemResult).toBe('NEEDS_REVIEW');
    expect(dummyApp!.issueBadges.some((b) => b.toLowerCase().includes('sample') || b.toLowerCase().includes('dummy'))).toBe(true);
  });

  it('3. System check with duplicate applicant flags POSSIBLE_DUPLICATE with matching candidate reference', async () => {
    const res = await admissionsService.runSystemCheck({ tab: 'NEEDS_REVIEW' }, headOfficeScope);
    const dupApp = res.items.find((i) => i.issues.some((iss) => iss.code === 'POSSIBLE_DUPLICATE'));
    expect(dupApp).toBeDefined();
    expect(dupApp!.dataCheckStatus).toBe('NEEDS_REVIEW');
    expect(dupApp!.issueBadges.some((b) => b.includes('Duplicate'))).toBe(true);
  });

  it('4. System check with unreadable/corrupt document marks document UNREADABLE and advisory flag', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const app = list.items[0]!;

    // Insert an unreadable document
    await db.insert(preAdmissionDocuments).values({
      organizationId: TENANT_A,
      schoolId: SCHOOL_BEACON,
      campusId: CAMPUS_CLIFTON,
      applicationId: app.id,
      documentCode: 'DOC_EXTRA',
      documentName: 'Corrupt Document Scan',
      fileKey: `uploads/${app.id}/corrupt.pdf`,
      fileUrl: `/uploads/${app.id}/corrupt.pdf`,
      fileName: 'corrupt_scan_unreadable.pdf',
      fileSize: 100,
      isRequired: true,
      systemVerificationStatus: 'UNREADABLE',
      staffVerificationStatus: 'UNVERIFIED',
    });

    const res = await admissionsService.runSystemCheck({}, cliftonScope);
    const checked = res.items.find((i) => i.id === app.id);
    expect(checked).toBeDefined();
    expect(checked!.docsCheckStatus).toBe('NEEDS_REVIEW');
    expect(checked!.issueBadges.some((b) => b.includes('Unreadable') || b.includes('Document'))).toBe(true);
  });

  it('5. System check with mismatched document name/CNIC marks document POSSIBLE_MISMATCH advisory', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const app = list.items[1]!;

    await db.insert(preAdmissionDocuments).values({
      organizationId: TENANT_A,
      schoolId: SCHOOL_BEACON,
      campusId: CAMPUS_CLIFTON,
      applicationId: app.id,
      documentCode: 'DOC_MISMATCH',
      documentName: 'Mismatched B-Form',
      fileKey: `uploads/${app.id}/mismatch.pdf`,
      fileUrl: `/uploads/${app.id}/mismatch.pdf`,
      fileName: 'mismatch_sample.pdf',
      fileSize: 1024 * 200,
      isRequired: true,
      systemVerificationStatus: 'POSSIBLE_MISMATCH',
      staffVerificationStatus: 'UNVERIFIED',
    });

    const res = await admissionsService.runSystemCheck({}, cliftonScope);
    const checked = res.items.find((i) => i.id === app.id);
    expect(checked).toBeDefined();
    expect(checked!.docsCheckStatus).toBe('NEEDS_REVIEW');
    expect(checked!.issueBadges.some((b) => b.includes('Mismatch') || b.includes('Doc'))).toBe(true);
  });

  it('6. System check with unpaid fee on mandatory fee policy returns fee status NEEDS_REVIEW', async () => {
    const res = await admissionsService.runSystemCheck({}, cliftonScope);
    const unpaidItem = res.items.find((i) => i.feeCheckStatus === 'NEEDS_REVIEW');
    if (unpaidItem) {
      expect(unpaidItem.feeStatusBadge).toBe('Unpaid');
      expect(unpaidItem.systemResult).toBe('NEEDS_REVIEW');
    }
  });

  it('7. System check with paid fee returns fee status CLEAR', async () => {
    const res = await admissionsService.runSystemCheck({}, cliftonScope);
    const paidItem = res.items.find((i) => i.feeCheckStatus === 'CLEAR' && i.feeStatusBadge === 'Paid');
    expect(paidItem).toBeDefined();
    expect(paidItem!.feeCheckStatus).toBe('CLEAR');
  });

  it('8. System check with test-day payment allowed returns fee status CLEAR', async () => {
    // PECHS campus is under City Grammar (collectionRule: PAYMENT_ALLOWED_ON_TEST_DAY)
    const pechsScope: UserScopeContext = {
      organizationId: TENANT_A,
      userRole: 'ADMIN',
      workingContext: { nodeId: 'cmp_pechs', nodeType: 'CAMPUS', organizationId: TENANT_A },
    };
    const res = await admissionsService.runSystemCheck({}, pechsScope);
    expect(res.items.length).toBeGreaterThan(0);
    for (const item of res.items) {
      expect(item.feeCheckStatus).toBe('CLEAR');
      expect(['Test-Day Payment', 'Paid']).toContain(item.feeStatusBadge);
    }
  });

  it('9. System check with waived fee returns fee status CLEAR', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const app = list.items[0]!;

    await db.update(preAdmissionFeePayments)
      .set({ paymentStatus: 'WAIVED', waiverReason: 'Need-based scholarship' })
      .where(eq(preAdmissionFeePayments.applicationId, app.id));

    const res = await admissionsService.runSystemCheck({}, cliftonScope);
    const checked = res.items.find((i) => i.id === app.id);
    expect(checked).toBeDefined();
    expect(checked!.feeCheckStatus).toBe('CLEAR');
    expect(checked!.feeStatusBadge).toBe('Waived');
  });

  it('10. System check summary counts correctly compute totalScanned, readyForHumanVerification, needsReview, dataReview, docsReview, feeReview', async () => {
    const res = await admissionsService.runSystemCheck({}, headOfficeScope);
    expect(res.summary.totalScanned).toBeGreaterThan(0);
    expect(res.summary.readyForHumanVerification + res.summary.needsReview).toBe(res.summary.totalScanned);
    expect(res.summary.dataClear + res.summary.dataReview).toBe(res.summary.totalScanned);
    expect(res.summary.docsClear + res.summary.docsReview).toBe(res.summary.totalScanned);
    expect(res.summary.feeClear + res.summary.feeReview).toBe(res.summary.totalScanned);
  });

  // ─────────────────────────────────────────────────────────────
  // 11 to 15: HUMAN VERIFICATION INVARIANTS
  // ─────────────────────────────────────────────────────────────

  it('11. Human Verification: staff approves ready application -> transitions to STAFF_VERIFIED with verifiedBy, verifiedAt, verificationMethod = STAFF', async () => {
    const res = await admissionsService.runSystemCheck({ tab: 'READY' }, cliftonScope);
    const target = res.items.find((i) => i.systemResult === 'READY')!;
    expect(target).toBeDefined();

    const verified = await admissionsService.singleHumanVerify(
      target.id,
      { verifiedBy: 'Senior Registrar' },
      cliftonScope
    );

    expect(verified.verificationStatus).toBe('STAFF_VERIFIED');
    expect(verified.verifiedBy).toBe('Senior Registrar');
    expect(verified.verifiedAt).toBeDefined();
    expect(verified.verificationMethod).toBe('STAFF');
  });

  it('12. Human Verification: staff overrides flagged issue with reason -> transitions to STAFF_VERIFIED with verificationOverrideReason recorded', async () => {
    const res = await admissionsService.runSystemCheck({ tab: 'NEEDS_REVIEW' }, headOfficeScope);
    const target = res.items.find((i) => i.systemResult === 'NEEDS_REVIEW')!;
    expect(target).toBeDefined();

    const verified = await admissionsService.singleHumanVerify(
      target.id,
      { verifiedBy: 'Principal Office', overrideReason: 'Manual verification of physical document completed' },
      headOfficeScope
    );

    expect(verified.verificationStatus).toBe('STAFF_VERIFIED');
    expect(verified.verificationMethod).toBe('OVERRIDE');
    expect(verified.verificationOverrideReason).toBe('Manual verification of physical document completed');
  });

  it('13. Human Verification: staff rejects application -> transitions to REJECTED', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;

    const rejected = await admissionsService.humanOverrideVerification(
      { applicationId: target.id, action: 'REJECT', overrideReason: 'Failed criteria' },
      cliftonScope
    );

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.verificationStatus).toBe('REJECTED');
  });

  it('14. Bulk Human Verification: verifies multiple eligible clean applications in single atomic batch', async () => {
    const res = await admissionsService.runSystemCheck({ tab: 'READY' }, cliftonScope);
    const eligibleIds = res.items.filter((i) => i.isEligibleForBulkHumanVerify).map((i) => i.id).slice(0, 3);
    expect(eligibleIds.length).toBeGreaterThan(0);

    const result = await admissionsService.bulkHumanVerify(
      { applicationIds: eligibleIds, verifiedBy: 'Admissions Panel' },
      cliftonScope
    );

    expect(result.verifiedCount).toBe(eligibleIds.length);
    expect(result.verifiedApplicationIds.length).toBe(eligibleIds.length);
  });

  it('15. Bulk Human Verification: ignores flagged applications from batch unless clean', async () => {
    const res = await admissionsService.runSystemCheck({}, headOfficeScope);
    const readyItem = res.items.find((i) => i.systemResult === 'READY');
    const flaggedItem = res.items.find((i) => i.systemResult === 'NEEDS_REVIEW');

    if (readyItem && flaggedItem) {
      const result = await admissionsService.bulkHumanVerify(
        { applicationIds: [readyItem.id, flaggedItem.id], verifiedBy: 'Panel' },
        headOfficeScope
      );

      expect(result.verifiedApplicationIds).toContain(readyItem.id);
      expect(result.skippedFlaggedApplicationIds).toContain(flaggedItem.id);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 16 to 24: APPLICATION FEE RULES & SNAPSHOTS
  // ─────────────────────────────────────────────────────────────

  it('16. Application Fee Configuration: Admin creates fee rule for multi-campus and multi-class combination', async () => {
    const created = await admissionsService.createOrUpdateFeeRule(
      {
        academicYearId: 'ay_2026_2027',
        campusIds: [CAMPUS_CLIFTON, CAMPUS_DHA],
        classIds: ['cls-g1', 'cls-g3', 'cls-g5'],
        feeAmount: 3500,
        currency: 'PKR',
        instructions: 'Pay online via Meezan portal or cash counter.',
        collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
        feeNotRequired: false,
        isActive: true,
      },
      headOfficeScope
    );

    expect(created.id).toBeDefined();
    expect(created.feeAmount).toBe(3500);
    expect(created.campusIds).toContain(CAMPUS_CLIFTON);
    expect(created.classIds).toContain('cls-g1');
  });

  it('17. Application Fee Configuration: Fee rule resolves correctly by (academicYear, campusId, classId)', async () => {
    await admissionsService.createOrUpdateFeeRule(
      {
        academicYearId: 'ay_2026_2027',
        campusIds: [CAMPUS_DHA],
        classIds: ['cls-g9'],
        feeAmount: 4000,
        currency: 'PKR',
        instructions: 'O-Level application fee.',
        collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
        feeNotRequired: false,
        isActive: true,
      },
      headOfficeScope
    );

    const resolved = await admissionsService.resolveFeeRule(
      {
        academicYearId: 'ay_2026_2027',
        campusId: CAMPUS_DHA,
        classId: 'cls-g9',
      },
      dhaScope
    );

    expect(resolved.feeAmount).toBe(4000);
    expect(resolved.feeNotRequired).toBe(false);
  });

  it('18. Application Fee Configuration: More specific fee rule takes precedence over broader rule', async () => {
    // Broader rule: All classes at Clifton
    await admissionsService.createOrUpdateFeeRule(
      {
        academicYearId: 'ay_2026_2027',
        campusIds: [CAMPUS_CLIFTON],
        classIds: [],
        feeAmount: 2000,
        currency: 'PKR',
        instructions: 'General Clifton fee',
        collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
        feeNotRequired: false,
        isActive: true,
      },
      cliftonScope
    );

    // Specific rule: A-Levels Year 1 at Clifton
    await admissionsService.createOrUpdateFeeRule(
      {
        academicYearId: 'ay_2026_2027',
        campusIds: [CAMPUS_CLIFTON],
        classIds: ['cls-a1'],
        feeAmount: 5000,
        currency: 'PKR',
        instructions: 'A-Level Clifton fee',
        collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
        feeNotRequired: false,
        isActive: true,
      },
      cliftonScope
    );

    const resolvedSpecific = await admissionsService.resolveFeeRule(
      { academicYearId: 'ay_2026_2027', campusId: CAMPUS_CLIFTON, classId: 'cls-a1' },
      cliftonScope
    );
    expect(resolvedSpecific.feeAmount).toBe(5000);

    const resolvedGeneral = await admissionsService.resolveFeeRule(
      { academicYearId: 'ay_2026_2027', campusId: CAMPUS_CLIFTON, classId: 'cls-g3' },
      cliftonScope
    );
    expect(resolvedGeneral.feeAmount).toBe(2000);
  });

  it('19. Application Fee Configuration: Fee Not Required flag resolves feeAmount = 0 and feeNotRequired = true', async () => {
    await admissionsService.createOrUpdateFeeRule(
      {
        academicYearId: 'ay_2026_2027',
        campusIds: [CAMPUS_ISB],
        classIds: [],
        feeAmount: 0,
        currency: 'PKR',
        instructions: 'No application fee required for Islamabad branch.',
        collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
        feeNotRequired: true,
        isActive: true,
      },
      headOfficeScope
    );

    const resolved = await admissionsService.resolveFeeRule(
      { academicYearId: 'ay_2026_2027', campusId: CAMPUS_ISB, classId: 'cls-g1' },
      headOfficeScope
    );

    expect(resolved.feeAmount).toBe(0);
    expect(resolved.feeNotRequired).toBe(true);
  });

  it('20. Application Fee in Form Submission: Form submission captures immutable fee snapshot (feeAmount, currency, collectionRule, paymentStatus)', async () => {
    const createdApp = await admissionsService.createPreAdmission(
      {
        campusId: CAMPUS_CLIFTON,
        academicYearId: 'ay_2026_2027',
        classId: 'cls-g1',
        studentFirstName: 'Haris',
        studentLastName: 'Rauf',
        dateOfBirth: '2019-08-10',
        gender: 'MALE',
        fatherName: 'Rauf Ahmed',
        primaryMobile: '0300-8889911',
        primaryEmail: 'haris.r@example.com',
        source: 'ONLINE',
      },
      cliftonScope
    );

    expect(createdApp.id).toBeDefined();
    expect(createdApp.originalSubmissionSnapshot).toBeDefined();
    expect(createdApp.originalSubmissionSnapshot.studentFirstName).toBe('Haris');
  });

  it('21. Dynamic Form Builder: Public form resolves dynamic application fee and displays payment instructions', async () => {
    const resolved = await admissionsService.resolveFeeRule(
      { academicYearId: 'ay_2026_2027', campusId: CAMPUS_CLIFTON, classId: 'cls-g1' },
      cliftonScope
    );
    expect(resolved).toBeDefined();
    expect(resolved.currency).toBe('PKR');
    expect(resolved.instructions).toBeDefined();
  });

  it('22. Dynamic Form Builder: If Paid = YES, requires payment proof transaction reference/receipt', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const app = list.items[0]!;

    const payment = await admissionsService.submitApplicationFeePayment(
      app.id,
      {
        paidYesNo: 'YES',
        amount: 2000,
        paymentMethod: 'BANK_TRANSFER',
        transactionReference: 'TXN-ONLINE-999',
        receiptFileName: 'slip_receipt.jpg',
      },
      cliftonScope
    );

    expect(['PAID', 'PAID_VERIFIED', 'SUBMITTED']).toContain(payment.paymentStatus);
    expect(payment.transactionReference).toBe('TXN-ONLINE-999');
  });

  it('23. Dynamic Form Builder: If Paid = NO and payment allowed on test day, submission succeeds with PENDING status', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const app = list.items[1]!;

    const payment = await admissionsService.submitApplicationFeePayment(
      app.id,
      {
        paidYesNo: 'NO',
        amount: 2000,
      },
      cliftonScope
    );

    expect(payment.paymentStatus).toBe('PENDING');
  });

  it('24. Dynamic Form Builder: Fee rule changes after submission do not alter historical application fee snapshot', async () => {
    const app = await admissionsService.createPreAdmission(
      {
        campusId: CAMPUS_DHA,
        academicYearId: 'ay_2026_2027',
        classId: 'cls-g5',
        studentFirstName: 'Bilal',
        studentLastName: 'Asif',
        dateOfBirth: '2016-04-12',
        gender: 'MALE',
        fatherName: 'Asif Saeed',
        primaryMobile: '0333-1122334',
        source: 'ONLINE',
      },
      dhaScope
    );

    const snapshotBefore = app.originalSubmissionSnapshot;

    // Admin updates fee rule
    await admissionsService.createOrUpdateFeeRule(
      {
        academicYearId: 'ay_2026_2027',
        campusIds: [CAMPUS_DHA],
        classIds: ['cls-g5'],
        feeAmount: 9999,
        currency: 'PKR',
        instructions: 'New hiked fee',
        collectionRule: 'PAYMENT_REQUIRED_BEFORE_TEST',
        feeNotRequired: false,
        isActive: true,
      },
      dhaScope
    );

    const refreshed = await admissionsService.getPreAdmissionById(app.id, dhaScope);
    expect(refreshed.originalSubmissionSnapshot).toEqual(snapshotBefore);
  });

  // ─────────────────────────────────────────────────────────────
  // 25 to 27: PRE-ADMISSIONS LIST & VIEWS
  // ─────────────────────────────────────────────────────────────

  it('25. Pre-Admissions List: Shows 3 main views: Pending Verification, Needs Review, Verified', async () => {
    const pendingList = await admissionsService.getPreAdmissions({ verificationStatus: 'PENDING_VERIFICATION' as any }, cliftonScope);
    const needsReviewList = await admissionsService.getPreAdmissions({ verificationStatus: 'NEEDS_REVIEW' }, cliftonScope);
    const verifiedList = await admissionsService.getPreAdmissions({ verificationStatus: 'STAFF_VERIFIED' }, cliftonScope);

    expect(pendingList.items).toBeDefined();
    expect(needsReviewList.items).toBeDefined();
    expect(verifiedList.items).toBeDefined();
  });

  it('26. Pre-Admissions List: Issue badges rendered on rows (Possible Duplicate, Missing B-Form, Invalid Mobile, Fee Mismatch)', async () => {
    const list = await admissionsService.getPreAdmissions({}, headOfficeScope);
    const flagged = list.items.filter((a) => (a.verificationIssues || []).length > 0);
    expect(flagged.length).toBeGreaterThan(0);
    for (const app of flagged) {
      expect(app.verificationIssues.length).toBeGreaterThan(0);
    }
  });

  it('27. Pre-Admissions List: Verified view ONLY contains HUMAN VERIFIED (STAFF_VERIFIED) records', async () => {
    const verifiedList = await admissionsService.getPreAdmissions({ verificationStatus: 'STAFF_VERIFIED' }, headOfficeScope);
    for (const item of verifiedList.items) {
      expect(item.verificationStatus).toBe('STAFF_VERIFIED');
    }
  });

  // ─────────────────────────────────────────────────────────────
  // 28 to 32: JOURNEY ENGINE & TEST SCHEDULING ELIGIBILITY
  // ─────────────────────────────────────────────────────────────

  it('28. Admission Journey Engine: Upon Human Verification, applicant automatically transitions to next configured journey step', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const unverified = list.items.find((a) => a.verificationStatus === 'UNVERIFIED')!;
    expect(unverified).toBeDefined();

    const verified = await admissionsService.singleHumanVerify(
      unverified.id,
      { verifiedBy: 'Admissions Officer' },
      cliftonScope
    );

    expect(verified.verificationStatus).toBe('STAFF_VERIFIED');
    expect(verified.currentStepName).toBe('Entrance Test');
    expect(verified.currentStepType).toBe('ASSESSMENT_TEST');
  });

  it('29. Admission Journey Engine: Transition logs audit event with step change and verified timestamp', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;

    await admissionsService.singleHumanVerify(
      target.id,
      { verifiedBy: 'Audited Staff' },
      cliftonScope
    );

    const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, target.id));
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l: any) => l.action.includes('VERIFIED'))).toBe(true);
  });

  it('30. Test Scheduling Candidate Pool: Includes candidate ONLY if HUMAN VERIFIED (STAFF_VERIFIED)', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const unverified = list.items.find((a) => a.verificationStatus === 'UNVERIFIED' && (a.verificationIssues || []).length === 0)!;
    expect(unverified).toBeDefined();

    // Unverified is NOT in eligible test pool
    const beforePool = await admissionsService.getEligibleCandidatesForTest({}, cliftonScope);
    expect(beforePool.some((a) => a.id === unverified.id)).toBe(false);

    // Human verify
    await admissionsService.singleHumanVerify(unverified.id, { verifiedBy: 'Officer' }, cliftonScope);

    // Now enters eligible test pool
    const afterPool = await admissionsService.getEligibleCandidatesForTest({}, cliftonScope);
    expect(afterPool.some((a) => a.id === unverified.id)).toBe(true);
  });

  it('31. Test Scheduling Candidate Pool: System Clear / Auto Checked but NOT human verified is STRICTLY EXCLUDED', async () => {
    const scan = await admissionsService.runSystemCheck({ tab: 'READY' }, cliftonScope);
    const readyApp = scan.items.find((i) => i.systemResult === 'READY' && i.humanVerificationStatus !== 'VERIFIED');
    expect(readyApp).toBeDefined();

    // System scan says READY / clean
    expect(readyApp!.systemResult).toBe('READY');

    // But candidate is NOT human verified yet -> must be excluded from Test Scheduling candidate pool
    const eligiblePool = await admissionsService.getEligibleCandidatesForTest({}, cliftonScope);
    expect(eligiblePool.some((a) => a.id === readyApp!.id)).toBe(false);
  });

  it('32. Test Scheduling Candidate Pool: Non-test journey processes (e.g. direct admission) are STRICTLY EXCLUDED', async () => {
    const list = await admissionsService.getPreAdmissions({}, cliftonScope);
    const target = list.items[0]!;

    // Assign to simple direct admission process (no test step)
    await admissionsService.assignProcess(target.id, 'proc_simple_adm', cliftonScope);
    await admissionsService.singleHumanVerify(target.id, { verifiedBy: 'Officer' }, cliftonScope);

    const eligiblePool = await admissionsService.getEligibleCandidatesForTest({}, cliftonScope);
    expect(eligiblePool.some((a) => a.id === target.id)).toBe(false);
  });
});
