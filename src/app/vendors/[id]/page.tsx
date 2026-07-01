'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../../../service/permission.service';
import { Vendor } from '../../../types/vendor';
import { fadeInPage, staggerEntrance } from '../../../lib/animations';
import VendorStatusBadge from '../../../components/VendorStatusBadge';
import { formatDateDDMMYYYY } from '../../../lib/date';

interface LinkedOrder {
  crmOrderId: number;
  orderCustomerId: number;
  orderCreatedDate: string;
  orderDate: string;
  customer: {
    customerName: string;
    customerPhone: string;
  };
  orderAmountCharged: string;
  orderSalesAgentName: string;
  saleStatus: string;
  orderVendorFeedback: string;
}

export default function VendorDetailPage() {
  const params = useParams();
  const id = params?.id ? Number(params.id) : NaN;
  const { data: session } = useSession();

  const containerRef = useRef<HTMLDivElement>(null);
  const tableRowsRef = useRef<HTMLTableSectionElement>(null);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<LinkedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const permissions = session?.user?.userPermissions || '';
  const canEdit = hasPermission(permissions, 'vendors:edit');

  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  // Fetch Vendor Info
  useEffect(() => {
    if (isNaN(id)) return;

    let active = true;
    const fetchVendor = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/vendors/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch vendor details');
        }
        const data = await res.json();
        if (active) {
          setVendor(data);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Error loading vendor';
        if (active) {
          setError(errMsg);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchVendor();

    return () => {
      active = false;
    };
  }, [id, refetchTrigger]);

  // Fetch Orders History
  useEffect(() => {
    if (isNaN(id)) return;

    let active = true;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch(`/api/vendors/${id}/orders`);
        if (!res.ok) {
          throw new Error('Failed to fetch vendor orders');
        }
        const data = await res.json();
        if (active) {
          setOrders(data);
        }
      } catch (err: unknown) {
        console.error(err);
      } finally {
        if (active) {
          setOrdersLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      active = false;
    };
  }, [id]);

  // Stagger table rows animation
  useEffect(() => {
    if (tableRowsRef.current && orders.length > 0) {
      const rows = tableRowsRef.current.querySelectorAll('tr');
      staggerEntrance(rows);
    }
  }, [orders]);

  const handleToggleStatus = async () => {
    if (!vendor) return;
    const actionText = vendor.vendorStatus === 1 ? 'blacklist' : 'restore';
    if (!confirm(`Are you sure you want to ${actionText} this vendor?`)) {
      return;
    }

    try {
      const newStatus = vendor.vendorStatus === 1 ? 0 : 1;
      const res = await fetch(`/api/vendors/${vendor.vendorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update vendor status');
      }

      setRefetchTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error updating status';
      alert(errMsg);
    }
  };

  // Compute metrics locally
  const validOrders = orders.filter(
    (order) => order.saleStatus === '1' || order.saleStatus === '2' || order.saleStatus === '3'
  );
  const totalOrders = validOrders.length;
  const negativeOrders = validOrders.filter(
    (order) => order.orderVendorFeedback === 'Negative'
  ).length;
  const positiveOrders = totalOrders - negativeOrders;

  const getSaleStatusLabel = (code: string) => {
    switch (code) {
      case '1': return 'Sold';
      case '2': return 'Refunded';
      case '3': return 'Chargebacked';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="loader-box">
        <div className="spinner"></div>
        <p>Loading supplier details...</p>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="error-box">
        <p>{error || 'Vendor not found'}</p>
        <Link href="/vendors" className="btn-secondary-custom">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{vendor.vendorName}</h1>
          <p className="page-subtitle">Supplier Profile & Performance Metrics Ledger</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/vendors" className="btn-secondary-custom">
            Back to Directory
          </Link>
          {canEdit && (
            <>
              <Link href={`/vendors/${vendor.vendorId}/edit`} className="btn-primary-custom" style={{ backgroundColor: '#475569', boxShadow: 'none' }}>
                Edit Supplier
              </Link>
              <button
                onClick={handleToggleStatus}
                className={`btn-primary-custom`}
                style={{
                  backgroundColor: vendor.vendorStatus === 1 ? '#ef4444' : '#10b981',
                  boxShadow: 'none',
                }}
              >
                {vendor.vendorStatus === 1 ? 'Blacklist Supplier' : 'Restore Supplier'}
              </button>
            </>
          )}
        </div>
      </div>

      {vendor.vendorStatus === 0 && (
        <div className="error-box" style={{ margin: '0', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', textAlign: 'left', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
          <svg style={{ width: '24px', height: '24px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <strong style={{ display: 'block' }}>Vendor is Blacklisted!</strong>
            <span style={{ fontSize: '0.85rem' }}>This supplier has been flagged. Warnings will cascade to all open client orders linked to this vendor.</span>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="form-card" style={{ padding: '20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem' }}>Total Managed Orders</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px' }}>{totalOrders}</h2>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#f1f5f9' }}>
            <svg style={{ width: '24px', height: '24px', color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        <div className="form-card" style={{ padding: '20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem', color: '#059669' }}>Positive Orders (+)</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px', color: '#059669' }}>{positiveOrders}</h2>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#ecfdf5' }}>
            <svg style={{ width: '24px', height: '24px', color: '#059669' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="form-card" style={{ padding: '20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem', color: '#dc2626' }}>Negative Orders (-)</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px', color: '#dc2626' }}>{negativeOrders}</h2>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#fef2f2' }}>
            <svg style={{ width: '24px', height: '24px', color: '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="profile-container">
        {/* Sidebar Info Card */}
        <div className="profile-sidebar" style={{ width: '100%' }}>
          <div className="profile-avatar" style={{ background: vendor.vendorStatus === 1 ? 'linear-gradient(135deg, var(--accent-color), #60a5fa)' : 'linear-gradient(135deg, #ef4444, #f87171)' }}>
            {vendor.vendorName[0]?.toUpperCase()}
          </div>
          <h3 className="profile-name">{vendor.vendorName}</h3>
          <div className="profile-role-badge">
            <VendorStatusBadge status={vendor.vendorStatus} />
          </div>

          <div className="profile-meta-list">
            <div className="profile-meta-item">
              <span className="profile-meta-label">Contact Person</span>
              <span className="profile-meta-value">{vendor.vendorContactPerson}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Phone</span>
              <span className="profile-meta-value font-mono">{vendor.vendorPhone}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Email</span>
              <span className="profile-meta-value font-mono">{vendor.vendorEmail || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Fax Number</span>
              <span className="profile-meta-value font-mono">{vendor.vendorFax || '—'}</span>
            </div>
          </div>
        </div>

        {/* Orders History Tab/Table */}
        <div className="profile-main">
          <div className="profile-tabs-header">
            <div className="profile-tab-btn active">
              Order History ({orders.length})
            </div>
          </div>

          <div className="profile-tab-content" style={{ padding: '0' }}>
            {ordersLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div className="spinner"></div>
                <p style={{ marginLeft: '12px' }}>Loading order logs...</p>
              </div>
            ) : orders.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No orders recorded for this supplier.</p>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', borderRadius: '0', boxShadow: 'none' }}>
                <table className="custom-table table-responsive">
                  <thead>
                    <tr>
                      <th>Order Date</th>
                      <th>Order ID</th>
                      <th>Customer Name</th>
                      <th>Phone Number</th>
                      <th>Amt. Charged</th>
                      <th>Agent</th>
                      <th>Sale Status</th>
                      <th>Feedback</th>
                    </tr>
                  </thead>
                  <tbody ref={tableRowsRef}>
                    {orders.map((order) => (
                      <tr key={order.crmOrderId}>
                        <td>
                          {formatDateDDMMYYYY(order.orderDate)}
                        </td>
                        <td>
                          <Link href={`/orders/${order.orderCustomerId}`} className="font-semibold text-blue-600 font-mono">
                            #JD{order.crmOrderId}
                          </Link>
                        </td>
                        <td>
                          {order.customer?.customerName}
                        </td>
                        <td className="font-mono text-slate-500">
                          {order.customer?.customerPhone || '—'}
                        </td>
                        <td className="font-semibold text-slate-800 font-mono">
                          ${order.orderAmountCharged}
                        </td>
                        <td>{order.orderSalesAgentName}</td>
                        <td>
                          <span className={`status-dot-badge ${order.saleStatus === '1' ? 'status-active' : 'status-inactive'}`} style={{ padding: '2px 8px' }}>
                            {getSaleStatusLabel(order.saleStatus)}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              color: order.orderVendorFeedback === 'Negative' ? '#b91c1c' : '#15803d',
                            }}
                          >
                            {order.orderVendorFeedback}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
