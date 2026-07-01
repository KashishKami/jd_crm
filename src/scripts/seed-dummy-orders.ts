import { prisma } from '../lib/db';

async function main() {
  console.log('Seeding dummy orders for testing filters...');

  // 1. Find or create a user/agent
  let agent = await prisma.users.findFirst();
  if (!agent) {
    // We need a team and a role first
    let team = await prisma.crmTeams.findFirst();
    if (!team) {
      team = await prisma.crmTeams.create({
        data: {
          teamName: 'IT Park',
          teamCreated: new Date(),
        },
      });
    }

    let role = await prisma.crmRoles.findFirst();
    if (!role) {
      role = await prisma.crmRoles.create({
        data: {
          roleName: 'Super Administrator',
          roleCreated: new Date(),
        },
      });
    }

    agent = await prisma.users.create({
      data: {
        name: 'Super Admin',
        username: 'admin',
        password: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // SHA-256 of admin123
        status: 1,
        teamId: team.teamId,
        roleId: role.roleId,
        agentId: 'AG101',
      },
    });
  }

  // 2. Find or create a gateway
  let gateway = await prisma.crmGateway.findFirst();
  if (!gateway) {
    gateway = await prisma.crmGateway.create({
      data: {
        gatewayName: 'Test Gateway',
        gatewayStatus: 1,
        gatewayCreatedAt: new Date(),
        gatewayUpdatedAt: new Date(),
      },
    });
  }

  // 3. Find or create a vendor
  let vendor = await prisma.crmVendors.findFirst();
  if (!vendor) {
    vendor = await prisma.crmVendors.create({
      data: {
        vendorName: 'Test Vendor',
        vendorPhone: '1234567890',
        vendorContactPerson: 'Vendor Agent',
        vendorStatus: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // 4. Create/Get test customer
  let customer = await prisma.crmCustomers.findFirst({
    where: { customerEmail: 'filtertest@example.com' },
  });

  if (!customer) {
    customer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Filter Test',
        customerPhone: '9876543210',
        customerEmail: 'filtertest@example.com',
        customerBillingAddress: '123 Test St, Test City',
        customerShippingAddress: '123 Test St, Test City',
        dateCreated: new Date(),
        dateUpdated: new Date(),
      },
    });
  }

  // 5. Check customer card
  let card = await prisma.crmCustomerCards.findFirst({
    where: { cardCustomerId: customer.customerId },
  });

  if (!card) {
    card = await prisma.crmCustomerCards.create({
      data: {
        cardCustomerId: customer.customerId,
        customerNameOncard: 'Filter Test',
        customerCardNumber: '1111222233334444',
        customerCardExpDate: '12/28',
        customerCardCvv: '123',
        customerCardCopyStatus: 'No',
        customerCardPhotoStatus: 'No',
        customerCardCreatedAt: new Date(),
        customerCardUpdated: new Date(),
      },
    });
  }

  // Clear existing test orders to make the script safe to run multiple times
  await prisma.crmOrders.deleteMany({
    where: { orderCustomerId: customer.customerId },
  });

  const today = new Date();
  
  // Create orders for each sale status '1' to '4'
  const statuses = [
    { saleStatus: '1', markup: '500.00', refundAmount: null, currentStatus: 'Completed Orders', name: 'Sold Order' },
    { saleStatus: '2', markup: '100.00', refundAmount: '100.00', currentStatus: 'Returned Orders', name: 'Refunded Order' },
    { saleStatus: '3', markup: '150.00', refundAmount: '150.00', currentStatus: 'Returned Orders', name: 'Chargebacked Order' },
    { saleStatus: '4', markup: '200.00', refundAmount: '50.00', currentStatus: 'Completed Orders', name: 'Partial Refund Order' },
  ];

  for (const s of statuses) {
    await prisma.crmOrders.create({
      data: {
        orderCustomerId: customer.customerId,
        orderMakeModel: `${today.getFullYear()} ${s.name}`,
        orderPart: 'Test Part',
        orderTotalPitched: (parseFloat(s.markup) + 100).toString(),
        orderVendorPrice: '100.00',
        orderMarkup: s.markup,
        orderRefundAmount: s.refundAmount,
        orderPaymentGatewayId: gateway.gatewayId,
        orderVendorId: vendor.vendorId,
        orderVendorName: vendor.vendorName,
        orderSalesAgentId: agent.uid,
        orderSalesAgentName: agent.nickname || agent.name,
        saleStatus: s.saleStatus,
        orderCurrentStatus: s.currentStatus,
        orderCurrentStatusUpdateDate: today,
        orderDate: today,
        orderCreatedDate: today,
        orderUpdatedDate: today,
      },
    });
  }

  console.log(`Seeded ${statuses.length} orders successfully for saleStatus 1 to 4!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
