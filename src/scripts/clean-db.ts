import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

async function main() {
  console.log('--- CLEANING DATABASE COMPLETELY ---');

  await prisma.$executeRaw(Prisma.raw('SET FOREIGN_KEY_CHECKS = 0;'));

  const tables = [
    'crm_comments',
    'crm_orders',
    'crm_customer_cards',
    'crm_customers',
    'crm_vendors',
    'crm_gateway',
    'crm_attendance',
    'usercheck',
    'users_profile_academic',
    'users_profile_professional',
    'users_profile',
    'users',
    'crm_teams',
    'crm_role_permissions',
    'crm_roles',
    'crm_permissions'
  ];

  for (const table of tables) {
    try {
      console.log(`Truncating table: ${table}`);
      await prisma.$executeRaw(Prisma.raw(`TRUNCATE TABLE \`${table}\``));
    } catch (err) {
      console.warn(`Truncate failed for ${table}, attempting delete + auto_increment reset:`, err);
      try {
        await prisma.$executeRaw(Prisma.raw(`DELETE FROM \`${table}\``));
        await prisma.$executeRaw(Prisma.raw(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1;`));
      } catch (deleteErr) {
        console.error(`Failed to clear table ${table}:`, deleteErr);
      }
    }
  }

  await prisma.$executeRaw(Prisma.raw('SET FOREIGN_KEY_CHECKS = 1;'));
  console.log('--- DATABASE CLEAN COMPLETED ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
