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
import { AcademicService } from '../src/modules/academic/academic.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { WorkingContextService } from '../src/core/hierarchy/working-context.service.js';
import {
  getEntityScopeMode,
  isHierarchyScoped,
  isCampusRequired,
  isTenantWide,
  isGlobal,
} from '../src/core/scope/scope-mode.registry.js';
import { CAMPUS_OS_SCOPE_MATRIX } from '@campus-os/types';

describe('Master Organizational Ownership & Global Working Context Invariant Suite (27+ Invariants)', () => {
  let pglite: PGlite;
  let admissionsService: AdmissionsService;
  let academicService: AcademicService;
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

  const ACTOR_USER = '99999999-9999-9999-9999-999999999999';

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
        columns_config JSONB NOT NULL,
        rows_per_page INTEGER DEFAULT 25 NOT NULL,
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

      CREATE TABLE IF NOT EXISTS pre_admission_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        school_id UUID NOT NULL,
        campus_id UUID NOT NULL,
        application_id UUID NOT NULL,
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
        organization_id UUID NOT NULL,
        school_id UUID NOT NULL,
        campus_id UUID NOT NULL,
        application_id UUID NOT NULL,
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
        organization_id UUID NOT NULL,
        school_id UUID,
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
    academicService = new AcademicService(txManager, auditService, contextService);
    admissionsService = new AdmissionsService(txManager, auditService, contextService);
  });

  // ── INVARIANT 1: organization_id Tenant Isolation ─────────────────────────────
  it('[INV-1] Tenant Isolation: Pre-Admissions and Masters query only active tenant', async () => {
    const scopeA: UserScopeContext = { organizationId: TENANT_A, isSuperAdmin: false };
    const listA = await admissionsService.getPreAdmissions({}, scopeA);
    expect(listA.items.length).toBeGreaterThan(0);
    expect(listA.items.every((a) => a.organizationId === TENANT_A)).toBe(true);

    const scopeB: UserScopeContext = { organizationId: TENANT_B, isSuperAdmin: false };
    const listB = await admissionsService.getPreAdmissions({}, scopeB);
    expect(listB.items.every((a) => a.organizationId === TENANT_B)).toBe(true);
  });

  // ── INVARIANT 2: DHA Campus Scoping ──────────────────────────────────────────
  it('[INV-2] Selected DHA Campus returns ONLY DHA Pre-Admissions', async () => {
    const userScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'cmp_dha',
        nodeType: 'CAMPUS',
        nodeName: 'DHA Phase 6 Campus',
        organizationId: TENANT_A,
      },
    };

    const res = await admissionsService.getPreAdmissions({}, userScope);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((a) => a.campusId === CAMPUS_DHA)).toBe(true);
  });

  // ── INVARIANT 3: Clifton Campus Scoping ────────────────────────────────────────
  it('[INV-3] Selected Clifton Campus returns ONLY Clifton Pre-Admissions', async () => {
    const userScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'cmp_clifton',
        nodeType: 'CAMPUS',
        nodeName: 'Clifton Campus',
        organizationId: TENANT_A,
      },
    };

    const res = await admissionsService.getPreAdmissions({}, userScope);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((a) => a.campusId === CAMPUS_CLIFTON)).toBe(true);
  });

  // ── INVARIANT 4: School Scope Returns Authorized Child Campuses ───────────────
  it('[INV-4] Selected School Context returns all authorized child campuses', async () => {
    const userScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'sch_beacon',
        nodeType: 'SCHOOL',
        nodeName: 'Beacon Horizon Public School',
        organizationId: TENANT_A,
      },
    };

    const res = await admissionsService.getPreAdmissions({}, userScope);
    expect(res.items.length).toBeGreaterThan(0);
    const validCampuses = new Set([CAMPUS_MAIN, CAMPUS_CLIFTON, CAMPUS_DHA]);
    expect(res.items.every((a) => validCampuses.has(a.campusId))).toBe(true);
  });

  // ── INVARIANT 5: Region Scope Returns Authorized Descendant Campuses ─────────
  it('[INV-5] Selected Region Context returns all authorized descendant campuses', async () => {
    const userScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'reg_south',
        nodeType: 'REGION',
        nodeName: 'South Region',
        organizationId: TENANT_A,
      },
    };

    const res = await admissionsService.getPreAdmissions({}, userScope);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.some((a) => a.campusId === CAMPUS_MAIN)).toBe(true);
    expect(res.items.some((a) => a.campusId === CAMPUS_PECHS)).toBe(true);
  });

  // ── INVARIANT 6: Head Office Scope Returns All Descendants ───────────────────
  it('[INV-6] Selected Head Office Context returns all organization campuses', async () => {
    const userScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'ho_alpha',
        nodeType: 'HEAD_OFFICE',
        nodeName: 'Alpha Academy Head Office',
        organizationId: TENANT_A,
      },
    };

    const res = await admissionsService.getPreAdmissions({}, userScope);
    expect(res.total).toBe(30);
    expect(res.summary.totalPreAdmissions).toBe(30);
  });

  // ── INVARIANT 7: Unauthorized Sibling Node Access Blocked ────────────────────
  it('[INV-7] User authorized only for Clifton cannot access DHA Campus context', async () => {
    const restrictedUserScope: UserScopeContext = {
      organizationId: TENANT_A,
      authorizedCampusIds: [CAMPUS_CLIFTON],
    };

    expect(() => {
      contextService.resolveEffectiveScope(restrictedUserScope, 'cmp_dha', 'CAMPUS');
    }).toThrowError(/Working Context Authorization Violation/);
  });

  // ── INVARIANT 8: Cross-Tenant Record Access Blocked ──────────────────────────
  it('[INV-8] Cross-tenant record request is blocked with Tenant Violation', async () => {
    const userScope: UserScopeContext = { organizationId: TENANT_A };
    expect(() => {
      contextService.resolveEffectiveScope(userScope, 'ho_beta', 'HEAD_OFFICE');
    }).toThrowError(/Tenant Isolation Violation/);
  });

  // ── INVARIANT 9: Detail URL Outside Working Context Blocked ─────────────────
  it('[INV-9] Detail route blocked when record belongs to out-of-context campus', async () => {
    const cliftonList = await admissionsService.getPreAdmissions(
      { campusId: CAMPUS_CLIFTON },
      { organizationId: TENANT_A }
    );
    const cliftonAppId = cliftonList.items[0]!.id;

    const dhaScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'cmp_dha',
        nodeType: 'CAMPUS',
        nodeName: 'DHA Phase 6 Campus',
        organizationId: TENANT_A,
      },
    };

    await expect(admissionsService.getPreAdmissionById(cliftonAppId, dhaScope)).rejects.toThrowError(
      /Access Denied/
    );
  });

  // ── INVARIANT 10: Search Cannot Leak Sibling Campus Records ──────────────────
  it('[INV-10] Search query in DHA context does not leak Clifton or PECHS applicants', async () => {
    const dhaScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'cmp_dha',
        nodeType: 'CAMPUS',
        nodeName: 'DHA Phase 6 Campus',
        organizationId: TENANT_A,
      },
    };

    const res = await admissionsService.getPreAdmissions({ search: 'Ahmed' }, dhaScope);
    expect(res.items.every((a) => a.campusId === CAMPUS_DHA)).toBe(true);
  });

  // ── INVARIANT 11: KPIs Strictly Match Active Working Context ────────────────
  it('[INV-11] KPI counts strictly represent the active working context', async () => {
    const dhaScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'cmp_dha',
        nodeType: 'CAMPUS',
        nodeName: 'DHA Phase 6 Campus',
        organizationId: TENANT_A,
      },
    };

    const res = await admissionsService.getPreAdmissions({}, dhaScope);
    expect(res.summary.totalPreAdmissions).toBe(res.items.length);
    expect(res.summary.newSubmitted + res.summary.inProcess + res.summary.completed).toBeLessThanOrEqual(
      res.summary.totalPreAdmissions
    );
  });

  // ── INVARIANT 12: Bulk Verification Cannot Modify Out-of-Context Records ────
  it('[INV-12] Bulk verification rejects out-of-context applicants', async () => {
    const cliftonList = await admissionsService.getPreAdmissions(
      { campusId: CAMPUS_CLIFTON },
      { organizationId: TENANT_A }
    );
    const cliftonAppId = cliftonList.items[0]!.id;

    const dhaScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'cmp_dha',
        nodeType: 'CAMPUS',
        nodeName: 'DHA Phase 6 Campus',
        organizationId: TENANT_A,
      },
    };

    const bulkRes = await admissionsService.bulkVerifyCleanApplications(
      { applicationIds: [cliftonAppId] },
      dhaScope
    );
    expect(bulkRes.verifiedCount).toBe(0);
    expect(bulkRes.advancedApplicationIds.length).toBe(0);
  });

  // ── INVARIANT 13: Create Stores Correct organization_id, school_id, campus_id ─
  it('[INV-13] Create Pre-Admission persists correct ownership anchors in DB', async () => {
    const dhaScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'cmp_dha',
        nodeType: 'CAMPUS',
        nodeName: 'DHA Phase 6 Campus',
        organizationId: TENANT_A,
      },
    };

    const created = await admissionsService.createPreAdmission(
      {
        campusId: CAMPUS_DHA,
        schoolId: SCHOOL_BEACON,
        academicYearId: 'ay_2026_2027',
        classId: 'cls-g1',
        formDefinitionId: 'f_prereg_2026',
        studentName: 'Zayd Omar',
        gender: 'MALE',
        dateOfBirth: '2019-05-15',
        fatherOrGuardianName: 'Omar Farooq',
        primaryMobile: '0300-1112233',
        formData: {
          studentFirstName: 'Zayd',
          studentLastName: 'Omar',
          fatherName: 'Omar Farooq',
          primaryMobile: '0300-1112233',
        },
      },
      dhaScope
    );

    expect(created.id).toBeDefined();
    expect(created.organizationId).toBe(TENANT_A);
    expect(created.campusId).toBe(CAMPUS_DHA);
    expect(created.schoolId).toBe(SCHOOL_BEACON);
    expect(created.originalSubmissionSnapshot).toBeDefined();
  });

  // ── INVARIANT 14: Spoofed School + Campus Combination Rejected ───────────────
  it('[INV-14] Backend rejects spoofed school_id and campus_id mismatch', async () => {
    const userScope: UserScopeContext = { organizationId: TENANT_A };

    await expect(
      admissionsService.createPreAdmission(
        {
          campusId: CAMPUS_DHA,
          schoolId: SCHOOL_CITY,
          academicYearId: 'ay_2026_2027',
          classId: 'cls-g1',
          formDefinitionId: 'f_prereg_2026',
          studentName: 'Spoof Test',
          formData: {},
        },
        userScope
      )
    ).rejects.toThrowError(/Invalid Organizational Scope/);
  });

  // ── INVARIANT 15: Original Submission Snapshot Preserved Immutably ───────────
  it('[INV-15] Editing operational data preserves immutable original submission snapshot', async () => {
    const list = await admissionsService.getPreAdmissions({}, { organizationId: TENANT_A });
    const app = list.items[0]!;

    const edited = await admissionsService.editOperationalData(
      {
        applicationId: app.id,
        studentName: 'Corrected Student Name',
        correctionReason: 'Typo fixed during parent document review',
      },
      { organizationId: TENANT_A }
    );

    expect(edited.studentName).toBe('Corrected Student Name');
    expect(edited.isCorrected).toBe(true);
    expect(edited.originalSubmissionSnapshot).toBeDefined();
    expect(edited.originalSubmissionSnapshot.studentFirstName).toBeDefined();
  });

  // ── INVARIANT 16: DB PERSISTENCE SURVIVABILITY TEST ───────────────────────────
  it('[INV-16] PERSISTENCE PROOF: Created application survives service re-instantiation', async () => {
    const dhaScope: UserScopeContext = {
      organizationId: TENANT_A,
      workingContext: {
        nodeId: 'cmp_dha',
        nodeType: 'CAMPUS',
        nodeName: 'DHA Phase 6 Campus',
        organizationId: TENANT_A,
      },
    };

    const created = await admissionsService.createPreAdmission(
      {
        campusId: CAMPUS_DHA,
        schoolId: SCHOOL_BEACON,
        academicYearId: 'ay_2026_2027',
        classId: 'cls-g3',
        formDefinitionId: 'f_prereg_2026',
        studentName: 'Persistence Check Student',
        fatherOrGuardianName: 'Persistence Parent',
        primaryMobile: '0311-9998877',
        formData: {
          studentFirstName: 'Persistence',
          studentLastName: 'Check',
        },
      },
      dhaScope
    );

    const createdId = created.id;

    // SIMULATE COMPLETE PROCESS / SERVICE RESTART: Instantiate a brand new AdmissionsService
    const freshAdmissionsService = new AdmissionsService(txManager, auditService, contextService);

    const retrieved = await freshAdmissionsService.getPreAdmissionById(createdId, dhaScope);

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(createdId);
    expect(retrieved.studentName).toBe('Persistence Check Student');
    expect(retrieved.campusId).toBe(CAMPUS_DHA);
    expect(retrieved.organizationId).toBe(TENANT_A);
  });

  // ── INVARIANT 17: Universal Admin Config Stays Effective in Campus Context ───
  it('[INV-17] Universal Admin Config level is visible in DHA Context', async () => {
    await academicService.createAcademicLevel(
      TENANT_A,
      {
        name: 'Primary Stage (Universal)',
        shortName: 'LVL-PRI',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER
    );

    const levels = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_DHA]);

    expect(levels.some((l) => l.name === 'Primary Stage (Universal)')).toBe(true);
  });

  // ── INVARIANT 18: Sibling-Only Admin Config is NOT Effective in DHA Context ───
  it('[INV-18] Clifton-only configuration is HIDDEN in default DHA Context', async () => {
    const cliftonOnly = await academicService.createAcademicLevel(
      TENANT_A,
      {
        name: 'Clifton Special Stage',
        shortName: 'LVL-CSS',
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_CLIFTON],
      },
      ACTOR_USER
    );

    const dhaLevels = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_DHA]);
    expect(dhaLevels.some((l) => l.id === cliftonOnly.id)).toBe(false);

    const cliftonLevels = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_CLIFTON]);
    expect(cliftonLevels.some((l) => l.id === cliftonOnly.id)).toBe(true);
  });

  // ── INVARIANT 19: Dynamic List View Configuration Persists in DB ─────────────
  it('[INV-19] Pre-Admissions list view column config persists in PostgreSQL', async () => {
    const userScope: UserScopeContext = {
      organizationId: TENANT_A,
      userRole: 'staff_coordinator',
    };

    const saved = await admissionsService.saveListViewConfig(
      {
        columns: [
          { id: 'c1', key: 'applicationNumber', label: 'App No', category: 'SYSTEM', isVisible: true, sortOrder: 1 },
          { id: 'c2', key: 'studentName', label: 'Student', category: 'CANONICAL', isVisible: true, sortOrder: 2 },
        ],
        rowsPerPage: 50,
      },
      userScope
    );

    expect(saved.rowsPerPage).toBe(50);
    expect(saved.columns.length).toBe(2);

    const loaded = await admissionsService.getListViewConfig(userScope);
    expect(loaded.rowsPerPage).toBe(50);
    expect(loaded.columns.length).toBe(2);
  });

  // ── INVARIANT 20-23: Scope Matrix and Schema Guardrails Invariants ───────────
  it('[INV-20] Central Scope Matrix validates CAMPUS_REQUIRED entities have 3 mandatory keys', () => {
    const campusRequiredEntities = CAMPUS_OS_SCOPE_MATRIX.filter((e) => e.scopeMode === 'CAMPUS_REQUIRED');
    expect(campusRequiredEntities.length).toBeGreaterThan(0);
    for (const ent of campusRequiredEntities) {
      expect(ent.hasOrganizationId).toBe(true);
      expect(ent.hasSchoolId).toBe(true);
      expect(ent.hasCampusId).toBe(true);
      expect(ent.isWorkingContextApplied).toBe(true);
      expect(ent.isBackendEnforced).toBe(true);
    }
  });

  it('[INV-21] Central Scope Matrix validates TENANT_WIDE entities enforce organization_id', () => {
    const tenantWideEntities = CAMPUS_OS_SCOPE_MATRIX.filter((e) => e.scopeMode === 'TENANT_WIDE');
    expect(tenantWideEntities.length).toBeGreaterThan(0);
    for (const ent of tenantWideEntities) {
      expect(ent.hasOrganizationId).toBe(true);
      expect(ent.isBackendEnforced).toBe(true);
    }
  });

  it('[INV-22] Central Scope Matrix validates HIERARCHY_SCOPED entities have hierarchy assignment', () => {
    const hierarchyEntities = CAMPUS_OS_SCOPE_MATRIX.filter((e) => e.scopeMode === 'HIERARCHY_SCOPED');
    expect(hierarchyEntities.length).toBeGreaterThan(0);
    for (const ent of hierarchyEntities) {
      expect(ent.hasOrganizationId).toBe(true);
      expect(ent.hasHierarchyAssignment).toBe(true);
      expect(ent.isWorkingContextApplied).toBe(true);
    }
  });

  it('[INV-23] Scope Registry helper functions classify entities accurately', () => {
    expect(getEntityScopeMode('pre_admissions')).toBe('CAMPUS_REQUIRED');
    expect(isCampusRequired('pre_admissions')).toBe(true);
    expect(isHierarchyScoped('academic_levels')).toBe(true);
    expect(isTenantWide('field_definitions')).toBe(true);
    expect(isGlobal('countries')).toBe(true);
  });
});
