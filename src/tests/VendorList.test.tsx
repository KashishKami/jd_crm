// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import VendorList from '../components/VendorList';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('VendorList Component Unit Tests', () => {
  const mockVendors = [
    {
      vendorId: 20,
      vendorName: 'Active Supplier',
      vendorPhone: '111-222-3333',
      vendorEmail: 'active@supplier.com',
      vendorContactPerson: 'John Active',
      vendorStatus: 1,
      totalOrders: 5,
      positiveOrders: 4,
      negativeOrders: 1,
    },
    {
      vendorId: 21,
      vendorName: 'Blacklisted Supplier',
      vendorPhone: '444-555-6666',
      vendorEmail: 'blacklisted@supplier.com',
      vendorContactPerson: 'Jane Blocked',
      vendorStatus: 0, // blacklisted
      totalOrders: 10,
      positiveOrders: 3,
      negativeOrders: 7,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    window.confirm = vi.fn().mockReturnValue(true);
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockVendors),
      } as Response)
    );
  });

  it('should render table rows and columns correctly', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'vendors:view',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<VendorList />);

    await waitFor(() => {
      expect(screen.queryByText('Active Supplier')).not.toBeNull();
      expect(screen.queryByText('Blacklisted Supplier')).not.toBeNull();
      expect(screen.queryByText('111-222-3333')).not.toBeNull();
      expect(screen.queryByText('444-555-6666')).not.toBeNull();
      expect(screen.queryByText('John Active')).not.toBeNull();
      expect(screen.queryByText('Jane Blocked')).not.toBeNull();
    });
  });

  it('should render blacklisted vendor with a red Blacklisted badge', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'vendors:view',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<VendorList />);

    await waitFor(() => {
      const activeBadge = screen.queryByText('Active');
      const blacklistedBadge = screen.queryByText('Blacklisted');
      expect(activeBadge).not.toBeNull();
      expect(blacklistedBadge).not.toBeNull();
    });
  });

  it('should call fetch to blacklist a vendor when clicking Blacklist button', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'vendors:view,vendors:edit',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const fetchSpy = vi.spyOn(global, 'fetch');

    render(<VendorList />);

    let blacklistBtns: HTMLElement[] = [];
    await waitFor(() => {
      blacklistBtns = screen.queryAllByRole('button', { name: /^blacklist$/i });
      expect(blacklistBtns.length).toBeGreaterThan(0);
    });

    fireEvent.click(blacklistBtns[0]); // First button is for vendorId 20

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/vendors/20/status'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 0 }),
        })
      );
    });
  });

  it('should call fetch to restore a blacklisted vendor when clicking Restore button', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'vendors:view,vendors:edit',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const fetchSpy = vi.spyOn(global, 'fetch');

    render(<VendorList />);

    let restoreBtns: HTMLElement[] = [];
    await waitFor(() => {
      restoreBtns = screen.queryAllByRole('button', { name: /restore/i });
      expect(restoreBtns.length).toBeGreaterThan(0);
    });

    fireEvent.click(restoreBtns[0]); // First restore button is for vendorId 21

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/vendors/21/status'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 1 }),
        })
      );
    });
  });
});
