'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { fadeInPage } from '../../../../lib/animations';

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? Number(params.id) : NaN;

  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorFax: '',
    vendorContactPerson: '',
    vendorStatus: '1',
    vendorRemark: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  useEffect(() => {
    if (isNaN(id)) return;

    let active = true;
    const fetchVendor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/vendors/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch vendor data');
        }
        const data = await res.json();
        if (active) {
          setFormData({
            vendorName: data.vendorName || '',
            vendorEmail: data.vendorEmail || '',
            vendorPhone: data.vendorPhone || '',
            vendorFax: data.vendorFax || '',
            vendorContactPerson: data.vendorContactPerson || '',
            vendorStatus: String(data.vendorStatus),
            vendorRemark: data.vendorRemark || '',
          });
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
  }, [id]);

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

      const res = await fetch(`/api/vendors/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update vendor.');
      }

      router.push(`/vendors/${id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-box">
        <div className="spinner"></div>
        <p>Loading vendor details...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="agents-page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Vendor</h1>
          <p className="page-subtitle">Modify supplier profile details for {formData.vendorName}</p>
        </div>
        <Link href={`/vendors/${id}`} className="btn-secondary-custom">
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
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link href={`/vendors/${id}`} className="btn-secondary-custom">
            Cancel
          </Link>
          <button type="submit" disabled={submitting} className="btn-primary-custom">
            {submitting ? 'Updating...' : 'Update Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
}
