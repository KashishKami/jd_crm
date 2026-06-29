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
| **Phase 12**| Attendance Logging System | **[ ] PENDING** | Mark attendance sheet, historical attendance view |
| **Phase 13**| global Full-Text Search | **[ ] PENDING** | Unified global search bar, order filters |
| **Phase 14**| Admin Settings & RBAC Permissions | **[ ] PENDING** | Role settings page, permission matrices |

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

### Phase 12 — Attendance Logging System

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

- [ ] **RED — Integration (`search.test.ts`):**
  - [ ] Test: `GET /api/search?q=Toyota` returns results where at least one order's `orderMakeModel` contains `Toyota`.
  - [ ] Test: `GET /api/search?q=john@example.com` returns at least one customer result where `customerEmail` matches.
  - [ ] Test: `GET /api/search?q=VIN123` returns orders where `orderVin` contains `VIN123`.
  - [ ] Test: `GET /api/search?q=` (empty query) returns `400 Bad Request`.
  - [ ] Test: `GET /api/search?q=test` without a session returns `401 Unauthorized`.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Backend (Repository → Service → Controller):**
  - [ ] [Repository] Create `src/repository/search.repository.ts`:
    - `searchOrders(query: string)` — `$queryRaw` with `LIKE '%{query}%'` across `order_make_model`, `order_vin`, `order_part`, `order_sales_agent_name`, `order_tracking_number`.
    - `searchCustomers(query: string)` — `LIKE` across `first_name`, `last_name`, `customer_email`, `customer_phone`.
  - [ ] [Service] Create `src/service/search.service.ts`:
    - `search(query)` — calls both repository methods in parallel with `Promise.all`, merges and deduplicates results, returns `{ orders: [...], customers: [...] }`.
  - [ ] [Controller] `src/app/api/search/route.ts` (GET). Validate `q` is non-empty. Guard with active session.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit (`SearchResults.test.tsx`):**
  - [ ] Test: Given mocked results with 2 orders and 1 customer, renders two sections with correct item counts.
  - [ ] Test: Clicking an order result navigates to `/orders/:id`.
  - [ ] Test: Clicking a customer result navigates to `/customers/:id`.
  - [ ] Test: Empty results state renders a "No results found" message.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Types → Components → Page):**
  - [ ] [Types] Create `src/types/search.ts` with `SearchResults`, `OrderSearchResult`, `CustomerSearchResult` types.
  - [ ] [Component] `src/components/GlobalSearchBar.tsx` — input that navigates to `/search?q=...` on submit. Added to `Sidebar.tsx`.
  - [ ] [Page] `src/app/search/page.tsx` — server component that reads `?q` param, calls `/api/search`, and renders `SearchResults`.
  - [ ] [Component] `src/components/SearchResults.tsx` — renders grouped results sections.
  - [ ] Run unit test — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Agent types "Toyota Camry" into the global search bar in the sidebar → presses Enter → navigates to `/search?q=Toyota+Camry` → results page shows matching orders grouped by entity type → agent clicks an order row → navigates to `/orders/:id` → order detail renders → ✅ Done.

---

### Phase 14 — Admin Settings & RBAC Permission Management

#### W-1401 — Dynamic Permissions Matrix & Role Management

**Goal:**
Create an administrative interface for configuring user permissions by role. Provide APIs to fetch, create, update, and delete roles, along with their mapped permissions, and safeguard administrative roles from lockouts.

**Approach:**
Implement endpoints `GET /api/settings/roles`, `POST /api/settings/roles`, `PUT /api/settings/roles/[id]`, and `DELETE /api/settings/roles/[id]`. Build a frontend matrix UI under `/settings/roles` showing a list of roles and a checklist of permissions. Enforce a transaction-safe database mapping using `CrmRolePermissions` and protect default administrator accounts.

---

- [ ] **RED — Integration (`settings.test.ts`):**
  - [ ] Test: `GET /api/settings/roles` returns `403 Forbidden` for non-admin session.
  - [ ] Test: `GET /api/settings/roles` for administrator returns array of roles, each with names and array of mapped permission IDs.
  - [ ] Test: `PUT /api/settings/roles/2` updates role name and permission list, returning `200 OK`.
  - [ ] Test: `PUT /api/settings/roles/1` (Super Admin) attempting to remove `super-admin` permission returns `400 Bad Request` (safeguard).
  - [ ] Test: `DELETE /api/settings/roles/3` (role with active users) returns `400 Bad Request`.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Backend (Repository → Service → Controller):**
  - [ ] [Repository] Create `src/repository/role.repository.ts` with operations to list, create, update (atomic delete-and-insert transaction), and delete roles/permissions.
  - [ ] [Service] Create `src/service/role.service.ts` validating requests, checking active users before role deletion, and enforcing admin lockout protection.
  - [ ] [Controller] Create API handlers in `src/app/api/settings/roles/route.ts` and `src/app/api/settings/roles/[id]/route.ts`.
  - [ ] [Controller] Create API handler in `src/app/api/settings/permissions/route.ts` to expose all defined permissions.
  - [ ] Run integration test — **confirm GREEN**.

- [ ] **RED — Unit (`RoleSettings.test.tsx`):**
  - [ ] Test: Mount page and assert list of roles is rendered.
  - [ ] Test: Clicking a role updates the permission checkbox state.
  - [ ] Test: Checking/unchecking permissions and clicking Save sends a PUT request with the updated permission IDs list.
  - [ ] **Run — confirm RED.**

- [ ] **GREEN — Frontend (Components → Pages):**
  - [ ] [Component] Build `src/components/settings/PermissionMatrix.tsx` displaying interactive checkboxes grouped by resource scope.
  - [ ] [Page] Build `src/app/settings/roles/page.tsx` rendering the role sidebar alongside `<PermissionMatrix />` with GSAP transitions and save banners.
  - [ ] [Navbar] Add a settings navigation pill under `Navbar.tsx` visible only to users with the `settings:manage-permissions` permission.
  - [ ] Run unit tests — **confirm GREEN**.

- [ ] **Verification chain:**
  - [ ] Super Admin navigates to `/settings/roles` -> selects "Verifier Staff" -> toggles "orders:edit" permission -> clicks Save -> logs in as a verifier in a new window -> verifies they now have access to order editing controls -> ✅ Done.

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




