// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import OrderAuditLog from '../components/OrderAuditLog';

afterEach(() => {
  cleanup();
});

describe('OrderAuditLog Component Unit Tests', () => {
  const mockEntries = [
    {
      id: 1,
      orderId: 5,
      fieldName: 'orderPart',
      oldValue: 'Clutch Panel',
      newValue: 'Modified Clutch Panel',
      changedById: 10,
      changedByName: 'Alice',
      changedAt: '2026-06-30T14:00:00.000Z', // 10:00 AM EST
    },
    {
      id: 2,
      orderId: 5,
      fieldName: 'customerCardNumber',
      oldValue: '**** **** **** 1111',
      newValue: '**** **** **** 2222',
      changedById: 11,
      changedByName: 'Bob',
      changedAt: '2026-06-30T15:30:00.000Z', // 11:30 AM EST
    },
  ];

  it('should render collapsed by default showing only heading and expand trigger', () => {
    render(<OrderAuditLog entries={mockEntries} />);
    expect(screen.getByText('Change History — Detailed Edit Log')).not.toBeNull();
    // Table should not be visible by default (we can toggle class or style)
    expect(screen.queryByText('Clutch Panel')).toBeNull();
  });

  it('should expand and display change logs when clicked', () => {
    render(<OrderAuditLog entries={mockEntries} />);
    const headerButton = screen.getByRole('button', { name: /Change History — Detailed Edit Log/i });
    
    // Click to expand
    fireEvent.click(headerButton);

    expect(screen.getByText('Clutch Panel')).not.toBeNull();
    expect(screen.getByText('Modified Clutch Panel')).not.toBeNull();
    expect(screen.getByText('Alice')).not.toBeNull();
    expect(screen.getByText('Bob')).not.toBeNull();
  });

  it('should show formatted date in America/New_York (EST/EDT) timezone', () => {
    render(<OrderAuditLog entries={mockEntries} />);
    const headerButton = screen.getByRole('button', { name: /Change History/i });
    fireEvent.click(headerButton);

    // Assert date formatting
    expect(screen.getByText(/30-06-2026 10:00/)).not.toBeNull();
    expect(screen.getByText(/30-06-2026 11:30/)).not.toBeNull();
  });

  it('should render human-readable field labels instead of camelCase fieldName keys', () => {
    render(<OrderAuditLog entries={mockEntries} />);
    const headerButton = screen.getByRole('button', { name: /Change History/i });
    fireEvent.click(headerButton);

    // 'orderPart' should print 'Part' or similar human-readable label
    expect(screen.getByText('Order Part')).not.toBeNull();
    // 'customerCardNumber' should print 'Card Number'
    expect(screen.getByText('Card Number')).not.toBeNull();
  });

  it('should render empty state message when entries is empty and expanded', () => {
    render(<OrderAuditLog entries={[]} />);
    const headerButton = screen.getByRole('button', { name: /Change History/i });
    fireEvent.click(headerButton);

    expect(screen.getByText('No change log entries available.')).not.toBeNull();
  });
});
