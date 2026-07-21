-- ============================================================
-- Migration Script: Add Follow-up Permissions
-- ============================================================
-- Purpose  : Adds two new RBAC permission keys for follow-ups.
-- Safe     : Uses INSERT IGNORE throughout — idempotent, can be run
--            multiple times on the same database with zero side effects.
-- Applies  : Production database (jd_crm) AND any environment that
--            was initialized before the follow-up feature was released.
-- Run once : After deploying the follow-up feature code, execute this script
--            against production via phpMyAdmin, SSH MySQL CLI, or any
--            DB client connected to the live jd_crm schema.
-- ============================================================
-- How to run on production (SSH / CLI):
--   mysql -u <db_user> -p<db_password> jd_crm < scripts/sql/add-followup-permissions.sql
-- How to run via Docker local:
--   Get-Content "scripts/sql/add-followup-permissions.sql" | docker exec -i jd_crm_db mysql -u root -proot_password jd_crm
-- ============================================================

USE jd_crm;

-- ---- Step 1: Insert the two new follow-up permissions --------
-- INSERT IGNORE silently skips if permission_id already exists.
-- permission_id values 58, 59 are reserved for these two keys.
INSERT IGNORE INTO crm_permissions (permission_id, permission_name, permission_description) VALUES
(58, 'follow-ups:view',   'Admin-level: view all follow-ups across all agents and centers'),
(59, 'follow-ups:create', 'Agent-level: create and view own follow-ups only');

-- ---- Step 2: Assign new permissions to Super Admin (role_id = 1) -
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(1, 58),
(1, 59);

-- ---- Step 3: Assign new permissions to Admin (role_id = 2) ------
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(2, 58),
(2, 59);

-- ---- Step 4: Assign create permission to Agent (role_id = 8) ----
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(8, 59);

-- ---- Done -------------------------------------------------------
-- Verify by running:
--   SELECT permission_id, permission_name FROM crm_permissions WHERE permission_id IN (58, 59);
--   SELECT role_id, permission_id FROM crm_role_permissions WHERE permission_id IN (58, 59);
