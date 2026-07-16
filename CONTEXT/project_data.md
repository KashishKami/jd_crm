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
| `dashboard:view-advanced-chart` | — | View advanced sales analytics chart (new) |
| ~~`dashboard:attendance-summary`~~ | ~~`151`–`156`~~ | ~~View Attendance summary row (Present / Absent / LWOP / etc.)~~ ⚠️ *Phase 12 skipped — not seeded or enforced* |
| `dashboard:team-monthly-scores` | — | View monthly team-wise aggregate scores widget (new — teams are a new concept) |
| `dashboard:team-top-performer` | — | View top performer per team for the current month (new) |
| `dashboard:team-bottom-performer` | — | View bottom performer per team for the current month (new) |
| `dashboard:backend-top-performer` | — | View Backend Team Top Performers panel — ranked by completed cases in the selected month (Phase 29) |
| `dashboard:backend-bottom-performer` | — | View Backend Team Bottom Performers panel — ranked by highest pending backlog in the selected month (Phase 29) |
| `dashboard:backend-pending-cases` | — | View Backend Pending Cases by Category breakdown table for all backend executives (Phase 29) |

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
| `agents:view-roles` | — | View roles column and filter in Agent list |
| `agents:view-details` | — | View sensitive agent detail tabs (bank, academic, work) |


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
| `orders:view` | `172` | Access All Orders page. Grants full visibility to see all agents' deals/orders and Team/Agent filters. |
| `orders:create` | `171` | Access Add New Order page and POST endpoint. Also grants access to the Orders page with "own-orders-only" restriction if `orders:view` is absent. |
| `orders:edit` | `205` | Perform edit actions on an existing order |
| `orders:delete` | — | Permanently delete an order and all its child logs (super-admin only) |
| `orders:view-completed` | `173` | Access Completed Orders filtered view |
| `orders:view-pending-booking` | `174` | Access Pending Booking queue |
| `orders:view-pending-shipment` | `175` | Access Pending Shipment queue |
| `orders:view-pending-delivery` | `176` | Access Pending Delivery queue |
| `orders:view-pending-feedback` | `177` | Access Pending Feedback queue |
| `orders:view-pending-resolutions` | `178` | Access Pending Resolutions queue |
| `orders:view-returned` | — | Access Returned Orders queue (new) |
| `orders:view-cancelled` | — | Access Cancelled Orders queue (new) |
| `orders:view-sale-status-history` | — | View sale status change history timeline |
| `orders:view-workflow-history` | — | View order workflow status change timeline |

> [!NOTE]
> **Restricted Orders Access (Phase 2):** If a user has `orders:create` permission but lacks the `orders:view` (view-details) permission, they are considered "restricted."
> - **Orders List & Pending Counts:** They can access the Orders page but only see their own deals and orders. The Team and Agent filters are hidden from the UI, and the backend REST endpoints (`GET /api/orders` and `GET /api/orders/pending-counts`) force the `agentId` filter to their UID and clear the `teamId` filter.
> - **Order Details & Edit Pages:** They can view the Details (`/orders/[id]`) and Edit (`/orders/[id]/edit`) pages, and execute `GET` or `PATCH` on `/api/orders/[id]` and comments APIs, **only** if they are the designated sales agent for that order. For other orders, they receive `Access Denied` / `403 Forbidden` responses.
> - **Action Links:** On the pipeline list view and recent orders table, the "Details" and "Edit" action buttons are disabled (rendered in gray text with `cursor: not-allowed`) if the order is not owned by them, or if the user lacks the generic `orders:edit` permission.


### Resource: `customers`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `customers:view` | — | Access customer list and detail pages (new) |
| `customers:create` | — | Create a new customer (new — was embedded in order create) |
| `customers:edit` | — | Edit customer details (new) |
| `customers:view-phone` | `201` | View customer phone number and alternate phone numbers in order detail (covers all three phone fields added in Phase 24) |
| `customers:view-email` | `202` | View customer email in order detail |
| `customers:view-vendor-details` | `203` | View linked vendor details in order detail |
| `customers:view-cards` | `204` | View full (unmasked) payment card details |

### Resource: `attendance`

> [!WARNING]
> **Phase 12 skipped.** All attendance permissions below are crossed out — they are **not seeded into the database** and **not enforced in any API route or UI**. Do not assign these to roles until Phase 12 is implemented.

| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| ~~`attendance:view`~~ | ~~`164` + `166`~~ | ~~Access Today's and Previous Attendance pages~~ |
| ~~`attendance:view-history`~~ | ~~`165` + `167`~~ | ~~Access historical attendance log~~ |
| ~~`attendance:mark`~~ | — | ~~Submit daily attendance marking~~ |

### Resource: `settings`
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `settings:manage-permissions` | — | Access Role & Permission Settings page (new) |

### Resource: `follow-ups`
| Permission Key | Permission ID | Description |
| :--- | :--- | :--- |
| `follow-ups:view` | `58` | **Admin-level.** View **all** follow-ups across all agents and centers (teams). Unlocks Center (Team) and Agent filter dropdowns and the Agent column in the list. Admin-only delete is also gated behind this permission. |
| `follow-ups:create` | `59` | **Agent-level.** Access the Follow-Ups page and create new records. Backend hard-scopes all list and detail queries to the authenticated agent's own records — no Team/Agent filters or Agent column are shown. Cannot delete. |

> [!NOTE]
> **Restricted Follow-Ups Access (Phase 31):** This mirrors the `orders:view` / `orders:create` dual-permission pattern exactly.
> - Users with `follow-ups:view` see all follow-ups from all agents and all centers, with full Team + Agent filter controls.
> - Users with only `follow-ups:create` can access the page, but all API endpoints (`GET /api/follow-ups`, `GET /api/follow-ups/[id]`) force `agentId = session.user.uid` server-side. The client cannot override this regardless of what it sends in query params or the request body.
> - Users with neither permission receive a `403 Forbidden` from all `/api/follow-ups/*` endpoints and a redirect to `/access-denied` from `middleware.ts` on page load.
> - `agentId` and `agentName` on new follow-up records are **always derived from the authenticated session** — never trusted from the client POST body.

> [!NOTE]
> **Phase 31.5 Follow-Up Module Updates:**
> - **`part_description` field added (Phase 31.5):** The `crm_follow_ups` table now has an optional `part_description TEXT NULL` column (Prisma field: `partDescription`). This stores a free-text description of the specific part (e.g. "Driver side door, power window, red interior"). It appears on the Add form, Edit form, and Detail page under "Vehicle & Part Specifications".
> - **Phone number format standard:** All `customer_phone` values are stored in `xxx-xxx-xxxx` format (enforced by the frontend `formatPhoneNumber` formatter in `src/lib/formatPhone.ts`). The formatter strips non-digit characters and caps at 10 digits. Display in the list and detail page also passes through this formatter.
> - **`computeDaysLabel` correction:** The daysLabel ("Today", "Tomorrow", etc.) compares follow-up date/time against `DateTime.now()` using the **customer's own IANA timezone** (`customerTimezone`). The Prisma-returned `Date` object for `follow_up_date` is read as UTC date (`.toISOString().split('T')[0]`) — NOT timezone-shifted — before comparison.
> - **Notification hook timezone:** `useFollowUpNotifications.ts` determines "due now" by constructing `DateTime.fromISO(followUpDate + 'T' + followUpTime, { zone: customerTimezone })` and comparing against `DateTime.now()`. This is browser-timezone-independent.
> - **Detail page timestamps in EST:** `entry_date` and `last_contact` on the detail page are displayed in `America/New_York` (EST/EDT) using Luxon's `.setZone('America/New_York')`, matching the orders page convention.



### Super Admin
| Permission Key | Legacy Code | Description |
| :--- | :--- | :--- |
| `super-admin` | `99999` | Bypasses all permission checks. Grants access to everything. |

---

## 4. Database Lookup Enums

### Sale Status (`sale_status`)
Stored as a string in the `crm_orders` table. **Deal-level global field** — stored only on the parent row; child rows always have `NULL` (see Decision 32). Controls margin accounting and dashboard metrics:

| Code | Status | Description |
| :--- | :--- | :--- |
| **`1`** | `Sold` | Full sale completed — no refund. `finalMargin = orderAmountCharged`. Order belongs in `Completed Orders` workflow queue. |
| **`2`** | `Refunded` | Full refund issued to customer. `orderRefundAmount` auto-set to full `orderAmountCharged`. `finalMargin = 0`. Auto-moves order **and all its child parts** to `Returned Orders` workflow queue. |
| **`3`** | `Chargebacked` | Customer disputed charge. `orderRefundAmount` auto-set to full `orderAmountCharged`. `finalMargin = 0`. Auto-moves order **and all its child parts** to `Returned Orders` workflow queue. |
| **`4`** | `Partial Refund` | Partial amount returned to customer. `orderRefundAmount` = user-entered amount. `finalMargin = orderAmountCharged − orderRefundAmount`. Order remains in `Completed Orders` workflow queue (money was still received). |
| **`5`** | `Void` | Order was charged but cancelled on the same day — full charge reversed. `orderRefundAmount` auto-set to full `orderAmountCharged`. `finalMargin = 0`. Auto-moves order **and all its child parts** to `Returned Orders` workflow queue. The date/time capture modal opens in the UI. |
| **`6`** | `Cancelled` | Agent collected all customer information but no charge was ever processed. Customer later cancelled. `orderRefundAmount` cleared to `null`. `orderCurrentStatus` is automatically set to `Cancelled Orders` for the parent **and all child parts**. |
| ~~**`2`**~~ | ~~`Prospect`~~ | ~~Potential lead (Deprecated / Removed from DB).~~ |
| ~~**`3`**~~ | ~~`Call Back`~~ | ~~Requires agent callback (Deprecated / Removed from DB).~~ |
| ~~**`4`**~~ | ~~`Not Interested`~~ | ~~User declined (Deprecated / Removed from DB).~~ |
| ~~**`5`**~~ | ~~`Out Of Scope`~~ | ~~Not serviceable (Deprecated / Removed from DB).~~ |
| ~~**`6`**~~ | ~~`Enquiry`~~ | ~~Basic information request (Deprecated / Removed from DB).~~ |
| ~~**`7`**~~ | ~~`Refunded`~~ | ~~Payment returned (Legacy code — replaced by 2).~~ |
| ~~**`8`**~~ | ~~`Chargebacked`~~ | ~~Dispute initiated (Legacy code — replaced by 3).~~ |

> **Key metric:** `finalMargin = orderAmountCharged − orderRefundAmount`. This is the authoritative profitability figure used across all dashboard aggregations, performer rankings, and chart widgets. Raw `orderAmountCharged` alone is never used as a dashboard metric.

> **Multi-part deal note (Decision 32):** `saleStatus` is a deal-level concept. For multi-part orders, the status is stored on the parent row only. Child rows always have `saleStatus = NULL`. When a parent's `saleStatus` changes to a terminal outcome (Refunded `'2'`, Chargebacked `'3'`, Void `'5'`, Cancelled `'6'`), all child rows' `orderCurrentStatus` is automatically cascaded to the corresponding terminal queue (`Returned Orders` or `Cancelled Orders`) by the service layer. Only the parent's `saleStatus` is presented in the UI (a single global dropdown in Section 06 of the Add/Edit Order form).




### Order Workflow Status (`order_current_status`)
Determines which queue the order sits in (from `class/orderClass.php` pending reports):
*   `Pending Booking`: Order intake complete, awaiting vendor/supplier assignment (default state on creation).
*   `Pending Shipment`: Vendor assigned, awaiting tracking number details (replaces legacy `Pending Tracking`).
*   `Pending Delivery`: Out for delivery but not confirmed (corrects legacy misspelling `Pending Delievery`).
*   `Pending Feedback`: Delivered, awaiting customer/vendor review.
*   `Pending Resolutions`: Under dispute or issue tracking.
*   `Completed Orders`: Final successful workflow state. Contains orders with `saleStatus IN ('1', '4')` — Sold and Partial Refund. Both received money.
*   `Returned Orders`: Terminal failure/reversal workflow state. Contains orders with `saleStatus IN ('2', '3', '5')` — Refunded, Chargebacked, and Void. The full sale was reversed or charged-back. Auto-set by the service layer when `saleStatus` is changed to `'2'`, `'3'`, or `'5'`. **For multi-part orders, all child parts' `orderCurrentStatus` is cascaded to `Returned Orders` automatically when the parent's `saleStatus` is set to any of these values.**
*   `Cancelled Orders`: Terminal cancelled workflow state. Contains orders with `saleStatus = '6'` — Cancelled. No charge was ever processed. Auto-set by the service layer when `saleStatus` is changed to `'6'`. **For multi-part orders, all child parts' `orderCurrentStatus` is cascaded to `Cancelled Orders` automatically.**

> **Important:** Child `crm_orders` rows (those with a non-null `parentOrderId`) always have `saleStatus = NULL` (Decision 32). Their `orderCurrentStatus` is their primary operational tracker and is the field used to determine which workflow queue they appear in. When the parent's `saleStatus` changes to a terminal state, all children's `orderCurrentStatus` are updated via a cascade in `order.service.ts`, ensuring the entire deal leaves the active pipeline.


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
