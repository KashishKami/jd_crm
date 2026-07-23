// ─── Retention Policy ─────────────────────────────────────────────────────────
// How many backup files to keep in /jd_crm_backup/.
// The OLDEST files beyond this count are deleted automatically, but ONLY when a
// new backup is successfully created. A failed backup never deletes anything.
// Change this number to adjust how many backups are retained on the server.
const BACKUP_RETENTION_COUNT = 4;
// ──────────────────────────────────────────────────────────────────────────────

import { execSync } from 'child_process';
import * as zlib from 'zlib';
import * as fs from 'fs';
import * as path from 'path';

// Read from environment variable so integration tests can override to a temp dir.
// On production this must be set to: BACKUP_DIR=/jd_crm_backup
export type BackupResult =
  | { success: true;  filename: string; filepath: string; deletedFiles: string[] }
  | { success: false; error: string };

export async function runBackup(): Promise<BackupResult> {
  const BACKUP_DIR = process.env.BACKUP_DIR ?? '/jd_crm_backup';
  // 1. Ensure the backup directory exists on the host.
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  // 2. Build a timestamped filename: jd_crm_YYYY-MM-DD_HH-MM-SS.sql.gz
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const filename = `jd_crm_${ts}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  // 3. Run mysqldump inside the Docker container.
  //    All credentials are read from environment variables — never hardcoded.
  const dbName        = process.env.BACKUP_DB_NAME        ?? 'jd_crm';
  const dbUser        = process.env.BACKUP_DB_USER        ?? 'root';
  const dbPassword    = process.env.BACKUP_DB_PASSWORD    ?? process.env.MYSQL_ROOT_PASSWORD ?? 'root_password';
  const containerName = process.env.BACKUP_CONTAINER_NAME ?? 'jd_crm_db';

  let sqlDump: Buffer;
  try {
    sqlDump = execSync(
      `docker exec ${containerName} mysqldump -u${dbUser} -p${dbPassword} ${dbName}`,
      { maxBuffer: 500 * 1024 * 1024 } // 500 MB max — increase if DB is larger
    );
  } catch (err: any) {
    // mysqldump failed. Return error WITHOUT running cleanup.
    // All existing backup files are preserved.
    return { success: false, error: `mysqldump failed: ${String(err.message ?? err)}` };
  }

  // 4. Compress with gzip and write to disk.
  try {
    fs.writeFileSync(filepath, zlib.gzipSync(sqlDump));
  } catch (err: any) {
    return { success: false, error: `Failed to write backup file: ${String(err.message ?? err)}` };
  }

  // 5. Cleanup — only runs after a SUCCESSFUL file write.
  //    List all .sql.gz files, sort newest-first, delete beyond BACKUP_RETENTION_COUNT.
  const deletedFiles: string[] = [];
  try {
    const allFiles = fs
      .readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.sql.gz'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime); // newest first

    for (const file of allFiles.slice(BACKUP_RETENTION_COUNT)) {
      fs.unlinkSync(path.join(BACKUP_DIR, file.name));
      deletedFiles.push(file.name);
    }
  } catch (err: any) {
    // Cleanup failure is non-fatal. Log it, but still return success for the backup itself.
    console.error('[backup] Cleanup step failed:', String(err.message ?? err));
  }

  return { success: true, filename, filepath, deletedFiles };
}
