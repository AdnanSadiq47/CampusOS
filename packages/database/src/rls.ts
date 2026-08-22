/**
 * CampusOS Row-Level Security (RLS) Generator & Invariants
 *
 * Invariants:
 * 1. ZERO cross-tenant data leakage.
 * 2. Every tenant-owned table MUST enable and FORCE row-level security.
 * 3. Fail-Closed: If `app.current_tenant_id` is missing, NULLIF evaluates to NULL and returns 0 rows.
 * 4. Multi-action coverage: SELECT, INSERT, UPDATE, DELETE policies on all tenant tables.
 */

export const TENANT_TABLES = [
  // Phase 1 Tables
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
  'outbox_events',
  // Phase 2 Tables
  'entity_definitions',
  'entity_fields',
  'entity_records',
  'form_definitions',
  'form_versions',
  'workflow_definitions',
  'workflow_states',
  'workflow_transitions',
  'workflow_instances',
  'workflow_history',
  'navigation_menus',
  'navigation_items',
  'organization_modules',
] as const;

export function generateRlsSql(): string {
  return TENANT_TABLES.map((table) => {
    // Organizations table uses 'id', all others use 'organization_id'
    const tenantColumn = table === 'organizations' ? 'id' : 'organization_id';

    return `
      -- 1. Enable RLS
      ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
      
      -- 2. Force RLS (Ensures table owner cannot accidentally bypass RLS)
      ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;

      -- 3. Drop existing policies to ensure clean idempotent migrations
      DROP POLICY IF EXISTS ${table}_tenant_select_policy ON ${table};
      DROP POLICY IF EXISTS ${table}_tenant_insert_policy ON ${table};
      DROP POLICY IF EXISTS ${table}_tenant_update_policy ON ${table};
      DROP POLICY IF EXISTS ${table}_tenant_delete_policy ON ${table};

      -- 4. Fail-Closed Tenant Policies
      CREATE POLICY ${table}_tenant_select_policy ON ${table}
        FOR SELECT
        USING (${tenantColumn} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      CREATE POLICY ${table}_tenant_insert_policy ON ${table}
        FOR INSERT
        WITH CHECK (${tenantColumn} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      CREATE POLICY ${table}_tenant_update_policy ON ${table}
        FOR UPDATE
        USING (${tenantColumn} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)
        WITH CHECK (${tenantColumn} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

      CREATE POLICY ${table}_tenant_delete_policy ON ${table}
        FOR DELETE
        USING (${tenantColumn} = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
    `;
  }).join('\n');
}

export const RLS_ENABLE_SQL = generateRlsSql();
