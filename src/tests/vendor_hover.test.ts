// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';
import OrderDetailPage from '../app/orders/[id]/page';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
  usePathname: () => '/orders/1',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));


describe('Vendor Hover Details Integration Tests', () => {
  let testTeam: any;
  let testRole: any;
  let testUser: any;
  let testCustomer: any;
  let testVendor: any;
  let testOrder: any;

  beforeEach(async () => {
    vi.resetAllMocks();

    // Clean up database
    await prisma.crmOrderCurrentStatusHistory.deleteMany({});
    await prisma.crmOrders.deleteMany({});
    await prisma.crmCustomers.deleteMany({});
    await prisma.crmVendors.deleteMany({});
    await prisma.users.deleteMany({ where: { username: 'hover_test_agent' } });

    // Seed
    testTeam = await prisma.crmTeams.findFirst() || await prisma.crmTeams.create({
      data: { teamName: 'Hover Test Team' },
    });

    testRole = await prisma.crmRoles.findFirst() || await prisma.crmRoles.create({
      data: { roleName: 'Hover Test Role' },
    });

    testUser = await prisma.users.create({
      data: {
        uid: 999,
        name: 'Hover Test Agent',
        username: 'hover_test_agent',
        teamId: testTeam.teamId,
        roleId: testRole.roleId,
        nickname: 'HoverAgentNick',
      },
    });

    testCustomer = await prisma.crmCustomers.create({
      data: {
        customerName: 'Hover Test Cust',
        customerEmail: 'hover.cust@example.com',
        customerPhone: '111-222-3333',
      },
    });

    testVendor = await prisma.crmVendors.create({
      data: {
        vendorName: 'Acme Auto Parts',
        vendorPhone: '555-666-7777',
        vendorEmail: 'sales@acme.com',
        vendorState: 'California',
        vendorContactPerson: 'John Acme',
        vendorStatus: 1,
      },
    });

    testOrder = await prisma.crmOrders.create({
      data: {
        orderCustomerId: testCustomer.customerId,
        orderPart: 'Transmission',
        orderCurrentStatus: 'Pending Booking',
        saleStatus: '1',
        orderVendorId: testVendor.vendorId,
        orderVendorName: 'Acme Auto Parts',
        orderSalesAgentId: testUser.uid,
      },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the vendor hover popover container and verify view link conditional visibility based on vendors:view permission', async () => {
    // 1. Mock session with orders:view AND vendors:view
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: '999',
        name: 'Hover Test Agent',
        userPermissions: 'orders:view,vendors:view',
      },
    } as any);

    // Render the async server component
    const PageJSX = await OrderDetailPage({ params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
    render(PageJSX);

    // Verify vendor details are in the document
    expect(screen.getAllByText('Acme Auto Parts').length).toBeGreaterThan(0);
    expect(screen.getByText(/sales@acme\.com/)).toBeDefined();
    expect(screen.getByText(/555-666-7777/)).toBeDefined();
    expect(screen.getByText(/California/)).toBeDefined();

    // Verify view link to vendor details page is rendered
    const viewDetailsLink = screen.getByText(/View Vendor Details/i);
    expect(viewDetailsLink.getAttribute('href')).toBe(`/vendors/${testVendor.vendorId}`);

    // 2. Mock session with orders:view but LACKING vendors:view
    cleanup();
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: '999',
        name: 'Hover Test Agent',
        userPermissions: 'orders:view',
      },
    } as any);

    const PageJSXLacking = await OrderDetailPage({ params: Promise.resolve({ id: String(testOrder.crmOrderId) }) });
    render(PageJSXLacking);

    // Verify vendor details are still present
    expect(screen.getAllByText('Acme Auto Parts').length).toBeGreaterThan(0);
    
    // Verify view link is NOT present
    expect(screen.queryByText(/View Vendor Details/i)).toBeNull();
  });
});
