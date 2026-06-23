'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gateway } from '../../../../types/gateway';
import { fadeInPage } from '../../../../lib/animations';

export default function EditGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? Number(params.id) : NaN;
  const containerRef = useRef<HTMLDivElement>(null);

  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [gatewayName, setGatewayName] = useState('');
  const [gatewayStatus, setGatewayStatus] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) fadeInPage(containerRef.current);
  }, []);

  useEffect(() => {
    if (isNaN(id)) return;
    const fetchGateway = async () => {
      try {
        const res = await fetch(`/api/gateways/${id}`);
        if (!res.ok) throw new Error('Gateway not found');
        const data: Gateway = await res.json();
        setGateway(data);
        setGatewayName(data.gatewayName);
        setGatewayStatus(data.gatewayStatus);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error loading gateway');
      } finally {
        setLoading(false);
      }
    };
    fetchGateway();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayName.trim()) {
      setError('Gateway name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/gateways/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayName: gatewayName.trim(), gatewayStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? 'Failed to update gateway');
      }

      router.push('/gateways');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-box">
        <div className="spinner"></div>
        <p>Loading gateway…</p>
      </div>
    );
  }

  if (error && !gateway) {
    return (
      <div className="error-box">
        <p>{error}</p>
        <Link href="/gateways" className="btn-secondary-custom">Back</Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Gateway</h1>
          <p className="page-subtitle">Update payment processor details</p>
        </div>
        <Link href="/gateways" className="btn-secondary-custom">Cancel</Link>
      </div>

      <div className="form-card" style={{ maxWidth: '560px' }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-box" style={{ marginBottom: '16px', padding: '12px' }}>
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-gateway-name">
              Gateway Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="edit-gateway-name"
              type="text"
              className="form-input"
              value={gatewayName}
              onChange={(e) => setGatewayName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-gateway-status">Status</label>
            <select
              id="edit-gateway-status"
              className="form-input"
              value={gatewayStatus}
              onChange={(e) => setGatewayStatus(Number(e.target.value))}
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <Link href="/gateways" className="btn-secondary-custom">Cancel</Link>
            <button
              type="submit"
              className="btn-primary-custom"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
