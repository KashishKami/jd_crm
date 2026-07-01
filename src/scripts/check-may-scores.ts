import { prisma } from '../lib/db';

async function main() {
  const month = 5; // May
  const year = 2026;
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const orders = await prisma.crmOrders.findMany({
    where: {
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    include: {
      salesAgent: {
        include: {
          team: true,
        },
      },
    },
  });

  console.log(`Total orders in May 2026: ${orders.length}`);
  
  const teamStats: Record<string, {
    rawMarkupSold: number;
    refundAmountSold: number;
    finalMarginSold: number;
    countSold: number;
    rawMarkupRefunded: number;
    refundAmountRefunded: number;
    countRefunded: number;
  }> = {};

  for (const o of orders) {
    const teamName = o.salesAgent?.team?.teamName || 'No Team';
    if (!teamStats[teamName]) {
      teamStats[teamName] = {
        rawMarkupSold: 0,
        refundAmountSold: 0,
        finalMarginSold: 0,
        countSold: 0,
        rawMarkupRefunded: 0,
        refundAmountRefunded: 0,
        countRefunded: 0,
      };
    }

    const markup = parseFloat(o.orderAmountCharged || '0');
    const refund = parseFloat(o.orderRefundAmount || '0');

    if (o.saleStatus === '1' || o.saleStatus === '4') {
      teamStats[teamName].rawMarkupSold += markup;
      teamStats[teamName].refundAmountSold += refund;
      teamStats[teamName].finalMarginSold += (markup - refund);
      teamStats[teamName].countSold++;
    } else if (o.saleStatus === '2' || o.saleStatus === '3') {
      teamStats[teamName].rawMarkupRefunded += markup;
      teamStats[teamName].refundAmountRefunded += refund;
      teamStats[teamName].countRefunded++;
    }
  }

  console.log('Team statistics:');
  console.dir(teamStats, { depth: null });
}

main().catch(console.error);
