# 09. Security Rules & Tenant Isolation Architecture

---

## 1. Dual-Layer Defense-in-Depth Security Model

CampusOS operates under a zero-trust multi-tenancy model. Tenant isolation is enforced through **Two Synchronous, Independent Security Boundaries**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. TIER 1: APPLICATION-LEVEL AUTHORIZATION BOUNDARY                         │
│    • Tenant Context Resolver (Subdomain / Custom Domain / Header)           │
│    • JWT Signature & Invalidation Check (Redis Session Validation)          │
│    • Granular RBAC/ABAC Evaluator (Module + Entity + Action + Field)        │
│    • Data Scope Compiler (Hierarchy Node Path Injection)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. TIER 2: DATABASE-LEVEL ROW SECURITY BOUNDARY (PostgreSQL RLS)            │
│    • TenantTransactionManager acquires dedicated connection from pool.      │
│    • Executes: SET LOCAL app.current_tenant_id = 'tenant_uuid'              │
│    • PostgreSQL kernel enforces tenant separation even on raw queries.      │
│    • Connection session variable automatically cleared on connection reset. │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Safe PostgreSQL Tenant Context Handling (`TenantTransactionManager`)

> **Critical Danger**: In connection pools (like PgBouncer or `node-postgres`), if connection-level variables are set without proper transactional scoping, a connection returned to the pool could leak another tenant's session variable to a subsequent request.

### The Mandatory Architectural Solution:
CampusOS mandates that **all tenant-scoped database queries** execute within a managed `TenantTransactionManager` lifecycle:

```typescript
export class TenantTransactionManager {
  constructor(private readonly pool: Pool) {}

  async runInTenantContext<T>(
    tenantId: string,
    operation: (tx: DrizzleTransaction) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      // 1. Begin local transaction
      await client.query('BEGIN');
      
      // 2. Set localized session variable for the duration of this transaction ONLY
      await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId]);
      
      // 3. Execute the Drizzle ORM query using this scoped client
      const result = await operation(drizzle(client));
      
      // 4. Commit transaction
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // 5. Clean release back to pool (SET LOCAL is automatically discarded on commit/rollback)
      client.release();
    }
  }
}
```

---

## 3. Cross-System Tenant Propagation Matrix

| Subsystem | Propagation Method | Isolation Mechanism |
|---|---|---|
| **HTTP / REST API** | Subdomain / Header (`X-Organization-ID`) | `TenantContextMiddleware` resolves tenant ID; rejects requests on missing/invalid tenant. |
| **WebSockets (SSE/WS)** | JWT token payload query parameter | Socket connection tied to `tenantId` room; cross-tenant message broadcasts impossible. |
| **Redis Cache** | Key namespace wrapper: `org:{orgId}:{key}` | Application cache provider prepends active `tenantId` to every cache lookup and mutation. |
| **BullMQ Workers** | Mandatory job metadata envelope: `{ tenantId, userId, scope, payload }` | Base `TenantAwareWorker` calls `TenantTransactionManager` before invoking worker `process()`. |
| **Event Bus & Outbox** | Standardized CloudEvents payload: `com.campusos.tenant_id` | Event listeners instantiate tenant context from event metadata. |
| **Scheduled Cron Jobs** | Orchestrator iterates active tenants; spawns separate jobs per tenant | Each cron execution runs in its own isolated `TenantTransactionManager` transaction. |
| **S3 File Attachments** | Pre-signed URLs with S3 key prefix: `tenants/{tenantId}/{entity}/{fileId}` | Application verifies user's entity read permission before generating a pre-signed download URL. |

---

## 4. Webhook Security Architecture

When CampusOS dispatches outbound webhooks to third-party services:
1. **HMAC-SHA256 Signing**: Every webhook request includes an `X-CampusOS-Signature` header calculated using the organization's private webhook secret.
2. **Replay Protection**: Header includes `X-CampusOS-Timestamp`. Requests older than 300 seconds must be rejected by receivers.
3. **Exponential Backoff**: Failed webhook deliveries are retried up to 5 times via BullMQ with exponential backoff before being marked `FAILED`.

---

## 5. Security Invariants (Zero Exceptions)

1. **No Superuser Bypass in Application Code**: Application database pools must connect as a standard non-superuser database role subject to RLS policies.
2. **Passwords & Secrets**: Stored using Argon2id with unique cryptographic salts. Passwords are never returned in DTOs or written to `audit_logs`.
3. **Audit Log Immutability**: The `audit_logs` table has all `UPDATE` and `DELETE` grants revoked at the PostgreSQL role level.
