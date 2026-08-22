# Changelog

All notable changes to the CampusOS architecture and platform specifications will be documented in this file.

## [2026-08-22] - Hardened Multi-Node Identity & Cross-Tenant Security Architecture

### Added
- **Global Identity Decoupling**: Added `identity_users` with Argon2id password hashing and AES-256-GCM encrypted MFA secrets.
- **Unified Organization Membership**: Added `organization_memberships` supporting multi-persona profile extensions (`employee_profiles`, `student_profiles`, `parent_profiles`).
- **Domain-Neutral Multi-Node Assignments**: Added `membership_node_assignments` supporting simultaneous assignments across arbitrary hierarchy tiers (*Head Office, Region, Campus, Dept*).
- **Per-Node Multi-Role Grants**: Added `assignment_roles` enabling different functional roles per assigned node.
- **Composite Database Foreign Keys**: Enforced `(organization_id, foreign_id) REFERENCES target_table(organization_id, id)` across all tenant relationship tables.
- **Tri-State Permission Precedence**: Standardized on `Explicit DENY > Explicit ALLOW > Default DENY`.
- **Fail-Closed Session Revocation**: Invariant guaranteeing request rejection if Redis and PostgreSQL validation fail.
- **Primary Assignment DB Invariant**: Partial unique index enforcing at most one active primary node assignment per membership.

---

## [2026-08-22] - Initial Architectural Baseline
- Established Phase 1 permanent specifications (`docs/00_PRODUCT_VISION.md` to `11_AI_RULES.md`).
- Multi-tenancy isolation boundary, PostgreSQL RLS, and Drizzle ORM architecture.
