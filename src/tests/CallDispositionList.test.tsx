// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
// @ts-ignore
import CallDispositionListContainer from '../components/CallDispositionListContainer';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('CallDispositionListContainer Unit Tests', () => {
  const mockSessionAdmin = {
    user: {
      id: 1,
      nickname: 'Admin User',
      userPermissions: 'call-dispositions:view,call-dispositions:create',
    },
  };

  const mockSessionAgent = {
    user: {
      id: 2,
      nickname: 'Agent User',
      userPermissions: 'call-dispositions:create',
    },
  };

  const mockDispositions = [
    {
      callId: 101,
      customerPhone: '555-111-2222',
      customerName: 'Alice Springs',
      agentId: 10,
      agentName: 'Tom Agent',
      teamId: 1,
      disposition: 'Wrong Number',
      createdAt: '2026-07-21T12:00:00.000Z',
      updatedAt: '2026-07-21T12:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders table columns correctly for Admin role (shows Agent column, Delete buttons, and Export button)', async () => {
    vi.mocked(useSession).mockReturnValue({ data: mockSessionAdmin, status: 'authenticated' } as any);

    // Mock fetch GET for teams, agents, and dispositions
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/teams')) {
        return Promise.resolve({ ok: true, json: async () => [{ teamId: 1, teamName: 'IT Park' }] });
      }
      if (url.includes('/api/agents')) {
        return Promise.resolve({ ok: true, json: async () => [{ uid: 10, nickname: 'Tom Agent', teamId: 1 }] });
      }
      if (url.includes('/api/call-dispositions')) {
        return Promise.resolve({ ok: true, json: async () => ({ dispositions: mockDispositions, total: 1 }) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    render(<CallDispositionListContainer />);

    expect(await screen.findByText('Alice Springs')).toBeDefined();
    expect(screen.getByText('555-111-2222')).toBeDefined();
    expect(screen.getAllByText('Wrong Number').length).toBeGreaterThanOrEqual(1);

    // Admin should see Agent column and Delete action
    expect(screen.getByText('Agent Name')).toBeDefined();
    expect(screen.getAllByText('Tom Agent').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Export Excel' })).toBeDefined();
  });

  it('hides Agent column, Delete buttons, and Export button for Agent role', async () => {
    vi.mocked(useSession).mockReturnValue({ data: mockSessionAgent, status: 'authenticated' } as any);

    // Mock fetch GET for dispositions (agents/teams are not fetched for restricted agent)
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/call-dispositions')) {
        return Promise.resolve({ ok: true, json: async () => ({ dispositions: mockDispositions, total: 1 }) });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    render(<CallDispositionListContainer />);

    expect(await screen.findByText('Alice Springs')).toBeDefined();
    expect(screen.getByText('555-111-2222')).toBeDefined();

    // Agent should not see Agent column, Delete button, or Export Excel button
    expect(screen.queryByText('Agent Name')).toBeNull();
    expect(screen.queryByText('Tom Agent')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Export Excel' })).toBeNull();
  });
});
