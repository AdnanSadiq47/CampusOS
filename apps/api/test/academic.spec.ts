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

describe('Bidirectional Enterprise Configuration Governance Engine & Academic Masters (PGlite)', () => {
  let pglite: PGlite;
  let academicService: AcademicService;
  let auditService: AuditService;
  let txManager: TenantTransactionManager;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';
  const HO_NODE = '00000000-0000-0000-0000-000000000000';
  const REGION_NODE = '55555555-5555-5555-5555-555555555555';
  const SCHOOL_NODE = '77777777-7777-7777-7777-777777777777';
  const CAMPUS_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const CAMPUS_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CAMPUS_C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const ACTOR_USER = '99999999-9999-9999-9999-999999999999';

  beforeEach(async () => {
    pglite = new PGlite();
    const db = drizzle(pglite);

    // Setup tables in PGlite
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
      { id: TENANT_A, code: 'ORG-A', name: 'Beaconhouse Educational System' },
      { id: TENANT_B, code: 'ORG-B', name: 'City School Group' },
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
  // 18 MANDATORY BIDIRECTIONAL GOVERNANCE TEST SCENARIOS
  // ═════════════════════════════════════════════════════════════════

  it('TEST 1 — Head Office creates config -> selected lower scopes receive it', async () => {
    const hoYear = await academicService.createAcademicYear(
      TENANT_A,
      {
        name: 'National Curriculum Year 2026',
        code: 'HO-AY-2026',
        startDate: '2026-08-01',
        endDate: '2027-06-30',
        ownerType: 'HEAD_OFFICE',
        ownerId: HO_NODE,
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_A],
      },
      ACTOR_USER,
      undefined,
      'HEAD_OFFICE_ADMIN'
    );

    expect(hoYear.ownerType).toBe('HEAD_OFFICE');

    const campusAList = await academicService.listAcademicYears(TENANT_A, CAMPUS_A, undefined, undefined, 'CAMPUS_ADMIN');
    const campusBList = await academicService.listAcademicYears(TENANT_A, CAMPUS_B, undefined, undefined, 'CAMPUS_ADMIN');

    expect(campusAList.some((y) => y.id === hoYear.id)).toBe(true);
    expect(campusBList.some((y) => y.id === hoYear.id)).toBe(false);
  });

  it('TEST 2 — School creates config -> selected Campuses receive it', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const schClass = await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 1',
      ownerType: 'SCHOOL',
      ownerId: SCHOOL_NODE,
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    const campusAClasses = await academicService.listClasses(TENANT_A, CAMPUS_A, undefined, undefined, undefined, 'CAMPUS_ADMIN');
    const campusBClasses = await academicService.listClasses(TENANT_A, CAMPUS_B, undefined, undefined, undefined, 'CAMPUS_ADMIN');

    expect(campusAClasses.some((c) => c.id === schClass.id)).toBe(true);
    expect(campusBClasses.some((c) => c.id === schClass.id)).toBe(false);
  });

  it('TEST 3 — Campus creates local config -> ownership remains Campus', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Secondary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const campusClass = await academicService.createClass(
      TENANT_A,
      {
        levelId: level.id,
        name: 'O-Level Robotics Special Grade',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    expect(campusClass.ownerType).toBe('CAMPUS');
    expect(campusClass.ownerId).toBe(CAMPUS_A);
    expect(campusClass.sourceOrigin).toBe('LOCAL');
    expect(campusClass.isInherited).toBe(false);
  });

  it('TEST 4 — Campus-created config visible to School with FULL DETAIL', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Middle Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const localClass = await academicService.createClass(
      TENANT_A,
      {
        levelId: level.id,
        name: 'Grade 7 STEM Campus A',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    // School admin discovers all configs including local campus configs
    const schoolList = await academicService.listClasses(TENANT_A, undefined, undefined, undefined, undefined, 'SCHOOL_ADMIN');
    const found = schoolList.find((c) => c.id === localClass.id);

    expect(found).toBeDefined();
    expect(found?.name).toBe('Grade 7 STEM Campus A');
    expect(found?.ownerType).toBe('CAMPUS');
    expect(found?.ownerId).toBe(CAMPUS_A);
  });

  it('TEST 5 — Campus-created config visible to Region when policy allows (FULL DETAIL)', async () => {
    const subject = await academicService.createSubject(
      TENANT_A,
      {
        name: 'Sindhi Language Local',
        code: 'SND-LOC',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    const regionList = await academicService.listSubjects(TENANT_A, undefined, undefined, undefined, undefined, undefined, 'REGION_ADMIN');
    expect(regionList.some((s) => s.id === subject.id)).toBe(true);
  });

  it('TEST 6 — Campus-created config SUMMARY ONLY for Head Office does not appear in detailed listing', async () => {
    const localSection = await academicService.createSection(
      TENANT_A,
      {
        name: 'Section Alpha Campus A',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    // Head office default visibility policy is SUMMARY_ONLY
    const hoList = await academicService.listSections(TENANT_A, undefined, undefined, undefined, 'HEAD_OFFICE_ADMIN');
    expect(hoList.some((s) => s.id === localSection.id)).toBe(false);

    // School admin with FULL_DETAIL policy can see it
    const schoolList = await academicService.listSections(TENANT_A, undefined, undefined, undefined, 'SCHOOL_ADMIN');
    expect(schoolList.some((s) => s.id === localSection.id)).toBe(true);
  });

  it('TEST 7 — HIDDEN upward policy prevents unauthorized detailed access across campuses', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'High School',
      applyTo: 'ALL_CAMPUSES',
    });

    const campusAClass = await academicService.createClass(
      TENANT_A,
      {
        levelId: level.id,
        name: 'Grade 9 Local A',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    // Campus B admin queries Campus B
    const campusBList = await academicService.listClasses(TENANT_A, CAMPUS_B, undefined, undefined, undefined, 'CAMPUS_ADMIN');
    expect(campusBList.some((c) => c.id === campusAClass.id)).toBe(false);
  });

  it('TEST 8 — Higher-level VIEW does not automatically grant UPDATE', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Middle Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const campusClass = await academicService.createClass(
      TENANT_A,
      {
        levelId: level.id,
        name: 'Grade 6 Campus Special',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    // School admin attempting to update lower-owned record without explicit allowLowerLevelEdit permission is rejected
    await expect(
      academicService.updateClass(
        TENANT_A,
        campusClass.id,
        { name: 'Grade 6 Modified by School' },
        ACTOR_USER,
        undefined,
        'SCHOOL_ADMIN',
        false // allowLowerLevelEdit = false
      )
    ).rejects.toThrow(/You do not have permission to edit this Campus-owned configuration. Upward visibility does not grant update rights./);
  });

  it('TEST 9 — Higher-level authorized UPDATE works only when explicit permission allows it', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Middle Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const campusClass = await academicService.createClass(
      TENANT_A,
      {
        levelId: level.id,
        name: 'Grade 8 Campus Original',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    const updated = await academicService.updateClass(
      TENANT_A,
      campusClass.id,
      { name: 'Grade 8 Supervised Edit' },
      ACTOR_USER,
      undefined,
      'SCHOOL_ADMIN',
      true // allowLowerLevelEdit = true
    );

    expect(updated.name).toBe('Grade 8 Supervised Edit');
    expect(updated.ownerType).toBe('CAMPUS'); // Ownership remains Campus
  });

  it('TEST 10 — Top-down assignment does not transfer ownership', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    const schoolClass = await academicService.createClass(TENANT_A, {
      levelId: level.id,
      name: 'Grade 2 National',
      ownerType: 'SCHOOL',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A],
    });

    expect(schoolClass.ownerType).toBe('SCHOOL');

    const campusAList = await academicService.listClasses(TENANT_A, CAMPUS_A);
    const resolved = campusAList.find((c) => c.id === schoolClass.id);
    expect(resolved?.ownerType).toBe('SCHOOL');
    expect(resolved?.sourceOrigin).toBe('INHERITED');
  });

  it('TEST 11 — Upward visibility does not transfer ownership', async () => {
    const lang = await academicService.createLanguage(
      TENANT_A,
      {
        name: 'Arabic Local Campus A',
        code: 'ARB-A',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    expect(lang.ownerType).toBe('CAMPUS');

    const schoolList = await academicService.listLanguages(TENANT_A, undefined, undefined, undefined, 'SCHOOL_ADMIN');
    const viewedBySchool = schoolList.find((l) => l.id === lang.id);
    expect(viewedBySchool?.ownerType).toBe('CAMPUS');
    expect(viewedBySchool?.ownerId).toBe(CAMPUS_A);
  });

  it('TEST 12 — ALL_CAMPUSES future campus inheritance remains functional', async () => {
    await academicService.createSubject(TENANT_A, {
      name: 'General Science Core',
      code: 'SCI-GEN',
      applyTo: 'ALL_CAMPUSES',
    });

    // Add Campus C later
    const db = drizzle(pglite);
    await db.insert(branches).values({
      id: CAMPUS_C,
      organizationId: TENANT_A,
      name: 'DHA Phase 8 Campus',
      code: 'BH-DHA',
    });

    const campusCList = await academicService.listSubjects(TENANT_A, CAMPUS_C);
    expect(campusCList.some((s) => s.name === 'General Science Core')).toBe(true);
  });

  it('TEST 13 — SELECTED_CAMPUSES remains explicit on new campus creation', async () => {
    await academicService.createSubject(TENANT_A, {
      name: 'Calculus Advanced',
      code: 'CALC-ADV',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_A, CAMPUS_B],
    });

    const db = drizzle(pglite);
    await db.insert(branches).values({
      id: CAMPUS_C,
      organizationId: TENANT_A,
      name: 'DHA Phase 8 Campus',
      code: 'BH-DHA',
    });

    const campusCList = await academicService.listSubjects(TENANT_A, CAMPUS_C);
    expect(campusCList.some((s) => s.name === 'Calculus Advanced')).toBe(false);
  });

  it('TEST 14 — Effective configuration returns assigned + local records correctly', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    // School creates G1 & G2 assigned to Campus A
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

    // Campus A creates local G4
    await academicService.createClass(
      TENANT_A,
      {
        levelId: level.id,
        name: 'Grade 4',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    const effective = await academicService.listClasses(TENANT_A, CAMPUS_A);
    expect(effective.map((c) => c.name)).toEqual(['Grade 1', 'Grade 2', 'Grade 4']);
    expect(effective.find((c) => c.name === 'Grade 1')?.sourceOrigin).toBe('INHERITED');
    expect(effective.find((c) => c.name === 'Grade 4')?.sourceOrigin).toBe('LOCAL');
  });

  it('TEST 15 — Duplicate effective configuration creation is blocked', async () => {
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
        ACTOR_USER,
        undefined,
        'CAMPUS_ADMIN'
      )
    ).rejects.toThrow(/already exists and is available to this Campus through School configuration/);
  });

  it('TEST 16 — Matching parent record not assigned is detected before local duplicate creation', async () => {
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
        ACTOR_USER,
        undefined,
        'CAMPUS_ADMIN'
      )
    ).rejects.toThrow(/already exists at School level but is not currently assigned to this Campus/);
  });

  it('TEST 17 — Tenant isolation remains absolute', async () => {
    await academicService.createBoard(TENANT_A, {
      name: 'Cambridge International UK',
      shortName: 'CIE',
      applyTo: 'ALL_CAMPUSES',
    });

    const listA = await academicService.listBoards(TENANT_A);
    const listB = await academicService.listBoards(TENANT_B);

    expect(listA.some((b) => b.name === 'Cambridge International UK')).toBe(true);
    expect(listB.some((b) => b.name === 'Cambridge International UK')).toBe(false);
  });

  it('TEST 18 — API cannot bypass visibility rules when querying by campus', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Special Stage',
      applyTo: 'ALL_CAMPUSES',
    });

    // Local class for Campus B
    await academicService.createClass(
      TENANT_A,
      {
        levelId: level.id,
        name: 'Grade 10 Exclusive Campus B',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_B,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    // Campus A queries effective configs -> should not get Campus B's local class
    const campusAResult = await academicService.listClasses(TENANT_A, CAMPUS_A);
    expect(campusAResult.some((c) => c.name === 'Grade 10 Exclusive Campus B')).toBe(false);
  });

  // ═════════════════════════════════════════════════════════════════
  // ACADEMIC DOMAIN LOGIC TESTS
  // ═════════════════════════════════════════════════════════════════

  it('Academic Years — Validates date ordering and handles current year replacement', async () => {
    await expect(
      academicService.createAcademicYear(TENANT_A, {
        name: 'Invalid Academic Year',
        code: 'INV-AY',
        startDate: '2026-12-31',
        endDate: '2026-01-01',
        applyTo: 'ALL_CAMPUSES',
      })
    ).rejects.toThrow(/Start Date must be earlier than End Date/);

    const ay1 = await academicService.createAcademicYear(TENANT_A, {
      name: 'Academic Year 2026-27',
      code: 'AY-2026-27',
      startDate: '2026-08-01',
      endDate: '2027-06-30',
      isCurrent: true,
      applyTo: 'ALL_CAMPUSES',
    });
    expect(ay1.isCurrent).toBe(true);

    const ay2 = await academicService.createAcademicYear(TENANT_A, {
      name: 'Academic Year 2027-28',
      code: 'AY-2027-28',
      startDate: '2027-08-01',
      endDate: '2028-06-30',
      isCurrent: true,
      applyTo: 'ALL_CAMPUSES',
    });
    expect(ay2.isCurrent).toBe(true);

    const list = await academicService.listAcademicYears(TENANT_A);
    expect(list.find((y) => y.id === ay1.id)?.isCurrent).toBe(false);
  });

  it('Classes — Rejects subject if mapped in both compulsory and optional', async () => {
    const level = await academicService.createAcademicLevel(TENANT_A, {
      name: 'High School',
      applyTo: 'ALL_CAMPUSES',
    });

    const sub = await academicService.createSubject(TENANT_A, {
      name: 'Physics Core',
      applyTo: 'ALL_CAMPUSES',
    });

    await expect(
      academicService.createClass(TENANT_A, {
        levelId: level.id,
        name: 'Grade 10 Science',
        compulsorySubjectIds: [sub.id],
        optionalSubjectIds: [sub.id],
        applyTo: 'ALL_CAMPUSES',
      })
    ).rejects.toThrow(/A subject cannot be mapped as both Compulsory and Optional/);
  });
});
