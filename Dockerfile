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
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
RUN npm run build

# ── Compile the weekly backup script into a self-contained JS bundle ──────────
# src/scripts/run-backup.ts imports src/lib/backup.ts (which contains all the
# real backup logic: mysqldump, gzip compression, and retention cleanup).
# esbuild --bundle inlines both files into one single run-backup.js output so
# the runner image needs zero source files and zero TypeScript tooling at runtime.
#
# Why esbuild and not tsc?
#   esbuild produces a single bundled file. tsc would emit two separate .js files
#   (run-backup.js + backup.js) and require managing import paths between them.
#
# Why not npx tsx at cron time?
#   tsx is not in the image. npx would download it from the internet every
#   Saturday night — fragile if the VPS loses connectivity.
#
# --bundle        : Follows all local imports and merges them into one file.
# --platform=node : Keeps Node built-ins (fs, zlib, child_process, path) as
#                   external references instead of trying to bundle them.
# --outfile       : Destination of the compiled bundle in the builder stage.
RUN npx esbuild src/scripts/run-backup.ts \
    --bundle \
    --platform=node \
    --outfile=run-backup.js

# ────────────────────────────────────────────────
# Stage 3: Production runtime (smallest possible image)
# ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install mysql-client and mariadb-connector-c to run mysqldump inside the container
RUN apk add --no-cache mysql-client mariadb-connector-c

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only what is needed to run the app
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Copy the pre-compiled backup script bundle (produced by esbuild above).
# This is the ONLY file needed for the automated weekly cron job.
# The cron entry on the VPS host calls:
#   docker exec jd_crm_app node run-backup.js
# It runs the same backup logic as the manual "Create Backup" button in the UI,
# including automatic retention cleanup (keeps the 4 most recent .sql.gz files).
# To change the retention count, update BACKUP_RETENTION_COUNT in src/lib/backup.ts
# and redeploy — the next Docker build will recompile this file automatically.
COPY --from=builder /app/run-backup.js ./run-backup.js

# Note: Manually triggered MySQL backups are saved to /jd_crm_backup/ in the container.
# This directory MUST be bind-mounted in docker-compose configs (as done in compose.yml
# and compose.prod.yml) to persist backups on the host disk across container restarts/rebuilds.

USER nextjs

EXPOSE 3080

ENV PORT=3080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
