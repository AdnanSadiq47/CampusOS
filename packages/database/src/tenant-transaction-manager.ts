import pg from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';
import { StructuredLogger } from '@campus-os/logger';

const logger = new StructuredLogger('TenantTransactionManager');

export type DatabaseInstance = NodePgDatabase<typeof schema>;

export class TenantTransactionManager {
  private readonly db: DatabaseInstance;

  constructor(private readonly pool: pg.Pool) {
    this.db = drizzle(this.pool, { schema });
  }

  /**
   * @internal
   * WARNING: System Bootstrap Database Instance.
   * STRICTLY RESTRICTED to unauthenticated domain/subdomain lookup during initial request handshake (TenantService.resolveTenant).
   * All protected business and domain queries MUST execute via runInTenantContext().
   */
  getSystemBootstrapDb(): DatabaseInstance {
    return this.db;
  }

  /**
   * Backward-compatible alias with explicit security warning
   * @deprecated Use getSystemBootstrapDb() only for initial unauthenticated handshake
   */
  getUnscopedDb(): DatabaseInstance {
    return this.getSystemBootstrapDb();
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

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Set local transaction variables (strictly bound to this connection for this transaction only)
      await client.query('SET LOCAL app.current_tenant_id = $1', [tenantId]);

      if (userId) {
        await client.query('SET LOCAL app.current_user_id = $1', [userId]);
      }

      const txDrizzle = drizzle(client, { schema });
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
