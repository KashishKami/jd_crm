import { prisma } from '../lib/db';

async function main() {
  const sample = await prisma.crmOrders.findMany({
    where: { parentOrderId: null },
    take: 10,
    select: { crmOrderId: true, orderCurrency: true, orderExchangeRate: true, orderTotalPitched: true, orderAmountCharged: true },
  });
  console.log('SAMPLE PARENT ORDERS:', JSON.stringify(sample, null, 2));

  const nullCount = await prisma.crmOrders.count({
    where: { parentOrderId: null, OR: [{ orderCurrency: null }, { orderExchangeRate: null }] },
  });
  console.log('NULL COUNT ON PARENT ORDERS:', nullCount);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
