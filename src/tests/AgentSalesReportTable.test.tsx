// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import AgentSalesReportTable from '../components/reports/AgentSalesReportTable';
import { ReportMatrixResponse } from '../types/report';

const mockMatrixData: ReportMatrixResponse = {
  periods: [
    { key: '2026-01', label: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31' },
    { key: '2026-02', label: 'Feb 2026', startDate: '2026-02-01', endDate: '2026-02-28' },
  ],
  globalStartDate: '2026-01-01',
  globalEndDate: '2026-02-28',
  rangeLabel: 'Jan - Feb 2026',
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
        '2026-02': {
          salesAmount: 20000,
          salesCount: 12,
          refundsAmount: 0,
          refundsCount: 0,
          chargebacksAmount: 500,
          chargebacksCount: 1,
          netSales: 19500,
          netSalesCount: 11,
        },
      },
      grandTotal: {
        salesAmount: 35000,
        salesCount: 22,
        refundsAmount: 1000,
        refundsCount: 1,
        chargebacksAmount: 500,
        chargebacksCount: 1,
        netSales: 33500,
        netSalesCount: 20,
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
      '2026-02': {
        salesAmount: 20000,
        salesCount: 12,
        refundsAmount: 0,
        refundsCount: 0,
        chargebacksAmount: 500,
        chargebacksCount: 1,
        netSales: 19500,
        netSalesCount: 11,
      },
    },
    grandTotal: {
      salesAmount: 35000,
      salesCount: 22,
      refundsAmount: 1000,
      refundsCount: 1,
      chargebacksAmount: 500,
      chargebacksCount: 1,
      netSales: 33500,
      netSalesCount: 20,
    },
  },
};

describe('W-4404: AgentSalesReportTable Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders table with all 4 metrics when metricView is "all"', () => {
    render(
      <AgentSalesReportTable
        matrixData={mockMatrixData}
        metricView="all"
        isLoading={false}
      />
    );

    // Checks header periods
    expect(screen.getByText('Jan 2026')).toBeDefined();
    expect(screen.getByText('Feb 2026')).toBeDefined();

    // Check agent row
    expect(screen.getByText('Johnny')).toBeDefined();
    expect(screen.getByText('(IT Park)')).toBeDefined();

    // Key-value labels
    const salesLabels = screen.getAllByText(/Sales:/i);
    expect(salesLabels.length).toBeGreaterThan(0);
    const refundLabels = screen.getAllByText(/Ref:/i);
    expect(refundLabels.length).toBeGreaterThan(0);
    const cbLabels = screen.getAllByText(/Chb:/i);
    expect(cbLabels.length).toBeGreaterThan(0);
    const netLabels = screen.getAllByText(/Net:/i);
    expect(netLabels.length).toBeGreaterThan(0);
  });

  it('renders collapsed Net Sales columns when metricView is "net"', () => {
    render(
      <AgentSalesReportTable
        matrixData={mockMatrixData}
        metricView="net"
        isLoading={false}
      />
    );

    // Agent info present
    expect(screen.getByText('Johnny')).toBeDefined();

    // Net Sales cells present
    const netCells = screen.getAllByText('$14,000.00');
    expect(netCells.length).toBeGreaterThan(0);
    const netFebCells = screen.getAllByText('$19,500.00');
    expect(netFebCells.length).toBeGreaterThan(0);

    // Gross sales alone should not have separate columns in net view
    expect(screen.queryByText('$15,000.00')).toBeNull();
  });

  it('renders drill-down links to /orders with proper query parameters for Net Sales, Sold, Refunds and Chargebacks', () => {
    render(
      <AgentSalesReportTable
        matrixData={mockMatrixData}
        metricView="all"
        selectedTeamIds={[1]}
        isLoading={false}
      />
    );

    // Net Sales link in Jan 2026: $14,000 (9) -> saleStatus=1,4, agentId=101, teamId=1
    const netLinks = screen.getAllByRole('link', { name: /\$14,000\.00/i });
    const periodNetLink = netLinks.find((l) => l.getAttribute('href')?.includes('dateFrom=2026-01-01'));
    expect(periodNetLink).toBeDefined();
    expect(periodNetLink!.getAttribute('href')).toContain('/orders?agentId=101');
    expect(periodNetLink!.getAttribute('href')).toContain('dateFrom=2026-01-01');
    expect(periodNetLink!.getAttribute('href')).toContain('dateTo=2026-01-31');
    expect(periodNetLink!.getAttribute('href')).toContain('saleStatus=1%2C4');
    expect(periodNetLink!.getAttribute('href')).toContain('teamId=1');

    // Refund link in Jan 2026: $1,000 (1) -> saleStatus=2
    const refundLinks = screen.getAllByRole('link', { name: /\$1,000\.00/i });
    const periodRefundLink = refundLinks.find((l) => l.getAttribute('href')?.includes('dateFrom=2026-01-01'));
    expect(periodRefundLink).toBeDefined();
    expect(periodRefundLink!.getAttribute('href')).toContain('/orders?agentId=101');
    expect(periodRefundLink!.getAttribute('href')).toContain('saleStatus=2');

    // Grand Total link: Net $33,500.00 -> should contain global date range 2026-01-01 to 2026-02-28
    const grandTotalNetLink = screen.getByRole('link', { name: /\$33,500\.00/i });
    expect(grandTotalNetLink).toBeDefined();
    expect(grandTotalNetLink.getAttribute('href')).toContain('agentId=101');
    expect(grandTotalNetLink.getAttribute('href')).toContain('dateFrom=2026-01-01');
    expect(grandTotalNetLink.getAttribute('href')).toContain('dateTo=2026-02-28');
    expect(grandTotalNetLink.getAttribute('href')).toContain('saleStatus=1%2C4');
  });

  it('handles pagination for large agent lists (> 10 agents)', () => {
    const manyAgents = Array.from({ length: 25 }, (_, i) => ({
      agentId: 200 + i,
      agentName: `Agent ${i + 1}`,
      nickname: null,
      teamId: 1,
      teamName: 'IT Park',
      designation: 'Sales Rep',
      status: 1,
      periods: {},
      grandTotal: {
        salesAmount: 1000,
        salesCount: 1,
        refundsAmount: 0,
        refundsCount: 0,
        chargebacksAmount: 0,
        chargebacksCount: 0,
        netSales: 1000,
        netSalesCount: 1,
      },
    }));

    render(
      <AgentSalesReportTable
        matrixData={{
          ...mockMatrixData,
          agents: manyAgents,
        }}
        metricView="all"
        isLoading={false}
      />
    );

    // Page 1 should show Agent 1, but not Agent 15
    expect(screen.getByText('Agent 1')).toBeDefined();
    expect(screen.queryByText('Agent 15')).toBeNull();

    // Pagination controls rendered
    expect(screen.getByRole('button', { name: /page 2/i })).toBeDefined();
  });
});
