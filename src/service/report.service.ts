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

function generateCalendarWeeks(startDate: Date, endDate: Date): PeriodDefinition[] {
  const result: PeriodDefinition[] = [];
  const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
  let weekNum = 1;

  while (current <= end) {
    const weekStart = new Date(current);
    const dayOfWeek = current.getUTCDay(); // 0 is Sunday, 1 is Monday, ...
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const weekEnd = new Date(current);
    weekEnd.setUTCDate(current.getUTCDate() + daysUntilSunday);
    if (weekEnd > end) {
      weekEnd.setTime(end.getTime());
    }

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];
    const startMD = `${weekStart.getUTCMonth() + 1}/${weekStart.getUTCDate()}`;
    const endMD = `${weekEnd.getUTCMonth() + 1}/${weekEnd.getUTCDate()}`;

    result.push({
      key: `W${weekNum}_${startStr}`,
      label: `Week ${weekNum} (${startMD} - ${endMD})`,
      startDate: startStr,
      endDate: endStr,
    });

    weekNum++;
    current.setUTCDate(weekEnd.getUTCDate() + 1);
  }

  return result;
}

export async function getAgentSalesMatrix(
  filters: AgentSalesFilterParams
): Promise<ReportMatrixResponse> {
  const range = filters.range || 'monthly';
  const now = getEstDateUTC(new Date());

  let dateFrom: Date;
  let dateTo: Date;
  let repoGranularity: 'daily' | 'monthly' | 'yearly' = 'daily';
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
    repoGranularity = 'daily';
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
    repoGranularity = 'daily';
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
    repoGranularity = 'daily';
    globalStartDate = dateFrom.toISOString().split('T')[0];
    globalEndDate = dateTo.toISOString().split('T')[0];
    rangeLabel = 'This Week';

    const selGranularity = filters.granularity || 'summary';
    if (selGranularity === 'daily') {
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
    } else {
      periods.push({
        key: 'this-week-summary',
        label: `This Week (${globalStartDate} - ${globalEndDate})`,
        startDate: globalStartDate,
        endDate: globalEndDate,
      });
    }
  } else if (range === 'last-week' || range === 'last_week') {
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - diffToMonday - 7);
    dateFrom = startOfDay(start);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    dateTo = endOfDay(end);
    repoGranularity = 'daily';
    globalStartDate = dateFrom.toISOString().split('T')[0];
    globalEndDate = dateTo.toISOString().split('T')[0];
    rangeLabel = 'Last Week';

    const selGranularity = filters.granularity || 'summary';
    if (selGranularity === 'daily') {
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
    } else {
      periods.push({
        key: 'last-week-summary',
        label: `Last Week (${globalStartDate} - ${globalEndDate})`,
        startDate: globalStartDate,
        endDate: globalEndDate,
      });
    }
  } else if (range === 'monthly') {
    const selYear = filters.year || now.getUTCFullYear();
    const selMonth = filters.month !== undefined ? filters.month : (now.getUTCMonth() + 1);
    const selGranularity = filters.granularity || 'summary';
    const monthStr = String(selMonth).padStart(2, '0');
    const lastDay = new Date(Date.UTC(selYear, selMonth, 0)).getUTCDate();
    dateFrom = new Date(Date.UTC(selYear, selMonth - 1, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(selYear, selMonth - 1, lastDay, 23, 59, 59, 999));
    globalStartDate = `${selYear}-${monthStr}-01`;
    globalEndDate = `${selYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    rangeLabel = `${MONTH_NAMES[selMonth - 1]} ${selYear}`;

    if (selGranularity === 'weekly') {
      repoGranularity = 'daily';
      periods.push(...generateCalendarWeeks(dateFrom, dateTo));
    } else if (selGranularity === 'daily') {
      repoGranularity = 'daily';
      for (let d = 1; d <= lastDay; d++) {
        const dStr = String(d).padStart(2, '0');
        const k = `${selYear}-${monthStr}-${dStr}`;
        periods.push({
          key: k,
          label: `${MONTH_NAMES[selMonth - 1]} ${d}`,
          startDate: k,
          endDate: k,
        });
      }
    } else {
      repoGranularity = 'daily';
      periods.push({
        key: `${selYear}-${monthStr}`,
        label: `${MONTH_NAMES[selMonth - 1]} ${selYear} (Monthly Summary)`,
        startDate: globalStartDate,
        endDate: globalEndDate,
      });
    }
  } else if (range === 'yearly') {
    const selYear = filters.year || now.getUTCFullYear();
    const selGranularity = filters.granularity || 'summary';
    dateFrom = new Date(Date.UTC(selYear, 0, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(selYear, 11, 31, 23, 59, 59, 999));
    globalStartDate = `${selYear}-01-01`;
    globalEndDate = `${selYear}-12-31`;
    rangeLabel = `Year ${selYear}`;

    if (selGranularity === 'monthly') {
      repoGranularity = 'monthly';
      for (let m = 0; m < 12; m++) {
        const mStr = String(m + 1).padStart(2, '0');
        const lastDay = new Date(Date.UTC(selYear, m + 1, 0)).getUTCDate();
        periods.push({
          key: `${selYear}-${mStr}`,
          label: `${MONTH_NAMES[m]} ${selYear}`,
          startDate: `${selYear}-${mStr}-01`,
          endDate: `${selYear}-${mStr}-${String(lastDay).padStart(2, '0')}`,
        });
      }
    } else if (selGranularity === 'weekly') {
      repoGranularity = 'daily';
      periods.push(...generateCalendarWeeks(dateFrom, dateTo));
    } else {
      repoGranularity = 'daily';
      periods.push({
        key: String(selYear),
        label: `${selYear} (Yearly Summary)`,
        startDate: globalStartDate,
        endDate: globalEndDate,
      });
    }
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
    globalStartDate = `${startYear}-01-01`;
    globalEndDate = `${currentYear}-12-31`;
    rangeLabel = 'All Time';

    const selGranularity = filters.granularity || 'summary';
    if (selGranularity === 'summary') {
      repoGranularity = 'daily';
      periods.push({
        key: 'all-time',
        label: `All-Time Summary (${startYear} - ${currentYear})`,
        startDate: globalStartDate,
        endDate: globalEndDate,
      });
    } else {
      repoGranularity = 'yearly';
      for (let y = startYear; y <= currentYear; y++) {
        periods.push({
          key: String(y),
          label: String(y),
          startDate: `${y}-01-01`,
          endDate: `${y}-12-31`,
        });
      }
    }
  } else if (range === 'custom' && filters.startDate && filters.endDate) {
    dateFrom = localDateStringToUtcNoon(filters.startDate);
    dateTo = localDateStringToUtcNoon(filters.endDate);
    globalStartDate = filters.startDate;
    globalEndDate = filters.endDate;
    rangeLabel = `${filters.startDate} to ${filters.endDate}`;

    const diffDays = Math.ceil(
      Math.abs(dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)
    );
    const selGranularity = filters.granularity || (diffDays <= 31 ? 'daily' : 'monthly');

    if (selGranularity === 'summary') {
      repoGranularity = 'daily';
      periods.push({
        key: 'custom-summary',
        label: `Summary (${filters.startDate} to ${filters.endDate})`,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } else if (selGranularity === 'weekly') {
      repoGranularity = 'daily';
      periods.push(...generateCalendarWeeks(dateFrom, dateTo));
    } else if (selGranularity === 'monthly') {
      repoGranularity = 'monthly';
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
    } else {
      repoGranularity = 'daily';
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
    }
  } else {
    // Default fallback to current month summary
    const selYear = now.getUTCFullYear();
    const selMonth = now.getUTCMonth() + 1;
    const monthStr = String(selMonth).padStart(2, '0');
    const lastDay = new Date(Date.UTC(selYear, selMonth, 0)).getUTCDate();
    dateFrom = new Date(Date.UTC(selYear, selMonth - 1, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(selYear, selMonth - 1, lastDay, 23, 59, 59, 999));
    globalStartDate = `${selYear}-${monthStr}-01`;
    globalEndDate = `${selYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    rangeLabel = `${MONTH_NAMES[selMonth - 1]} ${selYear}`;
    repoGranularity = 'daily';
    periods.push({
      key: `${selYear}-${monthStr}`,
      label: `${MONTH_NAMES[selMonth - 1]} ${selYear} (Monthly Summary)`,
      startDate: globalStartDate,
      endDate: globalEndDate,
    });
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
    granularity: repoGranularity,
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

    let targetPeriodKey = row.periodKey;
    if (repoGranularity === 'daily' && !agentRow.periods[row.periodKey]) {
      const matched = periods.find(p => p.startDate <= row.periodKey && row.periodKey <= p.endDate);
      if (matched) {
        targetPeriodKey = matched.key;
      }
    }

    const periodMetric = agentRow.periods[targetPeriodKey];
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
