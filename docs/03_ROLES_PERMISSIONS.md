# 03. Dynamic Roles, Permissions & ABAC Architecture

---

## 1. Core Philosophy: Zero Hardcoded Roles

CampusOS has **zero hardcoded roles** in its platform core. 

Roles like `Teacher`, `Accountant`, `Principal`, `Registrar`, or `Dean` exist solely as **optional starting templates**. Organizations have the absolute autonomy to:
* Create unlimited custom roles (e.g., *Admissions Coordinator*, *Fee Auditor*, *Hostel Warden*, *Academic Dean*).
* Clone, rename, merge, and customize existing roles.
* Assign granular permissions across modules, entities, actions, data scopes, and fields.

---

## 2. 5-Tier Permission Granularity

Permissions are evaluated dynamically through a 5-tier evaluation pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. MODULE PERMISSION     : Can user access the "Fee Billing" Module?        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. ENTITY PERMISSION     : Can user operate on the "Student Invoice" Entity?│
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. ACTION PERMISSION     : Can user perform the "APPROVE" Action?           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. DATA SCOPE PERMISSION : Can user access records in "North Campus"?       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. FIELD-LEVEL PERMISSION: Can user view/edit the "discount_amount" Field?  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Standard Action Vocabulary (12 Canonical Actions)

Every entity in CampusOS supports a standardized set of canonical actions:

| Action Code | Action Label | Operational Meaning |
|---|---|---|
| `READ` | View Records | View single records or data grids of the entity. |
| `CREATE` | Create New | Instantiate new records of this entity. |
| `UPDATE` | Edit Record | Modify mutable fields of an existing record. |
| `DELETE` | Soft Delete / Void | Soft-delete, archive, or void a record (if business rules permit). |
| `SUBMIT` | Submit to Workflow | Transition a draft record into an active approval workflow. |
| `APPROVE` | Approve Workflow Stage | Grant approval at an assigned workflow stage. |
| `REJECT` | Reject Workflow Stage | Reject or request resubmission at a workflow stage. |
| `PRINT` | Print / Generate PDF | Generate formal printable documents (e.g., Fee Challan, Grade Card). |
| `EXPORT` | Export Data | Export datasets to CSV, Excel, or external systems. |
| `IMPORT` | Bulk Import | Upload spreadsheets to bulk-create or update records. |
| `CONFIGURE` | Administer Metadata | Modify the entity's forms, workflows, or fields. |
| `AUDIT_VIEW` | View Change History | View the immutable CDC audit logs for this entity. |

---

## 4. Field-Level Security Rules (FLS)

Administrators can configure granular field-level permissions for any role:
* **Default**: Inherit entity-level read/write permissions.
* **Read-Only**: The user can see the field value, but cannot edit it during creation or updates.
* **Hidden**: The field is completely excluded from the form AST and API response payload.
* **Masked**: Sensitive data is partially masked in UI and API (e.g., `National ID: *****-1234567-8`).

```json
{
  "entity": "student_admission",
  "field_restrictions": [
    { "field_name": "discount_percentage", "access": "READ_ONLY" },
    { "field_name": "background_check_notes", "access": "HIDDEN" },
    { "field_name": "national_id", "access": "MASKED" }
  ]
}
```

---

## 5. Database Schema Specification

```sql
-- 1. Dynamic Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(64) NOT NULL,              -- e.g., "CAMPUS_DIRECTOR"
    name VARCHAR(128) NOT NULL,             -- e.g., "Campus Director"
    description TEXT,
    is_system_template BOOLEAN DEFAULT FALSE, -- Pre-seeded template flag
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- 2. Role Permissions (Action & Scope Bindings)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_code VARCHAR(64) NOT NULL,       -- e.g., "admissions", "finance"
    entity_code VARCHAR(64) NOT NULL,       -- e.g., "admission_application", "*"
    action VARCHAR(32) NOT NULL,            -- e.g., "APPROVE", "READ", "*"
    data_scope VARCHAR(32) NOT NULL DEFAULT 'HIERARCHY_SUBTREE',
    field_rules JSONB DEFAULT '[]'::jsonb,  -- Array of field-level restrictions
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_role_permissions_lookup ON role_permissions (role_id, entity_code, action);

-- 3. User Role & Hierarchy Node Bindings
CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES hierarchy_nodes(id) ON DELETE CASCADE, -- User's operational base
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_role_assignments_user ON user_role_assignments (user_id);
```

---

## 6. Evaluation Logic & Deny-by-Default Rule

1. **Deny-by-Default**: If no active role assigned to a user explicitly grants an action on an entity, access is **Denied** ($403\text{ Forbidden}$).
2. **Explicit Allow Accumulation**: If a user holds multiple roles (e.g., *Teacher* in Department A and *Coordinator* in Campus B), permissions are evaluated as a union of allows, scoped to their respective hierarchy nodes.
3. **Caching**: Role-Permission matrices are cached in Redis (`org:{orgId}:role:{roleId}:permissions`) with instant pub/sub cache invalidation whenever an administrator edits a role.
