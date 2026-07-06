'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fadeInPage } from '../../../lib/animations';
import VendorForm from '../../../components/VendorForm';

export default function NewVendorPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        vendorStatus: Number(formData.vendorStatus),
        vendorFax: formData.vendorFax || null,
        vendorEmail: formData.vendorEmail || null,
        vendorRemark: formData.vendorRemark || null,
        vendorAlternatePhone1: formData.vendorAlternatePhone1 || null,
        vendorAlternatePhone2: formData.vendorAlternatePhone2 || null,
        vendorCountry: formData.vendorCountry || null,
        vendorState: formData.vendorState || null,
        vendorPaymentMode: formData.vendorPaymentMode || null,
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
      </div>

      {error && (
        <div className="error-box" style={{ padding: '16px', margin: '0 0 20px 0' }}>
          <p>{error}</p>
        </div>
      )}

      <VendorForm onSubmit={handleSubmit} submitting={submitting} cancelHref="/vendors" />
    </div>
  );
}
