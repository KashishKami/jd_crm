import { vi, describe, it, expect } from 'vitest';
import { prisma } from '../lib/db';
import { getTopPerformers, getBottomPerformers } from '../repository/dashboard.repository';
import { getServerSession } from 'next-auth';

import { GET as getMetrics } from '../app/api/dashboard/metrics/route';
import { GET as getChampions } from '../app/api/dashboard/champions-league/route';
import { GET as getAdvanced } from '../app/api/dashboard/advanced-chart/route';
import { GET as getTeams } from '../app/api/dashboard/teams/monthly/route';

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}));

describe('Database Performance and Caching Integration Tests (W-1807)', () => {
  it('should verify database index exists on crm_orders for order_date', async () => {
    // Query MySQL for indexes on crm_orders
    const indexRows = await prisma.$queryRawUnsafe<any[]>(
      'SHOW INDEX FROM crm_orders WHERE Column_name = ?',
      'order_date'
    );
    
    // Assert that we have at least one index on order_date
    expect(indexRows.length).toBeGreaterThan(0);
  });

  it('should return correct mathematical outputs for top and bottom performers', async () => {
    // Clean up our specific test IDs first to prevent key collision
    await prisma.crmOrders.deleteMany({
      where: {
        crmOrderId: { in: [9001, 9002, 9003] }
      }
    });
    await prisma.users.deleteMany({
      where: {
        uid: { in: [981, 982] }
      }
    });

    // Create two test agents
    const agentA = await prisma.users.create({
      data: {
        uid: 981,
        name: 'Agent A Perf',
        username: 'agent_a_perf@example.com',
        email: 'agent_a_perf@example.com',
        teamId: 1,
        roleId: 1,
        designation: 'Sales Associate',
      }
    });
    const agentB = await prisma.users.create({
      data: {
        uid: 982,
        name: 'Agent B Perf',
        username: 'agent_b_perf@example.com',
        email: 'agent_b_perf@example.com',
        teamId: 1,
        roleId: 1,
        designation: 'Sales Associate',
      }
    });

    // Create a target month date
    const targetDate = new Date(Date.UTC(2026, 5, 15)); // June 15, 2026

    try {
      // Agent A: 2 orders (total margin = 1000 - 100 + 500 = 1400)
      await prisma.crmOrders.createMany({
        data: [
          {
            crmOrderId: 9001,
            orderCustomerId: 1,
            orderSalesAgentId: agentA.uid,
            orderSalesAgentName: agentA.name,
            orderAmountCharged: '1000.00',
            orderRefundAmount: '100.00',
            saleStatus: '1', // Sold
            orderDate: targetDate,
          },
          {
            crmOrderId: 9002,
            orderCustomerId: 1,
            orderSalesAgentId: agentA.uid,
            orderSalesAgentName: agentA.name,
            orderAmountCharged: '500.00',
            orderRefundAmount: '0.00',
            saleStatus: '4', // Partial Refund
            orderDate: targetDate,
          }
        ]
      });

      // Agent B: 1 order (total margin = 800 - 0 = 800)
      await prisma.crmOrders.createMany({
        data: [
          {
            crmOrderId: 9003,
            orderCustomerId: 1,
            orderSalesAgentId: agentB.uid,
            orderSalesAgentName: agentB.name,
            orderAmountCharged: '800.00',
            orderRefundAmount: '0.00',
            saleStatus: '1',
            orderDate: targetDate,
          }
        ]
      });

      // Execute getTopPerformers for June 2026 (Month 6)
      const top = await getTopPerformers(5, 6, 2026);
      const agentATop = top.find(t => t.agentName === agentA.name);
      const agentBTop = top.find(t => t.agentName === agentB.name);

      expect(agentATop).toBeDefined();
      expect(agentATop?.amount).toBe(1400);
      expect(agentBTop).toBeDefined();
      expect(agentBTop?.amount).toBe(800);

      // Execute getBottomPerformers for June 2026 (Month 6)
      const bottom = await getBottomPerformers(5, 6, 2026);
      const agentABottom = bottom.find(t => t.agentName === agentA.name);
      const agentBBottom = bottom.find(t => t.agentName === agentB.name);

      expect(agentABottom).toBeDefined();
      expect(agentABottom?.amount).toBe(1400);
      expect(agentBBottom).toBeDefined();
      expect(agentBBottom?.amount).toBe(800);
    } finally {
      // Clean up after ourselves
      await prisma.crmOrders.deleteMany({
        where: {
          crmOrderId: { in: [9001, 9002, 9003] }
        }
      });
      await prisma.users.deleteMany({
        where: {
          uid: { in: [981, 982] }
        }
      });
    }
  });

  it('should verify Cache-Control headers are set on all dashboard aggregate endpoints', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        name: 'Admin',
        userPermissions: 'super-admin,dashboard:top-performer,dashboard:bottom-performer,dashboard:team-monthly-scores,dashboard:view-advanced-chart',
      }
    });

    // Test metrics route
    const resMetrics = await getMetrics();
    expect(resMetrics.headers.get('Cache-Control')).toBe('private, max-age=60');

    // Test champions route
    const reqChampions = new Request('http://localhost/api/dashboard/champions-league?month=6&year=2026');
    const resChampions = await getChampions(reqChampions);
    expect(resChampions.headers.get('Cache-Control')).toBe('private, max-age=60');

    // Test advanced route
    const reqAdvanced = new Request('http://localhost/api/dashboard/advanced-chart?range=7d');
    const resAdvanced = await getAdvanced(reqAdvanced);
    expect(resAdvanced.headers.get('Cache-Control')).toBe('private, max-age=60');

    // Test teams route
    const reqTeams = new Request('http://localhost/api/dashboard/teams/monthly?month=6&year=2026');
    const resTeams = await getTeams(reqTeams);
    expect(resTeams.headers.get('Cache-Control')).toBe('private, max-age=60');
  });
});
