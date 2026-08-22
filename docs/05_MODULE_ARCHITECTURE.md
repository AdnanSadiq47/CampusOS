# 05. Pluggable Module Architecture & Framework

---

## 1. Core Architecture: Stable Core + Pluggable Modules

CampusOS is structured as a **Modular Platform**:
* The **Platform Core** contains no domain-specific knowledge; it provides the engine capabilities (Authentication, Hierarchy, Dynamic Entities, Form Runtime, Workflow FSM, Double-Entry Ledger, Audit Trail, Event Bus, Background Queues).
* Business functionality is encapsulated within **Pluggable Domain Modules** that register entities, forms, workflows, menus, posting rules, and background tasks through declarative manifests.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CAMPUSOS PLATFORM CORE                             │
│  Identity • Hierarchy • Virtual ORM • FSM Engine • Accounting • Audit • Bus │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Registers via Declarative Manifests
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ ACADEMIC MODULE  │          │ ADMISSIONS MOD   │          │ FEE BILLING MOD  │
│ • Programs/Terms │          │ • Public Portal  │          │ • Fee Schedules  │
│ • Course Catalog │          │ • Intake Forms   │          │ • Invoicing      │
│ • Class Sections │          │ • Merit List FSM │          │ • Ledger Bridge  │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

---

## 2. Declarative Module Manifest Specification

Every module implements the `CampusOSModule` contract in TypeScript:

```typescript
export interface CampusOSModule {
  code: string;                      // Unique identifier, e.g. "fee_billing"
  name: string;                      // Display name, e.g. "Fee Billing & Accounts"
  version: string;                   // Semantic version, e.g. "1.0.0"
  description: string;
  category: 'ACADEMIC' | 'FINANCIAL' | 'ADMINISTRATIVE' | 'HR' | 'CUSTOM';
  dependencies?: string[];           // Dependent module codes, e.g. ["academic_core"]

  // 1. Declarative Platform Registrations
  entities?: EntityDeclaration[];    // Core and Hybrid entities introduced by module
  defaultForms?: FormDeclaration[];  // Initial default Form AST schemas
  defaultWorkflows?: WorkflowDeclaration[]; // Initial default Workflow graphs
  navigationItems?: NavigationMenuItem[];   // Menu entries injected into UI sidebar
  dashboardWidgets?: WidgetDeclaration[];   // KPI cards and charts
  accountingPostingRules?: PostingRuleDefinition[]; // Sub-ledger posting bridges

  // 2. Lifecycle Hooks (Invoked on State Transitions)
  onInstall?(context: ModuleInstallContext): Promise<void>;
  onEnable?(tenantId: string, context: TenantContext): Promise<void>;
  onDisable?(tenantId: string, context: TenantContext): Promise<void>;
  onUpgrade?(tenantId: string, fromVersion: string, toVersion: string): Promise<void>;
}
```

---

## 3. Tenant-Specific Module Activation Database Schema

Organizations choose which modules to activate based on their institutional license and operational needs:

```sql
CREATE TABLE organization_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_code VARCHAR(64) NOT NULL,       -- e.g., "fee_billing", "hostel_management"
    is_enabled BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,     -- Organization-specific module settings
    activated_at TIMESTAMPTZ,
    activated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, module_code)
);
```

---

## 4. Module Lifecycle & Execution Rules

1. **Installation (`onInstall`)**: Runs globally during platform bootstrapping. Registers entity metadata, default form ASTs, and canonical permissions into the system catalog.
2. **Activation (`onEnable`)**: Invoked when an organization admin toggles a module ON:
   * Instantiates default form versions and workflow definitions in the tenant's catalog.
   * Generates default role permissions.
   * Injects navigation links into the organization's dynamic navigation menu.
3. **Deactivation (`onDisable`)**: Invoked when a module is toggled OFF:
   * Hides UI navigation links.
   * Suspends associated background cron jobs for this tenant.
   * **Data Preservation Invariant**: Disabling a module **never deletes historical tables or records**. Data remains preserved in the database for compliance and future re-activation.
4. **Dependency Resolution**: A module cannot be enabled if its prerequisites are missing (e.g., `grading_module` requires `academic_core` to be active).

---

## 5. Navigation & Menu Builder Integration

Modules contribute top-level and submenu items to the **Menu Builder**:
* Organization administrators can visually reorder menus, rename menu labels, group items under custom headers, or assign specific roles to specific menu entries.
