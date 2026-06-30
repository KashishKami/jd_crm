// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import OrderViewLog from '../components/OrderViewLog';
import { OrderViewEntry } from '../types/orderView';

afterEach(() => {
  cleanup();
});

describe('OrderViewLog Component Unit Tests', () => {
  it('should render viewer names inside the table', () => {
    const mockEntries: OrderViewEntry[] = [
      {
        id: 1,
        orderId: 5,
        viewerId: 10,
        viewerName: 'Alice',
        viewedAt: '2026-06-30T10:00:00.000Z',
      },
      {
        id: 2,
        orderId: 5,
        viewerId: 11,
        viewerName: 'Bob',
        viewedAt: '2026-06-30T11:30:00.000Z',
      },
    ];

    render(<OrderViewLog entries={mockEntries} />);

    expect(screen.getByText('Alice')).not.toBeNull();
    expect(screen.getByText('Bob')).not.toBeNull();
  });

  it('should display most recent entries at the top of the table', () => {
    const mockEntries: OrderViewEntry[] = [
      {
        id: 1,
        orderId: 5,
        viewerId: 10,
        viewerName: 'Alice',
        viewedAt: '2026-06-30T10:00:00.000Z',
      },
      {
        id: 2,
        orderId: 5,
        viewerId: 11,
        viewerName: 'Bob',
        viewedAt: '2026-06-30T11:30:00.000Z',
      },
    ];

    render(<OrderViewLog entries={mockEntries} />);

    const rows = screen.getAllByRole('row');
    // Row 0 is header, Row 1 should be Bob (recent), Row 2 should be Alice (older)
    expect(rows[1].textContent).toContain('Bob');
    expect(rows[2].textContent).toContain('Alice');
  });

  it('should show formatted date and time in America/New_York (EST/EDT) timezone', () => {
    const mockEntries: OrderViewEntry[] = [
      {
        id: 1,
        orderId: 5,
        viewerId: 10,
        viewerName: 'Alice',
        viewedAt: '2026-06-30T14:00:00.000Z', // 10:00:00 AM EST (UTC - 4h during daylight saving)
      },
    ];

    render(<OrderViewLog entries={mockEntries} />);

    // Under New_York timezone, 2026-06-30 14:00:00 UTC is 10:00:00 AM
    // Let's assert the rendered time format contains 10:00
    expect(screen.getByText(/30-06-2026 10:00/)).not.toBeNull();
  });

  it('should render no view history warning when entries list is empty', () => {
    render(<OrderViewLog entries={[]} />);
    expect(screen.getByText('No view history available.')).not.toBeNull();
  });
});
