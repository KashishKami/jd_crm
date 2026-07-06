'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { COUNTRY_STATE_MAP } from '../lib/geography';

interface VendorFormProps {
  initialData?: {
    vendorName: string;
    vendorEmail: string;
    vendorPhone: string;
    vendorAlternatePhone1: string;
    vendorAlternatePhone2: string;
    vendorFax: string;
    vendorContactPerson: string;
    vendorStatus: string;
    vendorCountry: string;
    vendorState: string;
    vendorPaymentMode: string;
    vendorRemark: string;
  };
  onSubmit: (data: any) => void;
  submitting: boolean;
  cancelHref?: string;
}

const PAYMENT_METHODS = ['Customer Card', 'Company Card', 'Link'];

export default function VendorForm({
  initialData,
  onSubmit,
  submitting,
  cancelHref = '/vendors'
}: VendorFormProps) {
  const [formData, setFormData] = useState({
    vendorName: initialData?.vendorName || '',
    vendorEmail: initialData?.vendorEmail || '',
    vendorPhone: initialData?.vendorPhone || '',
    vendorAlternatePhone1: initialData?.vendorAlternatePhone1 || '',
    vendorAlternatePhone2: initialData?.vendorAlternatePhone2 || '',
    vendorFax: initialData?.vendorFax || '',
    vendorContactPerson: initialData?.vendorContactPerson || '',
    vendorStatus: initialData?.vendorStatus || '1',
    vendorCountry: initialData?.vendorCountry || 'USA',
    vendorState: initialData?.vendorState || '',
    vendorRemark: initialData?.vendorRemark || '',
  });

  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>(() => {
    try {
      if (initialData?.vendorPaymentMode) {
        const parsed = JSON.parse(initialData.vendorPaymentMode);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // fallback to empty
    }
    return [];
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'vendorCountry') {
      const isInitialCountry = initialData && value === initialData.vendorCountry;
      setFormData(prev => ({
        ...prev,
        vendorCountry: value,
        vendorState: isInitialCountry ? (initialData.vendorState || '') : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePaymentModeToggle = (method: string) => {
    setSelectedPaymentModes(prev => {
      if (prev.includes(method)) {
        return prev.filter(m => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      vendorPaymentMode: JSON.stringify(selectedPaymentModes)
    };
    onSubmit(payload);
  };

  const isDropdownCountry = formData.vendorCountry in COUNTRY_STATE_MAP;

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <div className="form-section">
        <h3 className="form-section-title">Supplier Details</h3>
        
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="vendorName" className="form-label">Vendor Name *</label>
            <input
              type="text"
              id="vendorName"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="e.g. Acme Auto Parts"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendorEmail" className="form-label">Email Address</label>
            <input
              type="email"
              id="vendorEmail"
              name="vendorEmail"
              value={formData.vendorEmail}
              onChange={handleChange}
              className="form-input font-mono"
              placeholder="e.g. sales@acmeparts.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendorPhone" className="form-label">Phone Number *</label>
            <input
              type="text"
              id="vendorPhone"
              name="vendorPhone"
              value={formData.vendorPhone}
              onChange={handleChange}
              className="form-input font-mono"
              required
              placeholder="e.g. 111-222-3333"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendorFax" className="form-label">Fax Number</label>
            <input
              type="text"
              id="vendorFax"
              name="vendorFax"
              value={formData.vendorFax}
              onChange={handleChange}
              className="form-input font-mono"
              placeholder="e.g. 111-222-3334"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendorAlternatePhone1" className="form-label">Alternate Phone 1</label>
            <input
              type="text"
              id="vendorAlternatePhone1"
              name="vendorAlternatePhone1"
              value={formData.vendorAlternatePhone1}
              onChange={handleChange}
              className="form-input font-mono"
              placeholder="e.g. 444-555-6666"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendorAlternatePhone2" className="form-label">Alternate Phone 2</label>
            <input
              type="text"
              id="vendorAlternatePhone2"
              name="vendorAlternatePhone2"
              value={formData.vendorAlternatePhone2}
              onChange={handleChange}
              className="form-input font-mono"
              placeholder="e.g. 777-888-9999"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendorContactPerson" className="form-label">Contact Person *</label>
            <input
              type="text"
              id="vendorContactPerson"
              name="vendorContactPerson"
              value={formData.vendorContactPerson}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vendorStatus" className="form-label">Vendor Status *</label>
            <select
              id="vendorStatus"
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

          <div className="form-group">
            <label htmlFor="vendorCountry" className="form-label">Country</label>
            <select
              id="vendorCountry"
              name="vendorCountry"
              value={formData.vendorCountry}
              onChange={handleChange}
              className="form-select"
            >
              <option value="USA">USA</option>
              <option value="Canada">Canada</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="vendorState" className="form-label">State/Province</label>
            {isDropdownCountry ? (
              <select
                id="vendorState"
                name="vendorState"
                value={formData.vendorState}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">-- Select State/Province --</option>
                {COUNTRY_STATE_MAP[formData.vendorCountry].map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="vendorState"
                name="vendorState"
                value={formData.vendorState}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Bavaria"
              />
            )}
          </div>

          <div className="form-group form-grid-full">
            <label className="form-label">Payment Methods</label>
            <div className="flex gap-6 flex-wrap items-center mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              {PAYMENT_METHODS.map((method) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPaymentModes.includes(method)}
                    onChange={() => handlePaymentModeToggle(method)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span className="text-sm font-medium text-slate-700">{method}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group form-grid-full">
            <label htmlFor="vendorRemark" className="form-label">Remarks / Notes</label>
            <textarea
              id="vendorRemark"
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
        <Link href={cancelHref} className="btn-secondary-custom">
          Cancel
        </Link>
        <button type="submit" disabled={submitting} className="btn-primary-custom">
          {submitting ? 'Saving...' : 'Save Vendor'}
        </button>
      </div>
    </form>
  );
}
