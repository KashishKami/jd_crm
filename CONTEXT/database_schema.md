# Database Schema Specification: JD CRM

This document describes the canonical database schema for the **new** JD CRM TypeScript project. This is a **fresh database** — it is not a direct import of the legacy Hostinger schema.

> [!IMPORTANT]
> **All tables use the InnoDB engine.** The original PHP application used MyISAM for most tables, which is why there were no foreign key constraints — MyISAM physically cannot enforce them. In the new schema every table is InnoDB, and Prisma is configured with `relationMode = "foreignKeys"` so that real `FOREIGN KEY` constraints are created at the database level.
>
> **Legacy tables `prequest`, `ticket`, and `user` (singular) are dropped.** They had no active code paths in the PHP CRM and are not migrated.
>
> **Type mismatches are fixed.** The old schema stored integer IDs as `VARCHAR` columns (e.g. `crm_attendance.agent_id varchar(25)`) which made FK constraints impossible. All FK columns in the new schema are proper `INT`.

---

## 1. Table Summary

| Table | Engine | Primary Key | Auto-Increment | Description |
| :--- | :--- | :--- | :--- | :--- |
| `admin` | **InnoDB** | `id` | Yes | Admin login credentials. |
| `crm_attendance` | **InnoDB** | `att_id` | Yes | Attendance logs for agents. |
| `crm_comments` | **InnoDB** | `comment_id` | Yes | Comment threads and images on orders. |
| `crm_customers` | **InnoDB** | `customer_id` | Yes | Customer personal and shipping details. |
| `crm_customer_cards` | **InnoDB** | `card_id` | Yes | Saved payment card records (sensitive details). |
| `crm_designations` | **InnoDB** | `designation_id` | Yes | Designation/role title dictionary lookup. |
| `crm_gateway` | **InnoDB** | `gateway_id` | Yes | Payment gateways used for billing. |
| `crm_roles` | **InnoDB** | `role_id` | Yes | Modern Roles database (e.g. Super Admin, Agent). |
| `crm_permissions` | **InnoDB** | `permission_id` | Yes | Fine-grained descriptive permissions library. |
| `crm_role_permissions` | **InnoDB** | Composite | No | Junction table linking Roles to Permissions (Many-to-Many). |
| `crm_teams` | **InnoDB** | `team_id` | Yes | Teams database (e.g. IT Park, DB Park, Alex). |
| `crm_orders` | **InnoDB** | `crm_order_id` | Yes | Core table housing sales details, status, and pricing. |
| `crm_vendors` | **InnoDB** | `vendor_id` | Yes | Third-party vendor directory. |
| ~~`prequest`~~ | — | — | — | ❌ **Dropped** — no active code paths. |
| ~~`ticket`~~ | — | — | — | ❌ **Dropped** — no active code paths. |
| ~~`user`~~ | — | — | — | ❌ **Dropped** — legacy duplicate of `users`. |
| `usercheck` | **InnoDB** | `id` | Yes | Login audit trail (kept for security logging). |
| `users` | **InnoDB** | `uid` | Yes | Main agents and staff database. |
| `users_profile` | **InnoDB** | `profile_id` | Yes | Extended personal, bank, and emergency profile details. |
| `users_profile_academic` | **InnoDB** | `academic_id` | Yes | Agent academic qualification records (one-to-many). |
| `users_profile_professional` | **InnoDB** | `professional_id` | Yes | Agent professional work history (one-to-many). |

---

## 2. Table Schemas

### admin
*   **Engine:** InnoDB
*   **Collation:** `utf8mb4_unicode_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `name` | `varchar(255)` | NO | `""` | Username |
| `password` | `varchar(255)` | NO | `""` | SHA-256 password hash |

### crm_attendance
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `att_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `agent_id` | `varchar(25)` | NO | *None* | Logical FK to `users.uid` (as string) |
| `agent_name` | `varchar(55)` | NO | *None* | Agent name snapshot at marking time |
| `attendance_status_id` | `varchar(25)` | NO | *None* | Status lookup code (`1` to `7`) |
| `attendance_status_name` | `varchar(55)` | YES | `NULL` | Status name snapshot (e.g. `Present`) |
| `attendance_date` | `date` | NO | *None* | Date of log |
| `attendance_marked_name` | `varchar(55)` | NO | *None* | Nickname of agent who marked this attendance |
| `created_at` | `datetime` | NO | `current_timestamp()` | Automatically set creation date |
| `updated_at` | `datetime` | YES | `NULL` | Modification date |

### crm_comments
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `comment_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `customer_id` | `int(11)` | NO | *None* | Logical FK to `crm_customers.customer_id` |
| `order_id` | `int(11)` | NO | *None* | **Warning:** The application matches this against `crm_orders.order_customer_id` (the client identifier), not `crm_order_id`. |
| `comment` | `text` | NO | *None* | Rich comment text details |
| `comment_image` | `varchar(255)` | YES | `NULL` | File upload path for attached screenshot/receipt |
| `comment_agent_id` | `int(11)` | NO | *None* | Logical FK to `users.uid` |
| `comment_agent_name` | `varchar(55)` | NO | *None* | Agent nickname snapshot |
| `comment_created_date` | `datetime` | YES | `NULL` | Comment creation datetime |
| `comment_updated_date` | `datetime` | YES | `NULL` | Comment update datetime |

### crm_customers
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `customer_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `first_name` | `varchar(255)` | NO | *None* | First Name |
| `last_name` | `varchar(255)` | NO | *None* | Last Name |
| `customer_phone` | `varchar(25)` | YES | `NULL` | Phone number (guarded by permission `201`) |
| `customer_email` | `varchar(255)` | NO | *None* | Email address (guarded by permission `202`) |
| `customer_billing_address` | `varchar(255)` | YES | `NULL` | Billing Address |
| `customer_shipping_address` | `varchar(255)` | YES | `NULL` | Shipping Address |
| `date_created` | `datetime` | YES | `NULL` | Date created |
| `date_updated` | `datetime` | YES | `NULL` | Date updated |

### crm_customer_cards
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `card_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `card_customer_id` | `varchar(15)` | NO | *None* | Logical FK to `crm_customers.customer_id` |
| `customer_name_oncard` | `varchar(155)` | NO | *None* | Cardholder name |
| `customer_card_number` | `varchar(25)` | NO | *None* | Card number (sensitive, guarded by `204`) |
| `customer_card_exp_date` | `varchar(15)` | NO | *None* | Expiry date (MM/YY) |
| `customer_card_cvv` | `varchar(5)` | YES | `NULL` | CVV security code (sensitive) |
| `customer_card_copy_status`| `varchar(20)` | YES | `NULL` | Card copy audit verification flag |
| `customer_card_photo_status`| `varchar(20)` | YES | `NULL` | Card photo audit verification flag |
| `customer_card_created_at` | `datetime` | YES | `NULL` | Created date |
| `customer_card_updated` | `datetime` | YES | `NULL` | Updated date |

### crm_designations
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `designation_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `designation_name` | `varchar(155)` | NO | *None* | Title of designation (e.g. Sales Executive) |
| `designation_created` | `datetime` | NO | *None* | Creation date |
| `designation_updated` | `datetime` | YES | `NULL` | Last modified date |

### crm_gateway
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `gateway_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `gateway_name` | `varchar(55)` | NO | *None* | Gateway Name (e.g. Stripe, Authorize.net) |
| `gateway_status` | `int(11)` | NO | `1` | `1` = Active, `0` = Inactive |
| `gateway_created_at` | `datetime` | NO | *None* | Created datetime |
| `gateway_updated_at` | `datetime` | NO | *None* | Last modified datetime |

### crm_teams
*   **Engine:** InnoDB
*   **Collation:** `utf8mb4_unicode_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `team_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `team_name` | `varchar(155)` | NO | *None* | Team Name (e.g. IT Park, DB Park, Alex) |
| `team_created` | `datetime` | NO | `current_timestamp()` | Created datetime |
| `team_updated` | `datetime` | YES | `NULL` | Last modified datetime |

### crm_roles
*   **Engine:** InnoDB
*   **Collation:** `utf8mb4_unicode_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `role_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `role_name` | `varchar(100)` | NO | *None* | Unique Role Name (e.g. Super Administrator) |
| `role_created` | `datetime` | NO | `current_timestamp()` | Created datetime |
| `role_updated` | `datetime` | YES | `NULL` | Last modified datetime |

### crm_permissions
*   **Engine:** InnoDB
*   **Collation:** `utf8mb4_unicode_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `permission_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `permission_name` | `varchar(100)` | NO | *None* | Unique descriptive action name (e.g. `vendors:view`) |
| `permission_description` | `varchar(255)` | YES | `NULL` | Explanatory description of permission scope |

#### Predefined System Permissions
The following standard permissions are seeded in the system:
- `super-admin`: Administrative superuser bypass.
- `vendors:view`: View vendors directory and search vendors.
- `agents:view`: View and manage agents/staff list.
- `gateways:view`: View and manage payment gateways.
- `orders:view`: View orders, transactions, and status boards.

### crm_role_permissions
*   **Engine:** InnoDB
*   **Collation:** `utf8mb4_unicode_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `role_id` (PK, FK) | `int(11)` | NO | *None* | Foreign Key referencing `crm_roles.role_id` |
| `permission_id` (PK, FK) | `int(11)` | NO | *None* | Foreign Key referencing `crm_permissions.permission_id` |

### crm_orders
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `crm_order_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `order_customer_id` | `varchar(55)` | NO | *None* | Logical FK to `crm_customers.customer_id` (stored as string) |
| `order_year` | `varchar(255)` | YES | `NULL` | Vehicle Year |
| `order_make_model` | `varchar(255)` | YES | `NULL` | Vehicle Make & Model |
| `order_part` | `varchar(255)` | YES | `NULL` | Part requested |
| `order_part_size` | `varchar(255)` | YES | `NULL` | Dimensions or specifications |
| `order_quoted_miles` | `varchar(255)` | YES | `NULL` | Quoted shipping mileage |
| `order_given_miles` | `varchar(255)` | YES | `NULL` | Actual vendor-specified mileage |
| `order_vin` | `varchar(255)` | YES | `NULL` | Vehicle Identification Number |
| `order_total_pitched` | `varchar(25)` | YES | `NULL` | Selling price pitched to customer |
| `order_vendor_price` | `varchar(25)` | YES | `NULL` | Buying price quoted by vendor |
| `order_vendor_id` | `varchar(111)` | YES | `NULL` | Logical FK to `crm_vendors.vendor_id` (as string) |
| `order_vendor_name` | `varchar(255)` | YES | `NULL` | Snapshot of vendor name |
| `order_shipping_type` | `varchar(255)` | YES | `NULL` | Shipping mode (e.g. Ground, Air) |
| `order_markup` | `varchar(255)` | YES | `NULL` | Calculated margin: Pitch - Vendor Price |
| `order_payment_gateway` | `varchar(55)` | YES | `NULL` | Logical FK to `crm_gateway.gateway_id` (as string) |
| `order_sales_agent_id` | `int(11)` | YES | `NULL` | Logical FK to `users.uid` |
| `order_sales_agent_name` | `varchar(55)` | YES | `NULL` | Snapshot of sales agent name/nickname |
| `order_verifier_id` | `int(11)` | YES | `NULL` | Logical FK to `users.uid` of checker |
| `order_verifier_name` | `varchar(55)` | YES | `NULL` | Snapshot of verifier name/nickname |
| `order_documentation` | `varchar(255)` | YES | `NULL` | Document upload links / status |
| `order_booked` | `varchar(255)` | YES | `NULL` | Booking reference / metadata |
| `order_amount_charged` | `varchar(25)` | YES | `NULL` | Amount successfully collected |
| `order_tracking_number` | `varchar(55)` | YES | `NULL` | Carrier tracking code |
| `order_delivery_status` | `varchar(55)` | YES | `NULL` | Delivery stage status |
| `order_qualified_incentive_status`| `varchar(55)`| YES | `NULL` | Incentive approval status for agents |
| `order_qualified_incentive_amount`| `varchar(55)`| YES | `NULL` | Commission payout value |
| `order_status` | `varchar(55)` | YES | `NULL` | Vendor invoice / status flag |
| `sale_status` | `varchar(55)` | YES | `NULL` | Status code: `1` (Sold) through `8` (Chargeback) |
| `order_current_status` | `varchar(25)` | YES | `NULL` | Pipeline stage queue name |
| `order_current_status_update_date`| `datetime`| YES | `NULL` | Date workflow stage changed |
| `order_date` | `varchar(25)` | YES | `NULL` | Sale date (as string) |
| `order_vendor_feedback` | `varchar(25)` | NO | `'Positive'`| Feedback rating on vendor |
| `order_client_feedback` | `varchar(25)` | NO | `'Positive'`| Feedback rating from customer |
| `order_resolution` | `varchar(25)` | NO | `'Resolved'`| Resolution status for dispute queue |
| `order_created_date` | `datetime` | YES | `NULL` | Creation date |
| `order_updated_date` | `datetime` | YES | `NULL` | Last modified date |

### crm_vendors
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `vendor_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `vendor_name` | `varchar(255)` | NO | *None* | Company Name |
| `vendor_phone` | `varchar(15)` | NO | *None* | Contact number |
| `vendor_fax` | `varchar(20)` | YES | `NULL` | Fax |
| `vendor_email` | `varchar(255)` | YES | `NULL` | Email Address |
| `vendor_contact_person`| `varchar(255)`| NO | *None* | Primary Point of Contact |
| `vendor_remark` | `text` | YES | `NULL` | Miscellaneous remarks / performance history |
| `vendor_status` | `int(11)` | NO | `1` | `1` = Active, `0` = Blacklisted |
| `created_at` | `datetime` | YES | `NULL` | Created date |
| `updated_at` | `datetime` | YES | `NULL` | Last modified date |

### prequest
*   **Engine:** InnoDB
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `name` | `varchar(255)` | YES | `NULL` | Requester Name |
| `email` | `varchar(255)` | YES | `NULL` | Requester Email |
| `contactno` | `varchar(11)` | YES | `NULL` | Requester Phone |
| `company` | `varchar(255)` | YES | `NULL` | Requester Company |
| `services` | `text` | YES | `NULL` | Services requested |
| `others` | `varchar(255)` | YES | `NULL` | Other requirements |
| `query` | `longtext` | YES | `NULL` | Question / Message body |
| `status` | `tinyint(1)` | NO | `0` | Status flag |
| `posting_date` | `date` | YES | `NULL` | Request date |
| `remark` | `longtext` | YES | `NULL` | Internal admin notes |

### ticket
*   **Engine:** InnoDB
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `ticket_id` | `varchar(11)` | YES | `NULL` | Ticket ticket reference ID |
| `email_id` | `varchar(300)` | YES | `NULL` | Contact email |
| `subject` | `varchar(300)` | YES | `NULL` | Ticket subject |
| `task_type` | `varchar(300)` | YES | `NULL` | Classification type |
| `prioprity` | `varchar(300)` | YES | `NULL` | **Typo column** (Priority) |
| `ticket` | `longtext` | YES | `NULL` | Detailed ticket content |
| `attachment` | `varchar(300)` | YES | `NULL` | File path of attachment |
| `status` | `varchar(300)` | YES | `NULL` | Status (e.g. Open, Closed) |
| `admin_remark` | `longtext` | YES | `NULL` | Staff notes |
| `posting_date` | `date` | YES | `NULL` | Open date |
| `admin_remark_date`| `timestamp` | YES | `current_timestamp()` | Last modified stamp |

### user
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `name` | `varchar(255)` | YES | `NULL` | Name |
| `email` | `varchar(255)` | YES | `NULL` | Email |
| `alt_email` | `varchar(255)` | YES | `NULL` | Alternate Email |
| `password` | `varchar(255)` | YES | `NULL` | Password |
| `mobile` | `varchar(255)` | YES | `NULL` | Mobile number |
| `gender` | `varchar(255)` | YES | `NULL` | Gender |
| `address` | `varchar(500)` | YES | `NULL` | Address |
| `status` | `int(11)` | YES | `NULL` | Status |
| `posting_date` | `timestamp` | YES | `current_timestamp()` | Created timestamp |

### usercheck
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `logindate` | `varchar(255)` | NO | `""` | Date string |
| `logintime` | `varchar(255)` | NO | `""` | Time string |
| `user_id` | `int(11)` | YES | `NULL` | Logical FK to `users.uid` |
| `username` | `varchar(255)` | YES | `NULL` | Login username used |
| `email` | `varchar(255)` | NO | `""` | Login email address used |
| `ip` | `varbinary(16)`| YES | `NULL` | IP address bytes |
| `mac` | `varbinary(16)`| YES | `NULL` | MAC address bytes |
| `city` | `varchar(255)` | YES | `NULL` | Logged city |
| `country` | `varchar(255)` | YES | `NULL` | Logged country |

### users
*   **Engine:** InnoDB
*   **Collation:** `utf8mb3_general_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `uid` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `name` | `varchar(256)` | NO | *None* | Full Name |
| `nickname` | `varchar(111)` | YES | `NULL` | Display Name / Nickname (Used for logs/comments) |
| `username` | `varchar(55)` | NO | *None* | Login credential username |
| `email` | `varchar(50)` | YES | `NULL` | Staff corporate email |
| `mobile` | `varchar(15)` | YES | `NULL` | Primary phone |
| `gender` | `enum('0','1')` | YES | `'0'` | `'0'` = Male, `'1'` = Female |
| `password` | `varchar(255)` | YES | `NULL` | SHA-256 password hash |
| `status` | `int(11)` | YES | `1` | `1` = Active, `0` = Inactive |
| `age` | `int(11)` | YES | `NULL` | Age |
| `designation` | `varchar(255)` | YES | `NULL` | Job designation string (mapped in PHP) |
| `date_of_joining` | `date` | YES | `NULL` | Join Date |
| `agent_id` | `varchar(25)` | YES | `NULL` | Identifier string (e.g. AG101) |
| `profile_image` | `varchar(255)` | YES | `NULL` | File path to photo profile |
| `role_id` | `int(11)` | NO | *None* | Relational foreign key to `crm_roles.role_id` (RBAC) |
| `agent_target` | `varchar(11)` | YES | `NULL` | Target quota value |
| `agent_salary` | `varchar(11)` | YES | `NULL` | Current monthly base pay |
| `created` | `timestamp` | YES | `current_timestamp()` | Creation datetime |
| `team_id` | `int(11)` | NO | *None* | Logical FK to `crm_teams.team_id` |

### users_profile
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `profile_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `profile_user_id` | `varchar(25)` | NO | *None* | Logical FK to `users.uid` (stored as string) |
| `profile_local_address` | `varchar(255)` | YES | `NULL` | Current Residence Address |
| `profile_permanent_address`| `varchar(255)`| YES | `NULL` | Permanent Home Address |
| `profile_alternate_phone` | `varchar(15)` | YES | `NULL` | Alternate contact |
| `profile_dob` | `date` | YES | `NULL` | Date of Birth |
| `profile_pan` | `varchar(15)` | YES | `NULL` | Tax Identification Number (PAN) |
| `profile_aadhar` | `varchar(20)` | YES | `NULL` | National ID (Aadhar Number) |
| `profile_bank_account` | `varchar(55)` | YES | `NULL` | Bank Account Number |
| `profile_bank_name` | `varchar(255)` | YES | `NULL` | Bank name |
| `profile_bank_address` | `varchar(255)` | YES | `NULL` | Bank branch address |
| `profile_bank_branch` | `varchar(255)` | YES | `NULL` | Bank branch location |
| `profile_bank_ifsc` | `varchar(255)` | YES | `NULL` | Routing/IFSC Code |
| `profile_emergency_contact_name`| `varchar(155)`| YES | `NULL` | Emergency contact name |
| `profile_emergency_contact_relation`| `varchar(55)`| YES | `NULL`| Relation to emergency contact |
| `profile_emergency_contact_address`| `varchar(255)`| YES | `NULL`| Emergency contact home address |
| `profile_emergency_contact_number`| `varchar(20)` | YES | `NULL`| Emergency phone 1 |
| `profile_emergency_contact_number2`| `varchar(20)` | YES | `NULL`| Emergency phone 2 |
| `profile_created_at` | `datetime` | YES | `NULL` | Creation date |
| `profile_updated_at` | `timestamp` | YES | `current_timestamp()` | Update timestamp |

### users_profile_academic
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `academic_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `academic_user_id` | `varchar(25)` | NO | *None* | Logical FK to `users.uid` (stored as string) |
| `academic_standard` | `varchar(15)` | YES | `NULL` | Level of study (High School, Graduate, etc.) |
| `academic_year_from` | `varchar(15)` | YES | `NULL` | Start year |
| `academic_year_to` | `varchar(15)` | YES | `NULL` | End year |
| `academic_specialization`| `varchar(255)`| YES | `NULL` | Major field of study |
| `academic_institute` | `varchar(255)` | YES | `NULL` | School/University name |
| `academic_created` | `date` | YES | `NULL` | Creation date |

### users_profile_professional
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `professional_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `professional_user_id` | `varchar(25)` | NO | *None* | Logical FK to `users.uid` (stored as string) |
| `professional_organization`| `varchar(155)`| YES | `NULL` | Past Employer Company |
| `professional_year_from` | `varchar(15)` | YES | `NULL` | Work start year |
| `professional_year_to` | `varchar(15)` | YES | `NULL` | Work end year |
| `professional_designation` | `varchar(155)`| YES | `NULL` | Mapped job role title |
| `professional_salary` | `varchar(20)` | YES | `NULL` | Compensation received |
| `professional_experiance` | `varchar(155)`| YES | `NULL` | Description of experience |
| `professional_created_at`| `datetime` | YES | `current_timestamp()` | Creation date |

---

## 3. Prisma Schema

This is the authoritative `schema.prisma` for the new database. Key principles:
*   `relationMode = "foreignKeys"` — Prisma creates actual `FOREIGN KEY` constraints in MySQL.
*   All FK columns are **`Int`** — no more `varchar` ID fields. This is the single biggest correctness fix from the legacy schema.
*   `@@map` / `@map` directives preserve the original table and column names so Prisma migrations produce identical SQL column names as the legacy app, easing any data migration scripts.
*   The `crm_comments.orderId` now correctly references `crm_orders.crm_order_id` (the actual order PK), fixing the PHP bug where it was joined on `order_customer_id`.
*   Legacy tables `prequest`, `ticket`, and `user` are **not included** — they will not be created.

```prisma
datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "foreignKeys" // Real FOREIGN KEY constraints enforced at DB level (InnoDB)
}

generator client {
  provider = "prisma-client-js"
}

model Admin {
  id       Int    @id @default(autoincrement())
  name     String @default("") @db.VarChar(255)
  password String @default("") @db.VarChar(255)

  @@map("admin")
}

model Users {
  uid             Int           @id @default(autoincrement())
  name            String        @db.VarChar(256)
  nickname        String?       @db.VarChar(111)
  username        String        @db.VarChar(55)
  email           String?       @db.VarChar(50)
  mobile          String?       @db.VarChar(15)
  gender          String        @default("0") @db.VarChar(1) // Mapped from ENUM('0', '1') for compatibility
  password        String?       @db.VarChar(255)
  status          Int?          @default(1)
  age             Int?
  designation     String?       @db.VarChar(255)
  dateOfJoining   DateTime?     @map("date_of_joining") @db.Date
  agentId         String?       @map("agent_id") @db.VarChar(25)
  profileImage    String?       @map("profile_image") @db.VarChar(255)
  agentTarget     String?       @map("agent_target") @db.VarChar(11)
  agentSalary     String?       @map("agent_salary") @db.VarChar(11)
  created         DateTime?     @default(now()) @db.Timestamp(0)
  teamId          Int           @map("team_id")
  roleId          Int           @map("role_id")

  // Relationships
  team            CrmTeams      @relation(fields: [teamId], references: [teamId], onDelete: Restrict)
  role            CrmRoles      @relation(fields: [roleId], references: [roleId], onDelete: Restrict)
  profile         UsersProfile?
  attendance      CrmAttendance[]
  salesOrders     CrmOrders[]          @relation("SalesAgent")
  verifiedOrders  CrmOrders[]          @relation("Verifier")
  academicRecord  UsersProfileAcademic[]
  professionalRecord UsersProfileProfessional[]
  comments        CrmComments[]
  userchecks      Usercheck[]

  @@map("users")
}

model CrmRoles {
  roleId      Int                 @id @default(autoincrement()) @map("role_id")
  roleName    String              @unique @map("role_name") @db.VarChar(100)
  roleCreated DateTime            @default(now()) @map("role_created") @db.DateTime(0)
  roleUpdated DateTime?           @map("role_updated") @db.DateTime(0)
  users       Users[]
  permissions CrmRolePermissions[]

  @@map("crm_roles")
}

model CrmPermissions {
  permissionId          Int                 @id @default(autoincrement()) @map("permission_id")
  permissionName        String              @unique @map("permission_name") @db.VarChar(100)
  permissionDescription String?             @map("permission_description") @db.VarChar(255)
  roles                 CrmRolePermissions[]

  @@map("crm_permissions")
}

model CrmRolePermissions {
  roleId       Int            @map("role_id")
  permissionId Int            @map("permission_id")
  role         CrmRoles       @relation(fields: [roleId], references: [roleId], onDelete: Cascade)
  permission   CrmPermissions @relation(fields: [permissionId], references: [permissionId], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("crm_role_permissions")
}

model UsersProfile {
  profileId                       Int       @id @default(autoincrement()) @map("profile_id")
  // FK is now a proper Int — no more varchar(25) mismatch
  profileUserId                   Int       @unique @map("profile_user_id")
  profileLocalAddress             String?   @map("profile_local_address") @db.VarChar(255)
  profilePermanentAddress         String?   @map("profile_permanent_address") @db.VarChar(255)
  profileAlternatePhone           String?   @map("profile_alternate_phone") @db.VarChar(15)
  profileDob                      DateTime? @map("profile_dob") @db.Date
  profilePan                      String?   @map("profile_pan") @db.VarChar(15)
  profileAadhar                   String?   @map("profile_aadhar") @db.VarChar(20)
  profileBankAccount              String?   @map("profile_bank_account") @db.VarChar(55)
  profileBankName                 String?   @map("profile_bank_name") @db.VarChar(255)
  profileBankAddress              String?   @map("profile_bank_address") @db.VarChar(255)
  profileBankBranch               String?   @map("profile_bank_branch") @db.VarChar(255)
  profileBankIfsc                 String?   @map("profile_bank_ifsc") @db.VarChar(255)
  profileEmergencyContactName     String?   @map("profile_emergency_contact_name") @db.VarChar(155)
  profileEmergencyContactRelation String?   @map("profile_emergency_contact_relation") @db.VarChar(55)
  profileEmergencyContactAddress  String?   @map("profile_emergency_contact_address") @db.VarChar(255)
  profileEmergencyContactNumber   String?   @map("profile_emergency_contact_number") @db.VarChar(20)
  profileEmergencyContactNumber2  String?   @map("profile_emergency_contact_number2") @db.VarChar(20)
  profileCreatedAt                DateTime? @map("profile_created_at") @db.DateTime(0)
  profileUpdatedAt                DateTime  @default(now()) @updatedAt @map("profile_updated_at") @db.Timestamp(0)

  user                            Users     @relation(fields: [profileUserId], references: [uid], onDelete: Cascade)

  @@map("users_profile")
}

model UsersProfileAcademic {
  academicId             Int       @id @default(autoincrement()) @map("academic_id")
  // FK is now a proper Int — no more varchar(25) mismatch
  academicUserId         Int       @map("academic_user_id")
  academicStandard       String?   @map("academic_standard") @db.VarChar(15)
  academicYearFrom       String?   @map("academic_year_from") @db.VarChar(15)
  academicYearTo         String?   @map("academic_year_to") @db.VarChar(15)
  academicSpecialization String?   @map("academic_specialization") @db.VarChar(255)
  academicInstitute      String?   @map("academic_institute") @db.VarChar(255)
  academicCreated        DateTime? @map("academic_created") @db.Date

  user                   Users     @relation(fields: [academicUserId], references: [uid], onDelete: Cascade)

  @@index([academicUserId])
  @@map("users_profile_academic")
}

model UsersProfileProfessional {
  professionalId           Int       @id @default(autoincrement()) @map("professional_id")
  // FK is now a proper Int — no more varchar(25) mismatch
  professionalUserId       Int       @map("professional_user_id")
  professionalOrganization String?   @map("professional_organization") @db.VarChar(155)
  professionalYearFrom     String?   @map("professional_year_from") @db.VarChar(15)
  professionalYearTo       String?   @map("professional_year_to") @db.VarChar(15)
  professionalDesignation  String?   @map("professional_designation") @db.VarChar(155)
  professionalSalary       String?   @map("professional_salary") @db.VarChar(20)
  professionalExperiance   String?   @map("professional_experiance") @db.VarChar(155)
  professionalCreatedAt    DateTime  @default(now()) @map("professional_created_at") @db.DateTime(0)

  user                     Users     @relation(fields: [professionalUserId], references: [uid], onDelete: Cascade)

  @@index([professionalUserId])
  @@map("users_profile_professional")
}

model CrmDesignations {
  designationId      Int       @id @default(autoincrement()) @map("designation_id")
  designationName    String    @map("designation_name") @db.VarChar(155)
  designationCreated DateTime  @map("designation_created") @db.DateTime(0)
  designationUpdated DateTime? @map("designation_updated") @db.DateTime(0)

  @@map("crm_designations")
}

model CrmAttendance {
  attId                Int       @id @default(autoincrement()) @map("att_id")
  // FK is now a proper Int — no more varchar(25) mismatch
  agentId              Int       @map("agent_id")
  agentName            String    @map("agent_name") @db.VarChar(55)
  attendanceStatusId   Int       @map("attendance_status_id") // 1=Present, 2=Absent, 3=ULWOP, 4=LWOP, 5=PL, 6=NCNS, 7=HalfDay
  attendanceStatusName String?   @map("attendance_status_name") @db.VarChar(55)
  attendanceDate       DateTime  @map("attendance_date") @db.Date
  attendanceMarkedName String    @map("attendance_marked_name") @db.VarChar(55)
  createdAt            DateTime  @default(now()) @map("created_at") @db.DateTime(0)
  updatedAt            DateTime? @map("updated_at") @db.DateTime(0)

  agent                Users     @relation(fields: [agentId], references: [uid], onDelete: Restrict)

  @@index([agentId])
  @@index([attendanceDate])
  @@map("crm_attendance")
}

model CrmGateway {
  gatewayId        Int         @id @default(autoincrement()) @map("gateway_id")
  gatewayName      String      @map("gateway_name") @db.VarChar(55)
  gatewayStatus    Int         @default(1) @map("gateway_status")
  gatewayCreatedAt DateTime    @map("gateway_created_at") @db.DateTime(0)
  gatewayUpdatedAt DateTime    @map("gateway_updated_at") @db.DateTime(0)
  orders           CrmOrders[]

  @@map("crm_gateway")
}

model CrmVendors {
  vendorId            Int         @id @default(autoincrement()) @map("vendor_id")
  vendorName          String      @map("vendor_name") @db.VarChar(255)
  vendorPhone         String      @map("vendor_phone") @db.VarChar(15)
  vendorFax           String?     @map("vendor_fax") @db.VarChar(20)
  vendorEmail         String?     @map("vendor_email") @db.VarChar(255)
  vendorContactPerson String      @map("vendor_contact_person") @db.VarChar(255)
  vendorRemark        String?     @map("vendor_remark") @db.Text
  vendorStatus        Int         @default(1) @map("vendor_status")
  createdAt           DateTime?   @map("created_at") @db.DateTime(0)
  updatedAt           DateTime?   @map("updated_at") @db.DateTime(0)
  orders              CrmOrders[]

  @@map("crm_vendors")
}

model CrmCustomers {
  customerId               Int                 @id @default(autoincrement()) @map("customer_id")
  firstName                String              @map("first_name") @db.VarChar(255)
  lastName                 String              @map("last_name") @db.VarChar(255)
  customerPhone            String?             @map("customer_phone") @db.VarChar(25)
  customerEmail            String              @map("customer_email") @db.VarChar(255)
  customerBillingAddress   String?             @map("customer_billing_address") @db.VarChar(255)
  customerShippingAddress  String?             @map("customer_shipping_address") @db.VarChar(255)
  dateCreated              DateTime?           @map("date_created") @db.DateTime(0)
  dateUpdated              DateTime?           @map("date_updated") @db.DateTime(0)
  
  cards                    CrmCustomerCards[]
  orders                   CrmOrders[]
  comments                 CrmComments[]

  @@map("crm_customers")
}

model CrmCustomerCards {
  cardId                  Int          @id @default(autoincrement()) @map("card_id")
  // FK is now a proper Int — no more varchar(15) mismatch
  cardCustomerId          Int          @map("card_customer_id")
  customerNameOncard      String       @map("customer_name_oncard") @db.VarChar(155)
  customerCardNumber      String       @map("customer_card_number") @db.VarChar(25)
  customerCardExpDate     String       @map("customer_card_exp_date") @db.VarChar(15)
  customerCardCvv         String?      @map("customer_card_cvv") @db.VarChar(5)
  customerCardCopyStatus  String?      @map("customer_card_copy_status") @db.VarChar(20)
  customerCardPhotoStatus String?      @map("customer_card_photo_status") @db.VarChar(20)
  customerCardCreatedAt   DateTime?    @map("customer_card_created_at") @db.DateTime(0)
  customerCardUpdated     DateTime?    @map("customer_card_updated") @db.DateTime(0)

  customer                CrmCustomers @relation(fields: [cardCustomerId], references: [customerId], onDelete: Cascade)

  @@index([cardCustomerId])
  @@map("crm_customer_cards")
}

model CrmOrders {
  crmOrderId                    Int          @id @default(autoincrement()) @map("crm_order_id")
  // FK is now a proper Int — no more varchar(55) mismatch
  orderCustomerId               Int          @map("order_customer_id")
  orderYear                     String?      @map("order_year") @db.VarChar(255)
  orderMakeModel                String?      @map("order_make_model") @db.VarChar(255)
  orderPart                     String?      @map("order_part") @db.VarChar(255)
  orderPartSize                 String?      @map("order_part_size") @db.VarChar(255)
  orderQuotedMiles              String?      @map("order_quoted_miles") @db.VarChar(255)
  orderGivenMiles               String?      @map("order_given_miles") @db.VarChar(255)
  orderVin                      String?      @map("order_vin") @db.VarChar(255)
  orderTotalPitched             String?      @map("order_total_pitched") @db.VarChar(25)
  orderVendorPrice              String?      @map("order_vendor_price") @db.VarChar(25)
  // FK is now a proper Int — no more varchar(111) mismatch
  orderVendorId                 Int?         @map("order_vendor_id")
  orderVendorName               String?      @map("order_vendor_name") @db.VarChar(255)
  orderShippingType             String?      @map("order_shipping_type") @db.VarChar(255)
  orderMarkup                   String?      @map("order_markup") @db.VarChar(255)
  // FK is now a proper Int — no more varchar(55) mismatch
  orderPaymentGatewayId         Int?         @map("order_payment_gateway")
  orderSalesAgentId             Int?         @map("order_sales_agent_id")
  orderSalesAgentName           String?      @map("order_sales_agent_name") @db.VarChar(55)
  orderVerifierId               Int?         @map("order_verifier_id")
  orderVerifierName             String?      @map("order_verifier_name") @db.VarChar(55)
  orderDocumentation            String?      @map("order_documentation") @db.VarChar(255)
  orderBooked                   String?      @map("order_booked") @db.VarChar(255)
  orderAmountCharged            String?      @map("order_amount_charged") @db.VarChar(25)
  orderTrackingNumber           String?      @map("order_tracking_number") @db.VarChar(55)
  orderDeliveryStatus           String?      @map("order_delivery_status") @db.VarChar(55)
  orderQualifiedIncentiveStatus String?      @map("order_qualified_incentive_status") @db.VarChar(55)
  orderQualifiedIncentiveAmount String?      @map("order_qualified_incentive_amount") @db.VarChar(55)
  orderStatus                   String?      @map("order_status") @db.VarChar(55)
  saleStatus                    String?      @map("sale_status") @db.VarChar(55)
  orderCurrentStatus            String?      @map("order_current_status") @db.VarChar(55)
  orderCurrentStatusUpdateDate  DateTime?    @map("order_current_status_update_date") @db.DateTime(0)
  orderDate                     DateTime?    @map("order_date") @db.Date // Changed from varchar to proper Date type
  orderVendorFeedback           String       @default("Positive") @map("order_vendor_feedback") @db.VarChar(25)
  orderClientFeedback           String       @default("Positive") @map("order_client_feedback") @db.VarChar(25)
  orderResolution               String       @default("Resolved") @map("order_resolution") @db.VarChar(25)
  orderCreatedDate              DateTime     @default(now()) @map("order_created_date") @db.DateTime(0)
  orderUpdatedDate              DateTime     @updatedAt @map("order_updated_date") @db.DateTime(0)

  // Real FK relationships — enforced at DB level
  customer                      CrmCustomers @relation(fields: [orderCustomerId], references: [customerId], onDelete: Restrict)
  vendor                        CrmVendors?  @relation(fields: [orderVendorId], references: [vendorId], onDelete: SetNull)
  gateway                       CrmGateway?  @relation(fields: [orderPaymentGatewayId], references: [gatewayId], onDelete: SetNull)
  salesAgent                    Users?       @relation("SalesAgent", fields: [orderSalesAgentId], references: [uid], onDelete: SetNull)
  verifier                      Users?       @relation("Verifier", fields: [orderVerifierId], references: [uid], onDelete: SetNull)
  comments                      CrmComments[]

  @@index([orderCustomerId])
  @@index([orderSalesAgentId])
  @@index([orderCurrentStatus])
  @@index([saleStatus])
  @@map("crm_orders")
}

model CrmComments {
  commentId          Int          @id @default(autoincrement()) @map("comment_id")
  customerId         Int          @map("customer_id")
  // BUG FIX: In the old PHP schema, this column was joined on order_customer_id (not the order PK).
  // In the new schema it correctly references crm_orders.crm_order_id.
  orderId            Int          @map("order_id")
  comment            String       @db.Text
  commentImage       String?      @map("comment_image") @db.VarChar(255)
  commentAgentId     Int          @map("comment_agent_id")
  commentAgentName   String       @map("comment_agent_name") @db.VarChar(55)
  commentCreatedDate DateTime     @default(now()) @map("comment_created_date") @db.DateTime(0)
  commentUpdatedDate DateTime?    @map("comment_updated_date") @db.DateTime(0)

  // Real FK relationships — enforced at DB level
  customer           CrmCustomers @relation(fields: [customerId], references: [customerId], onDelete: Cascade)
  order              CrmOrders    @relation(fields: [orderId], references: [crmOrderId], onDelete: Cascade)
  agent              Users        @relation(fields: [commentAgentId], references: [uid], onDelete: Restrict)

  @@index([orderId])
  @@index([customerId])
  @@map("crm_comments")
}

model Usercheck {
  id          Int       @id @default(autoincrement())
  logindate   String    @default("") @db.VarChar(255)
  logintime   String    @default("") @db.VarChar(255)
  userId      Int?      @map("user_id")
  username    String?   @db.VarChar(255)
  email       String    @default("") @db.VarChar(255)
  ip          Bytes?    @db.VarBinary(16)
  mac         Bytes?    @db.VarBinary(16)
  city        String?   @db.VarChar(255)
  country     String?   @db.VarChar(255)
  loggedAt    DateTime  @default(now()) @map("logged_at") @db.Timestamp(0)

  user        Users?    @relation(fields: [userId], references: [uid], onDelete: SetNull)

  @@index([userId])
  @@map("usercheck")
}
```
