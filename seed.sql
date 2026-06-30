USE jd_crm;

-- ============================================================
-- Disable FK checks during seeding to avoid ordering issues
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;

-- Seed default designations
-- INSERT IGNORE prevents errors on re-run (designation_name has no unique index, so use regular insert)
INSERT IGNORE INTO crm_designations (designation_name, designation_created) VALUES
('Super Admin', NOW()),
('Admin', NOW()),
('Manager', NOW()),
('Team Lead', NOW()),
('Agent', NOW());

-- Seed default teams (IT Park, DB Park, Alex)
-- team_id is AUTO_INCREMENT — we force IDs so that users can reliably reference team_id = 1, 2, 3
INSERT INTO crm_teams (team_id, team_name, team_created) VALUES
(1, 'IT Park', NOW()),
(2, 'DB Park', NOW()),
(3, 'Alex', NOW())
ON DUPLICATE KEY UPDATE team_name = VALUES(team_name);

-- Seed default roles
-- role_name has a UNIQUE INDEX — use ON DUPLICATE KEY UPDATE to be idempotent
INSERT INTO crm_roles (role_id, role_name, role_created) VALUES
(1, 'Super Admin', NOW()),
(2, 'Admin', NOW()),
(3, 'Manager', NOW()),
(4, 'Team Lead', NOW()),
(5, 'Agent', NOW())
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Seed default permissions
-- permission_name has a UNIQUE INDEX — use ON DUPLICATE KEY UPDATE to be idempotent
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
-- Gateways
(25, 'gateways:view',                  'View all payment gateways'),
(26, 'gateways:create',                'Add a new gateway'),
(27, 'gateways:report',                'Access gateway report page'),
(28, 'gateways:edit',                  'Edit or deactivate a gateway'),
-- Orders
(29, 'orders:view',                    'View orders, transactions, and status boards'),
(30, 'orders:create',                  'Create a new order'),
(31, 'orders:edit',                    'Edit or delete an existing order'),
(32, 'orders:view-completed',          'View completed orders'),
(33, 'orders:view-pending-booking',    'View pending booking queue'),
(34, 'orders:view-pending-shipment',   'View pending shipment queue'),
(35, 'orders:view-pending-delivery',   'View pending delivery queue'),
(36, 'orders:view-pending-feedback',   'View pending feedback queue'),
(37, 'orders:view-pending-resolutions','View pending resolutions queue'),
-- Customers
(38, 'customers:view',                 'View customer list and detail pages'),
(39, 'customers:create',               'Create a new customer'),
(40, 'customers:edit',                 'Edit customer details'),
(41, 'customers:view-phone',           'View customer phone number in order detail'),
(42, 'customers:view-email',           'View customer email in order detail'),
(43, 'customers:view-vendor-details',  'View linked vendor details in order detail'),
(44, 'customers:view-cards',           'View full unmasked payment card details'),
-- Settings
(45, 'settings:manage-permissions',    'Manage role permissions matrix')
ON DUPLICATE KEY UPDATE permission_description = VALUES(permission_description);

-- Link permissions to Super Admin role (role_id = 1)
-- Super Admin has 'super-admin' bypass + all permissions explicitly for clarity
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),
(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),
(1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27),(1,28),(1,29),(1,30),
(1,31),(1,32),(1,33),(1,34),(1,35),(1,36),(1,37),(1,38),(1,39),(1,40),
(1,41),(1,42),(1,43),(1,44),(1,45);

-- Link permissions to Admin (role_id = 2)
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(2,1),(2,2),(2,3),(2,4),(2,5),(2,6),(2,7),(2,8),(2,9),(2,10),
(2,11),(2,12),(2,13),(2,14),(2,15),(2,16),(2,17),(2,18),(2,19),(2,20),
(2,21),(2,22),(2,23),(2,24),(2,25),(2,26),(2,27),(2,28),(2,29),(2,30),
(2,31),(2,32),(2,33),(2,34),(2,35),(2,36),(2,37),(2,38),(2,39),(2,40),
(2,41),(2,42),(2,43),(2,44),(2,45);

-- Link permissions to Manager (role_id = 3)
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(3,2),(3,3),(3,4),(3,5),(3,6),(3,7),(3,8),(3,9),(3,10),(3,11),
(3,12),(3,13),(3,14),(3,15),(3,16),(3,17),(3,18),(3,21),(3,22),
(3,25),(3,27),(3,29),(3,30),(3,31),(3,32),(3,33),(3,34),(3,35),(3,36),
(3,37),(3,38),(3,39),(3,40),(3,41),(3,42),(3,43);

-- Link permissions to Team Lead (role_id = 4)
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(4,2),(4,3),(4,4),(4,5),(4,6),(4,7),(4,8),(4,9),(4,10),(4,12),
(4,13),(4,15),(4,16),(4,17),(4,18),(4,21),(4,25),(4,27),(4,29),(4,30),
(4,32),(4,33),(4,34),(4,35),(4,36),(4,37),(4,38),(4,39),(4,41),(4,42);

-- Link permissions to Agent (role_id = 5)
INSERT IGNORE INTO crm_role_permissions (role_id, permission_id) VALUES
(5,29),(5,30),(5,38),(5,39),(5,41),(5,42);

-- Seed default Super Admin account (Username: admin, Password: admin123)
-- SHA-256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
-- Belongs to 'IT Park' team (team_id = 1), 'Super Admin' role (role_id = 1)
-- INSERT IGNORE skips if username 'admin' already exists (no UNIQUE on username in schema, but safe)
INSERT IGNORE INTO users (
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
-- INSERT IGNORE skips duplicate rows on re-run
INSERT IGNORE INTO users (
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

-- Seed default mock customer
INSERT INTO crm_customers (customer_id, customer_name, customer_email, customer_phone, customer_billing_address, customer_shipping_address, date_created, date_updated) VALUES
(1, 'Jane Doe', 'jane.doe@example.com', '555-0199', '123 Main St, New York, NY 10001', '123 Main St, New York, NY 10001', NOW(), NOW())
ON DUPLICATE KEY UPDATE customer_name = VALUES(customer_name);

-- Seed default mock order
INSERT INTO crm_orders (
  crm_order_id, order_customer_id, order_make_model, order_part, order_part_size, order_quoted_miles, order_given_miles,
  order_vin, order_total_pitched, order_vendor_price, order_vendor_id, order_vendor_name, order_shipping_type, order_markup,
  order_payment_gateway, order_sales_agent_id, order_sales_agent_name, order_verifier_id, order_verifier_name,
  sale_status, order_current_status, order_current_status_update_date, order_date, order_vendor_feedback, order_client_feedback,
  order_resolution, order_created_date, order_updated_date
) VALUES (
  1, 1, '2026 Jeep Grand Cherokee', 'Transmission', 'V6 4.0L', '120000', '118000',
  '1J4GR48P1LC123456', '3500.00', '2500.00', NULL, NULL, 'Ground', '1000.00',
  NULL, 1, 'Admin', NULL, NULL,
  '1', 'Pending Booking', NOW(), NOW(), 'Positive', 'Positive',
  'Resolved', NOW(), NOW()
)
ON DUPLICATE KEY UPDATE order_make_model = VALUES(order_make_model);

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

