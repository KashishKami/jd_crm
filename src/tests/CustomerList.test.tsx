// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import CustomerList from '../components/CustomerList';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('CustomerList Component Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render customer list using customerName', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Agent User',
          userPermissions: 'customers:view',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as any);

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [
        {
          customerId: 1,
          customerName: 'Mary Johnson',
          customerEmail: 'mary@example.com',
          customerPhone: '555-1234',
        },
      ],
    } as Response);

    render(<CustomerList />);

    await waitFor(() => {
      expect(screen.queryByText('Mary Johnson')).not.toBeNull();
    });
    expect(screen.queryByText('mary@example.com')).not.toBeNull();
    expect(screen.queryByText('555-1234')).not.toBeNull();
  });
});
