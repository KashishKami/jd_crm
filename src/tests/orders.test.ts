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
        customerName: 'Initial Customer',
        customerEmail: 'initial.cust@example.com',
        cards: {
          create: {
            customerNameOncard: 'Initial Customer',
            customerCardNumber: '1234567812345678',
            customerCardExpDate: '12/28',
            customerCardCvv: '123',
          }
        }
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

    describe('W-1803: Backend Executive Filter and Pending Counts', () => {
      it('[RED] should filter orders by backendExecutiveId', async () => {
        // Create a test user for backend executive
        const beUser = await prisma.users.create({
          data: {
            name: 'BE User Test',
            username: 'be_user_test_filters',
            teamId: testTeam.teamId,
            roleId: testRole.roleId,
          },
        });

        // Set backendExecutiveId on testOrder
        await prisma.crmOrders.update({
          where: { crmOrderId: testOrder.crmOrderId },
          data: { orderBackendExecutiveId: beUser.uid },
        });

        vi.mocked(getServerSession).mockResolvedValueOnce({
          user: { id: '1', name: 'Authorized User', userPermissions: 'orders:view' },
        });

        const { GET } = await import('../app/api/orders/route');
        const req = new Request(`http://localhost/api/orders?backendExecutiveId=${beUser.uid}`);
        const res = await GET(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        const results = data.data || data;
        expect(results.length).toBe(1);
        expect(results[0].orderBackendExecutiveId).toBe(beUser.uid);

        // Cleanup
        await prisma.crmOrders.update({
          where: { crmOrderId: testOrder.crmOrderId },
          data: { orderBackendExecutiveId: null },
        });
        await prisma.users.delete({ where: { uid: beUser.uid } });
      });

      it('[RED] should return correct pending-counts with counts and finalMargin amounts', async () => {
        vi.mocked(getServerSession).mockResolvedValueOnce({
          user: { id: '1', name: 'Authorized User', userPermissions: 'orders:view' },
        });

        // Since the route does not exist, we try to import it, which will fail or return 404/throw error.
        const { GET } = await import('../app/api/orders/pending-counts/route');
        const req = new Request('http://localhost/api/orders/pending-counts');
        const res = await GET(req);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveProperty('Pending Booking');
        expect(data['Pending Booking']).toHaveProperty('count');
        expect(data['Pending Booking']).toHaveProperty('amount');
      });
    });
  });

  describe('POST /api/orders', () => {
    const validPayload = {
      customerName: 'New Buyer',
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
      orderQuotedMilesAndWarranty: '50',
      orderVendorMilesAndWarranty: '55',
      orderChecklist: 'No',
      orderVin: 'VIN789XYZ',
      orderTotalPitched: '500',
      orderVendorPrice: '300',
      orderAmountCharged: '200',
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
      // Amount charged should be equal to the passed payload value
      expect(dbOrder?.orderAmountCharged).toBe('200');
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
    it('[RED] should persist updated customerName to crm_customers when PATCH includes customer fields', async () => {
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
          customerName: 'Updated Customer Name',
          customerEmail: 'initial.cust@example.com',
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      // The customer row must be updated in crm_customers
      const dbCustomer = await prisma.crmCustomers.findUnique({
        where: { customerId: testCustomer.customerId },
      });
      expect(dbCustomer?.customerName).toBe('Updated Customer Name');
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

    it('[RED] should automatically set orderRefundAmount to orderMarkup and orderCurrentStatus to Returned Orders when saleStatus is set to 2', async () => {
      // Set testOrder amount charged
      await prisma.crmOrders.update({
        where: { crmOrderId: testOrder.crmOrderId },
        data: { orderAmountCharged: '120.00' },
      });

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
        body: JSON.stringify({ saleStatus: '2' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
      });
      expect(dbOrder?.orderRefundAmount).toBe('120.00');
      expect(dbOrder?.orderCurrentStatus).toBe('Returned Orders');
    });

    it('[RED] should automatically set orderRefundAmount to orderMarkup and orderCurrentStatus to Returned Orders when saleStatus is set to 3', async () => {
      // Set testOrder amount charged
      await prisma.crmOrders.update({
        where: { crmOrderId: testOrder.crmOrderId },
        data: { orderAmountCharged: '150.00' },
      });

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
        body: JSON.stringify({ saleStatus: '3' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
      });
      expect(dbOrder?.orderRefundAmount).toBe('150.00');
      expect(dbOrder?.orderCurrentStatus).toBe('Returned Orders');
    });

    it('[RED] should set orderRefundAmount to provided value when saleStatus is set to 4', async () => {
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
        body: JSON.stringify({ saleStatus: '4', orderRefundAmount: '50.00' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
      });
      expect(dbOrder?.orderRefundAmount).toBe('50.00');
      expect(dbOrder?.orderCurrentStatus).not.toBe('Returned Orders');
    });

    it('[RED] should throw 400 when setting saleStatus to 4 without providing orderRefundAmount', async () => {
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
        body: JSON.stringify({ saleStatus: '4' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(400);
    });

    it('[RED] should reset orderRefundAmount to null when saleStatus is set to 1', async () => {
      // Setup order with refund amount
      await prisma.crmOrders.update({
        where: { crmOrderId: testOrder.crmOrderId },
        data: { orderRefundAmount: '45.00' },
      });

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
        body: JSON.stringify({ saleStatus: '1' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
      });
      expect(dbOrder?.orderRefundAmount).toBeNull();
    });

    it('[RED] should return only orders with orderCurrentStatus = Returned Orders when status=Returned+Orders filter is applied', async () => {
      // Set testOrder status to Returned Orders
      await prisma.crmOrders.update({
        where: { crmOrderId: testOrder.crmOrderId },
        data: { orderCurrentStatus: 'Returned Orders' },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders?status=Returned+Orders');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBeGreaterThan(0);
      expect(data.every((o: { orderCurrentStatus: string | null }) => o.orderCurrentStatus === 'Returned Orders')).toBe(true);
    });

    it('[RED] should automatically set orderRefundAmount to orderAmountCharged and orderCurrentStatus to Returned Orders when saleStatus is set to 5 (Void)', async () => {
      await prisma.crmOrders.update({
        where: { crmOrderId: testOrder.crmOrderId },
        data: { orderAmountCharged: '500.00', orderCurrentStatus: 'Pending Shipment' },
      });

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
        body: JSON.stringify({ saleStatus: '5' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
      });
      expect(dbOrder?.orderRefundAmount).toBe('500.00');
      expect(dbOrder?.orderCurrentStatus).toBe('Returned Orders');
      
      const body = await res.json();
      const updatedOrder = body.data || body;
      expect(updatedOrder.orderCurrentStatus).toBe('Returned Orders');
    });

    it('[RED] should clear orderRefundAmount to null and set orderCurrentStatus to Cancelled Orders when saleStatus is set to 6 (Cancelled)', async () => {
      await prisma.crmOrders.update({
        where: { crmOrderId: testOrder.crmOrderId },
        data: { orderAmountCharged: '500.00', orderRefundAmount: '100.00', orderCurrentStatus: 'Pending Shipment' },
      });

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
        body: JSON.stringify({ saleStatus: '6' }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
      });
      expect(dbOrder?.orderRefundAmount).toBeNull();
      expect(dbOrder?.orderCurrentStatus).toBe('Cancelled Orders');
    });

    it('[RED] should return only Cancelled Orders when status=Cancelled+Orders filter is applied', async () => {
      const cancelOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderSalesAgentId: testUser.uid,
          saleStatus: '6',
          orderCurrentStatus: 'Cancelled Orders',
          orderDate: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Viewer',
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders?status=Cancelled+Orders');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      const results = data.data || data;

      expect(results.some((o: any) => o.crmOrderId === cancelOrder.crmOrderId)).toBe(true);
      expect(results.every((o: any) => o.orderCurrentStatus === 'Cancelled Orders')).toBe(true);

      // Cleanup
      await prisma.crmOrders.delete({ where: { crmOrderId: cancelOrder.crmOrderId } });
    });

    it('[RED] should record sale status history for Void (5) and Cancel Order (6)', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized Editor',
          userPermissions: 'orders:edit',
        },
      });

      // Clear any prior status history
      await prisma.crmSaleStatusHistory.deleteMany({
        where: { orderId: testOrder.crmOrderId },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ saleStatus: '5' }),
      });
      await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      const histories = await prisma.crmSaleStatusHistory.findMany({
        where: { orderId: testOrder.crmOrderId },
      });
      expect(histories.length).toBeGreaterThan(0);
      expect(histories.some(h => h.newValue === '5')).toBe(true);
    });

    it('[RED] should return Void orders in Returned Orders filter, but not Cancel Order', async () => {
      // Create a Void order
      const voidOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderSalesAgentId: testUser.uid,
          saleStatus: '5',
          orderCurrentStatus: 'Returned Orders',
          orderDate: new Date(),
        },
      });

      // Create a Cancel Order order
      const cancelOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderSalesAgentId: testUser.uid,
          saleStatus: '6',
          orderCurrentStatus: 'Pending Booking',
          orderDate: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders?status=Returned+Orders');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      const results = data.data || data;

      expect(results.some((o: any) => o.crmOrderId === voidOrder.crmOrderId)).toBe(true);
      expect(results.some((o: any) => o.crmOrderId === cancelOrder.crmOrderId)).toBe(false);

      // Cleanup
      await prisma.crmOrders.delete({ where: { crmOrderId: voidOrder.crmOrderId } });
      await prisma.crmOrders.delete({ where: { crmOrderId: cancelOrder.crmOrderId } });
    });

    it('[RED] should filter by saleStatus query param (saleStatus=5 and saleStatus=6)', async () => {
      // Create a Void order
      const voidOrder = await prisma.crmOrders.create({
        data: {
          orderCustomerId: testCustomer.customerId,
          orderSalesAgentId: testUser.uid,
          saleStatus: '5',
          orderCurrentStatus: 'Returned Orders',
          orderDate: new Date(),
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders?saleStatus=5');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      const results = data.data || data;

      expect(results.every((o: any) => o.saleStatus === '5')).toBe(true);
      expect(results.some((o: any) => o.crmOrderId === voidOrder.crmOrderId)).toBe(true);

      // Cleanup
      await prisma.crmOrders.delete({ where: { crmOrderId: voidOrder.crmOrderId } });
    });
  });

  describe('W-1502: Merge orderYear into orderMakeModel', () => {
    const validPayloadBase = {
      customerName: 'New Buyer',
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
      orderMakeModel: '2021 Jeep Grand Cherokee',
      orderPart: 'Alternator',
      orderPartSize: 'Standard',
      orderQuotedMilesAndWarranty: '50',
      orderVendorMilesAndWarranty: '55',
      orderChecklist: 'No',
      orderVin: 'VIN789XYZ',
      orderTotalPitched: '500',
      orderVendorPrice: '300',
      orderAmountCharged: '200',
      orderVendorId: 9999, // Will be set to testVendor.vendorId below
      orderShippingType: 'Express',
      orderPaymentGatewayId: 9999, // Will be set to testGateway.gatewayId below
      orderSalesAgentId: 9999, // Will be set to testUser.uid below
      orderVerifierId: null,
      saleStatus: '1',
    };

    it('should create order with orderMakeModel and no orderYear field', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Creator', userPermissions: 'orders:create' },
      });

      const payload = {
        ...validPayloadBase,
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

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: data.orderId },
      });
      expect(dbOrder).not.toBeNull();
      expect(dbOrder?.orderMakeModel).toBe('2021 Jeep Grand Cherokee');

      // GET the order and verify orderYear is completely absent
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Viewer', userPermissions: 'orders:view' },
      });
      const { GET } = await import('../app/api/orders/[id]/route');
      const getReq = new Request(`http://localhost/api/orders/${data.orderId}`);
      const getRes = await GET(getReq, { params: Promise.resolve({ id: String(data.orderId) }) });
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson).not.toHaveProperty('orderYear');
    });

    it('should update orderMakeModel via PATCH', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Editor', userPermissions: 'orders:edit' },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderMakeModel: '2019 Ford F-150',
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
      });
      expect(dbOrder?.orderMakeModel).toBe('2019 Ford F-150');
    });

    it('should verify order_year column is dropped from crm_orders table', async () => {
      // Direct raw query to select order_year. This should throw an error since the column is dropped.
      let threwError = false;
      try {
        await prisma.$queryRawUnsafe(`SELECT order_year FROM crm_orders LIMIT 1`);
      } catch (err: any) {
        threwError = true;
        expect(err.message).toContain("Unknown column 'order_year'");
      }
      expect(threwError).toBe(true);
    });
  });

  describe('W-1601: Add Sales Verifier and Backend Executive to Orders', () => {
    let testUserA: Users;
    let testUserB: Users;
    let testUserC: Users;

    beforeEach(async () => {
      // Create additional test users for verifier/executive roles
      testUserA = await prisma.users.create({
        data: {
          name: 'Verifier User A',
          username: 'verifier_user_a',
          teamId: testTeam.teamId,
          roleId: testRole.roleId,
          nickname: 'UserANick',
        },
      });

      testUserB = await prisma.users.create({
        data: {
          name: 'Executive User B',
          username: 'executive_user_b',
          teamId: testTeam.teamId,
          roleId: testRole.roleId,
          nickname: 'UserBNick',
        },
      });

      testUserC = await prisma.users.create({
        data: {
          name: 'Verifier User C',
          username: 'verifier_user_c',
          teamId: testTeam.teamId,
          roleId: testRole.roleId,
          nickname: 'UserCNick',
        },
      });
    });

    afterEach(async () => {
      await prisma.users.deleteMany({
        where: {
          username: { in: ['verifier_user_a', 'executive_user_b', 'verifier_user_c'] }
        }
      });
    });

    it('should create order with sales verifier and backend executive and snapshot names', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Creator', userPermissions: 'orders:create' },
      });

      const payload = {
        customerName: 'New Buyer',
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
        orderMakeModel: '2021 Jeep Grand Cherokee',
        orderPart: 'Alternator',
        orderPartSize: 'Standard',
        orderQuotedMilesAndWarranty: '50',
        orderVendorMilesAndWarranty: '55',
        orderChecklist: 'No',
        orderVin: 'VIN789XYZ',
        orderTotalPitched: '500',
        orderVendorPrice: '300',
        orderVendorId: testVendor.vendorId,
        orderShippingType: 'Express',
        orderPaymentGatewayId: testGateway.gatewayId,
        orderSalesAgentId: testUser.uid,
        orderVerifierId: null,
        saleStatus: '1',
        orderSalesVerifierId: testUserA.uid,
        orderBackendExecutiveId: testUserB.uid,
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

      // Check database state with raw SQL to bypass schema.prisma type checker for RED step
      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT order_sales_verifier_id, order_sales_verifier_name, order_backend_executive_id, order_backend_executive_name FROM crm_orders WHERE crm_order_id = ?`,
        data.orderId
      );
      expect(dbRows.length).toBe(1);
      expect(dbRows[0].order_sales_verifier_id).toBe(testUserA.uid);
      expect(dbRows[0].order_sales_verifier_name).toBe('UserANick');
      expect(dbRows[0].order_backend_executive_id).toBe(testUserB.uid);
      expect(dbRows[0].order_backend_executive_name).toBe('UserBNick');
    });

    it('should default to null if sales verifier or backend executive are not provided', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Creator', userPermissions: 'orders:create' },
      });

      const payload = {
        customerName: 'New Buyer',
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
        orderMakeModel: '2021 Jeep Grand Cherokee',
        orderPart: 'Alternator',
        orderPartSize: 'Standard',
        orderQuotedMilesAndWarranty: '50',
        orderVendorMilesAndWarranty: '55',
        orderChecklist: 'No',
        orderVin: 'VIN789XYZ',
        orderTotalPitched: '500',
        orderVendorPrice: '300',
        orderVendorId: testVendor.vendorId,
        orderShippingType: 'Express',
        orderPaymentGatewayId: testGateway.gatewayId,
        orderSalesAgentId: testUser.uid,
        orderVerifierId: null,
        saleStatus: '1',
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

      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT order_sales_verifier_id, order_sales_verifier_name, order_backend_executive_id, order_backend_executive_name FROM crm_orders WHERE crm_order_id = ?`,
        data.orderId
      );
      expect(dbRows.length).toBe(1);
      expect(dbRows[0].order_sales_verifier_id).toBeNull();
      expect(dbRows[0].order_sales_verifier_name).toBeNull();
      expect(dbRows[0].order_backend_executive_id).toBeNull();
      expect(dbRows[0].order_backend_executive_name).toBeNull();
    });

    it('should update sales verifier and backend executive and snapshot names via PATCH', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Editor', userPermissions: 'orders:edit' },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderSalesVerifierId: testUserC.uid,
          orderBackendExecutiveId: testUserB.uid,
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT order_sales_verifier_id, order_sales_verifier_name, order_backend_executive_id, order_backend_executive_name FROM crm_orders WHERE crm_order_id = ?`,
        testOrder.crmOrderId
      );
      expect(dbRows.length).toBe(1);
      expect(dbRows[0].order_sales_verifier_id).toBe(testUserC.uid);
      expect(dbRows[0].order_sales_verifier_name).toBe('UserCNick');
      expect(dbRows[0].order_backend_executive_id).toBe(testUserB.uid);
      expect(dbRows[0].order_backend_executive_name).toBe('UserBNick');
    });

    it('should return sales verifier and backend executive fields via GET /api/orders/:id', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Viewer', userPermissions: 'orders:view' },
      });

      const { GET } = await import('../app/api/orders/[id]/route');
      const getReq = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`);
      const getRes = await GET(getReq, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson).toHaveProperty('orderSalesVerifierId');
      expect(getJson).toHaveProperty('orderSalesVerifierName');
      expect(getJson).toHaveProperty('orderBackendExecutiveId');
      expect(getJson).toHaveProperty('orderBackendExecutiveName');
    });
  });

  describe('W-1602: Status History Timeline Auditing', () => {
    it('should create a sale status history entry when saleStatus changes, using custom date if provided', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleStatus: '2', // Refunded
          saleStatusChangeDate: '2026-01-15T10:30:00.000Z',
        }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      // Verify DB entry using queryRawUnsafe to allow test compilation before schema update
      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT old_value, new_value, changed_at, changed_by_name FROM crm_sale_status_history WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
        testOrder.crmOrderId
      );

      expect(dbRows.length).toBe(1);
      expect(dbRows[0].new_value).toBe('2');
      expect(dbRows[0].old_value).toBe('1');
      expect(new Date(dbRows[0].changed_at).toISOString()).toBe('2026-01-15T10:30:00.000Z');
      expect(dbRows[0].changed_by_name).toBe(testUser.nickname);
    });

    it('should create a sale status history entry and default changed_at to current time when no date is provided', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleStatus: '3', // Chargebacked
        }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT old_value, new_value, changed_at FROM crm_sale_status_history WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
        testOrder.crmOrderId
      );

      expect(dbRows.length).toBe(1);
      expect(dbRows[0].new_value).toBe('3');
      expect(dbRows[0].old_value).toBe('1');
      const timeDiff = Math.abs(new Date(dbRows[0].changed_at).getTime() - Date.now());
      expect(timeDiff).toBeLessThan(10000); // within 10 seconds
    });

    it('should NOT write a sale status history entry if saleStatus value is identical', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleStatus: '1', // identical to initial status
        }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM crm_sale_status_history WHERE order_id = ?`,
        testOrder.crmOrderId
      );
      expect(dbRows.length).toBe(0);
    });

    it('should return 403 when retrieving sale status history without orders:view-sale-status-history permission', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view', // Lacks orders:view-sale-status-history
        },
      });

      const { GET } = await import('../app/api/orders/[id]/sale-status-history/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/sale-status-history`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(403);
    });

    it('should return 200 and list entries when retrieving sale status history with permission', async () => {
      // Directly insert mock history rows
      await prisma.$executeRawUnsafe(
        `INSERT INTO crm_sale_status_history (order_id, old_value, new_value, changed_by_id, changed_by_name, changed_at) VALUES (?, ?, ?, ?, ?, ?)`,
        testOrder.crmOrderId, '1', '2', testUser.uid, testUser.nickname || testUser.name, new Date('2026-01-15T10:30:00Z')
      );

      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view-sale-status-history',
        },
      });

      const { GET } = await import('../app/api/orders/[id]/sale-status-history/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/sale-status-history`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(1);
      expect(data[0].newValue).toBe('2');
      expect(data[0].oldValue).toBe('1');
    });

    it('should create a workflow status history entry when orderCurrentStatus changes', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCurrentStatus: 'Pending Delivery',
        }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT old_value, new_value, changed_at, changed_by_name FROM crm_order_current_status_history WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
        testOrder.crmOrderId
      );

      expect(dbRows.length).toBe(1);
      expect(dbRows[0].new_value).toBe('Pending Delivery');
      expect(dbRows[0].old_value).toBe('Pending Shipment');
      expect(dbRows[0].changed_by_name).toBe(testUser.nickname);
    });

    it('should NOT write a workflow status history entry if orderCurrentStatus value is identical', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCurrentStatus: 'Pending Shipment', // identical
        }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM crm_order_current_status_history WHERE order_id = ?`,
        testOrder.crmOrderId
      );
      expect(dbRows.length).toBe(0);
    });

    it('should return 403 when retrieving workflow history without orders:view-workflow-history permission', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/[id]/workflow-history/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/workflow-history`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(403);
    });

    it('should return 200 and list entries when retrieving workflow history with permission', async () => {
      await prisma.$executeRawUnsafe(
        `INSERT INTO crm_order_current_status_history (order_id, old_value, new_value, changed_by_id, changed_by_name, changed_at) VALUES (?, ?, ?, ?, ?, ?)`,
        testOrder.crmOrderId, 'Pending Booking', 'Pending Shipment', testUser.uid, testUser.nickname || testUser.name, new Date('2026-02-01T08:00:00Z')
      );

      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view-workflow-history',
        },
      });

      const { GET } = await import('../app/api/orders/[id]/workflow-history/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/workflow-history`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.length).toBe(1);
      expect(data[0].newValue).toBe('Pending Shipment');
      expect(data[0].oldValue).toBe('Pending Booking');
    });
  });

  describe('W-1603: Order Delete Cascade and RBAC', () => {
    it('should successfully delete an order and cascade delete all its comments and status history when permitted', async () => {
      // 1. Setup comments, sale status history, and workflow status history for the test order
      await prisma.$executeRawUnsafe(
        `INSERT INTO crm_comments (comment_id, customer_id, order_id, comment, comment_agent_id, comment_agent_name, comment_created_date) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        9999, testOrder.orderCustomerId, testOrder.crmOrderId, 'Test comment for cascade delete', testUser.uid, testUser.name, new Date()
      );

      await prisma.$executeRawUnsafe(
        `INSERT INTO crm_sale_status_history (order_id, old_value, new_value, changed_by_id, changed_by_name) VALUES (?, ?, ?, ?, ?)`,
        testOrder.crmOrderId, '1', '2', testUser.uid, testUser.name
      );

      await prisma.$executeRawUnsafe(
        `INSERT INTO crm_order_current_status_history (order_id, old_value, new_value, changed_by_id, changed_by_name) VALUES (?, ?, ?, ?, ?)`,
        testOrder.crmOrderId, 'Pending Booking', 'Pending Shipment', testUser.uid, testUser.name
      );

      // 2. Perform DELETE request with orders:delete permission
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:delete',
        },
      });

      const { DELETE } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'DELETE',
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      // 3. Verify order and related children are completely deleted (cascade confirmed)
      const orderCount = await prisma.crmOrders.count({ where: { crmOrderId: testOrder.crmOrderId } });
      expect(orderCount).toBe(0);

      const commentsCount = await prisma.crmComments.count({ where: { orderId: testOrder.crmOrderId } });
      expect(commentsCount).toBe(0);

      const saleHistoryCount = await prisma.crmSaleStatusHistory.count({ where: { orderId: testOrder.crmOrderId } });
      expect(saleHistoryCount).toBe(0);

      const workflowHistoryCount = await prisma.crmOrderCurrentStatusHistory.count({ where: { orderId: testOrder.crmOrderId } });
      expect(workflowHistoryCount).toBe(0);
    });

    it('should return 403 Forbidden when deleting order without orders:delete permission', async () => {
      // 1. Perform DELETE request with orders:edit permission (lacks orders:delete)
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:edit',
        },
      });

      const { DELETE } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'DELETE',
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(403);

      // 2. Verify order still exists
      const orderCount = await prisma.crmOrders.count({ where: { crmOrderId: testOrder.crmOrderId } });
      expect(orderCount).toBe(1);
    });

    it('should return 401 Unauthorized when deleting order with no session', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const { DELETE } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'DELETE',
      });

      const res = await DELETE(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(401);
    });
  });

  describe('W-1604: Order View Logging & History', () => {
    it('should log an access event in crm_order_views when GET /api/orders/:id is called', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view',
        },
      });

      const { GET } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      // Verify log table row using raw SQL with a retry loop due to fire-and-forget async write
      let dbRows: any[] = [];
      for (let i = 0; i < 20; i++) {
        dbRows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT viewer_id, viewer_name, viewed_at FROM crm_order_views WHERE order_id = ? AND viewer_id = ?`,
          testOrder.crmOrderId, testUser.uid
        );
        if (dbRows.length === 1) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(dbRows.length).toBe(1);
      expect(dbRows[0].viewer_name).toBe(testUser.nickname);
      const timeDiff = Math.abs(new Date(dbRows[0].viewed_at).getTime() - Date.now());
      expect(timeDiff).toBeLessThan(10000); // within 10 seconds
    });

    it('should log multiple entries for multiple page views without deduplication', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view',
        },
      });

      // Clear any existing logs from previous tests
      await prisma.$executeRawUnsafe(`DELETE FROM crm_order_views WHERE order_id = ?`, testOrder.crmOrderId);

      const { GET } = await import('../app/api/orders/[id]/route');

      for (let i = 0; i < 3; i++) {
        const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`);
        await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      }

      let dbRows: any[] = [];
      for (let i = 0; i < 20; i++) {
        dbRows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id FROM crm_order_views WHERE order_id = ? AND viewer_id = ?`,
          testOrder.crmOrderId, testUser.uid
        );
        if (dbRows.length === 3) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      expect(dbRows.length).toBe(3);
    });

    it('should return 200 and list views when GET /api/orders/:id/views is called with orders:view-log permission', async () => {
      await prisma.$executeRawUnsafe(
        `INSERT INTO crm_order_views (order_id, viewer_id, viewer_name, viewed_at) VALUES (?, ?, ?, ?)`,
        testOrder.crmOrderId, testUser.uid, testUser.nickname || testUser.name, new Date()
      );

      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view-log',
        },
      });

      const { GET } = await import('../app/api/orders/[id]/views/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/views`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.length).toBeGreaterThanOrEqual(1);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('orderId');
      expect(data[0]).toHaveProperty('viewerId');
      expect(data[0]).toHaveProperty('viewerName');
      expect(data[0]).toHaveProperty('viewedAt');
    });

    it('should return 403 Forbidden when GET /api/orders/:id/views is called without orders:view-log', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view', // lacking orders:view-log
        },
      });

      const { GET } = await import('../app/api/orders/[id]/views/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/views`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(403);
    });

    it('should silently swallow errors from logOrderView and still return 200 OK on GET /api/orders/:id', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view',
        },
      });

      // Mock prisma.crmOrderViews.create to throw an error simulating database failure
      const prismaSpy = vi.spyOn(prisma.crmOrderViews, 'create').mockRejectedValue(new Error('Database error'));

      const { GET } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`);
      
      let res;
      try {
        res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      } catch (err) {
        expect(err).toBeUndefined();
      }

      expect(res).toBeDefined();
      expect(res!.status).toBe(200);

      // Restore original implementation
      prismaSpy.mockRestore();
    });
  });

  describe('W-1605: Order Field Change Audit Log', () => {
    it('should log field-level changes on PATCH /api/orders/:id and verify logs are stored raw in DB', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:edit',
        },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          orderPart: 'Modified Clutch Panel',
          customerCardNumber: '1111222233334444',
          customerCardCvv: '987',
        }),
      });

      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      // Verify db storage contains raw values
      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT field_name, old_value, new_value FROM crm_order_audit_log WHERE order_id = ? ORDER BY id ASC`,
        testOrder.crmOrderId
      );

      const partRow = dbRows.find(r => r.field_name === 'orderPart');
      expect(partRow).toBeDefined();
      expect(partRow.new_value).toBe('Modified Clutch Panel');

      const cardRow = dbRows.find(r => r.field_name === 'customerCardNumber');
      expect(cardRow).toBeDefined();
      expect(cardRow.new_value).toBe('1111222233334444'); // stored raw in DB

      const cvvRow = dbRows.find(r => r.field_name === 'customerCardCvv');
      expect(cvvRow).toBeDefined();
      expect(cvvRow.new_value).toBe('987'); // stored raw in DB
    });

    it('should return 403 when getting audit logs without orders:view-audit-log', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view', // lacks orders:view-audit-log
        },
      });

      const { GET } = await import('../app/api/orders/[id]/audit-log/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/audit-log`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(403);
    });

    it('should return 200 and list audit logs dynamically masked when lacking customers:view-cards permission', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view-audit-log', // has logs view, but lacks customers:view-cards
        },
      });

      // Insert audit logs for the current testOrder
      await prisma.crmOrderAuditLog.createMany({
        data: [
          {
            orderId: testOrder.crmOrderId,
            fieldName: 'customerCardNumber',
            oldValue: '1234567812345678',
            newValue: '1111222233334444',
            changedById: testUser.uid,
            changedByName: testUser.nickname || testUser.name,
          },
          {
            orderId: testOrder.crmOrderId,
            fieldName: 'customerCardCvv',
            oldValue: '123',
            newValue: '987',
            changedById: testUser.uid,
            changedByName: testUser.nickname || testUser.name,
          },
        ],
      });

      const { GET } = await import('../app/api/orders/[id]/audit-log/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/audit-log`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const logs = await res.json();
      const cardLog = logs.find((l: any) => l.fieldName === 'customerCardNumber');
      expect(cardLog).toBeDefined();
      expect(cardLog.newValue).toBe('**** **** **** 4444'); // Dynamically masked to last 4

      const cvvLog = logs.find((l: any) => l.fieldName === 'customerCardCvv');
      expect(cvvLog).toBeDefined();
      expect(cvvLog.newValue).toBe('***'); // Dynamically masked CVV
    });

    it('should return 200 and list audit logs unmasked when user has customers:view-cards permission', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          nickname: testUser.nickname,
          userPermissions: 'orders:view-audit-log,customers:view-cards', // has both permissions
        },
      });

      // Insert audit logs for the current testOrder
      await prisma.crmOrderAuditLog.createMany({
        data: [
          {
            orderId: testOrder.crmOrderId,
            fieldName: 'customerCardNumber',
            oldValue: '1234567812345678',
            newValue: '1111222233334444',
            changedById: testUser.uid,
            changedByName: testUser.nickname || testUser.name,
          },
          {
            orderId: testOrder.crmOrderId,
            fieldName: 'customerCardCvv',
            oldValue: '123',
            newValue: '987',
            changedById: testUser.uid,
            changedByName: testUser.nickname || testUser.name,
          },
        ],
      });

      const { GET } = await import('../app/api/orders/[id]/audit-log/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/audit-log`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const logs = await res.json();
      const cardLog = logs.find((l: any) => l.fieldName === 'customerCardNumber');
      expect(cardLog).toBeDefined();
      expect(cardLog.newValue).toBe('1111222233334444'); // Unmasked card number

      const cvvLog = logs.find((l: any) => l.fieldName === 'customerCardCvv');
      expect(cvvLog).toBeDefined();
      expect(cvvLog.newValue).toBe('987'); // Unmasked CVV
    });
  });

  describe('W-2001: orderAmountCharged Migration & Manual Entry', () => {
    it('[RED] should allow creating an order with manual orderAmountCharged and bypass auto-calculation', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Creator', userPermissions: 'orders:create' },
      });

      const payload = {
        customerName: 'New Buyer Charged',
        customerPhone: '9876543210',
        customerEmail: 'new.buyer@example.com',
        customerBillingAddress: '123 Billing Rd',
        customerShippingAddress: '456 Shipping Rd',
        customerNameOncard: 'New Buyer Charged',
        customerCardNumber: '4111222233334444',
        customerCardExpDate: '10/30',
        customerCardCvv: '999',
        customerCardCopyStatus: 'No',
        customerCardPhotoStatus: 'No',
        orderMakeModel: '2021 Jeep Grand Cherokee',
        orderPart: 'Alternator',
        orderPartSize: 'Standard',
        orderQuotedMilesAndWarranty: '50',
        orderVendorMilesAndWarranty: '55',
        orderChecklist: 'No',
        orderVin: 'VIN789XYZ',
        orderTotalPitched: '500',
        orderVendorPrice: '300',
        orderAmountCharged: '350', // Manually entered!
        orderVendorId: testVendor.vendorId,
        orderShippingType: 'Express',
        orderPaymentGatewayId: testGateway.gatewayId,
        orderSalesAgentId: testUser.uid,
        orderVerifierId: null,
        saleStatus: '1',
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

      // Query DB for renamed field
      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT order_amount_charged FROM crm_orders WHERE crm_order_id = ?`,
        data.orderId
      );
      expect(dbRows.length).toBe(1);
      expect(dbRows[0].order_amount_charged).toBe('350');
    });

    it('[RED] should allow updating orderAmountCharged via PATCH and not auto-calculate markup on price updates', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Editor', userPermissions: 'orders:edit' },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderAmountCharged: '250',
          orderTotalPitched: '700',
          orderVendorPrice: '400',
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT order_amount_charged FROM crm_orders WHERE crm_order_id = ?`,
        testOrder.crmOrderId
      );
      expect(dbRows.length).toBe(1);
      expect(dbRows[0].order_amount_charged).toBe('250'); // manually set to 250, NOT auto-calculated (700-400=300)
    });
  });

  describe('W-2101: Mileage & Warranty Rename and Order-Level Checklist Field', () => {
    it('should create an order with orderQuotedMilesAndWarranty, orderVendorMilesAndWarranty, and orderChecklist', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Creator', userPermissions: 'orders:create' },
      });

      const payload = {
        customerName: 'New Buyer Mileage',
        customerPhone: '9876543210',
        customerEmail: 'new.buyer@example.com',
        customerBillingAddress: '123 Billing Rd',
        customerShippingAddress: '456 Shipping Rd',
        customerNameOncard: 'New Buyer Mileage',
        customerCardNumber: '4111222233334444',
        customerCardExpDate: '10/30',
        customerCardCvv: '999',
        customerCardCopyStatus: 'No',
        customerCardPhotoStatus: 'No',
        orderMakeModel: '2021 Jeep Grand Cherokee',
        orderPart: 'Alternator',
        orderPartSize: 'Standard',
        orderQuotedMilesAndWarranty: '1000',
        orderVendorMilesAndWarranty: '950',
        orderChecklist: 'Yes',
        orderVin: 'VIN789XYZ',
        orderTotalPitched: '500',
        orderVendorPrice: '300',
        orderAmountCharged: '350',
        orderVendorId: testVendor.vendorId,
        orderShippingType: 'Express',
        orderPaymentGatewayId: testGateway.gatewayId,
        orderSalesAgentId: testUser.uid,
        orderVerifierId: null,
        saleStatus: '1',
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

      // Query database directly to confirm values
      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT order_quoted_miles_and_warranty, order_vendor_miles_and_warranty, order_checklist FROM crm_orders WHERE crm_order_id = ?`,
        data.orderId
      );
      expect(dbRows.length).toBe(1);
      expect(dbRows[0].order_quoted_miles_and_warranty).toBe('1000');
      expect(dbRows[0].order_vendor_miles_and_warranty).toBe('950');
      expect(dbRows[0].order_checklist).toBe('Yes');
    });

    it('should return order detail with the new fields and without old fields', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Viewer', userPermissions: 'orders:view' },
      });

      const { GET } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('orderQuotedMilesAndWarranty');
      expect(data).toHaveProperty('orderVendorMilesAndWarranty');
      expect(data).toHaveProperty('orderChecklist');
      expect(data).not.toHaveProperty('orderQuotedMiles');
      expect(data).not.toHaveProperty('orderGivenMiles');
    });

    it('should update orderChecklist via PATCH', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: '1', name: 'Editor', userPermissions: 'orders:edit' },
      });

      const { PATCH } = await import('../app/api/orders/[id]/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderChecklist: 'No',
        }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
      expect(res.status).toBe(200);

      const dbRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT order_checklist FROM crm_orders WHERE crm_order_id = ?`,
        testOrder.crmOrderId
      );
      expect(dbRows.length).toBe(1);
      expect(dbRows[0].order_checklist).toBe('No');
    });
  });

  // ─── W-2404: Multi-Card Orders ────────────────────────────────────────────
  describe('W-2404 — POST /api/orders with multiple cards', () => {
    it('should create an order with two cards, each with amountToCharge', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          userPermissions: 'orders:create',
          uid: testUser.uid,
          nickname: testUser.nickname,
        },
      });

      const { POST } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'Multi-Card Buyer',
          customerEmail: 'new.buyer@example.com',
          customerPhone: '555-0000',
          cards: [
            {
              customerNameOncard: 'MULTI CARD BUYER',
              customerCardNumber: '4111111111111111',
              customerCardExpDate: '01/30',
              customerCardCvv: '999',
              amountToCharge: '500',
            },
            {
              customerNameOncard: 'MULTI CARD BUYER',
              customerCardNumber: '5500005555555559',
              customerCardExpDate: '06/31',
              customerCardCvv: '888',
              amountToCharge: '250',
            },
          ],
          orderPart: 'Engine',
          saleStatus: '1',
          orderSalesAgentId: testUser.uid,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toHaveProperty('crmOrderId');

      // Verify both cards persisted in DB
      const customer = await prisma.crmCustomers.findFirst({
        where: { customerEmail: 'new.buyer@example.com' },
        include: { cards: { orderBy: { cardId: 'asc' } } },
      });
      expect(customer).not.toBeNull();
      expect(customer!.cards.length).toBe(2);
      expect(customer!.cards[0].amountToCharge).toBe('500');
      expect(customer!.cards[1].amountToCharge).toBe('250');
    });

    it('should reject order creation with zero cards', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: String(testUser.uid),
          name: testUser.name,
          userPermissions: 'orders:create',
          uid: testUser.uid,
          nickname: testUser.nickname,
        },
      });

      const { POST } = await import('../app/api/orders/route');
      const req = new Request('http://localhost/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'No Card Buyer',
          customerEmail: 'new.buyer@example.com',
          cards: [],
          orderPart: 'Engine',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  // ─── W-2405: Card Image Upload ─────────────────────────────────────────────
  describe('W-2405 — Card image fields', () => {
    it('should persist card copy image and photo ID image when creating a card', async () => {
      const customer = await prisma.crmCustomers.create({
        data: { customerName: 'Image Test Cust', customerEmail: 'img_test@example.com' },
      });

      const fakeBase64 = 'data:image/png;base64,abc123==';
      const card = await prisma.crmCustomerCards.create({
        data: {
          cardCustomerId: customer.customerId,
          customerNameOncard: 'IMAGE TEST',
          customerCardNumber: '4111111111111111',
          customerCardExpDate: '12/30',
          customerCardCopyImage: fakeBase64,
          customerPhotoIdImage: fakeBase64,
        },
      });

      // findCardsByCustomerId (list) should NOT include image fields
      const { findCardsByCustomerId } = await import('../repository/customer.repository');
      const listCards = await findCardsByCustomerId(customer.customerId);
      expect(listCards.length).toBe(1);
      expect((listCards[0] as any).customerCardCopyImage).toBeUndefined();
      expect((listCards[0] as any).customerPhotoIdImage).toBeUndefined();

      // findCardById (single record) SHOULD include image fields
      const { findCardById } = await import('../repository/customer.repository');
      const fullCard = await findCardById(card.cardId);
      expect(fullCard).not.toBeNull();
      expect(fullCard!.customerCardCopyImage).toBe(fakeBase64);
      expect(fullCard!.customerPhotoIdImage).toBe(fakeBase64);

      // Cleanup
      await prisma.crmCustomerCards.delete({ where: { cardId: card.cardId } });
      await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
    });

    it('GET /api/customers/:id/cards/:cardId should return image fields with view-cards permission', async () => {
      const customer = await prisma.crmCustomers.create({
        data: { customerName: 'Image Test Cust 2', customerEmail: 'img_test2@example.com' },
      });
      const fakeBase64 = 'data:image/jpeg;base64,xyz789==';
      const card = await prisma.crmCustomerCards.create({
        data: {
          cardCustomerId: customer.customerId,
          customerNameOncard: 'IMAGE TEST 2',
          customerCardNumber: '4111111111111111',
          customerCardExpDate: '12/30',
          customerCardCopyImage: fakeBase64,
          customerPhotoIdImage: fakeBase64,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Manager',
          userPermissions: 'customers:view-cards',
        },
      });

      const { GET } = await import('../app/api/customers/[id]/cards/[cardId]/route');
      const req = new Request(`http://localhost/api/customers/${customer.customerId}/cards/${card.cardId}`);
      const res = await GET(req, { params: { id: String(customer.customerId), cardId: String(card.cardId) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.customerCardCopyImage).toBe(fakeBase64);
      expect(data.customerPhotoIdImage).toBe(fakeBase64);

      // Cleanup
      await prisma.crmCustomerCards.delete({ where: { cardId: card.cardId } });
      await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
    });

    it('GET /api/customers/:id/cards/:cardId should return 403 without view-cards permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Agent',
          userPermissions: 'customers:view', // Missing view-cards
        },
      });

      const { GET } = await import('../app/api/customers/[id]/cards/[cardId]/route');
      const req = new Request(`http://localhost/api/customers/1/cards/1`);
      const res = await GET(req, { params: { id: '1', cardId: '1' } });
      expect(res.status).toBe(403);
    });
  });
});
