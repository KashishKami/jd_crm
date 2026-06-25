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

import Navbar from '../components/Navbar';

afterEach(() => {
  cleanup();
});

describe('Navbar Component Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
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
});
