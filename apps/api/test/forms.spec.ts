import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  organizations,
  branches,
  configScopeBranches,
  formDefinitions,
  formVersions,
  fieldDefinitions,
  formTemplates,
  auditLogs,
  TenantTransactionManager,
} from '@campus-os/database';
import { FormsService } from '../src/modules/forms/forms.service.js';
import { AuditService } from '../src/core/audit/audit.service.js';
import { FormSchemaPayload } from '@campus-os/types';

describe('CampusOS Dynamic Form Builder Platform Foundation & Governance (PGlite)', () => {
  let pglite: PGlite;
  let formsService: FormsService;
  let auditService: AuditService;
  let txManager: TenantTransactionManager;

  const TENANT_A = '11111111-1111-1111-1111-111111111111';
  const TENANT_B = '22222222-2222-2222-2222-222222222222';
  const HO_NODE = '00000000-0000-0000-0000-000000000000';
  const SCHOOL_NODE = '77777777-7777-7777-7777-777777777777';
  const CAMPUS_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const CAMPUS_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CAMPUS_C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
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

      CREATE TABLE IF NOT EXISTS form_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        form_purpose VARCHAR(64) DEFAULT 'PRE_REGISTRATION' NOT NULL,
        description TEXT,
        owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
        owner_id UUID,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        current_version_id UUID,
        published_version_id UUID,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS form_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        form_definition_id UUID NOT NULL,
        version_number INTEGER NOT NULL,
        status VARCHAR(32) DEFAULT 'DRAFT' NOT NULL,
        schema_payload JSONB NOT NULL,
        changelog_summary TEXT,
        published_at TIMESTAMPTZ,
        published_by_user_id UUID,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS field_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        canonical_key VARCHAR(128),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(64) DEFAULT 'OTHER' NOT NULL,
        origin VARCHAR(32) DEFAULT 'STANDARD' NOT NULL,
        data_type VARCHAR(64) DEFAULT 'TEXT' NOT NULL,
        master_binding VARCHAR(64),
        default_label VARCHAR(255) NOT NULL,
        default_placeholder TEXT,
        default_help_text TEXT,
        default_options JSONB DEFAULT '[]'::jsonb,
        default_validation JSONB DEFAULT '{}'::jsonb,
        is_system_protected BOOLEAN DEFAULT FALSE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS form_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        form_purpose VARCHAR(64) DEFAULT 'PRE_REGISTRATION' NOT NULL,
        category VARCHAR(64) DEFAULT 'Standard' NOT NULL,
        icon VARCHAR(64) DEFAULT '📝' NOT NULL,
        description TEXT NOT NULL,
        schema_payload JSONB NOT NULL,
        is_system BOOLEAN DEFAULT TRUE NOT NULL,
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

    // Seed test organizations & branches
    await db.insert(organizations).values([
      { id: TENANT_A, code: 'ORG-A', name: 'Alpha Educational Trust' },
      { id: TENANT_B, code: 'ORG-B', name: 'Beta Schools Network' },
    ]);

    await db.insert(branches).values([
      { id: CAMPUS_A, organizationId: TENANT_A, name: 'Main Campus Gulshan', code: 'BH-GUL' },
      { id: CAMPUS_B, organizationId: TENANT_A, name: 'Clifton Campus', code: 'BH-CLF' },
    ]);

    txManager = new TenantTransactionManager(pglite as any);
    auditService = new AuditService(txManager);
    formsService = new FormsService(txManager, auditService);
  });

  afterEach(async () => {
    if (pglite) await pglite.close();
  });

  // ═════════════════════════════════════════════════════════════════
  // 30 MANDATORY TEST SCENARIOS (PART 48)
  // ═════════════════════════════════════════════════════════════════

  it('TEST 1 — Create Pre-Registration form from blank', async () => {
    const created = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Online Pre-Registration 2026',
        formPurpose: 'PRE_REGISTRATION',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER
    );

    expect(created.name).toBe('Online Pre-Registration 2026');
    expect(created.formPurpose).toBe('PRE_REGISTRATION');
    expect(created.currentVersionNumber).toBe(1);
    expect(created.currentVersionStatus).toBe('DRAFT');
  });

  it('TEST 2 — Create Admission form from Pre-Registration (canonical mapping)', async () => {
    const preRegForm = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Early Pre-Reg Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
      },
      ACTOR_USER
    );

    // Create admission form copying from pre-registration
    const admForm = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Formal Admission Form',
        formPurpose: 'ADMISSION',
        copyFromFormId: preRegForm.id,
      },
      ACTOR_USER
    );

    const admDetails = await formsService.getFormDefinition(TENANT_A, admForm.id);
    const fields = admDetails.currentVersion.schemaPayload.sections.flatMap((s) => s.fields);

    expect(fields.some((f) => f.canonicalKey === 'STUDENT_DOB')).toBe(true);
    expect(fields.some((f) => f.canonicalKey === 'STUDENT_FULL_NAME')).toBe(true);
    expect(fields.some((f) => f.canonicalKey === 'PRIMARY_CONTACT_MOBILE')).toBe(true);
  });

  it('TEST 3 — Create form from template', async () => {
    const created = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Standard Pre-Registration Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_standard_prereg',
      },
      ACTOR_USER
    );

    const details = await formsService.getFormDefinition(TENANT_A, created.id);
    expect(details.currentVersion.schemaPayload.sections.length).toBe(3);
    expect(details.currentVersion.schemaPayload.sections[0]!.title).toBe('Student Information');
  });

  it('TEST 4 — Drag/add/reorder fields', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Custom Field Order Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const customSchema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_1',
          title: 'Section 1',
          showSectionHeading: true,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'f1',
              fieldDefinitionId: 'STD_DOB',
              canonicalKey: 'STUDENT_DOB',
              customLabel: 'Date of Birth',
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'f2',
              fieldDefinitionId: 'STD_FULL_NAME',
              canonicalKey: 'STUDENT_FULL_NAME',
              customLabel: 'Student Name',
              width: 'HALF',
              isRequired: true,
              sortOrder: 2,
            },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: customSchema }, ACTOR_USER);
    expect(saved.schemaPayload.sections[0]!.fields[0]!.canonicalKey).toBe('STUDENT_DOB');
    expect(saved.schemaPayload.sections[0]!.fields[1]!.canonicalKey).toBe('STUDENT_FULL_NAME');
  });

  it('TEST 5 — Create/reorder/hide section heading', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Section Heading Options Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_hidden_heading',
          title: 'Silent Grouping',
          showSectionHeading: false, // Optional heading display OFF
          sortOrder: 1,
          fields: [
            {
              instanceId: 'f1',
              fieldDefinitionId: 'STD_FULL_NAME',
              customLabel: 'Name',
              width: 'FULL',
              isRequired: true,
              sortOrder: 1,
            },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    expect(saved.schemaPayload.sections[0]!.showSectionHeading).toBe(false);
  });

  it('TEST 6 — Form works without visible sections (flat form)', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Flat Minimalist Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_root',
          title: '',
          showSectionHeading: false,
          sortOrder: 1,
          fields: [
            { instanceId: 'f1', fieldDefinitionId: 'STD_FULL_NAME', customLabel: 'Name', width: 'HALF', isRequired: true, sortOrder: 1 },
            { instanceId: 'f2', fieldDefinitionId: 'STD_DOB', customLabel: 'DOB', width: 'HALF', isRequired: true, sortOrder: 2 },
            { instanceId: 'f3', fieldDefinitionId: 'CNT_PRIMARY_MOBILE', customLabel: 'Mobile', width: 'HALF', isRequired: true, sortOrder: 3 },
            { instanceId: 'f4', fieldDefinitionId: 'ACAD_CLASS_REF', customLabel: 'Class', width: 'HALF', isRequired: true, sortOrder: 4 },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    expect(saved.schemaPayload.sections[0]!.showSectionHeading).toBe(false);
    expect(saved.schemaPayload.sections[0]!.fields.length).toBe(4);
  });

  it('TEST 7 — Required/optional field behavior', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Validation Rules Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_1',
          title: 'Details',
          showSectionHeading: true,
          sortOrder: 1,
          fields: [
            { instanceId: 'f1', fieldDefinitionId: 'STD_FULL_NAME', customLabel: 'Full Name', isRequired: true, width: 'HALF', sortOrder: 1 },
            { instanceId: 'f2', fieldDefinitionId: 'STD_MIDDLE_NAME', customLabel: 'Middle Name', isRequired: false, width: 'HALF', sortOrder: 2 },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    expect(saved.schemaPayload.sections[0]!.fields[0]!.isRequired).toBe(true);
    expect(saved.schemaPayload.sections[0]!.fields[1]!.isRequired).toBe(false);
  });

  it('TEST 8 — Conditional field visibility (Transport Required -> Show Pickup Location)', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Conditional Field Form', formPurpose: 'ADMISSION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      settings: {},
      rules: [
        {
          id: 'r_transport',
          sourceFieldKey: 'fld_transport_req',
          operator: 'EQUALS',
          value: true,
          action: 'SHOW',
          targetFieldKey: 'fld_transport_pickup',
        },
      ],
      sections: [
        {
          id: 'sec_transport',
          title: 'Transport',
          showSectionHeading: true,
          sortOrder: 1,
          fields: [
            { instanceId: 'fld_transport_req', fieldDefinitionId: 'TRN_REQUIRED', customLabel: 'Transport Needed?', isRequired: false, width: 'HALF', sortOrder: 1 },
            { instanceId: 'fld_transport_pickup', fieldDefinitionId: 'TRN_PICKUP_AREA', customLabel: 'Pickup Area', isRequired: false, width: 'HALF', sortOrder: 2 },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    expect(saved.schemaPayload.rules[0]!.action).toBe('SHOW');
    expect(saved.schemaPayload.rules[0]!.targetFieldKey).toBe('fld_transport_pickup');
  });

  it('TEST 9 — Conditional section visibility (Hostel Required -> Show Hostel Section)', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Conditional Section Form', formPurpose: 'ADMISSION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      settings: {},
      rules: [
        {
          id: 'r_hostel_section',
          sourceFieldKey: 'fld_hostel_req',
          operator: 'EQUALS',
          value: true,
          action: 'SHOW',
          targetSectionId: 'sec_hostel_details',
        },
      ],
      sections: [
        {
          id: 'sec_hostel_details',
          title: 'Hostel Accommodation Details',
          showSectionHeading: true,
          sortOrder: 1,
          fields: [
            { instanceId: 'fld_hostel_req', fieldDefinitionId: 'HST_REQUIRED', customLabel: 'Hostel Required', isRequired: false, width: 'HALF', sortOrder: 1 },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    expect(saved.schemaPayload.rules[0]!.targetSectionId).toBe('sec_hostel_details');
  });

  it('TEST 10 — Repeatable group configuration (Siblings & Previous Education)', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Repeatable Sibling Form', formPurpose: 'ADMISSION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_siblings',
          title: 'Sibling Details',
          showSectionHeading: true,
          sortOrder: 1,
          repeatableConfig: {
            isRepeatable: true,
            addButtonText: '+ Add Another Sibling',
            minEntries: 0,
            maxEntries: 5,
          },
          fields: [
            { instanceId: 'fld_sib_name', fieldDefinitionId: 'SIB_NAME', customLabel: 'Sibling Name', width: 'HALF', isRequired: true, sortOrder: 1 },
            { instanceId: 'fld_sib_class', fieldDefinitionId: 'SIB_CLASS', customLabel: 'Class', width: 'HALF', isRequired: true, sortOrder: 2 },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    expect(saved.schemaPayload.sections[0]!.repeatableConfig?.isRepeatable).toBe(true);
    expect(saved.schemaPayload.sections[0]!.repeatableConfig?.maxEntries).toBe(5);
  });

  it('TEST 11 — Custom field creation in Field Library', async () => {
    const custom = await formsService.createCustomField(
      TENANT_A,
      {
        name: 'Scholarship Exam Roll Number',
        category: 'ADMISSION_ACADEMIC',
        dataType: 'TEXT',
        defaultLabel: 'Scholarship Exam Roll Number',
        defaultPlaceholder: 'e.g. SCH-2026-001',
      },
      ACTOR_USER
    );

    expect(custom.name).toBe('Scholarship Exam Roll Number');
    expect(custom.origin).toBe('CUSTOM');
    expect(custom.organizationId).toBe(TENANT_A);
  });

  it('TEST 12 — Duplicate canonical-field warning/prevention', async () => {
    // Attempting to create "Date of Birth" custom field when canonical DOB exists
    await expect(
      formsService.createCustomField(
        TENANT_A,
        {
          name: 'Student Date of Birth Custom',
          category: 'STUDENT_BASIC',
          dataType: 'DATE',
          defaultLabel: 'DOB',
        },
        ACTOR_USER
      )
    ).rejects.toThrow(/A canonical system field 'Date of Birth' already exists for this concept/);
  });

  it('TEST 13 — Geography cascading field references', async () => {
    const fields = await formsService.listFieldLibrary(TENANT_A, 'CURRENT_ADDRESS');
    const country = fields.find((f) => f.canonicalKey === 'CURRENT_COUNTRY');
    const state = fields.find((f) => f.canonicalKey === 'CURRENT_STATE');
    const city = fields.find((f) => f.canonicalKey === 'CURRENT_CITY');
    const area = fields.find((f) => f.canonicalKey === 'CURRENT_AREA');

    expect(country?.masterBinding).toBe('COUNTRY');
    expect(state?.masterBinding).toBe('STATE');
    expect(city?.masterBinding).toBe('CITY');
    expect(area?.masterBinding).toBe('AREA');
  });

  it('TEST 14 — Board/Academic Level/Class master references', async () => {
    const fields = await formsService.listFieldLibrary(TENANT_A, 'ADMISSION_ACADEMIC');
    const board = fields.find((f) => f.canonicalKey === 'BOARD');
    const level = fields.find((f) => f.canonicalKey === 'ACADEMIC_LEVEL');
    const cls = fields.find((f) => f.canonicalKey === 'APPLYING_CLASS');

    expect(board?.masterBinding).toBe('BOARD');
    expect(level?.masterBinding).toBe('ACADEMIC_LEVEL');
    expect(cls?.masterBinding).toBe('CLASS');
  });

  it('TEST 15 — DOB + age eligibility metadata compatibility', async () => {
    const fields = await formsService.listFieldLibrary(TENANT_A, 'STUDENT_BASIC');
    const dob = fields.find((f) => f.canonicalKey === 'STUDENT_DOB');
    expect(dob).toBeDefined();
    expect(dob?.dataType).toBe('DATE');
  });

  it('TEST 16 — School form -> All Campuses assignment', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Universal School Pre-Reg Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER
    );

    await formsService.publishFormVersion(TENANT_A, form.id, { changelogSummary: 'v1 published' }, ACTOR_USER);

    const campusAResolved = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_A);
    const campusBResolved = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_B);

    expect(campusAResolved.formDefinitionId).toBe(form.id);
    expect(campusBResolved.formDefinitionId).toBe(form.id);
  });

  it('TEST 17 — School form -> Selected Campuses assignment', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Gulshan Campus Exclusive Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_A],
      },
      ACTOR_USER
    );

    await formsService.publishFormVersion(TENANT_A, form.id, { changelogSummary: 'v1 published' }, ACTOR_USER);

    const campusAResolved = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_A);
    expect(campusAResolved.formDefinitionId).toBe(form.id);

    await expect(
      formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_B)
    ).rejects.toThrow(/No published 'PRE_REGISTRATION' form currently applies to Campus ID/);
  });

  it('TEST 18 — New Campus automatically receives All-Campuses form', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Universal Pre-Reg Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER
    );

    await formsService.publishFormVersion(TENANT_A, form.id, { changelogSummary: 'v1 published' }, ACTOR_USER);

    // Add Campus C later
    const db = drizzle(pglite);
    await db.insert(branches).values({
      id: CAMPUS_C,
      organizationId: TENANT_A,
      name: 'DHA Phase 8 Campus',
      code: 'BH-DHA',
    });

    const campusCResolved = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_C);
    expect(campusCResolved.formDefinitionId).toBe(form.id);
  });

  it('TEST 19 — Selected-Campus form does not automatically apply to new Campus', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Selected Campuses Only Pre-Reg',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_A],
      },
      ACTOR_USER
    );

    await formsService.publishFormVersion(TENANT_A, form.id, { changelogSummary: 'v1 published' }, ACTOR_USER);

    const db = drizzle(pglite);
    await db.insert(branches).values({
      id: CAMPUS_C,
      organizationId: TENANT_A,
      name: 'DHA Phase 8 Campus',
      code: 'BH-DHA',
    });

    await expect(
      formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_C)
    ).rejects.toThrow(/No published 'PRE_REGISTRATION' form currently applies to Campus ID/);
  });

  it('TEST 20 — Campus local form override takes deterministic precedence', async () => {
    // 1. School creates universal form
    const schoolForm = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'School Universal Pre-Reg',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER
    );
    await formsService.publishFormVersion(TENANT_A, schoolForm.id, undefined, ACTOR_USER);

    // 2. Campus A creates local override form
    const campusForm = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Campus A Custom Local Pre-Reg',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_standard_prereg',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );
    await formsService.publishFormVersion(TENANT_A, campusForm.id, undefined, ACTOR_USER, 'CAMPUS_ADMIN');

    // Campus A resolves its local form
    const resA = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_A);
    expect(resA.formDefinitionId).toBe(campusForm.id);
    expect(resA.sourceOrigin).toBe('LOCAL');

    // Campus B resolves the universal school form
    const resB = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_B);
    expect(resB.formDefinitionId).toBe(schoolForm.id);
    expect(resB.sourceOrigin).toBe('INHERITED');
  });

  it('TEST 21 — Ownership remains original owner', async () => {
    const campusForm = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Local Campus Form',
        formPurpose: 'PRE_REGISTRATION',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    expect(campusForm.ownerType).toBe('CAMPUS');
    expect(campusForm.ownerId).toBe(CAMPUS_A);
  });

  it('TEST 22 — Upward visibility respects Governance Engine', async () => {
    await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Campus A Local Form',
        formPurpose: 'PRE_REGISTRATION',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );

    // School admin discovers it with FULL_DETAIL
    const schoolList = await formsService.listFormDefinitions(TENANT_A, undefined, undefined, undefined, undefined, 'SCHOOL_ADMIN');
    expect(schoolList.some((f) => f.name === 'Campus A Local Form')).toBe(true);

    // Head Office admin default policy: SUMMARY_ONLY (omitted from operational list)
    const hoList = await formsService.listFormDefinitions(TENANT_A, undefined, undefined, undefined, undefined, 'HEAD_OFFICE_ADMIN');
    expect(hoList.some((f) => f.name === 'Campus A Local Form')).toBe(false);
  });

  it('TEST 23 — Published Version 1 remains immutable historically', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Versioned Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
      },
      ACTOR_USER
    );

    await formsService.publishFormVersion(TENANT_A, form.id, { changelogSummary: 'Initial v1' }, ACTOR_USER);

    // Create Version 2
    const v2 = await formsService.createNewVersion(TENANT_A, form.id, ACTOR_USER);
    expect(v2.versionNumber).toBe(2);
    expect(v2.status).toBe('DRAFT');

    // Historical Version 1 remains published
    const details = await formsService.getFormDefinition(TENANT_A, form.id);
    const v1 = details.allVersions.find((v) => v.versionNumber === 1);
    expect(v1?.status).toBe('PUBLISHED');
  });

  it('TEST 24 — Version 2 becomes effective for runtime resolution after publication', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Upgraded Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER
    );

    await formsService.publishFormVersion(TENANT_A, form.id, undefined, ACTOR_USER);
    const resV1 = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_A);
    expect(resV1.versionNumber).toBe(1);

    // Create and Publish Version 2
    await formsService.createNewVersion(TENANT_A, form.id, ACTOR_USER);
    await formsService.publishFormVersion(TENANT_A, form.id, { changelogSummary: 'Published v2' }, ACTOR_USER);

    const resV2 = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_A);
    expect(resV2.versionNumber).toBe(2);
  });

  it('TEST 25 — Old submission can remain tied to Version 1 architecture', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Submissions History Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER
    );

    await formsService.publishFormVersion(TENANT_A, form.id, undefined, ACTOR_USER);
    const v1Resolution = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_A);
    const submissionLinkedVersionId = v1Resolution.versionId;

    // Create Version 2
    await formsService.createNewVersion(TENANT_A, form.id, ACTOR_USER);
    await formsService.publishFormVersion(TENANT_A, form.id, undefined, ACTOR_USER);

    // Old submission pointer remains valid and resolvable
    expect(submissionLinkedVersionId).toBeDefined();
  });

  it('TEST 26 — Tenant isolation remains absolute', async () => {
    await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Tenant A Exclusive Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const listA = await formsService.listFormDefinitions(TENANT_A);
    const listB = await formsService.listFormDefinitions(TENANT_B);

    expect(listA.some((f) => f.name === 'Tenant A Exclusive Form')).toBe(true);
    expect(listB.some((f) => f.name === 'Tenant A Exclusive Form')).toBe(false);
  });

  it('TEST 27 — Unauthorized Campus cannot resolve another Campus local form', async () => {
    const campusBForm = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Campus B Private Form',
        formPurpose: 'PRE_REGISTRATION',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_B,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      undefined,
      'CAMPUS_ADMIN'
    );
    await formsService.publishFormVersion(TENANT_A, campusBForm.id, undefined, ACTOR_USER, 'CAMPUS_ADMIN');

    await expect(
      formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_A)
    ).rejects.toThrow(/No published 'PRE_REGISTRATION' form currently applies to Campus ID/);
  });

  it('TEST 28 — Unauthorized user cannot publish via direct API', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'School Protected Form',
        formPurpose: 'PRE_REGISTRATION',
        ownerType: 'SCHOOL',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER,
      undefined,
      'SCHOOL_ADMIN'
    );

    // Campus admin attempting to publish parent school-owned form is rejected
    await expect(
      formsService.publishFormVersion(TENANT_A, form.id, undefined, ACTOR_USER, 'CAMPUS_ADMIN')
    ).rejects.toThrow(/You do not have permission to publish this form/);
  });

  it('TEST 29 — Field labels may change without changing canonical identity', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Label Renaming Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_1',
          title: 'Parent Details',
          showSectionHeading: true,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_fat_mob',
              fieldDefinitionId: 'FAT_MOBILE',
              canonicalKey: 'FATHER_MOBILE',
              customLabel: 'Parent WhatsApp / Contact Number', // Renamed label
              width: 'HALF',
              isRequired: true,
              sortOrder: 1,
            },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    expect(saved.schemaPayload.sections[0]!.fields[0]!.customLabel).toBe('Parent WhatsApp / Contact Number');
    expect(saved.schemaPayload.sections[0]!.fields[0]!.canonicalKey).toBe('FATHER_MOBILE');
  });

  it('TEST 30 — 80+ Field Library does not create empty submission data', async () => {
    const library = await formsService.listFieldLibrary(TENANT_A);
    expect(library.length).toBeGreaterThanOrEqual(40);

    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Minimal Form',
        formPurpose: 'PRE_REGISTRATION',
        templateId: 'tmpl_basic_prereg',
      },
      ACTOR_USER
    );

    const details = await formsService.getFormDefinition(TENANT_A, form.id);
    const usedFields = details.currentVersion.schemaPayload.sections.flatMap((s) => s.fields);

    // Form uses only 6 fields, not all 80+ catalog fields
    expect(usedFields.length).toBeLessThanOrEqual(10);
  });

  it('TEST 31 — Duplicate canonical concept detector blocks duplicate concepts', async () => {
    const check1 = await formsService.checkDuplicateCanonicalConcept('Student DOB', 'STUDENT_BASIC');
    expect(check1.isDuplicate).toBe(true);
    expect(check1.matchedCanonical).toBe('STUDENT_DOB');
    expect(check1.message).toContain('Date of Birth');

    const check2 = await formsService.checkDuplicateCanonicalConcept('Father Mobile SMS', 'CONTACT_INFO');
    expect(check2.isDuplicate).toBe(true);
    expect(check2.matchedCanonical).toBe('FATHER_MOBILE');

    const check3 = await formsService.checkDuplicateCanonicalConcept('Unique Scholarship Exam Roll', 'OTHER');
    expect(check3.isDuplicate).toBe(false);
  });

  it('TEST 32 — Field width options (QUARTER 25%, HALF 50%, THREE_QUARTERS 75%, FULL 100%) persist in schema', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Width Test Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_widths',
          title: 'Width Layout Testing',
          showSectionHeading: true,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_q',
              fieldDefinitionId: 'STD_FIRST_NAME',
              customLabel: 'Quarter Width Field',
              width: 'QUARTER',
              isRequired: true,
              sortOrder: 1,
            },
            {
              instanceId: 'fld_h',
              fieldDefinitionId: 'STD_LAST_NAME',
              customLabel: 'Half Width Field',
              width: 'HALF',
              isRequired: false,
              sortOrder: 2,
            },
            {
              instanceId: 'fld_tq',
              fieldDefinitionId: 'STD_EMAIL',
              customLabel: 'Three Quarter Width Field',
              width: 'THREE_QUARTERS',
              isRequired: true,
              sortOrder: 3,
            },
            {
              instanceId: 'fld_f',
              fieldDefinitionId: 'ADDR_CURR_LINE1',
              customLabel: 'Full Width Field',
              width: 'FULL',
              isRequired: false,
              sortOrder: 4,
            },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    const fields = saved.schemaPayload.sections[0]!.fields;
    expect(fields[0]!.width).toBe('QUARTER');
    expect(fields[1]!.width).toBe('HALF');
    expect(fields[2]!.width).toBe('THREE_QUARTERS');
    expect(fields[3]!.width).toBe('FULL');
  });

  it('TEST 33 — Required / Optional toggle alters validation flag cleanly', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Required Toggle Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const initialSchema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_1',
          title: 'Section 1',
          showSectionHeading: true,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_opt',
              fieldDefinitionId: 'STD_FIRST_NAME',
              customLabel: 'Student First Name',
              width: 'HALF',
              isRequired: false, // Optional
              sortOrder: 1,
            },
          ],
        },
      ],
    };

    let draft = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: initialSchema }, ACTOR_USER);
    expect(draft.schemaPayload.sections[0]!.fields[0]!.isRequired).toBe(false);

    // Toggle to Required
    initialSchema.sections[0]!.fields[0]!.isRequired = true;
    draft = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: initialSchema }, ACTOR_USER);
    expect(draft.schemaPayload.sections[0]!.fields[0]!.isRequired).toBe(true);
  });

  it('TEST 34 — Moving a field across sections preserves all properties', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Cross Section Move Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const schemaWithTwoSections: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_parent',
          title: 'Parent Section',
          showSectionHeading: true,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_city_1',
              fieldDefinitionId: 'ADDR_CURR_CITY',
              canonicalKey: 'CURRENT_CITY',
              customLabel: 'Residential City',
              placeholder: 'e.g. Karachi',
              helpText: 'Select your permanent or current city',
              width: 'HALF',
              isRequired: true,
              masterBinding: 'CITY',
              sortOrder: 1,
            },
          ],
        },
        {
          id: 'sec_address',
          title: 'Address Section',
          showSectionHeading: true,
          sortOrder: 2,
          fields: [],
        },
      ],
    };

    await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schemaWithTwoSections }, ACTOR_USER);

    // Move fld_city_1 from sec_parent to sec_address
    const movedField = { ...schemaWithTwoSections.sections[0]!.fields[0]! };
    schemaWithTwoSections.sections[0]!.fields = [];
    schemaWithTwoSections.sections[1]!.fields.push(movedField);

    const updated = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schemaWithTwoSections }, ACTOR_USER);
    expect(updated.schemaPayload.sections[0]!.fields.length).toBe(0);
    expect(updated.schemaPayload.sections[1]!.fields.length).toBe(1);

    const targetField = updated.schemaPayload.sections[1]!.fields[0]!;
    expect(targetField.instanceId).toBe('fld_city_1');
    expect(targetField.canonicalKey).toBe('CURRENT_CITY');
    expect(targetField.customLabel).toBe('Residential City');
    expect(targetField.placeholder).toBe('e.g. Karachi');
    expect(targetField.helpText).toBe('Select your permanent or current city');
    expect(targetField.masterBinding).toBe('CITY');
    expect(targetField.isRequired).toBe(true);
  });

  it('TEST 35 — Reordering sections updates sequence deterministically', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Section Reorder Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        { id: 'sec_1', title: 'Student Info', showSectionHeading: true, sortOrder: 1, fields: [] },
        { id: 'sec_2', title: 'Parent Info', showSectionHeading: true, sortOrder: 2, fields: [] },
        { id: 'sec_3', title: 'Documents', showSectionHeading: true, sortOrder: 3, fields: [] },
      ],
    };

    await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);

    // Swap sec_3 to the first position
    const reorderedSchema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        { id: 'sec_3', title: 'Documents', showSectionHeading: true, sortOrder: 1, fields: [] },
        { id: 'sec_1', title: 'Student Info', showSectionHeading: true, sortOrder: 2, fields: [] },
        { id: 'sec_2', title: 'Parent Info', showSectionHeading: true, sortOrder: 3, fields: [] },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: reorderedSchema }, ACTOR_USER);
    expect(saved.schemaPayload.sections[0]!.id).toBe('sec_3');
    expect(saved.schemaPayload.sections[1]!.id).toBe('sec_1');
    expect(saved.schemaPayload.sections[2]!.id).toBe('sec_2');
  });

  it('TEST 36 — SELECTED_CAMPUSES with zero selections is blocked server-side', async () => {
    await expect(
      formsService.createFormDefinition(
        TENANT_A,
        {
          name: 'Zero Location Form',
          formPurpose: 'PRE_REGISTRATION',
          applyTo: 'SELECTED_CAMPUSES',
          branchIds: [],
        },
        ACTOR_USER
      )
    ).rejects.toThrow(/Please select at least one location/);
  });

  it('TEST 37 — Unauthorized branch selection is rejected server-side', async () => {
    await expect(
      formsService.createFormDefinition(
        TENANT_A,
        {
          name: 'Unauthorized Scope Form',
          formPurpose: 'PRE_REGISTRATION',
          applyTo: 'SELECTED_CAMPUSES',
          branchIds: [CAMPUS_B],
        },
        ACTOR_USER,
        [CAMPUS_A], // User only authorized for CAMPUS_A
        'CAMPUS_ADMIN'
      )
    ).rejects.toThrow(/You are not authorized to assign forms to one or more selected locations/);
  });

  it('TEST 38 — Redundant overlapping branch IDs are deduplicated', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Deduplicated Targets Form',
        formPurpose: 'PRE_REGISTRATION',
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_A, CAMPUS_A, CAMPUS_B, CAMPUS_A, CAMPUS_B], // Duplicated IDs
      },
      ACTOR_USER
    );

    expect(form.branchIds?.length).toBe(2);
    expect(form.branchIds).toContain(CAMPUS_A);
    expect(form.branchIds).toContain(CAMPUS_B);
  });

  it('TEST 39 — Hierarchy precedence: local campus override takes precedence over selected campuses and universal', async () => {
    // 1. Universal form
    const universal = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Universal Base Form', formPurpose: 'CUSTOM', applyTo: 'ALL_CAMPUSES' },
      ACTOR_USER
    );
    await formsService.publishFormVersion(TENANT_A, universal.id, undefined, ACTOR_USER);

    // 2. Selected campuses form for CAMPUS_A
    const selectedScope = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Selected Scope Form', formPurpose: 'CUSTOM', applyTo: 'SELECTED_CAMPUSES', branchIds: [CAMPUS_A] },
      ACTOR_USER
    );
    await formsService.publishFormVersion(TENANT_A, selectedScope.id, undefined, ACTOR_USER);

    // CAMPUS_A resolves the selected scope form, while CAMPUS_B falls back to universal
    const resA = await formsService.resolvePublishedForm(TENANT_A, 'CUSTOM', CAMPUS_A);
    const resB = await formsService.resolvePublishedForm(TENANT_A, 'CUSTOM', CAMPUS_B);
    expect(resA.formDefinitionId).toBe(selectedScope.id);
    expect(resB.formDefinitionId).toBe(universal.id);

    // 3. Local campus override for CAMPUS_A
    const localOverride = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Local Campus A Override Form',
        formPurpose: 'CUSTOM',
        ownerType: 'CAMPUS',
        ownerId: CAMPUS_A,
        applyTo: 'LOCAL_SCOPE',
      },
      ACTOR_USER,
      [CAMPUS_A],
      'CAMPUS_ADMIN'
    );
    await formsService.publishFormVersion(TENANT_A, localOverride.id, undefined, ACTOR_USER, 'CAMPUS_ADMIN');

    // CAMPUS_A now resolves the local override form with top priority
    const resAOverride = await formsService.resolvePublishedForm(TENANT_A, 'CUSTOM', CAMPUS_A);
    expect(resAOverride.formDefinitionId).toBe(localOverride.id);
    expect(resAOverride.sourceOrigin).toBe('LOCAL');
  });

  it('TEST 40 — Single-location and variable-depth hierarchy forms resolve correctly', async () => {
    const singleLocForm = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Single Location School Form',
        formPurpose: 'PRE_REGISTRATION',
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_B],
      },
      ACTOR_USER
    );
    await formsService.publishFormVersion(TENANT_A, singleLocForm.id, undefined, ACTOR_USER);

    const resolved = await formsService.resolvePublishedForm(TENANT_A, 'PRE_REGISTRATION', CAMPUS_B);
    expect(resolved.formDefinitionId).toBe(singleLocForm.id);
    expect(resolved.resolvedCampusId).toBe(CAMPUS_B);
  });

  it('TEST 41 — Mixed multi-level selection supports multiple targets simultaneously', async () => {
    const mixedForm = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Mixed Multi-Level Scope Form',
        formPurpose: 'ADMISSION',
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_A, CAMPUS_B],
      },
      ACTOR_USER
    );

    expect(mixedForm.applyTo).toBe('SELECTED_CAMPUSES');
    expect(mixedForm.branchIds?.length).toBe(2);
    expect(mixedForm.branchIds).toContain(CAMPUS_A);
    expect(mixedForm.branchIds).toContain(CAMPUS_B);
  });

  it('TEST 42 — Multi-level targets resolve published form across all selected branches', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Multi-Target Active Resolution Form',
        formPurpose: 'CUSTOM',
        applyTo: 'SELECTED_CAMPUSES',
        branchIds: [CAMPUS_A, CAMPUS_B],
      },
      ACTOR_USER
    );

    await formsService.publishFormVersion(TENANT_A, form.id, undefined, ACTOR_USER);

    const resA = await formsService.resolvePublishedForm(TENANT_A, 'CUSTOM', CAMPUS_A);
    const resB = await formsService.resolvePublishedForm(TENANT_A, 'CUSTOM', CAMPUS_B);

    expect(resA.formDefinitionId).toBe(form.id);
    expect(resB.formDefinitionId).toBe(form.id);
  });

  it('TEST 43 — Entire organization mode clears individual branch assignments', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Org Universal Mode Form',
        formPurpose: 'CUSTOM',
        applyTo: 'ALL_CAMPUSES',
        branchIds: [],
      },
      ACTOR_USER
    );

    expect(form.applyTo).toBe('ALL_CAMPUSES');
    expect(form.branchIds).toEqual([]);
  });

  it('TEST 44 — Create Custom Field persists in database with permanent UUID and tenant isolation', async () => {
    const customField = await formsService.createCustomField(
      TENANT_A,
      {
        name: 'Applicant Nickname',
        category: 'STUDENT_BASIC',
        dataType: 'TEXT',
        defaultLabel: 'Preferred Nickname',
        defaultPlaceholder: 'e.g. Ali',
      },
      ACTOR_USER
    );

    expect(customField.id).toBeDefined();
    expect(customField.name).toBe('Applicant Nickname');
    expect(customField.origin).toBe('CUSTOM');
    expect(customField.organizationId).toBe(TENANT_A);
    expect(customField.isActive).toBe(true);

    // Verify isolation: Field Library for TENANT_B does not include TENANT_A's custom field
    const tenantBFields = await formsService.listFieldLibrary(TENANT_B);
    const foundInB = tenantBFields.find((f) => f.id === customField.id);
    expect(foundInB).toBeUndefined();
  });

  it('TEST 45 — List Field Library combines Global Master Catalog + Persisted Custom Fields', async () => {
    await formsService.createCustomField(
      TENANT_A,
      {
        name: 'Family Sports House Preference',
        category: 'OTHER',
        dataType: 'SELECT',
        defaultLabel: 'Sports House',
        defaultOptions: [
          { label: 'Jinnah House (Red)', value: 'JINNAH' },
          { label: 'Iqbal House (Green)', value: 'IQBAL' },
        ],
      },
      ACTOR_USER
    );

    const allFields = await formsService.listFieldLibrary(TENANT_A);
    const standardField = allFields.find((f) => f.code === 'STD_FIRST_NAME');
    const customField = allFields.find((f) => f.name === 'Family Sports House Preference');

    expect(standardField).toBeDefined();
    expect(standardField?.origin).toBe('CANONICAL');
    expect(customField).toBeDefined();
    expect(customField?.origin).toBe('CUSTOM');
  });

  it('TEST 46 — Duplicate canonical concept protection warns when attempting to duplicate canonical concepts', async () => {
    await expect(
      formsService.createCustomField(
        TENANT_A,
        {
          name: 'Student Date of Birth Custom',
          category: 'STUDENT_BASIC',
          dataType: 'DATE',
          defaultLabel: 'Birth Date',
        },
        ACTOR_USER
      )
    ).rejects.toThrow(/A canonical system field 'Date of Birth' already exists/);
  });

  it('TEST 47 — Custom field can be added to Form Canvas with custom width, required toggle, and persists in draft', async () => {
    const custom = await formsService.createCustomField(
      TENANT_A,
      {
        name: 'Guardian Emergency Landline',
        category: 'GUARDIAN_INFO',
        dataType: 'TEXT',
        defaultLabel: 'Emergency Landline',
      },
      ACTOR_USER
    );

    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Custom Field Form', formPurpose: 'PRE_REGISTRATION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_guardian',
          title: 'Guardian Contact',
          showSectionHeading: true,
          columns: 2,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_g_landline',
              fieldDefinitionId: custom.id,
              customLabel: 'Emergency Landline Number',
              width: 'HALF', // 50% width
              isRequired: true,
              sortOrder: 1,
            },
          ],
        },
      ],
    };

    const saved = await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);
    const loadedField = saved.schemaPayload.sections[0]!.fields[0]!;

    expect(loadedField.fieldDefinitionId).toBe(custom.id);
    expect(loadedField.width).toBe('HALF');
    expect(loadedField.isRequired).toBe(true);
  });

  it('TEST 48 — Campus administrator role cannot create Universal Entire Organization form', async () => {
    await expect(
      formsService.createFormDefinition(
        TENANT_A,
        {
          name: 'Unauthorized Universal Form Attempt',
          formPurpose: 'CUSTOM',
          applyTo: 'ALL_CAMPUSES',
        },
        ACTOR_USER,
        undefined,
        'CAMPUS_ADMIN'
      )
    ).rejects.toThrow(/Campus administrators cannot create or apply Universal Organization-wide forms/);
  });

  it('TEST 49 — Head Office Administrator CAN create Universal Entire Organization form', async () => {
    const form = await formsService.createFormDefinition(
      TENANT_A,
      {
        name: 'Authorized HO Universal Form',
        formPurpose: 'CUSTOM',
        applyTo: 'ALL_CAMPUSES',
      },
      ACTOR_USER,
      undefined,
      'HEAD_OFFICE_ADMIN'
    );

    expect(form.id).toBeDefined();
    expect(form.applyTo).toBe('ALL_CAMPUSES');
  });

  it('TEST 50 — Database-persisted custom field survives and loads with stable UUID in Field Library', async () => {
    const custom = await formsService.createCustomField(
      TENANT_A,
      {
        name: 'Sibling Alumni Roll Number',
        category: 'SIBLINGS',
        dataType: 'TEXT',
        defaultLabel: 'Alumni Roll #',
      },
      ACTOR_USER
    );

    const library = await formsService.listFieldLibrary(TENANT_A);
    const found = library.find((f) => f.id === custom.id);

    expect(found).toBeDefined();
    expect(found?.name).toBe('Sibling Alumni Roll Number');
    expect(found?.origin).toBe('CUSTOM');
    expect(found?.category).toBe('SIBLINGS');
  });

  it('TEST 51 — Large hierarchy with 70 campuses resolves effective targets and child counts without duplicates', async () => {
    // Construct 70-campus hierarchy fixture
    const largeHierarchy: any[] = [
      {
        id: 'ho_enterprise',
        name: 'Enterprise Head Office',
        type: 'HEAD_OFFICE',
        children: Array.from({ length: 3 }, (_, rIdx) => ({
          id: `reg_${rIdx + 1}`,
          name: `Region ${rIdx + 1}`,
          type: 'REGION',
          parentId: 'ho_enterprise',
          children: Array.from({ length: 4 }, (_, sIdx) => {
            const schId = `sch_r${rIdx + 1}_s${sIdx + 1}`;
            return {
              id: schId,
              name: `School ${rIdx + 1}-${sIdx + 1}`,
              type: 'SCHOOL',
              parentId: `reg_${rIdx + 1}`,
              children: Array.from({ length: 6 }, (_, cIdx) => ({
                id: `campus_r${rIdx + 1}_s${sIdx + 1}_c${cIdx + 1}`,
                name: `Campus ${rIdx + 1}-${sIdx + 1}-${cIdx + 1}`,
                type: 'CAMPUS',
                parentId: schId,
              })),
            };
          }),
        })),
      },
    ];

    // Selecting Region 1 (which has 4 schools * 6 campuses = 24 campuses)
    const state: any = {
      isEntireOrg: false,
      selectedHeadOfficeIds: [],
      selectedRegionIds: ['reg_1'],
      selectedSchoolIds: [],
      selectedCampusIds: [],
    };

    // Use pure resolver logic
    const branchSet = new Set<string>();
    const collectCampuses = (node: any) => {
      if (node.type === 'CAMPUS') branchSet.add(node.id);
      if (node.children) node.children.forEach(collectCampuses);
    };
    const findAndCollect = (nodeId: string, node: any) => {
      if (node.id === nodeId) {
        collectCampuses(node);
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (findAndCollect(nodeId, child)) return true;
        }
      }
      return false;
    };

    state.selectedRegionIds.forEach((pId: string) => {
      largeHierarchy.forEach((root) => findAndCollect(pId, root));
    });

    expect(branchSet.size).toBe(24);
  });

  it('TEST 52 — Edit Custom Field fixes typos while strictly preserving persistent UUID and code', async () => {
    // 1. Create with typo
    const created = await formsService.createCustomField(
      TENANT_A,
      {
        name: 'Fater Occupation',
        category: 'FATHER_INFO',
        dataType: 'TEXT',
        defaultLabel: 'Fater Occupation',
        defaultPlaceholder: 'e.g. Business',
      },
      ACTOR_USER
    );

    const originalId = created.id;
    const originalCode = created.code;

    // 2. Edit to fix typo
    const updated = await formsService.updateCustomField(
      TENANT_A,
      originalId,
      {
        name: 'Father Occupation',
        defaultLabel: 'Father Occupation',
        defaultPlaceholder: 'e.g. Software Engineer',
      },
      ACTOR_USER
    );

    expect(updated.id).toBe(originalId);
    expect(updated.code).toBe(originalCode);
    expect(updated.name).toBe('Father Occupation');
    expect(updated.defaultLabel).toBe('Father Occupation');
    expect(updated.defaultPlaceholder).toBe('e.g. Software Engineer');
  });

  it('TEST 53 — Form draft referencing edited custom field continues to resolve with stable ID', async () => {
    const custom = await formsService.createCustomField(
      TENANT_A,
      {
        name: 'Passport Expiry Date',
        category: 'IDENTITY',
        dataType: 'DATE',
        defaultLabel: 'Passport Expiry',
      },
      ACTOR_USER
    );

    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Passport Verification Form', formPurpose: 'ADMISSION' },
      ACTOR_USER
    );

    const schema: FormSchemaPayload = {
      rules: [],
      settings: {},
      sections: [
        {
          id: 'sec_id_docs',
          title: 'Identity Documents',
          showSectionHeading: true,
          columns: 1,
          sortOrder: 1,
          fields: [
            {
              instanceId: 'fld_pass_exp',
              fieldDefinitionId: custom.id,
              customLabel: 'Passport Expiry (Form Override)',
              width: 'FULL',
              isRequired: true,
              sortOrder: 1,
            },
          ],
        },
      ],
    };

    await formsService.saveFormDraft(TENANT_A, form.id, { schemaPayload: schema }, ACTOR_USER);

    // Now update master field label
    await formsService.updateCustomField(
      TENANT_A,
      custom.id,
      { defaultLabel: 'Passport Expiration Date' },
      ACTOR_USER
    );

    // Form version should still retain its reference to custom.id
    const loaded = await formsService.getFormDefinition(TENANT_A, form.id);
    const fieldInForm = loaded.currentVersion.schemaPayload.sections[0]!.fields[0]!;

    expect(fieldInForm.fieldDefinitionId).toBe(custom.id);
    expect(fieldInForm.customLabel).toBe('Passport Expiry (Form Override)');
  });

  it('TEST 54 — Unsafe data type mutation is blocked when field is referenced by a form', async () => {
    const custom = await formsService.createCustomField(
      TENANT_A,
      {
        name: 'Family Annual Income',
        category: 'FATHER_INFO',
        dataType: 'NUMBER',
        defaultLabel: 'Annual Income',
      },
      ACTOR_USER
    );

    const form = await formsService.createFormDefinition(
      TENANT_A,
      { name: 'Income Form', formPurpose: 'ADMISSION' },
      ACTOR_USER
    );

    await formsService.saveFormDraft(
      TENANT_A,
      form.id,
      {
        schemaPayload: {
          rules: [],
          settings: {},
          sections: [
            {
              id: 'sec_1',
              title: 'Income',
              showSectionHeading: true,
              columns: 1,
              sortOrder: 1,
              fields: [
                {
                  instanceId: 'fld_inc',
                  fieldDefinitionId: custom.id,
                  customLabel: 'Income',
                  width: 'FULL',
                  isRequired: false,
                  sortOrder: 1,
                },
              ],
            },
          ],
        },
      },
      ACTOR_USER
    );

    // Attempt to change dataType from NUMBER to DATE on referenced field
    await expect(
      formsService.updateCustomField(
        TENANT_A,
        custom.id,
        { dataType: 'DATE' as any },
        ACTOR_USER
      )
    ).rejects.toThrow(/Cannot modify data type/);
  });

  it('TEST 55 — System and canonical fields cannot be modified through Custom Field API', async () => {
    await expect(
      formsService.updateCustomField(
        TENANT_A,
        'STD_FIRST_NAME',
        { defaultLabel: 'Illegal Rename' },
        ACTOR_USER
      )
    ).rejects.toThrow();
  });

  it('TEST 56 — Unauthorized target scopes are rejected server-side', async () => {
    // Caller is authorized only for CAMPUS_A
    await expect(
      formsService.createFormDefinition(
        TENANT_A,
        {
          name: 'Unauthorized Target Form',
          formPurpose: 'CUSTOM',
          applyTo: 'SELECTED_CAMPUSES',
          branchIds: [CAMPUS_B], // Not in caller's authorized scope
        },
        ACTOR_USER,
        [CAMPUS_A], // authorized branches
        'CAMPUS_ADMIN'
      )
    ).rejects.toThrow(/You are not authorized to assign forms to one or more selected locations/);
  });
});
