// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

// We mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

// We mock custom fetch because TeamMonthlyScoresWidget performs fetch
const globalFetch = global.fetch;

import { useSession } from 'next-auth/react';
import DashboardPage from '../app/dashboard_client_page'; // We can write a client wrapper or test page that is easy to render.

describe('Dashboard Component Unit Tests', () => {
  const mockMetrics = {
    totalSales: { amount: 30000, count: 150 },
    totalSalesThisMonth: { amount: 9000, count: 45 },
    todaySales: { amount: 1000, count: 5 },
    chargebackThisMonth: { amount: 400, count: 2 },
    refundThisMonth: { amount: 200, count: 1 },
    netSales: { amount: 12000, count: 147 },
    topPerformers: [
      { agentName: 'Alice', amount: 8000 },
      { agentName: 'Bob', amount: 6000 },
    ],
    bottomPerformers: [
      { agentName: 'Charlie', amount: 1000 },
    ],
    recentOrders: [
      { crmOrderId: 1, customerName: 'John Doe', salesAgentName: 'Alice', saleStatus: '1', orderAmountCharged: '500', orderDate: '2026-06-20' },
    ],
    attendanceSummary: {
      present: 10,
      absent: 2,
      lwop: 1,
      halfDay: 1,
    },
    pendingCounts: {
      'Pending Booking': { amount: 1000, count: 5 },
      'Pending Shipment': { amount: 2000, count: 8 },
      'Pending Delivery': { amount: 3000, count: 12 },
      'Pending Feedback': { amount: 800, count: 4 },
      'Pending Resolutions': { amount: 400, count: 2 },
    },
  };

  const mockTeamReport = [
    {
      teamId: 1,
      teamName: 'IT Park',
      soldCount: 15,
      refundCount: 1,
      chargebackCount: 0,
      netAmount: 3200,
      month: 7,
      year: 2026,
      topPerformers: [{ agentId: 101, agentName: 'Alice', amount: 2000 }],
      bottomPerformers: [{ agentId: 102, agentName: 'Dave', amount: 500 }],
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTeamReport,
    });
  });

  afterEach(() => {
    cleanup();
    global.fetch = globalFetch;
  });

  it('should render ThisYearSalesWidget when user has permission', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: 'Admin', userPermissions: 'dashboard:total-sales' },
      },
      status: 'authenticated',
    } as any);

    render(
      <DashboardPage
        initialMetrics={{ thisYearSales: { amount: 30000, count: 150, lastAmount: 20000, lastCount: 100, percentageChange: 50 } }}
        userPermissions="dashboard:total-sales"
        userName="Admin"
      />
    );
    expect(screen.getByText('This Year Sales')).toBeDefined();
    expect(screen.getByText('30,000')).toBeDefined();
    expect(screen.getByText('(150 Sales)')).toBeDefined();
  });

  it('should NOT render ThisYearSalesWidget when user lacks permission', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: 'Agent', userPermissions: 'vendors:view' },
      },
      status: 'authenticated',
    } as any);

    render(
      <DashboardPage
        initialMetrics={{}}
        userPermissions="vendors:view"
        userName="Agent"
      />
    );
    expect(screen.queryByText('This Year Sales')).toBeNull();
  });

  it('should render TopPerformersTable with ranks', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: 'Admin', userPermissions: 'dashboard:top-performer' },
      },
      status: 'authenticated',
    } as any);

    render(
      <DashboardPage
        initialMetrics={{ topPerformers: mockMetrics.topPerformers }}
        userPermissions="dashboard:top-performer"
        userName="Admin"
      />
    );
    expect(screen.getByText('Top Performers')).toBeDefined();
    expect(screen.getByText('Alice')).toBeDefined();
    expect(screen.getByText('$8,000.00')).toBeDefined();
    expect(screen.getByText('Bob')).toBeDefined();
    expect(screen.getByText('$6,000.00')).toBeDefined();
  });

  it('should render PendingCountsRow with status labels', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: 'Admin', userPermissions: 'dashboard:pending-counts' },
      },
      status: 'authenticated',
    } as any);

    render(
      <DashboardPage
        initialMetrics={{ pendingCounts: mockMetrics.pendingCounts }}
        userPermissions="dashboard:pending-counts"
        userName="Admin"
      />
    );
    expect(screen.getByText('Pending Booking')).toBeDefined();
    expect(screen.getByText('1,000')).toBeDefined();
    expect(screen.getByText('(5 Sales)')).toBeDefined();
    expect(screen.getByText('Pending Shipment')).toBeDefined();
    expect(screen.getByText('2,000')).toBeDefined();
    expect(screen.getByText('(8 Sales)')).toBeDefined();
  });

  it('should render TeamMonthlyScoresWidget with top and bottom performers when permitted', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin',
          userPermissions: 'dashboard:team-monthly-scores,dashboard:team-top-performer,dashboard:team-bottom-performer',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    render(
      <DashboardPage
        initialMetrics={{}}
        userPermissions="dashboard:team-monthly-scores,dashboard:team-top-performer,dashboard:team-bottom-performer"
        userName="Admin"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Team Monthly Scores')).toBeDefined();
      expect(screen.getByText('IT Park')).toBeDefined();
      expect(screen.getByText('15 Sales')).toBeDefined();
      expect(screen.getByText('1. Alice')).toBeDefined();
      expect(screen.getByText('$2,000')).toBeDefined();
      expect(screen.getByText('1. Dave')).toBeDefined();
      expect(screen.getByText('$500')).toBeDefined();
    });
  });

  it('should render TeamMonthlyScoresWidget with negative bottom performer scores formatted correctly', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin',
          userPermissions: 'dashboard:team-monthly-scores,dashboard:team-top-performer,dashboard:team-bottom-performer',
        },
      },
      status: 'authenticated',
    } as any);

    const mockReportWithNegative = [
      {
        teamId: 1,
        teamName: 'IT Park',
        soldCount: 15,
        refundCount: 1,
        chargebackCount: 0,
        netAmount: 3200,
        month: 7,
        year: 2026,
        topPerformers: [{ agentId: 101, agentName: 'Alice', amount: 2000 }],
        bottomPerformers: [{ agentId: 102, agentName: 'Dave', amount: -50 }],
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReportWithNegative,
    });

    render(
      <DashboardPage
        initialMetrics={{}}
        userPermissions="dashboard:team-monthly-scores,dashboard:team-top-performer,dashboard:team-bottom-performer"
        userName="Admin"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('1. Dave')).toBeDefined();
      expect(screen.getByText('-$50')).toBeDefined();
    });
  });

  it('should NOT render top or bottom performer in team card if permissions are missing', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Agent',
          userPermissions: 'dashboard:team-monthly-scores', // lacks top/bottom performer permission
        },
      },
      status: 'authenticated',
    } as any);

    // Mock response to strip top/bottom performers if service logic is simulated
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          teamId: 1,
          teamName: 'IT Park',
          soldCount: 15,
          refundCount: 1,
          chargebackCount: 0,
          netAmount: 3200,
        },
      ],
    });

    render(
      <DashboardPage
        initialMetrics={{}}
        userPermissions="dashboard:team-monthly-scores"
        userName="Agent"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('IT Park')).toBeDefined();
      expect(screen.queryByText(/Top Performer:/)).toBeNull();
      expect(screen.queryByText(/Bottom Performer:/)).toBeNull();
    });
  });

  it('should navigate months on click and fetch new monthly data', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin',
          userPermissions: 'dashboard:team-monthly-scores',
        },
      },
      status: 'authenticated',
    } as any);

    render(
      <DashboardPage
        initialMetrics={{}}
        userPermissions="dashboard:team-monthly-scores"
        userName="Admin"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Team Monthly Scores')).toBeDefined();
    });

    const prevButton = screen.getByRole('button', { name: /previous month/i });
    fireEvent.click(prevButton);

    expect(global.fetch).toHaveBeenCalled();
  });

  describe('W-1703: Dashboard UI Phase 17 tests', () => {
    it('[RED] should render Returned Orders in PendingCountsRow and finalMargin in RecentOrdersTable', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: { name: 'Admin', userPermissions: 'dashboard:pending-counts,dashboard:recent-orders,dashboard:refund,dashboard:chargeback' },
        },
        status: 'authenticated',
      } as any);

      const metricsWithRefunds = {
        pendingCounts: {
          ...mockMetrics.pendingCounts,
          'Returned Orders': { amount: 1500, count: 5 },
        },
        refundThisMonth: { amount: 200, count: 1 },
        chargebackThisMonth: { amount: 400, count: 2 },
        recentOrders: [
          { 
            crmOrderId: 101, 
            customerName: 'Refund Customer', 
            salesAgentName: 'Bob Agent', 
            saleStatus: '4', 
            orderAmountCharged: '500', 
            orderRefundAmount: '150', // finalMargin = 350
            orderDate: '2026-06-20' 
          }
        ]
      };

      render(
        <DashboardPage
          initialMetrics={metricsWithRefunds as any}
          userPermissions="dashboard:pending-counts,dashboard:recent-orders,dashboard:refund,dashboard:chargeback"
          userName="Admin"
        />
      );

      // Check Returned Orders shows up in PendingCountsRow
      expect(screen.getByText('Returned Orders')).toBeDefined();
      expect(screen.getByText('1,500')).toBeDefined();

      // Check RecentOrdersTable renders finalMargin $350.00 instead of raw markup $500
      expect(screen.queryByText('$500')).toBeNull();
      expect(screen.getByText(/Final Margin: \$350\.00/)).toBeDefined();

      // Check Refunds and Chargebacks card links point to /pending/returned
      const refundsLink = screen.getByText('Refunds This Month').closest('a');
      expect(refundsLink?.getAttribute('href')).toContain('/pending/returned');
      expect(refundsLink?.getAttribute('href')).toContain('saleStatus=2');

      const chargebacksLink = screen.getByText('Chargebacks This Month').closest('a');
      expect(chargebacksLink?.getAttribute('href')).toContain('/pending/returned');
      expect(chargebacksLink?.getAttribute('href')).toContain('saleStatus=3');
    });
  });

  describe('W-1801: ChampionsLeagueWidget navigation tests', () => {
    it('should navigate months in ChampionsLeagueWidget and fetch new monthly data', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            name: 'Admin',
            userPermissions: 'dashboard:top-performer,dashboard:bottom-performer',
          },
        },
        status: 'authenticated',
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          topPerformers: [{ agentId: 101, agentName: 'Alice', amount: 3000 }],
          bottomPerformers: [{ agentId: 102, agentName: 'Dave', amount: 100 }],
        }),
      });

      render(
        <DashboardPage
          initialMetrics={{
            topPerformers: [{ agentId: 101, agentName: 'Alice', amount: 2000 }],
            bottomPerformers: [{ agentId: 102, agentName: 'Dave', amount: 500 }],
          }}
          userPermissions="dashboard:top-performer,dashboard:bottom-performer"
          userName="Admin"
        />
      );

      // Initial values should be defined
      await waitFor(() => {
        expect(screen.getByText('Champions League')).toBeDefined();
        expect(screen.getByText('Alice')).toBeDefined();
        expect(screen.getByText('$2,000.00')).toBeDefined();
      });

      // Find and click previous month button to trigger fetch
      const prevButton = screen.getByRole('button', { name: /previous month/i });
      fireEvent.click(prevButton);

      // Should fetch new data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(screen.getByText('$3,000.00')).toBeDefined();
      });
    });
  });
});
