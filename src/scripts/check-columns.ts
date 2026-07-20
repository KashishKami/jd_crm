import { prisma } from '../lib/db';

async function main() {
  const columns = await prisma.$queryRaw`SHOW COLUMNS FROM crm_orders`;
  console.log('CRM ORDERS COLUMNS:', (columns as any[]).map((c: any) => c.Field));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
