// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import VendorDetailPage from '../app/vendors/[id]/page';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe('VendorDetailPage Unit Tests', () => {
  const mockVendor = {
    vendorId: 20,
    vendorName: 'Active Supplier',
    vendorPhone: '111-222-3333',
    vendorEmail: 'active@supplier.com',
    vendorContactPerson: 'John Active',
    vendorStatus: 1,
  };

  const mockOrders = [
    {
      crmOrderId: 101,
      orderCustomerId: 1,
      orderCreatedDate: '2026-06-15T12:00:00Z',
      orderDate: '2026-06-15T12:00:00Z',
      customer: {
        customerName: 'Customer A',
        customerPhone: '123-456-7890',
      },
      orderAmountCharged: '100.00',
      orderSalesAgentName: 'Agent A',
      saleStatus: '1',
      orderVendorFeedback: 'Positive',
    },
    {
      crmOrderId: 102,
      orderCustomerId: 2,
      orderCreatedDate: '2026-06-16T12:00:00Z',
      orderDate: '2026-06-16T12:00:00Z',
      customer: {
        customerName: 'Customer B',
        customerPhone: '987-654-3210',
      },
      orderAmountCharged: '200.00',
      orderSalesAgentName: 'Agent B',
      saleStatus: '1',
      orderVendorFeedback: 'Negative',
    },
  ];

  const mockHistory = [
    {
      year: 2026,
      month: 6,
      totalOrders: 2,
      positiveOrders: 1,
      negativeOrders: 1,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useParams).mockReturnValue({ id: '20' });
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'vendors:view',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/vendors/20')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVendor),
        } as Response);
      }
      if (url.endsWith('/api/vendors/20/orders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOrders),
        } as Response);
      }
      if (url.endsWith('/api/vendors/20/performance-history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHistory),
        } as Response);
      }
      return Promise.resolve({ ok: false } as Response);
    });
  });

  it('should render vendor details, clickable metrics cards, and performance history chart', async () => {
    render(<VendorDetailPage />);

    // Wait for the vendor data to load
    await waitFor(() => {
      expect(screen.queryAllByText('Active Supplier').length).toBeGreaterThan(0);
    });

    // Check that counts are displayed
    expect(screen.getAllByText('2').length).toBeGreaterThan(0); // Total managed
    expect(screen.getAllByText('1').length).toBeGreaterThan(0); // Positive

    // Find the specific negative card or text
    const negText = screen.getByText('Negative Orders (-)');
    const negCard = negText.closest('.form-card');
    expect(negCard).not.toBeNull();

    // The chart should be rendered
    const chartTitle = screen.getByText(/Monthly Performance History/i);
    expect(chartTitle).toBeDefined();

    // Clicking "Negative Orders (-)" card should open a modal listing the negative orders
    fireEvent.click(negText);

    // Inside the modal, we expect Customer B to be listed (so 2 copies in DOM) but not Customer A (only 1 copy in DOM)
    await waitFor(() => {
      expect(screen.getByText('Feedback Drilldown: Negative Orders')).toBeDefined();
      expect(screen.getAllByText('Customer B').length).toBe(2);
      expect(screen.getAllByText('Customer A').length).toBe(1);
    });

    // We should be able to close the modal
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Feedback Drilldown: Negative Orders')).toBeNull();
    });
  });

  it('[RED] should apply Georgia font to the sidebar card and word-wrap the details values to prevent overlapping', async () => {
    render(<VendorDetailPage />);

    await waitFor(() => {
      expect(screen.queryAllByText('Active Supplier').length).toBeGreaterThan(0);
    });

    const profileName = screen.getByRole('heading', { name: 'Active Supplier', level: 3 });
    const sidebar = profileName.closest('.profile-sidebar') as HTMLElement;
    expect(sidebar).not.toBeNull();
    expect(sidebar.style.fontFamily).toContain('Georgia');

    // Verify email value wrapper has early wrapping style
    const emailVal = screen.getByText('active@supplier.com');
    expect(emailVal.style.wordBreak).toBe('break-word');
  });
});
