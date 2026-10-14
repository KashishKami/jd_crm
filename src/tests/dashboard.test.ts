import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Dashboard Integration Tests', () => {
  async function cleanupTestData() {
    await prisma.crmOrders.deleteMany({
      where: {
        OR: [
          { orderVendorName: 'DASH_TEST_VENDOR' },
          { orderVendorName: 'TEAM_TEST' }
        ]
      }
    });
    await prisma.crmCustomers.deleteMany({
      where: {
        customerEmail: { in: ['dash_cust@example.com', 'team_cust@example.com'] }
      }
    });
    await prisma.users.deleteMany({
      where: {
        username: { in: ['dashboard_test_agent_metrics', 'agent_a1_test', 'agent_a2_test', 'agent_b1_test', 'agent_alice_test', 'agent_bob_test', 'agent_carlos_test'] }
      }
    });
    await prisma.crmTeams.deleteMany({
      where: {
        teamName: { in: ['Test Team A', 'Test Team B'] }
      }
    });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('GET /api/dashboard/metrics', () => {
    it('should return 401 Unauthorized if there is no session', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const { GET } = await import('../app/api/dashboard/metrics/route');
      const req = new Request('http://localhost/api/dashboard/metrics');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return all metrics for super-admin with comparison details', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
      });

      const { GET } = await import('../app/api/dashboard/metrics/route');
      const req = new Request('http://localhost/api/dashboard/metrics');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('thisYearSales');
      expect(data).toHaveProperty('totalSalesThisMonth');
      expect(data).toHaveProperty('todaySales');
      expect(data).toHaveProperty('chargebackThisMonth');
      expect(data).toHaveProperty('refundThisMonth');
      expect(data).toHaveProperty('netSales');
      expect(data).toHaveProperty('topPerformers');
      expect(data).toHaveProperty('bottomPerformers');
      expect(data).toHaveProperty('recentOrders');
      expect(data).toHaveProperty('attendanceSummary');
      expect(data).toHaveProperty('pendingCounts');

      // Assert comparison fields exist on sales metrics
      expect(data.thisYearSales).toHaveProperty('lastAmount');
      expect(data.thisYearSales).toHaveProperty('lastCount');
      expect(data.thisYearSales).toHaveProperty('percentageChange');

      expect(data.totalSalesThisMonth).toHaveProperty('lastAmount');
      expect(data.totalSalesThisMonth).toHaveProperty('lastCount');
      expect(data.totalSalesThisMonth).toHaveProperty('percentageChange');

      expect(data.todaySales).toHaveProperty('lastAmount');
      expect(data.todaySales).toHaveProperty('lastCount');
      expect(data.todaySales).toHaveProperty('percentageChange');

      expect(data.netSales).toHaveProperty('lastAmount');
      expect(data.netSales).toHaveProperty('lastCount');
      expect(data.netSales).toHaveProperty('percentageChange');

      // Assert comparison fields exist on refunds and chargebacks
      expect(data.refundThisMonth).toHaveProperty('lastAmount');
      expect(data.chargebackThisMonth).toHaveProperty('lastAmount');

      // Assert sparklineData exists and is correct format
      expect(data.thisYearSales).toHaveProperty('sparklineData');
      expect(Array.isArray(data.thisYearSales.sparklineData)).toBe(true);
      expect(data.thisYearSales.sparklineData.length).toBe(5);

      expect(data.totalSalesThisMonth).toHaveProperty('sparklineData');
      expect(Array.isArray(data.totalSalesThisMonth.sparklineData)).toBe(true);
      expect(data.totalSalesThisMonth.sparklineData.length).toBe(6);

      expect(data.todaySales).toHaveProperty('sparklineData');
      expect(Array.isArray(data.todaySales.sparklineData)).toBe(true);
      expect(data.todaySales.sparklineData.length).toBe(7);

      expect(data.netSales).toHaveProperty('sparklineData');
      expect(Array.isArray(data.netSales.sparklineData)).toBe(true);
      expect(data.netSales.sparklineData.length).toBe(6);

      expect(data.refundThisMonth).toHaveProperty('sparklineData');
      expect(Array.isArray(data.refundThisMonth.sparklineData)).toBe(true);
      expect(data.refundThisMonth.sparklineData.length).toBe(6);

      expect(data.chargebackThisMonth).toHaveProperty('sparklineData');
      expect(Array.isArray(data.chargebackThisMonth.sparklineData)).toBe(true);
      expect(data.chargebackThisMonth.sparklineData.length).toBe(6);
    });

    it('should restrict metrics based on permissions', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Restricted User', userPermissions: 'dashboard:total-sales' },
      });

      const { GET } = await import('../app/api/dashboard/metrics/route');
      const req = new Request('http://localhost/api/dashboard/metrics');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('thisYearSales');
      expect(data).not.toHaveProperty('topPerformers');
      expect(data).not.toHaveProperty('bottomPerformers');
      expect(data).not.toHaveProperty('netSales');
    });

    it('[RED] should calculate Net Sales using finalMargin and calculate Refund/Chargeback metric amounts correctly', async () => {
      // Find or create test team and role
      const team = await prisma.crmTeams.findFirst();
      const role = await prisma.crmRoles.findFirst();

      const testAgent = await prisma.users.create({
        data: {
          name: 'Dashboard Test Agent',
          username: 'dashboard_test_agent_metrics',
          teamId: team!.teamId,
          roleId: role!.roleId,
        },
      });

      const testCustomer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Dashboard Customer',
          customerEmail: 'dash_cust@example.com',
        },
      });

      const now = new Date();

      // Seed 3 Sold orders (saleStatus = '1', markup = 100, refundAmount = '0')
      for (let i = 0; i < 3; i++) {
        await prisma.crmOrders.create({
          data: {
            orderCustomerId: testCustomer.customerId,
            saleStatus: '1',
            orderAmountCharged: '100',
            orderRefundAmount: '0',
            orderDate: now,
            orderSalesAgentId: testAgent.uid,
            orderVendorName: 'DASH_TEST_VENDOR',
          },
        });
      }

      // Seed 1 Partial Refund order (saleStatus = '4', markup = 100, refundAmount = '30.00')
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '4',
          orderAmountCharged: '100',
          orderRefundAmount: '30.00',
          orderDate: now,
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_TEST_VENDOR',
          orderCreatedDate: now,
        },
      });

      // Seed 1 Refunded order (saleStatus = '2', markup = 120, refundAmount = '120.00')
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '120',
          orderRefundAmount: '120.00',
          orderDate: now,
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_TEST_VENDOR',
          orderCreatedDate: now,
        },
      });

      // Seed 1 Chargebacked order (saleStatus = '3', markup = 150, refundAmount = '150.00')
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '3',
          orderAmountCharged: '150',
          orderRefundAmount: '150.00',
          orderDate: now,
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_TEST_VENDOR',
          orderCreatedDate: now,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
      });

      const { GET } = await import('../app/api/dashboard/metrics/route');
      const req = new Request('http://localhost/api/dashboard/metrics');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      // Expected Net Sales:
      // Sold: 3 * 100 = 300
      // Partial Refund: 100 - 30 = 70
      // Refunded: 0
      // Chargebacked: 0
      // Total: 370
      // We query repository functions below to test the specific calculation directly
      const { getNetSales } = await import('../repository/dashboard.repository');
      const netRes = await getNetSales({ orderVendorName: 'DASH_TEST_VENDOR' });
      expect(netRes.amount).toBe(370);

      // Verify Refund/Chargeback metrics are sums of orderRefundAmount
      const { getRefundThisMonth, getChargebackThisMonth, getChargedBetweenDates } = await import('../repository/dashboard.repository');
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const refundRes = await getRefundThisMonth(startOfMonth, endOfMonth);
      expect(refundRes.amount).toBe(120);

      const chargebackRes = await getChargebackThisMonth(startOfMonth, endOfMonth);
      expect(chargebackRes.amount).toBe(150);

      const chargedRes = await getChargedBetweenDates(startOfMonth, endOfMonth, { orderVendorName: 'DASH_TEST_VENDOR' });
      expect(chargedRes.amount).toBe(670);
      expect(chargedRes.count).toBe(6);

      const { getSparklineData } = await import('../repository/dashboard.repository');
      const sparkRes = await getSparklineData(startOfMonth, endOfMonth, ['1', '2', '3', '4'], 'monthly', { orderVendorName: 'DASH_TEST_VENDOR' });
      const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const matchingLabel = sparkRes.find(r => r.label === monthLabel);
      expect(matchingLabel?.amount).toBe(670);

      // Cleanup
      await prisma.crmOrders.deleteMany({ where: { orderSalesAgentId: testAgent.uid } });
      await prisma.crmCustomers.delete({ where: { customerId: testCustomer.customerId } });
      await prisma.users.delete({ where: { uid: testAgent.uid } });
    });
  });

  describe('GET /api/dashboard/teams/monthly', () => {
    it('should return 403 Forbidden if user lacks dashboard:team-monthly-scores permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Agent', userPermissions: 'dashboard:total-sales' },
      });

      const { GET } = await import('../app/api/dashboard/teams/monthly/route');
      const req = new Request('http://localhost/api/dashboard/teams/monthly?month=6&year=2026');
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it('should return team monthly scores when permitted', async () => {
      // Find or create test roles
      const role = await prisma.crmRoles.findFirst();

      // Create two teams
      const teamA = await prisma.crmTeams.create({ data: { teamName: 'Test Team A' } });
      const teamB = await prisma.crmTeams.create({ data: { teamName: 'Test Team B' } });

      // Create agents
      const agentA1 = await prisma.users.create({
        data: {
          name: 'Agent A1',
          username: 'agent_a1_test',
          teamId: teamA.teamId,
          roleId: role!.roleId,
          designation: 'Sales Associate',
        },
      });
      const agentA2 = await prisma.users.create({
        data: {
          name: 'Agent A2',
          username: 'agent_a2_test',
          teamId: teamA.teamId,
          roleId: role!.roleId,
          designation: 'Sales Associate',
        },
      });
      const agentB = await prisma.users.create({
        data: {
          name: 'Agent B1',
          username: 'agent_b1_test',
          teamId: teamB.teamId,
          roleId: role!.roleId,
          designation: 'Sales Associate',
        },
      });

      const customer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Team Customer',
          customerEmail: 'team_cust@example.com',
        },
      });

      // Target month: June 2026
      const orderDate = new Date('2026-06-15T12:00:00Z');

      // Team A: 3 sold orders (markup 200 each)
      // Agent A1: 2 orders (400 markup total)
      // Agent A2: 1 order (200 markup total)
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '200',
          orderDate,
          orderSalesAgentId: agentA1.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '200',
          orderDate,
          orderSalesAgentId: agentA1.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '200',
          orderDate,
          orderSalesAgentId: agentA2.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });

      // Team B: 1 sold order (markup 100)
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '100',
          orderDate,
          orderSalesAgentId: agentB.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Manager', userPermissions: 'dashboard:team-monthly-scores,dashboard:team-top-performer,dashboard:team-bottom-performer' },
      });

      const { GET } = await import('../app/api/dashboard/teams/monthly/route');
      const req = new Request('http://localhost/api/dashboard/teams/monthly?month=6&year=2026');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data)).toBe(true);

      const resTeamA = data.find((t: { teamId: number }) => t.teamId === teamA.teamId);
      const resTeamB = data.find((t: { teamId: number }) => t.teamId === teamB.teamId);

      expect(resTeamA).toBeDefined();
      expect(resTeamA.soldCount).toBe(3);
      expect(resTeamA.netAmount).toBe(600);
      expect(resTeamA.topPerformers).toBeDefined();
      expect(resTeamA.topPerformers[0].agentName).toBe(agentA1.name);

      expect(resTeamB).toBeDefined();
      expect(resTeamB.soldCount).toBe(1);
      expect(resTeamB.netAmount).toBe(100);

      // Cleanup
      await prisma.crmOrders.deleteMany({ where: { orderVendorName: 'TEAM_TEST' } });
      await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
      await prisma.users.deleteMany({
        where: { uid: { in: [agentA1.uid, agentA2.uid, agentB.uid] } },
      });
      await prisma.crmTeams.deleteMany({
        where: { teamId: { in: [teamA.teamId, teamB.teamId] } },
      });
    });

    it('should calculate top and bottom performers by net scores (deducting refunds/chargebacks) and use agent nicknames', async () => {
      // Find or create test roles
      const role = await prisma.crmRoles.findFirst();

      // Create Team A
      const teamA = await prisma.crmTeams.create({ data: { teamName: 'Test Team A' } });

      // Create agents: Alice (no nickname), Bob (no nickname), Carlos (nickname: Carlo)
      const agentAlice = await prisma.users.create({
        data: {
          name: 'Alice Agent',
          username: 'agent_alice_test',
          teamId: teamA.teamId,
          roleId: role!.roleId,
          designation: 'Sales Associate',
        },
      });
      const agentBob = await prisma.users.create({
        data: {
          name: 'Bob Agent',
          username: 'agent_bob_test',
          teamId: teamA.teamId,
          roleId: role!.roleId,
          designation: 'Sales Associate',
        },
      });
      const agentCarlos = await prisma.users.create({
        data: {
          name: 'Carlos Agent',
          nickname: 'Carlo',
          username: 'agent_carlos_test',
          teamId: teamA.teamId,
          roleId: role!.roleId,
          designation: 'Sales Associate',
        },
      });

      const customer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Team Customer',
          customerEmail: 'team_cust@example.com',
        },
      });

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const orderDate = new Date(currentYear, currentMonth - 1, 15, 12, 0, 0);

      // Alice: 2 Sold orders (markup 200 each = 400) + 1 Refunded order (markup 150) -> net 250
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '200',
          orderDate,
          orderSalesAgentId: agentAlice.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '200',
          orderDate,
          orderSalesAgentId: agentAlice.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '2',
          orderAmountCharged: '150',
          orderDate,
          orderSalesAgentId: agentAlice.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });

      // Bob: 1 Sold order (markup 100) -> net 100
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '100',
          orderDate,
          orderSalesAgentId: agentBob.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });

      // Carlos: 0 Sold + 1 Chargeback order (markup 50) -> net -50
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '3',
          orderAmountCharged: '50',
          orderDate,
          orderSalesAgentId: agentCarlos.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Manager', userPermissions: 'dashboard:team-monthly-scores,dashboard:team-top-performer,dashboard:team-bottom-performer' },
      });

      const { GET } = await import('../app/api/dashboard/teams/monthly/route');
      const req = new Request(`http://localhost/api/dashboard/teams/monthly?month=${currentMonth}&year=${currentYear}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      const resTeamA = data.find((t: { teamId: number }) => t.teamId === teamA.teamId);
      expect(resTeamA).toBeDefined();

      // Alice should be Top Performer (net 400 because refunded order contributes 0)
      expect(resTeamA.topPerformers).toBeDefined();
      expect(resTeamA.topPerformers[0].agentName).toBe('Alice Agent');
      expect(resTeamA.topPerformers[0].amount).toBe(400);

      // Carlos should be Bottom Performer (net 0 because chargeback order contributes 0) and use nickname 'Carlo'
      expect(resTeamA.bottomPerformers).toBeDefined();
      expect(resTeamA.bottomPerformers[0].agentName).toBe('Carlo');
      expect(resTeamA.bottomPerformers[0].amount).toBe(0);

      // Cleanup
      await prisma.crmOrders.deleteMany({ where: { orderVendorName: 'TEAM_TEST' } });
      await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
      await prisma.users.deleteMany({
        where: { uid: { in: [agentAlice.uid, agentBob.uid, agentCarlos.uid] } },
      });
      await prisma.crmTeams.delete({ where: { teamId: teamA.teamId } });
    });
  });

  describe('GET /api/dashboard/advanced-chart', () => {
    it('should return 401 Unauthorized if there is no session', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const { GET } = await import('../app/api/dashboard/advanced-chart/route');
      const req = new Request('http://localhost/api/dashboard/advanced-chart');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 Forbidden if user lacks dashboard:view-advanced-chart permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Agent', userPermissions: 'dashboard:total-sales' },
      });

      const { GET } = await import('../app/api/dashboard/advanced-chart/route');
      const req = new Request('http://localhost/api/dashboard/advanced-chart?range=7d');
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it('should return 200 OK if user lacks dashboard:view-advanced-chart permission but provides a specific agentId', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Agent', userPermissions: 'dashboard:total-sales' },
      });

      const { GET } = await import('../app/api/dashboard/advanced-chart/route');
      const req = new Request('http://localhost/api/dashboard/advanced-chart?range=7d&agentId=101');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return 7 items for range 7d for permitted user with clustered columns data', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
      });

      const { GET } = await import('../app/api/dashboard/advanced-chart/route');
      const req = new Request('http://localhost/api/dashboard/advanced-chart?range=7d');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(7);
      expect(data[0]).toHaveProperty('label');
      expect(data[0]).toHaveProperty('salesAmount');
      expect(data[0]).toHaveProperty('salesCount');
      expect(data[0]).toHaveProperty('refundsAmount');
      expect(data[0]).toHaveProperty('refundsCount');
      expect(data[0]).toHaveProperty('chargebacksAmount');
      expect(data[0]).toHaveProperty('chargebacksCount');
    });

    it('should filter by teamId (Center) and agentId and return monthly values for range year', async () => {
      // Find or create test team/role
      const team = await prisma.crmTeams.create({ data: { teamName: 'Test Team A' } });
      const role = await prisma.crmRoles.findFirst();

      const agent = await prisma.users.create({
        data: {
          name: 'Agent A1',
          username: 'agent_a1_test',
          teamId: team.teamId,
          roleId: role!.roleId,
        },
      });

      const customer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Team Customer',
          customerEmail: 'team_cust@example.com',
        },
      });

      const now = new Date();
      const orderDate = new Date(now.getFullYear(), now.getMonth(), 15);

      // 1 Sales (Sold) order
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '250',
          orderDate,
          orderSalesAgentId: agent.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });

      // 1 Refund order
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '2',
          orderAmountCharged: '120',
          orderRefundAmount: '120',
          orderDate,
          orderSalesAgentId: agent.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Manager', userPermissions: 'dashboard:view-advanced-chart' },
      });

      const { GET } = await import('../app/api/dashboard/advanced-chart/route');
      const req = new Request(`http://localhost/api/dashboard/advanced-chart?teamId=${team.teamId}&agentId=${agent.uid}&range=year`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(12);

      const currentMonthIndex = now.getMonth();
      expect(data[currentMonthIndex].salesAmount).toBe(250);
      expect(data[currentMonthIndex].salesCount).toBe(1);
      expect(data[currentMonthIndex].refundsAmount).toBe(120);
      expect(data[currentMonthIndex].refundsCount).toBe(1);
      expect(data[currentMonthIndex].chargebacksAmount).toBe(0);
      expect(data[currentMonthIndex].chargebacksCount).toBe(0);

      // Cleanup
      await prisma.crmOrders.deleteMany({ where: { orderVendorName: 'TEAM_TEST' } });
      await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
      await prisma.users.delete({ where: { uid: agent.uid } });
      await prisma.crmTeams.delete({ where: { teamId: team.teamId } });
  });
  });

  describe('GET /api/dashboard/champions-league', () => {
    it('should return 401 Unauthorized if there is no session', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const { GET } = await import('../app/api/dashboard/champions-league/route');
      const req = new Request('http://localhost/api/dashboard/champions-league');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 Forbidden if user lacks performer permissions', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Agent', userPermissions: 'dashboard:total-sales' },
      });

      const { GET } = await import('../app/api/dashboard/champions-league/route');
      const req = new Request('http://localhost/api/dashboard/champions-league?month=6&year=2026');
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it('[RED] should return top and bottom performers filtered by month and year and using finalMargin ranking', async () => {
      const role = await prisma.crmRoles.findFirst();
      const team = await prisma.crmTeams.findFirst();

      const agentAlice = await prisma.users.create({
        data: {
          name: 'Alice Agent',
          username: 'agent_alice_test',
          teamId: team!.teamId,
          roleId: role!.roleId,
          designation: 'Sales Associate',
        },
      });
      const agentBob = await prisma.users.create({
        data: {
          name: 'Bob Agent',
          username: 'agent_bob_test',
          teamId: team!.teamId,
          roleId: role!.roleId,
          designation: 'Sales Specialist',
        },
      });

      const customer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Team Customer',
          customerEmail: 'team_cust@example.com',
        },
      });

      // Target: June 2026
      const targetDate = new Date('2026-06-15T12:00:00Z');
      // Other month: May 2026 (should not be included)
      const otherDate = new Date('2026-05-15T12:00:00Z');

      // Alice (June): markup 500, refund 100 -> finalMargin 400
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '4',
          orderAmountCharged: '500',
          orderRefundAmount: '100',
          orderDate: targetDate,
          orderSalesAgentId: agentAlice.uid,
          orderSalesAgentName: agentAlice.name,
          orderVendorName: 'TEAM_TEST',
        },
      });

      // Alice (May): markup 1000 -> should not count for June query
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '1000',
          orderDate: otherDate,
          orderSalesAgentId: agentAlice.uid,
          orderSalesAgentName: agentAlice.name,
          orderVendorName: 'TEAM_TEST',
        },
      });

      // Bob (June): markup 200 -> finalMargin 200
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '200',
          orderRefundAmount: '0',
          orderDate: targetDate,
          orderSalesAgentId: agentBob.uid,
          orderSalesAgentName: agentBob.name,
          orderVendorName: 'TEAM_TEST',
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
      });

      const { GET } = await import('../app/api/dashboard/champions-league/route');
      const req = new Request('http://localhost/api/dashboard/champions-league?month=6&year=2026');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('topPerformers');
      expect(data).toHaveProperty('bottomPerformers');

      // Top performers sort: Alice (400) first, Bob (200) second
      expect(data.topPerformers.length).toBeGreaterThanOrEqual(2);
      expect(data.topPerformers[0].agentName).toBe('Alice Agent');
      expect(data.topPerformers[0].totalSales).toBe(400);
      expect(data.topPerformers[1].agentName).toBe('Bob Agent');
      expect(data.topPerformers[1].totalSales).toBe(200);

      // Cleanup
      await prisma.crmOrders.deleteMany({ where: { orderVendorName: 'TEAM_TEST' } });
      await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
      await prisma.users.deleteMany({
        where: { uid: { in: [agentAlice.uid, agentBob.uid] } },
      });
    });

    it('should only return front-line sales designations in Champions League and support new detailed columns', async () => {
      const role = await prisma.crmRoles.findFirst();
      const team = await prisma.crmTeams.findFirst();

      const salesAgent = await prisma.users.create({
        data: {
          name: 'Sales Rep',
          username: 'agent_alice_test',
          teamId: team!.teamId,
          roleId: role!.roleId,
          designation: 'Sales Specialist',
        },
      });
      const qaAgent = await prisma.users.create({
        data: {
          name: 'QA Rep',
          username: 'agent_bob_test',
          teamId: team!.teamId,
          roleId: role!.roleId,
          designation: 'Quality Associate',
        },
      });

      const customer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Team Customer',
          customerEmail: 'team_cust@example.com',
        },
      });

      const targetDate = new Date('2026-06-15T12:00:00Z');

      // Sales agent: 2 completed orders (margin 300 and 150) and 1 leakage order (charged 100, refunded 100)
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '300',
          orderRefundAmount: '0',
          orderDate: targetDate,
          orderSalesAgentId: salesAgent.uid,
          orderSalesAgentName: salesAgent.name,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '4',
          orderAmountCharged: '200',
          orderRefundAmount: '50',
          orderDate: targetDate,
          orderSalesAgentId: salesAgent.uid,
          orderSalesAgentName: salesAgent.name,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '2',
          orderAmountCharged: '100',
          orderRefundAmount: '100',
          orderDate: targetDate,
          orderSalesAgentId: salesAgent.uid,
          orderSalesAgentName: salesAgent.name,
          orderVendorName: 'TEAM_TEST',
        },
      });

      // QA agent order (should NOT be returned because of designation)
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderAmountCharged: '1000',
          orderRefundAmount: '0',
          orderDate: targetDate,
          orderSalesAgentId: qaAgent.uid,
          orderSalesAgentName: qaAgent.name,
          orderVendorName: 'TEAM_TEST',
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
      });

      const { GET } = await import('../app/api/dashboard/champions-league/route');
      const req = new Request('http://localhost/api/dashboard/champions-league?month=6&year=2026');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();

      // Top performers must NOT contain QA Rep
      const topNames = data.topPerformers.map((p: any) => p.agentName);
      expect(topNames).not.toContain('QA Rep');
      expect(topNames).toContain('Sales Rep');

      const repRow = data.topPerformers.find((p: any) => p.agentName === 'Sales Rep');
      expect(repRow).toBeDefined();
      expect(repRow).toHaveProperty('agentId');
      expect(typeof repRow.agentId).toBe('number');
      expect(repRow.salesCount).toBe(3);
      expect(repRow.leakage).toBe(100);
      expect(repRow.totalSales).toBe(450); // (300 - 0) + (200 - 50) = 450

      // Cleanup
      await prisma.crmOrders.deleteMany({ where: { orderVendorName: 'TEAM_TEST' } });
      await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
      await prisma.users.deleteMany({
        where: { uid: { in: [salesAgent.uid, qaAgent.uid] } },
      });
    });
  });

  describe('W-4301 — Date Boundary Filter in Pending Counts', () => {
    it('should include September 30 order and exclude October 1 order in pending counts for September', async () => {
      const customer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Pending Count Date Test Cust',
          customerEmail: 'pending.date@example.com',
        },
      });

      const orderSept30 = await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderCurrentStatus: 'Pending Booking',
          saleStatus: '1',
          orderAmountCharged: '500',
          orderRefundAmount: '0',
          orderDate: new Date(Date.UTC(2026, 8, 30, 12, 0, 0)), // 2026-09-30
          orderVendorName: 'DATE_BOUNDARY_TEST',
        },
      });

      const orderOct01 = await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderCurrentStatus: 'Pending Booking',
          saleStatus: '1',
          orderAmountCharged: '700',
          orderRefundAmount: '0',
          orderDate: new Date(Date.UTC(2026, 9, 1, 12, 0, 0)), // 2026-10-01
          orderVendorName: 'DATE_BOUNDARY_TEST',
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'orders:view' },
      });

      try {
        const { GET } = await import('../app/api/orders/pending-counts/route');
        const req = new Request('http://localhost/api/orders/pending-counts?dateFrom=2026-09-01&dateTo=2026-09-30');
        const res = await GET(req);

        expect(res.status).toBe(200);
        const data = await res.json();

        // Pending Booking should include 500 from Sept 30, NOT 700 from Oct 1
        expect(data['Pending Booking'].count).toBeGreaterThanOrEqual(1);
        expect(data['Pending Booking'].amount).toBeGreaterThanOrEqual(500);

        // Test October 1st specifically
        vi.mocked(getServerSession).mockResolvedValueOnce({
          user: { id: '1', name: 'Super Admin', userPermissions: 'orders:view' },
        });
        const reqOct = new Request('http://localhost/api/orders/pending-counts?dateFrom=2026-10-01&dateTo=2026-10-31');
        const resOct = await GET(reqOct);
        expect(resOct.status).toBe(200);
        const dataOct = await resOct.json();
        expect(dataOct['Pending Booking'].amount).toBeGreaterThanOrEqual(700);
      } finally {
        await prisma.crmOrders.deleteMany({ where: { orderVendorName: 'DATE_BOUNDARY_TEST' } });
        await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
      }
    });
  });

  describe('W-4701 — Dashboard Metric Cards Cash-Basis Realization (Refunds, Chargebacks & Net Sales with EST Timezone Boundaries)', () => {
    let testAgent: any;
    let testCustomer: any;

    beforeEach(async () => {
      vi.useFakeTimers();
      // Lock system time to Oct 15, 2026, 12:00 EDT (16:00 UTC)
      vi.setSystemTime(new Date('2026-10-15T16:00:00.000Z'));

      const team = await prisma.crmTeams.findFirst();
      const role = await prisma.crmRoles.findFirst();

      testAgent = await prisma.users.create({
        data: {
          name: 'Realized Metrics Agent',
          username: 'realized_test_agent',
          teamId: team!.teamId,
          roleId: role!.roleId,
        },
      });

      testCustomer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Realized Test Customer',
          customerEmail: 'realized_cust@example.com',
        },
      });
    });

    afterEach(async () => {
      vi.useRealTimers();
      if (testAgent) {
        await prisma.crmSaleStatusHistory.deleteMany({
          where: { order: { orderSalesAgentId: testAgent.uid } }
        });
        await prisma.crmOrders.deleteMany({ where: { orderSalesAgentId: testAgent.uid, parentOrderId: { not: null } } });
        await prisma.crmOrders.deleteMany({ where: { orderSalesAgentId: testAgent.uid } });
        await prisma.users.delete({ where: { uid: testAgent.uid } });
      }
      if (testCustomer) {
        await prisma.crmCustomers.delete({ where: { customerId: testCustomer.customerId } });
      }
    });

    it('should include prior-month sale refunded in current month into current month refundThisMonth', async () => {
      // 1. Order sold in September 2026 (prior month)
      const septOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2', // Refunded
          orderAmountCharged: '500',
          orderRefundAmount: '500.00',
          orderDate: new Date(Date.UTC(2026, 8, 15, 12, 0)), // Sept 15, 2026
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });

      // Status change history says it was refunded on October 10, 2026 (current month)
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: septOrder.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-10T14:30:00.000Z'), // in October
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
      });

      const { GET } = await import('../app/api/dashboard/metrics/route');
      const req = new Request('http://localhost/api/dashboard/metrics');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.refundThisMonth.amount).toBeGreaterThanOrEqual(500);
      expect(data.refundThisMonth.count).toBeGreaterThanOrEqual(1);
    });

    it('should include current-month sale refunded in current month into refundThisMonth', async () => {
      const octOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '250',
          orderRefundAmount: '250.00',
          orderDate: new Date(Date.UTC(2026, 9, 5, 12, 0)), // Oct 5, 2026
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });

      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: octOrder.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-12T16:00:00.000Z'),
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
      });

      const { GET } = await import('../app/api/dashboard/metrics/route');
      const req = new Request('http://localhost/api/dashboard/metrics');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.refundThisMonth.amount).toBeGreaterThanOrEqual(250);
    });

    it('should exclude current-month sale refunded in next month from current month refundThisMonth', async () => {
      const octOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '300',
          orderRefundAmount: '300.00',
          orderDate: new Date(Date.UTC(2026, 9, 20, 12, 0)), // Oct 20, 2026
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });

      // Refunded in November (next month)
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: octOrder.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-11-02T15:00:00.000Z'),
        },
      });

      const { getRealizedRefundsBetweenDates } = await import('../repository/dashboard.repository');
      // October EST is 2026-10-01T04:00:00Z to 2026-11-01T04:00:00Z
      const res = await getRealizedRefundsBetweenDates(
        new Date('2026-10-01T04:00:00.000Z'),
        new Date('2026-11-01T04:00:00.000Z')
      );
      // The $300 refund from Nov 2 must NOT be included in October
      expect(res.amount).toBe(0);
      expect(res.count).toBe(0);
    });

    it('should handle month-start timezone boundary correctly (EDT vs UTC)', async () => {
      // Order A: Refund at Oct 1 00:05 EDT -> 2026-10-01T04:05:00.000Z (INCLUDED in October)
      const orderA = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '100',
          orderRefundAmount: '100.00',
          orderDate: new Date(Date.UTC(2026, 8, 20, 12, 0)), // Sept 20
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: orderA.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-01T04:05:00.000Z'),
        },
      });

      // Order B: Refund at Sept 30 23:55 EDT -> 2026-10-01T03:55:00.000Z (EXCLUDED from October, belongs to September)
      const orderB = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '500',
          orderRefundAmount: '500.00',
          orderDate: new Date(Date.UTC(2026, 8, 20, 12, 0)), // Sept 20
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: orderB.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-01T03:55:00.000Z'),
        },
      });

      const { getRealizedRefundsBetweenDates } = await import('../repository/dashboard.repository');
      const res = await getRealizedRefundsBetweenDates(
        new Date('2026-10-01T04:00:00.000Z'),
        new Date('2026-11-01T04:00:00.000Z')
      );
      expect(res.amount).toBe(100);
      expect(res.count).toBe(1);
    });

    it('should handle month-end timezone boundary correctly (EDT vs UTC)', async () => {
      // Order C: Refund at Oct 31 23:55 EDT -> 2026-11-01T03:55:00.000Z (INCLUDED in October)
      const orderC = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '150',
          orderRefundAmount: '150.00',
          orderDate: new Date(Date.UTC(2026, 9, 10, 12, 0)),
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: orderC.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-11-01T03:55:00.000Z'),
        },
      });

      // Order D: Refund at Nov 1 00:05 EDT -> 2026-11-01T04:05:00.000Z (EXCLUDED from October, belongs to November)
      const orderD = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '600',
          orderRefundAmount: '600.00',
          orderDate: new Date(Date.UTC(2026, 9, 10, 12, 0)),
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: orderD.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-11-01T04:05:00.000Z'),
        },
      });

      const { getRealizedRefundsBetweenDates } = await import('../repository/dashboard.repository');
      const res = await getRealizedRefundsBetweenDates(
        new Date('2026-10-01T04:00:00.000Z'),
        new Date('2026-11-01T04:00:00.000Z')
      );
      expect(res.amount).toBe(150);
      expect(res.count).toBe(1);
    });

    it('should calculate realized chargebacks in the current month correctly', async () => {
      const augOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '3', // Chargebacked
          orderAmountCharged: '400',
          orderRefundAmount: '400.00',
          orderDate: new Date(Date.UTC(2026, 7, 10, 12, 0)), // August
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: augOrder.crmOrderId,
          oldValue: '1',
          newValue: '3',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-14T18:00:00.000Z'),
        },
      });

      const { getRealizedChargebacksBetweenDates } = await import('../repository/dashboard.repository');
      const res = await getRealizedChargebacksBetweenDates(
        new Date('2026-10-01T04:00:00.000Z'),
        new Date('2026-11-01T04:00:00.000Z')
      );
      expect(res.amount).toBe(400);
      expect(res.count).toBe(1);
    });

    it('should deduct realized refunds and chargebacks from monthly charged sales for Net Sales calculation', async () => {
      // 1 Sold order in October: $1,000
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '1',
          orderAmountCharged: '1000',
          orderRefundAmount: '0',
          orderDate: new Date(Date.UTC(2026, 9, 10, 12, 0)), // October
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });

      // 1 September order refunded in October: $150
      const septRefunded = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '150',
          orderRefundAmount: '150.00',
          orderDate: new Date(Date.UTC(2026, 8, 15, 12, 0)), // September
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: septRefunded.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-12T14:00:00.000Z'),
        },
      });

      // 1 August order chargebacked in October: $100
      const augChargeback = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '3',
          orderAmountCharged: '100',
          orderRefundAmount: '100.00',
          orderDate: new Date(Date.UTC(2026, 7, 20, 12, 0)), // August
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: augChargeback.crmOrderId,
          oldValue: '1',
          newValue: '3',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-13T15:00:00.000Z'),
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
      });

      const { GET } = await import('../app/api/dashboard/metrics/route');
      const req = new Request('http://localhost/api/dashboard/metrics');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      // Total Charged Sales in October = 1000
      // Realized refunds in October = 150
      // Realized chargebacks in October = 100
      // Net Sales Realization = 1000 - 150 - 100 = 750
      expect(data.netSales.amount).toBe(750);
    });

    it('should not duplicate refund amounts for child parts of multi-part deals', async () => {
      const parentOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '500',
          orderRefundAmount: '500.00',
          orderDate: new Date(Date.UTC(2026, 8, 10, 12, 0)),
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });

      // Child part has parentOrderId set
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          parentOrderId: parentOrder.crmOrderId,
          saleStatus: null,
          orderCurrentStatus: 'Returned Orders',
          orderAmountCharged: null,
          orderRefundAmount: '500.00', // Denormalized or legacy child
          orderDate: null,
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_TEST',
        },
      });

      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: parentOrder.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-10T12:00:00.000Z'),
        },
      });

      const { getRealizedRefundsBetweenDates } = await import('../repository/dashboard.repository');
      const res = await getRealizedRefundsBetweenDates(
        new Date('2026-10-01T04:00:00.000Z'),
        new Date('2026-11-01T04:00:00.000Z')
      );
      expect(res.amount).toBe(500);
      expect(res.count).toBe(1);
    });

    it('W-4801: getRealizedSparklineData deduplicates multiple status transitions for the same order', async () => {
      const { getRealizedSparklineData } = await import('../repository/dashboard.repository');

      const dupOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '300',
          orderRefundAmount: '300.00',
          orderDate: new Date('2026-08-01T12:00:00.000Z'),
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_SPARK_TEST',
        },
      });

      // Insert two transitions to '2' for the same order within September
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: dupOrder.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-09-10T14:00:00.000Z'),
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: dupOrder.crmOrderId,
          oldValue: '4',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-09-25T16:00:00.000Z'),
        },
      });

      const res = await getRealizedSparklineData(
        new Date('2026-09-01T04:00:00.000Z'),
        new Date('2026-10-01T04:00:00.000Z'),
        '2',
        'monthly'
      );

      const sep = res.find(r => r.label === '2026-09');
      // Must be 300, NOT 600
      expect(sep?.amount).toBe(300);
    });

    it('W-4801: getRealizedSparklineData buckets late-evening EDT transitions into the correct EST calendar month', async () => {
      const { getRealizedSparklineData } = await import('../repository/dashboard.repository');

      const lateOctOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderAmountCharged: '450',
          orderRefundAmount: '450.00',
          orderDate: new Date('2026-07-01T12:00:00.000Z'),
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_SPARK_TEST',
        },
      });

      // Oct 31, 2026 22:30 EDT = Nov 1, 2026 02:30:00 UTC
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: lateOctOrder.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-11-01T02:30:00.000Z'),
        },
      });

      const res = await getRealizedSparklineData(
        new Date('2026-10-01T04:00:00.000Z'),
        new Date('2026-12-01T05:00:00.000Z'),
        '2',
        'monthly'
      );

      const oct = res.find(r => r.label === '2026-10');
      const nov = res.find(r => r.label === '2026-11');
      // In EST/EDT, Oct 31 22:30 belongs to October
      expect(oct?.amount).toBe(450);
      expect(nov?.amount ?? 0).toBe(0);
    });

    it('W-4801: getRealizedSparklineData buckets winter EST (UTC-5) transitions correctly', async () => {
      const { getRealizedSparklineData } = await import('../repository/dashboard.repository');

      const lateJanOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '3',
          orderAmountCharged: '250',
          orderRefundAmount: '250.00',
          orderDate: new Date('2026-01-10T12:00:00.000Z'),
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_REALIZED_SPARK_TEST',
        },
      });

      // Jan 31, 2026 21:00 EST = Feb 1, 2026 02:00:00 UTC
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: lateJanOrder.crmOrderId,
          oldValue: '1',
          newValue: '3',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-02-01T02:00:00.000Z'),
        },
      });

      const res = await getRealizedSparklineData(
        new Date('2026-01-01T05:00:00.000Z'),
        new Date('2026-03-01T05:00:00.000Z'),
        '3',
        'monthly'
      );

      const jan = res.find(r => r.label === '2026-01');
      const feb = res.find(r => r.label === '2026-02');
      // In EST, Jan 31 21:00 belongs to January
      expect(jan?.amount).toBe(250);
      expect(feb?.amount ?? 0).toBe(0);
    });
  });

  describe('W-4904 — getPendingCounts realized/created dateType and Pending aggregate', () => {
    let testAgent: any;
    let testCustomer: any;

    beforeEach(async () => {
      const team = await prisma.crmTeams.findFirst();
      const role = await prisma.crmRoles.findFirst();

      testAgent = await prisma.users.create({
        data: {
          name: 'W4904 Test Agent',
          username: `w4904_agent_${Date.now()}`,
          teamId: team!.teamId,
          roleId: role!.roleId,
          status: 1,
          designation: 'Sales Associate',
        },
      });

      testCustomer = await prisma.crmCustomers.create({
        data: {
          customerName: 'W4904 Test Customer',
          customerEmail: `w4904_${Date.now()}@test.com`,
          customerPhone: '555-4904',
        },
      });
    });

    afterEach(async () => {
      await prisma.crmSaleStatusHistory.deleteMany({
        where: { order: { orderVendorName: 'W4904_TEST_PENDING' } },
      });
      await prisma.crmOrders.deleteMany({
        where: { orderVendorName: 'W4904_TEST_PENDING' },
      });
      if (testCustomer) {
        await prisma.crmCustomers.delete({ where: { customerId: testCustomer.customerId } }).catch(() => {});
      }
      if (testAgent) {
        await prisma.users.delete({ where: { uid: testAgent.uid } }).catch(() => {});
      }
    });

    it('[RED] getPendingCounts should support dateType=realized and count prior-month sales with realized refund in October', async () => {
      // Order 1: Order date Oct 6 (Oct sale), Refunded in Oct ($200)
      const order1 = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderDate: new Date('2026-10-06T12:00:00.000Z'),
          orderStatus: '1',
          saleStatus: '2',
          orderCurrentStatus: 'Returned Orders',
          orderAmountCharged: '200.00',
          orderRefundAmount: '200.00',
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'W4904_TEST_PENDING',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: order1.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-06T16:00:00.000Z'),
        },
      });

      // Order 2: Order date Sept 29 (Sept sale!), Refunded in Oct ($200)
      const order2 = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderDate: new Date('2026-09-29T12:00:00.000Z'),
          orderStatus: '1',
          saleStatus: '2',
          orderCurrentStatus: 'Returned Orders',
          orderAmountCharged: '200.00',
          orderRefundAmount: '200.00',
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'W4904_TEST_PENDING',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: order2.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-02T16:00:00.000Z'),
        },
      });

      // Order 3: Order date Sept 10 (Sept sale!), Refunded in Oct ($316)
      const order3 = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderDate: new Date('2026-09-10T12:00:00.000Z'),
          orderStatus: '1',
          saleStatus: '2',
          orderCurrentStatus: 'Returned Orders',
          orderAmountCharged: '316.00',
          orderRefundAmount: '316.00',
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'W4904_TEST_PENDING',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: order3.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-10-10T16:00:00.000Z'),
        },
      });

      // Order 4: Order date Sept 5 (Sept sale), Refunded in Sept ($150) -> MUST BE EXCLUDED from Oct realized!
      const order4 = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderDate: new Date('2026-09-05T12:00:00.000Z'),
          orderStatus: '1',
          saleStatus: '2',
          orderCurrentStatus: 'Returned Orders',
          orderAmountCharged: '150.00',
          orderRefundAmount: '150.00',
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'W4904_TEST_PENDING',
        },
      });
      await prisma.crmSaleStatusHistory.create({
        data: {
          orderId: order4.crmOrderId,
          oldValue: '1',
          newValue: '2',
          changedById: testAgent.uid,
          changedByName: testAgent.name,
          changedAt: new Date('2026-09-20T16:00:00.000Z'),
        },
      });

      const { getPendingCounts } = await import('../repository/dashboard.repository');
      const counts = await getPendingCounts({
        saleStatus: '2',
        dateType: 'realized',
        dateFrom: '2026-10-01',
        dateTo: '2026-10-31',
      });

      // All 3 October-realized refunds must be included ($200 + $200 + $316 = $716)
      expect(counts['Returned Orders'].count).toBe(3);
      expect(counts['Returned Orders'].amount).toBe(716);

      // Verify route /api/orders/pending-counts also accepts dateType=realized
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Super Admin', userPermissions: 'orders:view' },
      });
      const { GET } = await import('../app/api/orders/pending-counts/route');
      const req = new Request('http://localhost/api/orders/pending-counts?saleStatus=2&dateType=realized&dateFrom=2026-10-01&dateTo=2026-10-31');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data['Returned Orders'].count).toBe(3);
      expect(data['Returned Orders'].amount).toBe(716);
    });

    it('[RED] getPendingCounts should populate Pending aggregate key summing all 5 workflow queues', async () => {
      // Create 1 booking order and 1 shipment order
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderDate: new Date('2026-10-15T12:00:00.000Z'),
          orderStatus: '1',
          saleStatus: '1',
          orderCurrentStatus: 'Pending Booking',
          orderAmountCharged: '500.00',
          orderRefundAmount: '0.00',
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'W4904_TEST_PENDING',
        },
      });

      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderDate: new Date('2026-10-15T12:00:00.000Z'),
          orderStatus: '1',
          saleStatus: '1',
          orderCurrentStatus: 'Pending Shipment',
          orderAmountCharged: '300.00',
          orderRefundAmount: '0.00',
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'W4904_TEST_PENDING',
        },
      });

      const { getPendingCounts } = await import('../repository/dashboard.repository');
      const counts = await getPendingCounts({
        agentId: testAgent.uid,
      });

      expect(counts['Pending']).toBeDefined();
      const expectedCount =
        counts['Pending Booking'].count +
        counts['Pending Shipment'].count +
        counts['Pending Delivery'].count +
        counts['Pending Feedback'].count +
        counts['Pending Resolutions'].count;
      const expectedAmount =
        counts['Pending Booking'].amount +
        counts['Pending Shipment'].amount +
        counts['Pending Delivery'].amount +
        counts['Pending Feedback'].amount +
        counts['Pending Resolutions'].amount;

      expect(counts['Pending'].count).toBe(expectedCount);
      expect(counts['Pending'].amount).toBe(expectedAmount);
      expect(counts['Pending'].count).toBe(2);
      expect(counts['Pending'].amount).toBe(800);
    });
  });
});


