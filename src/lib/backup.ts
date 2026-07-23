// ─── Retention Policy ─────────────────────────────────────────────────────────
// How many backup files to keep in /jd_crm_backup/.
// The OLDEST files beyond this count are deleted automatically, but ONLY when a
// new backup is successfully created. A failed backup never deletes anything.
// Change this number to adjust how many backups are retained on the server.
const BACKUP_RETENTION_COUNT = 4;
// ──────────────────────────────────────────────────────────────────────────────

import { spawnSync } from 'child_process';
import * as zlib from 'zlib';
import * as fs from 'fs';
import * as path from 'path';

export type BackupResult =
  | { success: true;  filename: string; filepath: string; deletedFiles: string[] }
  | { success: false; error: string };

function getConnectionDetails() {
  const url = process.env.DATABASE_URL;
  if (url) {
    try {
      const cleanedUrl = url.replace('mysql://', '');
      const [auth, rest0] = cleanedUrl.split('@');
      const [user, password] = auth.split(':');
      const [hostPort, dbName] = rest0.split('/');
      const [host, portStr] = hostPort.split(':');
      const port = portStr ? parseInt(portStr, 10) : 3306;
      return {
        user: decodeURIComponent(user),
        password: decodeURIComponent(password),
        host,
        port,
        database: dbName.split('?')[0]
      };
    } catch (err) {
      // ignore and fallback
    }
  }

  // Fallback to standard env parameters
  return {
    user: process.env.BACKUP_DB_USER ?? 'root',
    password: process.env.BACKUP_DB_PASSWORD ?? process.env.MYSQL_ROOT_PASSWORD ?? 'root_password',
    host: process.env.BACKUP_CONTAINER_NAME ?? 'jd_crm_db',
    port: 3306,
    database: process.env.BACKUP_DB_NAME ?? 'jd_crm'
  };
}

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
  const creds = getConnectionDetails();
  const containerName = process.env.BACKUP_CONTAINER_NAME ?? 'jd_crm_db';

  let sqlDump: Buffer | null = null;
  let errorMsg = '';

  // Method 1: Try direct mysqldump (ideal inside docker container where mysql-client is installed)
  try {
    const res = spawnSync('mysqldump', [
      '-h', creds.host,
      '-P', String(creds.port),
      `-u${creds.user}`,
      `-p${creds.password}`,
      '--skip-ssl',
      creds.database
    ], { maxBuffer: 500 * 1024 * 1024 });

    if (res.status === 0 && res.stdout && res.stdout.length > 0) {
      sqlDump = res.stdout;
    } else {
      errorMsg = res.stderr?.toString() || 'mysqldump exited with non-zero status';
    }
  } catch (err: any) {
    errorMsg = err.message || String(err);
  }

  // Method 2: Fallback to docker exec if direct mysqldump failed (common on Windows developer hosts)
  if (!sqlDump) {
    try {
      const res = spawnSync('docker', [
        'exec',
        containerName,
        'mysqldump',
        `-u${creds.user}`,
        `-p${creds.password}`,
        '--ssl-mode=DISABLED',
        creds.database
      ], { maxBuffer: 500 * 1024 * 1024 });

      if (res.status === 0 && res.stdout && res.stdout.length > 0) {
        sqlDump = res.stdout;
      } else {
        errorMsg = `Direct mysqldump failed (${errorMsg}), and Docker exec fallback failed: ${res.stderr?.toString() || 'Unknown docker error'}`;
      }
    } catch (err: any) {
      errorMsg = `Direct mysqldump failed (${errorMsg}), and Docker exec fallback failed: ${err.message || String(err)}`;
    }
  }

  if (!sqlDump) {
    return { success: false, error: errorMsg };
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
