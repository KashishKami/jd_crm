// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import FollowUpListContainer from '../components/FollowUpListContainer';

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('FollowUpList and Container Unit Tests (W-3110)', () => {
  const mockFollowUps = [
    {
      followUpId: 10,
      customerName: 'Alice Springs',
      customerState: 'California',
      customerCountry: 'USA',
      customerTimezone: 'America/Los_Angeles',
      customerPhone: '555-111-2222',
      partRequired: 'Engine',
      vehicleYearMakeModel: '2015 Ford Focus',
      quotedOptions: '$1500 - 80k miles / 6 months\n$1800 - 50k miles / 1 year',
      followUpDate: '2026-09-02',
      followUpTime: '15:30',
      followUpReason: 'Waiting for paycheck',
      status: 'Interested',
      priority: 'High',
      agentName: 'Tom Associate',
      lastContact: '2026-09-01T12:00:00Z',
      daysLabel: 'Tomorrow',
    },
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    pushMock.mockClear();
    refreshMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render table with correct columns and data for Admin', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 1, userPermissions: 'follow-ups:view,follow-ups:create' },
      },
      status: 'authenticated',
    } as any);

    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url.toString().includes('/api/follow-ups')) {
        return {
          ok: true,
          json: async () => ({ followUps: mockFollowUps, total: 1 }),
        } as any;
      }
      if (url.toString().includes('/api/teams') || url.toString().includes('/api/agents')) {
        return {
          ok: true,
          json: async () => [],
        } as any;
      }
      return { ok: false } as any;
    });

    render(<FollowUpListContainer />);

    // Check table headers
    await waitFor(() => {
      expect(screen.queryByText('Follow-Up Date & Time')).not.toBeNull();
      expect(screen.queryByText('Customer Information')).not.toBeNull();
      expect(screen.queryByText('Part Required')).not.toBeNull();
      expect(screen.queryAllByText('Agent').length).toBeGreaterThan(0); // Admin sees agent column and filter
      expect(screen.queryByText('Alice Springs')).not.toBeNull();
      expect(screen.queryByText('Tom Associate')).not.toBeNull();
    });

    // Check filters
    expect(screen.queryByText('Team')).not.toBeNull();
  });

  it('should restructure columns and format date/time correctly for W-3153', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 1, userPermissions: 'follow-ups:view,follow-ups:create' },
      },
      status: 'authenticated',
    } as any);

    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url.toString().includes('/api/follow-ups')) {
        return {
          ok: true,
          json: async () => ({ followUps: mockFollowUps, total: 1 }),
        } as any;
      }
      if (url.toString().includes('/api/teams') || url.toString().includes('/api/agents')) {
        return {
          ok: true,
          json: async () => [],
        } as any;
      }
      return { ok: false } as any;
    });

    render(<FollowUpListContainer />);

    await waitFor(() => {
      // Check that "Customer Information" header is present
      expect(screen.queryByText('Customer Information')).not.toBeNull();
      // Check that "Customer" (old header) is NOT present
      expect(screen.queryByText('Customer')).toBeNull();
      // Check that "Phone" header is NOT present
      expect(screen.queryByText('Phone')).toBeNull();
      // Check that "Quoted Options" header is NOT present
      expect(screen.queryByText('Quoted Options')).toBeNull();
      // Check that "Location" header is present
      expect(screen.queryByText('Location')).not.toBeNull();

      // Check customer info cell contents (name + formatted phone stacked)
      expect(screen.queryByText('Alice Springs')).not.toBeNull();
      expect(screen.queryByText('555-111-2222')).not.toBeNull();

      // Check location cell contents (California + USA)
      expect(screen.queryByText('California')).not.toBeNull();
      expect(screen.queryByText('USA')).not.toBeNull();

      // Check date/time cell formatting: no timezone label (EDT/EST/etc.)
      expect(screen.queryByText(/EDT/)).toBeNull();
      expect(screen.queryByText(/EST/)).toBeNull();
      expect(screen.queryByText(/America\/Los_Angeles/)).toBeNull();
    });
  });

  it('should hide Agent column and dropdowns for standard Agent', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 2, userPermissions: 'follow-ups:create' }, // Lacks follow-ups:view
      },
      status: 'authenticated',
    } as any);

    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url.toString().includes('/api/follow-ups')) {
        return {
          ok: true,
          json: async () => ({ followUps: mockFollowUps, total: 1 }),
        } as any;
      }
      return { ok: false } as any;
    });

    render(<FollowUpListContainer />);

    await waitFor(() => {
      expect(screen.queryByText('Alice Springs')).not.toBeNull();
    });

    // Agent column and filters should be hidden
    expect(screen.queryAllByText('Agent').length).toBe(0);
    expect(screen.queryByText('Team')).toBeNull();
  });

  it('should not show Delete button in list even for admin', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 1, userPermissions: 'follow-ups:view' },
      },
      status: 'authenticated',
    } as any);

    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url.toString().includes('/api/follow-ups?')) {
        return {
          ok: true,
          json: async () => ({ followUps: mockFollowUps, total: 1 }),
        } as any;
      }
      if (url.toString().includes('/api/teams') || url.toString().includes('/api/agents')) {
        return {
          ok: true,
          json: async () => [],
        } as any;
      }
      return { ok: false } as any;
    });

    render(<FollowUpListContainer />);

    await waitFor(() => {
      expect(screen.queryByText('Alice Springs')).not.toBeNull();
    });

    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('should render search field and trigger fetch on change for W-3154', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 1, userPermissions: 'follow-ups:view' },
      },
      status: 'authenticated',
    } as any);

    const mockFetch = vi.fn().mockImplementation(async (url) => {
      if (url.toString().includes('/api/follow-ups')) {
        return {
          ok: true,
          json: async () => ({ followUps: [], total: 0 }),
        } as any;
      }
      return { ok: true, json: async () => [] } as any;
    });
    vi.mocked(global.fetch).mockImplementation(mockFetch);

    render(<FollowUpListContainer />);

    // Check search input is in the DOM
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search by customer name or phone...')).not.toBeNull();
    });
    const searchInput = screen.getByPlaceholderText('Search by customer name or phone...');

    // Type in search field
    fireEvent.change(searchInput, { target: { value: 'Apple' } });

    // Wait for debounce (300ms)
    await new Promise(resolve => setTimeout(resolve, 450));

    await waitFor(() => {
      // Assert some fetch call was made with the search query
      const searchCallExists = mockFetch.mock.calls.some(c => {
        const urlStr = c[0].toString();
        return urlStr.includes('/api/follow-ups') && urlStr.includes('search=Apple');
      });
      expect(searchCallExists).toBe(true);
    });
  });
  it('should hide the daysLabel badge in the table when status is Not Interested', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { id: 1, userPermissions: 'follow-ups:view,follow-ups:create' },
      },
      status: 'authenticated',
    } as any);

    const notInterestedFollowUps = [
      {
        ...mockFollowUps[0],
        status: 'Not Interested',
        daysLabel: 'Tomorrow',
      },
    ];

    vi.mocked(global.fetch).mockImplementation(async (url) => {
      if (url.toString().includes('/api/follow-ups')) {
        return {
          ok: true,
          json: async () => ({ followUps: notInterestedFollowUps, total: 1 }),
        } as any;
      }
      if (url.toString().includes('/api/teams') || url.toString().includes('/api/agents')) {
        return {
          ok: true,
          json: async () => [],
        } as any;
      }
      return { ok: false } as any;
    });

    render(<FollowUpListContainer />);

    await waitFor(() => {
      expect(screen.queryByText('Alice Springs')).not.toBeNull();
    });

    // daysLabel badge must NOT appear when status is 'Not Interested'
    expect(screen.queryByText('Tomorrow')).toBeNull();
  });
});
