# Changelog

All notable changes to the CampusOS architecture and platform specifications will be documented in this file.

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
