'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { hasPermission } from '../../service/permission.service';

interface BackendTeamWidgetProps {
  initialData?: {
    topPerformers?: any[];
    bottomPerformers?: any[];
    pendingByCategory?: any[];
  };
  permissions: string;
  initialMonth: number;
  initialYear: number;
}

export default function BackendTeamWidget({
  initialData,
  permissions,
  initialMonth,
  initialYear,
}: BackendTeamWidgetProps) {
  // Independent month/year states for Performers and Pending Cases sections
  const [perfMonth, setPerfMonth] = useState(initialMonth);
  const [perfYear, setPerfYear] = useState(initialYear);
  const [pendingMonth, setPendingMonth] = useState(initialMonth);
  const [pendingYear, setPendingYear] = useState(initialYear);

  // Separate data states
  const [topPerformers, setTopPerformers] = useState<any[]>(initialData?.topPerformers || []);
  const [bottomPerformers, setBottomPerformers] = useState<any[]>(initialData?.bottomPerformers || []);
  const [pendingByCategory, setPendingByCategory] = useState<any[]>(initialData?.pendingByCategory || []);

  // Loading/error flags
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState<string | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);

  // Refs to track first mount to safely skip initial data fetching when props are present
  const isInitialPerfMount = useRef(true);
  const isInitialPendingMount = useRef(true);

  const canShowTop = hasPermission(permissions, 'dashboard:backend-top-performer');
  const canShowBottom = hasPermission(permissions, 'dashboard:backend-bottom-performer');
  const canShowPending = hasPermission(permissions, 'dashboard:backend-pending-cases');
  const canLinkToOrders = hasPermission(permissions, 'orders:view') || hasPermission(permissions, 'orders:create');

  // Fetch performers data
  const fetchPerfData = useCallback(async (month: number, year: number) => {
    setPerfLoading(true);
    setPerfError(null);
    try {
      const res = await fetch(`/api/dashboard/backend-team?month=${month}&year=${year}`);
      if (!res.ok) {
        throw new Error('Failed to fetch backend performers');
      }
      const json = await res.json();
      setTopPerformers(json.topPerformers || []);
      setBottomPerformers(json.bottomPerformers || []);
    } catch (err: any) {
      setPerfError(err.message || 'An error occurred');
    } finally {
      setPerfLoading(false);
    }
  }, []);

  // Fetch pending cases data
  const fetchPendingData = useCallback(async (month: number, year: number) => {
    setPendingLoading(true);
    setPendingError(null);
    try {
      const res = await fetch(`/api/dashboard/backend-team?month=${month}&year=${year}`);
      if (!res.ok) {
        throw new Error('Failed to fetch backend pending cases');
      }
      const json = await res.json();
      setPendingByCategory(json.pendingByCategory || []);
    } catch (err: any) {
      setPendingError(err.message || 'An error occurred');
    } finally {
      setPendingLoading(false);
    }
  }, []);

  // Trigger performers fetch when month/year changes
  useEffect(() => {
    if (isInitialPerfMount.current) {
      isInitialPerfMount.current = false;
      if (initialData && perfMonth === initialMonth && perfYear === initialYear) {
        return;
      }
    }
    fetchPerfData(perfMonth, perfYear);
  }, [perfMonth, perfYear, initialData, initialMonth, initialYear, fetchPerfData]);

  // Trigger pending fetch when month/year changes
  useEffect(() => {
    if (isInitialPendingMount.current) {
      isInitialPendingMount.current = false;
      if (initialData && pendingMonth === initialMonth && pendingYear === initialYear) {
        return;
      }
    }
    fetchPendingData(pendingMonth, pendingYear);
  }, [pendingMonth, pendingYear, initialData, initialMonth, initialYear, fetchPendingData]);

  const handlePrevPerfMonth = () => {
    if (perfMonth === 1) {
      setPerfMonth(12);
      setPerfYear((y) => y - 1);
    } else {
      setPerfMonth((m) => m - 1);
    }
  };

  const handleNextPerfMonth = () => {
    if (perfMonth === 12) {
      setPerfMonth(1);
      setPerfYear((y) => y + 1);
    } else {
      setPerfMonth((m) => m + 1);
    }
  };

  const handlePrevPendingMonth = () => {
    if (pendingMonth === 1) {
      setPendingMonth(12);
      setPendingYear((y) => y - 1);
    } else {
      setPendingMonth((m) => m - 1);
    }
  };

  const handleNextPendingMonth = () => {
    if (pendingMonth === 12) {
      setPendingMonth(1);
      setPendingYear((y) => y + 1);
    } else {
      setPendingMonth((m) => m + 1);
    }
  };

  const getMonthName = (m: number) => {
    const date = new Date(2000, m - 1, 1);
    return date.toLocaleString('default', { month: 'long' });
  };

  if (!canShowTop && !canShowBottom && !canShowPending) {
    return null;
  }

  return (
    <div className="dashboard-section fade-in" style={{ marginTop: '0', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Section 1: Performers (Top and Bottom) */}
        {(canShowTop || canShowBottom) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Backend Team Performers
              </h3>

              {/* Month Navigator for Performers */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px' }}>
                <button
                  onClick={handlePrevPerfMonth}
                  aria-label="Previous Month"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    padding: '0 6px',
                  }}
                >
                  &larr;
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', minWidth: '120px', textAlign: 'center' }}>
                  {getMonthName(perfMonth)} {perfYear}
                </span>
                <button
                  onClick={handleNextPerfMonth}
                  aria-label="Next Month"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    padding: '0 6px',
                  }}
                >
                  &rarr;
                </button>
              </div>
            </div>

            {perfLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading performers data...
              </div>
            ) : perfError ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '8px' }}>
                {perfError}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {canShowTop && (
                  <div className="table-wrapper card-with-accent" style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                        Top Performers (Completed Cases)
                      </h3>
                      <span className="status-badge status-leaders">Leaders</span>
                    </div>
                    {topPerformers.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No data available
                      </div>
                    ) : (
                      <div className="card-table-container">
                        <table className="custom-table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '45px' }}>Rank</th>
                              <th>Agent</th>
                              <th style={{ textAlign: 'center' }}>Completed</th>
                              <th style={{ textAlign: 'center' }}>Pending</th>
                            </tr>
                          </thead>
                          <tbody>
                            {topPerformers.map((row, idx) => {
                              const nameLink = `/orders?backendExecutiveId=${row.agentId}&month=${perfMonth}&year=${perfYear}`;
                              const completedLink = `/orders?backendExecutiveId=${row.agentId}&status=Completed+Orders&month=${perfMonth}&year=${perfYear}`;
                              return (
                                <tr key={row.agentId}>
                                  <td style={{ fontWeight: 700, color: idx === 0 ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                                    #{idx + 1}
                                  </td>
                                  <td style={{ fontWeight: 500 }}>
                                    {canLinkToOrders ? (
                                      <a href={nameLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {row.agentName}
                                      </a>
                                    ) : (
                                      row.agentName
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                    {canLinkToOrders ? (
                                      <a href={completedLink} style={{ textDecoration: 'none', color: '#16a34a' }}>
                                        {row.completedCount}
                                      </a>
                                    ) : (
                                      <span style={{ color: '#16a34a' }}>{row.completedCount}</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                    {canLinkToOrders ? (
                                      <a href={nameLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {row.totalPending}
                                      </a>
                                    ) : (
                                      row.totalPending
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {canShowBottom && (
                  <div className="table-wrapper card-with-accent" style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                        Bottom Performers (Pending Cases)
                      </h3>
                      <span className="status-badge status-needs-review">Needs Review</span>
                    </div>
                    {bottomPerformers.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No data available
                      </div>
                    ) : (
                      <div className="card-table-container">
                        <table className="custom-table" style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ width: '45px' }}>Rank</th>
                              <th>Agent</th>
                              <th style={{ textAlign: 'center' }}>Pending</th>
                              <th style={{ textAlign: 'center' }}>Completed</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bottomPerformers.map((row, idx) => {
                              const nameLink = `/orders?backendExecutiveId=${row.agentId}&month=${perfMonth}&year=${perfYear}`;
                              const completedLink = `/orders?backendExecutiveId=${row.agentId}&status=Completed+Orders&month=${perfMonth}&year=${perfYear}`;
                              return (
                                <tr key={row.agentId}>
                                  <td style={{ fontWeight: 700, color: idx === 0 ? '#dc2626' : 'var(--text-muted)' }}>
                                    #{idx + 1}
                                  </td>
                                  <td style={{ fontWeight: 500 }}>
                                    {canLinkToOrders ? (
                                      <a href={nameLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {row.agentName}
                                      </a>
                                    ) : (
                                      row.agentName
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                    {canLinkToOrders ? (
                                      <a href={nameLink} style={{ textDecoration: 'none', color: '#dc2626' }}>
                                        {row.totalPending}
                                      </a>
                                    ) : (
                                      <span style={{ color: '#dc2626' }}>{row.totalPending}</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                    {canLinkToOrders ? (
                                      <a href={completedLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        {row.completedCount}
                                      </a>
                                    ) : (
                                      row.completedCount
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 2: Pending Cases */}
        {canShowPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Pending Cases by Category
              </h3>

              {/* Month Navigator for Pending Cases */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px' }}>
                <button
                  onClick={handlePrevPendingMonth}
                  aria-label="Previous Month"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    padding: '0 6px',
                  }}
                >
                  &larr;
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', minWidth: '120px', textAlign: 'center' }}>
                  {getMonthName(pendingMonth)} {pendingYear}
                </span>
                <button
                  onClick={handleNextPendingMonth}
                  aria-label="Next Month"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: 'var(--text-main)',
                    fontSize: '1rem',
                    padding: '0 6px',
                  }}
                >
                  &rarr;
                </button>
              </div>
            </div>

            {pendingLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading pending cases data...
              </div>
            ) : pendingError ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: '8px' }}>
                {pendingError}
              </div>
            ) : (
              <div className="table-wrapper card-with-accent" style={{ width: '100%' }}>
                {pendingByCategory.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No data available
                  </div>
                ) : (
                  <div className="card-table-container">
                    <table className="custom-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Agent</th>
                          <th style={{ textAlign: 'center' }}>Pending Booking</th>
                          <th style={{ textAlign: 'center' }}>Pending Shipment</th>
                          <th style={{ textAlign: 'center' }}>Pending Delivery</th>
                          <th style={{ textAlign: 'center' }}>Pending Feedback</th>
                          <th style={{ textAlign: 'center' }}>Pending Resolutions</th>
                          <th style={{ textAlign: 'center', fontWeight: 700 }}>Total Pending</th>
                          <th style={{ textAlign: 'center', fontWeight: 700 }}>Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingByCategory.map((row) => {
                          const nameLink = `/orders?backendExecutiveId=${row.agentId}&month=${pendingMonth}&year=${pendingYear}`;
                          const buildQueueLink = (status: string) => `/orders?backendExecutiveId=${row.agentId}&status=${encodeURIComponent(status).replace(/%20/g, '+')}&month=${pendingMonth}&year=${pendingYear}`;

                          return (
                            <tr key={row.agentId}>
                              <td style={{ fontWeight: 500 }}>
                                {canLinkToOrders ? (
                                  <a href={nameLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {row.agentName}
                                  </a>
                                ) : (
                                  row.agentName
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                {canLinkToOrders ? (
                                  <a href={buildQueueLink('Pending Booking')} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {row.pendingBooking}
                                  </a>
                                ) : (
                                  row.pendingBooking
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                {canLinkToOrders ? (
                                  <a href={buildQueueLink('Pending Shipment')} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {row.pendingShipment}
                                  </a>
                                ) : (
                                  row.pendingShipment
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                {canLinkToOrders ? (
                                  <a href={buildQueueLink('Pending Delivery')} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {row.pendingDelivery}
                                  </a>
                                ) : (
                                  row.pendingDelivery
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                {canLinkToOrders ? (
                                  <a href={buildQueueLink('Pending Feedback')} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {row.pendingFeedback}
                                  </a>
                                ) : (
                                  row.pendingFeedback
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>
                                {canLinkToOrders ? (
                                  <a href={buildQueueLink('Pending Resolutions')} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {row.pendingResolutions}
                                  </a>
                                ) : (
                                  row.pendingResolutions
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 700, color: row.totalPending > 0 ? '#dc2626' : 'inherit' }}>
                                {canLinkToOrders ? (
                                  <a href={nameLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {row.totalPending}
                                  </a>
                                ) : (
                                  row.totalPending
                                )}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 700, color: row.completedCount > 0 ? '#16a34a' : 'inherit' }}>
                                {canLinkToOrders ? (
                                  <a href={buildQueueLink('Completed Orders')} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    {row.completedCount}
                                  </a>
                                ) : (
                                  row.completedCount
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
