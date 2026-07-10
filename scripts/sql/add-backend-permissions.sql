-- ============================================================
-- Migration Script: Add Backend Dashboard Permissions (Phase 29)
-- ============================================================
-- Purpose  : Adds three new RBAC permission keys for the Backend Team
--            Performance widget introduced in Phase 29.
-- Safe     : Uses INSERT IGNORE throughout — idempotent, can be run
--            multiple times on the same database with zero side effects.
-- Applies  : Production database (jd_crm) AND any environment that
--            was initialized before Phase 29 was released.
-- Run once : After deploying the Phase 29 code, execute this script
--            against production via phpMyAdmin, SSH MySQL CLI, or any
--            DB client connected to the live jd_crm schema.
-- ============================================================
-- How to run on production (SSH / CLI):
--   mysql -u <db_user> -p<db_password> jd_crm < scripts/sql/add-backend-permissions.sql
-- How to run via Docker local:
--   Get-Content "scripts/sql/add-backend-permissions.sql" | docker exec -i jd_crm_db mysql -u root -proot_password jd_crm
-- ============================================================

USE jd_crm;

-- ---- Step 1: Insert the three new backend permissions --------
-- INSERT IGNORE silently skips if permission_id already exists.
-- permission_id values 55, 56, 57 are reserved for these three keys.
INSERT IGNORE INTO crm_permissions (permission_id, permission_name, permission_description) VALUES
(55, 'dashboard:backend-top-performer',    'View Backend Team Top Performers widget (ranked by completed cases)'),
(56, 'dashboard:backend-bottom-performer', 'View Backend Team Bottom Performers widget (ranked by highest backlog)'),
(57, 'dashboard:backend-pending-cases',    'View Backend Pending Cases by Category breakdown table');

-- ---- Step 2: Assign new permissions to Super Admin (role_id = 1) -
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(1, 55),
(1, 56),
(1, 57);

-- ---- Step 3: Assign new permissions to Admin (role_id = 2) ------
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(2, 55),
(2, 56),
(2, 57);

-- ---- Done -------------------------------------------------------
-- Verify by running:
--   SELECT permission_id, permission_name FROM crm_permissions WHERE permission_id IN (55, 56, 57);
--   SELECT role_id, permission_id FROM crm_role_permissions WHERE permission_id IN (55, 56, 57);
