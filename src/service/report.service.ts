import {
  AgentSalesFilterParams,
  AgentSalesRowData,
  PeriodDefinition,
  PeriodMetrics,
  ReportMatrixResponse,
} from '../types/report';
import * as reportRepository from '../repository/report.repository';
import { getEstDateUTC, localDateStringToUtcNoon } from '../lib/date';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function createEmptyMetrics(): PeriodMetrics {
  return {
    salesAmount: 0,
    salesCount: 0,
    refundsAmount: 0,
    refundsCount: 0,
    chargebacksAmount: 0,
    chargebacksCount: 0,
    netSales: 0,
    netSalesCount: 0,
  };
}

export function addMetrics(target: PeriodMetrics, source: PeriodMetrics): void {
  target.salesAmount += source.salesAmount;
  target.salesCount += source.salesCount;
  target.refundsAmount += source.refundsAmount;
  target.refundsCount += source.refundsCount;
  target.chargebacksAmount += source.chargebacksAmount;
  target.chargebacksCount += source.chargebacksCount;
  target.netSales += source.netSales;
  target.netSalesCount += source.netSalesCount;
}

export async function getAgentSalesMatrix(
  filters: AgentSalesFilterParams
): Promise<ReportMatrixResponse> {
  const range = filters.range || 'monthly';
  const now = getEstDateUTC(new Date());

  let dateFrom: Date;
  let dateTo: Date;
  let granularity: 'daily' | 'monthly' | 'yearly' = 'monthly';
  const periods: PeriodDefinition[] = [];

  const startOfDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  let rangeLabel = 'Selected Period';
  let globalStartDate = '';
  let globalEndDate = '';

  if (range === 'today') {
    dateFrom = startOfDay(now);
    dateTo = endOfDay(now);
    granularity = 'daily';
    const key = dateFrom.toISOString().split('T')[0];
    periods.push({
      key,
      label: 'Today',
      startDate: key,
      endDate: key,
    });
    globalStartDate = key;
    globalEndDate = key;
    rangeLabel = 'Today';
  } else if (range === 'yesterday') {
    const yest = new Date(now);
    yest.setUTCDate(now.getUTCDate() - 1);
    dateFrom = startOfDay(yest);
    dateTo = endOfDay(yest);
    granularity = 'daily';
    const key = dateFrom.toISOString().split('T')[0];
    periods.push({
      key,
      label: 'Yesterday',
      startDate: key,
      endDate: key,
    });
    globalStartDate = key;
    globalEndDate = key;
    rangeLabel = 'Yesterday';
  } else if (range === 'this-week' || range === 'this_week') {
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - diffToMonday);
    dateFrom = startOfDay(start);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    dateTo = endOfDay(end);
    granularity = 'daily';

    const temp = new Date(dateFrom);
    while (temp <= dateTo) {
      const key = temp.toISOString().split('T')[0];
      const dayName = temp.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const monthDay = `${temp.getUTCMonth() + 1}/${temp.getUTCDate()}`;
      periods.push({
        key,
        label: `${dayName} (${monthDay})`,
        startDate: key,
        endDate: key,
      });
      temp.setUTCDate(temp.getUTCDate() + 1);
    }
    globalStartDate = dateFrom.toISOString().split('T')[0];
    globalEndDate = dateTo.toISOString().split('T')[0];
    rangeLabel = 'This Week';
  } else if (range === 'last-week' || range === 'last_week') {
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - diffToMonday - 7);
    dateFrom = startOfDay(start);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    dateTo = endOfDay(end);
    granularity = 'daily';

    const temp = new Date(dateFrom);
    while (temp <= dateTo) {
      const key = temp.toISOString().split('T')[0];
      const dayName = temp.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
      const monthDay = `${temp.getUTCMonth() + 1}/${temp.getUTCDate()}`;
      periods.push({
        key,
        label: `${dayName} (${monthDay})`,
        startDate: key,
        endDate: key,
      });
      temp.setUTCDate(temp.getUTCDate() + 1);
    }
    globalStartDate = dateFrom.toISOString().split('T')[0];
    globalEndDate = dateTo.toISOString().split('T')[0];
    rangeLabel = 'Last Week';
  } else if (range === 'monthly' || range === 'this-year' || range === 'year') {
    const currentYear = now.getUTCFullYear();
    dateFrom = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
    granularity = 'monthly';

    for (let m = 0; m < 12; m++) {
      const monthStr = String(m + 1).padStart(2, '0');
      const key = `${currentYear}-${monthStr}`;
      const lastDay = new Date(Date.UTC(currentYear, m + 1, 0)).getUTCDate();
      periods.push({
        key,
        label: `${MONTH_NAMES[m]} ${currentYear}`,
        startDate: `${currentYear}-${monthStr}-01`,
        endDate: `${currentYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
      });
    }
    globalStartDate = `${currentYear}-01-01`;
    globalEndDate = `${currentYear}-12-31`;
    rangeLabel = `Monthly (${currentYear})`;
  } else if (range === 'yearly') {
    const currentYear = now.getUTCFullYear();
    dateFrom = new Date(Date.UTC(currentYear - 4, 0, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
    granularity = 'yearly';

    for (let y = currentYear - 4; y <= currentYear; y++) {
      const key = String(y);
      periods.push({
        key,
        label: String(y),
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
      });
    }
    globalStartDate = `${currentYear - 4}-01-01`;
    globalEndDate = `${currentYear}-12-31`;
    rangeLabel = 'Yearly';
  } else if (range === 'all-time' || range === 'all_time' || range === 'all') {
    const currentYear = now.getUTCFullYear();
    let startYear = currentYear - 4;
    try {
      const minYear = await reportRepository.getEarliestOrderYear();
      if (minYear && minYear <= currentYear) {
        startYear = minYear;
      }
    } catch {
      // Fallback to startYear
    }

    dateFrom = new Date(Date.UTC(startYear, 0, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
    granularity = 'yearly';

    for (let y = startYear; y <= currentYear; y++) {
      const key = String(y);
      periods.push({
        key,
        label: String(y),
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
      });
    }
    globalStartDate = `${startYear}-01-01`;
    globalEndDate = `${currentYear}-12-31`;
    rangeLabel = 'All Time';
  } else if (range === 'custom' && filters.startDate && filters.endDate) {
    dateFrom = localDateStringToUtcNoon(filters.startDate);
    dateTo = localDateStringToUtcNoon(filters.endDate);
    const diffDays = Math.ceil(
      Math.abs(dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 31) {
      granularity = 'daily';
      const temp = new Date(Date.UTC(dateFrom.getUTCFullYear(), dateFrom.getUTCMonth(), dateFrom.getUTCDate()));
      const end = new Date(Date.UTC(dateTo.getUTCFullYear(), dateTo.getUTCMonth(), dateTo.getUTCDate()));
      while (temp <= end) {
        const key = temp.toISOString().split('T')[0];
        periods.push({
          key,
          label: key,
          startDate: key,
          endDate: key,
        });
        temp.setUTCDate(temp.getUTCDate() + 1);
      }
    } else {
      granularity = 'monthly';
      const temp = new Date(Date.UTC(dateFrom.getUTCFullYear(), dateFrom.getUTCMonth(), 1));
      const end = new Date(Date.UTC(dateTo.getUTCFullYear(), dateTo.getUTCMonth(), 1));
      while (temp <= end) {
        const y = temp.getUTCFullYear();
        const m = temp.getUTCMonth();
        const monthStr = String(m + 1).padStart(2, '0');
        const key = `${y}-${monthStr}`;
        const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
        periods.push({
          key,
          label: `${MONTH_NAMES[m]} ${y}`,
          startDate: `${y}-${monthStr}-01`,
          endDate: `${y}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
        });
        temp.setUTCMonth(temp.getUTCMonth() + 1);
      }
    }
    globalStartDate = filters.startDate;
    globalEndDate = filters.endDate;
    rangeLabel = `${filters.startDate} to ${filters.endDate}`;
  } else {
    // Default fallback to current month
    const currentYear = now.getUTCFullYear();
    dateFrom = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
    granularity = 'monthly';

    for (let m = 0; m < 12; m++) {
      const monthStr = String(m + 1).padStart(2, '0');
      const key = `${currentYear}-${monthStr}`;
      const lastDay = new Date(Date.UTC(currentYear, m + 1, 0)).getUTCDate();
      periods.push({
        key,
        label: `${MONTH_NAMES[m]} ${currentYear}`,
        startDate: `${currentYear}-${monthStr}-01`,
        endDate: `${currentYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
      });
    }
    globalStartDate = `${currentYear}-01-01`;
    globalEndDate = `${currentYear}-12-31`;
    rangeLabel = `Monthly (${currentYear})`;
  }

  // 1. Fetch agents
  const agentsList = await reportRepository.getReportAgentsList(
    filters.teamIds,
    filters.agentIds
  );

  // 2. Fetch aggregates from repository
  const aggregates = await reportRepository.getAgentSalesAggregates({
    dateFrom,
    dateTo,
    granularity,
    teamIds: filters.teamIds,
    agentIds: filters.agentIds,
  });

  // 3. Build agent rows map
  const agentMap = new Map<number, AgentSalesRowData>();
  for (const agent of agentsList) {
    const periodMetricsMap: Record<string, PeriodMetrics> = {};
    for (const p of periods) {
      periodMetricsMap[p.key] = createEmptyMetrics();
    }
    agentMap.set(agent.uid, {
      agentId: agent.uid,
      agentName: agent.name,
      nickname: agent.nickname,
      teamId: agent.teamId,
      teamName: agent.teamName,
      designation: agent.designation,
      status: agent.status,
      periods: periodMetricsMap,
      grandTotal: createEmptyMetrics(),
    });
  }

  // 4. Map aggregates into agent rows
  for (const row of aggregates) {
    const agentRow = agentMap.get(row.agentId);
    if (!agentRow) continue;

    const periodMetric = agentRow.periods[row.periodKey];
    if (!periodMetric) continue;

    const charged = row.totalCharged;
    const refund = row.totalRefund;
    const count = row.orderCount;

    if (row.saleStatus === '1' || row.saleStatus === '4') {
      // Sold & Partial Refund: realizes net sales margin
      const margin = Math.max(0, charged - refund);
      periodMetric.netSales += margin;
      periodMetric.netSalesCount += count;
    } else if (row.saleStatus === '2') {
      // Refunded
      periodMetric.refundsAmount += (refund || charged);
      periodMetric.refundsCount += count;
    } else if (row.saleStatus === '3') {
      // Chargebacked
      periodMetric.chargebacksAmount += (refund || charged);
      periodMetric.chargebacksCount += count;
    }
  }

  // 5. Compute gross sales amount/count, agent grand totals, and org totals
  const orgPeriodTotals: Record<string, PeriodMetrics> = {};
  for (const p of periods) {
    orgPeriodTotals[p.key] = createEmptyMetrics();
  }
  const orgGrandTotal = createEmptyMetrics();

  const agentsResult: AgentSalesRowData[] = [];
  for (const agentRow of agentMap.values()) {
    for (const p of periods) {
      const pm = agentRow.periods[p.key];
      // Gross Sales = Net Sales + Refunds + Chargebacks
      pm.salesAmount = pm.netSales + pm.refundsAmount + pm.chargebacksAmount;
      pm.salesCount = pm.netSalesCount + pm.refundsCount + pm.chargebacksCount;

      addMetrics(agentRow.grandTotal, pm);
      addMetrics(orgPeriodTotals[p.key], pm);
      addMetrics(orgGrandTotal, pm);
    }
    agentsResult.push(agentRow);
  }

  return {
    periods,
    agents: agentsResult,
    orgTotal: {
      periods: orgPeriodTotals,
      grandTotal: orgGrandTotal,
    },
    globalStartDate,
    globalEndDate,
    rangeLabel,
  };
}
