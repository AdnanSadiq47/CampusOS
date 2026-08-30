import crypto from 'crypto';
import { PGlite } from '@electric-sql/pglite';

export const PROTECTED_BASELINE_TABLES = [
  'organizations',
  'head_offices',
  'regions',
  'schools',
  'branches',
  'countries',
  'states',
  'cities',
  'areas',
] as const;

export interface TableColumnMeta {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

export interface TableFingerprint {
  tableName: string;
  rowCount: number;
  contentHash: string;
  schemaHash: string;
  columns: TableColumnMeta[];
}

export interface DatabaseFingerprint {
  timestamp: string;
  databaseSystemId?: string;
  compositeHash: string;
  tables: Record<string, TableFingerprint>;
}

export interface FingerprintDiff {
  isEqual: boolean;
  changedTables: Array<{
    table: string;
    reasons: Array<'ROW_COUNT_CHANGED' | 'CONTENT_CHANGED' | 'SCHEMA_CHANGED' | 'TABLE_MISSING'>;
    beforeRowCount?: number;
    afterRowCount?: number;
    beforeContentHash?: string;
    afterContentHash?: string;
  }>;
  summary: string;
}

function normalizeValue(val: any): any {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.map(normalizeValue);
    const sortedObj: Record<string, any> = {};
    for (const key of Object.keys(val).sort()) {
      sortedObj[key] = normalizeValue(val[key]);
    }
    return sortedObj;
  }
  return val;
}

function canonicalStringify(obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort();
  const normalized: Record<string, any> = {};
  for (const k of sortedKeys) {
    // We intentionally include non-volatile business fields
    normalized[k] = normalizeValue(obj[k]);
  }
  return JSON.stringify(normalized);
}

/**
 * Computes a deterministic SHA-256 fingerprint for a single table.
 */
export async function computeTableFingerprint(
  pglite: PGlite,
  tableName: string
): Promise<TableFingerprint> {
  // 1. Fetch Schema Metadata
  const colRes = await pglite.query<{
    column_name: string;
    data_type: string;
    is_nullable: string;
  }>(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position ASC;
  `, [tableName]);

  const pkRes = await pglite.query<{ column_name: string }>(`
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1;
  `, [tableName]);

  const pkSet = new Set(pkRes.rows.map((r) => r.column_name));
  const columns: TableColumnMeta[] = colRes.rows.map((r) => ({
    name: r.column_name,
    dataType: r.data_type,
    isNullable: r.is_nullable === 'YES',
    isPrimaryKey: pkSet.has(r.column_name),
  }));

  const schemaString = JSON.stringify(columns);
  const schemaHash = crypto.createHash('sha256').update(schemaString).digest('hex');

  // 2. Fetch All Rows Deterministically
  let rows: any[] = [];
  try {
    const dataRes = await pglite.query(`SELECT * FROM "${tableName}" ORDER BY id ASC;`);
    rows = dataRes.rows;
  } catch (err) {
    // If table doesn't have 'id', fallback to default ordering
    const dataRes = await pglite.query(`SELECT * FROM "${tableName}";`);
    rows = dataRes.rows;
  }

  const rowCount = rows.length;
  const contentHashes: string[] = rows.map((r) => {
    const serialized = canonicalStringify(r);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  });

  // Sort content hashes deterministically to ensure row-order invariance if non-id fallback
  contentHashes.sort();
  const contentCombined = contentHashes.join(':');
  const contentHash = crypto.createHash('sha256').update(contentCombined).digest('hex');

  return {
    tableName,
    rowCount,
    contentHash,
    schemaHash,
    columns,
  };
}

/**
 * Computes a comprehensive read-only fingerprint across all protected tables.
 */
export async function computeDatabaseFingerprint(
  pglite: PGlite,
  tables: readonly string[] = PROTECTED_BASELINE_TABLES
): Promise<DatabaseFingerprint> {
  const tableFingerprints: Record<string, TableFingerprint> = {};
  const hashCollector: string[] = [];

  // Also query system identity if present
  let systemId: string | undefined;
  try {
    const idRes = await pglite.query<{ system_id: string }>(
      `SELECT system_id FROM _campusos_database_identity WHERE id = 'canonical-identity' LIMIT 1;`
    );
    if (idRes.rows.length > 0 && idRes.rows[0]) {
      systemId = idRes.rows[0].system_id;
    }
  } catch {
    // Identity table may not be initialized in test sandboxes
  }

  for (const t of tables) {
    try {
      const tf = await computeTableFingerprint(pglite, t);
      tableFingerprints[t] = tf;
      hashCollector.push(`${t}:${tf.rowCount}:${tf.contentHash}:${tf.schemaHash}`);
    } catch (err) {
      // Table doesn't exist yet
      tableFingerprints[t] = {
        tableName: t,
        rowCount: 0,
        contentHash: 'EMPTY',
        schemaHash: 'NOT_FOUND',
        columns: [],
      };
      hashCollector.push(`${t}:NOT_FOUND`);
    }
  }

  const compositeHash = crypto
    .createHash('sha256')
    .update(hashCollector.join('|'))
    .digest('hex');

  return {
    timestamp: new Date().toISOString(),
    databaseSystemId: systemId,
    compositeHash,
    tables: tableFingerprints,
  };
}

/**
 * Compares two database fingerprints and produces a detailed diff report.
 */
export function compareDatabaseFingerprints(
  before: DatabaseFingerprint,
  after: DatabaseFingerprint
): FingerprintDiff {
  const changedTables: FingerprintDiff['changedTables'] = [];
  const allTableNames = Array.from(
    new Set([...Object.keys(before.tables), ...Object.keys(after.tables)])
  ).sort();

  for (const t of allTableNames) {
    const b = before.tables[t];
    const a = after.tables[t];

    if (!b || !a) {
      changedTables.push({
        table: t,
        reasons: ['TABLE_MISSING'],
        beforeRowCount: b?.rowCount,
        afterRowCount: a?.rowCount,
        beforeContentHash: b?.contentHash,
        afterContentHash: a?.contentHash,
      });
      continue;
    }

    const reasons: Array<'ROW_COUNT_CHANGED' | 'CONTENT_CHANGED' | 'SCHEMA_CHANGED'> = [];
    if (b.rowCount !== a.rowCount) reasons.push('ROW_COUNT_CHANGED');
    if (b.contentHash !== a.contentHash) reasons.push('CONTENT_CHANGED');
    if (b.schemaHash !== a.schemaHash) reasons.push('SCHEMA_CHANGED');

    if (reasons.length > 0) {
      changedTables.push({
        table: t,
        reasons,
        beforeRowCount: b.rowCount,
        afterRowCount: a.rowCount,
        beforeContentHash: b.contentHash,
        afterContentHash: a.contentHash,
      });
    }
  }

  const isEqual = before.compositeHash === after.compositeHash && changedTables.length === 0;
  const summary = isEqual
    ? `FINGERPRINT MATCH (Hash: ${before.compositeHash.slice(0, 12)}...) - Zero mutations detected across ${allTableNames.length} protected tables.`
    : `FINGERPRINT MISMATCH - Detected mutations in ${changedTables.length} table(s): ${changedTables.map((c) => `${c.table} (${c.reasons.join(', ')})`).join(', ')}`;

  return {
    isEqual,
    changedTables,
    summary,
  };
}
