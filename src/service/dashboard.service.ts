import { hasPermission } from './permission.service';
import * as dashboardRepository from '../repository/dashboard.repository';

function calcPctChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
}

export async function getMetricsForUser(session: any) {
  const permissions = session?.user?.userPermissions || '';
  const metrics: Record<string, any> = {};

  const now = new Date();

  // Year dates
  const curYearStart = new Date(now.getFullYear(), 0, 1);
  const curYearEnd = new Date(now.getFullYear() + 1, 0, 1);
  const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const prevYearEnd = new Date(now.getFullYear(), 0, 1);

  // Month dates
  const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const curMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  // Day dates
  const curDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const curDayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const prevDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const prevDayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (hasPermission(permissions, 'dashboard:total-sales')) {
    const current = await dashboardRepository.getSalesBetweenDates(curYearStart, curYearEnd);
    const previous = await dashboardRepository.getSalesBetweenDates(prevYearStart, prevYearEnd);
    metrics.thisYearSales = {
      amount: current.amount,
      count: current.count,
      lastAmount: previous.amount,
      lastCount: previous.count,
      percentageChange: calcPctChange(current.amount, previous.amount),
    };
  }
  if (hasPermission(permissions, 'dashboard:monthly-sales')) {
    const current = await dashboardRepository.getSalesBetweenDates(curMonthStart, curMonthEnd);
    const previous = await dashboardRepository.getSalesBetweenDates(prevMonthStart, prevMonthEnd);
    metrics.totalSalesThisMonth = {
      amount: current.amount,
      count: current.count,
      lastAmount: previous.amount,
      lastCount: previous.count,
      percentageChange: calcPctChange(current.amount, previous.amount),
    };
  }
  if (hasPermission(permissions, 'dashboard:today-sales')) {
    const current = await dashboardRepository.getSalesBetweenDates(curDayStart, curDayEnd);
    const previous = await dashboardRepository.getSalesBetweenDates(prevDayStart, prevDayEnd);
    metrics.todaySales = {
      amount: current.amount,
      count: current.count,
      lastAmount: previous.amount,
      lastCount: previous.count,
      percentageChange: calcPctChange(current.amount, previous.amount),
    };
  }
  if (hasPermission(permissions, 'dashboard:chargeback')) {
    metrics.chargebackThisMonth = await dashboardRepository.getChargebackThisMonth();
  }
  if (hasPermission(permissions, 'dashboard:refund')) {
    metrics.refundThisMonth = await dashboardRepository.getRefundThisMonth();
  }
  if (hasPermission(permissions, 'dashboard:net-sales')) {
    const current = await dashboardRepository.getNetSalesBetweenDates(curMonthStart, curMonthEnd);
    const previous = await dashboardRepository.getNetSalesBetweenDates(prevMonthStart, prevMonthEnd);
    metrics.netSales = {
      amount: current.amount,
      count: current.count,
      lastAmount: previous.amount,
      lastCount: previous.count,
      percentageChange: calcPctChange(current.amount, previous.amount),
    };
  }
  if (hasPermission(permissions, 'dashboard:top-performer')) {
    metrics.topPerformers = await dashboardRepository.getTopPerformers();
  }
  if (hasPermission(permissions, 'dashboard:bottom-performer')) {
    metrics.bottomPerformers = await dashboardRepository.getBottomPerformers();
  }
  if (hasPermission(permissions, 'dashboard:recent-orders')) {
    const rawOrders = await dashboardRepository.getRecentOrders();
    metrics.recentOrders = rawOrders.map(o => ({
      crmOrderId: o.crmOrderId,
      customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.trim() : 'Unknown Customer',
      salesAgentName: o.salesAgent ? (o.salesAgent.nickname || o.salesAgent.name) : 'Unknown Agent',
      saleStatus: o.saleStatus,
      orderMarkup: o.orderMarkup,
      orderDate: o.orderDate ? o.orderDate.toISOString().split('T')[0] : '',
    }));
  }
  if (hasPermission(permissions, 'dashboard:attendance-summary')) {
    metrics.attendanceSummary = await dashboardRepository.getAttendanceSummary(new Date());
  }
  if (hasPermission(permissions, 'dashboard:pending-counts')) {
    metrics.pendingCounts = await dashboardRepository.getPendingCounts();
  }

  return metrics;
}

export async function getTeamMonthlyReport(session: any, month: number, year: number) {
  const permissions = session?.user?.userPermissions || '';

  // Fetch the aggregate team scores
  const teamsReport = await dashboardRepository.getTeamMonthlyScores(month, year);

  // Enrich each team with top and bottom performer if permitted
  const enrichedReports = await Promise.all(
    teamsReport.map(async (team) => {
      const result: any = { ...team };

      if (hasPermission(permissions, 'dashboard:team-top-performer')) {
        const top = await dashboardRepository.getTeamMonthlyTopPerformer(team.teamId, month, year);
        if (top) {
          result.topPerformer = top;
        }
      }

      if (hasPermission(permissions, 'dashboard:team-bottom-performer')) {
        const bottom = await dashboardRepository.getTeamMonthlyBottomPerformer(team.teamId, month, year);
        if (bottom) {
          result.bottomPerformer = bottom;
        }
      }

      return result;
    })
  );

  return enrichedReports;
}

export async function getAdvancedChartMetrics(
  session: any,
  teamId?: number,
  agentId?: number,
  range = '7d',
  startDateStr?: string,
  endDateStr?: string
) {
  const permissions = session?.user?.userPermissions || '';
  if (!hasPermission(permissions, 'dashboard:view-advanced-chart')) {
    throw new Error('Forbidden');
  }

  const now = new Date();
  let dateFrom: Date;
  let dateTo: Date;
  let granularity = 'daily';
  let isSingleBin = false;
  let singleBinLabel = '';

  const startOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  const endOfDay = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));

  if (range === 'today') {
    dateFrom = startOfDay(now);
    dateTo = endOfDay(now);
    granularity = 'daily';
  } else if (range === 'yesterday') {
    const yest = new Date(now);
    yest.setUTCDate(now.getUTCDate() - 1);
    dateFrom = startOfDay(yest);
    dateTo = endOfDay(yest);
    granularity = 'daily';
  } else if (range === '2d') {
    const yest = new Date(now);
    yest.setUTCDate(now.getUTCDate() - 1);
    dateFrom = startOfDay(yest);
    dateTo = endOfDay(now);
    granularity = 'daily';
  } else if (range === '7d') {
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - 6);
    dateFrom = startOfDay(start);
    dateTo = endOfDay(now);
    granularity = 'daily';
  } else if (range === 'this-week') {
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - now.getUTCDay());
    dateFrom = startOfDay(start);
    dateTo = endOfDay(now);
    granularity = 'weekly';
    isSingleBin = true;
    singleBinLabel = 'This Week';
  } else if (range === 'last-week') {
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - now.getUTCDay() - 7);
    const end = new Date(now);
    end.setUTCDate(now.getUTCDate() - now.getUTCDay() - 1);
    dateFrom = startOfDay(start);
    dateTo = endOfDay(end);
    granularity = 'weekly';
    isSingleBin = true;
    singleBinLabel = 'Last Week';
  } else if (range === '30d') {
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - 29);
    dateFrom = startOfDay(start);
    dateTo = endOfDay(now);
    granularity = 'daily';
  } else if (range === 'this-month') {
    dateFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    dateTo = endOfDay(now);
    granularity = 'monthly';
    isSingleBin = true;
    singleBinLabel = 'This Month';
  } else if (range === 'last-month') {
    dateFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
    granularity = 'monthly';
    isSingleBin = true;
    singleBinLabel = 'Last Month';
  } else if (range === '6m') {
    dateFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1, 0, 0, 0, 0));
    dateTo = endOfDay(now);
    granularity = 'monthly';
  } else if (range === 'this-year' || range === 'year') {
    dateFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    dateTo = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
    granularity = 'yearly';
    isSingleBin = true;
    singleBinLabel = 'This Year';
  } else if (range === 'custom' && startDateStr && endDateStr) {
    dateFrom = startOfDay(new Date(startDateStr));
    dateTo = endOfDay(new Date(endDateStr));
    const diffTime = Math.abs(dateTo.getTime() - dateFrom.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 31) {
      granularity = 'daily';
    } else if (diffDays <= 365) {
      granularity = 'monthly';
    } else {
      granularity = 'yearly';
    }
  } else {
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() - 6);
    dateFrom = startOfDay(start);
    dateTo = endOfDay(now);
    granularity = 'daily';
  }

  interface ClusteredBin {
    label: string;
    salesAmount: number;
    salesCount: number;
    refundsAmount: number;
    refundsCount: number;
    chargebacksAmount: number;
    chargebacksCount: number;
  }

  const bins: ClusteredBin[] = [];

  const formatUtcDateLabel = (date: Date, gran: string): string => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    if (gran === 'daily') {
      return `${y}-${m}-${d}`;
    } else if (gran === 'monthly') {
      return `${y}-${m}`;
    } else {
      return String(y);
    }
  };

  const createBin = (label: string): ClusteredBin => ({
    label,
    salesAmount: 0,
    salesCount: 0,
    refundsAmount: 0,
    refundsCount: 0,
    chargebacksAmount: 0,
    chargebacksCount: 0,
  });

  // Generate bins
  if (isSingleBin) {
    bins.push(createBin(singleBinLabel));
  } else if (granularity === 'daily') {
    const temp = new Date(Date.UTC(dateFrom.getUTCFullYear(), dateFrom.getUTCMonth(), dateFrom.getUTCDate()));
    const end = new Date(Date.UTC(dateTo.getUTCFullYear(), dateTo.getUTCMonth(), dateTo.getUTCDate()));
    while (temp <= end) {
      bins.push(createBin(formatUtcDateLabel(temp, 'daily')));
      temp.setUTCDate(temp.getUTCDate() + 1);
    }
  } else if (granularity === 'monthly') {
    const temp = new Date(Date.UTC(dateFrom.getUTCFullYear(), dateFrom.getUTCMonth(), 1));
    const end = new Date(Date.UTC(dateTo.getUTCFullYear(), dateTo.getUTCMonth(), 1));
    while (temp <= end) {
      bins.push(createBin(formatUtcDateLabel(temp, 'monthly')));
      temp.setUTCMonth(temp.getUTCMonth() + 1);
    }
  } else {
    // yearly
    const temp = new Date(Date.UTC(dateFrom.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(dateTo.getUTCFullYear(), 0, 1));
    while (temp <= end) {
      bins.push(createBin(formatUtcDateLabel(temp, 'yearly')));
      temp.setUTCFullYear(temp.getUTCFullYear() + 1);
    }
  }

  // Query database
  const orders = await dashboardRepository.getAdvancedChartData(teamId, agentId, dateFrom, dateTo);

  // Fill bins
  for (const o of orders) {
    if (!o.orderDate) continue;
    let bin;
    if (isSingleBin) {
      bin = bins[0];
    } else {
      const label = formatUtcDateLabel(new Date(o.orderDate), granularity);
      bin = bins.find(b => b.label === label);
    }
    if (bin) {
      const val = parseFloat(o.orderMarkup || '0');
      if (o.saleStatus === '1') {
        bin.salesAmount += val;
        bin.salesCount += 1;
      } else if (o.saleStatus === '7') {
        bin.refundsAmount += val;
        bin.refundsCount += 1;
      } else if (o.saleStatus === '8') {
        bin.chargebacksAmount += val;
        bin.chargebacksCount += 1;
      }
    }
  }

  return bins;
}
