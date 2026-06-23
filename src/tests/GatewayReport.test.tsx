// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import GatewayReport from '../components/GatewayReport';

afterEach(() => {
  cleanup();
});

const mockMonthly = [
  {
    month: 6,
    year: 2026,
    completedCount: 5,
    completedAmount: 500,
    refundCount: 1,
    refundAmount: 80,
    chargebackCount: 2,
    chargebackAmount: 140,
    netAmount: 280, // 500 - 80 - 140
  },
  {
    month: 5,
    year: 2026,
    completedCount: 3,
    completedAmount: 300,
    refundCount: 0,
    refundAmount: 0,
    chargebackCount: 1,
    chargebackAmount: 75,
    netAmount: 225, // 300 - 0 - 75
  },
];

describe('GatewayReport Component Unit Tests', () => {
  it('should render one table row per month with correct counts and amounts', () => {
    render(<GatewayReport monthly={mockMonthly} />);

    // June 2026 row
    expect(screen.queryByText('Jun 2026')).not.toBeNull();
    expect(screen.queryByText('5')).not.toBeNull(); // completedCount
    expect(screen.queryByText('1')).not.toBeNull(); // refundCount

    // May 2026 row
    expect(screen.queryByText('May 2026')).not.toBeNull();
    expect(screen.queryByText('3')).not.toBeNull(); // completedCount
  });

  it('should highlight net amount in red when negative (chargebacks > completed)', () => {
    const negativeMonthly = [
      {
        month: 4,
        year: 2026,
        completedCount: 1,
        completedAmount: 50,
        refundCount: 0,
        refundAmount: 0,
        chargebackCount: 1,
        chargebackAmount: 200,
        netAmount: -150,
      },
    ];
    render(<GatewayReport monthly={negativeMonthly} />);

    // The net amount cell should exist and show negative value
    const netCells = screen.queryAllByText('-$150.00');
    expect(netCells.length).toBeGreaterThan(0);

    // The element should have a red color style
    const netCell = netCells[0];
    const style = window.getComputedStyle(netCell);
    // Check via class or inline style — the component uses inline red color for negatives
    expect(netCell.className).toMatch(/negative|red/i);
  });

  it('should show "No report data" message when monthly array is empty', () => {
    render(<GatewayReport monthly={[]} />);
    expect(screen.queryByText(/no report data/i)).not.toBeNull();
  });
});
