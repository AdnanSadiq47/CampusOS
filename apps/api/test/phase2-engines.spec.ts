import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { TenantTransactionManager } from '@campus-os/database';
import { EntitiesService } from '../src/core/entities/entities.service.js';
import { FormsService } from '../src/core/forms/forms.service.js';
import { WorkflowsService } from '../src/core/workflows/workflows.service.js';
import { NavigationService } from '../src/core/navigation/navigation.service.js';
import { ModulesService } from '../src/core/modules/modules.service.js';

describe('Phase 2 Platform Dynamic Engines & Virtual ORM Integration Tests', () => {
  let pg: PGlite;
  let txManager: TenantTransactionManager;
  let entitiesService: EntitiesService;
  let formsService: FormsService;
  let workflowsService: WorkflowsService;
  let navigationService: NavigationService;
  let modulesService: ModulesService;

  const TENANT_ID = '11111111-1111-1111-1111-111111111111';
  const NODE_HO_ID = 'cccccccc-1111-1111-1111-111111111111';
  const NODE_CAMPUS_ID = 'cccccccc-2222-2222-2222-222222222222';
  const USER_ID = 'aaaaaaaa-1111-1111-1111-111111111111';
  const MEMBERSHIP_ID = '10000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    pg = new PGlite();

    // 1. Setup DDL Schema for all tables
    await pg.exec(`
      CREATE TABLE identity_users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE organizations (
        id UUID PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        primary_currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );

      CREATE TABLE hierarchy_node_types (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        level_order INT NOT NULL,
        allow_financial_posting BOOLEAN DEFAULT TRUE NOT NULL,
        allow_user_assignment BOOLEAN DEFAULT TRUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        CONSTRAINT uq_node_type_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE hierarchy_nodes (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        node_type_id UUID NOT NULL,
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        CONSTRAINT uq_nodes_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE organization_memberships (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        identity_user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
        membership_type VARCHAR(32) DEFAULT 'STAFF' NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        valid_until TIMESTAMPTZ,
        version INT DEFAULT 1 NOT NULL,
        CONSTRAINT uq_memberships_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE membership_node_assignments (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        membership_id UUID NOT NULL,
        hierarchy_node_id UUID NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        valid_until TIMESTAMPTZ,
        assigned_by UUID REFERENCES identity_users(id),
        CONSTRAINT uq_assignments_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE roles (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        CONSTRAINT uq_roles_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE assignment_roles (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        assignment_id UUID NOT NULL,
        role_id UUID NOT NULL,
        CONSTRAINT uq_assignment_roles UNIQUE (assignment_id, role_id)
      );

      -- Phase 2 Tables
      CREATE TABLE entity_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_entity_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_entity_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE entity_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        field_type VARCHAR(32) NOT NULL,
        is_required BOOLEAN DEFAULT FALSE NOT NULL,
        is_unique BOOLEAN DEFAULT FALSE NOT NULL,
        is_searchable BOOLEAN DEFAULT FALSE NOT NULL,
        default_value JSONB,
        validation_rules JSONB DEFAULT '{}'::jsonb NOT NULL,
        options JSONB DEFAULT '[]'::jsonb NOT NULL,
        reference_entity_id UUID,
        sort_order INT DEFAULT 0 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_entity_field_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_entity_field_code UNIQUE (organization_id, entity_id, code)
      );

      CREATE TABLE entity_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_id UUID NOT NULL,
        hierarchy_node_id UUID NOT NULL,
        data JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_by UUID REFERENCES identity_users(id),
        updated_by UUID REFERENCES identity_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_entity_record_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE form_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        form_purpose VARCHAR(64) DEFAULT 'PRE_REGISTRATION' NOT NULL,
        description TEXT,
        owner_type VARCHAR(32) DEFAULT 'SCHOOL' NOT NULL,
        owner_id UUID,
        apply_to VARCHAR(32) DEFAULT 'ALL_CAMPUSES' NOT NULL,
        current_version_id UUID,
        published_version_id UUID,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_form_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_form_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE form_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        form_id UUID,
        form_definition_id UUID,
        version INT,
        version_number INT,
        status VARCHAR(32) DEFAULT 'DRAFT' NOT NULL,
        schema_ast JSONB,
        schema_payload JSONB,
        changelog_summary TEXT,
        rules JSONB DEFAULT '[]'::jsonb NOT NULL,
        published_at TIMESTAMPTZ,
        published_by UUID REFERENCES identity_users(id),
        published_by_user_id UUID REFERENCES identity_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_form_version_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE workflow_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        description TEXT,
        initial_state_code VARCHAR(64) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_workflow_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE workflow_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        state_type VARCHAR(32) DEFAULT 'INTERMEDIATE' NOT NULL,
        color VARCHAR(32) DEFAULT 'gray' NOT NULL,
        sort_order INT DEFAULT 0 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_state_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_workflow_state_code UNIQUE (organization_id, workflow_id, code)
      );

      CREATE TABLE workflow_transitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID NOT NULL,
        from_state_code VARCHAR(64) NOT NULL,
        to_state_code VARCHAR(64) NOT NULL,
        action_name VARCHAR(128) NOT NULL,
        guard_rule JSONB DEFAULT '{}'::jsonb NOT NULL,
        required_roles JSONB DEFAULT '[]'::jsonb NOT NULL,
        actions JSONB DEFAULT '[]'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_transition_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE workflow_instances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID NOT NULL,
        record_id UUID NOT NULL,
        current_state_code VARCHAR(64) NOT NULL,
        assigned_node_id UUID NOT NULL,
        started_by UUID REFERENCES identity_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_instance_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE workflow_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        instance_id UUID NOT NULL,
        from_state_code VARCHAR(64) NOT NULL,
        to_state_code VARCHAR(64) NOT NULL,
        action_taken VARCHAR(128) NOT NULL,
        performed_by UUID REFERENCES identity_users(id),
        comments TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_history_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE navigation_menus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_nav_menu_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_nav_menu_code UNIQUE (organization_id, code)
      );

      CREATE TABLE navigation_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        menu_id UUID NOT NULL,
        parent_id UUID,
        label VARCHAR(128) NOT NULL,
        icon VARCHAR(64),
        route_path VARCHAR(255) NOT NULL,
        required_module VARCHAR(64),
        required_permissions JSONB DEFAULT '[]'::jsonb NOT NULL,
        sort_order INT DEFAULT 0 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_nav_item_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE organization_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        module_code VARCHAR(64) NOT NULL,
        is_enabled BOOLEAN DEFAULT FALSE NOT NULL,
        settings JSONB DEFAULT '{}'::jsonb NOT NULL,
        activated_at TIMESTAMPTZ,
        activated_by UUID REFERENCES identity_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_org_module UNIQUE (organization_id, module_code)
      );
    `);

    // 2. Seed Base Data
    await pg.exec(`
      INSERT INTO identity_users (id, email, password_hash, first_name, last_name) VALUES
        ('${USER_ID}', 'admin@alpha.edu', 'hash', 'Admin', 'User');

      INSERT INTO organizations (id, code, name) VALUES
        ('${TENANT_ID}', 'alpha_academy', 'Alpha Academy');

      INSERT INTO hierarchy_node_types (id, organization_id, code, name, level_order) VALUES
        ('bbbbbbbb-1111-1111-1111-111111111111', '${TENANT_ID}', 'HO', 'Head Office', 1),
        ('bbbbbbbb-2222-2222-2222-222222222222', '${TENANT_ID}', 'CAMPUS', 'Campus', 2);

      INSERT INTO hierarchy_nodes (id, organization_id, node_type_id, code, name, path) VALUES
        ('${NODE_HO_ID}', '${TENANT_ID}', 'bbbbbbbb-1111-1111-1111-111111111111', 'HO', 'Head Office', 'root.ho'),
        ('${NODE_CAMPUS_ID}', '${TENANT_ID}', 'bbbbbbbb-2222-2222-2222-222222222222', 'CAMPUS_A', 'Campus Alpha', 'root.ho.campus_a');

      INSERT INTO organization_memberships (id, organization_id, identity_user_id, membership_type, status) VALUES
        ('${MEMBERSHIP_ID}', '${TENANT_ID}', '${USER_ID}', 'STAFF', 'ACTIVE');

      INSERT INTO roles (id, organization_id, code, name) VALUES
        ('dddddddd-1111-1111-1111-111111111111', '${TENANT_ID}', 'PRINCIPAL', 'Principal');

      INSERT INTO membership_node_assignments (id, organization_id, membership_id, hierarchy_node_id, is_primary, status) VALUES
        ('eeeeeeee-1111-1111-1111-111111111111', '${TENANT_ID}', '${MEMBERSHIP_ID}', '${NODE_CAMPUS_ID}', true, 'ACTIVE');

      INSERT INTO assignment_roles (id, organization_id, assignment_id, role_id) VALUES
        ('11111111-aaaa-1111-1111-111111111111', '${TENANT_ID}', 'eeeeeeee-1111-1111-1111-111111111111', 'dddddddd-1111-1111-1111-111111111111');
    `);

    // 3. Initialize Transaction Manager with PGlite instance
    txManager = new TenantTransactionManager(pg as any);
    entitiesService = new EntitiesService(txManager);
    formsService = new FormsService(txManager);
    workflowsService = new WorkflowsService(txManager);
    navigationService = new NavigationService(txManager);
    modulesService = new ModulesService(txManager);
  });

  describe('1. Dynamic Entity Builder & Virtual ORM', () => {
    let createdEntityId: string;

    it('creates a dynamic entity definition and adds fields', async () => {
      const entity = await entitiesService.createEntity(TENANT_ID, {
        code: 'course_catalog',
        name: 'Course Catalog',
        description: 'Academic course offerings',
      });

      expect(entity.id).toBeDefined();
      expect(entity.code).toBe('course_catalog');
      createdEntityId = entity.id;

      const codeField = await entitiesService.addField(TENANT_ID, entity.id, {
        code: 'course_code',
        name: 'Course Code',
        fieldType: 'TEXT',
        isRequired: true,
        isUnique: true,
      });
      expect(codeField.id).toBeDefined();

      const titleField = await entitiesService.addField(TENANT_ID, entity.id, {
        code: 'title',
        name: 'Course Title',
        fieldType: 'TEXT',
        isRequired: true,
      });
      expect(titleField.id).toBeDefined();
    });

    it('enforces required field validations in Virtual ORM', async () => {
      await expect(
        entitiesService.createRecord(TENANT_ID, 'course_catalog', NODE_CAMPUS_ID, {
          title: 'Intro to Programming',
        })
      ).rejects.toThrow(/is required/i);
    });

    it('enforces unique constraint in Virtual ORM', async () => {
      await entitiesService.createRecord(TENANT_ID, 'course_catalog', NODE_CAMPUS_ID, {
        course_code: 'CS101',
        title: 'Intro to Computer Science',
      });

      await expect(
        entitiesService.createRecord(TENANT_ID, 'course_catalog', NODE_CAMPUS_ID, {
          course_code: 'CS101',
          title: 'Duplicate Computer Science',
        })
      ).rejects.toThrow(/unique constraint violation/i);
    });
  });

  describe('2. Form Builder & Declarative AST Versioning', () => {
    let formId: string;

    it('creates form with initial draft AST and publishes it', async () => {
      const entities = await entitiesService.listEntities(TENANT_ID);
      const entityId = entities[0]!.id;

      const { form, initialVersion } = await formsService.createForm(TENANT_ID, {
        entityId,
        code: 'course_form',
        name: 'Course Registration Form',
      });

      expect(form.id).toBeDefined();
      expect(initialVersion.status).toBe('DRAFT');
      expect(initialVersion.version).toBe(1);
      formId = form.id;

      // Publish the form
      const published = await formsService.publishVersion(TENANT_ID, formId, USER_ID);
      expect(published.status).toBe('PUBLISHED');
      expect(published.publishedBy).toBe(USER_ID);

      // Verify retrieving published form by code
      const retrieved = await formsService.getPublishedForm(TENANT_ID, 'course_form');
      expect(retrieved.form.code).toBe('course_form');
      expect(retrieved.version.status).toBe('PUBLISHED');
    });
  });

  describe('3. Workflow FSM Engine & Guard Evaluations', () => {
    let workflowId: string;
    let instanceId: string;

    it('creates a workflow FSM, configures transitions, and triggers state change', async () => {
      const entities = await entitiesService.listEntities(TENANT_ID);
      const entityId = entities[0]!.id;

      const workflow = await workflowsService.createWorkflow(TENANT_ID, {
        entityId,
        code: 'course_approval_wf',
        name: 'Course Approval Workflow',
        initialStateCode: 'SUBMITTED',
      });
      workflowId = workflow.id;

      // Add Under Review and Approved states
      await workflowsService.addState(TENANT_ID, workflowId, {
        code: 'UNDER_REVIEW',
        name: 'Under Review',
        stateType: 'INTERMEDIATE',
      });

      await workflowsService.addState(TENANT_ID, workflowId, {
        code: 'APPROVED',
        name: 'Approved Course',
        stateType: 'TERMINAL',
      });

      // Add Transitions
      await workflowsService.addTransition(TENANT_ID, workflowId, {
        fromStateCode: 'SUBMITTED',
        toStateCode: 'UNDER_REVIEW',
        actionName: 'Start Review',
      });

      await workflowsService.addTransition(TENANT_ID, workflowId, {
        fromStateCode: 'UNDER_REVIEW',
        toStateCode: 'APPROVED',
        actionName: 'Approve Course',
        requiredRoles: ['PRINCIPAL'],
      });

      // Create a record and start instance
      const records = await entitiesService.queryRecords(TENANT_ID, { entityCode: 'course_catalog' });
      const recordId = records[0]!.id;

      const instance = await workflowsService.startInstance(
        TENANT_ID,
        'course_approval_wf',
        recordId,
        NODE_CAMPUS_ID,
        USER_ID
      );
      expect(instance.currentStateCode).toBe('SUBMITTED');
      instanceId = instance.id;

      // Step 1: Transition SUBMITTED -> UNDER_REVIEW
      const step1 = await workflowsService.triggerTransition(
        TENANT_ID,
        instanceId,
        { actionName: 'Start Review', comments: 'Beginning academic evaluation' },
        MEMBERSHIP_ID,
        USER_ID
      );
      expect(step1.currentStateCode).toBe('UNDER_REVIEW');

      // Step 2: Transition UNDER_REVIEW -> APPROVED (user has PRINCIPAL role)
      const step2 = await workflowsService.triggerTransition(
        TENANT_ID,
        instanceId,
        { actionName: 'Approve Course', comments: 'Approved by Principal' },
        MEMBERSHIP_ID,
        USER_ID
      );
      expect(step2.currentStateCode).toBe('APPROVED');

      // Verify audit history trail
      const history = await workflowsService.getInstanceHistory(TENANT_ID, instanceId);
      expect(history.length).toBe(3); // STARTED, Start Review, Approve Course
      expect(history[0]?.actionTaken).toBe('Approve Course');
    });

    it('guarantees workflow version safety: active in-flight instances remain bound to their original version without corruption', async () => {
      const entities = await entitiesService.listEntities(TENANT_ID);
      const entityId = entities[0]!.id;

      // 1. Create Workflow V1 (Draft -> Auto-Approved direct flow)
      const wfV1 = await workflowsService.createWorkflow(TENANT_ID, {
        entityId,
        code: 'fee_waiver_v1',
        name: 'Fee Waiver V1',
        initialStateCode: 'SUBMITTED',
      });

      await workflowsService.addState(TENANT_ID, wfV1.id, {
        code: 'APPROVED',
        name: 'Approved',
        stateType: 'TERMINAL',
      });

      await workflowsService.addTransition(TENANT_ID, wfV1.id, {
        fromStateCode: 'SUBMITTED',
        toStateCode: 'APPROVED',
        actionName: 'Direct Approve',
        requiredRoles: ['PRINCIPAL'],
      });

      // Start Instance on V1
      const records = await entitiesService.queryRecords(TENANT_ID, { entityCode: 'course_catalog' });
      const instV1 = await workflowsService.startInstance(
        TENANT_ID,
        'fee_waiver_v1',
        records[0]!.id,
        NODE_CAMPUS_ID,
        USER_ID
      );
      expect(instV1.workflowId).toBe(wfV1.id);
      expect(instV1.currentStateCode).toBe('SUBMITTED');

      // 2. Organization introduces Workflow V2 with new required intermediate review state
      const wfV2 = await workflowsService.createWorkflow(TENANT_ID, {
        entityId,
        code: 'fee_waiver_v2',
        name: 'Fee Waiver V2',
        initialStateCode: 'SUBMITTED',
      });

      await workflowsService.addState(TENANT_ID, wfV2.id, {
        code: 'DEAN_REVIEW',
        name: 'Dean Review',
        stateType: 'INTERMEDIATE',
      });

      await workflowsService.addState(TENANT_ID, wfV2.id, {
        code: 'APPROVED',
        name: 'Approved',
        stateType: 'TERMINAL',
      });

      await workflowsService.addTransition(TENANT_ID, wfV2.id, {
        fromStateCode: 'SUBMITTED',
        toStateCode: 'DEAN_REVIEW',
        actionName: 'Escalate to Dean',
      });

      await workflowsService.addTransition(TENANT_ID, wfV2.id, {
        fromStateCode: 'DEAN_REVIEW',
        toStateCode: 'APPROVED',
        actionName: 'Dean Approve',
        requiredRoles: ['PRINCIPAL'],
      });

      // 3. Verify V1 instance executes V1 transition without being affected by V2
      const completedV1 = await workflowsService.triggerTransition(
        TENANT_ID,
        instV1.id,
        { actionName: 'Direct Approve' },
        MEMBERSHIP_ID,
        USER_ID
      );
      expect(completedV1.currentStateCode).toBe('APPROVED');

      // 4. Start new Instance on V2 and verify it follows V2 pipeline
      const instV2 = await workflowsService.startInstance(
        TENANT_ID,
        'fee_waiver_v2',
        records[0]!.id,
        NODE_CAMPUS_ID,
        USER_ID
      );
      expect(instV2.workflowId).toBe(wfV2.id);

      const step1V2 = await workflowsService.triggerTransition(
        TENANT_ID,
        instV2.id,
        { actionName: 'Escalate to Dean' },
        MEMBERSHIP_ID,
        USER_ID
      );
      expect(step1V2.currentStateCode).toBe('DEAN_REVIEW');
    });
  });

  describe('4. Dynamic Navigation & Permission Tree', () => {
    it('creates menu items and filters active tree based on permissions', async () => {
      const menu = await navigationService.createMenu(TENANT_ID, {
        code: 'main_sidebar',
        name: 'Main Sidebar',
      });

      await navigationService.addItem(TENANT_ID, menu.id, {
        label: 'Dashboard',
        routePath: '/dashboard',
        sortOrder: 1,
      });

      await navigationService.addItem(TENANT_ID, menu.id, {
        label: 'Financial Invoices',
        routePath: '/finance/invoices',
        requiredPermissions: ['finance:invoice:read'],
        sortOrder: 2,
      });

      // Without permission: only public items returned
      const treeUnpermitted = await navigationService.getActiveTree(TENANT_ID, 'main_sidebar', []);
      expect(treeUnpermitted.length).toBe(1);
      expect(treeUnpermitted[0]?.label).toBe('Dashboard');

      // With permission: both items returned
      const treePermitted = await navigationService.getActiveTree(TENANT_ID, 'main_sidebar', ['finance:invoice:read']);
      expect(treePermitted.length).toBe(2);
    });
  });

  describe('5. Pluggable Module Architecture', () => {
    it('lists modules and enforces prerequisite dependencies on activation', async () => {
      const modules = await modulesService.listModules(TENANT_ID);
      expect(modules.length).toBeGreaterThanOrEqual(3);

      // fee_billing requires academic_core
      await expect(
        modulesService.toggleModule(TENANT_ID, {
          moduleCode: 'fee_billing',
          isEnabled: true,
        })
      ).rejects.toThrow(/prerequisite module/i);

      // Enable academic_core first
      const academic = await modulesService.toggleModule(TENANT_ID, {
        moduleCode: 'academic_core',
        isEnabled: true,
      });
      expect(academic.isEnabled).toBe(true);

      // Now enable fee_billing successfully
      const feeBilling = await modulesService.toggleModule(TENANT_ID, {
        moduleCode: 'fee_billing',
        isEnabled: true,
      });
      expect(feeBilling.isEnabled).toBe(true);
    });
  });
});
