# MySQL Database Backup Setup Guide (Phases 27 & 28)

This guide documents the one-time manual steps required on the production VPS server to configure and authorize MySQL database backups (both manual UI triggers and automated Saturday cron runs).

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

The automated backup is executed by the Linux OS `cron` daemon directly on the host machine every Saturday at 23:00 (11:00 PM). It runs a standalone script (`src/scripts/run-backup.ts`) and does not depend on the Next.js app container being active.

### Setup Steps:

1. Open your server's crontab configuration:
   ```bash
   crontab -e
   ```
   *(If prompted, choose `nano` or your preferred text editor).*

2. Paste the following line at the very bottom of the file:
   ```text
   0 23 * * 6 cd /opt/jd-crm && npx tsx src/scripts/run-backup.ts >> /jd_crm_backup/backup.log 2>&1
   ```
   *Note: `/opt/jd-crm` is the target deployment directory on the VPS (defined in your `deploy.yml` pipeline).*

3. Save and close the editor (`Ctrl + O`, `Enter`, then `Ctrl + X` in nano).

4. Verify that the cron job is registered:
   ```bash
   crontab -l
   ```

---

## 3. Environment Variables Reference

The backup logic is fully integrated with your existing Docker Compose environment variables. No new variables are required under normal operation, but the following overrides can be specified in your `/opt/jd-crm/.env` file if needed:

| Variable | Description | Default / Fallback |
| :--- | :--- | :--- |
| `BACKUP_DIR` | Absolute path where backups are stored on host. | `/jd_crm_backup` |
| `BACKUP_DB_NAME` | Database name to backup. | `jd_crm` |
| `BACKUP_DB_USER` | MySQL user to run dump. | `root` |
| `BACKUP_DB_PASSWORD` | MySQL password. | Defaults to `MYSQL_ROOT_PASSWORD` |
| `BACKUP_CONTAINER_NAME` | Name of the MySQL container. | `jd_crm_db` |

---

## 4. Manual Verification & Logs

### Manual Test Run
You can trigger the script manually on the VPS at any time to verify permissions and connections:
```bash
cd /opt/jd-crm
npx tsx src/scripts/run-backup.ts
```
Expected output:
```text
[run-backup] Starting at 2026-07-26T17:30:00.000Z
[run-backup] SUCCESS — Saved: jd_crm_2026-07-26_17-30-00.sql.gz
```

### Inspecting Logs
To inspect cron backup history or debug failures, view the log:
```bash
tail -n 50 /jd_crm_backup/backup.log
```
