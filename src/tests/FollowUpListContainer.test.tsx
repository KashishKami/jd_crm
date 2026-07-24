// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import FollowUpListContainer from '../components/FollowUpListContainer';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('../components/LenisProvider', () => ({
  useLenis: () => ({ lenis: null }),
}));

describe('W-3402: FollowUpListContainer Filter Isolation & Back Restoration', () => {
  const originalLocation = window.location;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    sessionStorage.clear();
    originalFetch = global.fetch;
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 1,
          name: 'Test Agent',
          userPermissions: 'follow-ups:view,follow-ups:create',
        },
      },
      status: 'authenticated',
    } as any);

    vi.mocked(useSearchParams).mockReturnValue({
      get: () => null,
    } as any);

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/follow-ups')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            followUps: [
              {
                followUpId: 101,
                customerName: 'John Doe',
                customerPhone: '555-123-4567',
                status: 'Interested',
                followUpDate: '2026-07-25T10:00:00.000Z',
              },
            ],
            total: 25,
          }),
        });
      }
      if (url.includes('/api/teams') || url.includes('/api/agents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should ignore stale ?agentId=5 from /orders when mounting FollowUpListContainer', async () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: '/orders',
      search: '?agentId=5',
    } as any;

    render(<FollowUpListContainer />);

    // Verify fetch for follow-ups does NOT include agentId=5
    await waitFor(() => {
      const calls = (global.fetch as any).mock.calls;
      const followUpCall = calls.find((c: any[]) => String(c[0]).includes('/api/follow-ups') && !String(c[0]).includes('/due'));
      expect(followUpCall).toBeDefined();
      expect(String(followUpCall[0])).not.toContain('agentId=5');
    });

    window.location = originalLocation as any;
  });

  it('should restore page=2 and status=Interested when returning from detail page', async () => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: '/follow-ups/101',
      search: '',
    } as any;

    sessionStorage.setItem('coming_from_detail', '/follow-ups?page=2&status=Interested');

    render(<FollowUpListContainer />);

    await waitFor(() => {
      const calls = (global.fetch as any).mock.calls;
      const followUpCall = calls.find((c: any[]) => String(c[0]).includes('/api/follow-ups') && !String(c[0]).includes('/due'));
      expect(followUpCall).toBeDefined();
      expect(String(followUpCall[0])).toContain('status=Interested');
      expect(String(followUpCall[0])).toContain('page=2');
    });

    window.location = originalLocation as any;
  });
});
