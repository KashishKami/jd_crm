import { prisma } from '../lib/db';

async function main() {
  const c = await prisma.crmCustomers.findUnique({
    where: { customerId: 172 }
  });
  console.log('Customer 172:', JSON.stringify(c, null, 2));
}

main().catch(console.error);
