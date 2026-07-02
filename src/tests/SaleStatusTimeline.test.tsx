// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import SaleStatusTimeline from '../components/SaleStatusTimeline';

afterEach(() => {
  cleanup();
});

describe('SaleStatusTimeline Component Unit Tests', () => {
  it('should render sale status history chronological transitions correctly', () => {
    const mockHistory = [
      {
        id: 1,
        orderId: 10,
        oldValue: null,
        newValue: '1',
        changedById: 2,
        changedByName: 'Agent Jack',
        changedAt: '2026-06-01T10:00:00Z',
      },
      {
        id: 2,
        orderId: 10,
        oldValue: '1',
        newValue: '2',
        changedById: 3,
        changedByName: 'Admin JD',
        changedAt: '2026-06-05T15:30:00Z',
      },
    ];

    render(<SaleStatusTimeline history={mockHistory} />);

    // Verify status labels
    expect(screen.getAllByText('Sold').length).toBeGreaterThan(0);
    expect(screen.getByText('Refunded')).not.toBeNull();
    expect(screen.getByText('Agent Jack')).not.toBeNull();
    expect(screen.getByText('Admin JD')).not.toBeNull();
  });

  it('[RED] should render Void (5) and Cancel Order (6) labels correctly', () => {
    const mockHistory = [
      {
        id: 3,
        orderId: 10,
        oldValue: '1',
        newValue: '5',
        changedById: 2,
        changedByName: 'Agent Jack',
        changedAt: '2026-06-01T10:00:00Z',
      },
      {
        id: 4,
        orderId: 10,
        oldValue: '1',
        newValue: '6',
        changedById: 3,
        changedByName: 'Admin JD',
        changedAt: '2026-06-05T15:30:00Z',
      },
    ];

    render(<SaleStatusTimeline history={mockHistory} />);

    expect(screen.getByText('Void')).not.toBeNull();
    expect(screen.getByText('Cancelled')).not.toBeNull();
  });
});
