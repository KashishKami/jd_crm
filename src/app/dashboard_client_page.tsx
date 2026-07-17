'use client';

import React, { useState, useRef } from 'react';
import { hasPermission } from '../service/permission.service';
import { DashboardMetrics } from '../types/dashboard';
import MetricCard from '../components/dashboard/MetricCard';
import PerformersTable from '../components/dashboard/PerformersTable';
import RecentOrdersTable from '../components/dashboard/RecentOrdersTable';
import AttendanceSummaryRow from '../components/dashboard/AttendanceSummaryRow';
import PendingCountsRow from '../components/dashboard/PendingCountsRow';
import TeamMonthlyScoresWidget from '../components/dashboard/TeamMonthlyScoresWidget';
import ChampionsLeagueWidget from '../components/dashboard/ChampionsLeagueWidget';
import AdvancedChartWidget from '../components/dashboard/AdvancedChartWidget';
import BackendTeamWidget from '../components/dashboard/BackendTeamWidget';

interface DashboardPageProps {
  initialMetrics?: DashboardMetrics;
  userPermissions: string;
  userName: string;
  currentUserId?: string;
  initialBackendData?: any;
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
  currentUserId = '',
  initialBackendData,
}: DashboardPageProps) {
  const permissions = userPermissions;
  
  // Refs and active index for mobile swipable combo columns slider
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (gridRef.current) {
      const { scrollLeft, clientWidth } = gridRef.current;
      if (clientWidth > 0) {
        setActiveIndex(Math.round(scrollLeft / clientWidth));
      }
    }
  };

  // Grid cards configuration based on permissions
  const cards = [];
  const now = new Date();
  
  const getEstParts = (d: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(d);
    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }
    return {
      year: parseInt(map.year),
      month: parseInt(map.month), // 1-indexed
      day: parseInt(map.day)
    };
  };

  const estNow = getEstParts(now);
  const todayStr = `${estNow.year}-${String(estNow.month).padStart(2, '0')}-${String(estNow.day).padStart(2, '0')}`;
  const startOfMonth = `${estNow.year}-${String(estNow.month).padStart(2, '0')}-01`;
  const lastDay = new Date(estNow.year, estNow.month, 0).getDate();
  const endOfMonth = `${estNow.year}-${String(estNow.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const startOfYear = `${estNow.year}-01-01`;
  const endOfYear = `${estNow.year}-12-31`;

  const getOrdinal = (d: number) => {
    if (d > 3 && d < 21) return d + 'th';
    switch (d % 10) {
      case 1:  return d + "st";
      case 2:  return d + "nd";
      case 3:  return d + "rd";
      default: return d + "th";
    }
  };
  
  const prevYearLabel = 'till today last year';


  // Month pro-rated day
  const prevMonthIndex = (estNow.month - 2 + 12) % 12;
  const prevMonthYear = estNow.month === 1 ? estNow.year - 1 : estNow.year;
  const prevMonthMaxDays = new Date(prevMonthYear, prevMonthIndex + 1, 0).getDate();
  const prevMonthDay = Math.min(estNow.day, prevMonthMaxDays);
  const prevMonthLabel = `till ${getOrdinal(prevMonthDay)} last month`;


  // 1. Charged this year
  if (hasPermission(permissions, 'dashboard:total-sales') && initialMetrics.thisYearSales !== undefined) {
    cards.push({
      title: 'Charged this year',
      amount: initialMetrics.thisYearSales.amount,
      count: initialMetrics.thisYearSales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1,2,3,4&dateFrom=${startOfYear}&dateTo=${endOfYear}`,
      lastAmount: initialMetrics.thisYearSales.lastAmount,
      lastCount: initialMetrics.thisYearSales.lastCount,
      percentageChange: initialMetrics.thisYearSales.percentageChange,
      periodLabel: prevYearLabel,
      sparklineData: initialMetrics.thisYearSales.sparklineData,
    });
  }

  // 2. Charged this month
  if (hasPermission(permissions, 'dashboard:monthly-sales') && initialMetrics.totalSalesThisMonth !== undefined) {
    cards.push({
      title: 'Charged this month',
      amount: initialMetrics.totalSalesThisMonth.amount,
      count: initialMetrics.totalSalesThisMonth.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1,2,3,4&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      lastAmount: initialMetrics.totalSalesThisMonth.lastAmount,
      lastCount: initialMetrics.totalSalesThisMonth.lastCount,
      percentageChange: initialMetrics.totalSalesThisMonth.percentageChange,
      periodLabel: prevMonthLabel,
      sparklineData: initialMetrics.totalSalesThisMonth.sparklineData,
    });
  }

  // 3. Today's Sales
  if (hasPermission(permissions, 'dashboard:today-sales') && initialMetrics.todaySales !== undefined) {
    cards.push({
      title: "Today's Sales",
      amount: initialMetrics.todaySales.amount,
      count: initialMetrics.todaySales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1,4&dateFrom=${todayStr}&dateTo=${todayStr}`,
      lastAmount: initialMetrics.todaySales.lastAmount,
      lastCount: initialMetrics.todaySales.lastCount,
      percentageChange: initialMetrics.todaySales.percentageChange,
      periodLabel: 'yesterday',
      sparklineData: initialMetrics.todaySales.sparklineData,
    });
  }

  // 4. Net Sales
  if (hasPermission(permissions, 'dashboard:net-sales') && initialMetrics.netSales !== undefined) {
    cards.push({
      title: 'Net Sales This Month',
      amount: initialMetrics.netSales.amount,
      count: initialMetrics.netSales.count,
      countLabel: 'Sales',
      prefix: '$',
      link: `/orders?saleStatus=1,4&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      lastAmount: initialMetrics.netSales.lastAmount,
      lastCount: initialMetrics.netSales.lastCount,
      percentageChange: initialMetrics.netSales.percentageChange,
      periodLabel: prevMonthLabel,
      sparklineData: initialMetrics.netSales.sparklineData,
    });
  }

  // 5. Refunds
  if (hasPermission(permissions, 'dashboard:refund') && initialMetrics.refundThisMonth !== undefined) {
    cards.push({
      title: 'Refunds This Month',
      amount: initialMetrics.refundThisMonth.amount,
      count: initialMetrics.refundThisMonth.count,
      countLabel: 'Refunds',
      prefix: '$',
      link: `/pending/returned?saleStatus=2&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      lastAmount: initialMetrics.refundThisMonth.lastAmount,
      lastCount: initialMetrics.refundThisMonth.lastCount,
      percentageChange: initialMetrics.refundThisMonth.percentageChange,
      periodLabel: 'last month',
      sparklineData: initialMetrics.refundThisMonth.sparklineData,
    });
  }

  // 6. Chargebacks
  if (hasPermission(permissions, 'dashboard:chargeback') && initialMetrics.chargebackThisMonth !== undefined) {
    cards.push({
      title: 'Chargebacks This Month',
      amount: initialMetrics.chargebackThisMonth.amount,
      count: initialMetrics.chargebackThisMonth.count,
      countLabel: 'Chargebacks',
      prefix: '$',
      link: `/pending/returned?saleStatus=3&dateFrom=${startOfMonth}&dateTo=${endOfMonth}`,
      lastAmount: initialMetrics.chargebackThisMonth.lastAmount,
      lastCount: initialMetrics.chargebackThisMonth.lastCount,
      percentageChange: initialMetrics.chargebackThisMonth.percentageChange,
      periodLabel: 'last month',
      sparklineData: initialMetrics.chargebackThisMonth.sparklineData,
    });
  }

  // Group cards into specified columns/combos
  const combos = [
    {
      top: cards.find(c => c.title === 'Charged this year'),
      bottom: cards.find(c => c.title === 'Charged this month'),
    },
    {
      top: cards.find(c => c.title === "Today's Sales"),
      bottom: cards.find(c => c.title === 'Net Sales This Month'),
    },
    {
      top: cards.find(c => c.title === 'Refunds This Month'),
      bottom: cards.find(c => c.title === 'Chargebacks This Month'),
    }
  ].filter(combo => combo.top || combo.bottom);

  return (
    <div className="agents-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Welcome back, {userName}. Here is your sales activity overview.</p>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      {combos.length > 0 && (
        <>
          <DashboardSectionHeader title="The Scoreboard" />
          <div className="kpi-swipe-container" style={{ position: 'relative', width: '100%' }}>
            <div
              ref={gridRef}
              onScroll={handleScroll}
              className="kpi-cards-grid kpi-cards-swipeable"
            >
              {combos.map((combo, idx) => (
                <div 
                  key={idx} 
                  className="kpi-combo-column" 
                >
                  {combo.top && <MetricCard {...combo.top} />}
                  {combo.bottom && <MetricCard {...combo.bottom} />}
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              <strong>Note:</strong> Charged figures (Year, Month) include Sold, Partially Refunded, Fully Refunded, and Chargebacked orders. Today&apos;s Sales and Net Sales include successful orders (Sold and Partially Refunded) and exclude fully refunded or chargebacked orders.
            </div>

          </div>
        </>
      )}

      <AdvancedChartWidget userPermissions={permissions} currentUserId={currentUserId} />

      {/* Leaderboard and Performance standings */}
      {(hasPermission(permissions, 'dashboard:top-performer') || 
        hasPermission(permissions, 'dashboard:bottom-performer') || 
        hasPermission(permissions, 'dashboard:team-monthly-scores')) && (
          <>
            {(hasPermission(permissions, 'dashboard:top-performer') || 
              hasPermission(permissions, 'dashboard:bottom-performer')) && (
                <ChampionsLeagueWidget 
                  permissions={permissions}
                  initialTopPerformers={initialMetrics.topPerformers}
                  initialBottomPerformers={initialMetrics.bottomPerformers}
                />
            )}

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

      {(hasPermission(permissions, 'dashboard:backend-top-performer') ||
        hasPermission(permissions, 'dashboard:backend-bottom-performer') ||
        hasPermission(permissions, 'dashboard:backend-pending-cases')) && (
          <>
            <DashboardSectionHeader title="Backend Team Performance" />
            <BackendTeamWidget
              initialData={initialBackendData}
              permissions={permissions}
              initialMonth={estNow.month}
              initialYear={estNow.year}
            />
          </>
      )}

      {/* Recent Orders table */}
      {hasPermission(permissions, 'dashboard:recent-orders') && initialMetrics.recentOrders && (
        <>
          <DashboardSectionHeader title="Fresh Orders" />
          <RecentOrdersTable orders={initialMetrics.recentOrders} />
        </>
      )}
    </div>
  );
}
