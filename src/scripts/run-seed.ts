import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

async function main() {
  console.log('--- STARTING DATABASE SEED EXECUTION ---');

  const seedFilePath = path.resolve('seed.sql');
  if (!fs.existsSync(seedFilePath)) {
    console.error(`Error: seed.sql file not found at ${seedFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(seedFilePath, 'utf-8');

  // Basic SQL parser to split statements by semicolon, ignoring comments
  const statements: string[] = [];
  let currentStatement = '';

  const lines = sqlContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('--')) {
      continue;
    }

    currentStatement += line + '\n';

    if (trimmed.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  console.log(`Parsed ${statements.length} SQL statements to execute.`);

  const prismaPromises = [];
  prismaPromises.push(prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;'));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const cleanStmt = stmt.endsWith(';') ? stmt.slice(0, -1) : stmt;
    if (cleanStmt.trim().startsWith('USE ')) {
      continue;
    }
    prismaPromises.push(prisma.$executeRawUnsafe(cleanStmt));
  }

  prismaPromises.push(prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;'));

  try {
    await prisma.$transaction(prismaPromises, { timeout: 30000 });
  } catch (err) {
    console.error(`Error executing seed transaction:`);
    console.error(err);
    process.exit(1);
  }

  console.log('--- DATABASE SEED EXECUTION COMPLETED ---');
}

main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
