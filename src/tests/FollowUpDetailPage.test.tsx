// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { getServerSession } from 'next-auth';
import * as followupService from '../service/followup.service';
import FollowUpDetailPage from '../app/follow-ups/[id]/page';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock('../service/followup.service', () => ({
  getFollowUpById: vi.fn(),
  computeDaysLabel: vi.fn(() => 'Tomorrow'),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  redirect: (url: string) => {
    throw new Error(`Redirected to ${url}`);
  },
  notFound: () => {
    throw new Error('Not Found triggered');
  },
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('Follow-Up Detail Page Server Component Tests (W-3111)', () => {
  const mockRecord = {
    followUpId: 10,
    customerName: 'Jane Watson',
    customerPhone: '555-999-8888',
    customerState: 'California',
    customerCountry: 'USA',
    customerTimezone: 'America/Los_Angeles',
    vehicleYearMakeModel: '2021 Toyota RAV4',
    partRequired: 'Engine',
    quotedOptions: '$2200 - 45k miles\n$2500 - 30k miles',
    followUpDate: '2026-09-02',
    followUpTime: '15:30',
    followUpReason: 'Waiting for paycheck',
    status: 'Interested',
    priority: 'High',
    agentName: 'Tom Associate',
    entryDate: new Date('2026-09-01T12:00:00Z'),
    lastContact: new Date('2026-09-01T12:00:00Z'),
    daysLabel: 'Tomorrow',
  };

  it('should render all details correctly for Admin (including delete)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 1, name: 'Admin', userPermissions: 'follow-ups:view,follow-ups:create' },
    });
    vi.mocked(followupService.getFollowUpById).mockResolvedValue(mockRecord as any);

    const pageComponent = await FollowUpDetailPage({ params: Promise.resolve({ id: '10' }) });
    render(pageComponent);

    // Assert customer details
    expect(screen.queryByText('Jane Watson')).not.toBeNull();
    expect(screen.queryByText('555-999-8888')).not.toBeNull();
    expect(screen.queryByText('California')).not.toBeNull();
    expect(screen.queryByText('USA')).not.toBeNull();

    // Assert vehicle and part
    expect(screen.queryByText('2021 Toyota RAV4')).not.toBeNull();
    expect(screen.queryByText('Engine')).not.toBeNull();

    // Assert quoted options rendered line by line
    expect(screen.queryByText('$2200 - 45k miles')).not.toBeNull();
    expect(screen.queryByText('$2500 - 30k miles')).not.toBeNull();

    // Assert daysLabel
    expect(screen.queryByText('Tomorrow')).not.toBeNull();

    // Admin should see delete button
    expect(screen.queryByText('Delete Follow-Up')).not.toBeNull();

    // Back to List button
    expect(screen.queryByText('Back to List')).not.toBeNull();
  });

  it('should hide delete button for standard Agent', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 2, name: 'Agent', userPermissions: 'follow-ups:create' },
    });
    vi.mocked(followupService.getFollowUpById).mockResolvedValue(mockRecord as any);

    const pageComponent = await FollowUpDetailPage({ params: Promise.resolve({ id: '10' }) });
    render(pageComponent);

    // Agent should NOT see delete button
    expect(screen.queryByText('Delete Follow-Up')).toBeNull();
  });

  it('should remove Customer Timezone, apply Georgia font style, and show entry/lastContact dates in EST for W-3155', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 1, name: 'Admin', userPermissions: 'follow-ups:view,follow-ups:create' },
    });
    vi.mocked(followupService.getFollowUpById).mockResolvedValue(mockRecord as any);

    const pageComponent = await FollowUpDetailPage({ params: Promise.resolve({ id: '10' }) });
    const { container } = render(pageComponent);

    // 1. Assert timezone (e.g. America/Los_Angeles) is NOT present on screen
    expect(screen.queryByText('Customer Timezone')).toBeNull();
    expect(screen.queryByText('America/Los_Angeles')).toBeNull();

    // 2. Assert inline style contains Georgia serif font rule
    const styles = container.querySelector('style');
    expect(styles).not.toBeNull();
    expect(styles?.textContent).toContain('Georgia, serif');

    // 3. Assert dates are formatted to America/New_York (EST/EDT)
    // mockRecord.entryDate = 2026-09-01T12:00:00Z -> EST/EDT is 2026-09-01 at 08:00 AM EDT
    expect(screen.queryAllByText(/Sep 1, 2026 · 8:00 AM/)).not.toHaveLength(0);
  });

  it('should render Notes card first and merged Classification & Schedule card second for W-3156', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 1, name: 'Admin', userPermissions: 'follow-ups:view,follow-ups:create' },
    });
    vi.mocked(followupService.getFollowUpById).mockResolvedValue(mockRecord as any);

    const pageComponent = await FollowUpDetailPage({ params: Promise.resolve({ id: '10' }) });
    const { container } = render(pageComponent);

    const sidebar = container.querySelector('.order-form-sidebar');
    expect(sidebar).not.toBeNull();

    const headers = Array.from(sidebar!.querySelectorAll('h3')).map(h => h.textContent?.trim());
    expect(headers).toHaveLength(3);
    expect(headers[0]).toBe('Notes or Remarks');
    expect(headers[1]).toBe('Classification and Schedule');
    expect(headers[2]).toBe('System Metadata');

    // Assert that GMT/EDT/EST is NOT rendered in the Callback Time block (it should be empty/null there)
    // The date/time is split into two lines: time, then date below it, with NO timezone suffix.
    expect(screen.queryByText(/3:30 PM/)).not.toBeNull();
    expect(screen.queryByText(/Sep 2, 2026/)).not.toBeNull();
  });
});
