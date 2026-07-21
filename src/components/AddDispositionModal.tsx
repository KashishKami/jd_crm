'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DISPOSITION_OPTIONS } from '../types/callDisposition';
import { formatPhoneNumber } from '../lib/formatPhone';

interface AddDispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDispositionModal({ isOpen, onClose, onSuccess }: AddDispositionModalProps) {
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [disposition, setDisposition] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(formatPhoneNumber(e.target.value));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!customerPhone || customerPhone.trim() === '') {
      newErrors.customerPhone = 'Phone number is required';
    } else if (customerPhone.replace(/\D/g, '').length !== 10) {
      newErrors.customerPhone = 'Phone number must be exactly 10 digits';
    }
    if (!disposition) {
      newErrors.disposition = 'Disposition is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/call-dispositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone,
          customerName: customerName.trim() || null,
          disposition,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save call disposition');
      }

      onSuccess();
      onClose();
      // Clear form
      setCustomerPhone('');
      setCustomerName('');
      setDisposition('');
    } catch (err: any) {
      setErrors({ global: err.message || 'Error occurred while saving.' });
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.3)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          border: '1px solid #e2e8f0',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#0f172a',
              margin: 0,
            }}
          >
            Log Inbound Call Disposition
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
            Enter the details of the incoming call.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: 0 }}>
          {errors.global && (
            <div 
              style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '0.85rem',
                color: '#b91c1c',
              }}
            >
              {errors.global}
            </div>
          )}

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="customerPhone" className="form-label" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
              Customer Phone *
            </label>
            <input
              type="text"
              id="customerPhone"
              value={customerPhone}
              onChange={handlePhoneChange}
              placeholder="xxx-xxx-xxxx"
              className="form-input"
              style={{ fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }}
            />
            {errors.customerPhone && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>{errors.customerPhone}</span>
            )}
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="customerName" className="form-label" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
              Customer Name (Optional)
            </label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="disposition" className="form-label" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
              Disposition *
            </label>
            <select
              id="disposition"
              value={disposition}
              onChange={(e) => setDisposition(e.target.value)}
              className="form-select"
              style={{ width: '100%', height: '38px', boxSizing: 'border-box' }}
            >
              <option value="">Select Disposition</option>
              {DISPOSITION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.disposition && (
              <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>{errors.disposition}</span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-custom"
              style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-custom"
              style={{ height: '38px', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
