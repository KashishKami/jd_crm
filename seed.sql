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
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5);

-- Seed default Super Admin account (Password: admin123)
-- SHA-256 of 'admin123' is '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
-- Belongs to 'IT Park' team (team_id = 1)
-- Belongs to 'Super Administrator' role (role_id = 1)
INSERT INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES (
  'Super Admin', 'Admin', 'admin', 'admin@jdfusion.in', '1234567890', '0', 
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1, 30, 
  'Super Administrator', 'AG101', 1, 1
);
