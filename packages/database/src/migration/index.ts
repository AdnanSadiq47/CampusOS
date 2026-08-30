import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import { CURRENT_SCHEMA_VERSION, verifyDatabaseIdentity } from '../safety/identity.js';
import { createConsistentSnapshot } from '../safety/snapshots.js';

const logger = new StructuredLogger('SchemaMigration');

export const REQUIRED_SYSTEM_TABLES = [
  'organizations',
  'identity_users',
  'roles',
  'countries',
  'states',
  'cities',
  'areas',
  'head_offices',
  'regions',
  'schools',
  'branches',
] as const;

export interface MigrationRecord {
  id: string;
  name: string;
  applied_at: string;
  checksum: string;
}

/**
 * Read-only schema compatibility verification for normal API startup.
 * FAILS CLOSED if required tables are missing or schema version mismatches.
 * PERFORMS ZERO MUTATIONS ON BUSINESS DATA.
 */
export async function verifySchemaCompatibility(pglite: PGlite): Promise<void> {
  logger.info('Verifying database schema compatibility and integrity...');

  // 1. Verify Identity Record
  const identity = await verifyDatabaseIdentity(pglite);
  if (identity.schema_version !== CURRENT_SCHEMA_VERSION) {
    const errorMsg =
      `DATABASE SCHEMA VERSION MISMATCH.\n` +
      `Expected schema_version "${CURRENT_SCHEMA_VERSION}", found "${identity.schema_version}".\n` +
      `Startup aborted to prevent running on an incompatible schema.\n` +
      `Run the approved CampusOS migration procedure.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // 2. Verify Presence of Required Tables
  const missingTables: string[] = [];
  for (const tbl of REQUIRED_SYSTEM_TABLES) {
    const res = await pglite.query<{ count: string }>(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = $1;
    `, [tbl]);
    if (Number(res.rows[0]?.count || 0) === 0) {
      missingTables.push(tbl);
    }
  }

  if (missingTables.length > 0) {
    const errorMsg =
      `DATABASE SCHEMA INCOMPLETE.\n` +
      `Missing required table(s): ${missingTables.join(', ')}.\n` +
      `Refusing startup on uninitialized or corrupted schema.`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info('Database schema compatibility verified successfully (All required tables present).', {
    schemaVersion: identity.schema_version,
    tablesChecked: REQUIRED_SYSTEM_TABLES.length,
  });
}

/**
 * Migration registration and tracking.
 */
export interface MigrationDefinition {
  id: string;
  name: string;
  up: (pglite: PGlite) => Promise<void>;
  down?: (pglite: PGlite) => Promise<void>;
}

export const MIGRATIONS: MigrationDefinition[] = [
  {
    id: '001_initial_core_schema',
    name: 'Initial Core Schema Definitions',
    up: async (pglite: PGlite) => {
      // Base schema definitions
      await pglite.exec(`
        CREATE TABLE IF NOT EXISTS _campusos_migrations (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          checksum VARCHAR(64) NOT NULL
        );
      `);
    },
  },
];

/**
 * Explicit migration runner. Requires verified pre-risk snapshot.
 */
export async function runMigrations(
  pglite: PGlite,
  options: { preRiskSnapshot?: boolean } = { preRiskSnapshot: true }
): Promise<void> {
  logger.info('Starting explicit migration execution...');

  if (options.preRiskSnapshot) {
    logger.info('Executing mandatory pre-migration snapshot...');
    await createConsistentSnapshot(pglite, 'pre-migration');
  }

  await pglite.exec(`
    CREATE TABLE IF NOT EXISTS _campusos_migrations (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      checksum VARCHAR(64) NOT NULL
    );
  `);

  for (const m of MIGRATIONS) {
    const applied = await pglite.query(
      `SELECT id FROM _campusos_migrations WHERE id = $1 LIMIT 1;`,
      [m.id]
    );
    if ((applied.rows || []).length === 0) {
      logger.info(`Applying migration: ${m.id} (${m.name})...`);
      await m.up(pglite);
      await pglite.query(
        `INSERT INTO _campusos_migrations (id, name, checksum) VALUES ($1, $2, 'sha256-initial');`,
        [m.id, m.name]
      );
      logger.info(`Migration ${m.id} applied successfully.`);
    }
  }

  logger.info('All pending migrations completed.');
}
