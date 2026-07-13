# JD CRM — VPS Deployment Guide
### A Beginner-Friendly, Step-by-Step Guide to Deploying JD CRM on Hostinger VPS

> **Context:** Your Hostinger VPS already runs other applications (including JD Connect) behind a Traefik reverse proxy. This guide keeps JD CRM in its **own isolated Docker network** so it cannot interfere with those existing applications. Every command and file is written specifically for this project.

---

## Table of Contents

0. [How the Whole System Works](#0-how-the-whole-system-works)
1. [Phase 1 — Run JD CRM Locally in Docker](#phase-1--run-jd-crm-locally-in-docker)
   - 1.1 [Create the Dockerfile](#11-create-the-dockerfile)
   - 1.2 [Update docker-compose.yml for Full-Stack Local Dev](#12-update-docker-composeyml-for-full-stack-local-dev)
   - 1.3 [Create the Production docker-compose](#13-create-the-production-docker-compose-file)
   - 1.4 [Test Locally in the Container](#14-test-locally-in-the-container)
2. [Phase 2 — CI/CD Pipeline to Hostinger VPS](#phase-2--cicd-pipeline-to-hostinger-vps)
   - 2.1 [Generate SSH Keys on Windows](#21-generate-ssh-keys-on-windows)
   - 2.2 [Add SSH Key to Hostinger Panel](#22-add-ssh-key-to-hostinger-panel)
   - 2.3 [VPS First-Time Setup](#23-vps-first-time-setup)
   - 2.4 [Migrate the Database from GoDaddy to VPS](#24-migrate-the-database-from-godaddy-to-vps)
   - 2.5 [Configure GitHub Secrets](#25-configure-github-secrets)
   - 2.6 [Create the GitHub Actions Workflow](#26-create-the-github-actions-workflow)
   - 2.7 [Push Code and Trigger First Deploy](#27-push-code-and-trigger-first-deploy)
   - 2.8 [Verify the Application is Live on VPS IP](#28-verify-the-application-is-live-on-vps-ip)
3. [Phase 3 — Connect Domain, DNS & Traefik SSL](#phase-3--connect-domain-dns--traefik-ssl)
   - 3.1 [Identify Your Traefik Network & Certresolver](#31-identify-your-traefik-network--certresolver)
   - 3.2 [Add DNS Records in Hostinger/GoDaddy](#32-add-dns-records-in-hostingergodaddy)
   - 3.3 [Update docker-compose.prod.yml with Domain Labels](#33-update-docker-composeprodyml-with-domain-labels)
   - 3.4 [Update Environment Variables & Push](#34-update-environment-variables--push)
   - 3.5 [Verify DNS, HTTPS & SSL Certificate](#35-verify-dns-https--ssl-certificate)
4. [FAQ & Troubleshooting](#4-faq--troubleshooting)

---

## 0. How the Whole System Works

Before touching any commands, understand the full picture. This prevents confusion later.

### The Architecture on Your VPS

```
Internet
    │
    ▼
Traefik (already running, manages ALL apps)
    │
    ├──► JD Connect App (already deployed, untouched by us)
    │
    └──► JD CRM App  ←── we are adding this
              │
              └──► JD CRM MySQL Database
                   (runs in its own isolated network)
```

### Three Separate Docker Networks

| Network Name | Purpose | Managed By |
|---|---|---|
| `root_default` | Traefik's network — all apps must join this to receive traffic | Traefik (already exists) |
| `jdconnect_net` | JD Connect's internal network | JD Connect (already exists) |
| `jdcrm_net` | JD CRM's internal network — **only our containers use this** | You create this once |

**Key point:** JD CRM and JD Connect share only the `root_default` network (so Traefik can route to both). They never share `jdcrm_net` or `jdconnect_net`. They cannot see or affect each other's databases.

### What GitHub Actions Does Automatically on Every `git push`

1. Downloads your code on a **free GitHub server** (not your VPS).
2. Runs `npm install` and `npm run build` on that GitHub server.
3. Packages the built app into a **Docker Image** and uploads it to GitHub Container Registry (GHCR).
4. SSH's into your VPS, pulls the new image, and restarts **only the JD CRM app container**.
5. Your database container is **never touched** — it stays up and running.

---

## Phase 1 — Run JD CRM Locally in Docker

**Goal:** Before deploying to the internet, verify the full app runs correctly inside a Docker container on your local Windows machine.

### 1.1 Create the Dockerfile

This file tells Docker how to build your Next.js app into a container image.

Create a new file called `Dockerfile` in the **root of your JD CRM project** (same level as `package.json`):

```dockerfile
# ────────────────────────────────────────────────
# Stage 1: Install dependencies
# ────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files first (better Docker caching)
COPY package.json package-lock.json ./
RUN npm ci

# ────────────────────────────────────────────────
# Stage 2: Build the Next.js application
# ────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client before building
RUN npx prisma generate

# Build the production Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ────────────────────────────────────────────────
# Stage 3: Production runtime (smallest possible image)
# ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what is needed to run the app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3080

ENV PORT=3080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Enable Next.js Standalone Output

The `Dockerfile` above uses Next.js "standalone" output which produces a minimal, self-contained server. Add this one line to your `next.config.js` (or `next.config.ts`):

```js
// next.config.js
const nextConfig = {
  output: 'standalone',  // ← Add this line
  // ... your other existing config
};

module.exports = nextConfig;
```

> **Why?** Without `output: 'standalone'`, the production Docker image would need the full `node_modules` folder (~300MB+). With it, Next.js bundles only the files actually used (~30MB image).

### 1.2 Update docker-compose.yml for Full-Stack Local Dev

Your current `docker-compose.yml` only runs the database. Update it to also run the Next.js app so you can test the full stack locally in Docker.

Replace the contents of your `docker-compose.yml` with:

```yaml
version: '3.8'

services:
  # ─── MySQL Database ───────────────────────────
  database:
    image: mysql:8.0
    container_name: jd_crm_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: jd_crm
      MYSQL_USER: crm_user
      MYSQL_PASSWORD: crm_password
    ports:
      - "3306:3306"       # Expose for local DB tools (DBeaver, TablePlus)
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - jdcrm_net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot_password"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Next.js Application ──────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: jd_crm_app
    restart: always
    ports:
      - "3080:3080"       # Access at http://localhost:3080
    environment:
      DATABASE_URL: "mysql://crm_user:crm_password@database:3306/jd_crm"
      NEXTAUTH_SECRET: "your-local-dev-secret-change-this"
      NEXTAUTH_URL: "http://localhost:3080"
    depends_on:
      database:
        condition: service_healthy
    networks:
      - jdcrm_net

networks:
  jdcrm_net:
    driver: bridge

volumes:
  mysql_data:
```

> **Important:** The `DATABASE_URL` uses `database` (the service name) as the host — NOT `127.0.0.1`. Inside Docker, containers talk to each other by their service name.

### 1.3 Create the Production docker-compose File

This is a **separate file** used only on the VPS. It connects JD CRM to Traefik for HTTPS routing.

Create `docker-compose.prod.yml` in the project root:

```yaml
version: '3.8'

services:
  # ─── MySQL Database (Production) ──────────────
  database:
    image: mysql:8.0
    container_name: jd_crm_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: jd_crm
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - jdcrm_net        # Internal only — NOT exposed to the internet
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ─── Next.js Application (Production) ─────────
  app:
    image: ghcr.io/${GITHUB_REPOSITORY}:latest   # Image pulled from GitHub Container Registry
    container_name: jd_crm_app
    restart: always
    # No "ports:" here — Traefik handles routing, no direct port exposure needed
    environment:
      DATABASE_URL: "mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@database:3306/jd_crm"
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NODE_ENV: production
    depends_on:
      database:
        condition: service_healthy
    networks:
      - jdcrm_net        # Internal network to reach the database
      - root_default     # Traefik's network — so it can route traffic to us
    labels:
      # ── Tell Traefik this container exists ──
      - "traefik.enable=true"
      - "traefik.docker.network=root_default"

      # ── Route HTTPS traffic for your domain ──
      # !! Replace YOUR_DOMAIN_HERE with your real domain e.g. crm.yourdomain.com
      - "traefik.http.routers.jdcrm.rule=Host(`YOUR_DOMAIN_HERE`)"
      - "traefik.http.routers.jdcrm.entrypoints=websecure"
      - "traefik.http.routers.jdcrm.tls.certresolver=mytlschallenge"

      # ── Which port the app listens on internally ──
      - "traefik.http.services.jdcrm.loadbalancer.server.port=3080"

      # ── Redirect HTTP → HTTPS automatically ──
      - "traefik.http.routers.jdcrm-http.rule=Host(`YOUR_DOMAIN_HERE`)"
      - "traefik.http.routers.jdcrm-http.entrypoints=web"
      - "traefik.http.routers.jdcrm-http.middlewares=redirect-to-https"
      - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"

networks:
  jdcrm_net:
    driver: bridge
  root_default:
    external: true       # This already exists — Traefik created it

volumes:
  mysql_data:
```

> **Note:** The `certresolver` name `mytlschallenge` matches what is already configured on your VPS for JD Connect. We confirmed this in the reference guide. If yours is different, check Step 3.1.

### 1.4 Test Locally in the Container

Run these commands in your Windows PowerShell from the project root:

```powershell
# Step 1: Build and start all containers
docker compose up --build -d

# Step 2: Wait ~20 seconds for the database to be ready, then run migrations
docker exec jd_crm_app npx prisma migrate deploy

# Step 3: Seed the database with roles, permissions, and the admin user
Get-Content "seed.sql" | docker exec -i jd_crm_db mysql -u root -proot_password jd_crm

# Step 4: Verify everything is running
docker compose ps
```

You should see output like:
```
NAME           STATUS          PORTS
jd_crm_db      Up (healthy)    0.0.0.0:3306->3306/tcp
jd_crm_app     Up              0.0.0.0:3080->3080/tcp
```

Now open your browser and visit `http://localhost:3080`. Log in with:
- **Username:** `admin`
- **Password:** `admin123`

✅ **Phase 1 is complete when the app loads correctly in the browser.**

To stop the containers:
```powershell
docker compose down
```

---

## Phase 2 — CI/CD Pipeline to Hostinger VPS

**Goal:** Every time you push code to GitHub, it automatically builds the Docker image and deploys it to your Hostinger VPS. The app will be accessible via your VPS IP address.

### 2.1 Generate SSH Keys on Windows

SSH keys let your computer (and GitHub Actions) log into the VPS securely without a password.

Open **PowerShell** on your Windows PC and run:

```powershell
# Generate a new key pair specifically for JD CRM
ssh-keygen -t ed25519 -C "jdcrm-deploy@hostinger"
```

When it asks:
- **"Enter file in which to save the key"** → Type a custom path to avoid overwriting your existing JD Connect key: `C:\Users\Administrator\.ssh\id_ed25519_jdcrm` and press **Enter**
- **"Enter passphrase"** → Just press **Enter** (no passphrase, so GitHub Actions can use it automatically)

Now view your **public key** (the one you share with others):
```powershell
Get-Content ~\.ssh\id_ed25519_jdcrm.pub
```

Copy the entire output. It looks like: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... jdcrm-deploy@hostinger`

View your **private key** (keep this secret — you will paste it into GitHub):
```powershell
Get-Content ~\.ssh\id_ed25519_jdcrm
```

### 2.2 Add SSH Key to Hostinger Panel

1. Log into your **Hostinger Account Dashboard**.
2. Go to **VPS** → select your VPS.
3. In the left sidebar, click **Settings** → **SSH Keys**.
4. Click **Add SSH Key**.
5. Give it a name: `JD-CRM-Deploy`
6. Paste the **public key** you copied (from `id_ed25519_jdcrm.pub`).
7. Click **Save**.

> **Why a second key?** You already have a key for JD Connect. Adding a second key keeps them separate — if you ever need to revoke one, the other still works.

### 2.3 VPS First-Time Setup

Connect to your VPS via SSH from PowerShell:

```powershell
ssh root@YOUR_VPS_IP
```

*(Replace `YOUR_VPS_IP` with your actual Hostinger VPS IP address, e.g., `103.163.224.78`)*

Once inside the VPS terminal, run each of the following commands:

**Check Docker is already installed** (it should be, since JD Connect is already running):
```bash
docker --version
docker compose version
```

If Docker is NOT installed for some reason:
```bash
apt-get update && apt-get upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

**Create the directory for JD CRM:**
```bash
mkdir -p /opt/jd-crm
```

**Create the JD CRM internal Docker network** (one-time command):
```bash
docker network create jdcrm_net
```

Verify it was created:
```bash
docker network ls | grep jdcrm
```

You should see:
```
xxxxxxxxxxxx   jdcrm_net    bridge    local
```

**Verify the Traefik network exists** (it should, since JD Connect uses it):
```bash
docker network ls | grep root_default
```

You should see:
```
xxxxxxxxxxxx   root_default   bridge    local
```

> **If `root_default` is NOT there**, check what Traefik is connected to using the commands in Step 3.1 below.

### 2.4 Migrate the Database from GoDaddy to VPS

> [!IMPORTANT]
> **EXECUTE THIS STEP AFTER STEP 2.7 HAS SUCCESSFULLY RUN.**
> You cannot perform this database migration until the first GitHub Actions workflow has successfully run (Step 2.7). This is because the VPS requires `docker-compose.prod.yml` (copied in Step 2.6) and the compiled Docker image in GHCR (built in Step 2.7) to start the database container and run the Prisma migrations. 
> 
> *For now, read through this section to understand the steps, then skip directly to **2.5 Configure GitHub Secrets** and return here after the first pipeline run completes.*

> **This step is critical.** Your app is currently on Vercel connecting to a GoDaddy shared hosting database. For the VPS to work correctly (without cross-internet latency on every query), you must move the database to the VPS container.

#### Step A — Export from GoDaddy (on your Windows PC)

Log into your **Hostinger cPanel** or **GoDaddy cPanel** → **phpMyAdmin** → select the `jd_crm` database → click **Export** → select **Quick** format → **Go**.

This downloads a `.sql` file to your computer (e.g., `jd_crm.sql`).

Alternatively, if you have MySQL client installed on Windows:
```powershell
mysqldump -h YOUR_GODADDY_DB_HOST -u YOUR_DB_USER -p jd_crm > C:\Users\Administrator\Desktop\jd_crm_backup.sql
```

#### Step B — Upload the .sql file to VPS

Open a **new PowerShell window** (do NOT close your SSH session):
```powershell
scp "C:\Users\Administrator\Desktop\jd_crm_backup.sql" root@YOUR_VPS_IP:/tmp/jd_crm_backup.sql
```

#### Step C — Start the database container first

Go back to your **SSH terminal** on the VPS. Start just the database container using the production compose file:

```bash
cd /opt/jd-crm

# First, create your production .env file (see Step 2.5 for what to put in it)
nano .env
```

For now, paste these minimal values and save (`Ctrl+O`, `Enter`, `Ctrl+X`):
```env
MYSQL_ROOT_PASSWORD=choose_a_strong_root_password_here
MYSQL_USER=crm_user
MYSQL_PASSWORD=choose_a_strong_user_password_here
```

Start only the database:
```bash
docker compose -f docker-compose.prod.yml up -d database
```

Wait 15–20 seconds for MySQL to initialize, then verify:
```bash
docker ps | grep jd_crm_db
```

#### Step D — Import the backup into the VPS database

```bash
# Import the backup
docker exec -i jd_crm_db mysql -u root -pYOUR_ROOT_PASSWORD jd_crm < /tmp/jd_crm_backup.sql
```

Wait for it to finish (may take 1–5 minutes depending on data size), then verify:
```bash
docker exec -it jd_crm_db mysql -u root -pYOUR_ROOT_PASSWORD jd_crm -e "SHOW TABLES;"
```

You should see all your tables listed: `crm_orders`, `crm_customers`, `users`, etc.

#### Step E — Run any pending migrations

```bash
# Apply any Prisma migrations that the legacy DB didn't have
docker run --rm \
  --network jdcrm_net \
  -e DATABASE_URL="mysql://crm_user:YOUR_USER_PASSWORD@jd_crm_db:3306/jd_crm" \
  ghcr.io/YOUR_GITHUB_USERNAME/jd-crm:latest \
  npx prisma migrate deploy
```

> **Note:** You will replace `YOUR_GITHUB_USERNAME/jd-crm` after the CI/CD is set up in the next steps. For now, note this command and run it after the first deployment.

### 2.5 Configure GitHub Secrets

GitHub Secrets store sensitive values (passwords, keys) that your GitHub Actions workflow uses during deployment. They are **never stored in your code** and cannot be seen by anyone — even you — after saving.

1. Go to your JD CRM repository on **GitHub**.
2. Click **Settings** (the settings tab of the repo, not your account).
3. In the left sidebar: **Secrets and variables** → **Actions**.
4. Click **New repository secret** and add each of these:

> [!WARNING]
> **Passwords with Special Characters (`@`, `#`, `$`):**
> - **In `DATABASE_URL` (or raw connection strings):** If your database password contains `@` or `#`, you **must URL-encode them** (e.g., `@` becomes `%40`, `#` becomes `%23`). Otherwise, the Prisma connection URL parser will crash.
> - **In `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD` secrets:** Paste the **raw** password exactly as it is (do NOT URL-encode it here).
> - **Escape `$` in Compose:** If a password contains a literal dollar sign (`$`), it must be escaped as `$$` in any Docker compose files to prevent interpolation errors.

| Secret Name | What to put in the Value field |
|---|---|
| `VPS_HOST` | Your VPS IP address (e.g., `103.163.224.78`) |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | Run `Get-Content ~\.ssh\id_ed25519_jdcrm` in PowerShell and paste the **entire output** including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` |
| `GHCR_TOKEN` | A GitHub Personal Access Token — see instructions below |
| `MYSQL_ROOT_PASSWORD` | The strong root password you chose in Step 2.4 |
| `MYSQL_USER` | `crm_user` |
| `MYSQL_PASSWORD` | The strong user password you chose in Step 2.4 |
| `NEXTAUTH_SECRET` | Run this in PowerShell: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` and paste the output |
| `NEXTAUTH_URL` | `https://YOUR_DOMAIN_HERE` (use your domain, or temporarily use `http://YOUR_VPS_IP:3080` if you haven't set up the domain yet) |

#### How to generate the `GHCR_TOKEN`

1. On GitHub, click your **profile picture** (top right) → **Settings**.
2. Scroll down the left sidebar to **Developer settings**.
3. Click **Personal access tokens** → **Tokens (classic)**.
4. Click **Generate new token (classic)**.
5. Give it a name: `JD-CRM-VPS-Deploy`
6. Set expiration: **No expiration** (or 1 year).
7. Check these two scopes:
   - ☑ `repo` — so GitHub Actions can clone your private repository
   - ☑ `write:packages` — so it can push images to GitHub Container Registry
8. Click **Generate token**. **Copy it immediately** — you cannot see it again.
9. Paste it as the value for the `GHCR_TOKEN` secret.

### 2.6 Create the GitHub Actions Workflow

Create this file and folder structure in your project:

```
.github/
  workflows/
    deploy.yml
```

Create `.github/workflows/deploy.yml` with the following content:

```yaml
name: Build & Deploy JD CRM

# Trigger this pipeline on every push to the main branch
on:
  push:
    branches: [main]

env:
  # The image name on GitHub Container Registry
  # e.g.: ghcr.io/your-github-username/jd-crm
  IMAGE_NAME: ghcr.io/${{ github.repository }}

jobs:
  # ─────────────────────────────────────────────
  # JOB 1: Build the Docker image on GitHub's servers
  # ─────────────────────────────────────────────
  build:
    name: Build Docker Image
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GHCR_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.IMAGE_NAME }}:latest

  # ─────────────────────────────────────────────
  # JOB 2: Deploy the new image to your VPS
  # ─────────────────────────────────────────────
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: build   # Only run after the build job succeeds

    steps:
      - name: Checkout code (to copy config files to VPS)
        uses: actions/checkout@v4

      - name: Copy project files to VPS
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          source: "docker-compose.prod.yml"
          target: "/opt/jd-crm/"
          strip_components: 0

      - name: Deploy on VPS via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e

            # Write the production .env file (overwritten on every deploy for safety)
            cat > /opt/jd-crm/.env << 'EOF'
            MYSQL_ROOT_PASSWORD=${{ secrets.MYSQL_ROOT_PASSWORD }}
            MYSQL_USER=${{ secrets.MYSQL_USER }}
            MYSQL_PASSWORD=${{ secrets.MYSQL_PASSWORD }}
            NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}
            NEXTAUTH_URL=${{ secrets.NEXTAUTH_URL }}
            GITHUB_REPOSITORY=${{ github.repository }}
            EOF

            # Move into the project directory
            cd /opt/jd-crm

            # Log into GitHub Container Registry to pull the new image
            echo "${{ secrets.GHCR_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin

            # Pull the new image
            docker pull ghcr.io/${{ github.repository }}:latest

            # Restart only the app container (database is NOT touched)
            docker compose -f docker-compose.prod.yml up -d --no-deps app

            # Clean up old unused Docker images to save disk space
            docker image prune -f

            echo "✅ JD CRM deployed successfully!"
```

> **What `--no-deps` does:** This flag tells Docker Compose to restart ONLY the `app` service, even though it depends on `database`. The database container keeps running uninterrupted. Your data is safe.

### 2.7 Push Code and Trigger First Deploy

On your Windows PC in the JD CRM project folder:

```powershell
# Stage all the new files
git add .

# Commit with a descriptive message
git commit -m "deploy: add Docker setup and GitHub Actions CI/CD pipeline"

# Push to GitHub — this triggers the deployment automatically
git push origin main
```

Now go to your GitHub repository → click the **Actions** tab. You will see the workflow running. The first deploy takes **3–5 minutes** (it has to build the Docker image from scratch). Subsequent deploys take **1–2 minutes** (only changed layers are rebuilt).

Watch the progress. Green checkmarks = success. If something fails, click on the job to see the detailed logs.

### 2.8 Verify the Application is Live on VPS IP

Once the GitHub Actions workflow shows all green checkmarks:

```powershell
# From your Windows PC — verify the app is responding
curl http://YOUR_VPS_IP:3080
```

Or simply open `http://YOUR_VPS_IP:3080` in your browser.

> **Note:** At this stage, the app is accessible via the raw VPS IP on port 3080. There is no HTTPS yet — that comes in Phase 3.

You can also check container status by SSHing into your VPS:
```bash
ssh root@YOUR_VPS_IP

# Check both containers are running
docker ps | grep jd_crm

# View live application logs
docker logs jd_crm_app --tail=50

# View database logs
docker logs jd_crm_db --tail=20
```

✅ **Phase 2 is complete when you can open the app in a browser via the VPS IP.**

---

## Phase 3 — Connect Domain, DNS & Traefik SSL

**Goal:** Point a real domain name at your VPS and activate automatic HTTPS via your existing Traefik instance.

> **Wait until Phase 2 is working** before starting Phase 3. DNS changes on a broken app just add confusion.

### 3.1 Identify Your Traefik Network & Certresolver

Your VPS already runs Traefik for JD Connect. We need to confirm what network name and certificate resolver it uses — so JD CRM can join the same system.

SSH into your VPS and run these commands:

```bash
# 1. Find the Traefik container name
docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Status}}"
```

You should see something like `root-traefik-1`.

```bash
# 2. See what networks Traefik is connected to
docker inspect $(docker ps --filter "name=traefik" --format "{{.Names}}" | head -1) \
  --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"  "}}{{"end"}}'
```

This shows the network name (likely `root_default`).

```bash
# 3. Find the certresolver name (used for SSL certificates)
docker inspect $(docker ps --filter "name=traefik" --format "{{.Names}}" | head -1) \
  --format '{{join .Config.Cmd "\n"}}' | grep -i "certresolver\|acme"
```

Note down your values:

| Setting | Your VPS Value (from JD Connect guide) |
|---|---|
| Traefik network name | `root_default` ✅ |
| Certresolver name | `mytlschallenge` ✅ |

> **Good news:** The `docker-compose.prod.yml` file we created in Phase 1 already uses `root_default` and `mytlschallenge` — the same values as JD Connect. No changes needed unless your VPS uses different values.

### 3.2 Add DNS Records in Hostinger/GoDaddy

You need to point a domain name at your VPS IP. This can be a subdomain of an existing domain or a new dedicated domain.

#### Option A: Subdomain of an existing domain (e.g., `crm.yourdomain.com`)

Log into your domain registrar (Hostinger, GoDaddy, etc.) and navigate to the **DNS Management** section for your domain. Add one A record:

```
Type: A
Name: crm
Value: YOUR_VPS_IP
TTL: 300
```

#### Option B: Root domain dedicated to CRM (e.g., `jdcrm.in`)

```
Type: A
Name: @
Value: YOUR_VPS_IP
TTL: 300
```

**Set TTL to 300 (5 minutes) while testing.** Raise it to 3600 (1 hour) after everything works.

#### Verify DNS is propagating (run from Windows PC):

```powershell
# Replace with your actual domain
nslookup crm.yourdomain.com

# Or use an online tool: https://dnschecker.org
```

Wait until the output shows your VPS IP address. DNS propagation typically takes 5–30 minutes with a 300-second TTL.

### 3.3 Update docker-compose.prod.yml with Domain Labels

Open `docker-compose.prod.yml` in your editor. Find these two lines (there are two of them — one for HTTPS and one for HTTP→HTTPS redirect):

```yaml
- "traefik.http.routers.jdcrm.rule=Host(`YOUR_DOMAIN_HERE`)"
```

and

```yaml
- "traefik.http.routers.jdcrm-http.rule=Host(`YOUR_DOMAIN_HERE`)"
```

Replace **both** occurrences of `YOUR_DOMAIN_HERE` with your actual domain:

**For Option A** (subdomain):
```yaml
- "traefik.http.routers.jdcrm.rule=Host(`crm.yourdomain.com`)"
- "traefik.http.routers.jdcrm-http.rule=Host(`crm.yourdomain.com`)"
```

**For Option B** (root domain):
```yaml
- "traefik.http.routers.jdcrm.rule=Host(`jdcrm.in`)"
- "traefik.http.routers.jdcrm-http.rule=Host(`jdcrm.in`)"
```

### 3.4 Update Environment Variables & Push

Update the `NEXTAUTH_URL` GitHub Secret to use your real domain:

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**.
2. Click on `NEXTAUTH_URL` → **Update**.
3. Set the value to your domain with HTTPS:
   - **Option A:** `https://crm.yourdomain.com`
   - **Option B:** `https://jdcrm.in`
4. Click **Save**.

Now commit and push the updated `docker-compose.prod.yml`:

```powershell
git add docker-compose.prod.yml
git commit -m "chore: set production domain for Traefik routing"
git push origin main
```

This triggers a new deployment. The app container restarts with the correct domain labels. Traefik picks up the labels automatically and starts routing traffic for your domain.

### 3.5 Verify DNS, HTTPS & SSL Certificate

Once the GitHub Actions deployment completes (green checkmarks), Traefik will automatically request an SSL certificate from Let's Encrypt the first time your domain receives a request.

**Check Traefik logs** for certificate activity (from VPS SSH terminal):

```bash
# Your Traefik container name is from Step 3.1 (e.g., root-traefik-1)
docker logs root-traefik-1 2>&1 | grep -i "certificate\|acme\|jdcrm\|crm\."
```

You should see lines like:
```
msg="Obtaining certificate" domains=[crm.yourdomain.com]
msg="Certificate obtained" domains=[crm.yourdomain.com]
```

**Test HTTPS is working** (from Windows PowerShell or VPS):

```powershell
# Test HTTPS responds correctly
curl -I https://crm.yourdomain.com

# Should see: HTTP/2 200
```

**Test HTTP → HTTPS redirect is working:**

```powershell
curl -I http://crm.yourdomain.com
# Should see: HTTP/1.1 301 Moved Permanently
# Location: https://crm.yourdomain.com/
```

Open your browser and visit `https://YOUR_DOMAIN`. You should see the JD CRM login page with a valid SSL padlock. ✅

✅ **Phase 3 is complete when the app loads over HTTPS with a valid SSL certificate.**

---

## 4. FAQ & Troubleshooting

### Q: The database container starts, but the app container keeps restarting. What do I do?

```bash
# Check the app container logs for the error
docker logs jd_crm_app --tail=100
```

**Common causes:**
- `DATABASE_URL` is wrong — the host should be `database` (the service name), NOT `localhost` or `127.0.0.1`
- `NEXTAUTH_SECRET` is missing from the `.env` file
- Prisma migrations haven't run yet — run: `docker exec jd_crm_app npx prisma migrate deploy`

### Q: The GitHub Actions build failed. How do I read the error?

1. Go to your GitHub repo → click **Actions** tab.
2. Click on the failed workflow run.
3. Click on the failed job (e.g., **Build Docker Image**).
4. Expand the failed step to see the full error log.

Most common causes:
- **GHCR_TOKEN is wrong** — re-generate it and save again in Secrets
- **VPS_SSH_KEY is wrong** — make sure you copied the PRIVATE key (`id_ed25519_jdcrm`), NOT the `.pub` file
- **`Dockerfile` syntax error** — check your `Dockerfile` carefully

### Q: The domain works but shows a "Not Secure" warning instead of SSL.

Traefik hasn't issued the certificate yet. Wait 2–3 minutes and hard-refresh (`Ctrl+Shift+R`). If it still doesn't work:

```bash
# Check Traefik logs for errors
docker logs root-traefik-1 2>&1 | grep -i "error\|fail\|acme" | tail -30
```

Common cause: DNS hasn't propagated yet. Traefik cannot get a certificate until the domain actually points to your VPS IP. Run `nslookup crm.yourdomain.com` — it must return your VPS IP before the certificate can be issued.

### Q: Will my existing JD Connect app be affected?

**No.** JD CRM uses a completely separate Docker network (`jdcrm_net`). The only shared component is Traefik's `root_default` network, which Traefik uses purely for traffic routing. JD Connect's containers cannot communicate with JD CRM's containers, and vice versa. They are isolated at the Docker network level.

### Q: How do I update the app after making code changes?

Just push your changes to the `main` branch:

```powershell
git add .
git commit -m "feat: your change description"
git push origin main
```

GitHub Actions automatically builds a new image and deploys it. The database container is never restarted — only the app container is updated.

### Q: How do I restart just the app container manually on the VPS?

```bash
ssh root@YOUR_VPS_IP
cd /opt/jd-crm
docker compose -f docker-compose.prod.yml restart app
```

### Q: How do I restart just the database container (e.g., after config changes)?

```bash
ssh root@YOUR_VPS_IP
cd /opt/jd-crm
docker compose -f docker-compose.prod.yml restart database
```

> ⚠️ Restarting the database causes a brief (5–15 second) outage for the app while it reconnects. Do this during off-hours.

### Q: How do I free up disk space on the VPS?

Old Docker images accumulate over time. Clean them up with:

```bash
# Remove all unused images (keeps the ones currently running)
docker image prune -a -f

# Also clean up unused volumes and networks
docker system prune -f
```

### Q: How do I view live application logs?

```bash
# App logs (most recent 100 lines, follow in real-time)
docker logs jd_crm_app --tail=100 -f

# Database logs
docker logs jd_crm_db --tail=50 -f

# Press Ctrl+C to stop following
```

### Q: How do I connect to the production database directly for inspection?

```bash
ssh root@YOUR_VPS_IP

# Open a MySQL shell inside the running container
docker exec -it jd_crm_db mysql -u crm_user -p jd_crm
# Enter the MYSQL_PASSWORD when prompted

# Example queries:
SHOW TABLES;
SELECT COUNT(*) FROM crm_orders;
SELECT uid, name, username FROM users;
EXIT;
```

### Q: Why not build the Docker image directly on the VPS?

Building Next.js requires running `npm install` and `npm run build`, which uses a lot of RAM. VPS plans with 2–4GB RAM frequently crash with "Out Of Memory" errors during builds. Building on GitHub's free servers (which have 16GB RAM) avoids this completely. The VPS only needs to *pull* a pre-built image, which takes ~10 seconds.

---

*This guide is version-controlled alongside the JD CRM codebase. Update it whenever the deployment process changes.*
