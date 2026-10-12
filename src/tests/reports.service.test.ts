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
      range: 'yearly',
      granularity: 'monthly',
      year: 2026,
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

    const dailyResult = await reportService.getAgentSalesMatrix({
      range: 'this-week',
      granularity: 'daily',
    });

    expect(dailyResult.periods.length).toBe(7);
    expect(dailyResult.globalStartDate).toBeDefined();
    expect(dailyResult.globalEndDate).toBeDefined();
    expect(dailyResult.rangeLabel).toBe('This Week');

    const summaryResult = await reportService.getAgentSalesMatrix({
      range: 'this-week',
    });
    expect(summaryResult.periods.length).toBe(1);
    expect(summaryResult.periods[0].key).toBe('this-week-summary');
  });

  it('should generate exactly 7 daily periods for "last-week" with daily granularity, or 1 summary period by default', async () => {
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

    const dailyResult = await reportService.getAgentSalesMatrix({
      range: 'last-week',
      granularity: 'daily',
    });

    expect(dailyResult.periods.length).toBe(7);
    expect(dailyResult.rangeLabel).toBe('Last Week');

    const summaryResult = await reportService.getAgentSalesMatrix({
      range: 'last-week',
    });
    expect(summaryResult.periods.length).toBe(1);
    expect(summaryResult.periods[0].key).toBe('last-week-summary');
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

  it('should generate yearly summary for "yearly" by default', async () => {
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

    const result = await reportService.getAgentSalesMatrix({ range: 'yearly', year: 2026 });
    expect(result.periods.length).toBe(1);
    expect(result.rangeLabel).toBe('Year 2026');
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

    const result = await reportService.getAgentSalesMatrix({ range: 'all-time', granularity: 'yearly' });
    expect(result.rangeLabel).toBe('All Time');
    expect(result.periods.length).toBeGreaterThanOrEqual(5);
    expect(result.periods[0].key).toBe('2022');
  });

  describe('W-4402: Extended Ranges & Granularities (Monthly & Yearly Customizations)', () => {
    it('defaults to single Monthly Summary column when range is "monthly"', async () => {
      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
        { uid: 101, name: 'John Doe', nickname: 'Johnny', teamId: 1, teamName: 'IT Park', designation: 'Sales Specialist', status: 1 },
      ]);
      vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

      const result = await reportService.getAgentSalesMatrix({
        range: 'monthly',
        year: 2026,
        month: 10,
        // granularity not provided -> should default to 'summary'
      });

      expect(result.periods.length).toBe(1);
      expect(result.periods[0].key).toBe('2026-10');
      expect(result.periods[0].label).toContain('Oct 2026');
      expect(result.periods[0].label).toContain('Summary');
      expect(result.periods[0].startDate).toBe('2026-10-01');
      expect(result.periods[0].endDate).toBe('2026-10-31');
    });

    it('generates Calendar Weeks (Mon-Sun) within the month when range is "monthly" and granularity is "weekly"', async () => {
      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([
        { uid: 101, name: 'John Doe', nickname: 'Johnny', teamId: 1, teamName: 'IT Park', designation: 'Sales Specialist', status: 1 },
      ]);
      vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

      // October 2026:
      // Oct 1 (Thu) to Oct 4 (Sun) -> Week 1 (4 days)
      // Oct 5 (Mon) to Oct 11 (Sun) -> Week 2 (7 days)
      // Oct 12 (Mon) to Oct 18 (Sun) -> Week 3 (7 days)
      // Oct 19 (Mon) to Oct 25 (Sun) -> Week 4 (7 days)
      // Oct 26 (Mon) to Oct 31 (Sat) -> Week 5 (6 days)
      const result = await reportService.getAgentSalesMatrix({
        range: 'monthly',
        year: 2026,
        month: 10,
        granularity: 'weekly',
      });

      expect(result.periods.length).toBe(5);
      expect(result.periods[0].startDate).toBe('2026-10-01');
      expect(result.periods[0].endDate).toBe('2026-10-04');
      expect(result.periods[1].startDate).toBe('2026-10-05');
      expect(result.periods[1].endDate).toBe('2026-10-11');
      expect(result.periods[2].startDate).toBe('2026-10-12');
      expect(result.periods[2].endDate).toBe('2026-10-18');
      expect(result.periods[3].startDate).toBe('2026-10-19');
      expect(result.periods[3].endDate).toBe('2026-10-25');
      expect(result.periods[4].startDate).toBe('2026-10-26');
      expect(result.periods[4].endDate).toBe('2026-10-31');
    });

    it('generates 29 daily periods for leap year Feb 2024 and 28 days for Feb 2025', async () => {
      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([]);
      vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

      const leapResult = await reportService.getAgentSalesMatrix({
        range: 'monthly',
        year: 2024,
        month: 2,
        granularity: 'daily',
      });
      expect(leapResult.periods.length).toBe(29);
      expect(leapResult.periods[28].key).toBe('2024-02-29');

      const nonLeapResult = await reportService.getAgentSalesMatrix({
        range: 'monthly',
        year: 2025,
        month: 2,
        granularity: 'daily',
      });
      expect(nonLeapResult.periods.length).toBe(28);
      expect(nonLeapResult.periods[27].key).toBe('2025-02-28');
    });

    it('defaults to single Yearly Summary column when range is "yearly"', async () => {
      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([]);
      vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

      const result = await reportService.getAgentSalesMatrix({
        range: 'yearly',
        year: 2025,
      });

      expect(result.periods.length).toBe(1);
      expect(result.periods[0].key).toBe('2025');
      expect(result.periods[0].label).toContain('2025');
      expect(result.periods[0].label).toContain('Summary');
      expect(result.periods[0].startDate).toBe('2025-01-01');
      expect(result.periods[0].endDate).toBe('2025-12-31');
    });

    it('generates 12 monthly columns when range is "yearly" and granularity is "monthly"', async () => {
      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([]);
      vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

      const result = await reportService.getAgentSalesMatrix({
        range: 'yearly',
        year: 2025,
        granularity: 'monthly',
      });

      expect(result.periods.length).toBe(12);
      expect(result.periods[0].key).toBe('2025-01');
      expect(result.periods[11].key).toBe('2025-12');
      expect(result.periods[0].label).toBe('Jan 2025');
      expect(result.periods[11].label).toBe('Dec 2025');
    });

    it('defaults to All-Time Summary when range is "all-time" and granularity is not specified', async () => {
      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([]);
      vi.mocked(reportRepository.getEarliestOrderYear).mockResolvedValue(2021);
      vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

      const result = await reportService.getAgentSalesMatrix({
        range: 'all-time',
      });

      expect(result.periods.length).toBe(1);
      expect(result.periods[0].label).toContain('All-Time Summary');
      expect(result.periods[0].startDate).toBe('2021-01-01');
    });

    it('generates Yearly columns when range is "all-time" and granularity is "yearly"', async () => {
      vi.mocked(reportRepository.getReportAgentsList).mockResolvedValue([]);
      vi.mocked(reportRepository.getEarliestOrderYear).mockResolvedValue(2023);
      vi.mocked(reportRepository.getAgentSalesAggregates).mockResolvedValue([]);

      const result = await reportService.getAgentSalesMatrix({
        range: 'all-time',
        granularity: 'yearly',
      });

      expect(result.periods.length).toBeGreaterThanOrEqual(4);
      expect(result.periods[0].key).toBe('2023');
    });
  });
});
