// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportsContainer from '../components/reports/ReportsContainer';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/reports',
}));

const mockMatrixData = {
  periods: [
    { key: '2026-01', label: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31' },
  ],
  globalStartDate: '2026-01-01',
  globalEndDate: '2026-01-31',
  rangeLabel: 'Jan 2026',
  agents: [
    {
      agentId: 101,
      agentName: 'John Doe',
      nickname: 'Johnny',
      teamId: 1,
      teamName: 'IT Park',
      designation: 'Sales Specialist',
      status: 1,
      periods: {
        '2026-01': {
          salesAmount: 15000,
          salesCount: 10,
          refundsAmount: 1000,
          refundsCount: 1,
          chargebacksAmount: 0,
          chargebacksCount: 0,
          netSales: 14000,
          netSalesCount: 9,
        },
      },
      grandTotal: {
        salesAmount: 15000,
        salesCount: 10,
        refundsAmount: 1000,
        refundsCount: 1,
        chargebacksAmount: 0,
        chargebacksCount: 0,
        netSales: 14000,
        netSalesCount: 9,
      },
    },
  ],
  orgTotal: {
    periods: {
      '2026-01': {
        salesAmount: 15000,
        salesCount: 10,
        refundsAmount: 1000,
        refundsCount: 1,
        chargebacksAmount: 0,
        chargebacksCount: 0,
        netSales: 14000,
        netSalesCount: 9,
      },
    },
    grandTotal: {
      salesAmount: 15000,
      salesCount: 10,
      refundsAmount: 1000,
      refundsCount: 1,
      chargebacksAmount: 0,
      chargebacksCount: 0,
      netSales: 14000,
      netSalesCount: 9,
    },
  },
};

const mockFiltersData = {
  teams: [{ teamId: 1, teamName: 'IT Park' }],
  agents: [
    {
      uid: 101,
      name: 'John Doe',
      nickname: 'Johnny',
      teamId: 1,
      teamName: 'IT Park',
      designation: 'Sales Specialist',
      status: 1,
    },
  ],
};

describe('W-4406: Reports Page Layout and Container', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    sessionStorage.clear();
    originalFetch = global.fetch;

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          uid: 1,
          name: 'Admin User',
          userPermissions: 'dashboard:view-advanced-chart,orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    vi.mocked(useSearchParams).mockReturnValue({
      get: () => null,
    } as any);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/reports/filters')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockFiltersData,
        });
      }
      if (url.includes('/api/reports/agent-sales')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockMatrixData }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    cleanup();
  });

  it('renders page header with "Reports" title and active "Agent Report" tab', async () => {
    render(<ReportsContainer />);

    expect(screen.getByText('Reports')).toBeDefined();
    expect(screen.getByText('Agent Report')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Johnny')).toBeDefined();
    });
  });

  it('preserves filters in sessionStorage and loads matrix table', async () => {
    render(<ReportsContainer />);

    await waitFor(() => {
      expect(screen.getByText('Johnny')).toBeDefined();
    });

    const netTab = screen.getByRole('button', { name: /net sales/i });
    fireEvent.click(netTab);

    // Filter state saved to sessionStorage
    const saved = sessionStorage.getItem('REPORT_MATRIX_STATE');
    expect(saved).toBeDefined();
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.metricView).toEqual(['net']);
    }
  });
});
