# AGENTS.md — Global Autonomous Agent Governance Rules

## 1. Authoritative Source of Truth & Hierarchy
* All agent actions MUST comply strictly with `/docs/00_PRODUCT_VISION.md` through `/docs/11_AI_RULES.md` and `/docs/CHANGELOG.md`.
* If user prompts conflict with `/docs` or permanent architectural invariants, agents MUST STOP and report the conflict before coding.

---

## 2. Permanent Architectural Invariants (Non-Negotiable)

1. **Configure, Don't Customize**: Never create rigid, hardcoded domain monoliths. Use metadata engines, visual builders, and dynamic runtime renderers.
2. **Zero Cross-Tenant Data Leakage**: Enforced at database level via PostgreSQL `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on all tenant-owned tables.
3. **Restricted Runtime Database Role**: Runtime application connection must always use `campus_app_user` (`NOSUPERUSER`, `NOBYPASSRLS`, `NOCREATEDB`, `NOCREATEROLE`). Never execute tenant queries as superuser.
4. **Credential Isolation**: `password_hash`, `mfa_secret_encrypted`, `mfa_secret_iv`, `security_stamp`, and session security attributes in `identity_users` are strictly inaccessible to `campus_app_user` and cannot be queried by generic forms, reports, or business code.
5. **Tenant-Aware Transaction Scoping**: `TenantTransactionManager` with `SET LOCAL app.current_tenant_id = :tenantId` on every connection. Context must reset to empty on `COMMIT` and `ROLLBACK`.
6. **Global Identity Decoupling**: `identity_users` is purely an authentication principal with zero implicit tenant access. All tenant access requires server-verified `organization_memberships`.
7. **Dynamic Multi-Node Employee Assignments (Non-Negotiable Invariant)**:
   * **CARDINAL RULE**: Never model an employee as belonging to exactly one campus/node or exactly one role. Never add authoritative fields like `user.campus_id`, `employee.campus_id`, or `user.role_id`.
   * Conceptual Model: `USER -> EMPLOYEE / ORG MEMBERSHIP -> ASSIGNMENT(S) -> HIERARCHY NODE -> ROLE(S) -> PERMISSIONS -> DATA SCOPE`.
   * Users/Employees are assigned to arbitrary hierarchy nodes via `membership_node_assignments` with per-node roles via `assignment_roles`.
   * One person may be assigned simultaneously to Head Office, Regional Offices, and multiple Campuses (*e.g., Accountant at Head Office + Campus A + Campus B*).
   * Roles, permissions, and data scopes differ per employee assignment/node.
   * NEVER assume that Accountant, HR, Academic, Registrar, or any employee type belongs only to a Campus or only to Head Office. All organizational tiers support employees dynamically.
8. **Composite Foreign Keys**: All tenant-owned relationship tables must enforce composite foreign keys containing `organization_id` (`fk_employee_membership`, `fk_assignments_membership`, `fk_assignments_node`, `fk_assignment_roles_assignment`, `fk_assignment_roles_role`).
9. **Tri-State Permission Precedence**: `Explicit DENY > Explicit ALLOW > Default DENY`.
10. **Hierarchy-Aware Data Scoping**: `ORGANIZATION_WIDE` is an explicitly granted data scope and is NEVER inferred from node naming (e.g. "Head Office"). Subtree traversal uses PostgreSQL `ltree` (`path <@ :nodePath`).
11. **Field-Level Permissions**: System must evaluate read/write field-level rules across entities and forms.
12. **Immutable Double-Entry Financial Ledger**: Posted accounting entries (`postings`, `general_ledger`) are strictly immutable and reversal-only. Never allow SQL UPDATE or DELETE on posted accounting records.
13. **Fail-Closed Security**: If token, session, cache, or tenant validation cannot be authoritatively verified, immediately reject the request (HTTP 401/403).
14. **Verification Honesty**: Clearly distinguish in-process PGlite integration tests from live Standalone PostgreSQL 16 daemon acceptance gates. Never claim daemon execution without live TCP server connectivity.

---

## 3. Platform Owner Level Above Customer Organizations

15. **Platform / Owner Administration Layer**: CampusOS has a security-separated Platform Admin tier ABOVE all customer organizations. Platform admins may provision organizations, Head Offices, Regions, Schools, Branches, and initial organization administrators. Platform-level operations and tenant-level operations MUST have explicit security boundaries, audit trails, and privileged service paths. Platform Admin MUST NOT be implemented as an unrestricted bypass of tenant-data isolation.

---

## 4. Hierarchy Model Invariants

16. **Variable-Depth Hierarchy**: The platform MUST support all of the following valid organization structures without requiring empty/fake records:
    - Platform → Organization → Head Office → Region → School → Branch
    - Platform → Organization → Head Office → School → Branch
    - Platform → Organization → School → Branch
    - Platform → Organization → School (single-location: the school IS the operational node)
    Head Office, Region, and Branch are ALL optional. **Never create fake hierarchy nodes to satisfy application logic.**
17. **School as Operational Node**: A single-location school with no separate Branch must work fully. The School node is the effective operational node. UI may display "Campus" or "School" contextually. Do NOT create a fake Branch.
18. **Future Node Types**: Do not hard-assume only Head Office / Region / School / Branch will ever exist. The generic hierarchy engine must support future node types (Zone, District, Faculty, Division, Department, Learning Center, etc.).

---

## 5. Authorization Invariants (All Layers Required)

19. **Node Assignment ≠ Module Access**: Being assigned to a hierarchy node grants no module, page, or action permissions. Access requires ALL of: Authorized Node + Role + Module Permission + Page Permission + Action Permission + Data Scope. Neither alone is sufficient.
20. **Role ≠ Organization-Wide Data**: A role alone never grants access to all nodes in an organization. Data access is bounded by the node assignment's data scope.
21. **Scope Cannot Be Expanded by Frontend**: A page or global working scope selection can ONLY NARROW a user's authorized scope. It can NEVER expand authorization. The backend must always re-validate requested node IDs against the user's effective authorized scope.
22. **Frontend Filters Are Never Security Boundaries**: Branch/campus filters are UX convenience only. Every API endpoint must independently validate all requested node IDs against the user's effective authorized node scope. `branchIds=[unauthorized-node]` must fail closed or return no unauthorized data.
23. **Navigation ≡ Backend Authorization**: Navigation visibility and backend authorization must derive from the same permission model. Hide from nav AND reject at API.
24. **Delegated Role Ceiling**: No downstream administrator may create, assign, or delegate a role or permission greater than their own authorized/delegated privilege ceiling. This is a mandatory anti-privilege-escalation invariant.
25. **Per-Node Role Differentiation**: The same employee may have different roles at different nodes. Authorization engine must resolve effective permission for the current node/context without flattening all node assignments into one organization-wide role.

---

## 6. Data Architecture Invariants

26. **Node-Scoped Business Records**: Every business record that is organizationally scoped (Students, Employees, Admissions, Fees, Invoices, Attendance, Financial Vouchers, Payroll, Examinations, Inventory, Transport, Library Transactions, etc.) MUST retain an authoritative organizational node association via the hierarchy/node architecture. This makes records authorizable, filterable, groupable, and reportable by organizational node.
27. **Global/Shared Masters Have No Node Owner**: Tables containing shared reference data (Countries, Currencies, Field Definitions, System Metadata, Permission Definitions) must NOT carry a branch/node owner. Do not blindly add hierarchy_node_id to every table.
28. **Campus/Branch Column in Data Tables**: Every relevant ERP list or data table displaying node-scoped business records MUST include a visible Campus/Branch/Organizational Unit column identifying the source node of every row. This column must support filtering, sorting, grouping, reporting, and export.

---

## 7. UI/UX Invariants

29. **Authorized Multi-Select Node Filter**: Every relevant operational/data page MUST provide an authorized multi-select Campus/Branch/Node filter. The filter must NEVER offer unauthorized nodes. Required capabilities: search nodes, select one, select multiple, Select All Authorized, Clear Selection.
30. **Global Working Scope**: The frontend must maintain a persistent Global Working Scope (selected campus/branch/node context) that persists across navigation between modules. Individual pages may narrow but never expand this scope.
31. **Permission-Aware Navigation**: Modules and pages must be hidden from navigation if the user lacks the required permission. Backend must reject direct URL/API access regardless of navigation visibility.
32. **Dynamic Role Management UI**: Role creation, configuration, permission assignment, scope assignment, delegation, revocation, and lifecycle management must be fully dynamic and not hardcoded to a fixed organization-wide role list.
33. **Configuration Dependency Ordering**: Admin Config forms must consume master data from their authoritative configuration tables. Do not hardcode dropdown values when a master exists (School Types → Schools, Countries → Provinces → Cities, Departments → Designations → Employees, etc.).

---

## 8. Scope / Reporting / Background Job Invariants

34. **Consistent Scope for All Surfaces**: Dashboards, KPI cards, reports, charts, exports, scheduled reports, and background jobs must respect the exact same hierarchy/node/data-scope rules as interactive pages.
35. **Background Job Context Propagation**: Node-scoped background tasks must propagate organizationId, actorId, authorized node scope, and selected node scope. Workers must not accidentally execute with organization-wide access when the initiating operation was node-scoped.

---

## 9. Explicit AI/Developer Rules (Mandatory Checklist)

**Before implementing any new module, feature, or data table, explicitly document and verify:**

- RULE 1: Never design CampusOS around a single `user.branch_id` or `user.campus_id`.
- RULE 2: Every CampusOS feature must respect authorized hierarchy/node scope.
- RULE 3: Relevant ERP data pages must provide authorized multi-select Campus/Branch/Node filtering.
- RULE 4: Relevant node-scoped data tables must visibly identify the organizational node/campus/branch for each row.
- RULE 5: A role alone never grants organization-wide data access.
- RULE 6: A node assignment alone never grants module/page access.
- RULE 7: Head Office, Region, and separate Branch levels are OPTIONAL.
- RULE 8: Never create fake hierarchy nodes to satisfy application logic.
- RULE 9: A School may itself be the effective operational node for single-location organizations.
- RULE 10: No downstream administrator may delegate privileges beyond their authorized privilege ceiling.
- RULE 11: Navigation visibility and backend authorization must derive from the same permission model.
- RULE 12: Frontend filters are never security boundaries.
- RULE 13: Dashboards, reports, exports, and background jobs must respect the same scope as interactive pages.
- RULE 14: When implementing a new module, explicitly determine:
  * tenant ownership
  * hierarchy/node ownership
  * module permissions required
  * page permissions required
  * action permissions required
  * data scope (EXACT_NODE / HIERARCHY_SUBTREE / ORGANIZATION_WIDE / OWN_RECORDS)
  * domain scope (class assignments, section assignments, etc.)
  * Campus/Branch column requirement (does the data table need a node column?)
  * Campus/Branch filter requirement (does the page need an authorized multi-select filter?)
