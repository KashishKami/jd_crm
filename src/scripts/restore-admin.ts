import { prisma } from '../lib/db';

async function main() {
  console.log('--- RESTORING TEST ADMIN USER ---');

  // Insert or update user with uid 1 to match the integration test expectations
  await prisma.users.upsert({
    where: { uid: 1 },
    update: {
      name: 'Admin',
      nickname: 'JD',
      username: 'admin@gmail.com',
      email: 'admin@gmail.com',
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      teamId: 1,
      roleId: 1,
    },
    create: {
      uid: 1,
      name: 'Admin',
      nickname: 'JD',
      username: 'admin@gmail.com',
      email: 'admin@gmail.com',
      password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      teamId: 1,
      roleId: 1,
    },
  });

  console.log('Test Admin user successfully restored.');

  // Seed a mock customer (uid=1 now guaranteed above, safe for order FK)
  await prisma.crmCustomers.upsert({
    where: { customerId: 1 },
    update: { customerName: 'Jane Doe' },
    create: {
      customerId: 1,
      customerName: 'Jane Doe',
      customerEmail: 'jane.doe@example.com',
      customerPhone: '555-0199',
      customerBillingAddress: '123 Main St, New York, NY 10001',
      customerShippingAddress: '123 Main St, New York, NY 10001',
    },
  });

  // Seed a mock order linked to customer 1 and sales agent uid=1
  await prisma.crmOrders.upsert({
    where: { crmOrderId: 1 },
    update: { orderMakeModel: '2026 Jeep Grand Cherokee' },
    create: {
      crmOrderId: 1,
      orderCustomerId: 1,
      orderMakeModel: '2026 Jeep Grand Cherokee',
      orderPart: 'Transmission',
      orderPartSize: 'V6 4.0L',
      orderQuotedMiles: '120000',
      orderGivenMiles: '118000',
      orderVin: '1J4GR48P1LC123456',
      orderTotalPitched: '3500.00',
      orderVendorPrice: '2500.00',
      orderShippingType: 'Ground',
      orderAmountCharged: '1000.00',
      orderSalesAgentId: 1,
      orderSalesAgentName: 'Admin',
      saleStatus: '1',
      orderCurrentStatus: 'Pending Booking',
      orderVendorFeedback: 'Positive',
      orderClientFeedback: 'Positive',
      orderResolution: 'Resolved',
    },
  });

  console.log('Mock customer and order seeded successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
