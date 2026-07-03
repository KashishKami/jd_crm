// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import NewAgentForm from '../components/NewAgentForm';
import EditAgentForm from '../components/EditAgentForm';
import { AgentDetail } from '../types/agent';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

const mockTeams = [{ teamId: 1, teamName: 'IT Park' }];
const mockRoles = [
  { roleId: 1, roleName: 'Super Admin' },
  { roleId: 8, roleName: 'Agent' },
];
const mockDesignations = [{ designationId: 1, designationName: 'Sales Associate' }];

const mockAgent: AgentDetail = {
  uid: 10,
  name: 'John Doe',
  nickname: 'JD',
  username: 'johndoe',
  email: 'johndoe@example.com',
  mobile: '9876543210',
  gender: '0',
  status: 1,
  age: 28,
  designation: 'Sales Associate',
  dateOfJoining: '2026-01-01T00:00:00.000Z',
  agentId: 'AG102',
  agentTarget: '5000',
  agentSalary: '3000',
  teamId: 1,
  roleId: 8,
  team: {
    teamId: 1,
    teamName: 'IT Park',
    teamCreated: new Date(),
  },
  role: {
    roleId: 8,
    roleName: 'Agent',
    roleCreated: new Date(),
  },
  profile: null,
  academicRecord: [],
  professionalRecord: [],
};

describe('Agent Forms Role Locking Tests', () => {
  describe('NewAgentForm Component', () => {
    it('should show Role Assignment to a Super Admin user', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Super Admin User',
            userPermissions: 'super-admin,agents:create',
          },
        },
        status: 'authenticated',
      } as any);

      render(
        <NewAgentForm
          teams={mockTeams}
          roles={mockRoles}
          designations={mockDesignations}
        />
      );

      expect(screen.queryByText('Role Assignment *')).not.toBeNull();
    });

    it('should hide Role Assignment from a regular Admin/Agent user without super-admin permission', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '2',
            name: 'Regular Admin',
            userPermissions: 'agents:create',
          },
        },
        status: 'authenticated',
      } as any);

      render(
        <NewAgentForm
          teams={mockTeams}
          roles={mockRoles}
          designations={mockDesignations}
        />
      );

      expect(screen.queryByText('Role Assignment *')).toBeNull();
    });
  });

  describe('EditAgentForm Component', () => {
    it('should show Role Assignment to a Super Admin user', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Super Admin User',
            userPermissions: 'super-admin,agents:edit',
          },
        },
        status: 'authenticated',
      } as any);

      render(
        <EditAgentForm
          agent={mockAgent}
          teams={mockTeams}
          roles={mockRoles}
          designations={mockDesignations}
        />
      );

      expect(screen.queryByText('Role Assignment *')).not.toBeNull();
    });

    it('should hide Role Assignment from a regular user without super-admin permission', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '2',
            name: 'Regular Agent',
            userPermissions: 'agents:edit',
          },
        },
        status: 'authenticated',
      } as any);

      render(
        <EditAgentForm
          agent={mockAgent}
          teams={mockTeams}
          roles={mockRoles}
          designations={mockDesignations}
        />
      );

      expect(screen.queryByText('Role Assignment *')).toBeNull();
    });
  });
});
