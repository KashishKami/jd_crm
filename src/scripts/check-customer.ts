import { prisma } from '../lib/db';

async function main() {
  const all = await prisma.crmCustomers.findMany();
  console.log('Total customers in DB:', all.length);
  for (const c of all) {
    console.log(`- ID: ${c.customerId}, Name: ${c.firstName} ${c.lastName}, Email: ${c.customerEmail}, Phone: ${c.customerPhone}, Billing: ${c.customerBillingAddress}`);
  }
}

main().catch(console.error);
