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
import { WorkingContextService } from '../src/core/hierarchy/working-context.service.js';
import {
  getEntityScopeMode,
  isHierarchyScoped,
  isCampusRequired,
} from '../src/core/scope/scope-mode.registry.js';

describe('Admin Config Global Working Context Enforcement Invariant Suite (20 Blockers)', () => {
  let pglite: PGlite;
  let academicService: AcademicService;
  let auditService: AuditService;
  let contextService: WorkingContextService;
  let txManager: TenantTransactionManager;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';

  const CAMPUS_MAIN = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const CAMPUS_CLIFTON = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CAMPUS_DHA = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const CAMPUS_PECHS = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const CAMPUS_BETA = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

  const ACTOR_USER = '99999999-9999-9999-9999-999999999999';

  beforeEach(async () => {
    pglite = new PGlite();
    const db = drizzle(pglite);

    // Setup SQL schema in PGlite
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
      { id: TENANT_A, code: 'ORG-A', name: 'Alpha Education Network' },
      { id: TENANT_B, code: 'ORG-B', name: 'Beta Collegiate' },
    ]);

    await db.insert(branches).values([
      { id: CAMPUS_MAIN, organizationId: TENANT_A, name: 'Main Campus Gulshan', code: 'BR-MAIN' },
      { id: CAMPUS_CLIFTON, organizationId: TENANT_A, name: 'Clifton Campus', code: 'BR-CLIFTON' },
      { id: CAMPUS_DHA, organizationId: TENANT_A, name: 'DHA Phase 6 Campus', code: 'BR-DHA' },
      { id: CAMPUS_PECHS, organizationId: TENANT_A, name: 'PECHS Campus', code: 'BR-PECHS' },
      { id: CAMPUS_BETA, organizationId: TENANT_B, name: 'Beta North Campus', code: 'BR-BETA-1' },
    ]);

    txManager = new TenantTransactionManager(pglite as any);
    auditService = new AuditService(txManager);
    academicService = new AcademicService(txManager, auditService);
    contextService = new WorkingContextService();
  });

  afterEach(async () => {
    if (pglite) {
      await pglite.close();
    }
  });

  // Seed academic masters across Universal vs Selected Campuses
  async function seedAcademicHierarchy() {
    // 1. Academic Levels: 4 Universal, 1 Selected (Main + Clifton only)
    const lvl1 = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Early Years / Pre-School',
      code: 'LVL-EY',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    const lvl2 = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Primary Stage',
      code: 'LVL-PRI',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    const lvl3 = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Middle Stage',
      code: 'LVL-MID',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    const lvl4 = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Secondary / High School',
      code: 'LVL-SEC',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    const lvl5 = await academicService.createAcademicLevel(TENANT_A, {
      name: 'Higher Secondary / College',
      code: 'LVL-HSEC',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_MAIN, CAMPUS_CLIFTON],
    }, ACTOR_USER);

    // 2. Academic Years: 1 Universal, 1 Selected
    await academicService.createAcademicYear(TENANT_A, {
      name: 'Academic Year 2025-2026',
      code: 'AY-25-26',
      startDate: '2025-08-01',
      endDate: '2026-06-30',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    await academicService.createAcademicYear(TENANT_A, {
      name: 'College Summer Semester 2026',
      code: 'AY-SUMMER-26',
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_MAIN, CAMPUS_CLIFTON],
    }, ACTOR_USER);

    // 3. Boards: 1 Universal, 1 Selected
    await academicService.createBoard(TENANT_A, {
      name: 'Federal Board (FBISE)',
      shortName: 'FBISE',
      code: 'BRD-FBISE',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    await academicService.createBoard(TENANT_A, {
      name: 'Cambridge Assessment International Education (CAIE)',
      shortName: 'CAIE',
      code: 'BRD-CAIE',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_MAIN, CAMPUS_CLIFTON],
    }, ACTOR_USER);

    // 4. Subjects: 2 Universal, 1 Selected
    const subMath = await academicService.createSubject(TENANT_A, {
      name: 'Mathematics',
      code: 'MATH-101',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    const subEng = await academicService.createSubject(TENANT_A, {
      name: 'English Language',
      code: 'ENG-101',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    const subArt = await academicService.createSubject(TENANT_A, {
      name: 'Fine Arts & Design',
      code: 'ART-105',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_MAIN, CAMPUS_CLIFTON],
    }, ACTOR_USER);

    // 5. Classes: 1 Universal, 1 Selected
    await academicService.createClass(TENANT_A, {
      levelId: lvl2.id,
      name: 'Grade 1',
      code: 'CLS-G1',
      applyTo: 'ALL_CAMPUSES',
      compulsorySubjectIds: [subMath.id, subEng.id],
    }, ACTOR_USER);

    await academicService.createClass(TENANT_A, {
      levelId: lvl5.id,
      name: 'A-Levels Year 1 (AS)',
      code: 'CLS-A1',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_MAIN, CAMPUS_CLIFTON],
      compulsorySubjectIds: [subEng.id],
      optionalSubjectIds: [subArt.id],
    }, ACTOR_USER);

    // 6. Sections: 1 Universal, 1 Selected
    await academicService.createSection(TENANT_A, {
      name: 'Section A (Rose)',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    await academicService.createSection(TENANT_A, {
      name: 'Section A-Level Accelerated',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_MAIN, CAMPUS_CLIFTON],
    }, ACTOR_USER);

    // 7. Languages: 1 Universal, 1 Selected
    await academicService.createLanguage(TENANT_A, {
      name: 'English',
      code: 'EN',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);

    await academicService.createLanguage(TENANT_A, {
      name: 'French',
      code: 'FR',
      applyTo: 'SELECTED_CAMPUSES',
      branchIds: [CAMPUS_MAIN, CAMPUS_CLIFTON],
    }, ACTOR_USER);

    // Seed Tenant B items
    await academicService.createAcademicLevel(TENANT_B, {
      name: 'Tenant B Exclusive Stage',
      code: 'LVL-TB',
      applyTo: 'ALL_CAMPUSES',
    }, ACTOR_USER);
  }

  describe('Core Scope & Level Resolution Invariants', () => {
    it('Invariant 1: DHA Phase 6 context strictly excludes Higher Secondary / College level', async () => {
      await seedAcademicHierarchy();
      const levels = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_DHA]);
      
      const names = levels.map((l) => l.name);
      expect(names).not.toContain('Higher Secondary / College');
      expect(levels).toHaveLength(4);
    });

    it('Invariant 2: Universal academic levels (ALL_CAMPUSES) are preserved in DHA Phase 6 context', async () => {
      await seedAcademicHierarchy();
      const levels = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_DHA]);
      
      const names = levels.map((l) => l.name);
      expect(names).toContain('Early Years / Pre-School');
      expect(names).toContain('Primary Stage');
      expect(names).toContain('Middle Stage');
      expect(names).toContain('Secondary / High School');
    });

    it('Invariant 3: Clifton Campus context includes Higher Secondary / College level', async () => {
      await seedAcademicHierarchy();
      const levels = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_CLIFTON]);
      
      const names = levels.map((l) => l.name);
      expect(names).toContain('Higher Secondary / College');
      expect(levels).toHaveLength(5);
    });

    it('Invariant 4: Main Campus context includes Higher Secondary / College level', async () => {
      await seedAcademicHierarchy();
      const levels = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_MAIN]);
      
      const names = levels.map((l) => l.name);
      expect(names).toContain('Higher Secondary / College');
      expect(levels).toHaveLength(5);
    });

    it('Invariant 5: Sibling isolation — PECHS Campus context excludes configs assigned to Main & Clifton', async () => {
      await seedAcademicHierarchy();
      const levels = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_PECHS]);
      
      const names = levels.map((l) => l.name);
      expect(names).not.toContain('Higher Secondary / College');
      expect(levels).toHaveLength(4);
    });
  });

  describe('Multi-Campus Rollup & All-Configurations Bypass Invariants', () => {
    it('Invariant 6: School context combining Main, Clifton, DHA includes Higher Secondary because child campuses match', async () => {
      await seedAcademicHierarchy();
      const schoolEffectiveCampuses = [CAMPUS_MAIN, CAMPUS_CLIFTON, CAMPUS_DHA];
      const levels = await academicService.listAcademicLevels(TENANT_A, schoolEffectiveCampuses);
      
      const names = levels.map((l) => l.name);
      expect(names).toContain('Higher Secondary / College');
      expect(levels).toHaveLength(5);
    });

    it('Invariant 7: Region context combining all south campuses returns all effective configs across any child', async () => {
      await seedAcademicHierarchy();
      const regionEffectiveCampuses = [CAMPUS_MAIN, CAMPUS_CLIFTON, CAMPUS_DHA, CAMPUS_PECHS];
      const levels = await academicService.listAcademicLevels(TENANT_A, regionEffectiveCampuses);
      
      expect(levels).toHaveLength(5);
    });

    it('Invariant 8: Head Office context with all tenant branches resolves all configurations', async () => {
      await seedAcademicHierarchy();
      const hoEffectiveCampuses = [CAMPUS_MAIN, CAMPUS_CLIFTON, CAMPUS_DHA, CAMPUS_PECHS];
      const levels = await academicService.listAcademicLevels(TENANT_A, hoEffectiveCampuses);
      
      expect(levels).toHaveLength(5);
    });

    it('Invariant 9: All Configurations bypass (effectiveCampusIds undefined or empty) returns complete unfiltered catalog', async () => {
      await seedAcademicHierarchy();
      // Super Admin viewing All Configurations
      const levels = await academicService.listAcademicLevels(TENANT_A, undefined);
      expect(levels).toHaveLength(5);

      const emptyLevels = await academicService.listAcademicLevels(TENANT_A, []);
      expect(emptyLevels).toHaveLength(5);
    });
  });

  describe('Other Academic Entities Working Context Enforcement', () => {
    it('Invariant 10: Academic Years context scoping filters out selected campus years in DHA context', async () => {
      await seedAcademicHierarchy();
      const yearsDHA = await academicService.listAcademicYears(TENANT_A, [CAMPUS_DHA]);
      expect(yearsDHA).toHaveLength(1);
      expect(yearsDHA[0].name).toBe('Academic Year 2025-2026');

      const yearsClifton = await academicService.listAcademicYears(TENANT_A, [CAMPUS_CLIFTON]);
      expect(yearsClifton).toHaveLength(2);
    });

    it('Invariant 11: Boards context scoping filters out CAIE in DHA context', async () => {
      await seedAcademicHierarchy();
      const boardsDHA = await academicService.listBoards(TENANT_A, [CAMPUS_DHA]);
      expect(boardsDHA).toHaveLength(1);
      expect(boardsDHA[0].code).toBe('BRD-FBISE');

      const boardsClifton = await academicService.listBoards(TENANT_A, [CAMPUS_CLIFTON]);
      expect(boardsClifton).toHaveLength(2);
    });

    it('Invariant 12: Classes context scoping filters out A-Levels Year 1 in DHA context', async () => {
      await seedAcademicHierarchy();
      const classesDHA = await academicService.listClasses(TENANT_A, [CAMPUS_DHA]);
      expect(classesDHA).toHaveLength(1);
      expect(classesDHA[0].name).toBe('Grade 1');

      const classesClifton = await academicService.listClasses(TENANT_A, [CAMPUS_CLIFTON]);
      expect(classesClifton).toHaveLength(2);
    });

    it('Invariant 13: Sections context scoping filters out Section A-Level Accelerated in DHA context', async () => {
      await seedAcademicHierarchy();
      const sectionsDHA = await academicService.listSections(TENANT_A, [CAMPUS_DHA]);
      expect(sectionsDHA).toHaveLength(1);
      expect(sectionsDHA[0].name).toBe('Section A (Rose)');

      const sectionsClifton = await academicService.listSections(TENANT_A, [CAMPUS_CLIFTON]);
      expect(sectionsClifton).toHaveLength(2);
    });

    it('Invariant 14: Subjects context scoping filters out Fine Arts & Design in DHA context', async () => {
      await seedAcademicHierarchy();
      const subjectsDHA = await academicService.listSubjects(TENANT_A, [CAMPUS_DHA]);
      expect(subjectsDHA).toHaveLength(2);
      const names = subjectsDHA.map((s) => s.name);
      expect(names).not.toContain('Fine Arts & Design');

      const subjectsClifton = await academicService.listSubjects(TENANT_A, [CAMPUS_CLIFTON]);
      expect(subjectsClifton).toHaveLength(3);
    });

    it('Invariant 15: Languages context scoping filters out French in DHA context', async () => {
      await seedAcademicHierarchy();
      const languagesDHA = await academicService.listLanguages(TENANT_A, [CAMPUS_DHA]);
      expect(languagesDHA).toHaveLength(1);
      expect(languagesDHA[0].code).toBe('EN');

      const languagesClifton = await academicService.listLanguages(TENANT_A, [CAMPUS_CLIFTON]);
      expect(languagesClifton).toHaveLength(2);
    });
  });

  describe('Security, Multi-Tenancy & Architectural Taxonomy Invariants', () => {
    it('Invariant 16: Strict Tenant Isolation — Tenant B configs are never accessible to Tenant A', async () => {
      await seedAcademicHierarchy();
      const levelsA = await academicService.listAcademicLevels(TENANT_A, undefined);
      const namesA = levelsA.map((l) => l.name);
      expect(namesA).not.toContain('Tenant B Exclusive Stage');

      const levelsB = await academicService.listAcademicLevels(TENANT_B, undefined);
      expect(levelsB).toHaveLength(1);
      expect(levelsB[0].name).toBe('Tenant B Exclusive Stage');
    });

    it('Invariant 17: Scope Mode Registry validates HIERARCHY_SCOPED entities', () => {
      expect(getEntityScopeMode('academic_levels')).toBe('HIERARCHY_SCOPED');
      expect(getEntityScopeMode('academic_years')).toBe('HIERARCHY_SCOPED');
      expect(getEntityScopeMode('boards')).toBe('HIERARCHY_SCOPED');
      expect(getEntityScopeMode('classes')).toBe('HIERARCHY_SCOPED');
      expect(getEntityScopeMode('sections')).toBe('HIERARCHY_SCOPED');
      expect(getEntityScopeMode('subjects')).toBe('HIERARCHY_SCOPED');
      expect(getEntityScopeMode('languages')).toBe('HIERARCHY_SCOPED');
      expect(getEntityScopeMode('admission_processes')).toBe('HIERARCHY_SCOPED');

      expect(isHierarchyScoped('academic_levels')).toBe(true);
      expect(isHierarchyScoped('classes')).toBe(true);
    });

    it('Invariant 18: Scope Mode Registry validates CAMPUS_REQUIRED transaction entities', () => {
      expect(getEntityScopeMode('student_enrollment')).toBe('CAMPUS_REQUIRED');
      expect(getEntityScopeMode('student_attendance')).toBe('CAMPUS_REQUIRED');
      expect(getEntityScopeMode('timetable_slots')).toBe('CAMPUS_REQUIRED');
      expect(isCampusRequired('student_enrollment')).toBe(true);
    });

    it('Invariant 19: Scope Mode Registry validates TENANT_WIDE entities', () => {
      expect(getEntityScopeMode('school_types')).toBe('TENANT_WIDE');
      expect(getEntityScopeMode('field_library')).toBe('TENANT_WIDE');
      expect(getEntityScopeMode('organization_hierarchy')).toBe('TENANT_WIDE');
      expect(isHierarchyScoped('school_types')).toBe(false);
    });

    it('Invariant 20: Bidirectional Propagation — updating an entity branchIds immediately updates context-scoped queries', async () => {
      await seedAcademicHierarchy();
      
      // Initially, DHA does NOT have Higher Secondary
      let levelsDHA = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_DHA]);
      expect(levelsDHA.map((l) => l.name)).not.toContain('Higher Secondary / College');

      // Find the Higher Secondary level ID
      const allLevels = await academicService.listAcademicLevels(TENANT_A, undefined);
      const hsec = allLevels.find((l) => l.name === 'Higher Secondary / College')!;

      // Update scope to include DHA Campus
      await academicService.updateAcademicLevel(
        TENANT_A,
        hsec.id,
        {
          branchIds: [CAMPUS_MAIN, CAMPUS_CLIFTON, CAMPUS_DHA],
        },
        ACTOR_USER
      );

      // Query again under DHA context: now it MUST be included!
      levelsDHA = await academicService.listAcademicLevels(TENANT_A, [CAMPUS_DHA]);
      expect(levelsDHA.map((l) => l.name)).toContain('Higher Secondary / College');
      expect(levelsDHA).toHaveLength(5);
    });
  });
});
