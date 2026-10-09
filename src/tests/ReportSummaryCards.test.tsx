// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ReportSummaryCards from '../components/reports/ReportSummaryCards';
import { OrgTotalSummary } from '../types/report';

const mockOrgTotal: OrgTotalSummary = {
  periods: {},
  grandTotal: {
    salesAmount: 50000,
    salesCount: 30,
    refundsAmount: 5000,
    refundsCount: 3,
    chargebacksAmount: 1000,
    chargebacksCount: 1,
    netSales: 44000,
    netSalesCount: 26,
  },
};

describe('ReportSummaryCards Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders 4 distinct aggregate cards with proper amounts, counts, and labels', () => {
    render(
      <ReportSummaryCards
        orgTotal={mockOrgTotal}
        globalStartDate="2026-01-01"
        globalEndDate="2026-12-31"
        rangeLabel="Monthly (2026)"
        teamIds={[1]}
      />
    );

    // Card titles
    expect(screen.getByText(/Total Sales/i)).toBeDefined();
    expect(screen.getByText(/Total Refunds/i)).toBeDefined();
    expect(screen.getByText(/Total Chargebacks/i)).toBeDefined();
    expect(screen.getByText(/Net Sales/i)).toBeDefined();

    // Formatted amounts
    expect(screen.getByText('$50,000.00')).toBeDefined();
    expect(screen.getByText('$5,000.00')).toBeDefined();
    expect(screen.getByText('$1,000.00')).toBeDefined();
    expect(screen.getByText('$44,000.00')).toBeDefined();

    // Counts
    expect(screen.getByText('(30 Orders)')).toBeDefined();
    expect(screen.getByText('(3 Refunds)')).toBeDefined();
    expect(screen.getByText('(1 Chargeback)')).toBeDefined();
    expect(screen.getByText('(26 Orders)')).toBeDefined();
  });

  it('renders drill-down links on each card passing global date range, teamId, and correct sale status', () => {
    render(
      <ReportSummaryCards
        orgTotal={mockOrgTotal}
        globalStartDate="2026-03-01"
        globalEndDate="2026-03-31"
        rangeLabel="March 2026"
        teamIds={[1, 2]}
      />
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(4);

    // Net Sales card link: saleStatus=1,4, dateFrom=2026-03-01, dateTo=2026-03-31, teamId=1,2
    const netLink = links.find((l) => l.getAttribute('href')?.includes('saleStatus=1%2C4'));
    expect(netLink).toBeDefined();
    expect(netLink!.getAttribute('href')).toContain('dateFrom=2026-03-01');
    expect(netLink!.getAttribute('href')).toContain('dateTo=2026-03-31');
    expect(netLink!.getAttribute('href')).toContain('teamId=1%2C2');

    // Refund card link: saleStatus=2
    const refundLink = links.find((l) => l.getAttribute('href')?.includes('saleStatus=2'));
    expect(refundLink).toBeDefined();
    expect(refundLink!.getAttribute('href')).toContain('dateFrom=2026-03-01');

    // Chargeback card link: saleStatus=3
    const cbLink = links.find((l) => l.getAttribute('href')?.includes('saleStatus=3'));
    expect(cbLink).toBeDefined();
  });
});
