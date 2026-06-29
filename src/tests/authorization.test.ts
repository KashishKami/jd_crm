import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hasPermission } from '../service/permission.service';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

// Mock next-auth to simulate session resolution
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Permission Service Tests', () => {
  it('should allow super-admin to bypass any permission check', () => {
    expect(hasPermission('super-admin', 'vendors:view')).toBe(true);
    expect(hasPermission('super-admin', 'gateways:view')).toBe(true);
    expect(hasPermission('vendors:view,super-admin,agents:view', 'orders:view')).toBe(true);
  });

  it('should allow access if permission string is explicitly present', () => {
    expect(hasPermission('vendors:view,agents:view,gateways:view', 'vendors:view')).toBe(true);
    expect(hasPermission('vendors:view,agents:view,gateways:view', 'agents:view')).toBe(true);
    expect(hasPermission('vendors:view,agents:view,gateways:view', 'gateways:view')).toBe(true);
  });

  it('should deny access if permission string is absent', () => {
    expect(hasPermission('vendors:view,agents:view', 'gateways:view')).toBe(false);
    expect(hasPermission('vendors:view,agents:view', 'orders:view')).toBe(false);
    expect(hasPermission('', 'vendors:view')).toBe(false);
    expect(hasPermission(null, 'vendors:view')).toBe(false);
    expect(hasPermission(undefined, 'vendors:view')).toBe(false);
  });
});

describe('API Authorization Guard Integration Test', () => {
  let testVendor: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    
    // Ensure at least one vendor exists for the API to return
    testVendor = await prisma.crmVendors.create({
      data: {
        vendorName: 'Test Auth Guard Vendor',
        vendorContactPerson: 'John Guard',
        vendorPhone: '000-000-0000',
        vendorStatus: 1,
      },
    });
  });

  afterEach(async () => {
    if (testVendor) {
      await prisma.crmVendors.delete({
        where: { vendorId: testVendor.vendorId },
      });
    }
  });

  it('should return 401 Unauthorized if there is no session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    const { GET } = await import('../app/api/vendors/route');
    const response = await GET();
    
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return 403 Forbidden if user lacks required permission (vendors:view)', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: {
        id: '1',
        name: 'Normal User',
        userPermissions: 'agents:view,gateways:view', // lacks vendors:view
      },
    });

    const { GET } = await import('../app/api/vendors/route');
    const response = await GET();

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Forbidden: Insufficient Permissions');
  });

  it('should return 200 OK and mock vendors list if user has permission (vendors:view)', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: {
        id: '1',
        name: 'Permitted User',
        userPermissions: 'vendors:view,agents:view', // has vendors:view
      },
    });

    const { GET } = await import('../app/api/vendors/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(typeof body[0].vendorName).toBe('string');
  });

  it('should return 200 OK and mock vendors list if user is super-admin', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: {
        id: '1',
        name: 'Super Admin',
        userPermissions: 'super-admin', // super-admin bypass
      },
    });

    const { GET } = await import('../app/api/vendors/route');
    const response = await GET();

    expect(response.status).toBe(200);
  });
});
