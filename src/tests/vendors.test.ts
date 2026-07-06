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

    it('should filter orders by rating=positive', async () => {
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

      // Create two test orders: one Positive, one Negative
      const orderPos = await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderVendorId: testVendor.vendorId,
          orderVendorName: 'Test Integration Vendor',
          orderSalesAgentId: user.uid,
          saleStatus: '1', // Sold
          orderCurrentStatus: 'Everything Completed',
          orderVendorFeedback: 'Positive',
        },
      });

      const orderNeg = await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderVendorId: testVendor.vendorId,
          orderVendorName: 'Test Integration Vendor',
          orderSalesAgentId: user.uid,
          saleStatus: '1', // Sold
          orderCurrentStatus: 'Everything Completed',
          orderVendorFeedback: 'Negative',
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
      const req = new Request(`http://localhost/api/vendors/${testVendor.vendorId}/orders?rating=positive`);
      const res = await GET(req, { params: { id: String(testVendor.vendorId) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].crmOrderId).toBe(orderPos.crmOrderId);

      // Clean up
      await prisma.crmOrders.deleteMany({ where: { crmOrderId: { in: [orderPos.crmOrderId, orderNeg.crmOrderId] } } });
      await prisma.crmCustomers.deleteMany({ where: { customerEmail: 'vendor_cust@example.com' } });
    });
  });

  describe('GET /api/vendors/:id/performance-history', () => {
    it('should return 403 Forbidden if user lacks vendors:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'agents:view', // lacks vendors:view
        },
      });

      const { GET } = await import('../app/api/vendors/[id]/performance-history/route');
      const req = new Request(`http://localhost/api/vendors/${testVendor.vendorId}/performance-history`);
      const res = await GET(req, { params: { id: String(testVendor.vendorId) } });

      expect(res.status).toBe(403);
    });

    it('should return monthly aggregates for the vendor', async () => {
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

      // Create two test orders: one Positive, one Negative on specific date
      const orderDate = new Date('2026-06-15T12:00:00Z');
      const orderPos = await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderVendorId: testVendor.vendorId,
          orderVendorName: 'Test Integration Vendor',
          orderSalesAgentId: user.uid,
          saleStatus: '1', // Sold
          orderCurrentStatus: 'Everything Completed',
          orderVendorFeedback: 'Positive',
          orderDate: orderDate,
        },
      });

      const orderNeg = await prisma.crmOrders.create({
        data: {
          orderCustomerId: customer.customerId,
          orderVendorId: testVendor.vendorId,
          orderVendorName: 'Test Integration Vendor',
          orderSalesAgentId: user.uid,
          saleStatus: '1', // Sold
          orderCurrentStatus: 'Everything Completed',
          orderVendorFeedback: 'Negative',
          orderDate: orderDate,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'vendors:view',
        },
      });

      const { GET } = await import('../app/api/vendors/[id]/performance-history/route');
      const req = new Request(`http://localhost/api/vendors/${testVendor.vendorId}/performance-history`);
      const res = await GET(req, { params: { id: String(testVendor.vendorId) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      const juneEntry = data.find((entry: { month: number; year: number }) => entry.month === 6 && entry.year === 2026);
      expect(juneEntry).toBeDefined();
      expect(juneEntry.totalOrders).toBe(2);
      expect(juneEntry.positiveOrders).toBe(1);
      expect(juneEntry.negativeOrders).toBe(1);

      // Clean up
      await prisma.crmOrders.deleteMany({ where: { crmOrderId: { in: [orderPos.crmOrderId, orderNeg.crmOrderId] } } });
      await prisma.crmCustomers.deleteMany({ where: { customerEmail: 'vendor_cust@example.com' } });
    });
  });

  describe('POST /api/vendors extended fields', () => {
    it('should create a vendor with country, state, payment mode, and alternate phones', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Admin User',
          userPermissions: 'vendors:create',
        },
      });

      const { POST } = await import('../app/api/vendors/route');
      const req = new Request('http://localhost/api/vendors', {
        method: 'POST',
        body: JSON.stringify({
          vendorName: 'Extended Vendor',
          vendorPhone: '111-222-3333',
          vendorAlternatePhone1: '444-555-6666',
          vendorAlternatePhone2: '777-888-9999',
          vendorContactPerson: 'Bob Ross',
          vendorCountry: 'US',
          vendorState: 'California',
          vendorPaymentMode: '["Customer Card","Link"]',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();

      expect(data.vendorCountry).toBe('US');
      expect(data.vendorState).toBe('California');
      expect(data.vendorPaymentMode).toBe('["Customer Card","Link"]');
      expect(data.vendorAlternatePhone1).toBe('444-555-6666');
      expect(data.vendorAlternatePhone2).toBe('777-888-9999');

      // Cleanup
      await prisma.crmVendors.deleteMany({
        where: { vendorName: 'Extended Vendor' },
      });
    });
  });

  describe('PATCH /api/vendors/:id extended fields', () => {
    it('should update a vendor with alternate phones, country, state, and payment modes', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Admin User',
          userPermissions: 'vendors:edit',
        },
      });

      const { PATCH } = await import('../app/api/vendors/[id]/route');
      const req = new Request(`http://localhost/api/vendors/${testVendor.vendorId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          vendorAlternatePhone1: '999-111-2222',
          vendorAlternatePhone2: '888-222-3333',
          vendorCountry: 'Canada',
          vendorState: 'Ontario',
          vendorPaymentMode: '["Company Card"]',
        }),
      });

      const res = await PATCH(req, { params: { id: String(testVendor.vendorId) } });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.vendorAlternatePhone1).toBe('999-111-2222');
      expect(data.vendorAlternatePhone2).toBe('888-222-3333');
      expect(data.vendorCountry).toBe('Canada');
      expect(data.vendorState).toBe('Ontario');
      expect(data.vendorPaymentMode).toBe('["Company Card"]');

      // Verify DB persistence
      const dbVendor = await prisma.crmVendors.findUnique({
        where: { vendorId: testVendor.vendorId },
      });
      expect(dbVendor?.vendorAlternatePhone1).toBe('999-111-2222');
      expect(dbVendor?.vendorAlternatePhone2).toBe('888-222-3333');
      expect(dbVendor?.vendorCountry).toBe('Canada');
      expect(dbVendor?.vendorState).toBe('Ontario');
      expect(dbVendor?.vendorPaymentMode).toBe('["Company Card"]');
    });
  });
});

