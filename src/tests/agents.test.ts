import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Agent Management CRUD Endpoints Integration Tests', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    // Clean up test users to prevent pollution
    await prisma.users.deleteMany({
      where: {
        username: { in: ['test_agent', 'test_agent_status', 'test_agent_edit'] },
      },
    });
  });

  afterEach(async () => {
    await prisma.users.deleteMany({
      where: {
        username: { in: ['test_agent', 'test_agent_status', 'test_agent_edit'] },
      },
    });
  });

  describe('GET /api/agents', () => {
    it('should return 403 Forbidden if session lacks agents:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'vendors:view', // Lacks agents:view
        },
      });

      const { GET } = await import('../app/api/agents/route');
      const req = new Request('http://localhost/api/agents');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });

    it('should return 200 OK and a JSON array of agents if session has agents:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'agents:view',
        },
      });

      const { GET } = await import('../app/api/agents/route');
      const req = new Request('http://localhost/api/agents');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      // Confirms we have some agents returned (like seeded admin)
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).not.toHaveProperty('password'); // Password must be stripped
    });

    it('should return only inactive agents when status=0 query parameter is provided', async () => {
      // Setup: Create one active and one inactive agent for testing
      // Find a valid role & team to associate them with
      const role = await prisma.crmRoles.findFirst();
      const team = await prisma.crmTeams.findFirst();

      await prisma.users.create({
        data: {
          name: 'Active Test Agent',
          username: 'test_agent',
          status: 1,
          roleId: role!.roleId,
          teamId: team!.teamId,
        },
      });

      await prisma.users.create({
        data: {
          name: 'Inactive Test Agent',
          username: 'test_agent_status',
          status: 0,
          roleId: role!.roleId,
          teamId: team!.teamId,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'agents:view',
        },
      });

      const { GET } = await import('../app/api/agents/route');
      const req = new Request('http://localhost/api/agents?status=0');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      
      // All returned agents should have status === 0
      const hasActive = data.some((agent: { status: number }) => agent.status === 1);
      expect(hasActive).toBe(false);
      const hasInactive = data.some((agent: { username: string }) => agent.username === 'test_agent_status');
      expect(hasInactive).toBe(true);
    });

    it('W-3209: should return agents sorted alphabetically by name: asc', async () => {
      const { findAll } = await import('../repository/agent.repository');
      const agents = await findAll();
      const names = agents.map((a) => a.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });
  });

  describe('POST /api/agents', () => {
    it('should return 403 Forbidden when creating an agent without agents:create permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Restricted User',
          userPermissions: 'agents:view', // Has view but not create
        },
      });

      const { POST } = await import('../app/api/agents/route');
      const req = new Request('http://localhost/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Agent',
          username: 'test_agent',
          password: 'password123',
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
    });

    it('should successfully create an agent and store it in database with a hashed password', async () => {
      const role = await prisma.crmRoles.findFirst();
      const team = await prisma.crmTeams.findFirst();

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Admin User',
          userPermissions: 'agents:create',
        },
      });

      const { POST } = await import('../app/api/agents/route');
      const req = new Request('http://localhost/api/agents', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Test Agent',
          username: 'test_agent',
          password: 'agent_password_123',
          roleId: role!.roleId,
          teamId: team!.teamId,
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
      
      // Assert user is in database
      const dbUser = await prisma.users.findFirst({
        where: { username: 'test_agent' },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.name).toBe('New Test Agent');
      // Password must be hashed (not equal to raw)
      expect(dbUser?.password).not.toBe('agent_password_123');
      expect(dbUser?.password).toMatch(/^\$2[ayb]\$/); // bcrypt format
    });
  });

  describe('PATCH /api/agents/:id/status', () => {
    it('should update the status of the agent in the database to 0 (inactive)', async () => {
      const role = await prisma.crmRoles.findFirst();
      const team = await prisma.crmTeams.findFirst();

      const user = await prisma.users.create({
        data: {
          name: 'Status Test Agent',
          username: 'test_agent_status',
          status: 1,
          roleId: role!.roleId,
          teamId: team!.teamId,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Admin User',
          userPermissions: 'agents:edit',
        },
      });

      const { PATCH } = await import('../app/api/agents/[id]/status/route');
      const req = new Request(`http://localhost/api/agents/${user.uid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 0 }),
      });
      const res = await PATCH(req, { params: { id: String(user.uid) } });

      expect(res.status).toBe(200);

      // Verify DB confirms status = 0
      const dbUser = await prisma.users.findUnique({
        where: { uid: user.uid },
      });
      expect(dbUser?.status).toBe(0);
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should return 403 Forbidden if user lacks agents:view permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '999',
          name: 'Restricted User',
          userPermissions: 'vendors:view', // Lacks agents:view
        },
      });

      const { GET } = await import('../app/api/agents/[id]/route');
      const req = new Request('http://localhost/api/agents/1');
      const res = await GET(req, { params: { id: '1' } });

      expect(res.status).toBe(403);
    });

    it('should return basic info but set personal structures to null if session only has agents:view (lacks agents:view-details)', async () => {
      const role = await prisma.crmRoles.findFirst();
      const team = await prisma.crmTeams.findFirst();

      const user = await prisma.users.create({
        data: {
          name: 'Test Details Agent',
          username: 'test_agent_details',
          status: 1,
          roleId: role!.roleId,
          teamId: team!.teamId,
          profile: {
            create: {
              profileBankAccount: '123456789',
              profileBankName: 'Test Bank',
            }
          },
          academicRecord: {
            create: [
              { academicInstitute: 'Test Institute' }
            ]
          },
          professionalRecord: {
            create: [
              { professionalOrganization: 'Test Corp' }
            ]
          }
        }
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User Only View',
          userPermissions: 'agents:view', // has agents:view but NOT agents:view-details
        },
      });

      const { GET } = await import('../app/api/agents/[id]/route');
      const req = new Request(`http://localhost/api/agents/${user.uid}`);
      const res = await GET(req, { params: { id: String(user.uid) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Test Details Agent');
      expect(data.profile).toBeNull();
      expect(data.academicRecord).toBeNull();
      expect(data.professionalRecord).toBeNull();

      // Cleanup
      await prisma.users.delete({ where: { uid: user.uid } });
    });

    it('should return full details (including profile, academic, and professional records) if session has agents:view-details', async () => {
      const role = await prisma.crmRoles.findFirst();
      const team = await prisma.crmTeams.findFirst();

      const user = await prisma.users.create({
        data: {
          name: 'Test Details Full Agent',
          username: 'test_agent_details_full',
          status: 1,
          roleId: role!.roleId,
          teamId: team!.teamId,
          profile: {
            create: {
              profileBankAccount: '123456789',
              profileBankName: 'Test Bank',
            }
          },
          academicRecord: {
            create: [
              { academicInstitute: 'Test Institute' }
            ]
          },
          professionalRecord: {
            create: [
              { professionalOrganization: 'Test Corp' }
            ]
          }
        }
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User View Details',
          userPermissions: 'agents:view,agents:view-details', // has both
        },
      });

      const { GET } = await import('../app/api/agents/[id]/route');
      const req = new Request(`http://localhost/api/agents/${user.uid}`);
      const res = await GET(req, { params: { id: String(user.uid) } });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Test Details Full Agent');
      expect(data.profile).not.toBeNull();
      expect(data.profile.profileBankAccount).toBe('123456789');
      expect(data.academicRecord.length).toBeGreaterThan(0);
      expect(data.professionalRecord.length).toBeGreaterThan(0);

      // Cleanup
      await prisma.users.delete({ where: { uid: user.uid } });
    });
  });

  describe('AgentsPage Server Component & salesOnly/teamId API Filtering (W-4201 & W-4202)', () => {
    it('W-4201 [RED] should pre-fetch initialAgents with email property in AgentsPage server component', async () => {
      const { default: AgentsPage } = await import('../app/agents/page');
      const pageJsx = await AgentsPage();
      const initialAgents = pageJsx.props.initialAgents;
      expect(initialAgents.length).toBeGreaterThan(0);
      const agentWithEmail = initialAgents.find((a: any) => a.email !== undefined);
      expect(agentWithEmail).toBeDefined();
      expect(agentWithEmail.email).toBeDefined();
    });

    it('W-4202 [RED] should filter agents by salesOnly=true in GET /api/agents backend query', async () => {
      const role = await prisma.crmRoles.findFirst();
      const team = await prisma.crmTeams.findFirst();

      const salesAgent = await prisma.users.create({
        data: {
          name: 'Test Sales Specialist Agent',
          username: 'test_sales_specialist_agent',
          designation: 'Sales Specialist',
          status: 1,
          roleId: role!.roleId,
          teamId: team!.teamId,
        },
      });

      const hrAgent = await prisma.users.create({
        data: {
          name: 'Test HR Manager Agent',
          username: 'test_hr_manager_agent',
          designation: 'HR',
          status: 1,
          roleId: role!.roleId,
          teamId: team!.teamId,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'agents:view',
        },
      });

      const { GET } = await import('../app/api/agents/route');
      const req = new Request('http://localhost/api/agents?salesOnly=true');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      const names = data.map((a: any) => a.name);
      expect(names).toContain('Test Sales Specialist Agent');
      expect(names).not.toContain('Test HR Manager Agent');

      // Cleanup
      await prisma.users.deleteMany({
        where: { uid: { in: [salesAgent.uid, hrAgent.uid] } },
      });
    });

    it('W-4202 [RED] should filter agents by teamId in GET /api/agents backend query', async () => {
      const role = await prisma.crmRoles.findFirst();
      const teams = await prisma.crmTeams.findMany({ take: 2 });
      if (teams.length < 2) return;

      const team1Agent = await prisma.users.create({
        data: {
          name: 'Test Team 1 Agent',
          username: 'test_team1_agent',
          designation: 'Sales Associate',
          status: 1,
          roleId: role!.roleId,
          teamId: teams[0].teamId,
        },
      });

      const team2Agent = await prisma.users.create({
        data: {
          name: 'Test Team 2 Agent',
          username: 'test_team2_agent',
          designation: 'Sales Associate',
          status: 1,
          roleId: role!.roleId,
          teamId: teams[1].teamId,
        },
      });

      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: {
          id: '1',
          name: 'Authorized User',
          userPermissions: 'agents:view',
        },
      });

      const { GET } = await import('../app/api/agents/route');
      const req = new Request(`http://localhost/api/agents?salesOnly=true&teamId=${teams[0].teamId}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      const uids = data.map((a: any) => a.uid);
      expect(uids).toContain(team1Agent.uid);
      expect(uids).not.toContain(team2Agent.uid);

      // Cleanup
      await prisma.users.deleteMany({
        where: { uid: { in: [team1Agent.uid, team2Agent.uid] } },
      });
    });
  });
});

