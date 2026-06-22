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
