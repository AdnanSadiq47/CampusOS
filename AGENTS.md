# AGENTS.md — Global Autonomous Agent Governance Rules

## 1. Authoritative Source of Truth
* All agent actions MUST comply strictly with `/docs/00_PRODUCT_VISION.md` through `/docs/11_AI_RULES.md` and `/docs/CHANGELOG.md`.

## 2. Core Invariants
1. **Configure, Don't Customize**: Never create rigid, hardcoded domain monoliths. Use metadata engines and dynamic builders.
2. **Global Identity vs Tenant Membership**: `identity_users` is purely an authentication principal with zero implicit tenant data access. All tenant access requires server-verified `organization_memberships`.
3. **Multi-Node Assignments**: Users/Employees are assigned to arbitrary hierarchy nodes via `membership_node_assignments` with per-node roles via `assignment_roles`. Never assume single-node/campus authorization.
4. **Composite Foreign Keys**: All tenant-owned relationship tables must enforce composite foreign keys containing `organization_id`.
5. **PostgreSQL RLS & Defense-in-Depth**: `TenantTransactionManager` with `SET LOCAL app.current_tenant_id = :tenantId` on every connection.
6. **Tri-State Permission Precedence**: `Explicit DENY > Explicit ALLOW > Default DENY`.
7. **Fail-Closed Revocation**: If session/token validation cannot be verified against Redis or DB, fail closed immediately.
8. **Credential Security Boundary**: Never expose `password_hash` or `mfa_secret` to tenant business code, form builders, or dynamic reporting engines.
9. **Verification Honesty**: Clearly distinguish in-process PGlite integration tests from live Standalone PostgreSQL 16 daemon acceptance gates. Never claim daemon execution without live TCP server connectivity.
