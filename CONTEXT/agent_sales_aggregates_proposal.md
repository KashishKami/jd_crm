# Proposal & Specification: Agent Sales Aggregates Page

> **Status:** Pending Client Approval & UI Design  
> **Document Purpose:** Record all architectural decisions, requirements, edge cases, and user flow reasoning discussed for the upcoming Agent Sales Aggregates page.

---

## 1. Executive Summary & Goal

The **Agent Sales Aggregates Page** is a dedicated analytical view designed to provide supervisors and managers with granular, aggregated sales metrics grouped by agent. 

It bridges the gap between high-level dashboard summaries and raw individual order records, allowing stakeholders to evaluate agent performance across customizable date ranges and teams, with seamless click-through drill-down into raw order records.

---

## 2. Core Functional Requirements

### A. Multi-Select Agent Filter
- **Dynamic Selection:** Users can filter by one, multiple, or all agents simultaneously.
- **Select All / Clear All:** Quick action controls to toggle all available agents.
- **Dynamic Team Scoping:**
  - Selecting a **Team** dynamically filters the Agent multi-select dropdown to display only active sales agents belonging to that team.
  - When the team selection changes, any selected agents who do not belong to the newly selected team are automatically deselected.
  - Clearing the Team filter restores the full list of active sales agents across all teams.

### B. Date Range & Status Filtering
- **Date Range Picker:** Start Date (`dateFrom`) and End Date (`dateTo`) filters operating on calendar date boundaries without timezone leakage.
- **Preset Shortcuts:** Quick presets for *Today*, *This Week*, *This Month*, *Last Month*, *This Quarter*, *This Year*, and *Custom Range*.
- **Sale Status Filtering:** Ability to filter aggregated numbers by specific sale statuses (e.g., Sold, Refunded, Chargebacked, Void, Partially Refunded).

### C. Aggregated Metric Cards & Data Table
- **Metrics Calculated Per Agent:**
  - **Gross Volume / Total Pitched ($):** Sum of pitched amounts.
  - **Gross Charged ($):** Total amount charged before refunds.
  - **Refunds & Disputes ($ & Count):** Total refunded and chargebacked orders/amounts.
  - **Net Sales Margin ($):** `Charged Amount - Refund Amount`.
  - **Units Sold (Count):** Total closed orders.
  - **Average Ticket Size ($):** `Net Sales / Units Sold`.
  - **Conversion / Closing Rate (%):** Ratio of closed orders to total leads/follow-ups (if integrated).

---

## 3. Drill-Down & Navigation Architecture

### A. Click-Through Navigation to Orders
- Every aggregated metric value (e.g., clicking on an agent's "Units Sold", "Refund Count", or "Total Net Sales") is an interactive link.
- Clicking any value navigates the user directly to `/orders` with all relevant filters pre-applied via URL query parameters:
  - `agentId`: Selected agent's ID.
  - `teamId`: Selected team ID (if filtered).
  - `dateFrom` & `dateTo`: Exact date range from the aggregates page.
  - `saleStatus`: Relevant status filter (e.g., clicking *Leakage/Refunds* applies `saleStatus=2,3`).

### B. Deterministic State & Scroll Preservation (Back-Button Support)
- **Problem Statement:** When a supervisor is reviewing agent aggregates, clicks into an agent's orders, reviews an order, and presses the browser **Back** button, they must return to the exact same filter state, multi-select choices, and scroll position on the Aggregates page.
- **Solution:**
  - Leverage the universal `sessionStorage` state persistence system established in **Phase 34** (`src/lib/urlStateHelper.ts`).
  - Active filters (selected agents, team, date range, table sort column/direction) and scroll position are synchronized with session storage.
  - Restores state cleanly upon backward navigation without flashing default state.

---

## 4. Technical & Architectural Blueprint

### A. Backend Query Strategy
- Push all aggregations to MySQL via `$queryRaw` / SQL `GROUP BY o.order_sales_agent_id` rather than loading thousands of individual order rows into Node.js memory.
- Use strict `@db.Date` boundaries matching the Phase 43 standard (`toUtcNoonDate`).

### B. Permissions & Access Control
- Permission Code: `dashboard:agent-aggregates` or `orders:view-aggregates`.
- Role-based scoping:
  - Super Admin / Sales Manager: Can view all teams and all agents.
  - Team Lead / Supervisor: Automatically scoped to agents within their own team (`teamId = sessionUser.teamId`).

---

## 5. Next Steps for Implementation
1. Finalize UI wireframes and visual design with client.
2. Confirm permission code naming and RBAC assignment.
3. Schedule implementation phase following the project's standard TDD instruction guide.
