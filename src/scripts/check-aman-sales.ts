import { prisma } from '../lib/db';

async function main() {
  const agent = await prisma.users.findFirst({
    where: { name: { contains: 'Aman' } },
  });
  if (!agent) {
    console.log('Aman Goel not found');
    return;
  }
  console.log(`Found agent: uid=${agent.uid}, name=${agent.name}`);

  const orders = await prisma.crmOrders.findMany({
    where: {
      orderSalesAgentId: agent.uid,
      orderDate: {
        gte: new Date(Date.UTC(2026, 2, 1)),
        lt: new Date(Date.UTC(2026, 3, 1)),
      },
      saleStatus: { in: ['1', '4'] },
    },
  });

  let totalMarkup = 0;
  let totalPitched = 0;
  let totalRefund = 0;

  for (const o of orders) {
    totalMarkup += parseFloat(o.orderAmountCharged || '0');
    totalPitched += parseFloat(o.orderTotalPitched || '0');
    totalRefund += parseFloat(o.orderRefundAmount || '0');
  }

  console.log(`March 2026 orders for Aman Goel: count=${orders.length}`);
  console.log(`Total markup: ${totalMarkup}, total pitched: ${totalPitched}, total refund: ${totalRefund}`);
  console.log(`Final Margin (markup - refund): ${totalMarkup - totalRefund}`);
}

main().catch(console.error);
