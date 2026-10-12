// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import React from 'react';
import { useSession, signOut } from 'next-auth/react';

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

import Navbar from '../components/Navbar';

afterEach(() => {
  cleanup();
});

describe('Navbar Component Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any);
  });

  it('should render logo "JD" and "CRM" structure', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);

    expect(screen.queryByText(/JD/i)).not.toBeNull();
    expect(screen.queryByText(/CRM/i)).not.toBeNull();
  });

  it('should hide Agents link when not permitted', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByText(/agents/i)).toBeNull();
  });

  it('should render Agents link when permitted', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByText(/agents/i)).not.toBeNull();
  });

  it('should call signOut when clicking Sign Out button inside dropdown', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    
    expect(screen.queryByTestId('profile-dropdown-menu')).toBeNull();
    
    const profileBtn = screen.getByTestId('user-profile-btn');
    fireEvent.click(profileBtn);
    
    expect(screen.queryByTestId('profile-dropdown-menu')).not.toBeNull();
    
    const signOutBtn = screen.getByTestId('logout-btn');
    fireEvent.click(signOutBtn);

    expect(signOut).toHaveBeenCalled();
  });

  it('should toggle dropdown when clicking profile button twice', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    
    const profileBtn = screen.getByTestId('user-profile-btn');
    
    fireEvent.click(profileBtn);
    expect(screen.queryByTestId('profile-dropdown-menu')).not.toBeNull();
    
    fireEvent.click(profileBtn);
    expect(screen.queryByTestId('profile-dropdown-menu')).toBeNull();
  });

  it('should close dropdown when clicking outside', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    
    const profileBtn = screen.getByTestId('user-profile-btn');
    
    fireEvent.click(profileBtn);
    expect(screen.queryByTestId('profile-dropdown-menu')).not.toBeNull();
    
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('profile-dropdown-menu')).toBeNull();
  });

  it('should render nav container with swipable-nav class', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    const { container } = render(<Navbar />);
    const swipableContainer = container.querySelector('.swipable-nav');
    expect(swipableContainer).not.toBeNull();
  });

  it('should render Follow Ups link when user has follow-ups permissions', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'follow-ups:create',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByText('Follow Ups')).not.toBeNull();
  });

  it('should hide Follow Ups link when user lacks follow-ups permissions', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByText('Follow Ups')).toBeNull();
  });

  it('should NOT render Reports link when user only has orders:view or other non-report permissions', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'orders:view,orders:create,dashboard:monthly-sales',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByText('Reports')).toBeNull();
  });

  it('should NOT render Reports link when user only has export permission', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Export Only User',
          userPermissions: 'reports:agent-sales-export',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByText('Reports')).toBeNull();
  });

  it('should render Reports link when user has a specific report permission like reports:agent-sales', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Agent Sales User',
          userPermissions: 'reports:agent-sales',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByText('Reports')).not.toBeNull();
  });

  it('should render Reports link when user is super-admin', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Super Admin',
          userPermissions: 'super-admin',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByText('Reports')).not.toBeNull();
  });
});

describe('Navbar W-3702 Notification Bell & Tab Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should render notification bell button right left of user profile button', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 101,
          name: 'Agent Sarah',
          userPermissions: 'follow-ups:create',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    const bellBtn = screen.queryByTestId('notification-bell-btn');
    expect(bellBtn).not.toBeNull();
  });

  it('should toggle notification card dropdown when bell button is clicked', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 101,
          name: 'Agent Sarah',
          userPermissions: 'follow-ups:create',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByTestId('notification-dropdown-menu')).toBeNull();

    const bellBtn = screen.getByTestId('notification-bell-btn');
    fireEvent.click(bellBtn);

    expect(screen.queryByTestId('notification-dropdown-menu')).not.toBeNull();
  });

  it('should render Reports link when user has reports:agent-sales and clear report session state on click', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 101,
          name: 'Manager Bob',
          userPermissions: 'reports:agent-sales',
        },
      },
      status: 'authenticated',
    } as any);

    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    render(<Navbar />);
    const reportsLink = screen.getByRole('link', { name: /reports/i });
    expect(reportsLink).not.toBeNull();

    fireEvent.click(reportsLink);
    expect(removeItemSpy).toHaveBeenCalledWith('REPORT_MATRIX_STATE');
    removeItemSpy.mockRestore();
  });

  it('should hide Reports link when user lacks reports permissions', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 101,
          name: 'Regular Agent',
          userPermissions: 'orders:view',
        },
      },
      status: 'authenticated',
    } as any);

    render(<Navbar />);
    expect(screen.queryByRole('link', { name: /reports/i })).toBeNull();
  });
});

