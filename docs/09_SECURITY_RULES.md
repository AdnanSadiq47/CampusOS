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
