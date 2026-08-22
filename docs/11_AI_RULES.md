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
