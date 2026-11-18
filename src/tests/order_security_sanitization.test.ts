import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/db';
import * as orderRepository from '../repository/order.repository';
import * as dashboardRepository from '../repository/dashboard.repository';

describe('W-5002: Order User Relations Security Sanitization Tests', () => {
  let createdOrderId: number;
  let testUserId: number;

  beforeEach(async () => {
    // Create a user with sensitive fields populated
    const team = await prisma.crmTeams.findFirst() || await prisma.crmTeams.create({
      data: { teamName: 'Security Test Team' }
    });
    const role = await prisma.crmRoles.findFirst() || await prisma.crmRoles.create({
      data: { roleName: 'Security Test Role' }
    });

    const user = await prisma.users.create({
      data: {
        name: 'Sensitive User',
        nickname: 'Sense',
        username: `sec_test_${Date.now()}`,
        password: '$2b$10$supersecretpasswordhashthatmustneverleak12345',
        agentSalary: '95000',
        agentTarget: '150000',
        mobile: '555-987-6543',
        teamId: team.teamId,
        roleId: role.roleId,
      }
    });
    testUserId = user.uid;

    const customer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Security Cust',
        customerEmail: `sec_cust_${Date.now()}@example.com`,
      }
    });

    const vendor = await prisma.crmVendors.findFirst() || await prisma.crmVendors.create({
      data: {
        vendorName: 'Sec Vendor',
        vendorPhone: '1112223333',
        vendorContactPerson: 'John Sec',
      }
    });

    // Create an order linking this sensitive user to all role fields
    const order = await prisma.crmOrders.create({
      data: {
        orderCustomerId: customer.customerId,
        orderVendorId: vendor.vendorId,
        orderVendorName: vendor.vendorName,
        orderSalesAgentId: user.uid,
        orderSalesAgentName: user.name,
        orderVerifierId: user.uid,
        orderVerifierName: user.name,
        orderSalesVerifierId: user.uid,
        orderSalesVerifierName: user.name,
        orderBackendExecutiveId: user.uid,
        orderBackendExecutiveName: user.name,
        orderPartFoundById: user.uid,
        orderPartFoundByName: user.name,
        orderPart: 'Security Test Engine',
        orderMakeModel: '2026 Test Mobile',
        orderAmountCharged: '1000',
        orderTotalPitched: '1500',
        orderVendorPrice: '500',
        saleStatus: '1',
        orderCurrentStatus: 'Pending Booking',
      }
    });
    createdOrderId = order.crmOrderId;

    // Also add a child part to test multi-part security
    await prisma.crmOrders.create({
      data: {
        parentOrderId: order.crmOrderId,
        orderCustomerId: customer.customerId,
        orderVendorId: vendor.vendorId,
        orderVendorName: vendor.vendorName,
        orderBackendExecutiveId: user.uid,
        orderPartFoundById: user.uid,
        orderPart: 'Security Test Transmission',
        orderMakeModel: '2026 Test Mobile',
        saleStatus: '1',
        orderCurrentStatus: 'Pending Booking',
      }
    });
  });

  afterEach(async () => {
    if (createdOrderId) {
      // Delete child parts first to avoid FK constraint violation
      await prisma.crmOrders.deleteMany({ where: { parentOrderId: createdOrderId } });
      await prisma.crmOrders.deleteMany({ where: { crmOrderId: createdOrderId } });
    }
    if (testUserId) {
      await prisma.users.deleteMany({ where: { uid: testUserId } });
    }
  });

  it('orderRepository.findById should NEVER expose password, agentSalary, agentTarget, or mobile on user relations', async () => {
    const order = await orderRepository.findById(createdOrderId);
    expect(order).toBeDefined();
    if (!order) throw new Error('Order not found');

    // Primary order relations
    const relations = [
      order.salesAgent,
      order.verifier,
      order.salesVerifier,
      order.backendExecutive,
      order.partFoundBy,
    ];

    for (const rel of relations) {
      if (rel) {
        expect(rel).not.toHaveProperty('password');
        expect(rel).not.toHaveProperty('agentSalary');
        expect(rel).not.toHaveProperty('agentTarget');
        expect(rel).not.toHaveProperty('mobile');
        // But safe display fields should still be accessible
        expect(rel).toHaveProperty('name');
        expect(rel).toHaveProperty('nickname');
      }
    }

    // Child order relations
    expect(order.childOrders?.length).toBeGreaterThan(0);
    if (order.childOrders) {
      for (const child of order.childOrders) {
        if (child.backendExecutive) {
          expect(child.backendExecutive).not.toHaveProperty('password');
          expect(child.backendExecutive).not.toHaveProperty('agentSalary');
          expect(child.backendExecutive).not.toHaveProperty('agentTarget');
          expect(child.backendExecutive).not.toHaveProperty('mobile');
        }
        if (child.partFoundBy) {
          expect(child.partFoundBy).not.toHaveProperty('password');
          expect(child.partFoundBy).not.toHaveProperty('agentSalary');
          expect(child.partFoundBy).not.toHaveProperty('agentTarget');
          expect(child.partFoundBy).not.toHaveProperty('mobile');
        }
      }
    }
  });

  it('orderRepository.findAll should NEVER expose password, agentSalary, agentTarget, or mobile on user relations', async () => {
    const result = await orderRepository.findAll({});
    const orders = Array.isArray(result) ? result : result.data;
    const testOrder = orders.find((o: any) => o.crmOrderId === createdOrderId);
    expect(testOrder).toBeDefined();
    if (!testOrder) throw new Error('Test order not found');

    const relations = [
      testOrder.salesAgent,
      testOrder.verifier,
      testOrder.salesVerifier,
      testOrder.backendExecutive,
    ];

    for (const rel of relations) {
      if (rel) {
        expect(rel).not.toHaveProperty('password');
        expect(rel).not.toHaveProperty('agentSalary');
        expect(rel).not.toHaveProperty('agentTarget');
        expect(rel).not.toHaveProperty('mobile');
      }
    }
  });

  it('dashboardRepository.getRecentOrders should NEVER expose password, agentSalary, agentTarget, or mobile on user relations', async () => {
    const recentOrders = await dashboardRepository.getRecentOrders(10);
    const testOrder = recentOrders.find((o: any) => o.crmOrderId === createdOrderId);
    expect(testOrder).toBeDefined();
    if (!testOrder) throw new Error('Test order not found');

    const relations = [
      testOrder.salesAgent,
      testOrder.verifier,
      testOrder.salesVerifier,
      testOrder.backendExecutive,
    ];

    for (const rel of relations) {
      if (rel) {
        expect(rel).not.toHaveProperty('password');
        expect(rel).not.toHaveProperty('agentSalary');
        expect(rel).not.toHaveProperty('agentTarget');
        expect(rel).not.toHaveProperty('mobile');
      }
    }
  });
});
