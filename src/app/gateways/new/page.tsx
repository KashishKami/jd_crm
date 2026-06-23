'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fadeInPage } from '../../../lib/animations';

export default function NewGatewayPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [gatewayName, setGatewayName] = useState('');
  const [gatewayStatus, setGatewayStatus] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) fadeInPage(containerRef.current);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gatewayName.trim()) {
      setError('Gateway name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gatewayName: gatewayName.trim(), gatewayStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? 'Failed to create gateway');
      }

      router.push('/gateways');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Add New Gateway</h1>
          <p className="page-subtitle">Register a new payment processor</p>
        </div>
        <Link href="/gateways" className="btn-secondary-custom">
          Cancel
        </Link>
      </div>

      <div className="form-card" style={{ maxWidth: '560px' }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-box" style={{ marginBottom: '16px', padding: '12px' }}>
              <p>{error}</p>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="gateway-name">
              Gateway Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="gateway-name"
              type="text"
              className="form-input"
              placeholder="e.g. Stripe, Authorize.net"
              value={gatewayName}
              onChange={(e) => setGatewayName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="gateway-status">Status</label>
            <select
              id="gateway-status"
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
              {saving ? 'Saving…' : 'Add Gateway'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
