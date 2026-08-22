# Changelog

All notable changes to the CampusOS architecture and platform specifications will be documented in this file.

## [2026-08-22] - Dedicated Real PostgreSQL 16 Daemon Gate & Dual Verification Architecture

### Added
- **Dedicated Real PostgreSQL 16 Acceptance Suite**: Added `packages/database/test/real-postgres-daemon.spec.ts` executing against standalone PostgreSQL 16 TCP servers via `REAL_POSTGRES_DATABASE_URL` (skips gracefully when daemon URL is unset).
- **GitHub Actions Security Gate Workflow**: Added `.github/workflows/security-gate.yml` with `postgres:16-alpine` and `redis:7-alpine` service containers for authoritative CI acceptance.
- **Verification Tier Delineation**: Formally separated Tier A (fast in-process PGlite integration tests) from Tier B (standalone PostgreSQL 16 daemon acceptance gate).

---

## [2026-08-22] - Hardened Multi-Node Identity & Cross-Tenant Security Architecture
- Global identity decoupling (`identity_users`), organization memberships, multi-node assignments, per-node roles, composite foreign keys, and tri-state permission precedence (`Explicit DENY > Explicit ALLOW > Default DENY`).
- AES-256-GCM encrypted MFA secrets, fail-closed session revocation, and immutable audit logs.
