import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Follow-Ups Database Schema Integration (W-3101)', () => {
  it('should verify that the crm_follow_ups table exists', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
        AND table_name = 'crm_follow_ups'
    `;
    
    const count = Number(result[0]?.count ?? result[0]?.COUNT ?? 0);
    
    expect(count).toBe(1);
  });
});

describe('Follow-Ups Permissions Seeding (W-3102)', () => {
  it('should verify that follow-ups permissions exist and are mapped to correct roles', async () => {
    const permissions = await prisma.crmPermissions.findMany({
      where: {
        permissionName: {
          in: ['follow-ups:view-all', 'follow-ups:view-team', 'follow-ups:create'],
        },
      },
      include: {
        roles: true,
      },
    });
    
    expect(permissions.length).toBe(3);
    
    const viewAllPermission = permissions.find(p => p.permissionName === 'follow-ups:view-all');
    const viewTeamPermission = permissions.find(p => p.permissionName === 'follow-ups:view-team');
    const createPermission = permissions.find(p => p.permissionName === 'follow-ups:create');
    
    expect(viewAllPermission).toBeDefined();
    expect(viewTeamPermission).toBeDefined();
    expect(createPermission).toBeDefined();
    
    // Super Admin is role 1, Admin is role 2, Manager is role 3, Team Lead is role 4, Agent is role 8
    const viewAllRoleIds = viewAllPermission?.roles.map(r => r.roleId) ?? [];
    const viewTeamRoleIds = viewTeamPermission?.roles.map(r => r.roleId) ?? [];
    const createRoleIds = createPermission?.roles.map(r => r.roleId) ?? [];
    
    expect(viewAllRoleIds).toContain(1);
    expect(viewAllRoleIds).toContain(2);
    expect(viewAllRoleIds).not.toContain(8); // agent should not have view all
    
    expect(viewTeamRoleIds).toContain(1);
    expect(viewTeamRoleIds).toContain(2);
    expect(viewTeamRoleIds).toContain(3);
    expect(viewTeamRoleIds).toContain(4);

    expect(createRoleIds).toContain(1);
    expect(createRoleIds).toContain(2);
    expect(createRoleIds).toContain(8); // agent should have create own
  });
});

// @ts-ignore
import * as followupRepository from '../repository/followup.repository';

describe('Follow-Up Repository Layer (W-3104)', () => {
  let testAgentId: number;
  let testFollowUpId: number;

  beforeAll(async () => {
    // Find a seeded agent
    const agent = await prisma.users.findFirst({
      where: {
        roleId: 8
      }
    });
    if (!agent) {
      throw new Error('No agent user found in database.');
    }
    testAgentId = agent.uid;
  });

  it('should successfully create a new follow-up record', async () => {
    const data = {
      agentId: testAgentId,
      agentName: 'Sarah',
      customerName: 'W-3104 Customer',
      customerPhone: '5551234567',
      customerState: 'California',
      customerCountry: 'USA',
      customerTimezone: 'America/Los_Angeles',
      vehicleYearMakeModel: '2020 Toyota Camry',
      partRequired: 'Engine',
      quotedOptions: '$450 - 60k miles / 30 day warranty',
      followUpDate: new Date('2026-09-01'),
      followUpTime: '14:00',
      followUpReason: 'Waiting for paycheck',
      status: 'Interested',
      priority: 'High',
      notes: 'Initial call notes'
    };

    const created = await followupRepository.create(data);
    expect(created).toBeDefined();
    expect(created.followUpId).toBeGreaterThan(0);
    expect(created.customerName).toBe('W-3104 Customer');
    expect(created.entryDate).toBeDefined();
    expect(created.lastContact).toBeDefined();
    expect(created.notificationSentAt).toBeNull();

    testFollowUpId = created.followUpId;
  });

  it('should find follow-up by ID', async () => {
    const record = await followupRepository.findById(testFollowUpId);
    expect(record).toBeDefined();
    expect(record?.customerName).toBe('W-3104 Customer');
    expect(record?.agent).toBeDefined();
    expect(record?.agent.uid).toBe(testAgentId);
  });

  it('should find all follow-ups with filters', async () => {
    const result = await followupRepository.findAll({
      agentId: testAgentId,
      status: 'Interested',
      page: 1,
      limit: 10
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.followUps.length).toBeGreaterThanOrEqual(1);
    expect(result.followUps[0].customerName).toBe('W-3104 Customer');
  });

  it('should update follow-up record', async () => {
    const updated = await followupRepository.update(testFollowUpId, {
      notes: 'Updated note content'
    });

    expect(updated.notes).toBe('Updated note content');
  });

  it('should delete follow-up record', async () => {
    const deleted = await followupRepository.delete(testFollowUpId);
    expect(deleted.followUpId).toBe(testFollowUpId);

    const record = await followupRepository.findById(testFollowUpId);
    expect(record).toBeNull();
  });
});

describe('Follow-Up API Endpoints (W-3106 & W-3107)', () => {
  let testAgentId: number;
  let testAdminId: number;
  let testFollowUpId: number;

  beforeAll(async () => {
    const agent = await prisma.users.findFirst({
      where: { roleId: 8 }
    });
    testAgentId = agent!.uid;

    const admin = await prisma.users.findFirst({
      where: { roleId: 1 }
    });
    testAdminId = admin!.uid;
  });

  it('should return 401 Unauthorized if no session present', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    // @ts-ignore
    const { GET } = await import('../app/api/follow-ups/route');
    const req = new Request('http://localhost/api/follow-ups');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('should return 403 Forbidden if user lacks permissions', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'agents:view' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/follow-ups/route');
    const req = new Request('http://localhost/api/follow-ups');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('should create a new follow-up via POST /api/follow-ups', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'follow-ups:create' }
    });

    // @ts-ignore
    const { POST } = await import('../app/api/follow-ups/route');
    const req = new Request('http://localhost/api/follow-ups', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'API Customer',
        customerState: 'California',
        customerCountry: 'USA',
        vehicleYearMakeModel: '2019 Honda Civic',
        partRequired: 'Engine',
        followUpDate: '2026-09-10',
        followUpTime: '10:00',
        followUpReason: 'Sent invoice',
        status: 'Interested',
        priority: 'Medium',
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.followUpId).toBeDefined();
    expect(data.customerTimezone).toBe('America/Los_Angeles');

    testFollowUpId = data.followUpId;
  });

  it('should get follow-up details via GET /api/follow-ups/[id]', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'follow-ups:create' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/follow-ups/[id]/route');
    const req = new Request(`http://localhost/api/follow-ups/${testFollowUpId}`);
    const res = await GET(req, { params: Promise.resolve({ id: String(testFollowUpId) }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.customerName).toBe('API Customer');
  });

  it('should list due followups via GET /api/follow-ups/due', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'follow-ups:create' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/follow-ups/due/route');
    const req = new Request('http://localhost/api/follow-ups/due');
    const res = await GET(req);

    // Should return 200, array could be empty since we mocked now / date is in future
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should delete follow-up via DELETE /api/follow-ups/[id] only if admin', async () => {
    // Agent delete -> 403 Forbidden
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'follow-ups:create' }
    });
    // @ts-ignore
    const { DELETE } = await import('../app/api/follow-ups/[id]/route');
    const req1 = new Request(`http://localhost/api/follow-ups/${testFollowUpId}`);
    const res1 = await DELETE(req1, { params: Promise.resolve({ id: String(testFollowUpId) }) });
    expect(res1.status).toBe(403);

    // Admin delete -> 200 OK
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'Admin', userPermissions: 'follow-ups:view-all' }
    });
    const req2 = new Request(`http://localhost/api/follow-ups/${testFollowUpId}`);
    const res2 = await DELETE(req2, { params: Promise.resolve({ id: String(testFollowUpId) }) });
    expect(res2.status).toBe(200);
  });
});

describe('Follow-Ups Search (W-3154)', () => {
  let testAgentId: number;

  beforeAll(async () => {
    const agent = await prisma.users.findFirst({
      where: { roleId: 8 }
    });
    testAgentId = agent!.uid;

    await prisma.crmFollowUps.deleteMany({
      where: { agentId: testAgentId }
    });

    // Seed some distinct search targets
    await prisma.crmFollowUps.createMany({
      data: [
        {
          agentId: testAgentId,
          agentName: 'Sarah',
          customerName: 'UniqueSearchNameApple',
          customerPhone: '111-222-3333',
          customerState: 'California',
          customerCountry: 'USA',
          customerTimezone: 'America/Los_Angeles',
          vehicleYearMakeModel: '2020 Toyota Camry',
          partRequired: 'Engine',
          followUpDate: new Date('2026-09-01'),
          followUpTime: '14:00',
          followUpReason: 'Reason 1',
          status: 'Interested',
          priority: 'High',
        },
        {
          agentId: testAgentId,
          agentName: 'Sarah',
          customerName: 'UniqueSearchNameBanana',
          customerPhone: '444-555-6666',
          customerState: 'Texas',
          customerCountry: 'USA',
          customerTimezone: 'America/Chicago',
          vehicleYearMakeModel: '2020 Toyota Camry',
          partRequired: 'Engine',
          followUpDate: new Date('2026-09-01'),
          followUpTime: '14:00',
          followUpReason: 'Reason 2',
          status: 'Interested',
          priority: 'High',
        }
      ]
    });
  });

  afterAll(async () => {
    await prisma.crmFollowUps.deleteMany({
      where: { agentId: testAgentId }
    });
  });

  it('should filter by customerName via search query param', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'follow-ups:view-all' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/follow-ups/route');
    const req = new Request('http://localhost/api/follow-ups?search=Apple');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.followUps.length).toBe(1);
    expect(data.followUps[0].customerName).toBe('UniqueSearchNameApple');
  });

  it('should filter by customerPhone via search query param', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'follow-ups:view-all' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/follow-ups/route');
    const req = new Request('http://localhost/api/follow-ups?search=444-555');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.followUps.length).toBe(1);
    expect(data.followUps[0].customerName).toBe('UniqueSearchNameBanana');
  });

  it('should filter by multiple comma-separated statuses (W-3602)', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'follow-ups:view-all' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/follow-ups/route');
    const req = new Request('http://localhost/api/follow-ups?status=Interested,Call+Back+Later');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    const statuses = data.followUps.map((f: any) => f.status);
    expect(statuses.length).toBeGreaterThan(0);
    expect(statuses.every((s: string) => ['Interested', 'Call Back Later'].includes(s))).toBe(true);
  });
});

describe('W-3701 Persistent Overdue Notification API', () => {
  let testAgentId: number;
  let otherAgentId: number;

  beforeAll(async () => {
    const agents = await prisma.users.findMany({
      where: { roleId: 8 },
      take: 2
    });
    testAgentId = agents[0].uid;
    otherAgentId = agents[1] ? agents[1].uid : testAgentId + 999;

    // Clean up test follow ups created during test
    await prisma.crmFollowUps.deleteMany({
      where: { customerName: { startsWith: 'PersistentOverdueTest' } }
    });

    // Past date (overdue)
    const pastDate = new Date('2020-01-01');
    // Future date (not overdue)
    const futureDate = new Date('2099-01-01');

    await prisma.crmFollowUps.createMany({
      data: [
        {
          agentId: testAgentId,
          agentName: 'Sarah',
          customerName: 'PersistentOverdueTest_Overdue1',
          customerPhone: '111-000-0001',
          customerState: 'California',
          customerCountry: 'USA',
          customerTimezone: 'America/Los_Angeles',
          vehicleYearMakeModel: '2020 Honda Civic',
          partRequired: 'Transmission',
          followUpDate: pastDate,
          followUpTime: '09:00',
          followUpReason: 'Test Overdue 1',
          status: 'Interested',
          priority: 'High',
          notificationSentAt: new Date(), // Already notified toast, but STILL active overdue!
        },
        {
          agentId: testAgentId,
          agentName: 'Sarah',
          customerName: 'PersistentOverdueTest_SaleClosed',
          customerPhone: '111-000-0002',
          customerState: 'California',
          customerCountry: 'USA',
          customerTimezone: 'America/Los_Angeles',
          vehicleYearMakeModel: '2020 Honda Civic',
          partRequired: 'Engine',
          followUpDate: pastDate,
          followUpTime: '09:00',
          followUpReason: 'Closed deal',
          status: 'Sale Closed',
          priority: 'High',
        },
        {
          agentId: testAgentId,
          agentName: 'Sarah',
          customerName: 'PersistentOverdueTest_NotInterested',
          customerPhone: '111-000-0003',
          customerState: 'California',
          customerCountry: 'USA',
          customerTimezone: 'America/Los_Angeles',
          vehicleYearMakeModel: '2020 Honda Civic',
          partRequired: 'Door',
          followUpDate: pastDate,
          followUpTime: '09:00',
          followUpReason: 'Not interested',
          status: 'Not Interested',
          priority: 'Low',
        },
        {
          agentId: testAgentId,
          agentName: 'Sarah',
          customerName: 'PersistentOverdueTest_Future',
          customerPhone: '111-000-0004',
          customerState: 'California',
          customerCountry: 'USA',
          customerTimezone: 'America/Los_Angeles',
          vehicleYearMakeModel: '2020 Honda Civic',
          partRequired: 'Mirror',
          followUpDate: futureDate,
          followUpTime: '09:00',
          followUpReason: 'Future follow up',
          status: 'Interested',
          priority: 'Medium',
        },
        {
          agentId: otherAgentId,
          agentName: 'OtherAgent',
          customerName: 'PersistentOverdueTest_OtherAgent',
          customerPhone: '111-000-0005',
          customerState: 'California',
          customerCountry: 'USA',
          customerTimezone: 'America/Los_Angeles',
          vehicleYearMakeModel: '2020 Honda Civic',
          partRequired: 'Bumper',
          followUpDate: pastDate,
          followUpTime: '09:00',
          followUpReason: 'Other agent overdue',
          status: 'Interested',
          priority: 'High',
        },
      ]
    });
  });

  afterAll(async () => {
    await prisma.crmFollowUps.deleteMany({
      where: { customerName: { startsWith: 'PersistentOverdueTest' } }
    });
  });

  it('should return active overdue follow-ups for logged in agent via GET /api/follow-ups/overdue, excluding Sale Closed, Not Interested, and Future items', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'Sarah', userPermissions: 'follow-ups:create' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/follow-ups/overdue/route');
    const req = new Request('http://localhost/api/follow-ups/overdue');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const dueList = await res.json();
    expect(Array.isArray(dueList)).toBe(true);

    const testNames = dueList.map((f: any) => f.customerName);
    // Should include PersistentOverdueTest_Overdue1
    expect(testNames).toContain('PersistentOverdueTest_Overdue1');
    // Should NOT include Sale Closed, Not Interested, Future, or Other Agent items
    expect(testNames).not.toContain('PersistentOverdueTest_SaleClosed');
    expect(testNames).not.toContain('PersistentOverdueTest_NotInterested');
    expect(testNames).not.toContain('PersistentOverdueTest_Future');
    expect(testNames).not.toContain('PersistentOverdueTest_OtherAgent');
  });
});




