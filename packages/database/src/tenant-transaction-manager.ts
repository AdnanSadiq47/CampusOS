import pg from 'pg';
import { drizzle as drizzleNodePg, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePgLite } from 'drizzle-orm/pglite';
import * as schema from './schema/index.js';
import { organizations } from './schema/organizations.js';
import { eq, or } from 'drizzle-orm';
import { StructuredLogger } from '@campus-os/logger';
import { TenantContext } from '@campus-os/types';

const logger = new StructuredLogger('TenantTransactionManager');

export type DatabaseInstance = NodePgDatabase<typeof schema>;

export class TenantTransactionManager {
  private readonly db: DatabaseInstance;

  constructor(private readonly pool: pg.Pool | any) {
    if (typeof pool?.exec === 'function' && typeof pool?.connect !== 'function') {
      this.db = drizzlePgLite(pool, { schema }) as unknown as DatabaseInstance;
    } else {
      this.db = drizzleNodePg(this.pool, { schema });
    }
  }

  /**
   * Narrow, dedicated resolution method strictly for initial unauthenticated handshake.
   * EXCLUSIVELY queries tenant metadata from the organizations table.
   * Prevents generic unrestricted database access or exposure of tenant-owned business data.
   */
  async findTenantForResolution(identifier: string): Promise<TenantContext | null> {
    if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
      return null;
    }

    const trimmed = identifier.trim();

    // Query ONLY the organizations table
    const result = await this.db
      .select({
        id: organizations.id,
        code: organizations.code,
        name: organizations.name,
        domain: organizations.domain,
        primaryCurrency: organizations.primaryCurrency,
        settings: organizations.settings,
        isActive: organizations.isActive,
      })
      .from(organizations)
      .where(or(eq(organizations.code, trimmed), eq(organizations.domain, trimmed)))
      .limit(1);

    const org = result[0];
    if (!org || !org.isActive) {
      return null;
    }

    return {
      organizationId: org.id,
      organizationCode: org.code,
      organizationName: org.name,
      domain: org.domain || undefined,
      primaryCurrency: org.primaryCurrency,
      settings: (org.settings as Record<string, unknown>) || {},
    };
  }

  /**
   * Alias for runInTenantContext
   */
  async withTenant<T>(
    tenantId: string,
    operation: (tx: DatabaseInstance) => Promise<T>,
    userId?: string
  ): Promise<T> {
    return this.runInTenantContext(tenantId, operation, userId);
  }

  /**
   * Executes a database operation within a strict, tenant-isolated PostgreSQL transaction.
   * Enforces SET LOCAL app.current_tenant_id on the exact acquired connection.
   * 
   * Invariants:
   * 1. Acquires client from pool.
   * 2. Issues BEGIN on the acquired client.
   * 3. Sets SET LOCAL app.current_tenant_id = :tenantId on that connection.
   * 4. Executes callback with Drizzle transaction instance on the exact connection.
   * 5. Issues COMMIT or ROLLBACK.
   * 6. Releases client back to pool (PostgreSQL automatically clears all SET LOCAL transaction variables).
   */
  async runInTenantContext<T>(
    tenantId: string,
    operation: (tx: DatabaseInstance) => Promise<T>,
    userId?: string
  ): Promise<T> {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new Error('SECURITY_ERROR: Missing or invalid tenantId in runInTenantContext. Access denied.');
    }

    if (typeof (this.pool as any).exec === 'function' && typeof (this.pool as any).connect !== 'function') {
      const pglite = this.pool as any;
      await pglite.exec('BEGIN;');
      await pglite.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
      if (userId) {
        await pglite.query("SELECT set_config('app.current_user_id', $1, true)", [userId]);
      }
      const txDrizzle = drizzlePgLite(pglite, { schema });
      try {
        const result = await operation(txDrizzle as unknown as DatabaseInstance);
        await pglite.exec('COMMIT;');
        return result;
      } catch (err) {
        await pglite.exec('ROLLBACK;');
        throw err;
      }
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Set local transaction variables (strictly bound to this connection for this transaction only)
      await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);

      if (userId) {
        await client.query("SELECT set_config('app.current_user_id', $1, true)", [userId]);
      }

      const txDrizzle = drizzleNodePg(client, { schema });
      const result = await operation(txDrizzle);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Tenant transaction rolled back due to error', {
        tenantId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      // Release client back to pool. PostgreSQL guarantees SET LOCAL variables are cleared.
      client.release();
    }
  }

  /**
   * Health check method to verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Database health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
