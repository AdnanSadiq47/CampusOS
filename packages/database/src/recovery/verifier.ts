import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import { assertSafeExistingStagingTarget } from './staging-creator.js';
import { getAuthoritativeTableInventory } from './inventory.js';
import {
  DatabaseRecoveryArtifact,
  computeDeterministicTableHash,
  computeArtifactCompositeChecksum,
  TableExportEntry,
} from './exporter.js';
import { verifyDatabaseIdentity } from '../safety/identity.js';
import { verifySchemaCompatibility } from '../migration/index.js';

const logger = new StructuredLogger('RecoveryVerifier');

export interface VerificationCheckResult {
  checkName: string;
  passed: boolean;
  details: string;
}

export interface StagingVerificationReport {
  stagingPath: string;
  timestamp: string;
  passed: boolean;
  checks: VerificationCheckResult[];
  baselineVerification: {
    organizations: number;
    headOffices: number;
    regions: number;
    schools: number;
    branches: number;
    countries: number;
    states: number;
    cities: number;
    areas: number;
  };
  compositeChecksumVerification: {
    expected: string;
    actual: string;
    matches: boolean;
  };
  relationalIntegrity: {
    pkChecksPassed: boolean;
    fkChecksPassed: boolean;
    tenantChecksPassed: boolean;
    hierarchyChecksPassed: boolean;
  };
  errors: string[];
}

export async function runStagingVerification(
  exportFilePath: string,
  stagingPath?: string
): Promise<StagingVerificationReport> {
  const targetDir = assertSafeExistingStagingTarget(stagingPath);
  logger.info(`Starting comprehensive READ-ONLY verification of staging database "${targetDir}"...`);

  if (!fs.existsSync(exportFilePath)) {
    throw new Error(`Export artifact not found: "${exportFilePath}"`);
  }

  const raw = fs.readFileSync(exportFilePath, 'utf8');
  const artifact: DatabaseRecoveryArtifact = JSON.parse(raw);

  const checks: VerificationCheckResult[] = [];
  const errors: string[] = [];

  const stagingPglite = new PGlite(targetDir);

  try {
    await stagingPglite.waitReady;

    // ── 1. Check Identity ─────────────────────────────────────────────
    try {
      const identity = await verifyDatabaseIdentity(stagingPglite);
      checks.push({
        checkName: 'Canonical Identity Record Check',
        passed: true,
        details: `Identity verified: system_id=${identity.system_id}, schema_version=${identity.schema_version}`,
      });
    } catch (err: any) {
      checks.push({
        checkName: 'Canonical Identity Record Check',
        passed: false,
        details: `Identity verification failed: ${err.message}`,
      });
      errors.push(`Identity check failed: ${err.message}`);
    }

    // ── 2. Check Schema Compatibility ─────────────────────────────────
    try {
      await verifySchemaCompatibility(stagingPglite);
      checks.push({
        checkName: 'Schema Compatibility Check',
        passed: true,
        details: 'All required system tables present and verified.',
      });
    } catch (err: any) {
      checks.push({
        checkName: 'Schema Compatibility Check',
        passed: false,
        details: `Schema compatibility failed: ${err.message}`,
      });
      errors.push(`Schema check failed: ${err.message}`);
    }

    // ── 3. Check Row Counts & Fingerprints Table by Table ─────────────
    const inventory = getAuthoritativeTableInventory();
    let allFingerprintsMatch = true;
    const reconstructedExportEntries: Record<string, TableExportEntry> = {};

    for (const item of inventory) {
      const expectedData = artifact.tables[item.tableName];
      const res = await stagingPglite.query(`SELECT * FROM "${item.tableName}";`);
      const rows = res.rows || [];
      const actualCount = rows.length;
      const expectedCount = expectedData ? expectedData.rowCount : 0;

      if (actualCount !== expectedCount) {
        allFingerprintsMatch = false;
        const msg = `Row count mismatch in table "${item.tableName}": Expected ${expectedCount}, found ${actualCount}`;
        errors.push(msg);
        checks.push({
          checkName: `Table Integrity: ${item.tableName}`,
          passed: false,
          details: msg,
        });
        continue;
      }

      const actualHash = computeDeterministicTableHash(item.tableName, rows);
      const expectedHash = expectedData ? expectedData.contentHash : 'TABLE_MISSING';

      if (expectedHash !== 'TABLE_MISSING' && expectedHash !== 'EMPTY' && actualHash !== expectedHash) {
        allFingerprintsMatch = false;
        const msg = `Content hash mismatch in table "${item.tableName}"`;
        errors.push(msg);
        checks.push({
          checkName: `Table Integrity: ${item.tableName}`,
          passed: false,
          details: msg,
        });
      } else {
        checks.push({
          checkName: `Table Integrity: ${item.tableName}`,
          passed: true,
          details: `Rows: ${actualCount}, Hash: ${actualHash.slice(0, 12)}`,
        });
      }

      reconstructedExportEntries[item.tableName] = {
        tableName: item.tableName,
        classification: item.classification,
        status: actualCount > 0 ? 'EXISTS_WITH_DATA' : 'EXISTS_EMPTY',
        rowCount: actualCount,
        columns: expectedData?.columns || [],
        rows,
        contentHash: actualHash,
      };
    }

    // ── 4. Composite Checksum Verification ────────────────────────────
    const recomputedChecksum = computeArtifactCompositeChecksum(reconstructedExportEntries);
    const checksumMatches = recomputedChecksum === artifact.compositeChecksum;

    if (!checksumMatches) {
      errors.push(`COMPOSITE CHECKSUM MISMATCH: Expected ${artifact.compositeChecksum}, calculated ${recomputedChecksum}`);
    }

    checks.push({
      checkName: 'Recomputed Full-Dataset Composite Checksum Verification',
      passed: checksumMatches,
      details: `Recomputed: ${recomputedChecksum} (Matches: ${checksumMatches})`,
    });

    // ── 5. Generic PostgreSQL Catalog Primary Key Discovery & Verification ──
    let pkChecksPassed = true;
    const pkDiscoveryQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        kcu.ordinal_position
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.ordinal_position;
    `;
    const pkRes = await stagingPglite.query<{ table_name: string; column_name: string; ordinal_position: number }>(pkDiscoveryQuery);
    
    const tablePkColumns: Record<string, string[]> = {};
    for (const row of pkRes.rows) {
      if (!tablePkColumns[row.table_name]) {
        tablePkColumns[row.table_name] = [];
      }
      tablePkColumns[row.table_name]?.push(row.column_name);
    }

    for (const item of inventory) {
      const pkCols = tablePkColumns[item.tableName];
      if (!pkCols || pkCols.length === 0) {
        pkChecksPassed = false;
        const msg = `PK MISSING: Authoritative table "${item.tableName}" lacks a PRIMARY KEY constraint.`;
        errors.push(msg);
        checks.push({ checkName: `PK Discovery: ${item.tableName}`, passed: false, details: msg });
        continue;
      }

      const pkColList = pkCols.map((c) => `"${c}"`).join(', ');
      const pkNotNullCondition = pkCols.map((c) => `"${c}" IS NOT NULL`).join(' AND ');

      const pkIntegrityRes = await stagingPglite.query<{ total_rows: number; non_null_rows: number; distinct_pk_tuples: number }>(`
        SELECT 
          COUNT(*)::int AS total_rows,
          COUNT(CASE WHEN ${pkNotNullCondition} THEN 1 END)::int AS non_null_rows,
          COUNT(DISTINCT (${pkColList}))::int AS distinct_pk_tuples
        FROM "${item.tableName}";
      `);

      const resRow = pkIntegrityRes.rows[0];
      if (resRow) {
        if (resRow.total_rows !== resRow.non_null_rows) {
          pkChecksPassed = false;
          const msg = `PK NULL VIOLATION in "${item.tableName}": total=${resRow.total_rows}, non-null=${resRow.non_null_rows}`;
          errors.push(msg);
          checks.push({ checkName: `PK Null Check: ${item.tableName}`, passed: false, details: msg });
        } else if (resRow.total_rows !== resRow.distinct_pk_tuples) {
          pkChecksPassed = false;
          const msg = `PK UNIQUENESS VIOLATION in "${item.tableName}": total=${resRow.total_rows}, distinct tuples=${resRow.distinct_pk_tuples}`;
          errors.push(msg);
          checks.push({ checkName: `PK Uniqueness: ${item.tableName}`, passed: false, details: msg });
        }
      }
    }

    checks.push({
      checkName: 'Generic PostgreSQL Catalog PK Discovery & Tuple Uniqueness',
      passed: pkChecksPassed,
      details: pkChecksPassed ? `Discovered and verified PKs on all ${inventory.length} tables.` : 'PK violations detected.',
    });

    // ── 6. Relational Foreign Key & Orphan Verification ───────────────
    let fkChecksPassed = true;
    const fkQuery = `
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;
    const fkRes = await stagingPglite.query<{
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>(fkQuery);

    for (const fk of fkRes.rows) {
      const orphanRes = await stagingPglite.query<{ orphan_count: number }>(`
        SELECT COUNT(*)::int AS orphan_count
        FROM "${fk.table_name}" AS src
        LEFT JOIN "${fk.foreign_table_name}" AS ref
          ON src."${fk.column_name}" = ref."${fk.foreign_column_name}"
        WHERE src."${fk.column_name}" IS NOT NULL AND ref."${fk.foreign_column_name}" IS NULL;
      `);
      const orphans = orphanRes.rows[0]?.orphan_count || 0;
      if (orphans > 0) {
        fkChecksPassed = false;
        const msg = `FK ORPHAN DETECTED: Table "${fk.table_name}"."${fk.column_name}" -> "${fk.foreign_table_name}"."${fk.foreign_column_name}" has ${orphans} orphan row(s).`;
        errors.push(msg);
        checks.push({ checkName: `FK Integrity: ${fk.table_name}.${fk.column_name}`, passed: false, details: msg });
      }
    }

    checks.push({
      checkName: 'Foreign Key & Zero-Orphan Verification',
      passed: fkChecksPassed,
      details: fkChecksPassed ? `All ${fkRes.rows.length} FK constraints verified with 0 orphan references.` : 'FK orphan rows detected.',
    });

    // ── 7. Multi-Tenant Organization Isolation Verification ───────────
    let tenantChecksPassed = true;
    for (const item of inventory) {
      if (item.tableName === 'organizations' || item.tableName === 'identity_users' || item.tableName === '_campusos_migrations' || item.tableName === '_campusos_database_identity') {
        continue;
      }

      const colCheck = await stagingPglite.query<{ c: number }>(`
        SELECT COUNT(*)::int AS c FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'organization_id';
      `, [item.tableName]);

      if ((colCheck.rows[0]?.c || 0) > 0) {
        const tenantOrphanRes = await stagingPglite.query<{ orphan_count: number }>(`
          SELECT COUNT(*)::int AS orphan_count
          FROM "${item.tableName}" AS t
          LEFT JOIN "organizations" AS o ON t.organization_id = o.id
          WHERE t.organization_id IS NOT NULL AND o.id IS NULL;
        `);
        const orgOrphans = tenantOrphanRes.rows[0]?.orphan_count || 0;
        if (orgOrphans > 0) {
          tenantChecksPassed = false;
          const msg = `TENANT ISOLATION VIOLATION: Table "${item.tableName}" contains ${orgOrphans} row(s) with invalid organization_id.`;
          errors.push(msg);
          checks.push({ checkName: `Tenant Check: ${item.tableName}`, passed: false, details: msg });
        }
      }
    }

    checks.push({
      checkName: 'Multi-Tenant Organization Integrity Verification',
      passed: tenantChecksPassed,
      details: tenantChecksPassed ? 'All tenant-scoped tables cleanly reference valid organizations.' : 'Tenant isolation violations detected.',
    });

    // ── 8. CampusOS Semantic Hierarchy Integrity Verification ─────────
    let hierarchyChecksPassed = true;

    // A. School -> Branch organization matching
    const branchSchoolOrgMismatch = await stagingPglite.query<{ c: number }>(`
      SELECT COUNT(*)::int AS c
      FROM branches b
      JOIN schools s ON b.school_id = s.id
      WHERE b.organization_id != s.organization_id;
    `);
    if ((branchSchoolOrgMismatch.rows[0]?.c || 0) > 0) {
      hierarchyChecksPassed = false;
      const msg = `Hierarchy Mismatch: branches and parent schools have differing organization_id.`;
      errors.push(msg);
      checks.push({ checkName: 'Hierarchy: Branch-School Tenant Parity', passed: false, details: msg });
    }

    // B. Region -> School organization matching
    const schoolRegionOrgMismatch = await stagingPglite.query<{ c: number }>(`
      SELECT COUNT(*)::int AS c
      FROM schools s
      JOIN regions r ON s.region_id = r.id
      WHERE s.region_id IS NOT NULL AND s.organization_id != r.organization_id;
    `);
    if ((schoolRegionOrgMismatch.rows[0]?.c || 0) > 0) {
      hierarchyChecksPassed = false;
      const msg = `Hierarchy Mismatch: schools and parent regions have differing organization_id.`;
      errors.push(msg);
      checks.push({ checkName: 'Hierarchy: School-Region Tenant Parity', passed: false, details: msg });
    }

    // C. Head Office -> School organization matching
    const schoolHoOrgMismatch = await stagingPglite.query<{ c: number }>(`
      SELECT COUNT(*)::int AS c
      FROM schools s
      JOIN head_offices h ON s.head_office_id = h.id
      WHERE s.head_office_id IS NOT NULL AND s.organization_id != h.organization_id;
    `);
    if ((schoolHoOrgMismatch.rows[0]?.c || 0) > 0) {
      hierarchyChecksPassed = false;
      const msg = `Hierarchy Mismatch: schools and parent head offices have differing organization_id.`;
      errors.push(msg);
      checks.push({ checkName: 'Hierarchy: School-HeadOffice Tenant Parity', passed: false, details: msg });
    }

    // D. Recursive hierarchy_nodes parent tree consistency
    const nodeParentMismatch = await stagingPglite.query<{ c: number }>(`
      SELECT COUNT(*)::int AS c
      FROM hierarchy_nodes n
      JOIN hierarchy_nodes p ON n.parent_id = p.id
      WHERE n.parent_id IS NOT NULL AND n.organization_id != p.organization_id;
    `);
    if ((nodeParentMismatch.rows[0]?.c || 0) > 0) {
      hierarchyChecksPassed = false;
      const msg = `Hierarchy Mismatch: hierarchy_nodes child and parent node belong to different organizations.`;
      errors.push(msg);
      checks.push({ checkName: 'Hierarchy: Node Parent Tenant Parity', passed: false, details: msg });
    }

    checks.push({
      checkName: 'CampusOS Semantic Hierarchy Integrity Verification',
      passed: hierarchyChecksPassed,
      details: hierarchyChecksPassed ? 'Hierarchy parent-child tenant consistency 100% verified.' : 'Hierarchy tenant consistency violations detected.',
    });

    // ── 9. Source Primary-Key Preservation Verification ───────────────
    let sourcePkPreservationPassed = true;
    for (const [tbl, exportEntry] of Object.entries(artifact.tables)) {
      if (tbl === '_campusos_migrations' || tbl === '_campusos_database_identity') {
        continue;
      }

      const pkCols = tablePkColumns[tbl];
      if (!pkCols) continue;

      for (const sourceRow of exportEntry.rows) {
        const whereClause = pkCols.map((c, i) => `"${c}" = $${i + 1}`).join(' AND ');
        const pkValues = pkCols.map((c) => sourceRow[c]);

        const stagingRowRes = await stagingPglite.query(`SELECT 1 FROM "${tbl}" WHERE ${whereClause} LIMIT 1`, pkValues);
        if (stagingRowRes.rows.length === 0) {
          sourcePkPreservationPassed = false;
          const msg = `SOURCE PK PRESERVATION FAILED: Record with PK (${pkValues.join(', ')}) in table "${tbl}" missing in staging.`;
          errors.push(msg);
          checks.push({ checkName: `Source PK: ${tbl}`, passed: false, details: msg });
          break;
        }
      }
    }

    checks.push({
      checkName: 'Source Primary-Key Preservation Verification',
      passed: sourcePkPreservationPassed,
      details: sourcePkPreservationPassed ? 'All exported rows exist with preserved PKs in staging.' : 'Missing source records in staging.',
    });

    // ── 10. Incident Baseline Verification (2/1/1/1/8/5/5/5/7) ────────
    const orgRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM organizations');
    const hoRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM head_offices');
    const regRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM regions');
    const schRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM schools');
    const brRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM branches');
    const cntRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM countries');
    const stRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM states');
    const ctRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM cities');
    const arRes = await stagingPglite.query<{ c: number }>('SELECT count(*)::int as c FROM areas');

    const baselineCounts = {
      organizations: orgRes.rows[0]?.c || 0,
      headOffices: hoRes.rows[0]?.c || 0,
      regions: regRes.rows[0]?.c || 0,
      schools: schRes.rows[0]?.c || 0,
      branches: brRes.rows[0]?.c || 0,
      countries: cntRes.rows[0]?.c || 0,
      states: stRes.rows[0]?.c || 0,
      cities: ctRes.rows[0]?.c || 0,
      areas: arRes.rows[0]?.c || 0,
    };

    const baselineExpected = {
      organizations: 2,
      headOffices: 1,
      regions: 1,
      schools: 1,
      branches: 8,
      countries: 5,
      states: 5,
      cities: 5,
      areas: 7,
    };

    const baselineMatches = JSON.stringify(baselineCounts) === JSON.stringify(baselineExpected);
    if (!baselineMatches) {
      errors.push(`BASELINE MISMATCH: Expected ${JSON.stringify(baselineExpected)}, found ${JSON.stringify(baselineCounts)}`);
    }

    checks.push({
      checkName: 'Preserved Business Baseline (2/1/1/1/8/5/5/5/7)',
      passed: baselineMatches,
      details: `Current Counts: ${JSON.stringify(baselineCounts)}`,
    });

    const passed =
      errors.length === 0 &&
      allFingerprintsMatch &&
      checksumMatches &&
      pkChecksPassed &&
      fkChecksPassed &&
      tenantChecksPassed &&
      hierarchyChecksPassed &&
      sourcePkPreservationPassed &&
      baselineMatches;

    const report: StagingVerificationReport = {
      stagingPath: targetDir,
      timestamp: new Date().toISOString(),
      passed,
      checks,
      baselineVerification: baselineCounts,
      compositeChecksumVerification: {
        expected: artifact.compositeChecksum,
        actual: recomputedChecksum,
        matches: checksumMatches,
      },
      relationalIntegrity: {
        pkChecksPassed,
        fkChecksPassed,
        tenantChecksPassed,
        hierarchyChecksPassed,
      },
      errors,
    };

    console.log('\n======================================================');
    console.log('CAMPUSOS STAGING DATABASE INTEGRITY VERIFICATION');
    console.log('======================================================');
    console.log(`Staging Path:       ${targetDir}`);
    console.log(`Composite Checksum: ${checksumMatches ? '✅ 100% MATCH' : '❌ MISMATCH'}`);
    console.log(`Generic PK Checks:  ${pkChecksPassed ? '✅ PASSED (All tables)' : '❌ FAILED'}`);
    console.log(`FK / Zero Orphans:  ${fkChecksPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Tenant Isolation:   ${tenantChecksPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Hierarchy Parity:   ${hierarchyChecksPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Source PK Preserved:${sourcePkPreservationPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Baseline Matched:   ${baselineMatches ? '✅ 100% (2/1/1/1/8/5/5/5/7)' : '❌ FAILED'}`);
    console.log(`Total Checks:       ${checks.length}`);
    console.log(`Overall Status:     ${passed ? '✅ ALL CHECKS PASSED' : '❌ VERIFICATION FAILED'}`);
    console.log('======================================================\n');

    if (!passed) {
      console.error('VERIFICATION ERRORS:');
      for (const err of errors) {
        console.error(`- ${err}`);
      }
      throw new Error(`STAGING_VERIFICATION_FAILED: ${errors.join('; ')}`);
    }

    return report;
  } finally {
    await stagingPglite.close();
  }
}
