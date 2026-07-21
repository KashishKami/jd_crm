-- ============================================================
-- Migration Script: Add Call Disposition Permissions
-- ============================================================
-- Purpose  : Adds two new RBAC permission keys for call dispositions.
-- Safe     : Uses INSERT IGNORE throughout — idempotent, can be run
--            multiple times on the same database with zero side effects.
-- Applies  : Production database (jd_crm) AND any environment that
--            was initialized before the call disposition feature was released.
-- ============================================================
-- How to run via Local Docker (PowerShell):
--   Get-Content "scripts/sql/add-call-disposition-permissions.sql" | docker exec -i jd_crm_db mysql -u root -proot_password jd_crm
--
-- How to run via Local Docker (Inline execution):
--   docker exec -i jd_crm_db mysql -u root -proot_password jd_crm -e "INSERT IGNORE INTO crm_permissions (permission_id, permission_name, permission_description) VALUES (60, 'call-dispositions:view', 'Admin-level: view all call dispositions across all agents, full filter controls, delete, and Excel export'), (61, 'call-dispositions:create', 'Agent-level: create and view own call dispositions only, no delete, no export'); INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES (1, 60), (1, 61), (2, 60), (2, 61), (8, 61);"
--
-- How to run on Production VPS (SSH direct on server):
--   docker exec -i jd_crm_db mysql -u root -p$(grep MYSQL_ROOT_PASSWORD /opt/jd-crm/.env | cut -d '=' -f2) jd_crm -e "INSERT IGNORE INTO crm_permissions (permission_id, permission_name, permission_description) VALUES (60, 'call-dispositions:view', 'Admin-level: view all call dispositions across all agents, full filter controls, delete, and Excel export'), (61, 'call-dispositions:create', 'Agent-level: create and view own call dispositions only, no delete, no export'); INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES (1, 60), (1, 61), (2, 60), (2, 61), (8, 61);"
--
-- How to run on Production VPS (Remote SSH pipe):
--   ssh <VPS_USER>@<VPS_HOST> "docker exec -i jd_crm_db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD /opt/jd-crm/.env | cut -d '=' -f2) jd_crm" < scripts/sql/add-call-disposition-permissions.sql
-- ============================================================

USE jd_crm;

-- ---- Step 1: Insert the two new call disposition permissions ----
-- INSERT IGNORE silently skips if permission_id already exists.
-- permission_id values 60, 61 are reserved for these two keys.
INSERT IGNORE INTO crm_permissions (permission_id, permission_name, permission_description) VALUES
(60, 'call-dispositions:view',   'Admin-level: view all call dispositions across all agents, full filter controls, delete, and Excel export'),
(61, 'call-dispositions:create', 'Agent-level: create and view own call dispositions only, no delete, no export');

-- ---- Step 2: Assign new permissions to Super Admin (role_id = 1) -
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(1, 60),
(1, 61);

-- ---- Step 3: Assign new permissions to Admin (role_id = 2) ------
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(2, 60),
(2, 61);

-- ---- Step 4: Assign create permission to Agent (role_id = 8) ----
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(8, 61);

-- ---- Verification Queries ---------------------------------------
--   SELECT permission_id, permission_name FROM crm_permissions WHERE permission_id IN (60, 61);
--   SELECT role_id, permission_id FROM crm_role_permissions WHERE permission_id IN (60, 61);
