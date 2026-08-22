# 08. Database Architecture & Multi-Tenant Relational Model

---

## 1. Schema Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│ GLOBAL SECURITY SCHEMA (No RLS, System/Auth Only)                      │
│ - identity_users (Authentication, Argon2id, AES-256-GCM Encrypted MFA) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TENANT-OWNED SCHEMAS (PostgreSQL RLS + FORCE ROW LEVEL SECURITY)       │
│ - organizations                                                        │
│ - hierarchy_node_types          (Composite FKs: org_id, id)            │
│ - hierarchy_nodes               (Composite FKs: org_id, id, ltree path)│
│ - organization_memberships      (Composite FKs: org_id, id)            │
│ - employee_profiles             (Composite FKs: org_id, membership_id) │
│ - membership_node_assignments   (Composite FKs: org_id, id)            │
│ - roles                         (Composite FKs: org_id, id)            │
│ - assignment_roles              (Composite FKs: org_id, assignment_id) │
│ - role_permissions              (Composite FKs: org_id, role_id)       │
│ - audit_logs                    (Append-Only, CDC)                     │
│ - outbox_events                 (Transactional Outbox)                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Composite Foreign Key Architecture

Every tenant-owned relationship table enforces **Composite Foreign Keys** including `organization_id`:

```sql
-- Prevents cross-tenant node assignment
CONSTRAINT fk_assignments_membership FOREIGN KEY (organization_id, membership_id)
  REFERENCES organization_memberships(organization_id, id) ON DELETE CASCADE;

CONSTRAINT fk_assignments_node FOREIGN KEY (organization_id, hierarchy_node_id)
  REFERENCES hierarchy_nodes(organization_id, id) ON DELETE RESTRICT;

-- Prevents cross-tenant role grant
CONSTRAINT fk_assignment_roles_assignment FOREIGN KEY (organization_id, assignment_id)
  REFERENCES membership_node_assignments(organization_id, id) ON DELETE CASCADE;

CONSTRAINT fk_assignment_roles_role FOREIGN KEY (organization_id, role_id)
  REFERENCES roles(organization_id, id) ON DELETE RESTRICT;
```

---

## 3. Row-Level Security (RLS) Specification

All tenant-owned tables have `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` enabled.
* **Fail-Closed Condition**:
  `USING (organization_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid)`
* **Multi-Action Enforcement**: Explicit `SELECT (USING)`, `INSERT (WITH CHECK)`, `UPDATE (USING + WITH CHECK)`, and `DELETE (USING)` policies on all protected tables.
