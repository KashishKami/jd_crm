# Next.js CRM — Hostinger VPS Deployment Guide
# (With CI/CD Pipeline + DNS Setup for `crm.jdfusion.in`)

This guide takes you from zero to a fully deployed CRM on a **Hostinger VPS** with automatic deployments every time you push code to GitHub. Your GoDaddy database and domain (`jdfusion.in`) stay exactly as they are.

> **Who is this for?** Complete beginners. Every step is explained. Every command is shown. Nothing is assumed.

---

## 🗺️ What We Are Building

```
You push code to GitHub
        ↓
GitHub Actions runs automatically
        ↓
Logs into your Hostinger VPS via SSH
        ↓
Pulls new code, rebuilds app, restarts server
        ↓
Your app is live at crm.jdfusion.in (HTTPS ✅)
        ↓
crm.jdfusion.in → your VPS IP (via GoDaddy DNS A Record)
        ↓
Hostinger VPS runs Next.js → connects to GoDaddy MySQL
```

---

## 📍 Which Data Center to Choose?

You are in India, and this is an **internal CRM** used by your team (not public visitors worldwide). You have two competing considerations:

| Location | Your team (India) gets | GoDaddy DB gets |
|---|---|---|
| **Mumbai, India** | ⚡ Fast — 5–20ms | 🐢 ~200ms to GoDaddy US |
| **US East (Virginia)** | 🐢 ~180ms | ⚡ Fast — 30–50ms to GoDaddy |

**Our recommendation: Mumbai.** Your agents use the CRM all day. Their experience (fast page loads) matters more than the DB round-trip, which we reduce significantly with caching (W-1703). On top of this, with 100 users on an internal tool, the caching means the DB is not hit on every single page load anyway.

---

## PART 1 — Get Your Hostinger VPS

### Step 1: Purchase a Hostinger VPS Plan

1. Go to [hostinger.in](https://www.hostinger.in/vps-hosting) (or hostinger.com).
2. Select the **KVM 1** plan to start (sufficient for 100 CRM users):

   | Plan | vCPU | RAM | Storage | Price |
   |---|---|---|---|---|
   | **KVM 1** ← start here | 1 Core | 4 GB | 50 GB NVMe | ~₹1,649/mo |
   | **KVM 2** (upgrade later) | 2 Cores | 8 GB | 100 GB NVMe | ~₹3,299/mo |

   > ⚠️ **Important:** Hostinger's promotional pricing is for the first billing term. **Check the renewal price** before committing — it is often double the promo price.

3. During checkout, you will be asked to configure the VPS:
   - **Operating System:** Select **Ubuntu 22.04** (64-bit).
   - **Data Center Location:** Select **Mumbai** (India).
   - **Server Name:** Call it `jd-crm`.
   - **Root Password:** Set a strong password here. Write it down — you need it once in the next step.

4. Complete payment. Hostinger will provision your server within **1–5 minutes**.

---

### Step 2: Find Your VPS IP Address in hPanel

1. Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com).
2. Click **VPS** in the top navigation.
3. You will see your `jd-crm` server listed with its **IPv4 address** — something like `37.60.xxx.xxx`.
4. **Write this IP down.** You will use it in many places throughout this guide.

---

### Step 3: Create an SSH Key on Your Windows Machine

An SSH key is a secure digital lock-and-key system. The key on your laptop opens the door to your server — no password needed, and it's much more secure.

Open **PowerShell** on your Windows machine and run:

```powershell
ssh-keygen -t ed25519 -C "jd-crm-deploy"
```

- **"Where to save it?"** → Press **Enter** to accept the default (`C:\Users\Administrator\.ssh\id_ed25519`).
- **"Enter passphrase?"** → Press **Enter** twice (no passphrase — required for automated CI/CD).

This creates two files:
- `C:\Users\Administrator\.ssh\id_ed25519` ← **Private key** — never share this with anyone
- `C:\Users\Administrator\.ssh\id_ed25519.pub` ← **Public key** — this goes on Hostinger

**Copy your public key:**

```powershell
Get-Content C:\Users\Administrator\.ssh\id_ed25519.pub
```

Copy the entire line that appears (it starts with `ssh-ed25519 AAAA...`).

---

### Step 4: Add Your SSH Key to Hostinger hPanel

1. In [hpanel.hostinger.com](https://hpanel.hostinger.com), click **VPS** → select your server.
2. In the left sidebar, click **Settings** → then click the **SSH Keys** tab.
3. Click **Add SSH Key**.
4. Paste the public key text you copied. Give it the name `my-laptop`. Click **Add**.

Hostinger will immediately authorize this key on your server. From now on, you can log in without a password.

---

### Step 5: Log Into Your Server for the First Time

Open PowerShell and run (replace with your actual IP):

```powershell
ssh root@37.60.xxx.xxx
```

> If it asks `Are you sure you want to continue connecting (yes/no)?` → type `yes` and press Enter.

You are now inside your Hostinger VPS. The prompt will look like `root@srv-xxx:~#`. Every command you type here runs on the remote server in Mumbai — not on your own computer.

> **Alternative:** If SSH doesn't work yet, Hostinger hPanel has a built-in **Browser Terminal**. In hPanel → VPS → your server → click **Terminal** (or "Browser SSH") in the left sidebar. Use your root password to log in there as a backup.

---

## PART 2 — Set Up the Server

### Step 6: Update the Server and Install Node.js

Copy, paste, and run each block. Wait for it to finish before running the next:

```bash
# Update the package list and upgrade all existing software
apt update && apt upgrade -y
```

```bash
# Install Node.js version 20 (Long-Term Support)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

```bash
# Verify installation — should print v20.x.x and 10.x.x
node --version
npm --version
```

---

### Step 7: Install PM2 (Process Manager)

PM2 is a background process manager. It keeps your Next.js app running 24/7. If it crashes, PM2 restarts it automatically. If the server reboots, PM2 starts your app again automatically.

```bash
npm install -g pm2
```

---

### Step 8: Install Nginx (Web Server)

Nginx is a web server that sits in front of your Next.js app. It receives all incoming traffic on port 80 (HTTP) and 443 (HTTPS) and passes it through to your app running on port 3000.

```bash
apt install -y nginx

# Start Nginx and enable it to run automatically on reboot
systemctl start nginx
systemctl enable nginx
```

**Test it:** Open your browser and go to `http://37.60.xxx.xxx` (your VPS IP). You should see a plain **"Welcome to nginx!"** page. That confirms Nginx is working.

---

### Step 9: Set Up a Firewall

Ubuntu has a built-in firewall called UFW. We need to allow web traffic through it:

```bash
# Allow SSH (so you can still log in), HTTP, and HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'

# Enable the firewall
ufw enable

# Check status — should show OpenSSH, Nginx HTTP, Nginx HTTPS as "ALLOW"
ufw status
```

---

### Step 10: Install Certbot (Free SSL / HTTPS)

Certbot automatically gets a free HTTPS certificate from Let's Encrypt, so your site shows the green padlock — same as it did on Vercel.

```bash
apt install -y certbot python3-certbot-nginx
```

> We will actually run Certbot later in Step 16, after the domain is pointed to this server.

---

### Step 11: Create a Deploy User (Security Best Practice)

Running everything as `root` is dangerous. We create a separate, limited user called `deploy` for running the app.

```bash
# Create the deploy user
adduser --disabled-password --gecos "" deploy

# Give deploy user sudo access
usermod -aG sudo deploy

# Copy your SSH key to the deploy user
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

**Test it — open a new PowerShell window and run:**

```powershell
ssh deploy@37.60.xxx.xxx
```

You should log in without any password prompt. Type `exit` to come back. From now on, the `deploy` user is what GitHub Actions will use.

---

### Step 12: Clone Your Project onto the Server

You should now be logged in as `deploy`. Run:

```bash
# Create the apps directory
mkdir -p /home/deploy/apps
cd /home/deploy/apps

# Clone your GitHub repository (replace with your actual GitHub username)
git clone https://github.com/YOUR_GITHUB_USERNAME/jd-crm.git

# Enter the project
cd jd-crm
```

---

### Step 13: Create the `.env` File on the Server

Your `.env` file is never uploaded to GitHub (it's in `.gitignore`). You must create it manually on the server with your real credentials.

```bash
nano /home/deploy/apps/jd-crm/.env
```

This opens a simple text editor. Type your environment variables (same as your Vercel setup):

```env
DATABASE_URL="mysql://YOUR_GODADDY_DB_USER:YOUR_GODADDY_DB_PASSWORD@YOUR_GODADDY_SERVER_IP:3306/YOUR_GODADDY_DB_NAME"
NEXTAUTH_SECRET="SmzBJCEaECrtQbgYXZTQg194XSFnD9L2Lh7tm3soYd0="
NEXTAUTH_URL="https://crm.jdfusion.in"
NODE_ENV="production"
```

**How to use nano:**
- Type your content normally.
- When done: press `Ctrl + X` → press `Y` → press `Enter`. File is saved.

---

### Step 14: Build and Start the App

```bash
cd /home/deploy/apps/jd-crm

# Install all npm packages
npm install

# Build the production Next.js bundle (takes 1–3 minutes)
npm run build

# Start the app with PM2
pm2 start npm --name "jd-crm" -- start

# Save PM2's process list (so it survives reboots)
pm2 save

# Register PM2 to start automatically when the server reboots
pm2 startup
```

> ⚠️ The `pm2 startup` command will print a long line starting with `sudo env PATH=...`. **Copy that entire line and run it** — this is what registers PM2 with Ubuntu's boot system.

**Verify the app is running:**

```bash
pm2 status
# You should see: jd-crm | online | ...

# Quick test — if this prints HTML, your app is live on port 3000
curl http://localhost:3000
```

---

### Step 15: Configure Nginx as a Reverse Proxy

We tell Nginx to forward traffic from port 80 to your app on port 3000.

```bash
# Create a config file for your site
nano /etc/nginx/sites-available/jd-crm
```

Paste this **entire block** (change `crm.jdfusion.in` only if you use a different subdomain):

```nginx
server {
    listen 80;
    server_name crm.jdfusion.in;

    # Increase max upload size (for profile images, documents, etc.)
    client_max_body_size 20M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

```bash
# Enable the site
ln -s /etc/nginx/sites-available/jd-crm /etc/nginx/sites-enabled/

# Test that the config file has no syntax errors
nginx -t
# Expected output: "configuration file ... syntax is ok" and "test is successful"

# Apply the new config
systemctl reload nginx
```

---

## PART 3 — Connect Your Domain (GoDaddy DNS)

### Step 16: Add an A Record in GoDaddy DNS

This is the equivalent of the DNS step in the Vercel Setup Guide. Instead of a `CNAME` pointing to Vercel, you add an `A` record pointing directly to your VPS IP.

1. Log in to your **GoDaddy** account.
2. Go to **My Products** → find `jdfusion.in` → click **DNS** (or "Manage DNS").
3. Click **Add New Record**.
4. Fill in:

   | Field | Value to Enter |
   |---|---|
   | **Type** | `A` |
   | **Name (Host)** | `crm` |
   | **Value (Points to)** | `37.60.xxx.xxx` ← your Hostinger VPS IP |
   | **TTL** | `1 Hour` (or `3600`) |

5. Click **Save**.

> **What is an A record?** It tells the entire internet: "When someone visits `crm.jdfusion.in`, send them to IP `37.60.xxx.xxx`." This is different from the `CNAME` you used with Vercel (which pointed to Vercel's domain name). With a VPS, you point directly to the IP address.

> **DNS propagation time:** Changes spread across the internet in 5 minutes to 48 hours — usually under 30 minutes. You can check live progress at [dnschecker.org](https://dnschecker.org) — search for `crm.jdfusion.in` and look for your Hostinger IP appearing worldwide.

---

### Step 17: Enable HTTPS with a Free SSL Certificate

**Wait until `crm.jdfusion.in` resolves to your VPS IP** (check on dnschecker.org first). Then on your server, run:

```bash
certbot --nginx -d crm.jdfusion.in
```

Certbot will walk you through a simple setup:
1. **Enter your email address** — for important renewal alerts.
2. **Agree to Terms of Service** → press `A`.
3. **Share email with EFF?** → press `N`.

Certbot automatically:
- Gets a free SSL certificate from Let's Encrypt.
- Updates your Nginx config to handle HTTPS on port 443.
- Redirects all HTTP traffic to HTTPS.
- Installs a cron job to renew the certificate automatically every 60 days.

When done, open `https://crm.jdfusion.in` in your browser. You should see your CRM login page with a padlock — **exactly like Vercel did**.

---

### Step 18: (Optional) Redirect Old `jdfusion.in/crm` to New URL

Same as in the Vercel Setup Guide — this redirects old bookmarks to the new address:

1. Log in to GoDaddy cPanel → File Manager → find the `crm/` folder.
2. Create or edit `.htaccess` inside that folder:

```apache
RewriteEngine On
RewriteRule ^(.*)$ https://crm.jdfusion.in/$1 [R=301,L]
```

This ensures anyone going to the old `jdfusion.in/crm` URL gets redirected to `crm.jdfusion.in` automatically.

---

## PART 4 — CI/CD Pipeline (Auto-Deploy on Git Push)

Every time you push code to GitHub's `main` branch, GitHub Actions will automatically log into your Hostinger VPS, pull the new code, rebuild the app, and restart it. Zero manual steps — same experience as Vercel.

### Step 19: Add Secrets to Your GitHub Repository

GitHub Actions needs your private SSH key to log into the server. Here's how to give it that securely.

**Get your private key on Windows:**

```powershell
Get-Content C:\Users\Administrator\.ssh\id_ed25519
```

Copy the **entire output** — from `-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END OPENSSH PRIVATE KEY-----` (including those header lines).

**Add secrets on GitHub:**

1. Go to your `jd-crm` repository on GitHub.
2. Click **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
3. Add these three secrets one by one:

   | Secret Name | Value |
   |---|---|
   | `VPS_HOST` | `37.60.xxx.xxx` (your Hostinger VPS IP) |
   | `VPS_USER` | `deploy` |
   | `VPS_SSH_KEY` | The entire private key content you copied (including BEGIN/END lines) |

---

### Step 20: Create the GitHub Actions Workflow File

On your **local Windows machine**, create this file and folder structure:

**Create the folder** (if it doesn't exist):
```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\Administrator\Desktop\JD CRM\.github\workflows"
```

**Create the file** `C:\Users\Administrator\Desktop\JD CRM\.github\workflows\deploy.yml` with this content:

```yaml
name: Deploy to Hostinger VPS

# Trigger: runs every time you push to the main branch
on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest   # GitHub provides a temporary Linux machine to run this

    steps:
      # 1. Download your latest code onto GitHub's machine
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Set up Node.js on GitHub's machine
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # 3. Install packages and type-check (catches broken code BEFORE it touches production)
      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      # 4. SSH into your Hostinger VPS and deploy the new code
      - name: Deploy to Hostinger VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            # Move to the project folder
            cd /home/deploy/apps/jd-crm

            # Pull the latest code from GitHub
            git pull origin main

            # Install any new or updated packages
            npm ci

            # Apply any pending database migrations (safe — only runs new ones)
            npx prisma migrate deploy

            # Rebuild the production app
            npm run build

            # Reload the app with zero downtime (new version starts before old one stops)
            pm2 reload jd-crm --update-env

            # Save the process list
            pm2 save

            echo "✅ Deployment to Hostinger complete!"
```

> **What is `npm ci`?** It installs exactly what's in your `package-lock.json` — fast and reproducible. Always use it in automated pipelines.

> **What is `pm2 reload` vs `pm2 restart`?** `reload` does a zero-downtime swap — starts the new version before killing the old one. Your agents won't see any interruption.

---

### Step 21: Commit the Workflow and Test Everything

On your local machine:

```powershell
cd "C:\Users\Administrator\Desktop\JD CRM"
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deployment pipeline to Hostinger VPS"
git push origin main
```

**Watch it run:**
1. Go to your GitHub repository → click the **Actions** tab at the top.
2. A new workflow run called `Deploy to Hostinger VPS` will appear within seconds.
3. Click on it to see the live log — every step printed in real time.
4. The full process takes about **2–4 minutes**.
5. ✅ Green checkmark = successful deployment. ❌ Red X = something failed — click the failed step to see the error message.

**After it succeeds:** Open `https://crm.jdfusion.in` — your latest code is live.

---

## PART 5 — Day-to-Day Operations

### Checking If Your App Is Running

SSH into the server (`ssh deploy@37.60.xxx.xxx`) and run:

```bash
# See all running apps and their status
pm2 status

# View the last 100 lines of your app's logs
pm2 logs jd-crm --lines 100

# Watch logs live (Ctrl+C to stop)
pm2 logs jd-crm
```

---

### Restarting the App Manually

```bash
# Graceful restart (zero downtime)
pm2 reload jd-crm

# Force restart (1–2 second gap, use only if reload fails)
pm2 restart jd-crm
```

---

### Updating Environment Variables

If you need to change something in `.env` (e.g., a new DB password):

```bash
ssh deploy@37.60.xxx.xxx
nano /home/deploy/apps/jd-crm/.env
# Edit your value → Ctrl+X, Y, Enter to save
pm2 reload jd-crm --update-env
# The --update-env flag re-reads the .env file on reload
```

---

### Manual Deploy (Without a Git Push)

If you need to deploy manually from the server for any reason:

```bash
ssh deploy@37.60.xxx.xxx
cd /home/deploy/apps/jd-crm
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 reload jd-crm --update-env
```

---

### Viewing Nginx Logs

```bash
# See every request being made to your server
sudo tail -f /var/log/nginx/access.log

# See any Nginx errors
sudo tail -f /var/log/nginx/error.log
```

---

### Checking Disk and Memory Usage

```bash
# Disk usage
df -h

# Memory usage
free -h

# CPU and memory by process (press q to quit)
htop
```

---

### Renewing SSL Certificates (Usually Automatic)

Certbot auto-renews every 60 days. If you ever need to check or force renewal:

```bash
# Dry-run (test renewal without actually doing it)
sudo certbot renew --dry-run

# Force immediate renewal
sudo certbot renew
```

---

## 📊 Comparison: Vercel Free → Hostinger VPS

| | Vercel Free (old) | Hostinger KVM 1 (new) |
|---|---|---|
| **Monthly cost** | ₹0 | ~₹1,649/mo |
| **Process model** | Serverless — restarts per request | Persistent — always on |
| **Connection pool** | Broken under concurrent users | Stable — 5 connections shared |
| **Cold starts** | 200–500ms per request | None — server is always warm |
| **Auto-deploy on push** | ✅ Built in | ✅ GitHub Actions (Step 20) |
| **HTTPS / SSL** | ✅ Auto (Vercel) | ✅ Auto (Let's Encrypt) |
| **Custom domain DNS** | CNAME → Vercel | A Record → Hostinger IP |
| **GoDaddy database** | Unchanged | Unchanged |
| **100 users** | ❌ Connection exhaustion | ✅ Handles comfortably |
| **Server location** | Vercel US-East | Mumbai, India |
| **Log access** | Vercel dashboard | `pm2 logs` on server |

---

## ❓ Troubleshooting

### App not loading / `pm2 status` shows "errored"
```bash
# Check what the error is
pm2 logs jd-crm --lines 50

# Common fix: .env file missing or wrong value
cat /home/deploy/apps/jd-crm/.env

# Restart after fixing
pm2 restart jd-crm
```

### `crm.jdfusion.in` shows a blank page or old PHP site
- DNS hasn't propagated yet. Check at [dnschecker.org](https://dnschecker.org).
- Confirm the `A` record in GoDaddy DNS points to your **Hostinger** IP (not an old Vercel CNAME).

### HTTPS certificate error ("Not secure" in browser)
- Only run `certbot` **after** DNS has fully propagated to your VPS IP.
- If you ran it too early, wait 30 minutes and run `sudo certbot --nginx -d crm.jdfusion.in` again.

### GitHub Actions deployment fails
1. Click the ❌ failed step in the Actions tab to see the error.
2. **"Permission denied (publickey)"** → Your `VPS_SSH_KEY` secret is incomplete. Re-copy the private key — it must include the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines.
3. **"Connection refused"** → Check `VPS_HOST` secret is the correct Hostinger IP address.
4. **"npm run build failed"** → There's a code error. Fix it locally (`npm run build` locally) before pushing.

### Database connection refused from VPS
- Log in to GoDaddy cPanel → **Remote MySQL** → confirm `%` (wildcard) is in the Access Host list.
- The VPS IP will be different from Vercel's IPs, but the `%` wildcard already allows all IPs.
- Double-check `DATABASE_URL` in `/home/deploy/apps/jd-crm/.env` is correct.

### Hostinger VPS is unreachable
- Log in to [hpanel.hostinger.com](https://hpanel.hostinger.com) → VPS → your server.
- Check if the server shows as **Running**. If stopped, click **Start**.
- Use Hostinger's built-in **Browser Terminal** (in hPanel) as an emergency backup to access the server without SSH.
