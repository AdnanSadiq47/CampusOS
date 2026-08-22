import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { RLS_ENABLE_SQL } from '../src/rls.js';

describe('Real PostgreSQL 16 Row-Level Security (RLS) Database Verification', () => {
  let pg: PGlite;

  const TENANT_A_ID = '11111111-1111-1111-1111-111111111111';
  const TENANT_B_ID = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    pg = new PGlite();

    // 1. Setup Base Tables (as DDL / Migration Admin)
    await pg.exec(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        primary_currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );

      CREATE TABLE hierarchy_node_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        level_order INT NOT NULL,
        allow_financial_posting BOOLEAN DEFAULT TRUE NOT NULL,
        allow_user_assignment BOOLEAN DEFAULT TRUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );

      CREATE TABLE hierarchy_nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        node_type_id UUID NOT NULL,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );

      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        code VARCHAR(64) NOT NULL,
        name VARCHAR(128) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE NOT NULL
      );

      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        module_code VARCHAR(64) NOT NULL,
        entity_code VARCHAR(64) NOT NULL,
        action VARCHAR(32) NOT NULL,
        data_scope VARCHAR(32) DEFAULT 'HIERARCHY_SUBTREE' NOT NULL
      );

      CREATE TABLE user_role_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        node_id UUID NOT NULL REFERENCES hierarchy_nodes(id) ON DELETE CASCADE
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

    // 2. Insert Test Fixtures for Tenant A and Tenant B
    await pg.exec(`
      INSERT INTO organizations (id, code, name) VALUES
        ('${TENANT_A_ID}', 'tenant_a', 'Tenant Alpha Academy'),
        ('${TENANT_B_ID}', 'tenant_b', 'Tenant Beta Institute');

      INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name) VALUES
        ('aaaaaaaa-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'alice@tenanta.com', 'hash_a', 'Alice', 'Alpha'),
        ('bbbbbbbb-2222-2222-2222-222222222222', '${TENANT_B_ID}', 'bob@tenantb.com', 'hash_b', 'Bob', 'Beta');

      INSERT INTO roles (id, organization_id, code, name) VALUES
        ('cccccccc-1111-1111-1111-111111111111', '${TENANT_A_ID}', 'DEAN', 'Dean of Alpha'),
        ('dddddddd-2222-2222-2222-222222222222', '${TENANT_B_ID}', 'DEAN', 'Dean of Beta');
    `);

    // 3. Apply the Hardened Production RLS Policies
    await pg.exec(RLS_ENABLE_SQL);

    // 4. Create Least-Privilege Application Runtime Role (NOSUPERUSER, NOBYPASSRLS)
    await pg.exec(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'campus_app_user') THEN
          CREATE ROLE campus_app_user WITH NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
        END IF;
      END $$;

      GRANT USAGE ON SCHEMA public TO campus_app_user;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO campus_app_user;
    `);
  });

  it('1. Tenant A can read Tenant A records within tenant transaction context', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

    const result = await pg.query<{ email: string }>('SELECT email FROM users;');
    await pg.exec('COMMIT;');

    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.email).toBe('alice@tenanta.com');
  });

  it('2. Tenant A cannot read Tenant B records (RLS filters out other tenant rows)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

    const result = await pg.query<{ email: string }>(
      `SELECT email FROM users WHERE organization_id = '${TENANT_B_ID}';`
    );
    await pg.exec('COMMIT;');

    expect(result.rows.length).toBe(0);
  });

  it('3. Tenant A cannot UPDATE Tenant B records (RLS USING clause blocks modification)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

    const updateRes = await pg.query(
      `UPDATE users SET first_name = 'Hacked' WHERE email = 'bob@tenantb.com';`
    );
    await pg.exec('COMMIT;');

    expect(updateRes.affectedRows).toBe(0);

    // Verify Bob was not modified
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_B_ID}';`);
    const bobCheck = await pg.query<{ first_name: string }>(`SELECT first_name FROM users WHERE email = 'bob@tenantb.com';`);
    await pg.exec('COMMIT;');

    expect(bobCheck.rows[0]?.first_name).toBe('Bob');
  });

  it('4. Tenant A cannot DELETE Tenant B records (RLS USING clause blocks deletion)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

    const deleteRes = await pg.query(
      `DELETE FROM users WHERE email = 'bob@tenantb.com';`
    );
    await pg.exec('COMMIT;');

    expect(deleteRes.affectedRows).toBe(0);

    // Verify Bob still exists
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_B_ID}';`);
    const bobCheck = await pg.query<{ email: string }>(`SELECT email FROM users WHERE email = 'bob@tenantb.com';`);
    await pg.exec('COMMIT;');

    expect(bobCheck.rows.length).toBe(1);
  });

  it('5. Tenant A cannot INSERT a row pretending to belong to Tenant B (WITH CHECK violation)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

    await expect(
      pg.query(`
        INSERT INTO users (organization_id, email, password_hash, first_name, last_name)
        VALUES ('${TENANT_B_ID}', 'malicious@tenantb.com', 'hash_m', 'Mallory', 'Malicious');
      `)
    ).rejects.toThrow(/new row violates row-level security policy/i);

    await pg.exec('ROLLBACK;');
  });

  it('6. Missing tenant context returns zero protected rows (Fails Closed)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    // No SET LOCAL app.current_tenant_id executed

    const result = await pg.query('SELECT * FROM users;');
    await pg.exec('COMMIT;');

    expect(result.rows.length).toBe(0);
  });

  it('7. Invalid tenant context fails closed', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '00000000-0000-0000-0000-000000000000';`);

    const result = await pg.query('SELECT * FROM users;');
    await pg.exec('COMMIT;');

    expect(result.rows.length).toBe(0);
  });

  it('8. Application query WITHOUT organization_id WHERE clause still cannot retrieve Tenant B data (RLS acts as final safety boundary)', async () => {
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);

    // Intentionally omit "WHERE organization_id = ..."
    const result = await pg.query<{ email: string }>('SELECT email FROM users;');
    await pg.exec('COMMIT;');

    // Only Tenant A records returned
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.email).toBe('alice@tenanta.com');
  });

  it('9. Reusing connection after COMMIT does not retain Tenant A context (No pool leakage)', async () => {
    // Transaction 1: Tenant A
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
    await pg.exec('COMMIT;');

    // Transaction 2: Reusing connection without setting tenant context
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    const result = await pg.query('SELECT * FROM users;');
    await pg.exec('COMMIT;');

    // Proves SET LOCAL was discarded on COMMIT
    expect(result.rows.length).toBe(0);
  });

  it('10. Reusing connection after ROLLBACK does not retain Tenant A context (No pool leakage)', async () => {
    // Transaction 1: Tenant A fails and rolls back
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    await pg.exec(`SET LOCAL app.current_tenant_id = '${TENANT_A_ID}';`);
    await pg.exec('ROLLBACK;');

    // Transaction 2: Reusing connection without setting tenant context
    await pg.exec('BEGIN;');
    await pg.exec('SET LOCAL ROLE campus_app_user;');
    const result = await pg.query('SELECT * FROM users;');
    await pg.exec('COMMIT;');

    // Proves SET LOCAL was discarded on ROLLBACK
    expect(result.rows.length).toBe(0);
  });
});
