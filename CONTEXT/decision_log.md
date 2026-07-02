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

---

### Decision 6: Core Navigation Relocation to Top Navbar & Dashboard Analytical Enhancements

**Date:** 2026-06-25
**Status:** Approved

#### Context
To match high-fidelity mockup references (e.g., Zenith design styles) and improve screen workspace for large dataset tables, charts, and pipeline boards:
1. The sidebar menu occupied significant horizontal layout space and needed to be converted into a top navbar layout with swipable items on mobile devices.
2. Dashboard KPI cards needed to be redesigned with white backgrounds, light grey borders, and "View Details" links.
3. Static all-time metrics needed to be replaced with current calendar year sales, accompanied by comparison metrics (last period vs current period) represented by mini sparkline trend charts instead of static icons.
4. Admins required an interactive advanced chart showing sales amount and order count trends with granular team, range, and corresponding validation-restricted granularity filters.

#### Decision
1. **Top Navbar Transition:** Replace the left collapsible sidebar and backdrop overlay in `LayoutShell.tsx` and `layout.css` with a modern top-aligned navigation navbar. The navbar renders the "JD CRM" logo on the left, horizontally swipeable pill-shaped page buttons (Dashboard, Orders, Vendors, Agents, Gateways) in the center, and the Sign Out button on the right.
2. **Mockup-Style Card Visuals:** Style KPI cards with a clean white background, light grey borders (`border: 1px solid #e2e8f0`), dynamic percentage change pills on the top right, comparative period labels on the bottom left, and a "View Details &rarr;" link at the bottom right.
3. **Current Year KPI Focus:** Refactor the primary metrics widget to display "This Year Sales" (replacing the legacy all-time "Total Sales"). When clicked, the card navigates directly to the orders pipeline pre-filtered for the current year.
4. **Sparkline Histogram Overlays:** Replace card icons with inline SVG comparison sparklines (2-column bar charts + trend line overlays) demonstrating sales trends against previous comparison periods (current vs. prior year, month, and day). Refund and Chargeback widgets are placed last with sparklines disabled.
5. **Admin-Guarded Advanced Charts:** Introduce an SVG-based combined smooth line chart and bar histogram component (Sales Amount vs. Order Count) visible only to users with the `dashboard:view-advanced-chart` permission. Integrate interactive dropdown controls for Sales Team, Range, and Granularity. Apply client-side range-to-granularity mapping validation to dynamically grey out and disable incompatible checkboxes (e.g., locking out daily intervals for year/all-time queries).

#### Consequences
- Frees horizontal desktop space for dense data tables and pipeline screens.
- Keeps mobile navigation functional and swipable without taking up viewport space.
- Enables visual performance evaluation on the dashboard at first glance.
- Restricts database query performance overhead by grouping complex calculations and toggles behind dedicated, cache-friendly endpoints.

---

### Decision 7: Metric Card Styling Refinements & Phone-Only Double Column Layout

**Date:** 2026-06-25  
**Status:** Approved

#### Context
To polish the dashboard scoreboard and Orders Journey cards:
1. The border color and footer background colors of the cards had visual mismatches, particularly when hovering or when client-side browsers loaded cached versions of JavaScript bundles.
2. Scoreboard cards without graphs (Refunds and Chargebacks) were previously forced into a separate row of two columns on all viewports, which took up unnecessary vertical space on larger screens where they should blend naturally in the standard 3-column layout.
3. The "View Details →" text inside the footer band and the titles inside cards looked too large and wrapped onto multiple lines on narrower screen sizes (tablets and mobiles).

#### Decision
1. **Lightened Color System**: Set the card borders and the background of the bottom footer bands to a unified, clean, lighter grey `#f1f5f9` (slate-100).
2. **Inline Style Overrides**: Configured card borders (`border: '3px solid #f1f5f9'`) and footer band backgrounds/top-borders inline on `MetricCard.tsx` and `PendingCountsRow.tsx` wrapper elements to bypass browser/dev server caching and guarantee visual synchronization.
3. **CSS Hover Effects**: Migrated all card hover animations and style changes from dynamic JS state transitions (`onMouseEnter` / `onMouseLeave`) to the static CSS class `.metric-card-interactive` and CSS selector `:hover` in `components.css`. Removed border-color changes on hover to keep the card border and footer background aligned.
4. **Mobile-Only Double Column Layout**: Reverted the scoreboard rendering in `dashboard_client_page.tsx` back to a single grid container. Programmed responsive CSS Grid columns and spans in `layout.css` so that on mobile/phone screens (`< 480px`), cards with graphs span the full row width (`span 2`), while cards without graphs (Refunds and Chargebacks) span 1 column, sitting side-by-side. On desktop and tablet viewports, all cards act as normal span-1 columns inside the standard grid.
5. **Chart Clean-up & Text Scaling**: Removed the connecting line path and trend dot from the sparkline SVG comparison chart in `MetricCard.tsx`, showing only the comparison bars. Scaled down `.metric-card-title`, `.metric-card-value`, and `.metric-card-footer` font sizes progressively across laptop, tablet, and mobile breakpoints to prevent text-wrapping on narrow columns.

#### Consequences
- Eliminates visual desyncs on card borders when hover states are left or when stylesheets/JS assets are cached in the browser.
- Keeps Refunds and Chargebacks grouped inline with the rest of the scoreboard on desktop/tablet viewports, while preserving side-by-side density on phones.
- Ensures sparklines remain minimal, clean, and focused solely on bar comparisons.
- Prevents awkward text-wrapping of titles (such as "SALES THIS MONTH") and view details text on mobile viewports.

---

### Decision 8: Isolated Test Database Schema with Automatic Setup & Teardown

**Date:** 2026-06-29
**Status:** Approved

#### Context
Prior to this decision, Vitest integration tests connected directly to the primary local development database (`jd_crm`) defined in `.env`. This had severe drawbacks:
1. Running tests populated or mutated real development data (creating orphaned customers, fake cards, and mock orders), which cluttered the local dashboard.
2. Stale seeded data (such as dummy orders from `seed-dummy-orders.ts`) caused tests to fail due to duplicate entries or state conflicts.
3. Tests would dirty the database, requiring manual cleanup or re-seeding to keep development environments pristine.

#### Decision
Migrate the test suite to a dedicated, isolated database schema (`jd_crm_test`) with fully automated lifecycle management:
1. **Config Isolation**: Create a `.env.test` file pointing to `DATABASE_URL="mysql://root:root_password@127.0.0.1:3306/jd_crm_test"`. Using the root account enables the test runner to manage schemas dynamically without host privilege restrictions.
2. **Vitest Global Hooks**: Implement a `src/tests/globalSetup.ts` script executed by Vitest before tests run. This setup hook:
   - Uses `mariadb` to connect to the MySQL instance and runs `CREATE DATABASE IF NOT EXISTS jd_crm_test`.
   - Runs `npx prisma db push --accept-data-loss` to synchronize the latest Prisma schemas automatically.
   - Runs `npx tsx src/scripts/run-seed.ts` to populate roles, teams, permissions, and default admin accounts so tests can authenticate immediately.
3. **Automated Teardown**: Program the `teardown` hook in `globalSetup.ts` to connect to the test database and run `TRUNCATE TABLE` on all tables, leaving the test database fully clean after tests run.

#### Consequences
- Zero test data pollution in the local development database (`jd_crm`).
- Clean, reliable, and reproducible test runs from a pristine schema state on every execution.
- Tests automatically configure and teardown their own database, requiring no manual DB administration during local runs or in CI environments.

---

### Decision 9: Grid-Aligned Top Navbar Search & Mobile-Responsive Layout Refinements

**Date:** 2026-06-30
**Status:** Approved

#### Context
To refine the visual layout and user experience:
1. The global search bar was previously placed in the main page content layout, causing it to look detached. It needed to be integrated into the top navbar but aligned horizontally with the 15% desktop content margins, while the logo and profile buttons remained at the far edges of the screen.
2. In intermediate and half-screen widths (under 1600px), absolute layout positioning caused elements (the Logo, Navigation Pills, Search Bar, and User Profile Button) to collide and overlap.
3. On mobile screens (under 768px), the search bar was hidden, but users required it to be accessible on Row 1 (between Logo and User Profile) while the Navigation Pills wrapped to Row 2.
4. Scoreboard cards on mobile screens overlapped and wrapped because they were rendering in two columns without scaling their fonts and graphics properly, and the suggestion box was cramped and lacked spacing.

#### Decision
1. **Desktop Grid Alignment via Absolute Overlay**: Enforced that `.navbar-aligned-content` uses absolute positioning overlay ONLY at screen widths >= 1024px, wrapping the Navigation Pills and Global Search Bar. This aligns them with the 15% page content margins while the Logo and Profile Dropdown remain unshifted at the screen boundaries.
2. **Intermediate Width Contraction (1600px Breakpoint)**: Programmed contraction rules to trigger at screen widths of 1600px or less. The logo suffix "CRM" is hidden, and the User Profile text "Admin" is hidden (showing only the avatar), freeing up space and preventing element overlap.
3. **Dual Search Bar Architecture**: Integrated a mobile-only search bar (`.mobile-search-wrapper`) and a desktop-only search bar (`.desktop-search-wrapper`). On mobile screens (<= 768px), the desktop search bar is hidden and the mobile search bar is displayed inline on Row 1 between the Logo and Avatar, while the Navigation Pills wrap to Row 2.
4. **Mobile 2-Column KPI Card Scaling**: Configured the dashboard scoreboard to render as exactly 2 cards per row on mobile screens by forcing all card containers (`.card-has-graph`, `.card-no-graph`) to span 1 column. Concurrently scaled down title, value, count, and sparkline graphics in CSS to prevent layout overflow.
5. **Polished Suggestion List Row spacing**: Replaced Tailwind classes with Vanilla inline style definitions. Added explicit vertical paddings (`12px`), row borders, and hover backgrounds (`.suggestion-item-row:hover`) to make search recommendations readable and visually premium.

#### Consequences
- Navbar elements align perfectly with page boundaries on large desktop viewports.
- Eliminates intermediate overlaps on half-screen viewports (up to 1600px wide).
- Mobile search remains instantly accessible next to the branding.
- KPI metric indicators fit cleanly side-by-side on all mobile viewports.
- The search suggestion box displays beautifully with clear row definitions and click indicators.

---

### Decision 10: Mobile Hamburger Navigation Drawer & Swipable Scoreboard Cards

**Date:** 2026-06-30
**Status:** Approved

#### Context
To optimize mobile navigation usability and layout density:
1. Mobile viewports previously wrapped the navigation pills onto a second row, cluttering the top navbar. We needed to group all navigation links under a single hamburger button, allowing the search bar to occupy the remaining width.
2. Even with font scaling, rendering two columns of KPI metric cards side-by-side on very narrow devices squished the details. A swipable horizontal carousel showing one card at a time with indicators was requested.

#### Decision
1. **Hamburger Navigation Drawer**: Lifted the sidebar open/close state (`sidebarOpen`) to `LayoutShell.tsx` and mounted `Sidebar` as a slide-over drawer overlay with a backdrop click handler. Integrated a hamburger toggle button (`.hamburger-btn`) into the mobile top navbar on the left of the Logo.
2. **Full-Width Mobile Search Bar**: Hidden the pills menu (`.navbar-aligned-content`) entirely on screens <= 768px. Concurrently allowed the mobile search bar (`.mobile-search-wrapper`) to expand and occupy all remaining width between the Logo and Profile Avatar.
3. **Scroll-Snapping KPI Carousel**: Configured the scoreboard container `.kpi-cards-swipeable` to use CSS Scroll Snapping (`scroll-snap-type: x mandatory`) and `overflow-x: auto` on mobile screens. Set card children to `flex: 0 0 100%` and `scroll-snap-align: start` to present exactly one card at a time.
4. **Slide Indicators**: Appended interactive dots (`.kpi-swipe-indicators`) updating dynamically via a React scroll event listener (`onScroll`) that matches `scrollLeft / clientWidth`.

#### Consequences
- Mobile navbar displays cleanly on a single line: Hamburger | Logo | Full-Width Search | Avatar.
- Swipe gestures are completely native and smooth, powered by high-performance CSS Scroll Snapping.
- Dot indicators provide clear visual cues of multi-card availability and current slide index.
- Standardizes desktop layout behavior, keeping pills visible on larger viewports.

---

### Decision 11: Sidebar Drawer Streamlining & Orders Journey Mobile Carousel

**Date:** 2026-06-30
**Status:** Approved

#### Context
To polish the user experience on mobile screens:
1. The sidebar drawer previously contained profile info, sign out buttons, and section headers that took up significant visual space. We needed to strip it down to display only the navigation links.
2. Under mobile viewports, the spacing between navbar elements (Hamburger, Logo, Search Bar) was too loose due to flex space-between distribution.
3. Once the scoreboard and pipeline metrics were turned into single-card-per-row horizontal sliders on mobile, their font sizes looked too small. We needed to enlarge them to fill the container space nicely.
4. The "Orders Journey" pipeline stage cards also needed to be horizontal scroll-snap swipable, matching the Scoreboard layout.

#### Decision
1. **Sidebar Streamlining**: Modified `Sidebar.tsx` to remove the header logo, user profile details, section titles, and footer sign out blocks, keeping ONLY the link elements list (`nav-list`).
2. **Horizontal Grouping**: Wrapped the Hamburger Button and Logo inside a unified flex div (`.navbar-left-group`) with an 8px gap. On mobile, this group acts as a single flex item, reducing the gap between navbar components and allowing the mobile search bar to expand tightly.
3. **Card Font Enlargement**: Restored MetricCard mobile font sizes (under 768px and 480px breakpoints) to normal desktop dimensions (`1.7rem` value, `0.85rem` title) to leverage the full width of single-card slide views.
4. **Orders Journey Swipeable Row**: Wrapped the grid in `PendingCountsRow.tsx` inside `.kpi-swipe-container` and set up the ref hooks, state indicators, and scroll listeners to match the Scoreboard swipe layout.

#### Consequences
- Mobile sidebar navigation drawer is minimal and distraction-free.
- Header element spacing is tight and premium.
- Slide cards are fully readable and aesthetically bold.
- Consistent swipable card carousels across the dashboard.

---

### Decision 12: Dual-Row Mobile KPI Carousel Refinement

**Date:** 2026-06-30
**Status:** Approved

#### Context
To optimize mobile dashboard layouts:
- Rendering 5 or 6 swipable cards in a single long horizontal slider required excessive scrolling. We wanted to split them into a stacked two-row layout, displaying the first three cards in the first swipable row, and the remaining cards in the second swipable row.

#### Decision
- **Scoreboard Dual-Row Carousel**: Split the 6 dashboard metric cards into `cardsRow1` (first 3 cards) and `cardsRow2` (remaining 3 cards). Rendered them as two separate `.kpi-swipe-container` blocks stacked vertically on mobile viewports.
- **Orders Journey Dual-Row Carousel**: Split the 5 pipeline stage cards into `stepsRow1` (first 3 stages) and `stepsRow2` (remaining 2 stages) inside `PendingCountsRow.tsx`, rendering them as two separate stacked swipable sliders with independent scroll references and indicator dots.

#### Consequences
- Mobile users can see up to two metric categories in view simultaneously on the screen.
- Significantly reduces the horizontal swipe distance, improving dashboard scannability.
- Keeps desktop layout behavior clean, rendering separate grid segments side-by-side.

---

### Decision 13: Paired Combo Columns Swipe & Completed Orders Dashboard Metric

**Date:** 2026-06-30
**Status:** Approved

#### Context
To create a clean mobile layout and display logical pairings of metric states:
1. Instead of scrolling separate rows, stacked vertical pairs of metric cards should scroll together. Swiping right-to-left should move both cards in a column simultaneously.
2. The "Orders Journey" pipeline lacked a completion status indicator. Adding a "Completed Orders" step would yield exactly 6 steps, allowing for three vertical paired combos matching the Scoreboard layout.

#### Decision
1. **Completed Orders Metric**: Added `'Completed Orders'` to the database status list queried in `getPendingCounts()` inside `dashboard.repository.ts`, returning aggregate markup and volume.
2. **Paired Combo Columns (`.kpi-combo-column`)**: Grouped the Scoreboard and Orders Journey cards into three vertical pairs:
   - **Dashboard**: (This Year / Sales This Month), (Today's / Net Sales), (Refunds / Chargebacks).
   - **Order Status**: (Pending Booking / Pending Shipment), (Pending Delivery / Pending Feedback), (Pending Resolutions / Completed Orders).
3. **Carousel Snapping**: Wrapped each pair inside a `.kpi-combo-column` flex container. Configured `.kpi-combo-column` to act as the scroll-snap child on mobile screens, making a single swipe slide both cards out together.

#### Consequences
- Visual structure is consistent across viewports: 3 columns of 2 stacked cards on desktop, and a single horizontal carousel of 3 column slides on mobile.
- Completed orders are tracked dynamically on the Executive Dashboard.
- Keeps pagination dots synced to the 3-column flow.

---

### Decision 14: Completed Orders Property Type Declaration in PendingCounts Interface

**Date:** 2026-06-30
**Status:** Approved

#### Context
- After incorporating `'Completed Orders'` database queries into the pipeline counts row metrics, the Next.js production build broke with a compilation type checking failure:
  `Type error: Element implicitly has an 'any' type because expression of type '"Completed Orders"' can't be used to index type 'PendingCounts'.`
  This prevented the local development dev server from loading or rendering pages (causing blank screens).

#### Decision
- **TypeScript Interface Update**: Modified `PendingCounts` in [dashboard.ts](file:///c:/Users/Administrator/Desktop/JD%20CRM/src/types/dashboard.ts) to define the property `'Completed Orders'?: MetricValue;` as an optional type property, matching the other pending status structures.

#### Consequences
- Resolves all Next.js dev and production build compilation crashes.
- Guarantees typesafe property indexing on `pendingCounts['Completed Orders']` across client components.
- Dev server successfully renders pages on all paths.

---

### Decision 15: Restriction to Strict 3-Status saleStatus Schema (Sold=1, Refunded=2, Chargebacked=3)

**Date:** 2026-06-30
**Status:** Approved

#### Context
- The client requested that the application only support three active `saleStatus` types: Sold, Refunded, and Chargebacked.
- Previously, the system used codes `1` (Sold), `7` (Refunded), and `8` (Chargebacked), alongside deprecated legacy values `2` (Prospect), `3` (Call Back), `4` (Not Interested), `5` (Out Of Scope), and `6` (Enquiry).
- To prevent fragmentation and establish a clean, standard schema, the client requested that Refunded and Chargebacked be mapped to codes `2` and `3` respectively.

#### Decision
- **Active Codes**: Reassigned the codes as: Sold = `1`, Refunded = `2`, and Chargebacked = `3`.
- **Deprecated Documentation**: Retained the documentation of the old deprecated codes in the documentation records (marked as crossed-out) to preserve history, but strictly removed them from active database tables and UI dropdown controls.
- **Data Migration**: Added a migration step to:
  1. Map legacy deprecated codes (`2`-`6`) to `1` (Sold).
  2. Map legacy Refunded (`7`) to `2`.
  3. Map legacy Chargebacked (`8`) to `3`.
  This prevents any conflicting mapping or orphaned data during schema transition.
- **UI Controls**: Configured form select elements to only render three options: Sold (`1`), Refunded (`2`), and Chargebacked (`3`).

#### Consequences
- Clean database schema with clear status mappings.
- Dropdowns contain only the active operational options for agents.
- Existing databases can safely migrate without data conflicts.

---

### Decision 16: Consolidation of Vehicle Year and Make/Model into a Single Column

**Date:** 2026-06-30  
**Status:** Approved

#### Context
The legacy database schema stored the vehicle year in `order_year` and the make/model in `order_make_model`. Having two separate fields for basic vehicle descriptions introduced unnecessary redundancy in schema structure, required duplicate input fields on the intake and edit forms, and complicated search queries since the frontend had to search, map, and display two separate values.

#### Decision
We consolidated both fields into the single, existing `order_make_model` column:
1. **Migration & Data Preservation:** Wrote and applied a database migration `20260630153900_merge_order_year_into_make_model` to prepend the non-empty values of `order_year` onto `order_make_model` (separated by a space) for all existing orders, and then dropped the `order_year` column.
2. **Schema & Code Cleanups:** Removed the `orderYear` property from the Prisma schema (`schema.prisma`), database repository (`order.repository.ts`), type definitions (`src/types/order.ts`), and CSV/dummy seeding scripts (`import-csv-data.ts`, `seed-dummy-orders.ts`).
3. **UI Consolidation:** Replaced the split "Year" and "Make & Model" input elements on both `AddOrderForm.tsx` and `EditOrderForm.tsx` with a single unified "Year, Make & Model" field mapping directly to `orderMakeModel`. Updated the detail view to remove the standalone "Year" label and display the full merged value across 3 columns.

#### Consequences
- Simplifies type definitions and database queries across the monolith codebase.
- Reduces UI density by removing a redundant text field, improving form completion flow.
- Seamlessly back-fills all legacy records by prepending the year data into the model description, preserving historical accuracy.

---

### Decision 17: Consolidation of Customer First and Last Name into Customer Name

**Date:** 2026-06-30  
**Status:** Approved

#### Context
The legacy database schema stored customer names across two columns: `first_name` and `last_name`. Splitting the name introduced redundant coding patterns, required duplicate input fields on the intake and edit forms, and complicated search queries since the frontend had to search, map, and display two separate values. A single unified naming field was required to simplify data structures and improve developer ergonomics.

#### Decision
We consolidated both fields into a single, unified `customer_name` column on the `crm_customers` table:
1. **Migration & Data Preservation:** Wrote and applied a database migration `20260630161909_merge_customer_first_last_name` that created a new `customer_name` column, back-filled it by concatenating non-empty values of `first_name` and `last_name` (separated by a space), altered the column constraint to `NOT NULL`, and then permanently dropped the redundant `first_name` and `last_name` columns.
2. **Schema & Code Cleanups:** Updated the Prisma schema (`schema.prisma`) to replace `firstName`/`lastName` fields with `customerName`. Refactored repositories (`order.repository.ts`, `search.repository.ts`, `dashboard.repository.ts`), services (`order.service.ts`, `dashboard.service.ts`), type definitions (`src/types/order.ts`, `src/types/customer.ts`), and dummy seeding/CSV import scripts.
3. **UI Consolidation:** Replaced the separate first and last name input elements on both `AddOrderForm.tsx` and `EditOrderForm.tsx` with a single unified "Customer Name" field mapping directly to `customerName`. Updated customer list directory, order list cards, search recommendations, and search results view components to display `customerName` directly.

#### Consequences
- Simplifies type definitions and database queries across the monolith codebase.
- Reduces UI density by removing redundant text fields, improving form completion flow.
- Seamlessly back-fills all legacy records by concatenating first name and last name, preserving historical accuracy.

---

### Decision 18: Add Sales Verifier and Backend Executive Roles to Orders

**Date:** 2026-06-30
**Status:** Approved

#### Context
Operational processing requirements demanded that orders track two additional workflow participants:
1. **Sales Verifier:** The team member responsible for validating the sales rep's intake data.
2. **Backend Executive:** The team member handling supplier assignment and logistical verification (previously referred to as "Backend Team Member").

To maintain parity with other agent assignments (Sales Agent and QA Verifier) and support audits, these roles needed:
- Dedicated foreign key relations to the `users` table (`orderSalesVerifierId` / `orderBackendExecutiveId`).
- Denormalized name snapshots stored directly on the order record (`orderSalesVerifierName` / `orderBackendExecutiveName`) to preserve historical name references even if a user's record is deleted or updated.
- Explicit display sequence in both UI forms (Add/Edit) and lists: Sales Agent → Sales Verifier → Backend Executive → QA Verifier.

#### Decision
1. **Database Schema:** Added columns `order_sales_verifier_id`, `order_sales_verifier_name`, `order_backend_executive_id`, and `order_backend_executive_name` to the `crm_orders` table. Configured foreign keys and indices in `schema.prisma`.
2. **Name Resolution:** Updated the repository (`order.repository.ts`) and service (`order.service.ts`) layers to automatically lookup and snapshot the verifier/executive's display name (`nickname || name`) when an order is created or when its assigned IDs are updated.
3. **UI Integration:** Integrated new select dropdowns in both `AddOrderForm.tsx` and `EditOrderForm.tsx` aligned sequentially: Sales Agent → Sales Verifier → Backend Executive → QA Verifier. Added four dedicated columns to `OrderList.tsx` showing the assigned names in order.
4. **Renaming:** Standardized on "Backend Executive" across all documentation, plans, code files, and schema columns, completely deprecating "Backend Team Member".

#### Consequences
- Comprehensive audit trails for order handling.
- Clear structural layout displaying processing responsibility sequence.
- Full type safety and test coverage across repository, routes, and UI components.

---

### Decision 19: Sale Status Overhaul — Partial Refund, finalMargin Metric & Returned Orders Queue

**Date:** 2026-07-02
**Status:** Approved

#### Context
Three related problems were identified with the pre-Phase-17 system:

1. **Missing sale outcome:** The system only had three `saleStatus` values (Sold / Refunded / Chargebacked). Partial refunds — where a customer gets some money back but we still earned a reduced margin — had no representation, forcing agents to choose between misrepresenting the sale as Sold or fully writing it off as Refunded.

2. **Wrong financial metric on dashboards:** All dashboard aggregations used raw `orderMarkup` (the gross margin before any refunds). This inflated reported margins for partially-refunded orders and caused the Net Sales formula to double-penalize Refunded/Chargebacked orders (they were already excluded from "Sold" totals, then their markup was subtracted a second time). The Refund and Chargeback metric widgets showed the *margin lost*, not the *amount returned to the customer* — a conceptually wrong figure.

3. **No dedicated Returned Orders queue:** Refunded and Chargebacked orders had no distinct workflow queue — they stayed wherever they were in the pipeline. Managers could not quickly see or report on reversed orders.

#### Decisions

**D19.1 — New `saleStatus = '4'` (Partial Refund)**
Added as the fourth active sale status code. Partial Refund orders have money received (positive `finalMargin`) and belong in the `Completed Orders` workflow queue alongside Sold orders.

**D19.2 — `orderRefundAmount` column (not a computed `finalMargin` column)**
Chose to store only the raw refund amount, **not** a pre-computed `finalMargin`, to avoid derived-value staleness. `finalMargin` is always computed inline at query time as `orderMarkup − orderRefundAmount`. This is the single source of truth for profitability everywhere in the system.

Auto-population rules enforced by `order.service.ts`:
- `saleStatus → '1'` (Sold): `orderRefundAmount = '0'`
- `saleStatus → '2'` (Refunded) or `'3'` (Chargebacked): `orderRefundAmount = orderMarkup` (full margin forfeited, auto-set by service)
- `saleStatus → '4'` (Partial Refund): `orderRefundAmount` = user-provided amount (required; service throws `400` if absent)

**D19.3 — New `orderCurrentStatus = 'Returned Orders'` workflow queue**
A new terminal queue for reversed orders. The service layer auto-transitions any order to `Returned Orders` when `saleStatus` is changed to `'2'` or `'3'`. This makes reversed orders instantly visible in their own pipeline page (`/pending/returned`) and tab.

**D19.4 — `Completed Orders` expands to include Partial Refund**
`findAll()` filter for `Completed Orders` status now applies `saleStatus IN ('1', '4')` — both Sold and Partial Refund orders "completed" with money received.

**D19.5 — Net Sales formula correction**
Old formula: `Σ(Sold markups) − Σ(Refunded markups) − Σ(Chargebacked markups)`
New formula: `Σ(finalMargin) WHERE saleStatus IN ('1', '4')`
Refunded and Chargebacked orders contribute **zero**, not a subtraction. They are already excluded from the "money received" pool; subtracting them again was double-counting the loss.

**D19.6 — Refund/Chargeback metric widgets show `orderRefundAmount`, not `orderMarkup`**
The dashboard Refund and Chargeback cards now display the sum of `orderRefundAmount` — the actual cash returned to customers. This is the semantically correct figure for "how much did we pay back this month." These cards now link to `/pending/returned` (current month date filter) rather than a raw `saleStatus` filter.

#### Consequences
- **One new DB column** (`order_refund_amount VARCHAR(25) NULL DEFAULT NULL`) via migration `add_refund_amount_to_orders`.
- All dashboard, performer, and team report queries updated to use `finalMargin`.
- `OrderList`, `RecentOrdersTable`, and order detail page updated to show `finalMargin`.
- `EditOrderForm` gains a "Partial Refund" option with a refund amount modal.
- New page at `/pending/returned`, new tab in `OrderListContainer`, new card in `PendingCountsRow`.
- Info banners on Completed and Returned Orders queue pages explain which sale statuses each contains.
- Audit log captures `orderRefundAmount` changes as a field-level diff entry.

---

### Decision 20: Role-Based Agent List Visibility / Role Filter Permission (`agents:view-roles`)

**Date:** 2026-07-02
**Status:** Approved

#### Context
In a multi-tier organization, not all logged-in staff should be able to view or filter agents by their administrative roles (such as Super Admin, Admin, Manager, HR) in the active agents listing. Leaving role column details unrestricted poses security and hierarchy visibility concerns.

#### Decisions
**D20.1 — Fine-grained permission `agents:view-roles`**
Introduced a dedicated permission key `agents:view-roles` in the RBAC permissions table (`crm_permissions` at id 52).
This permission:
- Controls whether the "Role" column header and cells are rendered in `AgentList.tsx`.
- Controls whether the "Role" filtering option is displayed and selectable.

#### Consequences
- A new row is added in `crm_permissions` via default DB seeding.
- NextAuth sessions include `agents:view-roles` for Super Admin and Admin roles.
- `AgentList.tsx` uses the `hasPermission(permissions, 'agents:view-roles')` utility to selectively show/hide the roles table column and filters.
- Integration tests in `AgentList.test.tsx` assert view logic hides/shows elements based on possession of this permission key.

---

### Decision 21: Renaming Mileage Fields & Adding Order-Level Checklist Field

**Date:** 2026-07-02
**Status:** Approved

#### Context
1. The business requested renaming the existing "quoted miles" and "Vendor Miles" fields in the database and UI components to "Quoted Miles and Warranty" and "Vendor Miles and Warranty" respectively, representing both distance and warranty agreements.
2. The business requested a new checkbox field called "Checklist" to represent verification completion on the Order itself (not on the customer cards), which must be editable during order creation/edit and viewable on the Order Details page alongside the other checklist status elements ("Card Copy Verified" and "Photo ID Checked").

#### Decisions
**D21.1 — Column rename in `crm_orders`**
Rename `order_quoted_miles` to `order_quoted_miles_and_warranty` and `order_given_miles` to `order_vendor_miles_and_warranty` to persist both miles and warranty terms.

**D21.2 — Order-level `order_checklist` column**
Add a new column `order_checklist` VARCHAR(20) DEFAULT 'No' to the `crm_orders` table to track order-level verification checks.

**D21.3 — Unified checklist indicators view**
Construct a consolidated checklist view under the Ledger Billing/Verification area on the Order Details page rendering:
- Card Copy Verified (`customer.cards[0].customerCardCopyStatus`)
- Photo ID Checked (`customer.cards[0].customerCardPhotoStatus`)
- Checklist (`orderChecklist` on the order itself)

#### Consequences
- Database migration renaming columns and adding the new `order_checklist` column.
- Updated `schema.prisma` mapping new fields and updated repository database transactions.
- Exposing inputs for Quoted Miles and Warranty, Vendor Miles and Warranty, and Checklist in `AddOrderForm.tsx` and `EditOrderForm.tsx`.
- Consolidating display badges on the Order Details page (`page.tsx`) to show all three status checkmarks.
- Auditing list `orderKeysToAudit` in `order.service.ts` updated to capture history logs for changes to these fields.


---

### Decision 22: Split agents:view into List-Only vs Sensitive Details Permissions

**Date:** 2026-07-02
**Status:** Approved

#### Context
The `agents:view` permission granted visibility to both the agent directory list and the highly sensitive personal records (bank info, emergency contacts, academic records, and work history) of all staff members. To comply with privacy standards, these must be segregated: basic directory listing should not automatically expose private records.

#### Decision
1. **Define a new permission `agents:view-details`** in the RBAC system, representing access to sensitive personal, bank, and academic/professional records.
2. **Sanitize GET `/api/agents/:id` responses**: If the session lacks `agents:view-details` but holds `agents:view`, the API returns a `200 OK` with basic agent info but overrides sensitive relation structures (`profile`, `academicRecord`, `professionalRecord`) to `null`.
3. **Lock Frontend Tabs**: In `AgentProfileView.tsx`, display lock emojis `🔒` on sensitive tabs and render an "Access Restricted" locked warning placeholder banner when `agents:view-details` is missing from the user session.
4. **Permissions Reordering**: Reorganize default permissions in `seed.sql` sequentially so all related resource permissions are grouped together (IDs 1 through 53), including `agents:view-details` under the Agents resource block.

#### Consequences
- Enhanced privacy by ensuring standard agents cannot view sensitive banking or emergency contact details of other staff members.
- Robust integration test assertions in `agents.test.ts` verifying sanitization behavior.
- Clean component unit tests in `AgentProfileView.test.tsx` verifying tab locking and warning banners.


---

### Decision 23: Database Aggregations and Response Caching for Dashboard Metrics

**Date:** 2026-07-02
**Status:** Approved

#### Context
Aggregating thousands of order records in Node.js application memory causes query latency, CPU overhead, and potential server memory limits. In addition, repeated client requests for dashboard statistics trigger redundant database roundtrips for data that updates relatively infrequently.

#### Decision
1. **Database Indexing**: Added a database index on the `orderDate` (`order_date`) column in `schema.prisma` to optimize date-filtered queries.
2. **Raw SQL Aggregation**: Refactored `getTopPerformers` and `getBottomPerformers` in `dashboard.repository.ts` to execute group-by SUM calculations directly inside the MySQL database using raw SQL queries (`$queryRaw`) and numeric casts (`CAST(COALESCE(..., '0') AS DECIMAL)`).
3. **Response Caching**: Added `Cache-Control: private, max-age=60` headers to successful responses on all four dashboard aggregate API endpoints: `/api/dashboard/metrics`, `/api/dashboard/champions-league`, `/api/dashboard/advanced-chart`, and `/api/dashboard/teams/monthly`.

#### Consequences
- Significantly reduced dashboard load times by shifting mathematical sum reductions from Node.js memory to the database engine.
- Reduced database traffic and CPU utilization via browser and client-side caching of metrics queries for up to 60 seconds.
- Ensured absolute reliability via integration tests in `src/tests/performance.test.ts` verifying index presence, performer mathematical accuracy, and Cache-Control headers.


---

### Decision 24: Sale Status Expansion — Void & Cancel Order, Team Column Removal & Sale Status Filter

**Date:** 2026-07-03
**Status:** Approved

#### Context
The business identified two cancellation scenarios that the existing four sale statuses (`Sold`, `Refunded`, `Chargebacked`, `Partial Refund`) cannot represent:
1. An order that was charged but cancelled by the customer **on the same day** — the full charge is reversed. This is financially closer to a Refund than to a cancellation, since money was temporarily captured.
2. An order where all customer details (name, card, vehicle) were collected but the customer was **never charged** and later cancelled — no financial transaction occurred at any point.

Additionally, the Orders table's **Team** column was found to be low-value in the daily workflow view, while the **Sale Status** of each order required opening an individual record to see. The existing `saleStatusFilter` state in `OrderListContainer.tsx` was fully wired to the API but had no visible UI control to trigger it.

#### Decision

**D24.1 — New sale status codes: Void (`'5'`) and Cancel Order (`'6'`)**
- **`'5'` Void**: Payment was captured but cancelled same-day. Treated identically to `Refunded` and `Chargebacked` in the backend auto-rules: `orderCurrentStatus` is automatically set to `'Returned Orders'` and `orderRefundAmount` is auto-set to `orderAmountCharged` (full reversal). The date/time capture modal opens in the UI (the void event has a precise timestamp). Void orders appear in the `Returned Orders` queue filter.
- **`'6'` Cancel Order**: No charge was ever processed. `orderRefundAmount` is set to `null`. `orderCurrentStatus` is **not** forced to any value — it remains on its current workflow state (typically `Pending Booking`). The date/time capture modal does **not** open because there is no financial event to timestamp. Cancel Order orders do **not** appear in the `Returned Orders` queue.

**D24.2 — No database schema migration required**
The `sale_status` column in `crm_orders` is already a free-form `VARCHAR(10)`. Storing `'5'` and `'6'` requires no column type changes, no new columns, and no Prisma migration. The implementation is entirely in the service, repository, and frontend layers.

**D24.3 — Backend auto-rule extension in `order.service.ts`**
The sale status auto-rule `if` condition is extended from `'2' || '3'` to `'2' || '3' || '5'` for the `Returned Orders` + full-refund-amount branch. The `'1'`-branch null-refund clear is extended to `'1' || '6'`. A `mapSaleStatus` helper update ensures the audit log writes `'Void'` and `'Cancel Order'` as human-readable strings in change history records.

**D24.4 — Repository `Returned Orders` filter includes Void**
The `findAll` OR-filter condition for `Returned Orders` is extended from `saleStatus: { in: ['2', '3'] }` to `saleStatus: { in: ['2', '3', '5'] }`. This ensures Void orders appear in the `Returned Orders` pipeline queue alongside Refunded and Chargebacked orders.

**D24.5 — Team column replaced by Sale Status column in `OrderList.tsx`**
The Team column is removed from the Orders table. A new Sale Status column takes its place, rendering a color-coded badge for each row using two pure helper functions (`getSaleStatusLabel`, `getSaleStatusBadgeClass`). Team information remains accessible on the Order Details page. The badge color palette is: Sold → emerald, Refunded → amber, Chargebacked → rose, Partial Refund → blue, Void → purple, Cancel Order → slate.

**D24.6 — Sale Status filter added to `OrderListContainer.tsx` filter bar**
A visible `<select>` labeled `"Sale Status"` is added to the existing filter row. The existing `saleStatusFilter` state, API wiring, and active-filter pill were already functional — only the UI control was missing. The pill label decoder is extended to handle codes `'5'` and `'6'`.

**D24.7 — Automatic Workflow Status update in `AddOrderForm.tsx` and `EditOrderForm.tsx`**
When a user selects `Refunded` (`'2'`), `Chargebacked` (`'3'`), or `Void` (`'5'`) in either form, the `orderCurrentStatus` field must automatically update to `'Returned Orders'` in the UI (before the form is saved). For all other sale statuses, if `orderCurrentStatus` was `'Returned Orders'` due to this auto-rule, it resets to `'Pending Booking'`. `AddOrderForm.tsx` already has a `useEffect` for codes `'2'`/`'3'` — it is extended to include `'5'`. `EditOrderForm.tsx` currently has no such `useEffect` — a new one is added that watches only `saleStatus` (with an intentional `eslint-disable` for the excluded `orderCurrentStatus` dep) to fire only on explicit sale status changes by the agent.

#### Consequences
- No database migration required, making this a zero-risk schema change.
- Void and Cancel Order are fully audited in `crm_sale_status_history` like all other status changes.
- `SaleStatusTimeline.tsx` and `OrderAuditLog.tsx` must be extended to decode codes `'5'`/`'6'` to human-readable labels so historical timeline entries display correctly.
- Vendor statistics in `vendor.repository.ts` are updated to count Void and Cancel Order orders in vendor totals.
- The Orders table is one column narrower (Team removed), giving the Sale Status badge more visual prominence.

---

### Decision 25: Cancelled Orders Workflow & Renaming (Cancelled Status & Cancelled Orders Queue)

#### Context
To provide better tracking and classification of unpaid/unbilled order cancellations, we need to separate cancelled orders from the general workflow queues. Previously, selecting `"Cancel Order"` (`'6'`) kept the order in its existing workflow status. This needs to be moved to a dedicated workflow queue to avoid skewing progress metrics. Additionally, the sale status `"Cancel Order"` should be renamed to `"Cancelled"` for brevity and consistency.

#### Decisions
1. **Rename Sale Status**: Rename `'6'` from `"Cancel Order"` to `"Cancelled"` in all UI dropdowns, badges, timelines, and audit logs.
2. **Cancelled Orders Workflow Status**: Introduce `'Cancelled Orders'` as a new workflow status value.
3. **Automatic Workflow Transition**:
   - In both `AddOrderForm.tsx` and `EditOrderForm.tsx`, selecting `'6'` (Cancelled) automatically sets the workflow queue (`orderCurrentStatus`) to `'Cancelled Orders'`.
   - When transitioning from `'6'` back to a non-big-3/non-cancelled status, reset the workflow status to `'Pending Booking'` (for new orders) or its original saved state (for edit order).
4. **New RBAC Navigation Permission**: Add a new permission `orders:view-cancelled` and insert it sequentially at ID 41 in `seed.sql`. Shift subsequent permission IDs by 1 to maintain perfect sequential ordering. Grant this new permission to Super Admin and Admin roles.
5. **Dashboard Counts**: Add `'Cancelled Orders'` to `PendingCountsRow` and the dashboard metric calculators so that counts are displayed correctly in the pipeline.
6. **Pipeline Tab**: Render a new `'Cancelled Orders'` tab in `OrderListContainer.tsx` guarded by the `orders:view-cancelled` permission. Display a styled red/warning info banner on this tab view.
7. **CSV Importer**: Map `"No Sale"` and `"Cancelled"` in CSV files to `'6'`, and automatically assign `'Cancelled Orders'` as the `orderCurrentStatus` for imported cancelled records.


