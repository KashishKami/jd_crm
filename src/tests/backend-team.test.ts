import { vi, describe, it, expect } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Backend Team Performance Integration Tests', () => {
  it('should return 401 Unauthorized if there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const { GET } = await import('../app/api/dashboard/backend-team/route');
    const req = new Request('http://localhost/api/dashboard/backend-team');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 Forbidden if user lacks backend team permissions', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Agent', userPermissions: 'dashboard:total-sales' },
    });

    const { GET } = await import('../app/api/dashboard/backend-team/route');
    const req = new Request('http://localhost/api/dashboard/backend-team?month=6&year=2026');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('[RED] should return correct backend performance stats filtered by month/year with active agent and LEFT JOIN validation', async () => {
    const role = await prisma.crmRoles.findFirst();
    const team = await prisma.crmTeams.findFirst();

    // Create 3 agents:
    // 1. Sales Agent (should not be in backend team)
    // 2. Active Backend Agent with orders
    // 3. Active Backend Agent with NO orders (verifies LEFT JOIN)
    const salesAgent = await prisma.users.create({
      data: {
        name: 'Sales Agent',
        username: 'sales_agent_backend_test',
        teamId: team!.teamId,
        roleId: role!.roleId,
        designation: 'Sales Specialist',
        status: 1,
      },
    });
    const backendAgentWithOrders = await prisma.users.create({
      data: {
        name: 'Backend Orders',
        nickname: 'BackendOrdersNick',
        username: 'backend_orders_test',
        teamId: team!.teamId,
        roleId: role!.roleId,
        designation: 'Backend Specialist',
        status: 1,
      },
    });
    const backendAgentEmpty = await prisma.users.create({
      data: {
        name: 'Backend Empty',
        username: 'backend_empty_test',
        teamId: team!.teamId,
        roleId: role!.roleId,
        designation: 'Backend Associate',
        status: 1,
      },
    });

    const customer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Team Customer',
        customerEmail: 'team_cust@example.com',
      },
    });

    const targetDate = new Date('2026-06-15T12:00:00Z');
    const otherDate = new Date('2026-05-15T12:00:00Z');

    // Create orders for backendAgentWithOrders
    // 1 completed order (Completed Orders) in target month
    await prisma.crmOrders.create({
      data: {
        orderCustomerId: customer.customerId,
        orderCurrentStatus: 'Completed Orders',
        orderCreatedDate: targetDate,
        orderBackendExecutiveId: backendAgentWithOrders.uid,
        orderBackendExecutiveName: backendAgentWithOrders.name,
        orderVendorName: 'TEAM_TEST',
      },
    });
    // 1 pending shipment order in target month
    await prisma.crmOrders.create({
      data: {
        orderCustomerId: customer.customerId,
        orderCurrentStatus: 'Pending Shipment',
        orderCreatedDate: targetDate,
        orderBackendExecutiveId: backendAgentWithOrders.uid,
        orderBackendExecutiveName: backendAgentWithOrders.name,
        orderVendorName: 'TEAM_TEST',
      },
    });
    // 1 pending booking order in OTHER month (May) (should not be counted)
    await prisma.crmOrders.create({
      data: {
        orderCustomerId: customer.customerId,
        orderCurrentStatus: 'Pending Booking',
        orderCreatedDate: otherDate,
        orderBackendExecutiveId: backendAgentWithOrders.uid,
        orderBackendExecutiveName: backendAgentWithOrders.name,
        orderVendorName: 'TEAM_TEST',
      },
    });

    // Create an order for Sales Agent (should not count as backend)
    await prisma.crmOrders.create({
      data: {
        orderCustomerId: customer.customerId,
        orderCurrentStatus: 'Completed Orders',
        orderCreatedDate: targetDate,
        orderBackendExecutiveId: salesAgent.uid,
        orderBackendExecutiveName: salesAgent.name,
        orderVendorName: 'TEAM_TEST',
      },
    });

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: '1', name: 'Super Admin', userPermissions: 'super-admin' },
    });

    const { GET } = await import('../app/api/dashboard/backend-team/route');
    const req = new Request('http://localhost/api/dashboard/backend-team?month=6&year=2026');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('topPerformers');
    expect(data).toHaveProperty('bottomPerformers');
    expect(data).toHaveProperty('pendingByCategory');

    // 1. Sales Agent must not appear in any datasets
    const allAgentNames = data.pendingByCategory.map((x: any) => x.agentName);
    expect(allAgentNames).not.toContain('Sales Agent');

    // 2. LEFT JOIN validation: backendAgentEmpty must appear in pendingByCategory
    const emptyRow = data.pendingByCategory.find((x: any) => x.agentId === backendAgentEmpty.uid);
    expect(emptyRow).toBeDefined();
    expect(emptyRow.completedCount).toBe(0);
    expect(emptyRow.totalPending).toBe(0);

    // 3. Correct counts for backendAgentWithOrders
    const orderRow = data.pendingByCategory.find((x: any) => x.agentId === backendAgentWithOrders.uid);
    expect(orderRow).toBeDefined();
    expect(orderRow.agentName).toBe('BackendOrdersNick'); // must use nickname if present
    expect(orderRow.completedCount).toBe(1);
    expect(orderRow.pendingShipment).toBe(1);
    expect(orderRow.pendingBooking).toBe(0);
    expect(orderRow.totalPending).toBe(1);

    // Cleanup
    await prisma.crmOrders.deleteMany({ where: { orderVendorName: 'TEAM_TEST' } });
    await prisma.crmCustomers.delete({ where: { customerId: customer.customerId } });
    await prisma.users.deleteMany({
      where: { uid: { in: [salesAgent.uid, backendAgentWithOrders.uid, backendAgentEmpty.uid] } },
    });
  });
});
