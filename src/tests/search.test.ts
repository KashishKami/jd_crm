import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Unified Search API Integration Tests', () => {
  let testCustomer: any;
  let testOrder: any;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Clean up if needed
    await prisma.crmOrders.deleteMany({
      where: { orderVin: 'VIN123TEST' },
    });
    await prisma.crmCustomers.deleteMany({
      where: { customerEmail: 'search_test_customer@example.com' },
    });

    // Create a customer with zipcode in address
    testCustomer = await prisma.crmCustomers.create({
      data: {
        customerName: 'JohnTest SearchDoe',
        customerPhone: '9999999999',
        customerEmail: 'search_test_customer@example.com',
        customerBillingAddress: '123 Billing St, 90210',
        customerShippingAddress: '456 Shipping Rd, 90210',
      },
    });

    // Create an order
    testOrder = await prisma.crmOrders.create({
      data: {
        orderCustomerId: testCustomer.customerId,
        orderMakeModel: 'Toyota Camry Test',
        orderVin: 'VIN123TEST',
        orderPart: 'Alternator',
        orderSalesAgentName: 'Agent Searchy',
        orderTrackingNumber: 'TRK-SEARCH-99',
      },
    });
  });

  afterEach(async () => {
    // Clean up
    if (testOrder) {
      await prisma.crmOrders.delete({
        where: { crmOrderId: testOrder.crmOrderId },
      }).catch(() => {});
    }
    if (testCustomer) {
      await prisma.crmCustomers.delete({
        where: { customerId: testCustomer.customerId },
      }).catch(() => {});
    }
  });

  it('should return 401 Unauthorized if request does not have active session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const { GET } = await import('../app/api/search/route');
    const req = new Request('http://localhost/api/search?q=test');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 400 Bad Request if q is empty', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Agent', userPermissions: '' },
    });

    const { GET } = await import('../app/api/search/route');
    const req = new Request('http://localhost/api/search?q=');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Query parameter "q" is required');
  });

  it('should return results when matching customer email search_test_customer@example.com', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Agent', userPermissions: '' },
    });

    const { GET } = await import('../app/api/search/route');
    const req = new Request('http://localhost/api/search?q=search_test_customer@example.com');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.customers.length).toBeGreaterThan(0);
    expect(body.customers.some((c: any) => c.customerEmail === 'search_test_customer@example.com')).toBe(true);
    expect(body.orders.length).toBeGreaterThan(0);
  });

  it('should return results when matching customer phone number 9999999999', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Agent', userPermissions: '' },
    });

    const { GET } = await import('../app/api/search/route');
    const req = new Request('http://localhost/api/search?q=9999999999');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.customers.some((c: any) => c.customerPhone === '9999999999')).toBe(true);
  });

  it('should return results when matching customer name JohnTest', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Agent', userPermissions: '' },
    });

    const { GET } = await import('../app/api/search/route');
    const req = new Request('http://localhost/api/search?q=JohnTest');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.customers.some((c: any) => c.customerName.includes('JohnTest'))).toBe(true);
  });

  it('should return results when matching zipcode 90210', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Agent', userPermissions: '' },
    });

    const { GET } = await import('../app/api/search/route');
    const req = new Request('http://localhost/api/search?q=90210');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.customers.some((c: any) => c.customerBillingAddress?.includes('90210'))).toBe(true);
  });

  it('should return results when matching exact order ID', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Agent', userPermissions: '' },
    });

    const { GET } = await import('../app/api/search/route');
    const req = new Request(`http://localhost/api/search?q=${testOrder.crmOrderId}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders.some((o: any) => o.crmOrderId === testOrder.crmOrderId)).toBe(true);
  });

  it('should not return customer when searching billing address keywords with purely alphabetic queries like Billing', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Agent', userPermissions: '' },
    });

    const { GET } = await import('../app/api/search/route');
    const req = new Request('http://localhost/api/search?q=Billing');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.customers.some((c: any) => c.customerId === testCustomer.customerId)).toBe(false);
  });
});
