// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import GatewayList from '../components/GatewayList';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('GatewayList Component Unit Tests', () => {
  const mockGateways = [
    {
      gatewayId: 1,
      gatewayName: 'Stripe Test',
      gatewayStatus: 1,
    },
    {
      gatewayId: 2,
      gatewayName: 'PayPal Test',
      gatewayStatus: 0,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render gateways immediately and NOT call fetch when initialGateways is provided', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'gateways:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<GatewayList initialGateways={mockGateways as any} />);

    // Check that fetch was NOT called for gateways
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/gateways'));

    // Check that gateways render immediately
    await waitFor(() => {
      expect(screen.queryByText('Stripe Test')).not.toBeNull();
      expect(screen.queryByText('PayPal Test')).not.toBeNull();
    });
  });
});
