/**
 * run-backup.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone backup script called by the Linux OS cron every Saturday night.
 * Uses the same runBackup() function as the manual admin trigger in the web UI.
 *
 * Run manually: npx tsx src/scripts/run-backup.ts
 * Cron entry:   0 23 * * 6 cd <PROJECT_PATH> && npx tsx src/scripts/run-backup.ts >> /jd_crm_backup/backup.log 2>&1
 */
import { runBackup } from '../lib/backup';

async function main() {
  console.log(`[run-backup] Starting at ${new Date().toISOString()}`);
  const result = await runBackup();
  if (result.success) {
    console.log(`[run-backup] SUCCESS — Saved: ${result.filename}`);
    if (result.deletedFiles.length > 0) {
      console.log(`[run-backup] Deleted old backups: ${result.deletedFiles.join(', ')}`);
    }
    process.exit(0);
  } else {
    console.error(`[run-backup] FAILED — ${result.error}`);
    process.exit(1); // non-zero exit so cron and monitoring tools detect failure
  }
}

main();
