'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../../service/permission.service';
import ReportFilterBar from './ReportFilterBar';
import ReportSummaryCards from './ReportSummaryCards';
import AgentSalesReportTable from './AgentSalesReportTable';
import {
  AgentSalesFilterParams,
  MetricViewType,
  ReportAgentOption,
  ReportMatrixResponse,
} from '../../types/report';

const STORAGE_KEY = 'REPORT_MATRIX_STATE';

interface FilterState {
  teamIds: number[];
  agentIds: number[];
  range: AgentSalesFilterParams['range'];
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  granularity?: AgentSalesFilterParams['granularity'];
  metricView: MetricViewType;
  page: number;
}

function ReportsContainerContent() {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const permissions = session?.user?.userPermissions;
  const sessionUser = session?.user as any;

  const canViewAgentSales =
    hasPermission(permissions, 'reports:agent-sales') ||
    hasPermission(permissions, 'super-admin') ||
    sessionUser?.roleId === 1;

  const canExport =
    hasPermission(permissions, 'reports:agent-sales-export') ||
    hasPermission(permissions, 'super-admin') ||
    sessionUser?.roleId === 1;

  const [teams, setTeams] = useState<{ teamId: number; teamName: string }[]>([]);
  const [agents, setAgents] = useState<ReportAgentOption[]>([]);
  const [matrixData, setMatrixData] = useState<ReportMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  const effectiveLoading = canViewAgentSales ? isLoading : false;

  // Initial state is identical on both SSR and client initial render to prevent hydration mismatch
  const [filterState, setFilterState] = useState<FilterState>(() => {
    const now = new Date();
    return {
      teamIds: [],
      agentIds: [],
      range: 'monthly',
      startDate: undefined,
      endDate: undefined,
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      granularity: 'summary',
      metricView: 'all',
      page: 1,
    };
  });

  // Restore state from sessionStorage & URL on client mount
  useEffect(() => {
    queueMicrotask(() => {
      let initialPage = 1;
      if (typeof window !== 'undefined') {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const p = urlParams.get('page');
          if (p) {
            initialPage = parseInt(p, 10) || 1;
          }
        } catch {}

        try {
          // Normal visit or Back-button navigation: restore saved state if present
          const saved = sessionStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setFilterState({
              teamIds: parsed.teamIds || [],
              agentIds: parsed.agentIds || [],
              range: parsed.range || 'monthly',
              startDate: parsed.startDate || undefined,
              endDate: parsed.endDate || undefined,
              year: parsed.year !== undefined ? parsed.year : new Date().getUTCFullYear(),
              month: parsed.month !== undefined ? parsed.month : (new Date().getUTCMonth() + 1),
              granularity: parsed.granularity || 'summary',
              metricView: parsed.metricView || 'all',
              page: initialPage !== 1 ? initialPage : (parsed.page || 1),
            });
            setIsHydrated(true);
            return;
          }
        } catch (e) {
          console.error('Failed to parse saved report state:', e);
        }

        if (initialPage !== 1) {
          setFilterState((prev) => ({ ...prev, page: initialPage }));
        }
      }
      setIsHydrated(true);
    });
  }, []);

  const pageParam = searchParams?.get('page');
  const parsedPage = pageParam ? (parseInt(pageParam, 10) || 1) : 1;
  const [prevSearchParamsPage, setPrevSearchParamsPage] = useState(parsedPage);
  if (parsedPage !== prevSearchParamsPage) {
    setPrevSearchParamsPage(parsedPage);
    if (filterState.page !== parsedPage) {
      setFilterState((prev) => ({ ...prev, page: parsedPage }));
    }
  }

  // Listen for browser back / forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const p = urlParams.get('page');
      const parsed = p ? (parseInt(p, 10) || 1) : 1;
      setFilterState((prev) => (prev.page !== parsed ? { ...prev, page: parsed } : prev));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filterState));
      } catch (e) {
        console.error('Failed to save report state:', e);
      }
    }
  }, [filterState, isHydrated]);

  // Load initial filter options (teams & sales agents)
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const res = await fetch('/api/reports/filters');
        if (res.ok) {
          const json = await res.json();
          if (json.teams) setTeams(json.teams);
          if (json.agents) setAgents(json.agents);
        }
      } catch (error) {
        console.error('Failed to load report filter options:', error);
      }
    }
    loadFilterOptions();
  }, []);

  // Fetch report matrix data based on active filters
  useEffect(() => {
    if (!isHydrated || sessionStatus === 'loading' || !canViewAgentSales) return;

    let ignore = false;
    async function loadMatrixData() {
      try {
        setIsLoading(true);
        setFetchError(null);
        const params = new URLSearchParams();
        params.set('range', filterState.range || 'monthly');
        if (filterState.teamIds.length > 0) {
          params.set('teamId', filterState.teamIds.join(','));
        }
        if (filterState.agentIds.length > 0) {
          params.set('agentId', filterState.agentIds.join(','));
        }
        if (filterState.startDate) {
          params.set('startDate', filterState.startDate);
        }
        if (filterState.endDate) {
          params.set('endDate', filterState.endDate);
        }
        if (filterState.year) {
          params.set('year', String(filterState.year));
        }
        if (filterState.month) {
          params.set('month', String(filterState.month));
        }
        if (filterState.granularity) {
          params.set('granularity', filterState.granularity);
        }

        const res = await fetch(`/api/reports/agent-sales?${params.toString()}`);
        if (!ignore) {
          if (res.status === 403) {
            setFetchError('Access Denied: You do not have permission to view this report.');
            setMatrixData(null);
          } else if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setMatrixData(json.data);
              setFetchError(null);
            }
          } else {
            setFetchError('Failed to load report data.');
            setMatrixData(null);
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error('Failed to fetch agent sales report data:', error);
          setFetchError('Failed to fetch report data.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadMatrixData();

    return () => {
      ignore = true;
    };
  }, [
    isHydrated,
    sessionStatus,
    canViewAgentSales,
    filterState.range,
    filterState.teamIds,
    filterState.agentIds,
    filterState.startDate,
    filterState.endDate,
    filterState.year,
    filterState.month,
    filterState.granularity,
  ]);

  // Restore scroll position when returning from another page
  useEffect(() => {
    if (!isLoading && matrixData && typeof window !== 'undefined') {
      const savedScroll = sessionStorage.getItem('REPORT_SCROLL_POS');
      if (savedScroll) {
        const top = parseInt(savedScroll, 10);
        if (!isNaN(top) && top > 0) {
          setTimeout(() => {
            window.scrollTo({ top, behavior: 'instant' });
            sessionStorage.removeItem('REPORT_SCROLL_POS');
          }, 60);
        }
      }
    }
  }, [isLoading, matrixData]);

  const handleFilterChange = (newFilters: {
    teamIds?: number[];
    agentIds?: number[];
    range?: AgentSalesFilterParams['range'];
    startDate?: string;
    endDate?: string;
    year?: number;
    month?: number;
    granularity?: AgentSalesFilterParams['granularity'];
  }) => {
    setFilterState((prev) => ({
      ...prev,
      teamIds: newFilters.teamIds !== undefined ? newFilters.teamIds : prev.teamIds,
      agentIds: newFilters.agentIds !== undefined ? newFilters.agentIds : prev.agentIds,
      range: newFilters.range !== undefined ? newFilters.range : prev.range,
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
      year: newFilters.year !== undefined ? newFilters.year : prev.year,
      month: newFilters.month !== undefined ? newFilters.month : prev.month,
      granularity: newFilters.granularity !== undefined ? newFilters.granularity : prev.granularity,
      page: 1,
    }));
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('page');
      window.history.pushState({}, '', url.toString());
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilterState((prev) => ({
      ...prev,
      page: newPage,
    }));
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newPage > 1) {
        url.searchParams.set('page', String(newPage));
      } else {
        url.searchParams.delete('page');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleMetricViewChange = (newMetricView: MetricViewType) => {
    setFilterState((prev) => ({
      ...prev,
      metricView: newMetricView,
    }));
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('range', filterState.range || 'monthly');
      params.set(
        'metricView',
        Array.isArray(filterState.metricView)
          ? filterState.metricView.join(',')
          : filterState.metricView
      );
      if (filterState.teamIds.length > 0) {
        params.set('teamId', filterState.teamIds.join(','));
      }
      if (filterState.agentIds.length > 0) {
        params.set('agentId', filterState.agentIds.join(','));
      }
      if (filterState.startDate) {
        params.set('startDate', filterState.startDate);
      }
      if (filterState.endDate) {
        params.set('endDate', filterState.endDate);
      }
      if (filterState.year) {
        params.set('year', String(filterState.year));
      }
      if (filterState.month) {
        params.set('month', String(filterState.month));
      }
      if (filterState.granularity) {
        params.set('granularity', filterState.granularity);
      }

      const res = await fetch(`/api/reports/agent-sales/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Agent_Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export Excel report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="agents-page-container flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="agents-page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">
            Agent Sales Performance Aggregates & Financial Breakdown
          </p>
        </div>
      </div>

      {/* Sub-Navigation Workflow Tabs */}
      <div className="filter-bar">
        <div className="tab-group">
          {canViewAgentSales && (
            <button
              type="button"
              className="tab-btn active"
            >
              Agent Report
            </button>
          )}
        </div>
      </div>

      {!canViewAgentSales ? (
        <div className="denied-container" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <div className="denied-card" style={{ textAlign: 'center', padding: '40px 24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div className="denied-icon" style={{ display: 'inline-flex', padding: '12px', background: '#fef2f2', borderRadius: '50%', color: '#ef4444', marginBottom: '16px' }}>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: '32px', height: '32px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="denied-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
              Access Restricted
            </h2>
            <p className="denied-message" style={{ fontSize: '0.875rem', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px', lineHeight: 1.5 }}>
              You do not have permission to view this report. Please contact your system administrator to assign report permissions.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <ReportFilterBar
            teams={teams}
            agents={agents}
            selectedTeamIds={filterState.teamIds}
            selectedAgentIds={filterState.agentIds}
            range={filterState.range}
            startDate={filterState.startDate}
            endDate={filterState.endDate}
            year={filterState.year}
            month={filterState.month}
            granularity={filterState.granularity}
            metricView={filterState.metricView}
            onFilterChange={handleFilterChange}
            onMetricViewChange={handleMetricViewChange}
            onExportExcel={handleExportExcel}
            isExporting={isExporting}
            canExport={canExport}
          />

          {/* Top Aggregate Summary Cards */}
          {matrixData && !effectiveLoading && !fetchError && (
            <ReportSummaryCards
              orgTotal={matrixData.orgTotal}
              globalStartDate={matrixData.globalStartDate}
              globalEndDate={matrixData.globalEndDate}
              rangeLabel={matrixData.rangeLabel}
              teamIds={filterState.teamIds}
            />
          )}

          {/* Matrix Table */}
          <AgentSalesReportTable
            matrixData={matrixData}
            metricView={filterState.metricView}
            selectedTeamIds={filterState.teamIds}
            isLoading={effectiveLoading}
            currentPage={filterState.page}
            onPageChange={handlePageChange}
            error={fetchError}
          />
        </>
      )}
    </div>
  );
}

export default function ReportsContainer() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ReportsContainerContent />
    </Suspense>
  );
}
