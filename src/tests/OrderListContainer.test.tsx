// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import OrderListContainer from '../components/OrderListContainer';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

const pushSpy = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn().mockReturnValue({
    get: (key: string) => null,
  }),
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/orders',
}));

const originalFetch = global.fetch;

describe('OrderListContainer Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }

    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Super Admin',
          userPermissions: 'orders:view,orders:view-pending-booking,orders:view-pending-shipment,orders:view-pending-delivery,orders:view-pending-feedback,orders:view-pending-resolutions,orders:view-completed,orders:view-returned',
        },
      },
      status: 'authenticated',
    } as any);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/agents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { uid: 1, name: 'Alice Agent', nickname: 'Alice', designation: 'Sales Associate', status: 1 },
            { uid: 2, name: 'Bob Executive', nickname: 'Bob', designation: 'Backend Specialist', status: 1 },
            { uid: 3, name: 'Nainika HR', nickname: 'Nainika', designation: 'HR', status: 1 },
            { uid: 4, name: 'Charlie Associate', nickname: 'Charlie', designation: 'Backend Associate', status: 1 },
            { uid: 5, name: 'Danny Boss', nickname: 'Danny', designation: 'Director', status: 1 },
          ],
        });
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ teamId: 10, teamName: 'Alpha Team' }],
        });
      }
      if (url.includes('/api/orders/pending-counts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            'All Orders': { amount: 9000, count: 19 },
            'Pending Booking': { amount: 1500, count: 3 },
            'Pending Shipment': { amount: 2000, count: 4 },
            'Pending Delivery': { amount: 0, count: 0 },
            'Pending Feedback': { amount: 0, count: 0 },
            'Pending Resolutions': { amount: 0, count: 0 },
            'Completed Orders': { amount: 5000, count: 10 },
            'Returned Orders': { amount: 500, count: 2 },
          }),
        });
      }
      if (url.includes('/api/orders')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [],
            total: 25,
            pages: 2,
          }),
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    pushSpy.mockClear();
  });

  it('[RED] should render dropdowns immediately and NOT call fetch for agents or teams when initialAgents and initialTeams are provided', async () => {
    const mockInitialAgents = [
      { uid: 1, name: 'Alice Agent', nickname: 'Alice', designation: 'Sales Associate', status: 1 },
    ];
    const mockInitialTeams = [
      { teamId: 10, teamName: 'Alpha Team' },
    ];

    render(<OrderListContainer initialAgents={mockInitialAgents} initialTeams={mockInitialTeams} />);

    // Check that fetch was NOT called for agents or teams
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/agents'));
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/teams'));

    // Check that dropdowns render with the provided initial options
    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0);
      expect(screen.getByText('Alpha Team')).toBeDefined();
    });
  });

  it('[RED] should fetch pending counts and render stats summary card with count and margin totals', async () => {
    render(<OrderListContainer />);

    // Check that pending-counts was fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/orders/pending-counts'));
    });

    // Check that stats summary card displays counts and margins
    await waitFor(() => {
      expect(screen.getByTestId('tab-totals-summary')).toBeDefined();
      expect(screen.getByText(/All Orders Summary:/)).toBeDefined();
      expect(screen.getByText(/19 Orders/)).toBeDefined();
      expect(screen.getByText(/\$9,000\.00/)).toBeDefined();
    });
  });

  it('[RED] should render Backend Executive filter dropdown and refresh list when selection changes', async () => {
    render(<OrderListContainer />);

    // Wait for the dropdown to be rendered
    await waitFor(() => {
      expect(screen.getByLabelText(/Backend Executive/i)).toBeDefined();
    });

    // Select Backend Executive Bob (uid 2)
    const select = screen.getByLabelText(/Backend Executive/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2' } });

    // Verify fetch was triggered with backendExecutiveId=2
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('backendExecutiveId=2'));
    });
  });

  describe('W-2204: Sale Status Dropdown Filter and Active Pills', () => {
    it('[RED] should render Sale Status filter dropdown in the filter bar', async () => {
      render(<OrderListContainer />);
      await waitFor(() => {
        expect(screen.getByLabelText(/^Sale Status$/i)).toBeDefined();
      });
    });

    it('[RED] should show correct active filter pill when Void (5) is selected', async () => {
      render(<OrderListContainer />);
      await waitFor(() => {
        expect(screen.getByLabelText(/^Sale Status$/i)).toBeDefined();
      });

      const select = screen.getByLabelText(/^Sale Status$/i) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '5' } });

      await waitFor(() => {
        expect(screen.getByText(/Sale Status: Void/)).toBeDefined();
      });
    });

    it('[RED] should show correct active filter pill when Cancelled (6) is selected', async () => {
      render(<OrderListContainer />);
      await waitFor(() => {
        expect(screen.getByLabelText(/^Sale Status$/i)).toBeDefined();
      });

      const select = screen.getByLabelText(/^Sale Status$/i) as HTMLSelectElement;
      fireEvent.change(select, { target: { value: '6' } });

      await waitFor(() => {
        expect(screen.getByText(/Sale Status: Cancelled/)).toBeDefined();
      });
    });

    it('[RED] should render Cancelled Orders tab when user has orders:view-cancelled permission', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            name: 'Authorized Viewer',
            userPermissions: 'orders:view,orders:view-cancelled',
          },
        },
        status: 'authenticated',
      } as any);

      render(<OrderListContainer initialStatus="Cancelled Orders" />);

      await waitFor(() => {
        // Tab should exist
        const tab = screen.getByRole('button', { name: /Cancelled Orders/i });
        expect(tab).toBeDefined();
      });
    });

    it('[RED] should display warning banner when Cancelled Orders tab is active', async () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            name: 'Authorized Viewer',
            userPermissions: 'orders:view,orders:view-cancelled',
          },
        },
        status: 'authenticated',
      } as any);

      render(<OrderListContainer initialStatus="Cancelled Orders" />);

      await waitFor(() => {
        expect(screen.getByText(/Cancelled Orders Queue/i)).toBeDefined();
      }, { timeout: 5000 });
    }, 15000);

    it('[RED] should filter Part Found By dropdown options to show only designated agents (7 designations)', async () => {
      render(<OrderListContainer />);
      await waitFor(() => {
          expect(screen.getByLabelText(/Part Found By/i)).toBeDefined();
        });

        const select = screen.getByLabelText(/Part Found By/i) as HTMLSelectElement;
        const options = Array.from(select.options).map(opt => opt.text);

        // Alice, Bob, and Charlie should be present
        expect(options).toContain('Alice');
        expect(options).toContain('Bob');
        expect(options).toContain('Charlie');

        // Nainika and Danny should NOT be present (since HR and Director are not in the 7 designations)
        expect(options).not.toContain('Nainika');
        expect(options).not.toContain('Danny');
      });
    });

    it('[RED] should read page from URL query parameters on mount', async () => {
      const mockGet = vi.fn().mockImplementation((key: string) => {
        if (key === 'page') return '3';
        return null;
      });
      vi.mocked(useSearchParams).mockReturnValue({
        get: mockGet,
      } as any);

      render(<OrderListContainer />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('page=3'));
      });
    });

    it('[RED] should update URL query parameters and register scroll listeners on page change', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: () => null,
      } as any);

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      const originalLocation = window.location;
      delete (window as any).location;
      window.location = {
        ...originalLocation,
        pathname: '/orders',
        search: '?page=1',
      } as any;

      render(<OrderListContainer />);

      // Scroll event trigger and saving scroll
      fireEvent.scroll(window, { target: { scrollY: 150 } });
      expect(setItemSpy).toHaveBeenCalledWith(expect.stringContaining('scroll_position_/orders'), '150');

      setItemSpy.mockRestore();
      scrollToSpy.mockRestore();
      window.location = originalLocation as any;
    });
  });
