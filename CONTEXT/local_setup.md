# Local Environment Setup Guide

This document describes how to configure and run the project and its database locally after cloning the repository.

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine + Compose (Linux).
*   Node.js 18+ (for running Next.js & Prisma).
*   A MySQL client (optional, such as DBeaver or TablePlus for database browsing).

---

## 2. Installation & Setup Sequence

Follow these steps in the exact sequence specified:

### Step 1: Install Dependencies
Run the following command in the project root to install the required packages (including Next.js, Prisma 7, and MariaDB drivers):
```bash
npm install
```

### Step 2: Configure Environment Variables
1. Copy the `.env.example` template to create your `.env` file:
   ```bash
   cp .env.example .env
   ```
2. Generate a secure random string for `NEXTAUTH_SECRET`. You can generate one via terminal using `openssl`:
   ```bash
   openssl rand -base64 32
   ```
   *If you do not have openssl, you can use any online secure random generator or run this Node command:*
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
3. Update the `.env` file with the generated key:
   ```env
   # Database Connection String
   DATABASE_URL="mysql://crm_user:crm_password@127.0.0.1:3306/jd_crm"

   # NextAuth secrets
   NEXTAUTH_SECRET="<YOUR_GENERATED_SECRET_HERE>"
   NEXTAUTH_URL="http://127.0.0.1:3080"
   ```
> [!NOTE]
> On Windows host machines, using `127.0.0.1` instead of `localhost` in `DATABASE_URL` and `NEXTAUTH_URL` prevents host resolution timeouts.

### Step 3: Start the Docker Database Container
Run the following command to start the MySQL 8.0 database container in the background:
```bash
docker compose up -d
```
Verify the container is running:
```bash
docker ps
# You should see: jd_crm_db  ...  Up  ...
```

### Step 4: Run Database Migrations
Generate the database schema and foreign key relations using Prisma:
```bash
npx prisma migrate dev --name init_jd_crm_schema
```
This command reads the configuration in `prisma.config.ts`, formats the database, and creates all tables under InnoDB with correct foreign key constraints.

### Step 5: Seed the Database
To log in, the database must be seeded with baseline roles, designations, teams, and the default administrator account.

The `seed.sql` script is already provided in the project root directory. Run the appropriate command below for your operating system:

*   **On Windows (PowerShell):**
    ```powershell
    Get-Content "seed.sql" | docker exec -i jd_crm_db mysql -u root -proot_password jd_crm
    ```
*   **On Linux / macOS (Bash):**
    ```bash
    docker exec -i jd_crm_db mysql -u root -proot_password jd_crm < seed.sql
    ```

---

## 3. Verifying the Setup

### Run Integration Tests
Run the test suite to verify that the application successfully connects to the database and can query the seeded data:
```bash
npx vitest run src/tests/db_connection.test.ts
```

#### Isolated Testing Environment
To prevent test data from polluting your local development database (`jd_crm`), the test suite runs in full database isolation:
*   **Environment Configuration**: Create your test environment file by copying the template:
    ```bash
    cp .env.test.example .env.test
    ```
    The `.env.test` file is configured with the database URL `mysql://root:root_password@127.0.0.1:3306/jd_crm_test`.
    > [!NOTE]
    > **Why root user?** The default development user (`crm_user`) only has authorization for the `jd_crm` database and cannot create new database schemas. The test database connection uses the database superuser (`root`) so that the test runner's setup script has sufficient privileges to automatically create the `jd_crm_test` schema.
*   **Automatic Setup (`src/tests/globalSetup.ts`)**: When Vitest starts, it automatically ensures the `jd_crm_test` database exists on the same local container, synchronizes the Prisma schema structures via `db push`, and executes `seed.sql` to populate baseline roles and admin accounts.
*   **Automatic Teardown**: After all tests complete, the global setup handler connects to the test database and truncates all dynamic tables, leaving the test database fully clean.

### Run the Development Server
Since we have configured the app to run on port `3080`, start the Next.js development server on this port:
```bash
npm run dev -- -p 3080
```
Open [http://127.0.0.1:3080](http://127.0.0.1:3080) in your browser. You can log in using the seeded Super Admin credentials:
*   **Username:** `admin`
*   **Password:** `admin123`

---

## 4. Troubleshooting

### Port 3306 is already in use
If another MySQL instance is running on your host machine:
1. Stop the local MySQL service.
2. Or change the host port mapping in `docker-compose.yml` to `"3307:3306"` and update the `DATABASE_URL` in your `.env` file to use `127.0.0.1:3307`.

### Prisma Client Type Errors
If you modify the database schema in `prisma/schema.prisma` in the future, regenerate the Prisma Client types:
```bash
npx prisma generate
```
