import crypto from 'crypto';
import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import { createConsistentSnapshot } from './snapshots.js';

const logger = new StructuredLogger('DestructiveOperationGuard');

export type DestructiveOperation =
  | 'DROP_TABLE'
  | 'TRUNCATE_TABLE'
  | 'MASS_DELETE'
  | 'MASS_UPDATE'
  | 'RESEED_DATABASE'
  | 'REINITIALIZE_DATABASE';

interface ActiveAuthorization {
  token: string;
  operation: DestructiveOperation;
  approver: string;
  reason: string;
  issuedAt: number;
  expiresAt: number;
  preRiskSnapshotId?: string;
}

let activeAuthorizations: Map<string, ActiveAuthorization> = new Map();

/**
 * Explicitly authorizes a dangerous maintenance operation for a limited time window (e.g. 5 minutes).
 */
export function authorizeDestructiveOperation(
  operation: DestructiveOperation,
  approver: string,
  reason: string,
  validityMinutes = 5
): { token: string; expiresAt: number } {
  const token = `AUTH_${operation}_${crypto.randomBytes(16).toString('hex')}`;
  const now = Date.now();
  const expiresAt = now + validityMinutes * 60 * 1000;

  activeAuthorizations.set(token, {
    token,
    operation,
    approver,
    reason,
    issuedAt: now,
    expiresAt,
  });

  logger.warn(`Explicit authorization granted for destructive operation "${operation}"`, {
    approver,
    reason,
    expiresAt: new Date(expiresAt).toISOString(),
  });

  return { token, expiresAt };
}

/**
 * Asserts that a destructive operation is authorized and preceded by a verified snapshot.
 */
export async function assertDestructiveOperationAuthorized(
  operation: DestructiveOperation,
  token?: string,
  pglite?: PGlite
): Promise<void> {
  if (!token || !activeAuthorizations.has(token)) {
    const errorMsg =
      `DESTRUCTIVE OPERATION BLOCKED.\n` +
      `Operation "${operation}" is forbidden without explicit authorization.\n` +
      `To proceed with approved maintenance, obtain an authorization token via authorizeDestructiveOperation().`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  const auth = activeAuthorizations.get(token)!;
  if (auth.operation !== operation) {
    throw new Error(
      `INVALID AUTHORIZATION TOKEN: Token was issued for "${auth.operation}", but requested operation is "${operation}".`
    );
  }

  if (Date.now() > auth.expiresAt) {
    activeAuthorizations.delete(token);
    throw new Error(`EXPIRED AUTHORIZATION TOKEN: Authorization for "${operation}" expired at ${new Date(auth.expiresAt).toISOString()}.`);
  }

  // Enforce Pre-Risk Snapshot if PGlite instance is available
  if (pglite && !auth.preRiskSnapshotId) {
    logger.info(`Creating mandatory pre-risk snapshot prior to "${operation}"...`);
    const snapshot = await createConsistentSnapshot(pglite, `pre-risk_${operation}`);
    auth.preRiskSnapshotId = snapshot.id;
    logger.info(`Mandatory pre-risk snapshot verified: ${snapshot.id}`);
  }

  // Consume single-use token
  activeAuthorizations.delete(token);
  logger.warn(`Authorized destructive operation "${operation}" executing under ticket ${token}`);
}
