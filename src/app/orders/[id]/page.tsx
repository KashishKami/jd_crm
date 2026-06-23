import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/db';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function OrderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const idValue = Number(resolvedParams.id);

  if (isNaN(idValue)) {
    return notFound();
  }

  // Find order by crmOrderId or orderCustomerId
  const order = await prisma.crmOrders.findFirst({
    where: {
      OR: [
        { crmOrderId: idValue },
        { orderCustomerId: idValue }
      ]
    },
    include: {
      customer: true,
      vendor: true,
      salesAgent: true,
    },
  });

  if (!order) {
    return notFound();
  }

  const isVendorBlacklisted = order.vendor && order.vendor.vendorStatus === 0;

  return (
    <div className="agents-page-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
      <div className="page-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Order #JD{order.crmOrderId}</h1>
          <p className="page-subtitle">Customer: {order.customer?.firstName} {order.customer?.lastName}</p>
        </div>
        <Link href="/vendors" className="btn-secondary-custom">
          Back to Directory
        </Link>
      </div>

      {isVendorBlacklisted && (
        <div className="error-box" style={{ margin: '0 0 24px 0', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg style={{ width: '28px', height: '28px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <strong style={{ display: 'block', fontSize: '1rem' }}>Warning: The vendor for this order is blacklisted!</strong>
            <span style={{ fontSize: '0.85rem' }}>This order is linked to a supplier that has been blacklisted. Please review details immediately.</span>
          </div>
        </div>
      )}

      <div className="form-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="form-section">
          <h3 className="form-section-title">Order Information</h3>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Vehicle Year / Make / Model</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                {order.orderYear || '—'} {order.orderMakeModel || '—'}
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Part Requested</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                {order.orderPart || '—'} {order.orderPartSize ? `(${order.orderPartSize})` : ''}
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Pitched Selling Price</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                ${order.orderTotalPitched || '0'}
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Buying Vendor Cost</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                ${order.orderVendorPrice || '0'}
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Markup Margin</span>
              <div style={{ fontWeight: '600', color: '#15803d', marginTop: '4px' }}>
                ${order.orderMarkup || '0'}
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Sales Agent</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                {order.orderSalesAgentName || '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="form-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <h3 className="form-section-title">Supplier Information</h3>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Vendor Name</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                {order.vendor?.vendorName || order.orderVendorName || '—'}
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Contact Person</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                {order.vendor?.vendorContactPerson || '—'}
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Vendor Phone</span>
              <div style={{ fontWeight: '600', color: 'var(--text-main)', marginTop: '4px' }}>
                {order.vendor?.vendorPhone || '—'}
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Vendor Status</span>
              <div style={{ marginTop: '4px' }}>
                {order.vendor ? (
                  <span className={`status-dot-badge ${order.vendor.vendorStatus === 1 ? 'status-active' : 'status-inactive'}`} style={{ padding: '2px 8px' }}>
                    {order.vendor.vendorStatus === 1 ? 'Active' : 'Blacklisted'}
                  </span>
                ) : (
                  '—'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
