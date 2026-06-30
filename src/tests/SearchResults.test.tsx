// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import SearchResults from '../components/SearchResults';

const pushSpy = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushSpy,
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  pushSpy.mockClear();
});

const mockResults = {
  orders: [
    {
      crmOrderId: 101,
      orderDate: '2026-06-25',
      orderMakeModel: '2022 Toyota Camry',
      orderPart: 'Alternator',
      orderTotalPitched: '1000',
      orderVendorPrice: '700',
      orderMarkup: '300',
      orderCurrentStatus: 'Pending Booking',
      customer: {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '9999999999',
      },
    },
    {
      crmOrderId: 102,
      orderDate: '2026-06-26',
      orderMakeModel: '2020 Honda Civic',
      orderPart: 'Brake Pads',
      orderTotalPitched: '500',
      orderVendorPrice: '300',
      orderMarkup: '200',
      orderCurrentStatus: 'Pending Shipment',
      customer: {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerPhone: '8888888888',
      },
    },
  ],
  customers: [],
};

describe('SearchResults Component Unit Tests', () => {
  it('should render a table of matched orders with columns', () => {
    render(<SearchResults results={mockResults as any} />);

    // Check table headers
    expect(screen.getByText('Order ID')).toBeDefined();
    expect(screen.getByText('Customer')).toBeDefined();
    expect(screen.getByText('Vehicle & Part')).toBeDefined();

    // Check specific rows
    expect(screen.getByText('#101')).toBeDefined();
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('2022 Toyota Camry')).toBeDefined();
    expect(screen.getByText('Alternator')).toBeDefined();

    expect(screen.getByText('#102')).toBeDefined();
    expect(screen.getByText('Jane Smith')).toBeDefined();
  });

  it('should call router.push to the orders page when details button is clicked', () => {
    render(<SearchResults results={mockResults as any} />);

    const detailsButtons = screen.getAllByText('Details');
    fireEvent.click(detailsButtons[0]);

    expect(pushSpy).toHaveBeenCalledWith('/orders/101');
  });

  it('should render a "No results found" message when results are empty', () => {
    render(<SearchResults results={{ orders: [], customers: [] } as any} />);

    expect(screen.getByText(/no results found/i)).toBeDefined();
  });
});
