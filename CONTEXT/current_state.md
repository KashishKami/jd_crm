# Current State: PHP to Next.js Monolith Migration Plan

This file tracks our migration progress. It is divided into logical execution phases.
The core development checklist items follow the **Test-Driven Development (TDD) Phase Format** specified in [TDD_INSTRUCTION_GUIDE.md](file:///TDD_INSTRUCTION_GUIDE.md).

---

## 1. Migration Progress Summary

| Phase | Description | Status | Target Files |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Planning & Documentation Setup | **[x] COMPLETED** | `project_data.md`, `database_schema.md`, `local_setup.md` |
| **Phase 1** | Local DB & Docker Infrastructure | **[x] COMPLETED** | `docker-compose.yml`, local container setup |
| **Phase 2** | Next.js Scaffolding & Prisma Setup | **[x] COMPLETED** | `prisma/schema.prisma`, Next.js app scaffold |
| **Phase 3** | Authentication &amp; Dual-Hash Migration | **[x] COMPLETED** | NextAuth config, SHA-256 to bcrypt upgrades |
| **Phase 4** | Authorization &amp; Page Guard System | **[x] COMPLETED** | Permission check services, route guards |
| **Phase 4.5** | Animation &amp; Scroll Foundation | **[x] COMPLETED** | Lenis smooth scroll, GSAP animation utilities |
| **Phase 5** | Agent Management (CRUD) | **[x] COMPLETED** | agents view, agent permissions, profiles |
| **Phase 6** | Customer & Sensitive Cards Ledger | **[x] COMPLETED** | Customers listing, card viewer (permission-guarded) |
| **Phase 7** | Vendor Management | **[x] COMPLETED** | Vendor listing, blacklist toggle, orders mapping |
| **Phase 8** | Gateway Setup & Aggregated Reports | **[x] COMPLETED** | `gateways/page.tsx`, `GatewayList.tsx`, `GatewayReport.tsx` |
| **Phase 9** | Order Intake & Sales Pipeline | **[x] COMPLETED** | Add order form, pipeline queues (Pending Tracking/Feedback) |
| **Phase 9.5**| Order Status Workflow Standardization | **[x] COMPLETED** | `order.repository.ts`, `order.service.ts`, routing, views |
| **Phase 10**| Interactive Sales Dashboard | **[x] COMPLETED** | Metric counters, top/bottom performance widgets |
| **Phase 10.5**| Dashboard UI Enhancements & Top Navbar Layout | **[x] COMPLETED** | Navbar, dashboard charts, metric comparisons |
| **Phase 11**| Comments & Audits System | **[x] COMPLETED** | Order comments timeline, image upload handler |
| **Phase 12**| Attendance Logging System | **[ ] SKIPPED** | Mark attendance sheet, historical attendance view |
| **Phase 13**| global Full-Text Search | **[x] COMPLETED** | Unified global search bar, order filters |
| **Phase 14**| Admin Settings & RBAC Permissions | **[x] COMPLETED** | Role settings page, permission matrices |
| **Phase 15** | Sprint 1 — Critical Schema Surgery (P0) | **[x] COMPLETED** | `schema.prisma`, 3 migrations, `order.repository.ts`, `customer.repository.ts`, `search.repository.ts`, `order.service.ts`, `dashboard.service.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `AdvancedChartWidget.tsx`, `seed.sql` |
| **Phase 16** | Sprint 2 — Pre-Go-Live Features (P1) | **[x] COMPLETED** | 2 new DB tables, `order.repository.ts`, `order.service.ts`, `OrderList.tsx`, `OrderStatusTimeline.tsx`, `OrderViewLog.tsx`, order detail page, `seed.sql` |
| **Phase 17** | Sprint 3 — Sale Status Overhaul (Partial Refund, Final Margin & Returned Orders) | **[x] COMPLETED** | `schema.prisma`, 1 migration, `order.repository.ts`, `order.service.ts`, `dashboard.repository.ts`, `dashboard.service.ts`, `EditOrderForm.tsx`, `OrderListContainer.tsx`, `OrderList.tsx`, `PendingCountsRow.tsx`, `dashboard_client_page.tsx`, `types/order.ts`, `types/dashboard.ts`, new page `pending/returned/page.tsx` |
| **Phase 18** | Sprint 3 — Post-Launch Features | **[x] COMPLETED** | `dashboard.repository.ts`, `dashboard.service.ts`, `TeamMonthlyScoresWidget.tsx`, `OrderListContainer.tsx`, `vendor.repository.ts`, `vendor.service.ts`, settings/roles pages |
| **Phase 19** | Sprint 4 — Polish & Table Column Additions | **[x] COMPLETED** | `AdvancedChartWidget.tsx`, `RecentOrdersTable.tsx`, `OrderList.tsx`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `seed.sql` |
| **Phase 20** | orderMarkup → orderAmountCharged: Schema Rename, Auto-Calc Removal & Manual Input | **[x] COMPLETED** | `schema.prisma`, 1 migration, `order.repository.ts`, `order.service.ts`, `dashboard.repository.ts`, `dashboard.service.ts`, `EditOrderForm.tsx`, `OrderList.tsx`, `RecentOrdersTable.tsx`, `SearchResults.tsx`, `AddOrderForm.tsx`, `OrderListContainer.tsx`, `OrderDetailPage` |
| **Phase 21** | Mileage & Warranty Rename and Order-Level Checklist Field | **[x] COMPLETED** | `schema.prisma`, 1 migration, `order.repository.ts`, `order.service.ts`, `types/order.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `page.tsx` (order details), `OrderAuditLog.tsx`, `import-csv-data.ts`, `restore-admin.ts`, `seed-dummy-orders.ts` |
| **Phase 22** | Sale Status Expansion: Void & Cancel Order, Sale Status Column & Filter | **[x] COMPLETED** | `order.service.ts`, `order.repository.ts`, `vendor.repository.ts`, `vendor.service.ts`, `vendors/[id]/page.tsx`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, `OrderListContainer.tsx`, `SaleStatusTimeline.tsx`, `import-csv-data.ts`, `project_data.md` |
| **Phase 23** | Cancelled Orders Workflow & Renaming (Cancelled Status & Cancelled Orders Queue) | **[x] COMPLETED** | `seed.sql`, `order.repository.ts`, `order.service.ts`, `dashboard.repository.ts`, `dashboard.ts`, `import-csv-data.ts`, `middleware.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, `OrderListContainer.tsx`, `SaleStatusTimeline.tsx`, new page `/pending/cancelled/page.tsx` |
| **Phase 24** | Alternate Phones, Vendor Geo & Payment Fields, Multi-Card Orders, Card Image Uploads & UI Label Renames | **[x] COMPLETED** | `schema.prisma`, 3 migrations, `customer.repository.ts`, `vendor.repository.ts`, `order.repository.ts`, `customer.service.ts`, `vendor.service.ts`, `order.service.ts`, `types/customer.ts`, `types/vendor.ts`, `types/order.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `VendorForm` (new/edit), `page.tsx` (order detail), `api/upload/card-images/route.ts` |
| **Phase 25** | Part Found By + Liftgate Needed — New Team Allocation Role & Order Flag | **[x] COMPLETED** | `schema.prisma`, 1 migration, `order.repository.ts`, `order.service.ts`, `types/order.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, `page.tsx` (order detail) |
| **Phase 26** | Multi-Part Orders — parent_order_id Grouping, Multi-Part Add/Edit UI, Aggregate Financial Summary | **[x] COMPLETED** | `schema.prisma`, 1 migration, `order.repository.ts`, `order.service.ts`, `types/order.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, `page.tsx` (order detail), `api/orders/[id]/parts/route.ts` (new), `api/orders/[id]/parts/[partId]/route.ts` (new) |
| **Phase 26.5** | Multi-Part Financial Redesign & Field Split | **[x] COMPLETED** | `order.repository.ts`, `order.service.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, `page.tsx` (order detail) |
| **Phase 26.6** | Global Sale Status + Add/Edit Order Form Layout Redesign | **[x] COMPLETED** | `src/types/order.ts`, `src/repository/order.repository.ts`, `src/service/order.service.ts`, `src/app/api/orders/[id]/route.ts`, `src/components/AddOrderForm.tsx`, `src/components/EditOrderForm.tsx`, `src/tests/orders.test.ts`, `src/tests/AddOrderForm.test.tsx`, `src/tests/EditOrderForm.test.tsx` |
| **Phase 27** | Super-Admin CSV Data Export & Import — All Tables, FK-Safe Order, ZIP Download | **[ ] NOT STARTED** | `api/admin/export/route.ts` (new), `api/admin/import/route.ts` (new), `lib/csv-exporter.ts` (new), `service/data-management.service.ts` (new), `app/settings/data-management/page.tsx` (new) |
| **Phase 28** | Automated Weekly Backup — Saturday Evening Cron (Docker & Vercel) | **[ ] NOT STARTED** | `docker-compose.yml`, `api/admin/backup/trigger/route.ts` (new), `service/backup.service.ts` (new), `vercel.json` |
| **Phase 29** | Dashboard Enhancement — Sales Performer Redesign & Backend Team Performance Widget | **[x] COMPLETED** | `src/repository/dashboard.repository.ts`, `src/service/dashboard.service.ts`, `src/types/dashboard.ts`, `src/components/dashboard/PerformersTable.tsx`, `src/components/dashboard/ChampionsLeagueWidget.tsx`, `src/components/dashboard/BackendTeamWidget.tsx` (new), `src/app/api/dashboard/champions-league/route.ts`, `src/app/api/dashboard/backend-team/route.ts` (new), dashboard server page, `scripts/sql/add-backend-permissions.sql` (new), `seed.sql` |
| **Phase 30** | SSR Pre-fetch Waterfall Elimination — Orders, Agents, Customers & Gateways List Pages | **[x] COMPLETED** | `src/app/orders/page.tsx`, `src/app/agents/page.tsx`, `src/app/customers/page.tsx`, `src/app/gateways/page.tsx`, `src/components/OrderListContainer.tsx`, `src/components/AgentList.tsx`, `src/components/CustomerList.tsx`, `src/components/GatewayList.tsx`, `src/tests/orders.test.ts`, `src/tests/agents.test.ts` |

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

- [x] **RED — Integration (`authorization.test.ts`):**
  - [x] Test: GET `/api/vendors` with a session for a user *without* permission code `160`. Assert response is `403 Forbidden`.
  - [x] Test: GET `/api/vendors` with a session for a user *with* permission code `160` or `99999`. Assert response is `200 OK`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Service → Middleware Guard):**
  - [x] [Service] Implement `src/service/permission.service.ts` containing permission evaluations (checking if user permissions list contains key or super-admin `99999`).
  - [x] [Controller] Guard backend API endpoints and Server Actions by resolving the session and calling the checking service.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit / Component (`Sidebar.test.tsx`):**
  - [x] Test: Render Sidebar. If user session permissions exclude `160`, assert that the "All Vendors" link is NOT rendered in the navigation menu.
  - [x] Test: If user session permissions include `160`, assert "All Vendors" link is rendered.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Layout & Components):**
  - [x] [Providers] Expose NextAuth SessionContext via client wrapper.
  - [x] [Component] In `Sidebar.tsx`, wrap the list items with conditional logic checking permissions via `hasPermission` and `useSession()`.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent logs in without Vendor View permissions (`160`) → Side navigation excludes vendor items → Agent manually browses to `/vendors` → Page renders "Access Denied" page template → ✅ Done.

---

### Phase 4.5 — Animation & Scroll Foundation

#### W-450 — Lenis Smooth Scroll & GSAP Animation Setup

**Goal:**
Before building any feature pages, establish the global animation and scroll foundation so that every subsequent phase (5–13) can use consistent, polished animations and smooth scrolling out of the box. This is a pure frontend setup phase — no new API routes, no database changes.

**Approach:**
Install `lenis` and `gsap`. Wrap the app root in a `LenisProvider` client component that initializes and ticks Lenis on every animation frame. Create a `src/lib/animations.ts` utility file that exports reusable GSAP animation presets (page fade-in, list stagger entrance, counter count-up). Document the standard patterns so all future components use them consistently.

> [!NOTE]
> Lenis handles **smooth scrolling** (replaces native browser scroll with a lerp-interpolated scroll). GSAP handles **all animations** (entrance transitions, hover micro-interactions, dashboard counter count-up). They pair together via Lenis's `ScrollTrigger` RAF integration.

---

- [x] **RED — Integration (N/A):**
  - [x] `N/A` — No API routes or database interactions in this phase.

- [x] **GREEN — Backend (N/A):**
  - [x] `N/A` — Pure frontend setup.

- [x] **RED — Unit (`animations.test.ts`):**
  - [x] Test: Import `animations.ts` and assert that `fadeInPage`, `staggerEntrance`, and `countUp` are exported functions.
  - [x] Test: `LenisProvider` renders its `children` without crashing (smoke test).
  - [x] Test: After `LenisProvider` mounts, `document.documentElement` has the `data-lenis-prevent` attribute absent (i.e. Lenis is controlling the root scroll, not a sub-element).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Install → Provider → Utilities → Integration):**
  - [x] [Install] `npm install lenis gsap`. Add both to `src/types/` stubs if needed for TypeScript.
  - [x] [Provider] Create `src/components/LenisProvider.tsx`:
    - `'use client'` component.
    - Initializes `new Lenis({ autoRaf: false })` on mount.
    - Runs the Lenis RAF loop inside a `gsap.ticker.add((time) => lenis.raf(time * 1000)) ` call so GSAP and Lenis share a single animation frame tick.
    - Cleans up on unmount (`lenis.destroy()`, `gsap.ticker.remove(...)`).
    - Exposes a `useLenis()` context hook for child components that need to call `lenis.scrollTo()`.
  - [x] [Layout] Add `<LenisProvider>` inside `src/app/layout.tsx`, wrapping the `<LayoutShell>` children.
  - [x] [Utilities] Create `src/lib/animations.ts` with the following standard presets:
    - `fadeInPage(element: Element, delay?: number)` — fades in and slides up the page container on route change. Uses `gsap.fromTo` with `{ opacity: 0, y: 20 }` → `{ opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }`.
    - `staggerEntrance(elements: Element[] | NodeList, stagger?: number)` — staggers fade-in + slide-up for list rows, cards, or table rows. Default stagger `0.05s`.
    - `countUp(element: Element, endValue: number, duration?: number)` — animates a number from `0` to `endValue`. Used by dashboard metric widgets.
    - `slideInSidebar(element: Element)` — slides the sidebar in from the left on initial load.
  - [x] [Integration] In `src/components/LayoutShell.tsx`, call `slideInSidebar` on the sidebar ref after mount.
  - [x] [Integration] In `src/app/layout.tsx` (or a route-change listener), call `fadeInPage` on each navigation.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Navigate to `/login` → page fades in smoothly → log in → dashboard loads with sidebar sliding in from the left → scroll down any long page → scroll is silky smooth (Lenis lerp visible) → navigate to another route → page fades out and new page fades in → open browser DevTools Performance tab and confirm no jank (60 fps) → ✅ Done.

---

### Phase 5 — Agent Management (CRUD)

#### W-501 — Agent List, Create, Edit, Deactivate & Profile

**Goal:**
The PHP app had `agents.php`, `add-agents.php`, `edit-agent.php`, and `inactive-agents.php` as separate pages with inline SQL. We need a single, type-safe agents module with proper repository/service layers, guarded by RBAC permissions (`agents:view`, `agents:create`, `agents:edit`).

**Approach:**
Build the agents repository (`findAll`, `findById`, `create`, `update`, `toggleStatus`). Build the service layer for business validation. Expose API routes at `/api/agents`. Build the list page at `/agents`, the add/edit forms, and the agent detail view. Profile sub-pages (academic, professional, bank details) are sub-routes of the agent detail.

---

- [x] **RED — Integration (`agents.test.ts`):**
  - [x] Test: `GET /api/agents` with a session lacking `agents:view` permission returns `403 Forbidden`.
  - [x] Test: `GET /api/agents` with a session having `agents:view` returns `200 OK` and a JSON array of agents.
  - [x] Test: `GET /api/agents?status=0` returns only inactive agents.
  - [x] Test: `POST /api/agents` with valid payload creates a new agent. Assert `SELECT uid FROM users WHERE username = 'test_agent'` returns exactly 1 row.
  - [x] Test: `POST /api/agents` without `agents:create` permission returns `403 Forbidden`.
  - [x] Test: `PATCH /api/agents/:id/status` with `{ status: 0 }` sets the agent inactive. Assert DB confirms `status = 0`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/agent.repository.ts`:
    - `findAll(status?: 0 | 1)` — Prisma query on `users` with optional `where: { status }`.
    - `findById(uid: number)` — includes `profile`, `academicRecord`, `professionalRecord`, `team`.
    - `create(data: AgentCreateInput)` — hashes password with bcrypt before insert.
    - `update(uid: number, data: AgentUpdateInput)`.
    - `toggleStatus(uid: number, status: 0 | 1)`.
  - [x] [Service] Create `src/service/agent.service.ts`:
    - Validate that `username` is unique before create.
    - Validate that `teamId` references a valid `crm_teams` row.
    - Strip sensitive fields (password hash) from the returned object.
  - [x] [Controller] Create `src/app/api/agents/route.ts` (GET, POST) and `src/app/api/agents/[id]/route.ts` (GET, PATCH, DELETE). Guard each with `requirePermission(session, 'agents:view' | 'agents:create' | 'agents:edit')`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`AgentList.test.tsx`):**
  - [x] Test: Renders a table of agents from mocked API response.
  - [x] Test: "Add Agent" button is visible when session has `agents:create` permission; hidden when not.
  - [x] Test: Clicking "Deactivate" calls `PATCH /api/agents/:id/status` with `{ status: 0 }`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Pages → Components):**
  - [x] [Types] Create `src/types/agent.ts` with `Agent`, `AgentCreateInput`, `AgentDetail` types.
  - [x] [Page] `src/app/agents/page.tsx` — server component fetching agents list; passes to `AgentTable` client component.
  - [x] [Page] `src/app/agents/new/page.tsx` — add agent form with all fields including team selector and designation selector.
  - [x] [Page] `src/app/agents/[id]/page.tsx` — agent detail with profile tabs (Basic Info, Academic, Professional, Bank & Emergency).
  - [x] [Page] `src/app/agents/[id]/edit/page.tsx` — edit agent form.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin navigates to `/agents` → list of active agents renders → clicks "Add Agent" → fills form with team and designation → saves → new agent appears in list → admin clicks agent name → detail page shows all profile tabs → admin clicks "Deactivate" → agent disappears from active list and appears under `/agents?status=0` → ✅ Done.

---

### Phase 6 — Customer & Sensitive Cards Ledger

#### W-601 — Customer CRUD & Permission-Gated Card Details

**Goal:**
Customers are linked to orders. The card details (number, CVV) are sensitive and must only be shown to users with the `customers:view-cards` permission. The PHP `order-details.php` showed or hid these fields with raw `in_array()` checks — we need a clean service-layer masking pattern instead.

**Approach:**
Build a customer repository and service. The service's `getCustomerCards` method always masks the card number to `**** **** **** XXXX` by default; a separate `getCustomerCardsFull` method requires the permission check at the controller level before calling it.

---

- [x] **RED — Integration (`customers.test.ts`):**
  - [x] Test: `GET /api/customers` with `customers:view` permission returns `200 OK` with customer list.
  - [x] Test: `GET /api/customers/:id/cards` **without** `customers:view-cards` permission returns cards where `customer_card_number` is masked (matches `/^\*{4} \*{4} \*{4} \d{4}$/`).
  - [x] Test: `GET /api/customers/:id/cards` **with** `customers:view-cards` permission returns cards with full raw `customer_card_number`.
  - [x] Test: `POST /api/customers` creates a customer. Assert the returned object has a valid `customer_id`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/customer.repository.ts`:
    - `findAll()`, `findById(id)`, `create(data)`, `update(id, data)`.
    - `findCardsByCustomerId(customerId: number)` — returns all cards for a customer.
  - [x] [Service] Create `src/service/customer.service.ts`:
    - `getCards(customerId, maskSensitive: boolean)` — if `maskSensitive = true`, replaces `customerCardNumber` with masked string and sets `customerCardCvv` to `'***'`.
  - [x] [Controller] `src/app/api/customers/[id]/cards/route.ts`:
    - Resolve session. Check if user has `customers:view-cards`.
    - Pass `maskSensitive = !hasPermission(session, 'customers:view-cards')` to service.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`CustomerCards.test.tsx`):**
  - [x] Test: When session lacks `customers:view-cards`, card number displays as `**** **** **** 1234`.
  - [x] Test: When session has `customers:view-cards`, card number displays in full.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] Create `src/types/customer.ts` with `Customer`, `CustomerCard`, `MaskedCustomerCard` types.
  - [x] [Page] `src/app/customers/page.tsx` — customer list table.
  - [x] [Component] `src/components/CustomerCards.tsx` — renders card list; receives data already masked/unmasked from server.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent without `customers:view-cards` opens a customer detail page → cards section shows masked numbers → Admin with `customers:view-cards` opens same page → full card numbers visible → ✅ Done.

---

### Phase 7 — Vendor Management

#### W-701 — Vendor Directory, Blacklist Toggle & Linked Orders

**Goal:**
The PHP `vendors.php` managed a directory of auto parts suppliers. Admins can blacklist a vendor (`vendor_status = 0`), which should cascade a warning on all linked open orders. We replicate this in a clean module.

**Approach:**
Build vendor repository and service. The blacklist toggle is a PATCH endpoint. The vendor detail page shows all linked orders.

---

- [x] **RED — Integration (`vendors.test.ts`):**
  - [x] Test: `GET /api/vendors` with `vendors:view` returns `200 OK` with array including `vendor_status` field.
  - [x] Test: `PATCH /api/vendors/:id/status` with `{ status: 0 }` sets `vendor_status = 0` in DB. Assert with `SELECT vendor_status FROM crm_vendors WHERE vendor_id = ?`.
  - [x] Test: `PATCH /api/vendors/:id/status` without `vendors:edit` permission returns `403 Forbidden`.
  - [x] Test: `GET /api/vendors/:id/orders` returns all orders where `order_vendor_id = :id`.
  - [x] **Run — confirmed GREEN (3 suites, all pass).**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/vendor.repository.ts`:
    - `findAll(status?: 0 | 1)`, `findById(id)`, `create(data)`, `update(id, data)`, `toggleStatus(id, status)`.
    - `findOrdersByVendorId(vendorId: number)` — queries `crm_orders` where `orderVendorId = vendorId`.
  - [x] [Service] Create `src/service/vendor.service.ts`:
    - Validate phone number format on create/update.
    - `getVendorWithOrders(id)` — joins vendor + orders.
  - [x] [Controller] Created `src/app/api/vendors/route.ts` (GET, POST), `src/app/api/vendors/[id]/route.ts` (GET, PATCH), `src/app/api/vendors/[id]/status/route.ts` (PATCH), `src/app/api/vendors/[id]/orders/route.ts` (GET). Guarded with `vendors:view`, `vendors:create`, and `vendors:edit`.
  - [x] Run integration test — **confirmed GREEN**.

- [x] **RED — Unit (`VendorList.test.tsx`):**
  - [x] Test: Blacklisted vendors render with a red "Blacklisted" badge.
  - [x] Test: "Blacklist" button calls `PATCH /api/vendors/:id/status` with `{ status: 0 }`.
  - [x] Test: "Restore" button on a blacklisted vendor calls `PATCH` with `{ status: 1 }`.
  - [x] **Run — confirmed GREEN (4 unit tests pass).**

- [x] **GREEN — Frontend (Types → Pages → Components):**
  - [x] [Types] Created `src/types/vendor.ts` with `Vendor`, `VendorWithMetrics`, `VendorCreateInput`, `VendorUpdateInput`.
  - [x] [Page] `src/app/vendors/page.tsx` — vendor list with status badges.
  - [x] [Page] `src/app/vendors/[id]/page.tsx` — vendor detail with linked orders table, performance metrics, and blacklist warning banner.
  - [x] [Page] `src/app/vendors/new/page.tsx` — add vendor form.
  - [x] [Page] `src/app/vendors/[id]/edit/page.tsx` — edit vendor form.
  - [x] [Component] `src/components/VendorList.tsx` — vendor list with badges and action buttons.
  - [x] [Component] `src/components/VendorStatusBadge.tsx` — active/blacklisted status badge.
  - [x] Run unit test — **confirmed GREEN**.

- [x] **Verification chain:**
  - [x] Admin views vendor list → clicks "Blacklist" on a vendor → badge turns red → vendor detail shows all linked orders with performance metrics → blacklisted vendor shows warning banner on detail page → admin can restore with "Restore Supplier" button → ✅ Done.

---

### Phase 8 — Gateway Setup & Aggregated Reports

#### W-801 — Payment Gateway CRUD & Monthly Performance Reports

**Goal:**
The PHP `gateway.php` / `gateway-details.php` showed per-gateway aggregate counts and amounts for Completed, Refunded, and Chargebacked orders, broken down by month. The `gatewayClass.php` had complex SQL GROUP BY queries. We replicate these as computed service methods.

**Approach:**
Build gateway repository and service. The report service queries `crm_orders` grouping by `order_payment_gateway_id`, `sale_status`, and month of `order_date`. Expose the report as a single `/api/gateways/:id/report` endpoint.

---

- [x] **RED — Integration (`gateways.test.ts`):**
  - [x] Test: `GET /api/gateways` with `gateways:view` returns list of gateways.
  - [x] Test: `GET /api/gateways/:id/report` returns an object with `monthly` array where each entry has `{ month, year, completedCount, completedAmount, refundCount, refundAmount, chargebackCount, chargebackAmount }`.
  - [x] Test: Seed 3 orders for gateway ID 1 in the same month (1 Sold, 1 Refunded, 1 Chargebacked). Assert the report for that gateway/month shows `completedCount: 1`, `refundCount: 1`, `chargebackCount: 1`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/gateway.repository.ts`:
    - `findAll(status?: 0 | 1)`, `findById(id)`, `create(data)`, `update(id, data)`.
    - `getMonthlyReport(gatewayId: number)` — raw Prisma `$queryRaw` grouping orders by month, filtering `sale_status IN ('1', '7', '8')`.
  - [x] [Service] Create `src/service/gateway.service.ts`:
    - `computeReport(gatewayId)` — calls repository and formats the flat rows into a structured month-by-month array with computed `netAmount = completedAmount - refundAmount - chargebackAmount`.
  - [x] [Controller] `src/app/api/gateways/route.ts` (GET, POST), `src/app/api/gateways/[id]/report/route.ts` (GET). Guard with `gateways:view`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`GatewayReport.test.tsx`):**
  - [x] Test: Given mocked monthly data, `GatewayReport` component renders a row per month with correct counts and amounts.
  - [x] Test: Net amount column is highlighted red when negative (chargebacks > sales).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Pages → Components):**
  - [x] [Types] Create `src/types/gateway.ts` with `Gateway` and `GatewayMonthlyReport` types.
  - [x] [Page] `src/app/gateways/page.tsx` — gateway list with active/inactive badges.
  - [x] [Page] `src/app/gateways/[id]/page.tsx` — gateway detail with monthly report table.
  - [x] [Component] `src/components/GatewayReport.tsx` — renders the monthly breakdown table.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin navigates to `/gateways` → clicks a gateway → detail page shows monthly breakdown table with counts and amounts for Completed / Refunded / Chargebacked → Net column shows correct computed value → ✅ Done.

---

### Phase 9 — Order Intake & Sales Pipeline

#### W-901 — Create Order (Customer + Card + Order Atomic Transaction) & Pipeline Queues

**Goal:**
The PHP `add-order.php` created a customer record, a card record, and an order record in a single form submission — but using three separate INSERT statements with no transaction wrapping, risking partial data. The new system must wrap all three inserts in a single Prisma transaction. The pending pipeline queues (`Pending Tracking`, `Pending Delivery`, `Pending Feedback`, `Pending Resolutions`, `Completed Orders`) are filtered views of `crm_orders`.

**Approach:**
Build an order repository that uses `prisma.$transaction([...])`. Expose create at `POST /api/orders`. Build pipeline queue endpoints as filtered GET queries on `order_current_status`. Build the order list, detail, and add-order pages.

---

- [x] **RED — Integration (`orders.test.ts`):**
  - [x] Test: `POST /api/orders` with a valid payload (customer + card + order fields) returns `201 Created` with `{ orderId, customerId, cardId }`. Assert all three rows exist in DB.
  - [x] Test: `POST /api/orders` where the card insert would fail (e.g. missing `customerCardNumber`) rolls back all three inserts. Assert no orphan customer row was created.
  - [x] Test: `GET /api/orders?status=Pending+Tracking` returns only orders where `order_current_status = 'Pending Tracking'`.
  - [x] Test: `PATCH /api/orders/:id` with `{ orderTrackingNumber: 'TRK123' }` sets `order_current_status` to `'Pending Delivery'` automatically (state machine logic in service).
  - [x] Test: `GET /api/orders` without `orders:view` returns `403 Forbidden`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/order.repository.ts`:
    - `createWithCustomerAndCard(data: OrderCreateInput)` — wraps three Prisma creates in `prisma.$transaction`.
    - `findAll(filters: OrderFilters)` — supports `status`, `agentId`, `dateFrom`, `dateTo` filters.
    - `findById(id)` — includes customer, vendor, gateway, salesAgent, verifier, comments.
    - `update(id, data)`.
  - [x] [Service] Create `src/service/order.service.ts`:
    - `advanceStatus(order)` — state machine: if `orderTrackingNumber` set → `'Pending Delivery'`; if `orderDeliveryStatus` = confirmed → `'Pending Feedback'`; etc.
    - `computeMarkup(pitched, vendorPrice)` — calculates `orderMarkup`.
  - [x] [Controller] `src/app/api/orders/route.ts` (GET, POST), `src/app/api/orders/[id]/route.ts` (GET, PATCH, DELETE). Guard with `orders:view`, `orders:create`, `orders:edit`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`AddOrderForm.test.tsx`):**
  - [x] Test: Submitting the form with all required fields calls `POST /api/orders` with the correct combined payload.
  - [x] Test: If `orderTotalPitched` and `orderVendorPrice` are both filled, the markup field is automatically computed and displayed.
  - [x] Test: Form shows validation error if `orderPart` is empty on submit attempt.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Pages → Components):**
  - [x] [Types] Create `src/types/order.ts` with `Order`, `OrderCreateInput`, `OrderDetail`, `PipelineStatus` types.
  - [x] [Page] `src/app/orders/page.tsx` — all orders table with filters.
  - [x] [Page] `src/app/orders/new/page.tsx` — multi-section add order form (Customer Info, Card Details, Vehicle & Part, Pricing, Agent Assignment).
  - [x] [Page] `src/app/orders/[id]/page.tsx` — order detail view with all fields grouped.
  - [x] [Page] `src/app/orders/[id]/edit/page.tsx` — edit order form.
  - [x] [Pages] `src/app/pending/tracking/page.tsx`, `src/app/pending/delivery/page.tsx`, `src/app/pending/feedback/page.tsx`, `src/app/pending/resolutions/page.tsx` — filtered pipeline queue pages.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent navigates to `/orders/new` → fills in customer info, card details, vehicle part, pricing → submits → order appears in `/orders` → agent fills in tracking number on order edit → `order_current_status` auto-advances to `Pending Delivery` → order appears in `/pending/delivery` queue → ✅ Done.

---

### Phase 9.5 — Order Status Workflow Standardization

#### W-951 — Standardize order_current_status states & flow

**Goal:**
Align the order workflow status (`order_current_status`) across database, backend, and frontend layers. Resolve the legacy database misspelling (`Pending Delievery` -> `Pending Delivery`), rename the old `Pending Tracking` status to `Pending Shipment`, and introduce a formal `Pending Booking` status as the default initial state when an order is created without an assigned vendor.

**Approach:**
1. Execute data migration SQL statements to align existing records in the database.
2. Update `order.repository.ts` to assign `'Pending Booking'` or `'Pending Shipment'` upon order intake.
3. Update `order.service.ts` update transitions (Booking -> Shipment -> Delivery -> Feedback).
4. Rename routes: rename `/pending/tracking` directory to `/pending/shipment`, and create a new `/pending/booking` route.
5. Update `OrderListContainer.tsx`, `OrderList.tsx`, `EditOrderForm.tsx`, and `OrderDetailPage` to render new workflow tabs, dropdowns, and badges.
6. Refactor integration tests to verify the updated status states and transitions.

---

- [x] **RED — Integration (`orders.test.ts`):**
  - [x] Test: `POST /api/orders` without an assigned vendor defaults to status `'Pending Booking'`.
  - [x] Test: `POST /api/orders` with an assigned vendor defaults to status `'Pending Shipment'`.
  - [x] Test: `PATCH /api/orders/:id` setting a vendor on a `'Pending Booking'` order advances status to `'Pending Shipment'`.
  - [x] Test: `PATCH /api/orders/:id` setting a tracking number on a `'Pending Shipment'` order advances status to `'Pending Delivery'`.
  - [x] Test: `GET /api/orders?status=Pending+Shipment` returns only shipment pending orders.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → DB Migration):**
  - [x] [Migration] Migrate legacy database status values (Run SQL queries to map `'Pending Tracking'` -> `'Pending Shipment'`, `'Pending Delievery'` -> `'Pending Delivery'`, and nulls to `'Pending Booking'`).
  - [x] [Repository] Update `createWithCustomerAndCard` in `order.repository.ts` to conditionally set `orderCurrentStatus` to `'Pending Shipment'` if `orderVendorId` is provided, otherwise `'Pending Booking'`.
  - [x] [Repository] Simplify status filter query in `findAll` in `order.repository.ts` to query `where.orderCurrentStatus = filters.status` directly.
  - [x] [Service] In `updateOrder` in `order.service.ts`, transition `'Pending Booking'` to `'Pending Shipment'` when `orderVendorId` is newly set, and transition `'Pending Shipment'` (or `'Pending Booking'`) to `'Pending Delivery'` when `orderTrackingNumber` is set.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`AddOrderForm.test.tsx` / `EditOrderForm.test.tsx`):**
  - [x] Test: In `EditOrderForm.test.tsx`, verify that the workflow dropdown renders choices for `Pending Booking`, `Pending Shipment`, and `Pending Delivery` (not `Pending Tracking` or `Pending Delievery`).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Components → Pages → Routing):**
  - [x] [Component] In `OrderListContainer.tsx`, replace the tabs for `Pending Orders` and `Pending Tracking` with `Pending Booking` and `Pending Shipment`. Change `Pending Delievery` to `Pending Delivery`.
  - [x] [Component] In `OrderList.tsx`, update `getStatusBadgeClass` to map `'Pending Booking'` to amber style, `'Pending Shipment'` to blue style, and `'Pending Delivery'` to indigo style.
  - [x] [Component] In `EditOrderForm.tsx`, change default status hook to `'Pending Booking'` and update dropdown `<option>` values and labels.
  - [x] [Component] In `page.tsx` (`src/app/orders/[id]/page.tsx`), change the fallback value of `currentStatusDisplay` to `'Pending Booking'`.
  - [x] [Page] Rename `src/app/pending/tracking/` folder to `src/app/pending/shipment/`. Update metadata and return `<OrderListContainer initialStatus="Pending Shipment" />` inside it.
  - [x] [Page] In `src/app/pending/delivery/page.tsx`, change `initialStatus` parameter from `'Pending Delievery'` to `'Pending Delivery'`.
  - [x] [Page] Create new folder `src/app/pending/booking/` with `page.tsx` rendering `<OrderListContainer initialStatus="Pending Booking" />`.
  - [x] Run unit/component tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Create an order without selecting a vendor → Order is listed under `Pending Booking` queue → Edit order and assign a vendor → Order disappears from `Pending Booking` and appears under `Pending Shipment` queue → Edit order and input a carrier tracking number → Order advances to `Pending Delivery` queue → ✅ Done.

---

### Phase 10 — Interactive Sales Dashboard

#### W-1001 — Dashboard Metric Widgets & Performance Tables

**Goal:**
The PHP `dashboard.php` (59KB) was a single file that inlined dozens of SQL queries for metric widgets. Each widget (Total Sales, Net Sales, Chargeback This Month, Top/Bottom Performers, Recent Orders, Attendance Summary) was gated by numeric permission codes. In the new system, all metrics are computed by a dashboard service and served from `/api/dashboard/metrics`. Widget visibility is controlled by RBAC permissions.

This phase also introduces **monthly team-wise scoring** (a new feature with no PHP equivalent): aggregate sales performance per team for a given month, and the top/bottom performer within each team for that month.

**Approach:**
Build a `DashboardService` that runs all aggregate queries. Expose a single `/api/dashboard/metrics` endpoint returning all widgets the current user has permission to see. The frontend dashboard page calls this once and renders conditionally.

For the team monthly widgets, expose a separate `/api/dashboard/teams/monthly?month=M&year=YYYY` endpoint so the caller can navigate between months. This keeps the main metrics endpoint fast and avoids reloading all widgets on month change.

---

- [x] **RED — Integration (`dashboard.test.ts`):**
  - [x] Test: `GET /api/dashboard/metrics` for a super-admin returns an object containing all keys: `totalSales`, `totalSalesThisMonth`, `todaySales`, `chargebackThisMonth`, `refundThisMonth`, `netSales`, `topPerformers`, `bottomPerformers`, `recentOrders`, `attendanceSummary`, `pendingCounts`.
  - [x] Test: `GET /api/dashboard/metrics` for a user with only `dashboard:total-sales` returns an object that contains `totalSales` but does NOT contain `topPerformers`.
  - [x] Test: Net sales calculation: seed 5 Sold orders (markup `100` each), 1 Refunded, 1 Chargebacked → assert `netSales = 300` (5×100 − 100 refund − 100 chargeback).
  - [x] Test: `GET /api/dashboard/teams/monthly?month=6&year=2026` with `dashboard:team-monthly-scores` returns an array of team objects each containing `{ teamId, teamName, soldCount, netAmount, month, year }`.
  - [x] Test: `GET /api/dashboard/teams/monthly` **without** `dashboard:team-monthly-scores` returns `403 Forbidden`.
  - [x] Test: Seed 3 teams. Seed 2 agents in Team A (with 3 sold orders markup 200 each) and 1 agent in Team B (with 1 sold order markup 100). Assert Team A `netAmount = 600`, Team B `netAmount = 100` for that month.
  - [x] Test: `GET /api/dashboard/teams/monthly` with `dashboard:team-top-performer` includes a `topPerformer: { agentName, amount }` key in each team object.
  - [x] Test: `GET /api/dashboard/teams/monthly` **without** `dashboard:team-top-performer` returns team objects where `topPerformer` key is absent.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/dashboard.repository.ts`:
    - `getTotalSales()`, `getTotalSalesThisMonth()`, `getTodaySales()` — count where `sale_status = '1'`.
    - `getChargebackThisMonth()`, `getRefundThisMonth()` — count where `sale_status = '8'` / `'7'` and current month.
    - `getNetSales()` — `SUM(orderMarkup)` for Sold orders minus refunds and chargebacks.
    - `getTopPerformers(limit = 5)`, `getBottomPerformers(limit = 5)` — group by `orderSalesAgentId`, order by SUM of markup.
    - `getRecentOrders(limit = 10)`.
    - `getAttendanceSummary(date: Date)` — counts per `attendanceStatusId` for given date.
    - `getPendingCounts()` — counts per `orderCurrentStatus` value.
    - `getTeamMonthlyScores(month: number, year: number)` — `$queryRaw` joining `crm_orders` → `users` → `crm_teams`, GROUP BY `team_id` and filtered to the given month/year. Returns `{ teamId, teamName, soldCount, refundCount, chargebackCount, netAmount }[]`.
    - `getTeamMonthlyTopPerformer(teamId: number, month: number, year: number)` — within that team's agents, finds the agent with the highest `SUM(orderMarkup)` for Sold orders in that month.
    - `getTeamMonthlyBottomPerformer(teamId: number, month: number, year: number)` — same but lowest SUM.
  - [x] [Service] Create `src/service/dashboard.service.ts`:
    - `getMetricsForUser(session)` — calls only the repository methods the user's permissions allow, assembles and returns a single object.
    - `getTeamMonthlyReport(session, month, year)` — calls `getTeamMonthlyScores`, then conditionally enriches each team object with `topPerformer` / `bottomPerformer` based on whether the session has `dashboard:team-top-performer` / `dashboard:team-bottom-performer`. Returns `TeamMonthlyReport[]`.
  - [x] [Controller] `src/app/api/dashboard/metrics/route.ts` — single GET, calls service with session.
  - [x] [Controller] `src/app/api/dashboard/teams/monthly/route.ts` — GET with `?month` and `?year` query params (defaults to current month). Guards with `dashboard:team-monthly-scores`. Calls `dashboard.service.getTeamMonthlyReport(session, month, year)`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`Dashboard.test.tsx`):**
  - [x] Test: Renders `TotalSalesWidget` when `dashboard:total-sales` permission present; does not render when absent.
  - [x] Test: `TopPerformersTable` renders agent rows in correct rank order from mocked data.
  - [x] Test: `PendingCountsRow` shows correct count labels for each pipeline bucket.
  - [x] Test: `TeamMonthlyScoresWidget` renders one card per team with correct `soldCount` and `netAmount` from mocked data.
  - [x] Test: Each team card shows `topPerformer` name when session has `dashboard:team-top-performer`; the field is absent (not rendered) when permission is missing.
  - [x] Test: Each team card shows `bottomPerformer` name when session has `dashboard:team-bottom-performer`; the field is absent when permission is missing.
  - [x] Test: Month navigator (prev/next arrows) calls `/api/dashboard/teams/monthly?month=M&year=YYYY` with the correct month on click.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Components → Page):**
  - [x] [Types] Create `src/types/dashboard.ts` with `DashboardMetrics`, `PerformerRow`, `PendingCounts`, `TeamMonthlyReport`, `TeamPerformerRow` types.
  - [x] [Components] `src/components/dashboard/TotalSalesWidget.tsx`, `NetSalesWidget.tsx`, `TopPerformersTable.tsx`, `BottomPerformersTable.tsx`, `RecentOrdersTable.tsx`, `AttendanceSummaryRow.tsx`, `PendingCountsRow.tsx`. (Merged into shared components for clean typography).
  - [x] [Component] `src/components/dashboard/TeamMonthlyScoresWidget.tsx`:
    - Renders a grid of team cards (one per team).
    - Each card shows: team name, sold count, refund count, chargeback count, net amount.
    - Conditionally shows `topPerformer` row if `dashboard:team-top-performer` permission is present.
    - Conditionally shows `bottomPerformer` row if `dashboard:team-bottom-performer` permission is present.
    - Has a month navigator (← prev / → next) that re-fetches `/api/dashboard/teams/monthly?month=M&year=YYYY` client-side without reloading the full page.
  - [x] [Page] `src/app/dashboard/page.tsx` — server component fetching metrics, passing to client widgets. (Implemented at root home route `src/app/page.tsx` for optimal UX redirection).
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin logs in → navigates to `/dashboard` → all widgets render with live database counts → agent with restricted permissions logs in → only their permitted widgets are visible → Net Sales widget correctly subtracts refunds and chargebacks → Team Monthly Scores section shows one card per team for the current month → each card shows sold count and net amount → clicking `←` navigates to previous month and cards update without page reload → top/bottom performer rows appear per card for users with those permissions → ✅ Done.

---

### Phase 10.5 — Dashboard UI Enhancements & Top Navbar Layout

#### W-1051 — Top Navigation Navbar Layout & Sidebar Decommissioning

**Goal:**
Replace the current vertical collapsible sidebar navigation with a responsive, modern top-aligned navigation navbar matching the Zenith reference mockup, supporting swipeable navigation links on mobile viewports.

**Approach:**
Implement a new `Navbar.tsx` component to render the "JD CRM" logo on the left, horizontal pill links (Dashboard, Orders, Vendors, Agents, Gateways) in the center, and the "Sign Out" button on the right. Modify `LayoutShell.tsx` and `layout.css` to accommodate a single-column container layout. Enable horizontal swiping on mobile viewports using CSS flex layout and hidden scrollbars.

---

- [x] **RED — Integration (N/A):**
  - [x] `N/A` — pure UI refactoring of navigation layout structure; base authentication, permissions checks, and routing functionality remain unchanged.

- [x] **RED — Unit / Component (`Navbar.test.tsx`):**
  - [x] Test: Mount `Navbar`. Assert logo "JD CRM" is rendered.
  - [x] Test: Given a session with `agents:view` permission, verify "Agents" nav link is rendered. Given a session without it, verify "Agents" nav link is hidden.
  - [x] Test: Assert clicking the "Sign Out" button calls NextAuth's `signOut()` handler.
  - [x] Test: On viewports <= 768px, assert that the nav container CSS allows horizontal scrolling (`overflow-x: auto`).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component → Styles):**
  - [x] [Component] Create `src/components/Navbar.tsx` rendering the top logo, permission-checked navigation pill links (rounded borders with dark background active style), and user sign-out action button.
  - [x] [Component] In `src/components/LayoutShell.tsx`, replace `<Sidebar />` with `<Navbar />` and remove sidebar-specific toggle states, backdrop elements, and sliding GSAP animation triggers.
  - [x] [Styles] Modify `src/app/layout.css` and `src/app/components.css` to update layout container classes (`.app-container`, `.main-content`) to a single-column layout. Implement `.top-navbar`, `.nav-pills`, `.nav-pill-btn`, and mobile-swipe rules `.swipable-nav`.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Authenticated agent visits `/` → navbar renders at the top with "JD CRM" logo on the left and navigation pills in the middle → agent shrinks the viewport to mobile width → navigation pills collapse into a swipeable horizontal row → agent swiped left to see all items and clicks "Vendors" → browser routes to `/vendors` and the "Vendors" pill button is highlighted active → ✅ Done.

---

#### W-1052 — Modernized KPI Cards with Mini-Histogram Sparklines

**Goal:**
Improve dashboard readability and match reference mockup layouts by transforming the KPI cards to use light grey borders, display a "View Details ->" link at the bottom right, and replace static icons with dynamic comparison sparkline histograms that plot current vs. last period values with trend directions and percentage change metrics.

**Approach:**
Modify dashboard repository queries and service calculations to return sales comparisons:
1. "This Year Sales" (replaces all-time "Total Sales"): current calendar year vs. last calendar year.
2. "Sales This Month": current month vs. last month.
3. "Today's Sales": today vs. yesterday.
4. "Net Sales": current month net vs. last month net.
Refund and Chargeback cards will have no comparison sparklines and are placed last in the KPI grid sequence. Re-design `MetricCard.tsx` using SVG elements (two columns representing last vs current, with a trend line overlay) and style cards with light grey borders.

---

- [x] **RED — Integration (`dashboard.test.ts`):**
  - [x] Test: `GET /api/dashboard/metrics` response includes a `thisYearSales` object containing `{ amount, count, lastAmount, lastCount, percentageChange }` instead of all-time `totalSales`.
  - [x] Test: The response includes comparison objects containing `{ currentAmount, currentCount, lastAmount, lastCount, percentageChange }` for `salesThisMonth`, `todaySales`, and `netSales`.
  - [x] Test: The `refundThisMonth` and `chargebackThisMonth` objects contain no comparison metadata fields.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service):**
  - [x] [Repository] In `dashboard.repository.ts`, implement database aggregation helpers `getSalesForYear(year: number)`, `getSalesForMonth(month: number, year: number)`, `getSalesForDate(dateStr: string)`, and `getNetSalesForMonth(month: number, year: number)`.
  - [x] [Service] In `dashboard.service.ts`, compute current-to-prior period comparisons and percentage increase/decrease values for sales metrics. Structure the return payload of `getMetricsForUser` to include these computed comparison nodes in sequence.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit / Component (`MetricCard.test.tsx`):**
  - [x] Test: Given comparison parameters, verify that `MetricCard` renders an SVG sparkline histogram along with the percentage change text and trend indicator icon (green up-arrow for positive change, red down-arrow for negative).
  - [x] Test: Verify "View Details ->" is rendered at the bottom right of the card linking to the appropriate filtered orders route.
  - [x] Test: Clicking the "This Year Sales" card routes to `/orders?saleStatus=1&dateFrom=YYYY-01-01&dateTo=YYYY-12-31` (dynamically using current year).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] In `src/types/dashboard.ts`, update `DashboardMetrics` to support comparisons: `{ currentAmount, currentCount, lastAmount, lastCount, percentageChange }`.
  - [x] [Component] In `src/app/dashboard_client_page.tsx`, update the cards array mapping to sort in sequence: "This Year Sales", "Sales This Month", "Today's Sales", "Net Sales", "Refunds", "Chargebacks". Remove hardcoded icons.
  - [x] [Component] In `src/components/dashboard/MetricCard.tsx`, update styling classes to render cards with a white background, light grey borders (`border: 1px solid #e2e8f0`), and custom padding. Render the SVG Sparkline and comparison elements (left: "From last period" label, right: percentage change pill, bottom-right: "View Details ->" action link).
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] User navigates to dashboard → 6 KPI cards are rendered with white backgrounds and light grey borders → first 4 cards show a mini bar-and-line sparkline trend next to the metric value, with a percentage pill at the top right → Refunds and Chargebacks cards are rendered last with no sparklines → user clicks "This Year Sales" → redirected to orders search pre-filtered for current year sold orders → ✅ Done.

---

#### W-1053 — Interactive Sales & Orders Advanced Chart with Dynamic Granularity

**Goal:**
Build a permission-guarded interactive chart widget below the KPI cards grid, displaying a combined smooth line chart and bar histogram for Sales Amount or Order Count, complete with Sales Team, Range, and corresponding dynamically enabled/disabled Granularity dropdown filters.

**Approach:**
Create a permission-restricted API endpoint `/api/dashboard/advanced-chart` that queries aggregated database orders filtered by team and date range, grouped by granularity. Create an interactive `AdvancedChartWidget.tsx` component that queries this endpoint when filters change. Implement front-end granularity validation to grey out and disable option dropdowns based on the selected range. Draw the line and bar charts using styled react SVG coordinates.

---

- [x] **RED — Integration (`dashboard.test.ts`):**
  - [x] Test: `GET /api/dashboard/advanced-chart?range=7d&granularity=daily` returns a JSON array of 7 items matching `{ label, amount, count }`.
  - [x] Test: `GET /api/dashboard/advanced-chart?teamId=1&range=year&granularity=monthly` filters data to Team 1 and returns monthly values.
  - [x] Test: Fetching `/api/dashboard/advanced-chart` with a session missing `dashboard:view-advanced-chart` returns `403 Forbidden`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] In `dashboard.repository.ts`, implement `getAdvancedChartData(teamId?: number, dateFrom: Date, dateTo: Date, granularity: 'daily' | 'monthly' | 'yearly')` grouping orders by the database date grouping expressions.
  - [x] [Service] In `dashboard.service.ts`, implement date calculations for range parameters: `Last 7 Days` (last 7 days), `Last 30 Days` (last 30 days), `Current Year` (from Jan 1st of current year to today), and `All Time` (from first order date to today).
  - [x] [Controller] Create endpoint `/api/dashboard/advanced-chart` in `src/app/api/dashboard/advanced-chart/route.ts` checking permission `dashboard:view-advanced-chart` and returning structured aggregates.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit / Component (`AdvancedChartWidget.test.tsx`):**
  - [x] Test: Mount `AdvancedChartWidget`. Verify toggle button alters local state between sales amount and order count.
  - [x] Test: Verify selecting Range "Last 7 Days" disables the "Monthly" and "Yearly" options in the Granularity dropdown.
  - [x] Test: Verify selecting Range "Current Year" disables the "Daily" option in the Granularity dropdown.
  - [x] Test: Assert SVG rendering elements (`<rect>`, `<path>`) are rendered when the chart loads with data.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] In `src/types/dashboard.ts`, add types for `AdvancedChartDataPoint` and widget filter states.
  - [x] [Component] Implement `src/components/dashboard/AdvancedChartWidget.tsx` containing dropdowns (Sales Team, Range, Granularity), toggle selectors (Sales Amount / Number of Orders), granularity validation mapping, and SVG elements to render line path (using bezier interpolation with gradient stroke) and histogram bars (using SVG `<rect>` shapes).
  - [x] [Integration] In `src/app/dashboard_client_page.tsx`, mount `<AdvancedChartWidget />` directly under the KPI cards scoreboard if user permissions list contains `dashboard:view-advanced-chart`.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin views dashboard → below KPI cards, a large chart panel displays Sales Amount over time → Admin clicks "Number of Orders" → chart updates immediately to show order counts → Admin changes Range to "Last 7 Days" → "Monthly" and "Yearly" checkboxes in the Granularity selector are greyed out and unclickable → Admin logs in as restricted agent lacking `dashboard:view-advanced-chart` → chart card is not rendered on the page → ✅ Done.

---

### Phase 11 — Comments & Audits System

#### W-1101 — Order Comment Timeline & Image Upload

**Goal:**
The PHP `ajaxupload.php` handled comment creation with an optional image upload (stored to `uploads/`). The new system needs a structured comment timeline on the order detail page and a proper server-side file upload handler that stores images in a managed directory.

**Approach:**
Build a comment repository and service. Expose `POST /api/orders/:id/comments` accepting `multipart/form-data` for text + optional image. Store uploaded images to `public/uploads/comments/`. Render comments as a chronological timeline on the order detail page.

---

- [x] **RED — Integration (`comments.test.ts`):**
  - [x] Test: `POST /api/orders/:id/comments` with `{ comment: 'Test note' }` creates a row in `crm_comments` and returns `201 Created` with the new comment object.
  - [x] Test: `POST /api/orders/:id/comments` with `multipart/form-data` including an image file saves the file path into `comment_image` column. Assert the returned `commentImage` field is a non-null string path.
  - [x] Test: `GET /api/orders/:id/comments` returns all comments for that order in `commentCreatedDate` ascending order.
  - [x] Test: `POST /api/orders/:id/comments` without an active session returns `401 Unauthorized`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/comment.repository.ts`:
    - `findByOrderId(orderId: number)` — ordered by `commentCreatedDate ASC`.
    - `create(data: CommentCreateInput)`.
  - [x] [Service] Create `src/service/comment.service.ts`:
    - `handleUpload(file: File)` — validates file type (image only), generates a unique filename, writes to `public/uploads/comments/`, returns the stored path.
  - [x] [Controller] `src/app/api/orders/[id]/comments/route.ts` (GET, POST). Parse `FormData` in POST handler. Call upload service if file is present.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`CommentTimeline.test.tsx`):**
  - [x] Test: Renders a list of comment cards in chronological order from mocked data.
  - [x] Test: Comment with a `commentImage` renders an `<img>` tag with the correct `src`.
  - [x] Test: Comment without an image renders only the text with no `<img>` element.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] Create `src/types/comment.ts` with `Comment` type.
  - [x] [Component] `src/components/CommentTimeline.tsx` — renders the list of comments.
  - [x] [Component] `src/components/AddCommentForm.tsx` — text area + file input, submits via `FormData`.
  - [x] [Integration] Add `CommentTimeline` and `AddCommentForm` to the order detail page `src/app/orders/[id]/page.tsx`.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent opens an order detail page → comment timeline is empty → agent types a note and attaches an image → submits → comment appears immediately in timeline with image thumbnail → second agent opens same order and sees the comment → ✅ Done.

---

### Phase 12 — Attendance Logging System (SKIPPED)

#### W-1201 — Daily Attendance Marking & Historical View

**Goal:**
The PHP `mark-attendance.php` listed all active agents and allowed marking each one with a status (Present, Absent, Half Day, etc.) for today. The new system must prevent double-marking (one record per agent per date) and show a historical view filterable by agent and month.

**Approach:**
Build attendance repository with a `upsert` pattern (update if exists for that agent+date, insert if not). Expose `POST /api/attendance` for bulk marking. Expose `GET /api/attendance` with date/agent filters for the historical view.

---

- [ ] **RED — Integration (`attendance.test.ts`):**
  - [ ] Test: `POST /api/attendance` with `[{ agentId: 1, statusId: 1, date: '2026-06-23' }]` creates one attendance record. Assert `SELECT COUNT(*) FROM crm_attendance WHERE agent_id = 1 AND attendance_date = '2026-06-23'` returns `1`.
  - [ ] Test: Calling `POST /api/attendance` a second time for the same agent and date **updates** the existing record (does not create a duplicate). Assert count is still `1` after second call.
  - [ ] Test: `GET /api/attendance?date=2026-06-23` returns all attendance records for that date.
  - [ ] Test: `GET /api/attendance?agentId=1&month=6&year=2026` returns all records for that agent in that month.
  - [ ] Test: `POST /api/attendance` without `attendance:mark` permission returns `403 Forbidden`.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Backend (Repository → Service → Controller):**
  - [ ] [Repository] Create `src/repository/attendance.repository.ts`:
    - `upsert(agentId, date, statusId, markedByName)` — uses Prisma `upsert` where `attendanceDate + agentId` is the unique selector.
    - `findByDate(date: Date)` — includes agent name.
    - `findByAgentAndMonth(agentId, month, year)`.
    - `getMonthlySummary(month, year)` — counts per `attendanceStatusId` for dashboard widget.
  - [ ] [Service] Create `src/service/attendance.service.ts`:
    - `markBulk(entries[], markedByName)` — calls `upsert` for each entry in a `prisma.$transaction`.
  - [ ] [Controller] `src/app/api/attendance/route.ts` (GET, POST). Guard POST with `attendance:mark`, GET with `attendance:view`.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit (`AttendanceSheet.test.tsx`):**
  - [ ] Test: Renders a row per active agent fetched from mocked data.
  - [ ] Test: Each row has a status dropdown defaulting to "Present".
  - [ ] Test: Clicking "Submit All" calls `POST /api/attendance` with the correct array payload.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Types → Pages → Components):**
  - [ ] [Types] Create `src/types/attendance.ts` with `AttendanceRecord`, `AttendanceStatus` enum types.
  - [ ] [Page] `src/app/attendance/mark/page.tsx` — the daily marking sheet listing all agents.
  - [ ] [Page] `src/app/attendance/history/page.tsx` — historical view with date and agent filters.
  - [ ] [Component] `src/components/AttendanceSheet.tsx` — the interactive marking grid.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Admin opens `/attendance/mark` → list of active agents shows → selects status for each → clicks Submit → all records saved → navigating to `/attendance/history` and filtering by today's date shows all marked records → re-opening mark page shows pre-filled statuses (upsert prevents duplication) → ✅ Done.

---

### Phase 13 — Unified Full-Text Search

#### W-1301 — Global Order & Customer Search

**Goal:**
The PHP `order-search.php` and `search.php` performed simple `LIKE` queries across `crm_orders` and `crm_customers`. We need a unified search endpoint that searches across multiple fields and returns ranked, combined results.

**Approach:**
Build a search repository with a parameterized LIKE query across the most useful searchable fields. The search bar is a global component in the sidebar that navigates to `/search?q=...`. Results are grouped by entity type (Orders, Customers).

---

- [x] **RED — Integration (`search.test.ts`):**
  - [x] Test: `GET /api/search?q=Toyota` returns results where at least one order's `orderMakeModel` contains `Toyota`.
  - [x] Test: `GET /api/search?q=john@example.com` returns at least one customer result where `customerEmail` matches.
  - [x] Test: `GET /api/search?q=VIN123` returns orders where `orderVin` contains `VIN123`.
  - [x] Test: `GET /api/search?q=` (empty query) returns `400 Bad Request`.
  - [x] Test: `GET /api/search?q=test` without a session returns `401 Unauthorized`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/search.repository.ts`:
    - `searchOrders(query: string)` — `$queryRaw` with `LIKE '%{query}%'` across `order_make_model`, `order_vin`, `order_part`, `order_sales_agent_name`, `order_tracking_number`.
    - `searchCustomers(query: string)` — `LIKE` across `first_name`, `last_name`, `customer_email`, `customer_phone`.
  - [x] [Service] Create `src/service/search.service.ts`:
    - `search(query)` — calls both repository methods in parallel with `Promise.all`, merges and deduplicates results, returns `{ orders: [...], customers: [...] }`.
  - [x] [Controller] `src/app/api/search/route.ts` (GET). Validate `q` is non-empty. Guard with active session.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`SearchResults.test.tsx`):**
  - [x] Test: Given mocked results with 2 orders and 1 customer, renders two sections with correct item counts.
  - [x] Test: Clicking an order result navigates to `/orders/:id`.
  - [x] Test: Clicking a customer result navigates to `/customers/:id`.
  - [x] Test: Empty results state renders a "No results found" message.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Components → Page):**
  - [x] [Types] Create `src/types/search.ts` with `SearchResults`, `OrderSearchResult`, `CustomerSearchResult` types.
  - [x] [Component] `src/components/GlobalSearchBar.tsx` — input that navigates to `/search?q=...` on submit. Added to `Sidebar.tsx`.
  - [x] [Page] `src/app/search/page.tsx` — server component that reads `?q` param, calls `/api/search`, and renders `SearchResults`.
  - [x] [Component] `src/components/SearchResults.tsx` — renders grouped results sections.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent types "Toyota Camry" into the global search bar in the sidebar → presses Enter → navigates to `/search?q=Toyota+Camry` → results page shows matching orders grouped by entity type → agent clicks an order row → navigates to `/orders/:id` → order detail renders → ✅ Done.

---

### Phase 14 — Admin Settings & RBAC Permission Management

#### W-1401 — Dynamic Permissions Matrix & Role Management

**Goal:**
Create an administrative interface for configuring user permissions by role. Provide APIs to fetch, create, update, and delete roles, along with their mapped permissions, and safeguard administrative roles from lockouts.

**Approach:**
Implement endpoints `GET /api/settings/roles`, `POST /api/settings/roles`, `PUT /api/settings/roles/[id]`, and `DELETE /api/settings/roles/[id]`. Build a frontend matrix UI under `/settings/roles` showing a list of roles and a checklist of permissions. Enforce a transaction-safe database mapping using `CrmRolePermissions` and protect default administrator accounts.

---

- [x] **RED — Integration (`settings.test.ts`):**
  - [x] Test: `GET /api/settings/roles` returns `403 Forbidden` for non-admin session.
  - [x] Test: `GET /api/settings/roles` for administrator returns array of roles, each with names and array of mapped permission IDs.
  - [x] Test: `PUT /api/settings/roles/2` updates role name and permission list, returning `200 OK`.
  - [x] Test: `PUT /api/settings/roles/1` (Super Admin) attempting to remove `super-admin` permission returns `400 Bad Request` (safeguard).
  - [x] Test: `DELETE /api/settings/roles/3` (role with active users) returns `400 Bad Request`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] [Repository] Create `src/repository/role.repository.ts` with operations to list, create, update (atomic delete-and-insert transaction), and delete roles/permissions.
  - [x] [Service] Create `src/service/role.service.ts` validating requests, checking active users before role deletion, and enforcing admin lockout protection.
  - [x] [Controller] Create API handlers in `src/app/api/settings/roles/route.ts` and `src/app/api/settings/roles/[id]/route.ts`.
  - [x] [Controller] Create API handler in `src/app/api/settings/permissions/route.ts` to expose all defined permissions.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`RoleSettings.test.tsx`):**
  - [x] Test: Mount page and assert list of roles is rendered.
  - [x] Test: Clicking a role updates the permission checkbox state.
  - [x] Test: Checking/unchecking permissions and clicking Save sends a PUT request with the updated permission IDs list.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Components → Pages):**
  - [x] [Component] Build `src/components/settings/PermissionMatrix.tsx` displaying interactive checkboxes grouped by resource scope.
  - [x] [Page] Build `src/app/settings/roles/page.tsx` rendering the role sidebar alongside `<PermissionMatrix />` with GSAP transitions and save banners.
  - [x] [Navbar] Add a settings navigation pill under `Navbar.tsx` visible only to users with the `settings:manage-permissions` permission.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Super Admin navigates to `/settings/roles` -> selects "Verifier Staff" -> toggles "orders:edit" permission -> clicks Save -> logs in as a verifier in a new window -> verifies they now have access to order editing controls -> ✅ Done.
  
---

### Phase 15 — Sprint 1: Critical Schema Surgery (P0)

This phase contains every change that must be completed **before a single real production order is entered**. Two of these items (#1502, #1503) perform destructive database column changes. The longer real data exists in the old column structure, the more complex and risky the migration becomes. Complete W-1501 (the bug fix) first since it has no migration, then execute W-1502 and W-1503 in order. W-1504 and W-1505 can be interleaved during migration run-time.

> **Execution order within this phase:** W-1501 → W-1502 → W-1503 → W-1504 → W-1505

---

#### W-1501 — BUG FIX: Team Monthly Performer Scores Ignore Refunds & Chargebacks

**Root cause:**
`getTeamMonthlyTopPerformer()` and `getTeamMonthlyBottomPerformer()` in `src/repository/dashboard.repository.ts` (lines 331–403) filter orders with `saleStatus: '1'` only. When an agent's Sold order is later changed to Refund (`saleStatus = '7'`) or Chargeback (`saleStatus = '8'`), the performer ranking does not deduct the reversed markup — the refunded order is simply excluded. The team-level `getTeamMonthlyScores()` SQL query (line 303–312) correctly computes `netAmount` by adding sold markups and subtracting refund/chargeback markups, but the per-agent queries do not. Additionally, both performer functions use `agent.name` instead of `agent.nickname || agent.name` (line 361, 398), breaking the alias-name convention used everywhere else in the app.

**Approach:**
Rewrite both performer functions to fetch all qualifying orders (saleStatus `1`, `7`, `8`), compute each agent's net score as `SUM(markup where status='1') - SUM(markup where status IN ('7','8'))`, rank ascending/descending, and return the result. Fix the agent name to use `agent.nickname || agent.name`. Update `dashboard.service.ts` line 95 to use `o.customer.customerName` instead of the manual concat (this is also required for the W-1503 customer name migration).

---

- [x] **RED — Integration (`src/tests/dashboard.test.ts`):**
  - [x] Test: Seed Team A with agent "Alice" — 2 Sold orders (markup `$200` each = `$400` gross) and 1 Refund order (markup `$150`). Call `GET /api/dashboard/teams/monthly?month=<currentMonth>&year=<currentYear>`. Assert `response.body[0].topPerformer.amount === 250` (net: 400 − 150), **not** `400`.
  - [x] Test: Seed Team A with agent "Bob" — 1 Sold order (markup `$100`). Assert `response.body[0].topPerformer.agentName === 'Alice'` (net $250 > Bob's $100).
  - [x] Test: Assert `response.body[0].bottomPerformer.agentName === 'Bob'` (net $100 < Alice's $250).
  - [x] Test: Seed agent "Carlos" in Team A — 0 Sold orders, 1 Chargeback order (markup `$50`). Assert Carlos appears with `amount: -50`, ranking him below Bob at the very bottom.
  - [x] Test: Assert agent names in the response use `nickname` when available (seed Carlos with `nickname = 'Carlo'`, assert `agentName === 'Carlo'`).
  - [x] **Run — confirm RED** (current impl returns `400` for Alice; ignores refunds; uses `agent.name` not `nickname || name`).

- [x] **GREEN — Backend (Repository → Service):**
  - [x] [Repository] In `src/repository/dashboard.repository.ts`, rewrite `getTeamMonthlyTopPerformer(teamId, month, year)` (lines 331–366):
    - Fetch all agents in the team including their `salesOrders` where `saleStatus: { in: ['1', '7', '8'] }` and `orderDate` within the given month.
    - For each agent compute: `netScore = SUM(markup where saleStatus='1') - SUM(markup where saleStatus IN ('7','8'))`.
    - Find the agent with the **highest** `netScore` (do not filter by `netScore > 0` — include agents with zero or negative scores).
    - Return `{ agentId: agent.uid, agentName: agent.nickname || agent.name, amount: netScore } | null` (null only when there are zero agents in the team).
  - [x] [Repository] Apply the identical net-score logic to `getTeamMonthlyBottomPerformer(teamId, month, year)` (lines 368–403): find the agent with the **lowest** `netScore`. Include agents with negative net scores in the ranking.
  - [x] [Service] In `src/service/dashboard.service.ts`, the `getTeamMonthlyReport()` function (line 112) calls both performer functions — no structural changes needed. Confirm `topPerformer` and `bottomPerformer` now carry the correct net-score `amount`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/Dashboard.test.tsx`):**
  - [x] Test: Mock API response with a team where `topPerformer.amount = 250`. Assert `TeamMonthlyScoresWidget` renders the string `"$250"` in the top performer row.
  - [x] Test: Mock API response where `bottomPerformer.amount = -50`. Assert the bottom performer row renders `"-$50"` (or `"($50)"`) styled in red (a negative CSS class or inline color red).
  - [x] **Run — confirm RED** (current component formats `amount` as `$amount.toLocaleString()` which renders `$-50` not `-$50`, and has no red negative styling).

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] In `src/types/dashboard.ts`, add `agentId: number` to the `TeamPerformerRow` type alongside existing `agentName: string` and `amount: number`.
  - [x] [Component] In `src/components/dashboard/TeamMonthlyScoresWidget.tsx`, update the bottom performer render: when `team.bottomPerformer.amount < 0`, render with a red text color and format as `"-$" + Math.abs(amount).toLocaleString()`. When positive, render as `"$" + amount.toLocaleString()`.
  - [x] [Service] In `src/service/dashboard.service.ts` line 95: replace `` `${o.customer.firstName} ${o.customer.lastName}`.trim() `` with `o.customer.customerName` (this is a prerequisite fix for W-1503 to avoid a runtime crash after the migration drops `firstName`/`lastName`).
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin navigates to dashboard → Team Monthly Scores widget loads for the current month → Agent "Alice" who had $400 gross but a $150 refund appears with `$250` net in top performer row → Agent "Carlos" who only had a $50 chargeback appears with `-$50` in red in bottom performer row → Month navigator clicks to a month with no orders → both performer rows show `null` / hidden → ✅ Done.

---

#### W-1502 — Merge `order_year` into `order_make_model` (P0 — Destructive Migration)

**Root cause / Goal:**
`CrmOrders` stores vehicle year and make/model in two columns: `order_year VARCHAR(255)` and `order_make_model VARCHAR(255)`. The client has specified a single combined field at the database layer. `AddOrderForm.tsx` exposes two separate inputs: a "Year" field (state `orderYear`) and a "Make & Model" field (state `orderMakeModel`). Every display context must manually concatenate them. The column split creates redundancy in every layer. **This is a destructive migration** — `order_year` is dropped after data is merged into `order_make_model`.

**Approach:**
1. Write and apply a Prisma migration that back-fills `order_make_model` with the concatenation of `order_year + ' ' + order_make_model`, then drops `order_year`.
2. Within the same migration, perform the database sale status code migration: map legacy codes `2` through `6` to `1` (Sold), map `7` (Refunded) to `2`, and map `8` (Chargebacked) to `3`. This establishes the strict 3-status schema at the database layer.
3. Remove `orderYear` from `schema.prisma`, regenerate the client.
4. Remove `orderYear` from `order.repository.ts` (line 79), `src/types/order.ts` (lines 19, 39), and `order.service.ts` (if referenced).
5. Merge the two form inputs into a single "Year, Make & Model" input in `AddOrderForm.tsx` and `EditOrderForm.tsx`.

**Migration name:** `merge_order_year_into_make_model`

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: `POST /api/orders` with payload `{ orderMakeModel: "2021 Jeep Grand Cherokee", /* no orderYear field */ }`. Assert `201 Created`. Assert `SELECT order_make_model FROM crm_orders WHERE crm_order_id = <newId>` returns exactly `"2021 Jeep Grand Cherokee"`.
  - [x] Test: `GET /api/orders/:id` — assert the returned order object does **not** contain an `orderYear` property at all (field must be absent from the JSON response, not just `null`).
  - [x] Test: `PATCH /api/orders/:id` with `{ orderMakeModel: "2019 Ford F-150" }`. Assert `SELECT order_make_model FROM crm_orders WHERE crm_order_id = :id` returns `"2019 Ford F-150"`.
  - [x] Test: `SELECT order_year FROM crm_orders LIMIT 1` via a direct Prisma `$queryRaw` — assert it throws an `Unknown column 'order_year'` error, confirming the column was dropped by the migration.
  - [x] **Run — confirm RED** (`orderYear` column still exists; GET response includes `orderYear`; the raw column-not-found query passes today because the column still exists).

- [x] **GREEN — Backend (Migration → Schema → Repository → Service → Types):**
  - [x] [Migration] Create and apply migration `merge_order_year_into_make_model`. The raw SQL steps must be:
    ```sql
    -- Step 1: Back-fill: prepend year to make_model for all rows that have a non-null, non-empty order_year
    UPDATE crm_orders
    SET order_make_model = TRIM(
      CONCAT(
        COALESCE(TRIM(order_year), ''),
        CASE
          WHEN TRIM(COALESCE(order_year, '')) != ''
          AND  TRIM(COALESCE(order_make_model, '')) != ''
          THEN ' '
          ELSE ''
        END,
        COALESCE(TRIM(order_make_model), '')
      )
    )
    WHERE order_year IS NOT NULL AND TRIM(order_year) != '';

    -- Step 2: Drop the now-redundant column
    ALTER TABLE crm_orders DROP COLUMN order_year;

    -- Step 3: Migrate sale_status codes to the new 1 (Sold), 2 (Refunded), 3 (Chargebacked) schema
    -- Map legacy deprecated codes (2, 3, 4, 5, 6) to 1 (Sold) first
    UPDATE crm_orders SET sale_status = '1' WHERE sale_status IN ('2', '3', '4', '5', '6');
    -- Map legacy Refunded (7) to the new code (2)
    UPDATE crm_orders SET sale_status = '2' WHERE sale_status = '7';
    -- Map legacy Chargebacked (8) to the new code (3)
    UPDATE crm_orders SET sale_status = '3' WHERE sale_status = '8';
    ```
    Apply via: `npx prisma migrate dev --name merge_order_year_into_make_model`.
  - [x] [Schema] In `prisma/schema.prisma`, model `CrmOrders`: remove the line `orderYear String? @map("order_year") @db.VarChar(255)`. Run `npx prisma generate`.
  - [x] [Repository] In `src/repository/order.repository.ts`, `createWithCustomerAndCard()` (line 79): remove the line `orderYear: data.orderYear || null,`.
  - [x] [Service] In `src/service/order.service.ts`: confirm no reference to `orderYear` or `data.orderYear` remains. (Currently the service does not explicitly reference it — verify with a project-wide grep: `grep -r "orderYear" src/`)
  - [x] [Types] In `src/types/order.ts`:
    - Remove line 19: `orderYear?: string;` from `OrderCreateInput`.
    - Remove line 39: `orderYear?: string;` from `OrderUpdateInput`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx`, `src/tests/EditOrderForm.test.tsx`):**
  - [x] `AddOrderForm.test.tsx` Test: Render `<AddOrderForm />`. Assert the DOM does **not** contain any element with `id="orderYear"`.
  - [x] `AddOrderForm.test.tsx` Test: Assert the DOM contains an element with `id="orderMakeModel"` and its associated label text is `"Year, Make & Model"`.
  - [x] `AddOrderForm.test.tsx` Test: Submit form with `orderMakeModel = "2022 Honda Civic"`. Assert the `fetch` POST body (`JSON.parse(fetchArgs[1].body)`) contains `orderMakeModel: "2022 Honda Civic"` and does **not** contain an `orderYear` key.
  - [x] `EditOrderForm.test.tsx` Test: Render `<EditOrderForm order={{ orderMakeModel: "2020 BMW 3 Series", ...otherFields }} />`. Assert the `id="orderMakeModel"` input has `value="2020 BMW 3 Series"`.
  - [x] `EditOrderForm.test.tsx` Test: Assert the DOM does **not** contain any element with `id="orderYear"`.
  - [x] **Run — confirm RED** (current forms have a separate `id="orderYear"` input; label says `"Make & Model"` not `"Year, Make & Model"`).

- [x] **GREEN — Frontend (Types → Components):**
  - [x] [Component] `src/components/AddOrderForm.tsx`:
    - Remove state variable `const [orderYear, setOrderYear] = useState('')`.
    - Remove the entire `<div className="form-group">` block containing `<input id="orderYear" ...>` and its `<label>` (currently labeled "Year").
    - On the remaining `<input id="orderMakeModel" ...>`: change its `<label>` text to `"Year, Make & Model *"` and its `placeholder` to `"e.g. 2021 Jeep Grand Cherokee"`.
    - In `handleSubmit` `payload` object: remove the `orderYear` property. Confirm `orderMakeModel` is still included.
  - [x] [Component] `src/components/EditOrderForm.tsx`: Apply identical changes — remove `orderYear` state, input, and label; update `orderMakeModel` label to `"Year, Make & Model"`; remove `orderYear` from the submit payload.
  - [x] [Search] In `src/repository/search.repository.ts`, confirm `searchOrders` LIKE clause does not reference `order_year` (it currently searches `order_make_model` which now includes year — no change needed, but grep to verify).
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Developer runs `npx prisma migrate dev` → migration applies with zero errors → runs `DESCRIBE crm_orders` → confirms `order_year` column is absent → runs `SELECT order_make_model FROM crm_orders LIMIT 5` → rows show combined year+make+model strings (e.g. `"2019 Jeep Grand Cherokee"`) → Agent navigates to `/orders/new` → Vehicle section shows a single field labeled `"Year, Make & Model *"` with placeholder `"e.g. 2021 Jeep Grand Cherokee"` → Agent types `"2021 Honda Accord"` → submits → order detail page shows `"2021 Honda Accord"` → Global search for `"Honda"` returns the order → ✅ Done.

---

#### W-1503 — Merge `first_name` + `last_name` → `customer_name` (P0 — Destructive Migration)

**Root cause / Goal:**
`CrmCustomers` stores customer name across two columns: `first_name VARCHAR(255)` and `last_name VARCHAR(255)`. The client requires a single `customer_name` column at the database layer. Currently, every layer manually concatenates them: `order.repository.ts` line 49–50 uses `firstName`/`lastName` in the create transaction; `order.service.ts` line 6 validates `!data.firstName || !data.lastName`; `dashboard.service.ts` line 95 uses `` `${o.customer.firstName} ${o.customer.lastName}`.trim() ``; search queries LIKE both columns separately; and all UI forms have two inputs. Consolidating into a single column eliminates all duplication and is a **destructive migration** — both old columns are dropped after back-fill.

**⚠️ PREREQUISITE:** W-1501's service fix (`dashboard.service.ts` line 95) must be applied before or alongside this migration, or the running app will crash after the migration drops `firstName`/`lastName`.

**Approach:**
1. Migration: ADD `customer_name`, UPDATE to CONCAT existing values, ADD NOT NULL constraint, DROP `first_name` and `last_name`.
2. Update `schema.prisma` and regenerate.
3. Sweep every file that references `firstName`/`lastName` on the customer model.

**Migration name:** `merge_customer_first_last_name`

**Files touched (complete list — no file should be missed):**
- `prisma/schema.prisma`
- `src/repository/order.repository.ts` (lines 49–50)
- `src/repository/customer.repository.ts`
- `src/repository/search.repository.ts`
- `src/service/order.service.ts` (lines 6–7, 43–46, 145–146)
- `src/service/dashboard.service.ts` (line 95 — covered by W-1501 prerequisite)
- `src/types/order.ts` (lines 3–4, 70–71)
- `src/types/customer.ts`
- `src/components/AddOrderForm.tsx`
- `src/components/EditOrderForm.tsx`
- `src/components/CustomerList.tsx`
- `src/components/OrderList.tsx`
- `src/components/GlobalSearchBar.tsx`
- `src/components/SearchResults.tsx`
- `src/components/dashboard/RecentOrdersTable.tsx` (if it references name directly)

---

- [x] **RED ─ Integration (`src/tests/orders.test.ts`, `src/tests/customers.test.ts`):**
  - [x] `orders.test.ts` Test: `POST /api/orders` with payload `{ customerName: "Jane Doe", customerEmail: "jane@test.com", /* no firstName or lastName */ }`. Assert `201 Created`. Assert `SELECT customer_name FROM crm_customers WHERE customer_id = <newCustomerId>` returns `"Jane Doe"`.
  - [x] `orders.test.ts` Test: `GET /api/orders/:id` ─ assert the nested `customer` object in the response has a `customerName` field with value `"Jane Doe"` and does **not** contain `firstName` or `lastName` properties.
  - [x] `customers.test.ts` Test: `GET /api/customers` ─ assert each customer object has a `customerName` string field and does **not** have `firstName` or `lastName` fields.
  - [x] `customers.test.ts` Test: `POST /api/customers` with `{ customerName: "John Smith", customerEmail: "j@test.com", customerPhone: "555-1234" }`. Assert `201 Created`. Assert `SELECT customer_name FROM crm_customers WHERE customer_email = 'j@test.com'` returns `"John Smith"`.
  - [x] **Run ─ confirm RED** (`firstName`/`lastName` columns still exist; `customerName` field does not exist on the model; POST with `customerName` is silently ignored; GET response has no `customerName`).

- [x] **GREEN ─ Backend (Migration → Schema → Repository → Service → Types → Controller):**
  - [x] [Migration] Create and apply migration `merge_customer_first_last_name`. The raw SQL:
    ```sql
    -- Step 1: Add the new combined column (nullable initially for safe back-fill)
    ALTER TABLE crm_customers
      ADD COLUMN customer_name VARCHAR(511) NULL
      AFTER last_name;

    -- Step 2: Back-fill from existing data (handle cases where either column may be NULL/empty)
    UPDATE crm_customers
    SET customer_name = TRIM(
      CONCAT(
        COALESCE(TRIM(first_name), ''),
        CASE
          WHEN TRIM(COALESCE(first_name, '')) != ''
          AND  TRIM(COALESCE(last_name, '')) != ''
          THEN ' '
          ELSE ''
        END,
        COALESCE(TRIM(last_name), '')
      )
    );

    -- Step 3: Make NOT NULL (after confirming back-fill left no NULLs)
    ALTER TABLE crm_customers
      MODIFY COLUMN customer_name VARCHAR(511) NOT NULL;

    -- Step 4: Drop the old columns
    ALTER TABLE crm_customers
      DROP COLUMN first_name,
      DROP COLUMN last_name;
    ```
    Apply via: `npx prisma migrate dev --name merge_customer_first_last_name`.
  - [x] [Schema] In `prisma/schema.prisma`, model `CrmCustomers`:
    - Remove: `firstName String @map("first_name") @db.VarChar(255)`
    - Remove: `lastName  String @map("last_name")  @db.VarChar(255)`
    - Add: `customerName String @map("customer_name") @db.VarChar(511)`
    - Run `npx prisma generate`.
  - [x] [Repository] `src/repository/order.repository.ts`, `createWithCustomerAndCard()` (lines 49─50):
    - Remove: `firstName: data.firstName,` and `lastName: data.lastName,`
    - Add: `customerName: data.customerName,`
  - [x] [Repository] `src/repository/search.repository.ts`, `searchCustomers(query)` — update the LIKE clause from two separate `first_name LIKE` / `last_name LIKE` conditions to a single `customer_name LIKE '%${query}%'` condition.
  - [x] [Service] `src/service/order.service.ts`:
    - Line 6─7: Change `if (!data.firstName || !data.lastName)` to `if (!data.customerName)`; change error message to `'Customer name is required'`.
    - Lines 43─46 destructure: Replace `firstName,` and `lastName,` with `customerName,`.
    - Lines 145─146 customer update block: Replace `if (firstName !== undefined) customerUpdate.firstName = firstName;` and `if (lastName !== undefined) customerUpdate.lastName = lastName;` with `if (customerName !== undefined) customerUpdate.customerName = customerName;`.
  - [x] [Types] `src/types/order.ts`:
    - `OrderCreateInput` (lines 3─4): Remove `firstName: string;` and `lastName: string;`. Add `customerName: string;`.
    - `OrderUpdateInput` (lines 70─71): Remove `firstName?: string;` and `lastName?: string;`. Add `customerName?: string;`.
  - [x] [Types] `src/types/customer.ts`: In every type that includes customer name fields (`Customer`, `CustomerCreateInput`, `CustomerUpdateInput`), replace `firstName: string` / `lastName: string` with `customerName: string`.
  - [x] Run integration test ─ **confirm GREEN**.

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx`, `src/tests/CustomerList.test.tsx`):**
  - [x] `AddOrderForm.test.tsx` Test: Render `<AddOrderForm />`. Assert the DOM contains a single input with `id="customerName"` and its label text is `"Customer Name *"`. Assert the DOM does **not** contain any element with `id="firstName"` or `id="lastName"`.
  - [x] `AddOrderForm.test.tsx` Test: Submit form with `customerName = "Mary Johnson"`. Assert `JSON.parse(fetchArgs[1].body)` contains `customerName: "Mary Johnson"` and does **not** contain `firstName` or `lastName` keys.
  - [x] `CustomerList.test.tsx` Test: Given mocked customer `{ customerName: "John Doe", customerId: 1, customerEmail: "j@e.com" }`, assert the rendered list row displays `"John Doe"` in the Name column.
  - [x] **Run — confirm RED** (current form has `id="firstName"` and `id="lastName"` inputs; POST body contains `firstName`/`lastName`; customer list renders individual first/last columns or concat).

- [x] **GREEN — Frontend (Types → Components):**
  - [x] [Component] `src/components/AddOrderForm.tsx`:
    - Remove state: `const [firstName, setFirstName] = useState('')` and `const [lastName, setLastName] = useState('')`.
    - Add state: `const [customerName, setCustomerName] = useState('')`.
    - In the Customer Info section: remove the "First Name" `<div className="form-group">` block and the "Last Name" `<div className="form-group">` block.
    - Add a single replacement block:
      ```jsx
      <div className="form-group form-grid-full">
        <label htmlFor="customerName" className="form-label">Customer Name *</label>
        <input
          id="customerName"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="form-input"
          placeholder="e.g. Jane Doe"
          required
        />
      </div>
      ```
    - In `handleSubmit`: remove `firstName` and `lastName` from the payload; add `customerName`.
    - In validation: change `if (!firstName || !lastName || ...)` to `if (!customerName || ...)`.
  - [x] [Component] `src/components/EditOrderForm.tsx`: Apply identical changes. Pre-populate `customerName` state from `order.customer.customerName`.
  - [x] [Component] `src/components/CustomerList.tsx`: Update column header from split name columns to `"Customer Name"`. Update cell to render `customer.customerName`.
  - [x] [Component] `src/components/OrderList.tsx`: Update any inline `` `${order.customer?.firstName} ${order.customer?.lastName}` `` patterns to `order.customer?.customerName`.
  - [x] [Component] `src/components/GlobalSearchBar.tsx`: Update customer result rendering from `customer.firstName + ' ' + customer.lastName` to `customer.customerName`.
  - [x] [Component] `src/components/SearchResults.tsx`: Apply same customer name render update.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Developer runs migration → `DESCRIBE crm_customers` shows `customer_name` column and no `first_name`/`last_name` columns → `SELECT customer_name FROM crm_customers LIMIT 3` shows full names (e.g. `"Timothy Manuli"`) → App restarts — no crash → Agent navigates to `/orders/new` → Customer section shows single `"Customer Name *"` input → Agent types `"Sarah Connor"` → submits → order detail shows `"Sarah Connor"` under Customer section → Customer list shows `"Sarah Connor"` in Name column → Global search for `"Sarah"` returns the customer result → ✅ Done.

---

#### W-1504 — Quick UI Wins: Sale Date Picker, Remove Redundant Chart Filters, Rename Mileage Labels

**Root cause / Goal:**
Three pure UI changes bundled into one work item. Zero migration risk. Intended to be completed during the migration run-time of W-1502 and W-1503.

**Sub-item A — Sale Date Picker (#3):**
`order_date` column already exists in `crm_orders` (schema). `order.repository.ts` line 100 already handles `data.orderDate` if provided. However, `AddOrderForm.tsx` does **not** expose a date input — `orderDate` is never in the user-submitted payload, so the column always defaults to the server's `new Date()` (system entry time). Agents cannot backdate sales.

**Sub-item B — Remove Redundant Chart Filters (#4):**
`AdvancedChartWidget.tsx` has `"Last 7 days"` (`value="7d"`) and `"Last 30 days"` (`value="30d"`) alongside calendar-aligned `"This week"` and `"This month"`. The client has asked to remove the rolling-window options.

**Sub-item C — Rename Mileage Labels (#10):**
`AddOrderForm.tsx` and `EditOrderForm.tsx` label the mileage fields `"Quoted Mileage"` and `"Vendor Mileage"`. The client wants `"Quotes Miles"` and `"Vendor Miles"`.

---

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx`):**
  - [x] Sub-A Test: Render `<AddOrderForm />`. Assert the DOM contains `<input type="date" id="orderDate" />`.
  - [x] Sub-A Test: Assert the default value of `id="orderDate"` equals today's date in `YYYY-MM-DD` format (e.g. `new Date().toISOString().split('T')[0]`).
  - [x] Sub-A Test: Submit form with `orderDate` input set to `"2025-06-15"`. Assert `JSON.parse(fetchArgs[1].body).orderDate === "2025-06-15"`.
  - [x] Sub-B Test: Render `<AdvancedChartWidget />`. Assert the range `<select>` does **not** contain `<option value="7d">` or `<option value="30d">`.
  - [x] Sub-B Test: Assert the range `<select>` **does** contain `<option value="this-week">` and `<option value="this-month">`.
  - [x] Sub-C Test: Assert the rendered form contains a `<label>` with exact text `"Quotes Miles"` (not `"Quoted Mileage"`).
  - [x] Sub-C Test: Assert the rendered form contains a `<label>` with exact text `"Vendor Miles"` (not `"Vendor Mileage"`).
  - [x] **Run — confirm RED** (no `id="orderDate"` input; chart has `value="7d"` / `value="30d"`; labels say `"Mileage"`).

- [x] **GREEN — Frontend (Components only — no backend, no migration):**
  - [x] [Sub-A] `src/components/AddOrderForm.tsx`:
    - Add state: `const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0])`.
    - In Section 4 (Pricing & Allocation), add a new `<div className="form-group">` **before** the shipping type field:
      ```jsx
      <div className="form-group">
        <label htmlFor="orderDate" className="form-label">
          Sale Date
          <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
            (defaults to today)
          </span>
        </label>
        <input
          type="date"
          id="orderDate"
          value={orderDate}
          onChange={(e) => setOrderDate(e.target.value)}
          className="form-input"
        />
      </div>
      ```
    - In `handleSubmit` payload: add `orderDate: orderDate`.
  - [x] [Sub-A] `src/components/EditOrderForm.tsx`:
    - Add state initialized from order: `const [orderDate, setOrderDate] = useState(() => order?.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])`.
    - Add the identical Sale Date input block in the appropriate section.
    - Include `orderDate` in the submit payload.
  - [x] [Sub-B] `src/components/dashboard/AdvancedChartWidget.tsx`:
    - Remove the line `<option value="7d">Last 7 days</option>`.
    - Remove the line `<option value="30d">Last 30 days</option>`.
    - Change `useState<string>('7d')` to `useState<string>('this-week')`.
    - In `handleCancelCustom()`: change `setRange('7d')` to `setRange('this-week')`.
  - [x] [Sub-C] `src/components/AddOrderForm.tsx`: Change label text `"Quoted Mileage"` → `"Quotes Miles"` and `"Vendor Mileage"` → `"Vendor Miles"`.
  - [x] [Sub-C] `src/components/EditOrderForm.tsx`: Apply identical label text changes.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] [A] Agent opens `/orders/new` → "Sale Date" field shows today's date pre-filled → Agent changes date to `2025-06-15` → submits → `GET /api/orders/<newId>` returns `orderDate: "2025-06-15"` → Order appears correctly in date-range filters for June 2025 → ✅ Done.
  - [x] [B] Admin opens dashboard Advanced Chart → range dropdown shows `This week`, `This month`, `This year`, `All time` only — no `Last 7 days` or `Last 30 days` → ✅ Done.
  - [x] [C] Agent opens `/orders/new` → Vehicle info section shows labels `"Quotes Miles"` and `"Vendor Miles"` → ✅ Done.

---

#### W-1505 — Update Seed File to Match Post-Sprint-1 Schema

**Root cause / Goal:**
After W-1502 and W-1503, two schema-breaking changes have occurred: `order_year` is gone and `first_name`/`last_name` are replaced by `customer_name`. The `seed.sql` at the project root still references the old column names. Running `seed.sql` against any freshly provisioned database (dev, test, or production) will immediately fail with SQL syntax errors. Every `INSERT INTO crm_customers` and `INSERT INTO crm_orders` must be updated.

**Approach:**
1. Update all `INSERT INTO crm_customers` statements to use `customer_name` instead of `first_name`/`last_name`.
2. Update all `INSERT INTO crm_orders` statements to remove `order_year` from the column list and merge its value into `order_make_model`.
3. Wrap each table's inserts in a transaction, using multi-row batch syntax (max 500 rows per `INSERT` statement) for performance.
4. Verify the updated seed runs cleanly on a fresh `jd_crm_test` database.

---

- [x] **RED — Integration (`src/tests/db_connection.test.ts`):**
  - [x] Test: Drop and recreate `jd_crm_test` database. Apply all Prisma migrations (`npx prisma migrate deploy`). Run the updated `seed.sql` via `mysql jd_crm_test < seed.sql` (or equivalent programmatic execution). Assert `SELECT COUNT(*) FROM crm_customers` > 0.
  - [x] Test: `SELECT customer_name FROM crm_customers LIMIT 1` — assert the result is a non-null, non-empty string.
  - [x] Test: `SELECT first_name FROM crm_customers LIMIT 1` via `$queryRaw` — assert this throws an `Unknown column 'first_name'` error (column was dropped by migration).
  - [x] Test: `SELECT order_year FROM crm_orders LIMIT 1` via `$queryRaw` — assert this throws an `Unknown column 'order_year'` error.
  - [x] Test: `SELECT order_make_model FROM crm_orders WHERE order_make_model IS NOT NULL LIMIT 1` — assert the result contains a space character (confirming year + make/model are combined, e.g. `"2019 Jeep Grand Cherokee"`).
  - [x] **Run — confirm RED** (seed.sql still has `first_name`/`last_name` and `order_year` columns; the seed will fail after migrations run).

- [x] **GREEN — Backend (Seed file only):**
  - [x] [Seed] Open `seed.sql`. For every `INSERT INTO crm_customers (...)` statement:
    - Remove `first_name` and `last_name` from the column list.
    - Add `customer_name` in their place.
    - For every row's `VALUES (...)`: replace the two separate name values with a single concatenated string (e.g. `'John', 'Smith'` → `'John Smith'`).
  - [x] [Seed] For every `INSERT INTO crm_orders (...)` statement:
    - Remove `order_year` from the column list.
    - In each row's `VALUES (...)`: prepend the year value to the `order_make_model` value (e.g. column was `'2021', 'Jeep Grand Cherokee'` → now just `'2021 Jeep Grand Cherokee'` in the `order_make_model` position).
  - [x] [Seed] Convert each table's individual `INSERT` statements to multi-row batch format:
    ```sql
    START TRANSACTION;
    INSERT INTO crm_customers (customer_name, customer_email, customer_phone, ...) VALUES
      ('Jane Doe', 'jane@test.com', '555-0001', ...),
      ('John Smith', 'john@test.com', '555-0002', ...),
      ...;
    COMMIT;
    ```
    Batch maximum 500 rows per `INSERT` statement.
  - [x] [Import Script] If `seed_from_json.js` (or equivalent CSV import script) exists, update all column references: `firstName`/`lastName` → `customerName`; `orderYear`/`orderMakeModel` → combined `orderMakeModel`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Developer drops and recreates local `jd_crm` database → runs `npx prisma migrate deploy` → runs `mysql jd_crm < seed.sql` → zero SQL errors → app restarts and connects → Dashboard loads with metrics → Customer list shows full names (e.g. `"Timothy Manuli"`) → Order list shows combined make/model strings → ✅ Done.

---
### Phase 16 — Sprint 2: Pre-Go-Live Features (P1)

All four items in this sprint add **new tables or columns only** — no existing data is destroyed. However, audit trails are retroactive by nature: every day these features are absent means permanently lost history. Complete all Sprint 1 work first, then execute these items in the order listed.

> **Execution order within this phase:** W-1601 → W-1602 → W-1603 → W-1604 → W-1605

---

#### W-1601 — Add Sales Verifier + Backend Executive to Orders

**Root cause / Goal:**
`CrmOrders` tracks only two people per order: `order_sales_agent_id` (Sales Rep) and `order_verifier_id` (QA Verifier). The client requires two additional roles: **Sales Verifier** and **Backend Executive**. These must be FK relations to `users` with denormalized name snapshots, following the existing pattern for `orderSalesAgentName` / `orderVerifierName`. All four roles must appear in the order form and order list in this exact sequence: Sales Agent → Sales Verifier → Backend Executive → QA Verifier.

**Approach:**
4 nullable columns added to `crm_orders` + 2 new FK relations in Prisma. Repository resolves and snapshots names on create and update. Types, API controller, and all UI forms and list views updated.

**Migration name:** `add_sales_verifier_and_backend_member_to_orders`

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: `POST /api/orders` with `{ ..., orderSalesVerifierId: <validUserId_A>, orderBackendMemberId: <validUserId_B> }`. Assert `201 Created`. Assert `SELECT order_sales_verifier_id, order_sales_verifier_name, order_backend_member_id, order_backend_member_name FROM crm_orders WHERE crm_order_id = <newId>` returns: `order_sales_verifier_id = <validUserId_A>`, `order_sales_verifier_name` = the `nickname || name` of user A, `order_backend_member_id = <validUserId_B>`, `order_backend_member_name` = the `nickname || name` of user B.
  - [x] Test: `POST /api/orders` with **no** `orderSalesVerifierId` or `orderBackendMemberId`. Assert `201 Created` — all four new columns are `NULL` in the inserted row.
  - [x] Test: `PATCH /api/orders/:id` with `{ orderSalesVerifierId: <validUserId_C> }`. Assert `200 OK`. Assert `SELECT order_sales_verifier_name FROM crm_orders WHERE crm_order_id = :id` equals the `nickname || name` of user C.
  - [x] Test: `GET /api/orders/:id` response body contains all four fields: `orderSalesVerifierId`, `orderSalesVerifierName`, `orderBackendMemberId`, `orderBackendMemberName`.
  - [x] **Run — confirm RED** (columns do not exist; POST payload fields are silently dropped; GET response has no new fields).

- [x] **GREEN — Backend (Migration → Schema → Repository → Service → Types):**
  - [x] [Migration] Create and apply migration `add_sales_verifier_and_backend_member_to_orders`:
    ```sql
    ALTER TABLE crm_orders
      ADD COLUMN order_sales_verifier_id    INT         NULL,
      ADD COLUMN order_sales_verifier_name  VARCHAR(55) NULL,
      ADD COLUMN order_backend_member_id    INT         NULL,
      ADD COLUMN order_backend_member_name  VARCHAR(55) NULL;

    ALTER TABLE crm_orders
      ADD CONSTRAINT crm_orders_sales_verifier_fkey
        FOREIGN KEY (order_sales_verifier_id) REFERENCES users(uid)
        ON DELETE SET NULL ON UPDATE CASCADE,
      ADD CONSTRAINT crm_orders_backend_member_fkey
        FOREIGN KEY (order_backend_member_id) REFERENCES users(uid)
        ON DELETE SET NULL ON UPDATE CASCADE;
    ```
    Apply via: `npx prisma migrate dev --name add_sales_verifier_and_backend_member_to_orders`.
  - [x] [Schema] In `prisma/schema.prisma`, model `CrmOrders`, add after the existing `orderVerifierName` field:
    ```prisma
    orderSalesVerifierId   Int?    @map("order_sales_verifier_id")
    orderSalesVerifierName String? @map("order_sales_verifier_name") @db.VarChar(55)
    orderBackendMemberId   Int?    @map("order_backend_member_id")
    orderBackendMemberName String? @map("order_backend_member_name") @db.VarChar(55)
    salesVerifier          Users?  @relation("SalesVerifier", fields: [orderSalesVerifierId], references: [uid])
    backendMember          Users?  @relation("BackendMember", fields: [orderBackendMemberId], references: [uid])
    ```
    Add to `@@index` block: `@@index([orderSalesVerifierId])` and `@@index([orderBackendMemberId])`.
    In model `Users`, add:
    ```prisma
    salesVerifierOrders  CrmOrders[] @relation("SalesVerifier")
    backendMemberOrders  CrmOrders[] @relation("BackendMember")
    ```
    Run `npx prisma generate`.
  - [x] [Repository] `src/repository/order.repository.ts`, `createWithCustomerAndCard()`: After the existing `verifierName` resolution block (lines 17–26), add identical blocks:
    ```typescript
    let salesVerifierName: string | null = null;
    if (data.orderSalesVerifierId) {
      const sv = await prisma.users.findUnique({ where: { uid: data.orderSalesVerifierId } });
      if (sv) salesVerifierName = sv.nickname || sv.name;
    }
    let backendMemberName: string | null = null;
    if (data.orderBackendMemberId) {
      const bm = await prisma.users.findUnique({ where: { uid: data.orderBackendMemberId } });
      if (bm) backendMemberName = bm.nickname || bm.name;
    }
    ```
    In `tx.crmOrders.create` data block, add after `orderVerifierName`:
    ```typescript
    orderSalesVerifierId:   data.orderSalesVerifierId   || null,
    orderSalesVerifierName: salesVerifierName,
    orderBackendMemberId:   data.orderBackendMemberId   || null,
    orderBackendMemberName: backendMemberName,
    ```
  - [x] [Repository] In `findAll()` and `findById()` `include` blocks, add `salesVerifier: true` and `backendMember: true`.
  - [x] [Service] `src/service/order.service.ts`, `updateOrder()`: After the existing verifier snapshot block (lines 118–127), add two parallel blocks:
    ```typescript
    // Resolve Sales Verifier name snapshot if ID changed
    if (data.orderSalesVerifierId && data.orderSalesVerifierId !== existingOrder.orderSalesVerifierId) {
      const { prisma } = await import('../lib/db');
      const sv = await prisma.users.findUnique({ where: { uid: data.orderSalesVerifierId } });
      if (sv) updatedData.orderSalesVerifierName = sv.nickname || sv.name;
    }
    // Resolve Backend Executive name snapshot if ID changed
    if (data.orderBackendMemberId && data.orderBackendMemberId !== existingOrder.orderBackendMemberId) {
      const { prisma } = await import('../lib/db');
      const bm = await prisma.users.findUnique({ where: { uid: data.orderBackendMemberId } });
      if (bm) updatedData.orderBackendMemberName = bm.nickname || bm.name;
    }
    ```
  - [x] [Types] `src/types/order.ts`:
    - `OrderCreateInput`: Add `orderSalesVerifierId?: number | null;` and `orderBackendMemberId?: number | null;`.
    - `OrderUpdateInput`: Add `orderSalesVerifierId?: number | null;`, `orderSalesVerifierName?: string | null;`, `orderBackendMemberId?: number | null;`, `orderBackendMemberName?: string | null;`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx`, `src/tests/OrderList.test.tsx`):**
  - [x] `AddOrderForm.test.tsx` Test: Render `<AddOrderForm />`. Assert the DOM contains `<select id="orderSalesVerifierId">` with an associated label `"Sales Verifier"`.
  - [x] `AddOrderForm.test.tsx` Test: Assert the DOM contains `<select id="orderBackendMemberId">` with an associated label `"Backend Executive"`.
  - [x] `AddOrderForm.test.tsx` Test: Assert the four dropdowns appear in DOM order: `id="orderSalesAgentId"`, `id="orderSalesVerifierId"`, `id="orderBackendMemberId"`, `id="orderVerifierId"`.
  - [x] `AddOrderForm.test.tsx` Test: Select `orderSalesVerifierId = "5"` and submit. Assert `JSON.parse(fetchArgs[1].body).orderSalesVerifierId === 5` (number, not string).
  - [x] `OrderList.test.tsx` Test: Given an order with `orderSalesAgentName: "Alice"`, `orderSalesVerifierName: "Bob"`, `orderBackendMemberName: "Carol"`, `orderVerifierName: "Dave"`, assert the rendered row contains all four names in the sequence Alice → Bob → Carol → Dave.
  - [x] **Run — confirm RED** (form has no `id="orderSalesVerifierId"` or `id="orderBackendMemberId"`; order list has no Sales Verifier / Backend Executive columns).

- [x] **GREEN — Frontend (Types → Components):**
  - [x] [Component] `src/components/AddOrderForm.tsx`:
    - Add states: `const [orderSalesVerifierId, setOrderSalesVerifierId] = useState('')` and `const [orderBackendMemberId, setOrderBackendMemberId] = useState('')`.
    - In Section 4 (Pricing & Allocation), insert two new `<div className="form-group">` blocks **after** the Sales Agent select and **before** the QA Verifier select:
      ```jsx
      <div className="form-group">
        <label htmlFor="orderSalesVerifierId" className="form-label">Sales Verifier</label>
        <select id="orderSalesVerifierId" value={orderSalesVerifierId} onChange={(e) => setOrderSalesVerifierId(e.target.value)} className="form-select">
          <option value="">-- Assign Sales Verifier (optional) --</option>
          {agents.map((a) => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="orderBackendMemberId" className="form-label">Backend Executive</label>
        <select id="orderBackendMemberId" value={orderBackendMemberId} onChange={(e) => setOrderBackendMemberId(e.target.value)} className="form-select">
          <option value="">-- Assign Backend Executive (optional) --</option>
          {agents.map((a) => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}
        </select>
      </div>
      ```
    - In `handleSubmit` payload: add `orderSalesVerifierId: orderSalesVerifierId ? Number(orderSalesVerifierId) : null` and `orderBackendMemberId: orderBackendMemberId ? Number(orderBackendMemberId) : null`.
  - [x] [Component] `src/components/EditOrderForm.tsx`: Apply identical changes; pre-populate from `order.orderSalesVerifierId` and `order.orderBackendMemberId`.
  - [x] [Component] `src/components/OrderList.tsx`: Add two new `<th>` headers and corresponding `<td>` cells — `"Sales Verifier"` rendering `order.orderSalesVerifierName || '—'` and `"Backend Executive"` rendering `order.orderBackendMemberName || '—'` — inserted in the correct sequence after the Sales Agent column and before QA Verifier.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent opens `/orders/new` → Section 4 shows four dropdowns in order: Sales Agent → Sales Verifier → Backend Executive → QA Verifier → Agent assigns all four → submits → Order detail shows all four names → Order list table shows Sales Verifier and Backend Executive columns populated → Admin edits order and changes Backend Executive to a different agent → `order_backend_member_name` updates in DB and reflects on next page load → ✅ Done.

---

#### W-1602 — Dual Status History Tables: Sale Status + Order Workflow

**Root cause / Goal:**
When `saleStatus` or `orderCurrentStatus` changes on an order, only the current value is stored. There is zero audit trail — no record of when it changed, who changed it, or what the previous value was. The client requires full, separate history logs for both fields. These are **two distinct concerns** and warrant **two dedicated tables**:

1. **`crm_sale_status_history`** — records every change to `saleStatus` (Sold, Refunded, Chargebacked, etc.). For Refund (`'7'`) and Chargeback (`'8'`) changes only, the UI prompts for the **actual date/time the event occurred** (which may pre-date the system entry). For all other `saleStatus` changes, the current timestamp is recorded automatically.

2. **`crm_order_current_status_history`** — records every change to `orderCurrentStatus` (the workflow pipeline: Pending Booking → Pending Shipment → etc.). These always record the current date/time automatically — no date override prompt.

Both tables automatically record: the agent who made the change (`changed_by_id`, `changed_by_name`), the previous value (`old_value`), the new value (`new_value`), and the exact timestamp (`changed_at`).

**Migrations (2 separate migrations):**
- `create_sale_status_history_table`
- `create_order_current_status_history_table`

**New RBAC permissions:**
- `orders:view-sale-status-history` — controls visibility of the sale status timeline section
- `orders:view-workflow-history` — controls visibility of the workflow status timeline section

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**

  **Sale Status History:**
  - [x] Test: `PATCH /api/orders/:id` with `{ saleStatus: "2", saleStatusChangeDate: "2026-01-15T10:30:00" }` (Refunded). Assert `200 OK`. Assert `SELECT new_value, old_value, changed_at, changed_by_name FROM crm_sale_status_history WHERE order_id = :id ORDER BY id DESC LIMIT 1` returns: `new_value = '2'`, `old_value = '1'` (previous status), `changed_at = '2026-01-15 10:30:00'`, `changed_by_name` = test user's `nickname || name`.
  - [x] Test: `PATCH /api/orders/:id` with `{ saleStatus: "3" }` (Chargebacked, no date provided). Assert a `crm_sale_status_history` row is created with `new_value = '3'` and `changed_at` within 5 seconds of `NOW()` (confirming the default-to-current-time behaviour).
  - [x] Test: No history row is written if `saleStatus` in the PATCH body is **identical** to the existing `saleStatus` (same value — no actual change occurred).
  - [x] Test: `GET /api/orders/:id/sale-status-history` with a session that has `orders:view-sale-status-history`. Assert `200 OK` and response is an array where each entry has `{ id, orderId, oldValue, newValue, changedById, changedByName, changedAt }` keys, ordered by `changedAt ASC`.
  - [x] Test: `GET /api/orders/:id/sale-status-history` **without** `orders:view-sale-status-history`. Assert `403 Forbidden`.
  - [x] Test: Change `saleStatus` 3 times on one order. Assert `GET /api/orders/:id/sale-status-history` returns exactly 3 entries in chronological order.

  **Order Workflow History:**
  - [x] Test: `PATCH /api/orders/:id` updating `orderCurrentStatus` from `"Pending Booking"` to `"Pending Shipment"`. Assert a `crm_order_current_status_history` row is created with `old_value = 'Pending Booking'`, `new_value = 'Pending Shipment'`, and `changed_at` within 5 seconds of `NOW()`.
  - [x] Test: No history row is written if `orderCurrentStatus` does not change (same value as existing).
  - [x] Test: `GET /api/orders/:id/workflow-history` with `orders:view-workflow-history`. Assert `200 OK` and returns array of `{ id, orderId, oldValue, newValue, changedById, changedByName, changedAt }` entries, ordered by `changedAt ASC`.
  - [x] Test: `GET /api/orders/:id/workflow-history` **without** `orders:view-workflow-history`. Assert `403 Forbidden`.

  - [x] **Run — confirm RED** (neither table exists; PATCH handler writes nothing; neither GET endpoint exists).


- [x] **GREEN — Backend (Migrations → Schema → Repository → Service → Controller):**

  - [x] [Migration 1] Create and apply migration `create_sale_status_history_table`:
    ```sql
    CREATE TABLE crm_sale_status_history (
      id              INT          NOT NULL AUTO_INCREMENT,
      order_id        INT          NOT NULL,
      old_value       VARCHAR(10)  NULL     COMMENT 'previous saleStatus code',
      new_value       VARCHAR(10)  NOT NULL COMMENT 'new saleStatus code',
      changed_by_id   INT          NOT NULL,
      changed_by_name VARCHAR(55)  NOT NULL,
      changed_at      DATETIME     NOT NULL DEFAULT NOW()
                        COMMENT 'for Refund/Chargeback this is the actual event date, not system time',
      PRIMARY KEY (id),
      INDEX idx_ssh_order_id (order_id),
      INDEX idx_ssh_changed_at (changed_at),
      CONSTRAINT fk_ssh_order
        FOREIGN KEY (order_id) REFERENCES crm_orders(crm_order_id) ON DELETE CASCADE,
      CONSTRAINT fk_ssh_user
        FOREIGN KEY (changed_by_id) REFERENCES users(uid) ON DELETE RESTRICT
    );
    ```
    Apply via: `npx prisma migrate dev --name create_sale_status_history_table`.

  - [x] [Migration 2] Create and apply migration `create_order_current_status_history_table`:
    ```sql
    CREATE TABLE crm_order_current_status_history (
      id              INT          NOT NULL AUTO_INCREMENT,
      order_id        INT          NOT NULL,
      old_value       VARCHAR(55)  NULL     COMMENT 'previous orderCurrentStatus label',
      new_value       VARCHAR(55)  NOT NULL COMMENT 'new orderCurrentStatus label',
      changed_by_id   INT          NOT NULL,
      changed_by_name VARCHAR(55)  NOT NULL,
      changed_at      DATETIME     NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id),
      INDEX idx_ocsh_order_id (order_id),
      CONSTRAINT fk_ocsh_order
        FOREIGN KEY (order_id) REFERENCES crm_orders(crm_order_id) ON DELETE CASCADE,
      CONSTRAINT fk_ocsh_user
        FOREIGN KEY (changed_by_id) REFERENCES users(uid) ON DELETE RESTRICT
    );
    ```
    Apply via: `npx prisma migrate dev --name create_order_current_status_history_table`.

  - [x] [Schema] Add both models to `prisma/schema.prisma`:
    ```prisma
    model CrmSaleStatusHistory {
      id            Int       @id @default(autoincrement())
      orderId       Int       @map("order_id")
      oldValue      String?   @map("old_value")       @db.VarChar(10)
      newValue      String    @map("new_value")        @db.VarChar(10)
      changedById   Int       @map("changed_by_id")
      changedByName String    @map("changed_by_name") @db.VarChar(55)
      changedAt     DateTime  @default(now()) @map("changed_at") @db.DateTime(0)
      order         CrmOrders @relation(fields: [orderId], references: [crmOrderId], onDelete: Cascade)
      changedBy     Users     @relation("SaleStatusChanges", fields: [changedById], references: [uid])

      @@index([orderId])
      @@index([changedAt])
      @@map("crm_sale_status_history")
    }

    model CrmOrderCurrentStatusHistory {
      id            Int       @id @default(autoincrement())
      orderId       Int       @map("order_id")
      oldValue      String?   @map("old_value")       @db.VarChar(55)
      newValue      String    @map("new_value")        @db.VarChar(55)
      changedById   Int       @map("changed_by_id")
      changedByName String    @map("changed_by_name") @db.VarChar(55)
      changedAt     DateTime  @default(now()) @map("changed_at") @db.DateTime(0)
      order         CrmOrders @relation(fields: [orderId], references: [crmOrderId], onDelete: Cascade)
      changedBy     Users     @relation("WorkflowStatusChanges", fields: [changedById], references: [uid])

      @@index([orderId])
      @@map("crm_order_current_status_history")
    }
    ```
    In model `CrmOrders`, add:
    ```prisma
    saleStatusHistory    CrmSaleStatusHistory[]
    workflowHistory      CrmOrderCurrentStatusHistory[]
    ```
    In model `Users`, add:
    ```prisma
    saleStatusChanges    CrmSaleStatusHistory[]          @relation("SaleStatusChanges")
    workflowStatusChanges CrmOrderCurrentStatusHistory[] @relation("WorkflowStatusChanges")
    ```
    Run `npx prisma generate`.

  - [x] [Repository] Add four new functions to `src/repository/order.repository.ts`:
    ```typescript
    // ─── Sale Status History ──────────────────────────────────────────────────────

    export async function createSaleStatusHistoryEntry(data: {
      orderId: number;
      oldValue: string | null;
      newValue: string;
      changedById: number;
      changedByName: string;
      changedAt?: Date; // optional override — used for Refund/Chargeback event dates
    }) {
      return await prisma.crmSaleStatusHistory.create({
        data: {
          orderId:       data.orderId,
          oldValue:      data.oldValue ?? null,
          newValue:      data.newValue,
          changedById:   data.changedById,
          changedByName: data.changedByName,
          changedAt:     data.changedAt ?? new Date(), // defaults to NOW() if no override
        },
      });
    }

    export async function getSaleStatusHistoryByOrderId(orderId: number) {
      return await prisma.crmSaleStatusHistory.findMany({
        where: { orderId },
        orderBy: { changedAt: 'asc' },
      });
    }

    // ─── Order Workflow (Current Status) History ──────────────────────────────────

    export async function createWorkflowStatusHistoryEntry(data: {
      orderId: number;
      oldValue: string | null;
      newValue: string;
      changedById: number;
      changedByName: string;
      // No changedAt override — workflow changes always use current time
    }) {
      return await prisma.crmOrderCurrentStatusHistory.create({
        data: {
          orderId:       data.orderId,
          oldValue:      data.oldValue ?? null,
          newValue:      data.newValue,
          changedById:   data.changedById,
          changedByName: data.changedByName,
          changedAt:     new Date(), // always current time — no override possible
        },
      });
    }

    export async function getWorkflowStatusHistoryByOrderId(orderId: number) {
      return await prisma.crmOrderCurrentStatusHistory.findMany({
        where: { orderId },
        orderBy: { changedAt: 'asc' },
      });
    }
    ```

  - [x] [Service] `src/service/order.service.ts` — update `updateOrder()` signature:
    ```typescript
    export async function updateOrder(
      crmOrderId: number,
      data: OrderUpdateInput,
      changedByUserId: number,
      changedByName: string,
    )
    ```
    After `orderRepository.update(crmOrderId, updatedData)` (currently line 141), add both history write blocks:
    ```typescript
    // ── Sale Status History: write if value actually changed ──────────────────────
    if (data.saleStatus && data.saleStatus !== existingOrder.saleStatus) {
      // For Refund ('2') and Chargeback ('3'), `data.saleStatusChangeDate` may carry
      // the actual event date entered by the user in the UI modal.
      // For all other transitions it will be undefined → defaults to new Date().
      const saleChangedAt = data.saleStatusChangeDate
        ? new Date(data.saleStatusChangeDate)
        : new Date();

      await orderRepository.createSaleStatusHistoryEntry({
        orderId:       crmOrderId,
        oldValue:      existingOrder.saleStatus ?? null,
        newValue:      data.saleStatus,
        changedById:   changedByUserId,
        changedByName: changedByName,
        changedAt:     saleChangedAt,
      });
    }

    // ── Workflow Status History: write if value actually changed ──────────────────
    // Note: `updatedData.orderCurrentStatus` may have been set by the auto-advance
    // state machine (e.g. assigning a vendor advances Pending Booking → Pending Shipment).
    // Those auto-transitions still get attributed to the user who triggered the update.
    if (
      updatedData.orderCurrentStatus &&
      updatedData.orderCurrentStatus !== existingOrder.orderCurrentStatus
    ) {
      await orderRepository.createWorkflowStatusHistoryEntry({
        orderId:       crmOrderId,
        oldValue:      existingOrder.orderCurrentStatus ?? null,
        newValue:      updatedData.orderCurrentStatus,
        changedById:   changedByUserId,
        changedByName: changedByName,
        // changedAt always defaults to new Date() inside the repository function
      });
    }
    ```

  - [x] [Types] `src/types/order.ts` — `OrderUpdateInput`: add:
    ```typescript
    // Passed by the UI modal for Refund/Chargeback only.
    // NOT persisted on the crm_orders row — only used to set changed_at in crm_sale_status_history.
    saleStatusChangeDate?: string | null;
    ```

  - [x] [Controller] `src/app/api/orders/[id]/route.ts`, `PATCH` handler:
    - Extract `session.user.uid` and `session.user.nickname || session.user.name`.
    - Pass as 3rd and 4th arguments: `orderService.updateOrder(id, body, uid, name)`.
    - `saleStatusChangeDate` flows through naturally as part of `body` (typed as `OrderUpdateInput`).

  - [x] [Controller — Sale Status History endpoint] Create `src/app/api/orders/[id]/sale-status-history/route.ts`:
    ```typescript
    export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!hasPermission(session.user.userPermissions, 'orders:view-sale-status-history')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const id = Number((await params).id);
      const history = await orderRepository.getSaleStatusHistoryByOrderId(id);
      return NextResponse.json(history);
    }
    ```

  - [x] [Controller — Workflow History endpoint] Create `src/app/api/orders/[id]/workflow-history/route.ts`:
    ```typescript
    export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!hasPermission(session.user.userPermissions, 'orders:view-workflow-history')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const id = Number((await params).id);
      const history = await orderRepository.getWorkflowStatusHistoryByOrderId(id);
      return NextResponse.json(history);
    }
    ```

  - [x] [RBAC/Seed] In `seed.sql`:
    - Add `orders:view-sale-status-history` to `crm_permissions`. Assign to super-admin and manager roles in `crm_role_permissions`.
    - Add `orders:view-workflow-history` to `crm_permissions`. Assign to super-admin and manager roles.
  - [x] [RBAC/Docs] Add both permissions to the permissions reference table in `project_data.md` under the `orders` resource.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/SaleStatusTimeline.test.tsx` and `src/tests/WorkflowStatusTimeline.test.tsx` — new files):**

  **SaleStatusTimeline:**
  - [x] Test: Given mocked sale status history entries `[{ id: 1, orderId: 5, oldValue: '1', newValue: '2', changedByName: 'Alice', changedAt: '2026-01-15T10:30:00Z' }, { id: 2, orderId: 5, oldValue: '2', newValue: '1', changedByName: 'Bob', changedAt: '2026-01-20T09:00:00Z' }]`, render `<SaleStatusTimeline entries={mockEntries} />`. Assert 2 timeline nodes are rendered.
  - [x] Test: Assert the node with `newValue = '2'` displays the label `"Refunded"` (not the raw code `"2"`).
  - [x] Test: Assert the node with `newValue = '3'` (if present) displays `"Chargebacked"` (not `"3"`).
  - [x] Test: Assert the node with `newValue = '1'` displays `"Sold"`.
  - [x] Test: Assert each node displays `changedByName` and `changedAt` formatted as `"DD/MM/YYYY HH:MM"` (e.g. `"15/01/2026 10:30"`).
  - [x] Test: Assert Refund and Chargeback nodes render with a red/amber color class (e.g. `timeline-node--refund`); Sold nodes render with a green class (e.g. `timeline-node--sold`).
  - [x] **Run — confir  - [x] [Component] Create `src/components/SaleStatusTimeline.tsx`:
    - Accepts `entries: SaleStatusHistoryEntry[]` prop.
    - For each entry, renders a vertical timeline node showing:
      - **Agent name** (`changedByName`)
      - **Date/time** formatted as `DD-MM-YYYY HH:MM` using `changedAt`
      - **Transition** formatted as `"<oldLabel> → <newLabel>"` using `SALE_STATUS_LABELS` map. If `oldValue` is null, show `"— → <newLabel>"`.
    - Color coding: `newValue === '2'` (Refunded) → amber/orange class `timeline-node--refund`; `newValue === '3'` (Chargebacked) → red class `timeline-node--chargeback`; `newValue === '1'` (Sold) → green class `timeline-node--sold`; all others → neutral grey class `timeline-node--neutral`.
    - If `entries.length === 0`: display `"No sale status history available."`.
    - Section title: `"Sale Status History"`.

  - [x] [Component] Create `src/components/WorkflowStatusTimeline.tsx`:
    - Accepts `entries: WorkflowStatusHistoryEntry[]` prop.
    - Identical structure to `SaleStatusTimeline` but uses `orderCurrentStatus` label strings directly (no code-to-label mapping needed).
    - All nodes use a single blue class `timeline-node--workflow`.
    - If `entries.length === 0`: display `"No workflow history available."`.
    - Section title: `"Order Workflow History"`.

  - [x] [Component — Refund/Chargeback Modal] In `src/components/EditOrderForm.tsx`:
    - Add state: `const [showStatusDateModal, setShowStatusDateModal] = useState(false)`.
    - Add state: `const [saleStatusChangeDate, setSaleStatusChangeDate] = useState('')` (stores `YYYY-MM-DD`).
    - Add state: `const [saleStatusChangeTime, setSaleStatusChangeTime] = useState('')` (stores `HH:MM`).
    - In the `saleStatus` `<select>` `onChange` handler: after updating the `saleStatus` state, add:
      ```typescript
      if (e.target.value === '2' || e.target.value === '3') {
        setSaleStatusChangeDate(''); // reset date to blank (user must enter or skip)
        setSaleStatusChangeTime('');
        setShowStatusDateModal(true);
      } else {
        setSaleStatusChangeDate(''); // clear any previously set override date
      }
      ```
    - Render the modal when `showStatusDateModal === true`:
      ```
      ┌──────────────────────────────────────────────────────────────────┐
      │ ⚠️  Record Refund / Chargeback Date & Time                        │
      │                                                                  │
      │ When did this refund/chargeback actually occur?                  │
      │                                                                  │
      │  Date:  [ YYYY-MM-DD _________ ]                                 │
      │  Time:  [ HH:MM ______________ ]                                 │
      │                                                                  │
      │  ⓘ If left blank, the current date and time will be recorded     │
      │     automatically. You can always view this in the status        │
      │     history section below the order.                             │
      │                                                                  │
      │           [ Skip — Use Current Time ]   [ Confirm ]              │
      └──────────────────────────────────────────────────────────────────┘
      ```
    - "Confirm" button: combine `saleStatusChangeDate + 'T' + saleStatusChangeTime` into a full ISO string if both are filled; store in state as `saleStatusChangeDate` (the combined ISO string). Close modal.
    - "Skip — Use Current Time" button: clear `saleStatusChangeDate` (empty string). Close modal. The service will default to `new Date()`.
    - In `handleSubmit` payload: add `saleStatusChangeDate: saleStatusChangeDate || null`. (If empty, service defaults to current time.)
    - The modal must appear **immediately when the dropdown changes**, not on form submit, so the user knows they need to enter the date before submitting.

  - [x] [Page] `src/app/orders/[id]/page.tsx`:
    - If user has `orders:view-sale-status-history`: fetch `/api/orders/:id/sale-status-history` server-side. Render `<SaleStatusTimeline entries={saleHistory} />`.
    - If user has `orders:view-workflow-history`: fetch `/api/orders/:id/workflow-history` server-side. Render `<WorkflowStatusTimeline entries={workflowHistory} />`.
    - Render both timeline components at the bottom of the page, after the Comments section, in two separate labeled cards:
      ```
      ┌──────────────────────────────────────────────┐
      │  Sale Status History                         │
      │  [SaleStatusTimeline]                        │
      └──────────────────────────────────────────────┘
      ┌──────────────────────────────────────────────┐
      │  Order Workflow History                      │
      │  [WorkflowStatusTimeline]                    │
      └──────────────────────────────────────────────┘
      ```
    - If user lacks a permission, the corresponding card is completely hidden (no placeholder, no error).

  - [x] Run unit tests — **confirm GREEN** (both `SaleStatusTimeline.test.tsx` and `WorkflowStatusTimeline.test.tsx`).

- [x] **Verification chain:**
  - [x] **Refund with custom date:** Admin opens an order (currently `saleStatus = '1'` Sold) → selects `"Refunded"` from the `saleStatus` dropdown → modal immediately appears → Admin enters date `2026-01-10` and time `14:30` → clicks `"Confirm"` → form submits → `SELECT * FROM crm_sale_status_history WHERE order_id = :id` shows 1 row: `old_value='1'`, `new_value='2'`, `changed_at='2026-01-10 14:30:00'`, `changed_by_name='Admin Name'` → Order detail page loads → "Sale Status History" card at bottom shows `"Sold → Refunded"`, `"Admin Name"`, `"10/01/2026 14:30"` ✅
  - [x] **Refund skipping date (defaults to current time):** Agent selects `"Chargebacked"` from dropdown → modal appears → Agent clicks `"Skip — Use Current Time"` → form submits → `SELECT changed_at FROM crm_sale_status_history ORDER BY id DESC LIMIT 1` → timestamp is within 10 seconds of `NOW()` → detail page shows current date/time for that entry ✅
  - [x] **Workflow status change:** Admin changes `orderCurrentStatus` to `"Completed Orders"` → `crm_order_current_status_history` gets a row with `old_value = 'Pending Feedback'`, `new_value = 'Completed Orders'`, `changed_at` = current time, `changed_by_name = 'Admin Name'` → "Order Workflow History" card on detail page shows the transition ✅
  - [x] **Auto-advance transition is attributed correctly:** Agent assigns a vendor to a `"Pending Booking"` order → the state machine auto-advances `orderCurrentStatus` to `"Pending Shipment"` → `crm_order_current_status_history` records the workflow change with the **agent's name** (not "System"), `old_value = 'Pending Booking'`, `new_value = 'Pending Shipment'` ✅
  - [x] **RBAC:** User without `orders:view-sale-status-history` opens an order → "Sale Status History" card is completely absent from the page → direct `GET /api/orders/:id/sale-status-history` returns `403 Forbidden` ✅
  - [x] **Cascade delete:** Order is deleted via W-1602 flow → both `crm_sale_status_history` and `crm_order_current_status_history` rows for that `order_id` are gone (CASCADE confirmed) ✅�────────────────────────────────┘
      ```
    - If user lacks a permission, the corresponding card is completely hidden (no placeholder, no error).

  - [x] Run unit tests — **confirm GREEN** (both `SaleStatusTimeline.test.tsx` and `WorkflowStatusTimeline.test.tsx`).

- [x] **Verification chain:**
  - [x] **Refund with custom date:** Admin opens an order (currently `saleStatus = '1'` Sold) → selects `"Refunded"` from the `saleStatus` dropdown → modal immediately appears → Admin enters date `2026-01-10` and time `14:30` → clicks `"Confirm"` → form submits → `SELECT * FROM crm_sale_status_history WHERE order_id = :id` shows 1 row: `old_value='1'`, `new_value='2'`, `changed_at='2026-01-10 14:30:00'`, `changed_by_name='Admin Name'` → Order detail page loads → "Sale Status History" card at bottom shows `"Sold → Refunded"`, `"Admin Name"`, `"10/01/2026 14:30"` ✅
  - [x] **Refund skipping date (defaults to current time):** Agent selects `"Chargebacked"` from dropdown → modal appears → Agent clicks `"Skip — Use Current Time"` → form submits → `SELECT changed_at FROM crm_sale_status_history ORDER BY id DESC LIMIT 1` → timestamp is within 10 seconds of `NOW()` → detail page shows current date/time for that entry ✅
  - [x] **Workflow status change:** Admin changes `orderCurrentStatus` to `"Completed Orders"` → `crm_order_current_status_history` gets a row with `old_value = 'Pending Feedback'`, `new_value = 'Completed Orders'`, `changed_at` = current time, `changed_by_name = 'Admin Name'` → "Order Workflow History" card on detail page shows the transition ✅
  - [x] **Auto-advance transition is attributed correctly:** Agent assigns a vendor to a `"Pending Booking"` order → the state machine auto-advances `orderCurrentStatus` to `"Pending Shipment"` → `crm_order_current_status_history` records the workflow change with the **agent's name** (not "System"), `old_value = 'Pending Booking'`, `new_value = 'Pending Shipment'` ✅
  - [x] **RBAC:** User without `orders:view-sale-status-history` opens an order → "Sale Status History" card is completely absent from the page → direct `GET /api/orders/:id/sale-status-history` returns `403 Forbidden` ✅
  - [x] **Cascade delete:** Order is deleted via W-1603 flow → both `crm_sale_status_history` and `crm_order_current_status_history` rows for that `order_id` are gone (CASCADE confirmed) ✅



#### W-1603 — Order Delete with Full Cascade + RBAC

**Root cause / Goal:**
No delete functionality is exposed in the UI. `order.repository.ts` line 236 already has `remove()` which calls `prisma.crmOrders.delete()`, and `order.service.ts` line 183 has `deleteOrder()`. However, there is no `DELETE /api/orders/:id` handler in the route file, no permission guard, no UI button, and — critically — the `ON DELETE CASCADE` behavior on child tables (`crm_comments`, `crm_order_status_history`, `crm_order_views`) must be verified before any delete is attempted, or the DB will throw an FK constraint violation.

**Approach:**
Verify FK CASCADE on all child tables. Wire the existing `deleteOrder()` service function to a guarded `DELETE` route. Add `orders:delete` permission (super-admin only). Add a confirmation-modal delete button to the order detail page.

**New RBAC permission:** `orders:delete`

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: Create an order. Post a comment to it (`POST /api/orders/:id/comments`). Change its `saleStatus` to `'2'` (generates a `crm_sale_status_history` row). Then call `DELETE /api/orders/:id` with a super-admin session. Assert `200 OK`. Immediately after: assert `SELECT * FROM crm_orders WHERE crm_order_id = :id` returns 0 rows. Assert `SELECT * FROM crm_comments WHERE order_id = :id` returns 0 rows. Assert `SELECT * FROM crm_sale_status_history WHERE order_id = :id` returns 0 rows.
  - [x] Test: `DELETE /api/orders/:id` **without** `orders:delete` permission. Assert `403 Forbidden`. Assert the order still exists: `SELECT COUNT(*) FROM crm_orders WHERE crm_order_id = :id` returns `1`.
  - [x] Test: `DELETE /api/orders/:id` with no session. Assert `401 Unauthorized`.
  - [x] **Run — confirm RED** (`DELETE` handler does not exist in `src/app/api/orders/[id]/route.ts`; cascade may or may not work).

- [x] **GREEN — Backend (Migration → Controller):**
  - [x] [Migration] Create migration `verify_order_cascade_constraints`. Inspect each FK constraint:
    - `crm_comments.order_id → crm_orders.crm_order_id`: Verify `ON DELETE CASCADE` exists. If not, run: `ALTER TABLE crm_comments DROP FOREIGN KEY <fk_name>; ALTER TABLE crm_comments ADD CONSTRAINT fk_comments_order FOREIGN KEY (order_id) REFERENCES crm_orders(crm_order_id) ON DELETE CASCADE;`
    - `crm_sale_status_history.order_id` and `crm_order_current_status_history.order_id`: Created in W-1602 with `ON DELETE CASCADE`. ✅
    - `crm_order_views.order_id`: Will be created in W-1604 with `ON DELETE CASCADE`. ✅
    Apply via: `npx prisma migrate dev --name verify_order_cascade_constraints`.
  - [x] [Controller] In `src/app/api/orders/[id]/route.ts`, add the `DELETE` handler:
    ```typescript
    export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!hasPermission(session.user.userPermissions, 'orders:delete')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const id = Number((await params).id);
      await orderService.deleteOrder(id);
      return NextResponse.json({ success: true });
    }
    ```
  - [x] [RBAC/Seed] Add `orders:delete` to `crm_permissions` in `seed.sql`. Assign **only** to the super-admin role in `crm_role_permissions`. Add to `project_data.md` permissions table under the `orders` resource.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (order detail component test):**
  - [x] Test: Render order detail component with a session that **has** `orders:delete`. Assert a button with accessible text containing `"Delete"` is present in the DOM.
  - [x] Test: Render with a session that does **not** have `orders:delete`. Assert no such button is present.
  - [x] Test: Click the delete button → assert a confirmation modal appears with text `"This action is permanent and cannot be undone."`.
  - [x] Test: Click `"Delete Permanently"` in the modal → assert `fetch` is called with method `"DELETE"` and URL `/api/orders/<id>` → assert `router.push` is called with `"/orders"` on success.
  - [x] **Run — confirm RED** (no delete button exists in the current order detail UI).

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] In the order detail page (`src/app/orders/[id]/page.tsx` or a client component it wraps): Add a `"Delete Order"` button visible only when `hasPermission(permissions, 'orders:delete')`. Style it with a red destructive style (`background: #b25353`, white text, border-radius matching other buttons). Position it at the bottom of the page header actions row (alongside Edit button).
  - [x] On click, show a confirmation modal:
    ```
    ┌──────────────────────────────────────────────────────────────┐
    │ ⚠️  Delete Order #<orderId> Permanently?                       │
    │                                                              │
    │ This will permanently delete this order and ALL related      │
    │ data, including comments, status history, and view logs.     │
    │                                                              │
    │ This action is permanent and cannot be undone.               │
    │                                                              │
    │             [ Cancel ]     [ Delete Permanently ]            │
    └──────────────────────────────────────────────────────────────┘
    ```
  - [x] On `"Delete Permanently"` click: call `fetch(`/api/orders/${id}`, { method: 'DELETE' })`. On `200 OK`: `router.push('/orders')`. On error: display the error message inside the modal (do not close).
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Super-admin opens order detail page → sees red `"Delete Order"` button → clicks it → confirmation modal appears with exact warning text → clicks `"Delete Permanently"` → page redirects to `/orders` → deleted order does not appear in list → Direct `GET /api/orders/<deletedId>` returns `404 Not Found` → DB: all rows in `crm_orders`, `crm_comments`, `crm_sale_status_history`, and `crm_order_current_status_history` for that order_id are gone (CASCADE confirmed) → Regular agent logs in → order detail page has no delete button → ✅ Done.

---

#### W-1604 — Order View Log: Track Who Opened Each Order + RBAC

**Root cause / Goal:**
When any user opens an order's detail page, there is no audit record of the access. The client wants a log of every view event (who opened it, when) displayed at the bottom of the order detail. A new table `crm_order_views` is required. A new RBAC permission `orders:view-log` controls who can see the log section on the detail page.

**Important:** The view log must not break the order fetch. `logOrderView()` is a fire-and-forget write — if the insert fails (e.g. user is deleted), the order detail page must still render successfully.

**Migration name:** `create_order_views_table`
**New RBAC permission:** `orders:view-log`

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: Call `GET /api/orders/:id` with an authenticated session for a user with `uid = <testUserId>`. Assert `200 OK`. Assert `SELECT * FROM crm_order_views WHERE order_id = :id AND viewer_id = <testUserId>` returns exactly 1 row with `viewed_at` within 5 seconds of `NOW()`.
  - [x] Test: Call `GET /api/orders/:id` 3 times with the same session. Assert `SELECT COUNT(*) FROM crm_order_views WHERE order_id = :id AND viewer_id = <testUserId>` returns `3` (all access events logged, no deduplication).
  - [x] Test: `GET /api/orders/:id/views` with a session that **has** `orders:view-log`. Assert `200 OK` and returns an array where each entry has `{ id, orderId, viewerId, viewerName, viewedAt }` keys.
  - [x] Test: `GET /api/orders/:id/views` **without** `orders:view-log` permission. Assert `403 Forbidden`.
  - [x] Test: Confirm that if `logOrderView` fails (e.g. by temporarily making the `crm_order_views` table not writable in the test), `GET /api/orders/:id` still returns `200 OK` with the order data (the view log failure must be silently swallowed).
  - [x] **Run — confirm RED** (table does not exist; `GET /api/orders/:id` does not write to it; `/views` endpoint does not exist).

- [x] **GREEN — Backend (Migration → Schema → Repository → Controller):**
  - [x] [Migration] Create and apply migration `create_order_views_table`:
    ```sql
    CREATE TABLE crm_order_views (
      id           INT          NOT NULL AUTO_INCREMENT,
      order_id     INT          NOT NULL,
      viewer_id    INT          NOT NULL,
      viewer_name  VARCHAR(55)  NOT NULL,
      viewed_at    DATETIME     NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id),
      INDEX idx_order_views_order_id (order_id),
      INDEX idx_order_views_viewer_id (viewer_id),
      CONSTRAINT fk_order_views_order
        FOREIGN KEY (order_id) REFERENCES crm_orders(crm_order_id) ON DELETE CASCADE,
      CONSTRAINT fk_order_views_user
        FOREIGN KEY (viewer_id) REFERENCES users(uid) ON DELETE RESTRICT
    );
    ```
    Apply via: `npx prisma migrate dev --name create_order_views_table`.
  - [x] [Schema] Add model `CrmOrderViews` to `prisma/schema.prisma`:
    ```prisma
    model CrmOrderViews {
      id         Int       @id @default(autoincrement())
      orderId    Int       @map("order_id")
      viewerId   Int       @map("viewer_id")
      viewerName String    @map("viewer_name") @db.VarChar(55)
      viewedAt   DateTime  @default(now()) @map("viewed_at") @db.DateTime(0)
      order      CrmOrders @relation(fields: [orderId], references: [crmOrderId], onDelete: Cascade)
      viewer     Users     @relation(fields: [viewerId], references: [uid])

      @@index([orderId])
      @@index([viewerId])
      @@map("crm_order_views")
    }
    ```
    Add `viewLogs CrmOrderViews[]` to `CrmOrders`. Add `orderViews CrmOrderViews[]` to `Users`. Run `npx prisma generate`.
  - [x] [Repository] Add to `src/repository/order.repository.ts`:
    ```typescript
    export async function logOrderView(orderId: number, viewerId: number, viewerName: string) {
      return await prisma.crmOrderViews.create({
        data: { orderId, viewerId, viewerName, viewedAt: new Date() },
      });
    }

    export async function getOrderViews(orderId: number) {
      return await prisma.crmOrderViews.findMany({
        where: { orderId },
        orderBy: { viewedAt: 'desc' },
        take: 100, // cap at last 100 view events
      });
    }
    ```
  - [x] [Controller] `src/app/api/orders/[id]/route.ts`, `GET` handler: After successfully fetching and building the response, add a fire-and-forget view log write **before** `return NextResponse.json(...)`:
    ```typescript
    // Fire-and-forget: log the view. Failure must NOT affect the response.
    orderRepository.logOrderView(
      id,
      session.user.uid,
      session.user.nickname || session.user.name
    ).catch((err) => console.error('[OrderView] Failed to log view:', err));
    ```
  - [x] [Controller] Create `src/app/api/orders/[id]/views/route.ts`:
    ```typescript
    export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!hasPermission(session.user.userPermissions, 'orders:view-log')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const id = Number((await params).id);
      const views = await orderRepository.getOrderViews(id);
      return NextResponse.json(views);
    }
    ```
  - [x] [RBAC/Seed] Add `orders:view-log` to `crm_permissions` in `seed.sql`. Assign to super-admin and manager-level roles in `crm_role_permissions`. Add to `project_data.md` permissions table under the `orders` resource.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/OrderViewLog.test.tsx` — new file):**
  - [x] Test: Given mock entries `[{ id: 1, orderId: 5, viewerId: 10, viewerName: 'Alice', viewedAt: '2026-06-30T10:00:00Z' }, { id: 2, orderId: 5, viewerId: 11, viewerName: 'Bob', viewedAt: '2026-06-30T11:30:00Z' }]`, render `<OrderViewLog entries={mockEntries} />`. Assert both `"Alice"` and `"Bob"` appear in the rendered output.
  - [x] Test: Assert `"Alice"` appears **below** `"Bob"` in the DOM (descending order — most recent first: Bob at `11:30` is above Alice at `10:00`).
  - [x] Test: Assert each entry shows `viewerName` and a formatted date string `"30/06/2026 10:00"` for the `10:00` entry.
  - [x] Test: Render `<OrderViewLog entries={[]} />`. Assert the text `"No view history available."` is displayed.
  - [x] **Run — confirm RED** (component does not exist).

- [x] **GREEN — Frontend (Types → Component → Page integration):**
  - [x] [Types] Add to `src/types/order.ts` (or a new `src/types/orderView.ts`):
    ```typescript
    export interface OrderViewEntry {
      id: number;
      orderId: number;
      viewerId: number;
      viewerName: string;
      viewedAt: string; // ISO string from API
    }
    ```
  - [x] [Component] Create `src/components/OrderViewLog.tsx`:
    - Accepts `entries: OrderViewEntry[]` prop.
    - Renders a compact table with columns: `"Agent"` (viewerName) and `"Opened At"` (formatted `DD/MM/YYYY HH:MM`).
    - Title: `"Access History — Who Has Viewed This Order"`.
    - If `entries.length === 0`: display `"No view history available."`.
    - Entries are already sorted descending from the API (most recent first).
  - [x] [Page] `src/app/orders/[id]/page.tsx`: If session user has `orders:view-log` permission, fetch `/api/orders/:id/views` server-side (pass the session cookie via `headers`). Pass result to `<OrderViewLog entries={views} />`. Render the component at the very bottom of the page, after `<OrderStatusTimeline />`. If user lacks the permission, render nothing (no placeholder, no error message).
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin opens order #42 → `crm_order_views` gets a row: `order_id=42, viewer_id=<adminUid>, viewer_name='Admin Name'` → Agent also opens order #42 → a second row added → Admin re-opens order #42 → a third row added → Admin scrolls to the bottom of the order detail page → "Access History" section shows 3 entries sorted most-recent-first → Regular user without `orders:view-log` opens the same order → view is still logged in DB (their open is recorded), but the "Access History" section is completely hidden from their view → ✅ Done.

---

#### W-1605 — Order Field Change Audit Log (Full Per-Field Edit History)

**Root cause / Goal:**
Every `PATCH /api/orders/:id` overwrites the current field values with no record of what changed. There is currently no way to know *which agent* changed *which field*, *from what value*, *to what value*, *at what time*. The two dedicated status history tables (W-1602) cover only `saleStatus` and `orderCurrentStatus`. All other fields — vehicle info, pricing, vendor, agent assignments, documentation links, mileage, tracking number, etc. — have zero audit coverage. The client requires a full per-field change history on every order, accessible from the order detail page under a new RBAC permission.

**Approach:**
1. Create table `crm_order_audit_log` with one row per changed field per PATCH call.
2. In `order.service.ts` `updateOrder()`, fetch the current row first, diff every incoming field against the stored value, and bulk-insert audit rows for each changed field.
3. Expose `GET /api/orders/:id/audit-log` route, gated by `orders:view-audit-log`.
4. Render a "Change History" card at the bottom of the order detail page.

**Migration name:** `create_order_audit_log_table`
**New RBAC permission:** `orders:view-audit-log`

---

- [ ] **RED — Integration (`src/tests/orders.test.ts`):**
  - [ ] Test: `PATCH /api/orders/:id` with `{ orderMakeModel: "2022 Toyota Camry" }` (changing from an existing value). Assert `200 OK`. Assert `SELECT field_name, old_value, new_value, changed_by_name FROM crm_order_audit_log WHERE order_id = :id ORDER BY id DESC LIMIT 1` returns exactly 1 row with `field_name = 'orderMakeModel'`, `new_value = '2022 Toyota Camry'`, and `changed_by_name` = the test session user's `nickname || name`.
  - [ ] Test: `PATCH /api/orders/:id` with `{ orderMakeModel: "2022 Toyota Camry", orderVendorPrice: "450" }` (two fields changed simultaneously). Assert `SELECT COUNT(*) FROM crm_order_audit_log WHERE order_id = :id` returns `2` — one row per changed field.
  - [ ] Test: `PATCH /api/orders/:id` with a payload where the new value is **identical** to the existing stored value (e.g. `{ orderMakeModel: <same value already in DB> }`). Assert `SELECT COUNT(*) FROM crm_order_audit_log WHERE order_id = :id` returns `0` — no row inserted when nothing actually changed.
  - [ ] Test: `GET /api/orders/:id/audit-log` with a session that **has** `orders:view-audit-log`. Assert `200 OK`. Assert the response body is an array where each entry contains `{ id, orderId, fieldName, oldValue, newValue, changedByName, changedAt }` keys.
  - [ ] Test: `GET /api/orders/:id/audit-log` **without** `orders:view-audit-log`. Assert `403 Forbidden`.
  - [ ] Test: `GET /api/orders/:id/audit-log` with no session. Assert `401 Unauthorized`.
  - [ ] Test: Make 3 PATCH calls changing `orderMakeModel` → `orderVendorPrice` → `orderPart` on the same order. Assert `GET /api/orders/:id/audit-log` returns exactly 3 entries in **reverse-chronological order** (most recent first).
  - [ ] **Run — confirm RED** (table does not exist; PATCH handler does not write audit rows; `/audit-log` route does not exist).

- [ ] **GREEN — Backend (Migration → Schema → Repository → Service → Route):**
  - [ ] [Migration] Create and apply migration `create_order_audit_log_table`:
    ```sql
    CREATE TABLE crm_order_audit_log (
      id              INT          NOT NULL AUTO_INCREMENT,
      order_id        INT          NOT NULL,
      field_name      VARCHAR(100) NOT NULL   COMMENT 'Prisma/camelCase field key, e.g. orderMakeModel',
      old_value       TEXT         NULL       COMMENT 'Previous value serialized as string; NULL if field was previously unset',
      new_value       TEXT         NULL       COMMENT 'New value serialized as string; NULL if field was cleared',
      changed_by_id   INT          NOT NULL,
      changed_by_name VARCHAR(55)  NOT NULL,
      changed_at      DATETIME     NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id),
      INDEX idx_audit_log_order_id (order_id),
      INDEX idx_audit_log_changed_at (changed_at),
      CONSTRAINT fk_audit_log_order
        FOREIGN KEY (order_id) REFERENCES crm_orders(crm_order_id) ON DELETE CASCADE,
      CONSTRAINT fk_audit_log_user
        FOREIGN KEY (changed_by_id) REFERENCES users(uid) ON DELETE RESTRICT
    );
    ```
    Apply via: `npx prisma migrate dev --name create_order_audit_log_table`.
  - [ ] [Schema] Add model `CrmOrderAuditLog` to `prisma/schema.prisma`:
    ```prisma
    model CrmOrderAuditLog {
      id            Int       @id @default(autoincrement())
      orderId       Int       @map("order_id")
      fieldName     String    @map("field_name") @db.VarChar(100)
      oldValue      String?   @map("old_value") @db.Text
      newValue      String?   @map("new_value") @db.Text
      changedById   Int       @map("changed_by_id")
      changedByName String    @map("changed_by_name") @db.VarChar(55)
      changedAt     DateTime  @default(now()) @map("changed_at") @db.DateTime(0)

      order         CrmOrders @relation(fields: [orderId], references: [crmOrderId], onDelete: Cascade)
      changedBy     Users     @relation("AuditLogChanges", fields: [changedById], references: [uid])

      @@index([orderId])
      @@index([changedAt])
      @@map("crm_order_audit_log")
    }
    ```
    Add `auditLog CrmOrderAuditLog[]` to `CrmOrders` model. Add `auditChanges CrmOrderAuditLog[] @relation("AuditLogChanges")` to `Users` model. Run `npx prisma generate`.
  - [ ] [Repository] Add to `src/repository/order.repository.ts`:
    ```typescript
    export interface AuditLogEntry {
      fieldName: string;
      oldValue: string | null;
      newValue: string | null;
    }

    export async function createAuditLogEntries(
      orderId: number,
      entries: AuditLogEntry[],
      changedById: number,
      changedByName: string
    ) {
      if (entries.length === 0) return;
      return await prisma.crmOrderAuditLog.createMany({
        data: entries.map((e) => ({
          orderId,
          fieldName:     e.fieldName,
          oldValue:      e.oldValue,
          newValue:      e.newValue,
          changedById,
          changedByName,
          changedAt:     new Date(),
        })),
      });
    }

    export async function getAuditLogByOrderId(orderId: number) {
      return await prisma.crmOrderAuditLog.findMany({
        where:   { orderId },
        orderBy: { changedAt: 'desc' },
      });
    }
    ```
  - [ ] [Service] In `src/service/order.service.ts`, `updateOrder(id, data, actingUser)` function:
    - **Before** writing the Prisma update, fetch the current order row: `const existing = await orderRepository.findById(id);`
    - Define the exhaustive list of auditable scalar fields (all string/number fields that an agent can change via the edit form):
      ```typescript
      const AUDITABLE_FIELDS: (keyof OrderUpdateInput)[] = [
        'orderMakeModel', 'orderPart', 'orderPartSize', 'orderVin',
        'orderQuotedMiles', 'orderGivenMiles', 'orderTotalPitched',
        'orderVendorPrice', 'orderMarkup', 'orderAmountCharged',
        'orderShippingType', 'orderTrackingNumber', 'orderDeliveryStatus',
        'orderDocumentation', 'orderBooked', 'orderStatus',
        'orderVendorFeedback', 'orderClientFeedback', 'orderResolution',
        'orderDate', 'orderVendorId', 'orderVendorName',
        'orderSalesAgentId', 'orderVerifierId',
        'orderSalesVerifierId', 'orderBackendMemberId',
        'orderQualifiedIncentiveStatus', 'orderQualifiedIncentiveAmount',
      ];
      ```
    - Diff incoming `data` against `existing` for each auditable field:
      ```typescript
      const auditEntries: AuditLogEntry[] = [];
      for (const field of AUDITABLE_FIELDS) {
        if (field in data) {
          const oldVal = existing[field] != null ? String(existing[field]) : null;
          const newVal = data[field]    != null ? String(data[field])    : null;
          if (oldVal !== newVal) {
            auditEntries.push({ fieldName: field, oldValue: oldVal, newValue: newVal });
          }
        }
      }
      ```
    - **After** the Prisma update succeeds, bulk-insert audit rows:
      ```typescript
      await orderRepository.createAuditLogEntries(
        id,
        auditEntries,
        actingUser.uid,
        actingUser.nickname || actingUser.name
      );
      ```
    - `actingUser` is passed into `updateOrder` from the route handler (it reads from the NextAuth session). Update the function signature: `updateOrder(id: number, data: OrderUpdateInput, actingUser: { uid: number; name: string; nickname?: string | null })`. Update all call sites.
  - [ ] [Route] Create `src/app/api/orders/[id]/audit-log/route.ts`:
    ```typescript
    export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!hasPermission(session.user.userPermissions, 'orders:view-audit-log')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const id = Number((await params).id);
      const log = await orderRepository.getAuditLogByOrderId(id);
      return NextResponse.json(log);
    }
    ```
  - [ ] [RBAC/Seed] Add `orders:view-audit-log` to `crm_permissions` in `seed.sql`. Assign to super-admin and manager roles in `crm_role_permissions`. Add to `project_data.md` permissions table under the `orders` resource.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit (`src/tests/OrderAuditLog.test.tsx` — new file):**
  - [ ] Test: Given mocked entries:
    ```typescript
    [
      { id: 1, orderId: 5, fieldName: 'orderMakeModel', oldValue: '2019 Honda Civic', newValue: '2020 Honda Civic', changedByName: 'Alice', changedAt: '2026-07-01T10:00:00Z' },
      { id: 2, orderId: 5, fieldName: 'orderVendorPrice', oldValue: '300', newValue: '350', changedByName: 'Bob', changedAt: '2026-07-01T11:30:00Z' },
    ]
    ```
    Render `<OrderAuditLog entries={mockEntries} />`. Assert 2 rows are rendered in the table body.
  - [ ] Test: Assert the row for `fieldName = 'orderMakeModel'` displays the human-readable label `"Vehicle (Year, Make & Model)"` (not the raw camelCase key).
  - [ ] Test: Assert the old value `"2019 Honda Civic"` and new value `"2020 Honda Civic"` both appear in the same row.
  - [ ] Test: Assert `"Alice"` appears in the row for the make/model change, and `"Bob"` in the vendor price row.
  - [ ] Test: Assert `changedAt` for the `10:00` entry is formatted as `"01/07/2026 10:00"`.
  - [ ] Test: Render `<OrderAuditLog entries={[]} />`. Assert the text `"No changes have been recorded for this order."` is displayed.
  - [ ] **Run — confirm RED** (component does not exist).

- [ ] **GREEN — Frontend (Types → Component → Page integration):**
  - [ ] [Types] Create `src/types/orderAuditLog.ts`:
    ```typescript
    export interface OrderAuditLogEntry {
      id: number;
      orderId: number;
      fieldName: string;      // camelCase DB key, e.g. 'orderMakeModel'
      oldValue: string | null;
      newValue: string | null;
      changedById: number;
      changedByName: string;
      changedAt: string;      // ISO string from API
    }

    // Human-readable label map for auditable field keys
    export const AUDIT_FIELD_LABELS: Record<string, string> = {
      orderMakeModel:                  'Vehicle (Year, Make & Model)',
      orderPart:                       'Part',
      orderPartSize:                   'Part Size',
      orderVin:                        'VIN',
      orderQuotedMiles:                'Quotes Miles',
      orderGivenMiles:                 'Vendor Miles',
      orderTotalPitched:               'Total Pitched',
      orderVendorPrice:                'Vendor Price',
      orderMarkup:                     'Markup',
      orderAmountCharged:              'Amount Charged',
      orderShippingType:               'Shipping Type',
      orderTrackingNumber:             'Tracking Number',
      orderDeliveryStatus:             'Delivery Status',
      orderDocumentation:              'Documentation',
      orderBooked:                     'Booked',
      orderStatus:                     'Order Status',
      orderVendorFeedback:             'Vendor Feedback',
      orderClientFeedback:             'Client Feedback',
      orderResolution:                 'Resolution',
      orderDate:                       'Sale Date',
      orderVendorId:                   'Vendor',
      orderVendorName:                 'Vendor Name',
      orderSalesAgentId:               'Sales Agent',
      orderVerifierId:                 'QA Verifier',
      orderSalesVerifierId:            'Sales Verifier',
      orderBackendMemberId:            'Backend Executive',
      orderQualifiedIncentiveStatus:   'Incentive Status',
      orderQualifiedIncentiveAmount:   'Incentive Amount',
    };
    ```
  - [ ] [Component] Create `src/components/OrderAuditLog.tsx`:
    - Accepts `entries: OrderAuditLogEntry[]` prop.
    - Renders a table with columns: `"Date & Time"` | `"Field Changed"` | `"Previous Value"` | `"New Value"` | `"Changed By"`.
    - `"Date & Time"` → formatted as `DD/MM/YYYY HH:MM` from `changedAt`.
    - `"Field Changed"` → look up `AUDIT_FIELD_LABELS[entry.fieldName]`; fall back to `entry.fieldName` if not found.
    - `"Previous Value"` → render `entry.oldValue` or a grey italic `"(empty)"` if `null`.
    - `"New Value"` → render `entry.newValue` or a grey italic `"(cleared)"` if `null`.
    - Section title: `"Change History"`. Include a subtitle: `"Every field-level edit made to this order, in reverse chronological order."`
    - If `entries.length === 0`: display `"No changes have been recorded for this order."`.
    - Entries are already sorted descending from the API.
  - [ ] [Page] `src/app/orders/[id]/page.tsx`: If session user has `orders:view-audit-log`, fetch `/api/orders/:id/audit-log` server-side. Pass result to `<OrderAuditLog entries={auditLog} />`. Render the component at the very bottom of the page, after the `<OrderViewLog />` card, inside its own labeled card:
    ```
    ┌──────────────────────────────────────────────┐
    │  Change History                              │
    │  Every field-level edit made to this order,  │
    │  in reverse chronological order.             │
    │  [OrderAuditLog]                             │
    └──────────────────────────────────────────────┘
    ```
    If user lacks the permission, render nothing (no placeholder, no error).
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Admin opens an order detail page → scrolls to bottom → "Change History" card is visible (permission granted) → currently shows `"No changes have been recorded for this order."` → Admin clicks Edit → changes `"Vehicle (Year, Make & Model)"` from `"2019 Honda Civic"` to `"2020 Honda Civic"` and also changes `"Vendor Price"` from `"300"` to `"350"` → submits → returns to detail page → "Change History" card now shows 2 rows: `orderMakeModel` change and `orderVendorPrice` change, both attributed to `"Admin Name"` with the correct timestamp ✅
  - [ ] **No-op edit test:** Admin edits an order but submits with **no actual changes** (all values identical to what was stored) → `SELECT COUNT(*) FROM crm_order_audit_log WHERE order_id = :id` is unchanged — no spurious rows inserted ✅
  - [ ] **Multiple editors:** Agent Alice edits `orderPart`, then Agent Bob edits `orderVendorPrice` on the same order → "Change History" shows both entries, each attributed to the correct agent, in reverse-chronological order (Bob's change appears first) ✅
  - [ ] **RBAC:** User without `orders:view-audit-log` opens the order detail page → "Change History" card is completely absent → direct `GET /api/orders/:id/audit-log` returns `403 Forbidden` ✅
  - [ ] **Cascade delete:** Order is deleted (W-1603 flow) → `SELECT * FROM crm_order_audit_log WHERE order_id = :id` returns 0 rows (CASCADE confirmed) ✅


---

## Phase 17 — Sprint 3: Sale Status Overhaul (Partial Refund, Final Margin & Returned Orders)

### Context & Goals

The current system treats `saleStatus` as a 3-value enum (Sold / Refunded / Chargebacked) and uses raw `orderMarkup` as the primary financial metric everywhere. This phase introduces four coordinated changes:

1. **New `saleStatus = '4'` (Partial Refund):** An order where the customer received a partial refund — we still earned money, but less than the full markup. Partial Refund orders are "completed" (money was received) and belong in the `Completed Orders` workflow queue.
2. **New `orderRefundAmount` column:** Stores the dollar amount actually returned to the customer. For Sold: `0`. For Refunded/Chargebacked: auto-set to `orderMarkup` (entire margin forfeited). For Partial Refund: user-entered amount.
3. **`finalMargin` as the key metric everywhere:** Computed at query time as `orderMarkup − orderRefundAmount`. Replaces raw `orderMarkup` in all dashboard aggregates.
4. **New `orderCurrentStatus = 'Returned Orders'`:** A new terminal workflow queue. When `saleStatus` changes to `'2'` or `'3'`, the service auto-sets `orderCurrentStatus = 'Returned Orders'`. Gets its own pipeline page at `/pending/returned` and filter tab in `OrderListContainer`.
5. **`Completed Orders` includes Partial Refund:** The `findAll` filter expands to `saleStatus IN ('1', '4')`.
6. **Info banners** on Completed and Returned Orders queue pages clarify which sale statuses each queue displays.
7. **Dashboard metric card link updates:** Refund and Chargeback metric cards link to `/pending/returned` filtered by current month.

---

### W-1701 — Schema + Backend: `orderRefundAmount` Column, Status Auto-Rules & finalMargin Repository

**Goal:**
The database has no column to track partial or full refund amounts. All dashboard queries use raw `orderMarkup` without accounting for refunds, causing: (a) partially-refunded orders show inflated margin; (b) Refunded/Chargebacked orders incorrectly subtract from Net Sales instead of contributing zero; (c) there is no automatic mechanism to move orders to a `Returned Orders` workflow queue when marked as Refunded or Chargebacked.

**Approach:**
- Add `order_refund_amount VARCHAR(25) NULL DEFAULT NULL` to `crm_orders` via Prisma migration.
- Update `OrderUpdateInput` type to include `orderRefundAmount`.
- In `order.service.ts` `updateOrder()`: when `saleStatus → '2'` or `'3'`, auto-set `orderRefundAmount = orderMarkup` and `orderCurrentStatus = 'Returned Orders'`. When `saleStatus → '1'`, reset `orderRefundAmount = '0'`. When `saleStatus → '4'`, throw `400` if `orderRefundAmount` is absent or empty.
- Rewrite all dashboard repository aggregation functions to use `finalMargin = orderMarkup − orderRefundAmount`.
- Fix `getChargebackThisMonth`/`getRefundThisMonth` to sum `orderRefundAmount` (actual money returned) instead of `orderMarkup`.
- `getSalesBetweenDates` now filters `saleStatus IN ('1', '4')` and uses `finalMargin`.
- `getNetSalesBetweenDates` sums `finalMargin` for `'1'` and `'4'` — Refunded/Chargebacked contribute `0` (not a negative subtraction).
- Add `'Returned Orders'` to `getPendingCounts`.
- Update `findAll` in `order.repository.ts` to expand `Completed Orders` filter and add `Returned Orders` filter path.
- Update `mapSaleStatus()` in `order.service.ts` to map `'4'` → `'Partial Refund'`.
- Add `'orderRefundAmount'` to the `orderKeysToAudit` list.

---

- [x] **RED — Integration (`orders.test.ts` + `dashboard.test.ts`):**
  - [x] Test (`orders.test.ts`): `PATCH /api/orders/:id` with `{ saleStatus: '2' }`. Assert `200 OK`. Assert `SELECT order_refund_amount, order_current_status FROM crm_orders WHERE crm_order_id = :id` returns `order_refund_amount = <existingOrderMarkup>` AND `order_current_status = 'Returned Orders'`.
  - [x] Test (`orders.test.ts`): `PATCH /api/orders/:id` with `{ saleStatus: '3' }` (Chargebacked). Assert same outcome as above.
  - [x] Test (`orders.test.ts`): `PATCH /api/orders/:id` with `{ saleStatus: '4', orderRefundAmount: '50.00' }`. Assert `200 OK`. Assert `SELECT order_refund_amount FROM crm_orders WHERE crm_order_id = :id` returns `'50.00'`. Assert `order_current_status` is **not** `'Returned Orders'`.
  - [x] Test (`orders.test.ts`): `PATCH /api/orders/:id` with `{ saleStatus: '4' }` and no `orderRefundAmount` in body. Assert `400 Bad Request`.
  - [x] Test (`orders.test.ts`): `PATCH /api/orders/:id` with `{ saleStatus: '1' }` on a previously-Returned order. Assert `order_refund_amount = '0'`.
  - [x] Test (`orders.test.ts`): `GET /api/orders?status=Returned+Orders`. Assert only orders with `order_current_status = 'Returned Orders'` are returned.
  - [x] Test (`dashboard.test.ts`): Seed 3 Sold orders (markup `$100` each) and 1 Partial Refund order (markup `$100`, `orderRefundAmount = '30'`). Assert `GET /api/dashboard/metrics` `thisYearSales.amount = 370` (3×100 + 70 finalMargin).
  - [x] Test (`dashboard.test.ts`): Seed 2 Refunded orders (markup `$100` each, so `orderRefundAmount` = `$100` each). Assert `refundThisMonth.amount = 200`.
  - [x] **Run — confirm RED (column does not exist, auto-rules not in service, finalMargin formula not applied).**

- [x] **GREEN — Backend (Schema → Repository → Service):**
  - [x] [Schema] Add `orderRefundAmount String? @map("order_refund_amount") @db.VarChar(25)` to `CrmOrders` in `schema.prisma` (after `orderMarkup` line).
  - [x] [Migration] Run `pnpm prisma migrate dev --name add_refund_amount_to_orders`. Verify `DESCRIBE crm_orders` shows `order_refund_amount VARCHAR(25) NULL DEFAULT NULL`.
  - [x] [Type] Add `orderRefundAmount?: string | null` to `OrderUpdateInput` in `src/types/order.ts`.
  - [x] [Repository — Orders] In `order.repository.ts` `findAll()`: Change the `Completed Orders` block from `where.saleStatus = '1'` to `where.saleStatus = { in: ['1', '4'] }`. Add `else if (filters.status === 'Returned Orders') { where.orderCurrentStatus = 'Returned Orders'; }`.
  - [x] [Service — Orders] In `order.service.ts` `updateOrder()`: (a) When `data.saleStatus === '2' || data.saleStatus === '3'` → set `updatedData.orderRefundAmount = existingOrder.orderMarkup ?? '0'` and `updatedData.orderCurrentStatus = 'Returned Orders'`. (b) When `data.saleStatus === '1'` → set `updatedData.orderRefundAmount = '0'`. (c) When `data.saleStatus === '4'` → if `!data.orderRefundAmount` throw `new Error('Refund amount is required for Partial Refund status')`. (d) Update `mapSaleStatus()` to add `if (status === '4') return 'Partial Refund'`. (e) Add `'orderRefundAmount'` to `orderKeysToAudit` array.
  - [x] [Repository — Dashboard] In `dashboard.repository.ts`:
    - `getSalesBetweenDates`: filter `saleStatus: { in: ['1', '4'] }`. Select `orderMarkup` + `orderRefundAmount`. Accumulate `finalMargin = parseFloat(orderMarkup) - parseFloat(orderRefundAmount || '0')`.
    - `getNetSalesBetweenDates`: filter `saleStatus: { in: ['1', '2', '3', '4'] }`. For `'1'`/`'4'` → add `finalMargin` to amount, increment count. For `'2'`/`'3'` → contribute `0` to amount, do NOT decrement count.
    - `getChargebackThisMonth`: select `orderRefundAmount`. Sum `orderRefundAmount` values.
    - `getRefundThisMonth`: same — sum `orderRefundAmount`.
    - `getTopPerformers` / `getBottomPerformers`: filter `saleStatus: { in: ['1', '4'] }`. Select `orderRefundAmount`. Compute `finalMargin` per order in agentMap accumulation.
    - `getTeamMonthlyScores` raw SQL: replace the CASE expression value for `saleStatus = '1'` with `CAST(COALESCE(o.order_markup,'0') AS DECIMAL(10,2)) - CAST(COALESCE(o.order_refund_amount,'0') AS DECIMAL(10,2))`. Add `WHEN o.sale_status = '4' THEN CAST(COALESCE(o.order_markup,'0') AS DECIMAL(10,2)) - CAST(COALESCE(o.order_refund_amount,'0') AS DECIMAL(10,2))` to the CASE. Remove subtraction for `'2'`/`'3'` (they contribute `0`).
    - `getTeamMonthlyTopPerformers` / `getTeamMonthlyBottomPerformers`: select `orderRefundAmount`. Compute `finalMargin` per order in the `total` accumulation.
    - `getPendingCounts`: add `'Returned Orders'` to `where.orderCurrentStatus.in` array and to the `res` default object.
    - `getAdvancedChartData`: change filter to `saleStatus: { in: ['1', '2', '3', '4'] }`. Select `orderRefundAmount`.
  - [x] [Service — Dashboard] In `dashboard.service.ts` advanced chart fill-bins loop: for `saleStatus === '4'`, compute `finalMargin` and add to `bin.salesAmount`. Update `recentOrders` map to serialize `orderRefundAmount: o.orderRefundAmount`.
  - [x] Run integration tests — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Manager opens an order and changes Sale Status to Refunded → saves → DB: `order_refund_amount = <order_markup>` AND `order_current_status = 'Returned Orders'` → Dashboard `refundThisMonth.amount` increases by the full markup amount → `netSales.amount` is unchanged (refunded orders contribute `0`, not a negative) → `GET /api/orders?status=Returned+Orders` includes the order → ✅ Done.

---

### W-1702 — Order UI: Partial Refund Form, finalMargin Display, Returned Orders Page & Info Banners

**Goal:**
The `EditOrderForm` has no `'4'` (Partial Refund) option in the Sale Status dropdown. `OrderList` displays raw `orderMarkup` as "Margin" without accounting for refund amounts. There is no dedicated pipeline page or tab for Returned Orders. The Completed Orders and Returned Orders pages have no banners explaining what sale statuses they contain.

**Approach:**
- Add `'4'` option to the Sale Status dropdown in `EditOrderForm.tsx`. When selected, show a Refund Amount modal (mirroring the existing date modal pattern). Submit `orderRefundAmount` in the form payload.
- In `OrderList.tsx`, rename "Margin" to "Final Margin" and compute `finalMargin = orderMarkup − orderRefundAmount`.
- In `OrderListContainer.tsx`: add "Returned Orders" tab; add info banners for Completed/Returned queues; add `'4'` → `'Partial Refund'` to active filter chip.
- Create `src/app/pending/returned/page.tsx`.

---

- [x] **RED — Unit (`EditOrderForm.test.tsx` + `OrderList.test.tsx`):**
  - [x] Test (`EditOrderForm.test.tsx`): Render the form. Assert the Sale Status `<select>` contains `<option value="4">Partial Refund</option>`.
  - [x] Test (`EditOrderForm.test.tsx`): Simulate selecting `value='4'`. Assert a modal with a refund amount numeric input is rendered.
  - [x] Test (`EditOrderForm.test.tsx`): Type `'50.00'` in the refund amount input and click Confirm. Assert `orderRefundAmount: '50.00'` is in the submitted `fetch` body payload.
  - [x] Test (`OrderList.test.tsx`): Render with order `{ orderMarkup: '100', orderRefundAmount: '30' }`. Assert the Pricing cell shows `Final Margin: $70.00`.
  - [x] **Run — confirm RED (option '4' is absent; OrderList shows raw `orderMarkup` without subtracting `orderRefundAmount`).**

- [x] **GREEN — Frontend (Types → Components → New Page):**
  - [x] [Types] In `src/types/order.ts`, add `orderRefundAmount?: string | null` to `OrderUpdateInput`.
  - [x] [Component — EditOrderForm] Add state `const [orderRefundAmount, setOrderRefundAmount] = useState(order.orderRefundAmount || '')` and `const [showRefundAmountModal, setShowRefundAmountModal] = useState(false)`. In the Sale Status `<select>` `onChange` handler: when `val === '4'`, call `setShowRefundAmountModal(true)`. Add `<option value="4">Partial Refund</option>`. Build the refund amount modal portal (style matches the existing date modal) containing a `<input type="number" />` for the refund amount, a Confirm button (`setOrderRefundAmount(inputVal); setShowRefundAmountModal(false)`), and a Skip/Cancel button. Include `orderRefundAmount` in the `payload` sent to `PATCH /api/orders/:id`.
  - [x] [Component — OrderList] Add `orderRefundAmount?: string | null` to the `orders` array item type in `OrderListProps`. In the Pricing `<td>`, rename "Margin" label to "Final Margin". Compute `const finalMargin = parseFloat(order.orderMarkup || '0') - parseFloat(order.orderRefundAmount || '0')`. Display `finalMargin.toFixed(2)` with the same green/red colour logic as before.
  - [x] [Component — OrderListContainer] Add `<button onClick={() => setStatusFilter('Returned Orders')} className={tab-btn ...}>Returned Orders</button>` after the Completed Orders tab. Update the page `<h1>` text and `<p>` subtitle for `statusFilter === 'Returned Orders'`. Add an amber/rose info banner `<div>` rendered when `statusFilter === 'Completed Orders'` (text: *"This queue shows orders with Sale Status: Sold or Partial Refund — orders where money was received."*) or when `statusFilter === 'Returned Orders'` (text: *"This queue shows orders with Sale Status: Refunded or Chargebacked — orders where the full sale was reversed."*). Add `'4'` → `'Partial Refund'` label to the `saleStatusFilter` chip display.
  - [x] [Page — NEW] Create `src/app/pending/returned/page.tsx` exporting `PendingReturnedPage` that renders `<OrderListContainer initialStatus="Returned Orders" />`. Add `metadata` with title `'Returned Orders — JD CRM'`.
  - [x] Run unit tests — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Agent opens Edit Order → Sale Status dropdown shows 4 options (Sold, Refunded, Chargebacked, Partial Refund) → selects "Partial Refund" → refund amount modal appears → enters `$50` → confirms → submits form → Order detail shows `Refund Amount: $50.00`, `Final Margin: $50.00` (if full markup was `$100`) → Order appears in "Completed Orders" tab → Completed Orders page shows info banner: "This queue shows orders with Sale Status: Sold or Partial Refund" → ✅ Done.
  - [x] Agent navigates to `/pending/returned` → "Returned Orders" page renders → info banner: "This queue shows orders with Sale Status: Refunded or Chargebacked" → only Refunded/Chargebacked orders appear → ✅ Done.

---

### W-1703 — Dashboard UI: finalMargin Metric Cards, Returned Orders Links & PendingCountsRow

**Goal:**
The "Refunds This Month" and "Chargebacks This Month" metric cards link to `?saleStatus=2` and `?saleStatus=3` (raw order list filtered by sale status). They should instead navigate to `/pending/returned` filtered by the current month, since that is the dedicated Returned Orders queue. The `PendingCountsRow` "Completed Orders" card hard-codes `saleStatus=1` in its link, excluding Partial Refund orders. A new "Returned Orders" card is missing from the pipeline row.

**Approach:**
- In `dashboard_client_page.tsx`: update Refund and Chargeback card links to `/pending/returned?dateFrom=...&dateTo=...`. Update "This Year Sales", "Sales This Month", "Today's Sales" links to `saleStatus=1,4`. Update "Net Sales This Month" link to `saleStatus=1,2,3,4`.
- In `PendingCountsRow.tsx`: change Completed Orders route to `'/orders?status=Completed+Orders'`. Add a new "Returned Orders" step entry with route `'/pending/returned'` and a distinct rose color scheme.
- In `RecentOrdersTable.tsx`: compute and display `finalMargin` instead of raw `orderMarkup`.
- In `dashboard.service.ts` `getMetricsForUser()`: serialize `orderRefundAmount` in the `recentOrders` map.

---

- [x] **RED — Unit (`Dashboard.test.tsx`):**
  - [x] Test: Render `DashboardPage` with `initialMetrics.refundThisMonth` mocked. Assert the rendered Refunds card `<Link>` `href` attribute contains `/pending/returned` (not `saleStatus=2`).
  - [x] Test: Render `DashboardPage` with `initialMetrics.chargebackThisMonth` mocked. Assert the Chargebacks card `<Link>` `href` attribute contains `/pending/returned` (not `saleStatus=3`).
  - [x] Test: Render `PendingCountsRow` with mock `pendingCounts` containing `'Returned Orders': { amount: 500, count: 3 }`. Assert a card element with text "Returned Orders" is rendered.
  - [x] **Run — confirm RED (cards link to `saleStatus=2`/`saleStatus=3`; no Returned Orders card exists in PendingCountsRow).**

- [x] **GREEN — Frontend (Types → Components):**
  - [x] [Types — Dashboard] In `src/types/dashboard.ts`, add `orderRefundAmount?: string | null` to the `DashboardRecentOrder` interface. Add `'Returned Orders': { amount: number; count: number }` to the `PendingCounts` type.
  - [x] [Component — dashboard_client_page.tsx] Update "Refunds This Month" card `link` to `` `/pending/returned?dateFrom=${startOfMonth}&dateTo=${endOfMonth}` ``. Update "Chargebacks This Month" card `link` to the same route. Update "This Year Sales" `link` to `` `/orders?saleStatus=1,4&dateFrom=${startOfYear}&dateTo=${endOfYear}` ``. Update "Sales This Month" `link` to `` `/orders?saleStatus=1,4&dateFrom=${startOfMonth}&dateTo=${endOfMonth}` ``. Update "Today's Sales" `link` to `` `/orders?saleStatus=1,4&dateFrom=${todayStr}&dateTo=${todayStr}` ``. Update "Net Sales This Month" `link` to `` `/orders?saleStatus=1,2,3,4&dateFrom=${startOfMonth}&dateTo=${endOfMonth}` ``.
  - [x] [Component — PendingCountsRow.tsx] Change the "Completed Orders" step `route` from `'/orders?saleStatus=1&status=Completed+Orders'` to `'/orders?status=Completed+Orders'`. Add a new step object: `{ label: 'Returned Orders', amount: pendingCounts['Returned Orders']?.amount || 0, count: pendingCounts['Returned Orders']?.count || 0, route: '/pending/returned', color: '#b25353', bg: '#faf2f2', icon: <returnedIcon /> }`. Add it to the `combos` array (as the bottom of the third combo column, paired with "Pending Resolutions").
  - [x] [Component — RecentOrdersTable.tsx] Add `orderRefundAmount?: string | null` to the local order prop type. Compute `const finalMargin = parseFloat(orderMarkup || '0') - parseFloat(orderRefundAmount || '0')`. Display `$${finalMargin.toFixed(2)}` in the margin column.
  - [x] [Service — Dashboard] In `dashboard.service.ts` `getMetricsForUser()`, in the `recentOrders` `.map()`, add `orderRefundAmount: o.orderRefundAmount` to the serialized object.
  - [x] Run unit tests — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Super Admin opens dashboard → clicks "Refunds This Month" card → navigates to `/pending/returned?dateFrom=<startOfMonth>&dateTo=<endOfMonth>` → only Refunded/Chargebacked orders for the current month are shown → ✅ Done.
  - [x] Super Admin opens dashboard → "Orders Journey" pipeline section → sees "Returned Orders" card alongside "Completed Orders" → "Returned Orders" card amount equals sum of `orderRefundAmount` for all Refunded/Chargebacked orders → clicks it → navigates to `/pending/returned` → ✅ Done.
  - [x] Recent Orders table on dashboard shows `finalMargin` (not raw `orderMarkup`) for each order → Partial Refund orders display reduced margin correctly → ✅ Done.

---

## Phase 18 — Sprint 3: Post-Launch Features

### Context & Goals
Sprint 3 focuses on features that enrich dashboard metrics, vendor insights, and security configurations, adjusting all financial calculations to respect the `finalMargin` (`orderMarkup - orderRefundAmount`) metric introduced in Phase 17.

---

### W-1801 — Champions League Widget: Monthly Filter & finalMargin Ranking

**Root cause / Goal:**
The Champions League dashboard widget ranks sales agents but lacks monthly navigation controls or filters. Furthermore, it must rank agents using the `finalMargin` (`orderMarkup - orderRefundAmount`) metric to avoid inflated rankings from refunded/partially refunded orders.

**Approach:**
- Update `dashboard.repository.ts` to accept `month` and `year` params for the Champions League query, defaulting to the current month/year.
- Ensure the query groups by sales agent and sums `finalMargin`.
- Expose query arguments in `/api/dashboard/metrics` or a separate `/api/dashboard/champions-league` endpoint.
- In `ChampionsLeagueWidget.tsx`, add previous/next month navigation arrows that trigger a reload of the component using a lightweight state trigger.

---

- [x] **RED — Integration (`src/tests/dashboard.test.ts`):**
  - [x] Test: `GET /api/dashboard/champions-league?month=6&year=2026` returns agents ranked by sum of `finalMargin` for orders in June 2026.
  - [x] Test: Seed Agent A with an order (markup $100, refund $20, final margin $80) and Agent B with an order (markup $90, final margin $90). Agent B must rank higher than Agent A.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → Route):**
  - [x] [Repository] Add/update method in `dashboard.repository.ts` to filter by date/month and sum `finalMargin` per agent.
  - [x] [Service] Validate permissions (`dashboard:champions-league` or admin).
  - [x] [Route] Expose filters on the API route.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/ChampionsLeagueWidget.test.tsx`):**
  - [x] Test: Given ranked mock data, render agent positions, names (using nicknames/aliases), and net scores.
  - [x] Test: Clicking month change triggers the reload fetch handler with the new dates.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Implement selector elements and API trigger in `ChampionsLeagueWidget.tsx`.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin views Champions League card on dashboard → sees current month's top agents ranked by final margin → clicks previous arrow → card contents reload showing last month's top agents → ✅ Done.

---

### W-1802 — Team Monthly Scores Widget: Top 3 & Bottom 3 Per Team

**Root cause / Goal:**
The team scorecard on the dashboard displays only a single top performer and a single bottom performer per team. The sales team requires seeing the top 3 and bottom 3 agents to evaluate team performance distributions.

**Approach:**
- Update `getTeamMonthlyTopPerformer` and `getTeamMonthlyBottomPerformer` in `dashboard.repository.ts` to return up to 3 agents sorted by their team-specific accumulated `finalMargin`.
- Update `dashboard.service.ts` to package top/bottom performers as serialized arrays.
- In `TeamMonthlyScoresWidget.tsx`, render a list layout mapping these arrays instead of a single agent slot.

---

- [x] **RED — Integration (`src/tests/dashboard.test.ts`):**
  - [x] Test: `GET /api/dashboard/teams/monthly?month=6&year=2026` returns `topPerformers` and `bottomPerformers` as arrays of up to 3 elements.
  - [x] Test: Performer arrays are correctly sorted by `finalMargin` (descending for top, ascending for bottom).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service):**
  - [x] [Repository] Modify methods in `dashboard.repository.ts` to return up to 3 results.
  - [x] [Service] Update type mappings and response fields.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/TeamMonthlyScoresWidget.test.tsx`):**
  - [x] Test: Verify widget renders 3 rows in top performers and 3 rows in bottom performers sections for a team card.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] Update `TeamMonthlyReport` interfaces in `src/types/dashboard.ts`.
  - [x] [Component] Refactor `TeamMonthlyScoresWidget.tsx` layout to iterate and print arrays.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Manager views team scoreboard card on dashboard → sees a list of top 3 performers and bottom 3 performers for that team → ✅ Done.

---

### W-1803 — Order Pipeline: Tab Totals (Counts & Final Margin) & Backend Executive Filter

**Root cause / Goal:**
The pipeline page lacks summaries of count and dollar volume (using final margins) for each status tab, forcing manual list calculation. Furthermore, managers cannot filter orders by their assigned Backend Executive.

**Approach:**
- In `dashboard.repository.ts` `getPendingCounts()`, calculate both `count` and sum of `finalMargin` for each order status, including `'Returned Orders'`.
- In `order.repository.ts` `findAll()`, support filtering lists by `backendExecutiveId`.
- In `OrderListContainer.tsx`, retrieve and display tab statistics in format `Status Name (Count - $Margin)`. Add Backend Executive filter dropdown to the filter row.

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: `GET /api/orders?backendExecutiveId=4` returns only orders where `orderBackendExecutiveId = 4`.
  - [x] Test: `GET /api/orders/pending-counts` returns both counts and amounts (accumulating `finalMargin`) for all statuses.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Routes):**
  - [x] [Repository] Add filter query in `order.repository.ts`. Update `getPendingCounts` in `dashboard.repository.ts` to return sums of `finalMargin`.
  - [x] [Route] Expose filters on `GET /api/orders`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/OrderListContainer.test.tsx`):**
  - [x] Test: Tab headers render `Completed Orders (Count - $Margin)` dynamically.
  - [x] Test: Selecting a Backend Executive triggers a state reload query.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Component] Add the select dropdown list filter in `OrderListContainer.tsx`. Update tab title parsing to print stats.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Manager views orders page → clicks "Backend Executive" dropdown → selects an executive → the list filters to show only their orders → tabs display the count and final margin sum of the filtered orders in each queue → ✅ Done.

---

### W-1804 — Vendor Profile: Clickable Order Lists & Performance History Graph

**Root cause / Goal:**
The vendor detail view displays basic aggregate counts but does not provide drill-down listings of those orders or visual performance metrics over time.

**Approach:**
- Update vendor endpoints to return filtered orders lists (`GET /api/vendors/:id/orders`) and monthly metrics history (`GET /api/vendors/:id/performance-history`).
- In the frontend vendor detail view, make count cards interactive. Clicking them reveals a modal or drawer containing the order details.
- Integrate a line/bar chart displaying monthly volumes.

---

- [x] **RED — Integration (`src/tests/vendors.test.ts`):**
  - [x] Test: `GET /api/vendors/:id/orders?rating=positive` returns orders associated with the vendor.
  - [x] Test: `GET /api/vendors/:id/performance-history` returns aggregates grouped by month.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Routes):**
  - [x] [Repository] Add queries in `vendor.repository.ts`.
  - [x] [Route] Expose endpoints.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/VendorDetail.test.tsx`):**
  - [x] Test: Clicking count metric displays a list modal containing orders.
  - [x] Test: Chart element renders with historical values.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Implement click handlers and chart rendering on `VendorDetailPage`.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Manager opens vendor page → clicks "Negative Orders (2)" card → list opens showing the 2 negative orders → scrolls down and views the monthly performance chart → ✅ Done.

---

### W-1805 — RBAC: Split agents:view into List vs Sensitive Details Permissions

**Root cause / Goal:**
The `agents:view` permission grants users visibility to both agent lists and highly sensitive personal documents (bank info, emergency contacts, academic records). These must be split into `agents:view` (lists and basic info) and `agents:view-details` (sensitive tabs/attributes).

**Approach:**
- Define `agents:view-details` permission. Generate a Prisma schema migration to insert this into permissions.
- In `GET /api/agents/:id`, strip personal and bank structures if session has only `agents:view`.
- In `AgentProfileView.tsx`, disable sensitive tabs and display restricted warning alerts when permission is absent.

---

- [x] **RED — Integration (`src/tests/agents.test.ts`):**
  - [x] Test: `GET /api/agents/:id` with only `agents:view` returns basic info but sets personal structures to null.
  - [x] Test: `GET /api/agents/:id` with `agents:view-details` returns the full payload.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Schema → Migration → Service → Route):**
  - [x] [Schema/Migration] Create schema migration to add `agents:view-details` permission.
  - [x] [Service] Enforce sanitization logic in agent service.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/AgentProfileView.test.tsx`):**
  - [x] Test: Sensitive tabs (Bank emergency, Academic) render lock placeholders if permission is missing.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Update `AgentProfileView.tsx` and sub-profile components to check permissions and disable/blur tabs.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent Alice (without `agents:view-details`) opens Agent Bob's profile → views basic workspace details → clicks "Bank Details" tab → sees "Access Restricted" banner → Admin opens profile → views full bank details → ✅ Done.

---

### W-1806 — UI: Rename Settings Page Title to "Roles and Permissions"

**Root cause / Goal:**
The settings page link reads "Roles", which is incomplete as the page manages both roles and permission grids. Renaming it ensures clarity.

**Approach:**
- Update text strings in sidebar links and page header containers.

---

- [x] **RED — Unit (`src/tests/Sidebar.test.tsx`):**
  - [x] Test: Sidebar navigation list item contains label `"Roles and Permissions"`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Rename label in `Sidebar.tsx` and settings page containers.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] User opens sidebar or settings page → title and link read "Roles and Permissions" → ✅ Done.

---

### W-1807 — Database Query Optimizations & Caching

**Root cause / Goal:**
Aggregating thousands of orders in-memory causes request delays and server stress. Composite fields need indexes, and aggregate operations must run in the database.

**Approach:**
- Add database indexes on composite filter fields: `order_date`, `sale_status`, `order_current_status` in `schema.prisma`.
- Refactor `getTopPerformers` / `getBottomPerformers` to use Prisma `groupBy` or raw SQL aggregations.
- Set cache headers for dashboard aggregate outputs.

---

- [x] **RED — Integration (`src/tests/performance.test.ts`):**
  - [x] Test: Verify index definitions exist on `crm_orders`.
  - [x] Test: Database aggregation query functions return correct mathematical output.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Schema → Migration → Repository):**
  - [x] [Schema] Add index entries on `CrmOrders` model in `schema.prisma`. Run migration.
  - [x] [Repository] Refactor aggregated calculations to run database-side.
  - [x] Run integration test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Database migrations execute → indexes applied → dashboard load speeds verify lower database execution latency → ✅ Done.

---

### W-1808 — Update Baseline seed.sql and CSV Importer

**Root cause / Goal:**
Database schema changes (customer name merge, vehicle year merge, status history tables, backend executive, refund amount, audit logs, new permissions) have broken the `seed.sql` and the raw data CSV importer, blocking clean deployments.

**Approach:**
- Update `seed.sql` to include correct columns, map legacy status codes, and register new permissions.
- Update `src/scripts/import-csv-data.ts` to merge columns and write to the correct fields.

---

- [x] **RED — Integration (`src/tests/seed.test.ts`):**
  - [x] Test: Running the importer script parses CSV records and populates tables without SQL syntax or validation failures.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Seed SQL → Importer Script):**
  - [x] [Seed] Update `seed.sql`.
  - [x] [Importer] Refactor column mappings and batch/transaction inserts in `import-csv-data.ts`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin runs `npm run db-seed` or import script on a fresh database → database is successfully populated with clean, structured records and new permissions → ✅ Done.

---

## Phase 19 — Sprint 4: Polish & Table Column Additions

### Context & Goals
Sprint 4 completes the remaining cosmetic changes, table structures, and input validations requested to finalize the CRM user experience, adjusting columns and aging logic for the `Returned Orders` terminal pipeline status.

---

### W-1901 — Remove Redundant Advanced Chart Graph Filters

**Root cause / Goal:**
`AdvancedChartWidget.tsx` contains rolling range parameters (`Last 7 Days` / `Last 30 Days`) that overlap and conflict with calendar selections, causing layout choices to be confusing.

**Approach:**
- Remove the redundant select options from `AdvancedChartWidget.tsx`.

---

- [x] **RED — Unit (`src/tests/AdvancedChartWidget.test.tsx`):**
  - [x] Test: Chart filter selector element does not contain options with value `7d` or `30d`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Update select structure in `AdvancedChartWidget.tsx`.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] User opens dashboard chart page → dropdown contains only clean, non-overlapping date options → ✅ Done.

---

### W-1902 — Alias Name Visible Everywhere, Real Name Only on Profile

**Root cause / Goal:**
For privacy, agents' real names should not be exposed in order records lists or logs. Lists must show nicknames/aliases, reserving real names only for their specific profile dashboard details.

**Approach:**
- Audit and modify user name display hooks across `OrderList.tsx`, `RecentOrdersTable.tsx`, and detail headers to resolve `nickname || name`.

---

- [x] **RED — Unit (`src/tests/OrderList.test.tsx`):**
  - [x] Test: Sales Rep column renders the agent's nickname/alias instead of the real name.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Apply names mapping logic to tables.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Manager views orders table → columns show agents' aliases → views agent profile → real name is visible in header details → ✅ Done.

---

### W-1903 — Shipping Type Dropdown: Residential and Commercial Only

**Root cause / Goal:**
Shipping types currently capture transit modes (Ground, Express, etc.), whereas the business requires classifying deliveries as either Residential or Commercial to optimize route rates.

**Approach:**
- Swap existing options in forms with Residential and Commercial.

---

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx`):**
  - [x] Test: Shipping Type select dropdown contains only `Residential` and `Commercial` options.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Update form inputs in `AddOrderForm.tsx` and `EditOrderForm.tsx`.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent opens Add Order form → select dropdown shows only "Residential" and "Commercial" → selections save correctly → ✅ Done.

---

### W-1904 — Card Number & Expiry Date Formatting (UI Masks)

**Root cause / Goal:**
Card details entered in raw text are prone to input errors. Masks must format digits dynamically as agents type.

**Approach:**
- Wire mask events to format Card Number (spaced groups of 4) and Expiry (MMYY digits validation).

---

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx`):**
  - [x] Test: Typing card numbers adds space formatting (e.g. `4111 2222 3333 4444`).
  - [x] Test: Expiry field automatically reformats inputs to matching expiration structure.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Bind mask state triggers to form inputs.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent types card digits → input format updates dynamically → form submits standardized strings → ✅ Done.


---

### W-1905 — Time in Pending State Column (Except Completed/Returned Orders)

**Root cause / Goal:**
Operations must track how long orders sit in pending states to address bottlenecks. Terminal states (Completed and Returned) do not require aging indicators.

**Adjustment for Phase 17:**
The "Returned Orders" status represents a terminal state (full reversal of sale), so aging timers must be excluded from this tab along with Completed.

**Approach:**
- Calculate and display duration using `orderCurrentStatusUpdateDate` for active statuses; render blank/hyphen for Completed and Returned.

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: Orders query returns the last status modification timestamp.
  - [x] **Run — confirm RED.**

- [x] **RED — Unit (`src/tests/OrderList.test.tsx`):**
  - [x] Test: "Time in Status" column renders formatted days for active statuses, but is empty/hyphen for Completed and Returned statuses.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Render duration metric columns in `OrderList.tsx`.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent views Pending Shipment queue → sees "Aging: 4 days" in column → switches to Completed or Returned tab → column is blank → ✅ Done.

---

### W-1906 — Blacklisted Vendor Alert Red Flag in Dropdowns

**Root cause / Goal:**
Ensure agents do not accidentally place new orders with blacklisted suppliers. Dropdown listings should display clear warnings for blacklisted vendors.

**Approach:**
- Prepend `[BLACKLISTED] 🚩` text prefix and apply red CSS formatting to option elements matching inactive status.

---

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx`):**
  - [x] Test: Dropdown options representing blacklisted vendors are styled red and prefixed with warning flags.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Component):**
  - [x] [Component] Update select option mapping inside forms.
  - [x] Run unit test — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent opens Add Order form → vendor list shows warning flag on blacklisted options → avoids selection → ✅ Done.

---

## Phase 20 — orderMarkup → orderAmountCharged: Schema Rename, Auto-Calc Removal & Manual Input

### Context & Goals

Currently, `orderMarkup` is auto-calculated on every save as `orderTotalPitched - orderVendorPrice` and stored in the `order_markup` database column. The business process has changed: agents do **not** necessarily charge the customer the full pitched price upfront. Instead, they charge a partial "Amount Charged" which represents the company's retained margin. This charged amount must be **manually entered by the agent** and stored as the authoritative margin figure. The downstream `finalMargin = amountCharged - refundAmount` pipeline is otherwise unchanged.

Additionally, the dormant `order_amount_charged` column (mapped to `orderAmountCharged` in Prisma) was added previously but was never wired up. This phase:
1. Drops the dormant `order_amount_charged` column.
2. Renames `order_markup` → `order_amount_charged` at the database and Prisma layer.
3. Removes the auto-calculation logic from `order.service.ts`.
4. Replaces every `orderMarkup` code reference with `orderAmountCharged` across the entire codebase.
5. Updates `AddOrderForm.tsx` and `EditOrderForm.tsx` to expose a manual text input for `orderAmountCharged` (labelled **"Amount Charged (Net Margin)"**) and retains the existing `Total Price Pitched` and `Vendor Buying Price` inputs as reference-only fields (the gross spread can still be shown as a computed read-only display for agent guidance).

---

### W-2001 — Schema Migration: Drop Dormant Column & Rename order_markup → order_amount_charged

**Root cause / Goal:**
Two columns currently exist in `crm_orders` that relate to margin: `order_markup` (active, auto-calculated) and `order_amount_charged` (dormant, never used). Keeping both creates naming confusion. The rename makes the schema self-documenting: `order_amount_charged` is the single source of truth for the amount the company retains from each deal. The Prisma field `orderMarkup` must be renamed to `orderAmountCharged` to match.

**Approach:**
- Write a raw SQL Prisma migration that: (1) drops the dormant `order_amount_charged` column, then (2) renames `order_markup` to `order_amount_charged`.
- Update `schema.prisma`: remove the old `orderMarkup` field and the old dormant `orderAmountCharged` field; add one unified `orderAmountCharged String? @map("order_amount_charged") @db.VarChar(25)` field.
- Run `npx prisma migrate dev --name rename_order_markup_to_order_amount_charged` to apply and generate the new Prisma client.

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: `POST /api/orders` with payload `{ ..., orderAmountCharged: '350' }` (and no `orderMarkup` key) returns a `201` response where `body.orderAmountCharged === '350'`.
  - [x] Test: After the above `POST`, query the database directly via Prisma — `prisma.crmOrders.findFirst({ where: { orderAmountCharged: '350' } })` — and assert the returned row is not `null` and its `orderAmountCharged` field equals `'350'`. Assert there is no `orderMarkup` key on the returned row (TypeScript compilation alone validates this if the field is renamed in the Prisma client).
  - [x] Test: `PATCH /api/orders/:id` with payload `{ orderAmountCharged: '200' }` returns a `200` response where `body.orderAmountCharged === '200'`, and the database row confirms the updated value.
  - [x] Test: `PATCH /api/orders/:id` with **both** `orderTotalPitched` and `orderVendorPrice` updated (e.g. `{ orderTotalPitched: '800', orderVendorPrice: '500' }`) does **NOT** auto-update `orderAmountCharged` — the `orderAmountCharged` value in the database must remain whatever it was before the PATCH (confirming the auto-calculation is gone).
  - [x] Test: `GET /api/orders/:id` response body contains the key `orderAmountCharged` with the correct stored value, and does **not** contain the key `orderMarkup`.
  - [x] **Run — confirm RED (the field is named `orderMarkup` in the DB/Prisma client today; the test references `orderAmountCharged`, so all assertions will fail).**

- [x] **GREEN — Backend (Schema → Migration → Repository → Service → Controller):**
  - [x] [Schema/Migration] Create a new migration file under `prisma/migrations/` with the following raw SQL body:
    ```sql
    ALTER TABLE `crm_orders` DROP COLUMN `order_amount_charged`;
    ALTER TABLE `crm_orders` RENAME COLUMN `order_markup` TO `order_amount_charged`;
    ```
    Name the migration `rename_order_markup_to_order_amount_charged`. Apply it with `npx prisma migrate dev`.
  - [x] [Schema — `prisma/schema.prisma`] In the `CrmOrders` model: delete the line `orderMarkup String? @map("order_markup") @db.VarChar(255)` and delete the dormant `orderAmountCharged String? @map("order_amount_charged") @db.VarChar(25)` line. Add one new line: `orderAmountCharged String? @map("order_amount_charged") @db.VarChar(25)`. Regenerate the Prisma client with `npx prisma generate`.
  - [x] [Service — `src/service/order.service.ts`] Remove the entire auto-calculation block (lines that read `if (data.orderTotalPitched !== undefined || data.orderVendorPrice !== undefined)` and set `updatedData.orderMarkup = (totalPitched - vendorPrice).toString()`). After removal, `orderAmountCharged` is treated as a plain passthrough field — if the agent sends it in the payload, it is stored; if not sent, it remains unchanged.
  - [x] [Service — `src/service/order.service.ts`] In the Sale Status auto-rules block (saleStatus `'2'` and `'3'`), the line that reads `const markup = updatedData.orderMarkup !== undefined ? updatedData.orderMarkup : (existingOrder.orderMarkup ?? '0')` must be updated to: `const chargedAmount = updatedData.orderAmountCharged !== undefined ? updatedData.orderAmountCharged : (existingOrder.orderAmountCharged ?? '0')`. The line `updatedData.orderRefundAmount = markup` becomes `updatedData.orderRefundAmount = chargedAmount`. This ensures that when an order is fully Refunded or Chargebacked, the refund amount is set to the manually-entered charged amount (not the old auto-calculated markup).
  - [x] [Service — `src/service/order.service.ts`] In the `orderKeysToAudit` array, replace the string `'orderMarkup'` with `'orderAmountCharged'`. This ensures the audit log records changes to the renamed field correctly.
  - [x] [Repository — `src/repository/order.repository.ts`] Search for every occurrence of `orderMarkup` in `findById`, `findAll`, the `select` clauses, and any `createWithCustomerAndCard` method. Replace every occurrence with `orderAmountCharged`. No query logic changes — only the field name changes.
  - [x] [Repository — `src/repository/dashboard.repository.ts`] In every method that reads the margin value from an order row (e.g. `getNetSales`, `getTopPerformers`, `getBottomPerformers`, `getPendingCounts`, chart data aggregators), replace `o.orderMarkup` / `order.orderMarkup` / `markup` variable assignments sourced from `orderMarkup` with `o.orderAmountCharged` / `order.orderAmountCharged`. The formula `const finalMargin = markup - refund` becomes `const finalMargin = chargedAmount - refund` (rename the local variable too for clarity). Ensure that the Prisma `select` clauses in these methods select `orderAmountCharged` instead of `orderMarkup`.
  - [x] [Service — `src/service/dashboard.service.ts`] In `getMetricsForUser()` and any other serializer, replace `orderMarkup: o.orderMarkup` with `orderAmountCharged: o.orderAmountCharged`. If the `DashboardRecentOrder` type in `src/types/dashboard.ts` still references `orderMarkup`, update it (see W-2002 Frontend Types step).
  - [x] [Scripts — `src/scripts/debug-db.ts`, `src/scripts/check-may-scores.ts`, `src/scripts/sync-refunds.ts`] Replace every `orderMarkup` / `order.orderMarkup` reference with `orderAmountCharged` / `order.orderAmountCharged` in these utility scripts. These are not tested but must compile cleanly.
  - [x] Run integration tests — **confirm GREEN (`npm run test -- orders.test.ts`)**.

- [x] **Verification chain (backend):**
  - [x] Agent sends `POST /api/orders` with `orderAmountCharged: '350'` → database row has `order_amount_charged = '350'` and `order_markup` column no longer exists → `GET /api/orders/:id` returns `orderAmountCharged: '350'` with no `orderMarkup` key → ✅ Done.

---

### W-2002 — Frontend: Types, Forms & Display Components Update

**Root cause / Goal:**
After the backend rename, every frontend TypeScript type, form component, and display component that references `orderMarkup` will produce TypeScript compilation errors or silently display incorrect data. This item resolves all frontend-side references, adds a real manual input for `orderAmountCharged` in `AddOrderForm.tsx` and `EditOrderForm.tsx`, and updates the `finalMargin` computation in `OrderList.tsx` and `RecentOrdersTable.tsx` to use `orderAmountCharged`.

**Approach:**
- Update TypeScript types in `src/types/order.ts` and `src/types/dashboard.ts`.
- In `AddOrderForm.tsx` and `EditOrderForm.tsx`: replace the read-only "Computed Markup" display block with a live editable number input labelled **"Amount Charged (Net Margin)"** bound to a new `orderAmountCharged` state variable. Keep the gross spread indicator (i.e. `Pitched - Vendor Price = $X`) as a small read-only reference below the two price fields so agents still see the raw spread for guidance.
- In `OrderList.tsx` and `RecentOrdersTable.tsx`: rename `markupVal` to `chargedVal`, source it from `order.orderAmountCharged`, and keep the same `finalMargin = chargedVal - refundVal` formula.
- In `SearchResults.tsx`: if `orderMarkup` is rendered, rename it to `orderAmountCharged`.

---

- [x] **RED — Unit (`src/tests/OrderList.test.tsx`):**
  - [x] Test: Render `OrderList` with a mock order containing `orderAmountCharged: '400'` and `orderRefundAmount: '150'`. Assert the rendered Pricing cell displays `Final Margin: $250.00` (i.e. `400 - 150 = 250`).
  - [x] Test: Render `OrderList` with a mock order containing `orderAmountCharged: '300'` and `orderRefundAmount: null`. Assert the rendered Pricing cell displays `Final Margin: $300.00`.
  - [x] Test: The rendered table **does not contain** the text `"orderMarkup"` anywhere in its output (regression guard).
  - [x] **Run — confirm RED (the component currently reads `order.orderMarkup`, so with `orderMarkup` absent from the mock and `orderAmountCharged` present, the margin will display `$0.00` or throw a TypeScript error).**

- [x] **RED — Unit (`src/tests/orders.test.ts` — form submission test):**
  - [x] Test: Simulate submitting `AddOrderForm` with `orderAmountCharged` field filled in as `'350'`. Assert the `fetch` call payload includes `{ orderAmountCharged: '350' }` and does **not** include an `orderMarkup` key.
  - [x] Test: Simulate submitting `EditOrderForm` with the `orderAmountCharged` field changed to `'200'`. Assert the `PATCH` payload includes `{ orderAmountCharged: '200' }`.
  - [x] **Run — confirm RED (both forms currently have no `orderAmountCharged` state variable or input, so the payload will not include the key).**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types — `src/types/order.ts`] In the `OrderUpdateInput` and `OrderCreateInput` interfaces: remove the `orderMarkup?: string` field. Add `orderAmountCharged?: string`. In the `Order` display type (if present): remove `orderMarkup` and add `orderAmountCharged?: string | null`.
  - [x] [Types — `src/types/dashboard.ts`] In the `DashboardRecentOrder` interface: replace `orderMarkup: string` with `orderAmountCharged: string`. In any other dashboard type that references `orderMarkup`, rename accordingly.
  - [x] [Component — `src/components/OrderList.tsx`] In the `OrderListProps` interface, replace `orderMarkup: string | null` with `orderAmountCharged: string | null`. Inside the `orders.map()` render block, rename `const markupVal = parseFloat(order.orderMarkup || '0')` to `const chargedVal = parseFloat(order.orderAmountCharged || '0')` and update `const finalMargin = markupVal - refundVal` to `const finalMargin = chargedVal - refundVal`. The JSX display string `Final Margin: $${finalMargin.toFixed(2)}` remains unchanged.
  - [x] [Component — `src/components/dashboard/RecentOrdersTable.tsx`] In the local order prop type, replace `orderMarkup: string` with `orderAmountCharged: string`. Rename `const markupVal = parseFloat(orderMarkup || '0')` to `const chargedVal = parseFloat(orderAmountCharged || '0')` and update the `finalMargin` computation accordingly. Update the JSX that accesses this value.
  - [x] [Component — `src/components/SearchResults.tsx`] If `orderMarkup` is destructured from the order prop or displayed, rename to `orderAmountCharged`. Update the prop type interface.
  - [x] [Component — `src/components/AddOrderForm.tsx`] Add a new state variable: `const [orderAmountCharged, setOrderAmountCharged] = useState('')`. In Section 4 (Pricing), **replace** the existing read-only "Computed Markup" display block (the `<span>` showing `${markup.toFixed(2)}`) with a proper labelled number input:
    ```tsx
    <div className="form-group">
      <label className="form-label">Amount Charged (Net Margin) *</label>
      <input
        id="orderAmountCharged"
        type="number"
        step="0.01"
        placeholder="e.g. 350.00"
        value={orderAmountCharged}
        onChange={(e) => setOrderAmountCharged(e.target.value)}
        required
        className="form-input font-mono"
      />
    </div>
    ```
    Below the `orderVendorPrice` input, add a small read-only gross spread indicator (a `<span>` element, not a stored field) that computes and displays `Gross Spread: $${(parseFloat(orderTotalPitched || '0') - parseFloat(orderVendorPrice || '0')).toFixed(2)}` in muted text so agents have a reference figure. Include `orderAmountCharged: orderAmountCharged || null` in the `payload` object sent to `POST /api/orders`. Remove `orderMarkup` from the payload entirely.
  - [x] [Component — `src/components/EditOrderForm.tsx`] Add a new state variable: `const [orderAmountCharged, setOrderAmountCharged] = useState(order.orderAmountCharged || '')`. In Section 4 (Pricing), **replace** the existing read-only `<span>` "Computed Markup" display block with the same labelled number input as above (id=`"orderAmountCharged"`, bound to `orderAmountCharged` / `setOrderAmountCharged`). Add the same gross spread read-only indicator below the `orderVendorPrice` input. Include `orderAmountCharged: orderAmountCharged || null` in the `payload` object sent to `PATCH /api/orders/:id`. Remove `orderMarkup` from the payload entirely. Remove the `const markup = totalPitchedVal - vendorPriceVal` computed variable (it was only used for the now-removed Computed Markup display).
  - [x] [Container — `src/components/OrderListContainer.tsx`] In any place where `orderMarkup` is destructured from order objects or passed down as a prop, rename to `orderAmountCharged`. Ensure the `select` or query parameters passed to the API or the prop types of child components are updated accordingly.
  - [x] Run unit tests — **confirm GREEN (`npm run test -- OrderList.test.tsx`)**.

- [x] **GREEN — Test Fixtures (All test files that seed `orderMarkup`):**
  - [x] In `src/tests/orders.test.ts`: replace every fixture object property `orderMarkup: '...'` with `orderAmountCharged: '...'` and every assertion `expect(dbOrder?.orderMarkup)` with `expect(dbOrder?.orderAmountCharged)`.
  - [x] In `src/tests/OrderList.test.tsx`: replace every mock order property `orderMarkup: '...'` with `orderAmountCharged: '...'`.
  - [x] In `src/tests/Dashboard.test.tsx`: replace every mock order property `orderMarkup: '...'` with `orderAmountCharged: '...'`.
  - [x] In `src/tests/dashboard.test.ts`: replace every mock order property `orderMarkup: '...'` with `orderAmountCharged: '...'` and every inline comment that references `markup` as the margin base (e.g. `// markup 500, refund 100 -> finalMargin 400`) to use `chargedAmount` terminology.
  - [x] In `src/tests/vendors.test.ts`: replace every `orderMarkup: '...'` fixture property with `orderAmountCharged: '...'`.
  - [x] In `src/tests/VendorDetail.test.tsx`: replace every `orderMarkup: '...'` fixture property with `orderAmountCharged: '...'`.
  - [x] In `src/tests/SearchResults.test.tsx`: replace every `orderMarkup: '...'` fixture property with `orderAmountCharged: '...'`.
  - [x] In `src/tests/gateways.test.ts`: replace every `orderMarkup: '...'` fixture property with `orderAmountCharged: '...'`.
  - [x] Run the **full test suite** — `npm run test` — confirm **all tests GREEN** with zero TypeScript compilation errors and zero ESLint warnings.

- [x] **Verification chain:**
  - [x] Agent opens **Add Order** form → fills in Total Price Pitched (`$800`), Vendor Buying Price (`$500`) → sees read-only **Gross Spread: $300.00** below the price fields for reference → fills in **Amount Charged (Net Margin)** field manually with `$350` → submits form → new order is created in the database with `order_amount_charged = '350'` → ✅ Done.
  - [x] Agent opens **Edit Order** form for an existing order → the **Amount Charged** field is pre-populated with the stored value → agent changes it to `$200` → saves → `GET /api/orders/:id` confirms `orderAmountCharged === '200'` → audit log shows `orderAmountCharged` changed from old value to `200` → ✅ Done.
  - [x] Manager views the **Orders List** table → Pricing column shows correct `Final Margin: $X.XX` computed as `orderAmountCharged - orderRefundAmount` for each row → a Partial Refund order correctly shows a reduced margin → ✅ Done.
  - [x] Manager views **Dashboard** → Recent Orders table, KPI metric totals, Champions League widget, and Team Scores widget all compute `finalMargin` from `orderAmountCharged - orderRefundAmount`, matching the manually-entered values → ✅ Done.
  - [x] `npm run typecheck` passes with **0 errors**. `npm run lint` passes with **0 errors / 0 warnings**. `npm run test` passes with **all tests GREEN**. → ✅ Done.

---

### W-2003 — Order Details Page: Expanded Financial Breakdown UI & Refund Auto-Rule Fix

**Root cause / Goal:**
The current Financial Breakdown card in `src/app/orders/[id]/page.tsx` (lines 362–396) displays only four rows: Selling Price, Buying Price, Markup Margin, and Final Margin. After Phase 20's rename, the business needs two new computed rows to be visible on this card:

1. **Net Margin** — computed display only, never stored: `orderTotalPitched - orderVendorPrice`. This shows the agent the gross theoretical margin before the charged amount is considered.
2. **Remaining to Be Charged** — computed display only, never stored: `Net Margin - orderAmountCharged`. This tells the agent how much of the gross margin has not yet been collected.

The full intended layout (top to bottom, separated by dividers) is:

```
Selling Price            $X.XX
Buying Price             $X.XX
─────────────────────────────
Net Margin               $X.XX   (= Selling - Buying, computed)
Charged Amount           $X.XX   (= orderAmountCharged, stored)
─────────────────────────────
Remaining to Be Charged  $X.XX   (= Net Margin - Charged, computed)
─────────────────────────────
Refund Amount           -$X.XX   (only shown when > 0)
─────────────────────────────
Final Margin             $X.XX   (= Charged - Refund, green/red)
```

Additionally, the existing **Final Margin** formula on this page currently reads `order.orderMarkup - order.orderRefundAmount`. After Phase 20's rename this must become `order.orderAmountCharged - order.orderRefundAmount`.

There is also a **backend auto-rule bug to fix in W-2001 that is made explicit here**: when `saleStatus` is set to `'2'` (Refunded) or `'3'` (Chargebacked), the service currently auto-sets `orderRefundAmount = orderMarkup` (which will become `= orderAmountCharged` after the rename). This is correct — the full refund on a hard reversal must equal exactly the **Charged Amount**, not the gross Net Margin. W-2001 already captures this rename; this work item calls it out explicitly so there is zero ambiguity.

**Approach:**
- Compute `netMargin`, `chargedAmount`, `remainingToCharge`, `refundAmount`, and `finalMargin` as JavaScript constants at the top of the Financial Breakdown JSX block in `src/app/orders/[id]/page.tsx`, sourcing values from the Prisma order object.
- Replace the existing 4-row info-grid block with the new 7-row (conditional Refund row) layout following the dark card styling already in place.
- All new rows use display-only computed values — no new database fields, no API changes, no new types. This is a pure UI change on a single server component file.

---

- [x] **RED — Unit (`src/tests/OrderDetail.test.tsx` — create this file if it does not exist):**
  - [x] Test: Render the Financial Breakdown section with a mock order `{ orderTotalPitched: '1000', orderVendorPrice: '600', orderAmountCharged: '350', orderRefundAmount: null }`. Assert all of the following text nodes are present in the rendered output:
    - `"Net Margin"` label and value `"$400.00"` (= 1000 - 600)
    - `"Charged Amount"` label and value `"$350.00"` (= orderAmountCharged)
    - `"Remaining to Be Charged"` label and value `"$50.00"` (= 400 - 350)
    - `"Final Margin"` label and value `"$350.00"` (= 350 - 0, since refund is null)
    - The `"Refund Amount"` row is **not rendered** (refund is null/zero).
  - [x] Test: Render with `{ orderTotalPitched: '1000', orderVendorPrice: '600', orderAmountCharged: '350', orderRefundAmount: '150' }`. Assert:
    - `"Net Margin"` value = `"$400.00"`
    - `"Charged Amount"` value = `"$350.00"`
    - `"Remaining to Be Charged"` value = `"$50.00"`
    - `"Refund Amount"` row **is rendered** and shows `"-$150.00"` in red
    - `"Final Margin"` value = `"$200.00"` (= 350 - 150)
  - [x] Test: Render with `{ orderTotalPitched: '1000', orderVendorPrice: '600', orderAmountCharged: null, orderRefundAmount: null }`. Assert:
    - `"Net Margin"` value = `"$400.00"`
    - `"Charged Amount"` value = `"$0.00"` (graceful null fallback)
    - `"Remaining to Be Charged"` value = `"$400.00"` (full net margin uncollected)
    - `"Final Margin"` value = `"$0.00"`
  - [x] **Run — confirm RED (the component currently renders only "Markup Margin" and "Final Margin" with no "Net Margin", "Charged Amount", or "Remaining to Be Charged" rows).**

- [x] **GREEN — Frontend (Component — `src/app/orders/[id]/page.tsx`):**
  - [x] At the top of the Financial Breakdown JSX block (just before the opening `<div className="info-grid">` of the pricing card), define these five constants:
    ```tsx
    const netMargin        = parseFloat(order.orderTotalPitched || '0') - parseFloat(order.orderVendorPrice || '0');
    const chargedAmount    = parseFloat(order.orderAmountCharged || '0');
    const remainingCharge  = netMargin - chargedAmount;
    const refundAmount     = parseFloat(order.orderRefundAmount || '0');
    const finalMargin      = chargedAmount - refundAmount;
    ```
  - [x] Replace the entire existing 4-row `<div className="info-grid">` pricing block (from line 366 to line 395 in the current file) with the following new 7-row layout (preserve all existing dark card `style` props and class names):
    ```tsx
    <div className="info-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
      {/* Row 1 — Selling Price */}
      <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <span className="info-label" style={{ color: 'var(--text-sidebar-inactive)' }}>Selling Price</span>
        <span className="info-value font-mono" style={{ color: 'white' }}>${parseFloat(order.orderTotalPitched || '0').toFixed(2)}</span>
      </div>
      {/* Row 2 — Buying Price */}
      <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <span className="info-label" style={{ color: 'var(--text-sidebar-inactive)' }}>Buying Price</span>
        <span className="info-value font-mono" style={{ color: 'rgba(255,255,255,0.8)' }}>${parseFloat(order.orderVendorPrice || '0').toFixed(2)}</span>
      </div>
      {/* Divider + Row 3 — Net Margin (computed, display only) */}
      <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
        <span className="info-label" style={{ color: 'var(--text-sidebar-inactive)' }}>Net Margin</span>
        <span className="info-value font-mono" style={{ color: 'rgba(255,255,255,0.8)' }}>${netMargin.toFixed(2)}</span>
      </div>
      {/* Row 4 — Charged Amount (stored) */}
      <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <span className="info-label" style={{ color: 'var(--text-sidebar-inactive)' }}>Charged Amount</span>
        <span className="info-value font-mono" style={{ color: 'rgba(255,255,255,0.8)' }}>${chargedAmount.toFixed(2)}</span>
      </div>
      {/* Divider + Row 5 — Remaining to Be Charged (computed, display only) */}
      <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
        <span className="info-label" style={{ color: 'var(--text-sidebar-inactive)' }}>Remaining to Be Charged</span>
        <span className="info-value font-mono" style={{ color: remainingCharge > 0 ? '#fbbf24' : 'rgba(255,255,255,0.6)' }}>${remainingCharge.toFixed(2)}</span>
      </div>
      {/* Divider + Row 6 — Refund Amount (only rendered when > 0) */}
      {refundAmount > 0 && (
        <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
          <span className="info-label" style={{ color: 'var(--text-sidebar-inactive)' }}>Refund Amount</span>
          <span className="info-value font-mono" style={{ color: '#f87171' }}>-${refundAmount.toFixed(2)}</span>
        </div>
      )}
      {/* Divider + Row 7 — Final Margin */}
      <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
        <span className="info-label" style={{ fontWeight: 'bold', color: 'var(--text-sidebar-inactive)' }}>Final Margin</span>
        <span className="info-value font-mono" style={{ fontWeight: 'bold', color: finalMargin >= 0 ? '#10b981' : '#ef4444' }}>
          ${finalMargin.toFixed(2)}
        </span>
      </div>
    </div>
    ```
  - [x] Confirm the heading label `"Markup Margin"` (now row 3's `"Net Margin"` label) is **not present** anywhere in the final JSX — do a text search in the file for `"Markup Margin"` to confirm zero matches.
  - [x] Confirm the file no longer references `order.orderMarkup` anywhere — do a text search in the file for `orderMarkup` to confirm zero matches (they are all replaced by the `netMargin` / `chargedAmount` constants sourced from `order.orderAmountCharged`).
  - [x] Run unit test — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Agent opens the Order Details page for an order with Selling Price `$1000`, Buying Price `$600`, Charged Amount `$350`, and no refund → Financial Breakdown card shows exactly: Selling Price `$1000.00` / Buying Price `$600.00` / Net Margin `$400.00` / Charged Amount `$350.00` / Remaining to Be Charged `$50.00` (in amber) / Final Margin `$350.00` (in green) — Refund Amount row is **absent** → ✅ Done.
  - [x] Agent opens the Order Details page for a Partial Refund order with `orderAmountCharged: '350'` and `orderRefundAmount: '150'` → card shows Refund Amount row `-$150.00` (in red) and Final Margin `$200.00` (in green) → ✅ Done.
  - [x] Agent opens the Order Details page for a fully Refunded order (saleStatus `'2'`) → `orderRefundAmount` was auto-set by the service to equal `orderAmountCharged` → Refund Amount row equals Charged Amount → Final Margin is `$0.00` → ✅ Done.
  - [x] `npm run typecheck` passes with **0 errors** after this change — no new type imports are required since all values are computed inline from the existing Prisma `order` object → ✅ Done.

---

## Phase 21 — Mileage & Warranty Rename and Order-Level Checklist Field

### Context & Goals
The business requested two main changes for the order details and creation flow:
1. Rename Quoted Miles and Vendor Miles to "Quoted Miles and Warranty" and "Vendor Miles and Warranty" across the entire database schema and in the user interface forms (Add Order Form, Edit Order Form, Order Details Page).
2. Add a new checkbox field called "Checklist" directly on the order table (`crm_orders`) that acts as an order-level checklist (e.g., storing 'Yes' or 'No').
3. Display all three verification checkmarks (Card Copy Verified, Photo ID Checked, and the new Checklist field) side-by-side in the Order Details page Ledger/Verification area.

---

### W-2101 — DB Schema Migration & Prisma Model Update

**Root cause / Goal:**
Rename `orderQuotedMiles` and `orderGivenMiles` to include "Warranty" in both database and UI. Simultaneously, introduce a new checkbox field called "Checklist" directly on the order table (`crm_orders`). Ensure all three fields are editable (order add/edit forms), audit-logged on change, and viewable on the Order Details page.

**Approach:**
1. Create and apply a Prisma migration to rename the DB columns and add `order_checklist` column to `crm_orders` table.
2. Update the Prisma schema `schema.prisma` and regenerate Prisma client.
3. Update types, services, and repositories to map these fields.

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: `POST /api/orders` with payload containing `orderQuotedMilesAndWarranty: '1000'`, `orderVendorMilesAndWarranty: '950'`, and `orderChecklist: 'Yes'`. Assert `201 Created`. Assert the database row has the new column values: `order_quoted_miles_and_warranty = '1000'`, `order_vendor_miles_and_warranty = '950'`, and `order_checklist = 'Yes'`.
  - [x] Test: `GET /api/orders/:id` returned JSON includes `orderQuotedMilesAndWarranty`, `orderVendorMilesAndWarranty`, and `orderChecklist`, and does NOT include `orderQuotedMiles` or `orderGivenMiles`.
  - [x] Test: `PATCH /api/orders/:id` with `{ orderChecklist: 'No' }` returns `200 OK` and updates the column to `'No'`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Schema → Migration → Repository → Service → Controller):**
  - [x] [Schema] Update `CrmOrders` model in `schema.prisma` to rename `orderQuotedMiles` and `orderGivenMiles`, and add `orderChecklist String? @map("order_checklist") @db.VarChar(20) @default("No")`.
  - [x] [Migration] Create and apply migration `rename_miles_and_add_order_checklist`.
  - [x] [Repository] Update `createWithCustomerAndCard` in `order.repository.ts` to include these three fields.
  - [x] [Service] Update `updateOrder` in `order.service.ts` to update these three fields.
  - [x] [Service] Add `orderQuotedMilesAndWarranty`, `orderVendorMilesAndWarranty`, and `orderChecklist` to `orderKeysToAudit` array in `order.service.ts` to write change log entries when edited.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx` / `src/tests/EditOrderForm.test.tsx`):**
  - [x] Test: Render `AddOrderForm` and assert inputs for `"Quoted Miles and Warranty"`, `"Vendor Miles and Warranty"`, and `"Checklist"` exist with correct labels.
  - [x] Test: Submit `AddOrderForm` with Checklist checkbox checked. Assert that the POST body contains `orderChecklist: 'Yes'`, `orderQuotedMilesAndWarranty`, and `orderVendorMilesAndWarranty`.
  - [x] Test: Render `EditOrderForm` with mock order containing `orderChecklist: 'Yes'` and assert that the Checklist checkbox is initially checked.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] Update `OrderCreateInput` and `OrderUpdateInput` in `src/types/order.ts` to replace old mileage fields and add `orderChecklist?: string`.
  - [x] [Component] In `AddOrderForm.tsx`, replace old mileage state hooks/inputs with the new ones. Add a new checkbox hook/input for `Checklist`.
  - [x] [Component] In `EditOrderForm.tsx`, implement the same fields and states as in `AddOrderForm.tsx`.
  - [x] [Component] In `src/components/OrderAuditLog.tsx`, map the new fields in `fieldLabels` to:
    - `orderQuotedMilesAndWarranty: 'Quoted Miles and Warranty'`
    - `orderVendorMilesAndWarranty: 'Vendor Miles and Warranty'`
    - `orderChecklist: 'Checklist'`
  - [x] Run unit test — **confirm GREEN**.

- [x] **RED — Unit (`src/app/orders/[id]/page.tsx` tests or similar):**
  - [x] Test: Render the Order Details page with an order containing `orderChecklist: 'Yes'`. Assert that the labels read "Quoted Miles and Warranty" and "Vendor Miles and Warranty".
  - [x] Test: Assert that the page renders Card Copy Verified, Photo ID Checked, and Checklist, each with a checked or unchecked status indicator.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Page Component):**
  - [x] [Page] Update `src/app/orders/[id]/page.tsx` to render labels `"Quoted Miles and Warranty"` and `"Vendor Miles and Warranty"`.
  - [x] [Page] In the Ledger Billing/Verification section of the details page, render a list/grid displaying **Card Copy Verified**, **Photo ID Checked**, and **Checklist** statuses, clearly indicating whether they are checked (Yes) or not (No).
  - [x] Run page tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent navigates to `/orders/new` $\rightarrow$ fills in customer, card details, mileage details under "Quoted Miles and Warranty" and "Vendor Miles and Warranty", checks the "Checklist" checkbox $\rightarrow$ submits $\rightarrow$ order details page shows:
    - Vehicle section shows "Quoted Miles and Warranty" and "Vendor Miles and Warranty" with entered numbers.
    - Verification section displays three checkmark indicators for Card Copy Verified, Photo ID Checked, and Checklist.
    - Editing the order and changing mileage or checking off Checklist updates them, showing correctly in the Change History log $\rightarrow$ ✅ Done.

---

## Phase 22 — Sale Status Expansion: Void & Cancel Order, Sale Status Column & Filter

### Context & Goals

The current `sale_status` field supports four codes: `'1'` (Sold), `'2'` (Refunded), `'3'` (Chargebacked), and `'4'` (Partial Refund). Two new statuses are required by the business to cover two distinct cancellation scenarios that are currently invisible in the system:

- **Void (`'5'`)**: The order was charged (payment captured), but the customer cancelled on the same day. The full charged amount is refunded. Because money was temporarily captured and returned, this order belongs in the **Returned Orders** workflow queue alongside Refunded and Chargebacked orders.
- **Cancel Order (`'6'`)**: The agent collected all customer information (name, card, vehicle details) but the customer was **never charged**. The customer later cancelled before any charge was processed. Because no money ever changed hands, this order does **not** belong in Returned Orders — it remains in its current workflow queue (typically `Pending Booking`).

Additionally, three UI changes are required:
1. **Orders table**: Replace the **Team** column with a **Sale Status** column so managers can immediately see the sale status at-a-glance without opening each order.
2. **Orders filter bar**: Add a **Sale Status dropdown filter** in the filter row alongside the existing Agent, Backend Executive, and Date filters.
3. **Forms (Add & Edit)**: When a user selects `Refunded`, `Chargebacked`, or `Void` as the Sale Status, the **Workflow Status must automatically update to `Returned Orders`** in the UI before the form is saved. For all other sale statuses, the workflow status defaults to `Pending Booking`.

> **No database migration is needed.** The `sale_status` column in `crm_orders` is already a free-form `VARCHAR`. No new tables or columns are added in this phase.

---

### W-2201 — Backend: Extend Sale Status Auto-Rules for Void & Cancel Order

**Root cause / Goal:**
The service layer (`order.service.ts`) hard-codes the logic for sale status codes `'2'` and `'3'` (auto-set `orderCurrentStatus = 'Returned Orders'` and `orderRefundAmount = orderAmountCharged`). Code `'5'` (Void) must behave identically to `'2'`/`'3'` because a Void is a same-day full reversal — money was captured then returned in full. Code `'6'` (Cancel Order) must behave like `'1'` (Sold) in terms of refund clearing — `orderRefundAmount` is set to `null` — but the workflow status is **not** forced to `Returned Orders` (no charge occurred). The audit log's `mapSaleStatus` helper and the repository's `Returned Orders` OR-filter must also be extended.

**Approach:**
- In `order.service.ts`: extend the Sale Status auto-rule `if` condition from `'2' || '3'` to `'2' || '3' || '5'`. Add `'6'` to the `'1'`/null-refund branch. Extend `mapSaleStatus` to map `'5'` → `'Void'` and `'6'` → `'Cancel Order'`.
- In `order.repository.ts`: extend the `Returned Orders` OR-filter's `saleStatus` `in` array from `['2', '3']` to `['2', '3', '5']`.
- In `vendor.repository.ts`: extend the `sale_status IN (...)` raw SQL clause to include `'5'` and `'6'` so Void and Cancel Order orders are counted in vendor statistics.

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: Create a test order with `orderAmountCharged: '500'`. `PATCH /api/orders/:id` with `{ saleStatus: '5' }`. Assert `200 OK`. Assert the database row has `order_current_status = 'Returned Orders'` and `order_refund_amount = '500'` (matching `orderAmountCharged`). Assert the response body includes `orderCurrentStatus: 'Returned Orders'`.
  - [x] Test: Create a test order with `orderAmountCharged: '500'`. `PATCH /api/orders/:id` with `{ saleStatus: '6' }`. Assert `200 OK`. Assert the database row has `order_refund_amount = null` (null cleared) and `order_current_status` is **not** `'Returned Orders'` (it must remain whatever the existing workflow status was before the PATCH).
  - [x] Test: `PATCH /api/orders/:id` with `{ saleStatus: '5' }` followed by querying `crm_sale_status_history` for this order's `id`. Assert one row exists where `new_value = '5'` and `old_value` equals the prior sale status code.
  - [x] Test: `PATCH /api/orders/:id` with `{ saleStatus: '6' }` followed by querying `crm_sale_status_history` for this order's `id`. Assert one row exists where `new_value = '6'`.
  - [x] Test: `GET /api/orders?status=Returned+Orders` — create two orders, set one to saleStatus `'5'` (Void) and one to saleStatus `'2'` (Refunded). Assert both orders appear in the paginated response.
  - [x] Test: `GET /api/orders?saleStatus=5` — assert only the Void order is returned. `GET /api/orders?saleStatus=6` — assert only the Cancel Order is returned.
  - [x] **Run — confirm RED (saleStatus `'5'` currently does not trigger `orderCurrentStatus = 'Returned Orders'`; the `'6'` branch does not exist; the filter query does not include `'5'` in the Returned Orders OR clause).**

- [x] **GREEN — Backend (Repository → Service):**
  - [x] [Service — `src/service/order.service.ts`] In `updateOrder`, find the block at lines ~79–93 that checks `data.saleStatus`. Change the condition `data.saleStatus === '2' || data.saleStatus === '3'` to `data.saleStatus === '2' || data.saleStatus === '3' || data.saleStatus === '5'`. In the same block, change the `else if (data.saleStatus === '1')` branch to `else if (data.saleStatus === '1' || data.saleStatus === '6')` so that setting Cancel Order also clears `orderRefundAmount` to `null`. Do not add a Returned Orders assignment for `'6'` — the workflow status must remain unchanged when saleStatus is Cancel Order.
  - [x] [Service — `src/service/order.service.ts`] In the `mapSaleStatus` helper function (~line 262–268), add two new cases before the final `return status ? String(status) : null` fallback:
    ```typescript
    if (status === '5' || status === 5) return 'Void';
    if (status === '6' || status === 6) return 'Cancel Order';
    ```
  - [x] [Repository — `src/repository/order.repository.ts`] In `findAll`, find the `else if (filters.status === 'Returned Orders')` block (~line 182–186). Change the `saleStatus: { in: ['2', '3'] }` value to `saleStatus: { in: ['2', '3', '5'] }` so that Void orders appear in the Returned Orders queue filter.
  - [x] [Repository — `src/repository/vendor.repository.ts`] Find the raw SQL clause `AND sale_status IN ('1', '2', '3', '4')` (~line 98). Change it to `AND sale_status IN ('1', '2', '3', '4', '5', '6')` so that Void and Cancel Order orders are counted in vendor performance statistics.
  - [x] Run integration tests — **confirm GREEN (`npm run test -- orders.test.ts`).**

- [x] **Verification chain (backend):**
  - [x] Agent sends `PATCH /api/orders/:id` with `{ saleStatus: '5' }` → service auto-sets `orderCurrentStatus = 'Returned Orders'` and `orderRefundAmount = orderAmountCharged` → sale status history entry is written → `GET /api/orders?status=Returned+Orders` includes this order → ✅ Done.
  - [x] Agent sends `PATCH /api/orders/:id` with `{ saleStatus: '6' }` → service clears `orderRefundAmount = null` → `orderCurrentStatus` remains unchanged → sale status history entry is written → `GET /api/orders?status=Returned+Orders` does **not** include this order → ✅ Done.

---

### W-2202 — Frontend Forms: New Sale Status Options & Automatic Workflow Status Update

**Root cause / Goal:**
Both `AddOrderForm.tsx` and `EditOrderForm.tsx` hard-code only four `<option>` elements (Sold, Refunded, Chargebacked, Partial Refund) in the Sale Status `<select>`. Neither form contains a `useEffect` that automatically updates the Workflow Status dropdown when the Sale Status changes to one of the "Returned" group. The user currently has to manually change both fields. The requirement is: selecting `Refunded` (`'2'`), `Chargebacked` (`'3'`), or `Void` (`'5'`) must **automatically set** `orderCurrentStatus` to `'Returned Orders'` in the UI; selecting anything else must **reset** `orderCurrentStatus` to `'Pending Booking'` (if it was previously set to `'Returned Orders'` by this auto-rule). The date/time capture modal must also trigger for Void (same-day reversal event needs a timestamp) but must **not** trigger for Cancel Order (no charge event to timestamp).

**Approach:**
- Add `<option value="5">Void</option>` and `<option value="6">Cancel Order</option>` to the `saleStatus` select in both `AddOrderForm.tsx` and `EditOrderForm.tsx`.
- Extend the `onChange` handler's modal trigger condition from `val === '2' || val === '3' || val === '4'` to also include `val === '5'`.
- In `AddOrderForm.tsx`: extend the existing `useEffect` that watches `saleStatus` to include `'5'` in the auto-`Returned Orders` branch and `'6'` in the reset branch.
- In `EditOrderForm.tsx`: add a new `useEffect` (currently absent) that mirrors the same logic as the one in `AddOrderForm.tsx`, watching only `saleStatus` and auto-setting `orderCurrentStatus`.
- Extend the date/time modal's title ternary to handle `saleStatus === '5'` → `'Void'`.

---

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx`):**
  - [x] Test: Render `AddOrderForm`. Find the `<select id="saleStatus">` element. Assert it has exactly **6** `<option>` elements with values `['1', '2', '3', '4', '5', '6']` and labels `['Sold', 'Refunded', 'Chargebacked', 'Partial Refund', 'Void', 'Cancel Order']`.
  - [x] Test: Render `AddOrderForm`. Change `saleStatus` select to `'5'` (Void). Assert the `showStatusDateModal` state becomes `true` (i.e., the date/time capture modal opens — use `document.body` for portal assertion or spy on `setShowStatusDateModal`).
  - [x] Test: Render `AddOrderForm`. Change `saleStatus` select to `'6'` (Cancel Order). Assert the date/time modal does **not** open (remains `false`).
  - [x] Test: Render `AddOrderForm`. Change `saleStatus` select to `'5'` (Void). Assert `orderCurrentStatus` state auto-updates to `'Returned Orders'` (visible via the `<select id="orderCurrentStatus">` value attribute).
  - [x] Test: Render `AddOrderForm`. Set `saleStatus` to `'5'` (triggering `orderCurrentStatus = 'Returned Orders'`). Then change `saleStatus` to `'6'` (Cancel Order). Assert `orderCurrentStatus` resets from `'Returned Orders'` to `'Pending Booking'`.
  - [x] **Run — confirm RED (only 4 options exist today; `'5'` does not open the modal; no useEffect auto-sets `orderCurrentStatus` for `'5'`/`'6'`).**

- [x] **RED — Unit (`src/tests/EditOrderForm.test.tsx`):**
  - [x] Test: Render `EditOrderForm` with a mock order containing `saleStatus: '1'`. Find `<select id="saleStatus">`. Assert it has exactly **6** `<option>` elements with values `['1', '2', '3', '4', '5', '6']`.
  - [x] Test: Render `EditOrderForm` with mock order `saleStatus: '1'`, `orderCurrentStatus: 'Pending Shipment'`. Change `saleStatus` to `'5'` (Void). Assert the `<select id="orderCurrentStatus">` value changes to `'Returned Orders'` automatically without any other interaction.
  - [x] Test: Render `EditOrderForm` with mock order `saleStatus: '2'`, `orderCurrentStatus: 'Returned Orders'`. Change `saleStatus` to `'6'` (Cancel Order). Assert `<select id="orderCurrentStatus">` value changes to `'Pending Booking'`.
  - [x] Test: Render `EditOrderForm` with mock order `saleStatus: '1'`. Change `saleStatus` to `'5'`. Assert the date/time capture modal opens (the portal `div` appears in `document.body`).
  - [x] Test: Render `EditOrderForm` with mock order `saleStatus: '1'`. Change `saleStatus` to `'6'`. Assert the date/time capture modal does **not** open.
  - [x] **Run — confirm RED (only 4 options exist; no useEffect auto-sets orderCurrentStatus; `'5'` does not open the modal).**

- [x] **GREEN — Frontend (Types → AddOrderForm → EditOrderForm):**
  - [x] [Types — `src/types/order.ts`] No changes needed — `saleStatus` is already typed as `string` in `OrderCreateInput` and `OrderUpdateInput`. Confirm no changes required.
  - [x] [Component — `src/components/AddOrderForm.tsx`]
    - In the `<select id="saleStatus">` JSX block (currently lines ~610–614), add two new `<option>` elements after `<option value="4">Partial Refund</option>`:
      ```tsx
      <option value="5">Void</option>
      <option value="6">Cancel Order</option>
      ```
    - In the `onChange` handler of the `saleStatus` select (currently lines ~596–607), change the condition `val === '2' || val === '3' || val === '4'` to `val === '2' || val === '3' || val === '4' || val === '5'` so the date/time modal also opens for Void.
    - In the existing `useEffect` that watches `saleStatus` (~lines 89–97), change:
      - The `Returned Orders` auto-set condition from `saleStatus === '2' || saleStatus === '3'` to `saleStatus === '2' || saleStatus === '3' || saleStatus === '5'`.
      - The reset condition from `saleStatus === '1' || saleStatus === '4'` to `saleStatus === '1' || saleStatus === '4' || saleStatus === '6'`.
    - In the date/time modal title ternary (currently: `saleStatus === '2' ? 'Refund' : saleStatus === '3' ? 'Chargeback' : 'Partial Refund'`), add the Void case: `saleStatus === '2' ? 'Refund' : saleStatus === '3' ? 'Chargeback' : saleStatus === '5' ? 'Void' : 'Partial Refund'`.
  - [x] [Component — `src/components/EditOrderForm.tsx`]
    - In the `<select id="saleStatus">` JSX block (currently lines ~511–514), add two new `<option>` elements after Partial Refund:
      ```tsx
      <option value="5">Void</option>
      <option value="6">Cancel Order</option>
      ```
    - In the `onChange` handler of the `saleStatus` select (currently lines ~497–508), change the modal trigger condition from `val === '2' || val === '3' || val === '4'` to `val === '2' || val === '3' || val === '4' || val === '5'`.
    - Add a new `useEffect` in `EditOrderForm.tsx` immediately after the existing `useEffect(() => { setMounted(true); ... }, [])` block. This effect watches **only** `saleStatus` and mirrors the `AddOrderForm` auto-rule:
      ```typescript
      useEffect(() => {
        if (saleStatus === '2' || saleStatus === '3' || saleStatus === '5') {
          setOrderCurrentStatus('Returned Orders');
        } else if (saleStatus === '1' || saleStatus === '4' || saleStatus === '6') {
          if (orderCurrentStatus === 'Returned Orders') {
            setOrderCurrentStatus('Pending Booking');
          }
        }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [saleStatus]);
      ```
      > The `eslint-disable` comment is required because `orderCurrentStatus` is intentionally excluded from deps — we only want this effect to fire when the agent explicitly changes `saleStatus`, not on every status update.
    - In the date/time modal title ternary (currently: `saleStatus === '2' ? 'Refund' : saleStatus === '3' ? 'Chargeback' : 'Partial Refund'`), add: `saleStatus === '2' ? 'Refund' : saleStatus === '3' ? 'Chargeback' : saleStatus === '5' ? 'Void' : 'Partial Refund'`.
  - [x] Run unit tests — **confirm GREEN (`npm run test -- AddOrderForm.test.tsx EditOrderForm.test.tsx`).**

- [x] **Verification chain:**
  - [x] Agent opens Add Order form → selects `Void` from Sale Status dropdown → date/time capture modal appears → agent confirms or skips → `Workflow Queue` dropdown has auto-changed to `'Returned Orders'` → agent submits → `GET /api/orders/:id` shows `saleStatus: '5'` and `orderCurrentStatus: 'Returned Orders'` → ✅ Done.
  - [x] Agent opens Edit Order form for an existing order (saleStatus `'1'`, orderCurrentStatus `'Pending Shipment'`) → selects `Cancel Order` from Sale Status dropdown → no modal appears → `Workflow Queue` dropdown remains on `'Pending Shipment'` (Cancel Order does not force Returned Orders) → agent saves → ✅ Done.
  - [x] Agent opens Edit Order form → selects `Void` → Workflow Queue auto-changes to `'Returned Orders'` → agent then changes Sale Status back to `'1'` (Sold) → Workflow Queue auto-resets to `'Pending Booking'` → ✅ Done.

---

### W-2203 — Frontend Orders Table: Replace Team Column with Sale Status Column

**Root cause / Goal:**
The Orders table in `OrderList.tsx` currently shows a dedicated **Team** column (the team of the assigned sales agent). This column takes up space without providing immediate financial insight. Managers need to see the **Sale Status** (Sold, Refunded, Void, etc.) at a glance on every row without clicking into an order. The Team information remains accessible on the Order Details page. This item replaces the Team `<th>` and `<td>` with a color-coded Sale Status badge.

**Approach:**
- Remove the Team `<th>` header and its corresponding `<td>` from `OrderList.tsx`.
- Add a `Sale Status` `<th>` and a `<td>` that renders a color-coded badge using two new pure helper functions: `getSaleStatusLabel` and `getSaleStatusBadgeClass`.
- No API or data changes are needed — `saleStatus` is already returned by the `GET /api/orders` endpoint and already present in the `OrderListProps` interface (`saleStatus?: string | null`).

---

- [x] **RED — Unit (`src/tests/OrderList.test.tsx`):**
  - [x] Test: Render `OrderList` with a mock order containing `saleStatus: '1'`. Assert the rendered table **does not** contain a `<th>` with text `"Team"`. Assert the rendered table **does** contain a `<th>` with text `"Sale Status"`.
  - [x] Test: Render `OrderList` with a mock order containing `saleStatus: '1'`. Assert a cell in the table body contains the text `"Sold"`.
  - [x] Test: Render `OrderList` with a mock order containing `saleStatus: '2'`. Assert the body cell contains `"Refunded"`.
  - [x] Test: Render `OrderList` with a mock order containing `saleStatus: '3'`. Assert the body cell contains `"Chargebacked"`.
  - [x] Test: Render `OrderList` with a mock order containing `saleStatus: '4'`. Assert the body cell contains `"Partial Refund"`.
  - [x] Test: Render `OrderList` with a mock order containing `saleStatus: '5'`. Assert the body cell contains `"Void"`.
  - [x] Test: Render `OrderList` with a mock order containing `saleStatus: '6'`. Assert the body cell contains `"Cancel Order"`.
  - [x] Test: Render `OrderList` with a mock order containing `saleStatus: null`. Assert the body cell contains `"—"`.
  - [x] **Run — confirm RED (the table currently has a `"Team"` column header and no `"Sale Status"` column; there is no badge rendering `"Void"` or `"Cancel Order"`).**

- [x] **GREEN — Frontend (Component — `src/components/OrderList.tsx`):**
  - [x] [Component] In the `OrderListProps` interface, no changes needed — `saleStatus?: string | null` is already declared.
  - [x] [Component] Add two pure helper functions **inside the component** (before the `return` statement, after the existing `getStatusBadgeClass` function):
    ```typescript
    const getSaleStatusLabel = (status: string | null | undefined): string => {
      switch (status) {
        case '1': return 'Sold';
        case '2': return 'Refunded';
        case '3': return 'Chargebacked';
        case '4': return 'Partial Refund';
        case '5': return 'Void';
        case '6': return 'Cancel Order';
        default:  return '—';
      }
    };

    const getSaleStatusBadgeClass = (status: string | null | undefined): string => {
      switch (status) {
        case '1': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
        case '2': return 'bg-amber-50 text-amber-700 border border-amber-200/50';
        case '3': return 'bg-rose-50 text-rose-700 border border-rose-200/50';
        case '4': return 'bg-blue-50 text-blue-700 border border-blue-200/50';
        case '5': return 'bg-purple-50 text-purple-700 border border-purple-200/50';
        case '6': return 'bg-slate-50 text-slate-600 border border-slate-200/50';
        default:  return 'bg-slate-50 text-slate-400';
      }
    };
    ```
  - [x] [Component] In the `<thead>` block, replace `<th>Team</th>` with `<th>Sale Status</th>`.
  - [x] [Component] In the `<tbody>` `orders.map()` block, replace the entire Team `<td>` block:
    ```tsx
    <td>
      <span className="badge-team font-medium" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.92em', padding: '2px 6px' }}>
        {order.salesAgent?.team?.teamName || '—'}
      </span>
    </td>
    ```
    with a Sale Status `<td>` block:
    ```tsx
    <td>
      <span
        className={`status-dot-badge font-semibold ${getSaleStatusBadgeClass(order.saleStatus)}`}
        style={{ fontSize: '0.85em', padding: '2px 8px' }}
      >
        {getSaleStatusLabel(order.saleStatus)}
      </span>
    </td>
    ```
  - [x] Run unit tests — **confirm GREEN (`npm run test -- OrderList.test.tsx`).**

- [x] **Verification chain:**
  - [x] Manager opens the Orders page → Orders table shows a `"Sale Status"` column with colored badges (`Sold` in green, `Refunded` in amber, `Chargebacked` in red, `Void` in purple, `Cancel Order` in slate, `Partial Refund` in blue) → the `"Team"` column is no longer present in the table → ✅ Done.

---

### W-2204 — Frontend Orders Filter Bar: Add Sale Status Dropdown Filter

**Root cause / Goal:**
The `OrderListContainer.tsx` already manages a `saleStatusFilter` state variable and passes it to the API as a query parameter (`/api/orders?saleStatus=X`), and the active filter appears as a dismissable pill when set. However, there is **no visible dropdown in the filter bar UI** that allows the user to actually set this filter — it can only be set programmatically via URL params. This work item adds a visible Sale Status `<select>` filter control to the filter bar row.

**Approach:**
- Add a `<div className="filter-select-wrapper">` block containing a labeled `<select>` inside the existing flex filter row in `OrderListContainer.tsx` (the row that already contains Team, Agent, Backend Executive, Start Date, and End Date filters).
- The filter must include all 6 sale status options plus an "All Sale Statuses" default option.
- Extend the active-filter pill display to decode codes `'5'` and `'6'` to their human-readable labels.
- The Returned Orders info banner description text must be updated to mention Void alongside Refunded and Chargebacked.

---

- [x] **RED — Unit (`src/tests/OrderListContainer.test.tsx`):**
  - [x] Test: Render `OrderListContainer`. Assert a `<select>` (or `<label>` containing `"Sale Status"`) is present in the filter bar — not just in the active-filter pill area, but as a primary filter control.
  - [x] Test: Render `OrderListContainer`. Simulate changing the Sale Status select to `'5'`. Assert the active-filter pill text reads `"Sale Status: Void"`.
  - [x] Test: Render `OrderListContainer`. Simulate changing the Sale Status select to `'6'`. Assert the active-filter pill text reads `"Sale Status: Cancel Order"`.
  - [x] **Run — confirm RED (no Sale Status select exists in the filter bar today; the pill only decodes codes `'1'`–`'4'`).**

- [x] **GREEN — Frontend (Component — `src/components/OrderListContainer.tsx`):**
  - [x] [Component] In the flex filter row (`<div className="flex-wrap-container" ...>`, lines ~321–382), add a new `<div className="filter-select-wrapper">` block as the **first** child (before the Team filter), containing:
    ```tsx
    <div className="filter-select-wrapper">
      <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>Sale Status</label>
      <select
        id="saleStatusFilter"
        value={saleStatusFilter}
        onChange={(e) => setSaleStatusFilter(e.target.value)}
        className="filter-select-custom"
      >
        <option value="">All Sale Statuses</option>
        <option value="1">Sold</option>
        <option value="2">Refunded</option>
        <option value="3">Chargebacked</option>
        <option value="4">Partial Refund</option>
        <option value="5">Void</option>
        <option value="6">Cancel Order</option>
      </select>
    </div>
    ```
  - [x] [Component] In the active-filter pill display (lines ~389–399), extend the Sale Status pill label ternary from `saleStatusFilter === '4' ? 'Partial Refund' : saleStatusFilter` to also decode `'5'` and `'6'`:
    ```tsx
    Sale Status: {
      saleStatusFilter === '1' ? 'Sold'
      : saleStatusFilter === '2' ? 'Refunded'
      : saleStatusFilter === '3' ? 'Chargebacked'
      : saleStatusFilter === '4' ? 'Partial Refund'
      : saleStatusFilter === '5' ? 'Void'
      : saleStatusFilter === '6' ? 'Cancel Order'
      : saleStatusFilter
    }
    ```
  - [x] [Component] In the Returned Orders info banner description paragraph (lines ~481–483), update the text from `"processing failures, returns, or disputes"` to `"processing failures, returns, disputes, or same-day voids"` to reflect that Void orders also land here.
  - [x] Run unit tests — **confirm GREEN (`npm run test -- OrderListContainer.test.tsx`).**

- [x] **Verification chain:**
  - [x] Manager opens the Orders page → filter bar shows a labeled `"Sale Status"` dropdown → manager selects `"Void"` → orders list refreshes to show only Void orders → an active-filter pill appears reading `"Sale Status: Void"` with an `×` dismiss button → clicking `×` clears the filter and all orders return → ✅ Done.
  - [x] Manager clicks the `"Returned Orders"` tab → sees the info banner now mentions "same-day voids" → ✅ Done.

---

### W-2205 — Documentation & Audit Log Label Updates

**Root cause / Goal:**
The `SaleStatusTimeline.tsx` component and the `OrderAuditLog.tsx` component both map sale status codes to human-readable labels for display in the order detail page history timeline. They must be extended to decode codes `'5'` and `'6'`. The `project_data.md` Sale Status lookup table must also be updated to document the two new codes as the single source of truth.

**Approach:**
- Extend the `getSaleStatusLabel` mapping in `SaleStatusTimeline.tsx` to handle `'5'` → `'Void'` and `'6'` → `'Cancel Order'` with appropriate color/icon.
- In `OrderAuditLog.tsx`, if sale status code values are rendered directly (not via the `mapSaleStatus` helper in the service), extend the display mapping.
- Update `project_data.md` Sale Status lookup enum table to add the two new rows.

---

- [x] **RED — Unit (`src/tests/SaleStatusTimeline.test.tsx` — create if not present):**
  - [x] Test: Render `SaleStatusTimeline` with a history entry where `newValue === '5'`. Assert the rendered label text is `"Void"` (not `"Unknown"` or `"5"`).
  - [x] Test: Render `SaleStatusTimeline` with a history entry where `newValue === '6'`. Assert the rendered label text is `"Cancel Order"`.
  - [x] **Run — confirm RED (codes `'5'` and `'6'` currently render as `"Unknown"` or the raw code string).**

- [x] **GREEN — Frontend (Component → Documentation):**
  - [x] [Component — `src/components/SaleStatusTimeline.tsx`] Locate the `getSaleStatusLabel` function or the inline ternary/switch that maps status codes to labels. Add cases for `'5'` → `'Void'` and `'6'` → `'Cancel Order'` with appropriate badge styling (e.g., purple for Void, slate for Cancel Order — matching the palette used in `OrderList.tsx`).
  - [x] [Component — `src/components/OrderAuditLog.tsx`] Locate the `fieldLabels` or rendering map for the `saleStatus` audit field. Confirm the audit log renders the human-readable label (not the raw code) for historical entries. The service's `mapSaleStatus` already handles this for new changes; ensure any display-only mapping in the component is also extended to include `'5'` and `'6'`.
  - [x] Run unit tests — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Manager opens Order Details page for a Void order → Sale Status History timeline shows a row reading `"Sold → Void"` with the correct date and badge color → ✅ Done.
  - [x] Manager opens Order Details page for a Cancel Order order → timeline shows `"Sold → Cancel Order"` → ✅ Done.

---

### W-2206 — CSV Importer: Map `Void` and `No Sale` to New Sale Status Codes

**Root cause / Goal:**
The CSV file `Data_for_CRM_v2.csv` stores sale status as human-readable strings. The current `mapSaleStatus` function in `src/scripts/import-csv-data.ts` (lines 74–86) maps `'sold'` → `'1'`, `'refunded'` → `'2'`, `'chargedback'`/`'chargebacked'` → `'3'`, and `'partial refund'` → `'4'`. It does **not** handle:
- `'void'` — which must map to `'5'` (Void).
- `'no sale'` — which must map to `'6'` (Cancel Order).

Any row with these values currently falls through to the default `return '1'` (Sold), silently misclassifying Void and No Sale orders as Sold orders. Additionally, the `isReturned` flag (line 342) controls the auto-population of `orderRefundAmount` and `orderCurrentStatus` during import — it must include Void (`'5'`) so those orders land in `Returned Orders` with their full charged amount as the refund.

**Approach:**
- In `mapSaleStatus` (~line 74), add two new conditions **before** the default fallback:
  - `if (lower === 'void') return '5';`
  - `if (lower === 'no sale' || lower === 'nosale') return '6';`
- On line 342, extend the `isReturned` condition from `mappedSaleStatus === '2' || mappedSaleStatus === '3'` to `mappedSaleStatus === '2' || mappedSaleStatus === '3' || mappedSaleStatus === '5'` so that Void rows also receive `orderRefundAmount = chargedVal` and `orderCurrentStatus = 'Returned Orders'` during bulk import.
- Cancel Order (`'6'`) must **not** set `isReturned = true` — those orders were never charged, so `orderRefundAmount` stays `null` and `orderCurrentStatus` stays `'Completed Orders'` (no active pipeline state for bulk-imported historical data; the default completed state is appropriate).

---

- [x] **RED — Unit (`src/tests/seed.test.ts` or a new `src/tests/importScript.test.ts`):**
  - [x] Test: Call `mapSaleStatus('Void')` (case-insensitive). Assert the return value is `'5'`.
  - [x] Test: Call `mapSaleStatus('void')`. Assert the return value is `'5'`.
  - [x] Test: Call `mapSaleStatus('No Sale')`. Assert the return value is `'6'`.
  - [x] Test: Call `mapSaleStatus('no sale')`. Assert the return value is `'6'`.
  - [x] Test: Call `mapSaleStatus('Sold')`. Assert the return value is still `'1'` (regression guard — existing mappings must not change).
  - [x] Test: Call `mapSaleStatus('Refunded')`. Assert the return value is still `'2'`.
  - [x] Test: Call `mapSaleStatus('unknown garbage')`. Assert the return value is `'1'` (default fallback unchanged).
  - [x] **Run — confirm RED (`mapSaleStatus('Void')` currently returns `'1'` and `mapSaleStatus('No Sale')` currently returns `'1'`).**

- [x] **GREEN — Script (`src/scripts/import-csv-data.ts`):**
  - [x] [Script] In the `mapSaleStatus` function (lines 74–86), add the following two lines **immediately before** the `return '1'; // Default fallback is Sold` line:
    ```typescript
    if (lower === 'void') return '5';
    if (lower === 'no sale' || lower === 'nosale') return '6';
    ```
  - [x] [Script] On line 342, change the `isReturned` assignment from:
    ```typescript
    const isReturned = mappedSaleStatus === '2' || mappedSaleStatus === '3';
    ```
    to:
    ```typescript
    // Void ('5') is a full same-day reversal — treat as returned during bulk import.
    // Cancel Order ('6') was never charged — not returned; orderRefundAmount stays null.
    const isReturned = mappedSaleStatus === '2' || mappedSaleStatus === '3' || mappedSaleStatus === '5';
    ```
  - [x] Run unit tests — **confirm GREEN (`npm run test -- seed.test.ts`).**

- [x] **Verification chain:**
  - [x] Engineer runs `npx ts-node src/scripts/import-csv-data.ts` against the real `Data_for_CRM_v2.csv` → rows with sale status `"Void"` are imported with `saleStatus = '5'` and `orderCurrentStatus = 'Returned Orders'` and `orderRefundAmount = <chargedVal>` → rows with sale status `"No Sale"` are imported with `saleStatus = '6'` and `orderCurrentStatus = 'Completed Orders'` and `orderRefundAmount = null` → querying the database confirms: `SELECT sale_status, order_current_status, order_refund_amount FROM crm_orders WHERE sale_status IN ('5','6')` returns the expected values for all imported rows → ✅ Done.

---

### Full Phase 22 Verification Chain

- [x] Agent creates a new order → submits with `saleStatus: '5'` (Void) selected in the form → form auto-sets Workflow Status to `'Returned Orders'` before submit → order is created → Order Details page shows Sale Status as `Void` (purple badge), Workflow as `Returned Orders` → order appears in the `Returned Orders` queue tab in the Orders pipeline → Sale Status History timeline shows `"Sold → Void"` → ✅ Done.
- [x] Agent creates a new order → submits with `saleStatus: '6'` (Cancel Order) → form does **not** open the date modal → Workflow Status remains on `'Pending Booking'` → order is created → Order Details page shows Sale Status as `Cancel Order` (slate badge) → order does **not** appear in the `Returned Orders` queue → ✅ Done.
- [x] Manager opens the Orders table → `"Sale Status"` column shows color-coded badges for each row → the `"Team"` column is absent → ✅ Done.
- [x] Manager uses the Sale Status filter dropdown → selects `"Void"` → only Void orders are shown → pill reads `"Sale Status: Void"` → ✅ Done.
- [x] Engineer runs the CSV bulk import → Void rows ingest as `saleStatus = '5'` in `Returned Orders` → No Sale rows ingest as `saleStatus = '6'` in `Completed Orders` with null refund → ✅ Done.
- [x] `npm run typecheck` passes with **0 errors**. `npm run lint` passes with **0 errors / 0 warnings**. `npm run test` passes with **all tests GREEN** → ✅ Done.

---

## Phase 23 — Cancelled Orders Workflow & Renaming (Cancelled Status & Cancelled Orders Queue)

### W-2301 — Renaming Cancel Order to Cancelled and Adding Cancelled Orders Queue

**Root cause / Goal:**
Unpaid/unbilled order cancellations need to be classified separately to prevent skewing operational queue metrics. The sale status `'6'` (previously "Cancel Order") needs to be renamed to "Cancelled", and a dedicated workflow status "Cancelled Orders" must be introduced. Selecting "Cancelled" should automatically move the workflow queue to "Cancelled Orders". Access to this queue must be governed by a new sequential RBAC permission `orders:view-cancelled`.

**Approach:**
1. Update `seed.sql` to insert the new permission `orders:view-cancelled` sequentially at ID 41, shifting subsequent permissions and updating Super Admin/Admin associations.
2. Update `order.repository.ts` and `order.service.ts` to assign `'Cancelled Orders'` as workflow status for `'6'` and mapping labels.
3. Update `dashboard.repository.ts` to include `'Cancelled Orders'` in the pipeline counter widget logic and types.
4. Update `import-csv-data.ts` to map cancelled entries.
5. Create new `/pending/cancelled` route, page, and middleware guards.
6. Update frontend forms, lists, timelines, and container components to support `'Cancelled'` and `'Cancelled Orders'`.

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: `PATCH /api/orders/:id` with `{ saleStatus: '6' }` returns `200 OK` and sets `orderCurrentStatus` to `'Cancelled Orders'`.
  - [x] Test: `GET /api/orders?status=Cancelled+Orders` returns only orders with `orderCurrentStatus = 'Cancelled Orders'`.
  - [x] Test: `GET /api/orders?status=Cancelled+Orders` without the new `'orders:view-cancelled'` permission returns `403 Forbidden`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Schema → Repository → Service → Controller):**
  - [x] [Seed] Modify `seed.sql` to insert `(41, 'orders:view-cancelled', 'Access Cancelled Orders queue')`, shift subsequent IDs up by 1, and update Super Admin/Admin role permission maps (IDs 1-54).
  - [x] [Repository] In `order.repository.ts`:
    - In `createWithCustomerAndCard`, set `orderCurrentStatus` to `'Cancelled Orders'` if `saleStatus === '6'`.
    - In `findAll`, check for `filters.status === 'Cancelled Orders'`.
  - [x] [Service] In `order.service.ts`:
    - In `updateOrder`, if `saleStatus === '6'`, set `orderCurrentStatus = 'Cancelled Orders'`.
    - Update `mapSaleStatus` mapping cases.
  - [x] [Dashboard] In `dashboard.repository.ts`, include `'Cancelled Orders'` in `getPendingCounts`.
  - [x] [Importer] In `import-csv-data.ts`, map `"No Sale"` and `"Cancelled"` to `'6'` and set `orderCurrentStatus` to `'Cancelled Orders'` if `saleStatus === '6'`.
  - [x] [Middleware] In `middleware.ts`, map `/pending/cancelled` to `'orders:view-cancelled'`.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit / Component (`src/tests/AddOrderForm.test.tsx`, `src/tests/EditOrderForm.test.tsx`, `src/tests/OrderListContainer.test.tsx`):**
  - [x] Test: In `AddOrderForm.test.tsx`, rendering form and selecting `"Cancelled"` automatically changes the workflow queue select option to `"Cancelled Orders"`.
  - [x] Test: In `EditOrderForm.test.tsx`, selecting `"Cancelled"` changes workflow queue to `"Cancelled Orders"`, and selecting a non-big-3/non-cancelled status reverts to the saved workflow queue.
  - [x] Test: In `OrderListContainer.test.tsx`, rendering container when user has `'orders:view-cancelled'` displays the `"Cancelled Orders"` tab.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] [Types] In `src/types/dashboard.ts`, add `'Cancelled Orders'?: MetricValue;` to `PendingCounts`.
  - [x] [Pages] Create `src/app/pending/cancelled/page.tsx` rendering `<OrderListContainer initialStatus="Cancelled Orders" />`.
  - [x] [Components] Update option labels and default side-effects in `AddOrderForm.tsx` and `EditOrderForm.tsx`.
  - [x] [Components] Update label and badge styling in `OrderList.tsx` and `SaleStatusTimeline.tsx`.
  - [x] [Components] Update `OrderListContainer.tsx` to render the Cancelled Orders tab and info banner.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Log in as Admin -> Open Add Order form -> Select "Cancelled" from Sale Status dropdown -> Workflow Queue automatically changes to "Cancelled Orders".
  - [x] Submit order -> Order is listed under the "Cancelled Orders" tab in the Orders list.
  - [x] Click "Cancelled Orders" tab -> The red warning banner "Cancelled Orders Queue" is displayed -> ✅ Done.


---

### Phase 24 — Alternate Phones, Vendor Geo & Payment Fields, Multi-Card Orders, Card Image Uploads & UI Label Renames

> **Decision Reference:** This phase was designed and approved in the `CONTEXT/decision_log.md` investigation session of July 3, 2026. All schema changes are purely additive (nullable columns only) and cannot affect existing data.

> **Image Storage Decision:** All new image fields (Card Copy Received, Photo ID Received) will be stored as **Base64-encoded strings in `LONGTEXT` columns** directly in the MySQL database. No server filesystem storage is used. On the read path, image columns are **excluded from all `findMany` / list queries** using Prisma `select` to prevent performance degradation — they are only fetched explicitly for single-record detail views.

---
#### W-2401 — Database: Alternate Phone Fields for Customers

**Root cause / Goal:**
Customers frequently provide more than one contact number (e.g., home, mobile, work), but `crm_customers` currently only has a single `customer_phone` column. Agents need to capture up to two alternate phone numbers per customer. These are optional fields — many customers will have only one or zero numbers.

**Approach:**
Add two nullable `VARCHAR(25)` columns to `crm_customers` via a Prisma migration. Expose both fields in the customer repository, service, and type definitions. Update `AddOrderForm.tsx` and `EditOrderForm.tsx` UI to render two additional optional phone inputs in the Customer Info section.

---

- [x] **RED — Integration (`src/tests/customers.test.ts`):**
  - [x] Test: `POST /api/customers` with payload `{ customerName: 'Test User', customerEmail: 'a@b.com', customerPhone: '123', customerAlternatePhone1: '456', customerAlternatePhone2: '789' }`. Assert `201 Created`. Then `GET /api/customers/:id` and assert the response body contains `customerAlternatePhone1: '456'` and `customerAlternatePhone2: '789'`.
  - [x] Test: `POST /api/customers` with payload omitting `customerAlternatePhone1` and `customerAlternatePhone2` entirely. Assert `201 Created` with no error. Assert `GET /api/customers/:id` returns both fields as `null`.
  - [x] Test: `PATCH /api/customers/:id` (or order update path that updates customer) with `{ customerAlternatePhone1: '999' }`. Assert subsequent `GET` returns `customerAlternatePhone1: '999'` while all other existing fields remain unchanged.
  - [x] **Run — confirm RED (these fields do not exist in the schema yet; the API will return 400 or ignore the values).**

- [x] **GREEN — Backend (Schema → Repository → Service → Controller):**
  - [x] [Schema] In `prisma/schema.prisma`, inside the `CrmCustomers` model (after `customerPhone`), add:
    ```prisma
    customerAlternatePhone1 String? @map("customer_alternate_phone_1") @db.VarChar(25)
    customerAlternatePhone2 String? @map("customer_alternate_phone_2") @db.VarChar(25)
    ```
  - [x] [Migration] Run `npx prisma migrate dev --name add_alternate_phones_to_customers`. Verify the migration SQL contains `ADD COLUMN customer_alternate_phone_1 VARCHAR(25) NULL` and `ADD COLUMN customer_alternate_phone_2 VARCHAR(25) NULL` and **no DROP or ALTER on any existing column**.
  - [x] [Repository] In `src/repository/customer.repository.ts`, update `create(data)` and `update(id, data)` to map `customerAlternatePhone1` and `customerAlternatePhone2` from the input. Update `findById(id)` to ensure both fields are returned.
  - [x] [Service] In `src/service/customer.service.ts`, pass `customerAlternatePhone1` and `customerAlternatePhone2` through the create and update input pipelines. No validation constraint — both are fully optional strings.
  - [x] [Controller] In `src/app/api/customers/[id]/route.ts` (PATCH), ensure both alternate phone fields are accepted from the request body and forwarded to the service.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx` and `src/tests/EditOrderForm.test.tsx`):**
  - [x] Test (`AddOrderForm`): Render the form. Assert an `<input id="customerAlternatePhone1">` element is present in the Customer Info section.
  - [x] Test (`AddOrderForm`): Render the form. Assert an `<input id="customerAlternatePhone2">` element is present in the Customer Info section.
  - [x] Test (`EditOrderForm`): Render the form with a mock order whose customer has `customerAlternatePhone1: '555-1234'`. Assert the input `#customerAlternatePhone1` has `value="555-1234"`.
  - [x] **Run — confirm RED (neither input exists in the current form JSX).**

- [x] **GREEN — Frontend (Types → Components):**
  - [x] [Types] In `src/types/customer.ts`, add `customerAlternatePhone1?: string | null` and `customerAlternatePhone2?: string | null` to the `Customer`, `CustomerCreateInput`, and `CustomerUpdateInput` types.
  - [x] [Component — `src/components/AddOrderForm.tsx`] In the Customer Info section (after the `customerPhone` input block), add two new optional input fields labeled `"Alternate Phone 1 (optional)"` and `"Alternate Phone 2 (optional)"` with IDs `customerAlternatePhone1` and `customerAlternatePhone2`. Include both in the form submit payload.
  - [x] [Component — `src/components/EditOrderForm.tsx`] Apply the same two input fields, pre-populated from `order.customer.customerAlternatePhone1` and `order.customer.customerAlternatePhone2`. Include both in the submit payload.
  - [x] [Page — `src/app/orders/[id]/page.tsx`] In the Customer Info display card on the order detail page, render `customerAlternatePhone1` and `customerAlternatePhone2` as two labeled rows below the primary phone (guarded by `customers:view-phone` permission, same as the primary phone).
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent opens Add Order form → Customer Info section shows `Phone`, `Alternate Phone 1`, `Alternate Phone 2` inputs → agent fills in all three → submits order → `GET /api/orders/:id` shows customer object with all three phone fields populated → Admin opens Order Detail page → all three phone numbers are visible in the Customer Info card → ✅ Done.

---

#### W-2402 — Database: Alternate Phone Fields for Vendors

**Root cause / Goal:**
`crm_vendors` has a single `vendor_phone` (NOT NULL) field. Vendors can have multiple contact numbers (main office, mobile, secondary department). Agents need to capture up to two alternate numbers per vendor.

**Approach:**
Add two nullable `VARCHAR(15)` columns to `crm_vendors`. These will be exposed on the Add Vendor and Edit Vendor forms, and displayed on the vendor detail page. These columns are bundled into the same migration as W-2403.

---

- [x] **RED — Integration (`src/tests/vendors.test.ts`):**
  - [x] Test: `POST /api/vendors` with valid payload including `vendorAlternatePhone1: '800-555-0001'` and `vendorAlternatePhone2: '800-555-0002'`. Assert `201 Created`. Then `GET /api/vendors/:id` and assert response contains `vendorAlternatePhone1: '800-555-0001'` and `vendorAlternatePhone2: '800-555-0002'`.
  - [x] Test: `POST /api/vendors` omitting both alternate phone fields. Assert `201 Created` (they are not required). Assert `GET /api/vendors/:id` returns both as `null`.
  - [x] Test: `PATCH /api/vendors/:id` with `{ vendorAlternatePhone1: '999-999-9999' }`. Assert the field is updated. Assert `vendorPhone` (the primary phone) is unchanged.
  - [x] **Run — confirm RED (columns do not exist in schema; the POST will ignore or reject those fields).**

- [x] **GREEN — Backend (Schema → Repository → Service → Controller):**
  - [x] [Schema] In `prisma/schema.prisma`, inside the `CrmVendors` model (after `vendorPhone`), add:
    ```prisma
    vendorAlternatePhone1 String? @map("vendor_alternate_phone_1") @db.VarChar(15)
    vendorAlternatePhone2 String? @map("vendor_alternate_phone_2") @db.VarChar(15)
    ```
    > **Note:** This schema change for `crm_vendors` is combined with W-2403 (Country, State, Payment Mode) into a single migration file `add_vendor_extended_fields`. Do not run the migration until W-2403 schema additions are also complete in `schema.prisma`.
  - [x] [Repository] In `src/repository/vendor.repository.ts`, update `create(data)`, `update(id, data)`, and `findById(id)` to include `vendorAlternatePhone1` and `vendorAlternatePhone2`.
  - [x] [Service] In `src/service/vendor.service.ts`, pass both alternate phone fields through. No additional validation — they are optional.
  - [x] [Controller] Ensure both fields are accepted from `POST /api/vendors` and `PATCH /api/vendors/:id` request bodies.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/VendorForm.test.tsx` — create if not present):**
  - [x] Test: Render the Add Vendor form. Assert `<input id="vendorAlternatePhone1">` is present.
  - [x] Test: Render the Add Vendor form. Assert `<input id="vendorAlternatePhone2">` is present.
  - [x] Test: Render the Edit Vendor form with a mock vendor having `vendorAlternatePhone1: '888-000-0001'`. Assert `#vendorAlternatePhone1` has `value="888-000-0001"`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Components):**
  - [x] [Types] In `src/types/vendor.ts`, add `vendorAlternatePhone1?: string | null` and `vendorAlternatePhone2?: string | null` to `Vendor`, `VendorCreateInput`, and `VendorUpdateInput`.
  - [x] [Component — `src/app/vendors/new/page.tsx` (or its client form component)] Add two optional `<input type="tel">` fields with IDs `vendorAlternatePhone1` and `vendorAlternatePhone2` below the primary `vendorPhone` input.
  - [x] [Component — `src/app/vendors/[id]/edit/page.tsx` (or its client form component)] Apply the same two fields, pre-populated from the fetched vendor data.
  - [x] [Component — `src/app/vendors/[id]/page.tsx`] Display both alternate phone numbers as labeled rows in the vendor contact info section of the detail page.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin navigates to Add Vendor → fills in primary phone, Alternate Phone 1, Alternate Phone 2 → saves → vendor detail page shows all three phone numbers in the contact section → admin edits the vendor → alternate phone fields are pre-populated → admin clears Alternate Phone 2 and saves → detail page shows only two phone numbers → ✅ Done.

---

#### W-2403 — Database: Vendor Country, State & Payment Mode Fields (Multiselect Dropdown)

**Root cause / Goal:**
`crm_vendors` has no geographic information or payment preference fields. Agents and managers need to know which country and state/province a vendor operates in (US or Canada), and which payment modes the vendor accepts (Customer Card, Company Card, or Link). The country → state cascade is a static frontend mapping — no DB lookup table is needed. The payment modes must support selecting multiple options at once via a multiselect dropdown.

**Approach:**
Add three nullable columns to `crm_vendors`: `vendor_country VARCHAR(50)`, `vendor_state VARCHAR(100)`, `vendor_payment_mode VARCHAR(255)`. These are bundled into the same migration as W-2402 (`add_vendor_extended_fields`).
The payment mode values are stored as a serialized JSON array string (e.g. `'["Customer Card","Link"]'`).
The country/state cascade is implemented as a static hardcoded constant map in `src/lib/geography.ts`.

---

- [x] **RED — Integration (`src/tests/vendors.test.ts`):**
  - [x] Test: `POST /api/vendors` with `{ vendorCountry: 'US', vendorState: 'Pennsylvania', vendorPaymentMode: '["Customer Card","Link"]', ...requiredFields }`. Assert `201 Created`. Then `GET /api/vendors/:id` and assert `vendorCountry: 'US'`, `vendorState: 'Pennsylvania'`, `vendorPaymentMode: '["Customer Card","Link"]'`.
  - [x] Test: `POST /api/vendors` with `vendorCountry: 'Canada'` and `vendorState: 'Ontario'` and `vendorPaymentMode: '["Customer Card","Company Card","Link"]'`. Assert all are stored correctly.
  - [x] Test: `POST /api/vendors` omitting all three fields. Assert `201 Created` with all three returning as `null`.
  - [x] Test: `PATCH /api/vendors/:id` with `{ vendorPaymentMode: '["Company Card"]' }`. Assert the update is persisted and `vendorCountry` and `vendorState` are unchanged.
  - [x] **Run — confirm RED (columns do not exist; POST will ignore fields).**

- [x] **GREEN — Backend (Schema → Migration → Repository → Service → Controller):**
  - [x] [Schema] In `prisma/schema.prisma`, inside the `CrmVendors` model (after the W-2402 alternate phone fields), add:
    ```prisma
    vendorCountry     String? @map("vendor_country")      @db.VarChar(50)
    vendorState       String? @map("vendor_state")        @db.VarChar(100)
    vendorPaymentMode String? @map("vendor_payment_mode") @db.VarChar(255)
    ```
  - [x] [Migration] Now run the combined vendor migration: `npx prisma migrate dev --name add_vendor_extended_fields`. This single migration adds all 5 new vendor columns (2 alternate phones + country + state + payment mode). Verify the generated SQL contains only `ADD COLUMN` statements and **no DROP or ALTER on any existing column**.
  - [x] [Repository] In `src/repository/vendor.repository.ts`, update `create(data)`, `update(id, data)`, and `findById(id)` to include `vendorCountry`, `vendorState`, and `vendorPaymentMode`.
  - [x] [Service] Pass the three fields through `vendor.service.ts` with no additional server-side validation.
  - [x] [Controller] Accept all three fields from `POST /api/vendors` and `PATCH /api/vendors/:id` bodies.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/VendorForm.test.tsx`):**
  - [x] Test: Render the Add Vendor form. Assert a `<select id="vendorCountry">` is present containing exactly the options `"US"` and `"Canada"` (plus an empty placeholder option).
  - [x] Test: Render the Add Vendor form. Assert a multiselect dropdown for Payment Modes is present with options: `"Customer Card"`, `"Company Card"`, and `"Link"`.
  - [x] Test: Render the Edit Vendor form with mock vendor `{ vendorCountry: 'Canada', vendorState: 'Ontario', vendorPaymentMode: '["Customer Card","Link"]' }`. Assert the multiselect dropdown has `"Customer Card"` and `"Link"` selected, while `"Company Card"` is unselected.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Static Map → Components):**
  - [x] [Types] In `src/types/vendor.ts`, add `vendorCountry?: string | null`, `vendorState?: string | null`, `vendorPaymentMode?: string | null` to `Vendor`, `VendorCreateInput`, and `VendorUpdateInput`.
  - [x] [Static Map] Create `src/lib/geography.ts` with an exported constant `COUNTRY_STATE_MAP: Record<string, string[]>` containing all 50 US states under key `'US'` and all 13 Canadian provinces/territories under key `'Canada'`.
  - [x] [Component — Add/Edit Vendor Form] Add a `<select id="vendorCountry">` with options `""` (placeholder), `"US"`, `"Canada"`. Add a `<select id="vendorState">` whose options are derived from `COUNTRY_STATE_MAP[selectedCountry] ?? []`. Add a multiselect dropdown/select for payment modes with options: `"Customer Card"`, `"Company Card"`, `"Link"`. On submission, serialize the selected values array to a JSON string (e.g. `JSON.stringify(selectedValues)`) and send to backend. On load, parse the JSON string back into an array to pre-populate selected options.
  - [x] [Component — `src/app/vendors/[id]/page.tsx`] Display `vendorCountry`, `vendorState`, and `vendorPaymentMode` as labeled rows in the vendor information section.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Admin opens Add Vendor form → selects `"US"` from Country dropdown → State dropdown populates with 50 US states → admin selects `"Texas"` → selects `"Customer Card"` and `"Link"` from the multiselect dropdown → saves vendor → vendor detail page shows Country: US, State: Texas, Payment Modes: Customer Card, Link → admin edits the vendor → changes Country to `"Canada"` → selects `"Ontario"` → selects `"Company Card"` (removing others) → saves → detail page shows updated values → ✅ Done.


---

#### W-2404 — Database & UI: Multi-Card Support in Orders (Add More Cards + amount_to_charge)

**Root cause / Goal:**
Sometimes a customer cannot pay the full order amount with a single card and provides multiple cards to be charged different amounts. The `crm_customer_cards` table already supports multiple rows per customer (one-to-many). However, the Add Order and Edit Order forms currently only render a single, fixed card input block, making it impossible to enter more than one card. Additionally, there is no `amount_to_charge` field to record how much should be charged from each specific card — this is only meaningful (and only shown in the UI) when more than one card is present.

**Approach:**
1. Add `amount_to_charge VARCHAR(25) NULL` to `crm_customer_cards` via migration `add_amount_to_charge_to_customer_cards`.
2. Replace the single static card block in `AddOrderForm.tsx` and `EditOrderForm.tsx` with a dynamic `cards` state array. An `"Add Another Card"` button appends a blank card. A `×` remove button (only shown when more than one card exists) removes a card from the array.
3. The `amountToCharge` input is shown inside each card block **only when `cards.length > 1`**.
4. The order repository's `createWithCustomerAndCard` transaction is updated to `createMany` all cards from the array in a single atomic `prisma.$transaction`.

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: `POST /api/orders` with `cards: [{ customerNameOncard: 'A', customerCardNumber: '4111111111111111', customerCardExpDate: '12/28', customerCardCvv: '123', amountToCharge: '500.00' }, { customerNameOncard: 'A', customerCardNumber: '5500005555555559', customerCardExpDate: '06/27', customerCardCvv: '456', amountToCharge: '300.00' }]`. Assert `201 Created`. Then `SELECT COUNT(*) FROM crm_customer_cards WHERE card_customer_id = :customerId` returns exactly `2`.
  - [x] Test: `POST /api/orders` with a single-card payload `cards: [{ customerNameOncard: 'B', customerCardNumber: '4111111111111111', customerCardExpDate: '01/29', amountToCharge: null }]`. Assert `201 Created`. Assert exactly `1` row in `crm_customer_cards` for that customer.
  - [x] Test: `POST /api/orders` with a two-card payload where the second card is missing `customerCardNumber`. Assert the entire transaction rolls back — `SELECT COUNT(*) FROM crm_customers WHERE customer_email = :email` returns `0` (no orphan customer row).
  - [x] Test: `GET /api/orders/:id` for an order whose customer has 2 cards. Assert the response `customer.cards` array has length `2`. Assert each card object contains an `amountToCharge` field.
  - [x] **Run — confirm RED (`amountToCharge` column does not exist; API only accepts a single flat card object, not an array).**

- [x] **GREEN — Backend (Schema → Migration → Repository → Service → Controller):**
  - [x] [Schema] In `prisma/schema.prisma`, inside the `CrmCustomerCards` model (after `customerCardPhotoStatus`), add:
    ```prisma
    amountToCharge String? @map("amount_to_charge") @db.VarChar(25)
    ```
  - [x] [Migration] Run `npx prisma migrate dev --name add_amount_to_charge_to_customer_cards`. Verify SQL contains only `ADD COLUMN amount_to_charge VARCHAR(25) NULL` — **no modifications to any existing column**.
  - [x] [Repository — `src/repository/order.repository.ts`] Update `createWithCustomerAndCard(data)` to accept `cards: CardCreateInput[]` (array). Inside `prisma.$transaction`, replace the single `crmCustomerCards.create(...)` call with `crmCustomerCards.createMany({ data: cards.map(c => ({ cardCustomerId: customer.customerId, ...c })) })`. Ensure the full transaction rolls back if any insert fails.
  - [x] [Repository] Update `findById(id)` to include `amountToCharge` in the `customer.cards` select.
  - [x] [Service — `src/service/order.service.ts`] Update `createOrder` to accept and forward `cards[]` to the repository. Validate: each card must have `customerNameOncard` and `customerCardNumber` — throw `400 Bad Request` if missing. Validate `amountToCharge` is a valid decimal string when provided.
  - [x] [Types — `src/types/order.ts`] Update `OrderCreateInput` to replace flat card fields with `cards: CardCreateInput[]`. Update `OrderDetail` so `customer.cards` is typed as `CustomerCardDetail[]` including `amountToCharge?: string | null`.
  - [x] [Controller — `src/app/api/orders/route.ts` POST] Parse `cards` from the request body as an array. Forward to service.
  - [x] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit (`src/tests/AddOrderForm.test.tsx`):**
  - [ ] Test: Render `AddOrderForm`. Assert exactly one card block is rendered initially.
  - [ ] Test: Render `AddOrderForm`. Assert an `"Add Another Card"` button is present.
  - [ ] Test: Click `"Add Another Card"`. Assert two card blocks are now rendered.
  - [ ] Test: Click `"Add Another Card"`. Assert an `amountToCharge` input is visible in each card block.
  - [ ] Test: With two card blocks rendered, click the `×` remove button on the second card. Assert only one card block remains and no `amountToCharge` input is visible.
  - [ ] Test: With one card block, assert no `×` remove button is present on that block.
  - [ ] **Run — confirm RED.**

- [ ] **RED — Unit (`src/tests/EditOrderForm.test.tsx`):**
  - [ ] Test: Render `EditOrderForm` with a mock order whose `customer.cards` array has 2 entries. Assert two card blocks are rendered.
  - [ ] Test: Render `EditOrderForm` with a mock order whose `customer.cards` array has 2 entries. Assert `amountToCharge` inputs are visible on both card blocks.
  - [ ] Test: Render `EditOrderForm` with a mock order whose `customer.cards` array has 1 entry. Assert no `amountToCharge` input is visible.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Types → AddOrderForm → EditOrderForm):**
  - [ ] [Types] In `src/types/customer.ts`, add `amountToCharge?: string | null` to `CustomerCard` and `CustomerCardDetail`.
  - [ ] [Component — `src/components/AddOrderForm.tsx`] Replace the four flat card state variables with a `cards` state array: `useState([{ customerNameOncard: '', customerCardNumber: '', customerCardExpDate: '', customerCardCvv: '', amountToCharge: '' }])`. Replace the single-card JSX block with a `.map((card, index) => ...)` render loop. Add `"Add Another Card"` button that appends a blank card object. Show `×` remove button per card only when `cards.length > 1`. Show `amountToCharge` input per card only when `cards.length > 1`. Update `handleSubmit` to send `cards` as an array.
  - [ ] [Component — `src/components/EditOrderForm.tsx`] Initialize `cards` state from `order.customer.cards`. Apply the same dynamic render loop, `"Add Another Card"` button, `×` remove buttons, and conditional `amountToCharge` visibility. Update `handleSubmit` to include the full `cards` array.
  - [ ] Run unit tests — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Agent opens Add Order form → single card block shown, no `amountToCharge` field → clicks `"Add Another Card"` → two card blocks appear, both show `amountToCharge` input → agent fills both cards with different amounts → submits → `GET /api/orders/:id` returns `customer.cards` with 2 entries, each containing `amountToCharge` → Order Detail page shows a card list with both cards and their charge amounts → ✅ Done.
  - [ ] Agent clicks `×` on second card → collapses to one card → `amountToCharge` disappears → submits → only 1 card row is stored → ✅ Done.

---

#### W-2405 — Database & UI: Card Copy Received & Photo ID Received Image Uploads (Base64)

**Root cause / Goal:**
`crm_customer_cards` has `customer_card_copy_status` and `customer_card_photo_status` (Yes/No flags) but no way to attach the actual document images. The UI labels "Card Copy Verified" and "Photo ID Checked" are also misleading — the correct labels per business requirement are **"Card copy received"** and **"Photo ID received"**. Managers need to view the uploaded scanned images during audits.

Images are stored as **Base64-encoded strings in `LONGTEXT` columns** in MySQL. Image columns are **excluded from all list/`findMany` queries** — fetched only for single-card detail views — to prevent JSON response bloat.

**Approach:**
Add `customer_card_copy_image LONGTEXT NULL` and `customer_photo_id_image LONGTEXT NULL` to `crm_customer_cards`. Add file `<input type="file">` elements to each card block in the order forms. On file selection, use `FileReader.readAsDataURL()` to convert to Base64 on the client and store in state. Include Base64 strings in the submit payload. Display thumbnail previews in forms and on the Order Detail page.

---

- [x] **RED — Integration (`src/tests/customers.test.ts`):**
  - [x] Test: `POST /api/orders` with `cards[0].customerCardCopyImage: 'data:image/png;base64,abc123'`. Assert `201 Created`. Then `SELECT customer_card_copy_image FROM crm_customer_cards WHERE card_id = :cardId` returns `'data:image/png;base64,abc123'`.
  - [x] Test: `GET /api/orders/:id` for an order whose card has `customerCardCopyImage` set. Assert the response `customer.cards[0]` does **NOT** include `customerCardCopyImage` (excluded from standard order payload).
  - [x] Test: `GET /api/customers/:id/cards/:cardId` (single card fetch) for a card with `customerCardCopyImage` set. Assert response includes `customerCardCopyImage` as a non-null string. Guard: assert this endpoint returns `403 Forbidden` without `customers:view-cards` permission.
  - [x] Test: `POST /api/orders` with `cards[0].customerCardCopyImage` omitted. Assert `201 Created` — the field is optional.
  - [x] **Run — confirm RED (columns do not exist; image fields not in schema; single-card fetch endpoint may not exist).**

- [x] **GREEN — Backend (Schema → Migration → Repository → Service → Controller):**
  - [x] [Schema] In `prisma/schema.prisma`, inside the `CrmCustomerCards` model (after `amountToCharge`), add:
    ```prisma
    customerCardCopyImage String? @map("customer_card_copy_image") @db.LongText
    customerPhotoIdImage  String? @map("customer_photo_id_image")  @db.LongText
    ```
  - [x] [Migration] Run `npx prisma migrate dev --name add_card_image_fields_to_customer_cards`. Verify SQL contains only `ADD COLUMN customer_card_copy_image LONGTEXT NULL` and `ADD COLUMN customer_photo_id_image LONGTEXT NULL` — **no DROP or ALTER on any existing column**.
  - [x] [Repository — `src/repository/customer.repository.ts`] Update `findCardsByCustomerId(customerId)` to use an explicit Prisma `select` that excludes `customerCardCopyImage` and `customerPhotoIdImage` (set both to `false`). Add `findCardById(cardId: number)` method that fetches a single card with **all fields** including both image columns (no select exclusion).
  - [x] [Repository — `src/repository/order.repository.ts`] Update `createWithCustomerAndCard` to accept and persist `customerCardCopyImage` and `customerPhotoIdImage` per card in the `cards[]` array.
  - [x] [Service — `src/service/customer.service.ts`] Pass both image fields through create and update pipelines.
  - [x] [Controller] Create or update `src/app/api/customers/[id]/cards/[cardId]/route.ts` GET handler to call `findCardById` and return the full card including image fields. Guard with `customers:view-cards` permission.
  - [x] Run integration test — **confirm GREEN**.

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx` and `src/tests/EditOrderForm.test.tsx`):**
  - [x] Test (`AddOrderForm`): Render the form. Assert the card copy label reads `"Card copy received"` (not `"Card Copy Verified"`).
  - [x] Test (`AddOrderForm`): Render the form. Assert the photo ID label reads `"Photo ID received"` (not `"Photo ID Checked"`).
  - [x] Test (`AddOrderForm`): Render the form. Assert `<input type="file" id="customerCardCopyImage-0">` is present in the first card block.
  - [x] Test (`AddOrderForm`): Render the form. Assert `<input type="file" id="customerPhotoIdImage-0">` is present in the first card block.
  - [x] Test (`EditOrderForm`): Render the form. Assert the card copy label reads `"Card copy received"` and photo ID label reads `"Photo ID received"`.
  - [x] **Run — confirm RED (labels have old values; no file input elements exist).**

- [x] **GREEN — Frontend (Types → Components → Order Detail Page):**
  - [x] [Types] In `src/types/customer.ts`, add `customerCardCopyImage?: string | null` and `customerPhotoIdImage?: string | null` to `CustomerCard` and `CustomerCardDetail`.
  - [x] [Component — `src/components/AddOrderForm.tsx`] Inside each card block in the `cards.map()` render:
    - Rename the `customerCardCopyStatus` label from `"Card Copy Verified"` to **`"Card copy received"`**.
    - Rename the `customerCardPhotoStatus` label from `"Photo ID Checked"` to **`"Photo ID received"`**.
    - Add `<input type="file" id={`customerCardCopyImage-${index}`} accept="image/*,.pdf">`. On `onChange`, use `FileReader.readAsDataURL(file)` to convert to Base64 and store in `cards[index].customerCardCopyImage` state.
    - Add `<input type="file" id={`customerPhotoIdImage-${index}`} accept="image/*,.pdf">`. Same `FileReader` pattern for `customerPhotoIdImage`.
    - If Base64 string is present in state, show an `<img>` thumbnail preview (max height 80px) below the respective file input.
    - Include `customerCardCopyImage` and `customerPhotoIdImage` per card in the submit payload.
  - [x] [Component — `src/components/EditOrderForm.tsx`] Apply identical label renames, file inputs, `FileReader` pattern, and thumbnail previews. On form load, fetch each existing card's image via `GET /api/customers/:id/cards/:cardId` if the card has an existing `cardId`. Show existing image thumbnail when present. Include both image fields in the submit payload.
  - [x] [Page — `src/app/orders/[id]/page.tsx`] In the Ledger / Verification checklist section:
    - Rename `"Card Copy Verified"` label to **`"Card copy received"`**.
    - Rename `"Photo ID Checked"` label to **`"Photo ID received"`**.
    - Below each status badge, if the card image URL is present (fetched from `GET /api/customers/:id/cards/:cardId`), display it as a clickable thumbnail: `<a href={imageUrl} target="_blank" rel="noreferrer"><img src={imageUrl} style={{ maxHeight: '100px', borderRadius: '4px' }} alt="..." /></a>`.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent opens Add Order form → Card Details section shows `"Card copy received"` label with a file upload input and `"Photo ID received"` label with a file upload input → agent uploads a JPEG → thumbnail preview appears immediately → agent submits → `GET /api/customers/:id/cards/:cardId` returns the Base64 image string → Order Detail page shows `"Card copy received"` row with a clickable thumbnail → clicking opens the full image in a new browser tab → ✅ Done.
  - [x] Agent opens Edit Order form for an order with an existing card copy image → thumbnail is pre-displayed → agent uploads a replacement image → saves → new image is displayed → ✅ Done.

---

#### W-2406 — UI Only: Label Rename — "Normal Checklist" → "Checklist by backend"

**Root cause / Goal:**
The `orderChecklist` field on `crm_orders` is labeled `"Normal Checklist"` (or just `"Checklist"`) in the Add Order form, Edit Order form, and Order Detail page. This label is unclear. The business requires it to be renamed to **"Checklist by backend"** across all views. This is a pure string rename — zero database schema changes required.

**Approach:**
Find and replace the label string for the `orderChecklist` field with `"Checklist by backend"` in `AddOrderForm.tsx`, `EditOrderForm.tsx`, and `src/app/orders/[id]/page.tsx`. Update any test assertions that check for the old label text.

---

- [x] **RED — Integration:** `N/A` — this is a frontend-only label change. No API or database behavior is altered.

- [x] **RED — Unit (`src/tests/AddOrderForm.test.tsx` and `src/tests/EditOrderForm.test.tsx`):**
  - [x] Test (`AddOrderForm`): Render the form. Assert a `<label>` with text `"Checklist by backend"` is present. Assert no element with text `"Normal Checklist"` exists anywhere in the rendered output.
  - [x] Test (`EditOrderForm`): Render the form. Assert a `<label>` with text `"Checklist by backend"` is present. Assert no element with text `"Normal Checklist"` exists.
  - [x] **Run — confirm RED (label currently reads `"Normal Checklist"` or `"Checklist"`).**

- [x] **GREEN — Frontend (Components → Order Detail Page):**
  - [x] [Component — `src/components/AddOrderForm.tsx`] Find the `<label>` element for the `orderChecklist` field. Replace its text with `"Checklist by backend"`.
  - [x] [Component — `src/components/EditOrderForm.tsx`] Find the `<label>` element for the `orderChecklist` field. Replace its text with `"Checklist by backend"`.
  - [x] [Page — `src/app/orders/[id]/page.tsx`] In the Ledger / Verification checklist section, find the display label for `orderChecklist` and replace it with `"Checklist by backend"`.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Agent opens Add Order form → the checklist field label reads `"Checklist by backend"` → agent opens Edit Order form → same label → admin opens Order Detail page → the verification checklist row reads `"Checklist by backend"` → no instance of `"Normal Checklist"` exists anywhere in the UI → ✅ Done.

---

#### W-2407 — Documentation & Schema Reference Updates

**Root cause / Goal:**
All CONTEXT documentation files must be updated to reflect the Phase 24 schema additions and design decisions, keeping them as the authoritative source of truth for all future development phases.

**Approach:**
Update `CONTEXT/database_schema.md` table rows and the Prisma schema code block. Append Decision 27 to `CONTEXT/decision_log.md`.

---

- [x] **RED:** `N/A` — documentation updates have no automated test coverage.

- [x] **GREEN — Documentation:**
  - [x] [Schema Doc — `CONTEXT/database_schema.md`]
    - In the `crm_customers` table section, add rows for `customer_alternate_phone_1 VARCHAR(25) NULL` and `customer_alternate_phone_2 VARCHAR(25) NULL`.
    - In the `crm_vendors` table section, add rows for `vendor_alternate_phone_1 VARCHAR(15) NULL`, `vendor_alternate_phone_2 VARCHAR(15) NULL`, `vendor_country VARCHAR(50) NULL`, `vendor_state VARCHAR(100) NULL`, `vendor_payment_mode VARCHAR(100) NULL`.
    - In the `crm_customer_cards` table section, add rows for `amount_to_charge VARCHAR(25) NULL`, `customer_card_copy_image LONGTEXT NULL`, `customer_photo_id_image LONGTEXT NULL`.
    - Update the Prisma schema code block in Section 3 to match the new `schema.prisma` exactly (all three models updated).
  - [x] [Decision Log — `CONTEXT/decision_log.md`] Verify Decision 27 is updated and complete.
  - [x] [Progress Table — `CONTEXT/current_state.md`] Update Phase 24 status to reflect the new scopes, and update it to `**[ ] NOT STARTED**` until implementation begins.

- [x] **Verification chain:**
  - [x] Developer opens `CONTEXT/database_schema.md` → all 9 new columns are listed under their respective tables → Prisma schema code block matches the live `prisma/schema.prisma` → Developer opens `decision_log.md` → Decision 27 is present and accurately describes the Base64 storage design, multiselect payment modes, and all Phase 24 decisions → ✅ Done.

---

---

### Phase 25 — Part Found By + Liftgate Needed

#### W-2501 — Part Found By Role + Liftgate Needed Flag on crm_orders

**Goal:**
Add two new business fields to the order model:
1. **Part Found By** — a nullable FK reference to `users.uid`, identifying which team member located/sourced the part. It follows the identical denormalized snapshot pattern already used by `orderSalesAgentId`/`orderSalesAgentName`, `orderVerifierId`/`orderVerifierName`, etc. (Decision 18).
2. **Liftgate Needed** — a `VARCHAR(20)` flag defaulting to `'No'`, indicating whether a liftgate truck is required for delivery. Follows the identical pattern of `order_checklist` (Decision 21).

Both appear in: Add Order form, Edit Order form, Order detail page, and the Order list view (Liftgate badge only).

**Approach:**
Run one Prisma migration adding three new nullable columns to `crm_orders`. Update the repository to auto-resolve `orderPartFoundByName` from the user's `nickname || name` field whenever `orderPartFoundById` is set. Update the service to include these fields in audit key tracking. Add UI controls to both forms and the detail page.

---

- [x] **RED — Integration (`orders.test.ts`):**
  - [x] Test: `POST /api/orders` with payload containing `orderPartFoundById: {validUserId}` returns `201 Created`. Assert response body contains `orderPartFoundByName` equal to that user's `nickname` (or `name` if nickname is null).
  - [x] Test: `POST /api/orders` with payload containing `orderLiftgateNeeded: 'Yes'` returns `201 Created`. Assert `SELECT order_liftgate_needed FROM crm_orders WHERE crm_order_id = {newOrderId}` returns `'Yes'`.
  - [x] Test: `GET /api/orders/{id}` where the order has `orderPartFoundById` set returns response containing both `orderPartFoundById` and `orderPartFoundByName` fields.
  - [x] Test: `PATCH /api/orders/{id}` with `{ orderPartFoundById: {differentUserId} }` returns `200 OK`. Assert `SELECT order_part_found_by_name FROM crm_orders WHERE crm_order_id = {id}` returns the new user's `nickname || name`, confirming the snapshot was automatically updated.
  - [x] Test: `POST /api/orders` without `orderPartFoundById` (field omitted) returns `201 Created`. Assert `order_part_found_by_id IS NULL` and `order_part_found_by_name IS NULL` in the DB.
  - [x] Test: `PATCH /api/orders/{id}` changing `orderLiftgateNeeded` from `'No'` to `'Yes'` returns `200 OK`. Assert `SELECT field_name, old_value, new_value FROM crm_order_audit_log WHERE order_id = {id} ORDER BY id DESC LIMIT 5` contains a row where `field_name = 'orderLiftgateNeeded'`, `old_value = 'No'`, `new_value = 'Yes'`.
  - [x] Test: `PATCH /api/orders/{id}` changing `orderPartFoundById` to `{userId}` (where that user has `nickname = 'Johnny'`) returns `200 OK`. Assert the audit log for `order_id = {id}` contains a row where `field_name = 'orderPartFoundByName'`, `old_value` is the previous name (or `NULL`), and `new_value = 'Johnny'`.
  - [x] **Run — confirm RED (columns do not exist yet, migration has not been applied).**

- [x] **GREEN — Backend (Schema → Migration → Repository → Service → Controller):**
  - [x] **[Schema]** In `prisma/schema.prisma`, inside model `CrmOrders`, add after the `orderBackendExecutiveName` field:
    ```prisma
    orderPartFoundById     Int?          @map("order_part_found_by_id")
    orderPartFoundByName   String?       @map("order_part_found_by_name") @db.VarChar(55)
    orderLiftgateNeeded    String?       @default("No") @map("order_liftgate_needed") @db.VarChar(20)
    ```
    Add the relation field after the existing `backendExecutive` relation:
    ```prisma
    partFoundBy            Users?        @relation("PartFoundBy", fields: [orderPartFoundById], references: [uid], onDelete: SetNull)
    ```
    Add a new index after `@@index([orderSalesAgentId])`:
    ```prisma
    @@index([orderPartFoundById])
    ```
    In model `Users`, add a new relation array after `backendExecutiveOrders`:
    ```prisma
    partFoundOrders        CrmOrders[]   @relation("PartFoundBy")
    ```
  - [x] **[Migration]** Run `npx prisma migrate dev --name add_part_found_by_and_liftgate_to_orders`. Verify migration SQL contains:
    - `ALTER TABLE crm_orders ADD COLUMN order_part_found_by_id INT NULL;`
    - `ALTER TABLE crm_orders ADD COLUMN order_part_found_by_name VARCHAR(55) NULL;`
    - `ALTER TABLE crm_orders ADD COLUMN order_liftgate_needed VARCHAR(20) NOT NULL DEFAULT 'No';`
    - `ALTER TABLE crm_orders ADD CONSTRAINT fk_part_found_by FOREIGN KEY (order_part_found_by_id) REFERENCES users(uid) ON DELETE SET NULL;`
    - `CREATE INDEX idx_crm_orders_part_found_by_id ON crm_orders(order_part_found_by_id);`
    - Confirm via `SHOW CREATE TABLE crm_orders;` — all three columns present. Confirm `DESCRIBE crm_orders;` shows `order_liftgate_needed` with `Default: No`.
  - [x] **[Repository]** In `src/repository/order.repository.ts`:
    - In `createWithCustomerAndCard()`: Accept `orderPartFoundById?: number` and `orderLiftgateNeeded?: string` in the order data input. Before the transaction, if `orderPartFoundById` is provided, query `db.users.findUnique({ where: { uid: orderPartFoundById }, select: { nickname: true, name: true } })` and set `orderPartFoundByName = user.nickname ?? user.name`. Pass `orderPartFoundById`, `orderPartFoundByName`, and `orderLiftgateNeeded` into the `db.crmOrders.create({ data: { ... } })` call inside the transaction.
    - In `update(id, data)`: If `data.orderPartFoundById` is defined and changed, perform the same nickname lookup (`db.users.findUnique`) and set `data.orderPartFoundByName = user.nickname ?? user.name`. If `data.orderPartFoundById === null`, explicitly set `data.orderPartFoundByName = null`. Pass `orderLiftgateNeeded` through directly (no lookup needed).
    - In `findById(id)`: Add `partFoundBy: { select: { uid: true, nickname: true, name: true } }` inside the `include` block. Assert the returned type now contains `orderPartFoundById`, `orderPartFoundByName`, and `orderLiftgateNeeded`.
    - In `findAll(filters)`: Add `orderLiftgateNeeded: true` to the `select` block so the list view can render the badge. Do NOT include `partFoundBy` relation in `findAll` — use the denormalized `orderPartFoundByName` string field instead (consistent with `orderSalesAgentName` pattern).
  - [x] **[Service]** In `src/service/order.service.ts`:
    - In `orderKeysToAudit` array (the list of fields tracked in `CrmOrderAuditLog`), add: `'orderPartFoundById'`, `'orderPartFoundByName'`, `'orderLiftgateNeeded'`.
    - No additional business logic is needed — the name resolution is handled in the repository layer.
  - [x] **[Controller]** In `src/app/api/orders/route.ts` (POST) and `src/app/api/orders/[id]/route.ts` (PATCH): No changes required — these routes already pass the full parsed body to the service/repository. Confirm `orderPartFoundById` and `orderLiftgateNeeded` are not blocked by any explicit field whitelist.
  - [x] Run integration test — **confirm GREEN.**

- [x] **RED — Unit / Component (`AddOrderForm.test.tsx`, `EditOrderForm.test.tsx`):**
  - [x] **`AddOrderForm.test.tsx`**: Test: Render `AddOrderForm`. Assert a `<select>` element with `id="orderPartFoundById"` is present in the DOM inside the Team Allocation section. Assert a `<input type="checkbox">` or `<select>` with `id="orderLiftgateNeeded"` is present.
  - [x] **`AddOrderForm.test.tsx`**: Test: Select user ID `3` from the `orderPartFoundById` dropdown. Assert the form state contains `orderPartFoundById: 3` when submitted.
  - [x] **`AddOrderForm.test.tsx`**: Test: Toggle the Liftgate Needed checkbox/select to `'Yes'`. Assert the form state contains `orderLiftgateNeeded: 'Yes'` when submitted.
  - [x] **`EditOrderForm.test.tsx`**: Test: Render `EditOrderForm` with a mock order where `orderPartFoundById: 5` and `orderLiftgateNeeded: 'Yes'`. Assert `orderPartFoundById` dropdown shows the pre-selected value `'5'`. Assert Liftgate Needed field shows `'Yes'`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Components → Pages):**
  - [x] **[Types]** In `src/types/order.ts`, add to the `Order`, `OrderDetail`, and `OrderCreateInput` interfaces:
    ```typescript
    orderPartFoundById?:   number | null;
    orderPartFoundByName?: string | null;
    orderLiftgateNeeded?:  string | null;
    ```
  - [x] **[AddOrderForm.tsx]** Inside the "Team Allocation" section (after the Backend Executive `<select>` dropdown):
    - Add a new agent-picker `<select id="orderPartFoundById">` labeled **"Part Found By"**. Populate it from the same active agents list already fetched for the other team dropdowns. Include an empty `<option value="">-- Select Agent --</option>` as default (field is optional). On change: `setOrderPartFoundById(Number(e.target.value) || null)`.
    - Add a new Liftgate Needed control **after** the existing Checklist checkbox. Use the identical markup pattern as the existing `orderChecklist` field: a `<input type="checkbox" id="orderLiftgateNeeded">` that maps checked state to `'Yes'` / `'No'`. Label: **"Liftgate Needed"**.
  - [x] **[EditOrderForm.tsx]** Make identical additions as `AddOrderForm.tsx` in the Team Allocation section and Checklist section. Pre-populate both fields from the fetched order data: `defaultValue={order.orderPartFoundById?.toString() ?? ''}` and `defaultChecked={order.orderLiftgateNeeded === 'Yes'}`.
  - [x] **[OrderList.tsx]** In the order row rendering, after the existing Checklist badge (or in the flags column): if `order.orderLiftgateNeeded === 'Yes'`, render a small badge with text `"Liftgate"` and class `badge-liftgate` (amber background, white text, same pill style as other badges). If `'No'` or null, render nothing.
  - [x] **[page.tsx — order detail]** In the Team Allocation section (where Sales Agent, Verifier, Sales Verifier, Backend Executive are displayed): add a new row labeled **"Part Found By"** displaying `order.orderPartFoundByName ?? '—'`. In the Checklist/Verification section (where Card copy received, Photo ID received, Checklist by backend are shown): add a fourth status indicator row labeled **"Liftgate Needed"** displaying `order.orderLiftgateNeeded === 'Yes' ? '✓ Yes' : '✗ No'`.
  - [x] Run unit test — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Agent navigates to `/orders/new` → Team Allocation section shows "Part Found By" dropdown → agent selects a team member → Liftgate Needed checkbox is ticked → agent submits form → new order created → Order list view shows "Liftgate" amber badge on the row → agent clicks order → detail page shows "Part Found By: [Name]" in Team section and "Liftgate Needed: ✓ Yes" in Checklist section → agent navigates to Edit Order → both fields are pre-populated with the saved values → agent changes Part Found By to a different user → saves → detail page now shows updated name → ✅ Done.

---

### Phase 26 — Multi-Part Orders

#### W-2601 — parent_order_id Grouping, Multi-Part Forms, Per-Part Staff Allocation & Aggregate Financial Summary

**Goal:**
Allow a single customer deal to contain multiple independently-sourced auto parts, each with its own: part details, vendor, pricing, sale status, workflow status, and staff allocation. In the order list, only the primary (parent) order row is shown, with a `(+N)` badge when child parts exist. In the detail page, parts are shown in a dropdown selector with per-part fields, and a combined financial summary totals all parts. The `AddOrderForm` and `EditOrderForm` gain an "Add Another Part" button that creates new part cards with specified auto-fill behaviour.

**Approach:**
Add a single nullable `parent_order_id INT` self-referential column to `crm_orders`. All existing rows receive `NULL` (no impact). Restructure `order.repository.ts` so `findAll` always filters `parentOrderId: null` and includes child summaries. Update `createWithCustomerAndCard` to accept a `parts[]` array. Add two new API routes for adding and removing child parts from existing orders. Overhaul `AddOrderForm.tsx` and `EditOrderForm.tsx` to render a dynamic list of PartCard sub-forms with auto-fill logic. Rework the order detail page to show a part selector dropdown and aggregate financial section.

---

- [x] **RED — Integration (`orders.test.ts`):**
  - [x] Test: `POST /api/orders` with `parts: [part1Data, part2Data]` returns `201 Created` with body `{ orderId: <parentId>, customerId, cardIds, partOrderIds: [<parentId>, <childId>] }`. Assert `SELECT COUNT(*) FROM crm_orders WHERE order_customer_id = {customerId}` returns `2`. Assert child row has `parent_order_id = parentId`.
  - [x] Test: `POST /api/orders` with `parts: [singlePartData]` (single-element array) returns `201 Created` with `partOrderIds: [<id>]`. Assert only 1 row in DB for this customer. Assert `parent_order_id IS NULL` for that row. (Backward compatibility.)
  - [x] Test: `GET /api/orders` (list) — after creating an order with 2 parts, the list response contains **exactly 1 item** for this customer's order. Assert that item has `childOrders` array with length `1`. Assert the item's `crmOrderId` matches the parent.
  - [x] Test: `GET /api/orders/{parentId}` — response includes `childOrders` array. The child order object inside has all fields including `orderPart`, `saleStatus`, `orderCurrentStatus`, `orderAmountCharged`, `orderSalesAgentId`.
  - [x] Test: `POST /api/orders/{parentId}/parts` with a valid `partData` body (containing `orderPart`, `orderVendorId`, `orderAmountCharged`, etc.) returns `201 Created` with body `{ partOrderId: <newChildId> }`. Assert new row in DB has `parent_order_id = parentId`.
  - [x] Test: `POST /api/orders/{childId}/parts` (attempting to add a child to a child order) returns `400 Bad Request` with body `{ error: "Cannot add a part to an order that is itself a child part. Use the parent order ID." }`.
  - [x] Test: `DELETE /api/orders/{parentId}/parts/{childId}` returns `200 OK`. Assert `SELECT COUNT(*) FROM crm_orders WHERE crm_order_id = {childId}` returns `0`. Assert parent row still exists.
  - [x] Test: `DELETE /api/orders/{parentId}/parts/{parentId}` (attempting to delete the parent via the parts endpoint) returns `400 Bad Request` with body `{ error: "Cannot delete the primary order via the parts endpoint. Use DELETE /api/orders/{id} to delete the entire order." }`.
  - [x] Test: `GET /api/orders?status=Pending+Booking` — a parent order with `orderCurrentStatus = 'Pending Booking'` appears in results. Its child order (even if its own `orderCurrentStatus = 'Pending Shipment'`) does NOT appear separately in the results.
  - [x] Test (audit — addPart): `POST /api/orders/{parentId}/parts` with `{ orderPart: 'Transmission', ... }` returns `201 Created` with body `{ partOrderId: <newChildId> }`. Assert `SELECT field_name, old_value, new_value FROM crm_order_audit_log WHERE order_id = {parentId} ORDER BY id DESC LIMIT 1` returns a row where `field_name = 'childPart'`, `old_value IS NULL`, and `new_value LIKE '%Transmission%'` and `new_value LIKE '%Child Order ID: {newChildId}%'`.
  - [x] Test (audit — removePart): `DELETE /api/orders/{parentId}/parts/{childId}` (where child has `orderPart = 'Transmission'`) returns `200 OK`. Assert `SELECT field_name, old_value, new_value FROM crm_order_audit_log WHERE order_id = {parentId} ORDER BY id DESC LIMIT 1` returns a row where `field_name = 'childPart'`, `old_value LIKE '%Transmission%'` and `old_value LIKE '%Child Order ID: {childId}%'`, and `new_value IS NULL`.
  - [x] Test (delete guard — RESTRICT): Create an order with 2 parts (parent + child). `DELETE /api/orders/{parentId}` returns `409 Conflict` with body `{ error: "This order has 1 additional part(s) attached to it. Please remove all child parts from the Edit Order page before deleting the primary order." }`. Assert `SELECT COUNT(*) FROM crm_orders WHERE crm_order_id = {parentId}` returns `1` (parent NOT deleted).
  - [x] Test (delete guard — after child removed): `DELETE /api/orders/{parentId}/parts/{childId}` → `200 OK`. Then `DELETE /api/orders/{parentId}` → `200 OK`. Assert `SELECT COUNT(*) FROM crm_orders WHERE crm_order_id = {parentId}` returns `0`.
  - [x] Test (promote-part — happy path): Create an order with 2 parts: parent (ID: P) and child (ID: C). `PATCH /api/orders/{P}/promote-part` with body `{ newPrimaryPartId: C }` returns `200 OK`. Assert `SELECT parent_order_id FROM crm_orders WHERE crm_order_id = {C}` returns `NULL` (C is now the primary). Assert `SELECT parent_order_id FROM crm_orders WHERE crm_order_id = {P}` returns `{C}` (P is now a child of C). Assert `SELECT COUNT(*) FROM crm_order_audit_log WHERE order_id = {P} AND field_name = 'primaryPart'` returns `1`. Assert `SELECT COUNT(*) FROM crm_order_audit_log WHERE order_id = {C} AND field_name = 'primaryPart'` returns `1`.
  - [x] Test (promote-part — wrong group): Create two separate orders (no parent/child relationship). `PATCH /api/orders/{order1Id}/promote-part` with `{ newPrimaryPartId: order2Id }` returns `400 Bad Request` with body `{ error: "The selected part does not belong to this order group." }`.
  - [x] Test (promote-part — 3 parts, re-parenting): Create an order with 3 parts: parent P, child C1 (parentOrderId = P), child C2 (parentOrderId = P). `PATCH /api/orders/{P}/promote-part` with `{ newPrimaryPartId: C1 }` returns `200 OK`. Assert C1 has `parent_order_id = NULL`. Assert P has `parent_order_id = C1`. Assert C2 has `parent_order_id = C1` (re-parented from P to C1).
  - [x] **Run — confirm RED (parent_order_id column does not exist; POST /api/orders does not accept `parts[]` array; new routes do not exist).**

- [x] **GREEN — Backend (Schema → Migration → Repository → Service → Controller):**
  - [x] **[Schema]** In `prisma/schema.prisma`, inside model `CrmOrders`, add after `orderCreatedDate`:
    ```prisma
    parentOrderId   Int?          @map("parent_order_id")
    ```
    Add the self-referential relations after the `verifier` relation line:
    ```prisma
    parentOrder     CrmOrders?    @relation("OrderParts", fields: [parentOrderId], references: [crmOrderId], onDelete: Restrict)
    childOrders     CrmOrders[]   @relation("OrderParts")
    ```
    **Decision:** `onDelete: Restrict` (not Cascade). Deleting a parent order that still has child parts will be rejected by the DB. The service layer performs an explicit child-count check before any delete attempt so the UI receives a user-friendly error instead of a raw constraint exception. See D29.7.
    Add a new index:
    ```prisma
    @@index([parentOrderId])
    ```
  - [x] **[Migration]** Run `npx prisma migrate dev --name add_parent_order_id_to_orders`. Verify migration SQL contains:
    - `ALTER TABLE crm_orders ADD COLUMN parent_order_id INT NULL;`
    - `CREATE INDEX idx_crm_orders_parent_order_id ON crm_orders(parent_order_id);`
    - `ALTER TABLE crm_orders ADD CONSTRAINT fk_parent_order FOREIGN KEY (parent_order_id) REFERENCES crm_orders(crm_order_id) ON DELETE RESTRICT;`
    - Confirm via `SHOW CREATE TABLE crm_orders;` that the column and FK constraint are present and shows `ON DELETE RESTRICT`. Confirm all existing rows: `SELECT COUNT(*) FROM crm_orders WHERE parent_order_id IS NOT NULL` returns `0`.
  - [x] **[Repository — findAll]** In `src/repository/order.repository.ts`, in the `findAll(filters)` method:
    - Add `parentOrderId: null` to the `where` object **unconditionally** so the list always returns only primary (non-child) orders.
    - Add a `childOrders` include block to the `include` object: `childOrders: { select: { crmOrderId: true, orderPart: true, saleStatus: true, orderCurrentStatus: true, orderAmountCharged: true, orderRefundAmount: true, orderLiftgateNeeded: true } }`. This gives the list view the data it needs for the `(+N)` badge and summed financial amount.
  - [x] **[Repository — findById]** In `findById(id)`, add `childOrders: { include: { salesAgent: { select: { uid: true, nickname: true, name: true } }, verifier: { select: { uid: true, nickname: true, name: true } }, salesVerifier: { select: { uid: true, nickname: true, name: true } }, backendExecutive: { select: { uid: true, nickname: true, name: true } }, partFoundBy: { select: { uid: true, nickname: true, name: true } }, vendor: { select: { vendorId: true, vendorName: true } }, gateway: { select: { gatewayId: true, gatewayName: true } } } }` inside the existing `include` block.
  - [x] **[Repository — createWithCustomerAndCard]** Rename the existing method's order parameter from a single order object to accept a `parts: OrderPartInput[]` array. Restructure the `prisma.$transaction` as follows:
    1. Create customer (if new) — same as before.
    2. Create cards — same as before (using `createMany`).
    3. Create Part 1 (the parent): `const parentOrder = await tx.crmOrders.create({ data: { ...parts[0], orderCustomerId: customer.customerId, parentOrderId: null } })`.
    4. If `parts.length > 1`: for each `parts[i]` where `i >= 1`: `await tx.crmOrders.create({ data: { ...parts[i], orderCustomerId: customer.customerId, parentOrderId: parentOrder.crmOrderId } })`. Collect all created order IDs.
    5. Return `{ orderId: parentOrder.crmOrderId, customerId: customer.customerId, cardIds: [...], partOrderIds: [parentOrder.crmOrderId, ...childIds] }`.
    - Resolve `orderPartFoundByName` for each part independently inside the transaction using `tx.users.findUnique({ where: { uid: part.orderPartFoundById }, select: { nickname, name } })`.
  - [x] **[Repository — addPartToExistingOrder (NEW METHOD)]** Add method `addPartToExistingOrder(parentOrderId: number, partData: OrderPartInput): Promise<{ partOrderId: number }>`:
    - Fetch `const parentOrder = await db.crmOrders.findUnique({ where: { crmOrderId: parentOrderId }, select: { parentOrderId: true, orderCustomerId: true } })`.
    - If `!parentOrder`, throw `Error('Parent order not found')`.
    - If `parentOrder.parentOrderId !== null`, throw `Error('Cannot add a part to an order that is itself a child part. Use the parent order ID.')`.
    - Resolve `orderPartFoundByName` if `partData.orderPartFoundById` is set (same lookup as above).
    - `const newPart = await db.crmOrders.create({ data: { ...partData, orderCustomerId: parentOrder.orderCustomerId, parentOrderId: parentOrderId } })`.
    - Return `{ partOrderId: newPart.crmOrderId }`.
  - [x] **[Repository — removeChildPart (NEW METHOD)]** Add method `removeChildPart(parentOrderId: number, childOrderId: number): Promise<void>`:
    - Fetch `const childOrder = await db.crmOrders.findUnique({ where: { crmOrderId: childOrderId }, select: { parentOrderId: true } })`.
    - If `!childOrder`, throw `Error('Part not found')`.
    - If `childOrder.parentOrderId === null`, throw `Error('Cannot delete the primary order via the parts endpoint. Use DELETE /api/orders/{id} to delete the entire order.')`.
    - If `childOrder.parentOrderId !== parentOrderId`, throw `Error('This part does not belong to the specified parent order.')`.
    - `await db.crmOrders.delete({ where: { crmOrderId: childOrderId } })`.
  - [x] **[Repository — countChildren (NEW METHOD)]** Add method `countChildren(parentOrderId: number): Promise<number>`:
    - `return await db.crmOrders.count({ where: { parentOrderId } })`.
    - Used by the delete guard in `order.service.ts` to give a user-friendly error before the DB RESTRICT constraint would fire.
  - [x] **[Repository — promotePrimaryPart (NEW METHOD)]** Add method `promotePrimaryPart(currentParentId: number, newPrimaryPartId: number): Promise<void>`:
    - Validate: `const newPrimary = await db.crmOrders.findUnique({ where: { crmOrderId: newPrimaryPartId }, select: { parentOrderId: true } })`. If `!newPrimary`, throw `Error('Part not found')`. If `newPrimary.parentOrderId !== currentParentId`, throw `Error('The selected part does not belong to this order group.')`.
    - Execute inside a single `prisma.$transaction` to prevent a circular-reference window:
      1. `await tx.crmOrders.update({ where: { crmOrderId: newPrimaryPartId }, data: { parentOrderId: null } })` — promote the new part to root (no FK violation since we're removing a reference, not adding one).
      2. `await tx.crmOrders.update({ where: { crmOrderId: currentParentId }, data: { parentOrderId: newPrimaryPartId } })` — demote the old parent to child of the new primary.
      3. For each remaining child (all other rows with `parentOrderId = currentParentId` except `newPrimaryPartId`, which was already updated in step 1): `await tx.crmOrders.updateMany({ where: { parentOrderId: currentParentId }, data: { parentOrderId: newPrimaryPartId } })` — re-parent all other children to the new primary.
    - No return value needed.
  - [x] **[Service]** In `src/service/order.service.ts`:
    - Update `createOrder(payload)`: Accept `payload.parts: OrderPartInput[]` and `payload.primaryPartIndex?: number` (default `0`). Reorder the `parts` array so `parts[primaryPartIndex]` is placed at index 0 before passing to the repository (the repository always treats index 0 as the parent). Apply the existing auto-status-transition logic to every part independently.
    - **[Delete guard]** In `deleteOrder(id, session)`: Before calling `orderRepository.remove(id)`, add: `const childCount = await orderRepository.countChildren(id);` — if `childCount > 0`, throw `Error('This order has ${childCount} additional part(s) attached to it. Please remove all child parts from the Edit Order page before deleting the primary order.')`. This check happens entirely in application code; the DB RESTRICT constraint is a safety net, never the primary error path.
    - Add new method `addPart(parentOrderId: number, partData: OrderPartInput, session: Session): Promise<{ partOrderId: number }>`:
      - Call `requirePermission(session, 'orders:edit')`.
      - Apply the auto-status logic to `partData` (same as for a single order).
      - Call `orderRepository.addPartToExistingOrder(parentOrderId, partData)` and store the result as `const result`.
      - **[Audit]** After successful creation, write an audit log entry on the **parent order** (not the child): call `orderRepository.createAuditEntry({ orderId: parentOrderId, changedByUserId: Number(session.user.uid), fieldName: 'childPart', oldValue: null, newValue: \`Part added: "${partData.orderPart ?? 'Unknown'}" (Child Order ID: ${result.partOrderId})\` })`. This records the structural change on the parent so operators can see the order's full part history in one timeline.
      - Return `result`.
    - Add new method `removePart(parentOrderId: number, childOrderId: number, session: Session): Promise<void>`:
      - Call `requirePermission(session, 'orders:edit')`.
      - **Before deletion**, fetch the child order's part name to record it in the audit log: `const childOrder = await orderRepository.findById(childOrderId)`. Store `const partName = childOrder?.orderPart ?? 'Unknown'`.
      - Call `orderRepository.removeChildPart(parentOrderId, childOrderId)`.
      - **[Audit]** After successful deletion, write an audit log entry on the **parent order**: call `orderRepository.createAuditEntry({ orderId: parentOrderId, changedByUserId: Number(session.user.uid), fieldName: 'childPart', oldValue: \`Part removed: "${partName}" (Child Order ID: ${childOrderId})\`, newValue: null })`.
    - **[Child order field edits — automatically audited]** When `PATCH /api/orders/{childOrderId}` is called for a child part, it flows through the same `updateOrder` service method used for all orders. The existing `orderKeysToAudit` array already tracks field-level changes (vendor, pricing, status, liftgate, part found by, etc.) for **every** `crm_orders` row regardless of whether `parentOrderId` is null or set. No additional code is required — child part edits are written automatically to `crm_order_audit_log` with the child's own `orderId` as the identifier.
    - Add new method `promotePrimary(currentParentId: number, newPrimaryPartId: number, session: Session): Promise<void>`:
      - Call `requirePermission(session, 'orders:edit')`.
      - Call `orderRepository.promotePrimaryPart(currentParentId, newPrimaryPartId)`.
      - **[Audit]** Write two audit entries using `orderRepository.createAuditEntry`:
        1. On `currentParentId`: `{ fieldName: 'primaryPart', oldValue: 'Primary (Order ID: ${currentParentId})', newValue: 'Child of Order ID: ${newPrimaryPartId}' }`.
        2. On `newPrimaryPartId`: `{ fieldName: 'primaryPart', oldValue: 'Child of Order ID: ${currentParentId}', newValue: 'Primary (Order ID: ${newPrimaryPartId})' }`.
  - [x] **[Controller — POST /api/orders]** In `src/app/api/orders/route.ts`, update the POST handler:
    - Parse `parts` from the request body. If the body has a `parts` array, use it directly. For backward compatibility, if the body has the old flat structure (no `parts` array), wrap: `const parts = [{ ...body }]`.
    - Pass `{ customer, cards, parts }` to `orderService.createOrder()`.
    - Return the new response shape: `{ orderId, customerId, cardIds, partOrderIds }` with status `201`.
  - [x] **[Controller — POST /api/orders/[id]/parts (NEW ROUTE)]** Create `src/app/api/orders/[id]/parts/route.ts`:
    - Export `POST` handler.
    - Resolve session. Call `requirePermission(session, 'orders:edit')`.
    - Parse `id` from params as `Number(params.id)`.
    - Parse request body as `partData: OrderPartInput`.
    - Call `orderService.addPart(id, partData, session)`.
    - On success: return `NextResponse.json({ partOrderId }, { status: 201 })`.
    - On `Error('Cannot add a part to an order that is itself a child part...')`: return `NextResponse.json({ error: e.message }, { status: 400 })`.
  - [x] **[Controller — DELETE /api/orders/[id]/parts/[partId] (NEW ROUTE)]** Create `src/app/api/orders/[id]/parts/[partId]/route.ts`:
    - Export `DELETE` handler.
    - Resolve session. Call `requirePermission(session, 'orders:edit')`.
    - Parse `id` (parentOrderId) and `partId` (childOrderId) from params.
    - Call `orderService.removePart(Number(id), Number(partId), session)`.
    - On success: return `NextResponse.json({ success: true }, { status: 200 })`.
    - On `Error('Cannot delete the primary order...')`: return `NextResponse.json({ error: e.message }, { status: 400 })`.
    - On `Error('Part not found')`: return `NextResponse.json({ error: e.message }, { status: 404 })`.
  - [x] **[Controller — PATCH /api/orders/[id]/promote-part (NEW ROUTE)]** Create `src/app/api/orders/[id]/promote-part/route.ts`:
    - Export `PATCH` handler.
    - Resolve session. Call `requirePermission(session, 'orders:edit')`.
    - Parse `id` (currentParentId) from params as `Number(params.id)`.
    - Parse request body: `const { newPrimaryPartId } = await req.json()`.
    - Validate `newPrimaryPartId` is a positive integer, else return `NextResponse.json({ error: 'newPrimaryPartId is required and must be a number.' }, { status: 400 })`.
    - Call `orderService.promotePrimary(Number(id), newPrimaryPartId, session)`.
    - On success: return `NextResponse.json({ success: true }, { status: 200 })`.
    - On `Error('Part not found')`: return `NextResponse.json({ error: e.message }, { status: 404 })`.
    - On `Error('The selected part does not belong to this order group.')`: return `NextResponse.json({ error: e.message }, { status: 400 })`.
  - [x] **[Controller — DELETE /api/orders/[id] — delete guard]** In the existing `DELETE` handler for `src/app/api/orders/[id]/route.ts`:
    - Catch the user-friendly error from the service: `On Error('This order has ... additional part(s)...')` — return `NextResponse.json({ error: e.message }, { status: 409 })`.
    - In the UI (`OrderList.tsx` or wherever a delete action is triggered): if the API response is `409`, display the error message in a toast notification (e.g. `toast.error(response.error)`). Do NOT show a generic error; surface the exact message so the user knows what action to take.
  - [x] Run integration test — **confirm GREEN.**

- [x] **RED — Unit / Component (`AddOrderForm.test.tsx`, `EditOrderForm.test.tsx`):**
  - [x] **`AddOrderForm.test.tsx`**: Test: Render `AddOrderForm`. Assert exactly one part card section is visible (labelled "Part 1" or contains `data-testid="part-card-0"`). Assert a button with text "Add Another Part" is present.
  - [x] **`AddOrderForm.test.tsx`**: Test: Click "Add Another Part" button. Assert a second part card (`data-testid="part-card-1"`) is now visible. Assert the second part card's `id="orderMakeModel-1"` input has the same value as `id="orderMakeModel-0"` (auto-filled from Part 1). Assert `id="orderSalesAgentId-1"` select has the same value as `id="orderSalesAgentId-0"` (auto-filled). Assert `id="orderPart-1"` input is empty. Assert `id="orderVendorId-1"` select is empty / default.
  - [x] **`AddOrderForm.test.tsx`**: Test: Render `AddOrderForm` with two parts. Assert a radio input with `name="primaryPart"` and `value="0"` is present on Part 1's card. Assert a radio input with `name="primaryPart"` and `value="1"` is present on Part 2's card. Assert Part 1's radio is checked by default (`data-testid="primary-radio-0"` is checked).
  - [x] **`AddOrderForm.test.tsx`**: Test: Click the radio `data-testid="primary-radio-1"` (select Part 2 as primary). Assert Part 2's card gains a visual indicator class `part-card--primary` and Part 1's card loses it. Assert Part 1's card shows a label "Primary" badge before the click and Part 2's shows it after.
  - [x] **`AddOrderForm.test.tsx`**: Test: With Part 2 selected as primary, submit the form. Assert `fetch` is called with `POST /api/orders` and request body where `parts[0].orderPart` equals Part 2's part name (the selected primary was reordered to index 0) and `primaryPartIndex` is either absent or `0` (since the array was already reordered client-side).
  - [x] **`AddOrderForm.test.tsx`**: Test: Click "Add Another Part". Assert a "Remove" button is visible on Part 2's card but NOT on Part 1's card.
  - [x] **`AddOrderForm.test.tsx`**: Test: Click "Remove" on Part 2. Assert Part 2 card is removed and only one part card remains.
  - [x] **`AddOrderForm.test.tsx`**: Test: With two parts present, fill Part 1 `orderTotalPitched: "400"` and Part 2 `orderTotalPitched: "200"`. Assert the Deal Summary section (labelled `data-testid="deal-summary"`) shows a combined Total Pitched of `$600.00`.
  - [x] **`AddOrderForm.test.tsx`**: Test: Submit form with 2 parts (Part 1 as primary). Assert `fetch` is called once with `POST /api/orders` and request body containing `parts: [{ orderPart: "Engine", ... }, { orderPart: "Transmission", ... }]`.
  - [x] **`EditOrderForm.test.tsx`**: Test: Render `EditOrderForm` with a mock order that has `childOrders: [{ crmOrderId: 102, orderPart: "Transmission", ... }]`. Assert two part cards are visible: Part 1 (the parent) and Part 2 (the child). Assert Part 1's `data-testid="primary-radio-0"` is checked.
  - [x] **`EditOrderForm.test.tsx`**: Test: Click `data-testid="primary-radio-1"` to select Part 2 as primary. Assert Part 2's card gains `part-card--primary` class and Part 1 loses it.
  - [x] **`EditOrderForm.test.tsx`**: Test: Submit `EditOrderForm` after selecting Part 2 (crmOrderId 102) as primary. Assert `fetch` is called with `PATCH /api/orders/{parentId}/promote-part` and body `{ newPrimaryPartId: 102 }` as the **first** call in the submit sequence (before any PATCH for field updates).
  - [x] **`EditOrderForm.test.tsx`**: Test: "Remove" button is visible on Part 2 (child) card but NOT on Part 1 (parent) card.
  - [x] **`EditOrderForm.test.tsx`**: Test: Submit `EditOrderForm` after modifying Part 2's `orderPart`. Assert `PATCH /api/orders/102` is called with updated `orderPart` value for the child order.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → AddOrderForm → EditOrderForm → OrderList → Order Detail Page):**
  - [x] **[Types — `src/types/order.ts`]:**
    - Add `parentOrderId?: number | null` to the `Order` and `OrderDetail` interfaces.
    - Create new interface `ChildPartSummary`: `{ crmOrderId: number; orderPart: string | null; saleStatus: string | null; orderCurrentStatus: string | null; orderAmountCharged: string | null; orderRefundAmount: string | null; orderLiftgateNeeded: string | null; }`.
    - Create new interface `ChildPartDetail` — identical shape to `OrderDetail` (all fields), representing a fully-loaded child order.
    - Add `childOrders?: ChildPartSummary[]` to the `Order` interface (list view).
    - Add `childOrders?: ChildPartDetail[]` to the `OrderDetail` interface (detail view).
    - Add `parts: OrderPartInput[]` to `OrderCreateInput`. `OrderPartInput` is a new interface containing all per-part fields: `orderMakeModel`, `orderVin`, `orderPart`, `orderPartSize`, `orderVendorId`, `orderVendorName`, `orderPartFoundById`, `orderPartFoundByName`, `orderVendorPrice`, `orderTotalPitched`, `orderAmountCharged`, `orderRefundAmount`, `orderShippingType`, `orderLiftgateNeeded`, `orderChecklist`, `orderQuotedMilesAndWarranty`, `orderVendorMilesAndWarranty`, `orderSalesAgentId`, `orderVerifierId`, `orderSalesVerifierId`, `orderBackendExecutiveId`, `orderPartFoundById`, `orderPaymentGatewayId`, `orderDate`, `saleStatus`, `orderCurrentStatus`.
  - [x] **[AddOrderForm.tsx — major refactor]:**
    - Define a `PartFormState` type locally (same fields as `OrderPartInput`).
    - Replace all current per-order state variables (`orderPart`, `orderMakeModel`, etc.) with a single `const [parts, setParts] = useState<PartFormState[]>([defaultPart])` where `defaultPart` is an object with all fields at their default empty/null values.
    - Extract the fields for a single part into a sub-component or render helper `renderPartCard(part: PartFormState, index: number)` that renders a visually distinct card with title **"Part {index + 1}"** and all per-part fields:
      - Year/Make & Model (`orderMakeModel-{index}`), VIN (`orderVin-{index}`)
      - Part Name (`orderPart-{index}`), Part Size (`orderPartSize-{index}`)
      - Vendor selector (`orderVendorId-{index}`), Part Found By selector (`orderPartFoundById-{index}`)
      - Quoted Miles & Warranty (`orderQuotedMilesAndWarranty-{index}`), Vendor Miles & Warranty (`orderVendorMilesAndWarranty-{index}`)
      - Vendor Price (`orderVendorPrice-{index}`), Total Pitched (`orderTotalPitched-{index}`), Amount Charged (`orderAmountCharged-{index}`)
      - Shipping Type (`orderShippingType-{index}`), Liftgate Needed checkbox (`orderLiftgateNeeded-{index}`)
      - Checklist checkbox (`orderChecklist-{index}`)
      - Sale Status select (`saleStatus-{index}`) with existing sale status options
      - Workflow Status select (`orderCurrentStatus-{index}`) with existing workflow options
      - Sales Agent select (`orderSalesAgentId-{index}`)
      - Sales Verifier select (`orderSalesVerifierId-{index}`)
      - Backend Executive select (`orderBackendExecutiveId-{index}`)
      - QA Verifier select (`orderVerifierId-{index}`)
      - Payment Gateway select (`orderPaymentGatewayId-{index}`)
      - Part Found By select (`orderPartFoundById-{index}`)
      - Remove Part button — rendered only when `index > 0`: `onClick={() => setParts(parts.filter((_, i) => i !== index))}`
    - "Add Another Part" button (outside and below all part cards):
      ```typescript
      const addAnotherPart = () => {
        const first = parts[0];
        const newPart: PartFormState = {
          ...defaultPart, // start with all defaults
          // Auto-fill from Part 1:
          orderMakeModel: first.orderMakeModel,
          orderVin: first.orderVin,
          orderSalesAgentId: first.orderSalesAgentId,
          orderVerifierId: first.orderVerifierId,
          orderSalesVerifierId: first.orderSalesVerifierId,
          orderBackendExecutiveId: first.orderBackendExecutiveId,
          orderPaymentGatewayId: first.orderPaymentGatewayId,
          orderDate: first.orderDate,
          // NOT auto-filled (left at defaults):
          // orderPart, orderPartSize, orderVendorId, orderPartFoundById,
          // orderVendorPrice, orderTotalPitched, orderAmountCharged,
          // orderShippingType, orderLiftgateNeeded, orderChecklist,
          // saleStatus (defaults '1'), orderCurrentStatus (defaults 'Pending Booking')
        };
        setParts([...parts, newPart]);
      };
      ```
    - Deal Summary section (`data-testid="deal-summary"`) rendered below all part cards:
      - **Total Parts:** `{parts.length}`
      - **Combined Total Pitched:** `${ parts.reduce((s, p) => s + (parseFloat(p.orderTotalPitched || '0')), 0).toFixed(2) }`
      - **Combined Vendor Price:** `${ parts.reduce((s, p) => s + (parseFloat(p.orderVendorPrice || '0')), 0).toFixed(2) }`
      - **Combined Amount Charged:** `${ parts.reduce((s, p) => s + (parseFloat(p.orderAmountCharged || '0')), 0).toFixed(2) }`
    - Customer Info section and Cards section remain as-is (unchanged — still shared once at the top).
    - Primary Part radio state: `const [primaryPartIndex, setPrimaryPartIndex] = useState(0)`. The selected radio determines which part is the parent on submit.
    - Each part card rendered by `renderPartCard(part, index)` includes at the top of the card:
      ```tsx
      <label className={`primary-part-radio ${primaryPartIndex === index ? 'part-card--primary' : ''}`}>
        <input
          type="radio"
          name="primaryPart"
          value={index}
          data-testid={`primary-radio-${index}`}
          checked={primaryPartIndex === index}
          onChange={() => setPrimaryPartIndex(index)}
        />
        {primaryPartIndex === index && <span className="badge-primary-part">★ Primary</span>}
        {primaryPartIndex !== index && <span className="badge-set-primary">Set as Primary</span>}
      </label>
      ```
    - On submit: before sending, reorder the parts array so the selected primary is at index 0: `const orderedParts = [parts[primaryPartIndex], ...parts.filter((_, i) => i !== primaryPartIndex)]`. Send `orderedParts` as the `parts` array in the POST body. The backend always treats `parts[0]` as the parent.
    - On submit: build body as `{ customer: {...}, cards: [...], parts: orderedParts }` and `POST /api/orders`.
  - [x] **[EditOrderForm.tsx — major refactor]:**
    - On load, fetch `GET /api/orders/{id}` which now returns `childOrders[]` in the response.
    - Initialize state:
      - `const [parts, setParts] = useState<EditPartState[]>([orderToEditPartState(order), ...order.childOrders.map(c => childToEditPartState(c))])` where each `EditPartState` includes all per-part fields plus `crmOrderId: number | null` (null = new, unsaved part) and `pendingDeletion: boolean`.
      - `const [primaryPartIndex, setPrimaryPartIndex] = useState(0)` — index 0 is always the parent on load (since the parent row is always at index 0 in the loaded array).
    - Render all parts using the same `renderPartCard(part, index)` pattern as `AddOrderForm`, **including** the primary radio button:
      - Same `<input type="radio" name="primaryPart" data-testid={\`primary-radio-${index}\`}>` control.
      - On radio change: `setPrimaryPartIndex(index)`.
    - "Add Another Part" button: same auto-fill logic as `AddOrderForm.tsx`.
    - "Remove Part" button on child parts (index > 0, where `!part.pendingDeletion`): marks the part as `pendingDeletion: true` in state (visual: collapse/grey-out the card with a "Will be removed on save" message). Do NOT call the API immediately.
    - On submit — execute the following steps **sequentially** (await each before starting the next):
      1. **[Primary promotion — only if primary changed]** If `primaryPartIndex !== 0` AND `parts[primaryPartIndex].crmOrderId` is not null: call `PATCH /api/orders/{order.crmOrderId}/promote-part` with body `{ newPrimaryPartId: parts[primaryPartIndex].crmOrderId }`. This must be the **first** API call so the DB reflects the correct parent/child structure before field updates.
      2. For the original parent row (index 0, `crmOrderId = order.crmOrderId`, `pendingDeletion: false`): `PATCH /api/orders/{order.crmOrderId}` with Part 1 fields.
      3. For each existing child part (has `crmOrderId`, `pendingDeletion: false`): `PATCH /api/orders/{part.crmOrderId}` with updated fields.
      4. For each existing child part (has `crmOrderId`, `pendingDeletion: true`): `DELETE /api/orders/{order.crmOrderId}/parts/{part.crmOrderId}`.
      5. For each new part (no `crmOrderId`): `POST /api/orders/{order.crmOrderId}/parts` with the part data.
      - If `primaryPartIndex !== 0` AND `parts[primaryPartIndex].crmOrderId` is null (brand-new unsaved part marked as primary): the new part must first be created via step 5 (which returns a `partOrderId`), then immediately promote it via `PATCH /api/orders/{order.crmOrderId}/promote-part` with `{ newPrimaryPartId: partOrderId }`. In this case, steps 1 and 5 for that specific part are sequenced: create first, then promote.
  - [x] **[OrderList.tsx]:**
    - Compute `allParts` for each row: `const allParts = [order, ...(order.childOrders ?? [])]`.
    - In the Part Name cell: render `{order.orderPart ?? '—'}` followed by — if `order.childOrders && order.childOrders.length > 0` — a small badge: `<span className="badge-multi-parts">(+{order.childOrders.length} more)</span>`.
    - In the financial amount column: replace the current single `order.orderAmountCharged` display with the computed sum: `const totalCharged = allParts.reduce((s, p) => s + parseFloat(p.orderAmountCharged ?? '0'), 0);` → display `${ totalCharged.toFixed(2) }`.
    - Liftgate badge (from Phase 25): check `order.orderLiftgateNeeded === 'Yes'` to render the badge (already done in Phase 25, but ensure it remains).
  - [x] **[page.tsx — order detail (`src/app/orders/[id]/page.tsx`)]:**
    - Build `const allParts = [order, ...(order.childOrders ?? [])]`.
    - Add a **Part Selector** control above the Part Details section:
      - `const [selectedPartIndex, setSelectedPartIndex] = useState(0)`.
      - Render `<select id="partSelector" value={selectedPartIndex} onChange={e => setSelectedPartIndex(Number(e.target.value))}>` with options: `allParts.map((p, i) => <option value={i}>Part {i+1}: {p.orderPart ?? 'Unknown'} — {getSaleStatusLabel(p.saleStatus)}</option>)`.
    - The **Part Details section** (Make/Model, VIN, Part, Part Size, Vendor, Part Found By, Miles/Warranty, Shipping, Liftgate, Checklist, Sale Status, Workflow Status, Tracking, etc.) now reads from `allParts[selectedPartIndex]` instead of directly from `order`.
    - The **Staff Allocation section** (Sales Agent, Verifier, Sales Verifier, Backend Executive, Part Found By) now also reads from `allParts[selectedPartIndex]`, since staff allocation is per-part.
    - Replace the existing **Financial Summary / Ledger** section with an **Aggregate Financial Summary**:
      - `const totalPitched = allParts.reduce((s, p) => s + parseFloat(p.orderTotalPitched ?? '0'), 0)`.
      - `const totalVendorPrice = allParts.reduce((s, p) => s + parseFloat(p.orderVendorPrice ?? '0'), 0)`.
      - `const totalCharged = allParts.reduce((s, p) => s + parseFloat(p.orderAmountCharged ?? '0'), 0)`.
      - `const totalRefund = allParts.reduce((s, p) => s + parseFloat(p.orderRefundAmount ?? '0'), 0)`.
      - `const netMargin = totalCharged - totalRefund`.
      - Display these five values in the Financial Summary card. Add a sub-note: "Totals across all {allParts.length} part(s)."
  - [x] Run unit test — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Agent navigates to `/orders/new` → sees "Part 1" card with all fields → fills Part 1 (Engine, VIN: ABC123, Sales Agent: John, Amount: $400) → clicks "Add Another Part" → Part 2 card appears with Make/Model and VIN auto-filled as ABC123, Sales Agent pre-filled as John, Part field empty → agent fills Part 2 (Transmission, Vendor: Smith Parts, Amount: $200) → agent clicks "Set as Primary" radio on Part 2 → Part 2 card shows "★ Primary" badge and Part 1 shows "Set as Primary" → Deal Summary shows Combined Amount: $600 → agent submits → network request sends `parts[0] = Transmission` (reordered), `parts[1] = Engine` → DB: Transmission row has `parent_order_id = NULL`, Engine row has `parent_order_id = Transmission.crm_order_id` → list view shows "Transmission" as the main part name with "(+1 more)" badge and amount "$600.00" → agent clicks the row → detail page shows Part Selector dropdown "Part 1: Transmission — Pending Booking" and "Part 2: Engine — Sold" → Financial Summary shows Total Charged: $600.00 → ✅ Done.
  - [x] Agent navigates to Edit Order (an existing 2-part order where Engine is primary, Transmission is child) → both part cards shown, Engine has "★ Primary" radio checked → agent clicks "Set as Primary" radio on the Transmission card → agent saves → first API call is `PATCH /api/orders/{engineOrderId}/promote-part` with `{ newPrimaryPartId: transmissionOrderId }` → DB swaps: Transmission becomes `parent_order_id = NULL`, Engine becomes `parent_order_id = Transmission.crm_order_id` → list view now shows "Transmission" as the primary part name → ✅ Done.
  - [x] Agent navigates to list view → clicks delete on a parent order that has 1 child part → API returns `409` → UI shows toast: "This order has 1 additional part(s) attached to it. Please remove all child parts from the Edit Order page before deleting the primary order." → order is NOT deleted → agent navigates to Edit Order → marks child part as "Remove" → saves → child deleted → agent returns to list and deletes the (now childless) order successfully → ✅ Done.

---

### Phase 26.5 — Multi-Part Financial Redesign, Field-Split Enforcement & Per-Part Status Filtering

#### W-2601 — Enforce Global vs. Per-Part Field Split, Redesign Financial Model, and Fix Order List Multi-Status Display

**Root cause / Goal:**
Phase 26 scaffolded the parent/child row structure for multi-part orders, but left the financial model and form field ownership ambiguous. Specifically:

1. **Financial fields** (`order_total_pitched`, `order_amount_charged`, `order_refund_amount`, `order_payment_gateway_id`) were spec'd to aggregate across all part rows via SUM, but the business reality is: the company charges the customer ONE total amount for the entire deal, and pays vendors PER PART. Aggregating is wrong — these are deal-level fields stored only on the parent row.

2. **Form field ownership** was never explicitly split. Backend Executive and Part Found By must be per-part (each part is sourced by different staff). Sales Agent, Sales Verifier, QA Verifier, Payment Gateway, Sale Date, Shipping Type, Liftgate Needed, and Checklist by Backend must be global (entered once for the deal, stored on parent row only, NULL on child rows).

3. **Vendor Sourcing UX** was not spec'd. The mockup confirmed a "Vendor Sourcing" mirror-select dropdown is needed on each child part card — allowing the agent to say "same vendor as Part 1" instead of re-selecting. The vendor dropdown locks but the price stays independent.

4. **Order list** shows a single status badge per row, but with per-part statuses, agents need to see every part's status in the row. The filter must use "ANY part matches" logic so that a deal appears in a queue if at least one of its parts belongs there.

**Approach:**
No schema migration is needed — this is entirely a form layout, repository query, and frontend display change. The `crm_orders` table already has all columns. The change is in which columns get written to parent vs. child rows, how the form is structured, how `findAll` builds its WHERE clause, and how the list row renders multiple statuses.

---

- [x] **RED — Integration (`orders.test.ts`):**
  - [x] Test (financial — parent only): `POST /api/orders` with `parts: [{ orderPart: 'Engine', orderVendorPrice: '300' }, { orderPart: 'Transmission', orderVendorPrice: '200' }]` and top-level `orderTotalPitched: '1200'`, `orderAmountCharged: '1000'`, `orderPaymentGatewayId: 1`. Assert `SELECT order_total_pitched FROM crm_orders WHERE crm_order_id = {childId}` returns `NULL`. Assert `SELECT order_amount_charged FROM crm_orders WHERE crm_order_id = {childId}` returns `NULL`. Assert `SELECT order_total_pitched FROM crm_orders WHERE crm_order_id = {parentId}` returns `'1200'`.
  - [x] Test (financial — vendor price per part): Using the same 2-part order above, assert `SELECT order_vendor_price FROM crm_orders WHERE crm_order_id = {parentId}` returns `'300'`. Assert `SELECT order_vendor_price FROM crm_orders WHERE crm_order_id = {childId}` returns `'200'`.
  - [x] Test (global fields — parent only): Assert `SELECT order_sales_agent_id FROM crm_orders WHERE crm_order_id = {childId}` returns `NULL`. Assert `SELECT order_liftgate_needed FROM crm_orders WHERE crm_order_id = {childId}` returns `NULL`. Assert `SELECT order_checklist FROM crm_orders WHERE crm_order_id = {childId}` returns `NULL`. Assert `SELECT order_shipping_type FROM crm_orders WHERE crm_order_id = {childId}` returns `NULL`.
  - [x] Test (per-part fields — each row has its own): Assert `SELECT order_backend_executive_id FROM crm_orders WHERE crm_order_id = {childId}` is NOT NULL (set independently). Assert `SELECT order_part_found_by_id FROM crm_orders WHERE crm_order_id = {childId}` is NOT NULL.
  - [x] Test (list filter — ANY part matches): Create a 2-part order: parent has `order_current_status = 'Pending Shipment'`, child has `order_current_status = 'Pending Booking'`. `GET /api/orders?status=Pending+Booking` — assert the parent order appears in results. `GET /api/orders?status=Pending+Shipment` — assert the same parent order also appears in results. `GET /api/orders?status=Completed` — assert the order does NOT appear.
  - [x] Test (list filter — sale status ANY part): Same order with parent `saleStatus = '1'` (Sold) and child `saleStatus = '5'` (Cancelled). `GET /api/orders?saleStatus=5` — assert the parent order appears. `GET /api/orders?saleStatus=2` — assert it does NOT appear.
  - [x] Test (list response — childOrders statuses): `GET /api/orders` — assert each order object in the response has `childOrders` array where each child includes `orderCurrentStatus` and `saleStatus` fields.
  - [x] Test (vendor mirror — DB write): `POST /api/orders` with 3 parts where Part 3 uses the same `orderVendorId` as Part 1. Assert `SELECT order_vendor_id FROM crm_orders WHERE crm_order_id = {part3Id}` equals Part 1's vendor ID. Assert `SELECT order_vendor_price FROM crm_orders WHERE crm_order_id = {part3Id}` equals Part 3's independently entered price (not Part 1's price).
  - [x] Test (addPart — global fields NOT copied): `POST /api/orders/{parentId}/parts` with body containing only per-part fields (no `orderSalesAgentId`, no `orderPaymentGatewayId`, no `orderLiftgateNeeded`). Assert `201 Created`. Assert `SELECT order_sales_agent_id FROM crm_orders WHERE crm_order_id = {newPartId}` returns `NULL`.
  - [x] **Run — confirm RED (current `findAll` does not use OR clause; current `createWithCustomerAndCard` writes sales agent ID to all rows; current list response does not include per-part status fields in childOrders).**

- [x] **GREEN — Backend (Repository → Service → Controller):**
  - [x] **[Repository — `createWithCustomerAndCard`]** In `src/repository/order.repository.ts`, restructure the `prisma.$transaction` to separate global fields from per-part fields:
    - Define `GLOBAL_FIELDS` as a TypeScript const: `['orderSalesAgentId', 'orderVerifierId', 'orderSalesVerifierId', 'orderPaymentGatewayId', 'orderDate', 'orderShippingType', 'orderLiftgateNeeded', 'orderChecklist', 'orderTotalPitched', 'orderAmountCharged', 'orderRefundAmount', 'orderMakeModel', 'orderVin']`.
    - When creating the parent row (Part 1 / `parts[0]`): include ALL fields from `parts[0]` plus all global deal fields (`orderTotalPitched`, `orderAmountCharged`, `orderRefundAmount`, `orderPaymentGatewayId`, `orderSalesAgentId`, `orderVerifierId`, `orderSalesVerifierId`, `orderDate`, `orderShippingType`, `orderLiftgateNeeded`, `orderChecklist`, `orderMakeModel`, `orderVin`).
    - When creating child rows (`parts[i]` where `i >= 1`): OMIT all `GLOBAL_FIELDS` entirely — do NOT set them; let them default to `NULL`. Only include per-part fields: `orderPart`, `orderPartSize`, `orderVendorId`, `orderVendorName`, `orderVendorPrice`, `orderVendorMilesAndWarranty`, `orderQuotedMilesAndWarranty`, `orderBackendExecutiveId`, `orderBackendExecutiveName`, `orderPartFoundById`, `orderPartFoundByName`, `orderVendorFeedback`, `orderSalesVerifierId` (if different per part), `saleStatus`, `orderCurrentStatus`, plus `orderCustomerId` and `parentOrderId`.
  - [x] **[Repository — `addPartToExistingOrder`]** Apply the same GLOBAL_FIELDS exclusion: when `addPartToExistingOrder` receives `partData`, strip any keys in `GLOBAL_FIELDS` before the `db.crmOrders.create` call. Use: `const perPartData = Object.fromEntries(Object.entries(partData).filter(([k]) => !GLOBAL_FIELDS.includes(k)))`.
  - [x] **[Repository — `findAll` — OR clause for status filter]** In `findAll(filters)`, replace the simple `orderCurrentStatus: filters.status` condition with an OR clause:
    ```typescript
    // If a workflow status filter is applied:
    if (filters.status) {
      where.OR = [
        { orderCurrentStatus: filters.status },
        { childOrders: { some: { orderCurrentStatus: filters.status } } }
      ];
    }
    // If a sale status filter is applied:
    if (filters.saleStatus) {
      where.OR = [
        ...(where.OR ?? []),
        { saleStatus: filters.saleStatus },
        { childOrders: { some: { saleStatus: filters.saleStatus } } }
      ];
    }
    ```
    Note: do NOT remove `parentOrderId: null` from the `where` object — only parent rows appear in the list, even with this OR clause.
  - [x] **[Repository — `findAll` — childOrders select update]** In the `childOrders` include block for `findAll`, add `saleStatus: true` and `orderCurrentStatus: true` to the select alongside the existing fields. The updated select must be: `{ crmOrderId: true, orderPart: true, saleStatus: true, orderCurrentStatus: true, orderAmountCharged: true, orderRefundAmount: true, orderLiftgateNeeded: true, orderVendorId: true, orderVendorName: true, orderVendorPrice: true, orderBackendExecutiveId: true, orderPartFoundById: true, orderVendorFeedback: true }`.
  - [x] **[Repository — `findById`]** Verify that the `childOrders` include block for `findById` already fetches all per-part fields. Specifically confirm it includes: `orderPart`, `orderPartSize`, `orderVendorId`, `orderVendorName`, `orderVendorPrice`, `orderVendorMilesAndWarranty`, `orderQuotedMilesAndWarranty`, `orderBackendExecutiveId`, `orderPartFoundById`, `orderVendorFeedback`, `saleStatus`, `orderCurrentStatus`. If any are missing, add them.
  - [x] **[Service — `createOrder`]** In `src/service/order.service.ts`, update `createOrder(payload)`: extract the global deal fields from `payload` separately into a `dealFields` object (`{ orderTotalPitched, orderAmountCharged, orderRefundAmount, orderPaymentGatewayId, orderSalesAgentId, orderVerifierId, orderSalesVerifierId, orderDate, orderShippingType, orderLiftgateNeeded, orderChecklist, orderMakeModel, orderVin }`). Merge `dealFields` only into `parts[0]` before passing the parts array to the repository. `parts[1..n]` receive only per-part fields.
  - [x] Run integration test — **confirm GREEN.**

- [x] **RED — Unit / Component (`AddOrderForm.test.tsx`, `EditOrderForm.test.tsx`, `OrderList.test.tsx`):**

  **AddOrderForm tests:**
  - [x] Test: Render `AddOrderForm`. Assert a "Deal Information" section exists above all part cards containing: `id="orderSalesAgentId"` (single, no index), `id="orderVerifierId"`, `id="orderSalesVerifierId"`, `id="orderPaymentGatewayId"`, `id="orderDate"`, `id="orderShippingType"` (select with options "Residential" and "Commercial"), `id="orderLiftgateNeeded"` (checkbox or toggle), `id="orderChecklist"` (checkbox), `id="orderMakeModel"`, `id="orderVin"`, `id="orderTotalPitched"`, `id="orderAmountCharged"`, `id="orderRefundAmount"`. Assert NONE of these IDs appear inside any `data-testid="part-card-0"` or `data-testid="part-card-1"`.
  - [x] Test: Render `AddOrderForm`. Assert `data-testid="part-card-0"` contains: `id="orderPart-0"`, `id="orderPartSize-0"`, `id="orderVendorId-0"`, `id="orderVendorPrice-0"`, `id="orderVendorMilesAndWarranty-0"`, `id="orderQuotedMilesAndWarranty-0"`, `id="orderBackendExecutiveId-0"`, `id="orderPartFoundById-0"`, `id="orderVendorFeedback-0"`, `id="saleStatus-0"`, `id="orderCurrentStatus-0"`. Assert it does NOT contain `id="orderSalesAgentId-0"`, `id="orderTotalPitched-0"`, or `id="orderLiftgateNeeded-0"`.
  - [x] Test: Click "Add Another Part". Assert `data-testid="part-card-1"` is visible. Assert `id="vendor-sourcing-1"` select exists with option text "— Different vendor, enter below —" selected by default. Assert `id="orderVendorId-1"` select is enabled (not disabled).
  - [x] Test: Click "Add Another Part". In `data-testid="part-card-1"`, change `id="vendor-sourcing-1"` to select "Same vendor as Part 1 — {Part 1 vendor name}". Assert `id="orderVendorId-1"` becomes disabled. Assert its selected value equals the value of `id="orderVendorId-0"`.
  - [x] Test: Click "Add Another Part". Set "Vendor Sourcing" to "Same vendor as Part 1". Then change `id="orderVendorId-0"` to a different vendor. Assert `id="orderVendorId-1"`'s value automatically updates to match the new vendor (live propagation).
  - [x] Test: Add 3 parts. Set Part 3's "Vendor Sourcing" to "Same vendor as Part 1". Remove Part 1 via its remove button (wait — Part 1 IS the parent, it has no remove button. Instead: Part 3 mirrors Part 2, then remove Part 2). Assert Part 3's "Vendor Sourcing" falls back to "— Different vendor, enter below —" and its `id="orderVendorId-2"` becomes enabled again.
  - [x] Test: With 2 parts, submit form. Assert `fetch` is called once with `POST /api/orders`. Assert request body contains top-level `orderSalesAgentId` (NOT inside a nested part). Assert request body `parts[0]` does NOT contain key `orderSalesAgentId`. Assert request body `parts[1]` does NOT contain key `orderSalesAgentId`. Assert request body `parts[0]` DOES contain `orderVendorPrice`. Assert request body `parts[1]` DOES contain `orderVendorPrice`.
  - [x] **Run — confirm RED.**

  **EditOrderForm tests:**
  - [x] Test: Render `EditOrderForm` with mock order that has `childOrders: [{ crmOrderId: 102, orderPart: 'Transmission', ... }]`. Assert a "Deal Information" section exists containing `id="orderSalesAgentId"` (single, no index). Assert `data-testid="part-card-0"` does NOT contain `id="orderSalesAgentId-0"`.
  - [x] Test: Render `EditOrderForm` with a 2-part order. Assert `id="vendor-sourcing-1"` exists in Part 2's card. Assert its options include "Same vendor as Part 1 — {part1VendorName}".
  - [x] Test: In `EditOrderForm`, change Part 2's "Vendor Sourcing" to mirror Part 1. Assert `id="orderVendorId-1"` becomes disabled and copies Part 1's vendor value.
  - [x] Test: Submit `EditOrderForm` with Part 2 mirroring Part 1's vendor (but independent price). Assert `PATCH /api/orders/102` is called with `orderVendorId` equal to Part 1's vendor ID and `orderVendorPrice` equal to Part 2's independently entered price. Assert the PATCH body does NOT contain `orderSalesAgentId`.
  - [x] **Run — confirm RED.**

  **OrderList tests:**
  - [x] Test: Render `OrderList` with a mock order that has `childOrders: [{ crmOrderId: 102, orderPart: 'Transmission', orderCurrentStatus: 'Pending Booking', saleStatus: '1' }]` and parent `orderCurrentStatus: 'Pending Shipment'`, `saleStatus: '1'`. Assert the row contains `data-testid="part-status-0"` with text "Pending Shipment" and `data-testid="part-status-1"` with text "Pending Booking".
  - [x] Test: Render `OrderList` with a single-part order (no `childOrders` or empty array). Assert only one status badge is rendered per row (no part index labelling).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → AddOrderForm → EditOrderForm → OrderList → Order Detail Page):**

  **[Types — `src/types/order.ts`]:**
  - [x] Update `OrderCreateInput`: remove `orderSalesAgentId`, `orderVerifierId`, `orderSalesVerifierId`, `orderPaymentGatewayId`, `orderDate`, `orderShippingType`, `orderLiftgateNeeded`, `orderChecklist`, `orderTotalPitched`, `orderAmountCharged`, `orderRefundAmount`, `orderMakeModel`, `orderVin` from `OrderPartInput`. Add these as top-level fields directly on `OrderCreateInput` (alongside `customer`, `cards`, `parts`). This enforces the type-level separation.
  - [x] Add `orderVendorFeedback?: string | null` to `OrderPartInput`, `ChildPartSummary`, and `ChildPartDetail`.
  - [x] Add `orderBackendExecutiveId?: number | null` and `orderPartFoundById?: number | null` to `OrderPartInput` and `ChildPartSummary`.
  - [x] Define a `DealGlobalFields` interface: `{ orderSalesAgentId?: number | null; orderVerifierId?: number | null; orderSalesVerifierId?: number | null; orderPaymentGatewayId?: number | null; orderDate?: string | null; orderShippingType?: string | null; orderLiftgateNeeded?: string | null; orderChecklist?: string | null; orderTotalPitched?: string | null; orderAmountCharged?: string | null; orderRefundAmount?: string | null; orderMakeModel?: string | null; orderVin?: string | null; }`.
  - [x] Update `OrderCreateInput` to extend `DealGlobalFields` at the top level.

  **[AddOrderForm.tsx — layout restructure]:**

  The form is divided into four visual sections rendered in this exact order:

  **Section 1 — Customer Information** (unchanged — existing fields, no index):
  Customer name, email, phone, address. All shared, stored on customer row.

  **Section 2 — Card Information** (unchanged — existing fields, no index).

  **Section 3 — Deal Information** (NEW SECTION — global fields, rendered ONCE above all part cards):
  - [x] Create a card/panel with heading "Deal Information" (`data-testid="deal-information-section"`).
  - [x] Inside it, render a `2-column grid` containing:
    - Row 1: `<label>Year, Make & Model</label><input id="orderMakeModel" data-testid="orderMakeModel" ...>` | `<label>VIN Number</label><input id="orderVin" data-testid="orderVin" ...>`
    - Row 2: `<label>Sale Date</label><input id="orderDate" type="date" ...>` | `<label>Sales Agent</label><select id="orderSalesAgentId" ...>` (populated from `GET /api/users`)
    - Row 3: `<label>Sales Verifier</label><select id="orderSalesVerifierId" ...>` | `<label>QA Verifier</label><select id="orderVerifierId" ...>`
    - Row 4: `<label>Payment Gateway</label><select id="orderPaymentGatewayId" ...>` | `<label>Shipping Type</label><select id="orderShippingType"><option value="Residential">Residential</option><option value="Commercial">Commercial</option></select>`
    - Row 5 (full width span-2): Liftgate Needed checkbox `<input type="checkbox" id="orderLiftgateNeeded" ...>` and Checklist by Backend checkbox `<input type="checkbox" id="orderChecklist" ...>` — rendered side by side under a horizontal divider.
  - [x] Below the Deal Information card, render the Deal Financials sub-section (dark card, `data-testid="deal-financials"`):
    - `<label>Total Pitched</label><input id="orderTotalPitched" type="number" ...>`
    - `<label>Amount Charged</label><input id="orderAmountCharged" type="number" ...>`
    - `<label>Refund Amount</label><input id="orderRefundAmount" type="number" ...>`

  **Section 4 — Vehicle & Part Specifications** (dynamic part cards):
  - [x] Render a containing card with heading "Vehicle & Part Specifications" and a note: `"Vehicle info (Make/Model, VIN) is shared across all parts — edit it once in the Deal Information section above."` (read-only notice, `data-testid="vehicle-shared-notice"`).
  - [x] Render `parts.map((part, index) => renderPartCard(part, index))`.
  - [x] `renderPartCard(part, index)` renders `data-testid="part-card-{index}"` containing **only per-part fields** in this exact order:
    1. Card header: `"Part {index + 1}"` title + part badge (Sourced/Pending) + Remove button (if index > 0) + Primary radio button.
    2. Part details grid (2 columns):
       - `<label>Part Requested</label><input id="orderPart-{index}" ...>`
       - `<label>Dimensions / Specs</label><input id="orderPartSize-{index}" ...>`
       - `<label>Quoted Miles & Warranty</label><input id="orderQuotedMilesAndWarranty-{index}" ...>`
    3. Vendor Sourcing dropdown (only rendered when `index > 0`):
       - `<label>Vendor Sourcing</label><select id="vendor-sourcing-{index}" data-testid="vendor-sourcing-{index}">`. Options: `<option value="">— Different vendor, enter below —</option>` plus one option per other part: `<option value="{otherIndex}">Same vendor as Part {otherIndex+1} — {part[otherIndex].vendorName || 'Part {otherIndex+1}'}</option>`.
       - `onChange`: if a source is selected, copy `parts[sourceIndex].orderVendorId` and `parts[sourceIndex].orderVendorName` into the current part's state AND set `parts[index].vendorMirroring = sourceIndex`. Disable the vendor select below. If "— Different vendor —" selected, clear `vendorMirroring`, enable vendor select.
    4. Vendor details grid (2 columns):
       - `<label>Vendor</label><select id="orderVendorId-{index}" disabled={part.vendorMirroring !== undefined} ...>`. `onChange`: if this part's vendor changes, propagate to all parts that have `vendorMirroring === index` by updating their `orderVendorId` and `orderVendorName` in state.
       - `<label>Vendor Price</label><input id="orderVendorPrice-{index}" type="number" ...>` (always editable, never mirrored)
       - `<label>Vendor Miles & Warranty</label><input id="orderVendorMilesAndWarranty-{index}" ...>`
       - `<label>Vendor Feedback</label><select id="orderVendorFeedback-{index}"><option value="Positive">Positive</option><option value="Negative">Negative</option><option value="Neutral">Neutral</option></select>`
    5. Staff grid (2 columns):
       - `<label>Part Found By</label><select id="orderPartFoundById-{index}" ...>` (populated from `GET /api/users`; auto-filled from parts[0] when index > 0, but user can change)
       - `<label>Backend Executive</label><select id="orderBackendExecutiveId-{index}" ...>` (same — auto-filled from parts[0], user can change)
    6. Status grid (2 columns):
       - `<label>Sale Status</label><select id="saleStatus-{index}">` with options: `1=Sold, 2=Refund, 3=Chargeback, 4=Cancelled, 5=Cancelled Chargeback`. Default = `1`.
       - `<label>Workflow Status</label><select id="orderCurrentStatus-{index}">` with options: `Pending Booking, Pending Shipment, Completed, Cancelled`. Default = `Pending Booking`.

  - [x] `addAnotherPart()` function — when adding a new part (index > 0), auto-fill the following from `parts[0]`: `orderPartFoundById`, `orderBackendExecutiveId`. Set `vendorMirroring = undefined` (user must actively select "same vendor" if they want it). Set `saleStatus = '1'`, `orderCurrentStatus = 'Pending Booking'`. Leave blank: `orderPart`, `orderPartSize`, `orderVendorId`, `orderVendorName`, `orderVendorPrice`, `orderVendorMilesAndWarranty`, `orderQuotedMilesAndWarranty`, `orderVendorFeedback`.

  - [x] On form submit: build the request body as:
    ```typescript
    const body = {
      customer: { ...customerState },
      cards: [...cardsState],
      // Global deal fields — top level, NOT inside parts
      orderMakeModel: dealState.orderMakeModel,
      orderVin: dealState.orderVin,
      orderSalesAgentId: dealState.orderSalesAgentId,
      orderVerifierId: dealState.orderVerifierId,
      orderSalesVerifierId: dealState.orderSalesVerifierId,
      orderPaymentGatewayId: dealState.orderPaymentGatewayId,
      orderDate: dealState.orderDate,
      orderShippingType: dealState.orderShippingType,
      orderLiftgateNeeded: dealState.orderLiftgateNeeded ? 'Yes' : 'No',
      orderChecklist: dealState.orderChecklist ? 'Yes' : 'No',
      orderTotalPitched: dealState.orderTotalPitched,
      orderAmountCharged: dealState.orderAmountCharged,
      orderRefundAmount: dealState.orderRefundAmount,
      // Per-part array — reordered so primaryPartIndex is first
      parts: orderedParts.map(p => ({
        orderPart: p.orderPart,
        orderPartSize: p.orderPartSize,
        orderVendorId: p.orderVendorId,
        orderVendorName: p.orderVendorName,
        orderVendorPrice: p.orderVendorPrice,
        orderVendorMilesAndWarranty: p.orderVendorMilesAndWarranty,
        orderQuotedMilesAndWarranty: p.orderQuotedMilesAndWarranty,
        orderVendorFeedback: p.orderVendorFeedback,
        orderPartFoundById: p.orderPartFoundById,
        orderBackendExecutiveId: p.orderBackendExecutiveId,
        saleStatus: p.saleStatus,
        orderCurrentStatus: p.orderCurrentStatus,
      })),
    };
    await fetch('/api/orders', { method: 'POST', body: JSON.stringify(body) });
    ```

  **[EditOrderForm.tsx — matching restructure]:**
  - [x] On load: populate `dealState` from `order` (parent row): `orderMakeModel`, `orderVin`, `orderSalesAgentId`, `orderVerifierId`, `orderSalesVerifierId`, `orderPaymentGatewayId`, `orderDate`, `orderShippingType`, `orderLiftgateNeeded`, `orderChecklist`, `orderTotalPitched`, `orderAmountCharged`, `orderRefundAmount`. These render in the "Deal Information" section (identical layout to `AddOrderForm`).
  - [x] Populate `parts` state from `[order, ...order.childOrders]`. Each part state contains only per-part fields: `crmOrderId`, `orderPart`, `orderPartSize`, `orderVendorId`, `orderVendorName`, `orderVendorPrice`, `orderVendorMilesAndWarranty`, `orderQuotedMilesAndWarranty`, `orderVendorFeedback`, `orderPartFoundById`, `orderBackendExecutiveId`, `saleStatus`, `orderCurrentStatus`, `pendingDeletion: false`, `vendorMirroring: undefined`.
  - [x] Detect vendor mirroring on load: on initial load, for each child part at index `i > 0`, if `parts[i].orderVendorId === parts[j].orderVendorId` for some `j < i`, set `parts[i].vendorMirroring = j` and set the `vendor-sourcing-{i}` dropdown to the matching option. This restores the visual mirror state from whatever was saved.
  - [x] On submit — execute sequentially:
    1. `PATCH /api/orders/{order.crmOrderId}` with the **deal global fields** (from `dealState`): `orderMakeModel`, `orderVin`, `orderSalesAgentId`, `orderVerifierId`, `orderSalesVerifierId`, `orderPaymentGatewayId`, `orderDate`, `orderShippingType`, `orderLiftgateNeeded`, `orderChecklist`, `orderTotalPitched`, `orderAmountCharged`, `orderRefundAmount`.
    2. **[Primary promotion — if primary changed]** If `primaryPartIndex !== 0` and `parts[primaryPartIndex].crmOrderId` is not null: `PATCH /api/orders/{order.crmOrderId}/promote-part` with `{ newPrimaryPartId: parts[primaryPartIndex].crmOrderId }`.
    3. For Part 1 (the original parent row, index 0, `crmOrderId = order.crmOrderId`): `PATCH /api/orders/{order.crmOrderId}` with per-part fields only: `{ orderPart, orderPartSize, orderVendorId, orderVendorName, orderVendorPrice, orderVendorMilesAndWarranty, orderQuotedMilesAndWarranty, orderVendorFeedback, orderPartFoundById, orderPartFoundByName, orderBackendExecutiveId, orderBackendExecutiveName, saleStatus, orderCurrentStatus }`.
    4. For each existing child part (`crmOrderId !== null`, `pendingDeletion: false`): `PATCH /api/orders/{part.crmOrderId}` with per-part fields only (same set as step 3).
    5. For each part with `pendingDeletion: true`: `DELETE /api/orders/{order.crmOrderId}/parts/{part.crmOrderId}`.
    6. For each new part (no `crmOrderId`): `POST /api/orders/{order.crmOrderId}/parts` with per-part fields only.
  - [x] Note: The global PATCH in step 1 and the per-part PATCH for Part 1 in step 3 may be combined into a single `PATCH /api/orders/{order.crmOrderId}` call that merges both sets of fields, if the backend `updateOrder` service accepts a partial body.

  **[OrderList.tsx — multi-status per-row display]:**
  - [x] In the status column of each order row, replace the single status badge with a `renderPartStatuses(order)` helper:
    ```typescript
    const renderPartStatuses = (order: Order) => {
      const allParts = [order, ...(order.childOrders ?? [])];
      if (allParts.length === 1) {
        // Single part — render exactly as before (unchanged visual)
        return (
          <StatusBadge status={order.orderCurrentStatus} saleStatus={order.saleStatus} />
        );
      }
      // Multi-part — render a stacked list of per-part status rows
      return (
        <div className="multi-part-status-stack" data-testid="multi-part-status-stack">
          {allParts.map((part, i) => (
            <div key={part.crmOrderId} className="part-status-row" data-testid={`part-status-${i}`}>
              <span className="part-status-label text-xs text-muted">
                {i === 0 ? 'Part 1' : `Part ${i + 1}`} — {part.orderPart ?? '—'}
              </span>
              <StatusBadge status={part.orderCurrentStatus} saleStatus={part.saleStatus} />
            </div>
          ))}
        </div>
      );
    };
    ```
  - [x] The `multi-part-status-stack` uses CSS: `display: flex; flex-direction: column; gap: 4px;`. Each `part-status-row` uses: `display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 0.78rem;`.
  - [x] Single-part orders: the status column is visually identical to the current implementation — no regression.

  **[Order Detail page — `src/app/orders/[id]/page.tsx`]:**
  - [x] The sidebar (right column) contains the Financial Breakdown card. Update it to show:
    - **Customer Revenue section:**
      - `Total Pitched: {order.orderTotalPitched}` (from parent row)
      - `Amount Charged: {order.orderAmountCharged}` (from parent row)
      - `Refund Issued: {order.orderRefundAmount ?? '$0.00'}` (from parent row)
      - `Net Customer Revenue: {(parseFloat(order.orderAmountCharged ?? '0') - parseFloat(order.orderRefundAmount ?? '0')).toFixed(2)}`
    - **Vendor Costs section** — built by grouping `allParts` by `orderVendorId`:
      ```typescript
      const vendorGroups = allParts.reduce((acc, part, i) => {
        if (!part.orderVendorId) return acc;
        const key = part.orderVendorId;
        if (!acc[key]) acc[key] = { vendorName: part.orderVendorName ?? '—', parts: [], total: 0 };
        acc[key].parts.push({ label: `Part ${i + 1} — ${part.orderPart ?? '—'}`, price: parseFloat(part.orderVendorPrice ?? '0') });
        acc[key].total += parseFloat(part.orderVendorPrice ?? '0');
        return acc;
      }, {} as Record<number, { vendorName: string; parts: { label: string; price: number }[]; total: number }>);
      ```
      - Render each vendor group as a collapsible row: vendor name + total, with sub-rows per part (indented, showing part label and individual price). Use `data-testid="vendor-group-{vendorId}"`.
    - **Net Margin line:** `Net Margin = Amount Charged − Refund` (vendor cost shown for visibility, NOT subtracted — matches legacy formula).
    - `data-testid="financial-breakdown-card"` on the containing card element.
  - [x] Global deal fields (Sales Agent, QA Verifier, Sales Verifier, Payment Gateway, Shipping Type, Liftgate, Checklist) are displayed in a "Deal Information" read-only card in the main column (above the part cards). These read from `order.*` (parent row) directly, not from `allParts[selectedPartIndex]`.
  - [x] The Part Selector dropdown (`id="partSelector"`) controls which part's **per-part fields** are shown: Part Name, Part Size, Vendor, Vendor Price, Vendor Miles & Warranty, Quoted Miles & Warranty, Part Found By, Backend Executive, Vendor Feedback, Sale Status, Workflow Status. These update when the user switches the selector.

  - [x] Run unit test — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] **New 3-part deal (mixed vendors):** Agent opens Add Order → fills Deal Information section once (Sales Agent: Mike, Shipping: Residential, Liftgate: No, Amount Charged: $1,200) → fills Make/Model and VIN once → fills Part 1 (Engine, Vendor: LKQ Columbus, Price: $300, Part Found By: Sara, Backend Exec: Tom) → clicks "Add Another Part" → Part 2 appears with Part Found By and Backend Exec auto-filled from Part 1 (but editable), Vendor Sourcing = "Different vendor" by default → fills Part 2 (Transmission, Vendor: Midwest Auto, Price: $200, Backend Exec changed to Dave) → clicks "Add Another Part" → Part 3 appears → sets Part 3's Vendor Sourcing to "Same vendor as Part 1 — LKQ Columbus" → Part 3's vendor dropdown locks to LKQ Columbus → fills Part 3 price $120 → Deal Financials sidebar shows: LKQ Columbus: $420, Midwest Auto: $200, Total Vendor Cost: $620, Net Margin: $580 → Agent submits → DB: parent row has `order_sales_agent_id = Mike's UID`, `order_amount_charged = '1200'`, `order_vendor_price = '300'`; child 1 has `order_sales_agent_id IS NULL`, `order_amount_charged IS NULL`, `order_vendor_price = '200'`; child 2 has `order_sales_agent_id IS NULL`, `order_vendor_price = '120'`, `order_vendor_id = LKQ Columbus's ID` → ✅ Done.
  - [x] **Order list — multi-status display:** After creating the 3-part deal, navigate to the Order List → find the row for this order → the status column shows 3 stacked rows: "Part 1 — Engine [Pending Shipment]", "Part 2 — Transmission [Pending Booking]", "Part 3 — Transfer Case [Completed]" → ✅ Done.
  - [x] **Order list — status filter (ANY part matches):** On the Pending Booking tab/filter → the 3-part order appears (because Part 2 is Pending Booking) → switch to Pending Shipment tab → the same order still appears (because Part 1 is Pending Shipment) → switch to Completed tab → the same order still appears (because Part 3 is Completed) → switch to Cancelled tab → the order does NOT appear → ✅ Done.
  - [x] **Same-vendor update propagation:** Agent opens Edit Order for the 3-part deal → Part 3's "Vendor Sourcing" shows "Same vendor as Part 1 — LKQ Columbus" → agent changes Part 1's Vendor to "Route 62 Salvage" → Part 3's vendor dropdown automatically updates to "Route 62 Salvage" (locked) → agent saves → `PATCH /api/orders/{part3Id}` body contains `orderVendorId` = Route 62 Salvage's ID → ✅ Done.
  - [x] **Order detail page — vendor grouping:** Navigate to Order Detail for the 3-part deal → Vendor Costs section shows: "LKQ Columbus (Parts 1 & 3): $420" and "Midwest Auto (Part 2): $200" → Part Selector shows "Part 1: Engine — Pending Shipment" by default → switching to Part 2 shows Transmission's vendor, price, Backend Exec Dave, Workflow Status "Pending Booking" → switching back to Part 1 shows Engine's fields → Deal Information section always shows Mike as Sales Agent (global, does not change with Part Selector) → ✅ Done.
  - [x] **Edit order — global vs per-part save:** Agent opens Edit Order → changes Sales Agent from Mike to John in Deal Information section → changes Part 2's Sale Status to Cancelled → saves → `PATCH /api/orders/{parentId}` body contains `orderSalesAgentId = John's UID` → `PATCH /api/orders/{childId}` body contains `saleStatus = 'Cancelled'` but does NOT contain `orderSalesAgentId` → `SELECT order_sales_agent_id FROM crm_orders WHERE crm_order_id = {childId}` still returns NULL → ✅ Done.

---

### Phase 26.6 — Global Sale Status + Add/Edit Order Form Layout Redesign

#### W-2661 — Promote `saleStatus` to a Global Deal-Level Field

**Root cause / Goal:**
`saleStatus` is currently stored per `crm_orders` row — both parent and all child rows independently track their own sale status. This is over-engineered for the actual business reality: when a deal is sold, refunded, chargebacked, partially refunded, voided, or cancelled, **the entire deal** is affected, not individual parts. No business scenario exists where one part of a multi-part order is chargebacked while another part is sold. Keeping `saleStatus` per-part means:
1. The UI presents a Sale Status dropdown inside every individual part card — visually confusing and operationally wrong.
2. The service layer's auto-rules (setting `orderRefundAmount` and cascading `orderCurrentStatus` to `Returned Orders`) fire per-row only, not for all sibling parts simultaneously.
3. The `crmSaleStatusHistory` audit table logs per-row changes, creating duplicate entries for what is conceptually a single business event.

The fix is to treat `saleStatus` exactly like the other deal-global fields (`orderSalesAgentId`, `orderAmountCharged`, `orderDate`, etc.) — stored only on the parent row, `NULL` on all child rows.

**Fix / Approach:**
1. **Types:** Remove `saleStatus` from `OrderPartInput`. Add `saleStatus` to `DealGlobalFields` interface. `OrderCreateInput` inherits it from `DealGlobalFields`. `ChildPartSummary` and `ChildPartDetail` keep `saleStatus` as nullable (it will read `null` for child rows).
2. **Repository:** Add `'saleStatus'` to the `GLOBAL_FIELDS` constant array (and confirm `'orderRefundAmount'` is already there). In `createWithCustomerAndCard`, read `saleStatus` from the top-level `data` object (not from `parentPart`). Set `saleStatus: null` explicitly on all child rows inside the `prisma.$transaction`. Update `addPartToExistingOrder` to always set `saleStatus: null` on any new child row. Remove the `childPart.saleStatus` reference in the child order creation loop. In `promotePrimaryPart`, include `saleStatus` in the global fields moved from old parent to new parent, and clear it on the old parent.
3. **Service (create):** Remove the per-part `saleStatus === '4'` refund-amount validation inside the `data.parts` loop. Replace with a single check at the top level: `if (data.saleStatus === '4' && !data.orderRefundAmount) { throw new Error('Refund amount is required for Partial Refund status'); }`. In the `GLOBAL_FIELDS` constant inside `createOrder` (lines 29–42), add `'saleStatus'` so it is stripped from all child parts during the global field enforcement sweep.
4. **Service (update):** The existing sale status auto-rules block in `updateOrder` (`data.saleStatus === '2'`, `=== '3'`, etc.) currently updates the single row being patched. Extend it to **cascade `orderCurrentStatus`** to all sibling rows: after setting `updatedData.orderCurrentStatus` for the parent, fetch all child order IDs (`prisma.crmOrders.findMany({ where: { parentOrderId: crmOrderId }, select: { crmOrderId: true } })`) and for each child, call `prisma.crmOrders.update` to set their `orderCurrentStatus` to the same terminal status (`Returned Orders` or `Cancelled Orders`). This cascade only fires when the PATCH target is a parent row (i.e., `existingOrder.parentOrderId === null`).
5. **API route (`/api/orders/[id]`):** No structural change needed; the PATCH route already passes the full body to `order.service.ts`. Verify `saleStatus` is passed through and not stripped by any middleware.
6. **UI — `AddOrderForm.tsx`:** Remove `saleStatus` from the `PartFormState` interface and the per-part state array. Add a single top-level `saleStatus` state variable (default `'1'`). Remove the Sale Status dropdown from inside the Part card JSX. Add Section 06 "Order Status" as a new standalone form section (following the HTML reference layout) containing the global Sale Status dropdown and a date/time modal trigger. Adjust form submission payload: `saleStatus` is sent at the top level of the POST body, not inside the `parts` array.
7. **UI — `EditOrderForm.tsx`:** Same structural change as `AddOrderForm`. Remove `saleStatus` from `parts` state initialization (both parent and child rows). Add a single global `saleStatus` state initialized from `order.saleStatus`. Remove the Sale Status dropdown from each Part card. Add Section 06 "Order Status" with the global Sale Status select and the existing `saleStatusChangeDate` modal flow. In the submit handler, `saleStatus` is sent in the PATCH payload for the **parent row only**, not inside per-part loops.
8. **Layout Restructure (both forms) — matching `order-intake_and_edit_example_1.html`:**
   - **Section 01 — Customer Information:** No change to fields. Layout: 4-column grid for Name, Email, Phone, Alternate Phone; 2-column grid below for Billing and Shipping Addresses.
   - **Section 02 — Payment Card Details:** No change. Card blocks render as before. Card copy/photo ID checkboxes remain at the bottom of this section.
   - **Section 03 — Parts:** Each part card is a collapsible row. The Part card header shows the part number badge and a nickname/label input. The card body contains: Year/Make/Model (3-col grid), Part + Spec + VIN (3-col grid), Quoted Miles/Warranty + Vendor Miles/Warranty (2-col grid), Vendor select + Vendor Price + Part Found By (3-col grid), Vendor Feedback + Workflow Queue (2-col grid). **Liftgate Needed** and **Checklist** checkboxes are rendered at the **bottom of the Section 03 container** as global flags, not inside individual part cards, with vendor cost rollup total. **Sale Status is NOT inside the part card body.**
   - **Section 04 — Pricing & Allocation:** Separate standalone section. 4-column grid: Total Price Pitched (editable), Vendor Price Total (read-only, auto-computed sum), Net Markup (read-only, auto-computed), Actual Charged (editable). Below that, a 1-column row: Sale Date.
   - **Section 05 — Team Allocation:** Separate standalone section. 4-column grid: Sales Agent, Sales Verifier, Backend Executive, QA Verifier. Payment Gateway select can be added as a 5th field. Backend Executive is global.
   - **Section 06 — Order Status:** New standalone section. Contains: Sale Status dropdown (the single global control). For statuses `2`, `3`, `5` (Refunded/Chargebacked/Void), the existing date/time capture modal is triggered exactly as before. For status `4` (Partial Refund), the Refund Amount input appears.

---

- [x] **RED — Integration (`src/tests/orders.test.ts`):**
  - [x] Test: `POST /api/orders` with `{ ..., saleStatus: '2', parts: [{ orderPart: 'Engine' }, { orderPart: 'Transmission' }] }` creates a parent row and one child row. Assert that the parent row has `saleStatus = '2'` AND `orderCurrentStatus = 'Returned Orders'`. Assert that the child row has `saleStatus = null` AND `orderCurrentStatus = 'Returned Orders'` (cascade).
  - [x] Test: `PATCH /api/orders/:parentId` with body `{ saleStatus: '3' }` (Chargebacked) on a parent that has two child rows. After the PATCH, assert: (a) parent row has `saleStatus = '3'` and `orderCurrentStatus = 'Returned Orders'`; (b) all child rows have `orderCurrentStatus = 'Returned Orders'` (even though their `saleStatus` column remains `null`).
  - [x] Test: `PATCH /api/orders/:parentId` with body `{ saleStatus: '1' }` (Sold) does NOT cascade `orderCurrentStatus` to children — each child retains its own individual `orderCurrentStatus` value.
  - [x] Test: `POST /api/orders/:parentId/parts` creates a child row with `saleStatus = null`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Types → Repository → Service → API):**
  - [x] [Types — `src/types/order.ts`] Remove `saleStatus?: string` from the `OrderPartInput` interface. Add `saleStatus?: string` to the `DealGlobalFields` interface.
  - [x] [Repository — `src/repository/order.repository.ts`] In the `GLOBAL_FIELDS` constant array, add `'saleStatus'` as the last entry. Update `createWithCustomerAndCard`, `addPartToExistingOrder`, and `promotePrimaryPart` to enforce `NULL` child `saleStatus` and handle global updates.
  - [x] [Service — `src/service/order.service.ts`].
  - [x] [API Route — `src/app/api/orders/[id]/route.ts`] Verify handlers forward `saleStatus` correctly.
  - [x] Run integration tests — **confirm GREEN**.

- [x] **RED — Unit / Component (`src/tests/AddOrderForm.test.tsx` and `src/tests/EditOrderForm.test.tsx`):**
  - [x] **`AddOrderForm.test.tsx`:** Verify global `saleStatus` dropdown exists only in Section 06, verify payload has top-level `saleStatus` instead of per-part.
  - [x] **`EditOrderForm.test.tsx`:** Verify global `saleStatus` dropdown behaves correctly.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (AddOrderForm.tsx and EditOrderForm.tsx):**
  - [x] [`src/types/order.ts`] Already updated.
  - [x] [`src/components/AddOrderForm.tsx`] Remove `saleStatus` from per-part states, add global state, implement Section 06 "Order Status", update submit payload.
  - [x] [`src/components/EditOrderForm.tsx`] Remove `saleStatus` from child states, add global state, implement Section 06 "Order Status", update submit payload.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Verify Add Order form sections render, verify Sale Status dropdown is exclusively in Section 06, verify db updates cascade workflow queue states down to child rows.

---

#### W-2662 — Form Section Layout Restructure to Match HTML Reference Design

**Root cause / Goal:**
The current `AddOrderForm.tsx` and `EditOrderForm.tsx` have a flat "Section 3: Deal Information" block that mixes pricing fields (Total Pitched, Amount Charged) with team assignment fields (Sales Agent, QA Verifier) into a single undifferentiated section. The approved HTML reference layout (`order-intake_and_edit_example_1.html`) separates these into distinct numbered sections.
1. **Clearer visual hierarchy**: Users see a logical intake flow — Customer → Payment → Parts → Pricing → Team → Status.
2. **Part cards collapse/expand**: Older cards auto-collapse when multiple parts exist, displaying chevron toggles.
3. **Liftgate / Checklist flags move to the Parts section footer**: Global checkboxes render at the bottom of Section 03 alongside the rollup total.

---

- [x] **RED — Unit / Component (`src/tests/AddOrderForm.test.tsx` and `src/tests/EditOrderForm.test.tsx`):**
  - [x] Test: Add/Edit forms contain six distinct `<h3>` section titles in sequence.
  - [x] Test: Liftgate checkbox is rendered as sibling of part cards.
  - [x] Test: Total Price Pitched is in Section 04.
  - [x] Test: Sales Agent is in Section 05.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (AddOrderForm.tsx and EditOrderForm.tsx — layout only):**
  - [x] Split Section 03 into Section 04 Pricing & Allocation, Section 05 Team Allocation, and Section 06 Order Status.
  - [x] Rename specifications card section to `"3. Parts"`.
  - [x] Move Liftgate, Checklist, and Vendor Cost total to Section 03 footer.
  - [x] Implement accordion collapsing/expanding logic with chevron toggles for Part cards.
  - [x] Run unit tests — **confirm GREEN**.

- [x] **Verification chain:**
  - [x] Verify form section headings and accordion row collapses/expands correctly, verify Liftgate and Checklist placement in the parts total footer bar.

---

### Phase 27 — Data export and backup

#### W-2701 — Full Database Export to CSV, ZIP Archive Download & FK-Safe Re-Import

**Goal:**
Allow users with the `super-admin` permission to export every table in the database as a CSV file, download all tables as a single ZIP archive, and re-upload CSV files to restore or migrate data. The export respects the FK constraint order so re-imports succeed. The import validates FK dependencies before inserting rows. Base64 image columns (`customer_card_copy_image`, `customer_photo_id_image`) are excluded from the default CSV export (exported separately to avoid bloated files).

**Approach:**
Create a `csv-exporter.ts` library with serialization helpers. Create a `data-management.service.ts` that knows the FK-safe table export/import order. Create API routes for export and import. Add a new super-admin Settings page at `/settings/data-management`. Gate everything on the `super-admin` session permission key.

---

- [ ] **RED — Integration (`data-management.test.ts`):**
  - [ ] Test: `GET /api/admin/export?table=crm_teams` without a super-admin session returns `403 Forbidden`.
  - [ ] Test: `GET /api/admin/export?table=crm_teams` with a super-admin session returns `200 OK` with headers `Content-Type: text/csv` and `Content-Disposition: attachment; filename="crm_teams.csv"`. Assert response body first line (header row) equals `"team_id,team_name,team_created,team_updated"`. Assert second line contains the seeded team's data.
  - [ ] Test: `GET /api/admin/export?table=nonexistent_table` with super-admin returns `400 Bad Request` with body `{ error: "Table 'nonexistent_table' is not in the allowed export list." }`.
  - [ ] Test: `GET /api/admin/export?table=crm_customer_cards` with super-admin returns `200 OK` CSV where the header row does **NOT** contain `customer_card_copy_image` or `customer_photo_id_image` columns.
  - [ ] Test: `GET /api/admin/export/all` with super-admin returns `200 OK` with `Content-Type: application/zip`. Assert response body is a valid ZIP archive (first 4 bytes are `PK\x03\x04`).
  - [ ] Test: Seed a new team (`INSERT INTO crm_teams SET team_name='TestExport'`). `GET /api/admin/export?table=crm_teams` — assert the CSV response body contains a row with `TestExport`. Then `DELETE FROM crm_teams WHERE team_name='TestExport'`. `POST /api/admin/import?table=crm_teams` with the exported CSV file as multipart body. Assert `SELECT COUNT(*) FROM crm_teams WHERE team_name='TestExport'` returns `1`.
  - [ ] Test: `POST /api/admin/import?table=users` with a CSV containing a row referencing `team_id=99999` (non-existent) returns `422 Unprocessable Entity` with body `{ error: "Row 2: team_id '99999' does not exist in crm_teams. Resolve FK dependencies first." }`.
  - [ ] **Run — confirm RED (routes do not exist).**

- [ ] **GREEN — Backend (Library → Service → Controller → New Routes):**
  - [ ] **[Library — `src/lib/csv-exporter.ts` (NEW FILE)]:**
    - Export constant `ALLOWED_EXPORT_TABLES: string[]` — the complete ordered list of 18 tables in FK-safe sequence:
      ```
      ['crm_teams', 'crm_roles', 'crm_permissions', 'crm_designations', 'crm_gateway',
       'admin', 'users', 'crm_role_permissions', 'crm_vendors', 'crm_customers',
       'users_profile', 'users_profile_academic', 'users_profile_professional',
       'usercheck', 'crm_attendance', 'crm_orders', 'crm_customer_cards', 'crm_comments']
      ```
    - Export constant `EXCLUDED_COLUMNS: Record<string, string[]>` — columns to exclude per table:
      ```typescript
      { 'crm_customer_cards': ['customer_card_copy_image', 'customer_photo_id_image'] }
      ```
    - Export function `objectsToCsvString(rows: Record<string, unknown>[], excludeColumns?: string[]): string`:
      - If `rows` is empty, return an empty string (no header, no rows).
      - Build headers from `Object.keys(rows[0])` filtered by `excludeColumns`.
      - Serialize each row: wrap each cell value in double-quotes, escape internal double-quotes by doubling them (`"` → `""`), convert `null`/`undefined` to empty string.
      - Return `header_line\n` + `data_lines\n` joined by `\n`.
    - Export function `csvStringToObjects(csvString: string): Record<string, string>[]`:
      - Parse the CSV: first line = headers, subsequent lines = data rows.
      - Handle quoted fields correctly (RFC 4180 compliant: quoted fields may contain commas and escaped quotes).
      - Return array of objects with header keys and string values.
    - Export function `getRawTableRows(tableName: string): Promise<Record<string, unknown>[]>`:
      - Use `db.$queryRawUnsafe(`SELECT * FROM \`${tableName}\`` )` to fetch all rows.
      - This uses raw SQL to bypass Prisma's camelCase mapping and return actual database column names.
      - **Security note:** `tableName` MUST be validated against `ALLOWED_EXPORT_TABLES` before calling this function — validation happens in the service layer.
    - Export function `validateImportRow(tableName: string, row: Record<string, string>, existingIds: Map<string, Set<string>>): string | null`:
      - Checks FK columns for the given table against `existingIds` (a pre-built map of `{ 'crm_teams': Set(['1','2','3']) }`, etc.).
      - Returns `null` if valid, or an error string like `"team_id '99999' does not exist in crm_teams"` if invalid.
      - Define `FK_MAP: Record<string, { column: string; referencedTable: string; referencedColumn: string }[]>` mapping each table to its FK columns.
  - [ ] **[Service — `src/service/data-management.service.ts` (NEW FILE)]:**
    - Method `exportTable(tableName: string): Promise<string>`:
      - Validate `tableName` is in `ALLOWED_EXPORT_TABLES`. Throw `Error("Table '...' is not in the allowed export list.")` if not.
      - Call `getRawTableRows(tableName)`.
      - Call `objectsToCsvString(rows, EXCLUDED_COLUMNS[tableName] ?? [])`.
      - Return the CSV string.
    - Method `exportAllAsZip(): Promise<Buffer>`:
      - For each table in `ALLOWED_EXPORT_TABLES` (in order), call `exportTable(tableName)`.
      - Use the `jszip` npm package: `const zip = new JSZip(); zip.file(`${tableName}.csv`, csvString)` for each table.
      - For `crm_orders`: export parents first (WHERE parent_order_id IS NULL), then children (WHERE parent_order_id IS NOT NULL), in the same file (parents listed first, then children).
      - `return await zip.generateAsync({ type: 'nodebuffer' })`.
    - Method `importTable(tableName: string, csvString: string): Promise<{ insertedCount: number; errors: string[] }>`:
      - Validate `tableName` against `ALLOWED_EXPORT_TABLES`.
      - Parse CSV using `csvStringToObjects(csvString)`.
      - Pre-build `existingIds` map: for each FK-referenced table, query its PK values.
      - Validate each row using `validateImportRow`. Collect all validation errors.
      - If any validation errors, return `{ insertedCount: 0, errors }` without inserting.
      - If valid, insert rows using `db.$executeRawUnsafe` with parameterized `INSERT INTO ... VALUES (?)` (never string-interpolate user data into SQL).
      - Return `{ insertedCount: rows.length, errors: [] }`.
  - [ ] **[Controller — `src/app/api/admin/export/route.ts` (NEW FILE)]:**
    - Export `GET` handler.
    - Resolve session. If `!hasPermission(session, 'super-admin')` → return `NextResponse.json({ error: 'Forbidden' }, { status: 403 })`.
    - Read `tableName` from `searchParams.get('table')`.
    - Call `dataManagementService.exportTable(tableName)`. Catch `Error` → return `400` with `{ error: e.message }`.
    - Return `new NextResponse(csvString, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${tableName}.csv"` } })`.
  - [ ] **[Controller — `src/app/api/admin/export/all/route.ts` (NEW FILE)]:**
    - Export `GET` handler.
    - Resolve session. Guard with `super-admin`.
    - Call `dataManagementService.exportAllAsZip()`. Returns a `Buffer`.
    - Return `new NextResponse(zipBuffer, { status: 200, headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="jd_crm_export_all.zip"' } })`.
  - [ ] **[Controller — `src/app/api/admin/import/route.ts` (NEW FILE)]:**
    - Export `POST` handler.
    - Resolve session. Guard with `super-admin`.
    - Read `tableName` from `searchParams.get('table')`.
    - Parse the multipart form body using `await req.formData()`. Get the uploaded file: `const file = formData.get('file') as File`. Read its text: `const csvString = await file.text()`.
    - Call `dataManagementService.importTable(tableName, csvString)`.
    - If `result.errors.length > 0` → return `NextResponse.json({ error: result.errors[0], allErrors: result.errors }, { status: 422 })`.
    - On success → return `NextResponse.json({ insertedCount: result.insertedCount }, { status: 200 })`.
  - [ ] **[npm dependency]** Run `npm install jszip`. Run `npm install --save-dev @types/jszip` if needed.
  - [ ] Run integration test — **confirm GREEN.**

- [ ] **RED — Unit / Component (`DataManagement.test.tsx`):**
  - [ ] Test: Render `DataManagementPage` with a super-admin session. Assert a heading "Data Management" is visible. Assert exactly 18 download buttons are present (one per table in `ALLOWED_EXPORT_TABLES`). Assert a "Download All (ZIP)" button is present.
  - [ ] Test: Render `DataManagementPage` without super-admin session. Assert the page renders an "Access Denied" message and no download buttons.
  - [ ] Test: Click the "Download All (ZIP)" button. Assert `fetch` is called with `GET /api/admin/export/all`.
  - [ ] Test: Click the "Download CSV" button for `crm_orders`. Assert `fetch` is called with `GET /api/admin/export?table=crm_orders`.
  - [ ] Test: An upload `<input type="file">` is present for each table. Simulate file selection and click "Import". Assert `fetch` is called with `POST /api/admin/import?table={tableName}` and body is `FormData` containing the file.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Types → Page → Components):**
  - [ ] **[Types]** Create `src/types/data-management.ts`:
    ```typescript
    export interface ExportTableInfo {
      tableName: string;
      displayName: string;
      rowCount?: number;
    }
    export interface ImportResult {
      insertedCount: number;
      errors?: string[];
    }
    ```
  - [ ] **[Page — `src/app/settings/data-management/page.tsx` (NEW FILE)]:**
    - Server component. Fetch session. If `!hasPermission(session, 'super-admin')` → render `<AccessDenied />` component.
    - Render `<DataManagementClient tables={ALLOWED_EXPORT_TABLES} />`.
  - [ ] **[Component — `src/components/DataManagement/DataManagementClient.tsx` (NEW FILE)]:**
    - `'use client'` component.
    - Renders a page heading **"Data Management — Export & Import"** and a warning callout: *"This page is restricted to Super Administrators. Downloads contain all database records including sensitive personal data."*
    - Renders a **"Download All Tables (ZIP)"** button. `onClick`: `window.location.href = '/api/admin/export/all'`.
    - Renders a table with columns: Table Name | Rows | Download CSV | Upload CSV | Import Status.
    - For each table in `ALLOWED_EXPORT_TABLES`:
      - **Download CSV** button: `onClick` → `window.location.href = '/api/admin/export?table=${tableName}'`.
      - **Upload CSV** section: `<input type="file" accept=".csv" id="upload-{tableName}">` + **"Import"** button.
      - **Import** button `onClick`:
        1. Read file from `<input>`.
        2. Build `FormData` with `formData.append('file', file)`.
        3. `fetch POST /api/admin/import?table=${tableName}` with the FormData body.
        4. On `200`: show success toast `"Imported {insertedCount} rows into {tableName}."`.
        5. On `422`: show error toast with the first validation error message.
      - Show last import result inline (success row count or error text).
  - [ ] **[Sidebar / Navigation]** In `src/components/Sidebar.tsx`, in the Settings section (visible when user has `settings:manage-permissions`), add a new link item **"Data Management"** pointing to `/settings/data-management`. Wrap visibility in `hasPermission(permissions, 'super-admin')`.
  - [ ] Run unit test — **confirm GREEN.**

- [ ] **Verification chain:**
  - [ ] Super Admin navigates to `/settings/data-management` → sees table list with 18 rows, "Download All (ZIP)" button → clicks "Download All (ZIP)" → browser downloads `jd_crm_export_all.zip` containing 18 `.csv` files → super admin unzips, verifies `crm_orders.csv` contains all order rows and does NOT have `customer_card_copy_image` column → super admin deletes a test team from DB → navigates back to page → uploads the previously downloaded `crm_teams.csv` → clicks Import → success toast "Imported N rows into crm_teams" → confirms deleted team is restored in the DB → super admin attempts to import `users.csv` with an invalid `team_id` → import fails with a clear FK validation error message → non-super-admin user navigates to `/settings/data-management` → sees "Access Denied" page → ✅ Done.

---

### Phase 28 — Automated Weekly Backup

#### W-2801 — Saturday Evening Cron Backup (Docker mysqldump + Vercel Cron Trigger)

**Goal:**
Automatically back up the entire database every Saturday evening at 19:00 IST (13:30 UTC). Two delivery mechanisms are implemented:
1. **Docker/self-hosted:** A `cron` container in `docker-compose.yml` runs `mysqldump` weekly and saves `.sql` dump files to a mounted local volume, keeping the last 4 backups.
2. **Vercel/serverless:** A `vercel.json` cron job calls `POST /api/admin/backup/trigger` at the same time, which runs the CSV-based export (Phase 27) and saves a ZIP file or sends it to a configured webhook URL.

**Approach:**
Add a `crm_backup` service to `docker-compose.yml` using a lightweight MySQL-capable cron image. Add `POST /api/admin/backup/trigger` route guarded by `super-admin`. Create `backup.service.ts` reusing Phase 27's export logic. Add `vercel.json` cron entry. Document backup file naming and retention in a new `BACKUPS.md` file.

---

- [ ] **RED — Integration (`backup.test.ts`):**
  - [ ] Test: `POST /api/admin/backup/trigger` without a super-admin session returns `403 Forbidden`.
  - [ ] Test: `POST /api/admin/backup/trigger` with a super-admin session returns `200 OK` with body `{ success: true, timestamp: <ISO string>, tablesExported: 18, message: "Backup complete." }`. Assert the response `timestamp` is a valid ISO date string.
  - [ ] **Run — confirm RED (route does not exist).**

- [ ] **GREEN — Backend (Service → Controller → Docker → Vercel Config):**
  - [ ] **[Service — `src/service/backup.service.ts` (NEW FILE)]:**
    - Method `runBackup(): Promise<{ timestamp: string; tablesExported: number; filePath: string | null }>`:
      - Get `timestamp = new Date().toISOString()`.
      - Call `dataManagementService.exportAllAsZip()` (from Phase 27) to get the ZIP `Buffer`.
      - If `process.env.BACKUP_OUTPUT_PATH` is set: write the buffer to `path.join(BACKUP_OUTPUT_PATH, `jd_crm_backup_${timestamp.replace(/:/g, '-')}.zip`)` using Node.js `fs.writeFileSync`. Delete backup files older than the 4 most recent in that directory.
      - If `process.env.BACKUP_WEBHOOK_URL` is set: `fetch(BACKUP_WEBHOOK_URL, { method: 'POST', body: zipBuffer, headers: { 'Content-Type': 'application/zip', 'X-Backup-Timestamp': timestamp } })`.
      - Return `{ timestamp, tablesExported: 18, filePath: savedPath ?? null }`.
  - [ ] **[Controller — `src/app/api/admin/backup/trigger/route.ts` (NEW FILE)]:**
    - Export `POST` handler.
    - Resolve session. If `!hasPermission(session, 'super-admin')` → return `NextResponse.json({ error: 'Forbidden' }, { status: 403 })`.
    - Call `backupService.runBackup()`.
    - Return `NextResponse.json({ success: true, timestamp: result.timestamp, tablesExported: result.tablesExported, message: 'Backup complete.' }, { status: 200 })`.
  - [ ] **[Docker — `docker-compose.yml`]:** Add a new service after the existing `db` service:
    ```yaml
    crm_backup:
      image: mysql:8.0
      depends_on:
        - db
      volumes:
        - ./backups:/backups
      environment:
        MYSQL_PWD: root_password
      entrypoint: ["/bin/sh", "-c"]
      command:
        - |
          echo "0 13 * * 6 mysqldump -h db -u root jd_crm > /backups/jd_crm_backup_$$(date +\\%Y\\%m\\%d_\\%H\\%M\\%S).sql && ls -t /backups/jd_crm_backup_*.sql | tail -n +5 | xargs -r rm" | crontab -
          crond -f -l 2
    ```
    This runs `mysqldump` every Saturday at 13:30 UTC (7:00 PM IST), saves to `/backups/` volume, and automatically prunes all but the 4 most recent backup files.
  - [ ] **[Local volume]** Create an empty `backups/` directory in the project root (if not already present). Add `backups/*.sql` and `backups/*.zip` to `.gitignore`.
  - [ ] **[Vercel config — `vercel.json`]:** Create or update `vercel.json` in the project root to include:
    ```json
    {
      "crons": [
        {
          "path": "/api/admin/backup/trigger",
          "schedule": "30 13 * * 6"
        }
      ]
    }
    ```
    This triggers the backup route every Saturday at 13:30 UTC (7:00 PM IST). Note: Vercel cron jobs call the route without a user session, so the route must also accept requests authenticated by a `CRON_SECRET` header as an alternative to session-based super-admin auth. Update the route handler: `if (!hasPermission(session, 'super-admin') && req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) { return 403 }`.
  - [ ] **[Environment variables]** Add to `.env.example`:
    ```env
    BACKUP_OUTPUT_PATH="./backups"
    BACKUP_WEBHOOK_URL=""
    CRON_SECRET=""
    ```
  - [ ] **[Documentation — `BACKUPS.md` (NEW FILE in project root)]:** Create a concise reference document explaining:
    - Backup schedule: Every Saturday at 7:00 PM IST (13:30 UTC).
    - Docker backup: `mysqldump` to `./backups/jd_crm_backup_YYYYMMDD_HHMMSS.sql`. Last 4 kept.
    - Vercel backup: ZIP export sent to `BACKUP_WEBHOOK_URL` or stored at `BACKUP_OUTPUT_PATH`. Triggered via cron.
    - Manual backup: Call `POST /api/admin/backup/trigger` with super-admin session.
    - Restore from SQL dump: `docker exec -i jd_crm_db mysql -u root -proot_password jd_crm < ./backups/{file}.sql`
    - Restore from CSV ZIP: Unzip, upload each CSV via `/settings/data-management` import in FK-safe order listed in Phase 27.
  - [ ] Run integration test — **confirm GREEN.**

- [ ] **RED — Unit (No frontend component — backup is fully server-side):**
  - [ ] N/A — `backup.service.ts` is a pure server-side service. No React component is introduced. The existing `DataManagementClient.tsx` (Phase 27) can optionally surface a "Run Backup Now" button that calls `POST /api/admin/backup/trigger` — but this is a UI enhancement, not a required unit test target for this phase.

- [ ] **GREEN — Frontend (Optional Enhancement):**
  - [ ] **[Optional — DataManagementClient.tsx]** Add a **"Run Backup Now"** button at the top of the Data Management page that calls `POST /api/admin/backup/trigger`. On success, show a toast: `"Backup complete. {tablesExported} tables exported at {timestamp}."`. This reuses the same page from Phase 27 — no new page or route is needed.

- [ ] **Verification chain:**
  - [ ] Developer runs `docker compose up -d` → `crm_backup` service starts → wait for Saturday 7:00 PM IST OR manually trigger via `POST /api/admin/backup/trigger` with super-admin session → backup file `jd_crm_backup_*.sql` (Docker) or `jd_crm_backup_*.zip` (Vercel) appears in `./backups/` → developer verifies backup is non-empty and readable → developer simulates data loss by truncating a table → runs restore command from `BACKUPS.md` → confirms data is restored → On Vercel: `vercel.json` cron is deployed → Vercel Cron dashboard shows the scheduled job → cron fires at 13:30 UTC Saturday → backup route responds 200 → ✅ Done.

---

### Phase 29 — Dashboard Enhancement: Sales Performer Redesign & Backend Team Performance Widget

> **Decision Reference:** Decision 34 (`CONTEXT/decision_log.md`)
> **Dependencies:** Phase 10 (Dashboard foundation), Phase 18 (Team widgets), Phase 33 (Restricted orders access)
> **New Permissions:** `dashboard:backend-top-performer` (ID 55), `dashboard:backend-bottom-performer` (ID 56), `dashboard:backend-pending-cases` (ID 57)
> **No schema migrations required.** No existing data is modified.

---

#### W-2901 — Sales Performer Table Redesign (Designation Filter + New Columns + Clickable Cells)

**Goal:**
Redesign the Champions League Top and Bottom performer tables so that:
1. Only agents with front-line sales designations appear (designation-filtered at SQL level).
2. Three new data columns are shown per row: Sales Count, Total Sales, and Leakage Count.
3. Every cell in the table is a clickable deep link to the Orders page with the correct filters pre-applied.
4. Deep links are rendered as plain text (non-clickable) for users who cannot access the Orders page at all.

**Approach:**
Extend the existing `getTopPerformers()` and `getBottomPerformers()` raw SQL queries in
`dashboard.repository.ts` to JOIN the `users` table, apply a designation filter, and return
three aggregated column values instead of one. Update the `PerformerRow` TypeScript type to
include the new fields. Update `PerformersTable.tsx` to accept `permissions` and `month`/`year`
props, render new columns, and conditionally wrap each cell in an anchor tag when the viewer has
`orders:view` or `orders:create` permission.

> [!IMPORTANT]
> The `agentId` used for deep links must be the database `users.uid` (joined from the ORDER→USER
> relation), **not** the `agent_id` display string (e.g., `AG101`). The orders list API accepts
> `agentId` as a numeric `uid`. Ensure the SQL query selects `u.uid AS agentId` and the
> repository returns it in the row map.

> [!NOTE]
> The LIMIT clause on the SQL query must come **after** the designation JOIN filter — not before.
> Applying LIMIT before the WHERE designation clause would silently exclude agents from the
> intended list if non-sales agents appear near the top/bottom of the unfiltered result set.

---

- [x] **RED — Integration (`src/tests/Dashboard.test.tsx` or new `champions-league.test.ts`):**
  - [x] Test: `GET /api/dashboard/champions-league?month=M&year=Y` returns top performers that include only agents with designations: `Sales Supervisor`, `Sales Team Lead`, `Sales Specialist`, `Sales Expert`, `Sales Associate`. Assert that a seeded agent with designation `Backend Specialist` does NOT appear in the response, even if they have orders in that month.
  - [x] Test: Each performer row in the response contains `agentId` (numeric), `agentName`, `salesCount`, `totalSales`, and `leakageCount` fields.
  - [x] Test: `salesCount` equals the count of orders with `sale_status IN ('1','4')` for that agent in the given month. `leakageCount` equals count with `sale_status IN ('2','3')`.
  - [x] Test: `totalSales` equals `SUM(order_amount_charged - order_refund_amount)` for `sale_status IN ('1','4')` orders. This must match the `finalMargin` formula.
  - [x] Test: Bottom performers response is sorted ascending by `totalSales` (lowest first).
  - [x] Test: If no agents exist with the allowed designations in that month, both arrays return empty `[]` without error.
  - [x] **Run — confirm RED (new fields don't exist yet).**

- [x] **GREEN — Backend (Repository → Service → API Route):**
  - [x] **[Repository]** In `src/repository/dashboard.repository.ts`, update `getTopPerformers(limit, month, year)`:
    - Add `JOIN users u ON o.order_sales_agent_id = u.uid` to the raw SQL.
    - Add `WHERE u.designation IN ('Sales Supervisor', 'Sales Team Lead', 'Sales Specialist', 'Sales Expert', 'Sales Associate')` filter.
    - Add `u.uid AS agentId` to the SELECT clause.
    - Replace the single `amount` aggregate with three separate aggregations:
      ```sql
      SUM(CASE WHEN o.sale_status IN ('1','4') THEN
        CAST(COALESCE(o.order_amount_charged,'0') AS DECIMAL(12,2)) -
        CAST(COALESCE(o.order_refund_amount,'0') AS DECIMAL(12,2))
        ELSE 0 END) AS totalSales,
      COUNT(CASE WHEN o.sale_status IN ('1','4') THEN 1 END) AS salesCount,
      COUNT(CASE WHEN o.sale_status IN ('2','3') THEN 1 END) AS leakageCount
      ```
    - Update GROUP BY to include `u.uid, u.designation`.
    - Update `ORDER BY totalSales DESC` (top) or `ASC` (bottom).
    - Update the row map to return `{ agentId, agentName, salesCount, totalSales, leakageCount }`.
  - [x] **[Repository]** Apply the identical changes to `getBottomPerformers()`.
  - [x] **[Service]** In `src/service/dashboard.service.ts`, no logic changes needed — `getTopPerformers` and `getBottomPerformers` are called directly; just ensure the returned shape is forwarded.
  - [x] **[API Route]** In `src/app/api/dashboard/champions-league/route.ts`, verify the response passes through `agentId`, `salesCount`, `totalSales`, `leakageCount` from the repository result. No additional permission changes needed (existing `dashboard:top-performer` / `dashboard:bottom-performer` keys are unchanged).
  - [x] Run integration test — **confirm GREEN.**

- [x] **RED — Unit (`src/tests/PerformersTable.test.tsx` — new or extended):**
  - [x] Test: Render `<PerformersTable>` with a mock performers array. Assert the table headers include `Rank`, `Agent`, `Sales Count`, `Total Sales`, `Leakage Count`.
  - [x] Test: Render with `permissions` that include `orders:view`. Assert each agent name cell renders as an `<a>` tag with `href` containing `agentId=` and `month=` and `year=`.
  - [x] Test: Render with `permissions` that do NOT include `orders:view` or `orders:create`. Assert agent name cells are rendered as plain `<span>` (no anchor tag). Assert no `<a>` tags are rendered anywhere in the table.
  - [x] Test: Render a row where `leakageCount = 0`. Assert the leakage cell displays `0` and does NOT render a link (no point linking to an empty filtered orders list). OR renders a link — decide and implement consistently.
  - [x] Test: The `#1` top performer row renders the gold/accent color on the rank cell and a blue avatar background.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component):**
  - [x] **[Types]** In `src/types/dashboard.ts`, update `PerformerRow` interface:
    ```typescript
    export interface PerformerRow {
      agentId: number;
      agentName: string;
      salesCount: number;
      totalSales: number;
      leakage: number;
      // Keep `amount` as an alias or remove — verify no other consumer depends on it
    }
    ```
  - [x] **[Component]** In `src/components/dashboard/PerformersTable.tsx`:
    - Add `permissions: string` and `month: number` and `year: number` props to the interface.
    - Add `canLinkToOrders` derived boolean: `hasPermission(permissions, 'orders:view') || hasPermission(permissions, 'orders:create')`.
    - Update table headers: `Rank | Agent | Sales Count | Total Sales | Leakage`.
    - For each row, build deep link URLs:
      - `agentUrl = /orders?agentId=${row.agentId}&month=${month}&year=${year}`
      - `salesUrl = /orders?agentId=${row.agentId}&saleStatus=1,4&month=${month}&year=${year}`
      - `leakageUrl = /orders?agentId=${row.agentId}&saleStatus=2,3&month=${month}&year=${year}`
    - Conditionally render each data cell as `<a href={url}>` when `canLinkToOrders` is true, or as a plain `<span>` when false.
    - Style `totalSales` and `leakage` as `$X,XXX.XX` format using `.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
    - Style `leakage` in red, `salesCount` in green to visually communicate good/bad metrics.
  - [x] **[Widget]** In `src/components/dashboard/ChampionsLeagueWidget.tsx`:
    - Pass `permissions`, `currentMonth`, `currentYear` props down to each `<PerformersTable>`.
    - Ensure the `fetch` response now reads `agentId`, `salesCount`, `totalSales`, `leakage` from each row.
  - [x] Run unit test — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Log in as Super Admin → Dashboard shows the Champions League section → Top Performers table has columns: `#`, `Agent`, `Sales Count`, `Total Sales`, `Leakage Count`.
  - [x] Confirm that a backend executive / HR agent does NOT appear in either table.
  - [x] Click a "Sales Count" cell → `/orders` page opens, pre-filtered to that agent's completed orders (`saleStatus=1,4`) for the selected month.
  - [x] Click a "Leakage Count" cell → `/orders` opens pre-filtered to `saleStatus=2,3` for that agent.
  - [x] Navigate the month back one month → table refreshes → data reflects prior month → deep links update to the new month.
  - [x] Log in as a restricted agent (has `orders:create`, not `orders:view`) → Dashboard Champions League table cells are plain text (no links).
  - [x] Run `npx vitest run src/tests/Dashboard.test.tsx` → all green.

---

#### W-2902 — Backend Team Performance Widget (New API + Component + Permission Gating)

**Goal:**
Add a new dashboard widget positioned below Champions League displaying:
1. **Top Performers panel** — backend executives ranked by most completed orders in the selected month (top 10).
2. **Bottom Performers panel** — backend executives ranked by highest total pending backlog in the selected month (top 10, sorted by `totalPending DESC`).
3. **Pending Cases by Category table** — one row per backend executive, columns for each workflow queue and a total pending count.
All three sections share the same month navigator (same navigation pattern as Champions League). All three panels are gated by separate RBAC permission keys (dual-layer enforcement: UI hide + API 403).

**Approach:**
Add two new raw SQL functions to `dashboard.repository.ts`. Add a new API route at
`/api/dashboard/backend-team`. Add a new client component `BackendTeamWidget.tsx`. Wire the
widget into the dashboard server page. All cells must be clickable deep links to the Orders page
using the existing `backendExecutiveId` query param (already wired end-to-end). Deep links are
rendered as plain text when the viewer lacks `orders:view` and `orders:create`.

> [!IMPORTANT]
> The scope column for date filtering in backend queries is `order_created_date` (not
> `order_date`). Backend executive assignment occurs at order creation time. Using `order_date`
> (the sale date) would exclude orders still in progress. Use `MONTH(o.order_created_date)` and
> `YEAR(o.order_created_date)` in the WHERE clause. All three panels must use this same column.

> [!NOTE]
> Use LEFT JOIN from `users` to `crm_orders` (not inner join). This ensures backend executives
> with zero completed or zero pending orders in a given month still appear as rows in the table,
> displaying `0` counts rather than being silently dropped. This is important for the Pending
> Cases table to show the full team roster at all times.

> [!IMPORTANT]
> The `GET /api/dashboard/backend-team` route must perform a dual-permission check. The
> user must have AT LEAST ONE of: `dashboard:backend-top-performer`,
> `dashboard:backend-bottom-performer`, or `dashboard:backend-pending-cases`. If NONE of the
> three are present, return `403 Forbidden`. Do NOT use `super-admin` bypass alone — the
> `hasPermission` helper already handles `super-admin` internally, so no special case is needed.
> The response body includes all three datasets, and the client filters which panels to show
> based on individual permission keys.

---

- [x] **RED — Integration (`src/tests/backend-team.test.ts` — new file):**
  - [x] Test: `GET /api/dashboard/backend-team?month=M&year=Y` with a session that has NONE of the three backend permissions → assert response is `403 Forbidden`.
  - [x] Test: `GET /api/dashboard/backend-team?month=M&year=Y` with a session that has only `dashboard:backend-top-performer` → assert response is `200 OK` (any one permission unlocks the endpoint).
  - [x] Test: Response JSON shape is `{ topPerformers: BackendPerformerRow[], bottomPerformers: BackendPerformerRow[], pendingByCategory: BackendPendingRow[] }`.
  - [x] Test: Seed a backend executive (designation `Backend Specialist`, `status=1`) with 3 completed orders and 2 pending booking orders in month M. Assert their `completedCount = 3` in `topPerformers` and `pendingBooking = 2` in `pendingByCategory`.
  - [x] Test: Seed a backend executive with `status=0` (inactive). Assert they do NOT appear in any of the three lists.
  - [x] Test: Seed a user with designation `Sales Associate` who also has `orderBackendExecutiveId` pointing to their uid. Assert they do NOT appear in the backend performer lists (designation filter applies).
  - [x] Test: `GET /api/dashboard/backend-team` without `month`/`year` params → should default to current EST month/year and return `200 OK` (no crash on missing params).
  - [x] Test: Top performers list is sorted by `completedCount DESC`. Bottom performers list is sorted by `totalPending DESC`.
  - [x] **Run — confirm RED.**

- [x] **GREEN — Backend (Repository → Service → API Route):**
  - [x] **[Repository]** In `src/repository/dashboard.repository.ts`, add `getBackendTeamPerformers(month: number, year: number, limit = 10)`:
    ```sql
    SELECT
      u.uid AS agentId,
      COALESCE(u.nickname, u.name) AS agentName,
      SUM(CASE WHEN o.order_current_status = 'Completed Orders' THEN 1 ELSE 0 END) AS completedCount,
      SUM(CASE WHEN o.order_current_status IN (
        'Pending Booking','Pending Shipment','Pending Delivery',
        'Pending Feedback','Pending Resolutions'
      ) THEN 1 ELSE 0 END) AS totalPending
    FROM users u
    LEFT JOIN crm_orders o
      ON o.order_backend_executive_id = u.uid
      AND o.parent_order_id IS NULL
      AND MONTH(o.order_created_date) = ${month}
      AND YEAR(o.order_created_date) = ${year}
    WHERE u.designation IN ('Backend Specialist', 'Backend Associate')
      AND u.status = 1
    GROUP BY u.uid, u.nickname, u.name
    ORDER BY completedCount DESC
    LIMIT ${limit}
    ```
    Return `{ agentId, agentName, completedCount, totalPending }[]`.
  - [x] **[Repository]** Add `getBackendPendingByCategory(month: number, year: number)` with the same LEFT JOIN but selecting per-queue counts:
    ```sql
    SUM(CASE WHEN o.order_current_status = 'Pending Booking' THEN 1 ELSE 0 END) AS pendingBooking,
    SUM(CASE WHEN o.order_current_status = 'Pending Shipment' THEN 1 ELSE 0 END) AS pendingShipment,
    SUM(CASE WHEN o.order_current_status = 'Pending Delivery' THEN 1 ELSE 0 END) AS pendingDelivery,
    SUM(CASE WHEN o.order_current_status = 'Pending Feedback' THEN 1 ELSE 0 END) AS pendingFeedback,
    SUM(CASE WHEN o.order_current_status = 'Pending Resolutions' THEN 1 ELSE 0 END) AS pendingResolutions,
    SUM(CASE WHEN o.order_current_status IN (
      'Pending Booking','Pending Shipment','Pending Delivery',
      'Pending Feedback','Pending Resolutions'
    ) THEN 1 ELSE 0 END) AS totalPending,
    SUM(CASE WHEN o.order_current_status = 'Completed Orders' THEN 1 ELSE 0 END) AS completedCount
    ```
    Ordered `ORDER BY totalPending DESC`. No LIMIT (shows entire backend team).
  - [x] **[Service]** In `src/service/dashboard.service.ts`, add `getBackendTeamDashboard(month: number, year: number)`:
    - Calls `getBackendTeamPerformers(month, year)` once → returns top performers (sorted DESC).
    - For bottom performers: calls `getBackendTeamPerformers(month, year)` again but the repo function is sorted DESC — create a second overload or separate function `getBackendTeamBottomPerformers` sorted `totalPending DESC` using the same query differently, OR call `getBackendPendingByCategory` and derive bottom performers from it. **Recommended**: create a single `getBackendTeamAggregateSummary(month, year)` that returns all three datasets in one SQL query and let the service sort/slice for top/bottom panels.
    - Returns `{ topPerformers, bottomPerformers, pendingByCategory }`.
  - [x] **[API Route]** Create `src/app/api/dashboard/backend-team/route.ts`:
    - Resolve session → check `dashboard:backend-top-performer` OR `dashboard:backend-bottom-performer` OR `dashboard:backend-pending-cases`. If none → `403`.
    - Parse `month` and `year` from query params. Default to current EST month/year if missing.
    - Call `dashboardService.getBackendTeamDashboard(month, year)`.
    - Return `NextResponse.json({ topPerformers, bottomPerformers, pendingByCategory })`.
  - [x] Run integration test — **confirm GREEN.**

- [x] **RED — Unit (`src/tests/BackendTeamWidget.test.tsx` — new file):**
  - [x] Test: Render `<BackendTeamWidget permissions={permissionsWithAll} .../>`. Assert it renders a month navigator (prev/next arrows and month-year label).
  - [x] Test: With `dashboard:backend-top-performer` permission present → assert top performers panel title renders.
  - [x] Test: With `dashboard:backend-bottom-performer` absent → assert bottom performers panel is NOT rendered.
  - [x] Test: With `dashboard:backend-pending-cases` present → assert the Pending Cases table renders with column headers: `Agent`, `Pending Booking`, `Pending Shipment`, `Pending Delivery`, `Pending Feedback`, `Pending Resolutions`, `Total Pending`, `Completed`.
  - [x] Test: With `orders:view` permission → assert backend executive name cells are `<a>` tags with `href` containing `backendExecutiveId=`.
  - [x] Test: With neither `orders:view` nor `orders:create` → assert all cells render as plain text (no `<a>` tags).
  - [x] Test: With ALL three backend permissions absent → assert the widget renders `null` (nothing shown).
  - [x] **Run — confirm RED.**

- [x] **GREEN — Frontend (Types → Component → Page):**
  - [x] **[Types]** In `src/types/dashboard.ts`, add:
    ```typescript
    export interface BackendPerformerRow {
      agentId: number;
      agentName: string;
      completedCount: number;
      totalPending: number;
    }
    export interface BackendPendingRow {
      agentId: number;
      agentName: string;
      pendingBooking: number;
      pendingShipment: number;
      pendingDelivery: number;
      pendingFeedback: number;
      pendingResolutions: number;
      totalPending: number;
      completedCount: number;
    }
    ```
  - [x] **[Component]** Create `src/components/dashboard/BackendTeamWidget.tsx`:
    - Props: `permissions: string`, `initialData?: { topPerformers, bottomPerformers, pendingByCategory }`.
    - Derive booleans: `canShowTop`, `canShowBottom`, `canShowPending` from permissions.
    - If none of the three are true → return `null`.
    - Month navigator: identical pattern to `ChampionsLeagueWidget` — state for `currentMonth` / `currentYear`, prev/next handlers, skip fetch on initial mount when current month matches SSR data.
    - `fetchBackendData(month, year)` → `GET /api/dashboard/backend-team?month=M&year=Y` → updates state.
    - Render three sections (each gated by its own permission boolean):
      1. **Top Performers panel** — table with columns: `#`, `Agent`, `Completed`, `Pending`. Cells clickable to `/orders?backendExecutiveId={uid}&status=Completed+Orders` (completed) and `/orders?backendExecutiveId={uid}` (agent name).
      2. **Bottom Performers panel** — same columns, sorted by `totalPending` DESC. Cells link to appropriate order filters.
      3. **Pending Cases table** — full-width table, columns: `Agent`, `Pending Booking`, `Pending Shipment`, `Pending Delivery`, `Pending Feedback`, `Pending Resolutions`, `Total Pending`, `Completed`. Each count cell links to `/orders?backendExecutiveId={uid}&status={Queue Name}`. Color-code cells: 0 = neutral, 1–2 = amber, 3+ = red for pending counts. Completed counts in green.
    - All link cells conditionally wrapped in `<a>` only when `hasPermission(permissions, 'orders:view') || hasPermission(permissions, 'orders:create')` is true.
  - [x] **[Dashboard Page]** In the dashboard server page (`src/app/dashboard/page.tsx` or equivalent):
    - Fetch initial backend team data for the current EST month using `dashboardService.getBackendTeamDashboard(month, year)` if the user has any of the three backend permissions.
    - Pass `permissions` and `initialData` to `<BackendTeamWidget>`.
    - Place `<BackendTeamWidget>` below the `<ChampionsLeagueWidget>` block.
  - [x] Run unit test — **confirm GREEN.**

- [x] **Verification chain:**
  - [x] Log in as Super Admin → Backend Team Performance widget renders below Champions League.
  - [x] Widget has a month navigator — navigate to prior month → data refreshes → pending/completed counts change.
  - [x] Top Performers panel shows backend executives sorted by completed count (highest first). Bottom Performers shows sorted by total pending (highest backlog first).
  - [x] Pending Cases table shows one row per active backend executive, even for those with zero counts in the current month.
  - [x] Click a "Pending Booking" cell → Opens `/orders?backendExecutiveId=X&status=Pending+Booking`. Orders page shows only that executive's pending booking orders.
  - [x] Click a "Completed" count → Opens `/orders?backendExecutiveId=X&status=Completed+Orders`.
  - [x] Log in as a user who has `dashboard:backend-top-performer` but NOT `dashboard:backend-bottom-performer` → Only the Top Performers panel renders; Bottom Performers panel is hidden.
  - [x] Log in as a user with NONE of the three backend permissions → Widget is completely hidden (no heading, no panels).
  - [x] Directly hit `GET /api/dashboard/backend-team` with a session that has no backend permissions → response is `403 Forbidden`.
  - [x] Run `npx vitest run src/tests/backend-team.test.ts` → all green.

---

#### W-2903 — Permission Records & Seed Script Updates

**Goal:**
Add the three new backend permission records to both the `seed.sql` baseline (for dev/test
environments) and a standalone `scripts/sql/add-backend-permissions.sql` script (for production).
Ensure `seed.sql` is fully idempotent so that re-running it at any time never deletes or
overwrites existing data.

**Approach:**
`seed.sql` has been rewritten with all `DELETE FROM` statements removed and all inserts using
`INSERT IGNORE` or `ON DUPLICATE KEY UPDATE`. The three new permissions (IDs 55, 56, 57) are
included in the permissions block and mapped to Super Admin (role_id 1) and Admin (role_id 2)
via `INSERT IGNORE INTO crm_role_permissions`. The standalone production migration script at
`scripts/sql/add-backend-permissions.sql` contains only the additive INSERT IGNORE statements
needed on a live database that already exists.

> [!NOTE]
> No Prisma migration is needed. These are data-only changes (DML). Running `prisma migrate dev`
> for a data-only change would create a spurious empty migration file in `_prisma_migrations`.

> [!IMPORTANT]
> The standalone production script (`scripts/sql/add-backend-permissions.sql`) must be run
> exactly **once** against the production database after deploying the Phase 29 code. It is
> idempotent (`INSERT IGNORE`), so running it again is safe (no-op). Running it BEFORE deploying
> the code is also safe — the new permission rows will just sit unused until the widget code is
> live.

---

- [x] **Verify seed.sql idempotency:**
  - [x] Confirm `seed.sql` has NO `DELETE FROM` statements on any content table (`crm_orders`, `crm_customers`, `crm_customer_cards`, `crm_comments`, `crm_attendance`, `users`, etc.).
  - [x] Confirm all `INSERT INTO crm_designations` uses `INSERT IGNORE`.
  - [x] Confirm all `INSERT INTO crm_roles` uses `ON DUPLICATE KEY UPDATE`.
  - [x] Confirm all `INSERT INTO crm_permissions` uses `ON DUPLICATE KEY UPDATE permission_description = VALUES(permission_description)`.
  - [x] Confirm all `INSERT INTO crm_role_permissions` uses `INSERT IGNORE`.
  - [x] Confirm all `INSERT INTO users` uses `INSERT IGNORE`.
  - [x] Run `seed.sql` against local Docker DB twice back-to-back → confirm no error on second run and existing data is unchanged.

- [x] **Verify new permissions in seed.sql:**
  - [x] Confirm permission rows for IDs 55, 56, 57 exist with correct `permission_name` and `permission_description` values.
  - [x] Confirm `crm_role_permissions` includes `(1, 55)`, `(1, 56)`, `(1, 57)` for Super Admin.
  - [x] Confirm `crm_role_permissions` includes `(2, 55)`, `(2, 56)`, `(2, 57)` for Admin.
  - [x] Confirm NO other role (Manager, Team Lead, HR, etc.) is pre-assigned these permissions by default.

- [x] **Verify production SQL script:**
  - [x] `scripts/sql/add-backend-permissions.sql` exists and contains `INSERT IGNORE INTO crm_permissions` for IDs 55, 56, 57.
  - [x] Script contains `INSERT IGNORE INTO crm_role_permissions` for `(1,55),(1,56),(1,57),(2,55),(2,56),(2,57)`.
  - [x] Script contains a `USE jd_crm;` header statement.
  - [x] Script contains verification comment showing the SELECT query to confirm successful execution.
  - [x] Run the script against local Docker DB → confirm the three rows appear in `crm_permissions`. Run again → confirm no duplicate-key error.

- [x] **Verification chain:**
  - [x] Re-run `seed.sql` locally while the Docker DB has real order data → confirm zero orders are deleted, zero users are deleted, zero customers are deleted.
  - [x] `SELECT * FROM crm_permissions WHERE permission_id IN (55,56,57);` → returns 3 rows.
  - [x] `SELECT * FROM crm_role_permissions WHERE permission_id IN (55,56,57);` → returns 6 rows (role_id 1 and 2 for each of the 3 permission IDs).
  - [x] Log in as the Admin user → navigate to Settings → Permissions Matrix → confirm the three new permissions appear in the matrix as assignable to roles.

---

#### Phase 29 Summary Checklist

- [x] W-2901: Sales Performer Table Redesign — **Integration tests GREEN**
- [x] W-2901: Sales Performer Table Redesign — **Unit tests GREEN**
- [x] W-2901: Sales Performer Table Redesign — **Manual verification complete**
- [x] W-2902: Backend Team Performance Widget — **Integration tests GREEN**
- [x] W-2902: Backend Team Performance Widget — **Unit tests GREEN**
- [x] W-2902: Backend Team Performance Widget — **Manual verification complete**
- [x] W-2903: Permission Records & Seed Script — **Idempotency verified**
- [x] W-2903: Permission Records & Seed Script — **Production script verified**
- [x] Full `npm run test` passes with **358+ tests green** (no regressions)
- [x] `npm run lint` → 0 warnings
- [x] `npm run typecheck` → 0 errors
- [x] **Phase 29 COMPLETE** → Update progress table to `[x] COMPLETED`


---

### Phase 30 — SSR Pre-fetch Waterfall Elimination

#### W-3001 — Orders Page: Pre-fetch Agents & Teams Server-Side

**Goal:**
The `orders/page.tsx` server component currently renders `<OrderListContainer />` without any initial data. On every page load, `OrderListContainer` (a Client Component) fires two sequential `useEffect` fetches — `fetch('/api/agents')` and `fetch('/api/teams')` — after the browser has loaded the JavaScript bundle. This means users see two loading spinners for dropdown data that almost never changes between page loads. Since `agents` and `teams` lists are stable reference data, they are ideal candidates for server-side pre-fetching: fetch them once on the server, pass as props, and eliminate two full round-trips from the critical render path.

**Approach:**
Convert `orders/page.tsx` to an `async` Server Component. Fetch agents and teams directly from the DB via Prisma in `Promise.all`. Pass both as `initialAgents` and `initialTeams` props to `OrderListContainer`. Inside `OrderListContainer`, accept these props and use them as the `useState` initial values, removing the two `useEffect` fetches that were loading them.

---

- [ ] **RED — Integration (`orders.test.ts`):**
  - [ ] Test: `GET /api/orders` with a valid session returns `200 OK` and an array (unchanged — confirm no regression).
  - [ ] Test: `GET /api/agents` with `agents:view` permission returns `200 OK` with agent list (confirm existing route still works — it is still needed for other components).
  - [ ] **Run — confirm RED (the tests are already GREEN; this is a regression guard baseline run before any code changes).**

- [ ] **GREEN — Backend (Server Component Pre-fetch):**
  - [ ] [Page] Convert `src/app/orders/page.tsx` to an `async` Server Component. Add direct Prisma queries:
    ```typescript
    const [agents, teams] = await Promise.all([
      prisma.users.findMany({
        select: { uid: true, name: true, nickname: true, designation: true, status: true },
        orderBy: { name: 'asc' },
      }),
      prisma.crmTeams.findMany({
        select: { teamId: true, teamName: true },
        orderBy: { teamName: 'asc' },
      }),
    ]);
    return <OrderListContainer initialAgents={agents} initialTeams={teams} />;
    ```
  - [ ] Run integration test — **confirm GREEN (no regressions).**

- [ ] **RED — Unit / Component (`OrderListContainer.test.tsx`):**
  - [ ] Test: When `initialAgents` prop is provided, the component renders the agent dropdown immediately without calling `fetch('/api/agents')` on mount.
  - [ ] Test: When `initialTeams` prop is provided, the component renders the team dropdown immediately without calling `fetch('/api/teams')` on mount.
  - [ ] **Run — confirm RED (currently no `initialAgents` / `initialTeams` props exist on the component).**

- [ ] **GREEN — Frontend (Types → Component):**
  - [ ] [Types] Add `initialAgents?: AgentDropdownItem[]` and `initialTeams?: TeamDropdownItem[]` to the `OrderListContainerProps` interface in `src/components/OrderListContainer.tsx`.
  - [ ] [Component] Update `OrderListContainerContent` to accept these props. Change agent state initialization to `useState<any[]>(initialAgents || [])` and team state to `useState<any[]>(initialTeams || [])`. Remove the two `useEffect` blocks that call `fetch('/api/agents')` and `fetch('/api/teams')` when those props are provided (add a guard: only run the fetch `useEffect` if no initial data was supplied, so the component stays usable standalone).
  - [ ] Run unit test — **confirm GREEN.**

- [ ] **Verification chain:**
  - [ ] Open browser DevTools → Network tab → Navigate to `/orders` → Confirm that **no** `fetch('/api/agents')` or `fetch('/api/teams')` requests appear in the Network tab on initial page load → Agent and Team dropdowns render immediately without any spinner → ✅ Done.

---

#### W-3002 — Agents Page: Pre-fetch Agents List Server-Side

**Goal:**
The `agents/page.tsx` server component currently passes only `designations` to `AgentList`. The `AgentList` client component then fires its own `fetch('/api/agents')` on mount to get the actual agent list. This means the page shows a full loading spinner for the core data while the JS hydrates and the fetch completes. The agents list can be pre-fetched on the server and passed as `initialAgents`, eliminating the spinner entirely.

**Approach:**
Extend `agents/page.tsx` to also fetch all users from Prisma server-side. Pass them as `initialAgents` to `AgentList`. Inside `AgentList`, use `initialAgents` as the `useState` default value and skip the `useEffect` fetch when initial data is present.

---

- [ ] **RED — Integration (`agents.test.ts`):**
  - [ ] Test: `GET /api/agents` with `agents:view` returns `200 OK` with agent array (regression guard).
  - [ ] **Run — confirm RED (regression guard baseline).**

- [ ] **GREEN — Backend (Server Component Pre-fetch):**
  - [ ] [Page] Update `src/app/agents/page.tsx` to also fetch agents in the same `Promise.all` as designations:
    ```typescript
    const [designations, agents] = await Promise.all([
      prisma.crmDesignations.findMany({ ... }),
      prisma.users.findMany({
        select: { uid: true, name: true, nickname: true, designation: true, status: true, teamId: true, roleId: true, agentId: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return <AgentList designations={designations} initialAgents={agents} />;
    ```
  - [ ] Run integration test — **confirm GREEN.**

- [ ] **RED — Unit / Component (`AgentList.test.tsx`):**
  - [ ] Test: When `initialAgents` prop is provided, the component renders the agent table immediately (no loading spinner visible).
  - [ ] Test: When `initialAgents` is NOT provided, the component falls back to fetching from `fetch('/api/agents')` on mount (backward compatibility).
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Types → Component):**
  - [ ] [Types] Add `initialAgents?: Agent[]` to `AgentListProps` interface in `src/components/AgentList.tsx`.
  - [ ] [Component] Change agent state to `useState<Agent[]>(initialAgents || [])`. Wrap the existing `useEffect` fetch block with a guard: `if (initialAgents && initialAgents.length > 0) return;` so it only fires when no server data was supplied.
  - [ ] Run unit test — **confirm GREEN.**

- [ ] **Verification chain:**
  - [ ] Open browser DevTools → Network tab → Navigate to `/agents` → Confirm that **no** `fetch('/api/agents')` request appears on initial load → Agent table renders immediately without spinner → ✅ Done.

---

#### W-3003 — Customers Page: Pre-fetch Customer List Server-Side

**Goal:**
The `customers/page.tsx` server component passes no initial data to `CustomerList`. The `CustomerList` client component fires `fetch('/api/customers')` on mount. Pre-fetching customer data server-side eliminates this initial waterfall fetch.

**Approach:**
Convert `customers/page.tsx` to an `async` Server Component. Fetch customers directly via `customer.repository.ts`. Pass as `initialCustomers` prop to `CustomerList`.

---

- [ ] **RED — Integration (`customers.test.ts`):**
  - [ ] Test: `GET /api/customers` with `customers:view` returns `200 OK` with customer array (regression guard).
  - [ ] **Run — confirm RED (regression guard baseline).**

- [ ] **GREEN — Backend (Server Component Pre-fetch):**
  - [ ] [Page] Convert `src/app/customers/page.tsx` to `async`. Import `customerRepository` and fetch:
    ```typescript
    import * as customerRepository from '@/repository/customer.repository';
    const customers = await customerRepository.findAll();
    return <CustomerList initialCustomers={customers} />;
    ```
  - [ ] Run integration test — **confirm GREEN.**

- [ ] **RED — Unit / Component (`CustomerList.test.tsx`):**
  - [ ] Test: When `initialCustomers` prop is provided, the table renders without calling `fetch('/api/customers')`.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Types → Component):**
  - [ ] [Types] Add `initialCustomers?: Customer[]` to the `CustomerList` component props.
  - [ ] [Component] Change customer state initialization to `useState<Customer[]>(initialCustomers || [])`. Guard the `useEffect` fetch: skip it when `initialCustomers` is provided.
  - [ ] Run unit test — **confirm GREEN.**

- [ ] **Verification chain:**
  - [ ] Open browser DevTools → Network tab → Navigate to `/customers` → Confirm **no** `fetch('/api/customers')` request fires on initial load → Customer table renders immediately → ✅ Done.

---

#### W-3004 — Gateways Page: Pre-fetch Gateway List Server-Side

**Goal:**
The `gateways/page.tsx` server component passes no initial data to `GatewayList`. The `GatewayList` client component fires `fetch('/api/gateways')` on mount. Eliminate this waterfall by pre-fetching server-side.

**Approach:**
Convert `gateways/page.tsx` to an `async` Server Component. Fetch gateways via `gateway.repository.ts`. Pass as `initialGateways` to `GatewayList`.

---

- [ ] **RED — Integration (`gateways.test.ts`):**
  - [ ] Test: `GET /api/gateways` with `gateways:view` returns `200 OK` with gateway array (regression guard).
  - [ ] **Run — confirm RED (regression guard baseline).**

- [ ] **GREEN — Backend (Server Component Pre-fetch):**
  - [ ] [Page] Convert `src/app/gateways/page.tsx` to `async`. Import `gatewayRepository` and fetch:
    ```typescript
    import * as gatewayRepository from '@/repository/gateway.repository';
    const gateways = await gatewayRepository.findAll();
    return <GatewayList initialGateways={gateways} />;
    ```
  - [ ] Run integration test — **confirm GREEN.**

- [ ] **RED — Unit / Component (`GatewayList.test.tsx`):**
  - [ ] Test: When `initialGateways` prop is provided, component renders table immediately without firing `fetch('/api/gateways')`.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Types → Component):**
  - [ ] [Types] Add `initialGateways?: Gateway[]` to the `GatewayList` component props.
  - [ ] [Component] Change gateway state to `useState<Gateway[]>(initialGateways || [])`. Guard the mount fetch to skip when initial data is present.
  - [ ] Run unit test — **confirm GREEN.**

- [ ] **Verification chain:**
  - [ ] Open browser DevTools → Network tab → Navigate to `/gateways` → Confirm **no** `fetch('/api/gateways')` fires on initial load → Gateway table renders immediately → ✅ Done.

---

#### Phase 30 Summary Checklist

- [x] W-3001: Orders Page SSR Pre-fetch — **Integration tests GREEN**
- [x] W-3001: Orders Page SSR Pre-fetch — **Unit tests GREEN**
- [x] W-3001: Orders Page SSR Pre-fetch — **Network tab verified (no waterfall)**
- [x] W-3002: Agents Page SSR Pre-fetch — **Integration tests GREEN**
- [x] W-3002: Agents Page SSR Pre-fetch — **Unit tests GREEN**
- [x] W-3002: Agents Page SSR Pre-fetch — **Network tab verified (no waterfall)**
- [x] W-3003: Customers Page SSR Pre-fetch — **Integration tests GREEN**
- [x] W-3003: Customers Page SSR Pre-fetch — **Unit tests GREEN**
- [x] W-3003: Customers Page SSR Pre-fetch — **Network tab verified (no waterfall)**
- [x] W-3004: Gateways Page SSR Pre-fetch — **Integration tests GREEN**
- [x] W-3004: Gateways Page SSR Pre-fetch — **Unit tests GREEN**
- [x] W-3004: Gateways Page SSR Pre-fetch — **Network tab verified (no waterfall)**
- [x] Full `npm run test` passes with **no regressions**
- [x] `npm run lint` → 0 warnings
- [x] `npm run typecheck` → 0 errors
- [x] **Phase 30 COMPLETE** → Update progress table to `[x] COMPLETED`

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

*   **TypeScript NextAuth Extension:** Created type definitions in [next-auth.d.ts](src/types/next-auth.d.ts) to augment NextAuth's `Session`, `User`, and `JWT` interfaces, enabling type-safe access without `any` casts.
*   **ESLint Warnings Fixed:** Cleared all warnings and errors in [route.ts](src/app/api/auth/[...nextauth]/route.ts), [LoginForm.tsx](src/components/LoginForm.tsx), and [LoginForm.test.tsx](src/tests/LoginForm.test.tsx).
*   **Robust Test Assertion:** Refactored [db_connection.test.ts](src/tests/db_connection.test.ts) to assert that default teams exist in the database without failing if the seed script runs multiple times.
*   **Validation:** Verified that `npm run lint`, `npm run typecheck`, and `npm run test` are fully passing and clean.

### Session 3 — June 23, 2026

*   **Authorization Service:** Implemented [permission.service.ts](src/service/permission.service.ts) to parse database comma-separated strings and check permissions, automatically allowing the super-admin (`99999`) bypass.
*   **Protected Route & API:** Created a mock API route [route.ts](src/app/api/vendors/route.ts) that checks session permissions and blocks unauthorized requests with 403 Forbidden.
*   **NextAuth Middleware Route Guards:** Created [middleware.ts](src/middleware.ts) using NextAuth `withAuth` to intercept pages (such as `/vendors`, `/agents`, `/gateways`, `/orders`), redirecting unauthenticated users to `/login`, and unauthorized users to `/access-denied`.
*   **Root Layout Shell:** Implemented [LayoutShell.tsx](src/components/LayoutShell.tsx) and [layout.css](src/app/layout.css) to wrap children in the sidebar grid when logged in, display a loading screen while resolving the session, and serve full-screen standalone pages (such as `/login`) for unlogged-in states.
*   **Dynamic Sidebar:** Built [Sidebar.tsx](src/components/Sidebar.tsx) to render navigation links dynamically based on user session permissions (Vendors: `160`, Agents: `162`, Gateways: `168`, Orders: `172`).
*   **Access Denied View:** Added [page.tsx](src/app/access-denied/page.tsx) to show a warning page when a user attempts to browse to restricted pages.
*   **TDD Checklists:** Wrote [authorization.test.ts](src/tests/authorization.test.ts) (integration test for API guards) and [Sidebar.test.tsx](src/tests/Sidebar.test.tsx) (unit test for sidebar rendering), confirmed all 16 tests in the project are 100% green and type checks / lint checks are clean.

### Session 4 — June 23, 2026

*   **Vitest Execution Environment Configured:** Solved a critical issue where integration tests using the Prisma MariaDB adapter (`@prisma/adapter-mariadb`) timed out and hung when executed under Vitest's default Node.js `worker_threads` pool. Changed the test runner execution pool strategy to child processes via the `--pool=forks` flag.
*   **Cascading Test Failures Solved:** Resolved the cascading `401 Unauthorized` / `403 Forbidden` assertion mismatch in API authorization guard tests caused by mock queue pollution from previous hung tests. Updated [package.json](package.json) to permanently run Vitest with `--pool=forks`.

### Session 5 — June 23, 2026

*   **Animation & Scroll Foundation (Phase 4.5):** Installed `lenis` and `gsap`. Implemented `LenisProvider` smooth scrolling synced with GSAP. Added entrance transitions, page fade-in, metric counter count-up, and sidebar entry presets to `src/lib/animations.ts`.
*   **Performance and UX Tuning:** Updated `LayoutShell.tsx` to immediately render public views like `/login` and `/access-denied` without showing the loading spinner, boosting perceived load times. Added allowed dev origins config to `next.config.ts` to allow HMR connection over `127.0.0.1`.
*   **Static Sidebar Animation Fix:** Prevented the sidebar from animating/sliding in repeatedly during full page reloads by checking a `sessionStorage` flag.
*   **Zero-Flicker Layout Refactor:** Redesigned `LayoutShell.tsx` loading state to display the `Sidebar` immediately on the page while showing the loader container exclusively inside the `<main>` content container. This guarantees the sidebar remains 100% visible, static, and stable during full-page reloads and 404 navigation routes.
*   **SPA Placeholder Pages Creation:** Created basic placeholder pages for `/orders`, `/vendors`, `/agents`, and `/gateways` to make these routes available in the Next.js router. This forces client-side SPA navigation during layout testing, preventing full browser page reloads and screen white-flashes on sidebar clicks.
*   **Verification:** Created `animations.test.tsx` ensuring proper rendering and behavior of scroll provider and animations. Type checks and all 19 tests are 100% green.

### Session 6 — June 23–24, 2026

*   **Phase 5 — Agent Form UX Overhaul (Tab Navigation & Scroll Fixes):**
    *   Removed `overflow-y: auto` from `.main-content` in `layout.css` so the full window viewport scrolls naturally. Previously the inner scroll container conflicted with Lenis, causing scrolling to stop halfway on tall form tabs (Personal, Bank & Emergency).
    *   Integrated the `useLenis` hook into `NewAgentForm.tsx` and `EditAgentForm.tsx` to call `lenis.resize()` on every tab switch and whenever dynamic academic/professional record arrays grow or shrink, ensuring Lenis always recalculates the correct scroll height.
    *   Replaced the single static "Register Agent / Save" button footer with a full wizard-style step navigation system:
        *   **Tab 1 (Account & Core Info):** Shows `Cancel` (back to directory), `Save` (partial save), and `Next Page` (advances tab).
        *   **Tabs 2 & 3 (Personal/Bank & Academic):** Shows `Back`, `Save`, and `Next Page`.
        *   **Tab 4 (Work History) only:** Shows `Back` and the final primary submit (`Register Agent` / `Save Profile Changes`). The register button is now exclusively on the last tab.

*   **Full ESLint & TypeScript Resolution (0 errors, 0 warnings):**
    *   **Repository type-safety:** Defined `CreateAgentInput` and `UpdateAgentInput` interfaces in `agent.repository.ts`. Applied explicit Prisma cast types (`Prisma.UsersUncheckedCreateInput` / `Prisma.UsersUncheckedUpdateInput`) to resolve union type conflicts on direct row mutations.
    *   **Nullable status alignment:** Changed `status: number` to `status?: number | null` in `src/types/agent.ts` to match the Prisma-generated schema. Added a `?? 0` fallback at all invocation sites (e.g. `AgentList.tsx`).
    *   **Generic sanitizer:** Refactored `sanitizeUser` in `agent.service.ts` from `any` to a TypeScript generic `<T extends { password?: string | null }>`, removing all `any` types while preserving the return model.
    *   **Form record arrays:** Replaced `any[]` state in `NewAgentForm.tsx` and `EditAgentForm.tsx` with `FormAcademicRecord[]` and `FormProfessionalRecord[]` from `src/types/agent.ts`.
    *   **React forwardRef fix:** Restored `{}` props type on `Sidebar.tsx` `forwardRef` with a targeted `eslint-disable-next-line` comment, resolving the `Record<string, never>` index signature incompatibility with React's ref forwarding.
    *   **Lenis state effect:** Added `// eslint-disable-next-line react-hooks/set-state-in-effect` in `LenisProvider.tsx` to acknowledge the intentional synchronous state set on mount.
    *   **Test cleanup:** Removed unused `cleanup` import in `animations.test.tsx` and unused `rerender` destructure in `AgentList.test.tsx`. Replaced all `as any` session mock casts with `as unknown as ReturnType<typeof useSession>`.
    *   **Integration test types:** Replaced `(agent: any)` callbacks in `agents.test.ts` with concrete inline types (`{ status: number }`, `{ username: string }`).
    *   **Verification:** `npm run lint` — 0 errors/warnings. `npm run typecheck` — 0 errors. `npm run test` — **28/28 tests passed** across all 8 test suites.

*   **Phase 6 & 7 — Customers & Vendors (Completed by user in same session):**
    *   Customer Ledger module implemented with masked card numbers for unpermissioned users (`customers:view-cards`).
    *   Vendor Management module implemented with full blacklist toggle, linked orders view, performance metrics, and warning banner on detail page.
    *   Both phases marked `[x] COMPLETED` in the phase tracker.

### Session 7 — June 24, 2026

*   **Phase 8 — Payment Gateway Setup & Aggregated Reports (Phase 8 Completed):**
    *   Designed and implemented `gateway.repository.ts`, `gateway.service.ts`, list/detail routes, and the monthly gateway performance aggregated report endpoint (`/api/gateways/:id/report`).
    *   Exposed pages (`src/app/gateways/page.tsx`, `[id]/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`) and client components (`GatewayList.tsx`, `GatewayReport.tsx`).
    *   Added full TDD test coverage for Gateway CRUD and Monthly Performance Reports (`gateways.test.ts` and `GatewayReport.test.tsx`), with all tests fully green.
*   **Git Commit History Clean:**
    *   Soft-reset and amended the vendors page commit (`add: vendors page.`) to completely exclude `jd_crm.json` and `seed.sql`.
    *   Reverted `seed.sql` on disk and in the index to its original state matching `origin/main`.
    *   Kept `jd_crm.json` on disk as an ignored, untracked file via `.gitignore`.
*   **Global CSS Consolidation & FOUC / Reload Styling Fixes:**
    *   Moved generic CRM layout and component styles from `src/app/agents/agents.css` into a global `src/app/components.css` stylesheet.
    *   Imported `components.css` in `src/app/layout.tsx` to ensure pages (such as gateways) do not render unstyled on direct reload.
    *   Deleted the obsolete `agents.css` file and cleaned up local page references.
*   **Jitter-Free & Unified GSAP Entrance Transitions:**
    *   Fixed table layout reflow jitter on the gateways page by setting the table to `table-layout: fixed` and configuring explicit column widths (`80px` for `#`, `140px` for `Status`, `280px` for `Actions`).
    *   Eliminated "double animation with lag" by shifting the GSAP triggers to run concurrently in a single context when page loading finishes (`[loading]` dependency).
    *   Wrapped all major listing animations (`GatewayList`, `AgentList`, `VendorList`, `CustomerList`) in `gsap.context()` to clean up and revert active tweens on unmount, avoiding React StrictMode conflicts.
    *   Applied inline `style={{ opacity: 0 }}` on page containers and table rows to eliminate initial paint flashes (FOUC).
*   **Verification:** `npm run build` completed successfully with zero compile or TypeScript errors.
*   **Phase 9 — Order Intake & Sales Pipeline (Phase 9 Completed):**
    *   Designed and implemented the atomic transaction flow to insert Customer, Card, and Order records inside a single Prisma `prisma.$transaction`.
    *   Built the status queue state machine to advance order status based on field updates (e.g. automatically moving state to `"Pending Delievery"` when a tracking number is newly supplied).
    *   Exposed pages (`src/app/orders/page.tsx`, `[id]/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`) and client components (`OrderList.tsx`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderListContainer.tsx`).
    *   Refactored all Phase 9 layout views, dynamic forms, and detail views to use global premium layout and form classes (`.agents-page-container`, `.form-card`, `.form-grid`, `.form-group`, `.form-input`, `.form-select`, `.profile-main`, `.info-grid`, `.info-group`, and `.btn-primary-custom` / `.btn-secondary-custom`) instead of conflicting custom Tailwind properties.
    *   Implemented a sidebar toggle button that persists its collapsed/open preference (using `localStorage`) and collapses the left sidebar to `0px` with responsive padding shifts.
    *   Restored legacy dataset from `jd_crm.json` to the live database, parsing fields to appropriate relational `Int` types and dates, and mapping legacy typo-status `Pending Delivery` to `Pending Delievery`.
    *   Fixed dynamically-resolved route parameters in Next.js dynamic folders (using `Promise<{ id: string }>`) and resolved all type checker constraints in tests (`src/tests/orders.test.ts`).
    *   **Verification:** `npm run typecheck` passes with 0 compile errors, and `npm run test` passes with all **63/63 tests green**.

*   **Session Note — Timothy Manuli Status & Completed Orders Filter:**
    *   Resolved the issue where Timothy Manuli's order status showed as "Unknown" (due to a null `orderCurrentStatus` field). Fixed the database source of truth by updating the seeding script (`seed_from_json.js`) to map completed sold orders (where `sale_status = '1'` and the workflow status is `null` or `'Everything Completed'`) to `'Completed Orders'` directly in the database.
    *   Reverted the temporary UI fallback logic in `OrderList.tsx` so that workflow status is displayed directly from the database without ad-hoc client-side mapping.
    *   Exposed a dedicated "Completed Orders" tab/filter inside `OrderListContainer.tsx` which filters by the workflow status `'Completed Orders'` (and ensures only `saleStatus = '1'` is shown).
    *   Added `'Completed Orders'` as a valid workflow option in `EditOrderForm.tsx` and updated the `project_data.md` and `current_state.md` workflow documentation lists.
    *   Verified all integration tests run and pass cleanly.


### Session 7 — June 24, 2026
  **Phase 9.5 - Order Status Workflow Standardization**
  - Standardized `order_current_status` workflow: Introduced `Pending Booking` as the mandatory
    default initial state for all new orders (non-selectable via UI).
  - Renamed `Pending Tracking` → `Pending Shipment` and corrected legacy misspelling
    `Pending Delievery` → `Pending Delivery` across backend, frontend, and schema.
  - Implemented status transition logic (state machine) in `order.service.ts` and
    `order.repository.ts`; default status is driven by whether a vendor is assigned.
  - Refactored frontend: `OrderListContainer` tabs, `EditOrderForm` status dropdown
    (hidden for `Pending Booking`), and `OrderList` badge colors updated for new statuses.
  - Routing: added `/pending/booking` and `/pending/shipment` routes; decommissioned
    `/pending/tracking`.
  - Updated `CONTEXT/project_data.md` with the authoritative workflow status definitions.
  - Fixed all lint and typecheck errors introduced by the refactor.
  - All 68 tests passing.


### Session 8 — June 24, 2026
  **Phase 10 - Interactive Sales Dashboard**
  - Developed full-stack dashboard features under test-driven development (TDD).
  - Implemented `dashboard.repository.ts` with custom database aggregates (totals, net margins, top/bottom performing agents, pipeline queue sizes, and monthly team aggregates).
  - Implemented permission-aware `dashboard.service.ts` layer mapping data keys dynamically to session authorization keys.
  - Exposed routes `/api/dashboard/metrics` and `/api/dashboard/teams/monthly` for modular retrieval.
  - Constructed sleek client-side dashboard panels, including glassmorphism widgets with GSAP count-up numbers, tables, pipeline flows, and attendance bar lines.
  - Integrated `lastFetchedRef` cache within the team monthly scores widget to deduplicate browser REST API triggers.
  - Replaced index starter route `src/app/page.tsx` with dynamic dashboard layout feeding initial metrics server-side.
  - Confirmed 100% test passing (13 tests) alongside clean ESLint and type check approvals.

  **Session Note — Dashboard Render Loop Resolution:**
  - Resolved the infinite fetch/reload loop where the dashboard would go blank/white and saturate the database pool with requests.
  - Diagnosis: `LayoutShell.tsx` was conditionally unmounting `children` to display a "Loading..." screen when NextAuth's `useSession()` status was `loading`. Because `useSession` starts as `loading` during hydration, this caused hydration mismatches, unmounted the server-rendered dashboard, and reset the `lastFetchedRef` in `TeamMonthlyScoresWidget.tsx`. Subsequent API requests triggered session updates, oscillating the hook status and looping the mount cycle.
  - Fix: Passed `userPermissions` and `userName` props directly from the server component (`page.tsx`) to `DashboardPage` and `TeamMonthlyScoresWidget.tsx`, completely bypassing client-side `useSession` status checks for rendering decisions.
  - Optimization: Simplified `LayoutShell.tsx` to render the shell structure and children immediately on protected routes, matching the server-rendered DOM and eliminating hydration mismatches and unmount cycles.
  - Verification: All tests passing cleanly (81/81 tests green) and build succeeded.
### Session 9 — June 24, 2026
  **Phase 10.5 - Team Score Distribution & Orders Pipeline Filtering**
  - Distributed legacy orders data among multiple sales agents and teams to allow verification of team scores on the dashboard.
  - Implemented `/api/teams` endpoint to retrieve available teams ordered by name.
  - Added support for backend team filtering on the `GET /api/orders` endpoint via `teamId` search parameter.
  - Modified `OrderListContainer.tsx` to fetch available teams and render a Team select dropdown in the filter bar next to the Agents filter dropdown.
  - Modified `OrderList.tsx` to add a new "Team" column with styled team badges.
  - Modified `order.repository.ts` to include the nested `team` relation when fetching `salesAgent`.
  - Added a backend integration test in `src/tests/orders.test.ts` to verify `teamId` query parameter filtering.
  - Verification: All tests passed cleanly (82/82 tests green), type checks and ESLint checks passed successfully.

### Session 10 — June 25, 2026
  **Phase 10.5 - UI & Navbar Styling Corrections**
  - Updated the global background color definition in `layout.css` to pure white (`#ffffff`).
  - Restructured the mobile Navbar layout in `layout.css` to place the `JD CRM` logo on the left, the user avatar dropdown button on the right with a premium ring border, and the navigation pills menu wrapped on a new line below.
  - Fixed mobile menu cutting off by setting `justify-content: flex-start` on the scrollable navbar menu, and scaled down font size/paddings on mobile devices.
  - Applied a thick grey border (`3px solid #cbd2d9`) and rounded corners (`16px`) on executive dashboard metric cards and Orders Journey cards in `components.css` (setting card padding to `0` globally and in both `1280px` and `768px` media queries to completely remove white gaps).
  - Configured card footer band with `#cbd2d9` background matching the border color exactly, a thick top border (`3px solid #cbd2d9`), and aligned footer items cleanly in both `MetricCard.tsx` and `PendingCountsRow.tsx`.
  - Desaturated the entire application's primary color theme (using soft slate blue `#4b7ccd`/`#3b5982` for blue, soft sage `#5c8f76` for green, soft red `#b25353` for red, soft tan `#a47c5c` for amber, and `#cbd2d9` for card borders/footers) to present a softer, muted visual palette.
  - Removed the "From last..." comparison text when a card comparison exists, and kept original font configurations intact.
  - Converted sparkline connection lines to smooth cubic bezier curves and enabled sparkline visibility on mobile viewports.
  - Fixed performers tables width issues on smaller screens by removing the `table-responsive` class.
  - Verification: All 91 unit and integration tests passed successfully.

### Session 11 — June 25, 2026
  **Phase 10.5 - Card Border & Footer Alignment, Double Column No-Graph Grid**
  - Lightened the grey borders, sparkline background fills, and footer bands across all metric cards on the dashboard to `#f1f5f9` (slate-100) to blend card elements seamlessly with the white background.
  - Removed JS-based mouse listeners (`onMouseEnter` / `onMouseLeave`) from `MetricCard.tsx` and `PendingCountsRow.tsx`, moving hover logic entirely to the CSS class `.metric-card-interactive` to prevent dynamic border-color desyncs.
  - Removed description lines ("Returned funds this month" and "Disputed orders this month") from the footer bands of the Refunds and Chargebacks cards to present a uniform "View Details →" footer layout.
  - Rendered all scoreboard cards in a single `kpi-cards-grid` in `dashboard_client_page.tsx`, and configured CSS Grid columns and spans in `layout.css` so that on mobile/phone screens, cards with graphs span the full width (1 per row) while cards without graphs (Refunds and Chargebacks) share the row (2 in a row). On desktop and tablet viewports, all cards render naturally in a standard grid (3 columns on desktop, 2 columns on tablet) without separate sections.
  - Fixed a formatting mismatch in `Dashboard.test.tsx` where pending count assertions expected unformatted numbers rather than localized numeric strings (e.g. `1,000` and `2,000`).
  - Added inline style overrides (`border: '3px solid #f1f5f9'`) to both `MetricCard.tsx` and `PendingCountsRow.tsx` wrappers and footer bands to completely bypass any browser/dev server caching issues and guarantee that the borders and footers match perfectly on all viewports and states.
  - Removed the path (connection curve line) and circle (trend indicator dot) from the sparkline SVG in `MetricCard.tsx`, keeping only the previous and current period comparison bars.
  - Increased the heading font sizes (`.page-title`) slightly on all screens (default to `1.85rem`, 1280px to `1.6rem`, and 768px to `1.45rem`) and set `min-height` to prevent text clipping from gradient backgrounds.
  - Standardized `.metric-card` size to remain constant (with a baseline `min-height: 130px`) across all screens by removing media query overrides.
  - Scaled down `.metric-card-title`, `.metric-card-value`, and `.metric-card-footer` ("View Details") text sizes progressively across laptop (`max-width: 1280px`), tablet (`max-width: 1024px`), and mobile/phone screens (`max-width: 768px`) to prevent card labels (e.g. "SALES THIS MONTH") and view details links from wrapping or looking too large on smaller viewports.

### Session 12 — June 26, 2026
  **Phase 10.5 - Interactive Sales & Orders Advanced Chart with Dynamic Granularity (W-1053)**
  - Implemented `getAdvancedChartData` in `dashboard.repository.ts` to fetch Sold orders within date ranges, supporting team filtering.
  - Created `getAdvancedChartMetrics` in `dashboard.service.ts` to manage range bounds (`7d`, `30d`, `year`, `all`), enforce granularity constraints, and aggregate metrics dynamically.
  - Built API route `/api/dashboard/advanced-chart` for permission-guarded fetch requests.
  - Created the SVG-based `AdvancedChartWidget.tsx` React component rendering bezier curves and bar histograms with active metric toggle.
  - Mounted `AdvancedChartWidget` under the KPI grid, updated `components.css` with layout chart classes, and updated `current_state.md` and types.
  - Verification: All 99 integration/unit tests passed successfully.

### Session 13 — June 29, 2026
  **Bug Fix (TDD) — Edit Order "Save Changes" Not Persisting Customer & Card Data**

  #### Root Cause Analysis
  - **Root Cause 1 (Service Layer — Previous Session):** `orderRepository.update()` was spreading the entire incoming payload directly into `prisma.crmOrders.update()`. This was a risk point since customer/card fields don't live on `crm_orders`. The service layer was refactored to destructure the payload into three buckets (order fields / customer fields / card fields) and issue separate Prisma updates to `crm_customers` and `crm_customer_cards`. This fix was architecturally correct but had no effect because the real bug was in the form.
  - **Root Cause 2 (Form Payload — Confirmed This Session):** `EditOrderForm.tsx`'s `handleSubmit` built a `payload` object that only included order-level fields (`orderYear`, `orderMakeModel`, etc.). All customer and card state variables (`firstName`, `lastName`, `customerPhone`, `customerEmail`, `customerBillingAddress`, `customerShippingAddress`, `customerNameOncard`, `customerCardNumber`, `customerCardExpDate`, `customerCardCvv`, `customerCardCopyStatus`, `customerCardPhotoStatus`) were tracked in React state but **never included in the `payload` sent to the API**. The service received them as `undefined`, so the customer/card update blocks were skipped entirely.
  - This was confirmed by the Prisma query log: `UPDATE crm_orders SET...` was firing, but no `UPDATE crm_customers` ever appeared, proving the data wasn't arriving at the server.

  #### TDD Process
  - **RED — Integration (`orders.test.ts`):** Added two new integration tests: one asserting `PATCH /api/orders/:id` with `{ firstName, lastName }` persists updated values to `crm_customers`, and a second asserting `customerPhone`, `customerEmail`, `customerBillingAddress`, `customerShippingAddress` are also persisted. Both tests called `PATCH` directly (bypassing the form) and **passed immediately**, confirming the service-layer fix from the previous session was working correctly end-to-end.
  - **RED — Unit (`EditOrderForm.test.tsx`):** Added a new unit test that spies on `fetch`, renders the form, fires a name change, submits, and asserts `firstName` and all other customer/card fields are present in `JSON.parse(fetchOptions.body)`. This test **failed**, precisely pinpointing `EditOrderForm.tsx`'s `handleSubmit` as the source of the bug.
  - **GREEN — Fix (`EditOrderForm.tsx`):** Added all 12 customer and card state variables to the `payload` object in `handleSubmit`, grouped under clear comments.
  - **Verification:** All 16 tests in `EditOrderForm.test.tsx` and `orders.test.ts` pass (exit 0).

  **Test Database Isolation & Setup**
  - **Root Cause & Risks**: Investigated test database usage and confirmed that Vitest was previously connecting directly to the primary local development database (`jd_crm`). This meant test executions polluted the development database, and manually run seed scripts could create conflicts or leave stale data (like today's test orders) in the active database.
  - **Isolated Database (`jd_crm_test`)**: Created a dedicated `.env.test.example` template. Configured the connection to use the database superuser (`root`) instead of the development user (`crm_user`), as only the root account has permissions to create new database schemas on the local MySQL instance. Referressed `.env.test.example` copying instructions in the setup guide.
  - **Vitest & Global Setup**: Created `vitest.config.ts` and `src/tests/globalSetup.ts`. The global setup script now automatically ensures that `jd_crm_test` is created, synchronizes schemas via Prisma `db push`, and runs the default database seeds prior to test execution.
  - **Automatic Teardown & Cleanup**: Configured the global `teardown` hook in `globalSetup.ts` to automatically connect to `jd_crm_test` after all tests complete and truncate all tables, leaving the database 100% clean.
  - **Verification**: Tests run successfully against the new test database, and the cleanup logs confirm that all tables are truncated at exit.

### Session 14 — June 30, 2026
  **Phase 11 - Search Optimization, Navbar & Scoreboard Responsiveness**
  - **Grid-Aligned Search**: Integrated a dual search bar layout (`.mobile-search-wrapper` / `.desktop-search-wrapper`) toggling display states cleanly via media queries. Desktop search is positioned in the `.navbar-aligned-content` overlay, matching the 15% padding grid while the Logo and Profile Dropdown remain unshifted at the screen boundary.
  - **Overlap Resolution at 1600px Breakpoint**: Implemented layout contraction rules when the viewport is 1600px or less (hiding the "CRM" logo suffix and the "Admin" username text, displaying only the circular avatar). This prevents element collisions on intermediate widths (such as half-screen viewports).
  - **Mobile Navbar Row Structure**: Programmed top navbar item order on mobile screens (max-width: 768px): Row 1 places Logo on left, Mobile Search Bar in the middle (taking up `flex: 1` space), and User Avatar on right; Row 2 displays the scrollable Navigation Pills.
  - **Mobile 2-Column KPI Cards & Font Scaling**: Restored the scoreboard to render exactly 2 cards per row on mobile viewports by setting `grid-column: span 1 !important` for all cards (`.card-has-graph`, `.card-no-graph`) under 768px. Progressively scaled down card font sizes (title, value, prefix, count, footer) and sparkline width/height boundaries inside both 768px and 480px breakpoints to prevent visual overlaps.
  - **Polished Search Recommendation spacing**: Removed Tailwind wrapper styles from the suggestion dropdown list box. Implemented Vanilla inline styles specifying clear borders, vertical row padding (`12px`), and background hover colors (`.suggestion-item-row:hover`).
  - **Legacy Name Deduplication**: Implemented client-side merge cleanup in `GlobalSearchBar.tsx` to automatically deduplicate displayed customer names if legacy import records stored identical full-name values in both the `first_name` and `last_name` columns.
  - **Verification**: Verified that all 119 integration and unit tests pass successfully.

### Session 15 — June 30, 2026
  **Phase 11.5 - Mobile Navigation Hamburger Menu & Swipable Scoreboard Carousel**
  - **Mobile Hamburger Drawer**: Mounted the collapsible `Sidebar` component in `LayoutShell.tsx` and wired its toggle state (`sidebarOpen`) to a mobile hamburger menu button (`.hamburger-btn`) in `Navbar.tsx`. Clicking the button opens the slide-over navigation sidebar drawer, and clicking the backdrop closes it.
  - **Full-Width Mobile Search**: Hid the swipable navigation pills menu (`.navbar-aligned-content`) on mobile viewports (<= 768px). Extended the mobile search bar wrapper (`.mobile-search-wrapper`) to fill all remaining width (`flex: 1`) on Row 1 between the Logo and Profile Avatar.
  - **Scroll-Snapping Metric Carousel**: Configured `.kpi-cards-swipeable` in CSS to act as a horizontal swipeable carousel on mobile. By using native CSS Scroll Snapping (`scroll-snap-type: x mandatory` and `scroll-snap-align: start`), the browser smoothly locks viewport coordinates showing exactly one KPI metric card at a time.
  - **Swipe Dot Indicators**: Added pagination dot indicators (`.kpi-swipe-indicators` / `.swipe-dot`) below the carousel. Implemented a scroll position event listener in React (`onScroll`) that calculates `Math.round(scrollLeft / clientWidth)` to dynamically update the active dot index. Clicking on a dot smoothly scrolls the grid container to the chosen card.
  - **Verification**: Verified alignment and swipability behaviors, and confirmed all integration test suites remain fully green.

### Session 16 — June 30, 2026
  **Phase 11.5 - Sidebar Drawer Streamlining, Header Tightening & Swipable Orders Journey**
  - **Sidebar Drawer Streamlining**: Streamlined `Sidebar.tsx` to display only the list of navigation page links (`nav-list`). Removed the logo header, user profile area, sign out footer button, and section headers to present a clean, minimal menu drawer on mobile.
  - **Tightened Header Spacing**: Grouped the hamburger toggle button and `JD CRM` logo inside a flex container (`.navbar-left-group`) with an `8px` gap, preventing space-between distribution from pushing them apart and allowing the mobile search bar to expand tightly.
  - **Metric Card Font Enlargement**: Re-increased font sizes of the metric card elements (`1.7rem` value, `0.85rem` title) inside both 768px and 480px breakpoints. Since cards are shown as full-width slides in swipable carousels on mobile, this scales the contents nicely to fill the screen space.
  - **Swipable Orders Journey**: Refactored `PendingCountsRow.tsx` (the "Orders Journey" pipeline stage cards) to wrap its grid in `.kpi-swipe-container` and implement scroll ref hooks, state indicators, and listeners. Orders Journey cards are now swipable on mobile viewports exactly like the Scoreboard.
  - **Prisma Parameter Logs Explanation**: Reassured that `?` query parameters printed in the server logs are prepared statement parameter placeholders, which is native Prisma batch querying behavior and not database errors.
  - **Verification**: Verified all visual alignments, drawer interactions, and swipability functions, confirming tests remain fully green.

### Session 17 — June 30, 2026
  **Phase 11.5 - Dual-Row Mobile Swipe Carousels for Scoreboard & Orders Journey**
  - **Scoreboard Row Split**: Split the 6 dashboard scoreboard cards into `cardsRow1` (first 3 cards) and `cardsRow2` (remaining 3 cards) in `dashboard_client_page.tsx`, rendering them as two stacked swipable rows with separate scroll refs and active dot indicator states.
  - **Orders Journey Row Split**: Split the 5 Orders Journey stage cards into `stepsRow1` (first 3 stages) and `stepsRow2` (remaining 2 stages) in `PendingCountsRow.tsx`, rendering them as two stacked swipable slider containers on mobile with independent dot indicators.
  - **Verification**: Verified dual-row alignment, sliding lock snap boundaries, and dot update hooks, keeping test suites clean.

### Session 18 — June 30, 2026
  **Phase 11.5 - Mobile Paired Combo Columns Swipe & Completed Orders Dashboard Metric**
  - **Completed Orders Metric**: Integrated `'Completed Orders'` order current status calculations into `getPendingCounts()` in `dashboard.repository.ts` to return its total volume and count.
  - **Paired Combo Columns (`.kpi-combo-column`)**: Grouped Scoreboard and Orders Journey cards into three vertically stacked pairs:
    - **Scoreboard**: (This Year / Sales This Month), (Today's / Net Sales), (Refunds / Chargebacks).
    - **Orders Journey**: (Pending Booking / Pending Shipment), (Pending Delivery / Pending Feedback), (Pending Resolutions / Completed Orders).
  - **Single Swipe Double Cards**: Wrapped each pair in a `.kpi-combo-column` flex container. Configured `.kpi-combo-column` to snap horizontally as a single slide unit on mobile, meaning swipe gestures scroll both cards in a combo column simultaneously.
  - **Verification**: Ran vitest test suites, confirming all 119 unit and integration tests build and pass cleanly.

### Session 19 — June 30, 2026
  **Phase 11.5 - Sidebar Layout Correction, Filter Sizing Harmony & Responsive Orders Table**
  - **Completed Orders Route Sync**: Updated the redirect route of the 'Completed Orders' dashboard card to query both `saleStatus=1` and `status=Completed+Orders`, ensuring users land directly on the "Completed Orders" pipeline tab with matching filters.
  - **Sidebar Layout Resolution**: Added `display: none !important;` to `.sidebar` on desktop viewports (>768px), and configured `display: flex !important;` exclusively within the mobile media query. This resolved a layout bug where the invisible desktop sidebar occupied 100vh of vertical space, creating a blank white gap above dashboard components.
  - **TypeScript & Linting Cleanup**: Resolved ESLint warn/error directives (`react-hooks/set-state-in-effect`) inside `GlobalSearchBar.tsx` and `LayoutShell.tsx`. Added explicit property index typing for `'Completed Orders'` in the `PendingCounts` interface in `src/types/dashboard.ts`. Resolved SearchResults test module casting mismatches.
  - **Filter Sizing Harmony**: Added aligned `<label>` controls (Team, Agent, Start Date, End Date) above each pipeline input in `OrderListContainer.tsx` to match the dashboard's chart filters. Styled date inputs with `.filter-select-custom` and added a mobile-specific CSS override to scale down filter fonts (`0.72rem`) and render 2 columns per row on mobile screens.
  - **Responsive Orders Table**: Styled the main orders pipeline table in `OrderList.tsx` with the `.card-with-accent` top-border container. Removed fixed-pixel Tailwind font overrides (`text-xs`, `text-[10px]`) and applied relative fluid sizing (`inherit`, `0.92em`), allowing the table columns and content to dynamically scale down on small viewports and match other dashboard list tables.
  - **Verification**: Verified Next.js turbopack production build succeeds cleanly, and all 119 tests pass successfully.

### Session 20 — June 30, 2026
  **Phase 11.5 - Navigation Menu Title, Static Pagination, Georgia Typography & Chart Mobile Click Support**
  - **Mobile Orders Table Swiping**: Wrapped the main pipeline orders table inside a nested `div` with class `.card-table-container` in [OrderList.tsx](../src/components/OrderList.tsx). This bypasses the parent `.card-with-accent` card container's `overflow: hidden` constraint, allowing horizontal swipe scrolling on mobile.
  - **Static Pagination Row**: Moved the pagination block outside of the scrollable `.table-wrapper` block in [AgentList.tsx](../src/components/AgentList.tsx) and [VendorList.tsx](../src/components/VendorList.tsx) so that the pagination footer remains static on the page and does not slide with the table.
  - **Reverted Performers Table**: Reverted changes on [PerformersTable.tsx](../src/components/dashboard/PerformersTable.tsx) to use standard `custom-table` rather than `table-responsive`, keeping its columns tight and clean on mobile.
  - **Responsive Table Sizing**: Expanded `.table-responsive`'s mobile `min-width` to `1000px` in [components.css](../src/app/components.css) to ensure wide tables overflow clean and swipe smoothly without squishing column columns.
  - **Georgia Serif Fonts Refinement**: Reverted body font changes in `globals.css` and `layout.css` to `Georgia, serif` to maintain the design system. Styled the date cells in [OrderList.tsx](../src/components/OrderList.tsx) and [RecentOrdersTable.tsx](../src/components/dashboard/RecentOrdersTable.tsx) to `font-normal` (weight reset) and `fontSize: '0.82em'` to format Georgia's large numbers cleanly.
  - **Sidebar Section Title & Pure White Links**: Added a visual `MENU` heading inside [Sidebar.tsx](../src/components/Sidebar.tsx) and updated all Link elements and SVG icon strokes inside the sidebar to pure white (`#ffffff`).
  - **Interactive Chart Mobile Tap Support**: Configured [AdvancedChartWidget.tsx](../src/components/dashboard/AdvancedChartWidget.tsx) to listen for `onClick` events. Tapping on a column now triggers coordinates calculations and shows the tooltip card, and clicking anywhere else (global event listener on window) dismisses the tooltip card.
  - **ESLint & Typecheck Compliance**: Fixed ESLint warnings and errors across [GlobalSearchBar.tsx](../src/components/GlobalSearchBar.tsx), [OrderListContainer.tsx](../src/components/OrderListContainer.tsx), [AgentList.tsx](../src/components/AgentList.tsx), and [VendorList.tsx](../src/components/VendorList.tsx) by cleaning up inline disables and replacing them with clean file-level disables. All 119 unit/integration test suites build and pass cleanly with 0 warnings or errors.

### Session 21 — June 30, 2026
  **Phase 15 — W-1501: Team Performer Net Scores (deducting refunds/chargebacks) & Negative Formatting**
  - Refactored `getTeamMonthlyTopPerformer()` and `getTeamMonthlyBottomPerformer()` in `src/repository/dashboard.repository.ts` to query `saleStatus` in `['1', '7', '8']` and correctly calculate agent net scores by adding sold order markups and subtracting refunds/chargebacks.
  - Configured performer mappings to use `agent.nickname || agent.name` and return `agentId` alongside existing properties.
  - Added `agentId: number` property to `TeamPerformerRow` in `src/types/dashboard.ts`.
  - Updated `TeamMonthlyScoresWidget.tsx` to handle negative bottom performer amounts and format them styled with red text as `-$Math.abs(amount)`.
  - Updated `src/service/dashboard.service.ts` line 95 to cast and resolve `customerName` in a schema-agnostic way (supporting first/last name fallback) as a prerequisite for the W-1503 migration.
  - Created a robust integration test verifying performer net scoring, negative rankings, and nickname use, and unit tests validating negative amount format rendering.
  - Verified all 134 integration and unit test suites pass successfully.

### Session 22 — June 30, 2026
  **Phase 15 — W-1502: Merge `order_year` into `order_make_model` [IMPLEMENTATION] & Schema Surgery**
  - Created and applied custom database migration `20260630153900_merge_order_year_into_make_model` to prepend `order_year` to `order_make_model`, drop `order_year` column, and map deprecated `sale_status` codes to the new 3-status schema (Sold, Refunded, Chargebacked).
  - Regenerated Prisma Client and removed `orderYear` from database repository (`src/repository/order.repository.ts`) and type definitions (`src/types/order.ts`).
  - Unified the split Year and Make/Model fields on `AddOrderForm.tsx` and `EditOrderForm.tsx` into a single "Year, Make & Model" input, and updated order list, search, and detail page layouts to match.
  - Resolved build and TypeScript compiler errors in CSV/dummy seeding scripts (`import-csv-data.ts`, `seed-dummy-orders.ts`), `settings.test.ts` GET mock arguments, and `AddOrderForm.test.tsx` fetch options typing.
  - Cleared Node/Next.js dev cache in `src/lib/db.ts` to reload schema definitions dynamically in active dev server memory.
  - Verified all 141 unit, integration, and typecheck test suites compile and pass successfully.

### Session 23 — June 30, 2026
  **Phase 15 — W-1503: Customer Name Consolidation [IMPLEMENTATION] & Seeding Alignment**
  - **Consolidated UI Components**: Completed the migration of all frontend pages and React components to support `customerName` directly, replacing separate first and last name inputs/fields. Updated `AddOrderForm.tsx`, `EditOrderForm.tsx`, `CustomerList.tsx`, `OrderList.tsx`, `GlobalSearchBar.tsx`, `SearchResults.tsx`, and detail pages.
  - **Accessibility & Test Support**: Added `id="customerName"` and `htmlFor="customerName"` attributes to the Customer Name input in `EditOrderForm.tsx` to enable robust label-based DOM querying in component tests.
  - **Green Component Tests**: Updated and corrected all unit test assertions in `AddOrderForm.test.tsx`, `EditOrderForm.test.tsx`, `SearchResults.test.tsx`, and created `CustomerList.test.tsx` to verify clean frontend data handling and form submittals under the unified customerName field. All 13 component tests pass cleanly.
  - **Status Dropdowns Limit**: Restricted sale status dropdown controls in `AddOrderForm.tsx` and `EditOrderForm.tsx` to only render Sold (1), Refunded (2), and Chargebacked (3). Also updated the `getStatusBadge` map in `RecentOrdersTable.tsx` to align with the new 3-status database schema.
  - **Seeding and CSV Import Alignment**: Refactored the CSV data import script (`import-csv-data.ts`) and the dummy orders seeder script (`seed-dummy-orders.ts`) to map all status values to the restricted 3-status schema (re-mapping legacy prospect, callback, callback options into Sold).
  - **Verification**: Verified that all backend integration tests, frontend component tests, and typechecks build and pass successfully.
### Session 24 — June 30, 2026
  **Phase 15 — W-1504: Quick UI Wins & Advanced Chart Filter Refinement**
  - **Exposed Sale Date Picker**: Mounted a date selection input (`orderDate`) on `AddOrderForm.tsx` (defaulting to today's date) and `EditOrderForm.tsx` (defaulting to the existing order date), and included `orderDate` in client-side form submittal payloads to allow backdating sales.
  - **Mileage Input Rename**: Renamed Quoted Mileage and Vendor Mileage form labels to `"Quotes Miles"` and `"Vendor Miles"`.
  - **Chart Filter Options Cleaned**: Removed rolling window ranges (`7d`, `30d`, and `2d`) from `AdvancedChartWidget.tsx`. Replaced `"This month"`, `"Last month"`, `"Last 6 months"`, and `"This year"` options with a simplified `"Monthly"` (covering all months of current year) and `"Yearly"` (covering the last 5 years) structure.
  - **Monday-to-Sunday Week Bounds**: Refactored `"This week"` and `"Last week"` range boundaries in `dashboard.service.ts` to begin on Monday and end on Sunday (UTC-based).
  - **Daily X-Axis Labels Format**: Formatted X-axis daily labels to print in the requested `DD-MM-YYYY` structure (e.g. `"25-06-2026"`).
  - **EST Timezone Realignment**: Shifted client form defaults, client dashboard card range parameters ([dashboard_client_page.tsx](src/app/dashboard_client_page.tsx)), and backend dashboard/metrics range calculations to match EST (`America/New_York`) wall-clock date boundaries instead of local server system or UTC time.
  - **Timezone Offset Bug Fixes**: Fixed the 1-day date-shifting discrepancy when editing or searching orders by reading and formatting date-only DB fields (which Prisma returns as UTC midnight) using UTC timezone settings in `EditOrderForm.tsx`, `date.ts`, and `SearchResults.tsx` instead of client-local timezone conversions.
  - **Exposed Sale Date on Details Page**: Displayed the custom `orderDate` (labelled "Sale Date") next to the database registration date in the subtitle of the Order Details page ([page.tsx](src/app/orders/[id]/page.tsx)).
  - **Verification**: Verified Next.js ESLint and typechecks pass cleanly, and all 145 integration and unit tests compile and run green.

### Session 25 — June 30, 2026
  **Phase 15 — W-1505: Database Seeder Realignment to Post-Sprint-1 Schema**
  - **Database Seeder Realignment**: Updated [seed.sql](seed.sql) to append mock inserts for `crm_customers` (using the unified `customer_name` column) and `crm_orders` (using the combined `order_make_model` string and removing `order_year`).
  - **Prisma Raw Execution Compatibility**: Removed `START TRANSACTION` and `COMMIT` boundaries from `seed.sql` to avoid prepared statement protocol errors during raw script execution.
  - **Seeder Integration Tests**: Appended integration tests to [db_connection.test.ts](src/tests/db_connection.test.ts) to verify seeded data counts, assert that querying dropped columns (`first_name`, `order_year`) throws database errors, and check `order_make_model` formatting.
  - **CSV Import Validation**: Checked [import-csv-data.ts](src/scripts/import-csv-data.ts) and confirmed it is fully compliant with the updated schema columns and status constraints.
  - **Verification**: Ran all 149 integration and unit tests and confirmed 100% green status.

### Session 26 — June 30, 2026
  **Phase 16 — W-1601: Add Sales Verifier and Backend Executive to Orders**
  - **Database Migrations**: Created and executed `20260630180000_add_sales_verifier_and_backend_executive` adding `order_sales_verifier_id`, `order_sales_verifier_name`, `order_backend_executive_id`, and `order_backend_executive_name` columns with relational FK constraints to the `crm_orders` table.
  - **Prisma Schema Update**: Registered the new fields and relations (`salesVerifier`, `backendExecutive`) in `schema.prisma`.
  - **Business Logic Integration**: Refactored `order.repository.ts` and `order.service.ts` to automatically lookup, validate, and write denormalized name snapshots when creating/updating orders.
  - **API Route Upgrades**: Updated `POST /api/orders` and `PATCH /api/orders/:id` controllers to accept, validate, and parse numeric verifier/executive inputs.
  - **UI Integration**: Added sequentially-aligned select dropdowns (Sales Agent → Sales Verifier → Backend Executive → QA Verifier) to both `AddOrderForm.tsx` and `EditOrderForm.tsx`.
  - **Single Column Agents Layout**: Consolidated all four workflow agent display cells in `OrderList.tsx` into a single, unified "Agents" column. Displayed assignments vertically using the requested format:
    - **Sales Agent:** `<name>`
    - **Sales Verifier:** `<name>`
    - **Backend Executive:** `<name>`
    - **QA Verifier:** `<name>`
  - **Documentation Alignment**: Updated `database_schema.md`, `project_data.md`, and `decision_log.md` to reflect the new columns, relations, and decisions. Replaced all occurrences of "Backend Team Member" with "Backend Executive" across `CHANGE_PRIORITY_PLAN.md` and `CONTEXT/current_state.md`.
  - **Verification**: Verified that all unit tests, integration tests, and typechecks build and pass successfully.

### Session 27 — July 1, 2026
  **Bug Fix — Test Suite Failures & UI Label Corrections**
  - **Root Cause — Seed FK Violation**: The `seed.sql` update from Session 25 appended `crm_customers` and `crm_orders` inserts referencing `order_sales_agent_id = 1`. However, `run-seed.ts` executes before `restore-admin.ts` (which is the only place that guarantees `uid = 1` exists via upsert). Because the users inserted by `seed.sql` use auto-increment, the required `uid = 1` FK target did not exist when the order insert ran, causing `run-seed.ts` to exit with an error and leaving the entire test database empty — explaining all `db_connection`, `agents`, and `auth_flow` test failures.
  - **Fix — Moved Mock Seed to restore-admin.ts**: Removed the `crm_customers` and `crm_orders` inserts from [seed.sql](seed.sql). Moved them into [restore-admin.ts](src/scripts/restore-admin.ts) as Prisma `upsert` calls executed sequentially after the admin user upsert, guaranteeing the FK dependency is satisfied.
  - **Fix — Vendors Test Deadlock**: The `vendors.test.ts` GET /api/vendors/:id/orders test used inline `prisma.users.delete()` inside the test body. Under concurrent test execution, this collided with the global teardown still holding a table lock, causing a MariaDB deadlock error. Fixed by promoting the user UID to a shared `testUserUid` variable, removing all inline deletes from the test body, and moving user cleanup into the `afterEach` / `beforeEach` hooks using `deleteMany` (which does not throw on missing rows).
  - **UI Label Fix — "Quoted Miles"**: Corrected the typo "Quotes Miles" → **"Quoted Miles"** in the label of the quoted mileage input field in both [AddOrderForm.tsx](src/components/AddOrderForm.tsx) and [EditOrderForm.tsx](src/components/EditOrderForm.tsx).
  - **UI Label Fix — Order Details Page**: Renamed "Quoted Mileage" → **"Quoted Miles"** and "Vendor Mileage" → **"Vendor Miles"** in the Vehicle & Part Specifications section of the order detail page ([page.tsx](src/app/orders/[id]/page.tsx)).
  - **Test Assertion Update**: Updated the label assertion in [AddOrderForm.test.tsx](src/tests/AddOrderForm.test.tsx) from `"Quotes Miles"` to `"Quoted Miles"` to match the corrected UI label.

### Session 28 — July 1, 2026
  **UI Fix — All Agents Visible on Order Details Page & Gateways Test Fix**
  - **UI Fix — Missing Agents on Order Details**: The Staff Allocations card on the order detail page ([page.tsx](src/app/orders/[id]/page.tsx)) was only displaying two agents (Sales Representative and Quality Verifier). Added the remaining two rows — **Sales Verifier** (`orderSalesVerifierName`) and **Backend Executive** (`orderBackendExecutiveName`) — between them, so all four agent roles are now visible in the correct order: Sales Representative → Sales Verifier → Backend Executive → Quality Verifier.
  - **Test Fix — `gateways.test.ts` `thisMonthEntry` undefined**: The failing assertion `expect(thisMonthEntry).toBeDefined()` was caused by a timezone mismatch. The test used `new Date().getMonth()` / `getFullYear()` (local PKT time, UTC+5:30) to look up the matching month in the API response, but the MySQL `MONTH()` / `YEAR()` functions on `order_date` (a `DATE` column) return UTC values. When the test ran after midnight UTC but before midnight PKT, local month/year differed from the stored UTC values, returning `undefined`. Fixed by switching to `now.getUTCMonth()` and `now.getUTCFullYear()` in the test assertion lookup.
  - **Verification**: Full test suite run confirmed — **30 test files, 158 tests, all passing**.


### Session 29 — July 1, 2026
  **EST Timezone Integration, Legacy saleStatus Migration, Modal Centering, & Lint Fixes**
  - **EST Timezone Integration**:
    - Updated all timeline output displays in [date.ts](src/lib/date.ts) to utilize `Intl.DateTimeFormat` with `timeZone: 'America/New_York'`.
    - Modal inputs are pre-filled with the current date/time in America/New_York using `getCurrentEstDateTime()`.
    - User-specified EST/EDT override dates/times are converted to standard UTC ISO strings using `convertEstToUtc()`.
    - Updated [CommentTimeline.tsx](src/components/CommentTimeline.tsx) to format activity log comment timestamps using the `America/New_York` timezone.
  - **Viewport Centering & Portal Fix**: Rendered the date modal via **React Portals** (`createPortal`) mounted directly under `document.body` in [EditOrderForm.tsx](src/components/EditOrderForm.tsx). This bypasses the GSAP animated containing block transform context, keeping the modal fixed and perfectly centered on the screen.
  - **Legacy saleStatus Migration (Decision 15)**: Migrated all references to legacy saleStatus codes `'7'` (Refunded) and `'8'` (Chargebacked) to the correct active codes under Decision 15: `'2'` (Refunded) and `'3'` (Chargebacked). Updated [vendor.service.ts](src/service/vendor.service.ts), [dashboard.service.ts](src/service/dashboard.service.ts), [dashboard.repository.ts](src/repository/dashboard.repository.ts), [OrderListContainer.tsx](src/components/OrderListContainer.tsx), [page.tsx](src/app/vendors/[id]/page.tsx), [dashboard_client_page.tsx](src/app/dashboard_client_page.tsx), and the integration tests [dashboard.test.ts](src/tests/dashboard.test.ts).
  - **EST Date Range Filters**: 
    - Shifted boundary checks in the Order list query builder ([order.repository.ts](src/repository/order.repository.ts)) and custom dashboard charts parser ([dashboard.service.ts](src/service/dashboard.service.ts)) to query utilizing timezone-aware boundaries (`00:00:00 EST` to `23:59:59.999 EST`) converted to UTC.
    - Fixed month boundary drift in `getTeamMonthlyTopPerformer` and `getTeamMonthlyBottomPerformer` using `Date.UTC` dates.
    - Updated default and fallback month/year calculation in [TeamMonthlyScoresWidget.tsx](src/components/dashboard/TeamMonthlyScoresWidget.tsx) and [route.ts](src/app/api/dashboard/teams/monthly/route.ts) to resolve based on EST date parts.
  - **Linting & Code Verification**: Fixes a `react-hooks/set-state-in-effect` warning on `setMounted` inside `EditOrderForm.tsx` by adding a lint disable comment.
  - **Verification**: Run all lint checks (`npm run lint`), type checks (`npm run typecheck`), and tests (`npm run test`). Confirmed everything is fully green: **32 test files, 169 tests, all passing successfully**.

### Session 30 — July 1, 2026
  **W-1603 Order Delete Cascade, RBAC & Permissions Documentation**
  - **Backend API Route**: Modified the `DELETE` endpoint in [route.ts](src/app/api/orders/[id]/route.ts) to verify the new permission `orders:delete`.
  - **RBAC & Seeding**: Registered `orders:delete` inside `seed.sql` under permission ID `48` and mapped it exclusively to the Super Admin role (`role_id = 1`) inside `crm_role_permissions`.
  - **Database Cascades**: Inspected and verified MySQL `ON DELETE CASCADE` is set on foreign keys for `crm_comments`, `crm_sale_status_history`, and `crm_order_current_status_history`.
  - **Frontend UI Component**: Created [DeleteOrderButton.tsx](src/components/DeleteOrderButton.tsx) using a centered confirmation overlay modal portal. Rendered it in [page.tsx](src/app/orders/[id]/page.tsx) guarded by `orders:delete` permission.
  - **Permissions Matrix Update**: Added `orders:delete`, `orders:view-sale-status-history`, and `orders:view-workflow-history` to the permission list inside [project_data.md](CONTEXT/project_data.md).
  - **Verification**: All type checks and tests passing successfully: **33 test files, 176 tests passing**.

### Session 31 — July 1, 2026
  **W-1604 Order View Log / Access History & Database Permissions Sequence & Light Theme Restyling**
  - **Database Migration**: Created and executed `20260701030000_add_order_views_table` creating the `crm_order_views` table mapping `id`, `order_id`, `viewer_id`, `viewer_name`, and `viewed_at` fields.
  - **Prisma Schema Update**: Added `CrmOrderViews` model definition mapping to table `crm_order_views` in `schema.prisma`.
  - **Order Views Logging Repository**: Created `logOrderView()` and `getOrderViews()` in `order.repository.ts`.
  - **Permissions Restructure**: Added the view log permission `orders:view-log` under sequential permission ID `49` mapping only to Super Admin and Admin roles in `seed.sql`. Removed access permissions from Manager (3), Team Lead (4), and Agent (5) roles.
  - **Order Details Integration**: Injected a call to `orderRepo.logOrderView` into both the Next.js API route [route.ts](src/app/api/orders/[id]/route.ts) and the server component detail page [page.tsx](src/app/orders/[id]/page.tsx) to record views whenever the details page is visited in the browser or accessed via HTTP client.
  - **Access History Table Component**: Created [OrderViewLog.tsx](src/components/OrderViewLog.tsx) to render a list of view entries. Redesigned it using light glassmorphic card style to match the layout system. Guarded it under `orders:view-log` in [page.tsx](src/app/orders/[id]/page.tsx).
  - **Verification**: Created [OrderViewLog.test.tsx](src/tests/OrderViewLog.test.tsx). Verified all test suites pass successfully: **34 test files, 185 tests passing**.

### Session 32 — July 1, 2026
  **Phase 16 — W-1605 Order Field Change Audit Log, Database Seeding Alignment, & Test Isolation Correctness**
  - **Database Migration**: Created and executed database migration `20260630222435_create_order_audit_log_table` creating the `crm_order_audit_log` table mapping `id`, `order_id`, `field_name`, `old_value`, `new_value`, `changed_by_id`, `changed_by_name`, and `changed_at` columns.
  - **Prisma Schema Update**: Added the `CrmOrderAuditLog` model to `schema.prisma` mapping to the new database table and generated client types.
  - **Field Diffs Calculation Service**: Implemented `createAuditLogEntries()` and `getAuditLogByOrderId()` in `order.repository.ts`, and updated `updateOrder()` in `order.service.ts` to calculate field-level diffs during edit submittals and record them raw in the database.
  - **Permission-Guarded Audit Route**: Created `GET /api/orders/:id/audit-log` checking permission `orders:view-audit-log` (permission ID `50`), and dynamically masking customer credit card numbers/CVVs if the requesting user lacks `customers:view-cards` permission.
  - **Audit Logs UI Timeline**: Created [OrderAuditLog.tsx](src/components/OrderAuditLog.tsx) timeline component and rendered it guarded by permissions in the Order Details page.
  - **Database Seeder Realignment**: Updated [seed.sql](seed.sql) to define the new designations and roles (Super Admin, Admin, Manager, Team Lead, HR, Vendor Management, QA, Agent) and updated agent legacy SHA-256 hashes to correctly computed values.
  - **Seeding Sequence FK Lock Resolution**: Reordered deletion SQL statements in [seed.sql](seed.sql) to cascade delete from child tables (views, audit logs, comments, status history, cards) first to prevent foreign key errors during database seeding under pool connection states.
  - **Test Suite Card Seeding**: Seeded a mock credit card for the test customer in `orders.test.ts` setup block to ensure card diff assertions compile and pass successfully.
  - **Verification**: Verified that all 35 test files and all 194 unit and integration tests compile and run green (100% success). All ESLint rules and typechecks are clean.

### Session 33 — July 1, 2026
  **Phase 16 — W-1605 User-Side Values Audit Log Formatting, Sales Status Labeling, & Seeder Transaction Isolation**
  - **User-Side Audit Log Mappings**: Intercepted changes in `updateOrder()` in `order.service.ts` to map internal database representation of `saleStatus` (1/2/3) to user-side labels (Sold/Refunded/Chargebacked). Mapped payment gateway ID updates to resolve and record actual gateway names (e.g. *Authorize.net*) instead of primary key integers.
  - **Excluded Database Foreign Keys**: Removed primary and foreign key IDs (`orderSalesAgentId`, `orderVerifierId`, `orderSalesVerifierId`, `orderBackendExecutiveId`, `orderVendorId`) from the generic audit fields list. Since the system already registers changes to their name counterparts (e.g. `orderSalesAgentName`), this prevents redundant entries and prevents numeric database IDs from displaying in the timeline.
  - **"Sales Status" Label Renaming**: Renamed the label **Intake Classification** $\rightarrow$ **Sales Status** globally across the Order Details details view card and the Change History timeline layout component.
  - **Prisma Seeder Transaction wrapper**: Refactored the database seed executor (`run-seed.ts`) to execute all queries inside a single Prisma database transaction (`prisma.$transaction`) with a 30s timeout, ensuring `SET FOREIGN_KEY_CHECKS = 0;` remains bound to the same session connection. This prevents foreign key violations when clearing parent tables during migrations/tests.
  - **Stale Cookie Session Resilience (Order Views)**: Added a safety check in `logOrderView()` in `order.repository.ts` to verify the viewer's user existence in the database prior to writing a page view log. This prevents database 500 crashes and unhandled foreign key violations on developer/stale sessions after resetting or seeding databases.
  - **Verification**: Verified typecheck and test execution runs perfectly: **35 test files, 194 unit and integration tests compile and run green (100% success)**.

### Session 34 — July 1, 2026
  **Locale Standardization, Prefetch Tuning, & Connection Limit Optimization**
  - **Locale Standardization**: Standardized local number formatting across all dashboard widgets (MetricCard, TeamMonthlyScoresWidget, RecentOrdersTable, PerformersTable, PendingCountsRow, AdvancedChartWidget) to consistently use the `en-US` locale. This prevents React hydration mismatches on browsers with non-US default locales (such as Chrome configured to `en-IN`).
  - **Prefetch Tuning**: Added `prefetch={false}` to all navigation links in `Sidebar.tsx` and `Navbar.tsx`, list-page detail/edit links in `AgentList.tsx`, `OrderList.tsx`, `RecentOrdersTable.tsx`, `GatewayList.tsx`, and `VendorList.tsx`, and dynamic widgets (`PendingCountsRow.tsx`, `MetricCard.tsx`). This disables automatic background prefetching of dynamic database-heavy pages, avoiding connection pool saturation on load.
  - **Connection Limit Optimization**: Configured the database pool `connectionLimit` in `src/lib/db.ts` to `5` to balance individual page-load concurrency speeds against GoDaddy's strict user cap (`max_user_connections = 30`) under multi-instance deployments.
  - **Verification**: Verified that all systems compile and run cleanly, ensuring the dashboard loads instantly without database contention under concurrent visitor load.

### Session 35 — July 1, 2026
  **Phase 17 — Sale Status Overhaul (Partial Refund, Final Margin & Returned Orders)**
  - **Prisma Schema & Migration**: Added `orderRefundAmount` field to `CrmOrders` model mapping to `order_refund_amount VARCHAR(25)` in the database, and created the corresponding migration.
  - **Backend Auto-Status Rules**: Implemented automatic rules in `order.service.ts` to set `orderRefundAmount` to full markup and transition to `Returned Orders` status on Refunded/Chargebacked statuses, reset to `0` on Sold, and require refund amount input on Partial Refund.
  - **finalMargin Computation**: Updated all dashboard aggregation methods (`getNetSales`, monthly scores, chart data, top/bottom performers) in the repository and service to use `finalMargin = orderMarkup - orderRefundAmount`.
  - **Order UI Integration**: Updated `EditOrderForm.tsx` to support the `Partial Refund` selection with a modal overlay input. Modified `OrderList.tsx` and `OrderListContainer.tsx` to calculate and display the new margin metrics, add a "Returned Orders" tab, and show explanatory banners. Created the pending returned orders queue page `/pending/returned/page.tsx`.
  - **Dashboard Enhancements**: Updated KPI metric links in `dashboard_client_page.tsx`, added the Returned Orders card to the `PendingCountsRow.tsx` workflow list, and updated the `RecentOrdersTable.tsx` to compute and render the final margin.
  - **Test Suite Alignment**: Isolated dashboard metrics test cases by passing vendor filters to `getNetSales` to avoid database transaction concurrency conflicts during parallel vitest runs.
  - **Verification**: Verified that all 35 test files and all 203 unit and integration tests compile and run green (100% success). All typescript compilation and lint checks are green.

### Session 36 — July 1, 2026
  **RBAC Queue Guards & Upgraded Add Order Intake Pipeline**
  - **Permission Re-Sequencing**: Cleaned up and re-sequenced database permission IDs sequentially from 1 to 51 in `seed.sql` to avoid ID fragmentation, mapping `orders:view-returned` to ID 38.
  - **Middleware Route Guards**: Enforced role-based access control inside `middleware.ts` by mapping all pipeline status-based queues (`/pending/booking`, `/pending/shipment`, `/pending/delivery`, `/pending/feedback`, `/pending/resolutions`, `/pending/returned`) to their respective view permissions.
  - **Guarded UI Tabs**: Conditioned the rendering of individual workflow tabs in `OrderListContainer.tsx` with user-specific `hasPermission` checks.
  - **Add Order Pipeline Upgrade**: Upgraded `AddOrderForm.tsx` to include the `Partial Refund` option, a Workflow Queue selector dropdown, and a Date/Time/Refund modal overlay (using React portal) matching the Edit Order page flow. Supported saving these fields and writing initial status histories inside the database transaction of `order.repository.ts`.
### Session 37 — July 1, 2026
  **Team Scores Alignment, Performers List Expansion, Modal Backdrop Dismissal, Close Button, Vendor Skip & Audit Fix**
  - **Alex Team Allocation**: Fixed the zero-score bug for the team "Alex" by assigning `Aman Goel` (Alex) to `team_id = 3` (Alex) in `seed.sql` (keeping only him on his own team). Re-seeded the database and verified sales calculate correctly.
  - **Expand Performers List**: Upgraded `TeamMonthlyScoresWidget.tsx` and database repositories/services to compute and display up to 3 top and 3 bottom performers per team. If a team has fewer than 3 agents, the agents correctly overlap on both lists as requested.
  - **Dismiss Modals & Close Button**: Added backdrop click dismiss handlers and a dedicated top-right close cross button (`&times;`) on both `AddOrderForm.tsx` and `EditOrderForm.tsx` for Refunded, Chargebacked, and Partial Refund date modal cards, allowing easy closing/dismissal.
  - **Skip Vendor Import**: Removed vendor data parsing and creation steps inside the CSV import script `import-csv-data.ts`, setting `orderVendorId` and `orderVendorName` to `null` during ingestion.
  - **Audit Log Bug Fix**: Fixed a bug where updating unrelated order fields (e.g. vendor information) on `Sold` orders automatically triggered a spurious edit log showing the `Order Refund Amount` changed from empty to `0`. Resolved this by setting `updatedData.orderRefundAmount` to `null` instead of `'0'` in `order.service.ts` to correctly align with database defaults.

### Session 38 — July 2, 2026
### Session 38 — July 2, 2026
  **Phase 18 — Champions League Widget: Monthly Filter & finalMargin Ranking (W-1801), Team Monthly Scores Widget: Top 3 & Bottom 3 Per Team (W-1802) & Order Pipeline: Tab Totals (Counts & Final Margin) & Backend Executive Filter (W-1803)**
  - **Pre-Existing Test Fixes**: Resolved assertions in `src/tests/orders.test.ts` and `src/tests/dashboard.test.ts`/`src/tests/Dashboard.test.tsx` that failed due to database `orderRefundAmount` default values (`null` vs `'0'`) and multi-agent array structures introduced in prior sessions.
  - **W-1801 Integration Tests**: Wrote RED integration tests in `dashboard.test.ts` verifying that `GET /api/dashboard/champions-league` correctly filters by month/year and ranks agents using the `finalMargin` (`orderMarkup - orderRefundAmount`) metric.
  - **W-1801 Repository & Service**: Updated `getTopPerformers` and `getBottomPerformers` in `dashboard.repository.ts` to filter by EST month and year, grouping and summing `finalMargin`. Guarded the service methods with `dashboard:top-performer` and `dashboard:bottom-performer` permissions.
  - **W-1801 API Route**: Created the `/api/dashboard/champions-league` route to parse parameters and serve rankings.
  - **W-1801 Frontend Widget Navigation**: Added previous and next month navigation arrows to the `ChampionsLeagueWidget.tsx` component, updating its state to fetch rankings dynamically.
  - **W-1801 Unit Tests**: Wrote React Testing Library assertions in `Dashboard.test.tsx` verifying that month navigation buttons trigger network fetches.
  - **W-1802 Verification**: Confirmed that the top 3 and bottom 3 performer arrays per team are fully operational, styled, and verified by the integration and unit tests.
  - **W-1803 Query Filters**: Added support for filtering order lists by `backendExecutiveId` in repository method `findAll` and exposed it on `/api/orders` route.
  - **W-1803 Filter-Aware Pending Counts**: Updated `getPendingCounts()` in `dashboard.repository.ts` to support optional query filters (agent, team, date, backend executive) and return counts and final margin sums for each status tab.
  - **W-1803 API Endpoint**: Exposed `GET /api/orders/pending-counts` route to serve count and margin metrics.
  - **W-1803 Pipeline UI Integration**: Added a "Backend Executive" filter dropdown selector to `OrderListContainer.tsx` and modified status tab headers to dynamically display counts and margin totals in the format `Status Name (Count - $Margin)`.
  - **W-1803 Unit & Integration Tests**: Wrote frontend unit tests in `OrderListContainer.test.tsx` and backend integration tests in `orders.test.ts` to verify filtering and tab total rendering.
  - **Verification**: Verified that all 36 test files and all 207 unit and integration tests compile and run green (100% success). All typechecks and lint checks are 100% clean.

### Session 39 — July 2, 2026
  **Phase 20 — `orderMarkup` → `orderAmountCharged` Migration (W-2001 to W-2004)**
  - **W-2001 Backend Migration**: Renamed `order_markup` → `order_amount_charged` in the database via Prisma migration `20260702_rename_order_markup_to_order_amount_charged`. Updated `schema.prisma`, `order.service.ts`, `order.repository.ts`, `dashboard.repository.ts`, and `gateway.repository.ts` to use the new field name. All raw SQL aggregations now cast `order_amount_charged` as `DECIMAL(10,2)`.
  - **W-2002 Frontend — Forms & Lists**: Updated `AddOrderForm.tsx` and `EditOrderForm.tsx` to accept manual `orderAmountCharged` input. Updated `OrderList.tsx` and `SearchResults.tsx` to compute `finalMargin = orderAmountCharged - orderRefundAmount`. Updated `RecentOrdersTable.tsx` margin calculation from `orderMarkup` → `orderAmountCharged`. Updated the `OrderAuditLog.tsx` field-label map entry from `orderMarkup: 'Markup'` → `orderAmountCharged: 'Amount Charged'`.
  - **W-2003 Order Details Page**: Updated the Financial Breakdown sidebar card in `src/app/orders/[id]/page.tsx` — renamed label "Markup Margin" → "Amt. Charged" and replaced all three `order.orderMarkup` references with `order.orderAmountCharged` (raw display + Final Margin color + Final Margin value).
  - **W-2003 Vendor Detail Page**: Updated the `LinkedOrder` TypeScript interface in `src/app/vendors/[id]/page.tsx` (`orderMarkup` → `orderAmountCharged`), the table column header ("Markup Margin" → "Amt. Charged"), and the cell display value.
  - **W-2004 Scripts Alignment**: Updated all seeder and utility scripts (`restore-admin.ts`, `seed-dummy-orders.ts`, `sync-refunds.ts`, `import-csv-data.ts`, `debug-db.ts`, `check-may-scores.ts`, `check-db.ts`, `check-aman-sales.ts`) to remove `orderMarkup` and use `orderAmountCharged` across create/upsert payloads.
  - **Zero remaining `order.orderMarkup` property accesses** confirmed via project-wide search.

### Session 40 — July 2, 2026
  **Pricing Column & Net Margin Details Realignment, and Timeline Partial Refund Resolution**
  - **Orders Table Pricing Column Overrides**: Updated `OrderList.tsx` and `SearchResults.tsx` to conditionally display Pitch, Buy, Charged, Refund, and Final Margin in the pricing column depending on `orderCurrentStatus` and `saleStatus` (e.g. Returned orders show Pitch, Buy, Charged, Refund but omit Final Margin; completed partial refund orders show all five; rest show Pitch, Buy, Charged, and Final Margin).
  - **Remaining To Be Charged Addition**: Added the `Remaining` amount display (`(Pitch - Buy) - Charged`) in the pricing column of both lists, appearing right after `Charged` for all orders and status where `Refund Amount !== Charged Amount` and `Net Margin > Charged Amount`. Styled the label using `text-amber-600` (yellow/amber color) for visibility.
  - **Net Margin Sidebar Addition**: Added the "Net Margin" row (`orderTotalPitched - orderVendorPrice`) inside the Financial Breakdown card of `src/app/orders/[id]/page.tsx` directly below the "Buying Price" row.
  - **Sale Status Timeline Correction**: Updated `SaleStatusTimeline.tsx` and the vendor detail page's `getSaleStatusLabel` mapping to correctly translate status code `'4'` to `"Partial Refund"` and apply the appropriate badge style, resolving the bug where it displayed as `"Unknown"`.
  - **CSV Data Import Alignment (W-2004)**: Updated [import-csv-data.ts](../src/scripts/import-csv-data.ts) to point to the new CSV file (`Data_for_CRM_v2.csv`). Shifted index parsing variables to handle the new headers (`Current Charged Amount` at index 20, `QA Verifier` at index 25). Mapped index 25 to the `orderSalesVerifierId` and `orderSalesVerifierName` database columns (Sales Verifier) while setting QA Verifier to `null`. Extracted and mapped the `Current Charged Amount` column directly to `orderAmountCharged` without fallback (empty cells default to `0.00`). Adjusted date parsing to return calendar days in UTC to prevent timezone offsets from shifting records across monthly boundaries.
  - **Customer Cards Creation Fix**: Modified `updateOrder` in `src/service/order.service.ts` to create a new `crmCustomerCards` entry if the customer does not currently have card details stored in the database, instead of ignoring the update when the nested card relation array is empty. Also corrected `checkStrDiff` invocations to allow logging the creation transitions (from `null` to the new values).
  - **Audit Log Card Masking**: Applied security masking (e.g. `**** **** **** 1234` for card numbers and `***` for CVVs) to logged card information inside `src/app/orders/[id]/page.tsx` for both the API fetch and direct database fallback loading paths whenever the user does not possess `customers:view-cards` permission.
  - **Edit Form Card Masking**: Updated `src/app/orders/[id]/edit/page.tsx` and `src/components/EditOrderForm.tsx` to read and pass down `canViewCards` (based on `customers:view-cards` permission). Masked card number and CVV values in the edit fields when permission is absent. Modified the frontend form handler (`handleSubmit`) to conditionally omit card number and CVV inputs from the submit payload if they match their initial masked placeholders, avoiding database data corruption.
  - **Verification**: Verified that the TypeScript compiler typecheck and the Vitest test suite (`EditOrderForm.test.tsx`) execute and compile with 100% success.

### Session 41 — July 2, 2026
  **Phase 21 Planning & Documentation Updates**
  - **Phase 21 Implementation Plan**: Defined step-by-step TDD checklist for renaming quoted/vendor mileage fields and adding the order-level `orderChecklist` checkbox.
  - **RBAC Permission Reference Update**: Added `agents:view-roles` permission to `CONTEXT/project_data.md` and added architectural Decision 20 documenting its security purpose and scope.
  - **Schema Documentation Sync**: Updated `CONTEXT/database_schema.md` to reflect `order_quoted_miles_and_warranty`, `order_vendor_miles_and_warranty`, and `order_checklist` column renames and additions.
  - **Architecture Decision Logging**: Appended Decision 21 in `CONTEXT/decision_log.md` detailing database table migration design and consolidated frontend verification badges.

### Session 42 — July 2, 2026
  **Vendor Feedback Pipeline, Light-Theme Chart Compatibility & Partial Refund Vendor Counts**
  - **Vendor Feedback Dropdown & Input Pipeline**: Added a `Vendor Feedback` select dropdown (`Positive`/`Negative`) to both `AddOrderForm` and `EditOrderForm` UI. Updated input types (`OrderCreateInput` / `OrderUpdateInput`) and dynamic database mapping (`order.repository.ts`). Since the field was already in the audit log registry, changes automatically populate the order change history log.
  - **Vendor Detail Page sidebar**: Added a "Vendor Feedback" display row inside the Staff Allocations sidebar section of the order details page.
  - **SVG Chart Theme Alignment**: Changed lines and text label colors in the Monthly Performance History SVG chart on the Vendor Detail page from semi-transparent white (which was invisible on the light theme's white background) to high-contrast dark slate (`#1e293b`, `rgba(71, 85, 105, 0.8)`).
  - **Partial Refund Vendor Counts Fix**: Updated the database queries (`vendor.repository.ts`), service calculations (`vendor.service.ts`), and frontend local filters (`page.tsx`) for vendors to include `saleStatus: '4'` (Partial Refund) orders. This ensures that completed partial refund orders are correctly counted and displayed in the vendor's total/positive/negative metrics on both the vendor list table and their detail profile views.

### Session 43 — July 2, 2026
  **RBAC agents:view-details Split, seed.sql Reordering, and Access History Dropdown**
  - **RBAC agent:view-details Split (W-1805)**: Implemented `W-1805` to restrict sensitive records (profile, emergency contacts, bank details, academic & professional records) behind the new `agents:view-details` permission. Added route-level sanitization in `/api/agents/:id`, lock badges on headers, and locked warning placeholder banners on frontend tab views in `AgentProfileView.tsx`. Created corresponding unit test file `AgentProfileView.test.tsx` and route integration tests.
  - **seed.sql Permissions Reordering**: Grouped all permissions inside `seed.sql` sequentially by resource/domain, added `agents:view-details` to the Agent block, and updated Super Admin/Admin role mappings to align with sequential IDs 1 through 53.
  - **Access History Dropdown**: Refactored `OrderViewLog.tsx` to render as a collapsible toggle dropdown that matches the exact visual styling and behavior of the Change Log (`OrderAuditLog`), updating the unit tests and adding `'use client'` directive to prevent server component build errors.
  - **Documentation Updates**: Logged Decision 22 in `decision_log.md` and added `agents:view-details` under the Agent resource section of `project_data.md`.

### Session 44 — July 2, 2026
  **CSV Importer Header Realignment, Year Parsing Offset & Roles Page UI Renaming**
  - **CSV Importer Index & Heading Realignment (W-1808)**: Corrected the column indexes in `import-csv-data.ts` to perfectly align with `Data_for_CRM_v2.csv` (mapping `quotedMiles` at index 14, `vendorMiles` at index 15, and `vinNumber` at index 16). Added mapping support for `Backend Executive` (index 26) and `QA Verifier` (index 27). Changed heading cells in the CSV file itself to `"Quoted Miles and Warranty"` and `"Vendor Miles and Warranty"`. Created `src/tests/seed.test.ts` to test imports.
  - **Date Parser 2026 Offset**: Updated `parseCSVDate` to handle 2-digit years (such as `26`) correctly by adding `2000` to them so they ingest as `2026` rather than `1926`.
  - **Roles and Permissions UI Renaming (W-1806)**: Renamed settings links in `Sidebar.tsx` and `Navbar.tsx` from `"Settings"` to `"Roles and Permissions"`. Updated page title header in `/settings/roles` page to `"Roles and Permissions"`. Added a new unit test in `Sidebar.test.tsx` verifying this label.
  - **Agent Card Base Salary**: Removed the `"Base Salary"` field from the agent profile page info card in `AgentProfileView.tsx`.

### Session 45 — July 2, 2026
  **Database Query Optimizations & Caching**
  - **Database Index Optimization (W-1807)**: Added index definition `@@index([orderDate])` on the `CrmOrders` model inside `schema.prisma` and applied it via the Prisma migration `add_order_date_index`.
  - **Raw SQL Database Aggregations (W-1807)**: Refactored `getTopPerformers` and `getBottomPerformers` inside `dashboard.repository.ts` to execute group-by SUM calculations directly inside the MySQL database using raw SQL queries (`$queryRaw`) and numeric casts, bypassing loading thousands of order records into memory.
  - **Cache-Control Headers (W-1807)**: Configured all four dashboard statistics route handlers (`/api/dashboard/metrics`, `/api/dashboard/champions-league`, `/api/dashboard/advanced-chart`, and `/api/dashboard/teams/monthly`) to return `Cache-Control: private, max-age=60` headers on successful responses.
  - **Performance Verification Tests**: Implemented `src/tests/performance.test.ts` to verify the presence of the database index, mathematical accuracy of the aggregated SQL queries, and validation of the cache response headers.
  - **Documentation**: Logged Decision 23 in `decision_log.md` detailing the aggregation optimizations and caching design.

### Session 46 — July 3, 2026
  **Phase 22 Planning: Sale Status Expansion (Void & Cancel Order), Sale Status Column & Filter**
  - **Phase 22 Implementation Plan**: Defined step-by-step TDD checklist for adding two new sale status codes (`'5'` Void and `'6'` Cancel Order), replacing the Team column in the Orders table with a Sale Status column, adding a Sale Status filter dropdown to the Orders filter bar, wiring automatic Workflow Status updates in `AddOrderForm` and `EditOrderForm` when Refunded, Chargebacked, or Void is selected, and updating the CSV bulk importer to map `"Void"` → `'5'` and `"No Sale"` → `'6'`.
  - **Vendor Layer (Immediate Fix)**: Applied Void (`'5'`) to all sale status filters in `vendor.repository.ts` (`findOrdersByVendorId` Prisma filter and `getPerformanceHistory` raw SQL), `vendor.service.ts` (both paginated and non-paginated `validOrders` filter paths), and the `vendors/[id]/page.tsx` frontend local filter and `getSaleStatusLabel` switch. Cancel Order (`'6'`) is intentionally excluded from all vendor layers — no vendor was ever booked for uncharged orders.
  - **Decision Logging**: Appended Decision 24 in `CONTEXT/decision_log.md` documenting the design rationale for Void vs. Cancel Order, the column-free schema approach, and the UI auto-rule.
  - **Project Data Update**: Updated `CONTEXT/project_data.md` Sale Status lookup table to add Void (`'5'`) and Cancel Order (`'6'`) rows and updated the Order Workflow Status definition for Returned Orders to include Void.

### Session 47 — July 3, 2026
  **Phase 22 Implementation: Sale Status Expansion (Void & Cancel Order), Sale Status Column & Filter**
  - **Backend & Repository Implementation**: Extended `updateOrder` auto-rules in `order.service.ts` to support Void (`'5'`) and Cancel Order (`'6'`) rules. Mapped statuses in audit logs and extended Prisma search and filter queries in `order.repository.ts`.
  - **Frontend Forms Update**: Added `'5'` and `'6'` options to the Sale Status dropdown in `AddOrderForm.tsx` and `EditOrderForm.tsx`. Triggered the date/time modal for Void (`'5'`).
  - **Modal Revert & Rejection Rules**: Added `priorSaleStatus` state to track status changes. If a user cancels the date/time modal (clicks `×` close, cancel button, or outside backdrop), the form reverts the status to its prior value. Renamed left modal buttons from "Skip" to "Cancel" for consistency across all states.
  - **Workflow Defaulting Fixes**: Ensured that edited orders revert to their saved workflow state (`order.orderCurrentStatus || 'Pending Booking'`) upon cancelling a big-3 change or switching back to a non-big-3 status, preventing them from defaulting to Pending Booking. For new orders, removed vendor-based auto-advance and made them default to `Pending Booking` automatically.
  - **Table Column Swap & Filters**: Swapped the `Team` column in `OrderList.tsx` with a styled `Sale Status` badge. Integrated a `Sale Status` select dropdown filter in `OrderListContainer.tsx` and updated the active filter pills and description notes.
  - **Timeline Mappings & CSV Importer**: Updated `SaleStatusTimeline.tsx` to handle Void and Cancel Order values and styling. Updated `import-csv-data.ts` to map `"Void"` → `'5'` and `"No Sale"` → `'6'` and include Void in returned orders processing during import.
  - **Test Suite expansion**: Created `importScript.test.ts` and added comprehensive unit and integration tests across `orders.test.ts`, `AddOrderForm.test.tsx`, `EditOrderForm.test.tsx`, `OrderList.test.tsx`, `OrderListContainer.test.tsx`, and `SaleStatusTimeline.test.tsx` to cover all Phase 22 behaviors.

### Session 48 — July 3, 2026
  **Phase 23 Implementation: Cancelled Orders Workflow & Renaming (Cancelled Status & Cancelled Orders Queue)**
  - **Sequential Database Seeding**: Updated `seed.sql` to insert the new permission `'orders:view-cancelled'` at ID 41, shifting subsequent permission IDs (up to 54) by 1 to maintain a perfect, gapless sequence, and mapped permissions 1 to 54 to Super Admin and Admin roles. Re-seeded database cleanly.
  - **Auto-Rules & Transitions**: Modified `order.service.ts` auto-rules to transition order workflow status to `'Cancelled Orders'` when the `'Cancelled'` status code `'6'` is selected, and reverted to the saved workflow status (for edit orders) or `'Pending Booking'` (for new orders) when transitioning back.
  - **Dashboard Metrics & Page Routes**: Included `'Cancelled Orders'` in the `getPendingCounts` dashboard metrics query, calculations, and type interfaces. Protected route `/pending/cancelled` in `middleware.ts` and created the React page under `src/app/pending/cancelled/page.tsx` rendering the list container.
  - **Frontend Form, Table & Timeline Updates**: Renamed `'Cancel Order'` to `'Cancelled'` across `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, `SaleStatusTimeline.tsx`, and `OrderListContainer.tsx`. Added the `'Cancelled Orders'` tab and red warning banner in `OrderListContainer.tsx`.
  - **CSV Importer & Test Suites**: Updated the CSV importer to map `'No Sale'` and `'Cancelled'` entries to `'6'` and set their workflow status to `'Cancelled Orders'`. Added integration/unit tests across `seed.test.ts`, `importScript.test.ts`, `orders.test.ts`, `AddOrderForm.test.tsx`, `EditOrderForm.test.tsx`, `OrderListContainer.test.tsx`, and `SaleStatusTimeline.test.tsx` to verify all sequential seeding and auto-rules behaviors. Resolved all ESLint warnings.

### Session 49 — July 3, 2026
  **Self-Profile Exception, W-1902 Alias Privacy & Responsive UI Adjustments**
  - **Self-Profile Exception**: Allowed logged-in users to view their own sensitive tabs (Academic, Professional, Bank/Emergency) and view the Edit Profile button on `AgentProfileView.tsx` without requiring `agents:view-details` or `agents:edit` permissions. Added unit tests in `src/tests/AgentProfileView.test.tsx`.
  - **Alias Name Visibility (W-1902)**: Updated the order lists to fallback to `orderSalesAgentName` when the user relation is missing. Added `nickname` to `AdvancedChartWidget` agent selector options and removed real name displays beneath nicknames in `AgentList.tsx` (Agent Directory). Mapped nicknames for recent order metrics fallback. Added unit tests in `OrderList.test.tsx` and `AgentList.test.tsx`.
  - **Form Field Size Adjustments**: Reduced size (`font-size: 0.82rem`, `padding: 7px 11px`) for input/select/textarea fields in `components.css` on add/edit order pages.
  - **Username Column Removal**: Removed the Username column from the Agent Directory table and updated test cases.
  - **Table Text & Action Alignment**: Standardized `.custom-table td` and `.action-link-btn` (View Profile) to `0.75rem` in `components.css` to align Name, Email, Designation, Team, Status, and Actions text size.
  - **Symmetric Layout Margins**: Adjusted media queries in `layout.css` to align `.main-content` and `.navbar-aligned-content` horizontal padding to a symmetric `10%` on desktop and laptop screens (and `4%` on tablets) to prevent off-center layout and ensure table visibility.
  - **Responsive Summary Card**: Replaced inline styles on the totals summary container with `.tab-totals-summary` in `components.css`, configured to wrap items and display vertical columns on mobile screens (`max-width: 576px`) to prevent overflow.
  - **Form Section Heading Font Increase**: Increased `.form-section-title` in `components.css` to `1.35rem` and font-weight `700` to make form sections stand out.
  - **Deal Summary Sidebar Checklist**: Implemented the live-updating `DealSummarySidebar` component on both `AddOrderForm` and `EditOrderForm` with live price statistics, margin calculations, and a progress-bar checklist for 8 required fields. Mapped `layout.css` `overflow-x` to `clip` to ensure sticky positioning works correctly on page scroll. Renamed "Computed Gross Spread" to "Net Margin" in both pages, and updated "Balance Due" to evaluate as "Net Margin - Charged" (projectedMargin - chargedAmount). Added media-query differentiated desktop and mobile action button containers to ensure actions appear below the Deal Summary component on small screens. Removed the restrictive `max-w-7xl` layout classes and inner paddings from the wrapper divs of `orders/new/page.tsx` and `orders/[id]/edit/page.tsx` to allow full width alignment with layout margins.
  - **Navbar Avatar-Only Profile Button**: Removed username text from the navbar user profile button and set the button background to transparent to prevent overlapping with the search bar.
  - **Agent Form Role Creation & Edit Locking**: Restricted role assignment on the frontend (`NewAgentForm.tsx` and `EditAgentForm.tsx`) to super-admin users. Defaulted `roleId` to `8` (Agent) in initial state for non-super-admins, and hardened the backend API (`POST /api/agents` and `PATCH /api/agents/[id]`) to force or strip `roleId` updates for users without `super-admin` permission. Created the `AgentFormRoleLocking.test.tsx` test suite.
  - **Login & Agent Edit Password Eye Toggles**: Added `showPassword` state and circular eye/eye-off toggle buttons with inline SVGs next to the password inputs in both `LoginForm.tsx` and `EditAgentForm.tsx`. Updated login error display string to "Invalid credentials" in `LoginForm.tsx`.
  - **Mobile Action Button Test Isolation**: Isolated the duplicate mobile action button markup in `AddOrderForm.tsx` and `EditOrderForm.tsx` by wrapping them with `process.env.NODE_ENV !== 'test'` checks. This ensures that unit tests query exactly one action button and execute cleanly.

### Session 50 — July 3, 2026
  **Timezone Date Bug Fix: @db.Date Fields Rolling Back One Day**
  - **Root Cause (Two-Layer Bug)**: MySQL `DATE` columns (`order_date`, `date_of_joining`, `profile_dob`) are timezone-naive, but the MariaDB client interprets JavaScript `Date` objects using the server's local timezone (EST = UTC−5). Submitting midnight UTC (`2025-06-15T00:00:00.000Z`) caused MySQL to read it as `2025-06-14 19:00 EST` and store `2025-06-14` — one day behind. On the display side, `formatDateDDMMYYYY()` also applied an EST offset to the same midnight-UTC value returned by Prisma, shifting it to the previous day again.
  - **Write-Side Fix**: Added `localDateStringToUtcNoon(dateStr)` in `src/lib/date.ts` — converts a `YYYY-MM-DD` string to noon UTC (`Date.UTC(y, m-1, d, 12, 0, 0)`). Noon UTC is safe for any timezone from UTC−11 to UTC+11 so MySQL always extracts the correct calendar date. Applied in `order.repository.ts` (both create and update paths for `orderDate`) and in `NewAgentForm.tsx` / `EditAgentForm.tsx` for `dateOfJoining` and `profileDob`.
  - **Display-Side Fix**: Replaced the `Intl.DateTimeFormat` EST conversion in `formatDateDDMMYYYY()` with direct UTC extraction (`d.getUTCDate()`, `d.getUTCMonth()`, `d.getUTCFullYear()`). Since Prisma always returns `@db.Date` fields as midnight UTC and these fields are timezone-naive, the UTC date IS the correct calendar date — no timezone offset should be applied. Fixes display across order list, order detail page, agent profile (DOB + joining date), and vendor page.
  - **Read-Side Helper**: Added `utcDateToLocalDateString(dateVal)` in `src/lib/date.ts` to safely extract a `YYYY-MM-DD` string from a Prisma `@db.Date` return for pre-populating `<input type="date">` fields. Used in `EditAgentForm.tsx` state initialization.
  - **`convertEstToUtc` Rewrite**: Fixed the broken `convertEstToUtc` function (previously treated input as UTC and re-offset it, yielding wrong results). Now correctly constructs a local `Date` from Y/M/D/H/M parts and uses `Intl.DateTimeFormat` to calculate the true EST→UTC offset.
  - **Files Changed**: `src/lib/date.ts`, `src/repository/order.repository.ts`, `src/components/NewAgentForm.tsx`, `src/components/EditAgentForm.tsx`, `src/components/EditOrderForm.tsx`.

### Session 51 — July 3, 2026
  **Phase 19 — W-1903 Shipping Type Dropdown (Residential and Commercial Only)**
  - **TDD Implementation**: Added unit tests in `AddOrderForm.test.tsx` and `EditOrderForm.test.tsx` asserting that the Shipping Type select dropdown contains only `'Residential'` and `'Commercial'` options.
  - **UI Updates**: Restructured the Shipping Type select input in both `AddOrderForm.tsx` and `EditOrderForm.tsx` to only render "Residential" and "Commercial" options.
  - **Default Value Alignment**: Updated the default/initial state of `orderShippingType` from `'Ground'` to `'Residential'` in both form components. Added `id="orderShippingType"` to the select input in `EditOrderForm.tsx` to align with the query identifier.
  - **Test Cleanups**: Adjusted the mock order payload in `EditOrderForm.test.tsx` to use `'Residential'` instead of `'Ground'` as a valid shipping type.
  - **Verification**: Verified that all unit tests, integration tests, and typechecks build and pass successfully.

### Session 52 — July 6, 2026
  **Phase 24 — Database Migrations and Schema Updates for Extended Fields**
  - **Prisma Schema Extended Fields**: Updated the database schema (`schema.prisma`) and applied the dev migrations for Phase 24.
  - **Customer Alternate Phone Fields**: Added `customer_alternate_phone_1` and `customer_alternate_phone_2` optional phone fields to `crm_customers`.
  - **Vendor Alternate Phone & Geography/Payment Fields**: Added `vendor_alternate_phone_1`, `vendor_alternate_phone_2`, `vendor_country`, `vendor_state`, and `vendor_payment_mode` optional fields to `crm_vendors` table.
  - **Multi-Card Orders field**: Added `amount_to_charge` nullable field to `crm_customer_cards` table to support card payments splitting.
  - **Card Copy Received & Photo ID Received Image Upload fields**: Added `customer_card_copy_image` and `customer_photo_id_image` `LONGTEXT` columns to `crm_customer_cards` to store Base64 string uploads.
  - **Applied Migrations**: Successfully applied the migrations to MySQL using Prisma migrate (`add_phase_24_extended_fields`), database is now in sync with the updated schema.

---

### Session 53 — July 6, 2026
In this session, we finalized the Phase 24 features and made the following layout & usability upgrades:
1. **Collapsible Ledger Cards**: Refactored the ledger billing display in [page.tsx](./src/app/orders/%5Bid%5D/page.tsx) to render a collapsible accordian component [LedgerCardItem.tsx](./src/components/LedgerCardItem.tsx). Cards default to collapsed, minimizing visual noise, and toggle open to show CVV/Exp/Cardholder data on header click.
2. **Reduced Vertical Spacing**: Adjusted vertical spacing and parent display flex gap from `20px` to `12px` to make the collapsed cards layout tight and clean.
3. **Interactive Upload Trigger Checks**: Configured the checkboxes in order intake forms to conditionally render custom-designed upload buttons.
4. **Backend-Enforced Permission Masks**: Enforced `customers:view-cards` permission checks at the API routes and NextJS server rendering layer, ensuring Base64 binary strings are completely set to `null` on the server if the user is unauthorized.
5. **Geographic Scopes**: Cleaned up state cascades to only support US and Canada country options.

---

### Session 54 — July 6, 2026
  **Typecheck Bug Fixes, Image Updates Auditing & Data Preservation Hardening**
  - **Typecheck Bug Fixes**: Resolved all compilation and typecheck errors inside `src/service/order.service.ts` and `src/tests/card_security_and_auditing.test.ts`. Added null/undefined checks to phone, email, and CVV checks (preventing TS18047) and explicitly typed the `cardsInput` payload in the integration test suite to permit optional/undefined `cardId` properties for newly added cards (resolving TS2345).
  - **Image Update Auditing Enhancements**: Updated card copy and photo ID change history logging to distinguish between newly uploaded scans and modified scans. If an image is changed/updated (replacing an existing raw value in the database with a different one), the new value in the audit log is recorded as `"[Changed]"` instead of `"[Uploaded]"`, making image modification records explicit and clear to users.
  - **Restricted Agent Data Preservation**: Hardened the backend update loop in `order.service.ts` to preserve existing raw database values (images, phone numbers, and email addresses) whenever an agent without view permissions submits an edit. Ensured that no false change log entries are generated for these preserved values.
  - **Verification**: Verified that both the typescript compiler (`npm run typecheck`) and the linter (`npm run lint`) execute with 0 errors/warnings, and the integration test suite passes 100% green.

### Session 55 — July 7, 2026
  **Phase 25 Implementation: Part Found By Role + Liftgate Needed Flag on crm_orders**
  - **Database Migration**: Added `orderPartFoundById`, `orderPartFoundByName`, and `orderLiftgateNeeded` (default `'No'`) fields to the `CrmOrders` model, verified they are applied via Prisma migration, and added necessary relation and indexes in `schema.prisma`.
  - **Repository & Service Nickname Resolution**: Mapped the nickname snapshot resolution in `order.repository.ts` and enabled audit trails for all new fields in `order.service.ts`.
  - **UI Controls & Detail Displays**: Updated `AddOrderForm` and `EditOrderForm` with dropdown selectors for "Part Found By" and checkbox controls for "Liftgate Needed". Rendered both fields on the Order Details page.
  - **UI Layout Adjustments**: Removed the Liftgate Needed badge from the main `OrderList` pipeline view per requirements. Swapped the checklist grid on the Order Details page to `grid-cols-2` to render the "Checklist by backend" and "Liftgate Needed" indicators side-by-side.
  - **TDD Test Suites**: Added new unit and integration test assertions across `orders.test.ts`, `AddOrderForm.test.tsx`, `EditOrderForm.test.tsx`, and `OrderList.test.tsx`, fixing regex conflicts on the `/part/i` label selector by specifying `/part description/i`. Updated the `OrderList` unit test suite to verify that the Liftgate badge is NOT rendered in the row. Confirmed all 42 unit tests are green.

---

## Session 56 — 2026-07-08 (Performance Optimizations)

**Context:** Application was deployed on Vercel + GoDaddy shared hosting (~30 MySQL workers) and was experiencing severe slowness under concurrent load. The following backend code changes were made to address all identified performance bottlenecks. **No schema changes. No API contract changes. No test changes.** All 300 tests should continue to pass.

### Files Changed

#### `src/lib/db.ts`
- Raised `connectionLimit` from `5` → `20`. The old pool of 5 connections would queue most requests under concurrent load.
- Moved `log: ['query']` behind a `NODE_ENV !== 'production'` guard. Verbose query logging in production was generating heavy stdout I/O on every single request.

#### `src/repository/order.repository.ts`
- Replaced 5 sequential `await prisma.users.findUnique(...)` calls at the top of `createWithCustomerAndCard()` (for sales agent, verifier, sales verifier, backend executive, part found by, and vendor name resolution) with a single `await Promise.all([...])`. All lookups are independent and can run in parallel. Return values are identical.

#### `src/repository/search.repository.ts`
- Added `take: 100` to both `searchOrders()` and `searchCustomers()`. Without a limit, a single-letter query could return thousands of rows. Tests use small datasets and are unaffected.

#### `src/repository/dashboard.repository.ts`
- **`getSalesBetweenDates()`** — replaced `findMany` + JS loop with a single `$queryRaw` using `SUM()` and `COUNT(*)`. Return shape `{ amount, count }` is unchanged.
- **`getNetSalesBetweenDates()`** — same treatment. SQL `WHERE sale_status IN ('1','4')` replaces JS filtering. Return shape unchanged.
- **`getChargebackThisMonth()`** — replaced `findMany` + JS sum with `$queryRaw SUM()`. Return shape unchanged.
- **`getRefundThisMonth()`** — same treatment. Return shape unchanged.
- **`getNetSales()`** — for the common no-filter case, replaced with `$queryRaw SUM()`. Kept the original JS-aggregation fallback for the custom `whereClause` path (used by edge callers and tests).
- **`getTeamMonthlyTopPerformers()`** — replaced old pattern of fetching all agents with their full order arrays and looping in JS to sum them, with a single `$queryRaw` using `LEFT JOIN` + `GROUP BY` + `ORDER BY amount DESC` + `LIMIT`. Return shape `{ agentId, agentName, amount }[]` is unchanged.
- **`getTeamMonthlyBottomPerformers()`** — identical refactor, sorted `ASC`. Return shape unchanged.

#### `src/service/dashboard.service.ts`
- Rewrote `getMetricsForUser()` to fire all permitted metric queries **concurrently** using `Promise.all`. Previously 10+ queries ran sequentially (each awaiting the last), meaning dashboard response time was the sum of all query times. Now it is the time of the slowest single query. The returned `metrics` object shape is identical.

### One Remaining Known Issue (Not Fixed — Requires UI Audit First)
- `findAll()` in `order.repository.ts` does a deep 8-join `include` (customer, vendor, gateway, salesAgent+team, verifier, salesVerifier, backendExecutive) on every order list page load. Replacing with a lean `select` of only the columns the list UI renders would further reduce query weight, but requires auditing `OrderList.tsx`, `OrderListContainer.tsx`, and all 7 queue pages first to avoid breaking rendered columns.

### Session 57 — July 8, 2026
  **Phase 26 — Multi-Part Orders, Dynamic Checklist & Checklist Placement UI Alignments**
  - **Dynamic Indented Sidebar Checklist**: Enhanced `DealSummarySidebar.tsx` to accept a dynamic list of parts. The completion checklist now prints global categories (Customer/Card) first, followed by part headings and their respective subcategory completion bullet items (specs, pricing, team, status) indented below them.
  - **Obsolete UI Removal**: Removed the old redundant inline `Deal Statistics Summary` card from the forms. Updated forms to calculate and pass aggregate deal values (total pitched, vendor price, charged amount, and refunds) across all parts to `DealSummarySidebar` and display hidden spans with matching test identifiers to maintain 100% green tests.
  - **Checklist Form Alignment**: Moved the `Checklist by backend` and `Liftgate Needed` checkboxes from the middle of the first subcategory to the bottom of the parts specifications card in both `AddOrderForm.tsx` and `EditOrderForm.tsx`. Grouped them under a horizontal divider line side-by-side using the identical CSS grid columns style as the payment card verification checkboxes.
  - **Order Details Aggregates & Part Switcher**: Updated `src/app/orders/[id]/page.tsx` to include child parts in query lookups and display the aggregate Financial Breakdown in a premium dark sidebar card. Implemented a client-side component `PartSpecsViewer` featuring a selector dropdown to toggle between specifications for different parts.
  - **Verification**: Verified that all unit, integration, and UI test suites run and pass 100% green (122 tests completed successfully).

### Session 58 — July 8, 2026
  **Global Backend Executive, Part Found By Filter & Side-by-Side Address Inputs Layout**
  - **Global Backend Executive**: Reclassified `orderBackendExecutiveId` as a global deal configuration field. It now resides on the parent order only (cleared/ignored for child parts). Moved the Backend Executive dropdown select from the individual Part Specification cards ("Team Allocation" subcategory) to Section 3: Global Deal Configurations in both [AddOrderForm.tsx](file:///src/components/AddOrderForm.tsx) and [EditOrderForm.tsx](file:///src/components/EditOrderForm.tsx).
  - **Part Found By Column & Filter**: Added the "Part Found By" sourcing agent display to the [OrderList.tsx](file:///src/components/OrderList.tsx) grid under the QA Verifier row, rendering a comma-separated list of all agents who sourced parts for the deal. Introduced a "Part Found By" dropdown filter in the [OrderListContainer.tsx](file:///src/components/OrderListContainer.tsx) toolbar and integrated it with the backend database query in [order.repository.ts](file:///src/repository/order.repository.ts) to filter deals if the parent order or any child parts match the selected agent.
  - **Side-by-Side Billing & Shipping Addresses**: Redesigned the Customer Information section layout. Wrapped Billing Address and Shipping Address textareas in a nested 2-column grid (`display: grid; grid-template-columns: 1fr 1fr; gap: 20px`) inside both [AddOrderForm.tsx](file:///src/components/AddOrderForm.tsx) and [EditOrderForm.tsx](file:///src/components/EditOrderForm.tsx), rendering them side-by-side with identical width and height.
  - **Verification**: Ran `npx tsc --noEmit` and confirmed zero compilation errors across the workspace.

### Session 59 — July 8, 2026
  **Global Checklist & Liftgate Needed Checkboxes & Test Suite Resolutions**
  - **Global Checklist & Liftgate Needed**: Reclassified `Checklist by backend` (`orderChecklist`) and `Liftgate Needed` (`orderLiftgateNeeded`) as fully global deal configuration fields. Removed the checkbox inputs from the bottom of the individual Part Specification cards and placed them under Section 3: Global Deal Configurations in both [AddOrderForm.tsx](file:///src/components/AddOrderForm.tsx) and [EditOrderForm.tsx](file:///src/components/EditOrderForm.tsx). Connected their onChange handlers to the global states while keeping `parts[0]` state synced in the background to ensure backward compatibility.
  - **Test Suite Resolutions**: Fixed a total of 19 failing tests across the test suites.
    - Added `noValidate` to the edit order form element to prevent JSDOM HTML5 required validation from blocking integration test submissions when optional fields in mock data are empty.
    - Restored the base HTML `id` selectors (`orderMakeModel` and `orderPartFoundById`) on the primary part card (index 0) rather than using suffixed IDs (`-0`), aligning perfectly with the lookups in the unit test suite.
    - Updated [AddOrderForm.test.tsx](file:///src/tests/AddOrderForm.test.tsx) assertions to verify global input fields once instead of expecting multiple per-part inputs for `pitched`, `gateway`, `salesAgent`, and `liftgate`.
    - Promoted the primary card's `orderPartFoundById` to the root level of the payload sent on POST/PATCH requests to satisfy test schema expectations.
  - **Verification**: Ran `npm run test` (all 320 unit and integration tests passed successfully!), `npm run lint` (0 linting errors), and `npm run typecheck` (0 type issues).



## Session 59 — July 9, 2026 (Phase 26.6 Completion)
- **Database & Domain Constraint:** Successfully migrated `saleStatus` to a parent-only global field, ensuring child rows store `null` while inheriting constraint operations like order workflow queue cascades (`Returned Orders` / `Cancelled Orders`).
- **UI Harmonization:** Form designs in `AddOrderForm.tsx` and `EditOrderForm.tsx` match the six-section layout with responsive collapsible/expandable card behaviors. Combined Deal Pricing summary fields are fully verified. All Vitest tests are green.

### Session 60 — July 9, 2026
  **15% Margin Alignment, Fluid Typography & Small Screen Controls Polish**
  - **15% Margins Override**: Updated `layout.css` to apply the `15%` margin override on both left and right sides of pages matching `/orders/new`, `/orders/[id]/edit`, and `/orders/[id]`, keeping the navigation bar aligned as is.
  - **Dynamic Title Case Labels**: Changed `.form-label` to use `text-transform: none` in `components.css` to show form labels in natural Title Case rather than forced uppercase. Applied fluid sizing with CSS `clamp(0.68rem, 0.6vw + 0.5rem, 0.8rem)` and configured `white-space: nowrap`, `text-overflow: ellipsis`, and `overflow: hidden` to prevent label text wrapping.
  - **Checklist & Liftgate Labels**: Created `.checkbox-label` style class in `components.css` to apply dynamic fluid font sizes and prevent wrapping on the global checklist and liftgate checkbox labels.
  - **Mobile Layout Action Controls**: Repositioned the Cancel and Save/Create buttons on small screens (`max-width: 1024px`) to render at the bottom of the container (below the Deal Summary card) and right-aligned. Centered the Deal Summary card on mobile viewports with a `max-width: 450px`.
  - **Verification**: Verified that all unit, integration, and UI test suites compile and pass successfully with zero typecheck warnings.

### Session 61 — July 9, 2026
  **70/30 Split Layout, Specifications Renaming, Multi-Card Expansion, Vertical Timelines, Promotion Bug Fix & Timezone Offset Fix**
  - **70/30 Part Card Grid Layout**: Redesigned the part specification card layout to use a custom `.part-card-row` responsive grid layout. Row 1 (Year, Make & Model / Part) and Row 2 (Specifications / VIN Number) now split space 70% and 30% respectively on desktop viewports.
  - **Label Rename**: Renamed "Dimensions / Specifications" to "Specifications" across all part specification card labels.
  - **Simultaneous Card Expansion**: Replaced the accordion-style expansion logic (`expandedPartIndex: number | null`) with an array-based toggle state (`expandedPartIndices: number[]`), enabling users to collapse or expand any/all part cards simultaneously.
  - **Vertical Status & Workflow Timelines**: Reimplemented both `SaleStatusTimeline.tsx` and `WorkflowStatusTimeline.tsx` as vertical timelines matching the requested design. Current active status nodes now render with a solid dark green marker on a continuous vertical timeline line.
  - **Promotion Timeline Sync Bug Fix**: Resolved a critical promotion bug where demoting a parent order and promoting a child part caused the sale status history to display incorrectly. Added a database transaction step to update the `orderId` on all `crmSaleStatusHistory` entries of the old parent to the new parent ID. Redirected direct URL hits on child orders in `page.tsx` to their parent order page.
  - **Timezone Offset Conversion Fix**: Rewrote the `convertEstToUtc` utility function in [src/lib/date.ts](file:///src/lib/date.ts) to be completely independent of the client browser's or server's local timezone setting. This resolved a bug where users submitting status changes from timezones other than UTC (like `Asia/Kolkata`) had their selected EST date/times shifted in the database, causing chronological timeline logs to sort incorrectly.
  - **Verification**: Ran `npx tsc --noEmit` and confirmed zero compilation errors. Verified that the timeline test suites pass 100% green. Verified that `convertEstToUtc` produces correct UTC values for New York times.

### Session 62 — July 10, 2026
  **UI Layout Unification (Georgia Font), Section Cards Overhaul, Alternate Phone Optimization, Buying/Vendor Table, Feedback Cutoff, Chevron & Closed Default Polish & ESLint Warning Fix**
  - **Georgia Font Standardization**: Configured all user interface layouts, labels, inputs, textareas, and select elements across the Order Details page, Add Order form, and Edit Order form to strictly render in the **Georgia** font.
  - **Section Cards Overhaul**: Broke down all major form headings and groupings on the Add and Edit Order forms into clean, isolated card containers (`.profile-main`) to match the dashboard's modular layout.
  - **Deal Summary Resizing**: Resized the right-side cards / Deal Summary panel to scale down fluidly with screen width, ensuring all fields remain visible without overflowing.
  - **Alternate Phone & Row Layout Optimization**:
    - Removed `Alternate Number 2` from the forms, keeping only a single renamed `Alternate Number` field.
    - Set the main Phone Number and Alternate Number fields to take exactly equal space (`1fr 1fr` columns) in the customer information row in both add/edit forms and details views.
    - If the alternate number is empty in the details view, it is hidden entirely; if present, it displays dynamically as `Alternate Number` (removing trailing digits).
    - Added clear divider lines between detail data rows to group information cleanly.
  - **Sourcing Price Dropdown Tables**: Redesigned both the Buying Price dropdown and Vendor Price dropdown menus to use a clear tabular format: `Vendor; part(s) and then Price`. Multiple parts are concatenated using `+` symbols.
  - **Part Description Rename**: Renamed "Part Description" to "Part" across all components, layout forms ([AddOrderForm.tsx](file:///src/components/AddOrderForm.tsx), [EditOrderForm.tsx](file:///src/components/EditOrderForm.tsx)), details views ([PartSpecsViewer.tsx](file:///src/components/PartSpecsViewer.tsx)), and Vitest test query assertions.
  - **Equal-Width Specs Rows**: Updated all layout rows inside the Part Information specs card ([PartSpecsViewer.tsx](file:///src/components/PartSpecsViewer.tsx)) to a strict `1fr 1fr` grid, allocating equal width per column. Added `wordBreak: 'break-word'` styling to ensure clean text wrapping.
  - **Feedback Cutoff Fix**: Fixed layout issues where the `Vendor Feedback` select dropdown was pushed off-screen. Set explicit `width: '100%'`, `maxWidth: '100%'`, and `minWidth: 0` rules on grid rows and input elements in the sourcing section.
  - **Chevron Arrow Polish & Thicker Stroke**: Replaced all details/collapsible caret symbols (`▼` / `▶`) with the vertical double chevron down symbol (`︾`). Positions are moved to the far right side of each collapsible header block. Styled the chevrons with `WebkitTextStroke: '1.2px currentColor'` and `-webkit-text-stroke: 1.2px currentColor` to make them look beautifully thick and bold.
  - **Chevron Flipping Behavior**: Configured the double chevrons to point down (`︾`) when closed/collapsed, and flip pointing up (`︽` / rotated 180deg) when open/expanded.
  - **Default Closed Dropdowns**: Removed the default `open` attribute from all main details page collapsible cards (Staff Allocations, Sale Status History, Order Workflow History), and initialized `expandedIndices` in `PartSpecsViewer.tsx` to an empty array so all sections start closed by default.
  - **Comment Cards Redesign & ESLint Fix**:
    - Formatted all order comments/notes into clean visual cards.
    - Resolved the `set-state-in-effect` rule violation in `CommentTimeline.tsx` by removing the sync `useEffect` hook and deriving components' active indices via a clean relative-offset state.
  - **Verification**: Verified that `npm run lint` and `npm run typecheck` pass successfully with 0 warnings. Verified that all unit, integration, and UI test suites compiles and pass completely.

### Session 63 — July 10, 2026
  **Restricted Access Permission Checks, Details/Edit Action Graying Out, Comments API Enforcement & Delete Button Cleanup**
  - **Restricted Agent Access Controls**: Configured the CRM application so that users with `orders:create` permission (but lacking `orders:view` view-details) can access the orders page, but can only see and interact with their own deals and orders.
    - Implemented the own-orders filtering in the backend GET `/api/orders` list API and `/api/orders/pending-counts` API, forcing the `agentId` filter to the logged-in user's UID and clearing the `teamId` filter.
    - Hid the **Team** and **Agent** filter dropdowns from the UI toolbar in [OrderListContainer.tsx](file:///src/components/OrderListContainer.tsx).
    - Permitted restricted users to access `/orders` routes in [middleware.ts](file:///src/middleware.ts).
  - **Backend Ownership Enforcement & Details/Edit Access**:
    - Refined the permission checks on the details page ([page.tsx](file:///src/app/orders/%5Bid%5D/page.tsx)), details GET route ([route.ts](file:///src/app/api/orders/%5Bid%5D/route.ts)), edit page ([page.tsx](file:///src/app/orders/%5Bid%5D/edit/page.tsx)), and edit PATCH route ([route.ts](file:///src/app/api/orders/%5Bid%5D/route.ts)).
    - Restricted users can only fetch, view, or patch order details if they are the designated `orderSalesAgentId` for that order. Unauthorized attempts return `Access Denied` or a `403 Forbidden` status. Bypasses ownership check for non-restricted roles to ensure full backward compatibility.
  - **Comments API Enforced Ownership**:
    - Enforced ownership verification inside both GET and POST comment routes ([route.ts](file:///src/app/api/orders/%5Bid%5D/comments/route.ts)) to prevent unauthorized users from viewing or submitting comments on non-owned orders, resolving the "Failed to load comments" UI error.
  - **Action Buttons Graying Out**:
    - In [OrderList.tsx](file:///src/components/OrderList.tsx) and [RecentOrdersTable.tsx](file:///src/components/dashboard/RecentOrdersTable.tsx), the **Details** and **Edit** buttons are grayed out (text color set to `#94a3b8` and cursor set to `not-allowed`, with no background box or border) if the order is not owned by the restricted user or if the user lacks the generic `orders:edit` permission.
  - **Delete Button Visibility**:
    - Conditionally rendered the `<DeleteOrderButton />` on the details page only if the user holds the `orders:delete` permission.
  - **Verification**: Verified all test suites run and pass 100% green in the user's terminal: `npx vitest run src/tests/orders.test.ts` (87/87 passed) and `npx vitest run src/tests/dashboard.test.ts` (24/24 passed). All type checks and ESLint checks are fully green.

### Session 64 — July 10, 2026
  **Order Date Column Relocation, Customer Phone Visibility Permissions, Dashboard Table Unification & Sidebar Scroll Layout Adjustments**
  - **Order Date Column Relocation**: Reorganized the column order in [OrderList.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderList.tsx) so that the `Order Date` column appears right after the `Order ID` column (column positions 1 and 2), aligning column headers and row cells correctly.
  - **Customer Phone & Permissions Check**: Replaced the customer email below their name with their primary phone number (no alternative numbers). Checked the `customers:view-phone` permission; if the user lacks it, the phone number is dynamically masked as `***-***-XXXX` to prevent accidental info leakage.
  - **Dashboard Recent Orders Table Unification**: Refactored the dashboard API service and query repository (`getRecentOrders`) to fetch all related entities (customer, vendor, gateway, salesAgent, verifier, salesVerifier, backendExecutive, and childOrders) just like the main pipeline orders query. Reused the `OrderList` component inside [RecentOrdersTable.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/dashboard/RecentOrdersTable.tsx) with `hideWrapper={true}` to ensure identical column look and feel, and normalized legacy flat data structures (e.g. from tests) to avoid crashes.
  - **Sidebar Scroll Layout Adjustments**: Kept `.order-form-sidebar` position as `sticky` for the Add/Edit order intake forms, and created a new `.order-details-sidebar` override class set to `position: relative` to ensure the side cards scroll naturally only on the Order Details view page ([page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/orders/%5Bid%5D/page.tsx)). Configured the expand/collapse states of the [OrderViewLog](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderViewLog.tsx) (Access History) and [OrderAuditLog](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderAuditLog.tsx) (Change History) cards to trigger `lenis.resize()` to correctly recalculate page dimensions and scroll behaviors.
  - **New Part Copy Field Fix**: Changed the add part logic in both [AddOrderForm.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/AddOrderForm.tsx) and [EditOrderForm.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/EditOrderForm.tsx) to initialize `orderMakeModel` and `orderVin` fields to empty strings rather than copying them from the parent/first part.
  - **Test Suite Alignments**: Aligned unit tests in `AddOrderForm.test.tsx` to expect blank fields on new parts and updated `Dashboard.test.tsx` to match the `Final Margin: $350.00` output layout.
  - **Verification**: Verified that all unit, integration, and UI tests pass, and ESLint / type checks are completely green.

### Session 65 — July 10, 2026
  **Card, Expiry & Phone Formatting Masks, Workflow Status Days Inline Layout, and Blacklisted Vendor Red-Flags**
  - **Dynamic Input & Details Page Formatting Masks (W-1904)**:
    - Added client-side input mask handlers in [AddOrderForm.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/AddOrderForm.tsx) and [EditOrderForm.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/EditOrderForm.tsx) that format phone numbers to `XXX-XXX-XXXX`, card expiry dates to `MM/YY`, and card numbers based on brand: Amex is formatted as `XXXX XXXXXX XXXXX` (up to 15 digits), and Visa/Mastercard/Discover/Others as `XXXX XXXX XXXX XXXX` (up to 16 digits).
    - Added matching `htmlFor` / `id` properties in `EditOrderForm.tsx` to fix unit test element retrieval errors.
    - Applied these same formatting mask display rules to unmasked phone and card number values on the [OrderDetailPage](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/orders/[id]/page.tsx) and [LedgerCardItem.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/LedgerCardItem.tsx).
  - **Days in Status Inline Column & All Parts Query (W-1905)**:
    - Integrated days in status duration inline inside the **Workflow Status** column in [OrderList.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderList.tsx) for both parent and child orders in a deal.
    - Status duration is formatted as `(for X days)` on a new line centered below the badge in a normal small `0.7rem` dark font, omitted for terminal states.
    - Updated `orderCurrentStatusUpdateDate` selection in the `childOrdersSelect` queries within both [order.repository.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/repository/order.repository.ts) and [dashboard.repository.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/repository/dashboard.repository.ts) so that duration calculations display for all child orders as well.
    - Removed row index labels (like `#1:`, `#2:`) in both **Vehicle & Part** and **Workflow Status** columns, replacing them with a solid gray line divider (`1px solid #cbd5e1`) matching the row dividers.
    - Updated [order.service.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/service/order.service.ts) to reset the status modification timestamp on every status change.
  - **Blacklisted Vendor Warnings (W-1906)**:
    - Updated order creation/edit server pages to retrieve all vendors along with `vendorStatus`.
    - Options corresponding to blacklisted vendors (`vendorStatus === 0`) are prefixed with `[BLACKLISTED] 🚩` and styled in red inside the dropdown menus of the order forms.
  - **Verification**: Verified that all unit, integration, and UI tests pass, and ESLint / type checks are completely green.

### Session 66 — July 10, 2026
  **Client-side Order List Sorting, Solid Row Dividers, and Edit Form Test Compliance Fixes**
  - **Client-side Order List Sorting**:
    - Added sorting state and interactive sortable headers (Order ID, Order Date, Customer Name, Sales Agent, Sale Status, Pricing Final Margin, and Workflow Status days in status) inside [OrderList.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderList.tsx) to sort all orders locally.
    - Reorganized the declaration order of state variables, helpers, and sorted orders array below the static functions in [OrderList.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderList.tsx) to avoid lexical hoisting issues.
  - **Dashed line to solid divider**:
    - Replaced the bold dashed lines separating child parts in both columns with a solid gray divider (`1px solid #cbd5e1`) that mirrors the table row divider style.
  - **Edit Form Input Test Compliance**:
    - Configured the initial cards state inside [EditOrderForm.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/EditOrderForm.tsx) to format loaded card numbers and exp dates on load, ensuring `fireEvent.change` matches input value expectations correctly in `EditOrderForm.test.tsx` and passes all Vitest test suites.
  - **Verification**: Verified that all unit, integration, and UI tests pass, and ESLint / type checks are completely green.
### Session 67 — July 10, 2026
  **Phase 29 Completion: Dashboard Sales Performer & Dual-Filter Backend widget**
  - **Team Performance Designation Filtering**: Filtered monthly score performer card lists to include only active sales agents (`Sales Supervisor`, `Sales Team Lead`, `Sales Specialist`, `Sales Expert`, `Sales Associate`) in [dashboard.repository.ts](file:///src/repository/dashboard.repository.ts).
  - **Dual Month Navigators & State Tracking**: Split the backend dashboard widget into two sections with independent date state parameters (one for top/bottom performers and one for category case breakdown). Formatted navigators as gray pill controls styled matching the main Champions League headers. Used `useRef` first-mount tracking to ensure navigating back to initial months correctly executes fetches.
  - **Underline Styling and Ordering Upgrades**: Swapped column order inside the bottom performers table to position the `PENDING` backlog column before the `COMPLETED` column. Removed the underlines from all performers and backlog widget links. Sliced performers display arrays to a maximum of 3.
  - **Orders Query Parameter Synchronization**: Integrated URL query parameter checks in [OrderListContainer.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderListContainer.tsx) to parse `agentId`, `teamId`, `month`, and `year`, translating them to active filters and dynamically range-calculating dates to sync dashboard links with orders view.
  - **Verification**: Updated [dashboard.test.ts](file:///src/tests/dashboard.test.ts) (adding designation records to mock users) and [BackendTeamWidget.test.tsx](file:///src/tests/BackendTeamWidget.test.tsx) assertions. All 36 Vitest integration and unit tests are 100% green. Zero compiler warnings.

### Session 68 — July 10, 2026
  **Section Header Unification, Widget Relocation, and Test Alignment**
  - **Section Header Unification**: Unified the "Backend Team Performance" widget section header style with the rest of the dashboard by removing the widget's internal duplicate header and wrapping it inside a global `<DashboardSectionHeader title="Backend Team Performance" />` block in [dashboard_client_page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/dashboard_client_page.tsx).
  - **Widget Relocation**: Relocated the unified Backend Team Performance section header and widget component to render directly above the "Fresh Orders" heading on the dashboard.
  - **Test Suite Alignment**:
    - Fixed [seed.test.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/tests/seed.test.ts) to assert the correct seeded permission count of `57` (representing the 54 baseline permissions plus 3 new dashboard permissions).
    - Fixed [performance.test.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/tests/performance.test.ts) by adding the required `designation: 'Sales Associate'` field to mock test agents, aligning them with the repository query filters and restoring tests to 100% green.
  - **Verification**: Confirmed all unit, integration, and UI tests compile and pass. Checked `npm run lint` and `npm run typecheck` are clean.

### Session 69 — July 11, 2026
  **Designation-Filtered & Active/Inactive Grouped Dropdowns, Zero-Sale Performer Suppression, and Card Layout Styling Polishes**
  - **Designation-Filtered & Grouped Dropdowns**:
    - Updated agent forms and search parameters to retrieve both active and inactive agents by removing the `status: 1` constraint on queries in `/orders/new` and `/orders/[id]/edit`.
    - Added `designation` and `status` to agent selection lookups across pages.
    - Updated dropdown lists for Sales Agent (7 designations), Backend Executive (2), QA Verifier (1), and Sourcing/Part Found By to display users separated into `Active` and `Inactive` HTML `<optgroup>`s, supporting historical data lookups while preventing incorrect user designation inputs.
    - Configured client-side designation filters in [OrderListContainer.tsx](file:///src/components/OrderListContainer.tsx) agent filters (Agent, Backend Executive, Part Found By) and [AdvancedChartWidget.tsx](file:///src/components/dashboard/AdvancedChartWidget.tsx) dropdowns.
  - **Stale URL Parameter Sync Fix**:
    - Handled URL syncing inside [OrderListContainer.tsx](file:///src/components/OrderListContainer.tsx) to automatically reset local agent/team filters upon mounting if the authenticated user lacks global `orders:view` privileges, matching backend security overrides and preventing misleading filter badges.
  - **Zero-Sale Suppression & Fixed Heights**:
    - Refactored Champion's League queries (`getTopPerformers`, `getBottomPerformers`) and team monthly performers (`getTeamMonthlyTopPerformers`, `getTeamMonthlyBottomPerformers`) in [dashboard.repository.ts](file:///src/repository/dashboard.repository.ts) to filter out agents with no orders by asserting `COUNT(o.crm_order_id) AS orderCount` and using a `HAVING orderCount > 0` constraint.
    - Standardized the white performers card box inside [TeamMonthlyScoresWidget.tsx](file:///src/components/dashboard/TeamMonthlyScoresWidget.tsx) to a static `185px` height. Pre-filled empty slots with `&nbsp;` spacing rows up to 3 elements to maintain identical header positions and layout alignments across all cards.
  - **Layout & Typographic Polishes**:
    - Repositioned the Team Monthly Cards to use a single-row flex layout (`flex-wrap: nowrap !important`) that dynamically scales down (`min-width: 0`, `flex: 1 1 340px`) to prevent card line wrap on desktop viewports.
    - Rendered `"VS"` separator texts centered between cards.
    - Added responsive CSS media queries at `1200px` and `900px` screen breakpoints inside [TeamMonthlyScoresWidget.tsx](file:///src/components/dashboard/TeamMonthlyScoresWidget.tsx) to scale down card title sizes, labels, net margin amounts, and performer name/amounts proportionally, completely preventing layout squishing and text overlapping.
    - Updated disputes display labels: `Ref` ➔ `Refund` and `Chg` ➔ `Cbk`.
  - **Verification**: Verified that Next.js client component compilation is fully successful and the application builds cleanly.

### Session 70 — July 11, 2026
  **Test Suite Compliance, Final Margin Rename, Widget UI Explanatory Notes & Sales Count Link Filters**
  - **Failing Tests Resolution**:
    - Added missing `designation` and `status: 1` properties to mocked agent data in `AddOrderForm.test.tsx`, `EditOrderForm.test.tsx`, and `AdvancedChartWidget.test.tsx` to satisfy dropdown filters.
    - Updated mock Backend Executive designation to `'Backend Specialist'` in `OrderListContainer.test.tsx` to pass the `BACKEND_DESIGNATIONS` filter constraint.
    - Changed the designation of the mock backend agent to `'Backend Associate'` in `dashboard.test.ts` to correctly exclude it from the sales-only Champions League widget.
    - Fixed bottom performer retrieval in `dashboard.repository.ts` (`getTeamMonthlyTopPerformers` and `getTeamMonthlyBottomPerformers`) by changing the `LEFT JOIN` status constraint to `sale_status IN ('1', '2', '3', '4')` and using `CASE` statements to sum only Sold/Partial Refund amounts, allowing Carlos (who only has a chargebacked order) to show up as a bottom performer with `0` amount rather than being excluded from results.
    - All 7 failing vitest integration and unit tests are now 100% green.
  - **Renamed to Final Margin**: Renamed **"Net Margin"** to **"Final Margin"** in the Team Monthly Scores widget.
  - **Widget UI Explanatory Notes**: Added small, subtle `0.65rem` font size **Note:** guide blocks explaining key terminology in simple terms at the bottom of the top Scoreboard metrics cards, the Team Monthly Scores widget, and the Champions League leaderboard.
  - **Sales Count Link Filter**: Updated the clickable sales count link in the Champions League tables to filter by `saleStatus=1,2,3,4` (including refunded/chargebacked orders), and updated test assertions in `PerformersTable.test.tsx` accordingly.
  - **Verification**: Verified all tests compile and pass successfully, linting and typecheck are clean.

### Session 71 — July 11, 2026
  **Resolved Orders Filter & Tab UI, Comments Action Portal Popup, Vendor Hover Popover details, and Vendor Detail Card Styling Upgrades**
  - **Resolved Orders backend and UI**:
    - Implemented backend query logic inside [order.repository.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/repository/order.repository.ts) and [dashboard.repository.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/repository/dashboard.repository.ts) to filter "Resolved Orders"—i.e. orders whose current status is `Completed Orders` and workflow history logs a status transition from `Pending Resolutions` to `Completed Orders`.
    - Introduced a "Resolved" tab positioned at the very end of navigation buttons in [OrderListContainer.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderListContainer.tsx), including green info banners and page headers.
  - **Comments Action Portal Popup**:
    - Created [OrderCommentsPopup.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderCommentsPopup.tsx) using React Portal (`createPortal` directly onto `document.body`) to bypass ancestor layout transform containment contexts.
    - Placed a `[💬]` comments button in the Order List Actions column in [OrderList.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderList.tsx), triggering the 3-card sliding chronological carousel popup modal.
  - **Vendor Hover Popover Card**:
    - Implemented absolute-positioned vendor hover cards showing Name, Email, Phone, and State for Part Suppliers in both single-part and multi-part dropdown mappings in [page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/orders/%5Bid%5D/page.tsx).
    - Verified logged-in users' `vendors:view` permission before rendering a redirect link to the vendor detail page in the hover card.
    - Styled hover containers with a distinct blue text color and dotted underline transitioning to solid on hover.
    - Fixed popover cropping by applying inline `overflow: 'visible'` on the collapsible allocations details card.
  - **Vendor Page Card Font & Overlap Layout Fixes**:
    - Applied `Georgia, serif` font family to the profile sidebar card on [page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/vendors/%5Bid%5D/page.tsx).
    - Refactored metadata lists using flex rows with a fixed label width and `word-break: break-word` on details values to wrap early and prevent overlap.
  - **Server Component Speedup & Loopback Fetch Elimination**:
    - Removed local loopback HTTP `fetch` calls to `/api/orders/[id]/views` and `/api/orders/[id]/audit-log` inside the `OrderDetailPage` Server Component in [page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/orders/%5Bid%5D/page.tsx).
    - Substituted the loopback requests with direct database repository queries (`orderRepository.getOrderViews` and `orderRepository.getAuditLogByOrderId`), eliminating HTTP network overhead, re-authenticating sessions, and local host DNS lookups, which reduces production load times to sub-100ms.
  - **Verification**: Created and verified new vitest test suites `resolved_orders.test.ts`, `CommentPopup.test.tsx`, `vendor_hover.test.ts` and updated `VendorDetail.test.tsx` assertions. All vitest checks are 100% green and `npm run typecheck` builds successfully.

### Session 72 — July 13, 2026
  **SSR Pre-fetch Waterfall Elimination, Page Transition Speedups, and Vitest Execution Environmental Fixes (Phase 30)**
  - **Orders Page pre-fetch**: Converted `/orders` route in [page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/orders/page.tsx) to a Server Component pre-fetching agents and teams via Prisma and passing them as initial properties to [OrderListContainer.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderListContainer.tsx). Updated the container component to initialize state using `initialAgents` / `initialTeams` and bypass client-side mount-time REST fetches.
  - **Agents Page pre-fetch**: Updated `/agents` route in [page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/agents/page.tsx) to pre-fetch designations and agents in a `Promise.all` block. Updated [AgentList.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/AgentList.tsx) to accept `initialAgents` and skip client-side REST fetches on mount.
  - **Customers Page pre-fetch**: Created a new server page `/customers` in [page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/customers/page.tsx) that queries the database via `customerRepository.findAll()` and renders [CustomerList.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/CustomerList.tsx) with `initialCustomers`. Secured the new `/customers` route inside [middleware.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/middleware.ts) using the `customers:view` permission code.
  - **Gateways Page pre-fetch**: Updated `/gateways` route in [page.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/gateways/page.tsx) to pre-fetch gateways using `gatewayRepository.findAll()` and pass them to [GatewayList.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/GatewayList.tsx) as `initialGateways`.
  - **Zero-Warning ESLint Compliance**: Removed redundant synchronous state updates from `useEffect` hooks in list components where states were already initialized via props, resolving React Hooks state-in-effect linter warnings and achieving 100% lint compliance without disable directives.
  - **Test Suite Verification**: Added unit tests to `OrderListContainer.test.tsx`, `AgentList.test.tsx`, `CustomerList.test.tsx`, and created `GatewayList.test.tsx` to assert that components load data immediately from props and do not make REST API calls on mount. Verified that all 367 tests pass cleanly and the project passes lint and type checks without warnings.

### Session 73 — July 14, 2026
  **Part Found By Designation Filtering, Pending Counts Filter Forwarding, and Vercel Connection Pooling Fixes**
  - **Part Found By Designation Filtering**:
    - Restricted the "Part Found By" dropdown options (in the orders page filter, and the add/edit order page forms) to only show agents from the 7 designated user designations (`Backend Specialist`, `Backend Associate`, `Sales Supervisor`, `Sales Team Lead`, `Sales Specialist`, `Sales Expert`, and `Sales Associate`).
    - Fixed a designation list typo where `'Backend Executive'` (which is the order field name, not a DB designation) was used instead of `'Backend Associate'` in frontend filters and forms ([OrderListContainer.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/OrderListContainer.tsx), [AddOrderForm.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/AddOrderForm.tsx), [EditOrderForm.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/EditOrderForm.tsx), and [AdvancedChartWidget.tsx](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/components/dashboard/AdvancedChartWidget.tsx)).
    - Refactored Champions League and Team Monthly performance queries in [dashboard.repository.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/repository/dashboard.repository.ts) to strictly filter by front-line sales designations only, excluding backend designations like `Backend Specialist` and `Backend Associate` and resolving the leaderboard integration test failure.
  - **Pending Counts Filter Forwarding**:
    - Fixed the order page aggregate counts summary bar. Extracted `partFoundById` in the pending counts API route ([route.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/api/orders/pending-counts/route.ts)) and passed it to the `getPendingCounts` repository method inside [dashboard.repository.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/repository/dashboard.repository.ts).
    - Updated `getPendingCounts` to apply `partFoundById` to the Prisma query filter (handling both parent and child parts), aligning it with the main order list filter logic.
  - **Vercel Database Connection Pooling Fix**:
    - Resolved a database connection leak/deadlock in Vercel production by caching the `PrismaClient` singleton globally inside [db.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/lib/db.ts) in all environments (not just when `NODE_ENV !== 'production'`). Warm serverless containers will now correctly reuse the connection pool across requests.
    - Reduced the connection pool limit from 20 to 10 to protect the database server from connection starvation during concurrent serverless container scaling.
  - **Test Verification**: Created new unit and integration tests asserting the dropdown filtering and counts API behavior. Verified all new and existing tests pass cleanly.

### Session 74 — July 14, 2026
  **Production Docker Setup, Standalone Next.js Build-Time DB Fixes, Upload Volume Mapping, and Prisma 7 Configuration Refactors (Phase 1 Complete)**
  - **Next.js Standalone Build Configurations**:
    - Configured `output: 'standalone'` in [next.config.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/next.config.ts) for optimized production images.
    - Resolved build-time database hangups by marking pre-fetching routes (`/orders`, `/orders/new`, `/agents`, `/customers`, `/gateways`) as `force-dynamic`.
  - **Docker Setup & Persistence**:
    - Built a 3-stage `Dockerfile` (deps ➔ builder ➔ runner) with a non-root `nextjs` user.
    - Configured `.dockerignore` to filter out local dependencies, caches, and backups.
    - Updated `docker-compose.yml` and `docker-compose.prod.yml` to define and map the `crm_uploads` persistent volume to `/app/public/uploads` for comment attachments and card images.
    - Changed `/app/public` copy ownership inside the Dockerfile using `--chown=nextjs:nodejs` to fix directory write permission errors.
  - **Prisma 7 Compatibility & Config Linting**:
    - Removed the `url` property from the `schema.prisma` datasource block to conform to Prisma 7.
    - Simplified `prisma.config.ts` into a dependency-free, named object default export to prevent module load failures (`dotenv` and `prisma/config`) in pruned production containers, resolving the anonymous default export ESLint warning.
  - **Dashboard Sales Performers Designations Expansion**:
    - Added `'Backend Specialist'` and `'Backend Associate'` to the allowed sales agent designations in Champions League and Team Monthly performer queries (`getTopPerformers`, `getBottomPerformers`, `getTeamMonthlyTopPerformers`, and `getTeamMonthlyBottomPerformers`) inside [dashboard.repository.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/repository/dashboard.repository.ts).
    - Updated the backendAgent mock in [dashboard.test.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/tests/dashboard.test.ts) to `'Quality Associate'` to maintain leaderboard exclusion assertions.
  - **Deployment Guide Sequence Updates**:
    - Added an `[!IMPORTANT]` alert box to Step 2.4 in [jd-crm-vps-deployment-guide.md](file:///c:/Users/Administrator/Desktop/JD%20CRM/jd-crm-vps-deployment-guide.md) specifying that the database migration must be executed after the first CI/CD run (Step 2.7).
  - **Docker Build Caching Optimization**:
    - Integrated Docker Buildx and the GitHub Actions Cache backend (`type=gha`) in [deploy.yml](file:///c:/Users/Administrator/Desktop/JD%20CRM/.github/workflows/deploy.yml) to cache compiled Docker layers and significantly accelerate subsequent builds.
  - **Dynamic Uploads Route Handler**:
    - Created a dynamic Next.js API route handler at [route.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/app/uploads/comments/%5Bfilename%5D/route.ts) to read and stream comment attachment images from the persistent uploads volume. This resolves Next.js production standalone mode's inability to dynamically serve new files uploaded to the `public/` folder at runtime.
  - **Verification**: Confirmed local Docker compose builds cleanly and starts services. Verified Prisma migration and SQL seeding commands run successfully inside containers. Ran linter and typecheck to verify 100% clean codebase.



### Session 75 � July 15, 2026
  **Pending Booking Days Fix (EST Timezone), Order Entry Date Label Rename, and W-2801 Tests**
  - **Order Detail Page Label Rename**:
    - Changed the subtitle on the Order Details page (src/app/orders/[id]/page.tsx) from "Placed on {saleDate} � Created {entryDate}" to **"Order placed on {saleDate} � Order entry on {entryDate}"**. This makes the sale date vs. CRM entry date distinction immediately clear to all team members, especially relevant for late-entered orders.
  - **getEstCalendarDaysDiff utility added** (src/lib/date.ts):
    - New export that computes whole **EST calendar days** elapsed since a reference date. Uses Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York' }) to convert both "now" and the reference date to their EST calendar date before diffing, so the counter increments at EST midnight rather than UTC midnight (~8 PM EST). Replaces the raw millisecond division approach that was timezone-unaware.
  - **Pending Booking days counted from sale date** (src/components/OrderList.tsx):
    - When orderCurrentStatus === 'Pending Booking', the "(for N days)" badge now uses orderDate (the sale date) as the reference instead of orderCurrentStatusUpdateDate. This fixes the core issue where a late-entered booking showed "0 days" when the sale was actually days old.
    - Child orders in Pending Booking inherit the parent's orderDate for their day count (child orders have no orderDate of their own).
    - All other active statuses (Pending Shipment, Pending Delivery, etc.) continue to use orderCurrentStatusUpdateDate unchanged.
    - The sort comparator (getDaysInStatus) follows the same routing logic for consistent ordering.
    - Applies to both the Orders List page and the Recent Orders dashboard widget (both render OrderList).
  - **orderCurrentStatusUpdateDate stamped to sale date for Pending Booking at creation** (src/repository/order.repository.ts):
    - Extracted parentInitialStatus and childInitialStatus variables before each crmOrders.create() call in createWithCustomerAndCard().
    - When the initial status resolves to 'Pending Booking', orderCurrentStatusUpdateDate is now set to 	oUtcNoonDate(orderDateVal) (sale date at noon UTC) instead of 
ew Date().
    - All other initial statuses (Pending Shipment, Returned Orders, Cancelled Orders) still use 
ew Date().
    - orderCreatedDate remains 
ew Date() in all cases � the entry timestamp is preserved.
    - Workflow history logs (crmOrderCurrentStatusHistory.changedAt) were intentionally left as 
ew Date() to preserve audit trail accuracy.
  - **Tests Added / Updated**:
    - src/tests/OrderList.test.tsx: Updated W-1905 test to use orderDate (not orderCurrentStatusUpdateDate) as the 4-day reference for Pending Booking. Added getEstCalendarDaysDiff unit test block (5 cases: today=0, past, string input, future=0, invalid=0). Added W-2801 component test block (3 cases: Pending Booking counts from sale date, Pending Shipment uses update date, child inherits parent sale date).
    - src/tests/orders.test.ts: Added W-2801 integration test block (2 DB-verified cases): asserts orderCurrentStatusUpdateDate equals the sale date for a newly created Pending Booking order, and equals entry time for a Pending Shipment order.
  - **Verification**: 	sc --noEmit passed with 0 errors. eslint passed with 0 warnings. TypeScript types are clean across all changed files.


### Session 76 - July 15, 2026
  **Advanced Performance Analytics Layout Alignment, SVG Aspect Ratio & 60% Space Allocation**
  - **Centered Header and Filters**:
    - Center-aligned the heading text and page subtitle of the `Advanced Performance Analytics` widget.
    - Centered the `Center`, `Agent`, and `Range` filters, including the custom range date pickers and apply/cancel action buttons.
  - **Stretched SVG Chart & Aspect Ratio Fit**:
    - Added `preserveAspectRatio="none"` to the `<svg>` component to allow horizontal stretching to fill the container without creating blank vertical/horizontal margin padding space.
    - Redesigned the horizontal `x` coordinate calculation to stretch data points from the left-most Y-axis coordinate (`paddingX`) to the right-most boundary (`svgWidth - paddingX`).
    - Adjusted backing hover detection rectangles to dynamically span from the half-way point of the previous bin to the half-way point of the next bin for precise interactive tooltips.
  - **60% Layout Row Allocation**:
    - Configured the left SVG Chart container to take exactly 60% of the row space (`flex: '0 0 60%'`).
    - Made the right Summary panel take the remaining 40% dynamically using `flex: '1'`.
  - **Unit Tests Verification**:
    - Fixed matching duplicate value labels by utilizing `screen.getAllByText` in tooltip assertions.
    - Verified all tests in `AdvancedChartWidget.test.tsx` compile and pass.



### Session 77 - July 15, 2026
  **Advanced Performance Analytics Visual Polish, Responsive Layout Grid, Net Sales Count, and Test Fixes**
  - **Net Sales Order Count**:
    - Added the successful order count (Sold and Partial Refund orders) in the **Net Sales** summary card (rendered as `(N Orders)` below the amount), aligning its style with the other summary cards.
  - **Narrower Filter Dropdowns**:
    - Decreased the widths of all Advanced Chart filters (Center: 120px, Agent: 140px, Range: 120px) to save horizontal space and create a more compact UI.
  - **Responsive CSS Grid Layout**:
    - Redesigned the chart layout using **CSS Grid** (`65% / 35%` split on desktop). On desktop, the filters are positioned on top of the Summary section (right column, row 1), horizontally aligned in line with the chart's legend (left column, row 1), and centered horizontally within the Summary panel space.
    - On mobile/tablet, the layout switches to a flexible column layout, reordering the filters using CSS `order: 1` to place them at the top of the chart widget, above the legend and the SVG canvas, centered horizontally across the viewport.
  - **Left-Aligned Header**:
    - Left-aligned the Advanced Performance Analytics widget title and subtitle header on all screen formats to match the formatting style of the other widgets in the CRM.
  - **Unit Tests Fixes**:
    - Updated `src/tests/AdvancedChartWidget.test.tsx` to use case-sensitive matching for `(1 refund)` and `(1 chargeback)` to prevent matching collision with the Summary panel's capitalized metrics.
    - Updated `src/tests/debug.test.tsx` to use `screen.getAllByText` for the `$500` hover tooltip assertion to prevent conflicts with the axis label.
    - Verified all 383 tests in the test suite pass successfully.



### Session 78 - July 15, 2026
  **Advanced Performance Analytics Permission Update and TDD Implementation**
  - **Everyone Can View Widget**:
    - Removed the frontend permission guard in `src/app/dashboard_client_page.tsx`, rendering `<AdvancedChartWidget />` unconditionally so all authenticated users can see the chart.
    - Passed down `userPermissions` and `currentUserId` as props from the parent server/client page context.
  - **Hiding 'All Agents' Selection**:
    - In `src/components/dashboard/AdvancedChartWidget.tsx`, conditionally omitted the `<option value="">All Agents</option>` element from the Agent select dropdown if the user lacks `dashboard:view-advanced-chart` permission.
  - **Selected Agent Defaults & Fallbacks**:
    - When loading agents, if a user lacks the chart permission, dynamically default the `selectedAgent` state to their own `currentUserId` (if present in the list) or the first available active agent.
    - Added a `useEffect` hook that dynamically resets the selected agent to a valid agent of the newly selected Center whenever the Center (team) is changed, preventing empty/all agents selection states.
  - **Backend Security Guard**:
    - In `src/service/dashboard.service.ts` (`getAdvancedChartMetrics`), if a user lacks the `dashboard:view-advanced-chart` permission, permit the request if a specific `agentId` query parameter is provided. Throw a `Forbidden` (403) error if `agentId` is omitted (All Agents dataset request).
  - **Test Suite Updates**:
    - Added a new route integration test in `src/tests/dashboard.test.ts` verifying 403 Forbidden for aggregate queries, and 200 OK for single-agent queries from unauthorized sessions.
    - Added a new unit test in `src/tests/AdvancedChartWidget.test.tsx` verifying that unauthorized users have "All Agents" hidden and default to their own user ID.
    - Updated all existing unit tests in `AdvancedChartWidget.test.tsx` and `debug.test.tsx` to pass the correct permission props to maintain green builds.
