'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fadeInPage } from '../../../lib/animations';

export default function NewVendorPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorFax: '',
    vendorContactPerson: '',
    vendorStatus: '1', // Default Active
    vendorRemark: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!formData.vendorName || !formData.vendorPhone || !formData.vendorContactPerson) {
      setError('Please fill in all required fields (Vendor Name, Phone, and Contact Person).');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        vendorStatus: Number(formData.vendorStatus),
        vendorFax: formData.vendorFax || null,
        vendorEmail: formData.vendorEmail || null,
        vendorRemark: formData.vendorRemark || null,
      };

      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create vendor.');
      }

      router.push('/vendors');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Vendor</h1>
          <p className="page-subtitle">Add a new supplier company to the CRM database directory</p>
        </div>
        <Link href="/vendors" className="btn-secondary-custom">
          Cancel
        </Link>
      </div>

      {error && (
        <div className="error-box" style={{ padding: '16px', margin: '0' }}>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <h3 className="form-section-title">Supplier Details</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Vendor Name *</label>
              <input
                type="text"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="e.g. Acme Auto Parts"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="vendorEmail"
                value={formData.vendorEmail}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. sales@acmeparts.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                name="vendorPhone"
                value={formData.vendorPhone}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="e.g. 111-222-3333"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fax Number</label>
              <input
                type="text"
                name="vendorFax"
                value={formData.vendorFax}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 111-222-3334"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Person *</label>
              <input
                type="text"
                name="vendorContactPerson"
                value={formData.vendorContactPerson}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vendor Status *</label>
              <select
                name="vendorStatus"
                value={formData.vendorStatus}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="1">Active</option>
                <option value="0">Blacklisted</option>
              </select>
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Remarks / Notes</label>
              <textarea
                name="vendorRemark"
                value={formData.vendorRemark}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Performance, delivery notes, billing remarks..."
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link href="/vendors" className="btn-secondary-custom">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary-custom">
            {submitting ? 'Creating...' : 'Create Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
}
