import { describe, it, expect, beforeAll, vi } from 'vitest';
import { getServerSession } from 'next-auth';
import { prisma } from '../lib/db';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Call Dispositions API Integration tests (W-3301)', () => {
  let testAdminId: number;
  let testAgentId: number;
  let otherAgentId: number;
  let testAgentTeamId: number = 1; // Seeded team IT Park is id 1
  let createdCallId: number;

  beforeAll(async () => {
    // Ensure we have users with correct roles.
    // Super Admin / Admin has call-dispositions:view (60) and call-dispositions:create (61)
    // Agent has call-dispositions:create (61) only
    
    // Clean up old test dispositions first to avoid FK constraints
    await prisma.crmCallDispositions.deleteMany({
      where: {
        agent: {
          username: { in: ['cd_test_admin', 'cd_test_agent', 'cd_other_agent'] }
        }
      }
    });

    // Clean up old test users if any
    await prisma.users.deleteMany({
      where: {
        username: { in: ['cd_test_admin', 'cd_test_agent', 'cd_other_agent'] }
      }
    });

    const adminUser = await prisma.users.create({
      data: {
        name: 'CD Test Admin',
        nickname: 'CD Admin',
        username: 'cd_test_admin',
        email: 'cd_admin@example.com',
        roleId: 2, // Admin
        teamId: 1, // IT Park
      }
    });
    testAdminId = adminUser.uid;

    const agentUser = await prisma.users.create({
      data: {
        name: 'CD Test Agent',
        nickname: 'CD Agent',
        username: 'cd_test_agent',
        email: 'cd_agent@example.com',
        roleId: 8, // Agent
        teamId: 1, // IT Park
      }
    });
    testAgentId = agentUser.uid;

    const otherUser = await prisma.users.create({
      data: {
        name: 'CD Other Agent',
        nickname: 'Other Agent',
        username: 'cd_other_agent',
        email: 'cd_other@example.com',
        roleId: 8, // Agent
        teamId: 1, // IT Park
      }
    });
    otherAgentId = otherUser.uid;
  });

  it('Test 1: GET /api/call-dispositions with no session returns 401 Unauthorized', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);

    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('Test 2: GET /api/call-dispositions with a session having neither permission returns 403 Forbidden', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', userPermissions: 'none:permission' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions');
    const res = await GET(req);

    expect(res.status).toBe(403);
  });

  it('Test 3: GET /api/call-dispositions with testAdmin session returns 200 OK and empty dispositions list', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'CD Admin', userPermissions: 'call-dispositions:view,call-dispositions:create' }
    });

    // Clear any existing call dispositions before starting
    await prisma.$executeRawUnsafe('TRUNCATE TABLE crm_call_dispositions');

    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.dispositions).toEqual([]);
    expect(data.total).toBe(0);
  });

  it('Test 4: POST /api/call-dispositions with testAgent session returns 201 Created and saves to DB', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { POST } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions', {
      method: 'POST',
      body: JSON.stringify({
        customerPhone: '555-123-4567',
        disposition: 'Wrong Number'
      })
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const responseData = await res.json();
    expect(responseData.disposition).toBeDefined();
    expect(responseData.disposition.callId).toBeGreaterThan(0);
    
    createdCallId = responseData.disposition.callId;

    // Assert row in DB
    const dbRow = await prisma.$queryRaw<any[]>`
      SELECT * FROM crm_call_dispositions WHERE call_id = ${createdCallId}
    `;
    expect(dbRow.length).toBe(1);
    expect(Number(dbRow[0].agent_id)).toBe(testAgentId);
    expect(Number(dbRow[0].team_id)).toBe(testAgentTeamId);
    expect(dbRow[0].customer_name).toBeNull();
    expect(dbRow[0].customer_phone).toBe('555-123-4567');
    expect(dbRow[0].disposition).toBe('Wrong Number');
  });

  it('Test 5: POST /api/call-dispositions formats phone and sets customer name', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { POST } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions', {
      method: 'POST',
      body: JSON.stringify({
        customerPhone: '5551234567',
        customerName: 'John Doe',
        disposition: 'Price Quoted'
      })
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const responseData = await res.json();
    
    // Assert formatted phone and name in DB
    const dbRow = await prisma.$queryRaw<any[]>`
      SELECT * FROM crm_call_dispositions WHERE call_id = ${responseData.disposition.callId}
    `;
    expect(dbRow[0].customer_phone).toBe('555-123-4567');
    expect(dbRow[0].customer_name).toBe('John Doe');
  });

  it('Test 6: POST /api/call-dispositions overrides agentId, agentName, teamId from session', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { POST } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions', {
      method: 'POST',
      body: JSON.stringify({
        agentId: 9999,
        agentName: 'Fake Agent',
        teamId: 9999,
        customerPhone: '555-000-0000',
        disposition: 'Spam Call'
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const responseData = await res.json();

    const dbRow = await prisma.$queryRaw<any[]>`
      SELECT * FROM crm_call_dispositions WHERE call_id = ${responseData.disposition.callId}
    `;
    expect(Number(dbRow[0].agent_id)).toBe(testAgentId);
    expect(dbRow[0].agent_name).toBe('CD Agent');
    expect(Number(dbRow[0].team_id)).toBe(testAgentTeamId);
  });

  it('Test 7: POST /api/call-dispositions without customerPhone returns 400 Bad Request', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { POST } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions', {
      method: 'POST',
      body: JSON.stringify({
        disposition: 'Wrong Number'
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Test 8: POST /api/call-dispositions without disposition returns 400 Bad Request', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { POST } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions', {
      method: 'POST',
      body: JSON.stringify({
        customerPhone: '555-123-4567'
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Test 9: POST /api/call-dispositions with invalid disposition value returns 400 Bad Request', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { POST } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions', {
      method: 'POST',
      body: JSON.stringify({
        customerPhone: '555-123-4567',
        disposition: 'InvalidValue'
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Test 10: POST /api/call-dispositions with session having neither permission returns 403 Forbidden', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'none:permission' }
    });

    // @ts-ignore
    const { POST } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions', {
      method: 'POST',
      body: JSON.stringify({
        customerPhone: '555-123-4567',
        disposition: 'Wrong Number'
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('Test 11 & 12: GET /api/call-dispositions filters by agent ownership based on permissions', async () => {
    // Clear and create two specific records
    await prisma.$executeRawUnsafe('TRUNCATE TABLE crm_call_dispositions');
    
    // Direct SQL insert to avoid going through API limits
    await prisma.$executeRawUnsafe(`
      INSERT INTO crm_call_dispositions (customer_phone, agent_id, agent_name, team_id, disposition, created_at, updated_at) 
      VALUES 
      ('555-111-1111', ${testAgentId}, 'CD Agent', ${testAgentTeamId}, 'Wrong Number', NOW(), NOW()),
      ('555-222-2222', ${otherAgentId}, 'Other Agent', ${testAgentTeamId}, 'Spam Call', NOW(), NOW())
    `);

    // Test 11: Agent session sees only their own
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/route');
    let req = new Request('http://localhost/api/call-dispositions');
    let res = await GET(req);
    expect(res.status).toBe(200);
    let data = await res.json();
    expect(data.total).toBe(1);
    expect(data.dispositions[0].customerPhone).toBe('555-111-1111');

    // Test 12: Admin session sees both
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'CD Admin', teamId: testAgentTeamId, userPermissions: 'call-dispositions:view,call-dispositions:create' }
    });

    req = new Request('http://localhost/api/call-dispositions');
    res = await GET(req);
    expect(res.status).toBe(200);
    data = await res.json();
    expect(data.total).toBe(2);
  });

  it('Test 13: GET /api/call-dispositions?disposition=Wrong+Number with Admin session filters correctly', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'CD Admin', teamId: testAgentTeamId, userPermissions: 'call-dispositions:view,call-dispositions:create' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions?disposition=Wrong+Number');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(1);
    expect(data.dispositions[0].disposition).toBe('Wrong Number');
  });

  it('Test 14: GET /api/call-dispositions?dateFrom=...&dateTo=... filters by date', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'CD Admin', teamId: testAgentTeamId, userPermissions: 'call-dispositions:view,call-dispositions:create' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/route');
    const req = new Request('http://localhost/api/call-dispositions?dateFrom=2025-01-01&dateTo=2025-01-31');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    // Since records were inserted with NOW() (2026), these 2025 boundaries should yield 0 records.
    expect(data.total).toBe(0);
  });

  it('Test 15: GET /api/call-dispositions?agentId=... with Admin session filters by agent', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'CD Admin', teamId: testAgentTeamId, userPermissions: 'call-dispositions:view,call-dispositions:create' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/route');
    const req = new Request(`http://localhost/api/call-dispositions?agentId=${testAgentId}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(1);
    expect(Number(data.dispositions[0].agentId)).toBe(testAgentId);
  });

  it('Test 16: GET /api/call-dispositions?agentId=... with Agent session ignores agentId parameter', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // Agent attempts to query otherAgentId
    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/route');
    const req = new Request(`http://localhost/api/call-dispositions?agentId=${otherAgentId}`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    // Should still return only the record belonging to testAgentId
    expect(data.total).toBe(1);
    expect(Number(data.dispositions[0].agentId)).toBe(testAgentId);
  });

  it('Test 17: PATCH /api/call-dispositions/:id update owner works', async () => {
    // Find the record of testAgentId
    const agentRecords = await prisma.$queryRaw<any[]>`
      SELECT call_id FROM crm_call_dispositions WHERE agent_id = ${testAgentId} LIMIT 1
    `;
    const callId = agentRecords[0].call_id;

    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { PATCH } = await import('../app/api/call-dispositions/[id]/route');
    const req = new Request(`http://localhost/api/call-dispositions/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        customerName: 'Jane Doe'
      })
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: String(callId) }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.disposition.customerName).toBe('Jane Doe');

    // Confirm in DB
    const dbRow = await prisma.$queryRaw<any[]>`
      SELECT customer_name FROM crm_call_dispositions WHERE call_id = ${callId}
    `;
    expect(dbRow[0].customer_name).toBe('Jane Doe');
  });

  it('Test 18: PATCH /api/call-dispositions/:id from non-owner fails with 403', async () => {
    // Find the record of testAgentId
    const agentRecords = await prisma.$queryRaw<any[]>`
      SELECT call_id FROM crm_call_dispositions WHERE agent_id = ${testAgentId} LIMIT 1
    `;
    const callId = agentRecords[0].call_id;

    // otherAgent tries to update
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: otherAgentId, nickname: 'Other Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { PATCH } = await import('../app/api/call-dispositions/[id]/route');
    const req = new Request(`http://localhost/api/call-dispositions/${callId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        customerName: 'Hack Attempt'
      })
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: String(callId) }) });
    expect(res.status).toBe(403);
  });

  it('Test 19: PATCH /api/call-dispositions/:id with non-existent id returns 404', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'CD Admin', teamId: testAgentTeamId, userPermissions: 'call-dispositions:view,call-dispositions:create' }
    });

    // @ts-ignore
    const { PATCH } = await import('../app/api/call-dispositions/[id]/route');
    const req = new Request('http://localhost/api/call-dispositions/99999', {
      method: 'PATCH',
      body: JSON.stringify({
        customerName: 'New name'
      })
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: '99999' }) });
    expect(res.status).toBe(404);
  });

  it('Test 20 & 21: DELETE /api/call-dispositions/:id handles permissions and deletes', async () => {
    // Find the record of testAgentId
    const agentRecords = await prisma.$queryRaw<any[]>`
      SELECT call_id FROM crm_call_dispositions WHERE agent_id = ${testAgentId} LIMIT 1
    `;
    const callId = agentRecords[0].call_id;

    // Test 21: Agent fails to delete
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { DELETE } = await import('../app/api/call-dispositions/[id]/route');
    let req = new Request(`http://localhost/api/call-dispositions/${callId}`, { method: 'DELETE' });
    let res = await DELETE(req, { params: Promise.resolve({ id: String(callId) }) });
    expect(res.status).toBe(403);

    // Test 20: Admin succeeds to delete
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'CD Admin', teamId: testAgentTeamId, userPermissions: 'call-dispositions:view,call-dispositions:create' }
    });

    res = await DELETE(req, { params: Promise.resolve({ id: String(callId) }) });
    expect(res.status).toBe(200);

    const dbRow = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM crm_call_dispositions WHERE call_id = ${callId}
    `;
    expect(Number(dbRow[0].count ?? dbRow[0].COUNT ?? 0)).toBe(0);
  });

  it('Test 22 & 23: GET /api/call-dispositions/export enforces admin permissions', async () => {
    // Test 23: Agent session returns 403
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAgentId, nickname: 'CD Agent', teamId: testAgentTeamId, userPermissions: 'call-dispositions:create' }
    });

    // @ts-ignore
    const { GET } = await import('../app/api/call-dispositions/export/route');
    let req = new Request('http://localhost/api/call-dispositions/export');
    let res = await GET(req);
    expect(res.status).toBe(403);

    // Test 22: Admin session returns 200 with Excel content headers
    vi.mocked(getServerSession).mockResolvedValueOnce({
      user: { id: testAdminId, nickname: 'CD Admin', teamId: testAgentTeamId, userPermissions: 'call-dispositions:view,call-dispositions:create' }
    });

    res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="call-dispositions-export.xlsx"');
  });
});
