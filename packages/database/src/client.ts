import pg from 'pg';
import { TenantTransactionManager } from './tenant-transaction-manager.js';

export function createDatabasePool(connectionString?: string): pg.Pool {
  const url = connectionString || process.env['DATABASE_URL'] || 'postgresql://campus_app_user:campus_secure_password@localhost:5432/campus_os_db';
  return new pg.Pool({
    connectionString: url,
    max: Number(process.env['DATABASE_POOL_MAX'] || 20),
    min: Number(process.env['DATABASE_POOL_MIN'] || 2),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

export function createTenantManager(pool?: pg.Pool): TenantTransactionManager {
  const activePool = pool || createDatabasePool();
  return new TenantTransactionManager(activePool);
}
