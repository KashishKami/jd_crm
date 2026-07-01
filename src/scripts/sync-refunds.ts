import { prisma } from '../lib/db';

async function main() {
  console.log('Syncing refund amounts for existing Refunded and Chargebacked orders...');
  
  // 1. Get all refunded (2) or chargebacked (3) orders with null or '0' or empty refund amounts
  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: { in: ['2', '3'] },
      OR: [
        { orderRefundAmount: null },
        { orderRefundAmount: '0' },
        { orderRefundAmount: '' },
      ],
    },
  });

  console.log(`Found ${orders.length} orders to update.`);

  let updatedCount = 0;
  for (const order of orders) {
    const markup = order.orderMarkup || '0';
    await prisma.crmOrders.update({
      where: { crmOrderId: order.crmOrderId },
      data: {
        orderRefundAmount: markup,
      },
    });
    updatedCount++;
  }

  console.log(`Successfully synced ${updatedCount} orders.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error syncing refund amounts:', err);
  process.exit(1);
});
