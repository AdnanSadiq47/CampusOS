# Changelog

All notable changes to the CampusOS architecture and platform specifications will be documented in this file.

---

## [2026-08-23] - Location & Geography Shared Masters Suite
- **Location & Geography Data Architecture**:
  - Implemented 5 shared reference master tables in `packages/database/src/schema/geography.ts`:
    - `countries`: Sovereign country registry with ISO-2 (unique per tenant), ISO-3, numeric codes, dial codes, currency codes, currency symbols, nationalities, sort order, and active/inactive status.
    - `states`: Regional subdivisions with parent country foreign key, subdivision types (`State`, `Province`, `Territory`, `Region`, `Emirate`, `Governorate`, `Other`), sort order, and unique name per country.
    - `cities`: Municipal metropolitan city masters with cascading Country -> State foreign keys, city codes, sort order, and unique name per state.
    - `areas`: Local neighborhood / school zoning sectors with cascading Country -> State -> City foreign keys, short codes, and sort order.
    - `postal_codes`: Postal/ZIP code registries with cascading Country -> State -> City -> Area (optional) foreign keys, postal code strings, and coverage descriptions.
  - Exported complete TypeScript DTOs and interfaces in `packages/types/src/geography.ts`.
- **Backend Service & REST Endpoints (`apps/api/src/modules/geography`)**:
  - Built `GeographyService` and `GeographyController` with full tenant-isolated CRUD, parent-filtered listings, duplicate validation, auto-increment sort order resolution, and structured audit logging.
  - Implemented 13 new integration tests in `apps/api/test/geography.spec.ts` bringing total test suite to 80/80 passed tests across 9 suites.
- **Frontend Management Suite (`apps/web`)**:
  - Built 5 dedicated management pages matching the approved Administration Configuration reference pattern:
    - `/admin-config/countries`: Sovereign country directory with ISO tags, dial codes, and currency badges.
    - `/admin-config/states`: State / Province management with subdivision type tags and country filtering.
    - `/admin-config/cities`: Municipal city management with cascading country/state filters.
    - `/admin-config/areas`: Local zone and sector management with 3-level parent hierarchy filters.
    - `/admin-config/postal-codes`: Postal/ZIP code registry with locality description and city/area links.
  - Created reusable `GeographyLocationFields` component (`apps/web/components/GeographySelectors.tsx`) with cascading country/state/city selectors.
  - Connected location dropdowns in Head Offices and Regional Offices forms to shared geography masters.
  - Updated Administration Configuration Control Center registry (`apps/web/lib/admin-config-registry.ts`) to mark all 5 Location & Geography items as implemented with direct routing.
- **Static Asset & Dev Server Verification**:
  - Updated `verify-dev-assets.mjs` and verified 100% HTTP 200 on all HTML, CSS bundles (67KB Tailwind), and JS chunks across all 11 administrative pages.

---

## [2026-08-23] - Administration Configuration Control Center & Regional Offices View Fix
- **Administration Configuration Home (`/admin-config`)**:
  - Implemented the central Control Center for Administration Configuration powered by a centralized metadata registry (`apps/web/lib/admin-config-registry.ts`).
  - Structured 14 canonical configuration categories with explicit sort orders and metadata: Organization Setup, Location & Geography, Academic Setup, Student Setup, HR & Employee Setup, Fee & Billing Setup, Payroll Setup, Library Setup, Transport Setup, Exam & Assessment, Attendance & Devices, Communication Setup, General / Shared Masters, Users & Access.
  - Built Global Real-Time Configuration Search with keyword matching across 70+ settings and direct navigation to operational pages.
  - Implemented User-Specific Starred Favorites and Recently Visited tracking with `localStorage` persistence and honest empty states.
  - Implemented Customizable Quick Actions with modal allowing users to configure pinned shortcut pills.
  - Implemented Category Detail Drawers/Modals with drilldown into category settings and clean "Coming Soon" indicators for future pages.
  - Added dual responsive View Modes: **Grid View** (Category Cards with item previews) and **List View** (Sortable Directory Table with Scope classification and direct actions).
- **Regional Offices View Action Bug Fix**:
  - Fixed React Hook violation caused by an inline `React.useState` inside a conditional JSX IIFE in `apps/web/app/(admin)/admin-config/regions/page.tsx`.
  - Re-architected Regional Office View modal to match the approved Schools / Branches visual language with Overview & Hierarchy, Location & Address, and Associated Schools tabs.
- **Next.js Dev Server Lifecycle & Static Asset Invariant**:
  - Integrated `pnpm web:dev:check` verifying HTML, 67KB Tailwind CSS bundles, and JS chunk availability (HTTP 200) across all 6 administrative routes.
  - Documented permanent developer/AI rule preventing concurrent `next dev` and `next build` cache collisions.

---

## [2026-08-23] - Combined Branch UX Fix, Sort Order & Organization Setup UI Consistency
- **Branch UX & Username Engine**:
  - Implemented working `Suggest Username` functionality generating normalized, collision-checked, available username candidates from School & Branch identity (`{branchCode}.admin`, `{schoolCode}.{branchCode}`, etc.).
  - Auto-populates administrative user and matching school email in Branch modal.
- **Branch / Campus Sort Order Architecture**:
  - Added persistent `sort_order` integer column to `branches` database schema and DTOs.
  - Implemented smart default sort order determination (`highest + 1` within each school, or `1` for the first branch).
  - Enforced ERP-wide canonical branch ordering (`schools.name ASC, branches.sortOrder ASC, branches.name ASC`).
  - Added `Reorder Branches` interactive sequence modal supporting reordering within a selected School.
  - Added backend endpoints `GET /branches/next-sort-order`, `GET /branches/suggest-username`, and `PATCH /branches/reorder`.
- **Standardized Organization Setup Breadcrumbs & Page Headers**:
  - Created reusable `AdminConfigPageHeader` component (`apps/web/components/AdminConfigPageHeader.tsx`).
  - Standardized all 5 Organization Setup management pages (`Head Offices`, `Regional Offices`, `School Types`, `Schools`, `Branches`) to the uniform pattern:
    `Administration Configuration / Organization Setup / <Page Name>`.
  - Audited and verified all interactive UI controls across all 5 pages (zero dead buttons/placeholders).
- **Verification Suite**:
  - Added new integration tests in `apps/api/test/branches.spec.ts` for sort order auto-increment, next sort order calculation, resequencing persistence with audit logging, and username suggestion.
  - All 8 API test suites (67/67 tests) passed 100% green.
  - Monorepo typechecking 100% clean (`tsc --noEmit` across all workspace projects).
  - Next.js web application build 100% clean (20/20 static routes generated).

---

## [2026-08-23] - Permanent Audit Logging & Safe Record Lifecycle Policy
- **Enterprise Audit Architecture (`packages/database`, `packages/types`, `apps/api/src/core/audit`)**:
  - Enhanced `audit_logs` schema with `hierarchy_node_id` (node scope), `module`, `outcome`, `impersonator_id`, `metadata`, and 5 high-performance B-tree indexes for time-series and scope-aware queries.
  - Implemented `AuditService` with automated recursive secret sanitization (redacting passwords, hashes, tokens, MFA secrets, API keys, cookies).
  - Built automated compact field-level `diff` engine (`{ field: { before, after } }`) ignoring unchanged and timestamp fields.
  - Built scope-aware audit querying enforcing tenant isolation and hierarchical subtree node filtering (`path <@ :nodePath`).
  - Implemented immutable append-only storage policy with no UPDATE/DELETE capabilities exposed.
- **Permanent Safe Delete & Record Lifecycle Policy**:
  - Enforced No-Hard-Delete-by-default standard across all CampusOS entities and management pages.
  - Standardized state transitions: `Deactivate / Activate`, `Archive`, `Cancel`, `Reverse`, `Revoke`.
  - Audited and verified all Administration Configuration pages (`schools`, `regions`, `head-offices`, `branches`, `school-types`) to ensure zero raw physical delete actions exist in UI.
- **Architectural Documentation & Governance**:
  - Published `/docs/12_AUDIT_LOGGING_AND_RECORD_LIFECYCLE.md` establishing the 10 Permanent AI/Developer Rules.
  - Updated `AGENTS.md`, `/docs/01_CORE_PRINCIPLES.md`, `/docs/08_DATABASE_ARCHITECTURE.md`, `/docs/09_SECURITY_RULES.md`, `/docs/10_UI_UX_RULES.md`, `/docs/11_AI_RULES.md`.
- **Integration Test Suite**:
  - Created `apps/api/test/audit-lifecycle.spec.ts` with 7 comprehensive integration tests covering entity creation audit trails, compact diffs, status transitions (`ACTIVATE`/`DEACTIVATE`), secret sanitization, cross-tenant isolation, branch/node subtree filtering, and immutability.
  - All 8 API test suites (66/66 tests) passing with 100% success.
  - Monorepo typechecking 100% clean (`tsc --noEmit` on all projects). Next.js web application build 100% clean (20/20 static routes generated).

---

## [2026-08-23] - Permanent Organization, Branch Scope, Dynamic Access & Delegated Role Architecture Invariants
- **Permanent Invariants Integrated Across Documentation & Codebase**:
  - Locked 14 core AI/developer pre-implementation rules into `/AGENTS.md` and `/docs/11_AI_RULES.md`.
  - Added Platform Owner Administration layer specification with explicit tenant boundary (`/docs/00_PRODUCT_VISION.md`, `/docs/02_ORGANIZATION_MODEL.md`, `/docs/09_SECURITY_RULES.md`).
  - Formalized Variable-Depth Hierarchy architecture (all 4 cases: Org→HO→Region→School→Branch, Org→HO→School→Branch, Org→School→Branch, Org→School single-location) with optional Head Office, Region, and Branch levels (`/docs/02_ORGANIZATION_MODEL.md`).
  - Added anti-privilege-escalation delegated role ceiling specification (`/docs/03_ROLES_PERMISSIONS.md`).
  - Formalized multi-select authorized node filter, Global Working Scope, and visible Campus/Branch table column standard (`/docs/04_DATA_SCOPE.md`, `/docs/10_UI_UX_RULES.md`).
  - Created Administration Configuration Information Architecture specification (`/docs/12_ADMIN_CONFIG_IA.md`) covering all 14 categories and configuration dependency ordering.
  - Audit & code corrections: Removed hardcoded parent node type constraints from `regions.service.ts` and schema comments.
- **Architectural Security Verification Suite**:
  - Added comprehensive security tests verifying: multi-node isolation, node-scoped query combining, unauthorized node leak prevention, role vs. node independence, single-location school without fake branch, region-less hierarchy, and multi-node employee assignments.

---

## [2026-08-22] - Phase 2 Completed: Dynamic Platform Engines & Visual Builder Suite
- **Dynamic Entity Builder & Virtual ORM (`packages/database`, `apps/api/src/core/entities`)**:
  - Declarative entity definition engine supporting custom polymorphic fields (text, number, boolean, date, json, select, relation).
  - Virtual ORM runtime validating required constraints, unique index constraints, and `ltree` subtree node queries with strict RLS enforcement.
- **Form Builder Engine & Declarative AST Versioning (`packages/rule-engine`, `apps/api/src/core/forms`, `apps/web/components/DynamicFormRenderer.tsx`)**:
  - AST-driven form layouts supporting tabs, sections, responsive grids, and conditional field evaluation.
  - Implemented `SHOW_IF`, `HIDE_IF`, `REQUIRED_IF`, `DISABLE_IF`, and safe math expression `CALCULATE` evaluator without unsafe `eval()`.
  - Immutable published schema snapshots with draft-to-published lifecycle.
- **Workflow State Machine Engine & Guard Evaluation (`apps/api/src/core/workflows`)**:
  - Finite State Machine (FSM) engine with role guards, condition AST guards, and automatic state transition handlers.
  - Append-only immutable `workflow_history` audit trail logging state changes, actors, comments, and payload diffs.
- **Dynamic Navigation Engine (`apps/api/src/core/navigation`)**:
  - Database-driven navigation menu trees with real-time permission filtering based on active user roles and scopes.
- **Pluggable Module Architecture (`apps/api/src/core/modules`)**:
  - Declarative module registry supporting dynamic activation and strict prerequisite dependency resolution.
- **Visual Admin Studio (`apps/web/app/(admin)/builders`)**:
  - Built interactive visual builders:
    - `/builders/hierarchy`: Interactive organizational node tree editor with `ltree` path maintenance.
    - `/builders/entities`: Visual entity creator and custom field manager.
    - `/builders/forms`: Drag-and-drop form canvas with real-time live AST preview.
    - `/builders/workflows`: Visual state transition diagram editor.
    - `/builders/navigation`: Menu item manager with role preview.
    - `/modules`: Pluggable module activation center with dependency checks.
- **Full Monorepo Verification & CI Evidence**:
  - **GitHub Actions Run ID**: `32576773390` ([View CI Run](https://github.com/AdnanSadiq47/CampusOS/actions/runs/32576773390)) - **PASSED (100% Green)**
  - **Tested Commit**: `b5ef115d47750b9f46ab73b11e303a7c88d420d0`
  - **Real Standalone PostgreSQL 16 Daemon Gate**: **PASSED** (Executed against `postgres:16-alpine` service container)
  - **Monorepo Typecheck**: 100% clean (`tsc --noEmit` across all 9 workspace packages/apps).
  - **Test Suites**: 100% passing (Permissions: 7/7 including multi-node employee scenarios, Rule Engine: 6/6, Database: 12/12, API: 15/15 including workflow version immutability).
  - **Production Builds**: 100% clean (API NestJS build + Web Next.js 14 App Router 11 static routes build).

---

## [2026-08-22] - PHASE 1 FORMALLY COMPLETED & PERMANENTLY LOCKED

### Acceptance Status
- **Final CI Acceptance Gate**: **PASSED (100% Verified in GitHub Actions)**
- **GitHub Actions Run ID**: `32574701217` ([View CI Run](https://github.com/AdnanSadiq47/CampusOS/actions/runs/32574701217))
- **Verified Commit Hash**: `6a4fc054fd70e559b285cf25e1e9289d55ae45b9`
- **Real PostgreSQL 16 Daemon Gate**: **PASSED** (Executed on standalone `postgres:16-alpine` service container over TCP)
- **CI Test Suite Summary**: **34 passed, 0 failed, 0 skipped**
  - `@campus-os/permissions`: 4 / 4 passed (Tri-State `Explicit DENY > Explicit ALLOW > Default DENY`)
  - `@campus-os/rule-engine`: 3 / 3 passed (Safe AST evaluation)
  - `@campus-os/api`: 7 / 7 passed (Argon2id, AES-256-GCM MFA, fail-closed Redis/PostgreSQL token revocation)
  - `@campus-os/database`: 20 / 20 passed (3 isolation/rollback, 10 PGlite RLS, 7 Standalone PostgreSQL 16 daemon acceptance tests)
- **Monorepo Typecheck**: PASSED (`tsc --noEmit` clean across all 8 packages/apps with 0 errors)
- **Production Builds**: PASSED (NestJS API `apps/api` and Next.js 14 App Router `apps/web` compiled cleanly)

### Permanent Architectural Invariants Locked
1. **Zero Cross-Tenant Data Leakage**: Enforced at database engine level via PostgreSQL `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on all tenant-owned tables.
2. **Restricted Runtime Database Role**: `campus_app_user` is verified as `NOSUPERUSER`, `NOBYPASSRLS`, `NOCREATEDB`, `NOCREATEROLE` with zero SELECT access to credential columns (`password_hash`, `mfa_secret_encrypted`).
3. **Tenant-Aware Connection Scoping**: `TenantTransactionManager` enforces `SET LOCAL app.current_tenant_id = :tenantId` on every transaction, resetting to empty across `COMMIT` and `ROLLBACK`.
4. **Normalized Multi-Node Identity**: `identity_users` $\rightarrow$ `organization_memberships` $\rightarrow$ `membership_node_assignments` (supporting arbitrary node levels: HO, Region, Campus simultaneously) $\rightarrow$ `assignment_roles`.
5. **Composite Foreign Keys**: All tenant-owned relationship tables enforce composite foreign keys containing `organization_id` (`fk_employee_membership`, `fk_assignments_membership`, `fk_assignments_node`, `fk_assignment_roles_assignment`, `fk_assignment_roles_role`).
6. **Tri-State Authorization Precedence**: `Explicit DENY > Explicit ALLOW > Default DENY`.
7. **No Hardcoding Invariant**: Zero hardcoded organizational hierarchies, roles, forms, workflows, or dashboards.

---

## [2026-08-22] - Dedicated Real PostgreSQL 16 Daemon Gate & Dual Verification Architecture
- Added `packages/database/test/real-postgres-daemon.spec.ts` executing against standalone PostgreSQL 16 TCP servers via `REAL_POSTGRES_DATABASE_URL` with fail-closed CI guard (`REQUIRE_REAL_POSTGRES=true`).
- Added `.github/workflows/security-gate.yml` with `postgres:16-alpine` and `redis:7-alpine` service containers for authoritative CI acceptance.
- Formally separated Tier A (in-process PGlite integration tests) from Tier B (standalone PostgreSQL 16 daemon acceptance gate).

---

## [2026-08-22] - Hardened Multi-Node Identity & Cross-Tenant Security Architecture
- Global identity decoupling (`identity_users`), organization memberships, multi-node assignments, per-node roles, composite foreign keys, and tri-state permission precedence (`Explicit DENY > Explicit ALLOW > Default DENY`).
- AES-256-GCM encrypted MFA secrets, fail-closed session revocation, and immutable audit logs.
