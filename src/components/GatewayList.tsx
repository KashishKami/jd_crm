'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../service/permission.service';
import { Gateway } from '../types/gateway';
import { fadeInPage, staggerEntrance } from '../lib/animations';
import { gsap } from 'gsap';

interface GatewayListProps {
  initialGateways?: Gateway[];
}

export default function GatewayList({ initialGateways }: GatewayListProps = {}) {
  const { data: session } = useSession();
  const [gateways, setGateways] = useState<Gateway[]>(initialGateways || []);
  const [loading, setLoading] = useState(!initialGateways);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const permissions = session?.user?.userPermissions ?? '';
  const canCreate = hasPermission(permissions, 'gateways:create');
  const canEdit = hasPermission(permissions, 'gateways:edit');
  const canReport = hasPermission(permissions, 'gateways:report');

  useEffect(() => {
    if (initialGateways && initialGateways.length > 0) return;
    const fetchGateways = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/gateways');
        if (!res.ok) throw new Error('Failed to fetch gateways');
        const data: Gateway[] = await res.json();
        setGateways(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchGateways();
  }, [initialGateways]);

  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        fadeInPage(containerRef.current!);
        if (tableBodyRef.current) {
          const rows = tableBodyRef.current.querySelectorAll('tr');
          staggerEntrance(rows);
        }
      });
      return () => ctx.revert();
    }
  }, [loading]);

  const handleToggleStatus = async (gateway: Gateway) => {
    const newStatus = gateway.gatewayStatus === 1 ? 0 : 1;
    const action = newStatus === 0 ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} "${gateway.gatewayName}"?`)) return;

    try {
      const res = await fetch(`/api/gateways/${gateway.gatewayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayStatus: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update gateway status');
      setGateways((prev) =>
        prev.map((g) =>
          g.gatewayId === gateway.gatewayId ? { ...g, gatewayStatus: newStatus } : g
        )
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating gateway');
    }
  };

  if (loading) {
    return (
      <div className="loader-box">
        <div className="spinner"></div>
        <p>Loading gateways...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-box">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="agents-page-container" style={{ opacity: 0 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Gateways</h1>
          <p className="page-subtitle">Manage payment processors and view performance reports</p>
        </div>
        {canCreate && (
          <Link href="/gateways/new" className="btn-primary-custom" id="add-gateway-btn">
            + Add Gateway
          </Link>
        )}
      </div>

      <div className="table-wrapper">
          <table className="custom-table table-responsive">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>#</th>
                <th>Gateway Name</th>
                <th style={{ width: '140px' }}>Status</th>
                {(canReport || canEdit) && <th style={{ width: '280px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody ref={tableBodyRef}>
              {gateways.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No gateways found.
                  </td>
                </tr>
              ) : (
                gateways.map((gateway, index) => (
                  <tr key={gateway.gatewayId} style={{ opacity: 0 }}>
                    <td className="font-mono text-slate-500">{index + 1}</td>
                    <td style={{ fontWeight: '600' }}>{gateway.gatewayName}</td>
                    <td>
                      <span
                        className={`status-dot-badge ${gateway.gatewayStatus === 1 ? 'status-active' : 'status-inactive'}`}
                      >
                        {gateway.gatewayStatus === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {(canReport || canEdit) && (
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {canReport && (
                            <Link
                              href={`/gateways/${gateway.gatewayId}`}
                              prefetch={false}
                              className="btn-secondary-custom"
                              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                            >
                              View Report
                            </Link>
                          )}
                          {canEdit && (
                            <>
                              <Link
                                href={`/gateways/${gateway.gatewayId}/edit`}
                                prefetch={false}
                                className="btn-secondary-custom"
                                style={{ padding: '4px 12px', fontSize: '0.8rem', backgroundColor: '#f1f5f9' }}
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleToggleStatus(gateway)}
                                className="btn-primary-custom"
                                style={{
                                  padding: '4px 12px',
                                  fontSize: '0.8rem',
                                  backgroundColor: gateway.gatewayStatus === 1 ? '#ef4444' : '#10b981',
                                  boxShadow: 'none',
                                }}
                              >
                                {gateway.gatewayStatus === 1 ? 'Deactivate' : 'Activate'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}
