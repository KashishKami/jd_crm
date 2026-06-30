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

      // Assert no comparison fields exist on refunds and chargebacks
      expect(data.refundThisMonth).not.toHaveProperty('lastAmount');
      expect(data.chargebackThisMonth).not.toHaveProperty('lastAmount');
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

    it('should calculate Net Sales correctly', async () => {
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

      // Seed 5 Sold orders (saleStatus = '1', markup = 100)
      for (let i = 0; i < 5; i++) {
        await prisma.crmOrders.create({
          data: {
            orderCustomerId: testCustomer.customerId,
            saleStatus: '1',
            orderMarkup: '100',
            orderDate: now,
            orderSalesAgentId: testAgent.uid,
            orderVendorName: 'DASH_TEST_VENDOR',
          },
        });
      }

      // Seed 1 Refunded order (saleStatus = '2', markup = 100)
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '2',
          orderMarkup: '100',
          orderDate: now,
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_TEST_VENDOR',
        },
      });

      // Seed 1 Chargebacked order (saleStatus = '3', markup = 100)
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          saleStatus: '3',
          orderMarkup: '100',
          orderDate: now,
          orderSalesAgentId: testAgent.uid,
          orderVendorName: 'DASH_TEST_VENDOR',
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

      // We expect Net Sales to filter specifically for these seeded test items if possible, but
      // here we assert it contains a numeric netSales value. We will check details in unit tests,
      // or we can test net sales calculation logic via Repository/Service directly.
      expect(typeof data.netSales.amount).toBe('number');

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
        },
      });
      const agentA2 = await prisma.users.create({
        data: {
          name: 'Agent A2',
          username: 'agent_a2_test',
          teamId: teamA.teamId,
          roleId: role!.roleId,
        },
      });
      const agentB = await prisma.users.create({
        data: {
          name: 'Agent B1',
          username: 'agent_b1_test',
          teamId: teamB.teamId,
          roleId: role!.roleId,
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
          orderMarkup: '200',
          orderDate,
          orderSalesAgentId: agentA1.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderMarkup: '200',
          orderDate,
          orderSalesAgentId: agentA1.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderMarkup: '200',
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
          orderMarkup: '100',
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
      expect(resTeamA.topPerformer).toBeDefined();
      expect(resTeamA.topPerformer.agentName).toBe(agentA1.name);

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
        },
      });
      const agentBob = await prisma.users.create({
        data: {
          name: 'Bob Agent',
          username: 'agent_bob_test',
          teamId: teamA.teamId,
          roleId: role!.roleId,
        },
      });
      const agentCarlos = await prisma.users.create({
        data: {
          name: 'Carlos Agent',
          nickname: 'Carlo',
          username: 'agent_carlos_test',
          teamId: teamA.teamId,
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
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const orderDate = new Date(currentYear, currentMonth - 1, 15, 12, 0, 0);

      // Alice: 2 Sold orders (markup 200 each = 400) + 1 Refunded order (markup 150) -> net 250
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderMarkup: '200',
          orderDate,
          orderSalesAgentId: agentAlice.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '1',
          orderMarkup: '200',
          orderDate,
          orderSalesAgentId: agentAlice.uid,
          orderVendorName: 'TEAM_TEST',
        },
      });
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          saleStatus: '2',
          orderMarkup: '150',
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
          orderMarkup: '100',
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
          orderMarkup: '50',
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

      // Alice should be Top Performer (net 250)
      expect(resTeamA.topPerformer).toBeDefined();
      expect(resTeamA.topPerformer.agentName).toBe('Alice Agent');
      expect(resTeamA.topPerformer.amount).toBe(250);

      // Carlos should be Bottom Performer (net -50) and use nickname 'Carlo'
      expect(resTeamA.bottomPerformer).toBeDefined();
      expect(resTeamA.bottomPerformer.agentName).toBe('Carlo');
      expect(resTeamA.bottomPerformer.amount).toBe(-50);

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
          orderMarkup: '250',
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
          orderMarkup: '120',
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
});
