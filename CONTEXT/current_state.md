# Current State: PHP to Next.js Monolith Migration Plan

This file tracks our migration progress. It is divided into logical execution phases.
The core development checklist items follow the **Test-Driven Development (TDD) Phase Format** specified in [TDD_INSTRUCTION_GUIDE.md](file:///c:/Users/Administrator/Desktop/JD%20CRM/TDD_INSTRUCTION_GUIDE.md).

---

## 1. Migration Progress Summary

| Phase | Description | Status | Target Files |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Planning & Documentation Setup | **[x] COMPLETED** | `project_data.md`, `database_schema.md`, `local_setup.md` |
| **Phase 1** | Local DB & Docker Infrastructure | **[x] COMPLETED** | `docker-compose.yml`, local container setup |
| **Phase 2** | Next.js Scaffolding & Prisma Setup | **[x] COMPLETED** | `prisma/schema.prisma`, Next.js app scaffold |
| **Phase 3** | Authentication & Dual-Hash Migration | **[x] COMPLETED** | NextAuth config, SHA-256 to bcrypt upgrades |
| **Phase 4** | Authorization & Page Guard System | **[ ] PENDING** | Permission check services, route guards |
| **Phase 5** | Agent Management (CRUD) | **[ ] PENDING** | Agents view, agent permissions, profiles |
| **Phase 6** | Customer & Sensitive Cards Ledger | **[ ] PENDING** | Customers listing, card viewer (permission-guarded) |
| **Phase 7** | Vendor Management | **[ ] PENDING** | Vendor listing, blacklist toggle, orders mapping |
| **Phase 8** | Gateway Setup & Aggregated Reports | **[ ] PENDING** | Gateways dashboard, monthly gateway performance charts |
| **Phase 9** | Order Intake & Sales Pipeline | **[ ] PENDING** | Add order form, pipeline queues (Pending Tracking/Feedback) |
| **Phase 10**| Interactive Sales Dashboard | **[ ] PENDING** | Metric counters, top/bottom performance widgets |
| **Phase 11**| Comments & Audits System | **[ ] PENDING** | Order comments timeline, image upload handler |
| **Phase 12**| Attendance Logging System | **[ ] PENDING** | Mark attendance sheet, historical attendance view |
| **Phase 13**| global Full-Text Search | **[ ] PENDING** | Unified global search bar, order filters |

---

## 2. Phase-by-Phase Checklist (TDD Style)

### Phase 1 — Local Database Infrastructure & Setup

#### W-101 — Local Docker Database Provisioning

**Goal:**
Enable developers to run a local database instance matching Hostinger's environment, import the legacy schema, seed baseline records, and prepare for Prisma connectivity without relying on online production servers.

**Approach:**
Implement and execute the setup defined in `local_setup.md` using `docker-compose.yml`. Ensure the schema can be parsed, and verify the container responds to local SQL client requests.

---

- [x] **Verification chain:**
  1. Developer runs `docker compose up -d` → `jd_crm_db` starts.
  2. Developer runs PowerShell/Bash commands to import `crm_php/jd_crm_schema.sql` into container.
  3. Developer runs local client and verifies all 17 tables (e.g. `users`, `crm_orders`, `crm_attendance`) are present.
  4. Developer seeds the baseline user records → database is ready for application connections → ✅ Done.

---

### Phase 2 — Next.js Scaffolding & Prisma Setup

#### W-201 — Next.js Scaffold & Prisma Schema Integration

**Goal:**
Initialize the typescript next.js project and integrate the Prisma client to map all 17 database tables, enabling type-safe repository queries.

**Approach:**
Initialize Next.js using `npx -y create-next-app@latest ./` in the workspace folder. Add Prisma. Implement `schema.prisma` with `relationMode = "prisma"` to support database models logically without modifying foreign key constraints in MySQL.

---

- [x] **RED — Integration (`db_connection.test.ts`):**
  - [x] Test: Fetch all models from Prisma client. Assert connection is successful.
  - [x] Test: Attempt queries against table `users` and assert a mock agent can be successfully retrieved (fails initially because Prisma is not initialized).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Schema → Initialization):**
  - [x] [Schema] Initialize Prisma: `npx prisma init`. Copy `schema.prisma` from [database_schema.md](./CONTEXT/database_schema.md). Ensure `relationMode = "foreignKeys"` (real InnoDB FK constraints — we are creating a brand new database).
  - [x] [Migration] Run `npx prisma migrate dev --name init_jd_crm_schema`. Verify all 14 tables are created with InnoDB engine and FK constraints via `SHOW CREATE TABLE crm_orders;`.
  - [x] [Client] In `src/lib/db.ts`, implement a global singleton Prisma client to avoid connection pool exhaustion during hot reload.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit / Component (No frontend components created in this step):**
  - [x] `N/A` (Base initialization only).

- [x] **GREEN — Frontend (No types/components created in this step):**
  - [x] `N/A`.

- [x] **Verification chain:**
  - [x] Running `npx prisma db pull` succeeds without errors → `npx prisma generate` builds client types → prisma queries return record sets in terminal console → ✅ Done.

---

### Phase 3 — Authentication & Dual-Hash Migration

#### W-301 — Session Login & Password Dual-Hash Upgrade

**Goal:**
Legacy users log in via SHA-256 credentials. We must authenticate them securely and migrate them to `bcrypt` hashes on-the-fly when they login successfully, upgrading database credentials security seamlessly.

**Approach:**
Implement NextAuth credentials provider. Upon authentication check:
1. Query user by `username` or `email` from database.
2. If user password matches SHA-256 hash of input password, authenticate successfully AND trigger async background service to update password hash in the database to a modern `bcrypt` hash.
3. If user password is already a bcrypt hash, verify using `bcrypt.compare`.

---

- [x] **RED — Integration (`auth_flow.test.ts`):**
  - [x] Test: `POST /api/auth/callback/credentials` with username `'admin'` and password `'admin123'`. Assert cookie session is set and response is `200 OK`.
  - [x] Test: Query database for `'admin'` after successful login and assert that `password` field starts with `"$2b$"` (indicating it was automatically upgraded from the legacy SHA-256 hash to a bcrypt hash).
  - [x] **Run — confirm RED (authentication route handler does not exist).**

- [x] **GREEN — Backend (Repository → Service → NextAuth Route):**
  - [x] [Repository] In `src/repository/user.repository.ts`, implement `findByCredential(identifier: string)`.
  - [x] [Service] In `src/service/auth.service.ts`, implement `verifyAndMigratePassword(passwordRaw: string, passwordHashDb: string, userId: number)` returning boolean and triggering update.
  - [x] [Controller] Create NextAuth Route Handler `src/app/api/auth/[...nextauth]/route.ts` configuring credentials provider to call `authService`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`LoginForm.test.tsx`):**
  - [x] Test: Clicking login button triggers NextAuth's `signIn` with credentials.
  - [x] Test: Invalid credentials display an alert "Invalid username or password".
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] Create login session types and form models in `src/types/auth.ts`.
  - [x] [Component] Build page `src/app/login/page.tsx` with a stylized modern login card using CSS grids and layout, handling submission state and redirection.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] User navigates to `/login` → submits legacy credentials (SHA-256) → dashboard loads → DB record is updated to bcrypt → User logs out and logs back in successfully → ✅ Done.

---

### Phase 4 — Authorization & Page Guard System

#### W-401 — Permission checking & Page Guards

**Goal:**
Restrict access to page actions, navigation components, and API routes based on permission integers stored in `users.user_permissions`.

**Approach:**
Create authorization helpers `hasPermission(user, permissionId)`. Implement server-side redirects in layouts/pages and restrict UI client rendering using helper hooks.

---

- [ ] **RED — Integration (`authorization.test.ts`):**
  - [ ] Test: GET `/api/vendors` with a session for a user *without* permission code `160`. Assert response is `403 Forbidden`.
  - [ ] Test: GET `/api/vendors` with a session for a user *with* permission code `160` or `99999`. Assert response is `200 OK`.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Backend (Service → Middleware Guard):**
  - [ ] [Service] Implement `src/service/permission.service.ts` containing permission evaluations (checking if user permissions list contains key or super-admin `99999`).
  - [ ] [Controller] Guard backend API endpoints and Server Actions by resolving the session and calling the checking service.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit / Component (`SideNavigation.test.tsx`):**
  - [ ] Test: Render Sidebar. If user session permissions exclude `160`, assert that the "All Vendors" link is NOT rendered in the navigation menu.
  - [ ] Test: If user session permissions include `160`, assert "All Vendors" link is rendered.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Hook → Component):**
  - [ ] [Hook] Implement `usePermission` hook mapping user context.
  - [ ] [Component] In `Sidebar.tsx`, wrap the list items with conditional logic checking permissions.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Agent logs in without Vendor View permissions (`160`) → Side navigation excludes vendor items → Agent manually browses to `/vendors` → Page renders "Access Denied" page template → ✅ Done.

---

### Phase 5 — Agent Management (CRUD)
*   **Goal:** Allow admins (with permission `162`/`163`) to create, update permissions, toggle active status, and view details of agents.
*   **TDD Test Coverage:**
    *   `POST /api/agents` payload updates database structure.
    *   `GET /api/agents?status=0` filters by inactive agents.
    *   Validates permissions check before writing new records.

### Phase 6 — Customer & Sensitive Cards Ledger
*   **Goal:** CRUD for `crm_customers` and `crm_customer_cards`. Sensitive details (card number, cvv) are protected behind permission `204`.
*   **TDD Test Coverage:**
    *   Assert non-permitted sessions fetch customers list successfully, but card numbers return masked (e.g. `**** **** **** 1234`).
    *   Assert permitted sessions (with code `204`) receive raw details.

### Phase 7 — Vendor Management
*   **Goal:** Manage company contacts in `crm_vendors` and handle active/blacklist toggle.
*   **TDD Test Coverage:**
    *   Toggle endpoint changes `vendor_status` from `1` to `0` and asserts in DB.
    *   Vendors reports returns list of active orders linked.

### Phase 8 — Gateway Setup & Aggregated Reports
*   **Goal:** Manage gate records in `crm_gateway` and display aggregate charts of gateway transaction totals (monthly totals, refund ratios).
*   **TDD Test Coverage:**
    *   Calculation logic: verify sums of amount charged per gateway matches test db totals.

### Phase 9 — Order Intake & Sales Pipeline
*   **Goal:** Implement the order submission page (linking customer creation, card capture, and order creation in a single transaction). Manage the workflow status queues (Pending Tracking, Pending Delivery).
*   **TDD Test Coverage:**
    *   Validation test: empty or missing VIN or quotation fields return validation error.
    *   State transition: updating tracking number automatically transitions `order_current_status` to "Pending Delivery".

### Phase 10 — Interactive Sales Dashboard
*   **Goal:** Aggregate dashboard data (Total Sales, Monthly Sales, Net Sales) for widgets with detail grids, guarded by permission IDs.
*   **TDD Test Coverage:**
    *   Verify dashboard counts include/exclude refunds and chargebacks appropriately based on SQL calculations logic.

### Phase 11 — Comments & Audits System
*   **Goal:** Append logs and screenshots to order details.
*   **TDD Test Coverage:**
    *   Comment creation appends record to database and links files upload correctly.

### Phase 12 — Attendance Logging System
*   **Goal:** Daily dashboard sheet to mark agent attendance.
*   **TDD Test Coverage:**
    *   Marking attendance registers status and locks record on date.

### Phase 13 — Unified Search
*   **Goal:** Full text query engine filtering through orders and customer records.
*   **TDD Test Coverage:**
    *   Assert search results return partial matches on client name, model, vin, and agent name.

---

## 3. Session Notes

### Session 1 — June 23, 2026

*   **Docker Container Provisioning (Phase 1):** Configured and spun up a local MySQL 8.0 Docker container (`jd_crm_db`) mapping to port 3306.
*   **Schema & Seeding (Phase 1):** Imported baseline schema from `crm_php/jd_crm_schema.sql` and initialized baseline tables. Wrote and executed `seed.sql` to populate initial designations and the admin user.
*   **Next.js & Prisma Scaffolding (Phase 2):** Initialized the Next.js TypeScript App Router environment. Installed `vitest` for test running, `prisma` CLI, `@prisma/client`, and the required Prisma 7 MySQL/MariaDB driver adapter (`@prisma/adapter-mariadb` and `mariadb`).
*   **Prisma 7 Compatibility:** Migrated from legacy native query engines to JavaScript driver-based connection pooling using `PrismaMariaDb` adapter. Formatted `schema.prisma` to comply with Prisma 7 config patterns (removing `url` from the database datasource block and configuring it in `prisma.config.ts`).
*   **Database Migrations:** Ran `npx prisma migrate dev` to generate migrations (`init_jd_crm_schema`) and create InnoDB-engine tables with actual foreign key constraints at the database layer.
*   **Team Relation Feature Add:**
    *   Created `CrmTeams` model and established a strict foreign key relation where every employee (`Users`) belongs to a team.
    *   Added teams schema documentation in `database_schema.md`.
    *   Updated `seed.sql` to create three default teams (`IT Park`, `DB Park`, `Alex`) and assign the default admin to `IT Park`.
    *   Applied new migration `add_teams_relation` to database.
*   **Integration Verification:** Wrote [db_connection.test.ts](src/tests/db_connection.test.ts) to verify query functionality, including retrieving seeded designations, teams, and the admin user with team info. Verified that the test is fully passing.

### Session 2 — June 23, 2026

*   **TypeScript NextAuth Extension:** Created type definitions in [next-auth.d.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/types/next-auth.d.ts) to augment NextAuth's `Session`, `User`, and `JWT` interfaces, enabling type-safe access without `any` casts.
*   **ESLint Warnings Fixed:** Cleared all warnings and errors in [route.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/api/auth/%5B...nextauth%5D/route.ts), [LoginForm.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/LoginForm.tsx), and [LoginForm.test.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/tests/LoginForm.test.tsx).
*   **Robust Test Assertion:** Refactored [db_connection.test.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/tests/db_connection.test.ts) to assert that default teams exist in the database without failing if the seed script runs multiple times.
*   **Validation:** Verified that `npm run lint`, `npm run typecheck`, and `npm run test` are fully passing and clean.

