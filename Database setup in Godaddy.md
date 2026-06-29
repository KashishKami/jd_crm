Here is the step-by-step guide to setting up your database on GoDaddy, creating the tables, and connecting your application to it:

### Step 1: Create a New MySQL Database in GoDaddy cPanel
You should create a **fresh, clean database** for the new Next.js CRM to avoid mixing it with the legacy PHP tables (we will import the old data into it later).

1.  Log in to your **GoDaddy** account, open your hosting dashboard, and launch **cPanel**.
2.  In cPanel, look for the **Databases** section and click on **MySQL Database Wizard**.
3.  **Step 1: Create a Database:** Name it something like `jd_crm_new` (e.g., `yourcpaneluser_jd_crm_new`). Click **Next Step**.
4.  **Step 2: Create Database Users:** Choose a database username (e.g., `yourcpaneluser_crm_user`) and a secure password. Write these down. Click **Create User**.
5.  **Step 3: Add User to the Database:** Check the **ALL PRIVILEGES** box to give your user full access, then click **Next Step**.

---

### Step 2: Enable Remote MySQL Connections (Only if deploying on Vercel)
If you host the Next.js app on Vercel or an external server, GoDaddy will block the connection unless you whitelist Vercel:

1.  In cPanel, go back to the home page and click on **Remote MySQL** (under the Databases section).
2.  In the **Add Access Host** field, enter the percentage sign: `%` (this is a wildcard that allows Vercel to connect since Vercel's IP addresses change dynamically).
3.  Click **Add Host**.

---

### Step 3: Get Your GoDaddy Server's IP Address
To connect to the database from outside GoDaddy (like your local computer or Vercel), you need the public IP address of your hosting server:

1.  On the cPanel Home page, look at the right-hand sidebar.
2.  Look for **Shared IP Address** or **Dedicated IP Address** (e.g., `192.168.1.1`). This is your database host.

---

### Step 4: Configure Your Local `.env` and Push the Schema
Now we will use Prisma on your computer to automatically build the 14 new InnoDB tables in your GoDaddy database.

1.  Open your local `.env` file in the project.
2.  Update the `DATABASE_URL` line using your GoDaddy details:
    ```env
    DATABASE_URL="mysql://YOUR_GODADDY_DB_USER:YOUR_GODADDY_DB_PASSWORD@YOUR_GODADDY_SERVER_IP:3306/YOUR_GODADDY_DB_NAME"
    ```
    *(For example: `DATABASE_URL="mysql://jdfusion_crm_user:SecurePass123!@198.12.34.56:3306/jdfusion_jd_crm_new"`)*
3.  Open a terminal in your project directory and run the following command to deploy the tables:
    ```bash
    npx prisma migrate deploy
    ```
    Prisma will connect to GoDaddy and create all the tables with correct column types, engines, and relationships.

---

### Step 5: Seed Baseline Roles, Teams, and the Admin Account
To populate the database with default teams, roles, designations, and the default Super Admin user:

1.  Open [seed.sql](/seed.sql) in your editor and copy its entire contents.
2.  In GoDaddy cPanel, open **phpMyAdmin** and select your new database (`jd_crm_new`).
3.  Click the **SQL** tab at the top.
4.  Paste the contents of `seed.sql` into the text box and click **Go**.
5.  *(Optional)* If phpMyAdmin complains about `USE jd_crm;` at the top of the script, you can remove line 1 of the SQL script and run it again.

Your GoDaddy database is now fully set up, structured, and ready! Let me know when this is done, and we can look at migrating your legacy data or setting up the Vercel hosting.

---

Yes, you can easily delete or clean out the seed data later when you're ready to import your real production database. Here are the ways you can do it:

1.  **Direct SQL Cleanup (Recommended):** When you're ready to switch to your real data, you can run cleanup statements directly in your phpMyAdmin SQL tab to clear the test tables:
    ```sql
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM crm_comments;
DELETE FROM crm_orders;
DELETE FROM crm_customer_cards;
DELETE FROM crm_customers;
DELETE FROM crm_vendors;
DELETE FROM crm_gateway;
DELETE FROM crm_role_permissions;
DELETE FROM crm_permissions;
DELETE FROM crm_attendance;
DELETE FROM users_profile_professional;
DELETE FROM users_profile_academic;
DELETE FROM users_profile;
DELETE FROM users;
DELETE FROM crm_roles;
DELETE FROM crm_teams;
DELETE FROM crm_designations;
DELETE FROM admin;
SET FOREIGN_KEY_CHECKS = 1;


    ```
2.  **Prisma Reset:** During development, you can run `npx prisma migrate reset` in your terminal. This will completely wipe all tables in the database and re-run migrations from scratch.
3.  **Migration Script:** When we write the data import script, we can include a command at the very start to clear the test records automatically before inserting the real data.

---

### Seeding New Accounts
I have updated [seed.sql](/seed.sql) to include a test account for every user role, and successfully pushed the changes to your GitHub repository. 

Here are the usernames and passwords you can use to access the CRM:

| Role Name | Username | Password |
| :--- | :--- | :--- |
| **Super Administrator** | `admin` | `admin123` |
| **Sales Manager** | `manager` | `manager123` |
| **Sales Agent** | `agent` | `agent123` |
| **Verifier** | `verifier` | `verifier123` |

You can copy the contents of the updated `seed.sql` and run them in your GoDaddy phpMyAdmin SQL tab to populate these test accounts!


Use local-to-remote SQL Dump (Fastest): Run the ingestion script locally against your local MySQL Docker container (which takes just seconds because network latency is zero). Once the local database is populated, export a compressed SQL dump file (using mysqldump or phpMyAdmin) and import/run that SQL file directly on your GoDaddy database. This uploads the entire dataset in a single compressed file.