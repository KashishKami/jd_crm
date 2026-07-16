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
| `crm_follow_ups` | **InnoDB** | `follow_up_id` | Yes | Prospect callback tracker with timezone-aware scheduling and notification support. **[Phase 31]** |
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

## 1.5 Entity-Relationship (ER) Diagram

Below is the visual Entity-Relationship diagram for the database schema, detailing primary keys (PK), foreign keys (FK), and relations:

```text
=========================================================================================================
                                      JD CRM DATABASE ER DIAGRAM
                                       (Post-Phase 31 — Current)
=========================================================================================================

  [ UTILITY TABLES ]
  ┌──────────────────────┐      ┌──────────────────────┐
  │        admin         │      │   crm_designations   │
  ├──────────────────────┤      ├──────────────────────┤
  │ id (PK)              │      │ designation_id (PK)  │
  │ name                 │      │ designation_name     │
  │ password             │      │ designation_created  │
  └──────────────────────┘      └──────────────────────┘

  [ RBAC & TEAMS SYSTEM ]
  ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
  │   crm_permissions    │      │ crm_role_permissions │      │      crm_roles       │
  ├──────────────────────┤      ├──────────────────────┤      ├──────────────────────┤
  │ permission_id (PK)   │◄────►│ permission_id (PK,FK)│◄────►│ role_id (PK)         │
  │ permission_name      │      │ role_id (PK, FK)     │      │ role_name            │
  └──────────────────────┘      └──────────────────────┘      └──────────┬───────────┘
                                                                         │ 1
                                                                         │
                                                                         │ N
  ┌──────────────────────┐                                   ┌──────────v───────────┐
  │      crm_teams       │                                   │        users         │
  ├──────────────────────┤                                   ├──────────────────────┤
  │ team_id (PK)         ├──────────────────────────────────►│ uid (PK)             │
  │ team_name            │ 1                               N │ role_id (FK)         │
  └──────────────────────┘                                   │ team_id (FK)         │
                                                             └──────────┬───────────┘
                                                                        │
         ┌───────────────────┬───────────────────┬─────────────────────┼────────────────────┬───────────────────┐
         │ 1                 │ 1                 │ 1                   │ 1                  │ 1                 │ 1
         │                   │                   │                     │                    │                   │
         ▼ 1                 ▼ N                 ▼ N                   ▼ N                  ▼ N                 ▼ N
  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     ┌──────────────┐    ┌──────────────┐    ┌─────────────────────┐
  │users_profile │    │users_profile_│    │users_profile_│     │crm_attendance│    │  usercheck   │    │   crm_follow_ups    │
  │              │    │academic      │    │professional  │     │              │    │              │    │    [Phase 31]       │
  ├──────────────┤    ├──────────────┤    ├──────────────┤     ├──────────────┤    ├──────────────┤    ├─────────────────────┤
  │profile_id    │    │academic_id   │    │professional_ │     │att_id (PK)   │    │id (PK)       │    │follow_up_id (PK)    │
  │   (PK)       │    │   (PK)       │    │  id (PK)     │     │agent_id (FK) │    │user_id (FK)  │    │agent_id (FK)        │
  │profile_user_ │    │academic_user_│    │professional_ │     └──────────────┘    └──────────────┘    │agent_name           │
  │  id (FK, U)  │    │  id (FK)     │    │  user_id (FK)│                                             │customer_name        │
  └──────────────┘    └──────────────┘    └──────────────┘                                             │customer_phone       │
                                                                                                       │customer_state       │
                                                                                                       │customer_country     │
                                                                                                       │customer_timezone    │
                                                                                                       │vehicle_year_make_   │
                                                                                                       │  model              │
                                                                                                       │part_required        │
                                                                                                       │quoted_options (TEXT)│
                                                                                                       │follow_up_date       │
                                                                                                       │follow_up_time       │
                                                                                                       │follow_up_reason     │
                                                                                                       │status               │
                                                                                                       │priority             │
                                                                                                       │notes (TEXT)         │
                                                                                                       │entry_date           │
                                                                                                       │last_contact         │
                                                                                                       │notification_sent_at │
                                                                                                       └─────────────────────┘

  [ CUSTOMERS & ORDERS SYSTEM ]
  ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
  │     crm_gateway      │      │     crm_vendors      │      │        users         │
  ├──────────────────────┤      ├──────────────────────┤      ├──────────────────────┤
  │ gateway_id (PK)      │      │ vendor_id (PK)       │      │ uid (PK)             │
  └──────────┬───────────┘      └──────────┬───────────┘      └──────────┬───────────┘
             │ 1                           │ 1                           │ 1 (Agent/Verifier)
             │                             │                             │
             │ N                           │ N                           │ N
  ┌──────────v─────────────────────────────v─────────────────────────────v────────────────────┐
  │                                        crm_orders                                        │
  ├──────────────────────────────────────────────────────────────────────────────────────────┤
  │ crm_order_id (PK)                                                                        │
  │ order_customer_id (FK) ─────────────────────────────────────────────┐                    │
  │ order_vendor_id (FK, Nullable)                                      │                    │
  │ order_payment_gateway (FK, Nullable)                                │                    │
  │ order_sales_agent_id (FK, Nullable)                                 │                    │
  │ order_verifier_id (FK, Nullable)                                    │                    │
  └──────────┬──────────────────────────────────────────────────────────┼────────────────────┘
             │ 1                                                        │
             │                                                          │
             │ N                                                        │
  ┌──────────v───────────┐                                              │
  │     crm_comments     │                                              │
  ├──────────────────────┤                                              │
  │ comment_id (PK)      │                                              │
  │ customer_id (FK) ────┼──────────────────────────────────────┐       │
  │ order_id (FK)        │                                      │       │
  │ comment_agent_id (FK)├──┐                                   │       │
  └──────────────────────┘  │                                   │       │
                            │                                   │       │
                            │ N                                 │ N     │ N
                            ▼ 1                                 ┌──┴────v───────┐
                        [users.uid]                             │ crm_customers │
                                                                ├───────────────┤
                                                                │customer_id(PK)│
                                                                └───────┬───────┘
                                                                        │ 1
                                                                        │
                                                                        │ N
                                                                ┌───────v───────┐
                                                                │ crm_customer_ │
                                                                │ cards         │
                                                                ├───────────────┤
                                                                │ card_id (PK)  │
                                                                │ card_customer_│
                                                                │  id (FK)      │
                                                                └───────────────┘

=========================================================================================================
  KEY NOTES:
  ─ crm_follow_ups has NO FK to crm_customers. Prospects are not yet customers.
  ─ crm_follow_ups.agent_id → users.uid (ON DELETE RESTRICT). Same FK pattern as crm_attendance.
  ─ crm_follow_ups.customer_timezone is auto-inferred server-side; never accepted from client body.
  ─ crm_follow_ups.quoted_options is a multi-line TEXT field (one quote per line: Price - Miles/Warranty).
  ─ notification_sent_at is reset to NULL whenever follow_up_date or follow_up_time is updated.
=========================================================================================================
```

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
| `customer_name` | `varchar(511)` | NO | *None* | Consolidated Customer Full Name |
| `customer_phone` | `varchar(25)` | YES | `NULL` | Primary phone number (guarded by permission `201`) |
| `customer_alternate_phone_1` | `varchar(25)` | YES | `NULL` | **[Phase 24]** First alternate phone number (optional) |
| `customer_alternate_phone_2` | `varchar(25)` | YES | `NULL` | **[Phase 24]** Second alternate phone number (optional) |
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
| `customer_card_copy_status`| `varchar(20)` | YES | `NULL` | Card copy received flag (`Yes`/`No`) |
| `customer_card_photo_status`| `varchar(20)` | YES | `NULL` | Photo ID received flag (`Yes`/`No`) |
| `amount_to_charge` | `varchar(25)` | YES | `NULL` | **[Phase 24]** Amount to charge from this card (only meaningful when order has >1 card) |
| `customer_card_copy_image` | `longtext` | YES | `NULL` | **[Phase 24]** Base64-encoded card copy image (see Decision 27.4 — never returned in list queries) |
| `customer_photo_id_image` | `longtext` | YES | `NULL` | **[Phase 24]** Base64-encoded photo ID image (see Decision 27.4 — never returned in list queries) |
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
| `order_customer_id` | `varchar(55)` | NO | *None* | Logical FK to `crm_customers.customer_id` (stored as string) — **[Per-Part]** (copied to child rows for easy lookup) |
| `order_make_model` | `varchar(255)` | YES | `NULL` | Vehicle Make & Model — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_part` | `varchar(255)` | YES | `NULL` | Part requested — **[Per-Part]** (unique per part row) |
| `order_part_size` | `varchar(255)` | YES | `NULL` | Dimensions or specifications — **[Per-Part]** (unique per part row) |
| `order_quoted_miles_and_warranty` | `varchar(255)` | YES | `NULL` | Quoted shipping mileage and warranty details — **[Per-Part]** (unique per part row) |
| `order_vendor_miles_and_warranty` | `varchar(255)` | YES | `NULL` | Actual vendor-specified mileage and warranty details — **[Per-Part]** (unique per part row) |
| `order_vin` | `varchar(255)` | YES | `NULL` | Vehicle Identification Number — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_total_pitched` | `varchar(25)` | YES | `NULL` | Selling price pitched to customer — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_vendor_price` | `varchar(25)` | YES | `NULL` | Buying price quoted by vendor — **[Per-Part]** (each part has its own vendor cost) |
| `order_vendor_id` | `varchar(111)` | YES | `NULL` | Logical FK to `crm_vendors.vendor_id` (as string) — **[Per-Part]** (each part has its own vendor) |
| `order_vendor_name` | `varchar(255)` | YES | `NULL` | Snapshot of vendor name — **[Per-Part]** (each part has its own vendor) |
| `order_shipping_type` | `varchar(255)` | YES | `NULL` | Shipping mode (e.g. Ground, Air) — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_amount_charged` | `varchar(25)` | YES | `NULL` | Amount successfully collected — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_refund_amount` | `varchar(25)` | YES | `NULL` | Amount returned to the customer — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_payment_gateway` | `varchar(55)` | YES | `NULL` | Logical FK to `crm_gateway.gateway_id` (as string) — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_sales_agent_id` | `int(11)` | YES | `NULL` | Logical FK to `users.uid` — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_sales_agent_name` | `varchar(55)` | YES | `NULL` | Snapshot of sales agent name/nickname — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_verifier_id` | `int(11)` | YES | `NULL` | Logical FK to `users.uid` of checker — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_verifier_name` | `varchar(55)` | YES | `NULL` | Snapshot of verifier name/nickname — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_sales_verifier_id` | `int(11)` | YES | `NULL` | Logical FK to `users.uid` of sales verifier — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_sales_verifier_name` | `varchar(55)` | YES | `NULL` | Snapshot of sales verifier name/nickname — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_backend_executive_id` | `int(11)` | YES | `NULL` | Logical FK to `users.uid` of backend executive — **[Per-Part]** (each part can be processed by a different executive) |
| `order_backend_executive_name` | `varchar(55)` | YES | `NULL` | Snapshot of backend executive name/nickname — **[Per-Part]** (each part can be processed by a different executive) |
| `order_documentation` | `varchar(255)` | YES | `NULL` | Document upload links / status — **[Per-Part]** (each part has its own documentation/files) |
| `order_booked` | `varchar(255)` | YES | `NULL` | Booking reference / metadata — **[Per-Part]** (each part is booked individually) |
| `order_checklist` | `varchar(20)` | YES | `'No'` | Order checklist completion status (Yes/No) — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_tracking_number` | `varchar(55)` | YES | `NULL` | Carrier tracking code — **[Per-Part]** (each part has its own shipping/tracking) |
| `order_delivery_status` | `varchar(55)` | YES | `NULL` | Delivery stage status — **[Per-Part]** (each part has its own delivery stage) |
| `order_qualified_incentive_status`| `varchar(55)`| YES | `NULL` | Incentive approval status for agents — **[Per-Part]** (incentives processed per part) |
| `order_qualified_incentive_amount`| `varchar(55)`| YES | `NULL` | Commission payout value — **[Per-Part]** (incentives processed per part) |
| `order_status` | `varchar(55)` | YES | `NULL` | Vendor invoice / status flag — **[Per-Part]** (vendor status is per vendor invoice/part) |
| `sale_status` | `varchar(55)` | YES | `NULL` | Status code: `1` (Sold), `2` (Refunded), `3` (Chargebacked). Other legacy codes (2-6) mapped to 1, 7 mapped to 2, 8 mapped to 3, all deprecated. — **[Per-Part]** (statuses can change independently per part) |
| `order_current_status` | `varchar(25)` | YES | `NULL` | Pipeline stage queue name — **[Per-Part]** (workflow stage tracks each part independently) |
| `order_current_status_update_date`| `datetime`| YES | `NULL` | Date workflow stage changed — **[Per-Part]** (updated per workflow status change) |
| `order_date` | `varchar(25)` | YES | `NULL` | Sale date (as string) — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `order_vendor_feedback` | `varchar(25)` | NO | `'Positive'`| Feedback rating on vendor — **[Per-Part]** (per-part vendor assessment) |
| `order_client_feedback` | `varchar(25)` | NO | `'Positive'`| Feedback rating from customer — **[Per-Part]** (vendor-specific client review) |
| `order_resolution` | `varchar(25)` | NO | `'Resolved'`| Resolution status for dispute queue — **[Per-Part]** (per-part resolution) |
| `order_created_date` | `datetime` | YES | `NULL` | Creation date — **[Per-Part]** (creation timestamp for order/part row) |
| `order_updated_date` | `datetime` | YES | `NULL` | Last modified date — **[Per-Part]** (modification timestamp for order/part row) |
| `order_part_found_by_id` | `int(11)` | YES | `NULL` | **[Phase 25]** FK to `users.uid` — team member who located/sourced the part. `ON DELETE SET NULL`. — **[Per-Part]** (sourcing agent tracks per part) |
| `order_part_found_by_name` | `varchar(55)` | YES | `NULL` | **[Phase 25]** Denormalized snapshot of Part Found By agent's nickname/name. — **[Per-Part]** (sourcing agent tracks per part) |
| `order_liftgate_needed` | `varchar(20)` | NO | `'No'` | **[Phase 25]** Whether a liftgate truck is required for delivery. Values: `'Yes'` / `'No'`. — **[Deal Global]** (stored on parent only, `NULL` on children) |
| `parent_order_id` | `int(11)` | YES | `NULL` | **[Phase 26]** Self-referential FK to `crm_orders.crm_order_id`. `NULL` = this is a primary/parent order. Non-NULL = this is a child/additional part belonging to the referenced parent order. `ON DELETE RESTRICT` — the DB rejects deletion of a parent row that still has children; the service layer enforces a user-friendly check first (see D29.7). Used to group multiple parts for a single customer deal. |

### crm_vendors
*   **Engine:** MyISAM
*   **Collation:** `latin1_swedish_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `vendor_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `vendor_name` | `varchar(255)` | NO | *None* | Company Name |
| `vendor_phone` | `varchar(15)` | NO | *None* | Primary contact number |
| `vendor_alternate_phone_1` | `varchar(15)` | YES | `NULL` | **[Phase 24]** First alternate phone number (optional) |
| `vendor_alternate_phone_2` | `varchar(15)` | YES | `NULL` | **[Phase 24]** Second alternate phone number (optional) |
| `vendor_fax` | `varchar(20)` | YES | `NULL` | Fax |
| `vendor_email` | `varchar(255)` | YES | `NULL` | Email Address |
| `vendor_contact_person`| `varchar(255)`| NO | *None* | Primary Point of Contact |
| `vendor_remark` | `text` | YES | `NULL` | Miscellaneous remarks / performance history |
| `vendor_status` | `int(11)` | NO | `1` | `1` = Active, `0` = Blacklisted |
| `vendor_country` | `varchar(50)` | YES | `NULL` | **[Phase 24]** Country of operation (`'US'` or `'Canada'`) |
| `vendor_state` | `varchar(100)` | YES | `NULL` | **[Phase 24]** State or province name (cascade-filtered by country in UI) |
| `vendor_payment_mode` | `varchar(255)` | YES | `NULL` | **[Phase 24]** Accepted payment modes (JSON array string containing `'Customer Card'`, `'Company Card'`, and/or `'Link'`, e.g., `'["Customer Card", "Link"]'`) |
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
  vendorId              Int         @id @default(autoincrement()) @map("vendor_id")
  vendorName            String      @map("vendor_name") @db.VarChar(255)
  vendorPhone           String      @map("vendor_phone") @db.VarChar(15)
  vendorAlternatePhone1 String?     @map("vendor_alternate_phone_1") @db.VarChar(15)  // Phase 24
  vendorAlternatePhone2 String?     @map("vendor_alternate_phone_2") @db.VarChar(15)  // Phase 24
  vendorFax             String?     @map("vendor_fax") @db.VarChar(20)
  vendorEmail           String?     @map("vendor_email") @db.VarChar(255)
  vendorContactPerson   String      @map("vendor_contact_person") @db.VarChar(255)
  vendorRemark          String?     @map("vendor_remark") @db.Text
  vendorStatus          Int         @default(1) @map("vendor_status")
  vendorCountry         String?     @map("vendor_country") @db.VarChar(50)            // Phase 24
  vendorState           String?     @map("vendor_state") @db.VarChar(100)             // Phase 24
  vendorPaymentMode     String?     @map("vendor_payment_mode") @db.VarChar(255)     // Phase 24
  createdAt             DateTime?   @map("created_at") @db.DateTime(0)
  updatedAt             DateTime?   @map("updated_at") @db.DateTime(0)
  orders                CrmOrders[]

  @@map("crm_vendors")
}


model CrmCustomers {
  customerId               Int                 @id @default(autoincrement()) @map("customer_id")
  firstName                String              @map("first_name") @db.VarChar(255)
  lastName                 String              @map("last_name") @db.VarChar(255)
  customerPhone            String?             @map("customer_phone") @db.VarChar(25)
  customerAlternatePhone1  String?             @map("customer_alternate_phone_1") @db.VarChar(25)  // Phase 24
  customerAlternatePhone2  String?             @map("customer_alternate_phone_2") @db.VarChar(25)  // Phase 24
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
  amountToCharge          String?      @map("amount_to_charge") @db.VarChar(25)         // Phase 24 — only shown in UI when >1 card
  /// NEVER include in findMany/list queries. Use findCardById() for single-record access only. See Decision 27.4.
  customerCardCopyImage   String?      @map("customer_card_copy_image") @db.LongText    // Phase 24 — Base64 image
  /// NEVER include in findMany/list queries. Use findCardById() for single-record access only. See Decision 27.4.
  customerPhotoIdImage    String?      @map("customer_photo_id_image") @db.LongText     // Phase 24 — Base64 image
  customerCardCreatedAt   DateTime?    @map("customer_card_created_at") @db.DateTime(0)
  customerCardUpdated     DateTime?    @map("customer_card_updated") @db.DateTime(0)

  customer                CrmCustomers @relation(fields: [cardCustomerId], references: [customerId], onDelete: Cascade)

  @@index([cardCustomerId])
  @@map("crm_customer_cards")
}


model CrmOrders {
  crmOrderId                    Int           @id @default(autoincrement()) @map("crm_order_id")
  orderCustomerId               Int           @map("order_customer_id")
  /// Merged field containing Year, Make, & Model (from legacy order_year migration)
  orderMakeModel                String?       @map("order_make_model") @db.VarChar(255)
  orderPart                     String?       @map("order_part") @db.VarChar(255)
  orderPartSize                 String?       @map("order_part_size") @db.VarChar(255)
  orderQuotedMilesAndWarranty   String?       @map("order_quoted_miles_and_warranty") @db.VarChar(255)
  orderVendorMilesAndWarranty   String?       @map("order_vendor_miles_and_warranty") @db.VarChar(255)
  orderVin                      String?       @map("order_vin") @db.VarChar(255)
  orderTotalPitched             String?       @map("order_total_pitched") @db.VarChar(25)
  orderVendorPrice              String?       @map("order_vendor_price") @db.VarChar(25)
  orderVendorId                 Int?          @map("order_vendor_id")
  orderVendorName               String?       @map("order_vendor_name") @db.VarChar(255)
  orderShippingType             String?       @map("order_shipping_type") @db.VarChar(255)
  orderAmountCharged            String?       @map("order_amount_charged") @db.VarChar(25)
  orderRefundAmount             String?       @map("order_refund_amount") @db.VarChar(25)
  orderPaymentGatewayId         Int?          @map("order_payment_gateway")
  orderSalesAgentId             Int?          @map("order_sales_agent_id")
  orderSalesAgentName           String?       @map("order_sales_agent_name") @db.VarChar(55)
  orderVerifierId               Int?          @map("order_verifier_id")
  orderVerifierName             String?       @map("order_verifier_name") @db.VarChar(55)
  orderSalesVerifierId          Int?          @map("order_sales_verifier_id")
  orderSalesVerifierName        String?       @map("order_sales_verifier_name") @db.VarChar(55)
  orderBackendExecutiveId       Int?          @map("order_backend_executive_id")
  orderBackendExecutiveName     String?       @map("order_backend_executive_name") @db.VarChar(55)
  // Phase 25 — Part Found By
  orderPartFoundById            Int?          @map("order_part_found_by_id")
  orderPartFoundByName          String?       @map("order_part_found_by_name") @db.VarChar(55)
  // Phase 25 — Liftgate Needed
  orderLiftgateNeeded           String?       @default("No") @map("order_liftgate_needed") @db.VarChar(20)
  orderDocumentation            String?       @map("order_documentation") @db.VarChar(255)
  orderBooked                   String?       @map("order_booked") @db.VarChar(255)
  orderChecklist                String?       @map("order_checklist") @db.VarChar(20)
  orderTrackingNumber           String?       @map("order_tracking_number") @db.VarChar(55)
  orderDeliveryStatus           String?       @map("order_delivery_status") @db.VarChar(55)
  orderQualifiedIncentiveStatus String?       @map("order_qualified_incentive_status") @db.VarChar(55)
  orderQualifiedIncentiveAmount String?       @map("order_qualified_incentive_amount") @db.VarChar(55)
  orderStatus                   String?       @map("order_status") @db.VarChar(55)
  saleStatus                    String?       @map("sale_status") @db.VarChar(55)
  orderCurrentStatus            String?       @map("order_current_status") @db.VarChar(55)
  orderCurrentStatusUpdateDate  DateTime?     @map("order_current_status_update_date") @db.DateTime(0)
  orderDate                     DateTime?     @map("order_date") @db.Date
  orderVendorFeedback           String        @default("Positive") @map("order_vendor_feedback") @db.VarChar(25)
  orderClientFeedback           String        @default("Positive") @map("order_client_feedback") @db.VarChar(25)
  orderResolution               String        @default("Resolved") @map("order_resolution") @db.VarChar(25)
  orderCreatedDate              DateTime      @default(now()) @map("order_created_date") @db.DateTime(0)
  orderUpdatedDate              DateTime      @updatedAt @map("order_updated_date") @db.DateTime(0)
  // Phase 26 — Multi-Part Orders grouping
  parentOrderId                 Int?          @map("parent_order_id")
  comments                      CrmComments[]
  saleStatusHistory             CrmSaleStatusHistory[]
  workflowHistory               CrmOrderCurrentStatusHistory[]
  viewLogs                      CrmOrderViews[]
  auditLogs                     CrmOrderAuditLog[]
  customer                      CrmCustomers  @relation(fields: [orderCustomerId], references: [customerId], onDelete: Restrict)
  gateway                       CrmGateway?   @relation(fields: [orderPaymentGatewayId], references: [gatewayId], onDelete: SetNull)
  salesAgent                    Users?        @relation("SalesAgent", fields: [orderSalesAgentId], references: [uid], onDelete: SetNull)
  vendor                        CrmVendors?   @relation(fields: [orderVendorId], references: [vendorId], onDelete: SetNull)
  verifier                      Users?        @relation("Verifier", fields: [orderVerifierId], references: [uid], onDelete: SetNull)
  salesVerifier                 Users?        @relation("SalesVerifier", fields: [orderSalesVerifierId], references: [uid], onDelete: SetNull)
  backendExecutive              Users?        @relation("BackendExecutive", fields: [orderBackendExecutiveId], references: [uid], onDelete: SetNull)
  // Phase 25 — Part Found By relation
  partFoundBy                   Users?        @relation("PartFoundBy", fields: [orderPartFoundById], references: [uid], onDelete: SetNull)
  // Phase 26 — Self-referential parent/child relations
  parentOrder                   CrmOrders?    @relation("OrderParts", fields: [parentOrderId], references: [crmOrderId], onDelete: Restrict)
  childOrders                   CrmOrders[]   @relation("OrderParts")

  @@index([orderCustomerId])
  @@index([orderSalesAgentId])
  @@index([orderCurrentStatus])
  @@index([saleStatus])
  @@index([orderPartFoundById])   // Phase 25
  @@index([parentOrderId])        // Phase 26
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

model CrmFollowUps {
  followUpId          Int       @id @default(autoincrement()) @map("follow_up_id")
  // FK to users.uid — snapshot pattern same as CrmAttendance
  agentId             Int       @map("agent_id")
  agentName           String    @map("agent_name") @db.VarChar(55)          // Denormalized snapshot of users.nickname at creation time
  customerName        String    @map("customer_name") @db.VarChar(511)
  customerPhone       String?   @map("customer_phone") @db.VarChar(25)
  customerState       String    @map("customer_state") @db.VarChar(100)     // From COUNTRY_STATE_MAP in geography.ts
  customerCountry     String    @map("customer_country") @db.VarChar(50)    // 'USA' or 'Canada'
  customerTimezone    String    @map("customer_timezone") @db.VarChar(100)  // IANA string e.g. 'America/New_York' — auto-inferred server-side from customerState via STATE_TIMEZONE_MAP
  vehicleYearMakeModel String   @map("vehicle_year_make_model") @db.VarChar(255) // e.g. '2018 Honda Civic'
  partRequired        String    @map("part_required") @db.VarChar(255)
  /// Multi-line field. Each line is one quote option in the format: Price - Miles/Warranty (e.g. '$450 - 60k miles / 30 day warranty'). Lines separated by newline (\n). First line shown in list; all lines shown in detail page.
  quotedOptions       String?   @map("quoted_options") @db.Text
  followUpDate        DateTime  @map("follow_up_date") @db.Date             // Customer's local date — stored in customer's timezone
  followUpTime        String    @map("follow_up_time") @db.VarChar(5)       // 'HH:MM' in customer's timezone — stored as-stated, not converted to UTC
  followUpReason      String    @map("follow_up_reason") @db.VarChar(255)   // Dropdown value OR 'Other: <custom text>' for free-text entries
  status              String    @map("status") @db.VarChar(50)              // See Follow-Up Status Values below
  priority            String    @map("priority") @db.VarChar(10)            // 'High', 'Medium', or 'Low'
  notes               String?   @map("notes") @db.Text                      // Free-form remarks — no image attachment unlike crm_comments
  entryDate           DateTime  @default(now()) @map("entry_date") @db.DateTime(0)         // Auto-set on INSERT — never editable
  lastContact         DateTime? @map("last_contact") @db.DateTime(0)        // Set on create (= entryDate); updated by service when notes/status/reason/date/time changes
  notificationSentAt  DateTime? @map("notification_sent_at") @db.DateTime(0) // NULL = notification not yet sent. Set by markNotificationSent(). Reset to NULL whenever followUpDate or followUpTime is updated.
  createdAt           DateTime  @default(now()) @map("created_at") @db.DateTime(0)
  updatedAt           DateTime  @updatedAt @map("updated_at") @db.DateTime(0)

  agent               Users     @relation("FollowUpAgent", fields: [agentId], references: [uid], onDelete: Restrict)

  @@index([agentId])
  @@index([followUpDate])
  @@index([status])
  @@index([priority])
  @@map("crm_follow_ups")
}
```

---

## 4. `crm_follow_ups` Table Schema

**[Phase 31]** New table for the Follow-Ups feature.

*   **Engine:** InnoDB
*   **Collation:** `utf8mb4_unicode_ci`

| Column | Type | Null | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `follow_up_id` (PK) | `int(11)` | NO | *None* | Auto-Increment |
| `agent_id` (FK) | `int(11)` | NO | *None* | Foreign Key → `users.uid`. `ON DELETE RESTRICT`. The agent who recorded this follow-up. |
| `agent_name` | `varchar(55)` | NO | *None* | Denormalized snapshot of `users.nickname` at creation time. Same pattern as `crm_attendance.agent_name`. |
| `customer_name` | `varchar(511)` | NO | *None* | Prospect full name in one field. |
| `customer_phone` | `varchar(25)` | YES | `NULL` | Prospect phone number. |
| `customer_state` | `varchar(100)` | NO | *None* | State or province name from `COUNTRY_STATE_MAP` (e.g. `'California'`, `'Ontario'`). |
| `customer_country` | `varchar(50)` | NO | *None* | `'USA'` or `'Canada'`. |
| `customer_timezone` | `varchar(100)` | NO | *None* | IANA timezone string (e.g. `'America/Los_Angeles'`). Auto-inferred server-side from `customer_state` via `STATE_TIMEZONE_MAP` in `geography.ts`. Never accepted from client. |
| `vehicle_year_make_model` | `varchar(255)` | NO | *None* | Merged field: Year + Make + Model (e.g. `'2018 Honda Civic'`). Same single-field pattern as `order_make_model`. |
| `part_required` | `varchar(255)` | NO | *None* | Part the prospect needs (e.g. `'Front Bumper'`). |
| `quoted_options` | `text` | YES | `NULL` | Multi-line quoted pricing. Each line: `Price - Miles/Warranty` (e.g. `'$450 - 60k miles / 30 day warranty'`). Lines separated by `\n`. First line shown in list view; all lines shown in detail. |
| `follow_up_date` | `date` | NO | *None* | The follow-up date **as stated by the customer in their own timezone**. Never converted to UTC for storage. |
| `follow_up_time` | `varchar(5)` | NO | *None* | The follow-up time in `HH:MM` format **in the customer's timezone**. Never converted to UTC for storage. |
| `follow_up_reason` | `varchar(255)` | NO | *None* | Dropdown selection or `'Other: <agent-typed text>'` for free-text entries. |
| `status` | `varchar(50)` | NO | *None* | Current status. Values: `Interested`, `Call Back Later`, `No Answer`, `Busy`, `Voicemail`, `Waiting for Paycheck`, `Sale Closed`, `Not Interested`, `Price Too High`, `Purchased Elsewhere`, `Wrong Number`, `Spanish`. |
| `priority` | `varchar(10)` | NO | *None* | `'High'`, `'Medium'`, or `'Low'`. |
| `notes` | `text` | YES | `NULL` | Free-form agent remarks. No image attachment (unlike `crm_comments`). |
| `entry_date` | `datetime` | NO | `current_timestamp()` | Auto-set on record creation. **Never editable after creation.** Represents when the follow-up was first logged. |
| `last_contact` | `datetime` | YES | `NULL` | Set to `now()` on creation (= entry_date). Updated by `followup.service.ts` whenever `notes`, `status`, `follow_up_reason`, `follow_up_date`, or `follow_up_time` is changed. **Not updated for changes to `priority`, `quoted_options`, `customer_name`, etc.** |
| `notification_sent_at` | `datetime` | YES | `NULL` | `NULL` = notification not yet fired for this record's scheduled time. Set to `now()` by `markNotificationSent()` when the notification toast fires. **Reset to `NULL` by the service layer whenever `follow_up_date` or `follow_up_time` is updated**, so the rescheduled follow-up fires a fresh notification. |
| `created_at` | `datetime` | NO | `current_timestamp()` | Row creation timestamp. |
| `updated_at` | `datetime` | NO | `current_timestamp()` (on update) | Automatically updated by Prisma `@updatedAt`. |

### Follow-Up Reason Values (Dropdown)
- `Waiting for customer decision`
- `Customer asked to call tomorrow`
- `Waiting for paycheck`
- `Waiting for mechanic approval`
- `Waiting for spouse approval`
- `Waiting for VIN`
- `Sent invoice`
- `Payment reminder`
- `Other: <custom text>` — stored as a single string in one column; the prefix `Other: ` is added by the form before submission.

### Follow-Up Status Values (Dropdown)
- `Interested`
- `Call Back Later`
- `No Answer`
- `Busy`
- `Voicemail`
- `Waiting for Paycheck`
- `Sale Closed`
- `Not Interested`
- `Price Too High`
- `Purchased Elsewhere`
- `Wrong Number`
- `Spanish`

### Timezone Strategy
`follow_up_date` and `follow_up_time` are stored **exactly as the customer stated them** in their own timezone. The IANA timezone string is stored alongside in `customer_timezone`. UTC computation is performed at query time (for notification polling) using MySQL's `CONVERT_TZ()` function in the `findDueForNotification()` raw query — no UTC datetime column is stored.

> **Migration:** `npx prisma migrate dev --name add_follow_ups_table`
