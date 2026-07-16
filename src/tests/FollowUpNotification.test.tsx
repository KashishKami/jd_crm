// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import FollowUpListContainer from '../components/FollowUpListContainer';
import { useFollowUpNotifications } from '../lib/useFollowUpNotifications';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('../lib/useFollowUpNotifications', () => ({
  useFollowUpNotifications: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('FollowUpNotification Unit Tests (W-3159)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url) => {
      return {
        ok: true,
        json: async () => ({ followUps: [], total: 0 }),
      } as any;
    }));

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 1, userPermissions: 'follow-ups:view' },
      },
      status: 'authenticated',
    } as any);
  });

  it('should render toast with Show Details link and in bottom-5 position', async () => {
    // Mock the hook to return one active notification
    vi.mocked(useFollowUpNotifications).mockReturnValue({
      activeNotifications: [
        {
          followUpId: 42,
          customerName: 'Alice Springs',
          followUpTime: '10:00',
          customerTimezone: 'America/New_York',
          partRequired: 'Bumper',
        },
      ],
      dismissNotification: vi.fn(),
    });

    render(<FollowUpListContainer />);

    // Assert a link/button with visible text "Show Details" is present in the DOM
    const showDetailsLink = screen.getByText('Show Details');
    expect(showDetailsLink).not.toBeNull();
    expect(showDetailsLink.getAttribute('href')).toBe('/follow-ups/42');

    // Assert the toast wrapper element has Tailwind class bottom-5 and NOT top-5
    const toastContainer = showDetailsLink.closest('.fixed');
    expect(toastContainer).not.toBeNull();
    const classList = toastContainer?.className || '';
    expect(classList).toContain('bottom-5');
    expect(classList).not.toContain('top-5');
  });
});
