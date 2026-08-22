-- ==============================================================================
-- 1. PostgreSQL Extensions
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "ltree";

-- ==============================================================================
-- 2. Composite Foreign Keys for Tenant Consistency
-- ==============================================================================
DO $$ BEGIN
  ALTER TABLE "employee_profiles" 
    ADD CONSTRAINT "fk_employee_membership" 
    FOREIGN KEY ("organization_id", "membership_id") 
    REFERENCES "public"."organization_memberships"("organization_id", "id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "membership_node_assignments" 
    ADD CONSTRAINT "fk_assignments_membership" 
    FOREIGN KEY ("organization_id", "membership_id") 
    REFERENCES "public"."organization_memberships"("organization_id", "id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "membership_node_assignments" 
    ADD CONSTRAINT "fk_assignments_node" 
    FOREIGN KEY ("organization_id", "hierarchy_node_id") 
    REFERENCES "public"."hierarchy_nodes"("organization_id", "id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "assignment_roles" 
    ADD CONSTRAINT "fk_assignment_roles_assignment" 
    FOREIGN KEY ("organization_id", "assignment_id") 
    REFERENCES "public"."membership_node_assignments"("organization_id", "id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "assignment_roles" 
    ADD CONSTRAINT "fk_assignment_roles_role" 
    FOREIGN KEY ("organization_id", "role_id") 
    REFERENCES "public"."roles"("organization_id", "id") ON DELETE RESTRICT;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 3. Partial Unique Index: Primary Node Assignment Invariant
-- ==============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS "uq_primary_assignment_per_membership" 
ON "membership_node_assignments" ("organization_id", "membership_id") 
WHERE is_primary = TRUE AND status = 'ACTIVE';

-- ==============================================================================
-- 4. Runtime Application Role & Column Privilege Isolation
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'campus_app_user') THEN
    CREATE ROLE campus_app_user WITH NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO campus_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO campus_app_user;

-- Strictly revoke access to credential columns from campus_app_user
REVOKE ALL ON identity_users FROM campus_app_user;
GRANT SELECT (id, email, first_name, last_name, is_active) ON identity_users TO campus_app_user;

-- ==============================================================================
-- 5. Row-Level Security (RLS) & FORCE ROW LEVEL SECURITY
-- ==============================================================================
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'organizations',
    'organization_memberships',
    'employee_profiles',
    'membership_node_assignments',
    'assignment_roles',
    'hierarchy_node_types',
    'hierarchy_nodes',
    'roles',
    'role_permissions',
    'audit_logs',
    'outbox_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- Policies for Organizations
DROP POLICY IF EXISTS tenant_isolation_org_select ON organizations;
CREATE POLICY tenant_isolation_org_select ON organizations
  FOR SELECT
  USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_org_update ON organizations;
CREATE POLICY tenant_isolation_org_update ON organizations
  FOR UPDATE
  USING (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Policies for Organization Memberships
DROP POLICY IF EXISTS tenant_isolation_memberships_select ON organization_memberships;
CREATE POLICY tenant_isolation_memberships_select ON organization_memberships
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_memberships_insert ON organization_memberships;
CREATE POLICY tenant_isolation_memberships_insert ON organization_memberships
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_memberships_update ON organization_memberships;
CREATE POLICY tenant_isolation_memberships_update ON organization_memberships
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_memberships_delete ON organization_memberships;
CREATE POLICY tenant_isolation_memberships_delete ON organization_memberships
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Policies for Employee Profiles
DROP POLICY IF EXISTS tenant_isolation_employee_select ON employee_profiles;
CREATE POLICY tenant_isolation_employee_select ON employee_profiles
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_employee_insert ON employee_profiles;
CREATE POLICY tenant_isolation_employee_insert ON employee_profiles
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_employee_update ON employee_profiles;
CREATE POLICY tenant_isolation_employee_update ON employee_profiles
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_employee_delete ON employee_profiles;
CREATE POLICY tenant_isolation_employee_delete ON employee_profiles
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Policies for Membership Node Assignments
DROP POLICY IF EXISTS tenant_isolation_assignments_select ON membership_node_assignments;
CREATE POLICY tenant_isolation_assignments_select ON membership_node_assignments
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_assignments_insert ON membership_node_assignments;
CREATE POLICY tenant_isolation_assignments_insert ON membership_node_assignments
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_assignments_update ON membership_node_assignments;
CREATE POLICY tenant_isolation_assignments_update ON membership_node_assignments
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_assignments_delete ON membership_node_assignments;
CREATE POLICY tenant_isolation_assignments_delete ON membership_node_assignments
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Policies for Assignment Roles
DROP POLICY IF EXISTS tenant_isolation_assignment_roles_select ON assignment_roles;
CREATE POLICY tenant_isolation_assignment_roles_select ON assignment_roles
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_assignment_roles_insert ON assignment_roles;
CREATE POLICY tenant_isolation_assignment_roles_insert ON assignment_roles
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_assignment_roles_update ON assignment_roles;
CREATE POLICY tenant_isolation_assignment_roles_update ON assignment_roles
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_assignment_roles_delete ON assignment_roles;
CREATE POLICY tenant_isolation_assignment_roles_delete ON assignment_roles
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Policies for Hierarchy Node Types
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

-- Policies for Hierarchy Nodes
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

-- Policies for Roles & Role Permissions
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

DROP POLICY IF EXISTS tenant_isolation_role_perms_select ON role_permissions;
CREATE POLICY tenant_isolation_role_perms_select ON role_permissions
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_role_perms_insert ON role_permissions;
CREATE POLICY tenant_isolation_role_perms_insert ON role_permissions
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_role_perms_update ON role_permissions;
CREATE POLICY tenant_isolation_role_perms_update ON role_permissions
  FOR UPDATE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_role_perms_delete ON role_permissions;
CREATE POLICY tenant_isolation_role_perms_delete ON role_permissions
  FOR DELETE
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Policies for Audit Logs (Append-Only)
DROP POLICY IF EXISTS tenant_isolation_audit_select ON audit_logs;
CREATE POLICY tenant_isolation_audit_select ON audit_logs
  FOR SELECT
  USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS tenant_isolation_audit_insert ON audit_logs;
CREATE POLICY tenant_isolation_audit_insert ON audit_logs
  FOR INSERT
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- Policies for Outbox Events
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
