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
   * Returns standard unscoped Drizzle instance (for system-level bootstrap/auth lookups)
   */
  getUnscopedDb(): DatabaseInstance {
    return this.db;
  }

  /**
   * Executes a database operation within a strict, tenant-isolated PostgreSQL transaction.
   * Enforces SET LOCAL app.current_tenant_id on the exact acquired connection.
   * SET LOCAL is automatically discarded on COMMIT or ROLLBACK, preventing connection pool leakage.
   */
  async runInTenantContext<T>(
    tenantId: string,
    operation: (tx: DatabaseInstance) => Promise<T>,
    userId?: string
  ): Promise<T> {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new Error('SECURITY_ERROR: Missing or invalid tenantId in runInTenantContext');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Set local transaction variables (isolated to this connection for this transaction only)
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
