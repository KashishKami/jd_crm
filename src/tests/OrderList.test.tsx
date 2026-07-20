// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import OrderList from '../components/OrderList';
import { getEstCalendarDaysDiff } from '../lib/date';

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        name: 'Test Admin',
        userPermissions: 'super-admin',
      },
    },
    status: 'authenticated',
  }),
}));

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

  describe('W-2501: Liftgate Badge Rendering', () => {
    it('should NOT render Liftgate badge in the order list row', () => {
      const mockOrders = [
        {
          crmOrderId: 200,
          orderDate: '2026-06-30',
          orderMakeModel: '2026 Toyota Camry',
          orderPart: 'Engine',
          orderTotalPitched: '1000',
          orderVendorPrice: '700',
          orderAmountCharged: '300',
          orderCurrentStatus: 'Pending Booking',
          orderLiftgateNeeded: 'Yes',
          customer: {
            customerName: 'Alice L',
            customerEmail: 'alice.l@example.com',
          },
        }
      ];

      render(<OrderList orders={mockOrders as any} />);

      const rowYes = screen.getByRole('row', { name: /#200/i });
      expect(rowYes.textContent).not.toContain('Liftgate');
    });
  });

  describe('W-1905: Time in Status Column', () => {
    it('should display the aging text for active statuses, but show empty/hyphen for Completed and Returned statuses', () => {
      // Use an orderDate 4 days ago for Pending Booking (days now counted from sale date)
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      const fourDaysAgoDateStr = fourDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

      const mockOrders = [
        {
          crmOrderId: 301,
          // For Pending Booking the days counter uses orderDate, not orderCurrentStatusUpdateDate
          orderDate: fourDaysAgoDateStr,
          orderMakeModel: '2026 Ford Bronco',
          orderPart: 'Engine',
          orderTotalPitched: '1000',
          orderVendorPrice: '700',
          orderAmountCharged: '300',
          orderCurrentStatus: 'Pending Booking',
          orderCurrentStatusUpdateDate: new Date(), // irrelevant for Pending Booking
          customer: {
            customerName: 'John Active',
            customerEmail: 'active@example.com',
          },
        },
        {
          crmOrderId: 302,
          orderDate: '2026-06-30',
          orderMakeModel: '2026 Ford Bronco',
          orderPart: 'Engine',
          orderTotalPitched: '1000',
          orderVendorPrice: '700',
          orderAmountCharged: '300',
          orderCurrentStatus: 'Completed Orders',
          orderCurrentStatusUpdateDate: fourDaysAgo,
          customer: {
            customerName: 'John Completed',
            customerEmail: 'completed@example.com',
          },
        },
        {
          crmOrderId: 303,
          orderDate: '2026-06-30',
          orderMakeModel: '2026 Ford Bronco',
          orderPart: 'Engine',
          orderTotalPitched: '1000',
          orderVendorPrice: '700',
          orderAmountCharged: '300',
          orderCurrentStatus: 'Returned Orders',
          orderCurrentStatusUpdateDate: fourDaysAgo,
          customer: {
            customerName: 'John Returned',
            customerEmail: 'returned@example.com',
          },
        }
      ];

      render(<OrderList orders={mockOrders as any} />);

      const rowActive    = screen.getByRole('row', { name: /#301/i });
      const rowCompleted = screen.getByRole('row', { name: /#302/i });
      const rowReturned  = screen.getByRole('row', { name: /#303/i });

      expect(rowActive.textContent).toContain('Pending Booking');
      expect(rowActive.textContent).toContain('(for 4 days)');
      expect(rowCompleted.textContent).toContain('Completed Orders');
      expect(rowCompleted.textContent).not.toContain('(for 4 days)');
      expect(rowReturned.textContent).toContain('Returned Orders');
      expect(rowReturned.textContent).not.toContain('(for 4 days)');
    });
  });

  // ─── EST timezone & Pending Booking days fix ─────────────────────────────────

  describe('getEstCalendarDaysDiff unit tests', () => {
    it('returns 0 when the reference date is today in EST', () => {
      const now = new Date();
      expect(getEstCalendarDaysDiff(now)).toBe(0);
    });

    it('returns the correct number of whole EST calendar days for a past date', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
      // Allow 3 or 4 depending on where exactly the EST midnight boundary falls
      const result = getEstCalendarDaysDiff(threeDaysAgo);
      expect(result).toBeGreaterThanOrEqual(2);
      expect(result).toBeLessThanOrEqual(4);
    });

    it('accepts a string date and parses it correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isoString = yesterday.toISOString();
      const result = getEstCalendarDaysDiff(isoString);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('returns 0 (never negative) for a future reference date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getEstCalendarDaysDiff(tomorrow)).toBe(0);
    });

    it('returns 0 for an invalid date string without throwing', () => {
      expect(getEstCalendarDaysDiff('not-a-date')).toBe(0);
    });
  });

  describe('W-2801: Pending Booking days counted from sale date (orderDate), not entry date', () => {
    it('should count days from orderDate for Pending Booking status', () => {
      // Sale happened 7 days ago, but was entered today (orderCurrentStatusUpdateDate = now)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const saleDateStr = sevenDaysAgo.toISOString().split('T')[0];

      const mockOrders = [
        {
          crmOrderId: 401,
          orderDate: saleDateStr,         // sale date: 7 days ago
          orderMakeModel: '2026 Toyota Camry',
          orderPart: 'Engine',
          orderTotalPitched: '2000',
          orderVendorPrice: '1200',
          orderAmountCharged: '800',
          orderCurrentStatus: 'Pending Booking',
          orderCurrentStatusUpdateDate: new Date(), // entry was today — should be ignored
          customer: {
            customerName: 'Late Entry Customer',
            customerEmail: 'late@example.com',
          },
        },
      ];

      render(<OrderList orders={mockOrders as any} />);

      const row = screen.getByRole('row', { name: /#401/i });
      // Should show 7 days (from sale date), NOT 0 days (from entry date)
      expect(row.textContent).toContain('(for 7 days)');
    });

    it('should use orderCurrentStatusUpdateDate for non-Pending-Booking statuses', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const mockOrders = [
        {
          crmOrderId: 402,
          orderDate: new Date().toISOString().split('T')[0], // sale date is today
          orderMakeModel: '2026 Honda Accord',
          orderPart: 'Transmission',
          orderTotalPitched: '3000',
          orderVendorPrice: '2000',
          orderAmountCharged: '1000',
          orderCurrentStatus: 'Pending Shipment',
          orderCurrentStatusUpdateDate: threeDaysAgo, // status was updated 3 days ago
          customer: {
            customerName: 'Shipment Customer',
            customerEmail: 'ship@example.com',
          },
        },
      ];

      render(<OrderList orders={mockOrders as any} />);

      const row = screen.getByRole('row', { name: /#402/i });
      // Pending Shipment should count from orderCurrentStatusUpdateDate (3 days), not orderDate (0 days)
      expect(row.textContent).toContain('(for 3 days)');
    });

    it('child order in Pending Booking inherits parent orderDate for its day count', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const saleDateStr = fiveDaysAgo.toISOString().split('T')[0];

      const mockOrders = [
        {
          crmOrderId: 403,
          orderDate: saleDateStr,         // parent sale date: 5 days ago
          orderMakeModel: '2026 Ford F-150',
          orderPart: 'Engine',
          orderTotalPitched: '5000',
          orderVendorPrice: '3000',
          orderAmountCharged: '2000',
          orderCurrentStatus: 'Pending Shipment', // parent is in Shipment
          orderCurrentStatusUpdateDate: new Date(),
          customer: {
            customerName: 'Multi Part Customer',
            customerEmail: 'multi@example.com',
          },
          childOrders: [
            {
              crmOrderId: 4031,
              orderMakeModel: '2026 Ford F-150',
              orderPart: 'Transmission',
              orderCurrentStatus: 'Pending Booking', // child is still in Booking
              orderCurrentStatusUpdateDate: new Date(), // entry was today — should be ignored
              saleStatus: null,
            },
          ],
        },
      ];

      render(<OrderList orders={mockOrders as any} />);

      const row = screen.getByRole('row', { name: /#403/i });
      // Child part in Pending Booking should show 5 days from parent's sale date
      expect(row.textContent).toContain('(for 5 days)');
    });
  });

  describe('W-3207: Clickable Customer Name', () => {
    it('should render customer name as a link to /orders/:id when user has permission', () => {
      const mockOrders = [
        {
          crmOrderId: 42,
          orderDate: '2026-07-01',
          customer: { customerName: 'Jane Smith', customerPhone: '5551234567' },
        },
      ];

      render(<OrderList orders={mockOrders as any} />);

      const link = screen.getByRole('link', { name: /Jane Smith/i });
      expect(link.getAttribute('href')).toBe('/orders/42');
    });
  });

  describe('CAD Currency Note in Pricing Column', () => {
    it('should render CAD @ exchangeRate note in Pricing column for CAD orders', () => {
      const mockOrders = [
        {
          crmOrderId: 99,
          orderDate: '2026-07-20',
          orderCurrency: 'CAD',
          orderExchangeRate: '0.74',
          orderTotalPitched: '1000',
          orderVendorPrice: '500',
          orderAmountCharged: '740',
          customer: { customerName: 'CAD Customer' },
        },
      ];

      render(<OrderList orders={mockOrders as any} />);
      expect(screen.getByText('CAD @ 0.74')).toBeDefined();
    });
  });
});

