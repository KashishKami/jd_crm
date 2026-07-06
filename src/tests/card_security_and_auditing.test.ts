import { vi, describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';
import * as orderService from '../service/order.service';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Card Security, Backend Sanitization and Auditing Tests', () => {
  let testOrder: any;
  let testCustomer: any;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Clean up test data
    await prisma.crmOrderAuditLog.deleteMany({});
    await prisma.crmOrders.deleteMany({});
    await prisma.crmCustomerCards.deleteMany({});
    await prisma.crmCustomers.deleteMany({});

    // Create test customer
    testCustomer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Audit Test Customer',
        customerPhone: '9876543210',
        customerEmail: 'audit_test@example.com',
        customerBillingAddress: '123 Test Billing',
        customerShippingAddress: '456 Test Shipping',
      },
    });

    // Create test order
    testOrder = await prisma.crmOrders.create({
      data: {
        orderCustomerId: testCustomer.customerId,
        orderMakeModel: 'Ford Focus',
        orderPart: 'Alternator',
        orderPartSize: 'Standard',
        orderQuotedMilesAndWarranty: '100',
        orderVendorMilesAndWarranty: '100',
        orderChecklist: 'No',
        orderVin: 'VIN123',
        orderShippingType: 'Residential',
        orderTotalPitched: '500',
        orderVendorPrice: '300',
        saleStatus: '1',
        orderCurrentStatus: 'Pending Booking',
      },
    });

    // Create cards
    await prisma.crmCustomerCards.createMany({
      data: [
        {
          cardCustomerId: testCustomer.customerId,
          customerNameOncard: 'Cardholder One',
          customerCardNumber: '1111222233334444',
          customerCardExpDate: '12/29',
          customerCardCvv: '123',
          customerCardCopyImage: 'data:image/png;base64,copy1',
          customerPhotoIdImage: 'data:image/png;base64,photo1',
        },
        {
          cardCustomerId: testCustomer.customerId,
          customerNameOncard: 'Cardholder Two',
          customerCardNumber: '5555666677778888',
          customerCardExpDate: '11/30',
          customerCardCvv: '456',
          customerCardCopyImage: 'data:image/png;base64,copy2',
          customerPhotoIdImage: null,
        }
      ]
    });
  });

  afterEach(async () => {
    await prisma.crmOrderAuditLog.deleteMany({});
    await prisma.crmOrders.deleteMany({});
    await prisma.crmCustomerCards.deleteMany({});
    await prisma.crmCustomers.deleteMany({});
  });

  describe('updateOrder card auditing tests', () => {
    it('should log multi-card updates, additions, and deletions in audit log without storing base64', async () => {
      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
        include: { customer: { include: { cards: true } } }
      });

      const cardsInput: Array<{
        cardId?: number;
        customerNameOncard: string;
        customerCardNumber: string;
        customerCardExpDate: string;
        customerCardCvv: string;
        customerCardCopyStatus: string;
        customerCardPhotoStatus: string;
        amountToCharge: string | null;
        customerCardCopyImage: string | null;
        customerPhotoIdImage: string | null;
      }> = dbOrder!.customer!.cards.map((c: any, index: number) => {
        if (index === 0) {
          // Update first cardholder name and copy image
          return {
            cardId: c.cardId,
            customerNameOncard: 'Updated Cardholder One',
            customerCardNumber: c.customerCardNumber,
            customerCardExpDate: c.customerCardExpDate,
            customerCardCvv: c.customerCardCvv,
            customerCardCopyStatus: c.customerCardCopyStatus,
            customerCardPhotoStatus: c.customerCardPhotoStatus,
            amountToCharge: c.amountToCharge,
            customerCardCopyImage: 'data:image/png;base64,new_copy1', // changed
            customerPhotoIdImage: c.customerPhotoIdImage,
          };
        }
        // Second card is kept as is
        return {
          cardId: c.cardId,
          customerNameOncard: c.customerNameOncard,
          customerCardNumber: c.customerCardNumber,
          customerCardExpDate: c.customerCardExpDate,
          customerCardCvv: c.customerCardCvv,
          customerCardCopyStatus: c.customerCardCopyStatus,
          customerCardPhotoStatus: c.customerCardPhotoStatus,
          amountToCharge: c.amountToCharge,
          customerCardCopyImage: c.customerCardCopyImage,
          customerPhotoIdImage: c.customerPhotoIdImage,
        };
      });

      // Add a third new card
      cardsInput.push({
        customerNameOncard: 'Cardholder Three',
        customerCardNumber: '9999000099990000',
        customerCardExpDate: '10/31',
        customerCardCvv: '789',
        customerCardCopyStatus: 'Yes',
        customerCardPhotoStatus: 'No',
        amountToCharge: '150.00',
        customerCardCopyImage: 'data:image/png;base64,new_copy3',
        customerPhotoIdImage: null,
      });

      await orderService.updateOrder(
        testOrder.crmOrderId,
        {
          cards: cardsInput
        } as any,
        1,
        'Test Auditor'
      );

      // Check audit entries
      const auditEntries = await prisma.crmOrderAuditLog.findMany({
        where: { orderId: testOrder.crmOrderId },
        orderBy: { fieldName: 'asc' }
      });

      // We updated Cardholder One name -> should log customerNameOncard (Card #1)
      const nameChange = auditEntries.find(a => a.fieldName === 'customerNameOncard (Card #1)');
      expect(nameChange).toBeDefined();
      expect(nameChange!.oldValue).toBe('Cardholder One');
      expect(nameChange!.newValue).toBe('Updated Cardholder One');

      // We changed Cardholder One image -> should log customerCardCopyImage (Card #1)
      const imageChange = auditEntries.find(a => a.fieldName === 'customerCardCopyImage (Card #1)');
      expect(imageChange).toBeDefined();
      expect(imageChange!.oldValue).toBe('[Uploaded]');
      expect(imageChange!.newValue).toBe('[Changed]');

      // We added Cardholder Three -> should log all fields for Card #3
      const card3Number = auditEntries.find(a => a.fieldName === 'customerCardNumber (Card #3)');
      expect(card3Number).toBeDefined();
      expect(card3Number!.oldValue).toBeNull();
      expect(card3Number!.newValue).toBe('9999000099990000');

      const card3Image = auditEntries.find(a => a.fieldName === 'customerCardCopyImage (Card #3)');
      expect(card3Image).toBeDefined();
      expect(card3Image!.oldValue).toBeNull();
      expect(card3Image!.newValue).toBe('[Uploaded]');
    });

    it('should ignore masked placeholder card number and CVV in updates', async () => {
      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
        include: { customer: { include: { cards: true } } }
      });

      const firstCard = dbOrder!.customer!.cards[0];
      const cardsInput = [
        {
          cardId: firstCard.cardId,
          customerNameOncard: firstCard.customerNameOncard,
          customerCardNumber: '**** **** **** 4444', // masked placeholder
          customerCardExpDate: firstCard.customerCardExpDate,
          customerCardCvv: '***', // masked placeholder
          customerCardCopyStatus: firstCard.customerCardCopyStatus,
          customerPhotoIdImage: firstCard.customerPhotoIdImage,
        }
      ];

      await orderService.updateOrder(
        testOrder.crmOrderId,
        {
          cards: cardsInput
        } as any,
        1,
        'Test Auditor'
      );

      // Verify first card in DB was NOT updated/corrupted with masked values
      const updatedCard = await prisma.crmCustomerCards.findUnique({
        where: { cardId: firstCard.cardId }
      });
      expect(updatedCard!.customerCardNumber).toBe('1111222233334444');
      expect(updatedCard!.customerCardCvv).toBe('123');

      // No card number/CVV audits should be written for Card #1
      const auditEntries = await prisma.crmOrderAuditLog.findMany({
        where: { orderId: testOrder.crmOrderId }
      });
      const card1Audits = auditEntries.filter(a => a.fieldName && (a.fieldName.includes('customerCardNumber (Card #1)') || a.fieldName.includes('customerCardCvv (Card #1)')));
      expect(card1Audits.length).toBe(0);
    });

    it('should preserve existing card images and ignore masked phone/email if canViewCards/canViewPhone is false', async () => {
      const dbOrder = await prisma.crmOrders.findUnique({
        where: { crmOrderId: testOrder.crmOrderId },
        include: { customer: { include: { cards: true } } }
      });

      const firstCard = dbOrder!.customer!.cards[0];
      const secondCard = dbOrder!.customer!.cards[1];
      const cardsInput = [
        {
          cardId: firstCard.cardId,
          customerNameOncard: firstCard.customerNameOncard,
          customerCardNumber: '**** **** **** 4444', // masked
          customerCardExpDate: firstCard.customerCardExpDate,
          customerCardCvv: '***', // masked
          customerCardCopyStatus: firstCard.customerCardCopyStatus,
          customerCardPhotoStatus: firstCard.customerCardPhotoStatus,
          amountToCharge: '350.00', // updated amount
          customerCardCopyImage: null, // was set to null on server-side sanitization
          customerPhotoIdImage: null, // was set to null on server-side sanitization
        },
        {
          cardId: secondCard.cardId,
          customerNameOncard: secondCard.customerNameOncard,
          customerCardNumber: '**** **** **** 8888', // masked
          customerCardExpDate: secondCard.customerCardExpDate,
          customerCardCvv: '***', // masked
          customerCardCopyStatus: secondCard.customerCardCopyStatus,
          customerCardPhotoStatus: secondCard.customerCardPhotoStatus,
          amountToCharge: secondCard.amountToCharge,
          customerCardCopyImage: null, // was set to null on server-side sanitization
          customerPhotoIdImage: null, // was set to null on server-side sanitization
        }
      ];

      await orderService.updateOrder(
        testOrder.crmOrderId,
        {
          customerPhone: '***-***-3210', // masked phone
          customerEmail: 'au***@example.com', // masked email
          cards: cardsInput
        } as any,
        1,
        'Test Auditor',
        'orders:edit' // Lacks view permissions
      );

      // Verify Card #1 in DB: images must be preserved!
      const updatedCard = await prisma.crmCustomerCards.findUnique({
        where: { cardId: firstCard.cardId }
      });
      expect(updatedCard!.customerCardCopyImage).toBe('data:image/png;base64,copy1');
      expect(updatedCard!.customerPhotoIdImage).toBe('data:image/png;base64,photo1');
      expect(updatedCard!.amountToCharge).toBe('350.00'); // updated field is saved

      // Verify Customer: phone and email must be preserved!
      const updatedCustomer = await prisma.crmCustomers.findUnique({
        where: { customerId: testCustomer.customerId }
      });
      expect(updatedCustomer!.customerPhone).toBe('9876543210');
      expect(updatedCustomer!.customerEmail).toBe('audit_test@example.com');

      // Verify Auditing: no change audits should be generated for masked phone, email, or images!
      const auditEntries = await prisma.crmOrderAuditLog.findMany({
        where: { orderId: testOrder.crmOrderId }
      });
      const maskedOrImageAudits = auditEntries.filter(a =>
        a.fieldName!.includes('customerPhone') ||
        a.fieldName!.includes('customerEmail') ||
        a.fieldName!.includes('customerCardCopyImage') ||
        a.fieldName!.includes('customerPhotoIdImage')
      );
      expect(maskedOrImageAudits.length).toBe(0);
    });
  });

  describe('GET /api/orders/[id] backend permission sanitization', () => {
    it('should return masked phone, email and cards if user lacks view permissions', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'orders:view', // lacks view-phone, view-email, view-cards
        },
      });

      const { GET } = await import('../app/api/orders/[id]/route');
      const res = await GET(
        new Request(`http://localhost:3000/api/orders/${testOrder.crmOrderId}`),
        { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) }
      );

      expect(res.status).toBe(200);
      const data = await res.json();

      // Check phone, alternate phone and email are masked
      expect(data.customer.customerPhone).toBe('***-***-3210');
      expect(data.customer.customerEmail).toBe('au***@example.com');

      // Check cards are masked/sanitized
      expect(data.customer.cards[0].customerCardNumber).toBe('**** **** **** 4444');
      expect(data.customer.cards[0].customerCardCvv).toBe('***');
      expect(data.customer.cards[0].customerCardCopyImage).toBeNull();
      expect(data.customer.cards[0].customerPhotoIdImage).toBeNull();
    });

    it('should return raw details if user has full permissions', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super User',
          userPermissions: 'orders:view,customers:view-phone,customers:view-email,customers:view-cards',
        },
      });

      const { GET } = await import('../app/api/orders/[id]/route');
      const res = await GET(
        new Request(`http://localhost:3000/api/orders/${testOrder.crmOrderId}`),
        { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) }
      );

      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.customer.customerPhone).toBe('9876543210');
      expect(data.customer.customerEmail).toBe('audit_test@example.com');
      expect(data.customer.cards[0].customerCardNumber).toBe('1111222233334444');
      expect(data.customer.cards[0].customerCardCvv).toBe('123');
      expect(data.customer.cards[0].customerCardCopyImage).toBe('data:image/png;base64,copy1');
    });
  });

  describe('GET /api/orders/[id]/audit-log backend permission masking', () => {
    it('should mask card details, phone, and email in audit log when user lacks permission', async () => {
      // Setup raw audit logs directly in DB
      await prisma.crmOrderAuditLog.createMany({
        data: [
          {
            orderId: testOrder.crmOrderId,
            fieldName: 'customerCardNumber (Card #1)',
            oldValue: '1111222233334444',
            newValue: '9999999999999999',
            changedById: 1,
            changedByName: 'Test',
          },
          {
            orderId: testOrder.crmOrderId,
            fieldName: 'customerPhone',
            oldValue: '9876543210',
            newValue: '5555555555',
            changedById: 1,
            changedByName: 'Test',
          },
          {
            orderId: testOrder.crmOrderId,
            fieldName: 'customerEmail',
            oldValue: 'old@example.com',
            newValue: 'new@example.com',
            changedById: 1,
            changedByName: 'Test',
          }
        ]
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'orders:view-audit-log', // lacks cards, phone, email view permissions
        },
      });

      const { GET } = await import('../app/api/orders/[id]/audit-log/route');
      const res = await GET(
        new Request(`http://localhost:3000/api/orders/${testOrder.crmOrderId}/audit-log`),
        { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) }
      );

      expect(res.status).toBe(200);
      const data = await res.json();

      const cardAudit = data.find((d: any) => d.fieldName === 'customerCardNumber (Card #1)');
      expect(cardAudit.oldValue).toBe('**** **** **** 4444');
      expect(cardAudit.newValue).toBe('**** **** **** 9999');

      const phoneAudit = data.find((d: any) => d.fieldName === 'customerPhone');
      expect(phoneAudit.oldValue).toBe('***-***-3210');
      expect(phoneAudit.newValue).toBe('***-***-5555');

      const emailAudit = data.find((d: any) => d.fieldName === 'customerEmail');
      expect(emailAudit.oldValue).toBe('ol***@example.com');
      expect(emailAudit.newValue).toBe('ne***@example.com');
    });
  });

  afterAll(() => {
    execSync('npx tsx src/scripts/restore-admin.ts');
  });
});
