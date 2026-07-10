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
  const [backendExecutiveFilter, setBackendExecutiveFilter] = useState<string>('');
  const [partFoundByFilter, setPartFoundByFilter] = useState<string>('');
  const [pendingCounts, setPendingCounts] = useState<Record<string, { amount: number; count: number }>>({});
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
  }, [statusFilter, saleStatusFilter, agentFilter, teamFilter, backendExecutiveFilter, partFoundByFilter, dateFrom, dateTo]);

  // Synchronize URL search parameters with filter states
  useEffect(() => {
    if (!searchParams) return;
    const statusParam = searchParams.get('status');
    const saleStatusParam = searchParams.get('saleStatus');
    const backendExecutiveParam = searchParams.get('backendExecutiveId');
    const partFoundByParam = searchParams.get('partFoundById');
    const fromParam = searchParams.get('dateFrom');
    const toParam = searchParams.get('dateTo');
    const agentParam = searchParams.get('agentId');
    const teamParam = searchParams.get('teamId');
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    if (statusParam !== null) setStatusFilter(statusParam);
    if (saleStatusParam !== null) setSaleStatusFilter(saleStatusParam);
    if (backendExecutiveParam !== null) setBackendExecutiveFilter(backendExecutiveParam);
    if (partFoundByParam !== null) setPartFoundByFilter(partFoundByParam);
    if (agentParam !== null) setAgentFilter(agentParam);
    if (teamParam !== null) setTeamFilter(teamParam);

    if (monthParam && yearParam) {
      const y = parseInt(yearParam);
      const m = parseInt(monthParam);
      const startStr = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      setDateFrom(startStr);
      setDateTo(endStr);
    } else {
      if (fromParam !== null) setDateFrom(fromParam);
      if (toParam !== null) setDateTo(toParam);
    }
  }, [searchParams]);

  // If the user lacks orders:view, they can only see their own orders.
  // Clear any agent/team filters that may have been set from URL params
  // (e.g. clicking a dashboard link with ?agentId=X) — the backend would
  // override them anyway, but the stale filter badge would be misleading.
  useEffect(() => {
    if (status === 'authenticated' && !hasPermission(permissions, 'orders:view')) {
      setAgentFilter('');
      setTeamFilter('');
    }
  }, [status, permissions]);


  // Fetch agents for dropdown
  useEffect(() => {
    if (status !== 'authenticated') return;
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/agents');
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

  // Fetch pending counts when filters change
  useEffect(() => {
    if (status !== 'authenticated') return;

    let active = true;
    const fetchPendingCounts = async () => {
      const params = new URLSearchParams();
      if (saleStatusFilter) params.append('saleStatus', saleStatusFilter);
      if (agentFilter) params.append('agentId', agentFilter);
      if (teamFilter) params.append('teamId', teamFilter);
      if (backendExecutiveFilter) params.append('backendExecutiveId', backendExecutiveFilter);
      if (partFoundByFilter) params.append('partFoundById', partFoundByFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      try {
        const res = await fetch(`/api/orders/pending-counts?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setPendingCounts(data);
          }
        }
      } catch (err) {
        console.error('Error fetching pending counts:', err);
      }
    };

    fetchPendingCounts();

    return () => {
      active = false;
    };
  }, [status, saleStatusFilter, agentFilter, teamFilter, backendExecutiveFilter, partFoundByFilter, dateFrom, dateTo]);

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
      if (backendExecutiveFilter) params.append('backendExecutiveId', backendExecutiveFilter);
      if (partFoundByFilter) params.append('partFoundById', partFoundByFilter);
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
  }, [status, statusFilter, saleStatusFilter, agentFilter, teamFilter, backendExecutiveFilter, partFoundByFilter, dateFrom, dateTo, page]);

  const formatTabLabel = (statusName: string) => {
    const stats = pendingCounts[statusName];
    if (!stats) return statusName;
    const formattedAmount = stats.amount < 0 
      ? `-$${Math.abs(stats.amount).toLocaleString('en-US')}` 
      : `$${stats.amount.toLocaleString('en-US')}`;
    return `${statusName} (${stats.count} - ${formattedAmount})`;
  };

  // Page entrance animation
  useEffect(() => {
    if (status === 'authenticated' && containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, [status]);

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
              : statusFilter === 'Returned Orders'
                ? 'Returned Orders'
                : statusFilter 
                  ? `${statusFilter} Queue` 
                  : 'Sales Orders Pipeline'}
          </h1>
          <p className="page-subtitle">
            {statusFilter === 'Completed Orders'
              ? 'Review and manage all completed orders — Sold and Partial Refund (orders where money was received)'
              : statusFilter === 'Returned Orders'
                ? 'Review and resolve processing failures, returns, disputes, or same-day voids'
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
          {hasPermission(permissions, 'orders:view') && (
            <button
              onClick={() => setStatusFilter('')}
              className={`tab-btn ${statusFilter === '' ? 'active' : ''}`}
            >
              All Orders
            </button>
          )}
          {hasPermission(permissions, 'orders:view-pending-booking') && (
            <button
              onClick={() => setStatusFilter('Pending Booking')}
              className={`tab-btn ${statusFilter === 'Pending Booking' ? 'active' : ''}`}
            >
              Pending Booking
            </button>
          )}
          {hasPermission(permissions, 'orders:view-pending-shipment') && (
            <button
              onClick={() => setStatusFilter('Pending Shipment')}
              className={`tab-btn ${statusFilter === 'Pending Shipment' ? 'active' : ''}`}
            >
              Pending Shipment
            </button>
          )}
          {hasPermission(permissions, 'orders:view-pending-delivery') && (
            <button
              onClick={() => setStatusFilter('Pending Delivery')}
              className={`tab-btn ${statusFilter === 'Pending Delivery' ? 'active' : ''}`}
            >
              Pending Delivery
            </button>
          )}
          {hasPermission(permissions, 'orders:view-pending-feedback') && (
            <button
              onClick={() => setStatusFilter('Pending Feedback')}
              className={`tab-btn ${statusFilter === 'Pending Feedback' ? 'active' : ''}`}
            >
              Pending Feedback
            </button>
          )}
          {hasPermission(permissions, 'orders:view-pending-resolutions') && (
            <button
              onClick={() => setStatusFilter('Pending Resolutions')}
              className={`tab-btn ${statusFilter === 'Pending Resolutions' ? 'active' : ''}`}
            >
              Pending Resolutions
            </button>
          )}
          {hasPermission(permissions, 'orders:view-completed') && (
            <button
              onClick={() => setStatusFilter('Completed Orders')}
              className={`tab-btn ${statusFilter === 'Completed Orders' ? 'active' : ''}`}
            >
              Completed Orders
            </button>
          )}
          {hasPermission(permissions, 'orders:view-returned') && (
            <button
              onClick={() => setStatusFilter('Returned Orders')}
              className={`tab-btn ${statusFilter === 'Returned Orders' ? 'active' : ''}`}
            >
              Returned Orders
            </button>
          )}
          {hasPermission(permissions, 'orders:view-cancelled') && (
            <button
              onClick={() => setStatusFilter('Cancelled Orders')}
              className={`tab-btn ${statusFilter === 'Cancelled Orders' ? 'active' : ''}`}
            >
              Cancelled Orders
            </button>
          )}
        </div>

        {/* Date, Agent & Team Filters */}
        <div className="flex-wrap-container" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '8px', width: '100%' }}>
          <div className="filter-select-wrapper">
            <label htmlFor="saleStatusFilter" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>Sale Status</label>
            <select
              id="saleStatusFilter"
              value={saleStatusFilter}
              onChange={(e) => setSaleStatusFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="">All Sale Statuses</option>
              <option value="1">Sold</option>
              <option value="2">Refunded</option>
              <option value="3">Chargebacked</option>
              <option value="4">Partial Refund</option>
              <option value="5">Void</option>
              <option value="6">Cancelled</option>
            </select>
          </div>
          {hasPermission(permissions, 'orders:view') && (
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
          )}
          {hasPermission(permissions, 'orders:view') && (
            <div className="filter-select-wrapper">
              <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>Agent</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="filter-select-custom"
              >
                <option value="">All Agents</option>
                {(() => {
                  const SALES_DESIGNATIONS = ['Sales Supervisor', 'Sales Team Lead', 'Sales Specialist', 'Sales Expert', 'Sales Associate', 'Backend Specialist', 'Backend Executive'];
                  const filtered = agents.filter(a => SALES_DESIGNATIONS.includes(a.designation));
                  const active = filtered.filter(a => a.status === 1);
                  const inactive = filtered.filter(a => a.status !== 1);
                  return (
                    <>
                      {active.length > 0 && <optgroup label="Active">{active.map(a => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}</optgroup>}
                      {inactive.length > 0 && <optgroup label="Inactive">{inactive.map(a => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}</optgroup>}
                    </>
                  );
                })()}
              </select>
            </div>
          )}
          <div className="filter-select-wrapper">
            <label htmlFor="backendExecutiveFilter" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>Backend Executive</label>
            <select
              id="backendExecutiveFilter"
              value={backendExecutiveFilter}
              onChange={(e) => setBackendExecutiveFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="">All Backend Executives</option>
              {(() => {
                const BACKEND_DESIGNATIONS = ['Backend Specialist', 'Backend Associate'];
                const filtered = agents.filter(a => BACKEND_DESIGNATIONS.includes(a.designation));
                const active = filtered.filter(a => a.status === 1);
                const inactive = filtered.filter(a => a.status !== 1);
                return (
                  <>
                    {active.length > 0 && <optgroup label="Active">{active.map(a => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}</optgroup>}
                    {inactive.length > 0 && <optgroup label="Inactive">{inactive.map(a => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}</optgroup>}
                  </>
                );
              })()}
            </select>
          </div>
          <div className="filter-select-wrapper">
            <label htmlFor="partFoundByFilter" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.78rem' }}>Part Found By</label>
            <select
              id="partFoundByFilter"
              value={partFoundByFilter}
              onChange={(e) => setPartFoundByFilter(e.target.value)}
              className="filter-select-custom"
            >
              <option value="">All Sourcing Agents</option>
              {(() => {
                const active = agents.filter(a => a.status === 1);
                const inactive = agents.filter(a => a.status !== 1);
                return (
                  <>
                    {active.length > 0 && <optgroup label="Active">{active.map(a => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}</optgroup>}
                    {inactive.length > 0 && <optgroup label="Inactive">{inactive.map(a => <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>)}</optgroup>}
                  </>
                );
              })()}
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
      {(agentFilter || teamFilter || saleStatusFilter || backendExecutiveFilter || partFoundByFilter || dateFrom || dateTo) && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Active Filters:</span>
          {agentFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
              Agent: {agents.find(a => String(a.uid) === agentFilter)?.nickname || agents.find(a => String(a.uid) === agentFilter)?.name || agentFilter}
              <button 
                onClick={() => setAgentFilter('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, marginLeft: '4px', color: '#94a3b8' }}
                title="Clear filter"
              >
                ×
              </button>
            </span>
          )}
          {teamFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
              Team: {teams.find(t => String(t.teamId) === teamFilter)?.teamName || teamFilter}
              <button 
                onClick={() => setTeamFilter('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, marginLeft: '4px', color: '#94a3b8' }}
                title="Clear filter"
              >
                ×
              </button>
            </span>
          )}
          {saleStatusFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
              Sale Status: {
                saleStatusFilter === '1' ? 'Sold'
                : saleStatusFilter === '2' ? 'Refunded'
                : saleStatusFilter === '3' ? 'Chargebacked'
                : saleStatusFilter === '4' ? 'Partial Refund'
                : saleStatusFilter === '5' ? 'Void'
                : saleStatusFilter === '6' ? 'Cancelled'
                : saleStatusFilter
              }
              <button 
                onClick={() => setSaleStatusFilter('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, marginLeft: '4px', color: '#94a3b8' }}
                title="Clear filter"
              >
                ×
              </button>
            </span>
          )}
          {backendExecutiveFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
              BE: {agents.find(a => String(a.uid) === backendExecutiveFilter)?.nickname || agents.find(a => String(a.uid) === backendExecutiveFilter)?.name || backendExecutiveFilter}
              <button 
                onClick={() => setBackendExecutiveFilter('')} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0, marginLeft: '4px', color: '#94a3b8' }}
                title="Clear filter"
              >
                ×
              </button>
            </span>
          )}
          {partFoundByFilter && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
              Sourced By: {agents.find(a => String(a.uid) === partFoundByFilter)?.nickname || agents.find(a => String(a.uid) === partFoundByFilter)?.name || partFoundByFilter}
              <button 
                onClick={() => setPartFoundByFilter('')} 
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
          {statusFilter === 'Completed Orders' && (
            <div style={{
              display: 'flex',
              gap: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: '#166534',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>✅</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Completed Orders Queue</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#15803d' }}>
                  This queue shows orders with Sale Status: <strong>Sold</strong> or <strong>Partial Refund</strong> — orders where money was received from the customer.
                </p>
              </div>
            </div>
          )}
          {statusFilter === 'Returned Orders' && (
            <div style={{
              display: 'flex',
              gap: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: '#991b1b',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Returned Orders Processing Queue</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#b91c1c' }}>
                  This queue shows orders with Sale Status: <strong>Refunded</strong>, <strong>Chargebacked</strong>, or <strong>Void</strong> — displays all orders with processing failures, returns, disputes, or same-day voids. Work with QA Verifiers and Backend Executives to resolve open issues.
                </p>
              </div>
            </div>
          )}
          {statusFilter === 'Cancelled Orders' && (
            <div style={{
              display: 'flex',
              gap: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: '#991b1b',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⚠️</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Cancelled Orders Queue</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#b91c1c' }}>
                  This queue displays all orders with Sale Status: <strong>Cancelled</strong> — unpaid or unbilled order cancellations.
                </p>
              </div>
            </div>
          )}
          {/* Stats summary above the table */}
          {(() => {
            const currentTab = statusFilter || 'All Orders';
            const stats = pendingCounts[currentTab];
            if (!stats) return null;
            const formattedAmount = stats.amount < 0 
              ? `-$${Math.abs(stats.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : `$${stats.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            return (
              <div 
                data-testid="tab-totals-summary"
                className="tab-totals-summary"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {currentTab} Summary:
                  </span>
                  <span className="status-badge" style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--accent-color)', fontWeight: 600, fontSize: '0.82rem' }}>
                    {stats.count} Orders
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                    Total {currentTab === 'Returned Orders' ? 'Refunded' : 'Margin'}:
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 700, color: stats.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                    {formattedAmount}
                  </span>
                </div>
              </div>
            );
          })()}
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
