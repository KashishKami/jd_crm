import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Vendor Management Integration Tests', () => {
  let testVendor: { vendorId: number };
  let testUserUid: number | null = null;

  beforeEach(async () => {
    vi.resetAllMocks();
    testUserUid = null;

    // Clean up test data
    await prisma.crmOrders.deleteMany({
      where: {
        orderVendorName: 'Test Integration Vendor',
      },
    });
    await prisma.users.deleteMany({
      where: { username: 'test_sales_agent_vendor' },
    });
    await prisma.crmVendors.deleteMany({
      where: {
        vendorName: 'Test Integration Vendor',
      },
    });

    // Create a test vendor
    testVendor = await prisma.crmVendors.create({
      data: {
        vendorName: 'Test Integration Vendor',
        vendorPhone: '1234567890',
        vendorFax: '123456',
        vendorEmail: 'test_vendor@example.com',
        vendorContactPerson: 'John Doe',
        vendorRemark: 'Good supplier',
        vendorStatus: 1,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data in dependency order
    await prisma.crmOrders.deleteMany({
      where: {
        orderVendorName: 'Test Integration Vendor',
      },
    });
    if (testUserUid !== null) {
      await prisma.users.deleteMany({ where: { uid: testUserUid } });
      testUserUid = null;
    }
    await prisma.users.deleteMany({
      where: { username: 'test_sales_agent_vendor' },
    });
    await prisma.crmVendors.deleteMany({
      where: {
        vendorName: 'Test Integration Vendor',
      },
    });
  });


  describe('GET /api/vendors', () => {
    it('should return 403 Forbidden if user lacks vendors:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'agents:view', // Lacks vendors:view
        },
      });

      const { GET } = await import('../app/api/vendors/route');
      const req = new Request('http://localhost/api/vendors');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('should return 200 OK and list of vendors if user has vendors:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'vendors:view',
        },
      });

      const { GET } = await import('../app/api/vendors/route');
      const req = new Request('http://localhost/api/vendors');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      const hasTestVendor = data.some((v: { vendorName: string }) => v.vendorName === 'Test Integration Vendor');
      expect(hasTestVendor).toBe(true);
    });
  });

  describe('PATCH /api/vendors/:id/status', () => {
    it('should return 403 Forbidden if user lacks vendors:edit permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Agent User',
          userPermissions: 'vendors:view', // lacks vendors:edit
        },
      });

      const { PATCH } = await import('../app/api/vendors/[id]/status/route');
      const req = new Request(`http://localhost/api/vendors/${testVendor.vendorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 0 }),
      });
      const res = await PATCH(req, { params: { id: String(testVendor.vendorId) } });

      expect(res.status).toBe(403);
    });

    it('should successfully toggle status to 0 (blacklisted)', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Admin User',
          userPermissions: 'vendors:edit',
        },
      });

      const { PATCH } = await import('../app/api/vendors/[id]/status/route');
      const req = new Request(`http://localhost/api/vendors/${testVendor.vendorId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 0 }),
      });
      const res = await PATCH(req, { params: { id: String(testVendor.vendorId) } });

      expect(res.status).toBe(200);
      
      const dbVendor = await prisma.crmVendors.findUnique({
        where: { vendorId: testVendor.vendorId },
      });
      expect(dbVendor?.vendorStatus).toBe(0);
    });
  });

  describe('GET /api/vendors/:id/orders', () => {
    it('should return all orders associated with the vendor', async () => {
      // Find a team and role and user to act as sales agent
      const team = await prisma.crmTeams.findFirst();
      const role = await prisma.crmRoles.findFirst();
      const user = await prisma.users.create({
        data: {
          name: 'Test Sales Agent',
          username: 'test_sales_agent_vendor',
          teamId: team!.teamId,
          roleId: role!.roleId,
        },
      });
      testUserUid = user.uid;

      // Create a customer
      const customer = await prisma.crmCustomers.create({
        data: {
          customerName: 'Vendor Customer',
          customerEmail: 'vendor_cust@example.com',
        },
      });

      // Create a test order linked to our vendor
      const order = await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderVendorId: testVendor.vendorId,
          orderVendorName: 'Test Integration Vendor',
          orderSalesAgentId: user.uid,
          saleStatus: '1', // Sold
          orderCurrentStatus: 'Everything Completed',
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'vendors:view',
        },
      });

      const { GET } = await import('../app/api/vendors/[id]/orders/route');
      const req = new Request(`http://localhost/api/vendors/${testVendor.vendorId}/orders`);
      const res = await GET(req, { params: { id: String(testVendor.vendorId) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].crmOrderId).toBe(order.crmOrderId);

      // Delete order first (FK), then customer; user cleaned up by afterEach
      await prisma.crmOrders.deleteMany({ where: { crmOrderId: order.crmOrderId } });
      await prisma.crmCustomers.deleteMany({ where: { customerEmail: 'vendor_cust@example.com' } });
    });
  });
});
