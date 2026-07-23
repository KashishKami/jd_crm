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
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Note: Manually triggered MySQL backups are saved to /jd_crm_backup/ in the container.
# This directory MUST be bind-mounted in docker-compose configs (as done in compose.yml
# and compose.prod.yml) to persist backups on the host disk across container restarts/rebuilds.

USER nextjs

EXPOSE 3080

ENV PORT=3080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
