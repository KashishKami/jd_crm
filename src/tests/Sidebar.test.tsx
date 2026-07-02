// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

import Sidebar from '../components/Sidebar';

afterEach(() => {
  cleanup();
});

describe('Sidebar Component Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render nothing if user is not authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as unknown as ReturnType<typeof useSession>);

    const { container } = render(<Sidebar />);
    expect(container.firstChild).toBeNull();
  });

  it('should render only permitted links (e.g. Vendors only)', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Agent User',
          userPermissions: 'vendors:view', // Only All Vendors
        },
      },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>);

    render(<Sidebar />);
    
    expect(screen.queryByText(/vendors/i)).not.toBeNull();
    expect(screen.queryByText(/agents/i)).toBeNull();
    expect(screen.queryByText(/gateways/i)).toBeNull();
    expect(screen.queryByText(/orders/i)).toBeNull();
  });

  it('should render all links for super admin (99999)', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Super Admin',
          userPermissions: 'super-admin',
        },
      },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>);

    render(<Sidebar />);

    expect(screen.queryByText(/vendors/i)).not.toBeNull();
    expect(screen.queryByText(/agents/i)).not.toBeNull();
    expect(screen.queryByText(/gateways/i)).not.toBeNull();
    expect(screen.queryByText(/orders/i)).not.toBeNull();
  });

  it('should render Roles and Permissions link for super admin', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Super Admin',
          userPermissions: 'super-admin',
        },
      },
      status: 'authenticated',
    } as unknown as ReturnType<typeof useSession>);

    render(<Sidebar />);

    expect(screen.queryByText('Roles and Permissions')).not.toBeNull();
  });
});
