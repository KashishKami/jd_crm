// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import BackendTeamWidget from '../components/dashboard/BackendTeamWidget';

describe('BackendTeamWidget Unit Tests', () => {
  afterEach(cleanup);

  const mockData = {
    topPerformers: [
      { agentId: 12, agentName: 'Alice Backend', completedCount: 5, totalPending: 2 },
    ],
    bottomPerformers: [
      { agentId: 13, agentName: 'Bob Backend', completedCount: 1, totalPending: 10 },
    ],
    pendingByCategory: [
      {
        agentId: 12,
        agentName: 'Alice Backend',
        pendingBooking: 1,
        pendingShipment: 1,
        pendingDelivery: 0,
        pendingFeedback: 0,
        pendingResolutions: 0,
        totalPending: 2,
        completedCount: 5,
      },
      {
        agentId: 13,
        agentName: 'Bob Backend',
        pendingBooking: 3,
        pendingShipment: 2,
        pendingDelivery: 1,
        pendingFeedback: 2,
        pendingResolutions: 2,
        totalPending: 10,
        completedCount: 1,
      },
    ],
  };

  it('should render all sections when all permissions are present', () => {
    render(
      <BackendTeamWidget
        initialData={mockData}
        permissions="dashboard:backend-top-performer,dashboard:backend-bottom-performer,dashboard:backend-pending-cases"
        initialMonth={6}
        initialYear={2026}
      />
    );

    // Section headers
    expect(screen.getByText('Top Performers (Completed Cases)')).toBeDefined();
    expect(screen.getByText('Bottom Performers (Pending Cases)')).toBeDefined();
    expect(screen.getByText('Pending Cases by Category')).toBeDefined();
    expect(screen.getAllByText('Alice Backend').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bob Backend').length).toBeGreaterThan(0);
  });

  it('should not render sections for which the user lacks permissions', () => {
    render(
      <BackendTeamWidget
        initialData={mockData}
        permissions="dashboard:backend-top-performer"
        initialMonth={6}
        initialYear={2026}
      />
    );

    expect(screen.getByText('Top Performers (Completed Cases)')).toBeDefined();
    expect(screen.queryByText('Bottom Performers (Pending Cases)')).toBeNull();
    expect(screen.queryByText('Pending Cases by Category')).toBeNull();
  });

  it('should render cells as plain text when user lacks orders:view or orders:create permissions', () => {
    render(
      <BackendTeamWidget
        initialData={mockData}
        permissions="dashboard:backend-top-performer,dashboard:backend-bottom-performer,dashboard:backend-pending-cases"
        initialMonth={6}
        initialYear={2026}
      />
    );

    const links = screen.queryAllByRole('link');
    // None should be links
    expect(links.length).toBe(0);
  });

  it('should render cells as clickable anchor links without month/year filters for pending cases table when user has orders:view permission', () => {
    render(
      <BackendTeamWidget
        initialData={mockData}
        permissions="orders:view,dashboard:backend-top-performer,dashboard:backend-bottom-performer,dashboard:backend-pending-cases"
        initialMonth={6}
        initialYear={2026}
      />
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    // Pending cases agent name link should omit month and year filters
    const alicePendingLink = links.find(
      l => l.getAttribute('href') === '/orders?backendExecutiveId=12'
    );
    expect(alicePendingLink).toBeDefined();

    // Completed cell link in pending cases table should omit month and year filters
    const completedLink = links.find(
      l => l.getAttribute('href') === '/orders?backendExecutiveId=12&status=Completed+Orders'
    );
    expect(completedLink).toBeDefined();
    expect(completedLink?.textContent).toBe('5');

    // Pending Booking cell link in pending cases table for Bob should omit month and year filters
    const bookingLink = links.find(
      l => l.getAttribute('href') === '/orders?backendExecutiveId=13&status=Pending+Booking'
    );
    expect(bookingLink).toBeDefined();
    expect(bookingLink?.textContent).toBe('3');
  });

  it('should not render month navigator controls for Pending Cases by Category section', () => {
    render(
      <BackendTeamWidget
        initialData={mockData}
        permissions="dashboard:backend-pending-cases"
        initialMonth={6}
        initialYear={2026}
      />
    );

    expect(screen.getByText('Pending Cases by Category')).toBeDefined();
    // Month navigator text like "June 2026" should not be rendered when only pending cases table is shown
    expect(screen.queryByText('June 2026')).toBeNull();
  });
});
