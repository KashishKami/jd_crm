import { hasPermission } from './permission.service';
import * as dashboardRepository from '../repository/dashboard.repository';

export async function getMetricsForUser(session: any) {
  const permissions = session?.user?.userPermissions || '';
  const metrics: Record<string, any> = {};

  if (hasPermission(permissions, 'dashboard:total-sales')) {
    metrics.totalSales = await dashboardRepository.getTotalSales();
  }
  if (hasPermission(permissions, 'dashboard:monthly-sales')) {
    metrics.totalSalesThisMonth = await dashboardRepository.getTotalSalesThisMonth();
  }
  if (hasPermission(permissions, 'dashboard:today-sales')) {
    metrics.todaySales = await dashboardRepository.getTodaySales();
  }
  if (hasPermission(permissions, 'dashboard:chargeback')) {
    metrics.chargebackThisMonth = await dashboardRepository.getChargebackThisMonth();
  }
  if (hasPermission(permissions, 'dashboard:refund')) {
    metrics.refundThisMonth = await dashboardRepository.getRefundThisMonth();
  }
  if (hasPermission(permissions, 'dashboard:net-sales')) {
    metrics.netSales = await dashboardRepository.getNetSales();
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
