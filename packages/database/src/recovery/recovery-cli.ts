import { runRecoveryExport } from './exporter.js';
import { createCleanStagingDatabase } from './staging-creator.js';
import { runRecoveryRestore } from './restorer.js';
import { runStagingVerification } from './verifier.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error('Usage: recovery-cli <export|create-staging|restore-staging|verify-staging> [options]');
    process.exit(1);
  }

  if (command === 'export' || command === 'db:recovery:export') {
    const outPath = args[1];
    await runRecoveryExport(outPath);
    process.exit(0);
  }

  if (command === 'create-staging' || command === 'db:recovery:create-staging') {
    const stagingPath = args[1];
    await createCleanStagingDatabase(stagingPath);
    process.exit(0);
  }

  if (command === 'restore-staging' || command === 'db:recovery:restore-staging') {
    const exportFile = args[1];
    const stagingPath = args[2];
    const allowMissingIdentityFlag = args.includes('--allow-known-incident-missing-identity');
    const allowMissingSourceMigrationsFlag = args.includes('--allow-known-incident-missing-source-migrations');

    if (!exportFile) {
      console.error('Usage: recovery-cli restore-staging <path-to-export-file> [stagingPath] [--allow-known-incident-missing-identity] [--allow-known-incident-missing-source-migrations]');
      process.exit(1);
    }

    if (allowMissingIdentityFlag) {
      console.warn('\n======================================================');
      console.warn('⚠️  CRITICAL RECOVERY SECURITY EXCEPTION GRANTED');
      console.warn('======================================================');
      console.warn('Flag: --allow-known-incident-missing-identity');
      console.warn('Rationale: The damaged canonical database lacks the');
      console.warn('_campusos_database_identity table from the incident.');
      console.warn('Canonical identity will be safely stamped in staging.');
      console.warn('======================================================\n');
    }

    if (allowMissingSourceMigrationsFlag) {
      console.warn('\n======================================================');
      console.warn('⚠️  HISTORICAL MIGRATION METADATA EXCEPTION GRANTED');
      console.warn('======================================================');
      console.warn('Flag: --allow-known-incident-missing-source-migrations');
      console.warn('Rationale: The damaged canonical database lacks newer');
      console.warn('migration metadata records from previous incident state.');
      console.warn('======================================================\n');
    }

    await runRecoveryRestore(exportFile, stagingPath, {
      allowKnownIncidentMissingIdentity: allowMissingIdentityFlag,
      allowKnownIncidentMissingSourceMigrations: allowMissingSourceMigrationsFlag,
    });
    process.exit(0);
  }

  if (command === 'verify-staging' || command === 'db:recovery:verify-staging') {
    const exportFile = args[1];
    const stagingPath = args[2];
    if (!exportFile) {
      console.error('Usage: recovery-cli verify-staging <path-to-export-file> [stagingPath]');
      process.exit(1);
    }
    await runStagingVerification(exportFile, stagingPath);
    process.exit(0);
  }

  console.error(`Unknown recovery command: ${command}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Recovery CLI Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
