# MySQL Database Backup Setup Guide (Phases 27 & 28)

This guide documents the one-time manual steps required on the production VPS server to configure and authorize MySQL database backups (both manual UI triggers and automated Saturday cron runs).

---

## How the Two Backup Paths Work

Both the manual UI button and the automated cron job run the **exact same backup logic** — the `runBackup()` function inside `src/lib/backup.ts`. The difference is only in how that function gets called:

| | Manual UI Button | Automated Cron Job |
|---|---|---|
| **Triggered by** | Admin clicking "Create Backup" in the browser | Linux `cron` daemon firing at 23:00 every Saturday |
| **Entry point** | Next.js API route: `/api/admin/backup/trigger` | `docker exec jd_crm_app node run-backup.js` |
| **How it reaches `backup.ts`** | The API route imports `runBackup()` directly. Next.js compiles all API routes into `.next/standalone/` during `npm run build` — so `backup.ts` logic is already bundled inside the running Next.js server. | `run-backup.ts` is a thin wrapper that imports `runBackup()`. Because `src/` is not in the production image, this script is pre-compiled by esbuild into a single `run-backup.js` file and baked into the image at build time. |
| **Needs `run-backup.js`?** | ❌ No — the API route handles it | ✅ Yes — this IS the entry point |
| **Needs internet / tsx?** | ❌ No | ❌ No — plain `node run-backup.js` |

> **Why can't the cron just call the API route?**
> The cron runs as a host shell command — it has no session token, no authentication, and no way to make a trusted internal HTTP call. The `run-backup.js` compiled bundle is the clean solution: it runs inside the same container with the same `DATABASE_URL` environment, bypassing HTTP entirely.

---

## How Backup Credentials are Resolved (Auto-Configured)

You do **not** need to manually define database URL or credentials variables in your host's `.env` file. The backup system resolves credentials automatically:

### 1. Manual Backup (UI Button Trigger)
When you click **"Create Backup"** in the browser:
- The execution happens **inside the application Docker container** (`jd_crm_app`).
- The container inherits the `DATABASE_URL` environment variable directly via `docker-compose.prod.yml`:
  `DATABASE_URL: "mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@database:3306/jd_crm"`
- The backend code (`src/lib/backup.ts`) parses this connection string to extract the host, username, and password, then runs `mysqldump` natively inside the container.

### 2. Automated Backup (Saturday Crontab Trigger)
When the cron job triggers:
- The execution happens **natively on the VPS host shell** (outside any Docker container).
- The cron command calls `docker exec jd_crm_app node run-backup.js` — targeting the application container, which contains a **pre-compiled JavaScript bundle** of the backup script baked into the image at build time.
- `run-backup.js` is compiled from `src/scripts/run-backup.ts` + `src/lib/backup.ts` during the Docker build (using esbuild in the builder stage). It contains the exact same backup logic as the manual UI trigger, including automatic retention cleanup.
- The backup file writes to `/jd_crm_backup/` inside the container, which is bind-mounted to the same path on the host filesystem — so it lands on the VPS disk automatically.

---

## 1. Directory Setup & Permissions on VPS Host

The Next.js application runs inside a Docker container under the non-root `nextjs` user for security. Because `/jd_crm_backup` is bind-mounted from the physical host server to the container, the host directory must be created beforehand with appropriate write permissions.

Log in to your production server via SSH and execute the following commands:

```bash
# 1. Create the backup directory on the host filesystem
sudo mkdir -p /jd_crm_backup

# 2. Grant read/write/execute permissions to all users (so the container's nextjs user can write)
sudo chmod 777 /jd_crm_backup

# 3. Create the log file for crontab backup output
sudo touch /jd_crm_backup/backup.log
sudo chmod 666 /jd_crm_backup/backup.log
```

---

## 2. Weekly Automated Cron Configuration

The automated backup runs every Saturday at 23:00 (11:00 PM) via the Linux OS `cron` daemon on the VPS host.

### Approach Comparison

Before setting up the cron, it is worth understanding why the command below was chosen over simpler alternatives. Three approaches were considered:

---

#### ❌ Approach A — `npx tsx` at cron time (do not use)

```text
# DO NOT USE — downloads tsx from the internet every Saturday night
0 23 * * 6 docker exec jd_crm_app npx tsx src/scripts/run-backup.ts >> /jd_crm_backup/backup.log 2>&1
```

**Why it was rejected:**
- `tsx` is not installed in the production image (it is a dev-only tool).
- `npx` would download it from npm every time the cron runs (~5MB download every week).
- If the VPS has no internet access at 23:00 on Saturday, the backup silently fails.
- `src/scripts/run-backup.ts` is also not in the production image (Next.js standalone build does not copy `src/` into the runner).

---

#### ❌ Approach B — Raw `docker exec mysqldump` shell pipe (acceptable but avoid)

```text
# Retention count is hardcoded — will drift if BACKUP_RETENTION_COUNT in backup.ts changes
0 23 * * 6 PASSWORD=$(grep -E "^MYSQL_ROOT_PASSWORD=" /opt/jd-crm/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'") && docker exec jd_crm_db mysqldump -uroot -p"$PASSWORD" --single-transaction jd_crm | gzip > /jd_crm_backup/jd_crm_$(date +\%Y-\%m-\%d_\%H-\%M-\%S).sql.gz && ls -1t /jd_crm_backup/jd_crm_*.sql.gz | tail -n +5 | while read f; do rm "$f"; done >> /jd_crm_backup/backup.log 2>&1
```

**Why it was rejected:**
- The retention count (keep 4 backups) is hardcoded as `tail -n +5` in the cron line.
- The actual retention count is controlled by `BACKUP_RETENTION_COUNT` in `src/lib/backup.ts`. If that constant is ever changed, the cron line must also be manually updated — easy to forget.
- Duplicates logic that already exists in the codebase; two places to maintain.
- Does not produce the same structured log output as the real `runBackup()` function.

---

#### ✅ Approach C — Pre-compiled JS bundle (production standard — use this)

```text
0 23 * * 6 docker exec jd_crm_app node run-backup.js >> /jd_crm_backup/backup.log 2>&1
```

**Why this is correct:**
- `run-backup.js` is a single compiled JavaScript file baked into the `jd_crm_app` image at build time by esbuild. It bundles both `run-backup.ts` and `backup.ts` into one file.
- No internet access needed. No downloads. No source files needed. Just plain `node`.
- The retention count (`BACKUP_RETENTION_COUNT` in `backup.ts`) is compiled into the bundle at build time. If you change it and redeploy, the next cron run automatically uses the updated value. The cron line itself never needs to change.
- Produces identical log output and behaviour as the manual UI trigger.
- The `jd_crm_app` container has `mysql-client` installed (see Dockerfile) and can reach the `database` service via the internal Docker network, so `mysqldump` runs successfully.

---

### Setup Steps

1. Open your server's crontab configuration:
   ```bash
   crontab -e
   ```
   *(If prompted, choose `nano` or your preferred text editor).*

2. Paste the following line at the very bottom of the file:
   ```text
   0 23 * * 6 docker exec jd_crm_app node run-backup.js >> /jd_crm_backup/backup.log 2>&1
   ```

   **What this does, step by step:**
   - `0 23 * * 6` — runs at 23:00 every Saturday (day 6 of the week).
   - `docker exec jd_crm_app node run-backup.js` — runs the pre-compiled backup bundle inside the application container. The script reads `DATABASE_URL` from the container's own environment, connects to the database, runs `mysqldump`, gzip-compresses the output, and handles retention cleanup.
   - `>> /jd_crm_backup/backup.log 2>&1` — appends all stdout and stderr (success messages, errors, deleted file names) to the log file.

3. Save and close the editor (`Ctrl + O`, `Enter`, then `Ctrl + X` in nano).

4. Verify that the cron job is registered:
   ```bash
   crontab -l
   ```

---

## 3. Optional Environment Overrides

Under normal operation, **no environment variables need to be set or configured**. The backup system automatically falls back to your existing settings (resolving database password to `MYSQL_ROOT_PASSWORD` and container name to `jd_crm_db`).

However, if you ever change your infrastructure in the future, you can define the following optional variables in your `.env` file to override the default behavior:

- `BACKUP_DIR`: Custom host folder path to save backups (defaults to `/jd_crm_backup`).
- `BACKUP_DB_NAME`: Custom database name to backup (defaults to `jd_crm`).
- `BACKUP_DB_USER`: Custom MySQL user to run the dump (defaults to `root`).
- `BACKUP_DB_PASSWORD`: Custom database password (defaults to `MYSQL_ROOT_PASSWORD`).
- `BACKUP_CONTAINER_NAME`: Custom name of the Docker database container (defaults to `jd_crm_db`).

The only time you would ever need to define those variables in the future is if you decide to:
- Rename your MySQL container to something other than `jd_crm_db`.
- Rename your database to something other than `jd_crm`.
- Use a different MySQL username instead of root to run the dump.
- Save the backups to a different folder path on the server filesystem.

Because your current setup matches these defaults exactly, the backup logic runs automatically without you having to define any of these environment variables.

---

## 4. Manual Verification & Logs

### Manual Test Run
You can trigger the backup manually on the VPS host shell at any time to verify permissions and connections:
```bash
docker exec jd_crm_app node run-backup.js
```
Then verify the file was successfully written to the host:
```bash
ls -lh /jd_crm_backup/
```

### Inspecting Logs
To inspect cron backup history or debug failures, view the log:
```bash
tail -n 50 /jd_crm_backup/backup.log
```
