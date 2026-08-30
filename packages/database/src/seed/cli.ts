import { PGlite } from '@electric-sql/pglite';
import { StructuredLogger } from '@campus-os/logger';
import { getPgLiteDataDir, assertAuthorizedDbAccess } from '../client.js';
import { seedCanonicalReferenceData } from './reference-seed.js';
import { ensureDatabaseIdentity } from '../safety/identity.js';

const logger = new StructuredLogger('SeedCLI');

async function runSeedCli() {
  logger.info('Starting explicit CampusOS reference seed CLI...');
  const dataDir = getPgLiteDataDir();
  
  process.env['CAMPUSOS_AUTHORIZED_DB_OWNER'] = 'API_CORE';
  assertAuthorizedDbAccess(dataDir);

  const pglite = new PGlite(dataDir);
  try {
    await pglite.waitReady;
    await ensureDatabaseIdentity(pglite);
    await seedCanonicalReferenceData(pglite, { includeInitialOrgHierarchy: false });
    logger.info('Explicit seed completed successfully.');
  } finally {
    await pglite.close();
  }
}

if (process.argv[1] && process.argv[1].includes('cli')) {
  runSeedCli().catch((err) => {
    logger.error('Seed CLI failed:', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  });
}
