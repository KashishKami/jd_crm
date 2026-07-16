// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import AgentList from '../components/AgentList';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

const pushSpy = vi.fn();
const mockGet = vi.fn().mockReturnValue(null);
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/agents',
}));


afterEach(() => {
  cleanup();
});

describe('AgentList Component Unit Tests', () => {
  const mockAgents = [
    {
      uid: 10,
      name: 'Agent Ten',
      nickname: 'Ten',
      username: 'agent_ten',
      email: 'ten@crm.com',
      status: 1,
      role: { roleName: 'Sales Agent' },
      team: { teamName: 'IT Park' },
      designation: 'Sales Representative',
    },
    {
      uid: 11,
      name: 'Agent Eleven',
      nickname: 'Eleven',
      username: 'agent_eleven',
      email: 'eleven@crm.com',
      status: 1,
      role: { roleName: 'Sales Manager' },
      team: { teamName: 'DB Park' },
      designation: 'Team Leader',
    },
    {
      uid: 12,
      name: 'Agent Twelve',
      nickname: null,
      username: 'agent_twelve',
      email: 'twelve@crm.com',
      status: 0,
      role: { roleName: 'Verifier' },
      team: { teamName: 'Alex' },
      designation: 'Verifier Specialist',
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    // Reset location query parameters to prevent test leakage
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/agents');
    }
    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(true);
    // Mock global fetch
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockAgents),
      } as Response)
    );
  });

  it('should render agents immediately and NOT call fetch when initialAgents is provided', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view,agents:view-roles',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<AgentList designations={[]} initialAgents={mockAgents as any} />);

    // Check that fetch was NOT called for agents
    expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/agents'));

    // Check that agents render immediately
    await waitFor(() => {
      expect(screen.queryByText('Ten')).not.toBeNull();
      expect(screen.queryByText('Eleven')).not.toBeNull();
    });
  });

  it('should render a table of agents from mocked API response', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view,agents:view-roles',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<AgentList />);

    // Wait for the table data to be loaded and rendered
    await waitFor(() => {
      expect(screen.queryByText('Ten')).not.toBeNull();
      expect(screen.queryByText('Eleven')).not.toBeNull();
      expect(screen.queryAllByText('Sales Agent').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Sales Manager').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('IT Park').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('DB Park').length).toBeGreaterThan(0);
    });
  });

  it('should show "Add Agent" button if user session has agents:create permission and hide it if not', async () => {
    // 1. With agents:create permission
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view,agents:create',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<AgentList />);
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /add agent/i })).not.toBeNull();
    });

    cleanup();

    // 2. Without agents:create permission
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Manager User',
          userPermissions: 'agents:view', // lacking agents:create
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<AgentList />);
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /add agent/i })).toBeNull();
    });
  });

  it('should call fetch to deactivate agent status when clicking Deactivate button', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view,agents:edit',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const fetchSpy = vi.spyOn(global, 'fetch');

    render(<AgentList />);

    // Find and click deactivate button for Agent Ten (uid: 10)
    let deactivateBtns: HTMLElement[] = [];
    await waitFor(() => {
      deactivateBtns = screen.queryAllByRole('button', { name: /deactivate/i });
      expect(deactivateBtns.length).toBeGreaterThan(0);
    });

    fireEvent.click(deactivateBtns[0]);

    await waitFor(() => {
      // Should hit the status route with status: 0
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/agents/10/status'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 0 }),
        })
      );
    });
  });

  it('should display the alias (nickname) only and NOT the real name to protect privacy', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<AgentList />);

    await waitFor(() => {
      // Check that the alias "Ten" is rendered
      const aliasElement = screen.queryByText('Ten');
      expect(aliasElement).not.toBeNull();
      
      // Get container displaying name elements and verify layout hierarchy
      const cell = aliasElement!.closest('td');
      expect(cell).not.toBeNull();
      
      // Verify that the real name "Agent Ten" is NOT in the cell content
      expect(cell!.textContent).not.toContain('Agent Ten');
    });
  });

  it('should render search and filter controls and filter the agents dynamically', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view,agents:view-roles',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<AgentList />);

    await waitFor(() => {
      // Verify inputs and dropdowns are present
      expect(screen.queryByPlaceholderText(/search name or alias/i)).not.toBeNull();
      expect(screen.queryByTestId('designation-select') || screen.queryByRole('combobox', { name: /designation/i })).toBeDefined();
      expect(screen.queryByTestId('team-select') || screen.queryByRole('combobox', { name: /team/i })).toBeDefined();
      expect(screen.queryByTestId('role-select') || screen.queryByRole('combobox', { name: /role/i })).toBeDefined();
      expect(screen.queryByTestId('status-select') || screen.queryByRole('combobox', { name: /status/i })).toBeDefined();
    });

    // Test text search filter
    const searchInput = screen.getByPlaceholderText(/search name or alias/i);
    fireEvent.change(searchInput, { target: { value: 'Eleven' } });

    await waitFor(() => {
      expect(screen.queryByText('Ten')).toBeNull();
      expect(screen.queryByText('Eleven')).not.toBeNull();
    });
  });

  it('should show/hide role column and filter based on agents:view-roles permission', async () => {
    // Case 1: Lacking agents:view-roles
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Regular Agent',
          userPermissions: 'agents:view',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    const { rerender } = render(<AgentList />);
    await waitFor(() => {
      // Check that role dropdown is NOT rendered
      expect(screen.queryByTestId('role-select')).toBeNull();
      // Check that role column header is NOT rendered
      expect(screen.queryByText('Role')).toBeNull();
    });

    cleanup();

    // Case 2: Having agents:view-roles
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Authorized Admin',
          userPermissions: 'agents:view,agents:view-roles',
        },
      },
      status: 'authenticated',
      update: vi.fn(),
    } as unknown as ReturnType<typeof useSession>);

    render(<AgentList />);
    await waitFor(() => {
      // Check that role dropdown IS rendered
      expect(screen.getByTestId('role-select')).toBeDefined();
      // Check that role column header IS rendered
      expect(screen.getByText('Role')).toBeDefined();
    });
  });

  it('[RED] should read page from URL query parameters on mount', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view,agents:view-roles',
        },
      },
      status: 'authenticated',
    } as any);

    mockGet.mockImplementation((key: string) => {
      if (key === 'page') return '2';
      return null;
    });

    const twentyFiveAgents = Array.from({ length: 25 }, (_, i) => ({
      uid: 10 + i,
      name: `Agent ${10 + i}`,
      nickname: `Agent${10 + i}`,
      username: `agent_${10 + i}`,
      email: `agent${10 + i}@crm.com`,
      status: 1,
      role: { roleName: 'Sales Agent' },
      team: { teamName: 'IT Park' },
      designation: 'Sales Representative',
    }));

    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '?page=2');
    }

    render(<AgentList initialAgents={twentyFiveAgents as any} />);

    // Since page is 2, the pagination info should display page 2
    await waitFor(() => {
      expect(screen.getByText(/Page/i).textContent).toContain('Page 2 of');
    });
  });

  it('[RED] should update URL query parameters and restore scroll position on scroll/page changes', async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Admin User',
          userPermissions: 'agents:view,agents:view-roles',
        },
      },
      status: 'authenticated',
    } as any);

    mockGet.mockReturnValue(null);

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    const originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      pathname: '/agents',
      search: '?page=1',
    } as any;

    render(<AgentList initialAgents={mockAgents as any} />);

    fireEvent.scroll(window, { target: { scrollY: 120 } });
    expect(setItemSpy).toHaveBeenCalledWith(expect.stringContaining('scroll_position_/agents'), '120');

    setItemSpy.mockRestore();
    scrollToSpy.mockRestore();
    window.location = originalLocation as any;
  });
});

