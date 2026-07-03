// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import OrderList from '../components/OrderList';

afterEach(() => {
  cleanup();
});

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
        orderAmountCharged: '1000',
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

  it('[RED] should display finalMargin instead of raw orderMarkup when orderRefundAmount is set', () => {
    const mockOrders = [
      {
        crmOrderId: 46,
        orderDate: '2026-06-30',
        orderMakeModel: '2026 Honda Civic',
        orderPart: 'Bumper',
        orderTotalPitched: '1000',
        orderVendorPrice: '600',
        orderAmountCharged: '400',
        orderRefundAmount: '150', // finalMargin = 250
        orderCurrentStatus: 'Pending Booking',
        customer: {
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
        },
      },
      {
        crmOrderId: 47,
        orderDate: '2026-06-30',
        orderMakeModel: '2026 Nissan Altima',
        orderPart: 'Hood',
        orderTotalPitched: '800',
        orderVendorPrice: '500',
        orderAmountCharged: '300',
        orderRefundAmount: null, // finalMargin = 300
        orderCurrentStatus: 'Pending Booking',
        customer: {
          customerName: 'Jim Green',
          customerEmail: 'jim@example.com',
        },
      }
    ];

    render(<OrderList orders={mockOrders as any} />);

    // Order #46 has amount charged 400 and refund 150 -> finalMargin = $250
    expect(screen.getByText(/Charged: \$400\.00/)).toBeDefined(); 
    expect(screen.getByText(/Final Margin: \$250\.00/)).toBeDefined(); 

    // Order #47 has amount charged 300 and refund null -> finalMargin = $300
    expect(screen.getByText(/Charged: \$300\.00/)).toBeDefined();
    expect(screen.getByText(/Final Margin: \$300\.00/)).toBeDefined();
  });

  describe('W-2203: Sale Status Column and Label Rendering', () => {
    const baseMockOrder = {
      crmOrderId: 48,
      orderDate: '2026-06-30',
      orderMakeModel: '2026 Ford Bronco',
      orderPart: 'Engine',
      orderTotalPitched: '4000',
      orderVendorPrice: '3000',
      orderAmountCharged: '1000',
      orderCurrentStatus: 'Pending Booking',
      customer: {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
      },
    };

    it('[RED] should replace Team column header with Sale Status column header', () => {
      render(<OrderList orders={[{ ...baseMockOrder, saleStatus: '1' }] as any} />);
      expect(screen.queryByText('Team')).toBeNull();
      expect(screen.getByText('Sale Status')).toBeDefined();
    });

    it('[RED] should correctly map and render Sale Status labels', () => {
      const mockOrders = [
        { ...baseMockOrder, crmOrderId: 101, saleStatus: '1' },
        { ...baseMockOrder, crmOrderId: 102, saleStatus: '2' },
        { ...baseMockOrder, crmOrderId: 103, saleStatus: '3' },
        { ...baseMockOrder, crmOrderId: 104, saleStatus: '4' },
        { ...baseMockOrder, crmOrderId: 105, saleStatus: '5' },
        { ...baseMockOrder, crmOrderId: 106, saleStatus: '6' },
        { ...baseMockOrder, crmOrderId: 107, saleStatus: null },
      ];

      render(<OrderList orders={mockOrders as any} />);

      expect(screen.getByText('Sold')).toBeDefined();
      expect(screen.getByText('Refunded')).toBeDefined();
      expect(screen.getByText('Chargebacked')).toBeDefined();
      expect(screen.getByText('Partial Refund')).toBeDefined();
      expect(screen.getByText('Void')).toBeDefined();
      expect(screen.getByText('Cancelled')).toBeDefined();
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
  });

  describe('W-1902: Alias Name Visible Everywhere, Real Name Only on Profile', () => {
    it('should display the agent/verifier/executive nickname/alias instead of their real name in the list', () => {
      const mockOrders = [
        {
          crmOrderId: 49,
          orderDate: '2026-06-30',
          orderMakeModel: '2026 Toyota Camry',
          orderPart: 'Alternator',
          orderTotalPitched: '500',
          orderVendorPrice: '300',
          orderAmountCharged: '200',
          orderCurrentStatus: 'Pending Booking',
          customer: {
            customerName: 'Alice Green',
            customerEmail: 'alice.g@example.com',
          },
          salesAgent: {
            name: 'John RealAgent',
            nickname: 'AgentAlias',
          },
          salesVerifier: {
            name: 'Bob RealVerifier',
            nickname: 'VerifierAlias',
          },
          backendExecutive: {
            name: 'Carol RealExecutive',
            nickname: 'ExecutiveAlias',
          },
          verifier: {
            name: 'Dave RealQA',
            nickname: 'QAAlias',
          },
        },
      ];

      render(<OrderList orders={mockOrders as any} />);

      const row = screen.getByRole('row', { name: /#49/i });
      const text = row.textContent || '';

      // Verify that aliases are present
      expect(text).toContain('AgentAlias');
      expect(text).toContain('VerifierAlias');
      expect(text).toContain('ExecutiveAlias');
      expect(text).toContain('QAAlias');

      // Verify that real names are NOT present in the row
      expect(text).not.toContain('John RealAgent');
      expect(text).not.toContain('Bob RealVerifier');
      expect(text).not.toContain('Carol RealExecutive');
      expect(text).not.toContain('Dave RealQA');
    });
  });
});
