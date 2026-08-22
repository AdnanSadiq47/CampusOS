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
