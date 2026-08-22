/**
 * Generates SQL DDL to enable Row-Level Security (RLS) on all tenant-owned tables.
 * This acts as Tier 2 of the Defense-in-Depth security model.
 */
export const RLS_ENABLE_SQL = `
-- 1. Enable RLS on Tenant-Protected Tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hierarchy_node_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hierarchy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;

-- 2. Define Strict Tenant Isolation Policies
-- Fail closed: If app.current_tenant_id is unset or invalid UUID, policy blocks access.

DROP POLICY IF EXISTS tenant_isolation_org ON organizations;
CREATE POLICY tenant_isolation_org ON organizations
  FOR ALL
  USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_node_types ON hierarchy_node_types;
CREATE POLICY tenant_isolation_node_types ON hierarchy_node_types
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_nodes ON hierarchy_nodes;
CREATE POLICY tenant_isolation_nodes ON hierarchy_nodes
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_roles ON roles;
CREATE POLICY tenant_isolation_roles ON roles
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_audit ON audit_logs;
CREATE POLICY tenant_isolation_audit ON audit_logs
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_outbox ON outbox_events;
CREATE POLICY tenant_isolation_outbox ON outbox_events
  FOR ALL
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
`;
