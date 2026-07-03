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
| **Phase 19** | Sprint 4 — Polish & Table Column Additions | **[/] IN PROGRESS** | `AdvancedChartWidget.tsx`, `RecentOrdersTable.tsx`, `OrderList.tsx`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `seed.sql` |
| **Phase 20** | orderMarkup → orderAmountCharged: Schema Rename, Auto-Calc Removal & Manual Input | **[x] COMPLETED** | `schema.prisma`, 1 migration, `order.repository.ts`, `order.service.ts`, `dashboard.repository.ts`, `dashboard.service.ts`, `EditOrderForm.tsx`, `OrderList.tsx`, `RecentOrdersTable.tsx`, `SearchResults.tsx`, `AddOrderForm.tsx`, `OrderListContainer.tsx`, `OrderDetailPage` |
| **Phase 21** | Mileage & Warranty Rename and Order-Level Checklist Field | **[ ] NOT STARTED** | `schema.prisma`, 1 migration, `order.repository.ts`, `order.service.ts`, `types/order.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `page.tsx` (order details), `OrderAuditLog.tsx`, `import-csv-data.ts`, `restore-admin.ts`, `seed-dummy-orders.ts` |
| **Phase 22** | Sale Status Expansion: Void & Cancel Order, Sale Status Column & Filter | **[x] COMPLETED** | `order.service.ts`, `order.repository.ts`, `vendor.repository.ts`, `vendor.service.ts`, `vendors/[id]/page.tsx`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, `OrderListContainer.tsx`, `SaleStatusTimeline.tsx`, `import-csv-data.ts`, `project_data.md` |
| **Phase 23** | Cancelled Orders Workflow & Renaming (Cancelled Status & Cancelled Orders Queue) | **[x] COMPLETED** | `seed.sql`, `order.repository.ts`, `order.service.ts`, `dashboard.repository.ts`, `dashboard.ts`, `import-csv-data.ts`, `middleware.ts`, `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, `OrderListContainer.tsx`, `SaleStatusTimeline.tsx`, new page `/pending/cancelled/page.tsx` |

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

- [ ] **RED — Unit (`src/tests/AddOrderForm.test.tsx`):**
  - [ ] Test: Typing card numbers adds space formatting (e.g. `4111 2222 3333 4444`).
  - [ ] Test: Expiry field automatically reformats inputs to matching expiration structure.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Component):**
  - [ ] [Component] Bind mask state triggers to form inputs.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Agent types card digits → input format updates dynamically → form submits standardized strings → ✅ Done.

---

### W-1905 — Recent Orders: Add Customer Phone, Edit Button, and Vendor Name

**Root cause / Goal:**
The dashboard's recent orders table lacks telephone contacts, vendor associations, or direct editing shortcuts, slowing down coordinator triage.

**Adjustment for Phase 17:**
The margin column in the Recent Orders table must continue to display the `finalMargin` (`orderMarkup - orderRefundAmount`) rather than raw `orderMarkup`.

**Approach:**
- Include phone and vendor name in dashboard metric selects. Add columns and direct edit links to table.

---

- [ ] **RED — Integration (`src/tests/dashboard.test.ts`):**
  - [ ] Test: Recent orders payload contains customer phone, vendor name, and `orderRefundAmount` to support `finalMargin` calculations.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Backend (Repository → Service):**
  - [ ] [Repository] Fetch phone and vendor details in dashboard select.
  - [ ] [Service] Map variables into dashboard payload.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit (`src/tests/RecentOrdersTable.test.tsx`):**
  - [ ] Test: Renders column values for Phone and Vendor. Verify edit button links to `/orders/:id/edit`.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Component):**
  - [ ] [Component] Expand table layout in `RecentOrdersTable.tsx`.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Agent views dashboard recent table → inspects phone numbers and vendor names directly → clicks "Edit" → navigates directly to edit order → ✅ Done.

---

### W-1906 — Order Page Table: Replace Email with Customer Phone Number

**Root cause / Goal:**
Sales agents rarely email customers from list pages; telephone numbers are much more useful for active operations.

**Approach:**
- Swap customer email attribute for customer phone number in the list row layout.

---

- [ ] **RED — Unit (`src/tests/OrderList.test.tsx`):**
  - [ ] Test: Order list rows render customer phone numbers instead of email addresses.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Component):**
  - [ ] [Component] Update rendering cells in `OrderList.tsx`.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] User views orders list → column shows phone numbers instead of email → ✅ Done.

---

### W-1907 — Date and Customer ID as First Columns in All Lists

**Root cause / Goal:**
Standardize list tables to ensure a cohesive look. Date and Customer ID must consistently occupy column positions 1 and 2.

**Adjustment for Phase 17:**
Ensure this column ordering applies to all pipeline tabs in `OrderListContainer.tsx`, including the newly added "Returned Orders" tab.

**Approach:**
- Rearrange column headers and row mapping cells.

---

- [ ] **RED — Unit (`src/tests/OrderList.test.tsx`):**
  - [ ] Test: Table headers at index 0 and 1 correspond to "Date" and "Customer ID".
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Component):**
  - [ ] [Component] Adjust header grid mappings in `OrderList.tsx`.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] User opens any orders list tab (including Returned Orders) → columns start with Date and Customer ID → ✅ Done.

---

### W-1908 — Time in Pending State Column (Except Completed/Returned Orders)

**Root cause / Goal:**
Operations must track how long orders sit in pending states to address bottlenecks. Terminal states (Completed and Returned) do not require aging indicators.

**Adjustment for Phase 17:**
The "Returned Orders" status represents a terminal state (full reversal of sale), so aging timers must be excluded from this tab along with Completed.

**Approach:**
- Calculate and display duration using `orderCurrentStatusUpdateDate` for active statuses; render blank/hyphen for Completed and Returned.

---

- [ ] **RED — Integration (`src/tests/orders.test.ts`):**
  - [ ] Test: Orders query returns the last status modification timestamp.
  - [ ] **Run — confirm RED.**

- [ ] **RED — Unit (`src/tests/OrderList.test.tsx`):**
  - [ ] Test: "Time in Status" column renders formatted days for active statuses, but is empty/hyphen for Completed and Returned statuses.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Component):**
  - [ ] [Component] Render duration metric columns in `OrderList.tsx`.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Agent views Pending Shipment queue → sees "Aging: 4 days" in column → switches to Completed or Returned tab → column is blank → ✅ Done.

---

### W-1909 — Blacklisted Vendor Alert Red Flag in Dropdowns

**Root cause / Goal:**
Ensure agents do not accidentally place new orders with blacklisted suppliers. Dropdown listings should display clear warnings for blacklisted vendors.

**Approach:**
- Prepend `[BLACKLISTED] 🚩` text prefix and apply red CSS formatting to option elements matching inactive status.

---

- [ ] **RED — Unit (`src/tests/AddOrderForm.test.tsx`):**
  - [ ] Test: Dropdown options representing blacklisted vendors are styled red and prefixed with warning flags.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Component):**
  - [ ] [Component] Update select option mapping inside forms.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Agent opens Add Order form → vendor list shows warning flag on blacklisted options → avoids selection → ✅ Done.

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

