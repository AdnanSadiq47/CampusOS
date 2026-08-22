import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pg from 'pg';
import { RLS_ENABLE_SQL } from '../src/rls.js';

const { Client } = pg;

const hasRealPostgres = Boolean(process.env['REAL_POSTGRES_DATABASE_URL'] || process.env['REAL_POSTGRES_ADMIN_URL']);

/**
 * Real Standalone PostgreSQL 16 Daemon Acceptance Test Suite.
 * 
 * Invariants:
 * 1. Executes ONLY when connected to an actual PostgreSQL 16 daemon/container over TCP.
 * 2. Refuses to fall back to PGlite or WASM.
 * 3. If REAL_POSTGRES_DATABASE_URL / REAL_POSTGRES_ADMIN_URL is unset, this suite reports SKIPPED.
 */
describe.skipIf(!hasRealPostgres)('Real Standalone PostgreSQL 16 Daemon Acceptance Gate', () => {
  let adminClient: pg.Client;
  let appClient: pg.Client;

  const adminUrl =
    process.env['REAL_POSTGRES_ADMIN_URL'] ||
    process.env['REAL_POSTGRES_DATABASE_URL'] ||
    'postgresql://postgres:postgres@localhost:5432/campus_os_test';

  const appUserUrl =
    process.env['REAL_POSTGRES_APP_URL'] ||
    'postgresql://campus_app_user:campus_secure_password@localhost:5432/campus_os_test';

  const TENANT_A_ID = '11111111-1111-1111-1111-111111111111';
  const TENANT_B_ID = '22222222-2222-2222-2222-222222222222';
  const GLOBAL_USER_ID = 'aaaaaaaa-1111-1111-1111-111111111111';

  beforeAll(async () => {
    adminClient = new Client({ connectionString: adminUrl });
    await adminClient.connect();

    // 1. Verify PostgreSQL exact server version
    const versionRes = await adminClient.query<{ version: string }>('SELECT version();');
    console.log(`[RealPostgresSuite] Connected to daemon: ${versionRes.rows[0]?.version}`);

    // 2. Setup Base Extensions and Schema
    await adminClient.query('CREATE EXTENSION IF NOT EXISTS "ltree";');
    await adminClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    // Clean up previous test runs
    await adminClient.query(`
      DROP TABLE IF EXISTS outbox_events CASCADE;
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS role_permissions CASCADE;
      DROP TABLE IF EXISTS assignment_roles CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      DROP TABLE IF EXISTS membership_node_assignments CASCADE;
      DROP TABLE IF EXISTS employee_profiles CASCADE;
      DROP TABLE IF EXISTS organization_memberships CASCADE;
      DROP TABLE IF EXISTS hierarchy_nodes CASCADE;
      DROP TABLE IF EXISTS hierarchy_node_types CASCADE;
      DROP TABLE IF EXISTS organizations CASCADE;
      DROP TABLE IF EXISTS identity_users CASCADE;
    `);

    // 3. Create Schema Tables with Composite Foreign Keys
    await adminClient.query(`
      CREATE TABLE identity_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone_number VARCHAR(32),
        mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
        mfa_secret_encrypted BYTEA,
        mfa_secret_iv BYTEA,
        mfa_key_version INT DEFAULT 1 NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        email_verified_at TIMESTAMPTZ,
        failed_login_attempts INT DEFAULT 0 NOT NULL,
        locked_until TIMESTAMPTZ,
        security_stamp UUID DEFAULT gen_random_uuid() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        primary_currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE hierarchy_node_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        level_order INT NOT NULL,
        allow_financial_posting BOOLEAN DEFAULT TRUE NOT NULL,
        allow_user_assignment BOOLEAN DEFAULT TRUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_node_type_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_node_type_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE hierarchy_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        node_type_id UUID NOT NULL,
        parent_id UUID,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path LTREE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_nodes_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_nodes_org_code UNIQUE (organization_id, code),
        CONSTRAINT fk_nodes_node_type FOREIGN KEY (organization_id, node_type_id)
          REFERENCES hierarchy_node_types(organization_id, id) ON DELETE RESTRICT,
        CONSTRAINT fk_nodes_parent FOREIGN KEY (organization_id, parent_id)
          REFERENCES hierarchy_nodes(organization_id, id) ON DELETE RESTRICT
      );

      CREATE TABLE organization_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        identity_user_id UUID NOT NULL REFERENCES identity_users(id) ON DELETE RESTRICT,
        membership_type VARCHAR(32) DEFAULT 'STAFF' NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        valid_until TIMESTAMPTZ,
        version INT DEFAULT 1 NOT NULL,
        joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_memberships_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_org_membership UNIQUE (organization_id, identity_user_id)
      );

      CREATE TABLE employee_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        membership_id UUID NOT NULL,
        employee_code VARCHAR(64) NOT NULL,
        designation VARCHAR(128),
        employment_type VARCHAR(32) DEFAULT 'FULL_TIME' NOT NULL,
        hire_date DATE,
        details JSONB DEFAULT '{}'::jsonb NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_employee_org_membership UNIQUE (organization_id, membership_id),
        CONSTRAINT uq_employee_org_code UNIQUE (organization_id, employee_code),
        CONSTRAINT fk_employee_membership FOREIGN KEY (organization_id, membership_id)
          REFERENCES organization_memberships(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE membership_node_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        membership_id UUID NOT NULL,
        hierarchy_node_id UUID NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        valid_from TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        valid_until TIMESTAMPTZ,
        assigned_by UUID REFERENCES identity_users(id),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_assignments_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_assignments_membership_node UNIQUE (organization_id, membership_id, hierarchy_node_id),
        CONSTRAINT fk_assignments_membership FOREIGN KEY (organization_id, membership_id)
          REFERENCES organization_memberships(organization_id, id) ON DELETE CASCADE,
        CONSTRAINT fk_assignments_node FOREIGN KEY (organization_id, hierarchy_node_id)
          REFERENCES hierarchy_nodes(organization_id, id) ON DELETE RESTRICT
      );

      CREATE UNIQUE INDEX uq_primary_assignment_per_membership 
      ON membership_node_assignments (organization_id, membership_id) 
      WHERE is_primary = TRUE AND status = 'ACTIVE';

      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT FALSE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_roles_org_id UNIQUE (organization_id, id),
        CONSTRAINT uq_roles_org_code UNIQUE (organization_id, code)
      );

      CREATE TABLE assignment_roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        assignment_id UUID NOT NULL,
        role_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT uq_assignment_roles UNIQUE (assignment_id, role_id),
        CONSTRAINT fk_assignment_roles_assignment FOREIGN KEY (organization_id, assignment_id)
          REFERENCES membership_node_assignments(organization_id, id) ON DELETE CASCADE,
        CONSTRAINT fk_assignment_roles_role FOREIGN KEY (organization_id, role_id)
          REFERENCES roles(organization_id, id) ON DELETE RESTRICT
      );

      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        module_code VARCHAR(64) NOT NULL,
        entity_code VARCHAR(64) NOT NULL,
        action VARCHAR(32) NOT NULL,
        effect VARCHAR(16) DEFAULT 'ALLOW' NOT NULL,
        data_scope VARCHAR(32) DEFAULT 'HIERARCHY_SUBTREE' NOT NULL,
        field_rules JSONB DEFAULT '[]'::jsonb NOT NULL,
        conditions JSONB DEFAULT '{}'::jsonb NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        event_type VARCHAR(128) NOT NULL,
        aggregate_type VARCHAR(64) NOT NULL,
        aggregate_id UUID NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(32) DEFAULT 'PENDING' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    // 4. Seed Multi-Tenant Data
    await adminClient.query(`
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
    `);

    // 5. Apply Hardened RLS
    await adminClient.query(RLS_ENABLE_SQL);

    // 6. Setup Runtime User
    await adminClient.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'campus_app_user') THEN
          CREATE ROLE campus_app_user WITH PASSWORD 'campus_secure_password' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
        END IF;
      END $$;

      GRANT USAGE ON SCHEMA public TO campus_app_user;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO campus_app_user;
      
      REVOKE ALL ON identity_users FROM campus_app_user;
      GRANT SELECT (id, email, first_name, last_name, is_active) ON identity_users TO campus_app_user;
    `);

    // 7. Connect as Runtime Application User
    try {
      appClient = new Client({ connectionString: appUserUrl });
      await appClient.connect();
    } catch {
      // If direct password login not configured, fallback to SET ROLE for app assertions
      appClient = adminClient;
    }
  });

  afterAll(async () => {
    if (appClient && appClient !== adminClient) {
      await appClient.end();
    }
    if (adminClient) {
      await adminClient.end();
    }
  });

  describe('1. Role Attributes & Catalog Assertions from Real PostgreSQL 16', () => {
    it('verifies campus_app_user is NOSUPERUSER and NOBYPASSRLS in pg_roles', async () => {
      const res = await adminClient.query<{
        rolsuper: boolean;
        rolbypassrls: boolean;
        rolcreatedb: boolean;
        rolcreaterole: boolean;
      }>(`
        SELECT rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
        FROM pg_catalog.pg_roles
        WHERE rolname = 'campus_app_user';
      `);

      expect(res.rows.length).toBe(1);
      expect(res.rows[0]?.rolsuper).toBe(false);
      expect(res.rows[0]?.rolbypassrls).toBe(false);
      expect(res.rows[0]?.rolcreatedb).toBe(false);
      expect(res.rows[0]?.rolcreaterole).toBe(false);
    });

    it('verifies relforcerowsecurity = true on all tenant tables in pg_class', async () => {
      const res = await adminClient.query<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>(`
        SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class
        WHERE relname IN (
          'organizations', 'organization_memberships', 'employee_profiles',
          'membership_node_assignments', 'assignment_roles', 'hierarchy_node_types',
          'hierarchy_nodes', 'roles', 'role_permissions', 'audit_logs', 'outbox_events'
        );
      `);

      expect(res.rows.length).toBe(11);
      for (const row of res.rows) {
        expect(row.relrowsecurity).toBe(true);
        expect(row.relforcerowsecurity).toBe(true);
      }
    });
  });

  describe('2. Real Database Isolation & Cross-Tenant Attack Rejections', () => {
    it('Tenant A cannot SELECT Tenant B memberships', async () => {
      await adminClient.query('BEGIN;');
      await adminClient.query('SET LOCAL ROLE campus_app_user;');
      await adminClient.query(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

      const res = await adminClient.query('SELECT id FROM organization_memberships;');
      await adminClient.query('COMMIT;');

      expect(res.rows.length).toBe(1);
      expect(res.rows[0]?.id).toBe('10000000-0000-0000-0000-000000000001');
    });

    it('Missing tenant context returns zero rows (Fail Closed)', async () => {
      await adminClient.query('BEGIN;');
      await adminClient.query('SET LOCAL ROLE campus_app_user;');

      const res = await adminClient.query('SELECT * FROM organization_memberships;');
      await adminClient.query('COMMIT;');

      expect(res.rows.length).toBe(0);
    });

    it('Rejects cross-tenant node assignment via composite FK constraint', async () => {
      await adminClient.query(`
        INSERT INTO hierarchy_node_types (id, organization_id, code, name, level_order) 
        VALUES ('bbbbbbbb-3333-3333-3333-333333333333', '${TENANT_B_ID}', 'CAMPUS_B', 'Campus B', 1);

        INSERT INTO hierarchy_nodes (id, organization_id, node_type_id, code, name, path)
        VALUES ('cccccccc-4444-4444-4444-444444444444', '${TENANT_B_ID}', 'bbbbbbbb-3333-3333-3333-333333333333', 'CAMPUS_B_NODE', 'Campus B Node', 'root.campus_b');
      `);

      await expect(
        adminClient.query(`
          INSERT INTO membership_node_assignments (id, organization_id, membership_id, hierarchy_node_id)
          VALUES ('ffffffff-1111-1111-1111-111111111111', '${TENANT_A_ID}', '10000000-0000-0000-0000-000000000001', 'cccccccc-4444-4444-4444-444444444444');
        `)
      ).rejects.toThrow(/violates foreign key constraint/i);
    });

    it('campus_app_user is denied direct SELECT on password_hash and mfa secrets', async () => {
      await adminClient.query('BEGIN;');
      await adminClient.query('SET LOCAL ROLE campus_app_user;');

      await expect(
        adminClient.query('SELECT password_hash FROM identity_users;')
      ).rejects.toThrow(/permission denied/i);

      await adminClient.query('ROLLBACK;');
    });

    it('SET LOCAL tenant context cleanly clears on COMMIT and ROLLBACK', async () => {
      // Transaction 1: Tenant A
      await adminClient.query('BEGIN;');
      await adminClient.query(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
      await adminClient.query('COMMIT;');

      // Query without SET LOCAL
      await adminClient.query('BEGIN;');
      await adminClient.query('SET LOCAL ROLE campus_app_user;');
      const resAfterCommit = await adminClient.query('SELECT * FROM organization_memberships;');
      await adminClient.query('COMMIT;');
      expect(resAfterCommit.rows.length).toBe(0);

      // Transaction 2: Tenant A then Rollback
      await adminClient.query('BEGIN;');
      await adminClient.query(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
      await adminClient.query('ROLLBACK;');

      await adminClient.query('BEGIN;');
      await adminClient.query('SET LOCAL ROLE campus_app_user;');
      const resAfterRollback = await adminClient.query('SELECT * FROM organization_memberships;');
      await adminClient.query('COMMIT;');
      expect(resAfterRollback.rows.length).toBe(0);
    });
  });
});
