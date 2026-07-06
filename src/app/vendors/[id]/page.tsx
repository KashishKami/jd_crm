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

  const [drilldownType, setDrilldownType] = useState<'total' | 'positive' | 'negative' | null>(null);
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

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

  // Fetch Performance History
  useEffect(() => {
    if (isNaN(id)) return;

    let active = true;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/vendors/${id}/performance-history`);
        if (!res.ok) {
          throw new Error('Failed to fetch vendor performance history');
        }
        const data = await res.json();
        if (active) {
          setPerformanceHistory(data);
        }
      } catch (err: unknown) {
        console.error(err);
      } finally {
        if (active) {
          setHistoryLoading(false);
        }
      }
    };

    fetchHistory();

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

  // Void ('5') counted — vendor was booked and charge captured (same-day reversal).
  // Cancel Order ('6') excluded — no charge was processed, so no vendor was involved.
  const validOrders = orders.filter(
    (order) => order.saleStatus === '1' || order.saleStatus === '2' || order.saleStatus === '3' || order.saleStatus === '4' || order.saleStatus === '5'
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
      case '4': return 'Partial Refund';
      case '5': return 'Void';
      case '6': return 'Cancel Order';
      default: return '—';
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
        <div
          onClick={() => setDrilldownType('total')}
          className="form-card"
          style={{
            padding: '20px',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
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

        <div
          onClick={() => setDrilldownType('positive')}
          className="form-card"
          style={{
            padding: '20px',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
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

        <div
          onClick={() => setDrilldownType('negative')}
          className="form-card"
          style={{
            padding: '20px',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
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
              <span className="profile-meta-label">Alternate Phone 1</span>
              <span className="profile-meta-value font-mono">{vendor.vendorAlternatePhone1 || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Alternate Phone 2</span>
              <span className="profile-meta-value font-mono">{vendor.vendorAlternatePhone2 || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Email</span>
              <span className="profile-meta-value font-mono">{vendor.vendorEmail || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Fax Number</span>
              <span className="profile-meta-value font-mono">{vendor.vendorFax || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Country</span>
              <span className="profile-meta-value">{vendor.vendorCountry || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">State/Province</span>
              <span className="profile-meta-value">{vendor.vendorState || '—'}</span>
            </div>
            <div className="profile-meta-item">
              <span className="profile-meta-label">Payment Methods</span>
              <span className="profile-meta-value">{(() => {
                try {
                  if (vendor.vendorPaymentMode) {
                    const parsed = JSON.parse(vendor.vendorPaymentMode);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      return parsed.join(', ');
                    }
                  }
                } catch (e) {}
                return '—';
              })()}</span>
            </div>
          </div>
        </div>

        {/* Orders History Tab/Table */}
        <div className="profile-main">
          {/* Performance History Chart Card */}
          <div className="form-card" style={{ padding: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
              Monthly Performance History
            </h3>
            {historyLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="spinner"></div>
                <p style={{ marginLeft: '12px' }}>Loading chart data...</p>
              </div>
            ) : performanceHistory.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No performance history available.</p>
            ) : (() => {
              const chartData = [...performanceHistory].reverse();
              const maxOrders = Math.max(...chartData.map(d => d.totalOrders), 5);
              const svgHeight = 200;
              const svgWidth = 600;
              const padding = { top: 20, right: 20, bottom: 40, left: 40 };
              const graphWidth = svgWidth - padding.left - padding.right;
              const graphHeight = svgHeight - padding.top - padding.bottom;
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              
              return (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="200" style={{ overflow: 'visible' }}>
                    {/* Horizontal Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                      const y = padding.top + graphHeight * (1 - ratio);
                      const labelValue = Math.round(maxOrders * ratio);
                      return (
                        <g key={idx}>
                          <line
                            x1={padding.left}
                            y1={y}
                            x2={svgWidth - padding.right}
                            y2={y}
                            stroke="rgba(0, 0, 0, 0.08)"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={padding.left - 10}
                            y={y + 4}
                            fill="rgba(71, 85, 105, 0.7)"
                            fontSize="10"
                            textAnchor="end"
                            className="font-mono"
                          >
                            {labelValue}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Columns */}
                    {chartData.map((d, i) => {
                      const groupWidth = graphWidth / chartData.length;
                      const barWidth = Math.min(24, groupWidth * 0.35);
                      const groupX = padding.left + i * groupWidth + (groupWidth - barWidth * 2 - 4) / 2;
                      
                      const posHeight = (d.positiveOrders / maxOrders) * graphHeight;
                      const negHeight = (d.negativeOrders / maxOrders) * graphHeight;
                      
                      const posY = padding.top + graphHeight - posHeight;
                      const negY = padding.top + graphHeight - negHeight;
                      
                      const monthLabel = monthNames[d.month - 1] || 'Unknown';
                      const yearLabel = `'${String(d.year).slice(2)}`;
                      
                      return (
                        <g key={i}>
                          {/* Positive Bar */}
                          {posHeight > 0 && (
                            <rect
                              x={groupX}
                              y={posY}
                              width={barWidth}
                              height={posHeight}
                              fill="#10b981"
                              rx="2"
                            />
                          )}
                          {/* Negative Bar */}
                          {negHeight > 0 && (
                            <rect
                              x={groupX + barWidth + 4}
                              y={negY}
                              width={barWidth}
                              height={negHeight}
                              fill="#ef4444"
                              rx="2"
                            />
                          )}
                          {/* X-axis Label */}
                          <text
                            x={padding.left + i * groupWidth + groupWidth / 2}
                            y={svgHeight - 15}
                            fill="rgba(71, 85, 105, 0.8)"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {monthLabel} {yearLabel}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Axes lines */}
                    <line
                      x1={padding.left}
                      y1={padding.top}
                      x2={padding.left}
                      y2={padding.top + graphHeight}
                      stroke="rgba(0, 0, 0, 0.15)"
                    />
                    <line
                      x1={padding.left}
                      y1={padding.top + graphHeight}
                      x2={svgWidth - padding.right}
                      y2={padding.top + graphHeight}
                      stroke="rgba(0, 0, 0, 0.15)"
                    />
                  </svg>
                  {/* Legend */}
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></span>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>Positive Orders</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '2px' }}></span>
                      <span style={{ fontSize: '0.75rem', color: '#475569' }}>Negative Orders</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

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

      {/* Drilldown Modal Overlay */}
      {drilldownType && (() => {
        const filteredOrdersForDrilldown = orders.filter(order => {
          const isValid = order.saleStatus === '1' || order.saleStatus === '2' || order.saleStatus === '3' || order.saleStatus === '4' || order.saleStatus === '5';
          if (!isValid) return false;
          if (drilldownType === 'positive') return order.orderVendorFeedback === 'Positive';
          if (drilldownType === 'negative') return order.orderVendorFeedback === 'Negative';
          return true; // 'total'
        });

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}>
            <div className="form-card" style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: '24px',
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>
                  Feedback Drilldown: {drilldownType === 'total' ? 'Total' : drilldownType === 'positive' ? 'Positive' : 'Negative'} Orders
                </h2>
                <button
                  onClick={() => setDrilldownType(null)}
                  className="btn-secondary-custom"
                  style={{ padding: '6px 12px', margin: 0 }}
                >
                  Close
                </button>
              </div>
              
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
                  <tbody>
                    {filteredOrdersForDrilldown.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                          No orders found matching this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrdersForDrilldown.map((order) => (
                        <tr key={order.crmOrderId}>
                          <td>{formatDateDDMMYYYY(order.orderDate)}</td>
                          <td>
                            <Link href={`/orders/${order.orderCustomerId}`} className="font-semibold text-blue-400 font-mono">
                              #JD{order.crmOrderId}
                            </Link>
                          </td>
                          <td>{order.customer?.customerName}</td>
                          <td className="font-mono text-slate-400">{order.customer?.customerPhone || '—'}</td>
                          <td className="font-semibold text-slate-200 font-mono">${order.orderAmountCharged}</td>
                          <td>{order.orderSalesAgentName}</td>
                          <td>
                            <span className={`status-dot-badge ${order.saleStatus === '1' ? 'status-active' : 'status-inactive'}`} style={{ padding: '2px 8px' }}>
                              {getSaleStatusLabel(order.saleStatus)}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: '600', fontSize: '0.8rem', color: order.orderVendorFeedback === 'Negative' ? '#ef4444' : '#10b981' }}>
                              {order.orderVendorFeedback}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
