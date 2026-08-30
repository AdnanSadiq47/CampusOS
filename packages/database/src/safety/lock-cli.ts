import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import {
  lockFeature,
  unlockFeature,
  verifyAllLocks,
} from './lock-guard.js';
import { getPgLiteDataDir, assertAuthorizedDbAccess } from '../client.js';
import { REQUIRED_SYSTEM_TABLES } from '../migration/index.js';

const logger = new StructuredLogger('LockCLI');

async function handleIdentityInit() {
  logger.info('Starting explicit CampusOS database identity initialization...');
  const dataDir = getPgLiteDataDir();

  process.env['CAMPUSOS_AUTHORIZED_DB_OWNER'] = 'API_CORE';
  assertAuthorizedDbAccess(dataDir);

  const pglite = new PGlite(dataDir);

  try {
    await pglite.waitReady;

    // 1. Read-only safety check: Verify core business tables exist
    logger.info('Performing read-only verification of existing database tables...');
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
        `CANNOT INITIALIZE IDENTITY ON INCOMPLETE DATABASE SCHEMA.\n` +
        `Missing required core tables: ${missingTables.join(', ')}.\n` +
        `Refusing to stamp identity on an unpopulated or corrupted database.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // 2. Determine exact identity state: A, B, C, D, or E
    logger.info('Inspecting database identity table and canonical record status...');
    
    // Check if _campusos_database_identity table exists in information_schema
    const tableCheckRes = await pglite.query<{ count: string }>(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = '_campusos_database_identity';
    `);
    const tableExists = Number(tableCheckRes.rows[0]?.count || 0) > 0;

    if (!tableExists) {
      // ── STATE A: Table missing ───────────────────────────────────────────
      logger.info('[STATE A] Identity table missing. Creating table and inserting canonical identity...');
      
      await pglite.exec(`
        CREATE TABLE _campusos_database_identity (
          id VARCHAR(64) PRIMARY KEY,
          system_id VARCHAR(128) NOT NULL,
          cluster_name VARCHAR(255) NOT NULL,
          environment VARCHAR(64) NOT NULL,
          schema_version VARCHAR(32) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          verified_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );
      `);

      const insertRes = await pglite.query<{
        id: string;
        system_id: string;
        cluster_name: string;
        environment: string;
        schema_version: string;
      }>(`
        INSERT INTO _campusos_database_identity (id, system_id, cluster_name, environment, schema_version)
        VALUES ('canonical-identity', $1, $2, $3, $4)
        RETURNING id, system_id, cluster_name, environment, schema_version;
      `, ['campusos-local-canonical', 'CampusOS Canonical Cluster', process.env['NODE_ENV'] || 'development', '1.0.0']);

      const created = insertRes.rows[0];
      console.log('\n======================================================');
      console.log('CAMPUSOS DATABASE IDENTITY INITIALIZED [STATE A]');
      console.log('======================================================');
      console.log(`System ID:      ${created?.system_id}`);
      console.log(`Cluster Name:   ${created?.cluster_name}`);
      console.log(`Environment:    ${created?.environment}`);
      console.log(`Schema Version: ${created?.schema_version}`);
      console.log(`Status:         ✅ CREATED & INITIALIZED`);
      console.log('======================================================\n');
      return created;
    }

    // Table exists: Query the canonical row
    let rowRes;
    try {
      rowRes = await pglite.query<{
        id: string;
        system_id: string;
        cluster_name: string;
        environment: string;
        schema_version: string;
        created_at: string;
        verified_at: string;
      }>(`
        SELECT id, system_id, cluster_name, environment, schema_version, created_at, verified_at
        FROM _campusos_database_identity
        WHERE id = 'canonical-identity'
        LIMIT 1;
      `);
    } catch (err: any) {
      // ── STATE E: Unexpected DB query failure ─────────────────────────────
      logger.error('[STATE E] Failed to query _campusos_database_identity table', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw new Error(`[STATE E] FAIL-CLOSED: Unexpected error querying identity table: ${err.message}`);
    }

    const row = rowRes.rows[0];

    if (!row) {
      // ── STATE B: Table exists, canonical row missing ──────────────────────
      logger.info('[STATE B] Identity table exists but canonical row missing. Inserting canonical row...');
      
      const insertRes = await pglite.query<{
        id: string;
        system_id: string;
        cluster_name: string;
        environment: string;
        schema_version: string;
      }>(`
        INSERT INTO _campusos_database_identity (id, system_id, cluster_name, environment, schema_version)
        VALUES ('canonical-identity', $1, $2, $3, $4)
        RETURNING id, system_id, cluster_name, environment, schema_version;
      `, ['campusos-local-canonical', 'CampusOS Canonical Cluster', process.env['NODE_ENV'] || 'development', '1.0.0']);

      const created = insertRes.rows[0];
      console.log('\n======================================================');
      console.log('CAMPUSOS DATABASE IDENTITY ROW INSERTED [STATE B]');
      console.log('======================================================');
      console.log(`System ID:      ${created?.system_id}`);
      console.log(`Cluster Name:   ${created?.cluster_name}`);
      console.log(`Environment:    ${created?.environment}`);
      console.log(`Schema Version: ${created?.schema_version}`);
      console.log(`Status:         ✅ INSERTED`);
      console.log('======================================================\n');
      return created;
    }

    // Row exists: Validate system_id and schema_version
    if (row.system_id === 'campusos-local-canonical' && row.schema_version === '1.0.0') {
      // ── STATE C: Valid canonical identity exists (Zero writes) ────────────
      logger.info('[STATE C] Valid canonical identity verified. Performing ZERO writes.', {
        systemId: row.system_id,
        clusterName: row.cluster_name,
        environment: row.environment,
        schemaVersion: row.schema_version,
      });

      console.log('\n======================================================');
      console.log('CAMPUSOS DATABASE IDENTITY ALREADY VALID [STATE C]');
      console.log('======================================================');
      console.log(`System ID:      ${row.system_id}`);
      console.log(`Cluster Name:   ${row.cluster_name}`);
      console.log(`Environment:    ${row.environment}`);
      console.log(`Schema Version: ${row.schema_version}`);
      console.log(`Status:         ✅ ACTIVE (Zero writes performed)`);
      console.log('======================================================\n');
      return row;
    }

    // ── STATE D: Conflicting or corrupted identity record (Fail closed) ─────
    const mismatchError =
      `[STATE D] DATABASE IDENTITY CONFLICT / CORRUPTION DETECTED.\n` +
      `Expected system_id="campusos-local-canonical", schema_version="1.0.0".\n` +
      `Found system_id="${row.system_id}", schema_version="${row.schema_version}".\n` +
      `Refusing initialization to prevent overwriting or connecting to an unintended database. (Zero writes performed)`;
    logger.error(mismatchError);
    throw new Error(mismatchError);
  } finally {
    await pglite.close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'identity:init' || command === 'db:identity:init') {
    await handleIdentityInit();
    process.exit(0);
  }

  if (!command || command === 'verify' || command === 'verify:locks') {
    logger.info('Running CampusOS Feature & Page Lock Verification...');
    const report = await verifyAllLocks();
    
    console.log('\n======================================================');
    console.log('CAMPUSOS PAGE & FEATURE LOCK VERIFICATION REPORT');
    console.log('======================================================');
    console.log(`Total Registered Features: ${report.totalFeatures}`);
    console.log(`Locked Features:           ${report.lockedFeatures}`);
    console.log(`Unlocked Features:         ${report.unlockedFeatures}`);
    console.log(`Overall Status:            ${report.success ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('======================================================\n');

    if (!report.success) {
      console.error('LOCKED PAGE / FEATURE VIOLATIONS DETECTED:');
      for (const err of report.errors) {
        console.error(`- ${err}`);
      }
      process.exit(1);
    } else {
      console.log('All locked features and pages are intact with 0 unauthorized modifications.');
      process.exit(0);
    }
  }

  if (command === 'lock' || command === 'lock:page') {
    const featureKey = args[1];
    if (!featureKey) {
      console.error('Usage: lock:page <feature-key> --name "<Display Name>" --files "<file1,file2>" [--tables "<t1,t2>"]');
      process.exit(1);
    }

    let displayName = featureKey;
    let filePaths: string[] = [];
    let tables: string[] = [];

    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) {
        displayName = args[i + 1]!;
        i++;
      } else if (args[i] === '--files' && args[i + 1]) {
        filePaths = args[i + 1]!.split(',').map((s) => s.trim());
        i++;
      } else if (args[i] === '--tables' && args[i + 1]) {
        tables = args[i + 1]!.split(',').map((s) => s.trim());
        i++;
      }
    }

    if (filePaths.length === 0) {
      console.error('Error: --files argument is required with at least one file path.');
      process.exit(1);
    }

    const locked = await lockFeature({
      featureKey,
      displayName,
      filePaths,
      tables,
    });

    console.log(`\n✅ Feature "${locked.displayName}" (${locked.featureKey}) successfully LOCKED at version ${locked.version}.`);
    process.exit(0);
  }

  if (command === 'unlock' || command === 'unlock:page') {
    const featureKey = args[1];
    let reason = '';
    for (let i = 2; i < args.length; i++) {
      if ((args[i] === '--reason' || args[i] === '-r') && args[i + 1]) {
        reason = args[i + 1]!;
        i++;
      }
    }

    if (!featureKey || !reason) {
      console.error('Usage: unlock:page <feature-key> --reason "<Detailed justification>"');
      process.exit(1);
    }

    const unlocked = unlockFeature(featureKey, reason);
    console.log(`\n🔓 Feature "${unlocked.displayName}" (${unlocked.featureKey}) is now UNLOCKED (v${unlocked.version}).`);
    console.log(`Reason: ${reason}`);
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Lock CLI Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
