import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Gateway Management Integration Tests', () => {
  let testGateway: { gatewayId: number };

  beforeEach(async () => {
    vi.resetAllMocks();

    // Clean up any leftover test data
    await prisma.crmOrders.deleteMany({
      where: { orderVendorName: 'GW_TEST_VENDOR' },
    });
    await prisma.crmGateway.deleteMany({
      where: { gatewayName: 'Test Integration Gateway' },
    });

    const now = new Date();
    testGateway = await prisma.crmGateway.create({
      data: {
        gatewayName: 'Test Integration Gateway',
        gatewayStatus: 1,
        gatewayCreatedAt: now,
        gatewayUpdatedAt: now,
      },
    });
  });

  afterEach(async () => {
    await prisma.crmOrders.deleteMany({
      where: { orderVendorName: 'GW_TEST_VENDOR' },
    });
    await prisma.crmGateway.deleteMany({
      where: { gatewayName: 'Test Integration Gateway' },
    });
  });

  // ─── GET /api/gateways ────────────────────────────────────────────────────

  describe('GET /api/gateways', () => {
    it('should return 403 Forbidden if user lacks gateways:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Restricted User', userPermissions: 'agents:view' },
      });

      const { GET } = await import('../app/api/gateways/route');
      const req = new Request('http://localhost/api/gateways');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('should return 200 OK with list of gateways when user has gateways:view', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Authorized User', userPermissions: 'gateways:view' },
      });

      const { GET } = await import('../app/api/gateways/route');
      const req = new Request('http://localhost/api/gateways');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      const found = data.some(
        (g: { gatewayName: string }) => g.gatewayName === 'Test Integration Gateway'
      );
      expect(found).toBe(true);
    });
  });

  // ─── GET /api/gateways/:id/report ────────────────────────────────────────

  describe('GET /api/gateways/:id/report', () => {
    it('should return a report object with a monthly array', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Admin', userPermissions: 'gateways:view,gateways:report' },
      });

      const { GET } = await import('../app/api/gateways/[id]/report/route');
      const req = new Request(
        `http://localhost/api/gateways/${testGateway.gatewayId}/report`
      );
      const res = await GET(req, { params: { id: String(testGateway.gatewayId) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('monthly');
      expect(Array.isArray(data.monthly)).toBe(true);
    });

    it('should return correct counts for seeded orders in a specific month', async () => {
      // Seed 3 orders for this gateway in the current month
      const team = await prisma.crmTeams.findFirst();
      const role = await prisma.crmRoles.findFirst();
      const agent = await prisma.users.create({
        data: {
          name: 'GW Test Agent',
          username: 'gw_test_agent_phase8',
          teamId: team!.teamId,
          roleId: role!.roleId,
        },
      });
      const customer = await prisma.crmCustomers.create({
        data: {
          customerName: 'GW Customer',
          customerEmail: 'gw_cust_phase8@example.com',
        },
      });

      const now = new Date();
      // 1 Sold (status '1')
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderPaymentGatewayId: testGateway.gatewayId,
          saleStatus: '1',
          orderAmountCharged: '100',
          orderDate: now,
          orderVendorName: 'GW_TEST_VENDOR',
          orderSalesAgentId: agent.uid,
        },
      });
      // 1 Refunded (status '2')
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderPaymentGatewayId: testGateway.gatewayId,
          saleStatus: '2',
          orderAmountCharged: '80',
          orderDate: now,
          orderVendorName: 'GW_TEST_VENDOR',
          orderSalesAgentId: agent.uid,
        },
      });
      // 1 Chargebacked (status '3')
      await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderPaymentGatewayId: testGateway.gatewayId,
          saleStatus: '3',
          orderAmountCharged: '60',
          orderDate: now,
          orderVendorName: 'GW_TEST_VENDOR',
          orderSalesAgentId: agent.uid,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Admin', userPermissions: 'gateways:view,gateways:report' },
      });

      const { GET } = await import('../app/api/gateways/[id]/report/route');
      const req = new Request(
        `http://localhost/api/gateways/${testGateway.gatewayId}/report`
      );
      const res = await GET(req, { params: { id: String(testGateway.gatewayId) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('monthly');

      const month = now.getUTCMonth() + 1; // JS months are 0-indexed
      const year = now.getUTCFullYear();
      const thisMonthEntry = data.monthly.find(
        (m: { month: number; year: number }) => m.month === month && m.year === year
      );

      expect(thisMonthEntry).toBeDefined();
      expect(thisMonthEntry.completedCount).toBe(1);
      expect(thisMonthEntry.refundCount).toBe(1);
      expect(thisMonthEntry.chargebackCount).toBe(1);

      // Cleanup extra records
      await prisma.crmOrders.deleteMany({ where: { orderSalesAgentId: agent.uid } });
      await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
      await prisma.users.delete({ where: { uid: agent.uid } });
    });

    it('should return 403 if user lacks gateways:report permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Agent', userPermissions: 'gateways:view' },
      });

      const { GET } = await import('../app/api/gateways/[id]/report/route');
      const req = new Request(
        `http://localhost/api/gateways/${testGateway.gatewayId}/report`
      );
      const res = await GET(req, { params: { id: String(testGateway.gatewayId) } });

      expect(res.status).toBe(403);
    });
  });
});
