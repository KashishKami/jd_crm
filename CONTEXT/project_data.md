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

## 3. Permission Codes Reference

Permissions are stored in the database as a comma-separated string in `users.user_permissions` (e.g., `"101,102,112"`). Below is the dictionary of these codes as defined in the original `agent-permission.php` file.

### Dashboard Widget Permissions
*   **`101`**: Dashboard - Total Sales Widget
*   **`112`**: Dashboard - Total Sales Widget "View Details"
*   **`102`**: Dashboard - Total Sales This Month Widget
*   **`113`**: Dashboard - Total Sales This Month "View Details"
*   **`103`**: Dashboard - Today's Sale Widget
*   **`114`**: Dashboard - Today's Sale "View Details"
*   **`104`**: Dashboard - Chargeback This Month Widget
*   **`115`**: Dashboard - Chargeback This Month "View Details"
*   **`105`**: Dashboard - Refund This Month Widget
*   **`116`**: Dashboard - Refund This Month "View Details"
*   **`106`**: Dashboard - Net Sales Widget
*   **`110`**: Dashboard - Top Performer Widget
*   **`111`**: Dashboard - Bottom Performer Widget
*   **`120`**: Dashboard - Pending Orders Count
*   **`121`**: Dashboard - Pending Tracking Count
*   **`122`**: Dashboard - Pending Delivery Count
*   **`123`**: Dashboard - Pending Feedback Count
*   **`124`**: Dashboard - Pending Resolutions Count
*   **`131`**: Dashboard - Top Vendors Widget
*   **`132`**: Dashboard - Blacklisted Vendors Widget
*   **`140`**: Dashboard - Recent Orders Table
*   **`151`**: Dashboard - Attendance: Total Present
*   **`152`**: Dashboard - Attendance: Total Absent
*   **`153`**: Dashboard - Attendance: Total ULWP (Unapproved Leave Without Pay)
*   **`154`**: Dashboard - Attendance: Total LWP (Leave Without Pay)
*   **`155`**: Dashboard - Attendance: Total PL (Paid Leave)
*   **`156`**: Dashboard - Attendance: Total NCNS (No Call No Show)

### Side Menu & Navigation Permissions
*   **`160`**: Side Menu - All Vendors Page
*   **`161`**: Side Menu - Add Vendor Page
*   **`162`**: Side Menu - Active Users (Agents) Page
*   **`163`**: Side Menu - Inactive Users Page
*   **`164`**: Side Menu - Today's Attendance Page
*   **`165`**: Side Menu - Previous Attendance Page
*   **`166`**: Side Menu - View Attendance (Detailed) Page
*   **`167`**: Side Menu - Previous Attendance Log
*   **`168`**: Side Menu - All Gateways Page
*   **`169`**: Side Menu - Add Gateway Page
*   **`170`**: Side Menu - Gateway Report Page
*   **`171`**: Side Menu - Add New Order Page
*   **`172`**: Side Menu - All Orders Page
*   **`173`**: Side Menu - Completed Orders Page
*   **`174`**: Side Menu - Pending Orders Page
*   **`175`**: Side Menu - Pending Tracking Page
*   **`176`**: Side Menu - Pending Delivery Page
*   **`177`**: Side Menu - Pending Feedbacks Page
*   **`178`**: Side Menu - Pending Resolutions Page

### Customer Information & Order Detail View Permissions
*   **`201`**: Order Details - View Customer Phone Number
*   **`202`**: Order Details - View Customer Email
*   **`203`**: Order Details - View Vendor Details
*   **`204`**: Order Details - View Payment Card Details (Sensitive)
*   **`205`**: Order Details - Perform Order Actions (Edit/Delete)

### Global/Super Admin Permission
*   **`99999`**: Bypass all permissions check (Super Administrator).

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
*   `Pending Tracking`: Missing tracking information.
*   `Pending Delievery` (sic, stored as `Pending Delievery` in legacy database): Out for delivery but not confirmed.
*   `Pending Feedback`: Delivered, awaiting customer/vendor review.
*   `Pending Resolutions`: Under dispute or issue tracking.
*   `Everything Completed`: Final successful workflow state.

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
    *   To allow existing credentials to work, NextAuth's `CredentialsProvider` will calculate the SHA-256 of the input password.
    *   If it matches the stored hash in `users.password`, authenticate successfully.
    *   **Recommendation:** Upon successful SHA-256 login, migrate the user's password on-the-fly to a modern `bcrypt` hash (or `argon2`) and flag the account as upgraded to avoid long-term SHA-256 vulnerabilities.
