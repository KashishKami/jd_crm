import { prisma } from '../lib/db';

async function main() {
  const c = await prisma.crmCustomers.findUnique({
    where: { customerId: 242 }
  });
  console.log('Customer 242:', JSON.stringify(c, null, 2));
}

main().catch(console.error);
