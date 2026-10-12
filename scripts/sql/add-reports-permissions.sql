-- ============================================================
-- Migration Script: Add Reports Permissions (Phase 44)
-- ============================================================
-- Purpose  : Adds sequential RBAC permission keys for the Reports module:
--            63: reports:agent-sales (View Agent Sales Performance matrix)
--            64: reports:agent-sales-export (Export Agent Sales matrix to Excel)
--            Assigns them to Super Admin (1), Admin (2), Manager (3) [view+export],
--            and Team Lead (4) [view only].
-- Safe     : Idempotent, safe to run multiple times without side effects.
-- Applies  : Production database (jd_crm) AND local development.
-- ============================================================
-- How to run via Local Docker (PowerShell):
--   Get-Content "scripts/sql/add-reports-permissions.sql" | docker exec -i jd_crm_db mysql -u root -proot_password jd_crm
--
-- How to run on Production VPS (Direct on server from /tmp):
--   docker exec -i jd_crm_db mysql -u root -p$(grep MYSQL_ROOT_PASSWORD /opt/jd-crm/.env | cut -d '=' -f2) jd_crm < /tmp/add-reports-permissions.sql
--
-- How to run on Production VPS (Remote SSH pipe):
--   ssh root@82.29.165.21 "docker exec -i jd_crm_db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD /opt/jd-crm/.env | cut -d '=' -f2) jd_crm" < scripts/sql/add-reports-permissions.sql
-- ============================================================

USE jd_crm;

-- ---- Step 1: Upsert report-specific permissions at sequential IDs 63, 64, and 65 ----
INSERT INTO crm_permissions (permission_id, permission_name, permission_description) VALUES
(63, 'reports:agent-sales',        'View Agent Sales Matrix performance report'),
(64, 'reports:agent-sales-export', 'Export Agent Sales Matrix performance report to Excel spreadsheets'),
(65, 'reports:agent-sales-team',   'Team-level: view Agent Sales Matrix performance report for own center/team only')
ON DUPLICATE KEY UPDATE 
  permission_name = VALUES(permission_name),
  permission_description = VALUES(permission_description);

-- ---- Step 2: Assign to Super Admin (1), Admin (2), Manager (3), Team Lead (4) ----
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(1, 63),
(1, 64),
(1, 65),
(2, 63),
(2, 64),
(2, 65),
(3, 63),
(3, 64),
(4, 65);

-- ---- Step 3: Verification output --------------------------------
SELECT 
  r.role_id, 
  r.role_name, 
  p.permission_id, 
  p.permission_name
FROM crm_role_permissions rp
JOIN crm_roles r ON rp.role_id = r.role_id
JOIN crm_permissions p ON rp.permission_id = p.permission_id
WHERE p.permission_id IN (63, 64, 65)
ORDER BY r.role_id, p.permission_id;
