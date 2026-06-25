USE jd_crm;

-- Seed default designations
INSERT INTO crm_designations (designation_name, designation_created) VALUES
('Super Admin', NOW()),
('Admin', NOW()),
('Manager', NOW()),
('Team Lead', NOW()),
('Agent', NOW());

-- Seed default teams (IT Park, DB Park, Alex)
INSERT INTO crm_teams (team_name, team_created) VALUES
('IT Park', NOW()),
('DB Park', NOW()),
('Alex', NOW());

-- Seed default roles
INSERT INTO crm_roles (role_id, role_name, role_created) VALUES
(1, 'Super Admin', NOW()),
(2, 'Admin', NOW()),
(3, 'Manager', NOW()),
(4, 'Team Lead', NOW()),
(5, 'Agent', NOW());

-- Seed default permissions
INSERT INTO crm_permissions (permission_id, permission_name, permission_description) VALUES
(1, 'super-admin', 'Administrative superuser bypass'),
(2, 'vendors:view', 'View vendors directory'),
(3, 'agents:view', 'View and manage agents/staff list'),
(4, 'gateways:view', 'View and manage payment gateways'),
(5, 'orders:view', 'View orders, transactions, and status boards');

-- Link permissions to Super Admin role (role_id = 1)
-- Super Admin has 'super-admin' bypass which covers all permissions
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5);

-- Link permissions to Admin (role_id = 2)
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5);

-- Link permissions to Manager (role_id = 3)
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(3, 2), (3, 3), (3, 4), (3, 5);

-- Link permissions to Team Lead (role_id = 4)
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(4, 2), (4, 3), (4, 4), (4, 5);

-- Link permissions to Agent (role_id = 5)
INSERT INTO crm_role_permissions (role_id, permission_id) VALUES
(5, 5);

-- Seed default Super Admin account (Username: admin, Password: admin123)
-- SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- Belongs to 'IT Park' team (team_id = 1), 'Super Admin' role (role_id = 1)
INSERT INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES (
  'Super Admin', 'Admin', 'admin', 'admin@jdfusion.in', '1234567890', '0', 
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1, 30, 
  'Super Admin', 'AG101', 1, 1
);

-- Seed 33 Agents from list (Password: password123 for all)
-- SHA-256 of 'password123' is 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'
-- Teams: IT Park (team_id = 1), DB Park (team_id = 2), Alex (team_id = 3)
-- Roles: Super Admin (1), Admin (2), Manager (3), Team Lead (4), Agent (5)
INSERT INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES 
('Aman Goel', 'Alex', 'alex', 'Alex@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 25, 'Sales Agent', 'JD0016', 5, 3),
('Priyansh Sharma', 'Bruce', 'bruce', 'Bruce@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 28, 'Sales Team Lead', 'JD0017', 4, 2),
('Akansha Bisht', 'Sarah', 'sarah', 'Sarah@jdfusion.in', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 26, 'Sales Agent', 'JD0091', 5, 2),
('Priyanshu Bisht', 'Keith', 'keith', 'keithsmith@tagoreautoparts.com', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 24, 'Vendor Management Agent', 'JD0137', 5, 2),
('Vrinda Gaur', 'Amber', 'amber', 'Amber@jdfusion.in', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 23, 'Sales Agent', 'JD0138', 5, 2),
('Himanshu Rawat', 'Max', 'max', 'max', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 27, 'Sales Agent', 'JD0143', 5, 2),
('Khushi Sharma', 'Gracy', 'gracy', 'gracydavis@tagoreautoparts.com', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 22, 'Vendor Management Agent', 'JD0168', 5, 2),
('Ayush Chauhan', 'Jack', 'jack', 'Jack@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 23, 'Sales Agent', 'JD0181', 5, 2),
('Gaurav Kumar', 'Ethan', 'ethan', 'Ethan@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 26, 'Sales Agent', 'JD0191', 5, 1),
('Beena Rawat', 'Bella', 'bella', 'bellawhite@tagoreautoparts.com', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 29, 'Vendor Management Agent', 'JD0210', 5, 2),
('Rahul Gusain', 'Eddie', 'eddie', 'Eddie@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 28, 'Sales Team Lead', 'JD0241', 4, 1),
('Avyukt Singhal', 'Andy', 'andy', 'Andy@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 24, 'Sales Agent', 'JD0322', 5, 2),
('Hitharth Gulati', 'Mike', 'mike', 'Mike@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 25, 'Sales Agent', 'JD0390', 5, 2),
('Jitender Panwar', 'Jeff', 'jeff', 'jeff@tagoreautoparts.com', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 27, 'Vendor Management Agent', 'JD0450', 5, 1),
('Ajay Raj Ghatola', 'Aiden', 'aiden', 'aiden@tagoreautoparts.com', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 25, 'Vendor Management Agent', 'JD0456', 5, 2),
('Tanishq Gupta', 'Tim', 'tim', 'timjones@tagoreautoparts.com', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 23, 'Vendor Management Agent', 'JD0459', 5, 2),
('Soniya Negi', 'Sandy', 'sandy', 'sandy.miller@tagoreautoparts.com', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 24, 'Vendor Management Agent', 'JD0463', 5, 2),
('Tanya Tamer', 'Taylor', 'taylor', 'taylor.addams@tagoreautoparts.com', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 25, 'Vendor Management Agent', 'JD0480', 5, 2),
('Ankur Sharma', 'Jaiden', 'jaiden', 'Jaiden@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 27, 'Sales Agent', 'JD0489', 5, 2),
('Sakshi Singh Bhandari', 'June', 'june', 'June@jdfusion.in', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 24, 'Sales Agent', 'JD0521', 5, 2),
('Avishar Negi', 'Steve', 'steve', 'steve.murphy@tagoreautoparts.com', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 26, 'Vendor Management Agent', 'JD0526', 5, 2),
('Vaishnavi Dabral', 'Alma', 'alma', 'Alma@jdfusion.in', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 24, 'Sales Agent', 'JD0528', 5, 1),
('Ashish Bisht', 'Steven', 'steven', 'Steven@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 26, 'Sales Agent', 'JD0542', 5, 1),
('Ankit Chauhan', 'Ed Roger', 'ed_roger', 'ed.roger@tagoreautoparts.com', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 25, 'Vendor Management Agent', 'JD0562', 5, 2),
('Anshika Kodari', 'Amanda', 'amanda', 'Amanda@jdfusion.in', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 24, 'Sales Agent', 'JD0581', 5, 1),
('Vivek Rana', 'Eric', 'eric', 'eric.richards@tagoreautoparts.com', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 27, 'Vendor Management Agent', 'JD0591', 5, 2),
('Nidhi Bhattacharya', 'Nancy', 'nancy', 'nancy.smith@tagoreautoparts.com', NULL, '1', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 26, 'Vendor Management Agent', 'JD0592', 5, 2),
('Shikhin Vats', 'Zayne', 'zayne', 'Zayne@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 23, 'Sales Agent', 'JD0597', 5, 1),
('Thabani Ayanda Mkomo', 'Sammy', 'sammy', 'Sammy@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 28, 'Sales Agent', 'JD0604', 5, 2),
('Shubham Thapa', 'Noah', 'noah', 'Noah@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 27, 'Sales Agent', 'JD0618', 5, 2),
('Kshitej Mandhwal', 'Ken Miles', 'ken_miles', 'Ken@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 25, 'Sales Agent', 'JD0645', 5, 1),
('Aryan Batra', 'Tom', 'tom', 'tom@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 24, 'Sales Agent', 'JD0662', 5, 2),
('Vishal Dogra', 'James', 'james', 'James@jdfusion.in', NULL, '0', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 1, 26, 'Sales Agent', 'JD0678', 5, 1);
