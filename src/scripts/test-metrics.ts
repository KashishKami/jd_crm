import { prisma } from '../lib/db';
import { getThisYearSales, getSalesBetweenDates, getTotalSalesThisMonth, getTodaySales } from '../repository/dashboard.repository';

async function main() {
  const now = new Date();
  console.log('Current Date (now):', now);
  console.log('Current Year:', now.getFullYear());
  console.log('Current Month:', now.getMonth()); // 0-indexed

  const thisYear = await getThisYearSales();
  console.log('getThisYearSales() result:', thisYear);

  const thisMonth = await getTotalSalesThisMonth();
  console.log('getTotalSalesThisMonth() result:', thisMonth);

  const today = await getTodaySales();
  console.log('getTodaySales() result:', today);

  // Let's see what start/end dates getThisYearSales is using
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  console.log('This Year Start (local):', start);
  console.log('This Year End (local):', end);

  // Let's count in database with raw dates
  const rawCount = await prisma.crmOrders.count({
    where: {
      saleStatus: '1',
      orderDate: {
        gte: start,
        lt: end
      }
    }
  });
  console.log('Prisma count with local date objects:', rawCount);

  // Let's look at the actual orders and their saleStatus
  const totalCountAll = await prisma.crmOrders.count();
  console.log('Total orders in DB:', totalCountAll);

  const soldCountAll = await prisma.crmOrders.count({
    where: { saleStatus: '1' }
  });
  console.log('Total sold orders in DB:', soldCountAll);
}

main().catch(console.error).finally(() => prisma.$disconnect());
