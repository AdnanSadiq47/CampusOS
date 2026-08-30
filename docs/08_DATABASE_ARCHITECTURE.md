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
│ - schools                       (Composite FKs: org_id, hierarchy_node)│
│ - regions                       (Composite FKs: org_id, hierarchy_node)│
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

---

## 4. Node-Scoped Business Data vs. Shared Reference Tables

CampusOS strictly differentiates between node-scoped operational tables and shared reference tables:

### A. Node-Scoped Operational Records
Every business table that is organizationally scoped and requires campus/location-based authorization, filtering, aggregation, or reporting MUST retain an authoritative link to `hierarchy_nodes`:
- `students`, `admissions`, `enrollments`
- `invoices`, `receipts`, `financial_vouchers`
- `attendance_records`, `grade_entries`, `exam_schedules`
- `payroll_runs`, `employee_leaves`
- `inventory_transactions`, `transport_logs`, `library_loans`

Each row stores `hierarchy_node_id` referencing `hierarchy_nodes(id)` with composite FK `(organization_id, hierarchy_node_id)`.

### B. Shared Reference Masters (No Node Ownership)
Tables that represent global or organization-wide metadata MUST NOT have a `hierarchy_node_id` column:
- `countries`, `provinces`, `cities`, `areas`, `postal_codes`
- `currencies`, `languages`
- `field_definitions`, `form_schemas`, `system_metadata`
- `banks`, `document_types`, `relationship_types`

---

## 5. Verification Tiers: In-Process PGlite vs. Real Standalone PostgreSQL 16 Daemon

CampusOS tests database security and multi-tenant isolation across two explicit, non-interchangeable tiers:

1. **Tier A — In-Process PostgreSQL-Compatible Integration Tests (PGlite)**:
   * Uses `@electric-sql/pglite` (official PostgreSQL 16 C sources compiled to WASM).
   * Runs locally for fast unit and integration feedback without requiring host Docker or external daemon installation.
   * Explicitly documented as **in-process integration tests**, not a standalone production daemon.

2. **Tier B — Standalone PostgreSQL 16 Daemon Acceptance Gate**:
   * Uses real standalone `postgres:16-alpine` running as a live TCP server process (in GitHub Actions CI container or local Docker).
   * Executed via `packages/database/test/real-postgres-daemon.spec.ts` requiring `REAL_POSTGRES_DATABASE_URL` / `REAL_POSTGRES_ADMIN_URL`.
   * Refuses to silently substitute PGlite; if daemon connection URL is unset, the suite reports `SKIPPED / NOT EXECUTED`.

---

## 6. Audit Trail Architecture & Time-Series Indexing

Audit logging is implemented with high-performance time-series partitioning readiness:
- **Table**: `audit_logs`
- **Columns**: `id`, `organization_id`, `hierarchy_node_id`, `actor_id`, `actor_email`, `impersonator_id`, `module`, `action`, `entity_type`, `entity_id`, `before_state`, `after_state`, `diff`, `outcome`, `ip_address`, `user_agent`, `metadata`, `created_at`.
- **High-Performance B-Tree Indexes**:
  1. `(organization_id, created_at DESC)`: For tenant-isolated time-series range queries and periodic partition pruning.
  2. `(organization_id, entity_type, entity_id)`: For instant record history retrieval.
  3. `(organization_id, hierarchy_node_id)`: For subtree-scoped audit querying (`path <@ :nodePath`).
  4. `(organization_id, actor_id)`: For user activity auditing.
  5. `(organization_id, module, action)`: For administrative event aggregation.

---

## 7. Permanent Scale Target & High-Growth Querying Rules

### A. Non-Negotiable Target Baseline
CampusOS architecture is permanently designed for:
* **1,000+ Schools / Campuses**
* **1,000,000+ Students / Active Users**
* **Thousands of concurrent active users**
* **Tens of millions of operational records**
* **Hundreds of millions of historical / transactional records** over product lifetime

### B. Core Scaling & Querying Rules
1. **Smallest Authorized Scope Execution**:
   * Normal user operations query: `Tenant → Working Context (Campus/School) → Filters → Indexed Query → Bounded Pagination`.
   * Never load whole organization datasets into application memory.
2. **Server-Side Bounded Pagination**:
   * All lists enforce database-level `LIMIT` and `OFFSET` (max 100 per page).
   * Summary card counts and aggregates are computed via single-pass SQL aggregate filters (`COUNT(*) FILTER (WHERE ...)`), never via in-memory array filtering.
3. **Intentional Composite Indexing**:
   * Composite indexes match real query access patterns:
     - `pre_admissions (organization_id, campus_id, submitted_at DESC)`
     - `pre_admissions (organization_id, campus_id, status)`
     - `pre_admissions (organization_id, primary_mobile)`
     - `pre_admissions (organization_id, father_cnic)`
     - `audit_logs (organization_id, created_at DESC)`
4. **Partition-Ready High-Growth Tables**:
   * High-growth tables (`attendance_records`, `fee_transactions`, `accounting_ledgers`, `audit_logs`, `exam_results`) are structured with time-range partitioning keys (`created_at` / `date`) without prematurely creating 1,000 per-campus partitions.
5. **No Premature Distributed Complexity**:
   * Scale Next.js + NestJS + PostgreSQL + Drizzle properly first. Microservices, Kafka, Redis clusters, and Elasticsearch are not introduced prematurely without benchmarked operational justification.


