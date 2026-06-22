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

-- Seed default Super Admin account (Password: admin123)
-- SHA-256 of 'admin123' is '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'
-- Belongs to 'IT Park' team (team_id = 1)
INSERT INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, user_permissions, team_id
) VALUES (
  'Super Admin', 'Admin', 'admin', 'admin@jdfusion.in', '1234567890', '0', 
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1, 30, 
  'Super Administrator', 'AG101', '99999', 1
);
