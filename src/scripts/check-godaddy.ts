const godaddyUrl = "mysql://jd_crm_new:Godaddy%40JD%232025@198.12.217.149:3306/jd_crm_new";
process.env.DATABASE_URL = godaddyUrl;

import { prisma } from '../lib/db';

async function main() {
  console.log('Connecting to GoDaddy database...');
  try {
    const count = await prisma.crmOrders.count();
    console.log('Total orders in GoDaddy DB:', count);

    const soldCount = await prisma.crmOrders.count({
      where: { saleStatus: '1' }
    });
    console.log('Sold orders in GoDaddy DB:', soldCount);

    const minDate = await prisma.crmOrders.findFirst({
      orderBy: { orderDate: 'asc' },
      select: { orderDate: true }
    });
    console.log('Earliest order date in GoDaddy:', minDate?.orderDate);
  } catch (error) {
    console.error('Error connecting to GoDaddy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
