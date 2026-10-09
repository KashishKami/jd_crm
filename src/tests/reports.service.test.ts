import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as reportRepository from '../repository/report.repository';
import * as reportService from '../service/report.service';

vi.mock('../repository/report.repository', () => ({
  getAgentSalesAggregates: vi.fn(),
  getReportAgentsList: vi.fn(),
  getEarliestOrderYear: vi.fn(),
}));

describe('Report Service Layer Unit & Logic Tests (W-4401)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate period metrics, net sales, and grand totals accurately across 12 months', async () => {
    vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
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
        teamId: 2,
        teamName: 'DB Park',
        designation: 'Sales Associate',
        status: 1,
      },
    ]);

    vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([
      // John Doe - Jan 2026: 1 Sold ($10,000), 1 Partial Refund ($5000 charged, $1000 refund -> $4000 net)
      {
        agentId: 101,
        periodKey: '2026-01',
        saleStatus: '1',
        totalCharged: 10000,
        totalRefund: 0,
        orderCount: 1,
      },
      {
        agentId: 101,
        periodKey: '2026-01',
        saleStatus: '4',
        totalCharged: 5000,
        totalRefund: 1000,
        orderCount: 1,
      },
      // John Doe - Jan 2026: 1 Refunded ($2000)
      {
        agentId: 101,
        periodKey: '2026-01',
        saleStatus: '2',
        totalCharged: 2000,
        totalRefund: 2000,
        orderCount: 1,
      },
      // John Doe - Jan 2026: 1 Chargebacked ($500)
      {
        agentId: 101,
        periodKey: '2026-01',
        saleStatus: '3',
        totalCharged: 500,
        totalRefund: 500,
        orderCount: 1,
      },
      // Jane Smith - Feb 2026: 2 Sold ($8000)
      {
        agentId: 102,
        periodKey: '2026-02',
        saleStatus: '1',
        totalCharged: 8000,
        totalRefund: 0,
        orderCount: 2,
      },
    ]);

    const result = await reportService.getAgentSalesMatrix({
      range: 'monthly',
      teamIds: [1, 2],
    });

    expect(result).toBeDefined();
    expect(result.periods.length).toBe(12); // All 12 months for 2026
    expect(result.agents.length).toBe(2);

    const john = result.agents.find((a) => a.agentId === 101);
    expect(john).toBeDefined();
    if (!john) return;

    // John's Jan 2026 calculations:
    // Net sales = (10000 - 0) + (5000 - 1000) = 14000 (2 orders)
    // Refunds = 2000 (1 order)
    // Chargebacks = 500 (1 order)
    // Gross Sales = 14000 + 2000 + 500 = 16500 (4 orders)
    const janJohn = john.periods['2026-01'];
    expect(janJohn).toBeDefined();
    expect(janJohn.netSales).toBe(14000);
    expect(janJohn.netSalesCount).toBe(2);
    expect(janJohn.refundsAmount).toBe(2000);
    expect(janJohn.refundsCount).toBe(1);
    expect(janJohn.chargebacksAmount).toBe(500);
    expect(janJohn.chargebacksCount).toBe(1);
    expect(janJohn.salesAmount).toBe(16500);
    expect(janJohn.salesCount).toBe(4);

    // Empty month check (Feb for John)
    const febJohn = john.periods['2026-02'];
    expect(febJohn).toBeDefined();
    expect(febJohn.netSales).toBe(0);
    expect(febJohn.salesAmount).toBe(0);
    expect(febJohn.salesCount).toBe(0);

    // John Grand Total
    expect(john.grandTotal.netSales).toBe(14000);
    expect(john.grandTotal.salesAmount).toBe(16500);
    expect(john.grandTotal.salesCount).toBe(4);

    // Jane's Feb 2026 calculations
    const jane = result.agents.find((a) => a.agentId === 102);
    expect(jane).toBeDefined();
    if (!jane) return;
    const febJane = jane.periods['2026-02'];
    expect(febJane.netSales).toBe(8000);
    expect(febJane.netSalesCount).toBe(2);
    expect(febJane.salesAmount).toBe(8000);

    // Org Grand Total
    expect(result.orgTotal.grandTotal.netSales).toBe(14000 + 8000);
    expect(result.orgTotal.grandTotal.salesAmount).toBe(16500 + 8000);
    expect(result.orgTotal.grandTotal.salesCount).toBe(6);
  });

  it('should handle custom date ranges and generate daily period buckets correctly', async () => {
    vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
      {
        uid: 101,
        name: 'John Doe',
        nickname: 'Johnny',
        teamId: 1,
        teamName: 'IT Park',
        designation: 'Sales Specialist',
        status: 1,
      },
    ]);

    vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([
      {
        agentId: 101,
        periodKey: '2026-10-01',
        saleStatus: '1',
        totalCharged: 2500,
        totalRefund: 0,
        orderCount: 1,
      },
    ]);

    const result = await reportService.getAgentSalesMatrix({
      range: 'custom',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
    });

    expect(result.periods.length).toBe(5); // 5 daily buckets: Oct 1, 2, 3, 4, 5
    expect(result.periods[0].key).toBe('2026-10-01');
    expect(result.periods[4].key).toBe('2026-10-05');
    expect(result.globalStartDate).toBe('2026-10-01');
    expect(result.globalEndDate).toBe('2026-10-05');

    const john = result.agents[0];
    expect(john.periods['2026-10-01'].netSales).toBe(2500);
    expect(john.periods['2026-10-02'].netSales).toBe(0);
    expect(john.grandTotal.netSales).toBe(2500);
  });

  it('should generate exactly 7 daily periods (Mon-Sun) and global date bounds for "this-week"', async () => {
    vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
      {
        uid: 101,
        name: 'John Doe',
        nickname: 'Johnny',
        teamId: 1,
        teamName: 'IT Park',
        designation: 'Sales Specialist',
        status: 1,
      },
    ]);
    vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

    const result = await reportService.getAgentSalesMatrix({
      range: 'this-week',
    });

    expect(result.periods.length).toBe(7);
    expect(result.globalStartDate).toBeDefined();
    expect(result.globalEndDate).toBeDefined();
    expect(result.rangeLabel).toBe('This Week');
  });

  it('should generate exactly 7 daily periods for "last-week"', async () => {
    vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
      {
        uid: 101,
        name: 'John Doe',
        nickname: 'Johnny',
        teamId: 1,
        teamName: 'IT Park',
        designation: 'Sales Specialist',
        status: 1,
      },
    ]);
    vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

    const result = await reportService.getAgentSalesMatrix({
      range: 'last-week',
    });

    expect(result.periods.length).toBe(7);
    expect(result.rangeLabel).toBe('Last Week');
  });

  it('should generate 1 single daily period for "today" and "yesterday"', async () => {
    vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
      {
        uid: 101,
        name: 'John Doe',
        nickname: 'Johnny',
        teamId: 1,
        teamName: 'IT Park',
        designation: 'Sales Specialist',
        status: 1,
      },
    ]);
    vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

    const todayResult = await reportService.getAgentSalesMatrix({ range: 'today' });
    expect(todayResult.periods.length).toBe(1);
    expect(todayResult.rangeLabel).toBe('Today');

    const yesterdayResult = await reportService.getAgentSalesMatrix({ range: 'yesterday' });
    expect(yesterdayResult.periods.length).toBe(1);
    expect(yesterdayResult.rangeLabel).toBe('Yesterday');
  });

  it('should generate 5 yearly periods for "yearly"', async () => {
    vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
      {
        uid: 101,
        name: 'John Doe',
        nickname: 'Johnny',
        teamId: 1,
        teamName: 'IT Park',
        designation: 'Sales Specialist',
        status: 1,
      },
    ]);
    vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

    const result = await reportService.getAgentSalesMatrix({ range: 'yearly' });
    expect(result.periods.length).toBe(5);
    expect(result.rangeLabel).toBe('Yearly');
  });

  it('should switch to monthly buckets when custom range exceeds 31 days', async () => {
    vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
      {
        uid: 101,
        name: 'John Doe',
        nickname: 'Johnny',
        teamId: 1,
        teamName: 'IT Park',
        designation: 'Sales Specialist',
        status: 1,
      },
    ]);
    vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

    const result = await reportService.getAgentSalesMatrix({
      range: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-03-31',
    });

    expect(result.periods.length).toBe(3); // Jan, Feb, Mar 2026
    expect(result.periods[0].key).toBe('2026-01');
    expect(result.periods[2].key).toBe('2026-03');
  });

  it('should generate all-time yearly periods starting from earliest order year', async () => {
    vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
      {
        uid: 101,
        name: 'John Doe',
        nickname: 'Johnny',
        teamId: 1,
        teamName: 'IT Park',
        designation: 'Sales Specialist',
        status: 1,
      },
    ]);
    vi.mocked(reportRepository.getEarliestOrderYear).mockResolvedValue(2022);
    vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

    const result = await reportService.getAgentSalesMatrix({ range: 'all-time' });
    expect(result.rangeLabel).toBe('All Time');
    expect(result.periods.length).toBeGreaterThanOrEqual(5);
    expect(result.periods[0].key).toBe('2022');
  });
});
