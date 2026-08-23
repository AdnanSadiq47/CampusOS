import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { TenantTransactionManager } from '@campus-os/database';
import { AcademicService } from '../src/modules/academic/academic.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const USER_ID = '99999999-9999-9999-9999-999999999999';

const CAMPUS_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CAMPUS_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const CAMPUS_C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

describe('AcademicService & Academic Masters Suite Integration Tests (PGlite)', () => {
  let pglite: PGlite;
  let db: any;
  let txManager: TenantTransactionManager;
  let auditService: AuditService;
  let academicService: AcademicService;

  let primaryLevelId: string;
  let secondaryLevelId: string;
  let mathSubjectId: string;
  let englishSubjectId: string;
  let physicsSubjectId: string;
  let grade5ClassId: string;
  let matricBoardId: string;
  let year2025Id: string;
  let sectionAId: string;
  let englishLangId: string;

  beforeAll(async () => {
    pglite = new PGlite();
    db = drizzle(pglite);

    await pglite.exec(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE schools (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        sort_order INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE config_scope_branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID NOT NULL,
        branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_scope_org_entity_branch ON config_scope_branches(organization_id, entity_type, entity_id, branch_id);

      CREATE TABLE academic_years (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_current BOOLEAN DEFAULT FALSE NOT NULL,
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_academic_year_org_code ON academic_years(organization_id, code);

      CREATE TABLE boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(64) NOT NULL,
        code VARCHAR(64),
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_board_org_name ON boards(organization_id, name);

      CREATE TABLE academic_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        short_name VARCHAR(64),
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_academic_level_org_name ON academic_levels(organization_id, name);

      CREATE TABLE subjects (
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
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_subject_org_name ON subjects(organization_id, name);

      CREATE TABLE classes (
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
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_class_org_name ON classes(organization_id, name);

      CREATE TABLE class_subject_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
        is_compulsory BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_class_subject ON class_subject_mappings(organization_id, class_id, subject_id);

      CREATE TABLE sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(64) NOT NULL,
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_section_org_name ON sections(organization_id, name);

      CREATE TABLE languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64),
        sort_order INTEGER DEFAULT 1 NOT NULL,
        description TEXT,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
      CREATE UNIQUE INDEX uq_language_org_name ON languages(organization_id, name);

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        hierarchy_node_id UUID,
        actor_id UUID,
        actor_email VARCHAR(255),
        impersonator_id UUID,
        module VARCHAR(64) DEFAULT 'ACADEMIC' NOT NULL,
        action VARCHAR(64) NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID,
        before_state JSONB,
        after_state JSONB,
        diff JSONB,
        outcome VARCHAR(32) DEFAULT 'SUCCESS' NOT NULL,
        ip_address VARCHAR(64),
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      -- Seed Organizations & School & Branches
      INSERT INTO organizations (id, code, name) VALUES
        ('${TENANT_A}', 'ORG-A', 'Beaconhouse Organization'),
        ('${TENANT_B}', 'ORG-B', 'City School Organization');

      INSERT INTO schools (id, organization_id, code, name) VALUES
        ('11111111-2222-3333-4444-555555555555', '${TENANT_A}', 'BSS-MAIN', 'Beaconhouse Main');

      INSERT INTO branches (id, organization_id, school_id, code, name) VALUES
        ('${CAMPUS_A}', '${TENANT_A}', '11111111-2222-3333-4444-555555555555', 'CAMPUS-A', 'Gulshan Campus'),
        ('${CAMPUS_B}', '${TENANT_A}', '11111111-2222-3333-4444-555555555555', 'CAMPUS-B', 'Clifton Campus');
    `);

    txManager = new TenantTransactionManager(pglite as any);
    auditService = new AuditService(txManager);
    academicService = new AcademicService(txManager, auditService);
  });

  // ─────────────────────────────────────────────────────────────────
  // PART 1: ACADEMIC YEARS & CURRENT YEAR RESOLUTION
  // ─────────────────────────────────────────────────────────────────

  it('1. should create Academic Year with valid date range and ALL_CAMPUSES', async () => {
    const year = await academicService.createAcademicYear(
      TENANT_A,
      {
        name: 'Academic Session 2025-2026',
        code: '2025-2026',
        startDate: '2025-08-01',
        endDate: '2026-06-30',
        isCurrent: true,
        sortOrder: 1,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );

    expect(year.id).toBeDefined();
    expect(year.name).toBe('Academic Session 2025-2026');
    expect(year.code).toBe('2025-2026');
    expect(year.isCurrent).toBe(true);
    expect(year.applyTo).toBe('ALL_CAMPUSES');
    year2025Id = year.id;
  });

  it('2. should reject Academic Year where Start Date >= End Date', async () => {
    await expect(
      academicService.createAcademicYear(TENANT_A, {
        name: 'Invalid Session',
        code: 'INVALID-2025',
        startDate: '2026-08-01',
        endDate: '2025-08-01', // End date is before start date
        applyTo: 'ALL_CAMPUSES',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('3. should create a second Academic Year and safely reset Current Year flag', async () => {
    const year2026 = await academicService.createAcademicYear(
      TENANT_A,
      {
        name: 'Academic Session 2026-2027',
        code: '2026-2027',
        startDate: '2026-08-01',
        endDate: '2027-06-30',
        isCurrent: true, // Making this new year current
        sortOrder: 2,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );

    expect(year2026.isCurrent).toBe(true);

    // Verify previous year 2025 is no longer current
    const list = await academicService.listAcademicYears(TENANT_A);
    const oldYear = list.find((y) => y.id === year2025Id);
    expect(oldYear?.isCurrent).toBe(false);
  });

  it('4. should support SELECTED_CAMPUSES for an Academic Year', async () => {
    const pilotYear = await academicService.createAcademicYear(
      TENANT_A,
      {
        name: 'IB Pilot Session 2026-2027',
        code: 'IB-2026',
        startDate: '2026-09-01',
        endDate: '2027-07-15',
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_A],
      },
      USER_ID
    );

    expect(pilotYear.applyTo).toBe('SELECTED_CAMPUSES');
    expect(pilotYear.branchIds).toEqual([CAMPUS_A]);
    expect(pilotYear.branchNames).toEqual(['Gulshan Campus']);

    // Campus A should see it
    const campusAList = await academicService.listAcademicYears(TENANT_A, CAMPUS_A);
    expect(campusAList.some((y) => y.id === pilotYear.id)).toBe(true);

    // Campus B should NOT see it (only sees ALL_CAMPUSES years)
    const campusBList = await academicService.listAcademicYears(TENANT_A, CAMPUS_B);
    expect(campusBList.some((y) => y.id === pilotYear.id)).toBe(false);
  });

  // ─────────────────────────────────────────────────────────────────
  // PART 2: BOARDS MASTER
  // ─────────────────────────────────────────────────────────────────

  it('5. should create, search, and update Boards', async () => {
    const board = await academicService.createBoard(
      TENANT_A,
      {
        name: 'Federal Board of Intermediate and Secondary Education',
        shortName: 'FBISE',
        code: 'FBISE-PK',
        sortOrder: 1,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );

    expect(board.id).toBeDefined();
    expect(board.name).toBe('Federal Board of Intermediate and Secondary Education');
    expect(board.shortName).toBe('FBISE');
    matricBoardId = board.id;

    // Search FBISE
    const searchResult = await academicService.listBoards(TENANT_A, undefined, 'FBISE');
    expect(searchResult.length).toBe(1);
    expect(searchResult[0]?.id).toBe(matricBoardId);

    // Update board
    const updated = await academicService.updateBoard(TENANT_A, matricBoardId, {
      description: 'Official National Examination Board',
    });
    expect(updated.description).toBe('Official National Examination Board');
  });

  // ─────────────────────────────────────────────────────────────────
  // PART 3: ACADEMIC LEVELS / STAGES
  // ─────────────────────────────────────────────────────────────────

  it('6. should create Academic Levels / Stages in sequence', async () => {
    const primary = await academicService.createAcademicLevel(
      TENANT_A,
      {
        name: 'Primary Stage',
        shortName: 'PRI',
        sortOrder: 1,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );
    primaryLevelId = primary.id;

    const secondary = await academicService.createAcademicLevel(
      TENANT_A,
      {
        name: 'Secondary Stage',
        shortName: 'SEC',
        sortOrder: 2,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );
    secondaryLevelId = secondary.id;

    const levels = await academicService.listAcademicLevels(TENANT_A);
    expect(levels.length).toBe(2);
    expect(levels[0]?.name).toBe('Primary Stage');
    expect(levels[1]?.name).toBe('Secondary Stage');
  });

  // ─────────────────────────────────────────────────────────────────
  // PART 4: SUBJECTS (Practical conditional logic & marks metadata)
  // ─────────────────────────────────────────────────────────────────

  it('7. should create Theory Subject and enforce practical marks nullification when hasPractical is false', async () => {
    const math = await academicService.createSubject(
      TENANT_A,
      {
        name: 'Mathematics',
        shortName: 'MATH',
        code: 'MATH-101',
        type: 'Theory',
        category: 'Core',
        defaultMaxMarks: 100,
        defaultPassingMarks: 40,
        hasPractical: false,
        practicalMaxMarks: 25, // Should be ignored/cleared because hasPractical = false
        creditWeight: 4.0,
        sortOrder: 1,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );

    expect(math.id).toBeDefined();
    expect(math.hasPractical).toBe(false);
    expect(math.practicalMaxMarks).toBeNull();
    mathSubjectId = math.id;

    const eng = await academicService.createSubject(TENANT_A, {
      name: 'English Language',
      shortName: 'ENG',
      code: 'ENG-101',
      type: 'Theory',
      category: 'Language',
      defaultMaxMarks: 100,
      defaultPassingMarks: 40,
      applyTo: 'ALL_CAMPUSES',
    });
    englishSubjectId = eng.id;
  });

  it('8. should create Theory + Practical Subject with practical marks when hasPractical is true', async () => {
    const physics = await academicService.createSubject(
      TENANT_A,
      {
        name: 'Physics',
        shortName: 'PHY',
        code: 'PHY-201',
        type: 'Theory + Practical',
        category: 'Science',
        defaultMaxMarks: 100,
        defaultPassingMarks: 40,
        hasPractical: true,
        practicalMaxMarks: 25,
        creditWeight: 4.0,
        sortOrder: 3,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );

    expect(physics.hasPractical).toBe(true);
    expect(physics.practicalMaxMarks).toBe(25);
    physicsSubjectId = physics.id;
  });

  // ─────────────────────────────────────────────────────────────────
  // PART 5: CLASSES / GRADES (Academic Level FK, Ages, Subject Mappings)
  // ─────────────────────────────────────────────────────────────────

  it('9. should create Class linked to Academic Level with optional age range and subject mappings', async () => {
    const grade5 = await academicService.createClass(
      TENANT_A,
      {
        levelId: primaryLevelId,
        name: 'Grade 5',
        shortName: 'G5',
        code: 'CLS-G5',
        fromAge: 9.5,
        toAge: 11.0,
        compulsorySubjectIds: [mathSubjectId, englishSubjectId],
        optionalSubjectIds: [physicsSubjectId],
        sortOrder: 1,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );

    expect(grade5.id).toBeDefined();
    expect(grade5.levelId).toBe(primaryLevelId);
    expect(grade5.levelName).toBe('Primary Stage');
    expect(grade5.fromAge).toBe(9.5);
    expect(grade5.toAge).toBe(11.0);
    expect(grade5.compulsorySubjectIds).toContain(mathSubjectId);
    expect(grade5.compulsorySubjectIds).toContain(englishSubjectId);
    expect(grade5.optionalSubjectIds).toContain(physicsSubjectId);
    expect(grade5.totalSubjectsCount).toBe(3);
    grade5ClassId = grade5.id;
  });

  it('10. should reject Class creation when From Age > To Age', async () => {
    await expect(
      academicService.createClass(TENANT_A, {
        levelId: primaryLevelId,
        name: 'Invalid Age Class',
        fromAge: 12.0,
        toAge: 10.0, // Invalid: From > To
        applyTo: 'ALL_CAMPUSES',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('11. should reject Class mapping when same Subject is both Compulsory and Optional', async () => {
    await expect(
      academicService.createClass(TENANT_A, {
        levelId: primaryLevelId,
        name: 'Grade 6 Conflict',
        compulsorySubjectIds: [mathSubjectId],
        optionalSubjectIds: [mathSubjectId], // Conflict: same subject
        applyTo: 'ALL_CAMPUSES',
      })
    ).rejects.toThrow(BadRequestException);
  });

  // ─────────────────────────────────────────────────────────────────
  // PART 6: SECTIONS & LANGUAGES
  // ─────────────────────────────────────────────────────────────────

  it('12. should create and toggle Sections', async () => {
    const secA = await academicService.createSection(
      TENANT_A,
      {
        name: 'Section A (Rose)',
        sortOrder: 1,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );
    expect(secA.name).toBe('Section A (Rose)');
    expect(secA.isActive).toBe(true);
    sectionAId = secA.id;

    const deactivated = await academicService.toggleSectionStatus(TENANT_A, sectionAId, false, USER_ID);
    expect(deactivated.isActive).toBe(false);

    const reactivated = await academicService.toggleSectionStatus(TENANT_A, sectionAId, true, USER_ID);
    expect(reactivated.isActive).toBe(true);
  });

  it('13. should create and manage Languages', async () => {
    const eng = await academicService.createLanguage(
      TENANT_A,
      {
        name: 'English',
        code: 'EN',
        sortOrder: 1,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );
    expect(eng.name).toBe('English');
    englishLangId = eng.id;

    const urdu = await academicService.createLanguage(
      TENANT_A,
      {
        name: 'Urdu',
        code: 'UR',
        sortOrder: 2,
        applyTo: 'ALL_CAMPUSES',
      },
      USER_ID
    );
    expect(urdu.name).toBe('Urdu');

    const langs = await academicService.listLanguages(TENANT_A);
    expect(langs.length).toBe(2);
  });

  // ─────────────────────────────────────────────────────────────────
  // PART 7: DYNAMIC NEW CAMPUS INHERITANCE TEST
  // ─────────────────────────────────────────────────────────────────

  it('14. should automatically inherit ALL_CAMPUSES configurations when a new Campus is created tomorrow', async () => {
    // School creates Campus C tomorrow
    await pglite.exec(`
      INSERT INTO branches (id, organization_id, school_id, code, name) VALUES
        ('${CAMPUS_C}', '${TENANT_A}', '11111111-2222-3333-4444-555555555555', 'CAMPUS-C', 'DHA Phase 8 Campus');
    `);

    // Verify Campus C queries Academic Years: automatically sees ALL_CAMPUSES session 2025 and 2026
    const campusCYears = await academicService.listAcademicYears(TENANT_A, CAMPUS_C);
    expect(campusCYears.some((y) => y.code === '2025-2026')).toBe(true);
    expect(campusCYears.some((y) => y.code === '2026-2027')).toBe(true);

    // Campus C does NOT see IB-2026 (which was SELECTED_CAMPUSES for Campus A only)
    expect(campusCYears.some((y) => y.code === 'IB-2026')).toBe(false);

    // Campus C automatically sees Boards, Academic Levels, Classes, Subjects
    const campusCClasses = await academicService.listClasses(TENANT_A, undefined, CAMPUS_C);
    expect(campusCClasses.some((c) => c.name === 'Grade 5')).toBe(true);
  });

  it('15. should reject unauthorized branch assignment on Selected Campuses', async () => {
    // User only authorized for Campus A, tries to assign Campus B
    await expect(
      academicService.createBoard(
        TENANT_A,
        {
          name: 'Cambridge International Assessment',
          shortName: 'CAIE',
          applyTo: 'SELECTED_CAMPUSES',
          branchIds: [CAMPUS_B], // Unauthorized for this user
        },
        USER_ID,
        [CAMPUS_A] // User's authorized ceiling
      )
    ).rejects.toThrow(ForbiddenException);
  });
});
