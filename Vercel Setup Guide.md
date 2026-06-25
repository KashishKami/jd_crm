# Next.js CRM Vercel Deployment Guide

Follow these steps to deploy your Next.js CRM application to Vercel and connect it to your GoDaddy database.

---

## Step 1: Push Your Code to GitHub
Vercel deploys directly from a git repository. Every time you push a change to GitHub, Vercel will automatically redeploy the application.

1. Create a **private** repository on [GitHub](https://github.com) named `jd-crm`.
2. Open a terminal in your project directory (`c:\Users\Administrator\Desktop\JD CRM`) and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/jd-crm.git
   git push -u origin main
   ```

---

## Step 2: Import the Project to Vercel
1. Log in to [Vercel](https://vercel.com) using your GitHub account.
2. On your Vercel Dashboard, click **Add New...** and select **Project**.
3. Under **Import Git Repository**, find your `jd-crm` repository and click **Import**.

---

## Step 3: Configure Project Settings & Environment Variables
Vercel automatically detects that your project is a **Next.js** application. You do not need to change the Build and Output settings.

1. Scroll down to the **Environment Variables** section.
2. Add the following variables from your local `.env` file:

   *   **`DATABASE_URL`**: 
       *   **Value:** `mysql://YOUR_GODADDY_DB_USER:YOUR_GODADDY_DB_PASSWORD@YOUR_GODADDY_SERVER_IP:3306/YOUR_GODADDY_DB_NAME`
       *   *(Use the URL-encoded password format if it contains special characters).*
   
   *   **`NEXTAUTH_SECRET`**:
       *   **Value:** `SmzBJCEaECrtQbgYXZTQg194XSFnD9L2Lh7tm3soYd0=` *(or copy it from your local `.env`)*
   
   *   **`NEXTAUTH_URL`**:
       *   **Value:** `https://your-custom-subdomain.jdfusion.in` *(or the custom URL you plan to use)*

3. Click **Deploy**. Vercel will now compile, build, and deploy the application. Once done, it will give you a temporary deployment URL (e.g., `https://jd-crm-xyz.vercel.app`).

---

## Step 4: Configure Your Domain on GoDaddy
To replace the old PHP site running under `jdfusion.in/crm`, we recommend pointing a subdomain like **`crm.jdfusion.in`** to your new Vercel app.

1.  In your **Vercel Project Dashboard**, go to **Settings** -> **Domains**.
2.  Add **`crm.jdfusion.in`** (or your preferred domain) and click **Add**.
3.  Vercel will show you the DNS records you need to add to GoDaddy:
    *   **Record Type:** `CNAME`
    *   **Name (Host):** `crm`
    *   **Value (Points to):** `cname.vercel-dns.com`
    *   **TTL:** `1 Hour` (or default)
4.  Log in to your **GoDaddy** account, go to your **Domain Portfolio**, and open the **DNS Settings** for `jdfusion.in`.
5.  Add the `CNAME` record with the values provided by Vercel.
6.  Once added, go back to Vercel and wait for the status to update to **Active**. Vercel will automatically provision a free SSL certificate (HTTPS) for your site.

---

## Step 5: (Optional) Redirecting `jdfusion.in/crm` to `crm.jdfusion.in`
Since the old PHP CRM was located in a subdirectory (`jdfusion.in/crm`) and the new one is on a subdomain (`crm.jdfusion.in`):

1.  Log in to GoDaddy cPanel.
2.  Go to the file manager or delete the old PHP files inside the `crm/` directory.
3.  Create or edit the `.htaccess` file inside the `crm/` folder of your legacy GoDaddy file manager to redirect users to the new domain:
    ```apache
    RewriteEngine On
    RewriteRule ^(.*)$ https://crm.jdfusion.in/$1 [R=301,L]
    ```
    This redirects any old bookmarks or history links to the new Next.js site.
