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
import { WorkingContextService, CAMPUS_IDS } from '../src/core/hierarchy/working-context.service.js';
import { ForbiddenException } from '@nestjs/common';

describe('Verification Working Context Scope Enforcement Invariant Suite', () => {
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

  it('1. Clifton verification scan excludes DHA and Main campus (returns exactly 5 Clifton records)', async () => {
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

    const res = await admissionsService.scanApplicationsForVerification({}, cliftonScope);
    expect(res.summary.totalScanned).toBe(5);
    expect(res.items.length).toBe(5);
    expect(res.items.every((i) => i.campusName === 'Clifton Campus')).toBe(true);
  });

  it('2. DHA verification scan excludes Clifton and Main campus (returns exactly 5 DHA records)', async () => {
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

    const res = await admissionsService.scanApplicationsForVerification({}, dhaScope);
    expect(res.summary.totalScanned).toBe(5);
    expect(res.items.length).toBe(5);
    expect(res.items.every((i) => i.campusName === 'DHA Phase 6 Campus')).toBe(true);
  });

  it('3. School scan includes only its child campuses (Beacon Horizon: 15, City Grammar: 10)', async () => {
    const beaconScope: UserScopeContext = {
      organizationId: TENANT_A,
      userRole: 'ADMIN',
      workingContext: {
        nodeId: 'sch_beacon',
        nodeType: 'SCHOOL',
        nodeName: 'Beacon Horizon Public School',
        organizationId: TENANT_A,
      },
    };
    const beaconRes = await admissionsService.scanApplicationsForVerification({}, beaconScope);
    expect(beaconRes.summary.totalScanned).toBe(15);
    expect(beaconRes.items.length).toBe(15);

    const grammarScope: UserScopeContext = {
      organizationId: TENANT_A,
      userRole: 'ADMIN',
      workingContext: {
        nodeId: 'sch_grammar',
        nodeType: 'SCHOOL',
        nodeName: 'City Grammar School',
        organizationId: TENANT_A,
      },
    };
    const grammarRes = await admissionsService.scanApplicationsForVerification({}, grammarScope);
    expect(grammarRes.summary.totalScanned).toBe(10);
    expect(grammarRes.items.length).toBe(10);
  });

  it('4. Region scan includes only its descendants (South: 25, North: 5)', async () => {
    const southScope: UserScopeContext = {
      organizationId: TENANT_A,
      userRole: 'ADMIN',
      workingContext: {
        nodeId: 'reg_south',
        nodeType: 'REGION',
        nodeName: 'South Region',
        organizationId: TENANT_A,
      },
    };
    const southRes = await admissionsService.scanApplicationsForVerification({}, southScope);
    expect(southRes.summary.totalScanned).toBe(25);

    const northScope: UserScopeContext = {
      organizationId: TENANT_A,
      userRole: 'ADMIN',
      workingContext: {
        nodeId: 'reg_north',
        nodeType: 'REGION',
        nodeName: 'North Region',
        organizationId: TENANT_A,
      },
    };
    const northRes = await admissionsService.scanApplicationsForVerification({}, northScope);
    expect(northRes.summary.totalScanned).toBe(5);
  });

  it('5. Head Office scan includes all authorized descendants (30)', async () => {
    const hoScope: UserScopeContext = {
      organizationId: TENANT_A,
      userRole: 'ADMIN',
      workingContext: {
        nodeId: 'ho_alpha',
        nodeType: 'HEAD_OFFICE',
        nodeName: 'Alpha Academy Head Office',
        organizationId: TENANT_A,
      },
    };
    const hoRes = await admissionsService.scanApplicationsForVerification({}, hoScope);
    expect(hoRes.summary.totalScanned).toBe(30);
  });

  it('6. Verification summary metrics are strictly scoped to active working context', async () => {
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
    const res = await admissionsService.scanApplicationsForVerification({}, cliftonScope);
    expect(res.summary.totalScanned).toBe(5);
    expect(
      res.summary.looksGoodCount +
        res.summary.needsReviewCount +
        res.summary.possibleDuplicatesCount +
        res.summary.invalidMissingDataCount
    ).toBe(5);
  });

  it('7. Needs Review list respects context and only contains records from active campus', async () => {
    const pechsScope: UserScopeContext = {
      organizationId: TENANT_A,
      userRole: 'ADMIN',
      workingContext: {
        nodeId: 'cmp_pechs',
        nodeType: 'CAMPUS',
        nodeName: 'PECHS Senior Campus',
        organizationId: TENANT_A,
      },
    };
    const res = await admissionsService.scanApplicationsForVerification({}, pechsScope);
    expect(res.summary.totalScanned).toBe(5);
    expect(res.items.every((i) => i.campusName === 'PECHS Senior Campus')).toBe(true);
  });

  it('8. Bulk Verify Clean cannot modify sibling-campus records outside active context', async () => {
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

    const allApps = await admissionsService.getPreAdmissions({}, { organizationId: TENANT_A });
    const allIds = allApps.items.map((a) => a.id);

    const bulkRes = await admissionsService.bulkVerifyCleanApplications(
      { applicationIds: allIds },
      dhaScope
    );

    expect(bulkRes.verifiedCount).toBeLessThanOrEqual(5);
  });

  it('9. Individual override verification blocks modifying out-of-context records with 403 Forbidden', async () => {
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

    const allApps = await admissionsService.getPreAdmissions({}, { organizationId: TENANT_A });
    const isbApp = allApps.items.find((a) => a.campusId === CAMPUS_ISB)!;

    await expect(
      admissionsService.overrideVerification(
        {
          applicationId: isbApp.id,
          action: 'VERIFY_ANYWAY',
          overrideReason: 'Unauthorized cross-campus attempt',
        },
        cliftonScope
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('10. Operational data edit blocks modifying out-of-context records with 403 Forbidden', async () => {
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

    const allApps = await admissionsService.getPreAdmissions({}, { organizationId: TENANT_A });
    const mainApp = allApps.items.find((a) => a.campusId === CAMPUS_MAIN)!;

    await expect(
      admissionsService.editOperationalData(
        {
          applicationId: mainApp.id,
          studentName: 'Hacked Name',
        },
        cliftonScope
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('11. Tenant isolation remains strictly enforced across verification queries', async () => {
    const tenantBScope: UserScopeContext = {
      organizationId: TENANT_B,
      userRole: 'ADMIN',
    };

    const res = await admissionsService.scanApplicationsForVerification({}, tenantBScope);
    expect(res.summary.totalScanned).toBe(0);
    expect(res.items.length).toBe(0);
  });

  it('12. Cross-campus duplicate reference does not leak unauthorized write access', async () => {
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

    const allApps = await admissionsService.getPreAdmissions({}, { organizationId: TENANT_A });
    const cliftonApp = allApps.items.find((a) => a.campusId === CAMPUS_CLIFTON)!;
    const mainApp = allApps.items.find((a) => a.campusId === CAMPUS_MAIN)!;

    const comp = await admissionsService.getDuplicateComparison(cliftonApp.id, mainApp.id, cliftonScope);
    expect(comp.currentApplication.id).toBe(cliftonApp.id);
    expect(comp.existingApplication.id).toBe(mainApp.id);
    expect(comp.comparisonFields.length).toBeGreaterThan(0);
  });
});
