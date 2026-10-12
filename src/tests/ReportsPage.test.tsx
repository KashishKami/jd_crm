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
          userPermissions: 'reports:agent-sales,reports:agent-sales-export',
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

  it('shows Access Restricted card, hides Agent Report tab, and skips matrix fetch when user lacks reports:agent-sales', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          uid: 2,
          name: 'Restricted User',
          userPermissions: 'reports:agent-sales-export',
        },
      },
      status: 'authenticated',
    } as any);

    render(<ReportsContainer />);

    expect(screen.getByText('Reports')).toBeDefined();
    expect(screen.getByText('Access Restricted')).toBeDefined();
    expect(
      screen.getByText(/You do not have permission to view this report/i)
    ).toBeDefined();
    // Tab must NOT be shown
    expect(screen.queryByText('Agent Report')).toBeNull();

    // /api/reports/agent-sales should NOT have been fetched
    const fetchCalls = (global.fetch as any).mock.calls;
    const agentSalesFetch = fetchCalls.find((call: any[]) =>
      call[0]?.includes('/api/reports/agent-sales')
    );
    expect(agentSalesFetch).toBeUndefined();
  });

  it('hides Export XLS button when user has reports:agent-sales but lacks reports:agent-sales-export', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          uid: 3,
          name: 'Agent Sales Viewer',
          userPermissions: 'reports:agent-sales',
        },
      },
      status: 'authenticated',
    } as any);

    render(<ReportsContainer />);

    expect(screen.getByText('Agent Report')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Johnny')).toBeDefined();
    });

    // Export button must NOT be present
    expect(screen.queryByRole('button', { name: /export xls/i })).toBeNull();
  });

  it('shows Export XLS button when user has reports:agent-sales-export', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          uid: 1,
          name: 'Super Admin',
          userPermissions: 'reports:agent-sales,reports:agent-sales-export',
        },
      },
      status: 'authenticated',
    } as any);

    render(<ReportsContainer />);

    expect(screen.getByText('Agent Report')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Johnny')).toBeDefined();
    });

    // Export button must be present
    expect(screen.getByRole('button', { name: /export xls/i })).toBeDefined();
  });

  it('restores filterState from sessionStorage on back navigation when not a reload', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { uid: 1, name: 'Admin', userPermissions: 'reports:agent-sales' },
      },
      status: 'authenticated',
    } as any);

    // Seed saved state
    sessionStorage.setItem(
      'REPORT_MATRIX_STATE',
      JSON.stringify({ range: 'yearly', year: 2024, granularity: 'monthly' })
    );

    render(<ReportsContainer />);

    await waitFor(() => {
      const fetchCalls = (global.fetch as any).mock.calls;
      const agentCall = fetchCalls.find((c: any[]) => c[0]?.includes('/api/reports/agent-sales'));
      expect(agentCall).toBeDefined();
      expect(agentCall[0]).toContain('range=yearly');
    });
  });

  it('restores sortBy and sortOrder from sessionStorage on back navigation', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { uid: 1, name: 'Admin', userPermissions: 'reports:agent-sales' },
      },
      status: 'authenticated',
    } as any);

    sessionStorage.setItem(
      'REPORT_MATRIX_STATE',
      JSON.stringify({ range: 'monthly', sortBy: 'sales', sortOrder: 'asc' })
    );

    render(<ReportsContainer />);

    await waitFor(() => {
      const fetchCalls = (global.fetch as any).mock.calls;
      const agentCall = fetchCalls.find((c: any[]) => c[0]?.includes('/api/reports/agent-sales'));
      expect(agentCall).toBeDefined();
      expect(agentCall[0]).toContain('sortBy=sales');
      expect(agentCall[0]).toContain('sortOrder=asc');
    });
  });

  it('scopes teamIds and hides team selector for users with reports:agent-sales-team', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { uid: 25, teamId: 2, name: 'Lead', userPermissions: 'reports:agent-sales-team' },
      },
      status: 'authenticated',
    } as any);

    render(<ReportsContainer />);

    await waitFor(() => {
      const fetchCalls = (global.fetch as any).mock.calls;
      const agentCall = fetchCalls.find((c: any[]) => c[0]?.includes('/api/reports/agent-sales'));
      expect(agentCall).toBeDefined();
      expect(agentCall[0]).toContain('teamId=2');
    });

    // Center dropdown should be hidden for team-scoped user
    expect(screen.queryByText(/Centers Selected/i)).toBeNull();
  });
});
