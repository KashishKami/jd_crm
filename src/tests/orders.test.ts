import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { CrmTeams, CrmRoles, Users, CrmVendors, CrmGateway, CrmCustomers, CrmOrders } from '@prisma/client';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Order Management Integration Tests', () => {
  let testTeam: CrmTeams;
  let testRole: CrmRoles;
  let testUser: Users;
  let testVendor: CrmVendors;
  let testGateway: CrmGateway;
  let testCustomer: CrmCustomers;
  let testOrder: CrmOrders;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Cleanup in FK-safe order: comments → orders → cards → customers → vendors/gateway/users
    await prisma.crmComments.deleteMany({
      where: {
        commentAgentName: 'SalesAgentNick',
      },
    });
    await prisma.crmOrders.deleteMany({
      where: {
        customer: {
          customerEmail: { in: ['initial.cust@example.com', 'new.buyer@example.com'] },
        },
      },
    });
    // Clean up cards by customer email to avoid stale records from partial prior runs
    const staleCustomers = await prisma.crmCustomers.findMany({
      where: { customerEmail: { in: ['initial.cust@example.com', 'new.buyer@example.com'] } },
      select: { customerId: true },
    });
    if (staleCustomers.length > 0) {
      await prisma.crmCustomerCards.deleteMany({
        where: { cardCustomerId: { in: staleCustomers.map((c) => c.customerId) } },
      });
    }
    await prisma.crmCustomers.deleteMany({
      where: {
        customerEmail: { in: ['initial.cust@example.com', 'new.buyer@example.com'] },
      },
    });
    await prisma.crmVendors.deleteMany({ where: { vendorName: 'Test Order Vendor' } });
    await prisma.crmGateway.deleteMany({ where: { gatewayName: 'Test Order Gateway' } });
    await prisma.users.deleteMany({ where: { username: 'test_sales_agent_order' } });

    // Seed dependencies
    testTeam = await prisma.crmTeams.findFirst() || await prisma.crmTeams.create({
      data: { teamName: 'Test Team' },
    });

    testRole = await prisma.crmRoles.findFirst() || await prisma.crmRoles.create({
      data: { roleName: 'Test Role' },
    });

    testUser = await prisma.users.create({
      data: {
        name: 'Test Sales Agent',
        username: 'test_sales_agent_order',
        teamId: testTeam.teamId,
        roleId: testRole.roleId,
        nickname: 'SalesAgentNick',
      },
    });

    testVendor = await prisma.crmVendors.create({
      data: {
        vendorName: 'Test Order Vendor',
        vendorPhone: '1234567890',
        vendorContactPerson: 'John Vendor',
        vendorStatus: 1,
      },
    });

    testGateway = await prisma.crmGateway.create({
      data: {
        gatewayName: 'Test Order Gateway',
        gatewayStatus: 1,
        gatewayCreatedAt: new Date(),
        gatewayUpdatedAt: new Date(),
      },
    });

    testCustomer = await prisma.crmCustomers.create({
      data: {
        firstName: 'Initial',
        lastName: 'Customer',
        customerEmail: 'initial.cust@example.com',
      },
    });

    testOrder = await prisma.crmOrders.create({
      data: {
        orderCustomerId: testCustomer.customerId,
        orderVendorId: testVendor.vendorId,
        orderVendorName: testVendor.vendorName,
        orderSalesAgentId: testUser.uid,
        orderSalesAgentName: testUser.nickname,
        orderPaymentGatewayId: testGateway.gatewayId,
        saleStatus: '1',
        orderCurrentStatus: 'Pending Shipment',
        orderDate: new Date(),
      },
    });
  });

  afterEach(async () => {
    // Cleanup in FK-safe order: comments → orders → cards → customers → vendors/gateway/users
    await prisma.crmComments.deleteMany({
      where: {
        commentAgentName: 'SalesAgentNick',
      },
    });
    await prisma.crmOrders.deleteMany({
      where: {
        customer: {
          customerEmail: { in: ['initial.cust@example.com', 'new.buyer@example.com'] },
        },
      },
    });
    const staleCustomers = await prisma.crmCustomers.findMany({
      where: { customerEmail: { in: ['initial.cust@example.com', 'new.buyer@example.com'] } },
      select: { customerId: true },
    });
    if (staleCustomers.length > 0) {
      await prisma.crmCustomerCards.deleteMany({
        where: { cardCustomerId: { in: staleCustomers.map((c) => c.customerId) } },
      });
    }
    await prisma.crmCustomers.deleteMany({
      where: {
        customerEmail: { in: ['initial.cust@example.com', 'new.buyer@example.com'] },
      },
    });
    await prisma.crmVendors.deleteMany({ where: { vendorName: 'Test Order Vendor' } });
    await prisma.crmGateway.deleteMany({ where: { gatewayName: 'Test Order Gateway' } });
    await prisma.users.deleteMany({ where: { username: 'test_sales_agent_order' } });
  });

  describe('GET /api/orders', () => {
    it('should return 403 Forbidden if user lacks orders:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'vendors:view', // Lacks orders:view
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders');
      const res = await GET(req);

      expect(res.status).toBe(403);
    });

    it('should return 200 OK and list of orders if user has orders:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data.some((o: { crmOrderId: number }) => o.crmOrderId === testOrder.crmOrderId)).toBe(true);
    });

    it('should return filtered orders when status query param is provided', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders?status=Pending+Shipment');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.every((o: { orderCurrentStatus: string | null }) => o.orderCurrentStatus === 'Pending Shipment')).toBe(true);
    });

    it('should return only completed sold orders when status=Completed+Orders query param is provided', async () => {
      // Temporarily set the test order to Completed Orders
      await prisma.crmOrders.update({
        where: { crmOrderId: testOrder.crmOrderId },
        data: { orderCurrentStatus: 'Completed Orders', saleStatus: '1' },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders?status=Completed+Orders');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBeGreaterThan(0);
      expect(data.every((o: { orderCurrentStatus: string | null; saleStatus: string | null }) => o.orderCurrentStatus === 'Completed Orders' && o.saleStatus === '1')).toBe(true);
    });

    it('should return filtered orders when teamId query param is provided', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request(`http://localhost/api/orders?teamId=${testTeam.teamId}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBeGreaterThan(0);
      expect(data.every((o: any) => o.salesAgent?.teamId === testTeam.teamId)).toBe(true);
    });
  });

  describe('POST /api/orders', () => {
    const validPayload = {
      firstName: 'New',
      lastName: 'Buyer',
      customerPhone: '9876543210',
      customerEmail: 'new.buyer@example.com',
      customerBillingAddress: '123 Billing Rd',
      customerShippingAddress: '456 Shipping Rd',
      customerNameOncard: 'New Buyer',
      customerCardNumber: '4111222233334444',
      customerCardExpDate: '10/30',
      customerCardCvv: '999',
      customerCardCopyStatus: 'No',
      customerCardPhotoStatus: 'No',
      orderYear: '2022',
      orderMakeModel: 'Ford Focus',
      orderPart: 'Alternator',
      orderPartSize: 'Standard',
      orderQuotedMiles: '50',
      orderGivenMiles: '55',
      orderVin: 'VIN789XYZ',
      orderTotalPitched: '500',
      orderVendorPrice: '300',
      orderVendorId: 9999, // Will be set to testVendor.vendorId below
      orderShippingType: 'Express',
      orderPaymentGatewayId: 9999, // Will be set to testGateway.gatewayId below
      orderSalesAgentId: 9999, // Will be set to testUser.uid below
      orderVerifierId: null,
      saleStatus: '1',
    };

    it('should create customer, card, and order records atomically', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Creator',
          userPermissions: 'orders:create',
        },
      });

      const payload = {
        ...validPayload,
        orderVendorId: testVendor.vendorId,
        orderPaymentGatewayId: testGateway.gatewayId,
        orderSalesAgentId: testUser.uid,
      };

      const { POST } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toHaveProperty('orderId');
      expect(data).toHaveProperty('customerId');
      expect(data).toHaveProperty('cardId');

      // Verify database state
      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: data.orderId },
        include: { customer: { include: { cards: true } } },
      });

      expect(dbOrder).not.toBeNull();
      expect(dbOrder?.orderCustomerId).toBe(data.customerId);
      expect(dbOrder?.customer.customerEmail).toBe('new.buyer@example.com');
      expect(dbOrder?.customer.cards[0].customerCardNumber).toBe('4111222233334444');
      // Markup should be computed: 500 - 300 = 200
      expect(dbOrder?.orderMarkup).toBe('200');
      // Default order status should be Pending Shipment when vendor is assigned
      expect(dbOrder?.orderCurrentStatus).toBe('Pending Shipment');
    });

    it('should default status to Pending Booking if order is created without an assigned vendor', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Creator',
          userPermissions: 'orders:create',
        },
      });

      const payload = {
        ...validPayload,
        orderVendorId: null, // No vendor assigned
        orderPaymentGatewayId: testGateway.gatewayId,
        orderSalesAgentId: testUser.uid,
      };

      const { POST } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: data.orderId },
      });
      expect(dbOrder?.orderCurrentStatus).toBe('Pending Booking');
    });

    it('should roll back all inserts if any part of the transaction fails', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Creator',
          userPermissions: 'orders:create',
        },
      });

      // Force failure on card creation by sending missing customerNameOncard (which is required by Prisma db)
      const payload = {
        ...validPayload,
        customerNameOncard: '', // empty to trigger model validation error
        orderVendorId: testVendor.vendorId,
        orderPaymentGatewayId: testGateway.gatewayId,
        orderSalesAgentId: testUser.uid,
      };

      const { POST } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      // Verify no customer record was left orphaned
      const dbCustomer = await prisma.crmCustomers.findFirst({
        where: { customerEmail: 'new.buyer@example.com' },
      });
      expect(dbCustomer).toBeNull();
    });
  });

  describe('PATCH /api/orders/:id', () => {
    it('should return 403 Forbidden if user lacks orders:edit permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'orders:view', // Lacks orders:edit
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ orderTrackingNumber: 'TRK9999' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(403);
    });

    it('should successfully update order and advance status to Pending Delivery when tracking number is supplied', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Editor',
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ orderTrackingNumber: 'TRK9999' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
      });
      expect(dbOrder?.orderTrackingNumber).toBe('TRK9999');
      expect(dbOrder?.orderCurrentStatus).toBe('Pending Delivery');
    });

    it('should successfully advance status to Pending Shipment when vendor is assigned to a Pending Booking order', async () => {
      const bookingOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderSalesAgentId: testUser.uid,
          saleStatus: '1',
          orderCurrentStatus: 'Pending Booking',
          orderDate: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Editor',
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${bookingOrder.crmOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ orderVendorId: testVendor.vendorId }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(bookingOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: bookingOrder.crmOrderId },
      });
      expect(dbOrder?.orderVendorId).toBe(testVendor.vendorId);
      expect(dbOrder?.orderCurrentStatus).toBe('Pending Shipment');

      await prisma.crmOrders.delete({ where: { crmOrderId: bookingOrder.crmOrderId } });
    });

    it('should successfully advance status to Pending Delivery when tracking number is supplied to a Pending Shipment order', async () => {
      const shipmentOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderVendorId: testVendor.vendorId,
          orderSalesAgentId: testUser.uid,
          saleStatus: '1',
          orderCurrentStatus: 'Pending Shipment',
          orderDate: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Editor',
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${shipmentOrder.crmOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ orderTrackingNumber: 'TRK9999' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(shipmentOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: shipmentOrder.crmOrderId },
      });
      expect(dbOrder?.orderTrackingNumber).toBe('TRK9999');
      expect(dbOrder?.orderCurrentStatus).toBe('Pending Delivery');

      await prisma.crmOrders.delete({ where: { crmOrderId: shipmentOrder.crmOrderId } });
    });

    // ─── RED: Customer & Card update tests ───────────────────────────────────────
    it('[RED] should persist updated firstName and lastName to crm_customers when PATCH includes customer fields', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Editor',
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'UpdatedFirst',
          lastName: 'UpdatedLast',
          customerEmail: 'initial.cust@example.com',
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      // The customer row must be updated in crm_customers
      const dbCustomer = await prisma.crmCustomers.findUnique({
        where: { customerId: testCustomer.customerId },
      });
      expect(dbCustomer?.firstName).toBe('UpdatedFirst');
      expect(dbCustomer?.lastName).toBe('UpdatedLast');
    });

    it('[RED] should persist updated customerPhone and customerEmail to crm_customers when PATCH includes those fields', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Editor',
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: '9998887777',
          customerEmail: 'updated.email@example.com',
          customerBillingAddress: '999 New Billing St',
          customerShippingAddress: '888 New Shipping Ave',
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbCustomer = await prisma.crmCustomers.findUnique({
        where: { customerId: testCustomer.customerId },
      });
      expect(dbCustomer?.customerPhone).toBe('9998887777');
      expect(dbCustomer?.customerEmail).toBe('updated.email@example.com');
      expect(dbCustomer?.customerBillingAddress).toBe('999 New Billing St');
      expect(dbCustomer?.customerShippingAddress).toBe('888 New Shipping Ave');
    });
  });
});

