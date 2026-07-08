'use client';

import React, { useState } from 'react';

interface PartSpecsViewerProps {
  parentOrder: any;
  childOrders: any[];
}

export default function PartSpecsViewer({ parentOrder, childOrders = [] }: PartSpecsViewerProps) {
  const allParts = [parentOrder, ...childOrders];
  const [activeIndex, setActiveIndex] = useState(0);
  const activePart = allParts[activeIndex];

  return (
    <div className="profile-main" style={{ padding: '24px', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
          Vehicle & Part Specifications
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

      <div className="info-grid">
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
    </div>
  );
}
