# 09. Security Rules & Cryptographic Governance

---

## 1. Global Identity Security Boundary
* **Isolation of Credentials**: `identity_users` credential columns (`password_hash`, `mfa_secret_encrypted`, `mfa_secret_iv`, `mfa_key_version`, `security_stamp`, `failed_login_attempts`, `locked_until`) are **strictly encapsulated** inside dedicated authentication services.
* **No Generic DB Access**: The runtime application role `campus_app_user` has zero access to credential columns. Dynamic reports, form builders, and tenant entity engines cannot query or select from `identity_users`.

---

## 2. MFA Secret Cryptographic Protection
* **Storage Standard**: AES-256-GCM authenticated encryption.
* **Schema**: `mfa_secret_encrypted BYTEA`, `mfa_secret_iv BYTEA`, `mfa_key_version INT`.
* **Key Derivation**: KMS / environment variable `MFA_ENCRYPTION_KEY_V1`. Plaintext TOTP secrets never touch disk or database columns.

---

## 3. Server-Side Session Revocation & Fail-Closed Validation
* **JWT Access Tokens**: Short-lived (15 minutes), containing `sub`, `orgId`, `membershipId`, `sessionId`, `secStamp`, and `memVer`.
* **Instant Revocation via Redis**:
  * Suspensions, terminations, or tenant switches emit immediate cache invalidation events (`session:revoked:<sessionId>`).
* **Fail-Closed Fallback Invariant**:
  * If Redis is unavailable or cache validation is uncertain $\rightarrow$ fall back to authoritative PostgreSQL validation.
  * If authoritative PostgreSQL validation cannot be completed $\rightarrow$ **DENY THE REQUEST (FAIL CLOSED)**.
  * **Never assume a token or session is valid when verification fails.**

---

## 4. Password Security & Defense in Depth
* **Password Hashing**: Argon2id (memory cost: 64MB, time cost: 3, parallelism: 4).
* **Cross-Tenant Tamper Guard**: Token claims must match request tenant context on every protected route.
* **Dual-Layer Boundary**: Application ABAC + PostgreSQL Row-Level Security (`FORCE ROW LEVEL SECURITY`).

---

## 5. Verification Integrity & Security Classification Rule
* **Truth in Security Testing**: Agents and developers must **never misrepresent** in-process or WASM integration tests (PGlite) as direct production daemon verification.
* Production daemon verification requires live TCP execution against a `postgres:16` instance (enforced in GitHub Actions CI via `REAL_POSTGRES_DATABASE_URL`).

---

## 6. Frontend Authorization Boundary Rule

**Frontend filters, campus selectors, URL parameters, query strings, hidden inputs, local storage, and frontend state are NEVER authorization boundaries.**

Every API endpoint and background job must:

1. Independently resolve the authenticated user's effective authorized node scope from server-side session + database.
2. Validate all requested node IDs against the authenticated user's effective scope.
3. Reject or return no data for any requested node outside the user's authorized scope.
4. Never trust `branchIds`, `campusIds`, or similar from the request without validation.

---

## 7. Node Scope Enforcement is Backend Responsibility

Even if the frontend's node filter correctly shows only authorized nodes, the backend MUST independently enforce the same scope. Manual API requests, Postman, curl, or custom scripts that include unauthorized node IDs must fail closed.

This applies uniformly to:
- REST endpoints
- GraphQL queries
- WebSocket events
- Background job initiations
- Report generation
- Export pipelines
- Scheduled tasks

---

## 8. Organizational Record vs. Credential Separation

Schools, Regions, Branches, Head Offices, and other organizational records must **NEVER store plaintext or hashed login credentials**.

All credentials belong exclusively to `identity_users`.

Organization creation flows may optionally offer "Create Administrator Login" with:
- User ID / Username
- Email
- Temporary Password (force reset on first login)
- Auto-generated password option

Passwords must:
- Never be stored plaintext
- Never be logged in application logs
- Never appear in audit payload `beforeState` / `afterState`
- Use the approved Argon2id password service
- Existing passwords must never be displayed, returned in DTOs, or exposed in any API response

---

## 9. Platform Admin / Owner Security Boundary

The CampusOS Platform Admin tier sits above all customer organizations. Platform Admin operations must:

- Execute through privileged service paths separate from tenant-facing APIs.
- Be independently audited with actor, operation, and target organization recorded.
- NOT be implemented as an unrestricted bypass of tenant RLS policies.
- Require explicit elevated authentication / separate session context.

Platform Admin must never accidentally access tenant financial, student, HR, or operational data through normal tenant-API paths.

---

## 10. Delegated Role Anti-Escalation

Role delegation is subject to the permanent privilege ceiling rule:

* No downstream administrator may create, assign, or delegate any role or permission greater than their own authorized/delegated ceiling.
* Role delegation changes must be audited (actor, source node, target node, roles delegated, timestamp).
* Role inheritance chains must be verifiable: if a role was granted by delegation, the delegation chain must be auditable.
