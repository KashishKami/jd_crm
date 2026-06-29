import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Settings & RBAC Permissions Integration Tests', () => {
  beforeEach(async () => {
    vi.resetAllMocks();

    // Clean up test users first to avoid FK constraints
    await prisma.users.deleteMany({
      where: {
        username: {
          in: ['test_delete_restrictor']
        }
      }
    });

    // Clean up test role relationships
    await prisma.crmRolePermissions.deleteMany({
      where: {
        role: {
          roleName: {
            in: ['Test Custom Role', 'Another Custom Role', 'Another Custom Role Updated', 'Delete Candidate Role']
          }
        }
      }
    });

    await prisma.crmRoles.deleteMany({
      where: {
        roleName: {
          in: ['Test Custom Role', 'Another Custom Role', 'Another Custom Role Updated', 'Delete Candidate Role']
        }
      }
    });
  });

  afterEach(async () => {
    // Clean up test users
    await prisma.users.deleteMany({
      where: {
        username: {
          in: ['test_delete_restrictor']
        }
      }
    });

    // Clean up test role relationships
    await prisma.crmRolePermissions.deleteMany({
      where: {
        role: {
          roleName: {
            in: ['Test Custom Role', 'Another Custom Role', 'Another Custom Role Updated', 'Delete Candidate Role']
          }
        }
      }
    });

    await prisma.crmRoles.deleteMany({
      where: {
        roleName: {
          in: ['Test Custom Role', 'Another Custom Role', 'Another Custom Role Updated', 'Delete Candidate Role']
        }
      }
    });
  });

  describe('GET /api/settings/roles', () => {
    it('should return 403 Forbidden if user lacks settings:manage-permissions permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Regular Agent',
          userPermissions: 'orders:view', // lacks settings:manage-permissions
        },
      });

      const { GET } = await import('../app/api/settings/roles/route');
      const req = new Request('http://localhost/api/settings/roles');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('should return 200 OK and list of roles if user has settings:manage-permissions permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin User',
          userPermissions: 'settings:manage-permissions',
        },
      });

      const { GET } = await import('../app/api/settings/roles/route');
      const req = new Request('http://localhost/api/settings/roles');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Check structure of first role
      const firstRole = data[0];
      expect(firstRole).toHaveProperty('roleId');
      expect(firstRole).toHaveProperty('roleName');
      expect(firstRole).toHaveProperty('permissionIds');
      expect(Array.isArray(firstRole.permissionIds)).toBe(true);
    });
  });

  describe('POST /api/settings/roles', () => {
    it('should return 403 if user lacks settings:manage-permissions', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      });

      const { POST } = await import('../app/api/settings/roles/route');
      const req = new Request('http://localhost/api/settings/roles', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Custom Role' }),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it('should successfully create a new role', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin User',
          userPermissions: 'settings:manage-permissions',
        },
      });

      const { POST } = await import('../app/api/settings/roles/route');
      const req = new Request('http://localhost/api/settings/roles', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Custom Role' }),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.roleName).toBe('Test Custom Role');

      const dbRole = await prisma.crmRoles.findUnique({
        where: { roleName: 'Test Custom Role' },
      });
      expect(dbRole).not.toBeNull();
    });
  });

  describe('PUT /api/settings/roles/:id', () => {
    it('should successfully update role name and permissions list', async () => {
      // Create a test role to update
      const customRole = await prisma.crmRoles.create({
        data: { roleName: 'Another Custom Role' },
      });

      // Get some permissions
      const perms = await prisma.crmPermissions.findMany({ take: 2 });
      const permIds = perms.map(p => p.permissionId);

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin User',
          userPermissions: 'settings:manage-permissions',
        },
      });

      const { PUT } = await import('../app/api/settings/roles/[id]/route');
      const req = new Request(`http://localhost/api/settings/roles/${customRole.roleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Another Custom Role Updated',
          permissionIds: permIds,
        }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: String(customRole.roleId) }) });

      expect(res.status).toBe(200);

      const dbRole = await prisma.crmRoles.findUnique({
        where: { roleId: customRole.roleId },
        include: { permissions: true },
      });
      expect(dbRole?.roleName).toBe('Another Custom Role Updated');
      expect(dbRole?.permissions.length).toBe(permIds.length);
      const dbPermIds = dbRole?.permissions.map(p => p.permissionId);
      expect(dbPermIds).toContain(permIds[0]);
    });

    it('should reject updating Super Admin (roleId = 1) if super-admin permission is omitted', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin User',
          userPermissions: 'settings:manage-permissions',
        },
      });

      // Super Admin is roleId: 1
      const { PUT } = await import('../app/api/settings/roles/[id]/route');
      const req = new Request('http://localhost/api/settings/roles/1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Super Admin',
          permissionIds: [], // Omit super-admin (id = 1 usually)
        }),
      });
      const res = await PUT(req, { params: Promise.resolve({ id: '1' }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('lockout');
    });
  });

  describe('DELETE /api/settings/roles/:id', () => {
    it('should reject deleting administrative roles (roleId 1 or 2)', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin User',
          userPermissions: 'settings:manage-permissions',
        },
      });

      const { DELETE } = await import('../app/api/settings/roles/[id]/route');
      const req = new Request('http://localhost/api/settings/roles/1', {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: '1' }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Cannot delete default administrative roles');
    });

    it('should reject deleting a role with active users associated', async () => {
      // Find team
      const team = await prisma.crmTeams.findFirst();

      // Create a role
      const candidateRole = await prisma.crmRoles.create({
        data: { roleName: 'Delete Candidate Role' },
      });

      // Create a user in that role
      const user = await prisma.users.create({
        data: {
          name: 'Test Delete Restrictor',
          username: 'test_delete_restrictor',
          teamId: team!.teamId,
          roleId: candidateRole.roleId,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin User',
          userPermissions: 'settings:manage-permissions',
        },
      });

      const { DELETE } = await import('../app/api/settings/roles/[id]/route');
      const req = new Request(`http://localhost/api/settings/roles/${candidateRole.roleId}`, {
        method: 'DELETE',
      });
      const res = await DELETE(req, { params: Promise.resolve({ id: String(candidateRole.roleId) }) });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('active users');

      // Cleanup
      await prisma.users.delete({ where: { uid: user.uid } });
    });
  });

  describe('GET /api/settings/permissions', () => {
    it('should return list of all permissions', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Super Admin User',
          userPermissions: 'settings:manage-permissions',
        },
      });

      const { GET } = await import('../app/api/settings/permissions/route');
      const req = new Request('http://localhost/api/settings/permissions');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('permissionId');
      expect(data[0]).toHaveProperty('permissionName');
    });
  });
});
