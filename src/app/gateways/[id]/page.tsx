'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../../../service/permission.service';
import { Gateway, GatewayMonthlyReport } from '../../../types/gateway';
import { fadeInPage } from '../../../lib/animations';
import GatewayReport from '../../../components/GatewayReport';

export default function GatewayDetailPage() {
  const params = useParams();
  const id = params?.id ? Number(params.id) : NaN;
  const { data: session } = useSession();

  const containerRef = useRef<HTMLDivElement>(null);

  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [monthly, setMonthly] = useState<GatewayMonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const permissions = session?.user?.userPermissions ?? '';
  const canEdit = hasPermission(permissions, 'gateways:edit');
  const canReport = hasPermission(permissions, 'gateways:report');

  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  useEffect(() => {
    if (isNaN(id)) return;

    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/gateways/${id}/report`);
        if (!res.ok) throw new Error('Failed to fetch gateway report');
        const data = await res.json();
        if (active) {
          setGateway(data.gateway);
          setMonthly(data.monthly);
        }
      } catch (err: unknown) {
        if (active) setError(err instanceof Error ? err.message : 'Error loading report');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="loader-box">
        <div className="spinner"></div>
        <p>Loading gateway report...</p>
      </div>
    );
  }

  if (error || !gateway) {
    return (
      <div className="error-box">
        <p>{error ?? 'Gateway not found'}</p>
        <Link href="/gateways" className="btn-secondary-custom">Back to Gateways</Link>
      </div>
    );
  }

  // Compute totals across all months
  const totalCompleted = monthly.reduce((s, m) => s + m.completedCount, 0);
  const totalRefunds = monthly.reduce((s, m) => s + m.refundCount, 0);
  const totalChargebacks = monthly.reduce((s, m) => s + m.chargebackCount, 0);
  const totalNet = monthly.reduce((s, m) => s + m.netAmount, 0);

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{gateway.gatewayName}</h1>
          <p className="page-subtitle">Payment Gateway Performance Report</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/gateways" className="btn-secondary-custom">
            Back to Gateways
          </Link>
          {canEdit && (
            <Link
              href={`/gateways/${gateway.gatewayId}/edit`}
              className="btn-primary-custom"
              style={{ backgroundColor: '#475569', boxShadow: 'none' }}
            >
              Edit Gateway
            </Link>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: '24px' }}>
        <span className={`status-dot-badge ${gateway.gatewayStatus === 1 ? 'status-active' : 'status-inactive'}`}
          style={{ fontSize: '0.9rem', padding: '4px 14px' }}
        >
          {gateway.gatewayStatus === 1 ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div className="form-card" style={{ padding: '20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem' }}>Total Completed</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px', color: '#059669' }}>{totalCompleted}</h2>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#ecfdf5' }}>
            <svg style={{ width: '24px', height: '24px', color: '#059669' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="form-card" style={{ padding: '20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem', color: '#b45309' }}>Total Refunds</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px', color: '#b45309' }}>{totalRefunds}</h2>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#fef3c7' }}>
            <svg style={{ width: '24px', height: '24px', color: '#b45309' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
        </div>

        <div className="form-card" style={{ padding: '20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem', color: '#dc2626' }}>Total Chargebacks</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px', color: '#dc2626' }}>{totalChargebacks}</h2>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#fef2f2' }}>
            <svg style={{ width: '24px', height: '24px', color: '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="form-card" style={{ padding: '20px', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="form-label" style={{ fontSize: '0.75rem' }}>Net Revenue</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '4px', color: totalNet >= 0 ? '#059669' : '#dc2626' }}>
              {totalNet < 0 ? '-' : ''}${Math.abs(totalNet).toFixed(2)}
            </h2>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: totalNet >= 0 ? '#ecfdf5' : '#fef2f2' }}>
            <svg style={{ width: '24px', height: '24px', color: totalNet >= 0 ? '#059669' : '#dc2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {canReport ? (
        <>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', color: 'var(--text-primary)' }}>
            Month-by-Month Breakdown
          </h2>
          <GatewayReport monthly={monthly} />
        </>
      ) : (
        <div className="error-box" style={{ textAlign: 'center', padding: '32px' }}>
          <p>You do not have permission to view the detailed monthly report.</p>
        </div>
      )}
    </div>
  );
}
