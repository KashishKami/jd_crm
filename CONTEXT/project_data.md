# Project Data: JD CRM Migration

This document serves as the project metadata, technical decisions log, and lookup reference dictionary for migrating **JD CRM** from PHP to a Next.js TypeScript monolith.

---

## 1. Core Metadata

*   **Project Name:** JD CRM (TypeScript Migration)
*   **Source Architecture:** PHP 8.3, Raw MySQL/MariaDB (PDO & mysqli), Vanilla JS, Hostinger Shared Hosting
*   **Target Architecture:** Next.js Monolith (App Router), TypeScript, Prisma ORM, MySQL, NextAuth.js
*   **Hosting Target:** Docker local development, Vercel/Self-hosted Node.js + managed database
*   **Database Name:** `jd_crm`

---

## 2. Technical Stack & Architecture

### Core Frameworks
*   **Next.js 14+ (App Router):** Unified backend and frontend repository.
*   **TypeScript:** Type safety across API routes, repository layer, and page views.
*   **Prisma ORM:** Database client and migration manager.
*   **NextAuth.js (Auth.js v5):** Session-based authentication with support for credentials provider.

### Three-Layer Architecture
To avoid the spaghetti SQL queries in the old PHP files, the code will be structured into three distinct layers:
1.  **Repository Layer (`src/repository/`):** Houses raw database interactions using Prisma. No business logic or HTTP/controller response handling here.
2.  **Service Layer (`src/service/`):** Implements business logic (e.g., calculating dashboard metrics, checking permissions, formatting vendor reports). Does not directly access HTTP request objects.
3.  **Controller Layer (`src/app/api/` or Server Actions):** Handles request validation, HTTP response parsing, NextAuth session validation, and serialization. Calls services.

---

## 3. RBAC Permission Keys Reference

> [!IMPORTANT]
> **Decision 2 (see `CONTEXT/decision_log.md`):** The legacy PHP app stored permissions as a comma-separated string of numeric codes in `users.user_permissions` (e.g. `"160,162"`). This has been replaced with a normalized **Role-Based Access Control (RBAC)** system: `crm_roles`, `crm_permissions`, and `crm_role_permissions` junction tables. Users now have a `roleId` FK. Permissions are checked using readable string keys.

### Resource: `dashboard`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `dashboard:total-sales` | `101` + `112` | View Total Sales widget and its detail drill-down |
| `dashboard:monthly-sales` | `102` + `113` | View Total Sales This Month widget and detail |
| `dashboard:today-sales` | `103` + `114` | View Today's Sale widget and detail |
| `dashboard:chargeback` | `104` + `115` | View Chargeback This Month widget and detail |
| `dashboard:refund` | `105` + `116` | View Refund This Month widget and detail |
| `dashboard:net-sales` | `106` | View Net Sales widget |
| `dashboard:top-performer` | `110` | View Top Performer widget |
| `dashboard:bottom-performer` | `111` | View Bottom Performer widget |
| `dashboard:pending-counts` | `120`–`124` | View all pending pipeline count tiles |
| `dashboard:top-vendors` | `131` | View Top Vendors widget |
| `dashboard:blacklisted-vendors` | `132` | View Blacklisted Vendors widget |
| `dashboard:recent-orders` | `140` | View Recent Orders table |
| `dashboard:attendance-summary` | `151`–`156` | View Attendance summary row (Present / Absent / LWOP / etc.) |
| `dashboard:team-monthly-scores` | — | View monthly team-wise aggregate scores widget (new — teams are a new concept) |
| `dashboard:team-top-performer` | — | View top performer per team for the current month (new) |
| `dashboard:team-bottom-performer` | — | View bottom performer per team for the current month (new) |

### Resource: `vendors`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `vendors:view` | `160` | Access All Vendors page and list endpoint |
| `vendors:create` | `161` | Access Add Vendor page and POST endpoint |
| `vendors:edit` | — | Edit or blacklist/restore a vendor (new — was implicit) |

### Resource: `agents`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `agents:view` | `162` | Access Active Agents list page |
| `agents:view-inactive` | `163` | Access Inactive Agents page |
| `agents:create` | — | Create a new agent (new — was implicit) |
| `agents:edit` | — | Edit agent details or deactivate (new — was implicit) |

### Resource: `gateways`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `gateways:view` | `168` | Access All Gateways page |
| `gateways:create` | `169` | Access Add Gateway page and POST endpoint |
| `gateways:report` | `170` | Access Gateway Report page and report endpoint |
| `gateways:edit` | — | Edit or deactivate a gateway (new — was implicit) |

### Resource: `orders`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `orders:view` | `172` | Access All Orders page |
| `orders:create` | `171` | Access Add New Order page and POST endpoint |
| `orders:edit` | `205` | Perform edit/delete actions on an existing order |
| `orders:view-completed` | `173` | Access Completed Orders filtered view |
| `orders:view-pending-booking` | `174` | Access Pending Booking queue |
| `orders:view-pending-shipment` | `175` | Access Pending Shipment queue |
| `orders:view-pending-delivery` | `176` | Access Pending Delivery queue |
| `orders:view-pending-feedback` | `177` | Access Pending Feedback queue |
| `orders:view-pending-resolutions` | `178` | Access Pending Resolutions queue |

### Resource: `customers`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `customers:view` | — | Access customer list and detail pages (new) |
| `customers:create` | — | Create a new customer (new — was embedded in order create) |
| `customers:edit` | — | Edit customer details (new) |
| `customers:view-phone` | `201` | View customer phone number in order detail |
| `customers:view-email` | `202` | View customer email in order detail |
| `customers:view-vendor-details` | `203` | View linked vendor details in order detail |
| `customers:view-cards` | `204` | View full (unmasked) payment card details |

### Resource: `attendance`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `attendance:view` | `164` + `166` | Access Today's and Previous Attendance pages |
| `attendance:view-history` | `165` + `167` | Access historical attendance log |
| `attendance:mark` | — | Submit daily attendance marking (new — was admin-only implicit) |

### Super Admin
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `super-admin` | `99999` | Bypasses all permission checks. Grants access to everything. |

---

## 4. Database Lookup Enums

### Sale Status (`sale_status`)
Mapped in `dashboard.php` and `orders.php` to define the order status logic:

| Code | Value Name | Meaning / Visual State |
| :--- | :--- | :--- |
| **`1`** | `Sold` | Normal completed sale. |
| **`2`** | `Prospect` | Potential lead. |
| **`3`** | `Call Back` | Requires agent callback. |
| **`4`** | `Not Interested` | User declined. |
| **`5`** | `Out Of Scope` | Not serviceable. |
| **`6`** | `Enquiry` | Basic information request. |
| **`7`** | `Refunded` | Payment returned (affects Monthly metrics). |
| **`8`** | `Chargebacked` | Dispute initiated (subtracted from Net Sales). |

### Order Workflow Status (`order_current_status`)
Determines which queue the order sits in (from `class/orderClass.php` pending reports):
*   `Pending Booking`: Order intake complete, awaiting vendor/supplier assignment (default state on creation).
*   `Pending Shipment`: Vendor assigned, awaiting tracking number details (replaces legacy `Pending Tracking`).
*   `Pending Delivery`: Out for delivery but not confirmed (corrects legacy misspelling `Pending Delievery`).
*   `Pending Feedback`: Delivered, awaiting customer/vendor review.
*   `Pending Resolutions`: Under dispute or issue tracking.
*   `Completed Orders`: Final successful workflow state.

### Attendance Status (`attendance_status_id` / `attendance_status_name`)
Mapped during daily marking (`mark-attendance.php`):
*   **`1`**: Present
*   **`2`**: Absent
*   **`3`**: Unapproved LWOP (Leave Without Pay)
*   **`4`**: LWOP (Leave Without Pay)
*   **`5`**: Paid Leave (PL)
*   **`6`**: NCNS (No Call No Show)
*   **`7`**: Half Day

---

## 5. Security & Authentication Policy

*   **Hash Compatibility:** The PHP application hashed passwords using raw SHA-256 (`hash('sha256', $password)`).
*   **Migration Authentication Strategy:**
    *   To allow existing credentials to work, NextAuth's `CredentialsProvider` calculates the SHA-256 of the input password.
    *   If it matches the stored hash in `users.password`, authenticate successfully.
    *   Upon successful SHA-256 login, the user's password is automatically migrated on-the-fly to a modern `bcrypt` hash, preventing long-term SHA-256 vulnerabilities.

*   **Authorization (RBAC):** Users now have a `roleId` foreign key referencing `crm_roles`. Permissions are resolved at login time by joining `crm_role_permissions` → `crm_permissions` and stored in the NextAuth JWT as a `string[]` of permission keys (e.g. `['vendors:view', 'orders:create']`). The `super-admin` key in that array bypasses all checks. The `hasPermission(session, key)` helper checks either the specific key or `super-admin`.

> [!NOTE]
> **Legacy data migration note:** The old `users.user_permissions` VARCHAR column stored numeric codes like `"160,162,99999"`. When seeding or migrating existing user data, use the legacy mapping table in Section 3 to translate old numeric codes to their corresponding RBAC role assignments.
