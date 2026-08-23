# CampusOS Architectural Specification
## 12. Permanent Audit Logging & Safe Record Lifecycle Policy

---

## 1. Executive Summary & Core Invariant

CampusOS is an enterprise multi-tenant Operating System for educational institutions ranging from single-campus independent schools to nationwide multi-regional networks. In educational and enterprise environments, data integrity, security accountability, regulatory compliance, and non-repudiation are non-negotiable invariants.

This specification mandates two foundational pillars:
1. **Enterprise Audit & Activity Logging**: An immutable, tamper-resistant, tenant-isolated, and scope-aware audit trail for all significant business, security, organizational, and administrative actions.
2. **Safe Record Lifecycle & No-Hard-Delete-by-Default Policy**: Educational and organizational data represents historic academic, financial, and operational continuity. Physical deletion is strictly prohibited by default. State transitions (Deactivate, Archive, Cancel, Reverse, Revoke) govern record lifecycles.

---

## 2. The 10 Permanent AI & Developer Rules

Every developer and AI agent working on CampusOS **MUST ALWAYS** follow these 10 permanent rules:

1. **RULE 1: Never automatically add "Delete" to a CRUD page or API endpoint.**
   - Physical deletion is NOT the default action.
   - Standard management UI actions are: `View`, `Edit`, `Activate / Deactivate` (or module-specific lifecycle transitions).

2. **RULE 2: Use explicit domain lifecycle transitions.**
   - Master data (Schools, Branches, Users, Roles) $\rightarrow$ **Deactivate / Activate**
   - Completed terms/years/batches $\rightarrow$ **Archive**
   - Drafts / Unposted transactions $\rightarrow$ **Cancel**
   - Financial ledger entries $\rightarrow$ **Reverse / Credit Note** (Never modify historical ledger)
   - Permissions / Access tokens $\rightarrow$ **Revoke**

3. **RULE 3: Hard Delete is exceptional, strictly guarded, and audited.**
   - Only permitted for ephemeral draft records with zero relational dependencies.
   - Requires explicit `SYSTEM_HARD_DELETE` permission.
   - Must emit a `HARD_DELETE` audit event capturing who authorized the deletion.

4. **RULE 4: All important state-modifying actions must emit structured audit events.**
   - Record creations (`CREATE`), updates (`UPDATE`), status changes (`ACTIVATE`, `DEACTIVATE`), logins (`AUTH_LOGIN`), permission assignments (`ROLE_ASSIGN`), and scope grants (`SCOPE_ASSIGN`).

5. **RULE 5: Strictly NEVER place credentials or secrets in audit or application logs.**
   - Passwords, password hashes, JWT tokens, refresh tokens, MFA secrets, API keys, session cookies, and authorization headers must be sanitized before persistence.
   - Sanitization must be enforced server-side.

6. **RULE 6: Audit events must preserve Tenant and Hierarchy / Node Scope context.**
   - Every log entry records `organization_id` and effective `hierarchy_node_id`.
   - Actions performed at a Branch level carry that Branch's node ID.

7. **RULE 7: Audit log visibility must respect the viewer's authorized data scope.**
   - Branch administrators can only view audit logs within their branch subtree.
   - Head Office administrators can view consolidated audit logs across the network.
   - Cross-tenant log access is impossible (RLS enforced).

8. **RULE 8: Do NOT blindly log harmless read actions or UI clicks.**
   - Do not log GET requests, mouse hovers, tab clicks, or harmless page views.
   - Log only authentications, security evaluations, data modifications, exports, and sensitive view operations.

9. **RULE 9: Design audit records to be compact and scalable.**
   - Updates record only field-level deltas (`diff: { field: { before, after } }`).
   - Do NOT snapshot massive unchanged entity graphs.

10. **RULE 10: Every new module must define its auditable events and record lifecycle before completion.**
    - No business module (Academics, Fees, Admissions, HR) is considered complete without audit integration and defined lifecycle states.

---

## 3. Audit Log Schema & Indexing Architecture

### 3.1 Database Schema (`audit_logs`)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  hierarchy_node_id UUID REFERENCES hierarchy_nodes(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES identity_users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  impersonator_id UUID REFERENCES identity_users(id) ON DELETE SET NULL,
  module VARCHAR(64) DEFAULT 'GENERAL' NOT NULL,
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id UUID NOT NULL,
  before_state JSONB,
  after_state JSONB,
  diff JSONB,
  outcome VARCHAR(32) DEFAULT 'SUCCESS' NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 3.2 High-Performance Indexes

To ensure sub-millisecond query performance over millions of records:

1. **Time-Series & Range Queries**: `idx_audit_logs_org_created (organization_id, created_at DESC)`
2. **Entity Audit Trail**: `idx_audit_logs_org_entity (organization_id, entity_type, entity_id)`
3. **Hierarchy / Branch Scope Filtering**: `idx_audit_logs_org_node (organization_id, hierarchy_node_id)`
4. **Actor Activity Trail**: `idx_audit_logs_org_actor (organization_id, actor_id)`
5. **Module & Action Analytics**: `idx_audit_logs_org_module_act (organization_id, module, action)`

---

## 4. Secret Sanitization Invariant

The `AuditService` recursively sanitizes all JSON payloads prior to database insertion. Any key matching the following regex patterns is replaced with `[REDACTED_SECRET]`:

- `/password/i`
- `/password_hash/i`
- `/secret/i`
- `/token/i`
- `/jwt/i`
- `/mfa/i`
- `/authorization/i`
- `/cookie/i`
- `/session/i`
- `/key/i`
- `/credit_card/i`

---

## 5. Scope-Aware Audit Querying (Ltree Subtree Evaluation)

When a user queries audit logs, their effective data scope is evaluated:
- **Head Office / Tenant-Wide**: Queries matching `organization_id = :tenantId`.
- **Regional / School / Branch Scope**: Evaluates node path $P$. Filters logs where `hierarchy_node_id` is an ancestor or descendant in the hierarchy subtree:
  $$\text{hierarchy\_nodes.path} <@ P$$

---

## 6. Verification & Quality Matrix

| Test Requirement | Verification Method | Status |
|---|---|---|
| Entity Creation Audit Trail | `test/audit-lifecycle.spec.ts` Test 1 | **PASSED** |
| Compact Field Delta Computation | `test/audit-lifecycle.spec.ts` Test 2 | **PASSED** |
| Status Transitions (`ACTIVATE` / `DEACTIVATE`) | `test/audit-lifecycle.spec.ts` Test 3 | **PASSED** |
| Secret & Password Redaction | `test/audit-lifecycle.spec.ts` Test 4 | **PASSED** |
| Cross-Tenant Isolation | `test/audit-lifecycle.spec.ts` Test 5 | **PASSED** |
| Branch/Node Scope Scoping | `test/audit-lifecycle.spec.ts` Test 6 | **PASSED** |
| Immutability & Append-Only API | `test/audit-lifecycle.spec.ts` Test 7 | **PASSED** |
| Zero Delete UI Action Compliance | Web App Code Inspection & Grep | **PASSED** |
