// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import FinancialBreakdownCard from '../components/FinancialBreakdownCard';

afterEach(() => {
  cleanup();
});

describe('FinancialBreakdownCard Unit Tests', () => {
  it('W-3206: should display CAD note when orderCurrency is CAD', () => {
    render(
      <FinancialBreakdownCard
        sellingPrice={370}
        buyingPrice={222}
        netMargin={148}
        chargedAmount={370}
        refundAmount={0}
        balanceDue={0}
        finalMargin={370}
        vendorBreakdown={[]}
        orderCurrency="CAD"
        orderExchangeRate="0.74"
      />
    );

    expect(
      screen.getByText(/Originally entered in CAD at rate 0\.74 — All amounts below are in USD\./i)
    ).toBeDefined();
  });

  it('W-3206: should not display CAD note when orderCurrency is USD', () => {
    render(
      <FinancialBreakdownCard
        sellingPrice={500}
        buyingPrice={300}
        netMargin={200}
        chargedAmount={500}
        refundAmount={0}
        balanceDue={0}
        finalMargin={500}
        vendorBreakdown={[]}
        orderCurrency="USD"
        orderExchangeRate="1"
      />
    );

    expect(
      screen.queryByText(/Originally entered in CAD at rate/i)
    ).toBeNull();
  });
});
