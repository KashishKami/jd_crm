'use client';

import React from 'react';
import { hasPermission } from '../service/permission.service';
import { DashboardMetrics } from '../types/dashboard';
import MetricCard from '../components/dashboard/MetricCard';
import PerformersTable from '../components/dashboard/PerformersTable';
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';
import AttendanceSummaryRow from '../components/dashboard/AttendanceSummaryRow';
import PendingCountsRow from '../components/dashboard/PendingCountsRow';
import TeamMonthlyScoresWidget from '../components/dashboard/TeamMonthlyScoresWidget';

interface DashboardPageProps {
  initialMetrics?: DashboardMetrics;
  userPermissions: string;
  userName: string;
}

const DashboardSectionHeader = ({ title }: { title: string }) => (
  <div className="dashboard-section-header">
    <h2>{title}</h2>
  </div>
);

export default function DashboardPage({
  initialMetrics = {},
  userPermissions = '',
  userName = '',
}: DashboardPageProps) {
  const permissions = userPermissions;

  // Grid cards configuration based on permissions
  const cards = [];
  const now = new Date();
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const startOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  const endOfMonth = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const todayStr = formatLocalDate(now);
  const startOfYear = `${now.getFullYear()}-01-01`;
  const endOfYear = `${now.getFullYear()}-12-31`;

  // 1. This Year Sales
  if (hasPermission(permissions, 'dashboard:total-sales') && initialMetrics.thisYearSales !== undefined) {
    cards.push({
      title: 'This Year Sales',
      amount: initialMetrics.thisYearSales.amount,
      count: initialMetrics.thisYearSales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1&dateFrom=${startOfYear}&dateTo=${endOfYear}`,
      lastAmount: initialMetrics.thisYearSales.lastAmount,
      lastCount: initialMetrics.thisYearSales.lastCount,
      percentageChange: initialMetrics.thisYearSales.percentageChange,
      periodLabel: 'last year',
    });
  }

  // 2. Sales This Month
  if (hasPermission(permissions, 'dashboard:monthly-sales') && initialMetrics.totalSalesThisMonth !== undefined) {
    cards.push({
      title: 'Sales This Month',
      amount: initialMetrics.totalSalesThisMonth.amount,
      count: initialMetrics.totalSalesThisMonth.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      lastAmount: initialMetrics.totalSalesThisMonth.lastAmount,
      lastCount: initialMetrics.totalSalesThisMonth.lastCount,
      percentageChange: initialMetrics.totalSalesThisMonth.percentageChange,
      periodLabel: 'last month',
    });
  }

  // 3. Today\'s Sales
  if (hasPermission(permissions, 'dashboard:today-sales') && initialMetrics.todaySales !== undefined) {
    cards.push({
      title: 'Today\'s Sales',
      amount: initialMetrics.todaySales.amount,
      count: initialMetrics.todaySales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1&dateFrom=${todayStr}&dateTo=${todayStr}`,
      lastAmount: initialMetrics.todaySales.lastAmount,
      lastCount: initialMetrics.todaySales.lastCount,
      percentageChange: initialMetrics.todaySales.percentageChange,
      periodLabel: 'yesterday',
    });
  }

  // 4. Net Sales
  if (hasPermission(permissions, 'dashboard:net-sales') && initialMetrics.netSales !== undefined) {
    cards.push({
      title: 'Net Sales',
      amount: initialMetrics.netSales.amount,
      count: initialMetrics.netSales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: '/orders?saleStatus=1,7,8',
      lastAmount: initialMetrics.netSales.lastAmount,
      lastCount: initialMetrics.netSales.lastCount,
      percentageChange: initialMetrics.netSales.percentageChange,
      periodLabel: 'last month',
    });
  }

  // 5. Refunds (No comparisons, placed 5th)
  if (hasPermission(permissions, 'dashboard:refund') && initialMetrics.refundThisMonth !== undefined) {
    cards.push({
      title: 'Refunds',
      amount: initialMetrics.refundThisMonth.amount,
      count: initialMetrics.refundThisMonth.count,
      countLabel: 'Refunds',
      prefix: '$',
      link: `/orders?saleStatus=7&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      description: 'Returned funds this month',
    });
  }

  // 6. Chargebacks (No comparisons, placed 6th)
  if (hasPermission(permissions, 'dashboard:chargeback') && initialMetrics.chargebackThisMonth !== undefined) {
    cards.push({
      title: 'Chargebacks',
      amount: initialMetrics.chargebackThisMonth.amount,
      count: initialMetrics.chargebackThisMonth.count,
      countLabel: 'Chargebacks',
      prefix: '$',
      link: `/orders?saleStatus=8&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      description: 'Disputed orders this month',
    });
  }

  return (
    <div className="agents-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Welcome back, {userName}. Here is your sales activity overview.</p>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      {cards.length > 0 && (
        <>
          <DashboardSectionHeader title="The Scoreboard" />
          <div className="kpi-cards-grid">
            {cards.map((card, idx) => (
              <MetricCard key={idx} {...card} />
            ))}
          </div>
        </>
      )}

      {/* Leaderboard and Performance standings */}
      {(hasPermission(permissions, 'dashboard:top-performer') || 
        hasPermission(permissions, 'dashboard:bottom-performer') || 
        hasPermission(permissions, 'dashboard:team-monthly-scores')) && (
          <>
            <DashboardSectionHeader title="Champions League" />
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {hasPermission(permissions, 'dashboard:top-performer') && initialMetrics.topPerformers && (
                <PerformersTable title="Top Performers" performers={initialMetrics.topPerformers} isTop={true} />
              )}
              {hasPermission(permissions, 'dashboard:bottom-performer') && initialMetrics.bottomPerformers && (
                <PerformersTable title="Bottom Performers" performers={initialMetrics.bottomPerformers} isTop={false} />
              )}
            </div>

            {hasPermission(permissions, 'dashboard:team-monthly-scores') && (
              <TeamMonthlyScoresWidget permissions={permissions} />
            )}
          </>
      )}

      {/* Pipeline queue summary */}
      {hasPermission(permissions, 'dashboard:pending-counts') && initialMetrics.pendingCounts && (
        <>
          <DashboardSectionHeader title="Orders Journey" />
          <PendingCountsRow pendingCounts={initialMetrics.pendingCounts} />
        </>
      )}

      {/* Recent Orders table */}
      {hasPermission(permissions, 'dashboard:recent-orders') && initialMetrics.recentOrders && (
        <>
          <DashboardSectionHeader title="Fresh Orders" />
          <RecentOrdersTable orders={initialMetrics.recentOrders} />
        </>
      )}

      {/* Attendance summary moved to the bottom */}
      {hasPermission(permissions, 'dashboard:attendance-summary') && initialMetrics.attendanceSummary && (
        <>
          <DashboardSectionHeader title="Who’s In Today?" />
          <AttendanceSummaryRow summary={initialMetrics.attendanceSummary} />
        </>
      )}
    </div>
  );
}
