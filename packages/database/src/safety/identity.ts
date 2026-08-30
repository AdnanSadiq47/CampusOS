import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';

const logger = new StructuredLogger('DatabaseIdentity');

export interface DatabaseIdentity {
  id: string;
  system_id: string;
  cluster_name: string;
  environment: string;
  schema_version: string;
  created_at: string;
  verified_at: string;
}

export const CANONICAL_SYSTEM_ID = 'campusos-local-canonical';
export const CANONICAL_CLUSTER_NAME = 'CampusOS Canonical Cluster';
export const CURRENT_SCHEMA_VERSION = '1.0.0';

/**
 * Initializes or verifies the persistent database identity table.
 * Fails closed if the identity does not match expected canonical parameters.
 */
export async function ensureDatabaseIdentity(
  pglite: PGlite,
  environment: string = process.env['NODE_ENV'] || 'development'
): Promise<DatabaseIdentity> {
  // 1. Create table idempotently
  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS _campusos_database_identity (
      id VARCHAR(64) PRIMARY KEY,
      system_id VARCHAR(128) NOT NULL,
      cluster_name VARCHAR(255) NOT NULL,
      environment VARCHAR(64) NOT NULL,
      schema_version VARCHAR(32) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      verified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);

  // 2. Query existing identity
  const res = await pglite.query<DatabaseIdentity>(
    `SELECT id, system_id, cluster_name, environment, schema_version, created_at, verified_at 
     FROM _campusos_database_identity 
     WHERE id = 'canonical-identity' LIMIT 1;`
  );

  if (res.rows.length === 0 || !res.rows[0]) {
    // First-time identity stamp
    logger.info('Initializing canonical database identity record...');
    const insertRes = await pglite.query<DatabaseIdentity>(
      `INSERT INTO _campusos_database_identity (id, system_id, cluster_name, environment, schema_version)
       VALUES ('canonical-identity', $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET verified_at = NOW()
       RETURNING id, system_id, cluster_name, environment, schema_version, created_at, verified_at;`,
      [CANONICAL_SYSTEM_ID, CANONICAL_CLUSTER_NAME, environment, CURRENT_SCHEMA_VERSION]
    );
    const identity = insertRes.rows[0];
    if (!identity) {
      throw new Error('Failed to create canonical database identity record.');
    }
    logger.info('Canonical database identity stamped successfully', { identity });
    return identity;
  }

  const identity = res.rows[0];

  // 3. Verify Identity Integrity (Fail Closed)
  if (identity.system_id !== CANONICAL_SYSTEM_ID) {
    const msg = `DATABASE IDENTITY MISMATCH: Expected system_id "${CANONICAL_SYSTEM_ID}", found "${identity.system_id}". Refusing startup to prevent operating against an unintended database.`;
    logger.error(msg);
    throw new Error(msg);
  }

  // Update verified_at timestamp
  await pglite.query(
    `UPDATE _campusos_database_identity SET verified_at = NOW() WHERE id = 'canonical-identity';`
  );

  logger.info('Verified canonical database identity successfully', {
    system_id: identity.system_id,
    cluster_name: identity.cluster_name,
    environment: identity.environment,
    schema_version: identity.schema_version,
  });

  return identity;
}

/**
 * Read-only check to verify database identity without mutating verified_at.
 */
export async function verifyDatabaseIdentity(
  pglite: PGlite,
  expectedSystemId: string = CANONICAL_SYSTEM_ID
): Promise<DatabaseIdentity> {
  const res = await pglite.query<DatabaseIdentity>(
    `SELECT id, system_id, cluster_name, environment, schema_version, created_at, verified_at 
     FROM _campusos_database_identity 
     WHERE id = 'canonical-identity' LIMIT 1;`
  );

  if (res.rows.length === 0 || !res.rows[0]) {
    throw new Error('DATABASE IDENTITY MISSING: _campusos_database_identity table contains no canonical record.');
  }

  const identity = res.rows[0];
  if (identity.system_id !== expectedSystemId) {
    throw new Error(
      `DATABASE IDENTITY CORRUPTED: Expected system_id "${expectedSystemId}", found "${identity.system_id}".`
    );
  }

  return identity;
}
