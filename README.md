# JD CRM - Next.js TypeScript Monolith

This repository contains the migrated **JD CRM** system, transitioned from a legacy PHP architecture to a modern Next.js TypeScript monolith using Prisma ORM (v7) and MySQL.

---

## 1. Local Environment Setup

To get your database, environment variables, migrations, and seeds set up locally, please refer to the detailed:
👉 **[Local Environment Setup Guide](local_setup.md)**

---

## 2. Development Commands

Once your local database and environment are set up, use the following commands to run the application:

### Run Development Server
Starts the Next.js App Router server on port `3080`:
```bash
npm run dev -- -p 3080
```
Visit the application locally at `http://127.0.0.1:3080`.

### Build for Production
Compiles the application for production deployment:
```bash
npm run build
```

### Start Production Server
Runs the compiled production application:
```bash
npm run start
```

---

## 3. Code Quality & Testing

We use strict typechecking, linting, and automated tests to ensure correctness and maintainability.

### Run Linter (ESLint)
Checks for code style, potential issues, and Next.js best practices:
```bash
npm run lint
```

### Run Typechecker (TypeScript compiler)
Runs a full compile-time type validation of the codebase without generating output files:
```bash
npm run typecheck
```

### Run Automated Tests (Vitest)
Executes the integration and unit tests suite:
```bash
npm run test
```

---

## 4. Key Architectural Decisions

*   **Three-Layer Architecture**:
    1. **Repository Layer (`src/repository/`)**: Houses raw database access via Prisma.
    2. **Service Layer (`src/service/`)**: Contains encapsulated business logic.
    3. **Controller/API Layer (`src/app/api/` & Server Actions)**: Handles request/response mapping and NextAuth session extraction.
*   **Prisma 7 & Driver Adapters**: We utilize `@prisma/adapter-mariadb` combined with a MySQL connection pool for modern query execution.
*   **Relation Mode**: Enforces InnoDB foreign key constraints at the database level.
