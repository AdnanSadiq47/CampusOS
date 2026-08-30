import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import { findWorkspaceRoot } from '../client.js';
import { getAuthoritativeTableInventory } from './inventory.js';
import { CURRENT_SCHEMA_VERSION, CANONICAL_SYSTEM_ID, CANONICAL_CLUSTER_NAME } from '../safety/identity.js';

const logger = new StructuredLogger('StagingCreator');

export const CANONICAL_STAGING_DIR_NAME = '.pglite-data-staging';
export const STAGING_STATUS_FILE_NAME = '.staging-status.json';

export interface StagingStatusFile {
  status: 'PROVISIONING' | 'READY' | 'FAILED';
  createdAt: string;
  readyAt?: string;
  failedAt?: string;
  error?: string;
  migrationsApplied: Array<{ filename: string; checksum: string }>;
  authoritativeTableCount: number;
}

export function getCanonicalStagingDbPath(): string {
  const root = findWorkspaceRoot();
  return path.resolve(root, CANONICAL_STAGING_DIR_NAME);
}

export function getStagingStatusFilePath(stagingDir: string): string {
  return path.join(stagingDir, STAGING_STATUS_FILE_NAME);
}

export function assertSafeNewStagingTarget(targetPath?: string): string {
  const root = findWorkspaceRoot().toLowerCase();
  const canonicalStaging = getCanonicalStagingDbPath();
  const target = path.resolve(targetPath || canonicalStaging);
  const targetLower = target.toLowerCase();

  const canonicalLive = path.resolve(root, '.pglite-data').toLowerCase();
  const archivedCorrupted = path.resolve(root, '.pglite-data-ARCHIVED-CORRUPTED').toLowerCase();
  const backupIncident = path.resolve(root, '.pglite-data-BACKUP-INCIDENT').toLowerCase();

  if (targetLower === canonicalLive) {
    throw new Error('SECURITY_VIOLATION: Refusing to initialize staging database over live canonical .pglite-data.');
  }

  if (targetLower === archivedCorrupted || targetLower === backupIncident) {
    throw new Error('SECURITY_VIOLATION: Refusing to touch archived incident evidence database.');
  }

  if (targetLower !== canonicalStaging.toLowerCase()) {
    throw new Error(`SECURITY_VIOLATION: Target path "${target}" is not the authorized staging directory "${canonicalStaging}".`);
  }

  if (fs.existsSync(target)) {
    throw new Error(
      `STAGING_EXISTS_ERROR: Target staging path "${target}" already exists.\n` +
      `Automatic recursive deletion is disabled for safety.\n` +
      `Please manually review, archive, or remove the previous staging directory before re-creating.`
    );
  }

  return target;
}

export function assertSafeExistingStagingTarget(targetPath?: string): string {
  const root = findWorkspaceRoot().toLowerCase();
  const canonicalStaging = getCanonicalStagingDbPath();
  const target = path.resolve(targetPath || canonicalStaging);
  const targetLower = target.toLowerCase();

  const canonicalLive = path.resolve(root, '.pglite-data').toLowerCase();
  const archivedCorrupted = path.resolve(root, '.pglite-data-ARCHIVED-CORRUPTED').toLowerCase();
  const backupIncident = path.resolve(root, '.pglite-data-BACKUP-INCIDENT').toLowerCase();

  if (targetLower === canonicalLive) {
    throw new Error('SECURITY_VIOLATION: Refusing to target live canonical .pglite-data for staging operation.');
  }

  if (targetLower === archivedCorrupted || targetLower === backupIncident) {
    throw new Error('SECURITY_VIOLATION: Refusing to touch archived incident evidence database.');
  }

  if (targetLower !== canonicalStaging.toLowerCase()) {
    throw new Error(`SECURITY_VIOLATION: Target path "${target}" is not the authorized staging directory "${canonicalStaging}".`);
  }

  if (!fs.existsSync(target)) {
    throw new Error(`STAGING_NOT_FOUND_ERROR: Staging directory "${target}" does not exist. Run create-staging first.`);
  }

  const isPostgresDir =
    fs.existsSync(path.join(target, 'PG_VERSION')) ||
    fs.existsSync(path.join(target, 'global')) ||
    fs.existsSync(path.join(target, 'base'));

  if (!isPostgresDir) {
    throw new Error(`INVALID_STAGING_DB_ERROR: Directory "${target}" exists but is not a valid PGlite database directory.`);
  }

  const statusFilePath = getStagingStatusFilePath(target);
  if (!fs.existsSync(statusFilePath)) {
    throw new Error(`STAGING_NOT_READY_ERROR: Staging directory "${target}" lacks .staging-status.json readiness marker.`);
  }

  const statusContent: StagingStatusFile = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
  if (statusContent.status !== 'READY') {
    throw new Error(
      `STAGING_NOT_READY_ERROR: Staging database is in "${statusContent.status}" state.\n` +
      `Details: ${statusContent.error || 'Provisioning did not complete cleanly.'}\n` +
      `Please investigate, remove, and recreate the staging database.`
    );
  }

  return target;
}

export function loadAuthoritativeMigrationChain(): Array<{ filename: string; sql: string; checksum: string }> {
  const root = findWorkspaceRoot();
  const migrationsDir = path.resolve(root, 'packages/database/drizzle/migrations');

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`MIGRATIONS_DIR_NOT_FOUND: Authoritative migrations directory "${migrationsDir}" does not exist.`);
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    throw new Error(`MIGRATIONS_EMPTY: No SQL migration files found in "${migrationsDir}".`);
  }

  return files.map((filename) => {
    const filePath = path.join(migrationsDir, filename);
    const rawSql = fs.readFileSync(filePath, 'utf8');
    const checksum = crypto.createHash('sha256').update(rawSql).digest('hex');
    return { filename, sql: rawSql, checksum };
  });
}

/**
 * Validates the schema of a newly provisioned staging database before marking it READY.
 */
export async function validateStagingSchemaContract(stagingPglite: PGlite): Promise<void> {
  const inventory = getAuthoritativeTableInventory();
  const expectedTableNames = new Set(inventory.map((t) => t.tableName));

  // 1. Discover existing public tables
  const existingTablesRes = await stagingPglite.query<{ table_name: string }>(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  `);
  const existingTableNames = new Set(existingTablesRes.rows.map((r) => r.table_name));

  // Check all expected tables are present
  for (const expTbl of expectedTableNames) {
    if (!existingTableNames.has(expTbl)) {
      throw new Error(`STAGING_CONTRACT_VIOLATION: Expected authoritative table "${expTbl}" is missing in staging database.`);
    }
  }

  // Check no obsolete table like postal_codes exists
  if (existingTableNames.has('postal_codes')) {
    throw new Error('STAGING_CONTRACT_VIOLATION: Obsolete table "postal_codes" was created in staging.');
  }

  // 2. Validate critical geography columns on schools table
  const schoolColsRes = await stagingPglite.query<{ column_name: string }>(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'schools';
  `);
  const schoolCols = new Set(schoolColsRes.rows.map((r) => r.column_name));
  const criticalSchoolCols = ['country_id', 'state_id', 'city_id', 'area_id', 'school_type'];
  for (const col of criticalSchoolCols) {
    if (!schoolCols.has(col)) {
      throw new Error(`STAGING_CONTRACT_VIOLATION: schools table lacks critical column "${col}".`);
    }
  }

  // 3. Validate postal_code on areas table
  const areaColsRes = await stagingPglite.query<{ column_name: string }>(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'areas';
  `);
  const areaCols = new Set(areaColsRes.rows.map((r) => r.column_name));
  if (!areaCols.has('postal_code')) {
    throw new Error('STAGING_CONTRACT_VIOLATION: areas table lacks column "postal_code".');
  }

  // 4. Validate system metadata tables
  if (!existingTableNames.has('_campusos_migrations') || !existingTableNames.has('_campusos_database_identity')) {
    throw new Error('STAGING_CONTRACT_VIOLATION: System metadata tables (_campusos_migrations, _campusos_database_identity) missing in staging.');
  }
}

export async function createCleanStagingDatabase(stagingPath?: string): Promise<string> {
  const targetDir = assertSafeNewStagingTarget(stagingPath);
  logger.info(`Initializing fresh clean staging PGlite database at "${targetDir}"...`);

  fs.mkdirSync(targetDir, { recursive: true });

  const statusFilePath = getStagingStatusFilePath(targetDir);
  const initialStatus: StagingStatusFile = {
    status: 'PROVISIONING',
    createdAt: new Date().toISOString(),
    migrationsApplied: [],
    authoritativeTableCount: 0,
  };
  fs.writeFileSync(statusFilePath, JSON.stringify(initialStatus, null, 2), 'utf8');

  let stagingPglite: PGlite | undefined;

  try {
    const { ltree } = await import('@electric-sql/pglite/contrib/ltree');
    stagingPglite = new PGlite(targetDir, {
      extensions: {
        ltree,
      },
    });
    await stagingPglite.waitReady;

    // Infrastructure Prerequisite:
    // ltree is a required infrastructure prerequisite because migration 0000 defines
    // hierarchy_nodes.path as ltree before migration 0001 records/enforces the extension.
    await stagingPglite.exec('CREATE EXTENSION IF NOT EXISTS "ltree";');

    const migrationChain = loadAuthoritativeMigrationChain();
    logger.info(`Applying ${migrationChain.length} authoritative Drizzle migration files in order...`);

    await stagingPglite.exec(`
      CREATE TABLE IF NOT EXISTS _campusos_migrations (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        checksum VARCHAR(64) NOT NULL
      );

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

    const applied: Array<{ filename: string; checksum: string }> = [];

    for (const m of migrationChain) {
      logger.info(`Executing migration: ${m.filename} (SHA-256: ${m.checksum.slice(0, 12)})`);
      await stagingPglite.exec(m.sql);

      await stagingPglite.query(
        `INSERT INTO _campusos_migrations (id, name, checksum) VALUES ($1, $2, $3);`,
        [m.filename, m.filename, m.checksum]
      );
      applied.push({ filename: m.filename, checksum: m.checksum });
    }

    await stagingPglite.query(
      `INSERT INTO _campusos_database_identity (id, system_id, cluster_name, environment, schema_version)
       VALUES ('canonical-identity', $1, $2, 'development', $3);`,
      [CANONICAL_SYSTEM_ID, CANONICAL_CLUSTER_NAME, CURRENT_SCHEMA_VERSION]
    );

    // Schema contract validation prior to marking READY
    logger.info('Validating staging schema contract before marking READY...');
    await validateStagingSchemaContract(stagingPglite);

    const inventory = getAuthoritativeTableInventory();

    const readyStatus: StagingStatusFile = {
      status: 'READY',
      createdAt: initialStatus.createdAt,
      readyAt: new Date().toISOString(),
      migrationsApplied: applied,
      authoritativeTableCount: inventory.length,
    };
    fs.writeFileSync(statusFilePath, JSON.stringify(readyStatus, null, 2), 'utf8');

    logger.info('Clean staging database schema initialized and contract-verified successfully.');
    console.log('\n======================================================');
    console.log('CAMPUSOS CLEAN STAGING DATABASE CREATED');
    console.log('======================================================');
    console.log(`Staging Path:         ${targetDir}`);
    console.log(`Migrations Applied:   ${migrationChain.length} SQL files (Real SHA-256 stamped)`);
    console.log(`Authoritative Tables: ${inventory.length}`);
    console.log(`Contract Validation:  ✅ PASSED (All tables & critical columns verified)`);
    console.log(`Readiness Status:     ✅ READY (Marker persisted)`);
    console.log('======================================================\n');

    return targetDir;
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Staging database provisioning failed:', { error: errorMsg });

    const failedStatus: StagingStatusFile = {
      status: 'FAILED',
      createdAt: initialStatus.createdAt,
      failedAt: new Date().toISOString(),
      error: errorMsg,
      migrationsApplied: [],
      authoritativeTableCount: 0,
    };
    fs.writeFileSync(statusFilePath, JSON.stringify(failedStatus, null, 2), 'utf8');

    throw new Error(`STAGING_PROVISIONING_FAILED: ${errorMsg}`);
  } finally {
    if (stagingPglite) {
      await stagingPglite.close();
    }
  }
}
