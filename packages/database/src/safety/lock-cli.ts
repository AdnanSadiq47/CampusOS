import { StructuredLogger } from '@campus-os/logger';
import {
  lockFeature,
  unlockFeature,
  verifyAllLocks,
} from './lock-guard.js';

const logger = new StructuredLogger('LockCLI');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

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
