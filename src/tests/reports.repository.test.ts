import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../lib/db';
import * as reportRepository from '../repository/report.repository';

describe('Report Repository Database Integration Tests (W-4401)', () => {
  let teamAId: number;
  let teamBId: number;
  let agent1Id: number;
  let agent2Id: number;
  let customerId: number;

  beforeEach(async () => {
    // Clean up test data
    await prisma.crmOrders.deleteMany({
      where: {
        orderSalesAgentName: { in: ['Report Agent One', 'Report Agent Two'] },
      },
    });
    await prisma.crmCustomers.deleteMany({
      where: {
        customerEmail: { in: ['report_test_cust@example.com'] },
      },
    });
    await prisma.users.deleteMany({
      where: {
        username: { in: ['report_test_agent_1', 'report_test_agent_2'] },
      },
    });
    await prisma.crmTeams.deleteMany({
      where: {
        teamName: { in: ['Report Team A', 'Report Team B'] },
      },
    });

    // Create teams
    const teamA = await prisma.crmTeams.create({
      data: { teamName: 'Report Team A' },
    });
    teamAId = teamA.teamId;

    const teamB = await prisma.crmTeams.create({
      data: { teamName: 'Report Team B' },
    });
    teamBId = teamB.teamId;

    // Create customer
    const customer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Report Customer',
        customerEmail: 'report_test_cust@example.com',
        customerPhone: '555-0199',
        customerBillingAddress: '123 Main St',
        customerShippingAddress: '123 Main St',
      },
    });
    customerId = customer.customerId;

    // Create agents
    const agent1 = await prisma.users.create({
      data: {
        name: 'Report Agent One',
        username: 'report_test_agent_1',
        password: 'hash',
        roleId: 2,
        teamId: teamAId,
        designation: 'Sales Specialist',
        nickname: 'AgentOne',
        status: 1,
      },
    });
    agent1Id = agent1.uid;

    const agent2 = await prisma.users.create({
      data: {
        name: 'Report Agent Two',
        username: 'report_test_agent_2',
        password: 'hash',
        roleId: 2,
        teamId: teamBId,
        designation: 'Sales Associate',
        nickname: 'AgentTwo',
        status: 1,
      },
    });
    agent2Id = agent2.uid;

    // Create orders across Jan & Feb 2026
    // Agent 1: 1 Sold order in Jan ($5000), 1 Refunded order in Jan ($1000)
    await prisma.crmOrders.create({
      data: {
        orderCustomerId: customerId,
        orderSalesAgentId: agent1Id,
        orderSalesAgentName: 'Report Agent One',
        orderDate: new Date(Date.UTC(2026, 0, 15, 12, 0, 0)),
        orderAmountCharged: '5000.00',
        orderRefundAmount: '0.00',
        saleStatus: '1', // Sold
        orderCurrentStatus: 'Completed Orders',
      },
    });
    await prisma.crmOrders.create({
      data: {
        orderCustomerId: customerId,
        orderSalesAgentId: agent1Id,
        orderSalesAgentName: 'Report Agent One',
        orderDate: new Date(Date.UTC(2026, 0, 20, 12, 0, 0)),
        orderAmountCharged: '1000.00',
        orderRefundAmount: '1000.00',
        saleStatus: '2', // Refunded
        orderCurrentStatus: 'Returned Orders',
      },
    });

    // Agent 2: 1 Sold order in Feb ($3000)
    await prisma.crmOrders.create({
      data: {
        orderCustomerId: customerId,
        orderSalesAgentId: agent2Id,
        orderSalesAgentName: 'Report Agent Two',
        orderDate: new Date(Date.UTC(2026, 1, 10, 12, 0, 0)),
        orderAmountCharged: '3000.00',
        orderRefundAmount: '0.00',
        saleStatus: '1', // Sold
        orderCurrentStatus: 'Completed Orders',
      },
    });
  });

  afterEach(async () => {
    await prisma.crmOrders.deleteMany({
      where: {
        orderSalesAgentName: { in: ['Report Agent One', 'Report Agent Two'] },
      },
    });
    await prisma.crmCustomers.deleteMany({
      where: {
        customerEmail: { in: ['report_test_cust@example.com'] },
      },
    });
    await prisma.users.deleteMany({
      where: {
        username: { in: ['report_test_agent_1', 'report_test_agent_2'] },
      },
    });
    await prisma.crmTeams.deleteMany({
      where: {
        teamName: { in: ['Report Team A', 'Report Team B'] },
      },
    });
  });

  it('should query aggregates grouped by agent, month, and saleStatus', async () => {
    const fromDate = new Date(Date.UTC(2026, 0, 1, 12, 0, 0));
    const toDate = new Date(Date.UTC(2026, 11, 31, 12, 0, 0));

    const aggregates = await reportRepository.getAgentSalesAggregates({
      dateFrom: fromDate,
      dateTo: toDate,
      granularity: 'monthly',
      teamIds: [teamAId, teamBId],
      agentIds: [agent1Id, agent2Id],
    });

    expect(aggregates).toBeDefined();
    expect(aggregates.length).toBeGreaterThanOrEqual(3);

    const agent1JanSold = aggregates.find(
      (a) => a.agentId === agent1Id && a.periodKey === '2026-01' && a.saleStatus === '1'
    );
    expect(agent1JanSold).toBeDefined();
    expect(agent1JanSold?.totalCharged).toBe(5000);
    expect(agent1JanSold?.orderCount).toBe(1);

    const agent1JanRefunded = aggregates.find(
      (a) => a.agentId === agent1Id && a.periodKey === '2026-01' && a.saleStatus === '2'
    );
    expect(agent1JanRefunded).toBeDefined();
    expect(agent1JanRefunded?.totalCharged).toBe(1000);
    expect(agent1JanRefunded?.totalRefund).toBe(1000);
    expect(agent1JanRefunded?.orderCount).toBe(1);

    const agent2FebSold = aggregates.find(
      (a) => a.agentId === agent2Id && a.periodKey === '2026-02' && a.saleStatus === '1'
    );
    expect(agent2FebSold).toBeDefined();
    expect(agent2FebSold?.totalCharged).toBe(3000);
    expect(agent2FebSold?.orderCount).toBe(1);
  });
});
