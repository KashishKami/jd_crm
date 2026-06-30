import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Customer & Sensitive Cards Integration Tests', () => {
  let testCustomer: { customerId: number };

  beforeEach(async () => {
    vi.resetAllMocks();

    // Clean up test data
    await prisma.crmCustomerCards.deleteMany({
      where: {
        customerNameOncard: 'Test Cardholder',
      },
    });
    await prisma.crmCustomers.deleteMany({
      where: {
        customerEmail: 'test_customer@example.com',
      },
    });

    // Create a test customer and associated card
    testCustomer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Test Customer',
        customerPhone: '1234567890',
        customerEmail: 'test_customer@example.com',
        customerBillingAddress: '123 Billing St',
        customerShippingAddress: '456 Shipping Rd',
      },
    });

    await prisma.crmCustomerCards.create({
      data: {
        cardCustomerId: testCustomer.customerId,
        customerNameOncard: 'Test Cardholder',
        customerCardNumber: '1234567812345678',
        customerCardExpDate: '12/29',
        customerCardCvv: '123',
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.crmCustomerCards.deleteMany({
      where: {
        customerNameOncard: 'Test Cardholder',
      },
    });
    await prisma.crmCustomers.deleteMany({
      where: {
        customerEmail: 'test_customer@example.com',
      },
    });
  });

  describe('GET /api/customers', () => {
    it('should return 403 Forbidden if user lacks customers:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'vendors:view', // lacks customers:view
        },
      });

      const { GET } = await import('../app/api/customers/route');
      const res = await GET();

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('should return 200 OK and list of customers if user has customers:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'customers:view',
        },
      });

      const { GET } = await import('../app/api/customers/route');
      const res = await GET();

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      const hasTestCustomer = data.some((c: { customerEmail: string }) => c.customerEmail === 'test_customer@example.com');
      expect(hasTestCustomer).toBe(true);
    });
  });

  describe('GET /api/customers/:id/cards', () => {
    it('should return 401 Unauthorized if not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const { GET } = await import('../app/api/customers/[id]/cards/route');
      const req = new Request(`http://localhost/api/customers/${testCustomer.customerId}/cards`);
      const res = await GET(req, { params: { id: String(testCustomer.customerId) } });

      expect(res.status).toBe(401);
    });

    it('should return masked card details if session lacks customers:view-cards permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Agent User',
          userPermissions: 'customers:view', // has view, but not view-cards
        },
      });

      const { GET } = await import('../app/api/customers/[id]/cards/route');
      const req = new Request(`http://localhost/api/customers/${testCustomer.customerId}/cards`);
      const res = await GET(req, { params: { id: String(testCustomer.customerId) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].customerCardNumber).toBe('**** **** **** 5678');
      expect(data[0].customerCardCvv).toBe('***');
    });

    it('should return full card details if session has customers:view-cards permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Manager User',
          userPermissions: 'customers:view,customers:view-cards',
        },
      });

      const { GET } = await import('../app/api/customers/[id]/cards/route');
      const req = new Request(`http://localhost/api/customers/${testCustomer.customerId}/cards`);
      const res = await GET(req, { params: { id: String(testCustomer.customerId) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].customerCardNumber).toBe('1234567812345678');
      expect(data[0].customerCardCvv).toBe('123');
    });
  });

  describe('POST /api/customers', () => {
    it('should successfully create a customer', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Agent User',
          userPermissions: 'customers:create',
        },
      });

      const { POST } = await import('../app/api/customers/route');
      const req = new Request('http://localhost/api/customers', {
        method: 'POST',
        body: JSON.stringify({
          customerName: 'New Guy',
          customerPhone: '9876543210',
          customerEmail: 'new_guy@example.com',
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toHaveProperty('customerId');
      expect(data.customerName).toBe('New Guy');

      // Cleanup
      await prisma.crmCustomers.deleteMany({
        where: { customerEmail: 'new_guy@example.com' },
      });
    });
  });
});
