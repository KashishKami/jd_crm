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

  if (hasPermission(permissions, 'dashboard:total-sales') && initialMetrics.totalSales !== undefined) {
    cards.push({
      title: 'Total Sales',
      amount: initialMetrics.totalSales.amount,
      count: initialMetrics.totalSales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: '/orders?saleStatus=1',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5M4.5 19.5h15M5.25 4.5v15M18.75 4.5v15" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      description: 'Historical overall sales count',
    });
  }

  if (hasPermission(permissions, 'dashboard:monthly-sales') && initialMetrics.totalSalesThisMonth !== undefined) {
    cards.push({
      title: 'Sales This Month',
      amount: initialMetrics.totalSalesThisMonth.amount,
      count: initialMetrics.totalSalesThisMonth.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #10b981, #047857)',
      description: 'Sales volumes in current month',
    });
  }

  if (hasPermission(permissions, 'dashboard:today-sales') && initialMetrics.todaySales !== undefined) {
    cards.push({
      title: 'Today\'s Sales',
      amount: initialMetrics.todaySales.amount,
      count: initialMetrics.todaySales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1&dateFrom=${todayStr}&dateTo=${todayStr}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      description: 'Daily order intake count',
    });
  }

  if (hasPermission(permissions, 'dashboard:chargeback') && initialMetrics.chargebackThisMonth !== undefined) {
    cards.push({
      title: 'Chargebacks',
      amount: initialMetrics.chargebackThisMonth.amount,
      count: initialMetrics.chargebackThisMonth.count,
      countLabel: 'Chargebacks',
      prefix: '$',
      link: `/orders?saleStatus=8&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)',
      description: 'Disputed orders this month',
    });
  }

  if (hasPermission(permissions, 'dashboard:refund') && initialMetrics.refundThisMonth !== undefined) {
    cards.push({
      title: 'Refunds',
      amount: initialMetrics.refundThisMonth.amount,
      count: initialMetrics.refundThisMonth.count,
      countLabel: 'Refunds',
      prefix: '$',
      link: `/orders?saleStatus=7&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      description: 'Returned funds this month',
    });
  }

  if (hasPermission(permissions, 'dashboard:net-sales') && initialMetrics.netSales !== undefined) {
    cards.push({
      title: 'Net Sales',
      amount: initialMetrics.netSales.amount,
      count: initialMetrics.netSales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: '/orders?saleStatus=1,7,8',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.879a3 3 0 004.243 0L15 15.364M9 8.702l.879-.879a3 3 0 014.243 0M9 12h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      description: 'Margin volume: Sold - Refund - Chg',
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
