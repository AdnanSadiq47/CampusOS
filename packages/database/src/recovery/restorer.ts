import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import { assertSafeExistingStagingTarget, loadAuthoritativeMigrationChain } from './staging-creator.js';
import { getAuthoritativeTableInventory } from './inventory.js';
import {
  DatabaseRecoveryArtifact,
  computeArtifactCompositeChecksum,
  computeDeterministicTableHash,
  TableExportStatus,
} from './exporter.js';

const logger = new StructuredLogger('RecoveryRestorer');

export type MigrationReconciliationStatus =
  | 'MATCH'
  | 'HISTORICAL_LEGACY'
  | 'EXTRA_IN_SOURCE'
  | 'EXTRA_IN_STAGING'
  | 'MISSING_IN_SOURCE'
  | 'MISMATCH';

export interface MigrationReconciliationItem {
  id: string;
  sourcePresence: 'PRESENT' | 'MISSING';
  sourceChecksum: string;
  stagingPresence: 'PRESENT' | 'MISSING';
  stagingChecksum: string;
  currentFileChecksum: string;
  status: MigrationReconciliationStatus;
  isApproved: boolean;
  notes?: string;
}

export interface RestoreReport {
  stagingPath: string;
  totalTablesAttempted: number;
  totalRowsInserted: number;
  perTableCounts: Record<string, number>;
  status: 'SUCCESS' | 'FAILED';
  metadataReconciliation: {
    identityStatus: string;
    migrationsStatus: string;
    migrationDetails: MigrationReconciliationItem[];
  };
  error?: string;
}

export const RECOGNIZED_LEGACY_MIGRATION_CHECKSUMS = new Set([
  'sha256-initial',
  'sha256-verified',
  'sha256-phase2',
  'legacy-manual',
]);

export async function runRecoveryRestore(
  exportFilePath: string,
  stagingPath?: string,
  options: {
    allowKnownIncidentMissingIdentity?: boolean;
    allowKnownIncidentMissingSourceMigrations?: boolean;
  } = {
    allowKnownIncidentMissingIdentity: false,
    allowKnownIncidentMissingSourceMigrations: false,
  }
): Promise<RestoreReport> {
  const targetDir = assertSafeExistingStagingTarget(stagingPath);
  logger.info(`Starting pre-flight checks and restore into staging database "${targetDir}"...`);

  if (!fs.existsSync(exportFilePath)) {
    throw new Error(`Export artifact not found: "${exportFilePath}"`);
  }

  const raw = fs.readFileSync(exportFilePath, 'utf8');
  const artifact: DatabaseRecoveryArtifact = JSON.parse(raw);

  // ── PREFLIGHT GATE 1: Format Version Check ────────────────────────
  if (artifact.formatVersion !== '1.0.0') {
    throw new Error(`PREFLIGHT_ERROR: Unsupported artifact format version "${artifact.formatVersion}". Expected "1.0.0".`);
  }

  // ── PREFLIGHT GATE 2: Artifact Self-Integrity Checksum Validation ──
  const computedChecksum = computeArtifactCompositeChecksum(artifact.tables);
  if (computedChecksum !== artifact.compositeChecksum) {
    throw new Error(
      `PREFLIGHT_ERROR: Artifact checksum mismatch! Integrity check failed.\n` +
      `Expected in file: ${artifact.compositeChecksum}\n` +
      `Recomputed:       ${computedChecksum}`
    );
  }
  logger.info('Artifact composite checksum verified 100% intact.');

  // ── PREFLIGHT GATE 3: Authoritative Table Set Parity Check ─────────
  const inventory = getAuthoritativeTableInventory();
  const expectedTableNames = new Set(inventory.map((t) => t.tableName));
  const artifactTableNames = new Set(Object.keys(artifact.tables));

  for (const expTbl of expectedTableNames) {
    if (!artifactTableNames.has(expTbl)) {
      throw new Error(`PREFLIGHT_FAIL_CLOSED: Authoritative table "${expTbl}" is completely absent from artifact table manifest.`);
    }
  }

  // ── PREFLIGHT GATE 4: Comprehensive Artifact Entry Integrity Checks ─
  const allowedStatuses: TableExportStatus[] = [
    'EXISTS_WITH_DATA',
    'EXISTS_EMPTY',
    'MISSING_EXPECTED',
    'UNEXPECTED_SOURCE',
  ];

  const canonicalEmptyHash = 'EMPTY';

  for (const [keyName, entry] of Object.entries(artifact.tables)) {
    if (keyName !== entry.tableName) {
      throw new Error(`PREFLIGHT_ERROR: Artifact entry key "${keyName}" does not match entry tableName "${entry.tableName}".`);
    }

    if (!allowedStatuses.includes(entry.status)) {
      throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" has invalid status "${entry.status}".`);
    }

    // Verify classification parity for authoritative tables
    const authoritativeItem = inventory.find((i) => i.tableName === entry.tableName);
    if (authoritativeItem && entry.classification !== authoritativeItem.classification) {
      throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" classification "${entry.classification}" != expected "${authoritativeItem.classification}".`);
    }

    // Verify duplicate column names
    const colNames = entry.columns.map((c) => c.name);
    if (new Set(colNames).size !== colNames.length) {
      throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" contains duplicate column definitions in export.`);
    }

    if (entry.status === 'EXISTS_EMPTY') {
      if (entry.rowCount !== 0 || entry.rows.length !== 0) {
        throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" has status EXISTS_EMPTY but row count is ${entry.rowCount}.`);
      }
      if (entry.contentHash !== canonicalEmptyHash) {
        throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" has status EXISTS_EMPTY but contentHash is "${entry.contentHash}" instead of "${canonicalEmptyHash}".`);
      }
    }

    if (entry.status === 'MISSING_EXPECTED') {
      if (entry.rowCount !== 0 || entry.rows.length !== 0) {
        throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" has status MISSING_EXPECTED but row count is ${entry.rowCount}.`);
      }
      if (entry.contentHash !== 'TABLE_MISSING') {
        throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" has status MISSING_EXPECTED but contentHash is "${entry.contentHash}".`);
      }
    }

    if (entry.status === 'EXISTS_WITH_DATA') {
      if (entry.rowCount <= 0 || entry.rows.length <= 0) {
        throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" has status EXISTS_WITH_DATA but rowCount is ${entry.rowCount}.`);
      }
      if (entry.rowCount !== entry.rows.length) {
        throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" rowCount (${entry.rowCount}) != rows.length (${entry.rows.length}).`);
      }
      const recomputedRowHash = computeDeterministicTableHash(entry.tableName, entry.rows);
      if (recomputedRowHash !== entry.contentHash) {
        throw new Error(`PREFLIGHT_ERROR: Table "${entry.tableName}" contentHash mismatch with actual rows.`);
      }
    }

    if (entry.status === 'UNEXPECTED_SOURCE') {
      if (entry.rowCount !== entry.rows.length) {
        throw new Error(`PREFLIGHT_ERROR: Unexpected table "${entry.tableName}" rowCount (${entry.rowCount}) != rows.length (${entry.rows.length}).`);
      }
    }
  }

  // ── PREFLIGHT GATE 5: Fail-Closed on MISSING_EXPECTED Tables (Strict Default) ──
  const missingTables: string[] = [];
  for (const [tbl, data] of Object.entries(artifact.tables)) {
    if (data.status === 'MISSING_EXPECTED') {
      if (tbl === '_campusos_database_identity' && options.allowKnownIncidentMissingIdentity) {
        console.warn('\n⚠️ [SECURITY EXCEPTION] Authorized explicit incident bypass for missing _campusos_database_identity in source.');
        continue;
      }
      missingTables.push(tbl);
    }
  }

  if (missingTables.length > 0) {
    throw new Error(
      `PREFLIGHT_FAIL_CLOSED: The following ${missingTables.length} authoritative tables are MISSING_EXPECTED in export:\n` +
      missingTables.map((t) => ` - ${t}`).join('\n') +
      `\nRestoration halted to prevent silent data loss.`
    );
  }

  // ── PREFLIGHT GATE 6: Fail-Closed on UNEXPECTED_SOURCE Tables with Data ──
  const unexpectedWithData: Array<{ tableName: string; rowCount: number }> = [];
  for (const [tbl, data] of Object.entries(artifact.tables)) {
    if (data.status === 'UNEXPECTED_SOURCE' && data.rowCount > 0) {
      unexpectedWithData.push({ tableName: tbl, rowCount: data.rowCount });
    }
  }

  if (unexpectedWithData.length > 0) {
    const tableList = unexpectedWithData.map((t) => ` - "${t.tableName}": ${t.rowCount} rows`).join('\n');
    throw new Error(
      `PREFLIGHT_FAIL_CLOSED: Source export contains ${unexpectedWithData.length} UNEXPECTED_SOURCE table(s) with data:\n` +
      tableList +
      `\nAutomatic omission forbidden. Explicit human architectural classification required before restoration.`
    );
  }

  const stagingPglite = new PGlite(targetDir);

  try {
    await stagingPglite.waitReady;

    // ── PREFLIGHT GATE 7: Verify Staging Database Has Zero Existing Business Rows ──
    for (const item of inventory) {
      if (item.tableName === '_campusos_migrations' || item.tableName === '_campusos_database_identity') {
        continue;
      }
      const existingRes = await stagingPglite.query<{ c: number }>(`SELECT count(*)::int as c FROM "${item.tableName}";`);
      const existingCount = existingRes.rows[0]?.c || 0;
      if (existingCount > 0) {
        throw new Error(
          `PREFLIGHT_ERROR: Staging table "${item.tableName}" is not empty (contains ${existingCount} rows).\n` +
          `Restore requires a freshly initialized empty staging database.`
        );
      }
    }

    // ── PREFLIGHT GATE 8: Column Compatibility Check ──────────────────
    for (const item of inventory) {
      if (item.tableName === '_campusos_migrations' || item.tableName === '_campusos_database_identity') {
        continue;
      }
      const tableData = artifact.tables[item.tableName];
      if (!tableData || tableData.rows.length === 0) continue;

      const stagingColsRes = await stagingPglite.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1;
      `, [item.tableName]);
      const stagingCols = new Set(stagingColsRes.rows.map((r) => r.column_name));

      for (const col of tableData.columns) {
        if (!stagingCols.has(col.name)) {
          throw new Error(
            `PREFLIGHT_SCHEMA_MISMATCH: Table "${item.tableName}" contains column "${col.name}" in export but it does not exist in staging schema.`
          );
        }
      }
    }

    // ── PREFLIGHT GATE 9: Migration & Identity Metadata Reconciliation Gate (FAIL-CLOSED) ──
    const stagingIdentityRes = await stagingPglite.query<{ id: string; system_id: string; schema_version: string }>(
      `SELECT id, system_id, schema_version FROM _campusos_database_identity WHERE id = 'canonical-identity';`
    );
    if (stagingIdentityRes.rows.length === 0) {
      throw new Error(`PREFLIGHT_ERROR: Staging database lacks canonical identity record.`);
    }

    const migrationChain = loadAuthoritativeMigrationChain();
    const sourceMigrationRows: Array<{ id: string; name: string; checksum: string }> =
      artifact.tables['_campusos_migrations']?.rows || [];

    const stagingMigrationRes = await stagingPglite.query<{ id: string; name: string; checksum: string }>(
      `SELECT id, name, checksum FROM _campusos_migrations ORDER BY id;`
    );
    const stagingMigrationRows = stagingMigrationRes.rows;

    const migrationDetails: MigrationReconciliationItem[] = [];
    const currentMigrationIds = new Set(migrationChain.map((m) => m.filename));
    const unapprovedMismatches: string[] = [];

    // 1. Reconcile all current migration files against staging and source
    for (const currentFile of migrationChain) {
      const srcRow = sourceMigrationRows.find((r) => r.id === currentFile.filename);
      const stgRow = stagingMigrationRows.find((r) => r.id === currentFile.filename);

      // Staging validation rule: MUST exist and MUST equal real SHA-256
      if (!stgRow) {
        unapprovedMismatches.push(`STAGING_MISSING: Migration "${currentFile.filename}" is missing from staging database.`);
      } else if (stgRow.checksum !== currentFile.checksum) {
        unapprovedMismatches.push(
          `STAGING_CHECKSUM_MISMATCH: Migration "${currentFile.filename}" staging checksum (${stgRow.checksum}) != file SHA-256 (${currentFile.checksum}).`
        );
      }

      let status: MigrationReconciliationStatus = 'MATCH';
      let isApproved = true;

      if (!srcRow) {
        status = 'MISSING_IN_SOURCE';
        if (options.allowKnownIncidentMissingSourceMigrations) {
          isApproved = true;
        } else {
          isApproved = false;
          unapprovedMismatches.push(
            `MISSING_IN_SOURCE: Migration "${currentFile.filename}" is absent from source database export.`
          );
        }
      } else if (srcRow.checksum === currentFile.checksum) {
        status = 'MATCH';
        isApproved = true;
      } else if (RECOGNIZED_LEGACY_MIGRATION_CHECKSUMS.has(srcRow.checksum)) {
        status = 'HISTORICAL_LEGACY';
        isApproved = true;
      } else {
        status = 'MISMATCH';
        isApproved = false;
        unapprovedMismatches.push(
          `SOURCE_CHECKSUM_MISMATCH: Migration "${currentFile.filename}" source checksum "${srcRow.checksum}" is an unrecognized mismatch against current SHA-256 "${currentFile.checksum}".`
        );
      }

      migrationDetails.push({
        id: currentFile.filename,
        sourcePresence: srcRow ? 'PRESENT' : 'MISSING',
        sourceChecksum: srcRow ? srcRow.checksum : 'N/A',
        stagingPresence: stgRow ? 'PRESENT' : 'MISSING',
        stagingChecksum: stgRow ? stgRow.checksum : 'N/A',
        currentFileChecksum: currentFile.checksum,
        status,
        isApproved,
      });
    }

    // 2. Check for unexpected extra migrations in source
    for (const srcRow of sourceMigrationRows) {
      if (!currentMigrationIds.has(srcRow.id)) {
        unapprovedMismatches.push(
          `EXTRA_IN_SOURCE: Source export contains migration "${srcRow.id}" not present in current migration chain.`
        );
        migrationDetails.push({
          id: srcRow.id,
          sourcePresence: 'PRESENT',
          sourceChecksum: srcRow.checksum,
          stagingPresence: 'MISSING',
          stagingChecksum: 'N/A',
          currentFileChecksum: 'N/A',
          status: 'EXTRA_IN_SOURCE',
          isApproved: false,
        });
      }
    }

    // 3. Check for unexpected extra migrations in staging
    for (const stgRow of stagingMigrationRows) {
      if (!currentMigrationIds.has(stgRow.id)) {
        unapprovedMismatches.push(
          `EXTRA_IN_STAGING: Staging database contains unexpected migration "${stgRow.id}".`
        );
        migrationDetails.push({
          id: stgRow.id,
          sourcePresence: 'MISSING',
          sourceChecksum: 'N/A',
          stagingPresence: 'PRESENT',
          stagingChecksum: stgRow.checksum,
          currentFileChecksum: 'N/A',
          status: 'EXTRA_IN_STAGING',
          isApproved: false,
        });
      }
    }

    // ── BLOCKING CHECK: Fail closed if ANY unapproved metadata mismatch exists ──
    if (unapprovedMismatches.length > 0) {
      const errorList = unapprovedMismatches.map((e) => ` - ${e}`).join('\n');
      throw new Error(
        `PREFLIGHT_METADATA_MISMATCH: Restoration halted due to unapproved migration metadata reconciliation errors:\n` +
        errorList +
        `\nHalting prior to BEGIN transaction to guarantee zero staging corruption.`
      );
    }

    const identityReconciliation =
      artifact.tables['_campusos_database_identity']?.status === 'MISSING_EXPECTED'
        ? 'SOURCE: MISSING_EXPECTED (Incident Condition) -> STAGING: CANONICAL (Provisioned)'
        : 'SOURCE: PRESENT -> STAGING: CANONICAL (Provisioned)';

    logger.info('Metadata Reconciliation Passed 100%:', {
      identity: identityReconciliation,
      totalMigrationsReconciled: migrationDetails.length,
    });

    const perTableCounts: Record<string, number> = {};
    let totalRowsInserted = 0;

    logger.info(`All 9 preflight gates PASSED. Beginning transaction-safe restoration (${inventory.length} tables)...`);

    // ── TRANSACTION BOUNDARY ──────────────────────────────────────────
    try {
      await stagingPglite.exec('ROLLBACK;');
    } catch {}

    await stagingPglite.exec('BEGIN;');

    try {
      for (const item of inventory) {
        if (item.tableName === '_campusos_migrations' || item.tableName === '_campusos_database_identity') {
          const countRes = await stagingPglite.query<{ c: number }>(`SELECT count(*)::int as c FROM "${item.tableName}";`);
          perTableCounts[item.tableName] = countRes.rows[0]?.c || 0;
          continue;
        }

        const tableData = artifact.tables[item.tableName];
        if (!tableData || tableData.rows.length === 0) {
          perTableCounts[item.tableName] = 0;
          continue;
        }

        const rows = tableData.rows;
        logger.info(`Restoring table "${item.tableName}" (${rows.length} rows)...`);

        for (const row of rows) {
          const colNames = Object.keys(row);
          const placeholders = colNames.map((_, i) => `$${i + 1}`).join(', ');
          const escapedColNames = colNames.map((c) => `"${c}"`).join(', ');
          const values = colNames.map((c) => {
            const val = row[c];
            if (val && typeof val === 'object' && !(val instanceof Date)) {
              return JSON.stringify(val);
            }
            return val;
          });

          await stagingPglite.query(
            `INSERT INTO "${item.tableName}" (${escapedColNames}) VALUES (${placeholders});`,
            values
          );
        }

        perTableCounts[item.tableName] = rows.length;
        totalRowsInserted += rows.length;
      }

      await stagingPglite.exec('COMMIT;');
      logger.info('Database restore transaction committed successfully.');

      const report: RestoreReport = {
        stagingPath: targetDir,
        totalTablesAttempted: inventory.length,
        totalRowsInserted,
        perTableCounts,
        status: 'SUCCESS',
        metadataReconciliation: {
          identityStatus: identityReconciliation,
          migrationsStatus: `Reconciled ${migrationDetails.length} migrations.`,
          migrationDetails,
        },
      };

      console.log('\n======================================================');
      console.log('CAMPUSOS STAGING DATABASE RESTORE COMPLETED');
      console.log('======================================================');
      console.log(`Staging Path:        ${targetDir}`);
      console.log(`Tables Processed:    ${inventory.length}`);
      console.log(`Total Rows Inserted: ${totalRowsInserted}`);
      console.log(`Identity Reconciled: ✅ ${identityReconciliation}`);
      console.log(`Status:              ✅ SUCCESS (Committed)`);
      console.log('======================================================\n');

      return report;
    } catch (err: any) {
      logger.error('Restoration failed! Rolling back transaction...', {
        error: err instanceof Error ? err.message : String(err),
      });
      try {
        await stagingPglite.exec('ROLLBACK;');
      } catch {}

      throw new Error(`RESTORE_ABORTED: Transaction rolled back due to error: ${err.message}`);
    }
  } finally {
    await stagingPglite.close();
  }
}
