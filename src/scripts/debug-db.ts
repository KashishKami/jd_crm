import { prisma } from '../lib/db';

async function main() {
  const month = 3; // March
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
  });

  let markupSold = 0;
  let finalMarginSold = 0;
  let countSold = 0;

  let markupRefunded = 0;
  let refundAmountRefunded = 0;
  let countRefunded = 0;

  for (const o of orders) {
    const markup = parseFloat(o.orderAmountCharged || '0');
    const refund = parseFloat(o.orderRefundAmount || '0');

    if (o.saleStatus === '1' || o.saleStatus === '4') {
      markupSold += markup;
      finalMarginSold += (markup - refund);
      countSold++;
    } else if (o.saleStatus === '2' || o.saleStatus === '3') {
      markupRefunded += markup;
      refundAmountRefunded += refund;
      countRefunded++;
    }
  }

  console.log(`March 2026 stats:`);
  console.log(`Sold count: ${countSold}, markup sum: ${markupSold}, finalMargin sum: ${finalMarginSold}`);
  console.log(`Refunded count: ${countRefunded}, markup sum: ${markupRefunded}, refundAmount sum: ${refundAmountRefunded}`);
}

main().catch(console.error);
