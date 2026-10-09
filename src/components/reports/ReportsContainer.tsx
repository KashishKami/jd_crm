'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  metricView: MetricViewType;
  page: number;
}

function ReportsContainerContent() {
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<{ teamId: number; teamName: string }[]>([]);
  const [agents, setAgents] = useState<ReportAgentOption[]>([]);
  const [matrixData, setMatrixData] = useState<ReportMatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Initialize state with URL param > sessionStorage > defaults
  const [filterState, setFilterState] = useState<FilterState>(() => {
    let initialPage = 1;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const p = urlParams.get('page');
      if (p) {
        initialPage = parseInt(p, 10) || 1;
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            teamIds: parsed.teamIds || [],
            agentIds: parsed.agentIds || [],
            range: parsed.range || 'monthly',
            startDate: parsed.startDate || undefined,
            endDate: parsed.endDate || undefined,
            metricView: parsed.metricView || 'all',
            page: initialPage !== 1 ? initialPage : (parsed.page || 1),
          };
        }
      } catch (e) {
        console.error('Failed to parse saved report state:', e);
      }
    }
    return {
      teamIds: [],
      agentIds: [],
      range: 'monthly',
      startDate: undefined,
      endDate: undefined,
      metricView: 'all',
      page: initialPage,
    };
  });

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
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filterState));
      } catch (e) {
        console.error('Failed to save report state:', e);
      }
    }
  }, [filterState]);

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
    let ignore = false;
    async function loadMatrixData() {
      try {
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

        const res = await fetch(`/api/reports/agent-sales?${params.toString()}`);
        if (!ignore && res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setMatrixData(json.data);
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error('Failed to fetch agent sales report data:', error);
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
  }, [filterState.range, filterState.teamIds, filterState.agentIds, filterState.startDate, filterState.endDate]);

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
  }) => {
    setFilterState((prev) => ({
      ...prev,
      teamIds: newFilters.teamIds !== undefined ? newFilters.teamIds : prev.teamIds,
      agentIds: newFilters.agentIds !== undefined ? newFilters.agentIds : prev.agentIds,
      range: newFilters.range !== undefined ? newFilters.range : prev.range,
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
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
          <button
            type="button"
            className="tab-btn active"
          >
            Agent Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <ReportFilterBar
        teams={teams}
        agents={agents}
        selectedTeamIds={filterState.teamIds}
        selectedAgentIds={filterState.agentIds}
        range={filterState.range}
        startDate={filterState.startDate}
        endDate={filterState.endDate}
        metricView={filterState.metricView}
        onFilterChange={handleFilterChange}
        onMetricViewChange={handleMetricViewChange}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
      />

      {/* Top Aggregate Summary Cards */}
      {matrixData && !isLoading && (
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
        isLoading={isLoading}
        currentPage={filterState.page}
        onPageChange={handlePageChange}
      />
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
