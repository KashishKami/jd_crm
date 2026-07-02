USE jd_crm;

-- ============================================================
-- Disable FK checks during seeding to avoid ordering issues
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM crm_comments;
DELETE FROM crm_sale_status_history;
DELETE FROM crm_order_current_status_history;
DELETE FROM crm_order_views;
DELETE FROM crm_order_audit_log;
DELETE FROM crm_orders;
DELETE FROM crm_customer_cards;
DELETE FROM crm_customers;
DELETE FROM users;
DELETE FROM crm_role_permissions;
DELETE FROM crm_permissions;
DELETE FROM crm_roles;
DELETE FROM crm_designations;

-- Seed default designations
INSERT INTO crm_designations (designation_name, designation_created) VALUES
('Director', NOW()),
('Business Head', NOW()),
('Sr. Manager', NOW()),
('Operations Manager', NOW()),
('Assistant Manager', NOW()),
('Backend Specialist', NOW()),
('Backend Associate', NOW()),
('Sales Supervisor', NOW()),
('Sales Team Lead', NOW()),
('Assistant Team Lead', NOW()),
('HR Manager', NOW()),
('HR Executive', NOW()),
('Human Resource', NOW()),
('Quality Associate', NOW()),
('Sales Specialist', NOW()),
('Sales Expert', NOW()),
('Sales Associate', NOW());

-- Seed default teams (IT Park, DB Park, Alex)
INSERT INTO crm_teams (team_id, team_name, team_created) VALUES
(1, 'IT Park', NOW()),
(2, 'DB Park', NOW()),
(3, 'Alex', NOW())
ON DUPLICATE KEY UPDATE team_name = VALUES(team_name);

-- Seed default roles
DELETE FROM crm_roles;
INSERT INTO crm_roles (role_id, role_name, role_created) VALUES
(1, 'Super Admin', NOW()),
(2, 'Admin', NOW()),
(3, 'Manager', NOW()),
(4, 'Team Lead', NOW()),
(5, 'HR', NOW()),
(6, 'Vendor Management', NOW()),
(7, 'QA', NOW()),
(8, 'Agent', NOW())
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Seed default permissions
INSERT INTO crm_permissions (permission_id, permission_name, permission_description) VALUES
-- Super Admin bypass
(1,  'super-admin',                    'Administrative superuser bypass'),
-- Dashboard
(2,  'dashboard:total-sales',          'View Total Sales widget and detail drill-down'),
(3,  'dashboard:monthly-sales',        'View Total Sales This Month widget and detail'),
(4,  'dashboard:today-sales',          'View Today Sales widget and detail'),
(5,  'dashboard:chargeback',           'View Chargeback This Month widget and detail'),
(6,  'dashboard:refund',               'View Refund This Month widget and detail'),
(7,  'dashboard:net-sales',            'View Net Sales widget'),
(8,  'dashboard:top-performer',        'View Top Performer widget'),
(9,  'dashboard:bottom-performer',     'View Bottom Performer widget'),
(10, 'dashboard:pending-counts',       'View all pending pipeline count tiles'),
(11, 'dashboard:top-vendors',          'View Top Vendors widget'),
(12, 'dashboard:blacklisted-vendors',  'View Blacklisted Vendors widget'),
(13, 'dashboard:recent-orders',        'View Recent Orders table'),
(14, 'dashboard:view-advanced-chart',  'View advanced sales analytics chart'),
(15, 'dashboard:team-monthly-scores',  'View monthly team-wise aggregate scores widget'),
(16, 'dashboard:team-top-performer',   'View top performer per team for current month'),
(17, 'dashboard:team-bottom-performer','View bottom performer per team for current month'),
-- Vendors
(18, 'vendors:view',                   'View vendors directory'),
(19, 'vendors:create',                 'Add new vendors'),
(20, 'vendors:edit',                   'Edit or blacklist/restore a vendor'),
-- Agents
(21, 'agents:view',                    'View active agents/staff list'),
(22, 'agents:view-inactive',           'View inactive agents list'),
(23, 'agents:create',                  'Create a new agent account'),
(24, 'agents:edit',                    'Edit agent details or deactivate'),
(25, 'agents:view-roles',              'View roles column and filter in Agent list'),
(26, 'agents:view-details',            'View sensitive agent detail tabs (bank, academic, work)'),
-- Gateways
(27, 'gateways:view',                  'View all payment gateways'),
(28, 'gateways:create',                'Add a new gateway'),
(29, 'gateways:report',                'Access gateway report page'),
(30, 'gateways:edit',                  'Edit or deactivate a gateway'),
-- Orders
(31, 'orders:view',                    'View orders, transactions, and status boards'),
(32, 'orders:create',                  'Create a new order'),
(33, 'orders:edit',                    'Edit or delete an existing order'),
(34, 'orders:view-completed',          'View completed orders'),
(35, 'orders:view-pending-booking',    'View pending booking queue'),
(36, 'orders:view-pending-shipment',   'View pending shipment queue'),
(37, 'orders:view-pending-delivery',   'View pending delivery queue'),
(38, 'orders:view-pending-feedback',   'View pending feedback queue'),
(39, 'orders:view-pending-resolutions','View pending resolutions queue'),
(40, 'orders:view-returned',           'View returned orders queue'),
(41, 'orders:view-cancelled',          'Access Cancelled Orders queue'),
(42, 'orders:view-sale-status-history', 'View sale status change history timeline'),
(43, 'orders:view-workflow-history',    'View order workflow status change timeline'),
(44, 'orders:delete',                    'Permanently delete an order and all its children logs'),
(45, 'orders:view-log',                  'Access order detail page view access history log'),
(46, 'orders:view-audit-log',            'View detailed per-field change audit logs of orders'),
-- Customers
(47, 'customers:view',                 'View customer list and detail pages'),
(48, 'customers:create',               'Create a new customer'),
(49, 'customers:edit',                 'Edit customer details'),
(50, 'customers:view-phone',           'View customer phone number in order detail'),
(51, 'customers:view-email',           'View customer email in order detail'),
(52, 'customers:view-vendor-details',  'View linked vendor details in order detail'),
(53, 'customers:view-cards',           'View full unmasked payment card details'),
-- Settings
(54, 'settings:manage-permissions',    'Manage role permissions matrix')
ON DUPLICATE KEY UPDATE permission_description = VALUES(permission_description);

-- Clear existing role permissions mappings to ensure only admin/superadmin roles are mapped
DELETE FROM crm_role_permissions;

-- Link permissions to Super Admin role (role_id = 1)
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),
(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),
(1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27),(1,28),(1,29),(1,30),
(1,31),(1,32),(1,33),(1,34),(1,35),(1,36),(1,37),(1,38),(1,39),(1,40),
(1,41),(1,42),(1,43),(1,44),(1,45),(1,46),(1,47),(1,48),(1,49),(1,50),(1,51),(1,52),(1,53),(1,54);

-- Link permissions to Admin (role_id = 2)
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),
(2,11),(2,12),(2,13),(2,14),(2,15),(2,16),(2,17),(2,18),(2,19),(2,20),
(2,21),(2,22),(2,23),(2,24),(2,25),(2,26),(2,27),(2,28),(2,29),(2,30),
(2,31),(2,32),(2,33),(2,34),(2,35),(2,36),(2,37),(2,38),(2,39),(2,40),
(2,41),(2,42),(2,43),(2,44),(2,45),(2,46),(2,47),(2,48),(2,49),(2,50),(2,51),(2,52),(2,53),(2,54);

-- Clear existing users to cleanly seed new list
DELETE FROM users;

-- Seed default Super Admin account (Username: admin, Password: admin123)
INSERT IGNORE INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES (
  'Super Admin', 'Admin', 'admin', 'admin@jdfusion.in', '1234567890', '0',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1, 30,
  'Business Head', 'AG101', 1, 1
);

-- Seed 42 Agents from the list
-- Plaintext Passwords:
-- Amit Srivastav (adam_thomas): Hacking@0029
-- All other agents: Hacking@159$
INSERT IGNORE INTO users (
  name, nickname, username, email, mobile, gender, password, status, age, designation, agent_id, role_id, team_id
) VALUES
('Amit Srivastav', 'Adam Thomas', 'adam_thomas', 'Amit@jdfusion.in', NULL, '0', '4ed2bc9745dec2665bd497e5d6e2688debd8e91989e13fcc1f5c7658bb0eb91b', 1, NULL, 'Business Head', NULL, 1, 1),
('Vijay Bobal', 'Garry', 'garry', 'Garry@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sr. Manager', NULL, 3, 2),
('Aanchal Rawat', 'Ana', 'ana', 'Ana@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Operations Manager', NULL, 3, 2),
('Aman Goel', 'Alex', 'alex', 'Alex@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Supervisor', NULL, 4, 3),
('Priyansh Sharma', 'Bruce', 'bruce', 'Bruce@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Team Lead', NULL, 4, 2),
('Akansha Bisht', 'Sarah', 'sarah', 'Sarah@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Priyanshu Bisht', 'Keith', 'keith', 'keithsmith@tagoreautoparts.com', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Specialist', NULL, 6, 2),
('Vrinda Gaur', 'Amber', 'amber', 'Amber@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Himanshu Rawat', 'Max', 'max', 'Max@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Khushi Sharma', 'Gracy', 'gracy', 'gracydavis@tagoreautoparts.com', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Specialist', NULL, 6, 2),
('Ayush Chauhan', 'Jack', 'jack', 'Jack@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Gaurav Kumar', 'Ethan', 'ethan', 'Ethan@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 1),
('Beena Rawat', 'Bella', 'bella', 'bellawhite@tagoreautoparts.com', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Specialist', NULL, 6, 2),
('Rashi Thapa', 'Rashi', 'rashi', 'Rashi.hr@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'HR Manager', NULL, 5, 2),
('Rahul Gusain', 'Eddie', 'eddie', 'Eddie@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Team Lead', NULL, 4, 1),
('Avyukt Singhal', 'Andy', 'andy', 'Andy@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Anshul Nautiyal', 'Anshul', 'anshul', 'Anshul.qa@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Quality Associate', NULL, 7, 2),
('Hitharth Gulati', 'Mike', 'mike', 'Mike@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Krish Sharma', 'Krish', 'krish', 'Krish@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Jitender Panwar', 'Jeff', 'jeff', 'jeff@tagoreautoparts.com', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Specialist', NULL, 6, 1),
('Ajay Raj Ghatola', 'Aiden', 'aiden', 'aiden@tagoreautoparts.com', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Associate', NULL, 6, 2),
('Tanishq Gupta', 'Tim', 'tim', 'timjones@tagoreautoparts.com', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Associate', NULL, 6, 2),
('Soniya Negi', 'Sandy', 'sandy', 'sandy.miller@tagoreautoparts.com', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Associate', NULL, 6, 2),
('Suhani Chaudhary', 'Suhani', 'suhani', 'Suhani@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Quality Associate', NULL, 7, 2),
('Tanya Tamer', 'Taylor', 'taylor', 'taylor.addams@tagoreautoparts.com', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Associate', NULL, 6, 2),
('Ankur Sharma', 'Jaiden', 'jaiden', 'Jaiden@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Sumit Bhandari', 'Sumit', 'sumit', 'Sumit@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Quality Associate', NULL, 7, 2),
('Nainika Chauhan', 'Nainika', 'nainika', 'Nainika.hr@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'HR', NULL, 5, 1),
('Sakshi Singh Bhandari', 'June', 'june', 'June@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Avishar Negi', 'Steve', 'steve', 'steve.murphy@tagoreautoparts.com', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Associate', NULL, 6, 2),
('Vaishnavi Dabral', 'Alma', 'alma', 'Alma@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 1),
('Ashish Bisht', 'Steven', 'steven', 'Steven@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 1),
('Ankit Chauhan', 'Ed Roger', 'ed_roger', 'ed.roger@tagoreautoparts.com', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Associate', NULL, 6, 2),
('Anshika Kodari', 'Amanda', 'amanda', 'Amanda@jdfusion.in', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 1),
('Vivek Rana', 'Eric', 'eric', 'eric.richards@tagoreautoparts.com', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Associate', NULL, 6, 2),
('Nidhi Bhattacharya', 'Nancy', 'nancy', 'nancy.smith@tagoreautoparts.com', NULL, '1', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Backend Associate', NULL, 6, 2),
('Shikhin Vats', 'Zayne', 'zayne', 'Zayne@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 1),
('Thabani Ayanda Mkomo', 'Sammy', 'sammy', 'Sammy@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Shubham Thapa', 'Noah', 'noah', 'Noah@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Kshitej Mandhwal', 'Ken Miles', 'ken_miles', 'Ken@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 1),
('Aryan Batra', 'Tom', 'tom', 'tom@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 2),
('Vishal Dogra', 'James', 'james', 'James@jdfusion.in', NULL, '0', '960e2519ecd69e6c121c03d8cdc9aeb1880346b9e3be5fd1ffaef045a2f3c09e', 1, NULL, 'Sales Associate', NULL, 8, 1);

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;
