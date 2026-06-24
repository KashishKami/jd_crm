# Architecture & Design Decisions Log

This document records the major design decisions made during the migration of the JD CRM system from the legacy PHP application to the Next.js TypeScript monolith, specifically highlighting deviations from the original design.

---

### Decision 1: Database-Level Foreign Key Constraints

#### Description:
The legacy PHP CRM database used the MyISAM storage engine for almost all tables, which does not support physical foreign key constraints. This allowed type mismatches (e.g., storing integer IDs as `VARCHAR` columns) and data inconsistency. In the new Next.js TypeScript monolithic application, all tables have been migrated to the **InnoDB** storage engine, and Prisma is configured with `relationMode = "foreignKeys"`. This creates and enforces real, database-level `FOREIGN KEY` constraints to ensure data integrity and structural reliability.

---

### Decision 2: Role-Based Access Control (RBAC) System

#### Description:
The legacy PHP CRM managed user authorizations using a comma-separated string of numeric codes (e.g., `"160,162"`) stored directly in a single `user_permissions` column on the `users` table. In the new system, we replaced this fragile pattern with a normalized **Role-Based Access Control (RBAC)** architecture. We introduced three relational tables (`crm_roles`, `crm_permissions`, and `crm_role_permissions` junction table) and modern, readable permission string keys (e.g., `'vendors:view'`, `'super-admin'`). Users now reference a specific role ID, and permissions are mapped dynamically at the database level.

---

### Decision 3: Vitest Execution Pool Configuration (`--pool=forks`)

#### Description:
The database integration tests using the `@prisma/adapter-mariadb` driver adapter (based on the `mariadb` npm package) timed out and hung when executed under Vitest's default thread-pool execution strategy (`worker_threads`). This occurs because the asynchronous connection sockets inside the native-JS `mariadb` driver and WASM bridge cannot be reliably processed inside Node.js worker threads under Vitest. We resolved this by changing the Vitest execution pool to child processes using the `--pool=forks` option, ensuring clean isolated test environments that support the driver adapter's network sockets.

---

### Decision 4: Standardized Order Workflow Status State Machine

**Date:** 2026-06-23
**Status:** Accepted

#### Context
The legacy system had an ambiguous initial order state (`Pending Tracking`) that conflated
"order received" with "tracking information required." There was also a misspelled status
(`Pending Delievery`) stored in the DB and a missing intake state before vendor assignment.

#### Decision
Introduce a formal six-stage state machine for `order_current_status`:

  Pending Booking → Pending Shipment → Pending Delivery →
  Pending Feedback → Pending Resolutions → Completed Orders

`Pending Booking` is the **immutable default** for all new orders. It is set
programmatically in `order.repository.ts` and is not selectable from the UI dropdown in
`EditOrderForm`. Status transitions are enforced in `order.service.ts`.

#### Consequences
- Clean separation between "intake" (no vendor) and "in-progress" (vendor assigned).
- Corrects the legacy misspelling in all new records; legacy data may retain old spelling.
- Frontend queues and routing now map 1:1 to each status stage.
- `Pending Tracking` route and references fully decommissioned.

---

### Decision 5: Responsive Dashboard Layout and Advanced Agent Directory Filters

**Date:** 2026-06-25
**Status:** Accepted

#### Context
To adapt the modernized JD CRM Next.js application for a wide variety of viewport dimensions without losing the premium design aesthetics:
1. The dashboard needed thematic section indicators, a structured layout for KPI metrics, and a less intrusive placement for daily attendance summaries.
2. The Agent Directory needed dynamically generated filter dropdowns (designation, team, role, status) and a real-time search input, along with visual restructuring to display agent nicknames/aliases first in quotes and real names below them.
3. The layout's 15% clear margin padding on the left and right (content occupying the center 70%) on larger screens restricted horizontal space, causing select dropdowns, tables, and pipeline cards to wrap awkwardly, overflow, or clip.

#### Decision
1. **Dashboard UI Refinement:** Created thematic left-bordered section header strips. Organized Key Performance Metrics into a 3-column grid layout, and moved the Daily Attendance Overview card to the bottom of the dashboard page. Modified section headings to custom thematic labels: "The Scoreboard", "Champions League", "Orders Journey", "Fresh Orders", and "Who’s In Today?".
2. **Polished Card Visuals & Padding:** Integrated top-accent colored border stripes (`card-with-accent`) and custom status pill badges (`status-badge`, `status-leaders`, `status-needs-review`) adapted from the polished mockup styling. Wrapped leaderboard tables in `card-table-container` to add responsive internal padding, reduced the Rank column header width, and minimized avatar dimensions.
3. **Dynamic Client-Side Filter Layout:** Implemented client-side filtering (omitting status parameters from the initial API fetch to load the dataset once) to support text search and dynamic filters. Converted all inline styling to CSS classes (`filters-container`, `filters-row`, `search-input-wrapper`, `filter-select-wrapper`, `filter-select-custom`, `filter-search-input`).
4. **Responsive Stepped Queries & Table Scrolling:** Programmed viewport-stepped scaling overrides in CSS to adapt font sizes, card paddings, table cell padding, avatar dimensions, and flex margins smoothly across desktop, laptop, tablet, and mobile dimensions. Configured all dashboard cards (both KPI and pipeline stages) to hide their icons and display exactly two cards per row on mobile screens. Enabled flex wrapping for dropdown inputs, scrolling overflow for pipeline tabs, and enabled horizontal scrolling on `.card-table-container` with a minimum width of `750px` for multi-column tables on mobile to prevent content clipping and ensure touch-swipe scrollability while keeping card headers fixed. Enabled flex wrapping for dropdown inputs and scrolling overflow for pipeline tabs to prevent content clipping and ensure alignment.

#### Consequences
- Avoids repetitive backend query roundtrips for agent filtering.
- Ensures all tables, metrics, and filter buttons fit cleanly inside any viewport without clipping or stretching layout limits.
- Improves scannability by prioritizing high-importance metrics (sales, pipeline counts) at the top of the viewport.
- Ensures dashboard mockup designs and live implementation elements are in complete visual alignment.
