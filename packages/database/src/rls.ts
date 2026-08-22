/**
 * Hardened PostgreSQL Row-Level Security (RLS) Policy Specifications
 * Enforces Tier 2 of the Defense-in-Depth security model.
 * 
 * Features:
 * 1. ENABLE ROW LEVEL SECURITY + FORCE ROW LEVEL SECURITY (applies even to table owners).
 * 2. Explicit SELECT, INSERT (WITH CHECK), UPDATE (USING + WITH CHECK), and DELETE policies.
 * 3. Fail-Closed: Unset or invalid app.current_tenant_id evaluates to NULL, rejecting all operations.
 */
export const RLS_ENABLE_SQL = `
-- 1. Enable and Force RLS on all Tenant-Owned Tables
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'organizations',
    'users',
    'hierarchy_node_types',
    'hierarchy_nodes',
    'roles',
    'role_permissions',
    'user_role_assignments',
    'audit_logs',
    'outbox_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- 2. Organizations Table Policies
DROP POLICY IF EXISTS tenant_isolation_org_select ON organizations;
CREATE POLICY tenant_isolation_org_select ON organizations
  FOR SELECT
  USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_org_update ON organizations;
CREATE POLICY tenant_isolation_org_update ON organizations
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 3. Users Table Policies
DROP POLICY IF EXISTS tenant_isolation_users_select ON users;
CREATE POLICY tenant_isolation_users_select ON users
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_users_insert ON users;
CREATE POLICY tenant_isolation_users_insert ON users
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_users_update ON users;
CREATE POLICY tenant_isolation_users_update ON users
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_users_delete ON users;
CREATE POLICY tenant_isolation_users_delete ON users
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 4. Hierarchy Node Types Policies
DROP POLICY IF EXISTS tenant_isolation_node_types_select ON hierarchy_node_types;
CREATE POLICY tenant_isolation_node_types_select ON hierarchy_node_types
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_node_types_insert ON hierarchy_node_types;
CREATE POLICY tenant_isolation_node_types_insert ON hierarchy_node_types
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_node_types_update ON hierarchy_node_types;
CREATE POLICY tenant_isolation_node_types_update ON hierarchy_node_types
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_node_types_delete ON hierarchy_node_types;
CREATE POLICY tenant_isolation_node_types_delete ON hierarchy_node_types
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 5. Hierarchy Nodes Policies
DROP POLICY IF EXISTS tenant_isolation_nodes_select ON hierarchy_nodes;
CREATE POLICY tenant_isolation_nodes_select ON hierarchy_nodes
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_nodes_insert ON hierarchy_nodes;
CREATE POLICY tenant_isolation_nodes_insert ON hierarchy_nodes
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_nodes_update ON hierarchy_nodes;
CREATE POLICY tenant_isolation_nodes_update ON hierarchy_nodes
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_nodes_delete ON hierarchy_nodes;
CREATE POLICY tenant_isolation_nodes_delete ON hierarchy_nodes
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 6. Roles & Role Permissions Policies
DROP POLICY IF EXISTS tenant_isolation_roles_select ON roles;
CREATE POLICY tenant_isolation_roles_select ON roles
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_roles_insert ON roles;
CREATE POLICY tenant_isolation_roles_insert ON roles
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_roles_update ON roles;
CREATE POLICY tenant_isolation_roles_update ON roles
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_roles_delete ON roles;
CREATE POLICY tenant_isolation_roles_delete ON roles
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 7. Audit Logs Policies (Append-Only: SELECT & INSERT only)
DROP POLICY IF EXISTS tenant_isolation_audit_select ON audit_logs;
CREATE POLICY tenant_isolation_audit_select ON audit_logs
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_audit_insert ON audit_logs;
CREATE POLICY tenant_isolation_audit_insert ON audit_logs
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- 8. Outbox Events Policies
DROP POLICY IF EXISTS tenant_isolation_outbox_select ON outbox_events;
CREATE POLICY tenant_isolation_outbox_select ON outbox_events
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_outbox_insert ON outbox_events;
CREATE POLICY tenant_isolation_outbox_insert ON outbox_events
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_outbox_update ON outbox_events;
CREATE POLICY tenant_isolation_outbox_update ON outbox_events
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
`;
