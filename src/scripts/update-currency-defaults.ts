import { prisma } from '../lib/db';

async function main() {
  const result = await prisma.$executeRaw`UPDATE crm_orders SET order_currency = 'USD', order_exchange_rate = '1' WHERE parent_order_id IS NULL AND (order_currency IS NULL OR order_exchange_rate IS NULL)`;
  console.log('Successfully updated existing parent orders:', result);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
