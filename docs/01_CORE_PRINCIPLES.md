# 01. Non-Negotiable Core Architectural Principles

---

## 1. Principle of Metadata-Driven Extensibility
* **Configure, Don't Customize**: Organizations configure entities, fields, workflows, dashboards, and forms through visual builders without modifying code.
* **Immutable Versioning**: Any modification to a Form, Workflow, or Dynamic Entity Schema creates a new immutable version. Existing historical records remain bound to their creation version.

---

## 2. Principle of Global Identity & Scoped Organization Membership
* **Decoupled Global Identity**: `identity_users` represents a global authentication principal (email, Argon2id password hash, AES-256-GCM encrypted MFA secrets). Global identity possesses **zero implicit access** to any tenant's data.
* **One Organization Membership per Human**: An individual holds exactly one `organization_memberships` record per tenant (`UNIQUE (organization_id, identity_user_id)`).
* **Multi-Persona Profiles**: An organization membership links to one or more domain personas (`employee_profiles`, `student_profiles`, `parent_profiles`). Suspending the membership terminates all tenant access across all personas.
* **Controlled Identity Security Boundary**: Credential columns (`password_hash`, `mfa_secret_encrypted`, `security_stamp`, etc.) are strictly isolated to dedicated authentication services and are physically inaccessible to tenant domain queries, form builders, and dynamic report builders.

---

## 3. Principle of Domain-Neutral Multi-Node Assignments
* **Multi-Node Assignment**: Users/Employees are **never** tied to a single organizational unit. A membership can have simultaneous, time-bound assignments (`membership_node_assignments`) to multiple hierarchy nodes (*Head Office, Region, Campus A, Campus B, Department X*).
* **Multiple Roles per Node Assignment**: Each node assignment can be granted multiple dynamic roles (`assignment_roles`).
* **Zero Hardcoded Node Assumptions**: The authorization kernel has no columns like `campus_id` or `branch_id`. It operates dynamically across arbitrary node trees.
* **Primary Assignment is UX-Only**: `is_primary` is strictly UI/UX landing page metadata and is enforced at the database level by a partial unique index. `is_primary` **never** grants or overrides authorization boundaries.

---

## 4. Principle of Database-Enforced Tenant Consistency
* **Composite Foreign Keys**: All tenant-owned relationship tables enforce composite foreign keys:
  $$\text{FOREIGN KEY (organization\_id, foreign\_id) REFERENCES target\_table(organization\_id, id)}$$
  Cross-tenant relationships (e.g., assigning an Org A role to an Org B assignment) are mathematically impossible at the SQL engine level.
* **PostgreSQL Row-Level Security (RLS)**: Enforced with `FORCE ROW LEVEL SECURITY` on all tenant tables. Every query executes within `TenantTransactionManager` with `SET LOCAL app.current_tenant_id = :tenantId`.

---

## 5. Principle of Defense-in-Depth & Fail-Closed Authorization
* **Tri-State Permission Precedence**:
  $$\mathbf{Explicit\ DENY} \succ \mathbf{Explicit\ ALLOW} \succ \mathbf{Default\ DENY}$$
  An explicit `DENY` rule overrides all sibling `ALLOW` rules.
* **Decoupled Data Scope**: `ORGANIZATION_WIDE` is an explicit grant in `role_permissions` and is **never** inferred from hierarchy naming or "Head Office" assignments.
* **Fail-Closed Session & Revocation Validation**: If Redis or cache validation is unavailable, the server falls back to authoritative PostgreSQL validation. If authoritative PostgreSQL validation cannot be completed, the request **MUST BE DENIED (FAIL CLOSED)**. Never assume validity on error.
* **Append-Only Audit Trail**: All membership state changes, node assignments, role grants, and role revocations generate immutable CDC audit records.
