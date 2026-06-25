USE jd_crm;

-- Seed default designations
INSERT INTO crm_designations (designation_name, designation_created) VALUES
('Super Administrator', NOW()),
('Sales Manager', NOW()),
('Sales Agent', NOW()),
('Verifier', NOW());

-- Seed default teams (IT Park, DB Park, Alex)
INSERT INTO crm_teams (team_name, team_created) VALUES
('IT Park', NOW()),
('DB Park', NOW()),
('Alex', NOW());

-- Seed default roles
INSERT INTO crm_roles (role_id, role_name, role_created) VALUES
(1, 'Super Administrator', NOW()),
(2, 'Sales Manager', NOW()),
(3, 'Sales Agent', NOW()),
(4, 'Verifier', NOW());

-- Seed default permissions
INSERT INTO crm_permissions (permission_id, permission_name, permission_description) VALUES
(1, 'super-admin', 'Administrative superuser bypass'),
(2, 'vendors:view', 'View vendors directory'),
(3, 'agents:view', 'View and manage agents/staff list'),
(4, 'gateways:view', 'View and manage payment gateways'),
(5, 'orders:view', 'View orders, transactions, and status boards');

-- Link permissions to Super Administrator role (role_id = 1)
-- Super Administrator has 'super-admin' bypass which covers all permissions
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5);

-- Link permissions to Sales Manager (role_id = 2)
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(2, 2), -- vendors:view
(2, 3), -- agents:view
(2, 4), -- gateways:view
(2, 5); -- orders:view

-- Link permissions to Sales Agent (role_id = 3)
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(3, 5); -- orders:view

-- Link permissions to Verifier (role_id = 4)
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(4, 5); -- orders:view

-- Seed test accounts (Passwords are '<username>123')
-- All test users belong to the 'IT Park' team (team_id = 1)

-- 1. Super Admin (Username: admin, Password: admin123)
-- SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES (
  'Super Admin', 'Admin', 'admin', 'admin@jdfusion.in', '1234567890', '0', 
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1, 30, 
  'Super Administrator', 'AG101', 1, 1
);

-- 2. Sales Manager (Username: manager, Password: manager123)
-- SHA-256: 866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5
INSERT INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES (
  'Sales Manager', 'Manager', 'manager', 'manager@jdfusion.in', '1234567891', '0', 
  '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5', 1, 32, 
  'Sales Manager', 'AG102', 2, 1
);

-- 3. Sales Agent (Username: agent, Password: agent123)
-- SHA-256: f44d1ac9bf0c69b083380b86dbdf3b73797150e3cca4820ac399f7917e607647
INSERT INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES (
  'Sales Agent', 'Agent', 'agent', 'agent@jdfusion.in', '1234567892', '0', 
  'f44d1ac9bf0c69b083380b86dbdf3b73797150e3cca4820ac399f7917e607647', 1, 25, 
  'Sales Agent', 'AG103', 3, 1
);

-- 4. Verifier (Username: verifier, Password: verifier123)
-- SHA-256: 67f3f810a6c6c08900d357b76397e9e2d302be7fc07b99d4c3ba98ed7c244eb4
INSERT INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES (
  'Verifier Staff', 'Verifier', 'verifier', 'verifier@jdfusion.in', '1234567893', '1', 
  '67f3f810a6c6c08900d357b76397e9e2d302be7fc07b99d4c3ba98ed7c244eb4', 1, 28, 
  'Verifier', 'AG104', 4, 1
);

