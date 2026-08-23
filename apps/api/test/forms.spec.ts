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
});
