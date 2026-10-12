import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth';
import * as reportService from '../service/report.service';
import * as reportRepository from '../repository/report.repository';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock('../service/report.service', () => ({
  getAgentSalesMatrix: vi.fn(),
}));

vi.mock('../repository/report.repository', () => ({
  getReportAgentsList: vi.fn(),
  SALES_DESIGNATIONS: [
    'Sales Supervisor',
    'Sales Team Lead',
    'Sales Specialist',
    'Sales Expert',
    'Sales Associate',
    'Backend Specialist',
    'Backend Associate',
  ],
}));

describe('Reports API Controller Integration Tests (W-4402)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/reports/agent-sales', () => {
    it('should return 401 Unauthorized if session is not present', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce(null);

      const { GET } = await import('../app/api/reports/agent-sales/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales');
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should return 403 Forbidden if user lacks reports:agent-sales permission', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 1, userPermissions: ['customers:view'] },
      } as any);

      const { GET } = await import('../app/api/reports/agent-sales/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('should return 403 Forbidden if user only has export permission but lacks reports:agent-sales', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 1, userPermissions: ['reports:agent-sales-export'] },
      } as any);

      const { GET } = await import('../app/api/reports/agent-sales/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales');
      const res = await GET(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('should return 400 Bad Request if range is custom but dates are missing', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 1, userPermissions: ['reports:agent-sales'] },
      } as any);

      const { GET } = await import('../app/api/reports/agent-sales/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales?range=custom');
      const res = await GET(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/startDate and endDate/i);
    });

    it('should parse multi-select teamId and agentId and return matrix data successfully', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 1, userPermissions: ['reports:agent-sales'] },
      } as any);

      const mockResponse = {
        periods: [
          { key: '2026-01', label: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31' },
        ],
        agents: [
          {
            agentId: 101,
            agentName: 'John Doe',
            nickname: 'Johnny',
            teamId: 1,
            teamName: 'IT Park',
            designation: 'Sales Specialist',
            status: 1,
            periods: {
              '2026-01': {
                salesAmount: 10000,
                salesCount: 1,
                refundsAmount: 0,
                refundsCount: 0,
                chargebacksAmount: 0,
                chargebacksCount: 0,
                netSales: 10000,
                netSalesCount: 1,
              },
            },
            grandTotal: {
              salesAmount: 10000,
              salesCount: 1,
              refundsAmount: 0,
              refundsCount: 0,
              chargebacksAmount: 0,
              chargebacksCount: 0,
              netSales: 10000,
              netSalesCount: 1,
            },
          },
        ],
        orgTotal: {
          periods: {
            '2026-01': {
              salesAmount: 10000,
              salesCount: 1,
              refundsAmount: 0,
              refundsCount: 0,
              chargebacksAmount: 0,
              chargebacksCount: 0,
              netSales: 10000,
              netSalesCount: 1,
            },
          },
          grandTotal: {
            salesAmount: 10000,
            salesCount: 1,
            refundsAmount: 0,
            refundsCount: 0,
            chargebacksAmount: 0,
            chargebacksCount: 0,
            netSales: 10000,
            netSalesCount: 1,
          },
        },
      };

      vi.mocked(reportService.getAgentSalesMatrix).mockResolvedValueOnce(mockResponse as any);

      const { GET } = await import('../app/api/reports/agent-sales/route');
      const req = new Request(
        'http://localhost:3080/api/reports/agent-sales?range=monthly&teamId=1,2&agentId=101,102'
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockResponse);

      expect(reportService.getAgentSalesMatrix).toHaveBeenCalledWith({
        range: 'monthly',
        teamIds: [1, 2],
        agentIds: [101, 102],
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  describe('GET /api/reports/filters', () => {
    it('should return dynamically filtered agents by teamIds with active/inactive indicators', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 1, userPermissions: ['orders:view'] },
      } as any);

      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValueOnce([
        {
          uid: 101,
          name: 'John Doe',
          nickname: 'Johnny',
          teamId: 1,
          teamName: 'IT Park',
          designation: 'Sales Specialist',
          status: 1,
        },
        {
          uid: 102,
          name: 'Jane Smith',
          nickname: 'Jane',
          teamId: 1,
          teamName: 'IT Park',
          designation: 'Sales Associate',
          status: 0,
        },
      ]);

      const { GET } = await import('../app/api/reports/filters/route');
      const req = new Request('http://localhost:3080/api/reports/filters?teamId=1');
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.agents.length).toBe(2);
      expect(json.agents[0].status).toBe(1);
      expect(json.agents[1].status).toBe(0);
      expect(reportRepository.getReportAgentsList).toHaveBeenCalledWith([1], undefined, undefined);
    });

    it('enforces own teamId and hides teams list when user only has reports:agent-sales-team', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 42, teamId: 2, userPermissions: 'reports:agent-sales-team' },
      } as any);

      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValueOnce([]);

      const { GET } = await import('../app/api/reports/filters/route');
      const req = new Request('http://localhost:3080/api/reports/filters?teamId=1'); // Attempted bypass
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.teams).toEqual([]); // Teams dropdown hidden
      expect(reportRepository.getReportAgentsList).toHaveBeenCalledWith([2], undefined, undefined); // Forced to own team 2
    });
  });

  describe('GET /api/reports/agent-sales team-scoped permission & sorting', () => {
    it('allows access and locks teamIds to sessionUser.teamId for reports:agent-sales-team user', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 42, teamId: 3, userPermissions: 'reports:agent-sales-team' },
      } as any);

      vi.mocked(reportService.getAgentSalesMatrix).mockResolvedValueOnce({} as any);

      const { GET } = await import('../app/api/reports/agent-sales/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales?teamId=1,2'); // Attempt to query other teams
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(reportService.getAgentSalesMatrix).toHaveBeenCalledWith(
        expect.objectContaining({
          teamIds: [3], // Forced to sessionUser.teamId
        })
      );
    });

    it('forwards sortBy and sortOrder parameters to getAgentSalesMatrix', async () => {
      vi.mocked(getServerSession).mockResolvedValueOnce({
        user: { uid: 1, userPermissions: 'reports:agent-sales' },
      } as any);

      vi.mocked(reportService.getAgentSalesMatrix).mockResolvedValueOnce({} as any);

      const { GET } = await import('../app/api/reports/agent-sales/route');
      const req = new Request('http://localhost:3080/api/reports/agent-sales?sortBy=net&sortOrder=asc');
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(reportService.getAgentSalesMatrix).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'net',
          sortOrder: 'asc',
        })
      );
    });
  });
});
