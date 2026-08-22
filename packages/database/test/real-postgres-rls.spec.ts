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
        CONSTRAINT fk_emp_membership FOREIGN KEY (organization_id, membership_id)
          REFERENCES organization_memberships(organization_id, id) ON DELETE CASCADE
      );

      CREATE TABLE membership_node_assignments (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        membership_id UUID NOT NULL,
        hierarchy_node_id UUID NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE NOT NULL,
        status VARCHAR(32) DEFAULT 'ACTIVE' NOT NULL,
        CONSTRAINT uq_assignments_org_id UNIQUE (organization_id, id),
        CONSTRAINT fk_assignments_membership FOREIGN KEY (organization_id, membership_id)
          REFERENCES organization_memberships(organization_id, id) ON DELETE CASCADE,
        CONSTRAINT fk_assignments_node FOREIGN KEY (organization_id, hierarchy_node_id)
          REFERENCES hierarchy_nodes(organization_id, id) ON DELETE RESTRICT
      );

      CREATE UNIQUE INDEX uq_primary_assignment_per_membership 
      ON membership_node_assignments (organization_id, membership_id) 
      WHERE is_primary = TRUE AND status = 'ACTIVE';

      CREATE TABLE roles (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        CONSTRAINT uq_roles_org_id UNIQUE (organization_id, id)
      );

      CREATE TABLE assignment_roles (
        id UUID PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        assignment_id UUID NOT NULL,
        role_id UUID NOT NULL,
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
        data_scope VARCHAR(32) DEFAULT 'HIERARCHY_SUBTREE' NOT NULL
      );

      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(32) NOT NULL
      );

      CREATE TABLE outbox_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        event_type VARCHAR(128) NOT NULL,
        aggregate_type VARCHAR(64) NOT NULL,
        aggregate_id UUID NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(32) DEFAULT 'PENDING' NOT NULL
      );
    `);

    // 2. Insert Seed Fixtures: One Global Identity with Memberships in BOTH Org A and Org B
    await pg.exec(`
      INSERT INTO identity_users (id, email, password_hash, first_name, last_name) VALUES
        ('${GLOBAL_USER_ID}', 'ali@global.com', 'argon2_hash', 'Ali', 'Global');

      INSERT INTO organizations (id, code, name) VALUES
        ('${TENANT_A_ID}', 'tenant_a', 'Tenant Alpha Academy'),
        ('${TENANT_B_ID}', 'tenant_b', 'Tenant Beta Institute');

      -- Organization Memberships (One per Org for Ali)
      INSERT INTO organization_memberships (id, organization_id, identity_user_id, membership_type, status) VALUES
        ('10000000-0000-0000-0000-000000000001', '${TENANT_A_ID}', '${GLOBAL_USER_ID}', 'STAFF', 'ACTIVE'),
        ('20000000-0000-0000-0000-000000000002', '${TENANT_B_ID}', '${GLOBAL_USER_ID}', 'PARENT', 'ACTIVE');

      -- Hierarchy Types & Nodes for Tenant A (Head Office, Region, Campus A, Campus B)
      INSERT INTO hierarchy_node_types (id, organization_id, code, name, level_order) VALUES
        ('bbbbbbbb-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'HO', 'Head Office', 1),
        ('bbbbbbbb-2222-2222-2222-222222222222', '${TENANT_A_ID}', 'CAMPUS', 'Campus', 2);

      INSERT INTO hierarchy_nodes (id, organization_id, node_type_id, code, name, path) VALUES
        ('cccccccc-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'bbbbbbbb-1111-1111-1111-111111111111', 'HO', 'Head Office', 'root.ho'),
        ('cccccccc-2222-2222-2222-222222222222', '${TENANT_A_ID}', 'bbbbbbbb-2222-2222-2222-222222222222', 'CAMPUS_A', 'Campus Alpha', 'root.region_south.campus_a'),
        ('cccccccc-3333-3333-3333-333333333333', '${TENANT_A_ID}', 'bbbbbbbb-2222-2222-2222-222222222222', 'CAMPUS_B', 'Campus Beta', 'root.region_south.campus_b');

      -- Roles for Tenant A
      INSERT INTO roles (id, organization_id, code, name) VALUES
        ('dddddddd-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'FINANCE_OFFICER', 'Finance Officer'),
        ('dddddddd-2222-2222-2222-222222222222', '${TENANT_A_ID}', 'ACCOUNTANT', 'Accountant');

      -- Multi-Node Assignments for Ali in Tenant A: Assigned to Head Office AND Campus A
      INSERT INTO membership_node_assignments (id, organization_id, membership_id, hierarchy_node_id, is_primary, status) VALUES
        ('eeeeeeee-1111-1111-1111-111111111111', '${TENANT_A_ID}', '10000000-0000-0000-0000-000000000001', 'cccccccc-1111-1111-1111-111111111111', false, 'ACTIVE'),
        ('eeeeeeee-2222-2222-2222-222222222222', '${TENANT_A_ID}', '10000000-0000-0000-0000-000000000001', 'cccccccc-2222-2222-2222-222222222222', true, 'ACTIVE');

      -- Bind Roles per Node
      INSERT INTO assignment_roles (id, organization_id, assignment_id, role_id) VALUES
        ('11111111-aaaa-1111-1111-111111111111', '${TENANT_A_ID}', 'eeeeeeee-1111-1111-1111-111111111111', 'dddddddd-1111-1111-1111-111111111111'),
        ('22222222-aaaa-2222-2222-222222222222', '${TENANT_A_ID}', 'eeeeeeee-2222-2222-2222-222222222222', 'dddddddd-2222-2222-2222-222222222222');
    `);

    // 3. Apply Hardened RLS
    await pg.exec(RLS_ENABLE_SQL);

    // 4. Create Least-Privilege App Role
    await pg.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'campus_app_user') THEN
          CREATE ROLE campus_app_user WITH NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
        END IF;
      END $$;

      GRANT USAGE ON SCHEMA public TO campus_app_user;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO campus_app_user;
      
      -- Revoke sensitive credential columns from campus_app_user
      REVOKE ALL ON identity_users FROM campus_app_user;
      GRANT SELECT (id, email, first_name, last_name, is_active) ON identity_users TO campus_app_user;
    `);
  });

  describe('1. Composite Foreign Key & Tenant Invariant Tests', () => {
    it('rejects cross-tenant node assignment creation (Org A membership with Org B node)', async () => {
      // Create node in Org B
      await pg.exec(`
        INSERT INTO hierarchy_node_types (id, organization_id, code, name, level_order) 
        VALUES ('bbbbbbbb-3333-3333-3333-333333333333', '${TENANT_B_ID}', 'CAMPUS_B', 'Campus B', 1);

        INSERT INTO hierarchy_nodes (id, organization_id, node_type_id, code, name, path)
        VALUES ('cccccccc-4444-4444-4444-444444444444', '${TENANT_B_ID}', 'bbbbbbbb-3333-3333-3333-333333333333', 'CAMPUS_B_NODE', 'Campus B Node', 'root.campus_b');
      `);

      // Attempt to assign Org A membership to Org B node under Org A context
      await expect(
        pg.query(`
          INSERT INTO membership_node_assignments (id, organization_id, membership_id, hierarchy_node_id)
          VALUES ('ffffffff-1111-1111-1111-111111111111', '${TENANT_A_ID}', '10000000-0000-0000-0000-000000000001', 'cccccccc-4444-4444-4444-444444444444');
        `)
      ).rejects.toThrow(/violates foreign key constraint/i);
    });

    it('rejects cross-tenant role assignment creation (Org A assignment with Org B role)', async () => {
      // Create role in Org B
      await pg.exec(`
        INSERT INTO roles (id, organization_id, code, name) 
        VALUES ('dddddddd-3333-3333-3333-333333333333', '${TENANT_B_ID}', 'ORG_B_ROLE', 'Org B Role');
      `);

      // Attempt to link Org A assignment to Org B role
      await expect(
        pg.query(`
          INSERT INTO assignment_roles (id, organization_id, assignment_id, role_id)
          VALUES ('ffffffff-2222-2222-2222-222222222222', '${TENANT_A_ID}', 'eeeeeeee-1111-1111-1111-111111111111', 'dddddddd-3333-3333-3333-333333333333');
        `)
      ).rejects.toThrow(/violates foreign key constraint/i);
    });

    it('enforces partial unique index: at most one active primary node assignment per membership', async () => {
      // Assignment eeeeeeee-2222 is already primary. Attempt to set assignment eeeeeeee-1111 as primary too.
      await expect(
        pg.query(`
          UPDATE membership_node_assignments 
          SET is_primary = true 
          WHERE id = 'eeeeeeee-1111-1111-1111-111111111111';
        `)
      ).rejects.toThrow(/duplicate key value violates unique constraint/i);
    });
  });

  describe('2. Multi-Tenant RLS & Isolation Verification', () => {
    it('Tenant A context returns Tenant A memberships and assignments only', async () => {
      await pg.exec('BEGIN;');
      await pg.exec('SET LOCAL ROLE campus_app_user;');
      await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

      const result = await pg.query<{ id: string }>('SELECT id FROM organization_memberships;');
      await pg.exec('COMMIT;');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0]?.id).toBe('10000000-0000-0000-0000-000000000001');
    });

    it('Tenant B context returns Tenant B memberships only for same global identity', async () => {
      await pg.exec('BEGIN;');
      await pg.exec('SET LOCAL ROLE campus_app_user;');
      await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_B_ID}';`);

      const result = await pg.query<{ id: string }>('SELECT id FROM organization_memberships;');
      await pg.exec('COMMIT;');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0]?.id).toBe('20000000-0000-0000-0000-000000000002');
    });

    it('Tenant A cannot update or mutate Tenant B assignments', async () => {
      await pg.exec('BEGIN;');
      await pg.exec('SET LOCAL ROLE campus_app_user;');
      await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

      const updateRes = await pg.query(
        `UPDATE organization_memberships SET status = 'SUSPENDED' WHERE id = '20000000-0000-0000-0000-000000000002';`
      );
      await pg.exec('COMMIT;');

      expect(updateRes.affectedRows).toBe(0);
    });

    it('Missing tenant context fails closed (0 rows returned)', async () => {
      await pg.exec('BEGIN;');
      await pg.exec('SET LOCAL ROLE campus_app_user;');

      const result = await pg.query('SELECT * FROM organization_memberships;');
      await pg.exec('COMMIT;');

      expect(result.rows.length).toBe(0);
    });
  });

  describe('3. Global Identity Credential Access Isolation & Report Engine Security', () => {
    it('campus_app_user cannot select password_hash or mfa secrets directly from identity_users', async () => {
      await pg.exec('BEGIN;');
      await pg.exec('SET LOCAL ROLE campus_app_user;');

      await expect(
        pg.query('SELECT password_hash FROM identity_users;')
      ).rejects.toThrow(/permission denied for table identity_users|permission denied for column/i);

      await pg.exec('ROLLBACK;');
    });

    it('dynamic report / entity builder query attempting to select identity_users.password_hash or mfa_secret fails', async () => {
      await pg.exec('BEGIN;');
      await pg.exec('SET LOCAL ROLE campus_app_user;');
      await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

      // Simulated dynamic join query from report engine trying to dump credentials
      await expect(
        pg.query(`
          SELECT m.id, u.password_hash, u.mfa_secret_encrypted
          FROM organization_memberships m
          INNER JOIN identity_users u ON m.identity_user_id = u.id;
        `)
      ).rejects.toThrow(/permission denied for table identity_users|permission denied for column/i);

      await pg.exec('ROLLBACK;');
    });

    it('campus_app_user CAN select permitted non-sensitive profile columns', async () => {
      await pg.exec('BEGIN;');
      await pg.exec('SET LOCAL ROLE campus_app_user;');

      const result = await pg.query<{ email: string }>('SELECT email, first_name FROM identity_users;');
      await pg.exec('COMMIT;');

      expect(result.rows.length).toBe(1);
      expect(result.rows[0]?.email).toBe('ali@global.com');
    });
  });
});
