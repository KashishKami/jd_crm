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
