import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  // Parse connection string to pass connection details directly to the MariaDB adapter
  const url = new URL(connectionString);
  const adapter = new PrismaMariaDb({
    host: url.hostname || '127.0.0.1',
    port: url.port ? parseInt(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    connectionLimit: 25,    // increased from 10 — handles ~25 concurrent DB ops comfortably
    allowPublicKeyRetrieval: true,
    connectTimeout: 30000,   // 30s socket connect timeout (default is ~1s, too short for remote DBs)
    acquireTimeout: 60000,   // 60s max wait to acquire a pooled connection
  });

  prismaInstance = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV !== 'production' ? ['query'] : [],
  });

  globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance;
