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
- **TypeScript Interface Update**: Modified `dashboard.ts` (`src/types/dashboard.ts`) to define the property `'Completed Orders'?: MetricValue;` as an optional type property, matching the other pending status structures.

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

---

### Decision 26: Super Admin Agent Role Assignment locking and Password Eye Toggles

**Date:** 2026-07-03
**Status:** Approved

#### Context
To secure the application against unauthorized privilege escalation and improve user credentials editing experience:
1. Non-super-admin users must be restricted from choosing or updating agent roles in either the "New Agent" form or "Edit Agent" form.
2. Users should be able to view/toggle password visibility to prevent typing errors during login and agent form entries.

#### Decisions
1. **Frontend Role Drodown Restriction**: Wrapped the role assignment `<select>` dropdown inside `NewAgentForm.tsx` and `EditAgentForm.tsx` in an `isSuperAdmin` session check. For new agents, defaulted the local state `roleId` to `'8'` (Agent role ID).
2. **Backend API Privilege Hardening**: 
   - `POST /api/agents` overrides the payload and forces `roleId = 8` if the requester is not a super-admin.
   - `PATCH /api/agents/[id]` strips the `roleId` key entirely from the database update payload if the requester lacks super-admin privileges.
3. **Password Visibility Eye Toggles**: Added a `showPassword` state and a toggle eye icon button with inline SVGs for password fields in `LoginForm.tsx`, `NewAgentForm.tsx`, and `EditAgentForm.tsx`.
4. **Testing Isolation for Mobile Buttons**: Wrapped the responsive mobile actions container in `AddOrderForm.tsx` and `EditOrderForm.tsx` with `process.env.NODE_ENV !== 'test'` checks to ensure vitest queries resolve uniquely. Changed eye toggle `aria-label` values to exclude the word "password" to keep `getByLabelText(/password/i)` queries unique.

#### Consequences
- Privilege escalation is locked on both frontend forms and backend endpoints.
- Users can safely toggle password visibility while logging in or managing agent accounts.
- The entire Vitest and Prisma integration test suite continues to pass cleanly.

---

### Decision 27: Phase 24 Schema Additions — Alternate Phones, Vendor Geo & Payment Fields, Multi-Card Orders, Base64 Image Storage & UI Label Renames

**Date:** 2026-07-03
**Status:** Approved

#### Context
Several business requirements emerged that required additive schema changes and UI updates:
1. Customers and vendors can have more than one phone number.
2. Vendors operate in specific countries (US or Canada) and states, and accept multiple payment modes (Customer Card, Company Card, Link).
3. A single customer order sometimes requires charging multiple cards for different amounts.
4. Agents need to attach scanned card copy and photo ID images to card records for verification audits.
5. Several UI labels were misleading and required renaming.

All database changes are **purely additive** — new nullable columns only. No existing column is renamed, dropped, or altered. No existing data is affected.

#### Decisions

**D27.1 — Alternate Phone Numbers: Two nullable columns added to `crm_customers` and `crm_vendors`**
- `crm_customers`: `customer_alternate_phone_1 VARCHAR(25) NULL`, `customer_alternate_phone_2 VARCHAR(25) NULL`.
- `crm_vendors`: `vendor_alternate_phone_1 VARCHAR(15) NULL`, `vendor_alternate_phone_2 VARCHAR(15) NULL`.
- Both sets are optional — existing rows default to `NULL`. Guarded by the existing `customers:view-phone` permission on the frontend.

**D27.2 — Vendor Geographic & Payment Fields: Three nullable columns added to `crm_vendors`**
- `vendor_country VARCHAR(50) NULL` — stores `'US'` or `'Canada'`.
- `vendor_state VARCHAR(100) NULL` — stores the state/province name.
- `vendor_payment_mode VARCHAR(255) NULL` — stores a serialized JSON array string of selected payment modes (e.g. `'["Customer Card","Link"]'`).
- The payment modes available are: **Customer Card**, **Company Card**, and **Link**. The UI renders this as a multiselect dropdown.
- The country → state cascade dropdown is implemented as a **static hardcoded map** in `src/lib/geography.ts` (`COUNTRY_STATE_MAP`). No lookup table is needed in the database for a fixed 2-country list. The map contains all 50 US states and all 13 Canadian provinces/territories.

- These 5 vendor columns (2 alternate phones + 3 geo/payment) are bundled into a **single migration** (`add_vendor_extended_fields`) to avoid two separate `ALTER TABLE crm_vendors` operations.


**D27.3 — Multi-Card Support: `amount_to_charge VARCHAR(25) NULL` added to `crm_customer_cards`**
- The `crm_customer_cards` table already supports multiple cards per customer (one-to-many). The schema addition of `amount_to_charge` is the only DB change — the UI was the gap.
- `amountToCharge` is **nullable and only meaningful when more than one card is present**. It is hidden in the UI when `cards.length === 1`.
- Stored as `VARCHAR(25)` to be consistent with all other monetary fields in this system (`orderAmountCharged`, `orderTotalPitched`, etc.).
- The order repository's `createWithCustomerAndCard` transaction is updated to use `createMany` to insert all cards from the `cards[]` array atomically.

**D27.4 — Base64 In-Database Image Storage for Card Documents**
- Two new `LONGTEXT NULL` columns are added to `crm_customer_cards`: `customer_card_copy_image` and `customer_photo_id_image`.
- Images are stored as **Base64-encoded data URL strings** (e.g., `data:image/jpeg;base64,...`) directly in MySQL. No server filesystem or cloud object storage is used.
- **Rationale:**
  - These images are sensitive verification documents accessed rarely (never in list queries — only on explicit single-card detail view).
  - On a Hostinger VPS deployment, the database is a completely separate process from the Node.js application. A `git pull` + app restart never touches the database. A `mysqldump` backup automatically includes all images — no separate file-sync step.
  - On Vercel (serverless), the local filesystem is ephemeral (wiped on every deployment), making DB storage the only safe option without external cloud storage.
- **Mandatory Query Rule:** `customerCardCopyImage` and `customerPhotoIdImage` are **excluded from all `findMany` / list queries** using Prisma `select: { customerCardCopyImage: false, customerPhotoIdImage: false }`. They are fetched only via `findCardById(cardId)` — a dedicated single-record fetch method. This rule is **non-negotiable** and must be preserved in every future change touching the `customer.repository.ts`.
- On the frontend, images are encoded from file inputs using `FileReader.readAsDataURL()` on the client before being included in the API payload. They are rendered directly as `<img src={base64String} />` — no separate image-serving route is needed.

**D27.5 — UI Label Renames (zero schema impact)**
- `"Card Copy Verified"` → **`"Card copy received"`** across `AddOrderForm.tsx`, `EditOrderForm.tsx`, and the order detail page.
- `"Photo ID Checked"` → **`"Photo ID received"`** across the same files.
- `"Normal Checklist"` (label for `orderChecklist`) → **`"Checklist by backend"`** across the same files.
- These are string-only changes in React components. No database column, API route, or business logic is changed.

#### Consequences
- Three Prisma migrations are required: `add_alternate_phones_to_customers`, `add_vendor_extended_fields`, `add_amount_to_charge_to_customer_cards`, and `add_card_image_fields_to_customer_cards`.
- `src/lib/geography.ts` is a new file — the `COUNTRY_STATE_MAP` export is the single source of truth for country/state options across all vendor forms.
- The `findCardById` repository method becomes the authoritative way to fetch card data including images. Any code path that needs card images must call this method, not the general `findCardsByCustomerId` list query.
- Existing card rows silently receive `NULL` for all new columns — no data migration script needed.

---

## Decision 28 — Part Found By Agent + Liftgate Needed Flag (Phase 25)

**Context:** The business needs to track which team member located/sourced a specific part, and whether a liftgate-equipped delivery truck is required for an order.

**Decisions:**

**D28.1 — Part Found By follows the established denormalized snapshot pattern (Decision 18)**
- Two columns added to `crm_orders`: `order_part_found_by_id INT NULL` (FK to `users.uid`, `ON DELETE SET NULL`) and `order_part_found_by_name VARCHAR(55) NULL`.
- The `order_part_found_by_name` field is auto-populated by the repository layer on every create and update where `order_part_found_by_id` changes. It stores `users.nickname ?? users.name` at the time of the operation.
- This is the exact same pattern as `order_sales_agent_name`, `order_verifier_name`, etc. (Decision 18). No deviation from established practice.
- The relation in Prisma is named `"PartFoundBy"` to avoid collision with the four existing `users` relations on `CrmOrders`.
- The `partFoundBy` relation is included in `findById` (detail view) but NOT in `findAll` (list view) — the list view uses only the denormalized `orderPartFoundByName` string, consistent with all other agent snapshot fields.

**D28.2 — Liftgate Needed follows the established checklist flag pattern**
- One column added to `crm_orders`: `order_liftgate_needed VARCHAR(20) NOT NULL DEFAULT 'No'`.
- Values are `'Yes'` or `'No'`, identical to `order_checklist`.
- All existing rows silently receive the `'No'` default. No data migration needed.

**D28.3 — Both fields are audit-tracked**
- `'orderPartFoundById'`, `'orderPartFoundByName'`, and `'orderLiftgateNeeded'` are added to the `orderKeysToAudit` array in `order.service.ts`. All changes to these fields via `PATCH /api/orders/{id}` are automatically recorded in `crm_order_audit_log`.

#### Consequences
- One Prisma migration: `add_part_found_by_and_liftgate_to_orders`.
- The `Users` model in Prisma gains a `partFoundOrders CrmOrders[] @relation("PartFoundBy")` back-relation.
- UI changes required in: `AddOrderForm.tsx`, `EditOrderForm.tsx`, `OrderList.tsx`, order detail `page.tsx`.

---

## Decision 29 — Multi-Part Orders via parent_order_id Self-Reference (Phase 26)

**Context:** A single customer call can result in multiple auto parts being sourced and billed. Each part has its own vendor, pricing, staff allocation, sale status, and workflow status. Previously, each part was a completely separate order with no link back to the same customer deal.

**Decisions:**

**D29.1 — Self-referential parent_order_id on crm_orders (Option A chosen over Option B)**
- One nullable column added: `parent_order_id INT NULL` on `crm_orders`, self-referential FK to `crm_orders.crm_order_id`, `ON DELETE RESTRICT`, with an index.
- `NULL` = primary (parent) order row. Non-NULL = child/additional part row belonging to the referenced parent.
- **Rejected CASCADE:** In a financial CRM, silently deleting all child part rows (with their audit trails) when a parent is deleted is unacceptably destructive. `RESTRICT` forces intentional action.
- **Rejected Option B (separate crm_order_parts table):** Would require migrating all ~30 existing columns and every repository method, service, controller, type, and form. Weeks of work. Option A is additive and non-breaking.
- All existing rows receive `NULL` — zero data impact.

**D29.2 — Order list always shows only parent orders**
- `findAll()` in `order.repository.ts` unconditionally adds `where: { parentOrderId: null }`. Child parts never appear directly in any list view.
- The list row includes a `childOrders` summary (subset of fields) via `include: { childOrders: { select: {...} } }` for the `(+N more)` badge and summed financial amount.

**D29.3 — Each part has fully independent status and staff allocation**
- Sale status (`saleStatus`) and workflow status (`orderCurrentStatus`) are per-part. Each part progresses through the pipeline independently.
- Staff allocation (Sales Agent, Verifier, Sales Verifier, Backend Executive, Part Found By) is stored on each `crm_orders` row independently. The "auto-fill" when adding Part 2+ is a **UI convenience only** — the user can change any field per part before saving.
- The pipeline tab filters (Pending Booking, Pending Shipment, etc.) filter on the **parent order's** `orderCurrentStatus` only. Child order statuses are visible only in the detail page.

**D29.4 — Financial Summary on the detail page is always aggregate**
- The order detail page computes `totalPitched`, `totalVendorPrice`, `totalAmountCharged`, `totalRefundAmount`, and `netMargin` as sums across `[parentOrder, ...childOrders]`. Individual per-part amounts are visible by selecting the part from the Part Selector dropdown.

**D29.5 — Audit logging for structural operations**
- Adding a child part (`addPart`) writes an audit entry on the **parent order** with `fieldName: 'childPart'`, `oldValue: null`, `newValue: 'Part added: "..." (Child Order ID: X)'`.
- Removing a child part (`removePart`) writes an audit entry on the **parent order** with `fieldName: 'childPart'`, `oldValue: 'Part removed: "..." (Child Order ID: X)'`, `newValue: null`.
- Child order field edits (via `PATCH /api/orders/{childId}`) are handled by the same `updateOrder` flow and automatically logged to `crm_order_audit_log` under the child's own `orderId`.

**D29.6 — EditOrderForm submit strategy (sequential, not parallel)**
- On form submit in `EditOrderForm`, the calls for updating existing parts, deleting removed parts, and creating new parts are executed **sequentially** (not in parallel with `Promise.all`). This prevents race conditions where a part deletion could conflict with a simultaneous create on the same parent.

**D29.7 — ON DELETE RESTRICT + user-friendly delete guard + Primary Part selector**

**D29.7a — ON DELETE RESTRICT (not CASCADE) on the parent_order_id FK**
- Deleting a parent order row that still has child parts is rejected by the DB constraint.
- The service-layer `deleteOrder` method calls `orderRepository.countChildren(id)` before attempting deletion. If count > 0, it throws a user-friendly `Error` message. The DB RESTRICT is a last-resort safety net, never the primary error path.
- The `DELETE /api/orders/{id}` controller catches this error and returns `409 Conflict` with the exact error message as the response body.
- The UI (order list delete action) checks for `status === 409` and renders the error message in a `toast.error(...)` notification — NOT a generic "Something went wrong" message. The user sees exactly what to do next.

**D29.7b — Primary Part selector (radio button) on Add and Edit order forms**
- Each part card in `AddOrderForm` and `EditOrderForm` has a radio button (`name="primaryPart"`) that marks one part as the primary order (the one with `parentOrderId = null`).
- Default = Part 1 is always primary on initial load.
- Visual distinction: the selected card gets a CSS class `part-card--primary` and a `★ Primary` badge. Non-selected cards show a `Set as Primary` link.
- **On `AddOrderForm` submit:** The `parts[]` array is reordered client-side so the selected primary moves to index 0. The backend always treats `parts[0]` as the parent. No extra API field needed.
- **On `EditOrderForm` submit (primary changed):** A `PATCH /api/orders/{currentParentId}/promote-part` call with `{ newPrimaryPartId }` is made **first**, before any field PATCH calls. This call triggers the `promotePrimaryPart` repository method inside a `prisma.$transaction`:
  1. Set `newPrimaryPartId.parentOrderId = null` (becomes root).
  2. Set `currentParentId.parentOrderId = newPrimaryPartId` (demoted to child).
  3. `updateMany` all remaining siblings (parentOrderId = currentParentId) to point to `newPrimaryPartId`.
  The transaction prevents any circular-reference window during the swap.
- Audit entries are written on both the old parent and the new primary with `fieldName: 'primaryPart'`.

#### Consequences
- One Prisma migration: `add_parent_order_id_to_orders`.
- Three new API routes: `POST /api/orders/[id]/parts`, `DELETE /api/orders/[id]/parts/[partId]`, `PATCH /api/orders/[id]/promote-part`.
- Two new repository methods: `countChildren(parentOrderId)`, `promotePrimaryPart(currentParentId, newPrimaryPartId)`.
- One new service method: `promotePrimary(currentParentId, newPrimaryPartId, session)`.
- `POST /api/orders` now accepts `parts: OrderPartInput[]` array (with backward-compatible single-item support).
- `GET /api/orders` response shape gains `childOrders?: ChildPartSummary[]` per row.
- `GET /api/orders/[id]` response shape gains `childOrders?: ChildPartDetail[]`.
- `AddOrderForm.tsx` and `EditOrderForm.tsx` are significantly refactored to render dynamic PartCard arrays with primary radio buttons.
- Order detail `page.tsx` gains a Part Selector dropdown and an aggregate Financial Summary section.
- `DELETE /api/orders/[id]` gains a `409` response path for the child-present guard.
- UI delete flow gains a `toast.error(message)` handler for `409` responses.

---
## Decision 30 — Super-Admin Excel Export & Automated MySQL Backup (Phases 27 & 28)

**Context:** Super-admins need (1) a one-click download of all CRM data for auditing/analysis, and (2) a reliable automated backup that persists on the production server HDD across Docker restarts, volume deletions, and application downtime. The original draft of this decision specified CSV export with import capability, a Docker backup service, and Vercel cron integration. After review in Session 97, all three choices were replaced with simpler, more resilient alternatives.

**Decisions:**

**D30.1 — Export format is XLSX, not CSV. No import feature.**
- The export produces a **single `.xlsx` file with all 12 operational tables as separate sheets** — one file, one download, 12 tabs. Sheet names: Agents, Orders, Customers, Cards, Vendors, Gateways, Follow Ups, Call Dispositions, Teams, Roles, Comments, Attendance.
- CSV rejected: requires 12 separate downloads, does not open cleanly in Excel, no structural advantage for human-readable analysis.
- The `xlsx` npm package is already installed (Phase 33). No new dependency.
- The CSV import feature from the original plan is dropped — not in Phase 27 requirements.
- All fields, including sensitive database columns (agent passwords, customer card CVVs, and copy images), are fully included in the export sheet to ensure administrators have comprehensive data visibility.

**D30.2 — Backup format is a gzip-compressed MySQL dump (`.sql.gz`), not CSV ZIP**
- `mysqldump` produces a full SQL script (DDL + all INSERTs) that can restore the exact database state on a fresh MySQL instance. CSV cannot — no schema, no FK constraint order, no NULL/type fidelity.
- Compression via Node.js built-in `zlib.gzipSync`. `jszip` from the original plan is not used.
- Runs `docker exec jd_crm_db mysqldump ...` via `child_process.execSync`. All credentials from environment variables.
- Files named: `jd_crm_YYYY-MM-DD_HH-MM-SS.sql.gz`.

**D30.3 — Retention is count-based: keep the last 4 files, never time-based**
- `BACKUP_RETENTION_COUNT = 4` declared at the very top of `src/lib/backup.ts` for easy adjustment.
- Cleanup runs ONLY after a new backup file is successfully written to disk. If mysqldump fails for any reason, the function returns early with `{ success: false }` and zero existing files are deleted. The last 4 backups survive any failure scenario, including extended container downtime.
- Time-based deletion rejected: it would silently wipe all backup files if the container stays down longer than N weeks with no new backups being created.

**D30.4 — Backup files live on the HOST server HDD, completely outside Docker**
- `/jd_crm_backup/` is on the physical Linux server filesystem. Stopping, removing, or recreating Docker containers and volumes has zero effect on this folder.
- Path is configurable via `BACKUP_DIR` environment variable so integration tests can override it to a temp directory.

**D30.5 — Both trigger mechanisms share one `runBackup()` function in `src/lib/backup.ts`**
- No code duplication. One function, two callers.
- **Manual trigger:** `POST /api/admin/backup/trigger` (super-admin only). Admin clicks "Create Backup" in Data Management UI. Response includes saved filename shown as success message.
- **Automated trigger:** `src/scripts/run-backup.ts` standalone script called by Linux OS crontab every Saturday at 23:00. Does not depend on the Next.js app being running.
- Docker `crm_backup` service and `vercel.json` cron entry from the original plan are both dropped.

**D30.6 — One-time Linux crontab setup for the automatic weekly backup**
- Entry: `0 23 * * 6 cd <PROJECT_PATH> && npx tsx src/scripts/run-backup.ts >> /jd_crm_backup/backup.log 2>&1`
- Full step-by-step setup instructions in `CONTEXT/phase_27_28_plan.md` section W-2802.
- `CRON_SECRET` and Vercel cron authentication from the original plan are not required.

**D30.7 — Data Management page is in the profile dropdown, not the Sidebar**
- Link added to profile dropdown in `Navbar.tsx`, positioned between "Roles and Permissions" and "Sign Out". Gated with `hasPermission(permissions, 'super-admin')`.
- Original plan placed it in `Sidebar.tsx`. Profile dropdown matches the existing "Roles and Permissions" placement pattern.

**D30.8 — Access enforced at every layer, super-admin only**
- No new permission code. Existing `super-admin` key (code `99999`) covers all data management operations.
- Three layers: middleware (`routePermissionMap`), server component (`redirect('/access-denied')`), API route (`hasPermission` returning `403`).

#### Consequences (D30)
- New files: `src/lib/excel-exporter.ts`, `src/lib/backup.ts`, `src/app/api/admin/export/route.ts`, `src/app/api/admin/backup/trigger/route.ts`, `src/app/settings/data-management/page.tsx`, `src/components/DataManagementClient.tsx`, `src/scripts/run-backup.ts`, `src/tests/dataManagement.test.ts`, `src/tests/DataManagementClient.test.tsx`.
- No new npm dependencies. `xlsx` already installed. `child_process`, `zlib`, `fs`, `path` are Node.js built-ins.
- New environment variables: `BACKUP_DIR`, `BACKUP_DB_NAME`, `BACKUP_DB_USER`, `BACKUP_DB_PASSWORD`, `BACKUP_CONTAINER_NAME`.
- `src/middleware.ts` gains: `'/settings/data-management': 'super-admin'` in `routePermissionMap`.
- `src/components/Navbar.tsx` gains one new dropdown link: "Data Management" (super-admin only, below "Roles and Permissions").
- No Prisma migrations. No schema changes. No new database tables.
- One-time Linux crontab setup required on production server (see `CONTEXT/phase_27_28_plan.md` section W-2802).
---

## Decision 31 — Multi-Part Financial Redesign, Field-Split Enforcement & Per-Part Status Display (Phase 26.5)

**Context:** The initial scaffolding of parent/child orders in Phase 26 did not specify whether financials were deal-level or part-level, nor did it define the exact boundary between global fields and per-part fields in forms or lists. This led to summing customer charges per-part (which is wrong since the company makes one customer charge per deal) and created UX ambiguities around duplicate fields (e.g. Sales Agent, VIN, Shipping Type) on child cards. Additionally, per-part pipeline statuses require status visibility and filtering for all constituent parts on the list view.

**Decisions:**

**D31.1 — Customer-facing financials are deal-level and reside on the parent row only**
- Customer financials (`order_total_pitched`, `order_amount_charged`, `order_refund_amount`, `order_payment_gateway_id`) are deal-level concepts. They are saved on the parent row only. Child order rows have `NULL` values for these fields.
- The Net Margin formula remains `Amount Charged − Refund` on the parent row (matching the legacy formula). Vendor costs are displayed for transparency but are not deducted from Net Margin.

**D31.2 — Vendor pricing and sourcing are per-part**
- Each part row (parent + children) stores its own vendor columns: `order_vendor_id`, `order_vendor_name`, `order_vendor_price`, `order_vendor_miles_and_warranty`, and `order_vendor_feedback`.
- Sourcing displays group parts by vendor dynamically on the client (e.g., Engine and Transmission from the same vendor represent a single collapsed vendor payment transaction visually, but are written as separate vendor cost lines).

**D31.3 — Global vs. Per-Part Field Split in Forms**
- **Deal-Global Fields:** Sales Agent, Sales Verifier, QA Verifier, Payment Gateway, Sale Date, Shipping Type, Liftgate Needed, Checklist by Backend, VIN, Make/Model. These are stored on the parent order row only. In `AddOrderForm` and `EditOrderForm`, they are rendered in a shared "Deal Information" section above all part cards.
- **Per-Part Fields:** Part Requested, Part Size/Specs, Quoted Miles & Warranty, Sourcing Vendor, Vendor Miles & Warranty, Vendor Price, Vendor Feedback, Part Found By, Backend Executive, Sale Status, Workflow (Current) Status. These are rendered inside each part-specific card and stored on all rows.

**D31.4 — Vendor Sourcing Mirroring UX**
- To simplify data entry when multiple parts come from the same vendor, a "Vendor Sourcing" dropdown is introduced on each child card (from index 1 onward).
- Sourcing options: "— Different vendor, enter below —" or "Same vendor as Part {index}".
- Selecting a mirror source disables the local Vendor select and automatically copies the selected source part's vendor ID/name. Changing the source part's vendor propagates the change to all mirroring parts. Vendor prices and specifications remain editable and independent.

**D31.5 — Order List displays per-part statuses and supports "ANY part matches" filtering**
- The status column of the Order List displays a stacked list of badges showing the status of each part (e.g., "Part 1 — Engine [Pending Shipment]", "Part 2 — Transmission [Pending Booking]").
- Filtering orders by Workflow Status or Sale Status uses an `OR` condition in the repository. An order is returned if the parent OR any of its child orders match the filter. This ensures deals appear in any queue where a part requires attention.

#### Consequences (D31)
- No database migrations or schema updates are needed (columns exist; data patterns are changed).
- Restructures `AddOrderForm` and `EditOrderForm` visual layout and JSON submission structures.
- Restructures `OrderList` row rendering logic to render all parts' statuses.
- Modifies repository methods `createWithCustomerAndCard`, `addPartToExistingOrder`, and `findAll` (OR search clauses).
- Modifies the Financial Summary sidebar on the Order Detail page to group and display vendor transactions dynamically.

---

## Decision 32 — Sale Status Promoted to Deal-Level Global Field (Phase 26.6)

**Date:** 2026-07-09
**Status:** Accepted

#### Context

During the Phase 26.5 review, an evaluation was conducted on whether `saleStatus` should be stored per `crm_orders` row (the current per-part model) or at the deal level (stored only on the parent row, `NULL` on child rows). The original multi-part architecture in Phase 26 and 26.5 kept `saleStatus` as a per-part field, with each row in `crm_orders` tracking its own sale outcome independently.

The business team confirmed the following rules unambiguously:
1. When a deal is chargebacked, the **entire deal** is chargebacked — not just one part.
2. When a deal is refunded, the **entire deal** is refunded — not one part of it.
3. When a deal is partially refunded, the **entire deal** has a partial refund — not a single part among multiple.
4. When a deal is voided or cancelled, **all parts** of that deal are voided or cancelled together.

No real-world business scenario exists where one part of a multi-part order has `saleStatus = 'Chargebacked'` while another part of the same order has `saleStatus = 'Sold'`.

#### Decision

**D32.1 — `saleStatus` is added to `GLOBAL_FIELDS`**
`saleStatus` is reclassified as a deal-global field. It is stored only on the parent `crm_orders` row. All child order rows receive `saleStatus = NULL` on creation and on any subsequent update. The `GLOBAL_FIELDS` constant in `order.repository.ts` is updated to include `'saleStatus'`.

**D32.2 — Child rows receive `orderCurrentStatus` cascade on terminal status changes**
The service layer (`order.service.ts`) is updated so that when the parent order's `saleStatus` is changed to a terminal outcome (`'2'` Refunded, `'3'` Chargebacked, `'5'` Void, `'6'` Cancelled), all child order rows associated with that parent automatically have their `orderCurrentStatus` updated to match (`'Returned Orders'` or `'Cancelled Orders'`). This cascade fires only when the PATCH target is a parent row (`existingOrder.parentOrderId === null`). No cascade fires when `saleStatus` changes to `'1'` (Sold) — child workflow queue statuses remain at their individual operational stages.

**D32.3 — No `saleStatus` history entries are written for child rows during cascade**
The `crmSaleStatusHistory` table records only the parent row's status change (written by `createSaleStatusHistoryEntry` as before). Child rows receive their `orderCurrentStatus` cascade silently — no separate history entry is written for them, because the cascade is a mechanical side effect of the parent's status change, not an independent user action.

**D32.4 — UI changes: single global Sale Status control in Section 06**
Both `AddOrderForm.tsx` and `EditOrderForm.tsx` are restructured to present a single, global Sale Status dropdown in a new dedicated "Section 06 — Order Status." The Sale Status dropdown is removed from inside individual Part cards. The date/time capture modal (for Refunded/Chargebacked/Void statuses) remains but is now triggered by the global control. The Refund Amount input (for Partial Refund status `'4'`) is moved to Section 06 alongside the Sale Status dropdown.

**D32.5 — Form section layout is restructured to match the approved HTML reference**
The previous "3. Deal Information" section (which mixed pricing and team fields) is split into two separate sections:
- **Section 04 — Pricing & Allocation**: Total Price Pitched, Vendor Price Total (read-only), Net Markup (read-only), Actual Charged, Sale Date.
- **Section 05 — Team Allocation**: Sales Agent, Sales Verifier, Backend Executive, QA Verifier, Payment Gateway.

The full six-section form layout (matching `order-intake_and_edit_example_1.html`) is:
01 Customer Information → 02 Payment Card Details → 03 Parts → 04 Pricing & Allocation → 05 Team Allocation → 06 Order Status

**D32.6 — Part cards gain collapsible behavior**
When a second part is added to a deal, all previously existing part cards auto-collapse to their header (showing only the Part number badge and nickname input). Each card header has a chevron toggle for manual expansion/collapse. This reduces visual noise on multi-part forms.

#### Consequences (D32)
- No database schema migration required. The `sale_status` column on `crm_orders` already exists and is already `NULL`-able; child rows will simply always have `NULL` from this point forward.
- Existing data in the database: child rows that previously had non-`NULL` `saleStatus` values will retain those values. A one-time data migration script (optional) can null them out for consistency, but the application logic is not dependent on them being `NULL` after this change — the UI reads `saleStatus` only from the parent row going forward.
- Dashboard SQL queries are not affected. They already filter by `order_date` which is `NULL` on child rows, so child rows were never counted in financial aggregations regardless of their `saleStatus` value.
- `crmSaleStatusHistory` entries are written only for parent rows. Any existing history entries on child order IDs remain in the database but are no longer added to.
- `OrderList` and `OrderListContainer` sale status filtering logic: the `OR` filter (checking parent OR child `saleStatus`) in `findAll()` is simplified. Since child rows always have `saleStatus = NULL`, filtering by `saleStatus` now matches only parent rows. The `OR` clause in the repository can be simplified to a direct `where: { saleStatus: filters.saleStatus }` without the nested child join.
- Files changed: `src/types/order.ts`, `src/repository/order.repository.ts`, `src/service/order.service.ts`, `src/components/AddOrderForm.tsx`, `src/components/EditOrderForm.tsx`, and their respective test files.

---

## Decision 33 — REST API Restrictions, Details Page Ownership & Action Link Customizations

**Date:** 2026-07-09
**Status:** Accepted

#### Context
The business required adding permission restrictions so that users with `orders:create` permission (but lacking `orders:view` view-details) can access the orders page, but can only see and interact with their own deals and orders. Both frontend filters and backend endpoints must enforce this restriction. Details and Edit action buttons for other agents' orders must be grayed out, and the Delete button on the order details page must be hidden for unauthorized users.

#### Decisions

**D33.1 — Restricted Orders Access Check**
- Users who have `orders:create` but lack `orders:view` are considered "restricted."
- The list API (`GET /api/orders`) and pending counts API (`GET /api/orders/pending-counts`) force the `agentId` filter to the logged-in user's UID and clear the `teamId` filter. Team and Agent filters are hidden from the UI.

**D33.2 — Individual Order Details and Edit Page Ownership Checks**
- The Details Server Component (`src/app/orders/[id]/page.tsx`), the GET route (`GET /api/orders/[id]`), the Edit Server Component (`src/app/orders/[id]/edit/page.tsx`), and the PATCH route (`PATCH /api/orders/[id]`) all check if the user is restricted.
- If restricted and not the sales agent of the order, they are denied access with `403 Forbidden` / `Access Denied`. Non-restricted users (e.g. verifiers, editors, admins) bypass this check to maintain backward compatibility.

**D33.3 — Comments API Enforced Ownership**
- The comments GET and POST endpoints (`/api/orders/[id]/comments`) verify ownership for restricted users to prevent accessing or posting comments on orders belonging to other agents.

**D33.4 — Action Buttons Custom Graying Out**
- In `OrderList` and `RecentOrdersTable` views, Details and Edit links are conditionally grayed out (using inline style `color: '#94a3b8'` and `cursor: 'not-allowed'`, with no background or border) if the user is restricted and is not the sales agent, or if the user lacks the generic `orders:edit` permission.

**D33.5 — Delete Button Visibility**
- The `DeleteOrderButton` in the Order Details page is conditionally rendered only if the user holds the `orders:delete` permission.

#### Consequences (D33)
- Files changed: `src/app/api/orders/route.ts`, `src/app/api/orders/pending-counts/route.ts`, `src/app/api/orders/[id]/route.ts`, `src/app/api/orders/[id]/comments/route.ts`, `src/app/orders/[id]/page.tsx`, `src/app/orders/[id]/edit/page.tsx`, `src/middleware.ts`, `src/components/Sidebar.tsx`, `src/components/Navbar.tsx`, `src/components/OrderListContainer.tsx`, `src/components/OrderList.tsx`, `src/components/dashboard/RecentOrdersTable.tsx`.
- Realigned recent orders query select statements to ensure `orderSalesAgentId` is retrieved and mapped to the dashboard component.

---

## Decision 34 — Dashboard Phase 29: Sales Performer Redesign, Backend Team Performance Widget & New Permission Keys

**Date:** 2026-07-10
**Status:** Accepted

#### Context

The Champions League (Sales Performers) widget originally displayed only an agent name and total
sales volume. The business requested a richer view — filtered to front-line sales designations
only, with separate columns for sales count, total revenue, and leakage count (refunds +
chargebacks). Additionally, a completely separate Backend Team Performance widget was requested
to surface backend executive workloads (completed cases, pending cases by category). Three new
RBAC permission keys are introduced specifically for the backend widget. The existing two
sales-performer permission keys (`dashboard:top-performer`, `dashboard:bottom-performer`) are
kept unchanged to avoid production RBAC disruption.

#### Decisions

**D34.1 — Sales performer tables are designation-filtered; only front-line sales roles appear**
- The `getTopPerformers()` and `getBottomPerformers()` SQL queries in
  `dashboard.repository.ts` now JOIN the `users` table and apply a `WHERE u.designation IN (...)`
  filter. Only agents with the following five designations are included in the ranking:
  `'Sales Supervisor'`, `'Sales Team Lead'`, `'Sales Specialist'`, `'Sales Expert'`,
  `'Sales Associate'`.
- Agents with other designations (e.g. Backend Specialist, HR Manager, QA) are silently
  excluded from the performer tables regardless of their order volume. This is intentional —
  the Champions League is a sales-only leaderboard.
- The filter is applied in SQL (not in JavaScript post-processing) to keep the LIMIT clause
  accurate. Without the JOIN filter, the LIMIT would include non-sales agents and then
  JavaScript would remove them, shrinking the result set below the intended limit.

**D34.2 — Sales performer tables gain three new columns: Sales Count, Total Sales, Leakage Count**
- `salesCount`: `COUNT(*)` of orders where `sale_status IN ('1', '4')` (Sold + Partial Refund).
  Partial refunds count as completed sales per the business rule established in Decision 19.
- `totalSales`: `SUM(order_amount_charged - order_refund_amount)` for the above status set.
  This is the `finalMargin` formula used throughout the system. Ranking is based on this value.
- `leakageCount`: `COUNT(*)` of orders where `sale_status IN ('2', '3')` (Refunded +
  Chargebacked). Named "Leakage" because it represents recovered-then-lost revenue.
- The `amount` field returned by these repository functions now maps to `totalSales`.
- All three values are scoped to the selected month/year (same as the existing navigator).

**D34.3 — All performer table cells are clickable deep links to the Orders page**
- Every data cell (agent name, sales count, total sales value, leakage count) is rendered as an
  anchor tag pointing to `/orders` with the relevant query parameters pre-applied.
- Deep link formats:
  - Agent name → `/orders?agentId={uid}&month={M}&year={Y}`
  - Sales Count → `/orders?agentId={uid}&saleStatus=1,4&month={M}&year={Y}`
  - Total Sales → `/orders?agentId={uid}&saleStatus=1,4&month={M}&year={Y}`
  - Leakage Count → `/orders?agentId={uid}&saleStatus=2,3&month={M}&year={Y}`
- RBAC is enforced at the API layer (`GET /api/orders`). Restricted users (those with
  `orders:create` but without `orders:view`) have their `agentId` forced to their own UID on
  the backend. Clicking another agent's cell simply shows the restricted user's own orders —
  no data leakage, no additional frontend permission check required for the link itself.
- The `agentId` returned from performer queries is `users.uid` (joined from `crm_orders → users`),
  not the legacy `agent_id` display string.
- Month/year filter for deep links uses the same month/year currently selected in the widget's
  month navigator, ensuring the orders page opens pre-filtered to the same period being viewed.

**D34.4 — Existing sales performer permission keys are NOT renamed**
- `dashboard:top-performer` (ID 8) and `dashboard:bottom-performer` (ID 9) keep their existing
  keys. Renaming them would break any production role-permission assignments already in the
  database that reference these IDs by name or by their role-permission row entries.
- The new backend permissions are distinct keys with the `backend` substring so their scope
  is unambiguous without requiring the sales keys to change.
- Code references (e.g. `hasPermission(permissions, 'dashboard:top-performer')`) remain as-is.

**D34.5 — Three new permission keys for the Backend Team Performance widget**
- `dashboard:backend-top-performer` (ID 55): Controls visibility of the Backend Top Performers
  panel. Assigned to Super Admin (role_id 1) and Admin (role_id 2) only by default.
- `dashboard:backend-bottom-performer` (ID 56): Controls visibility of the Backend Bottom
  Performers panel (sorted by highest pending backlog). Same default role assignments.
- `dashboard:backend-pending-cases` (ID 57): Controls visibility of the full Pending Cases by
  Category breakdown table. Same default role assignments.
- These three IDs (55, 56, 57) are the next sequential IDs after the existing 54 permissions.
  They are reserved permanently for these keys.
- Permission enforcement is dual-layer: the `BackendTeamWidget` client component hides the
  panels if the permission is absent (UX guard), AND the `GET /api/dashboard/backend-team` API
  route returns `403 Forbidden` if none of the three backend permissions are present on the
  session (backend security guard). The backend check cannot be bypassed by UI manipulation.

**D34.6 — Backend Team Performance widget uses the same month navigator as Champions League**
- The new `BackendTeamWidget` component shares the same month/year navigation pattern as
  `ChampionsLeagueWidget`. Users navigate backward/forward through months to view history.
- All three panels (Top Performers, Bottom Performers, Pending Cases) are scoped to the
  selected month and year. The scope column is `order_created_date` (not `order_date`) because
  backend executive assignment happens at order creation time, not at the sales date.
- The API endpoint (`GET /api/dashboard/backend-team?month=M&year=Y`) accepts `month` and
  `year` as required query parameters and defaults to the current EST month/year if omitted.

**D34.7 — Backend performer ranking criteria**
- Top Performers panel: Agents ranked by `completedCount DESC` — the number of orders with
  `order_current_status = 'Completed Orders'` assigned to them in the selected month.
- Bottom Performers panel: Agents ranked by `totalPending DESC` — the total count of orders
  in any pending queue (`Pending Booking`, `Pending Shipment`, `Pending Delivery`,
  `Pending Feedback`, `Pending Resolutions`) assigned to them.
- Both panels include only active users (`users.status = 1`) with designation in
  `('Backend Specialist', 'Backend Associate')`. Inactive users are excluded.
- LEFT JOIN is used so that backend executives with zero orders in the selected month still
  appear in the table (with zero counts), ensuring the complete team is always visible.
- Limit for Top/Bottom panels is 10 rows each.

**D34.8 — Backend performer cells are also clickable deep links**
- Pending Cases table and Top/Bottom panel cells link to `/orders` with:
  - Agent name → `/orders?backendExecutiveId={uid}&month={M}&year={Y}`
  - Completed count → `/orders?backendExecutiveId={uid}&status=Completed+Orders`
  - Pending Booking → `/orders?backendExecutiveId={uid}&status=Pending+Booking`
  - Pending Shipment → `/orders?backendExecutiveId={uid}&status=Pending+Shipment`
  - Pending Delivery → `/orders?backendExecutiveId={uid}&status=Pending+Delivery`
  - Pending Feedback → `/orders?backendExecutiveId={uid}&status=Pending+Feedback`
  - Pending Resolutions → `/orders?backendExecutiveId={uid}&status=Pending+Resolutions`
  - Total Pending → `/orders?backendExecutiveId={uid}` (no status filter — shows all assigned)
- The `backendExecutiveId` query param is already fully wired end-to-end in
  `OrderListContainer.tsx` → `GET /api/orders` → `order.repository.ts:findAll()`.
  No additional backend plumbing is required to support these deep links.

**D34.9 — Production deployment uses a standalone SQL migration script, not a Prisma migration**
- New permissions are pure data rows — no table structure changes. Prisma migrations are
  exclusively for DDL (schema) changes. Using `prisma migrate dev` for a data-only change
  would be incorrect and would insert a spurious migration entry into `_prisma_migrations`.
- A standalone SQL script at `scripts/sql/add-backend-permissions.sql` is the correct delivery
  mechanism. It uses `INSERT IGNORE` throughout and is fully idempotent (safe to run multiple
  times without producing duplicate rows or errors).
- `seed.sql` is also updated to include the three new permissions and role-permission mappings.
  `seed.sql` has been simultaneously hardened to be fully idempotent — all `DELETE FROM`
  statements on content tables have been removed and replaced with `INSERT IGNORE` /
  `ON DUPLICATE KEY UPDATE`. The seed can now be re-run at any time without wiping data.
- For production: run `scripts/sql/add-backend-permissions.sql` once after code deployment.
- For development/test: re-running `seed.sql` (or resetting via Docker) picks up new
  permissions automatically.

#### Consequences (D34)
- New files:
  - `src/app/api/dashboard/backend-team/route.ts` — new API route for backend team data.
  - `src/components/dashboard/BackendTeamWidget.tsx` — new dashboard widget component.
  - `scripts/sql/add-backend-permissions.sql` — one-shot production permission migration.
- Modified files:
  - `src/repository/dashboard.repository.ts` — updated `getTopPerformers()`,
    `getBottomPerformers()` with designation filter and new columns; new
    `getBackendTeamPerformers()` and `getBackendPendingByCategory()` functions.
  - `src/service/dashboard.service.ts` — new `getBackendTeamDashboard()` method.
  - `src/components/dashboard/PerformersTable.tsx` — adds salesCount, leakageCount columns;
    makes all cells clickable.
  - `src/components/dashboard/ChampionsLeagueWidget.tsx` — passes `agentId` from API response
    through to `PerformersTable` for deep links.
  - `src/types/dashboard.ts` — extends `PerformerRow` type; adds `BackendPerformerRow`,
    `BackendPendingRow` types.
  - `seed.sql` — fully idempotent rewrite; adds permission IDs 55–57.
  - Dashboard server page — wires `BackendTeamWidget` with permission props.
- No `prisma migrate` commands are needed. No schema changes. No existing data is modified.
- The `crm_permissions` table gains 3 new rows (IDs 55, 56, 57).
- The `crm_role_permissions` table gains 6 new rows (3 for Super Admin, 3 for Admin).

---

## Decision D35 � Pending Booking Workflow Status Days: Counted from Sale Date, Not Entry Date

**Date:** 2026-07-15
**Session:** 75
**Status:** Implemented

### Context

JD CRM supports late order entry � a sale that happens on one date can be formally entered into the CRM on a later date. Two separate timestamps are captured for every order:

- orderDate � the actual date the sale occurred (the "sale date")
- orderCreatedDate � the date the order was recorded in the CRM (the "entry date")

The workflow status system tracks how many days an order has been in each status (e.g. Pending Booking, Pending Shipment, etc.) and displays this as a badge � "(for N days)" � in both the Orders List and the Recent Orders dashboard widget. This badge drives urgency awareness for the team.

**The Bug:** When a new order with no vendor assigned is created, its workflow status defaults to Pending Booking and orderCurrentStatusUpdateDate is stamped to 
ew Date() � the CRM entry timestamp. If the sale happened 5 days ago but was only entered today, the badge would show "(for 0 days)" instead of "(for 5 days)". This directly misleads the team about the age of the booking.

Additionally, the raw millisecond difference used to compute the day count was anchored to UTC midnight, so the counter could tick over at 8 PM EST (end of the US business day), causing the display to jump by a day mid-afternoon on the East Coast.

### Decision

**D35.1 � For Pending Booking, orderCurrentStatusUpdateDate is stamped to the sale date at creation, not the entry date**

When a new order resolves to Pending Booking status (no vendor assigned, saleStatus not Returned/Cancelled/Void), the orderCurrentStatusUpdateDate field in the database is set to 	oUtcNoonDate(orderDateVal) � noon UTC on the sale date � instead of 
ew Date().

This approach was chosen over the alternatives because:

- **orderCurrentStatusUpdateDate is the single source of truth for "when did this status start"**. Making it reflect the sale date for Pending Booking is semantically correct: the booking has been pending since the sale happened, regardless of when it was logged.
- **No new column is required.** Using the existing field keeps the query surface small and avoids schema migrations.
- **orderCreatedDate (the entry timestamp) is preserved as-is.** The UI already distinguishes the two: the order detail page now shows "Order placed on" for orderDate and "Order entry on" for orderCreatedDate, making the separation explicit.
- **The workflow history log (crmOrderCurrentStatusHistory.changedAt) is intentionally NOT changed.** The log records when the booking was *entered into the system* � this is the correct audit semantics. Backdating the log would destroy accurate entry tracking. The display days counter and the audit log answer different questions: "how old is this booking?" vs. "when did someone record it?".

**D35.2 � The days display uses EST calendar days, not raw millisecond division**

A new utility function getEstCalendarDaysDiff(referenceDate) was added to src/lib/date.ts. It:

1. Converts both "now" and the reference date to their EST calendar date using Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York' }).
2. Computes the difference in whole calendar days based on those EST dates.

This ensures the "(for N days)" counter increments at EST midnight, not UTC midnight. The raw millisecond approach (Math.floor(msElapsed / 86400000)) was incorrect because it would advance the count at ~8 PM EST on any given day, misaligning with the team's EST business day.

**D35.3 � For Pending Booking specifically, the days display uses orderDate as the reference**

In OrderList.tsx, the inline day calculation for both parent orders and child orders was updated:

- If orderCurrentStatus === 'Pending Booking': use order.orderDate (sale date) as the reference for getEstCalendarDaysDiff().
- For all other active statuses: use orderCurrentStatusUpdateDate as before.
- Child orders in Pending Booking inherit the parent order's orderDate (child rows have no orderDate of their own).

The sort comparator (getDaysInStatus) follows the same logic so ordering is consistent with display.

**D35.4 � "Created" label renamed to "Entry on" in Order Detail page**

The subtitle on the Order Details page (src/app/orders/[id]/page.tsx) was changed from:

`
Placed on {saleDate} � Created {entryDate}
`
to:
`
Order placed on {saleDate} � Order entry on {entryDate}
`

This makes the distinction between sale date and entry date self-explanatory to any team member reading the order header without needing external documentation.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| Add a new pendingBookingStartDate column | Unnecessary schema change; orderCurrentStatusUpdateDate already serves this role semantically |
| Show days from orderDate for ALL statuses | Wrong for Pending Shipment etc. � those status clocks correctly start from the status transition, not the original sale |
| Backdate crmOrderCurrentStatusHistory.changedAt | Corrupts the audit trail; the log should record when the system event actually occurred |
| Compute days on the server and return them from the API | Overcomplicates the data layer; the calculation is a pure UI concern that is correctly handled client-side |

### Files Changed

- src/lib/date.ts � Added getEstCalendarDaysDiff(referenceDate) export
- src/components/OrderList.tsx � Updated getDaysInStatus(), parent display block, child display block
- src/repository/order.repository.ts � parentInitialStatus / childInitialStatus variables; conditional orderCurrentStatusUpdateDate at creation
- src/app/orders/[id]/page.tsx � "Order placed on" / "Order entry on" label fix

### Tests Added / Updated

- src/tests/OrderList.test.tsx
  - W-1905 test updated: Pending Booking order now uses orderDate (sale date) as the 4-day reference
  - New getEstCalendarDaysDiff unit tests describe block (5 cases)
  - New W-2801 describe block: Pending Booking counts from sale date, Pending Shipment uses update date, child order inherits parent sale date
- src/tests/orders.test.ts
  - New W-2801 integration describe block (2 tests): DB-level assertion that orderCurrentStatusUpdateDate equals the sale date for Pending Booking; and equals entry time for Pending Shipment



## Decision D36 - Advanced Chart Permissions: Allow All Users to View Widget with Specific Agent Lock

### Context
Historically, the `Advanced Performance Analytics` dashboard widget was restricted strictly to users with the `dashboard:view-advanced-chart` permission. Any user without this permission was prevented from viewing the widget, and the backend API endpoint (`/api/dashboard/advanced-chart`) would return a `403 Forbidden` error unconditionally.
However, we wanted all users to have access to these advanced analytics, but with a critical security constraint: users without the explicit chart permission must not be able to view the aggregated sales performance of all agents combined ("All Agents" dataset). They should only be allowed to view individual agent statistics (e.g., their own performance).

### Decision
1. **Frontend**:
   - Render the `<AdvancedChartWidget />` unconditionally (remove the permission wrap) on the dashboard client page.
   - Pass the user's `permissions` and `currentUserId` as props to the widget.
   - For users without `dashboard:view-advanced-chart` permission:
     - Conditionally omit the `<option value="">All Agents</option>` from the Agent select dropdown.
     - Default the `selectedAgent` state to the user's `currentUserId` (or first available agent) on mount.
     - Add a reactive fallback effect to ensure that when a user switches the Center (team), the select state updates to a valid agent of the newly selected center instead of resetting back to empty ("All Agents").
2. **Backend**:
   - Update `getAdvancedChartMetrics` inside `src/service/dashboard.service.ts` so that users lacking `dashboard:view-advanced-chart` permission can still successfully request data, provided they specify a specific `agentId` query parameter.
   - If the `agentId` is omitted (null or undefined, representing a request for aggregate "All Agents" sales), the request is rejected with a `403 Forbidden` error.

### Alternatives Considered
- **Client-side only filtering**: Reject because users could inspect network requests or modify query parameters to view the aggregate statistics of other agents, violating the data privacy constraint.
- **Separate backend endpoints**: Rejected because updating the existing endpoint keeps the code clean and maintains consistency in route handling.

### Files Changed
- `src/service/dashboard.service.ts` - Updated permission checks inside `getAdvancedChartMetrics` to check for `agentId` when permissions are missing.
- `src/app/dashboard_client_page.tsx` - Render widget unconditionally and pass permissions/userId.
- `src/components/dashboard/AdvancedChartWidget.tsx` - Implement frontend props, dropdown filter exclusion, mount default selection, and change fallback updates.

### Tests Added / Updated
- `src/tests/dashboard.test.ts` - Added route integration test verifying that unauthorized users querying specific `agentId` return `200 OK` while aggregate queries return `403 Forbidden`.
- `src/tests/AdvancedChartWidget.test.tsx` - Added component test ensuring "All Agents" option is hidden and default agent selected. Passed full permissions props to existing tests to keep them green.
- `src/tests/debug.test.tsx` - Updated props in render calls to keep tests passing.


## Decision D37 - Follow-Ups Feature: Prospect Callback Tracker with Timezone-Aware Notifications

**Date:** 2026-07-16
**Status:** Approved (Phase 31)

### Context
Sales agents handle large volumes of prospect calls daily. When a prospect says "call me back on Friday at 2pm", this information was previously tracked only in personal notes or informal methods. There was no CRM-integrated mechanism to schedule, track, or receive reminders for these callbacks. The business needs a formal Follow-Ups system where agents can log prospect callback records, set a scheduled date and time in the **customer's own timezone** (critical since the business serves the entire US and Canada, spanning 6+ timezone zones), and receive a popup/notification when that scheduled moment arrives.

### Decisions

**D37.1 � Single dedicated table crm_follow_ups, no FK to crm_customers**
Follow-ups are prospect records � the person may never become an actual customer. Forcing a FK to crm_customers would require creating a customer row for every prospect, polluting the customer table with non-customer data. All prospect data (name, phone, vehicle, location) is stored directly on the follow-up row itself. The only FK is gent_id ? users.uid (ON DELETE RESTRICT). This is the same architectural decision as crm_attendance, which stores gent_name as a denormalized snapshot rather than joining through to a separate entity.

**D37.2 � Timezone storage: store customer's stated time as-is; derive UTC at query time**
ollow_up_date (DATE) and ollow_up_time (VARCHAR HH:MM) are stored exactly as the customer states them, in their own timezone. The inferred IANA timezone string is stored in customer_timezone. UTC is computed at notification query time using MySQL's CONVERT_TZ() function. No UTC datetime column is stored. This avoids the need to convert back to the customer's local time for display, and the data remains human-readable in the database without any conversion.

**D37.3 � Timezone inferred server-side from state selection; never trusted from client**
The STATE_TIMEZONE_MAP (added to src/lib/geography.ts) maps every US state and Canadian province to its primary IANA timezone. When a follow-up is created or the customer's state is edited, the server derives customerTimezone from this map and writes it to the DB. The client cannot inject or override the timezone value � it is computed purely server-side. This prevents agents from accidentally or maliciously submitting incorrect timezone values.

**D37.4 � Dual-permission model mirroring orders:view / orders:create exactly**
- ollow-ups:view (ID 58): Admin-level. Sees all agents' records. Unlocks Team + Agent filter controls and the Agent column in the list. Required for delete.
- ollow-ups:create (ID 59): Agent-level. Can access the page and create records, but the backend hard-forces gentId = session.user.uid on every query regardless of what the client sends. No Team/Agent filters are shown. Cannot delete.
- Neither permission = 403 from API + middleware redirect to /access-denied.
- Super Admin (role 1) and Admin (role 2) get both. Agent (role 8) gets only ollow-ups:create.

**D37.5 � Combined quoted_options TEXT field with multi-line Price - Miles/Warranty format**
Instead of separate quoted_price and quoted_miles_and_warranty columns, a single quoted_options TEXT column stores all quote variants. Each line represents one option in the format Price - Miles/Warranty (e.g. $450 - 60k miles / 30 day warranty). Agent presses Enter for each new option. The list view shows only the first line (truncated). The detail page renders all lines. This is more flexible than two fixed columns and matches how agents actually quote multiple vendor options during a call.

**D37.6 � lastContact update rules**
last_contact is set to 
ow() on record creation (representing the initial call). It is updated by ollowup.service.ts whenever a PATCH contains any of: 
otes, status, ollow_up_reason, ollow_up_date, or ollow_up_time. It is NOT updated for changes to priority, quoted_options, customer_name, customer_phone, or vehicle fields � those are administrative corrections, not contact events. The service layer enforces this rule; the repository layer is unaware of it.

**D37.7 � 
otificationSentAt DB column for one-shot notification tracking**
When a follow-up notification fires (toast + optional OS notification), 
otification_sent_at is set to 
ow(). The indDueForNotification() repository query filters on 
otification_sent_at IS NULL, so each follow-up fires exactly once. If the agent edits ollow_up_date or ollow_up_time, the service layer resets 
otification_sent_at = NULL, allowing the rescheduled time to trigger a fresh notification.

**D37.8 � Dual-channel notification: in-app toast always + OS browser notification if granted**
A custom React hook useFollowUpNotifications polls GET /api/follow-ups/due every 60 seconds and on tab focus events. Due records trigger an in-app toast (always, requires no user permission). If Notification.permission === 'granted', the browser's OS-level Notification API also fires (
ew Notification(...)). The hook requests permission on first mount using Notification.requestPermission(). Dismissing the toast triggers PATCH /api/follow-ups/<id> with { _markNotified: true }, which calls markNotificationSent() directly without touching lastContact or triggering the 
otificationSentAt reset logic.

**D37.9 � luxon chosen for timezone computations**
Neither date-fns nor luxon was in the project. luxon is added as it handles IANA timezone zone names natively in a single self-contained package, making the computeDaysLabel() pure function and the indDueForNotification() UTC derivation clean and readable. date-fns-tz would have required adding both date-fns and date-fns-tz (two packages) for less ergonomic timezone support.

**D37.10 � List page does NOT SSR pre-fetch follow-ups (unlike Orders/Agents pages in Phase 30)**
The follow-ups list is always scoped to the individual agent or filtered by admin choices. Unlike the orders list which can fetch a sensible default set server-side, a follow-ups SSR pre-fetch would either return nothing useful (no filters applied) or require complex session-aware server-side filtering that adds complexity without measurable UX benefit. The client-side fetch on mount pattern is used instead, consistent with the pre-Phase 30 list behavior.

**D37.11 � Scroll/pagination/filter state preservation follows Session 82 + 83 patterns exactly**
FollowUpListContainer.tsx implements: lazy filter state from URL params, prevFiltersRef to prevent page reset on mount, double-rAF scroll restoration, window.scrollY > 0 guard on scroll listeners, coming_from_followup_detail sessionStorage key, isRestoringRef ordering fix. Back buttons use the shared <BackButton /> component (
outer.back()). No new patterns � this is a direct application of the established Session 82+83 solution.

### Files Changed (Phase 31)
- CONTEXT/database_schema.md � Added crm_follow_ups table to summary, column spec, and Prisma model
- CONTEXT/project_data.md � Added ollow-ups resource permissions section
- CONTEXT/current_state.md � Added Phase 31 to progress table and TDD checklist
- CONTEXT/decision_log.md � This entry
- prisma/schema.prisma � New CrmFollowUps model + reverse relation on Users
- seed.sql � New permissions IDs 58 and 59 + role assignments
- src/lib/geography.ts � New STATE_TIMEZONE_MAP export
- src/types/followup.ts � New type interfaces
- src/repository/followup.repository.ts � New repository
- src/service/followup.service.ts � New service + computeDaysLabel export
- src/app/api/follow-ups/route.ts � New GET + POST
- src/app/api/follow-ups/[id]/route.ts � New GET + PATCH + DELETE
- src/app/api/follow-ups/due/route.ts � New notification poll endpoint
- src/middleware.ts � Added /follow-ups route protection
- src/components/AddFollowUpForm.tsx � New add form
- src/components/EditFollowUpForm.tsx � New edit form
- src/components/FollowUpList.tsx � New list table
- src/components/FollowUpListContainer.tsx � New list container with filter/scroll state
- src/app/follow-ups/page.tsx � New list page
- src/app/follow-ups/new/page.tsx � New add page
- src/app/follow-ups/[id]/page.tsx � New detail page
- src/app/follow-ups/[id]/edit/page.tsx � New edit page
- src/lib/useFollowUpNotifications.ts � New notification hook
- src/app/layout.tsx � Navbar link added
- src/tests/followups.test.ts, ollowup.service.test.ts, geography.test.ts, AddFollowUpForm.test.tsx, FollowUpList.test.tsx, FollowUpDetailPage.test.tsx, useFollowUpNotifications.test.ts � New test files

---

## Decision D38 — Follow-Ups Module: Bug Fixes, UI Overhaul, and Part Description Field

**Date:** July 17, 2026

### Decisions

**D38.1 - computeDaysLabel Date-object branch reads UTC date literally, not timezone-shifted**
When Prisma deserializes a MySQL `@db.Date` column, it returns a JS `Date` object set to UTC midnight of the stored date (e.g., stored `2026-07-17` arrives as `2026-07-17T00:00:00.000Z`). The original `computeDaysLabel` implementation called `.setZone(customerTimezone)` on this UTC-midnight Date before extracting the date string. For western timezones (e.g., Alaska UTC-9), this shifted `2026-07-17T00:00:00Z` back to `2026-07-16T15:00:00-09:00`, extracting `2026-07-16` instead of `2026-07-17`, causing the label to incorrectly read "Today" when it should read "Tomorrow". The fix: extract the date from the Date object using `.toISOString().split('T')[0]` (which reads the UTC date part literally). This is identical to what the `else` branch already does for string inputs. The `@db.Date` type is timezone-naive by design (D37.2), so the UTC date IS the intended date — no timezone conversion should be applied during date extraction.

**D38.2 - useFollowUpNotifications due-check uses customer timezone via Luxon, not browser Date**
The notification hook runs client-side in the browser. Any use of `new Date()` or `Date.now()` for comparing whether a follow-up is "due now" introduces browser-timezone dependency — an agent in India (UTC+5:30) might see July 17 locally when the customer's timezone (Alaska, UTC-9) is still July 16, causing premature notification firing. The fix: construct the scheduled datetime using `DateTime.fromISO(followUpDate + 'T' + followUpTime, { zone: customerTimezone })` (Luxon) and compare it against `DateTime.now()`. Since Luxon's `DateTime.now()` represents the current UTC instant and the comparison is done within the customer's timezone context, the result is correct regardless of the browser's local timezone setting.

**D38.3 - part_description is a nullable TEXT supplement to part_required; not merged into it**
The `part_required` field is a short `varchar(255)` identifying the part category (e.g. "Front Bumper"). The new `part_description TEXT NULL` stores additional context (e.g. "Driver side, OEM, power folding, color code WX"). These are separate because: (a) `part_required` is required and short — used in list views and notification bodies; (b) `part_description` is optional and potentially long — shown only on detail and edit pages. Merging them into a single field would degrade list view legibility and force agents to see verbose descriptions in the list table.

**D38.4 - Phone number format enforced client-side by shared formatPhone.ts formatter; not validated server-side**
`customer_phone` is stored as-formatted (xxx-xxx-xxxx). The formatter lives in `src/lib/formatPhone.ts` and is imported by Add/Edit forms (onChange handler), the list table (display), and the detail page (display). The server does NOT validate or reformat phone numbers on receipt — it trusts the frontend to submit the correct format. This mirrors the Orders pattern where `formatPhoneNumber` in `AddOrderForm.tsx` is applied client-side only. The decision avoids adding server-side validation overhead for a field that is optional and not used in any backend query.

**D38.5 - entryDate and lastContact displayed in America/New_York (EST/EDT) on the detail page**
These `datetime` columns are stored as UTC in MySQL. On the follow-up detail page, they are displayed in the `America/New_York` timezone using Luxon's `.setZone('America/New_York')`, producing output like `Jul 16, 2026 · 03:45 PM EDT`. This matches the orders page convention (which uses `formatDateTimeDDMMYYYY` from `src/lib/date.ts`, also targeting `America/New_York`). The business is US-based and agents interpret all system timestamps in Eastern Time.

**D38.6 - computeDaysLabel customer timezone comparison remains correct; no global timezone override applied**
The `computeDaysLabel` function continues to use `DateTime.now().setZone(customerTimezone)` for determining "what is today from the customer's perspective." This is intentionally customer-centric: if a follow-up is scheduled for 9:00 AM Alaska time, it should become "Today" at Alaska midnight, not at New York midnight. The server's `DateTime.now()` is always the current UTC instant regardless of server OS timezone, so `.setZone(customerTimezone)` correctly localizes it to the customer's calendar day. The only bug that was fixed (D38.1) was in how the stored date was extracted, not in how "today" was computed.

### Files Changed (Phase 31.5)
- CONTEXT/current_state.md — Added Phase 31.5 to progress table and full TDD checklist (W-3151 through W-3158)
- CONTEXT/project_data.md — Added Phase 31.5 follow-ups notes section
- CONTEXT/database_schema.md — Added part_description to Prisma schema block and column reference table
- CONTEXT/decision_log.md — This entry (D38.1 through D38.6)
- prisma/schema.prisma — partDescription field added to CrmFollowUps model
- 1 Prisma migration — add_part_description_to_follow_ups
- src/lib/formatPhone.ts — New shared phone formatter utility
- src/lib/useFollowUpNotifications.ts — Due-check rewritten to use customer timezone via Luxon
- src/service/followup.service.ts — computeDaysLabel instanceof Date branch fixed
- src/repository/followup.repository.ts — partDescription added to create/update/findAll/findById; search filter added to findAll
- src/types/followup.ts — partDescription added to FollowUpCreateInput, FollowUpUpdateInput, FollowUpRecord; search added to FollowUpFilters
- src/app/api/follow-ups/route.ts — search param extracted; partDescription extracted from POST body
- src/app/api/follow-ups/[id]/route.ts — partDescription extracted from PATCH body
- src/components/AddFollowUpForm.tsx — formatPhoneNumber wired; partDescription field added
- src/components/EditFollowUpForm.tsx — formatPhoneNumber wired; partDescription field pre-filled
- src/components/FollowUpList.tsx — Column restructure (Customer Info + Location, remove Quoted Options, stacked date/time display); phone formatted
- src/components/FollowUpListContainer.tsx — Search input added to header; "Callback" labels renamed
- src/app/follow-ups/[id]/page.tsx — Customer Timezone row removed; Georgia font applied; EST timestamps; sidebar card merge (Classification + Schedule); Notes moved to top; partDescription display; "Callback" labels renamed; formatFollowUpTime replaces formatCallbackTime


---

## Decision D39 - Orders: CAD/USD Currency, Sales Verifier Filter, Clickable Customer Name, Alphabetical Dropdowns

**Date:** July 20, 2026

### Decisions

**D39.1 - CAD-to-USD conversion applied once at service-layer write time; database always stores USD equivalents**
The business handles customers from both the USA (USD) and Canada (CAD). Rather than storing values in multiple currencies and converting at display time, all monetary values are converted to USD equivalents before being persisted in the database. The conversion is applied once in order.service.ts during createOrder and updateOrder, immediately before the repository write call. The formula is: stored_value = entered_CAD_value * exchange_rate, rounded to 2 decimal places. The conversion is triggered only when orderCurrency === 'CAD' AND parseFloat(orderExchangeRate) !== 1. This approach was chosen over display-time conversion because: (a) all existing financial calculations, margin computations, and dashboard aggregates already assume USD; (b) no changes to the repository or dashboard layer are required; (c) reports exported or viewed by anyone will always be in a single consistent currency. The original input currency and exchange rate are preserved in order_currency and order_exchange_rate columns purely for audit and display purposes � they are never used for reverse-conversion.
The `if (rate !== 1)` early-exit guard is intentionally absent from the service code. Rate 1.0 is invalid for CAD and is rejected by the validator before reaching the conversion block, so the guard is unnecessary and would create a silent no-op path.

The CAD-to-USD conversion block is applied BEFORE the saleStatus auto-set block in both createOrder and updateOrder. This ordering is mandatory: if the auto-set (which copies orderAmountCharged into orderRefundAmount for Refunded, Chargebacked, and Void statuses) ran first and conversion ran second, the auto-set refundAmount would be multiplied by the rate a second time, producing a double-conversion error.

**D39.2 - Currency and exchange rate are Deal Global fields; child (multi-part) rows always store NULL for both columns**
Consistent with the Deal Global vs. Per-Part distinction established in Decision 32 (saleStatus, orderAmountCharged, orderTotalPitched are Deal Global), order_currency and order_exchange_rate are stored on the parent order row only and are always NULL on child rows. In a multi-part CAD order, the service layer applies the exchange-rate conversion to the vendor price on each child part row (converting the entered CAD vendor price to USD before writing), but does not set order_currency or order_exchange_rate on child rows. Any code reading these fields must source them from the parent order only.

**D39.3 - Monetary fields remain stored as VARCHAR to match existing schema convention; no numeric column type change**
The existing crm_orders monetary fields (order_total_pitched, order_vendor_price, order_amount_charged, order_refund_amount) are all VARCHAR(25). The new order_exchange_rate field follows the same convention: VARCHAR(15). This avoids: (a) a disruptive schema migration that changes existing column types; (b) potential floating-point precision issues from DECIMAL columns interacting with the string-based form layer. The order_currency column is VARCHAR(3) to accommodate ISO 4217 codes ('USD', 'CAD'). Both new columns are nullable with application-level defaults ('USD' for currency, '1' for exchange rate), so all existing rows remain intact without any data backfill.

**D39.4 - Sales Verifier dropdown excludes Super Admin, Admin, HR, and QA roles by role name, not by designation**
The Sales Verifier field is intended for staff whose job it is to review and verify a sale before it is confirmed � typically Team Leads, Managers, and senior Sales staff. Roles that have no involvement in the sales verification workflow (Super Admin, Admin, HR, QA) should not appear in this dropdown. The filter is implemented by including 
ole: { select: { roleName: true } } in the Prisma indMany query for users (in both orders/new/page.tsx and orders/[id]/edit/page.tsx) and then filtering client-side by !EXCLUDED_ROLES.includes(a.role?.roleName ?? ''). Role name was preferred over designation because: (a) designation identifies job title but a Manager-designated user can still have a non-verifier role in edge cases; (b) 
oleName is the canonical RBAC identifier for access control in this system; (c) the four excluded role names are stable enum values from seed.sql that will not change. The EXCLUDED_ROLES constant is defined inline in the dropdown IIFE as ['Super Admin', 'Admin', 'HR', 'QA'].

**D39.5 - Agent repository indAll default sort changed from created-desc to name-asc; client-side sort added as belt-and-suspenders**
The gent.repository.ts indAll function previously sorted by created: 'desc' (newest agents first), which caused dropdown lists to appear in reverse-chronological order � entirely unhelpful for selection. The sort is changed to 
ame: 'asc' at the repository level. Additionally, a client-side .sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name)) is added inside each dropdown rendering IIFE across AddOrderForm.tsx, EditOrderForm.tsx, OrderListContainer.tsx, and AdvancedChartWidget.tsx. The dual-sort approach ensures: (a) the API always returns alphabetically ordered data even for callers that do not sort client-side; (b) dropdowns sort by display name (nickname if set, otherwise name) rather than the raw database 
ame field, which is the label agents actually see. Existing agents page (AgentList.tsx) is unaffected because it uses its own sort controls independent of the repository default.

**D39.6 - Customer name in orders list links to detail page using identical href and same isDisabled access-control gate as the Details button**
Making the customer name clickable provides a larger hit target and a more natural UX for navigating to order details. The link uses href={/orders/} � identical to the existing 'Details' action button. The same isDisabled boolean (which evaluates to 	rue for agents who have orders:create but not orders:view, and who are not the assigned sales agent of that order) is applied: when isDisabled is true, the name renders as a plain <span> rather than a <Link>. This ensures restricted agents cannot access detail pages for orders they do not own, consistent with the existing Details button behaviour.

### Files Changed (Phase 32)
- CONTEXT/current_state.md - Phase 32 added to progress table and full TDD checklist (W-3201 through W-3209)
- CONTEXT/decision_log.md - This entry (D39.1 through D39.6)
- CONTEXT/database_schema.md - orderCurrency and orderExchangeRate added to crm_orders table definition and Prisma schema block
- CONTEXT/project_data.md - Phase 32 notes added
- prisma/schema.prisma - orderCurrency and orderExchangeRate fields added to CrmOrders model
- 1 Prisma migration - add_currency_exchange_rate_to_orders
- src/types/order.ts - orderCurrency and orderExchangeRate added to OrderCreateInput, OrderUpdateInput, OrderRecord
- src/repository/order.repository.ts - new fields in select blocks, create, and updateOrder allowed-fields array
- src/service/order.service.ts - CAD-to-USD conversion logic in createOrder and updateOrder
- src/app/api/orders/route.ts - verify currency fields pass through (if body is destructured)
- src/app/api/orders/[id]/route.ts - verify currency fields pass through in PATCH handler
- src/app/orders/new/page.tsx - role included in users select
- src/app/orders/[id]/edit/page.tsx - role included in users select
- src/components/AddOrderForm.tsx - currency state, UI fields, label suffixes, role filter on Sales Verifier, sort on 4 dropdowns
- src/components/EditOrderForm.tsx - same changes as AddOrderForm
- src/components/OrderList.tsx - customer name wrapped in conditional Link
- src/components/OrderListContainer.tsx - sort added to 3 agent filter dropdowns
- src/components/DealSummarySidebar.tsx - CAD warning note prop
- src/components/FinancialBreakdownCard.tsx - CAD currency badge display
- src/repository/agent.repository.ts - findAll orderBy changed to name asc
- src/components/dashboard/AdvancedChartWidget.tsx - sort added to agent dropdown
- src/tests/orders.test.ts - new integration tests for currency conversion
- src/tests/AddOrderForm.test.tsx - new unit tests for currency UI
- src/tests/EditOrderForm.test.tsx - new unit tests for currency pre-fill and verifier filter

---

## Decision D40 — Call Disposition Module + Follow-Up Status Overhaul

**Date:** July 22, 2026

### Decisions

**D40.1 - `crm_call_dispositions` table has no remarks/notes column by design**
After review, the disposition record captures only the essential call outcome data: phone number, optional customer name, agent identity (auto-set), team snapshot, and the disposition value. A free-text remarks field was explicitly removed from scope. The rationale: the disposition type itself is the primary analytical signal; free-form remarks introduce data inconsistency and add no structured value for reporting or the Excel export. If detailed call notes are needed in the future, that warrants a separate comment or note thread (like `crm_comments`), not a flat text field on this table.

**D40.2 - `customer_phone` is required; `customer_name` is nullable by design**
Every inbound call arrives with a caller ID — the phone number is always known at the moment the call is picked up. Therefore `customer_phone VARCHAR(25) NOT NULL`. Conversely, for dispositions like Wrong Number, Spam Call, No Voice, or Automated Call, the agent never learns who the caller is, so `customer_name VARCHAR(255) NULL`. Forcing a name for every record would produce dirty data (e.g., "Unknown", "N/A"). Allowing it to be nullable produces clean, analytically meaningful NULLs that correctly signal "name not obtained." The UI labels the customer name field "Customer Name (Optional)" and omits it from the POST body if left blank; the service normalises an empty string to NULL before writing to the DB.

**D40.3 - `agent_id`, `agent_name`, and `team_id` are always derived from the session; never trusted from the client**
Mirrors the established pattern from `crm_follow_ups` (D37.1). The service layer reads `session.user.id`, `session.user.nickname || session.user.name`, and `session.user.teamId` and injects these directly into the repository create call. Any `agentId`, `agentName`, or `teamId` fields in the client's POST body are ignored. This prevents agents from logging dispositions under other agents' names. `team_id` is stored as a snapshot — not a live JOIN — so that if an agent is later transferred to another team, historical disposition records correctly reflect their team assignment at the time of the call.

**D40.4 - Excel export is admin-only, gated behind `call-dispositions:view`**
Exporting allows bulk download of all disposition data including agent performance metrics. Agent-level users (`call-dispositions:create` only) are restricted to viewing their own records in the UI; allowing export would trivially bypass this by dumping the entire dataset locally. The export route (`GET /api/call-dispositions/export`) calls `getAllDispositionsForExport()` which checks `call-dispositions:view` and throws `403 Forbidden` if the permission is absent. The "Export to Excel" button is not rendered in the UI for users without `call-dispositions:view`. Both server-side and client-side enforcement are applied.

**D40.5 - Table column order: Date | Customer Phone | Customer Name | Agent Name (admin only) | Disposition | Actions**
`customer_phone` and `customer_name` are displayed as **separate columns**, not stacked in a single cell. This is a deliberate deviation from the Follow-Up and Order list patterns (which stack phone below name). The reason: the Excel export mirrors the table column structure, so stacked cells would produce a combined string in a single export column — unusable for filtering or pivoting in Excel. Separate columns ensure the exported spreadsheet has clean, individually filterable columns: Date (EST), Customer Phone, Customer Name, Agent Name, Disposition. The "Agent Name" column is omitted for agent-level users since they only see their own records.

**D40.6 - Edit disposition opens an in-page modal (portal); list scroll position is preserved automatically**
Following the `OrderCommentsPopup` and `FollowUpNotesPopup` precedent, the Edit disposition modal uses React `createPortal` rendering directly to `document.body` with a `position: fixed` overlay. The list behind it does not move because the portal is inserted outside the DOM flow of the list component. After the modal closes and `fetchDispositions()` re-runs, only React state updates — no full page navigation, no `router.push()`, no `window.scrollTo()`. The scroll position is preserved automatically. This directly addresses the requirement: "when edit button is used, then the list view in the background stays the same, no animation or going to the top."

**D40.7 - Phone number formatting applied in the service layer as a safety net (deviation from D38.4)**
Decision D38.4 established that phone formatting for follow-ups is client-side only (frontend applies `formatPhoneNumber` on `onChange`). For call dispositions, the service layer also applies `formatPhoneNumber(data.customerPhone)` before writing to the database. This is a belt-and-suspenders approach justified by the fact that: (a) this table will be exported to Excel and shared externally — a malformed phone in the export is visible and unprofessional; (b) the data may in future be used for automated dialling or CRM matching, making format consistency critical. The frontend still applies the formatter on `onBlur` for real-time UX feedback, so the server-side call is typically a no-op for well-formed inputs.

**D40.8 - Follow-Up status dropdown updated to 14 values; no migration needed**
The `crm_follow_ups.status` column is `varchar(50)` — it stores plain strings, not a MySQL ENUM. Adding or removing options from the UI dropdown requires no schema change. Removed values (`Wrong Number`, `Spanish`) and added values (`Comparing Prices`, `Needs More Time`, `Price Quoted`, `Waiting for Payment`) only affect the frontend `STATUS_OPTIONS` array in three files. Existing records with the removed values (`Wrong Number`, `Spanish`) are not backfilled — they remain as historical string data and display normally in the list.

### Files Changed (Phase 33)
- CONTEXT/current_state.md — Phase 33 added to progress table
- CONTEXT/project_data.md — `call-dispositions` resource section added (permissions 60 & 61); Phase 33 follow-up status note
- CONTEXT/database_schema.md — Section 5 (`crm_call_dispositions` table schema) and Section 6 (Prisma model) added
- CONTEXT/decision_log.md — This entry (D40.1 through D40.8)
- prisma/schema.prisma — `CrmCallDispositions` model added; reverse relations on `Users` and `CrmTeams`
- 1 Prisma migration — `add_call_dispositions_table`
- seed.sql — Permissions 60 and 61 added; assigned to Super Admin, Admin, and Agent roles
- src/types/callDisposition.ts — New file: types + `DISPOSITION_OPTIONS` constant
- src/repository/callDisposition.repository.ts — New file: findAll, findAll_noLimit, findById, create, update, remove
- src/service/callDisposition.service.ts — New file: all service methods with permission checks and scoping
- src/app/api/call-dispositions/route.ts — New: GET + POST
- src/app/api/call-dispositions/[id]/route.ts — New: GET + PATCH + DELETE
- src/app/api/call-dispositions/export/route.ts — New: GET (Excel download, admin only)
- src/components/AddDispositionModal.tsx — New: portal modal for creating a disposition
- src/components/EditDispositionModal.tsx — New: portal modal for editing a disposition
- src/components/CallDispositionList.tsx — New: table presentation component
- src/components/CallDispositionListContainer.tsx — New: client container with filter/fetch/modal state
- src/app/call-dispositions/page.tsx — New: server page component
- src/middleware.ts — `/call-dispositions` route added with dual-permission handler
- src/components/Sidebar.tsx — Call Dispositions nav link added
- src/components/Navbar.tsx — Call Dispositions nav link added
- src/components/FollowUpListContainer.tsx — STATUS_OPTIONS updated (14 items)
- src/components/AddFollowUpForm.tsx — STATUS_OPTIONS updated (14 items)
- src/components/EditFollowUpForm.tsx — Status dropdown options updated (14 items)
- src/tests/callDispositions.test.ts — New integration tests (23 tests)
- src/tests/CallDispositionList.test.tsx — New component unit tests
- src/tests/AddDispositionModal.test.tsx — New modal unit tests
- src/tests/AddFollowUpForm.test.tsx — Status assertions updated to new list
- src/tests/FollowUpList.test.tsx — Status assertions updated
- src/tests/followup.service.test.ts — Status assertions updated
- src/tests/followups.test.ts — Status assertions updated
