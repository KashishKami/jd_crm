'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { hasPermission } from '../service/permission.service';
import { fadeInPage } from '../lib/animations';
import OrderList from './OrderList';

interface OrderListContainerProps {
  initialStatus?: string;
}

export default function OrderListContainer({ initialStatus }: OrderListContainerProps) {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || '');
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  const permissions = session?.user?.userPermissions || '';
  const canCreate = hasPermission(permissions, 'orders:create');

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

  // Fetch orders when filters change
  useEffect(() => {
    if (status !== 'authenticated') return;

    let active = true;
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (agentFilter) params.append('agentId', agentFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      try {
        const res = await fetch(`/api/orders?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch orders: ${res.statusText}`);
        }
        const data = await res.json();
        if (active) {
          setOrders(data);
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
  }, [status, statusFilter, agentFilter, dateFrom, dateTo]);

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

        {/* Date & Agent Filters */}
        <div className="flex-wrap-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '176px' }}>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="form-select"
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="">-- All Agents --</option>
              {agents.map((a) => (
                <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="form-input"
              style={{ padding: '8px 12px' }}
            />
            <span>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="form-input"
              style={{ padding: '8px 12px' }}
            />
          </div>
        </div>
      </div>

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
      ) : orders.length === 0 ? (
        <div className="empty-box">
          <p>No sales orders found matching this criteria.</p>
        </div>
      ) : (
        <OrderList orders={orders} />
      )}
    </div>
  );
}
