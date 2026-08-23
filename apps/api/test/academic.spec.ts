import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  organizations,
  branches,
  configScopeBranches,
  academicYears,
  boards,
  academicLevels,
  subjects,
  classes,
  classSubjectMappings,
  sections,
  languages,
  auditLogs,
  TenantTransactionManager,
} from '@campus-os/database';
import { AcademicService } from '../src/modules/academic/academic.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';

describe('Academic Setup & Governance Engine Integration Tests', () => {
  let pglite: PGlite;
  let academicService: AcademicService;
  let auditService: AuditService;
  let txManager: TenantTransactionManager;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';
  const CAMPUS_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const CAMPUS_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CAMPUS_C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  beforeEach(async () => {
    pglite = new PGlite();
    const db = drizzle(pglite);

    // Create all required schema tables
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

      CREATE TABLE IF NOT EXISTS academic_years (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
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
        short_name VARCHAR(64),
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
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
        short_name VARCHAR(64),
        code VARCHAR(64),
        type VARCHAR(64) DEFAULT 'Theory' NOT NULL,
        category VARCHAR(64) DEFAULT 'Core' NOT NULL,
        default_max_marks NUMERIC(6, 2),
        default_passing_marks NUMERIC(6, 2),
        has_practical BOOLEAN DEFAULT FALSE NOT NULL,
        practical_max_marks NUMERIC(6, 2),
        credit_weight NUMERIC(4, 2),
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

      CREATE TABLE IF NOT EXISTS class_subject_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        is_compulsory BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(64) NOT NULL,
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
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

    // Seed test organizations and branches
    await db.insert(organizations).values([
      { id: TENANT_A, code: 'ORG-A', name: 'Beaconhouse Group' },
      { id: TENANT_B, code: 'ORG-B', name: 'City School Network' },
    ]);

    await db.insert(branches).values([
      { id: CAMPUS_A, organizationId: TENANT_A, name: 'Main Campus Gulshan', code: 'BH-GUL' },
      { id: CAMPUS_B, organizationId: TENANT_A, name: 'Clifton Campus', code: 'BH-CLF' },
    ]);

    txManager = new TenantTransactionManager(pglite as any);
    auditService = new AuditService(txManager);
    academicService = new AcademicService(txManager, auditService);
  });

  afterEach(async () => {
    if (pglite) await pglite.close();
  });

  // ═════════════════════════════════════════════════════════════════
  // PART AT — 10 REQUIRED GOVERNANCE SCENARIOS
  // ═════════════════════════════════════════════════════════════════

  it('SCENARIO 1 — School assigns only Grade 1 & 2 to Campus A -> Campus A gets ONLY Grade 1 & 2', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 1',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 2',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 3',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_B], // Only Campus B
    });

    const campusAClasses = await academicService.listClasses(TENANT_A, CAMPUS_A);
    expect(campusAClasses).toHaveLength(2);
    expect(campusAClasses.map((c) => c.name)).toEqual(['Grade 1', 'Grade 2']);
    expect(campusAClasses.map((c) => c.name)).not.toContain('Grade 3');
  });

  it('SCENARIO 2 — Local Campus Creation with sourceOrigin = LOCAL', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 1',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 2',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    // Campus A creates local Grade 4
    const localGrade4 = await academicService.createClass(
      TENANT_A,
      {
        levelId: level.id,
        name: 'Grade 4',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      '99999999-9999-9999-9999-999999999999',
      undefined,
      'CAMPUS_ADMIN'
    );

    expect(localGrade4.sourceOrigin).toBe('LOCAL');
    expect(localGrade4.isInherited).toBe(false);

    const effective = await academicService.listClasses(TENANT_A, CAMPUS_A);
    expect(effective).toHaveLength(3);
    expect(effective.map((c) => c.name)).toEqual(['Grade 1', 'Grade 2', 'Grade 4']);

    const g1 = effective.find((c) => c.name === 'Grade 1');
    const g4 = effective.find((c) => c.name === 'Grade 4');
    expect(g1?.sourceOrigin).toBe('INHERITED');
    expect(g4?.sourceOrigin).toBe('LOCAL');
  });

  it('SCENARIO 3 — Duplicate Effective Class creation is rejected', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 1',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    // Campus A attempts to create Grade 1
    await expect(
      academicService.createClass(
        TENANT_A,
        {
          levelId: level.id,
          name: 'Grade 1',
          ownerType: 'CAMPUS',
          ownerId: CAMPUS_A,
          applyTo: 'LOCAL_SCOPE',
        },
        '99999999-9999-9999-9999-999999999999',
        undefined,
        'CAMPUS_ADMIN'
      )
    ).rejects.toThrow(/already exists and is available to this Campus through School configuration/);
  });

  it('SCENARIO 4 — Parent exists but not assigned conflict is detected', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    // School owns Grade 5, assigned only to Campus B
    await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 5',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_B],
    });

    // Campus A attempts to create Grade 5 locally
    await expect(
      academicService.createClass(
        TENANT_A,
        {
          levelId: level.id,
          name: 'Grade 5',
          ownerType: 'CAMPUS',
          ownerId: CAMPUS_A,
          applyTo: 'LOCAL_SCOPE',
        },
        '99999999-9999-9999-9999-999999999999',
        undefined,
        'CAMPUS_ADMIN'
      )
    ).rejects.toThrow(/already exists at School level but is not currently assigned to this Campus/);
  });

  it('SCENARIO 5 — ALL_CAMPUSES dynamic future campus inheritance', async () => {
    // School creates English with ALL_CAMPUSES
    await academicService.createSubject(TENANT_A, {
      name: 'English Language',
      code: 'ENG-101',
      applyTo: 'ALL_CAMPUSES',
    });

    // Verify Campus A & B resolve English
    const resA = await academicService.listSubjects(TENANT_A, CAMPUS_A);
    const resB = await academicService.listSubjects(TENANT_A, CAMPUS_B);
    expect(resA.map((s) => s.name)).toContain('English Language');
    expect(resB.map((s) => s.name)).toContain('English Language');

    // Add Campus C later
    const db = drizzle(pglite);
    await db.insert(branches).values({
      id: CAMPUS_C,
      organizationId: TENANT_A,
      name: 'DHA Phase 8 Campus',
      code: 'BH-DHA',
    });

    // Campus C automatically inherits English dynamically without new records
    const resC = await academicService.listSubjects(TENANT_A, CAMPUS_C);
    expect(resC.map((s) => s.name)).toContain('English Language');
  });

  it('SCENARIO 6 — SELECTED_CAMPUSES does NOT automatically include newly created campuses', async () => {
    // School creates Math for only Campus A & B
    await academicService.createSubject(TENANT_A, {
      name: 'Advanced Mathematics',
      code: 'MATH-ADV',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A, CAMPUS_B],
    });

    // Add Campus C later
    const db = drizzle(pglite);
    await db.insert(branches).values({
      id: CAMPUS_C,
      organizationId: TENANT_A,
      name: 'DHA Phase 8 Campus',
      code: 'BH-DHA',
    });

    const resC = await academicService.listSubjects(TENANT_A, CAMPUS_C);
    expect(resC.map((s) => s.name)).not.toContain('Advanced Mathematics');
  });

  it('SCENARIO 7 — Ownership immutability (School-created Grade 1 assigned to Campus A remains School-owned)', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const created = await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 1',
      ownerType: 'SCHOOL',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    expect(created.ownerType).toBe('SCHOOL');

    const campusAList = await academicService.listClasses(TENANT_A, CAMPUS_A);
    const resolved = campusAList.find((c) => c.id === created.id);
    expect(resolved?.ownerType).toBe('SCHOOL');
    expect(resolved?.sourceOrigin).toBe('INHERITED');
    expect(resolved?.isInherited).toBe(true);
  });

  it('SCENARIO 8 — Edit Permission Enforcement (Campus A user cannot edit inherited configuration)', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const schoolClass = await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 1',
      ownerType: 'SCHOOL',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    // Campus admin attempting to update School-owned class is rejected
    await expect(
      academicService.updateClass(
        TENANT_A,
        schoolClass.id,
        { name: 'Grade 1 Modified by Campus' },
        '99999999-9999-9999-9999-999999999999',
        undefined,
        'CAMPUS_ADMIN'
      )
    ).rejects.toThrow(/You do not have permission to edit this inherited configuration/);
  });

  it('SCENARIO 9 — Upward Visibility & Management Rights metadata', async () => {
    const section = await academicService.createSection(TENANT_A, {
      name: 'Section A',
      applyTo: 'ALL_CAMPUSES',
    });

    const orgAdminView = await academicService.listSections(TENANT_A, undefined, undefined, undefined, 'SCHOOL_ADMIN');
    const campusAdminView = await academicService.listSections(TENANT_A, CAMPUS_A, undefined, undefined, 'CAMPUS_ADMIN');

    expect(orgAdminView[0].canEdit).toBe(true);
    expect(orgAdminView[0].canAssign).toBe(true);
    expect(campusAdminView[0].canEdit).toBe(false); // Inherited record view-only for campus admin
  });

  it('SCENARIO 10 — Tenant Isolation (Tenant A configs never leak into Tenant B)', async () => {
    await academicService.createBoard(TENANT_A, {
      name: 'Federal Board PK',
      shortName: 'FBISE',
      applyTo: 'ALL_CAMPUSES',
    });

    const tenantAList = await academicService.listBoards(TENANT_A);
    const tenantBList = await academicService.listBoards(TENANT_B);

    expect(tenantAList).toHaveLength(1);
    expect(tenantAList[0].name).toBe('Federal Board PK');
    expect(tenantBList).toHaveLength(0);
  });

  // ═════════════════════════════════════════════════════════════════
  // ACADEMIC ENTITY DOMAIN LOGIC TESTS
  // ═════════════════════════════════════════════════════════════════

  it('Academic Years — Validates start date < end date and handles current year replacement', async () => {
    await expect(
      academicService.createAcademicYear(TENANT_A, {
        name: 'Invalid Year',
        code: 'INV-2026',
        startDate: '2026-12-31',
        endDate: '2026-01-01',
        applyTo: 'ALL_CAMPUSES',
      })
    ).rejects.toThrow(/Start Date must be earlier than End Date/);

    const year1 = await academicService.createAcademicYear(TENANT_A, {
      name: 'Academic Year 2026-2027',
      code: 'AY-2026-27',
      startDate: '2026-08-01',
      endDate: '2027-06-30',
      isCurrent: true,
      applyTo: 'ALL_CAMPUSES',
    });
    expect(year1.isCurrent).toBe(true);

    const year2 = await academicService.createAcademicYear(TENANT_A, {
      name: 'Academic Year 2027-2028',
      code: 'AY-2027-28',
      startDate: '2027-08-01',
      endDate: '2028-06-30',
      isCurrent: true,
      applyTo: 'ALL_CAMPUSES',
    });
    expect(year2.isCurrent).toBe(true);

    const allYears = await academicService.listAcademicYears(TENANT_A);
    const prevYear = allYears.find((y) => y.id === year1.id);
    expect(prevYear?.isCurrent).toBe(false);
  });

  it('Subjects — Enforces practical conditional logic', async () => {
    const theorySub = await academicService.createSubject(TENANT_A, {
      name: 'History',
      hasPractical: false,
      practicalMaxMarks: 50, // Should be ignored/cleared when hasPractical is false
      applyTo: 'ALL_CAMPUSES',
    });
    expect(theorySub.hasPractical).toBe(false);
    expect(theorySub.practicalMaxMarks).toBeNull();

    const labSub = await academicService.createSubject(TENANT_A, {
      name: 'Chemistry',
      hasPractical: true,
      practicalMaxMarks: 25,
      applyTo: 'ALL_CAMPUSES',
    });
    expect(labSub.hasPractical).toBe(true);
    expect(labSub.practicalMaxMarks).toBe(25);
  });

  it('Classes — Rejects subject if mapped in both compulsory and optional', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Secondary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const sub = await academicService.createSubject(TENANT_A, {
      name: 'Computer Science',
      applyTo: 'ALL_CAMPUSES',
    });

    await expect(
      academicService.createClass(TENANT_A, {
        levelId: level.id,
        name: 'Grade 9 CS',
        compulsorySubjectIds: [sub.id],
        optionalSubjectIds: [sub.id],
        applyTo: 'ALL_CAMPUSES',
      })
    ).rejects.toThrow(/A subject cannot be mapped as both Compulsory and Optional/);
  });
});
