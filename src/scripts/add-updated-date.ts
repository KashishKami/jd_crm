import { prisma } from '../lib/db';

async function main() {
  await prisma.$executeRaw`ALTER TABLE crm_orders ADD COLUMN order_updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`;
  console.log('Successfully restored order_updated_date column!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
