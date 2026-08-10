-- ============================================================
-- Migration Script: Update Follow-up Permissions for View Team
-- ============================================================
-- Purpose  : Renames permission 58 'follow-ups:view' -> 'follow-ups:view-all'
--            and adds new permission 62 'follow-ups:view-team'.
-- Safe     : Idempotent, safe to run multiple times without side effects.
-- Applies  : Production database (jd_crm) AND local development.
-- ============================================================
-- How to run via Local Docker (PowerShell):
--   Get-Content "scripts/sql/update-followup-team-permissions.sql" | docker exec -i jd_crm_db mysql -u root -proot_password jd_crm
--
-- How to run via Local Docker (Inline execution):
--   docker exec -i jd_crm_db mysql -u root -proot_password jd_crm -e "UPDATE crm_permissions SET permission_name = 'follow-ups:view-all', permission_description = 'Admin-level: view all follow-ups across all agents and centers' WHERE permission_name = 'follow-ups:view'; INSERT IGNORE INTO crm_permissions (permission_id, permission_name, permission_description) VALUES (62, 'follow-ups:view-team', 'Team-level: view follow-ups of agents in own center/team only'); INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES (1, 62), (2, 62), (3, 62), (4, 62);"
--
-- How to run on Production VPS (SSH direct on server):
--   docker exec -i jd_crm_db mysql -u root -p$(grep MYSQL_ROOT_PASSWORD /opt/jd-crm/.env | cut -d '=' -f2) jd_crm -e "UPDATE crm_permissions SET permission_name = 'follow-ups:view-all', permission_description = 'Admin-level: view all follow-ups across all agents and centers' WHERE permission_name = 'follow-ups:view'; INSERT IGNORE INTO crm_permissions (permission_id, permission_name, permission_description) VALUES (62, 'follow-ups:view-team', 'Team-level: view follow-ups of agents in own center/team only'); INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES (1, 62), (2, 62), (3, 62), (4, 62);"
--
-- How to run on Production VPS (Remote SSH pipe):
--   ssh <VPS_USER>@<VPS_HOST> "docker exec -i jd_crm_db mysql -u root -p\$(grep MYSQL_ROOT_PASSWORD /opt/jd-crm/.env | cut -d '=' -f2) jd_crm" < scripts/sql/update-followup-team-permissions.sql
-- ============================================================

USE jd_crm;

-- ---- Step 1: Rename permission 58 to follow-ups:view-all ---------
UPDATE crm_permissions 
SET permission_name = 'follow-ups:view-all',
    permission_description = 'Admin-level: view all follow-ups across all agents and centers'
WHERE permission_name = 'follow-ups:view' OR permission_id = 58;

-- ---- Step 2: Insert new permission 62 follow-ups:view-team -------
INSERT IGNORE INTO crm_permissions (permission_id, permission_name, permission_description) VALUES
(62, 'follow-ups:view-team', 'Team-level: view follow-ups of agents in own center/team only');

-- ---- Step 3: Assign new view-team permission to Super Admin (1), Admin (2), Manager (3), Team Lead (4) -
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(1, 62),
(2, 62),
(3, 62),
(4, 62);

-- ---- Verification Queries ---------------------------------------
--   SELECT permission_id, permission_name FROM crm_permissions WHERE permission_id IN (58, 59, 62);
--   SELECT role_id, permission_id FROM crm_role_permissions WHERE permission_id IN (58, 59, 62);
