// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import RoleSettingsPage from '../app/settings/roles/page';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/settings/roles',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe('RoleSettings Page Unit Tests', () => {
  const mockRoles = [
    {
      roleId: 1,
      roleName: 'Super Admin',
      permissionIds: [1, 2, 3],
    },
    {
      roleId: 5,
      roleName: 'Agent',
      permissionIds: [5],
    },
  ];

  const mockPermissions = [
    {
      permissionId: 1,
      permissionName: 'super-admin',
      permissionDescription: 'Super admin bypass',
    },
    {
      permissionId: 2,
      permissionName: 'vendors:view',
      permissionDescription: 'View vendors directory',
    },
    {
      permissionId: 5,
      permissionName: 'orders:view',
      permissionDescription: 'View orders',
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Super Admin',
          userPermissions: 'settings:manage-permissions',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    // Mock global fetch responses
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/settings/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoles),
        } as Response);
      }
      if (url.includes('/api/settings/permissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPermissions),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    });
  });

  it('should render roles sidebar list and permissions checklist', async () => {
    render(<RoleSettingsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Super Admin')).not.toBeNull();
      expect(screen.queryByText('Agent')).not.toBeNull();
      expect(screen.queryAllByText('super-admin').length).toBeGreaterThan(0);
      expect(screen.queryByText('vendors:view')).not.toBeNull();
      expect(screen.queryByText('orders:view')).not.toBeNull();
    });
  });

  it('should select a role and display its checkboxes checked', async () => {
    render(<RoleSettingsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Agent')).not.toBeNull();
    });

    const agentRoleBtn = screen.getByText('Agent');
    fireEvent.click(agentRoleBtn);

    // After clicking Agent, orders:view (id: 5) should be checked
    await waitFor(() => {
      const ordersCheckbox = screen.getByLabelText('orders:view') as HTMLInputElement;
      expect(ordersCheckbox.checked).toBe(true);

      const vendorsCheckbox = screen.getByLabelText('vendors:view') as HTMLInputElement;
      expect(vendorsCheckbox.checked).toBe(false);
    });
  });

  it('should send PUT request with updated permissions on Save click', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    render(<RoleSettingsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Agent')).not.toBeNull();
    });

    // Select Agent role
    const agentRoleBtn = screen.getByText('Agent');
    fireEvent.click(agentRoleBtn);

    // Toggle vendors:view checkbox
    await waitFor(() => {
      const vendorsCheckbox = screen.getByLabelText('vendors:view') as HTMLInputElement;
      fireEvent.click(vendorsCheckbox);
    });

    // Click save
    const saveBtn = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/settings/roles/5'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            name: 'Agent',
            permissionIds: [5, 2], // 5 was already checked, 2 was toggled on
          }),
        })
      );
    });
  });

  it('should disable super-admin permission checkbox when editing Super Admin (id: 1) role', async () => {
    render(<RoleSettingsPage />);

    await waitFor(() => {
      expect(screen.queryByText('Super Admin')).not.toBeNull();
    });

    // Select Super Admin role
    const superAdminBtn = screen.getByText('Super Admin');
    fireEvent.click(superAdminBtn);

    await waitFor(() => {
      const superAdminCheckbox = screen.getByLabelText('super-admin') as HTMLInputElement;
      expect(superAdminCheckbox.disabled).toBe(true);
    });
  });
});
