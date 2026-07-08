'use client';

import React, { useState } from 'react';

interface PartSpecsViewerProps {
  parentOrder: any;
  childOrders: any[];
}

const saleStatuses: Record<string, string> = {
  '1': 'Sold',
  '2': 'Refunded',
  '3': 'Chargebacked',
  '4': 'Partial Refund',
  '5': 'Void',
  '6': 'Cancelled',
};

export default function PartSpecsViewer({ parentOrder, childOrders = [] }: PartSpecsViewerProps) {
  const allParts = [parentOrder, ...childOrders];
  const [activeIndex, setActiveIndex] = useState(0);
  const activePart = allParts[activeIndex];

  return (
    <div className="profile-main" style={{ padding: '24px', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          Vehicle & Part Details
        </h3>

        {allParts.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="active-part-selector" style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
              Select Part:
            </label>
            <select
              id="active-part-selector"
              value={activeIndex}
              onChange={(e) => setActiveIndex(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#1e293b',
                cursor: 'pointer',
                fontFamily: 'Georgia, serif'
              }}
            >
              {allParts.map((p, idx) => (
                <option key={p.crmOrderId} value={idx}>
                  {idx === 0 ? `Part #1 (Primary) - ${p.orderPart || 'No Description'}` : `Part #${idx + 1} - ${p.orderPart || 'No Description'}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Section 1: Specs */}
      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
        1. Vehicle & Part Specifications
      </h4>
      <div className="info-grid" style={{ marginBottom: '28px' }}>
        <div className="info-group" style={{ gridColumn: 'span 3' }}>
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Year, Make & Model</span>
          <span className="info-value" style={{ fontFamily: 'Georgia, serif' }}>{activePart.orderMakeModel || '—'}</span>
        </div>
        <div className="info-group" style={{ gridColumn: 'span 2' }}>
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Part Requested</span>
          <span className="info-value font-bold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>{activePart.orderPart || '—'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Dimensions / Specs</span>
          <span className="info-value" style={{ fontFamily: 'Georgia, serif' }}>{activePart.orderPartSize || '—'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Quoted Miles & Warranty</span>
          <span className="info-value font-mono">{activePart.orderQuotedMilesAndWarranty || '—'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Vendor Miles & Warranty</span>
          <span className="info-value font-mono">{activePart.orderVendorMilesAndWarranty || '—'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>VIN Number</span>
          <span className="info-value font-mono uppercase">{activePart.orderVin || '—'}</span>
        </div>
      </div>

      {/* Section 2: Part Sourcing & Status */}
      <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
        2. Part Sourcing & Status
      </h4>
      <div className="info-grid">
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Supplier</span>
          <span className="info-value" style={{ fontFamily: 'Georgia, serif' }}>{activePart.vendor?.vendorName || activePart.orderVendorName || 'Unassigned'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Buying Price (Cost)</span>
          <span className="info-value font-mono" style={{ fontWeight: '600' }}>{activePart.orderVendorPrice ? `$${parseFloat(activePart.orderVendorPrice).toFixed(2)}` : '—'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Backend Executive</span>
          <span className="info-value" style={{ fontFamily: 'Georgia, serif' }}>{activePart.backendExecutive?.nickname || activePart.backendExecutive?.name || activePart.orderBackendExecutiveName || 'Unassigned'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Part Found By</span>
          <span className="info-value" style={{ fontFamily: 'Georgia, serif' }}>{activePart.partFoundBy?.nickname || activePart.partFoundBy?.name || activePart.orderPartFoundByName || '—'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Sale Status</span>
          <span className="info-value font-semibold" style={{ fontFamily: 'Georgia, serif' }}>{saleStatuses[activePart.saleStatus || '1']}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Workflow Status</span>
          <span className="info-value font-semibold" style={{ fontFamily: 'Georgia, serif' }}>{activePart.orderCurrentStatus || 'Pending Booking'}</span>
        </div>
        <div className="info-group">
          <span className="info-label" style={{ fontFamily: 'Georgia, serif' }}>Vendor Feedback</span>
          <span className="info-value font-semibold" style={{ fontFamily: 'Georgia, serif', color: activePart.orderVendorFeedback === 'Negative' ? '#ef4444' : '#10b981' }}>
            {activePart.orderVendorFeedback || 'Positive'}
          </span>
        </div>
      </div>
    </div>
  );
}
