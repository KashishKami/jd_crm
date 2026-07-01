import { prisma } from '../lib/db';

async function main() {
  const allOrders = await prisma.crmOrders.findMany({
    select: {
      orderDate: true,
      saleStatus: true,
      orderAmountCharged: true,
    }
  });

  const months: Record<number, { count: number; amount: number; statuses: Record<string, number> }> = {};

  for (const o of allOrders) {
    if (!o.orderDate) continue;
    const d = new Date(o.orderDate);
    const month = d.getMonth() + 1; // 1-12
    if (!months[month]) {
      months[month] = { count: 0, amount: 0, statuses: {} };
    }
    months[month].count++;
    months[month].amount += parseFloat(o.orderAmountCharged || '0');
    
    const status = o.saleStatus || 'unknown';
    months[month].statuses[status] = (months[month].statuses[status] || 0) + 1;
  }

  console.log('Orders grouped by month (2026):');
  for (const [month, info] of Object.entries(months)) {
    console.log(`Month ${month}: Total count = ${info.count}, Markup sum = ${info.amount.toFixed(2)}, Statuses =`, info.statuses);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
