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
