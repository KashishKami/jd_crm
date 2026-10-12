'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Pagination from '../Pagination';
import { MetricType, MetricViewType, PeriodMetrics, ReportMatrixResponse } from '../../types/report';

const PAGE_SIZE = 20;

interface AgentSalesReportTableProps {
  matrixData: ReportMatrixResponse | null;
  metricView: MetricViewType;
  selectedTeamIds?: number[];
  isLoading?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  error?: string | null;
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num || 0);
}

function formatCount(num: number): string {
  return new Intl.NumberFormat('en-US').format(num || 0);
}

function getActiveMetrics(metricView: MetricViewType): MetricType[] {
  if (metricView === 'all') return ['sales', 'refunds', 'chargebacks', 'net'];
  if (metricView === 'sales') return ['sales'];
  if (metricView === 'refunds') return ['refunds'];
  if (metricView === 'chargebacks') return ['chargebacks'];
  if (metricView === 'net') return ['net'];
  if (Array.isArray(metricView) && metricView.length > 0) return metricView;
  return ['sales', 'refunds', 'chargebacks', 'net'];
}

export default function AgentSalesReportTable({
  matrixData,
  metricView,
  selectedTeamIds = [],
  isLoading = false,
  currentPage,
  onPageChange,
  error,
}: AgentSalesReportTableProps) {
  const [localPage, setLocalPage] = useState<number>(1);
  const activePage = currentPage !== undefined ? currentPage : localPage;
  const handlePageChange = onPageChange || setLocalPage;
  const activeMetrics = useMemo(() => getActiveMetrics(metricView), [metricView]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  useEffect(() => {
    if (!isLoading && matrixData && typeof window !== 'undefined') {
      const savedX = sessionStorage.getItem('REPORT_SCROLL_X');
      if (savedX !== null) {
        const x = Number(savedX);
        if (!isNaN(x)) {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = x;
          }
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollLeft = x;
            }
          }, 60);
          sessionStorage.removeItem('REPORT_SCROLL_X');
        }
      }
    }
  }, [isLoading, matrixData]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !scrollContainerRef.current) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    setIsGrabbing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
  };

  if (isLoading) {
    return (
      <div className="reports-table-card p-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-semibold">Generating report matrix...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-table-card p-16 text-center">
        <div className="text-red-500 text-3xl mb-2">⚠️</div>
        <h3 className="text-base font-bold text-slate-800">Unable to Load Report</h3>
        <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
      </div>
    );
  }

  if (!matrixData || matrixData.agents.length === 0) {
    return (
      <div className="reports-table-card p-16 text-center">
        <div className="text-slate-400 text-3xl mb-2">📊</div>
        <h3 className="text-base font-bold text-slate-800">No Sales Data Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Try adjusting your center, agent, or date range filters.
        </p>
      </div>
    );
  }

  const { periods, agents } = matrixData;
  const totalPages = Math.max(1, Math.ceil(agents.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, activePage), totalPages);
  const paginatedAgents = agents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const buildDrillDownUrl = (
    agentId?: number,
    startDate?: string,
    endDate?: string,
    metricType?: 'net' | 'sales' | 'refunds' | 'chargebacks'
  ) => {
    const params = new URLSearchParams();
    if (agentId && agentId > 0) {
      params.set('agentId', String(agentId));
    }
    const sDate = startDate || matrixData.globalStartDate;
    const eDate = endDate || matrixData.globalEndDate;
    if (sDate) params.set('dateFrom', sDate);
    if (eDate) params.set('dateTo', eDate);
    if (selectedTeamIds.length > 0) {
      params.set('teamId', selectedTeamIds.join(','));
    }

    if (metricType === 'sales') {
      params.set('saleStatus', '1,4,2,3');
    } else if (metricType === 'net') {
      params.set('saleStatus', '1,4');
    } else if (metricType === 'refunds') {
      params.set('saleStatus', '2');
    } else if (metricType === 'chargebacks') {
      params.set('saleStatus', '3');
    }
    return `/orders?${params.toString()}`;
  };

  const handleDrillDownClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('REPORT_SCROLL_POS', String(window.scrollY));
        if (scrollContainerRef.current) {
          sessionStorage.setItem('REPORT_SCROLL_X', String(scrollContainerRef.current.scrollLeft));
        }
        sessionStorage.setItem('REPORT_RETURNING_FROM_DRILLDOWN', 'true');
      } catch {
        // ignore
      }
    }
  };

  const renderMetricCell = (
    metrics: PeriodMetrics,
    agentId?: number,
    startDate?: string,
    endDate?: string
  ) => {
    const isNetZero = metrics.netSales === 0 && metrics.netSalesCount === 0;
    const isSalesZero = metrics.salesAmount === 0 && metrics.salesCount === 0;
    const isRefZero = metrics.refundsAmount === 0 && metrics.refundsCount === 0;
    const isCbZero = metrics.chargebacksAmount === 0 && metrics.chargebacksCount === 0;

    // If there is no activity in this period, render clean dash instead of cluttered zeros
    if (isSalesZero && isRefZero && isCbZero && isNetZero) {
      return (
        <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.95rem', userSelect: 'none' }}>
          —
        </div>
      );
    }

    if (activeMetrics.length === 1) {
      const single = activeMetrics[0];
      if (single === 'sales') {
        if (isSalesZero) {
          return <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.95rem', userSelect: 'none' }}>—</div>;
        }
        return (
          <div className="report-single-metric-cell font-mono text-slate-700">
            <Link
              href={buildDrillDownUrl(agentId, startDate, endDate, 'sales')}
              onClick={handleDrillDownClick}
              className="report-single-val font-semibold hover:underline"
            >
              {formatCurrency(metrics.salesAmount)}
            </Link>
            <span className="report-single-cnt">({formatCount(metrics.salesCount)})</span>
          </div>
        );
      }
      if (single === 'refunds') {
        if (isRefZero) {
          return <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.95rem', userSelect: 'none' }}>—</div>;
        }
        return (
          <div className="report-single-metric-cell font-mono text-rose-600">
            <Link
              href={buildDrillDownUrl(agentId, startDate, endDate, 'refunds')}
              onClick={handleDrillDownClick}
              className="report-single-val font-semibold hover:underline"
            >
              {formatCurrency(metrics.refundsAmount)}
            </Link>
            <span className="report-single-cnt">({formatCount(metrics.refundsCount)})</span>
          </div>
        );
      }
      if (single === 'chargebacks') {
        if (isCbZero) {
          return <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.95rem', userSelect: 'none' }}>—</div>;
        }
        return (
          <div className="report-single-metric-cell font-mono text-amber-600">
            <Link
              href={buildDrillDownUrl(agentId, startDate, endDate, 'chargebacks')}
              onClick={handleDrillDownClick}
              className="report-single-val font-semibold hover:underline"
            >
              {formatCurrency(metrics.chargebacksAmount)}
            </Link>
            <span className="report-single-cnt">({formatCount(metrics.chargebacksCount)})</span>
          </div>
        );
      }
      if (single === 'net') {
        if (isNetZero) {
          return <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.95rem', userSelect: 'none' }}>—</div>;
        }
        return (
          <div className="report-single-metric-cell font-mono text-emerald-700">
            <Link
              href={buildDrillDownUrl(agentId, startDate, endDate, 'net')}
              onClick={handleDrillDownClick}
              className="report-single-val font-semibold hover:underline"
            >
              {formatCurrency(metrics.netSales)}
            </Link>
            <span className="report-single-cnt">({formatCount(metrics.netSalesCount)})</span>
          </div>
        );
      }
    }

    return (
      <div className="report-cell-stack font-mono">
        {/* Gross Sales */}
        {activeMetrics.includes('sales') && (
          <div className={`report-metric-line ${isSalesZero ? 'text-slate-300' : 'text-slate-700'}`}>
            <span className="report-metric-lbl">Sales:</span>
            <Link
              href={buildDrillDownUrl(agentId, startDate, endDate, 'sales')}
              onClick={handleDrillDownClick}
              className="report-metric-num hover:underline font-medium"
            >
              <span className="report-val-text">{formatCurrency(metrics.salesAmount)}</span>
              <span className="report-metric-count">({formatCount(metrics.salesCount)})</span>
            </Link>
          </div>
        )}

        {/* Refunds */}
        {activeMetrics.includes('refunds') && (
          <div className={`report-metric-line ${isRefZero ? 'text-slate-300' : 'text-rose-600'}`}>
            <span className="report-metric-lbl">Ref:</span>
            <Link
              href={buildDrillDownUrl(agentId, startDate, endDate, 'refunds')}
              onClick={handleDrillDownClick}
              className="report-metric-num hover:underline font-medium"
            >
              <span className="report-val-text">{formatCurrency(metrics.refundsAmount)}</span>
              <span className="report-metric-count">({formatCount(metrics.refundsCount)})</span>
            </Link>
          </div>
        )}

        {/* Chargebacks */}
        {activeMetrics.includes('chargebacks') && (
          <div className={`report-metric-line ${isCbZero ? 'text-slate-300' : 'text-amber-600'}`}>
            <span className="report-metric-lbl">Chb:</span>
            <Link
              href={buildDrillDownUrl(agentId, startDate, endDate, 'chargebacks')}
              onClick={handleDrillDownClick}
              className="report-metric-num hover:underline font-medium"
            >
              <span className="report-val-text">{formatCurrency(metrics.chargebacksAmount)}</span>
              <span className="report-metric-count">({formatCount(metrics.chargebacksCount)})</span>
            </Link>
          </div>
        )}

        {/* Net Sales */}
        {activeMetrics.includes('net') && (
          <div className={`report-metric-line ${isNetZero ? 'text-slate-300' : 'text-emerald-700 font-semibold'}`}>
            <span className="report-metric-lbl">Net:</span>
            <Link
              href={buildDrillDownUrl(agentId, startDate, endDate, 'net')}
              onClick={handleDrillDownClick}
              className="report-metric-num hover:underline font-semibold"
            >
              <span className="report-val-text">{formatCurrency(metrics.netSales)}</span>
              <span className="report-metric-count">({formatCount(metrics.netSalesCount)})</span>
            </Link>
          </div>
        )}
      </div>
    );
  };

  const getMetricHeaderLabel = () => {
    if (activeMetrics.length === 4) return 'Performance Breakdown';
    if (activeMetrics.length === 1) {
      if (activeMetrics[0] === 'sales') return 'Gross Sales ($ & Qty)';
      if (activeMetrics[0] === 'refunds') return 'Refunds ($ & Qty)';
      if (activeMetrics[0] === 'chargebacks') return 'Chargebacks ($ & Qty)';
      if (activeMetrics[0] === 'net') return 'Net Sales ($ & Qty)';
    }
    return 'Selected Metrics Breakdown';
  };

  const isSinglePeriod = periods.length <= 1;

  return (
    <div className={`reports-table-card ${isSinglePeriod ? 'single-column-card' : ''}`}>
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`reports-table-scroll-container ${isGrabbing ? 'is-grabbing' : ''}`}
      >
        <table className={`reports-matrix-table ${isSinglePeriod ? 'single-column-table' : ''}`}>
          {/* Header Row: Clean light styling matching CRM tables */}
          <thead>
            <tr>
              {/* Sticky Col 1: Agent Details */}
              <th className="agent-header">
                <div style={{ color: '#0f172a', fontWeight: 700 }}>Agent</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500, marginTop: '2px', textTransform: 'none' }}>
                  (Center)
                </div>
              </th>

              {/* Range Grand Total Header (only if > 1 period to avoid redundancy) */}
              {periods.length > 1 && (
                <th className="grandtotal-header">
                  <div style={{ color: '#0f172a', fontWeight: 700 }}>Range Grand Total</div>
                  <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600, marginTop: '2px', textTransform: 'none' }}>
                    {getMetricHeaderLabel()}
                  </div>
                </th>
              )}

              {/* 1 Header Column Per Period */}
              {periods.map((period) => (
                <th key={period.key}>
                  <div style={{ color: '#0f172a', fontWeight: 700 }}>{period.label}</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500, marginTop: '2px', textTransform: 'none' }}>
                    {getMetricHeaderLabel()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Individual Paginated Agent Rows */}
            {paginatedAgents.map((agent) => (
              <tr key={agent.agentId}>
                {/* Sticky Left Agent Details */}
                <td className="agent-cell">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {agent.nickname || agent.agentName}
                      </div>
                      {agent.teamName && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, marginTop: '1px' }}>
                          ({agent.teamName})
                        </div>
                      )}
                    </div>
                    {agent.status === 0 && (
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', padding: '1px 4px', borderRadius: '4px', flexShrink: 0 }}>
                        Inactive
                      </span>
                    )}
                  </div>
                </td>

                {/* Grand Total for this Agent (only if > 1 period) */}
                {periods.length > 1 && (
                  <td className="grandtotal-cell">
                    {renderMetricCell(agent.grandTotal, agent.agentId)}
                  </td>
                )}

                {/* Period Metric Cells (1 cell per month with vertical stack) */}
                {periods.map((period) => {
                  const pMetrics = agent.periods[period.key] || {
                    salesAmount: 0,
                    salesCount: 0,
                    refundsAmount: 0,
                    refundsCount: 0,
                    chargebacksAmount: 0,
                    chargebacksCount: 0,
                    netSales: 0,
                    netSalesCount: 0,
                  };
                  return (
                    <td key={`${agent.agentId}-${period.key}`}>
                      {renderMetricCell(
                        pMetrics,
                        agent.agentId,
                        period.startDate,
                        period.endDate
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #cbd5e1', background: '#f8fafc' }}>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={agents.length}
            itemLabel="agents"
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
