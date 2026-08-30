import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import { getPgLiteDataDir, assertAuthorizedDbAccess, findWorkspaceRoot } from '../client.js';
import { getAuthoritativeTableInventory } from './inventory.js';

const logger = new StructuredLogger('RecoveryExporter');

export type TableExportStatus =
  | 'EXISTS_WITH_DATA'
  | 'EXISTS_EMPTY'
  | 'MISSING_EXPECTED'
  | 'UNEXPECTED_SOURCE';

export interface TableExportEntry {
  tableName: string;
  classification: string;
  status: TableExportStatus;
  rowCount: number;
  columns: Array<{ name: string; dataType: string; isNullable: boolean }>;
  rows: any[];
  contentHash: string;
}

export interface DatabaseRecoveryArtifact {
  formatVersion: '1.0.0';
  timestamp: string;
  sourceDbPath: string;
  authoritativeTableCount: number;
  totalExportedRows: number;
  tableStatusSummary: {
    existsWithData: number;
    existsEmpty: number;
    missingExpected: number;
    unexpectedSource: number;
  };
  tables: Record<string, TableExportEntry>;
  compositeChecksum: string;
}

export function computeDeterministicTableHash(_tableName: string, rows: any[]): string {
  if (rows.length === 0) return 'EMPTY';

  const rowHashes = rows.map((r) => {
    const sortedObj: Record<string, any> = {};
    for (const key of Object.keys(r).sort()) {
      const val = r[key];
      sortedObj[key] = val instanceof Date ? val.toISOString() : val;
    }
    return crypto.createHash('sha256').update(JSON.stringify(sortedObj)).digest('hex');
  });

  rowHashes.sort();
  return crypto.createHash('sha256').update(rowHashes.join(':')).digest('hex');
}

/**
 * Computes deterministic composite checksum covering ALL tables (authoritative and unexpected).
 */
export function computeArtifactCompositeChecksum(tables: Record<string, TableExportEntry>): string {
  const tableEntries = Object.entries(tables).sort(([a], [b]) => a.localeCompare(b));
  const tokens = tableEntries.map(([name, data]) => {
    return `${name}:${data.status}:${data.rowCount}:${data.contentHash}`;
  });

  return crypto.createHash('sha256').update(tokens.join('|')).digest('hex');
}

export async function runRecoveryExport(outputPath?: string): Promise<DatabaseRecoveryArtifact> {
  logger.info('Starting explicit READ-ONLY CampusOS logical database recovery export...');
  const dataDir = getPgLiteDataDir();

  process.env['CAMPUSOS_AUTHORIZED_DB_OWNER'] = 'API_CORE';
  assertAuthorizedDbAccess(dataDir);

  const pglite = new PGlite(dataDir);

  try {
    await pglite.waitReady;

    // 1. Discover all public tables currently in source database
    const sourceTablesRes = await pglite.query<{ table_name: string }>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const sourceTableNames = new Set(sourceTablesRes.rows.map((r) => r.table_name));

    // 2. Load complete authoritative table inventory
    const authoritativeInventory = getAuthoritativeTableInventory();
    const authoritativeTableNames = new Set(authoritativeInventory.map((t) => t.tableName));

    const exportTables: Record<string, TableExportEntry> = {};
    let totalExportedRows = 0;

    let existsWithDataCount = 0;
    let existsEmptyCount = 0;
    let missingExpectedCount = 0;
    let unexpectedSourceCount = 0;

    // 3. Process authoritative tables in restore order
    for (const item of authoritativeInventory) {
      if (!sourceTableNames.has(item.tableName)) {
        missingExpectedCount++;
        exportTables[item.tableName] = {
          tableName: item.tableName,
          classification: item.classification,
          status: 'MISSING_EXPECTED',
          rowCount: 0,
          columns: [],
          rows: [],
          contentHash: 'TABLE_MISSING',
        };
        logger.warn(`Authoritative table "${item.tableName}" is MISSING_EXPECTED in source database.`);
        continue;
      }

      // Fetch column metadata
      const colsRes = await pglite.query<{ column_name: string; data_type: string; is_nullable: string }>(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [item.tableName]);

      const columns = colsRes.rows.map((c) => ({
        name: c.column_name,
        dataType: c.data_type,
        isNullable: c.is_nullable === 'YES',
      }));

      // Extract rows (Strictly SELECT only)
      const dataRes = await pglite.query(`SELECT * FROM "${item.tableName}";`);
      const rows = dataRes.rows || [];
      const rowCount = rows.length;
      totalExportedRows += rowCount;

      const status: TableExportStatus = rowCount > 0 ? 'EXISTS_WITH_DATA' : 'EXISTS_EMPTY';
      if (rowCount > 0) existsWithDataCount++;
      else existsEmptyCount++;

      const contentHash = computeDeterministicTableHash(item.tableName, rows);

      exportTables[item.tableName] = {
        tableName: item.tableName,
        classification: item.classification,
        status,
        rowCount,
        columns,
        rows,
        contentHash,
      };

      logger.info(`Exported "${item.tableName}" [${status}]: ${rowCount} rows`);
    }

    // 4. Discover and account for unexpected extra tables in source database
    for (const srcTbl of sourceTableNames) {
      if (!authoritativeTableNames.has(srcTbl)) {
        unexpectedSourceCount++;
        const colsRes = await pglite.query<{ column_name: string; data_type: string; is_nullable: string }>(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [srcTbl]);

        const columns = colsRes.rows.map((c) => ({
          name: c.column_name,
          dataType: c.data_type,
          isNullable: c.is_nullable === 'YES',
        }));

        const dataRes = await pglite.query(`SELECT * FROM "${srcTbl}";`);
        const rows = dataRes.rows || [];
        const contentHash = computeDeterministicTableHash(srcTbl, rows);

        exportTables[srcTbl] = {
          tableName: srcTbl,
          classification: 'SYSTEM_METADATA',
          status: 'UNEXPECTED_SOURCE',
          rowCount: rows.length,
          columns,
          rows,
          contentHash,
        };
        logger.warn(`Source DB contains UNEXPECTED_SOURCE table "${srcTbl}" with ${rows.length} rows.`);
      }
    }

    // 5. Compute complete composite checksum
    const compositeChecksum = computeArtifactCompositeChecksum(exportTables);

    const artifact: DatabaseRecoveryArtifact = {
      formatVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      sourceDbPath: dataDir,
      authoritativeTableCount: authoritativeInventory.length,
      totalExportedRows,
      tableStatusSummary: {
        existsWithData: existsWithDataCount,
        existsEmpty: existsEmptyCount,
        missingExpected: missingExpectedCount,
        unexpectedSource: unexpectedSourceCount,
      },
      tables: exportTables,
      compositeChecksum,
    };

    const root = findWorkspaceRoot();
    const resolvedOutPath =
      outputPath ||
      path.resolve(root, '.backups', `recovery-export-${Date.now()}.json`);

    const outDir = path.dirname(resolvedOutPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(resolvedOutPath, JSON.stringify(artifact, null, 2), 'utf8');

    console.log('\n======================================================');
    console.log('CAMPUSOS DATABASE RECOVERY EXPORT COMPLETED');
    console.log('======================================================');
    console.log(`Source DB:            ${dataDir}`);
    console.log(`Export File:          ${resolvedOutPath}`);
    console.log(`Authoritative Tables: ${artifact.authoritativeTableCount}`);
    console.log(`Tables with Data:     ${existsWithDataCount}`);
    console.log(`Empty Tables:         ${existsEmptyCount}`);
    console.log(`Missing Tables:       ${missingExpectedCount}`);
    console.log(`Unexpected Tables:    ${unexpectedSourceCount}`);
    console.log(`Total Rows Exported:  ${totalExportedRows}`);
    console.log(`Composite Checksum:   ${compositeChecksum}`);
    console.log('======================================================\n');

    return artifact;
  } finally {
    await pglite.close();
  }
}
