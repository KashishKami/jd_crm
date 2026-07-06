'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fadeInPage } from '../../../../lib/animations';
import VendorForm from '../../../../components/VendorForm';

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ? Number(params.id) : NaN;

  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<any | null>(null);
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
            vendorAlternatePhone1: data.vendorAlternatePhone1 || '',
            vendorAlternatePhone2: data.vendorAlternatePhone2 || '',
            vendorCountry: data.vendorCountry || 'USA',
            vendorState: data.vendorState || '',
            vendorPaymentMode: data.vendorPaymentMode || '[]',
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

  const handleSubmit = async (updatedData: any) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...updatedData,
        vendorStatus: Number(updatedData.vendorStatus),
        vendorFax: updatedData.vendorFax || null,
        vendorEmail: updatedData.vendorEmail || null,
        vendorRemark: updatedData.vendorRemark || null,
        vendorAlternatePhone1: updatedData.vendorAlternatePhone1 || null,
        vendorAlternatePhone2: updatedData.vendorAlternatePhone2 || null,
        vendorCountry: updatedData.vendorCountry || null,
        vendorState: updatedData.vendorState || null,
        vendorPaymentMode: updatedData.vendorPaymentMode || null,
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
          <p className="page-subtitle">Modify supplier profile details for {formData?.vendorName}</p>
        </div>
      </div>

      {error && (
        <div className="error-box" style={{ padding: '16px', margin: '0 0 20px 0' }}>
          <p>{error}</p>
        </div>
      )}

      {formData && (
        <VendorForm
          initialData={formData}
          onSubmit={handleSubmit}
          submitting={submitting}
          cancelHref={`/vendors/${id}`}
        />
      )}
    </div>
  );
}
