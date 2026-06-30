// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import WorkflowStatusTimeline from '../components/WorkflowStatusTimeline';

afterEach(() => {
  cleanup();
});

describe('WorkflowStatusTimeline Component Unit Tests', () => {
  it('should render workflow status history transitions correctly', () => {
    const mockHistory = [
      {
        id: 1,
        orderId: 10,
        oldValue: 'Pending Booking',
        newValue: 'Pending Shipment',
        changedById: 2,
        changedByName: 'Agent Jack',
        changedAt: '2026-06-01T10:00:00Z',
      },
    ];

    render(<WorkflowStatusTimeline history={mockHistory} />);

    expect(screen.getByText('Pending Booking')).not.toBeNull();
    expect(screen.getByText('Pending Shipment')).not.toBeNull();
    expect(screen.getByText('Agent Jack')).not.toBeNull();
  });
});
