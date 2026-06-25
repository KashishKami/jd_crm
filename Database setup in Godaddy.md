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

1.  Open [seed.sql](file:///c:/Users/Administrator/Desktop/JD%20CRM/seed.sql) in your editor and copy its entire contents.
2.  In GoDaddy cPanel, open **phpMyAdmin** and select your new database (`jd_crm_new`).
3.  Click the **SQL** tab at the top.
4.  Paste the contents of `seed.sql` into the text box and click **Go**.
5.  *(Optional)* If phpMyAdmin complains about `USE jd_crm;` at the top of the script, you can remove line 1 of the SQL script and run it again.

Your GoDaddy database is now fully set up, structured, and ready! Let me know when this is done, and we can look at migrating your legacy data or setting up the Vercel hosting.