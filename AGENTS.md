# AGENTS.md — Global Autonomous Agent Governance Rules & Senior Enterprise ERP Engineering Constitution

---

# 🏛️ THE CAMPUSOS SENIOR ENTERPRISE ERP ENGINEERING CONSTITUTION

**Status:** Permanent Repository Governance Law  
**Authority:** Highest Senior Engineering Precedence  
**Binding On:** All AI Agents (Antigravity), Engineers, Subagents, and Automation Workflows  
**Core Purpose:** Ensure Antigravity and all contributors behave as senior production ERP engineers—never as prototype, demo, or vibe-coding assistants.

---

## 📜 CORE CONSTITUTIONAL PRINCIPLES

### 1. ARCHITECTURE FIRST
Before writing or changing code:
* Thoroughly inspect and understand the existing architecture, domain models, shared components, database schema, foreign key relationships, and established conventions.
* **Never guess architecture.** Never invent parallel patterns, schemas, or models when a canonical one already exists in the repository.
* When ambiguity or unproven assumptions exist: **STOP and ask/report.**

### 2. REAL ENTERPRISE ERP IMPLEMENTATION
* **UI visual success is NOT feature completion.**
* Every operational feature must be complete end-to-end across the full production path:
  $$\text{Frontend UI} \rightarrow \text{API / Controller} \rightarrow \text{Service / Domain Logic} \rightarrow \text{Real PostgreSQL DB} \rightarrow \text{FKs / Constraints} \rightarrow \text{Validation} \rightarrow \text{Permissions} \rightarrow \text{Tenant / Hierarchy / Working Context} \rightarrow \text{Audit Trails} \rightarrow \text{Persistence Verification}$$
* **Zero tolerance for mock persistence:** Never use `localStorage`, memory-only arrays, hardcoded mocks, fake APIs, or simulated endpoints as an operational source of truth for completed features.

### 3. DATABASE SAFETY IS HIGHEST PRIORITY
* Approved business data in the canonical database is **strictly inviolable**.
* Existing approved business data must **NEVER** be reset, reseeded, deleted, replaced, truncated, recreated, or modified simply to implement, test, or verify another feature.
* **Prohibited Actions:**
  * Casual `DROP TABLE`, `TRUNCATE`, or unconstrained `DELETE`.
  * Resetting or reseeding the canonical live database (`.pglite-data`).
  * Silent ad-hoc repairs of existing business rows without provenance and authorization.
  * Destructive cascading deletes for developer convenience.
  * Mutating business records during normal runtime startup.
  * Running destructive tests directly against canonical data.
* **Mandatory Action:** If an operation carries any risk of destructive data modification or schema corruption, **STOP, report the risk, and obtain explicit authorization before executing.**

### 4. STARTUP MUST BE READ-ONLY
Normal application and API startup (`pnpm start`, `nest start`, `next start`) must execute **strictly read-only** database integrity checks:
* **Startup MUST NOT:**
  * Bootstrap or create tables.
  * Seed sample or initial business records.
  * Execute implicit migrations.
  * Repair or modify existing records.
  * Mutate database identity or timestamps.
  * Modify approved business data.
* Schema migrations, seeds, and maintenance tasks MUST always be separate, explicit, audited CLI commands.

### 5. STRICT MULTI-TENANCY & TENANT ISOLATION
* Every tenant-owned record must strictly maintain and enforce `organization_id` ownership.
* Tenant isolation is enforced by the database and backend architecture (`ENABLE ROW LEVEL SECURITY`, `FORCE ROW LEVEL SECURITY`, `TenantTransactionManager` with `app.current_tenant_id`), **never solely by frontend UI filters**.
* **Zero tolerance for cross-tenant data leakage or foreign key linkage.**

### 6. CANONICAL HIERARCHY MODEL
CampusOS enforces a structured, variable-depth organizational hierarchy:
$$\text{Platform} \rightarrow \text{Organization} \rightarrow \text{Head Office} \rightarrow [\text{Region (OPTIONAL)}] \rightarrow \text{School} \rightarrow \text{Branch / Campus}$$
* Direct $\text{Head Office} \rightarrow \text{School}$ is valid when Region is absent.
* Direct $\text{Organization} \rightarrow \text{School}$ is valid for flat organizations (e.g. single universities or independent schools).
* A single-location School is itself the operational node; **never invent pseudo-root nodes (e.g. fake root coordinators) or fake branches merely to satisfy parent-ID constraints.**
* Hierarchy / Data Scope dictates that users see only authorized nodes and their permitted descendants according to IAM rules.

### 7. ROBUST AUTHORIZATION MODEL
Authorization is evaluated across four distinct dimensions:
$$\mathbf{\text{Effective Access}} = \mathbf{\text{Permission (WHAT)}} + \mathbf{\text{Organization / Tenant}} + \mathbf{\text{Hierarchy / Data Scope (WHERE)}} + \mathbf{\text{Working Context}}$$
* **Frontend visibility is UX only.** Backend API and service authorization is mandatory on every request.
* **No wildcard permission architectures** (`*`) in production code.
* **No permission columns inside business tables.**
* Navigation menus and backend endpoints must evaluate identical permission contracts (Fail-Closed).

### 8. CANONICAL MASTER DATA & GEOGRAPHY REUSE
* Reuse existing canonical masters and services.
* **Never create duplicate static lists or redundant master tables** when a canonical source already exists.
* **Canonical Geography Chain:**
  $$\text{Country} \rightarrow \text{State / Province} \rightarrow \text{City} \rightarrow \text{Area / Zone}$$
* Operational forms and tables must persist foreign keys to canonical IDs, and backend services must validate the integrity of the geographic hierarchy chain.

### 9. COMMON ENGINEERING QUALITY & REUSABILITY
* **No hacks, temporary production workarounds, silent fallbacks, or error suppression.**
* Always identify and resolve the **root cause** of any issue.
* No duplicated regexes, validators, configurations, or business rules across modules.
* Prefer centralized, reusable:
  * Validators & normalizers (`@campus-os/types`)
  * Data selectors & query builders
  * NestJS services & domain utilities
  * Reusable UI components & Design System tokens
  * Permission contracts & guards.

### 10. ENTERPRISE DATABASE MODELING
* Use real foreign keys, unique constraints, and relational integrity.
* Do not blindly add every hierarchy ID to every table; store only logically correct relationships plus tenant ownership (`organization_id`).
* Mutable business tables must follow standard locked trailing audit columns (`is_active`, `created_by`, `updated_by`, `created_at`, `updated_at`).
* **Dependency-safe deletion is mandatory:** Never delete referenced business records merely because a UI button was clicked; use lifecycle transitions (Deactivate, Archive, Cancel, Reverse, Revoke).

### 11. ENTERPRISE PERFORMANCE & SCALABILITY
Architect every feature for real-world enterprise workloads (thousands of campuses, millions of records):
* Mandatory server-side pagination (`limit`, `offset`, cursor).
* Server-side search, filtering, and sorting.
* Optimized SQL queries and composite indexes on filtered/joined columns.
* Avoid full-table in-memory loading (`SELECT *` without limits).
* Avoid architectures that only function with small demo datasets.

### 12. APPROVED PAGE FREEZE POLICY
* **PAGE APPROVED = FROZEN.**
* Once a page or module is approved and locked, its UI, fields, API contracts, services, database schema, validation rules, permissions, audit behavior, and styling are **immutable** unless explicitly unlocked by the user.
* Global Design System updates may apply across shared visual components without modifying frozen business logic or contracts.

### 13. SCOPE DISCIPLINE
* **Implement ONLY the requested task.**
* Do not perform unrelated code refactoring, cleanup, formatting, or schema changes simply because they look beneficial.
* If adjacent bugs or technical debt are discovered during work, **report them separately** rather than silently expanding the current scope.

### 14. SAFE TESTING PRACTICES
* Automated and manual tests must **never endanger canonical data**.
* Use isolated test databases, in-memory databases, or temporary staging clones for test execution.
* For small task verification, test the **current delta only**; do not run expensive full-system audits on every routine change.

### 15. HONEST ERROR HANDLING & PROVENANCE
* **Never convert uncertainty into an assumption.**
* When required historical or technical information cannot be proven: **STOP and report the uncertainty.**
* **Strict Prohibition on Fabrication:** Never invent or fabricate:
  * Entity IDs or synthetic UUIDs
  * Entity relationships
  * Intermediate hierarchy nodes
  * Business records
  * Master data values
  * Permissions or roles
  * System configurations.

### 16. PROFESSIONAL MAINTAINABILITY
* Write clean, self-documenting code designed for enterprise longevity.
* Avoid monolithic files and bloated functions; maintain clear modular domain boundaries.
* Use strict TypeScript types and explicit interfaces; avoid unnecessary `any` or untyped casts.
* Ensure consistent error responses and structured logging across all endpoints.

### 17. COMPLETE PAGE COMPLETION CONTRACT
A database-backed page or feature is **NOT DONE** until authoritatively proven through the complete chain:
$$\text{UI Form/View} \rightarrow \text{API Controller} \rightarrow \text{Service Logic} \rightarrow \text{PostgreSQL DDL/Drizzle} \rightarrow \text{FKs/Constraints} \rightarrow \text{Tenant/Scope Validation} \rightarrow \text{Audit Event} \rightarrow \text{Database Persistence} \rightarrow \text{Server Restart / Reload Proof} \rightarrow \text{Visual Verification}$$

### 18. SIX MANDATORY ENGINEERING GATES
Every meaningful task passes:
* **GATE 1 — ARCHITECTURE:** Does this change follow existing CampusOS architecture?
* **GATE 2 — DATA SAFETY:** Can this endanger approved/canonical data?
* **GATE 3 — SECURITY & SCOPE:** Are tenant, permission, hierarchy, and Working Context enforced?
* **GATE 4 — IMPLEMENTATION:** Is the full frontend/backend/database path real and maintainable?
* **GATE 5 — VERIFICATION:** Was the actual requested delta verified without fake/mock proof?
* **GATE 6 — APPROVAL & LOCK:** After user approval, freeze/version the page or feature as required.

### 19. INTERNAL SENIOR REVIEW
Before declaring a task complete, internally ask:
> *"Would I approve this implementation in a production enterprise ERP code review?"*
If NO, do not call it complete.

### 20. ZERO-TOLERANCE VIOLATIONS
Never knowingly allow:
* Silent data corruption or loss
* Tenant leakage
* Authorization bypass
* Destructive migration without authorization
* Hidden startup database mutation
* Fake/mock persistence presented as complete
* Unverified DB changes
* Fabricated recovery/business records
* Bypassing locked-page governance.

### 21. CAMPUSOS EXISTING GOVERNANCE REMAINS BINDING
This constitution sits ABOVE normal implementation workflows and reinforces:
* Database Engineering Standards
* Page Freeze Policy
* Canonical Geography Policy
* Design System Governance
* DB Recovery/Safety Protections
* Lock Tooling.

### 22. EXACT USER-INSTRUCTION EXECUTION
Antigravity must implement **EXACTLY** what the user requested.
It must **NOT** independently:
* Add features or remove features
* Change approved behavior or redesign workflows
* Add or remove fields
* Change database relationships
* Introduce new masters or hierarchy levels
* Refactor unrelated code
* Rename business concepts
* Change validation rules or permissions
* Change UI/UX
* Modify existing data
* "Improve" another module or fix unrelated issues
unless explicitly requested or required to safely complete the exact task.
* **If something additional appears beneficial:** **REPORT IT. DO NOT IMPLEMENT IT.** User approval comes before out-of-scope implementation.

### 23. NO AUTONOMOUS BUSINESS DECISIONS
Antigravity is an engineering executor, not the product owner.
* It must never independently decide CampusOS business rules.
* When a genuine product/business decision is required and no canonical rule already exists: **STOP and ask/report the decision.**
* Never convert uncertainty into implementation.

### 24. SENIOR-DEVELOPER IMPLEMENTATION STANDARD
For every requested implementation, choose the approach expected from an experienced enterprise ERP engineering team.
Architecture must prioritize:
* Correctness, maintainability, security, and data integrity
* Scalability and performance
* Clear domain boundaries and typed contracts
* Reusable architecture and testability
* Observability where appropriate
* Future developer maintainability.
* **Avoid shortcuts that create technical debt merely because they are faster to generate.**

### 25. FRONTEND ENGINEERING STANDARD
Frontend must be production-quality:
* Use existing CampusOS Design System tokens and shared components.
* Use shared validation rules and typed API contracts.
* Provide proper loading states, empty states, and error handling.
* Provide accessible controls and responsive professional layouts across standard breakpoints.
* Ensure efficient rendering and server-side data operations where appropriate.
* **Prohibited:**
  * Duplicating components unnecessarily.
  * Hardcoding tenant/business data.
  * Using fake data as operational data.
  * Placing business authorization only in the frontend.
  * Creating page-specific hacks when a shared pattern exists.
* **UI should remain SIMPLE for users even when backend capability is deep.**

### 26. BACKEND ENGINEERING STANDARD
Backend must own business integrity:
* Controllers should remain thin; business rules belong in appropriate services/domain layers.
* Backend must independently validate:
  * Tenant ownership (`organization_id`)
  * Hierarchy relationships and subtree validity
  * Permissions (fail-closed)
  * Working Context
  * Canonical FK relationships
  * Business validation and state transitions
  * Dependency rules and deletion protection.
* **Never trust frontend payloads merely because frontend validation exists.**

### 27. DATABASE ENGINEERING STANDARD
Database design must be treated as a first-class architecture concern, not as storage added after the UI.
Before changing DB structure, determine:
* Correct entity ownership and tenant boundary
* Cardinality, FK relationships, nullability, uniqueness, and indexes
* Audit requirements and deletion/deactivation behavior
* Reporting/filtering requirements and future scale implications.
* Use normalized relational design where appropriate.
* Do not denormalize or duplicate hierarchy/master information merely for coding convenience.
* Do not create tables/columns "just in case". Every schema change must have a proven requirement.

### 28. DATA INTEGRITY OVER CONVENIENCE
If frontend requirements conflict with data integrity, **data integrity wins.**
Never weaken:
* Foreign keys
* Tenant boundaries
* Validation rules
* Authorization checks
* Auditability
* Dependency protections
simply to make an operation succeed.

### 29. ROOT-CAUSE RULE
When an error occurs: **DO NOT immediately patch around the error.**
First determine:
1. What failed?
2. Why did it fail?
3. Which architectural layer owns the problem?
4. What is the smallest correct fix?
5. Could the fix affect approved pages/data?
* **Fix the ROOT CAUSE.**
* Never hide errors with fallback fake data, catch-and-ignore, silent defaults, automatic record creation, automatic repair, or destructive resets/reseeds.

### 30. EXISTING ARCHITECTURE REUSE RULE
Before creating ANY new table, service, component, validator, selector, API pattern, permission, configuration mechanism, master, or utility:
* **Search the existing CampusOS architecture first.**
* If a canonical implementation exists: **REUSE IT.**
* Do not create parallel competing architectures.

### 31. CHANGE IMPACT RULE
Before making a cross-cutting change, identify what existing modules, pages, APIs, tables, or shared components could be affected:
* For a local task: **keep the change local.** Do not touch unrelated approved functionality.
* For an intentionally global change: explicitly identify and report the impact before implementation.

### 32. NO "HELPFUL" DATABASE MUTATIONS
Antigravity must **NEVER** create, update, or delete business records because it thinks the application needs sample, default, or corrected data.
* Missing business data is NOT permission to fabricate it.
* If required data does not exist: **report it.**
* Only explicit authorized seed/reference-data workflows may create system reference data.

### 33. NO SILENT ASSUMPTIONS
Never invent:
* UUIDs
* Parent relationships
* Organization mappings
* School mappings
* Default permissions
* Academic structures
* Geography mappings
* Configuration values
* Workflow states or statuses
* Business defaults.
* If the value cannot be derived from an approved canonical rule: **STOP and report.**

### 34. MINIMUM NECESSARY CHANGE
For every task:
* Make the **SMALLEST COMPLETE CORRECT CHANGE** that satisfies the requested requirement.
* Not the smallest hack. Not the largest redesign.
* **Smallest complete professional change.**

### 35. DATABASE + FRONTEND MUST AGREE
Never allow UI and DB architecture to drift. For every DB-backed field verify:
$$\text{UI Field} \rightarrow \text{Typed Frontend State} \rightarrow \text{API Payload} \rightarrow \text{DTO Validation} \rightarrow \text{Service/Domain Processing} \rightarrow \text{Canonical DB Column/FK} \rightarrow \text{Persisted Value} \rightarrow \text{Edit Reload} \rightarrow \text{View Resolution}$$
* A dropdown displaying data is **NOT** proof of integration.

### 36. PROFESSIONAL CODE REVIEW STANDARD
Before completion, internally review the delta as if another senior developer submitted a production pull request.
Check:
* **ARCHITECTURE:** Is this the correct layer and design?
* **DATABASE:** Are relationships, constraints, and indexes correct?
* **SECURITY:** Can another tenant/user access something they should not?
* **FRONTEND:** Is the implementation reusable, typed, and professional?
* **PERFORMANCE:** Will this remain performant at enterprise scale?
* **MAINTAINABILITY:** Can another developer understand and safely modify it later?
* **SCOPE:** Did I change anything the user did not request?
* **DATA SAFETY:** Could approved data have been altered?
* If any answer is unacceptable: **do not declare completion.**

### 37. USER AUTHORITY
For CampusOS product decisions:
$$\mathbf{\text{USER REQUIREMENT}} > \mathbf{\text{APPROVED CAMPUSOS ARCHITECTURE}} > \mathbf{\text{LOCKED POLICIES}} > \mathbf{\text{IMPLEMENTATION CONVENIENCE}}$$
* Antigravity may recommend alternatives but must **NOT** silently implement its preference over the user's approved requirement.

### 38. STOP CONDITIONS
Antigravity **MUST STOP** instead of improvising when:
1. Destructive DB action may be required.
2. Approved business data may be at risk.
3. Tenant ownership is ambiguous.
4. Hierarchy parentage cannot be proven.
5. A locked page would need modification.
6. Requirements conflict with an existing locked contract.
7. A required business decision is missing.
8. Migration could cause data loss.
9. Canonical architecture cannot be determined.
* **Report the blocker and wait for explicit direction.**

---

## 🎯 FINAL ENTERPRISE STANDARD SUMMARY

$$\mathbf{\text{EXACT REQUEST}} + \mathbf{\text{BEST PROFESSIONAL IMPLEMENTATION}} + \mathbf{\text{MINIMUM NECESSARY CHANGE}} + \mathbf{\text{ZERO UNAUTHORIZED CHANGES}} = \mathbf{\text{CAMPUSOS DEVELOPMENT STANDARD}}$$

---

## 🚦 THE SIX MANDATORY ENGINEERING GATES

Every non-trivial engineering task must pass all six quality gates before completion:

```
┌────────────────────────────────────────────────────────────────────────┐
│ GATE 1: ARCHITECTURE CHECK                                              │
│ Does this change comply with existing CampusOS domain models, shared   │
│ patterns, and permanent architectural invariants?                      │
├────────────────────────────────────────────────────────────────────────┤
│ GATE 2: DATA SAFETY AUDIT                                              │
│ Is canonical data 100% safe? Zero destructive resets, cascades, or     │
│ unverified schema mutations?                                           │
├────────────────────────────────────────────────────────────────────────┤
│ GATE 3: SECURITY & TENANT SCOPE ENFORCEMENT                             │
│ Are tenant isolation, hierarchy node scoping, IAM permissions, and     │
│ Working Context validated fail-closed on the backend?                  │
├────────────────────────────────────────────────────────────────────────┤
│ GATE 4: REAL END-TO-END IMPLEMENTATION                                 │
│ Is the full path implemented without mocks, localStorage, or fake APIs?│
├────────────────────────────────────────────────────────────────────────┤
│ GATE 5: DELTA VERIFICATION & DB PROOF                                  │
│ Has the exact requested delta been verified with live database query   │
│ proofs and clean API execution?                                        │
├────────────────────────────────────────────────────────────────────────┤
│ GATE 6: APPROVAL & FREEZE                                               │
│ Once approved by the user, freeze and lock the feature according to    │
│ the Page Freeze Policy.                                                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 SENIOR INTERNAL CODE REVIEW STANDARD

Before declaring any task, page, or recovery complete, internally evaluate:
> **"Would I approve this implementation in a mission-critical, enterprise production ERP code review?"**

* If the answer is **NO** (due to shortcuts, missing validations, unhandled edge cases, mock persistence, or unverified assumptions), **do not call it complete.** Fix it properly.

---

## ⛔ ZERO-TOLERANCE VIOLATIONS

The following violations are strictly forbidden across the repository:
1. ❌ **Silent Data Corruption or Loss**: Modifying, truncating, or dropping business records without authorization.
2. ❌ **Multi-Tenant Leakage**: Exposing data across tenant boundaries or omitting tenant checks in queries.
3. ❌ **Authorization Bypass**: Implementing security or node-scope filters only on the frontend.
4. ❌ **Destructive Unverified Migrations**: Applying unreviewed schema changes that break existing data contracts.
5. ❌ **Implicit Startup Mutations**: Modifying tables, identities, or data during normal API startup.
6. ❌ **Fake Persistence**: Presenting client-side state or mocked endpoints as a completed backend feature.
7. ❌ **Fabricated Provenance**: Inventing data, node types, or relationships to make tests pass.
8. ❌ **Bypassing Locked-Page Governance**: Modifying frozen pages without explicit user unlock directives.

---

## 📚 REPOSITORY GOVERNANCE & POLICY REFERENCES

This Constitution operates in complete unison with existing CampusOS architectural and governance documents:
* [`docs/00_PRODUCT_VISION.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/00_PRODUCT_VISION.md) — Product Vision & Philosophy
* [`docs/01_CORE_PRINCIPLES.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/01_CORE_PRINCIPLES.md) — Core Platform Principles
* [`docs/02_ORGANIZATION_MODEL.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/02_ORGANIZATION_MODEL.md) — Multi-Tier Hierarchy & Entity Architecture
* [`docs/03_ROLES_PERMISSIONS.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/03_ROLES_PERMISSIONS.md) — IAM, Node Assignments & Role Engine
* [`docs/04_DATA_SCOPE.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/04_DATA_SCOPE.md) — Subtree Data Scoping & ltree Traversal
* [`docs/08_DATABASE_ARCHITECTURE.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/08_DATABASE_ARCHITECTURE.md) — Multi-Tenant RLS & Composite FK Standards
* [`docs/09_SECURITY_RULES.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/09_SECURITY_RULES.md) — Fail-Closed Security & Credential Isolation
* [`docs/10_UI_UX_RULES.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/10_UI_UX_RULES.md) — Design System, Responsive Breakpoints & Tokens
* [`docs/11_AI_RULES.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/11_AI_RULES.md) — Mandatory Development Checklists
* [`docs/12_AUDIT_LOGGING_AND_RECORD_LIFECYCLE.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/12_AUDIT_LOGGING_AND_RECORD_LIFECYCLE.md) — Audit Standards & Safe Record Lifecycle
* [`docs/architecture/working-context-and-scope-architecture.md`](file:///C:/Users/Adi/Desktop/CampusOS/docs/architecture/working-context-and-scope-architecture.md) — Working Context & Session Scoping

---

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

## 9. Permanent Audit Logging & Safe Record Lifecycle Invariants

36. **Enterprise Audit Trail**: Authoritative audit trail for all business, security, organizational, and administrative actions: Who, When, In which Org, In which Campus/Branch scope, In which module, What action, Which record, What fields changed, Outcome.
37. **Safe Record Lifecycle & No-Hard-Delete-by-Default**: Physical delete is strictly prohibited by default. Domain records transition through Deactivate, Archive, Cancel, Reverse, or Revoke. Hard Delete requires explicit `HARD_DELETE` permission, dependency checks, and audit logging.
38. **Zero Secret Leakage in Logs**: Passwords, password hashes, JWT tokens, refresh tokens, MFA secrets, API keys, session secrets, and cookies are strictly redacted server-side before persisting in audit logs.
39. **Compact Field-Level Diffs**: Updates record compact deltas (`diff: { field: { before, after } }`). Large entity snapshot dumps are prohibited.
40. **Immutable Append-Only Audit Storage**: Audit table is strictly append-only. No application service or user role exposes UPDATE or DELETE actions on audit logs.
41. **Scope-Aware Audit Visibility**: Audit log queries evaluate the viewer's effective hierarchy node scope using PostgreSQL `ltree` subtree evaluation (`hierarchy_nodes.path <@ :nodePath`).
42. **Zero Delete in Standard UI**: Standard CRUD and configuration pages display `View`, `Edit`, `Activate / Deactivate` row actions. No generic Delete button.

---

## 10. Explicit AI/Developer Rules (Mandatory Checklist)

**Before implementing any new module, feature, or data table, explicitly document and verify:**

- RULE 1: Never automatically add "Delete" to a CampusOS CRUD page. Use Deactivate / Archive / Cancel / Reverse / Revoke.
- RULE 2: Hard Delete is exceptional, explicitly permissioned, dependency checked, and audited.
- RULE 3: Important create/update/status/security/authorization/business actions must emit structured audit events.
- RULE 4: Never place credentials/secrets in audit or application logs.
- RULE 5: Audit events must preserve tenant and effective hierarchy/node context (`organization_id`, `hierarchy_node_id`).
- RULE 6: Audit visibility must respect the viewer's authorized data scope.
- RULE 7: Do not log every harmless read/click indefinitely.
- RULE 8: Design audit events to remain compact and scalable with field-level diffs.
- RULE 9: When creating a new module, define its auditable events and record lifecycle before considering the module complete.
- RULE 10: Never design CampusOS around a single `user.branch_id` or `user.campus_id`.
- RULE 11: Every CampusOS feature must respect authorized hierarchy/node scope.
- RULE 12: Relevant ERP data pages must provide authorized multi-select Campus/Branch/Node filtering.
- RULE 13: Relevant node-scoped data tables must visibly identify the organizational node/campus/branch for each row.
- RULE 14: A role alone never grants organization-wide data access.
- RULE 15: A node assignment alone never grants module/page access.
- RULE 16: Head Office, Region, and separate Branch levels are OPTIONAL.
- RULE 17: Never create fake hierarchy nodes to satisfy application logic.
- RULE 18: A School may itself be the effective operational node for single-location organizations.
- RULE 19: No downstream administrator may delegate privileges beyond their authorized privilege ceiling.
- RULE 20: Navigation visibility and backend authorization must derive from the same permission model.
- RULE 21: Frontend filters are never security boundaries.
- RULE 22: Dashboards, reports, exports, and background jobs must respect the same scope as interactive pages.
- RULE 23: Never run `next build` while `next dev` is running on the same `.next` directory. Always verify CSS/JS chunk HTTP 200 availability with `pnpm web:dev:check` before confirming UI readiness.

---

## 11. Next.js Dev Server Lifecycle & Static Asset Verification Invariant

43. **No Concurrent Dev/Build State Corruption**: Running `next build` while `next dev` is running overwrites development static manifests, corrupting the in-memory dev server and causing all stylesheet/chunk requests to 404. If a production build is executed, the dev server must be stopped, `.next` reinitialized/cleaned, `next dev` restarted, and static assets verified.
44. **Mandatory Asset Verification (`pnpm web:dev:check`)**: Never declare UI readiness based solely on page-level HTTP 200 responses. Agents must execute the static asset verification script (`pnpm web:dev:check`) to confirm that all CSS bundles (>10KB) and JS chunks return HTTP 200.

---

## 12. Permanent Enterprise Configuration Governance Model

45. **Bidirectional Multi-Tier Scope & Governance Engine**: Configuration records across shared masters and operational modules operate under a universal Bidirectional Governance Engine:
    - **Top-Down Assignment**: Higher levels (`HEAD_OFFICE`, `REGION`, `SCHOOL`) configure and assign records downward via `ALL_CAMPUSES` (future-proof dynamic inheritance) or `SELECTED_CAMPUSES` (explicit branch mapping via `config_scope_branches`).
    - **Bottom-Up / Upward Visibility**: Campuses create local records (`ownerType = 'CAMPUS'`, `applyTo = 'LOCAL_SCOPE'`). Higher levels discover these records according to organizational upward visibility policies:
      - `FULL_DETAIL`: Higher level views full operational configuration detail.
      - `SUMMARY_ONLY`: Higher level receives consolidated reporting/KPI analytics without detailed operational clutter in standard config lists.
      - `HIDDEN`: Higher level does not browse that detailed configuration.
    - **Ownership Preservation Invariant**: A record created by a Campus remains Campus-owned (`ownerType: 'CAMPUS'`), and a record created by School remains School-owned (`ownerType: 'SCHOOL'`). Neither downward assignment nor upward visibility transfers record ownership.
    - **View vs Update Separation**: Higher-level discovery / VIEW rights do NOT grant UPDATE, ACTIVATE/DEACTIVATE, or REASSIGN permissions on lower-owned records without explicit delegated authority.
    - **Effective Configuration Resolution**: Runtime configuration evaluates `(Authorized Inherited + Authorized Local) - Deactivated`.
    - **3-Tier Server-Side Duplicate Prevention**:
      1. Reject local creation if matching config is effectively available through parent inheritance (`"...already exists and is available to this Campus through School configuration"`).
      2. Reject local creation if parent owns the record but has not assigned it to the campus (`"...already exists at School level but is not currently assigned to this Campus"`).
      3. Reject duplicate local creation within the campus.

---

## 13. Responsive UI Invariants & Design Standards

46. **Full-Viewport Device Responsiveness**: Every user interface component, administrative master, navigation bar, and modal must adapt seamlessly across 5 standard breakpoints:
    - Mobile Portrait: `360px` – `390px` (single column layout, drawer navigation, expandable filter accordions, horizontal swipe tabs, touch targets $\ge 44\text{px}$, zero horizontal overflow).
    - Tablet: `768px` – `1024px` (2-column grids, collapsed sidebars, compact tables/cards).
    - Desktop: `1024px` – `1440px+` (full data tables, inline action bars, multi-column forms).
47. **Mobile Overflow & Touch Targets**:
    - Root containers and table containers must enforce `overflow-x-auto` or `overflow-x-hidden` to avoid window-level scrollbar breakage.
    - All interactive buttons, action menus (`⋮`), and form inputs must maintain touch-friendly padding and clear visible focus rings.

---

## 14. Platform Dynamic Form Builder Foundation Standards

48. **Separation of Configuration vs Operational Modules**:
    - **Configuration Layer** (`Administration Configuration` $\rightarrow$ `Forms Setup`): Defines, visualizes, templates, versions, and publishes form schemas.
    - **Operational Layer** (`Main ERP` $\rightarrow$ `Admissions` / `Pre-Registration`): Dynamically resolves and renders published forms to collect applicant submissions without hardcoded HTML forms.
49. **Master Field Catalog & Duplicate Canonical Concept Detection**:
    - Centralized catalog of 80+ fields across 16 categories with canonical, standard, and custom origins.
    - Duplicate detection prevents creating redundant custom fields for existing core concepts (e.g. warning against creating "DOB" when "Date of Birth" canonical exists).
    - Stable canonical keys preserve data mapping between Pre-Registration and Admission submissions even when custom labels change.
50. **Centralized Deterministic Form Resolution**:
    - `resolvePublishedForm(tenantId, formPurpose, campusId)` strictly evaluates:
      1. Campus-owned local published form (if authorized).
      2. School/Region/HO assigned published form via `SELECTED_CAMPUSES`.
      3. School/Region/HO universal published form via `ALL_CAMPUSES`.
51. **Immutable Versioning & Lifecycle Governance**:
    - Published versions with historical applicant submissions are immutable.
    - New iterations clone schema into draft Version $N+1$.
    - Unused library fields produce zero empty rows in hybrid structured storage.

