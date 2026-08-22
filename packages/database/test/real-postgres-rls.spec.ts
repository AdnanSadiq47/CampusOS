import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { RLS_ENABLE_SQL } from '../src/rls.js';

describe('PostgreSQL-Compatible Row-Level Security (RLS) Database Verification', () => {
  let pg: PGlite;

  const TENANT_A_ID = '11111111-1111-1111-1111-111111111111';
  const TENANT_B_ID = '22222222-2222-2222-2222-222222222222';
  const GLOBAL_USER_ID = 'aaaaaaaa-1111-1111-1111-111111111111';

  beforeAll(async () => {
    pg = new PGlite();

    // 1. Setup Base Tables with Composite Keys & Invariants
    await pg.exec(`
      CREATE TABLE identity_users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
        mfa_secret_encrypted BYTEA,
        mfa_secret_iv BYTEA,
        mfa_key_version INT DEFAULT 1 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        failed_login_attempts INT DEFAULT 0 NOT NULL,
        security_stamp UUID DEFAULT gen_random_uuid() NOT NULL,
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
        CONSTRAINT uq_nodes_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_nodes_node_type FOREIGN KEY (organization_id, node_type_id)
          REFERENCES hierarchy_node_types(organization_id, id) ON DELETE RESTRICT
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
        CONSTRAINT uq_memberships_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_org_membership UNIQUE (organization_id, identity_user_id)
      );

      CREATE TABLE employee_profiles (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        membership_id UUID NOT NULL,
        employee_code VARCHAR(64) NOT NULL,
        designation VARCHAR(128),
        employment_type VARCHAR(32) DEFAULT 'FULL_TIME' NOT NULL,
        hire_date DATE,
        details JSONB DEFAULT '{}'::jsonb NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        CONSTRAINT uq_employee_org_membership UNIQUE (organization_id, membership_id),
        CONSTRAINT fk_employee_membership FOREIGN KEY (organization_id, membership_id)
          REFERENCES organization_memberships(organization_id, id) ON DELETE CASCADE
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
        CONSTRAINT uq_assignments_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_assignments_membership_node UNIQUE (organization_id, membership_id, hierarchy_node_id),
        CONSTRAINT fk_assignments_membership FOREIGN KEY (organization_id, membership_id)
          REFERENCES organization_memberships(organization_id, id) ON DELETE CASCADE,
        CONSTRAINT fk_assignments_node FOREIGN KEY (organization_id, hierarchy_node_id)
          REFERENCES hierarchy_nodes(organization_id, id) ON DELETE RESTRICT
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
        CONSTRAINT uq_assignment_roles UNIQUE (assignment_id, role_id),
        CONSTRAINT fk_assignment_roles_assignment FOREIGN KEY (organization_id, assignment_id)
          REFERENCES membership_node_assignments(organization_id, id) ON DELETE CASCADE,
        CONSTRAINT fk_assignment_roles_role FOREIGN KEY (organization_id, role_id)
          REFERENCES roles(organization_id, id) ON DELETE RESTRICT
      );

      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        module_code VARCHAR(64) NOT NULL,
        entity_code VARCHAR(64) NOT NULL,
        action VARCHAR(32) NOT NULL,
        effect VARCHAR(16) DEFAULT 'ALLOW' NOT NULL,
        data_scope VARCHAR(32) DEFAULT 'HIERARCHY_SUBTREE' NOT NULL,
        field_rules JSONB DEFAULT '[]'::jsonb NOT NULL,
        conditions JSONB DEFAULT '{}'::jsonb NOT NULL
      );

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL,
        actor_id UUID,
        actor_email VARCHAR(255),
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(32) NOT NULL,
        before_state JSONB,
        after_state JSONB,
        diff JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE outbox_events (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL,
        event_type VARCHAR(128) NOT NULL,
        aggregate_type VARCHAR(64) NOT NULL,
        aggregate_id UUID NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(32) DEFAULT 'PENDING' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      -- Phase 2 Tables
      CREATE TABLE entity_definitions (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_entity_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE entity_fields (
        id UUID PRIMARY KEY,
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
        CONSTRAINT fk_entity_fields_entity FOREIGN KEY (organization_id, entity_id)
          REFERENCES entity_definitions(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE entity_records (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_id UUID NOT NULL,
        hierarchy_node_id UUID NOT NULL,
        data JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_by UUID REFERENCES identity_users(id),
        updated_by UUID REFERENCES identity_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_entity_record_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_entity_records_entity FOREIGN KEY (organization_id, entity_id)
          REFERENCES entity_definitions(organization_id, id) ON DELETE CASCADE,
        CONSTRAINT fk_entity_records_node FOREIGN KEY (organization_id, hierarchy_node_id)
          REFERENCES hierarchy_nodes(organization_id, id) ON DELETE RESTRICT
      );

      CREATE TABLE form_definitions (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        entity_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_form_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_form_entity FOREIGN KEY (organization_id, entity_id)
          REFERENCES entity_definitions(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE form_versions (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        form_id UUID NOT NULL,
        version INT NOT NULL,
        status VARCHAR(32) DEFAULT 'DRAFT' NOT NULL,
        schema_ast JSONB NOT NULL,
        rules JSONB DEFAULT '[]'::jsonb NOT NULL,
        published_at TIMESTAMPTZ,
        published_by UUID REFERENCES identity_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_form_version_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_form_versions_form FOREIGN KEY (organization_id, form_id)
          REFERENCES form_definitions(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE workflow_definitions (
        id UUID PRIMARY KEY,
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
        CONSTRAINT fk_workflow_entity FOREIGN KEY (organization_id, entity_id)
          REFERENCES entity_definitions(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE workflow_states (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        state_type VARCHAR(32) DEFAULT 'INTERMEDIATE' NOT NULL,
        color VARCHAR(32) DEFAULT 'gray' NOT NULL,
        sort_order INT DEFAULT 0 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_state_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_workflow_states_workflow FOREIGN KEY (organization_id, workflow_id)
          REFERENCES workflow_definitions(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE workflow_transitions (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID NOT NULL,
        from_state_code VARCHAR(64) NOT NULL,
        to_state_code VARCHAR(64) NOT NULL,
        action_name VARCHAR(128) NOT NULL,
        guard_rule JSONB DEFAULT '{}'::jsonb NOT NULL,
        required_roles JSONB DEFAULT '[]'::jsonb NOT NULL,
        actions JSONB DEFAULT '[]'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_transition_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_workflow_transitions_workflow FOREIGN KEY (organization_id, workflow_id)
          REFERENCES workflow_definitions(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE workflow_instances (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        workflow_id UUID NOT NULL,
        record_id UUID NOT NULL,
        current_state_code VARCHAR(64) NOT NULL,
        assigned_node_id UUID NOT NULL,
        started_by UUID REFERENCES identity_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_instance_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_workflow_instances_workflow FOREIGN KEY (organization_id, workflow_id)
          REFERENCES workflow_definitions(organization_id, id) ON DELETE CASCADE,
        CONSTRAINT fk_workflow_instances_record FOREIGN KEY (organization_id, record_id)
          REFERENCES entity_records(organization_id, id) ON DELETE CASCADE,
        CONSTRAINT fk_workflow_instances_node FOREIGN KEY (organization_id, assigned_node_id)
          REFERENCES hierarchy_nodes(organization_id, id) ON DELETE RESTRICT
      );

      CREATE TABLE workflow_history (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        instance_id UUID NOT NULL,
        from_state_code VARCHAR(64) NOT NULL,
        to_state_code VARCHAR(64) NOT NULL,
        action_taken VARCHAR(128) NOT NULL,
        performed_by UUID REFERENCES identity_users(id),
        comments TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_workflow_history_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_workflow_history_instance FOREIGN KEY (organization_id, instance_id)
          REFERENCES workflow_instances(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE navigation_menus (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_nav_menu_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE navigation_items (
        id UUID PRIMARY KEY,
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
        CONSTRAINT uq_nav_item_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_nav_items_menu FOREIGN KEY (organization_id, menu_id)
          REFERENCES navigation_menus(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE organization_modules (
        id UUID PRIMARY KEY,
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

    // 2. Apply Hardened RLS Across All Tables
    await pg.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'campus_app_user') THEN
          CREATE ROLE campus_app_user WITH NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
        END IF;
      END $$;

      GRANT USAGE ON SCHEMA public TO campus_app_user;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO campus_app_user;
      REVOKE ALL ON identity_users FROM campus_app_user;
      GRANT SELECT (id, email, first_name, last_name, is_active) ON identity_users TO campus_app_user;
    `);

    await pg.exec(RLS_ENABLE_SQL);

    // 3. Seed Seed Multi-Tenant Data
    await pg.exec(`
      INSERT INTO identity_users (id, email, password_hash, first_name, last_name) VALUES
        ('${GLOBAL_USER_ID}', 'ali@global.com', 'argon2_hash', 'Ali', 'Global');

      INSERT INTO organizations (id, code, name) VALUES
        ('${TENANT_A_ID}', 'tenant_a', 'Tenant Alpha Academy'),
        ('${TENANT_B_ID}', 'tenant_b', 'Tenant Beta Institute');

      INSERT INTO organization_memberships (id, organization_id, identity_user_id, membership_type, status) VALUES
        ('10000000-0000-0000-0000-000000000001', '${TENANT_A_ID}', '${GLOBAL_USER_ID}', 'STAFF', 'ACTIVE'),
        ('20000000-0000-0000-0000-000000000002', '${TENANT_B_ID}', '${GLOBAL_USER_ID}', 'PARENT', 'ACTIVE');

      INSERT INTO hierarchy_node_types (id, organization_id, code, name, level_order) VALUES
        ('bbbbbbbb-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'HO', 'Head Office', 1),
        ('bbbbbbbb-2222-2222-2222-222222222222', '${TENANT_A_ID}', 'CAMPUS', 'Campus', 2);

      INSERT INTO hierarchy_nodes (id, organization_id, node_type_id, code, name, path) VALUES
        ('cccccccc-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'bbbbbbbb-1111-1111-1111-111111111111', 'HO', 'Head Office', 'root.ho'),
        ('cccccccc-2222-2222-2222-222222222222', '${TENANT_A_ID}', 'bbbbbbbb-2222-2222-2222-222222222222', 'CAMPUS_A', 'Campus Alpha', 'root.region_south.campus_a');

      INSERT INTO roles (id, organization_id, code, name) VALUES
        ('dddddddd-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'ACCOUNTANT', 'Accountant');

      INSERT INTO membership_node_assignments (id, organization_id, membership_id, hierarchy_node_id, is_primary, status) VALUES
        ('eeeeeeee-1111-1111-1111-111111111111', '${TENANT_A_ID}', '10000000-0000-0000-0000-000000000001', 'cccccccc-2222-2222-2222-222222222222', true, 'ACTIVE');

      INSERT INTO assignment_roles (id, organization_id, assignment_id, role_id) VALUES
        ('11111111-aaaa-1111-1111-111111111111', '${TENANT_A_ID}', 'eeeeeeee-1111-1111-1111-111111111111', 'dddddddd-1111-1111-1111-111111111111');

      -- Seed Phase 2 Dynamic Entity
      INSERT INTO entity_definitions (id, organization_id, code, name, is_system, is_active) VALUES
        ('33333333-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'course', 'Course Catalog', false, true);

      INSERT INTO entity_records (id, organization_id, entity_id, hierarchy_node_id, data) VALUES
        ('44444444-1111-1111-1111-111111111111', '${TENANT_A_ID}', '33333333-1111-1111-1111-111111111111', 'cccccccc-2222-2222-2222-222222222222', '{"code": "CS101", "name": "Computer Science"}');
    `);
  });

  it('Tenant A can SELECT Tenant A organization memberships and entity records', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
    const res = await pg.query('SELECT * FROM organization_memberships;');
    const recordsRes = await pg.query('SELECT * FROM entity_records;');
    await pg.exec('COMMIT;');

    expect(res.rows.length).toBe(1);
    expect(res.rows[0]?.['organization_id']).toBe(TENANT_A_ID);
    expect(recordsRes.rows.length).toBe(1);
    expect(recordsRes.rows[0]?.['organization_id']).toBe(TENANT_A_ID);
  });

  it('Tenant A CANNOT SELECT Tenant B records', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
    const res = await pg.query(`SELECT * FROM organization_memberships WHERE organization_id = '${TENANT_B_ID}';`);
    await pg.exec('COMMIT;');
    expect(res.rows.length).toBe(0);
  });

  it('Tenant B CANNOT SELECT Tenant A records', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_B_ID}';`);
    const res = await pg.query('SELECT * FROM organization_memberships;');
    await pg.exec('COMMIT;');
    expect(res.rows.length).toBe(1);
    expect(res.rows[0]?.['organization_id']).toBe(TENANT_B_ID);
  });

  it('Missing tenant context FAILS CLOSED and returns zero rows', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`RESET app.current_tenant_id;`);
    const res = await pg.query('SELECT * FROM organization_memberships;');
    await pg.exec('COMMIT;');
    expect(res.rows.length).toBe(0);
  });

  it('Tenant A CANNOT UPDATE Tenant B records (affects 0 rows)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
    const res = await pg.query(`
      UPDATE organization_memberships 
      SET status = 'SUSPENDED' 
      WHERE organization_id = '${TENANT_B_ID}';
    `);
    await pg.exec('COMMIT;');
    expect(res.affectedRows).toBe(0);
  });

  it('Tenant A CANNOT DELETE Tenant B records (affects 0 rows)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
    const res = await pg.query(`
      DELETE FROM organization_memberships 
      WHERE organization_id = '${TENANT_B_ID}';
    `);
    await pg.exec('COMMIT;');
    expect(res.affectedRows).toBe(0);
  });

  it('Tenant A CANNOT INSERT a record pretending to belong to Tenant B (WITH CHECK violation)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
    await expect(
      pg.exec(`
        INSERT INTO organization_memberships (id, organization_id, identity_user_id, membership_type)
        VALUES ('30000000-0000-0000-0000-000000000003', '${TENANT_B_ID}', '${GLOBAL_USER_ID}', 'STUDENT');
      `)
    ).rejects.toThrow(/violates row-level security policy/i);
    await pg.exec('ROLLBACK;');
  });

  it('Rejects cross-tenant node assignment via composite foreign key', async () => {
    await pg.exec(`
      INSERT INTO hierarchy_node_types (id, organization_id, code, name, level_order) 
      VALUES ('bbbbbbbb-3333-3333-3333-333333333333', '${TENANT_B_ID}', 'CAMPUS_B', 'Campus B', 1);

      INSERT INTO hierarchy_nodes (id, organization_id, node_type_id, code, name, path)
      VALUES ('cccccccc-4444-4444-4444-444444444444', '${TENANT_B_ID}', 'bbbbbbbb-3333-3333-3333-333333333333', 'CAMPUS_B_NODE', 'Campus B Node', 'root.campus_b');
    `);

    await pg.exec(`SET app.current_tenant_id = '${TENANT_A_ID}';`);

    await expect(
      pg.exec(`
        INSERT INTO membership_node_assignments (id, organization_id, membership_id, hierarchy_node_id)
        VALUES ('ffffffff-1111-1111-1111-111111111111', '${TENANT_A_ID}', '10000000-0000-0000-0000-000000000001', 'cccccccc-4444-4444-4444-444444444444');
      `)
    ).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('Rejects cross-tenant role grant via composite foreign key', async () => {
    await pg.exec(`
      INSERT INTO roles (id, organization_id, code, name)
      VALUES ('dddddddd-2222-2222-2222-222222222222', '${TENANT_B_ID}', 'TEACHER_B', 'Teacher B');
    `);

    await pg.exec(`SET app.current_tenant_id = '${TENANT_A_ID}';`);

    await expect(
      pg.exec(`
        INSERT INTO assignment_roles (id, organization_id, assignment_id, role_id)
        VALUES ('22222222-aaaa-1111-1111-111111111111', '${TENANT_A_ID}', 'eeeeeeee-1111-1111-1111-111111111111', 'dddddddd-2222-2222-2222-222222222222');
      `)
    ).rejects.toThrow(/violates foreign key constraint/i);
  });
});
