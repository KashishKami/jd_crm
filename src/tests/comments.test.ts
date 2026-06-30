import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Order Comments Integration Tests', () => {
  let testOrder: { crmOrderId: number; orderCustomerId: number };
  let testAgent: { uid: number; name: string };
  let testCustomer: { customerId: number };

  beforeEach(async () => {
    vi.resetAllMocks();

    // Create baseline data
    const team = await prisma.crmTeams.findFirst();
    const role = await prisma.crmRoles.findFirst();
    testAgent = await prisma.users.create({
      data: {
        name: 'Comment Test Agent',
        username: 'comment_test_agent',
        teamId: team!.teamId,
        roleId: role!.roleId,
        nickname: 'CTA',
      },
    });

    testCustomer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Comment Customer',
        customerEmail: 'comment_cust@example.com',
      },
    });

    testOrder = await prisma.crmOrders.create({
      data: {
        orderCustomerId: testCustomer.customerId,
        orderSalesAgentId: testAgent.uid,
        orderVendorName: 'COMMENT_TEST_VENDOR',
        saleStatus: '1',
      },
    });
  });

  afterEach(async () => {
    // Cleanup comments
    await prisma.crmComments.deleteMany({
      where: { commentAgentId: testAgent.uid },
    });
    // Cleanup orders
    await prisma.crmOrders.deleteMany({
      where: { orderSalesAgentId: testAgent.uid },
    });
    // Cleanup customer
    await prisma.crmCustomers.deleteMany({
      where: { customerId: testCustomer.customerId },
    });
    // Cleanup user
    await prisma.users.deleteMany({
      where: { uid: testAgent.uid },
    });
  });

  describe('POST /api/orders/:id/comments', () => {
    it('should return 401 Unauthorized if user is not logged in', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const { POST } = await import('../app/api/orders/[id]/comments/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ comment: 'Test note' }),
      });
      const res = await POST(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(401);
    });

    it('should create a comment and return 201 Created', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: String(testAgent.uid), name: testAgent.name, userPermissions: 'orders:view' },
      });

      const { POST } = await import('../app/api/orders/[id]/comments/route');
      const formData = new FormData();
      formData.append('comment', 'Test note');
      
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/comments`, {
        method: 'POST',
        body: formData,
      });
      const res = await POST(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toHaveProperty('commentId');
      expect(data.comment).toBe('Test note');
      expect(data.commentAgentId).toBe(testAgent.uid);
      expect(data.commentAgentName).toBe('CTA');
    });

    it('should support uploading an image and saving the path', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: String(testAgent.uid), name: testAgent.name, userPermissions: 'orders:view' },
      });

      const { POST } = await import('../app/api/orders/[id]/comments/route');
      const formData = new FormData();
      formData.append('comment', 'Test note with image');
      // Create a dummy image file
      const file = new File(['dummy content'], 'test_receipt.png', { type: 'image/png' });
      formData.append('file', file);

      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/comments`, {
        method: 'POST',
        body: formData,
      });
      const res = await POST(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.commentImage).toContain('/uploads/comments/');
    });
  });

  describe('GET /api/orders/:id/comments', () => {
    it('should return comments in ascending order', async () => {
      // Seed two comments
      const comment1 = await prisma.crmComments.create({
        data: {
          orderId: testOrder.crmOrderId,
          customerId: testCustomer.customerId,
          comment: 'First comment',
          commentAgentId: testAgent.uid,
          commentAgentName: 'CTA',
          commentCreatedDate: new Date('2026-06-29T10:00:00Z'),
        },
      });

      const comment2 = await prisma.crmComments.create({
        data: {
          orderId: testOrder.crmOrderId,
          customerId: testCustomer.customerId,
          comment: 'Second comment',
          commentAgentId: testAgent.uid,
          commentAgentName: 'CTA',
          commentCreatedDate: new Date('2026-06-29T11:00:00Z'),
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { id: String(testAgent.uid), name: testAgent.name, userPermissions: 'orders:view' },
      });

      const { GET } = await import('../app/api/orders/[id]/comments/route');
      const req = new Request(`http://localhost/api/orders/${testOrder.crmOrderId}/comments`);
      const res = await GET(req, { params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0].commentId).toBe(comment1.commentId);
      expect(data[1].commentId).toBe(comment2.commentId);
    });
  });
});
