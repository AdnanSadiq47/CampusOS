import { is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../schema/index.js';

export type TableClassification =
  | 'IAM_SECURITY'
  | 'CONFIGURATION_MASTER'
  | 'HIERARCHY'
  | 'BUSINESS_DATA'
  | 'DYNAMIC_FORMS'
  | 'AUDIT_HISTORY'
  | 'SYSTEM_METADATA'
  | 'MIGRATION_METADATA'
  | 'SAFETY_METADATA';

export interface AuthoritativeTableMetadata {
  tableName: string;
  classification: TableClassification;
  description: string;
  restoreOrder: number;
}

/**
 * Authoritative Classification & Restore Order Registry
 * Strictly derived from Drizzle schema definitions and foreign-key dependency hierarchy.
 */
export const AUTHORITATIVE_TABLE_REGISTRY: Record<
  string,
  { classification: TableClassification; description: string; restoreOrder: number }
> = {
  // ── Level 1: Root Multi-Tenant Anchor & Auth Principals ────────────
  organizations: { classification: 'CONFIGURATION_MASTER', description: 'Core multi-tenant organizations', restoreOrder: 1 },
  identity_users: { classification: 'IAM_SECURITY', description: 'Global identity users & auth principals', restoreOrder: 2 },
  organization_memberships: { classification: 'IAM_SECURITY', description: 'User-to-tenant memberships', restoreOrder: 3 },
  employee_profiles: { classification: 'IAM_SECURITY', description: 'Staff employment profile metadata', restoreOrder: 4 },

  // ── Level 2: Shared Reference Geography Masters (Country -> State -> City -> Area) ──
  countries: { classification: 'CONFIGURATION_MASTER', description: 'Country shared master definitions', restoreOrder: 5 },
  states: { classification: 'CONFIGURATION_MASTER', description: 'State / Province shared master definitions', restoreOrder: 6 },
  cities: { classification: 'CONFIGURATION_MASTER', description: 'City shared master definitions', restoreOrder: 7 },
  areas: { classification: 'CONFIGURATION_MASTER', description: 'Area / Zone shared master definitions with postal codes', restoreOrder: 8 },

  // ── Level 3: Organizational Hierarchy Tree & Institutions ──────────
  hierarchy_node_types: { classification: 'HIERARCHY', description: 'Hierarchy tier metadata definitions', restoreOrder: 9 },
  hierarchy_nodes: { classification: 'HIERARCHY', description: 'Recursive organizational tree nodes', restoreOrder: 10 },
  head_offices: { classification: 'HIERARCHY', description: 'Head Office administrative entities', restoreOrder: 11 },
  regions: { classification: 'HIERARCHY', description: 'Regional office administrative entities', restoreOrder: 12 },
  schools: { classification: 'HIERARCHY', description: 'School / Institution master records', restoreOrder: 13 },
  branches: { classification: 'HIERARCHY', description: 'Operational branch / campus locations', restoreOrder: 14 },
  membership_node_assignments: { classification: 'HIERARCHY', description: 'Employee-to-node multi-tier assignments', restoreOrder: 15 },

  // ── Level 4: RBAC Roles & Fine-Grained Permissions ─────────────────
  roles: { classification: 'IAM_SECURITY', description: 'Tenant-scoped RBAC roles', restoreOrder: 16 },
  role_permissions: { classification: 'IAM_SECURITY', description: 'Fine-grained module/entity/action rules', restoreOrder: 17 },
  assignment_roles: { classification: 'IAM_SECURITY', description: 'Node assignment to role mappings', restoreOrder: 18 },

  // ── Level 5: Modules, Navigation Menus & Display Preferences ───────
  organization_modules: { classification: 'SYSTEM_METADATA', description: 'Tenant module activations', restoreOrder: 19 },
  navigation_menus: { classification: 'SYSTEM_METADATA', description: 'Navigation menu configuration', restoreOrder: 20 },
  navigation_items: { classification: 'SYSTEM_METADATA', description: 'Submenu and route links', restoreOrder: 21 },
  display_preferences: { classification: 'CONFIGURATION_MASTER', description: 'Campus/School/Org display formats', restoreOrder: 22 },

  // ── Level 6: Academic Masters & Structure ──────────────────────────
  academic_years: { classification: 'CONFIGURATION_MASTER', description: 'Academic sessions / years', restoreOrder: 23 },
  boards: { classification: 'CONFIGURATION_MASTER', description: 'Education boards catalog', restoreOrder: 24 },
  academic_levels: { classification: 'CONFIGURATION_MASTER', description: 'Academic tier levels', restoreOrder: 25 },
  subjects: { classification: 'CONFIGURATION_MASTER', description: 'Academic subjects catalog', restoreOrder: 26 },
  classes: { classification: 'CONFIGURATION_MASTER', description: 'Class / Grade definitions', restoreOrder: 27 },
  class_subject_mappings: { classification: 'CONFIGURATION_MASTER', description: 'Class to subject curriculum links', restoreOrder: 28 },
  sections: { classification: 'CONFIGURATION_MASTER', description: 'Class sections / divisions', restoreOrder: 29 },
  languages: { classification: 'CONFIGURATION_MASTER', description: 'Instruction & curriculum languages', restoreOrder: 30 },
  config_scope_branches: { classification: 'CONFIGURATION_MASTER', description: 'Selected campus configuration scope links', restoreOrder: 31 },

  // ── Level 7: Dynamic Entities & Form Engine ────────────────────────
  entity_definitions: { classification: 'DYNAMIC_FORMS', description: 'Metadata-driven dynamic entities', restoreOrder: 32 },
  entity_fields: { classification: 'DYNAMIC_FORMS', description: 'Dynamic entity field definitions', restoreOrder: 33 },
  entity_records: { classification: 'BUSINESS_DATA', description: 'Dynamic entity record instances', restoreOrder: 34 },
  field_definitions: { classification: 'DYNAMIC_FORMS', description: 'Custom form field library', restoreOrder: 35 },
  form_definitions: { classification: 'DYNAMIC_FORMS', description: 'Visual form builder layouts', restoreOrder: 36 },
  form_versions: { classification: 'DYNAMIC_FORMS', description: 'Versioned form snapshots', restoreOrder: 37 },
  form_templates: { classification: 'DYNAMIC_FORMS', description: 'Reusable form templates', restoreOrder: 38 },

  // ── Level 8: Workflows & State Machine ─────────────────────────────
  workflow_definitions: { classification: 'DYNAMIC_FORMS', description: 'Workflow state machine schemas', restoreOrder: 39 },
  workflow_states: { classification: 'DYNAMIC_FORMS', description: 'Workflow nodes / states', restoreOrder: 40 },
  workflow_transitions: { classification: 'DYNAMIC_FORMS', description: 'Workflow valid transitions', restoreOrder: 41 },
  workflow_instances: { classification: 'BUSINESS_DATA', description: 'Active running workflow instances', restoreOrder: 42 },
  workflow_history: { classification: 'AUDIT_HISTORY', description: 'Workflow transition audit trail', restoreOrder: 43 },

  // ── Level 9: Admissions Business Subsystem ─────────────────────────
  pre_admissions: { classification: 'BUSINESS_DATA', description: 'Pre-admission student applications', restoreOrder: 44 },
  pre_admissions_list_view_configs: { classification: 'CONFIGURATION_MASTER', description: 'User-customized admissions grid views', restoreOrder: 45 },
  pre_admission_documents: { classification: 'BUSINESS_DATA', description: 'Uploaded application verification documents', restoreOrder: 46 },
  pre_admission_fee_payments: { classification: 'BUSINESS_DATA', description: 'Application fee vouchers & reconciliation', restoreOrder: 47 },
  application_fee_rules: { classification: 'CONFIGURATION_MASTER', description: 'Application fee policies & collection rules', restoreOrder: 48 },

  // ── Level 10: Audit, Outbox, Migration & Safety Metadata ───────────
  audit_logs: { classification: 'AUDIT_HISTORY', description: 'Immutable tamper-resistant audit trail', restoreOrder: 49 },
  outbox_events: { classification: 'SYSTEM_METADATA', description: 'Transactional outbox event messages', restoreOrder: 50 },
  _campusos_migrations: { classification: 'MIGRATION_METADATA', description: 'Applied migration records', restoreOrder: 51 },
  _campusos_database_identity: { classification: 'SAFETY_METADATA', description: 'Canonical database identity stamp', restoreOrder: 52 },
};

/**
 * Dynamically resolves all authoritative tables from Drizzle schema exports using official `is(val, PgTable)`.
 * Validates bi-directional parity between Drizzle PgTable definitions and AUTHORITATIVE_TABLE_REGISTRY.
 * Fails closed on duplicate table names, unmapped tables, obsolete entries, or ambiguous restore orders.
 */
export function getAuthoritativeTableInventory(): AuthoritativeTableMetadata[] {
  const schemaTableNames = new Set<string>();

  for (const [, exportedItem] of Object.entries(schema)) {
    if (is(exportedItem, PgTable)) {
      const tableName = (exportedItem as any)[Symbol.for('drizzle:Name')] || (exportedItem as any)._?.name;
      if (tableName && typeof tableName === 'string') {
        if (schemaTableNames.has(tableName)) {
          throw new Error(`DUPLICATE_SCHEMA_TABLE_ERROR: Table "${tableName}" was exported multiple times in schema.`);
        }
        schemaTableNames.add(tableName);
      }
    }
  }

  // System and safety metadata tables
  schemaTableNames.add('_campusos_migrations');
  schemaTableNames.add('_campusos_database_identity');

  const inventory: AuthoritativeTableMetadata[] = [];
  const seenRestoreOrders = new Set<number>();

  for (const tbl of schemaTableNames) {
    const meta = AUTHORITATIVE_TABLE_REGISTRY[tbl];
    if (!meta) {
      throw new Error(`SCHEMA_DRIFT_ERROR: Authoritative Drizzle schema defines PgTable "${tbl}" but it is missing from AUTHORITATIVE_TABLE_REGISTRY.`);
    }

    if (seenRestoreOrders.has(meta.restoreOrder)) {
      throw new Error(`AMBIGUOUS_RESTORE_ORDER_ERROR: Restore order ${meta.restoreOrder} assigned to table "${tbl}" is a duplicate.`);
    }
    seenRestoreOrders.add(meta.restoreOrder);

    inventory.push({
      tableName: tbl,
      classification: meta.classification,
      description: meta.description,
      restoreOrder: meta.restoreOrder,
    });
  }

  // Verify no obsolete/deleted tables exist in registry
  for (const registeredTbl of Object.keys(AUTHORITATIVE_TABLE_REGISTRY)) {
    if (!schemaTableNames.has(registeredTbl)) {
      throw new Error(`SCHEMA_DRIFT_ERROR: Table "${registeredTbl}" exists in recovery registry but is NOT an authoritative Drizzle PgTable.`);
    }
  }

  inventory.sort((a, b) => a.restoreOrder - b.restoreOrder);
  return inventory;
}
