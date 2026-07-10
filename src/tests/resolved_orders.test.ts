import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/db';
import * as orderService from '../service/order.service';
import { getPendingCounts } from '../repository/dashboard.repository';

describe('Resolved Orders Integration Tests', () => {
  let testTeam: any;
  let testRole: any;
  let testUser: any;
  let testCustomer: any;

  beforeEach(async () => {
    // Clean up
    await prisma.crmOrderCurrentStatusHistory.deleteMany({});
    await prisma.crmOrders.deleteMany({});
    await prisma.crmCustomers.deleteMany({});
    await prisma.users.deleteMany({ where: { username: 'resolved_test_agent' } });

    // Seed
    testTeam = await prisma.crmTeams.findFirst() || await prisma.crmTeams.create({
      data: { teamName: 'Resolved Test Team' },
    });

    testRole = await prisma.crmRoles.findFirst() || await prisma.crmRoles.create({
      data: { roleName: 'Resolved Test Role' },
    });

    testUser = await prisma.users.create({
      data: {
        name: 'Resolved Test Agent',
        username: 'resolved_test_agent',
        teamId: testTeam.teamId,
        roleId: testRole.roleId,
        nickname: 'ResolvedAgentNick',
      },
    });

    testCustomer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Resolved Test Cust',
        customerEmail: 'resolved.cust@example.com',
        customerPhone: '111-222-3333',
      },
    });
  });

  it('should only classify and count an order as Resolved if it goes from Pending Resolutions to Completed Orders', async () => {
    // 1. Create order in 'Pending Resolutions' status
    const order = await prisma.crmOrders.create({
      data: {
        orderCustomerId: testCustomer.customerId,
        orderPart: 'Alternator',
        orderCurrentStatus: 'Pending Resolutions',
        saleStatus: '1', // Sold
        orderTotalPitched: '1000',
        orderAmountCharged: '1000',
        orderDate: new Date(),
        orderSalesAgentId: testUser.uid,
        orderSalesAgentName: 'ResolvedAgentNick',
      },
    });

    // Verify it doesn't show up in Resolved Orders yet
    const initialOrders = await orderService.getAllOrders({ status: 'Resolved Orders', page: 1, limit: 10 });
    const initialCounts = await getPendingCounts({});

    expect(initialOrders.data.length).toBe(0);
    expect(initialCounts['Resolved Orders']?.count || 0).toBe(0);

    // 2. Transition status from 'Pending Resolutions' to 'Completed Orders' via service
    await orderService.updateOrder(
      order.crmOrderId,
      { orderCurrentStatus: 'Completed Orders' },
      testUser.uid,
      'ResolvedAgentNick'
    );

    // Verify it now shows up in Resolved Orders
    const resolvedOrders = await orderService.getAllOrders({ status: 'Resolved Orders', page: 1, limit: 10 });
    const finalCounts = await getPendingCounts({});

    expect(resolvedOrders.data.length).toBe(1);
    expect(resolvedOrders.data[0].crmOrderId).toBe(order.crmOrderId);
    expect(finalCounts['Resolved Orders']?.count).toBe(1);
    expect(finalCounts['Resolved Orders']?.amount).toBe(1000);
  });
});
