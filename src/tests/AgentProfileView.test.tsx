// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { useSession } from 'next-auth/react';
import AgentProfileView from '../components/AgentProfileView';
import { AgentDetail } from '../types/agent';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

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
  profile: {
    profileId: 1,
    profileUserId: 10,
    profileLocalAddress: '123 Street',
    profilePermanentAddress: '456 Avenue',
    profileAlternatePhone: '9999999999',
    profileDob: '1998-05-15',
    profilePan: 'ABCDE1234F',
    profileAadhar: '123456789012',
    profileBankAccount: '111222333',
    profileBankName: 'Big Bank',
    profileBankIfsc: 'IFSC001',
    profileEmergencyContactName: 'Jane Doe',
    profileEmergencyContactRelation: 'Spouse',
    profileEmergencyContactNumber: '8888888888',
    profileUpdatedAt: new Date(),
  },
  academicRecord: [
    {
      academicId: 1,
      academicUserId: 10,
      academicStandard: '12th',
      academicInstitute: 'Oxford High School',
      academicSpecialization: 'Science',
      academicYearFrom: '2014',
      academicYearTo: '2016',
    }
  ],
  professionalRecord: [
    {
      professionalId: 1,
      professionalUserId: 10,
      professionalOrganization: 'Old Tech Corp',
      professionalDesignation: 'Junior Associate',
      professionalSalary: '1500',
      professionalYearFrom: '2020',
      professionalYearTo: '2022',
      professionalExperiance: 'Handled customer queries',
      professionalCreatedAt: new Date(),
    }
  ]
};

describe('AgentProfileView Component Unit Tests', () => {
  it('should render lock placeholders and restricted banners when session lacks agents:view-details permission', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Restricted Manager',
          userPermissions: 'agents:view', // Lacks agents:view-details
        },
      },
      status: 'authenticated',
    } as any);

    render(<AgentProfileView agent={mockAgent} />);

    // Basic Info tab should show basic non-sensitive fields
    expect(screen.getByText('John Doe')).not.toBeNull();
    expect(screen.getByText('johndoe')).not.toBeNull();

    // Click on Academic Record Tab
    const academicTabBtn = screen.getByRole('button', { name: /Academic Record/i });
    fireEvent.click(academicTabBtn);

    // Should show Restricted Banner and NOT the mock institute name
    expect(screen.getByText('Access Restricted')).not.toBeNull();
    expect(screen.queryByText('Oxford High School')).toBeNull();

    // Click on Work History Tab
    const workTabBtn = screen.getByRole('button', { name: /Work History/i });
    fireEvent.click(workTabBtn);

    // Should show Restricted Banner and NOT the mock organization name
    expect(screen.getByText('Access Restricted')).not.toBeNull();
    expect(screen.queryByText('Old Tech Corp')).toBeNull();

    // Click on Bank & Emergency Tab
    const bankTabBtn = screen.getByRole('button', { name: /Bank & Emergency/i });
    fireEvent.click(bankTabBtn);

    // Should show Restricted Banner and NOT the bank account number
    expect(screen.getByText('Access Restricted')).not.toBeNull();
    expect(screen.queryByText('111222333')).toBeNull();
  });

  it('should render full details and tabs successfully when session has agents:view-details permission', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Admin User',
          userPermissions: 'agents:view,agents:view-details', // Has both permissions
        },
      },
      status: 'authenticated',
    } as any);

    render(<AgentProfileView agent={mockAgent} />);

    // Click on Academic Record Tab
    const academicTabBtn = screen.getByRole('button', { name: /Academic Record/i });
    fireEvent.click(academicTabBtn);

    // Should show mock institute name and NOT "Access Restricted"
    expect(screen.queryByText('Access Restricted')).toBeNull();
    expect(screen.getByText('Oxford High School')).not.toBeNull();

    // Click on Work History Tab
    const workTabBtn = screen.getByRole('button', { name: /Work History/i });
    fireEvent.click(workTabBtn);

    // Should show mock organization name and NOT "Access Restricted"
    expect(screen.queryByText('Access Restricted')).toBeNull();
    expect(screen.getByText('Old Tech Corp')).not.toBeNull();

    // Click on Bank & Emergency Tab
    const bankTabBtn = screen.getByRole('button', { name: /Bank & Emergency/i });
    fireEvent.click(bankTabBtn);

    // Should show bank details and NOT "Access Restricted"
    expect(screen.queryByText('Access Restricted')).toBeNull();
    expect(screen.getByText('Big Bank')).not.toBeNull();
    expect(screen.getByText('111222333')).not.toBeNull();
  });

  it('should render full details and edit button successfully when session lacks permissions but user is viewing their own profile (isSelf)', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: '10', // Matches mockAgent.uid (isSelf = true)
          name: 'John Doe',
          userPermissions: 'agents:view', // Lacks agents:view-details and agents:edit
        },
      },
      status: 'authenticated',
    } as any);

    render(<AgentProfileView agent={mockAgent} />);

    // Edit Profile button should be visible since it is their own profile
    expect(screen.getByRole('link', { name: /Edit Profile/i })).not.toBeNull();

    // Click on Academic Record Tab
    const academicTabBtn = screen.getByRole('button', { name: /Academic Record/i });
    fireEvent.click(academicTabBtn);

    // Should show details and NOT "Access Restricted" because it's their own profile
    expect(screen.queryByText('Access Restricted')).toBeNull();
    expect(screen.getByText('Oxford High School')).not.toBeNull();

    // Click on Work History Tab
    const workTabBtn = screen.getByRole('button', { name: /Work History/i });
    fireEvent.click(workTabBtn);

    expect(screen.queryByText('Access Restricted')).toBeNull();
    expect(screen.getByText('Old Tech Corp')).not.toBeNull();

    // Click on Bank & Emergency Tab
    const bankTabBtn = screen.getByRole('button', { name: /Bank & Emergency/i });
    fireEvent.click(bankTabBtn);

    expect(screen.queryByText('Access Restricted')).toBeNull();
    expect(screen.getByText('Big Bank')).not.toBeNull();
    expect(screen.getByText('111222333')).not.toBeNull();
  });
});
