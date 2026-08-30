import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import { findWorkspaceRoot } from '../client.js';
import {
  computeTableFingerprint,
  DatabaseFingerprint,
  compareDatabaseFingerprints,
} from './fingerprint.js';

const logger = new StructuredLogger('LockGuard');

export type LockStatus = 'LOCKED' | 'UNLOCKED';

export interface LockedFileEntry {
  path: string; // Relative to workspace root
  sha256: string;
  sizeBytes: number;
}

export interface VisualBaselineState {
  screenshotHash?: string;
  domContractHash?: string;
  lastUpdated: string;
}

export interface FeatureLockHistoryEntry {
  version: number;
  date: string;
  status: LockStatus;
  reason?: string;
  author?: string;
}

export interface FeatureLock {
  featureKey: string;
  displayName: string;
  status: LockStatus;
  version: number;
  lockDate: string;
  unlockReason?: string;
  protectedFiles: LockedFileEntry[];
  protectedTables: string[];
  protectedSchema: Record<string, string>; // Table -> Schema SHA-256
  allowedSharedDependencies: string[];
  visualBaselines?: Record<string, VisualBaselineState>;
  history: FeatureLockHistoryEntry[];
}

export interface LockManifest {
  version: string;
  updatedAt: string;
  features: Record<string, FeatureLock>;
}

export interface FileVerificationDetail {
  path: string;
  expectedHash: string;
  actualHash?: string;
  status: 'MATCH' | 'CHANGED' | 'MISSING';
}

export interface SchemaVerificationDetail {
  table: string;
  expectedSchemaHash: string;
  actualSchemaHash?: string;
  status: 'MATCH' | 'CHANGED' | 'MISSING';
}

export interface FeatureVerificationResult {
  featureKey: string;
  displayName: string;
  status: LockStatus;
  version: number;
  passed: boolean;
  fileDetails: FileVerificationDetail[];
  schemaDetails: SchemaVerificationDetail[];
  errors: string[];
}

export interface VerificationReport {
  success: boolean;
  totalFeatures: number;
  lockedFeatures: number;
  unlockedFeatures: number;
  results: Record<string, FeatureVerificationResult>;
  errors: string[];
}

export function getManifestPath(): string {
  const root = findWorkspaceRoot();
  return path.resolve(root, 'campusos-locks.json');
}

export function loadLockManifest(customPath?: string): LockManifest {
  const targetPath = customPath || getManifestPath();
  if (!fs.existsSync(targetPath)) {
    const initialManifest: LockManifest = {
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      features: {},
    };
    saveLockManifest(initialManifest, targetPath);
    return initialManifest;
  }

  const raw = fs.readFileSync(targetPath, 'utf-8');
  return JSON.parse(raw) as LockManifest;
}

export function saveLockManifest(manifest: LockManifest, customPath?: string): void {
  const targetPath = customPath || getManifestPath();
  manifest.updatedAt = new Date().toISOString();
  fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

export function computeFileSha256(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export interface LockFeatureParams {
  featureKey: string;
  displayName: string;
  filePaths: string[]; // Relative or absolute
  tables?: string[];
  pglite?: PGlite;
  allowedSharedDependencies?: string[];
  visualBaselines?: Record<string, VisualBaselineState>;
  manifestPath?: string;
}

/**
 * Locks a feature/page by capturing deterministic hashes of files and DB schemas.
 * NEVER UPDATES SILENTLY. MUST BE CALLED EXPLICITLY.
 */
export async function lockFeature(params: LockFeatureParams): Promise<FeatureLock> {
  const root = findWorkspaceRoot();
  const manifest = loadLockManifest(params.manifestPath);
  const existing = manifest.features[params.featureKey];

  const currentVersion = existing ? existing.version + 1 : 1;
  const now = new Date().toISOString();

  logger.info(`Locking feature "${params.featureKey}" (v${currentVersion})...`);

  // 1. Process Protected Files
  const protectedFiles: LockedFileEntry[] = [];
  for (const rawPath of params.filePaths) {
    const absPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(root, rawPath);
    const relPath = path.relative(root, absPath).replace(/\\/g, '/');

    if (!fs.existsSync(absPath)) {
      throw new Error(`Cannot lock feature "${params.featureKey}": Protected file does not exist: ${relPath}`);
    }

    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      throw new Error(`Cannot lock directory directly. Specify individual files for "${relPath}".`);
    }

    const hash = computeFileSha256(absPath);
    protectedFiles.push({
      path: relPath,
      sha256: hash,
      sizeBytes: stat.size,
    });
  }

  // 2. Process Protected DB Schema
  const protectedTables = params.tables || [];
  const protectedSchema: Record<string, string> = {};

  if (params.pglite && protectedTables.length > 0) {
    for (const tbl of protectedTables) {
      const tf = await computeTableFingerprint(params.pglite, tbl);
      protectedSchema[tbl] = tf.schemaHash;
    }
  }

  // 3. Build History Entry
  const history = existing ? [...existing.history] : [];
  history.push({
    version: currentVersion,
    date: now,
    status: 'LOCKED',
    reason: existing?.unlockReason || 'Approved and locked baseline',
  });

  const featureLock: FeatureLock = {
    featureKey: params.featureKey,
    displayName: params.displayName,
    status: 'LOCKED',
    version: currentVersion,
    lockDate: now,
    protectedFiles,
    protectedTables,
    protectedSchema,
    allowedSharedDependencies: params.allowedSharedDependencies || [],
    visualBaselines: params.visualBaselines || existing?.visualBaselines || {},
    history,
  };

  manifest.features[params.featureKey] = featureLock;
  saveLockManifest(manifest, params.manifestPath);

  logger.info(`Feature "${params.featureKey}" successfully LOCKED at v${currentVersion}.`, {
    fileCount: protectedFiles.length,
    tableCount: protectedTables.length,
  });

  return featureLock;
}

/**
 * Unlocks a feature for approved, intentional development.
 */
export function unlockFeature(
  featureKey: string,
  reason: string,
  manifestPath?: string
): FeatureLock {
  if (!reason || reason.trim().length < 5) {
    throw new Error('Unlocking a feature requires a descriptive reason (minimum 5 characters).');
  }

  const manifest = loadLockManifest(manifestPath);
  const feature = manifest.features[featureKey];

  if (!feature) {
    throw new Error(`Cannot unlock feature "${featureKey}": Feature not found in lock manifest.`);
  }

  logger.warn(`Unlocking feature "${featureKey}" (Current v${feature.version}). Reason: ${reason}`);

  feature.status = 'UNLOCKED';
  feature.unlockReason = reason;
  feature.history.push({
    version: feature.version,
    date: new Date().toISOString(),
    status: 'UNLOCKED',
    reason,
  });

  saveLockManifest(manifest, manifestPath);
  return feature;
}

/**
 * Verifies all registered locks against disk and DB schema.
 * FAILS CLOSED if any protected file or schema has been altered.
 */
export async function verifyAllLocks(
  options: { pglite?: PGlite; manifestPath?: string } = {}
): Promise<VerificationReport> {
  const root = findWorkspaceRoot();
  const manifest = loadLockManifest(options.manifestPath);
  const results: Record<string, FeatureVerificationResult> = {};
  const globalErrors: string[] = [];

  let lockedCount = 0;
  let unlockedCount = 0;

  for (const [key, feat] of Object.entries(manifest.features)) {
    if (feat.status === 'UNLOCKED') {
      unlockedCount++;
      results[key] = {
        featureKey: key,
        displayName: feat.displayName,
        status: 'UNLOCKED',
        version: feat.version,
        passed: true,
        fileDetails: [],
        schemaDetails: [],
        errors: [],
      };
      continue;
    }

    lockedCount++;
    const fileDetails: FileVerificationDetail[] = [];
    const schemaDetails: SchemaVerificationDetail[] = [];
    const errors: string[] = [];

    // 1. Verify Files
    for (const f of feat.protectedFiles) {
      const absPath = path.resolve(root, f.path);
      if (!fs.existsSync(absPath)) {
        fileDetails.push({
          path: f.path,
          expectedHash: f.sha256,
          status: 'MISSING',
        });
        errors.push(`Protected file MISSING: ${f.path}`);
        continue;
      }

      const actualHash = computeFileSha256(absPath);
      if (actualHash !== f.sha256) {
        fileDetails.push({
          path: f.path,
          expectedHash: f.sha256,
          actualHash,
          status: 'CHANGED',
        });
        errors.push(
          `LOCKED FILE VIOLATION in "${feat.displayName}": File changed without explicit unlock.\n` +
          `  File: ${f.path}\n` +
          `  Expected SHA256: ${f.sha256}\n` +
          `  Actual SHA256:   ${actualHash}`
        );
      } else {
        fileDetails.push({
          path: f.path,
          expectedHash: f.sha256,
          actualHash,
          status: 'MATCH',
        });
      }
    }

    // 2. Verify Schema (if PGlite instance provided)
    if (options.pglite && Object.keys(feat.protectedSchema).length > 0) {
      for (const [tbl, expectedSchemaHash] of Object.entries(feat.protectedSchema)) {
        try {
          const tf = await computeTableFingerprint(options.pglite, tbl);
          if (tf.schemaHash !== expectedSchemaHash) {
            schemaDetails.push({
              table: tbl,
              expectedSchemaHash,
              actualSchemaHash: tf.schemaHash,
              status: 'CHANGED',
            });
            errors.push(
              `LOCKED SCHEMA VIOLATION in "${feat.displayName}": Database schema for table "${tbl}" was modified without authorization.`
            );
          } else {
            schemaDetails.push({
              table: tbl,
              expectedSchemaHash,
              actualSchemaHash: tf.schemaHash,
              status: 'MATCH',
            });
          }
        } catch (err) {
          schemaDetails.push({
            table: tbl,
            expectedSchemaHash,
            status: 'MISSING',
          });
          errors.push(`Protected table "${tbl}" could not be verified: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    const passed = errors.length === 0;
    if (!passed) {
      globalErrors.push(...errors);
    }

    results[key] = {
      featureKey: key,
      displayName: feat.displayName,
      status: 'LOCKED',
      version: feat.version,
      passed,
      fileDetails,
      schemaDetails,
      errors,
    };
  }

  const success = globalErrors.length === 0;
  return {
    success,
    totalFeatures: Object.keys(manifest.features).length,
    lockedFeatures: lockedCount,
    unlockedFeatures: unlockedCount,
    results,
    errors: globalErrors,
  };
}

export interface TaskScopeVerificationResult {
  valid: boolean;
  violations: Array<{
    table: string;
    reasons: string[];
    beforeRowCount: number;
    afterRowCount: number;
  }>;
}

/**
 * Task write-scope guard.
 * Asserts that no out-of-scope protected table was modified during a development task.
 */
export function verifyTaskWriteScope(
  allowedTables: string[],
  beforeFp: DatabaseFingerprint,
  afterFp: DatabaseFingerprint
): TaskScopeVerificationResult {
  const comparison = compareDatabaseFingerprints(beforeFp, afterFp);
  const violations: TaskScopeVerificationResult['violations'] = [];

  for (const ch of comparison.changedTables) {
    if (!allowedTables.includes(ch.table)) {
      violations.push({
        table: ch.table,
        reasons: ch.reasons,
        beforeRowCount: ch.beforeRowCount ?? 0,
        afterRowCount: ch.afterRowCount ?? 0,
      });
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
