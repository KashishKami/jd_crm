# JD CRM — Proposed Changes: Impact Analysis & Priority Ranking

> **How priorities are assigned:**
> - **P0 — CRITICAL / DO NOW:** Schema change that **destroys or corrupts existing data**, or a live production bug causing wrong numbers.
> - **P1 — HIGH:** New schema table / non-destructive column addition required **before real data is entered**, or an active bug that silently mis-reports data.
> - **P2 — MEDIUM:** Feature requiring schema + repo + service + route + UI changes, but fully additive — safe to defer but UX is incomplete without it.
> - **P3 — LOW / POLISH:** Pure UI/UX or label changes that touch only frontend components with no schema risk.

---

## 🔴 P0 — CRITICAL: Do Before Any Production Data Enters

These changes require a destructive or data-reshaping migration. If real orders already exist, running these later would require a data transformation script that could fail or lose precision. **Fix these first.**

---

### #2 — Merge `first_name` + `last_name` → `customer_name` (DB Schema Change)

**Depth:** `DB Schema → Migration → Repository → Service → Routes → UI`

**What exists:** `CrmCustomers` model has two separate columns `firstName` (`first_name`) and `lastName` (`last_name`). Every query, repository call, service layer, and form references both fields independently.

**What changes:**
- **DB/Migration:** `ALTER TABLE crm_customers` to add `customer_name VARCHAR(511)`, back-fill with `CONCAT(first_name, ' ', last_name)`, then DROP `first_name` and `last_name`. Prisma schema updated. New migration generated.
- **Repository:** `customer.repository.ts`, `order.repository.ts` (create + update functions use `firstName`/`lastName` directly).
- **Service:** `order.service.ts` — destructures `firstName`, `lastName` from update payload.
- **Routes:** `POST /api/orders` payload; `POST /api/customers`; `PATCH /api/customers/:id`.
- **UI:** `AddOrderForm.tsx`, `EditOrderForm.tsx`, `CustomerList.tsx`, `AgentProfileView.tsx` — everywhere customer name is displayed or entered.
- **Seed + CSV Import:** `seed.sql` must be rewritten; import script columns change.

**Can it be done later without affecting existing data?**
> ❌ **NO.** If orders already exist and reference the old two-column structure, the migration must `CONCAT` the data. The longer you wait, the more rows exist and the higher the risk of a failed or partial migration. Additionally, every place in code that uses `firstName`/`lastName` (including `dashboard.service.ts` line 95: `` `${o.customer.firstName} ${o.customer.lastName}` ``) must be updated in a coordinated sweep.

**Priority: P0**

---

### #1 — Merge `order_year` into `order_make_model` (DB Schema Change)

**Depth:** `DB Schema → Migration → Repository → Service → UI`

**What exists:** `CrmOrders` has two columns: `orderYear` (`order_year VARCHAR(255)`) and `orderMakeModel` (`order_make_model VARCHAR(255)`). They are entered separately in `AddOrderForm.tsx` (line 306: "Year" field, line 317: "Make & Model" field).

**What changes:**
- **DB/Migration:** Back-fill `order_make_model` with `CONCAT(order_year, ' ', order_make_model)` for all rows that have a non-null `order_year`. Then drop `order_year` column. Update Prisma schema.
- **Repository:** Remove `orderYear` from create/update inputs in `order.repository.ts`.
- **Service:** Remove `orderYear` from `order.service.ts` destructuring.
- **Types:** Remove `orderYear` from `OrderCreateInput`, `OrderUpdateInput` in `src/types/order.ts`.
- **UI:** Merge the "Year" input and "Make & Model" input into a single field in `AddOrderForm.tsx` and `EditOrderForm.tsx`.
- **Seed + CSV Import:** Update.

**Can it be done later without affecting existing data?**
> ❌ **NO.** The back-fill concat is safe to run on existing rows, but waiting creates more rows to transform. More importantly, after the change the `orderYear` column no longer exists — any code still referencing it will crash. This is a coordinated sweep that's easier with zero or few records.

**Priority: P0**

---

## 🟠 P1 — HIGH: New Tables / Columns Before Production Data (Safe Migration, But Time-Sensitive)

These changes add new tables or columns. They won't destroy existing data, but they are meant to track history/events **from the moment they go live**. Every day without them means lost audit trail or missing fields that should have been recorded from day 1.

---

### #12 — Dual Status History Tables (saleStatus + orderCurrentStatus history)

**Depth:** `DB Schema (TWO NEW TABLES) → Migrations → Repository → Service → Routes → UI`

**What changes:**
- **DB/Migrations [TWO NEW TABLES]:** Create two separate tables to audit status changes:
  1. `crm_sale_status_history`:
     ```sql
     CREATE TABLE crm_sale_status_history (
       id              INT AUTO_INCREMENT PRIMARY KEY,
       order_id        INT NOT NULL,
       old_value       VARCHAR(10),
       new_value       VARCHAR(10) NOT NULL,
       changed_by_id   INT NOT NULL,
       changed_by_name VARCHAR(55) NOT NULL,
       changed_at      DATETIME NOT NULL DEFAULT NOW(),
       FOREIGN KEY (order_id) REFERENCES crm_orders(crm_order_id) ON DELETE CASCADE,
       FOREIGN KEY (changed_by_id) REFERENCES users(uid)
     );
     ```
  2. `crm_order_current_status_history`:
     ```sql
     CREATE TABLE crm_order_current_status_history (
       id              INT AUTO_INCREMENT PRIMARY KEY,
       order_id        INT NOT NULL,
       old_value       VARCHAR(55),
       new_value       VARCHAR(55) NOT NULL,
       changed_by_id   INT NOT NULL,
       changed_by_name VARCHAR(55) NOT NULL,
       changed_at      DATETIME NOT NULL DEFAULT NOW(),
       FOREIGN KEY (order_id) REFERENCES crm_orders(crm_order_id) ON DELETE CASCADE,
       FOREIGN KEY (changed_by_id) REFERENCES users(uid)
     );
     ```
- **Prisma Schema:** Add `CrmSaleStatusHistory` and `CrmOrderCurrentStatusHistory` models with appropriate relations and indexes.
- **Repository:** Add `createSaleStatusHistoryEntry(...)`, `getSaleStatusHistoryByOrderId(...)`, `createWorkflowStatusHistoryEntry(...)`, and `getWorkflowStatusHistoryByOrderId(...)` functions.
- **Service:** `order.service.ts` `updateOrder()` must detect changes to `saleStatus` or `orderCurrentStatus` separately and write to the respective history tables. Attribution details (agent UID/name) must be passed.
- **Routes:** Create `GET /api/orders/:id/sale-status-history` and `GET /api/orders/:id/workflow-history` routes.
- **UI:** Order detail page gets two distinct timeline widgets at the bottom (guarded by respective RBAC permissions: `orders:view-sale-status-history` and `orders:view-workflow-history`). The UI dropdown menus for `saleStatus` (in Add and Edit forms) will only expose **three active options**: Sold (`1`), Refunded (`2`), and Chargebacked (`3`). All other legacy/deprecated statuses are removed from the interactive controls. When modifying `saleStatus` to Refund (`2`) or Chargeback (`3`), a modal dialog prompts the user for the actual date/time of the transaction. If skipped/not filled, the field defaults to the current system date/time (with clear messaging to the user).

**Special sub-requirement:** When `saleStatus` is changed to `Refunded (2)` or `Chargebacked (3)`, a modal pops asking for the date of the refund/chargeback. If not filled, defaults to current date/time (note this in the UI).

**Can it be done later without affecting existing data?**
> ⚠️ **Partially.** The tables are additive — existing orders won't have history rows (history starts from go-live), but that's expected. However, every day without this table means lost audit data. Refund/chargeback dates for existing `saleStatus` records will never be known unless manually entered. If production use has started, this gap is permanent. Additionally, a database migration is required to map any legacy Refund/Chargeback codes (`7`/`8`) to their new values (`2`/`3`) to avoid broken reports.

**Priority: P1**



---

### #11 — Add `salesVerifierId` and `backendExecutiveId` to Orders

**Depth:** `DB Schema → Migration → Repository → Service → Routes → UI`

**What exists:** `CrmOrders` has `orderSalesAgentId` (Sales Rep) and `orderVerifierId` (QA Verifier). The request adds **Sales Verifier** and **Backend Executive**.

**What changes:**
- **DB/Migration:** Add 4 columns to `crm_orders`:
  ```sql
  ALTER TABLE crm_orders
    ADD COLUMN order_sales_verifier_id INT NULL,
    ADD COLUMN order_sales_verifier_name VARCHAR(55) NULL,
    ADD COLUMN order_backend_executive_id INT NULL,
    ADD COLUMN order_backend_executive_name VARCHAR(55) NULL;
  ```
  Add FK constraints to `users(uid)`.
- **Prisma Schema:** Add 4 new fields + relations (`salesVerifier`, `backendExecutive`).
- **Repository:** `order.repository.ts` — resolve and snapshot names on create/update (same pattern as `salesAgent`/`verifier`).
- **Types:** Add fields to `OrderCreateInput`, `OrderUpdateInput`.
- **Routes:** `POST /api/orders`, `PATCH /api/orders/:id` — accept new IDs.
- **UI:** `AddOrderForm.tsx`, `EditOrderForm.tsx` — add two new agent dropdowns. `OrderList.tsx` — show all 4 roles in the sequence: Sales Agent → Sales Verifier → Backend Executive → QA Verifier.

**Can it be done later without affecting existing data?**
> ✅ **YES, safely.** Columns are nullable, existing rows just get NULLs. But deferring means all orders created before the change lack these assignments — a gap in records. It's best to add before real orders come in.

**Priority: P1**

---

### #19 — Order View Log (Who opened which order and when)

**Depth:** `DB Schema (NEW TABLE) → Migration → Repository → Routes → UI + New RBAC Permission`

**What changes:**
- **DB/Migration [NEW TABLE]:** `crm_order_views` — `(id, order_id, viewer_id, viewed_at DATETIME DEFAULT NOW())`.
- **Prisma Schema:** New `CrmOrderViews` model.
- **Repository:** `logOrderView(orderId, userId)`, `getOrderViews(orderId)`.
- **Routes:** `POST /api/orders/:id/view` (called server-side when the detail page loads). `GET /api/orders/:id/views` (permission-gated).
- **UI:** Order detail page bottom section shows a history log of who opened it and when.
- **RBAC:** New permission `orders:view-log` — controls who can see the view history section.
- **Seed:** Add the new permission to `seed.sql`.

**Can it be done later without affecting existing data?**
> ✅ **YES, safely.** Additive table. But every order opened before this goes live will have no view history. That's an acceptable gap, but the sooner this is deployed, the better the audit trail.

**Priority: P1**

---

### #32 — Order Field Change Audit Log (Full Per-Field Change History on Every Order Edit)

**Depth:** `DB Schema (NEW TABLE) → Migration → Repository → Service → Routes → UI + New RBAC Permission`

**What exists:** When any agent edits an order via `PATCH /api/orders/:id`, only the final values are persisted. There is no record of *what changed*, *from what value*, *to what value*, *who made the change*, or *when*. The two status history tables from Change #12 track only `saleStatus` and `orderCurrentStatus`. All other fields — vehicle info, pricing, vendor, agent assignments, documentation, etc. — have zero audit coverage.

**What changes:**
- **DB/Migration [NEW TABLE]:** Create `crm_order_audit_log`:
  ```sql
  CREATE TABLE crm_order_audit_log (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT         NOT NULL,
    field_name      VARCHAR(100) NOT NULL,   -- e.g. 'orderMakeModel', 'orderVendorId'
    old_value       TEXT        NULL,         -- previous value serialized as string
    new_value       TEXT        NULL,         -- new value serialized as string
    changed_by_id   INT         NOT NULL,
    changed_by_name VARCHAR(55) NOT NULL,
    changed_at      DATETIME    NOT NULL DEFAULT NOW(),
    FOREIGN KEY (order_id) REFERENCES crm_orders(crm_order_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_id) REFERENCES users(uid)
  );
  ```
- **Prisma Schema:** Add `CrmOrderAuditLog` model with relations to `CrmOrders` and `Users`.
- **Repository:** Add `createAuditLogEntries(orderId, entries[])` (bulk insert for multi-field changes in one PATCH) and `getAuditLogByOrderId(orderId)`.
- **Service:** In `order.service.ts` `updateOrder()`, before writing the update, fetch the current row, diff every incoming field against the stored value, and bulk-insert one `crm_order_audit_log` row per changed field.
- **Routes:** `GET /api/orders/:id/audit-log` — returns all change entries for an order in reverse-chronological order, permission-gated by `orders:view-audit-log`.
- **UI:** A collapsible "Change History" card at the bottom of the order detail page (rendered only when user has `orders:view-audit-log`). Shows a table: Date/Time | Field | Old Value | New Value | Agent.
- **RBAC:** New permission `orders:view-audit-log` seeded for super-admin and manager roles.
- **Seed:** Add permission to `seed.sql` and `project_data.md`.

**Can it be done later without affecting existing data?**
> ⚠️ **Partially.** The table is additive — existing orders won't lose data. But every edit made before this goes live is **permanently unauditable**. There will never be a way to know what was changed and by whom on orders edited before deployment. The sooner this is in place, the better the operational accountability trail.

**Priority: P1** *(Additive, but audit history is retroactively irreversible — same reasoning as #12 and #19)*

---

### #3 — Sale Date Field (Back-dating Orders)

**Depth:** `DB Schema → Migration → Repository → Service → Routes → UI`

**What exists:** `CrmOrders` already has `orderDate DATE` (line 230 of schema). **But** the `AddOrderForm.tsx` does NOT expose it as an input field — it defaults to `new Date()` in the repository (line 100: `orderDate: data.orderDate ? new Date(data.orderDate) : new Date()`).

**What changes:**
- **DB/Migration:** ✅ No schema change needed — `order_date` column already exists.
- **Repository:** Already handles `data.orderDate` if provided.
- **UI (only):** Add a "Sale Date" date picker input to `AddOrderForm.tsx` and `EditOrderForm.tsx`. Default to today. Label clearly: *"Sale Date (defaults to today)"*.
- **Seed:** No change.

**Can it be done later without affecting existing data?**
> ✅ **YES.** This is almost entirely a UI change. The column exists. But every order entered before this fix defaults to the system-entry date — if backdated sales are needed from day 1, this should be added immediately. UX impact if deferred: agents cannot backdate, which is a **functional gap** the client explicitly called out.

**Priority: P1** *(Only UI change needed, but functional gap means it should be done immediately)*

---

### #21 — Order Delete with Cascade

**Depth:** `DB → Repository → Routes → UI + New RBAC Permission`

**What exists:** `order.repository.ts` already has `remove()` that calls `prisma.crmOrders.delete()` (line 237). But there's no delete button in the UI, no route guard, and no cascade handling verified.

**What changes:**
- **DB:** Verify all FK children of `crm_orders` have `ON DELETE CASCADE`: `crm_comments`, `crm_sale_status_history` (from #12), `crm_order_current_status_history` (from #12), `crm_order_views` (from #19). If not set, add CASCADE to existing FK constraints via migration.
- **Repository:** Already has `remove()`. Will need to verify cascades work end-to-end.
- **Routes:** Already has `DELETE /api/orders/:id` handler (referenced in current_state.md). Add permission check for `orders:delete` or reuse `super-admin` guard.
- **RBAC:** New permission `orders:delete` seeded only for super-admin role.
- **UI:** Add a "Delete" button on the order detail page, behind the `orders:delete` permission. Confirmation modal before executing.
- **Seed:** Add `orders:delete` to `seed.sql` and `project_data.md` permission table.

**Can it be done later without affecting existing data?**
> ✅ **YES.** Additive. But the earlier the CASCADE constraints are confirmed, the safer the DB is. The #12 and #19 tables must have CASCADE FK to orders — so this should be aligned with those.

**Priority: P1** *(Cascade constraint alignment is coupled with #12 and #19)*

---


## 🟡 P2 — MEDIUM: Important Features, Safe to Defer

These are fully additive feature changes. No existing data is at risk. Deferring them causes incomplete UX but does not corrupt records.

---

### #13 — Champions League: Current Month Only + Monthly Filter

**Depth:** `Service → Repository → UI`

**What exists:** `TeamMonthlyScoresWidget.tsx` already has a month navigator. The Champions League widget (if separate) likely reuses similar data. Need to verify it exists in the dashboard.

**What changes:**
- **DB:** No change.
- **Service/Repository:** Scope Champions League query to filter by `MONTH(order_date) = currentMonth AND YEAR(order_date) = currentYear`. Add the same month filter parameter support that `getTeamMonthlyScores` already has.
- **UI:** Add month filter selector to Champions League widget (same pattern as `TeamMonthlyScoresWidget`).

**Can it be done later?** ✅ Yes, purely additive. No data risk.

**Priority: P2**

---

### #14 — Team Monthly Scores: Top 3 + Bottom 3 (not just 1)

**Depth:** `Repository → Service → UI`

**What exists:** `getTeamMonthlyTopPerformer` and `getTeamMonthlyBottomPerformer` in `dashboard.repository.ts` return a **single** agent (lines 353, 390). The service in `dashboard.service.ts` also returns one top/one bottom.

**What changes:**
- **DB:** No change.
- **Repository:** Change `getTeamMonthlyTopPerformer` to return top 3 agents (sort descending, slice 3). Same for `getTeamMonthlyBottomPerformer`.
- **Service:** Return arrays instead of single objects.
- **Types:** `TeamMonthlyReport.topPerformer` changes from `{ agentName, amount } | null` to `{ agentName, amount }[]`.
- **UI:** `TeamMonthlyScoresWidget.tsx` renders a list of 3 for each instead of one row.

**Can it be done later?** ✅ Yes. No data risk, purely query/display change.

**Priority: P2**

---

### #25 — Order Pipeline Page: Count/Amount + Backend Team Member Filter

**Depth:** `Repository → Service → Routes → UI`

**What changes:**
- **DB:** No change (counts from existing data). Backend Team Member filter depends on #11 being done first.
- **Repository:** `getPendingCounts()` in `dashboard.repository.ts` already returns `{ amount, count }` per status (lines 275-293). The pipeline page just needs to display these.
- **Routes:** Possibly expose pending counts through the existing dashboard metrics endpoint or a new endpoint for the pipeline page.
- **UI:** `OrderListContainer.tsx` — display order count + total amount in each tab. Add Backend Team Member filter dropdown (depends on #11).

**Dependencies:** #11 (Backend Team Member field) must be done first.

**Can it be done later?** ✅ Yes. Display-only change for counts. Backend filter depends on #11.

**Priority: P2** *(Blocked partially by #11)*

---

### #27 — Vendor Profile: Clickable Order Lists + Performance Graph

**Depth:** `Service → Repository → UI`

**What exists:** `vendor.service.ts` already computes `totalOrders`, `positiveOrders`, `negativeOrders`. The detail page shows counts. But there's no clickable drill-down and no graph.

**What changes:**
- **DB:** No change.
- **Repository:** Already has `findOrdersByVendorId()`. Just needs to be surfaced better in the UI.
- **UI:** Vendor detail page — make the counts clickable (toggle a filtered order list). Add a bar/line chart (similar to `AdvancedChartWidget.tsx`) showing order performance over time.

**Can it be done later?** ✅ Yes. Display-only.

**Priority: P2**

---

### #28 — Split `agents:view` into `agents:view` (list) vs `agents:view-details`

**Depth:** `DB → Service → Routes → UI`

**What changes:**
- **DB/Migration:** Add new permission `agents:view-details` to `crm_permissions`. Add it to the appropriate roles in `crm_role_permissions`.
- **Service:** `permission.service.ts` — check both keys at the right level.
- **Routes:** The `GET /api/agents/:id` route currently uses `agents:view`. Add a secondary check: if user only has `agents:view` (not `agents:view-details`), return a restricted field set.
- **UI:** `AgentProfileView.tsx` — blur/dash/cross sensitive fields if `agents:view-details` is absent. Display a "Restricted" placeholder.
- **Seed:** Add new permission to `seed.sql` and `project_data.md`.

**Can it be done later?** ✅ Yes. Additive RBAC expansion. No data at risk.

**Priority: P2**

---

### #29 — Rename Page: "Roles and Permissions"

**Depth:** `UI only`

**What changes:**
- **UI:** Change page title in `settings` route/page from current label to "Roles and Permissions". Update `Sidebar.tsx` or `Navbar.tsx` link label.

**Can it be done later?** ✅ Yes, trivial UI label change.

**Priority: P2** *(But trivially easy — can be done in 5 minutes)*

---

### #30 — Query Optimization & Caching (Latency: Vercel → GoDaddy)

**Depth:** `Infrastructure + Repository + Caching Layer`

**What changes:**
This is a multi-pronged concern. In addition to optimization and caching, here are other approaches:

1. **Query Optimization (Repository layer):**
   - Replace `findMany` + in-memory aggregation (e.g., `getTopPerformers` in dashboard.repository.ts, lines 135-162) with proper `groupBy` + `_sum` Prisma aggregations or raw SQL `GROUP BY` queries. This halves round-trips.
   - Add missing DB indexes for frequently filtered columns (e.g., `orderDate`, `saleStatus` composite index).

2. **Caching (Service/Route layer):**
   - Use Next.js `unstable_cache` or `revalidateTag` for dashboard metric endpoints that don't change per-request. Dashboard aggregate data can be cached for 60 seconds.
   - Use React's `cache()` for server-component data fetching to deduplicate within a single render.

3. **Other approaches the client didn't mention:**
   - **Connection pooling via PgBouncer/ProxySQL:** GoDaddy MySQL doesn't support connection poolers natively, but you can use **PlanetScale** or **TiDB Cloud** (MySQL-compatible) which have built-in connection poolers and edge-CDN-close servers. This would be the single biggest latency fix.
   - **Vercel Edge Functions + Regional DB:** Move critical read endpoints to Vercel Edge Runtime and point them to a DB replica in the same region (GoDaddy → Vercel US-East latency is ~30ms; DB-in-same-region would be <5ms).
   - **Incremental Static Regeneration (ISR):** For vendor/agent list pages that rarely change, use Next.js ISR to pre-render and cache the HTML.
   - **HTTP-level response caching:** Add `Cache-Control: s-maxage=30, stale-while-revalidate=60` headers to GET endpoints that serve aggregate data (dashboard metrics, vendor lists).

**Can it be done later?** ✅ Yes, but it affects perceived performance daily. Best done as an ongoing concern.

**Priority: P2** *(Can be done incrementally — start with indexes and caching headers)*

---

### #31 — Update Seed File to Match New Migrations

**Depth:** `Seed SQL + Import CSV Script`

**What changes:**
- `seed.sql` must be rewritten to match whatever schema changes come from #1, #2, #11, #12, #19, #21, #28.
- Import script (CSV importer) column mappings must be updated to use the new field names.
- All batch INSERTs should use multi-row syntax (one `INSERT INTO ... VALUES (...),(...),...` per table) for performance, rather than individual statements. Also wrap in transactions per batch of 500 rows.

**Dependencies:** Must be done AFTER #1, #2, #11, #12, #19 are completed.

**Priority: P2** *(Final step, after all P0/P1 schema work is done)*

---

## 🟢 P3 — LOW / POLISH: UI-Only or Minor Changes

These are pure frontend changes. No schema, no migration, no data risk. They can be done in any order.

---

### #4 — Remove Redundant Graph Filters (`Last 7 Days` vs `This Week`, `Last 30 Days` vs `Last Month`)

**Depth:** `UI only`

**What exists:** `AdvancedChartWidget.tsx` has these options in the range `<select>` (lines 292-303):
- `value="7d"` → "Last 7 days" ← **REDUNDANT with "This Week"** (both ~7 days, but different semantics: 7d = rolling, this-week = Mon–today)
- `value="30d"` → "Last 30 days" ← **REDUNDANT with "This Month"** (30d = rolling, this-month = 1st–today)

**Note:** These are actually *not* identical — "Last 7 days" is a rolling window; "This week" is calendar week. But if the client finds them confusing, remove the rolling ones and keep the calendar-aligned ones.

**What changes:** Remove the `<option value="7d">` and `<option value="30d">` lines. Update the default `range` state from `'7d'` to `'this-week'`. Update `handleCancelCustom` default.

**Can it be done later?** ✅ Yes. Zero data risk.

**Priority: P3** *(5-minute change)*

---

### #5 — Alias Name Visible Everywhere, Real Name Only on Profile

**Depth:** `UI only (nickname field already exists)`

**What exists:** `Users` model has `nickname` field (line 21 of schema). Many places already use `agent.nickname || agent.name` pattern (e.g., `order.repository.ts` lines 13, 24). But some UI components may display `agent.name` directly.

**What changes:** Audit all UI components that display agent names and ensure they follow the `nickname || name` pattern. Specifically: `AgentList.tsx`, `AgentProfileView.tsx`, `OrderList.tsx`, `RecentOrdersTable.tsx` — any place that shows the agent. Profile page remains the one place showing `name` (real name) prominently.

**Can it be done later?** ✅ Yes. Pure display logic, already partially implemented.

**Priority: P3**

---

### #6 — Shipping Type Dropdown: Residential and Commercial Only

**Depth:** `UI only`

**What exists:** `AddOrderForm.tsx` (line 427-431) has: Ground, Air, Express, Freight options. `EditOrderForm.tsx` has the same.

**What changes:** Replace all 4 options with just `Residential` and `Commercial`. Update default state from `'Ground'` to `'Residential'`. **Note:** Existing orders with old values (Ground/Air/etc.) will display their stored string — consider whether to add a migration to map old values, or just let them display as-is.

**Can it be done later?** ✅ Yes. No schema change. But old data in the DB will retain old values.

**Priority: P3**

---

### #7 — Card Number & Exp Date Formatting (UI Masks)

**Depth:** `UI only (no schema change)`

**What exists:** `AddOrderForm.tsx` (line 245-265) has plain text inputs for card number and expiry. No auto-formatting.

**What changes:**
- Card Number input: Apply an `onChange` formatter that inserts spaces in the pattern `XXXX XXXX XXXX XXXX` for Visa/MC/Discover, or `XXXX XXXXX XXXXX` for AmEx (detected by first digit: AmEx starts with 3).
- Expiry Date input: Format to `MMYY` (4 digits, no slash). Validation on submit.
- These are **stored as formatted strings** — `customerCardNumber` is `VARCHAR(25)` which can hold the spaced format.

**Can it be done later?** ✅ Yes. Pure UX enhancement.

**Priority: P3**

---

### #10 — Rename "Quoted Mileage" → "Quotes Miles" and "Vendor Mileage" → "Vendor Miles"

**Depth:** `UI only (label change)`

**What exists:** `AddOrderForm.tsx` lines 350: `"Quoted Mileage"` and 360: `"Vendor Mileage"`. DB columns are `order_quoted_miles` and `order_given_miles` — column names unchanged.

**What changes:** Change two `<label>` text strings. 2 files: `AddOrderForm.tsx` and `EditOrderForm.tsx`.

**Priority: P3** *(Trivial — 2 label changes)*

---

### #16 — Fresh Orders Table: Add Customer Phone, Edit Button, Vendor Name

**Depth:** `Service → UI`

**What exists:** `RecentOrdersTable.tsx` shows: Order ID, Date, Customer Name, Sales Agent, Markup, Status, Action (Details link). The service in `dashboard.service.ts` (lines 93-100) maps `recentOrders` without customer phone or vendor name.

**What changes:**
- **Service/Repository:** `getRecentOrders()` in `dashboard.repository.ts` (line 194) — add `customerPhone` to the customer select, add `orderVendorName` to the order select.
- **Service:** `dashboard.service.ts` map (line 93) — include `customerPhone` and `orderVendorName`.
- **UI:** `RecentOrdersTable.tsx` — add Phone and Vendor Name columns. Add an Edit button (link to `/orders/:id/edit`).
- **Types:** Update `RecentOrderRow` type in `src/types/dashboard.ts`.

**Can it be done later?** ✅ Yes. Additive display columns.

**Priority: P3**

---

### #17 — BUG: Team Monthly Scores Doesn't Show Refunds in UI

**Depth:** `Service → UI`

**What exists:** `getTeamMonthlyScores()` in `dashboard.repository.ts` (lines 296-328) correctly calculates `refundCount` and `chargebackCount` with the SQL CASE expression. The `TeamMonthlyScoresWidget.tsx` renders `refundCount` and `chargebackCount` in the "Disputes" row (lines 183-185). 

**The bug:** After changing `saleStatus` to Refund/Chargeback, the dashboard's `getTeamMonthlyScores` filters by `MONTH(o.order_date)` — which is the **sale date** of the order, not the refund date. If an order from last month is refunded this month, it won't appear in this month's refund count. This is arguably correct behavior, but may not match what the client expects.

**Additionally:** The `getTeamMonthlyBottomPerformer` query (line 368) only counts `saleStatus = '1'` (Sold) orders — it does NOT deduct refunds from the agent's score. So the "score removed" but the team monthly score still shows the agent as a performer, just without that order counted.

**What changes:**
- **Repository:** In `getTeamMonthlyScores`, the LEFT JOIN with `crm_orders` already uses `MONTH(o.order_date)` — this is correct. The issue is whether `refundCount` properly deducts from the UI. Verify the UI renders it.
- **UI:** Double-check `TeamMonthlyScoresWidget.tsx` actually renders the `refundCount` for each team card. If `team.refundCount > 0` is shown but the number is right, the bug may be in the **timing of which date field is used**, not in the query.

**Can it be done later?** ⚠️ This is a **live bug** — data is being misreported. Should be investigated and fixed immediately.

**Priority: P1 → (reclassified as P1 because it's an active data display bug)**

---

### #20 — Order Page Table: Replace Email with Phone Number

**Depth:** `UI only`

**What exists:** `OrderList.tsx` likely shows customer email. Should show customer phone instead.

**What changes:** In `OrderList.tsx`, replace the email column with `customer.customerPhone`. Email still accessible via customer profile.

**Priority: P3**

---

### #22 — Date and Customer ID as First Columns (All Order Lists)

**Depth:** `UI only (column reorder)`

**What changes:** In `OrderList.tsx` and `RecentOrdersTable.tsx`, move Date and Customer ID columns to positions 1 and 2.

**Priority: P3**

---

### #23 — Time in Pending State Column (Except Completed Orders)

**Depth:** `Service → UI`

**What changes:**
- **Service:** No DB change. Calculate `timeSinceStatusChange = now - orderCurrentStatusUpdateDate`. Format as "X days Y hours".
- **UI:** `OrderList.tsx` — add a "Time in Status" column. Hide for `Completed Orders` tab. The `orderCurrentStatusUpdateDate` field already exists in the schema (line 229).

**Can it be done later?** ✅ Yes. Additive computed column.

**Priority: P3** *(borderline P2 — operationally useful)*

---

### #26 — Blacklisted Vendor: Show Red Flag in Vendor Dropdown

**Depth:** `Repository → UI`

**What exists:** Vendors have `vendorStatus` (0 = blacklisted). The `AddOrderForm.tsx` fetches vendors and shows them in a select. There's no indication of blacklisted status.

**What changes:**
- **Repository/Service:** `getAllVendors()` already returns `vendorStatus`. Pass it through to the form props.
- **UI:** `AddOrderForm.tsx` — include `vendorStatus` in the vendors prop. In the vendor `<option>`, prefix blacklisted vendors with a 🚩 emoji or `[BLACKLISTED]` text. Style in red.

**Priority: P3**

---

## 📊 Summary Table

| # | Change | Priority | Depth | Schema Change? | Data Risk? | Safe to Defer? |
|---|--------|----------|-------|----------------|------------|----------------|
| **2** | Merge first_name + last_name | **P0** | DB→Repo→Service→Routes→UI | ✅ Destructive | ❌ Yes | ❌ No |
| **1** | Merge order_year into make_model | **P0** | DB→Repo→Service→UI | ✅ Destructive | ❌ Yes | ❌ No |
| **12** | Status history timeline table | **P1** | New Table→Repo→Service→Routes→UI | ✅ Additive | ✅ No | ⚠️ Partial (loses history) |
| **17** | BUG: Team scores don't show refunds | **P1** | Service→UI | ❌ | ✅ No | ❌ Active bug |
| **3** | Sale Date input field | **P1** | UI only (column exists) | ❌ | ✅ No | ⚠️ UX gap |
| **11** | Sales Verifier + Backend Member fields | **P1** | DB→Repo→Service→Routes→UI | ✅ Additive | ✅ No | ⚠️ Missing from future orders |
| **19** | Order view log / audit trail | **P1** | New Table→Repo→Routes→UI | ✅ Additive | ✅ No | ⚠️ Loses view history |
| **32** | Order field change audit log | **P1** | New Table→Repo→Service→Routes→UI | ✅ Additive | ✅ No | ⚠️ Loses edit history |
| **21** | Order delete with cascade | **P1** | DB FK check→Routes→UI | ✅ FK constraints | ✅ No | ✅ Yes |
| **13** | Champions League current month filter | **P2** | Service→UI | ❌ | ✅ No | ✅ Yes |
| **14** | Team Monthly: Top 3 + Bottom 3 | **P2** | Repo→Service→UI | ❌ | ✅ No | ✅ Yes |
| **25** | Pipeline: count/amount + filter | **P2** | Repo→Service→UI | ❌ | ✅ No | ✅ Yes (needs #11) |
| **27** | Vendor profile clickable orders + graph | **P2** | Service→UI | ❌ | ✅ No | ✅ Yes |
| **28** | Split agents:view permissions | **P2** | DB (permission)→Service→Routes→UI | ✅ Additive | ✅ No | ✅ Yes |
| **29** | Rename "Roles and Permissions" page | **P2** | UI only | ❌ | ✅ No | ✅ Yes |
| **30** | Query optimization + caching | **P2** | Infrastructure+Repo | ❌ | ✅ No | ✅ Yes |
| **31** | Update seed file | **P2** | Seed SQL | ❌ | ✅ No | ✅ After P0/P1 |
| **4** | Remove redundant graph filters | **P3** | UI only | ❌ | ✅ No | ✅ Yes |
| **5** | Alias name everywhere | **P3** | UI only | ❌ | ✅ No | ✅ Yes |
| **6** | Shipping type: Residential/Commercial | **P3** | UI only | ❌ | ✅ No | ✅ Yes |
| **7** | Card number/exp formatting | **P3** | UI only | ❌ | ✅ No | ✅ Yes |
| **10** | Rename Mileage labels | **P3** | UI only (2 labels) | ❌ | ✅ No | ✅ Yes |
| **16** | Fresh Orders: phone, edit, vendor | **P3** | Service→UI | ❌ | ✅ No | ✅ Yes |
| **20** | Order table: phone instead of email | **P3** | UI only | ❌ | ✅ No | ✅ Yes |
| **22** | Date + Customer ID first columns | **P3** | UI only | ❌ | ✅ No | ✅ Yes |
| **23** | Time in pending state column | **P3** | Service→UI | ❌ | ✅ No | ✅ Yes |
| **26** | Blacklisted vendor red flag in dropdown | **P3** | UI only | ❌ | ✅ No | ✅ Yes |

---

## ✅ Recommended Execution Order

```
Sprint 1 (Critical — Before Any Production Data):
  → #2 (merge customer name columns)
  → #1 (merge year into make_model)
  → #31 (update seed after schema changes)

Sprint 2 (Before Go-Live):
  → #3 (sale date picker — UI, 30 min)
  → #11 (sales verifier + backend member columns)
  → #12 (status history table + refund/chargeback date modal)
  → #17 (fix team scores refund bug)
  → #21 (verify cascade FKs + delete button)
  → #19 (order view log table + RBAC)
  → #32 (order field change audit log + RBAC)

Sprint 3 (Post-Launch Features):
  → #13, #14 (dashboard filter/performer improvements)
  → #25 (pipeline count + backend member filter)
  → #27, #28 (vendor profile, agent permission split)
  → #29, #30 (rename page, query optimization)
  → #31 (finalize seed)

Sprint 4 (Polish — Any Time):
  → #4, #5, #6, #7, #10 (UI label/format fixes)
  → #16, #20, #22, #23, #26 (table column additions)
```
