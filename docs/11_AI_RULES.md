# 11. AI Developer & Agent Governance Rules

---

## 1. Non-Negotiable Invariants for AI Coding Agents

1. **Never Hardcode `campus_id` or `branch_id` on Users or Authorization**:
   * All user location assignments MUST use `membership_node_assignments` linking to `hierarchy_nodes`.
   * Authorization must dynamically evaluate `ltree` hierarchy paths.

2. **Never Weaken RLS or Tenant Isolation**:
   * Never bypass `TenantTransactionManager.runInTenantContext()`.
   * Never execute tenant queries on raw, unscoped database connections.

3. **Enforce Composite Foreign Keys on Tenant Tables**:
   * Every foreign key linking tenant entities must include `organization_id` (e.g. `FOREIGN KEY (organization_id, node_id) REFERENCES hierarchy_nodes(organization_id, id)`).

4. **Enforce Tri-State Permission Precedence**:
   * Always prioritize: `Explicit DENY > Explicit ALLOW > Default DENY`.

5. **Fail-Closed on Auth/Revocation**:
   * If Redis or DB validation fails, **DENY THE REQUEST**. Never allow unverified requests to proceed.

6. **Protect Global Credentials**:
   * Never expose `password_hash`, `mfa_secret_encrypted`, or `security_stamp` in DTOs, logs, or dynamic query builders.

---

## 2. Mandatory Pre-Implementation Checklist (New Module / Feature / Data Table)

Before implementing any new module, feature, page, API endpoint, or data table, explicitly determine and document:

**RULE 1**: Never design CampusOS around a single `user.branch_id` or `user.campus_id`.

**RULE 2**: Every CampusOS feature must respect authorized hierarchy/node scope.

**RULE 3**: Relevant ERP data pages must provide an authorized multi-select Campus/Branch/Node filter. The filter must never offer unauthorized nodes.

**RULE 4**: Relevant node-scoped data tables must visibly include a Campus/Branch/Organizational Unit column identifying the source node of every row.

**RULE 5**: A role alone never grants organization-wide data access. Data access is bounded by the node assignment's data scope.

**RULE 6**: A node assignment alone never grants module/page access. Access requires Role + Module Permission + Page Permission + Action Permission + Data Scope.

**RULE 7**: Head Office, Region, and separate Branch levels are OPTIONAL. The platform must work correctly for all of these structures without fake records:
- Organization → Head Office → Region → School → Branch
- Organization → Head Office → School → Branch
- Organization → School → Branch
- Organization → School (single-location — school IS the node)

**RULE 8**: Never create fake hierarchy nodes (fake Head Office, fake Region, fake Branch) to satisfy application logic.

**RULE 9**: A School may itself be the effective operational node for single-location organizations. Display it contextually as "Campus", "School", or "Location".

**RULE 10**: No downstream administrator may delegate privileges beyond their authorized privilege ceiling. Anti-privilege-escalation is a permanent invariant.

**RULE 11**: Navigation visibility and backend authorization must derive from the same permission model. Always reject at the API; never rely only on hidden navigation.

**RULE 12**: Frontend filters are never security boundaries. Every API endpoint must independently validate requested node IDs against the authenticated user's effective authorized scope.

**RULE 13**: Dashboards, reports, exports, and background jobs must respect the same scope as interactive pages. Never aggregate or expose data outside the user's authorized/selected node scope.

**RULE 14**: When implementing a new module, answer ALL of the following before writing code:
   - **Tenant ownership**: Which `organization_id` owns this record?
   - **Hierarchy/node ownership**: Which `hierarchy_node_id` does this record belong to?
   - **Module permission**: Which module code gates access to this feature?
   - **Page permissions**: Which page-level permission(s) are required?
   - **Action permissions**: What CREATE / READ / UPDATE / DELETE permissions are needed?
   - **Data scope**: EXACT_NODE / HIERARCHY_SUBTREE / ORGANIZATION_WIDE / OWN_RECORDS?
   - **Domain scope**: Are there additional assignments (classes, sections, teachers)?
   - **Campus/Branch column**: Does the data table need a node/campus column?
   - **Campus/Branch filter**: Does the page need an authorized multi-select node filter?

---

## 3. Architectural Audit Patterns (Run These Before Every Major Change)

Agents must search for and reject these patterns when found in new or modified code:

| Pattern | Verdict |
|---|---|
| `user.branch_id` as an authoritative field | ❌ FORBIDDEN |
| `user.campus_id` as an authoritative field | ❌ FORBIDDEN |
| `employee.branch_id` as an authoritative field | ❌ FORBIDDEN |
| `employee.campus_id` as an authoritative field | ❌ FORBIDDEN |
| Hardcoding `HEAD_OFFICE` as a required parent type | ❌ FORBIDDEN |
| Hardcoding `REGION` as a required parent type | ❌ FORBIDDEN |
| Hardcoding `BRANCH` as a required child type | ❌ FORBIDDEN |
| Unrestricted `SELECT *` on tenant tables without `organization_id` filter | ❌ FORBIDDEN |
| Trusting `branchIds` from request without server-side scope validation | ❌ FORBIDDEN |
| Role assigned without delegation ceiling check | ❌ MUST AUDIT |
| Dashboard aggregating data without scope filter | ❌ FORBIDDEN |
| Background worker losing node context from initiating request | ❌ FORBIDDEN |
| Storing credentials inside school/region/branch records | ❌ FORBIDDEN |
| Navigation visibility used as the sole authorization check | ❌ FORBIDDEN |
| Adding generic physical `Delete` to a CRUD page | ❌ FORBIDDEN (Use Deactivate/Archive) |
| Hard delete without `SYSTEM_HARD_DELETE` permission and audit | ❌ FORBIDDEN |
| Storing raw password, hash, or token in audit log | ❌ FORBIDDEN (Must redact) |
| Mutation endpoint without structured audit log emission | ❌ FORBIDDEN |
| Running `next build` while `next dev` is running | ❌ FORBIDDEN (Corrupts .next cache) |
| Declaring UI readiness based only on HTML HTTP 200 | ❌ FORBIDDEN (Must verify CSS/JS via `dev:check`) |

---

## 4. Verification Honesty Rules

* Never claim a PostgreSQL daemon test PASSED without live TCP connection to a real `postgres:16` server.
* Never claim a CI run PASSED without an actual GitHub Actions run ID.
* Clearly distinguish: PGlite (Tier A in-process) vs. PostgreSQL daemon (Tier B standalone).
* Never falsely report tests for infrastructure that does not exist yet — document those as future mandatory acceptance tests instead.
