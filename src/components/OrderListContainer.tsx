'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { hasPermission } from '../service/permission.service';
import { fadeInPage } from '../lib/animations';
import OrderList from './OrderList';

interface OrderListContainerProps {
  initialStatus?: string;
}

function OrderListContainerContent({ initialStatus }: OrderListContainerProps) {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || '');
  const [saleStatusFilter, setSaleStatusFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [teams, setTeams] = useState<any[]>([]);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  const containerRef = useRef<HTMLDivElement>(null);

  const permissions = session?.user?.userPermissions || '';
  const canCreate = hasPermission(permissions, 'orders:create');

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, saleStatusFilter, agentFilter, teamFilter, dateFrom, dateTo]);

  // Synchronize URL search parameters with filter states
  useEffect(() => {
    if (!searchParams) return;
    const statusParam = searchParams.get('status');
    const saleStatusParam = searchParams.get('saleStatus');
    const fromParam = searchParams.get('dateFrom');
    const toParam = searchParams.get('dateTo');

    if (statusParam !== null) setStatusFilter(statusParam);
    if (saleStatusParam !== null) setSaleStatusFilter(saleStatusParam);
    if (fromParam !== null) setDateFrom(fromParam);
    if (toParam !== null) setDateTo(toParam);
  }, [searchParams]);

  // Fetch agents for dropdown
  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents?status=1');
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
        }
      } catch (err) {
        console.error('Error fetching agents:', err);
      }
    };
    fetchAgents();
  }, [status]);

  // Fetch teams for dropdown
  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams');
        if (res.ok) {
          const data = await res.json();
          setTeams(data);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
    };
    fetchTeams();
  }, [status]);

  // Fetch orders when filters or page changes
  useEffect(() => {
    if (status !== 'authenticated') return;

    let active = true;
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (saleStatusFilter) params.append('saleStatus', saleStatusFilter);
      if (agentFilter) params.append('agentId', agentFilter);
      if (teamFilter) params.append('teamId', teamFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', String(page));
      params.append('limit', String(limit));

      try {
        const res = await fetch(`/api/orders?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch orders: ${res.statusText}`);
        }
        const data = await res.json();
        if (active) {
          if (data && data.data) {
            setOrders(data.data);
            setTotalPages(data.pages || Math.ceil((data.total || 0) / limit) || 1);
            setTotalItems(data.total || 0);
          } else {
            setOrders(data || []);
            setTotalPages(1);
            setTotalItems(data ? data.length : 0);
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'An error occurred';
        if (active) {
          setError(errMsg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      active = false;
    };
  }, [status, statusFilter, saleStatusFilter, agentFilter, teamFilter, dateFrom, dateTo, page]);

  // Page entrance animation
  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="agents-page-container" style={{ opacity: 0 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {statusFilter === 'Completed Orders' 
              ? 'Completed Orders' 
              : statusFilter 
                ? `${statusFilter} Queue` 
                : 'Sales Orders Pipeline'}
          </h1>
          <p className="page-subtitle">
            {statusFilter === 'Completed Orders'
              ? 'Review and manage all successful completed orders (Sold)'
              : statusFilter 
                ? `Review and manage orders currently in ${statusFilter} state`
                : 'Monitor real-time customer bookings, purchase margins, and pipeline status.'
            }
          </p>
        </div>
        {canCreate && (
          <Link href="/orders/new" className="btn-primary-custom">
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Order Intake
          </Link>
        )}
      </div>

      {/* Filter / Pipeline Navigation Row */}
      <div className="filter-bar">
        {/* Navigation Tabs */}
        <div className="tab-group">
          <button
            onClick={() => setStatusFilter('')}
            className={`tab-btn ${statusFilter === '' ? 'active' : ''}`}
          >
            All Orders
          </button>
          <button
            onClick={() => setStatusFilter('Pending Booking')}
            className={`tab-btn ${statusFilter === 'Pending Booking' ? 'active' : ''}`}
          >
            Pending Booking
          </button>
          <button
            onClick={() => setStatusFilter('Pending Shipment')}
            className={`tab-btn ${statusFilter === 'Pending Shipment' ? 'active' : ''}`}
          >
            Pending Shipment
          </button>
          <button
            onClick={() => setStatusFilter('Pending Delivery')}
            className={`tab-btn ${statusFilter === 'Pending Delivery' ? 'active' : ''}`}
          >
            Pending Delivery
          </button>
          <button
            onClick={() => setStatusFilter('Pending Feedback')}
            className={`tab-btn ${statusFilter === 'Pending Feedback' ? 'active' : ''}`}
          >
            Pending Feedback
          </button>
          <button
            onClick={() => setStatusFilter('Pending Resolutions')}
            className={`tab-btn ${statusFilter === 'Pending Resolutions' ? 'active' : ''}`}
          >
            Pending Resolutions
          </button>
          <button
            onClick={() => setStatusFilter('Completed Orders')}
            className={`tab-btn ${statusFilter === 'Completed Orders' ? 'active' : ''}`}
          >
            Completed Orders
          </button>
        </div>

        {/* Date, Agent & Team Filters */}
        <div className="flex-wrap-container" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '8px', width: '100%' }}>
          <div className="filter-select-wrapper">
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>Team</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
              ))}
            </select>
          </div>
          <div className="filter-select-wrapper">
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>Agent</label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="">All Agents</option>
              {agents.map((a) => (
                <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-select-wrapper">
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>Start Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="filter-select-custom"
            />
          </div>
          <div className="filter-select-wrapper">
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>End Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="filter-select-custom"
            />
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {(saleStatusFilter || dateFrom || dateTo) && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Active Filters:</span>
          {saleStatusFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
              Sale Status: {saleStatusFilter === '1' ? 'Sold' : saleStatusFilter === '2' ? 'Refunded' : saleStatusFilter === '3' ? 'Chargebacked' : saleStatusFilter}
              <button 
                onClick={() => setSaleStatusFilter('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, marginLeft: '4px', color: '#94a3b8' }}
                title="Clear filter"
              >
                ×
              </button>
            </span>
          )}
          {(dateFrom || dateTo) && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
              Date Range: {dateFrom || '*'} to {dateTo || '*'}
              <button 
                onClick={() => { setDateFrom(''); setDateTo(''); }} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, marginLeft: '4px', color: '#94a3b8' }}
                title="Clear filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="loader-box">
          <div className="spinner"></div>
          <p>Loading orders pipeline...</p>
        </div>
      ) : error ? (
        <div className="error-box">
          <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <OrderList orders={orders} />
          {totalPages > 1 && (
            <div className="pagination-bar">
              <button 
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))} 
                disabled={page === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> (Total: {totalItems})
              </span>
              <button 
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} 
                disabled={page === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function OrderListContainer(props: OrderListContainerProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OrderListContainerContent {...props} />
    </Suspense>
  );
}
