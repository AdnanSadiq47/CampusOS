# Changelog

All notable changes to the CampusOS architecture and platform specifications will be documented in this file.

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
