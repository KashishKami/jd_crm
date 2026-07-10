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

  it('should render cells as clickable anchor links when user has orders:view permission', () => {
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

    // Alice name link in pending cases table or performers table
    const aliceLink = links.find(
      l => l.getAttribute('href') === '/orders?backendExecutiveId=12&month=6&year=2026'
    );
    expect(aliceLink).toBeDefined();

    // Completed cell link in pending cases table
    const completedLink = links.find(
      l => l.getAttribute('href') === '/orders?backendExecutiveId=12&status=Completed+Orders&month=6&year=2026'
    );
    expect(completedLink).toBeDefined();
    expect(completedLink?.textContent).toBe('5');

    // Pending Booking cell link in pending cases table for Bob
    const bookingLink = links.find(
      l => l.getAttribute('href') === '/orders?backendExecutiveId=13&status=Pending+Booking&month=6&year=2026'
    );
    expect(bookingLink).toBeDefined();
    expect(bookingLink?.textContent).toBe('3');
  });
});
