// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import OrderList from '../components/OrderList';

describe('OrderList W-1601 Unit Tests', () => {
  it('should render all four roles in sequence: Sales Rep/Agent -> Sales Verifier -> Backend Executive -> QA Verifier', () => {
    const mockOrders = [
      {
        crmOrderId: 45,
        orderDate: '2026-06-30',
        orderMakeModel: '2026 Ford Bronco',
        orderPart: 'Engine',
        orderTotalPitched: '4000',
        orderVendorPrice: '3000',
        orderMarkup: '1000',
        orderCurrentStatus: 'Pending Booking',
        customer: {
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
        },
        salesAgent: {
          name: 'Alice Agent',
          nickname: 'Alice',
          team: {
            teamId: 1,
            teamName: 'Alpha Team',
          },
        },
        salesVerifier: {
          name: 'Bob Verifier',
          nickname: 'Bob',
        },
        backendExecutive: {
          name: 'Carol Executive',
          nickname: 'Carol',
        },
        verifier: {
          name: 'Dave QA',
          nickname: 'Dave',
        },
      },
    ];

    render(<OrderList orders={mockOrders as any} />);

    const row = screen.getByRole('row', { name: /#45/i });
    const text = row.textContent || '';

    const aliceIndex = text.indexOf('Alice');
    const bobIndex = text.indexOf('Bob');
    const carolIndex = text.indexOf('Carol');
    const daveIndex = text.indexOf('Dave');

    expect(aliceIndex).not.toBe(-1);
    expect(bobIndex).not.toBe(-1);
    expect(carolIndex).not.toBe(-1);
    expect(daveIndex).not.toBe(-1);

    expect(aliceIndex).toBeLessThan(bobIndex);
    expect(bobIndex).toBeLessThan(carolIndex);
    expect(carolIndex).toBeLessThan(daveIndex);
  });
});
