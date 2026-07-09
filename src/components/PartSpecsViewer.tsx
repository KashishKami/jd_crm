'use client';

import React, { useState } from 'react';

interface PartSpecsViewerProps {
  parentOrder: any;
  childOrders: any[];
}

export default function PartSpecsViewer({ parentOrder, childOrders = [] }: PartSpecsViewerProps) {
  const allParts = [parentOrder, ...childOrders];
  const [expandedIndices, setExpandedIndices] = useState<number[]>([]);

  const toggleExpand = (idx: number) => {
    if (expandedIndices.includes(idx)) {
      setExpandedIndices(expandedIndices.filter((i) => i !== idx));
    } else {
      setExpandedIndices([...expandedIndices, idx]);
    }
  };

  const renderPartFields = (part: any) => {
    return (
      <div className="form-grid-3col form-compact" style={{ padding: '4px' }}>
        <div className="form-group form-span-3">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ wordBreak: 'break-word' }}>
              <span className="form-label">Year, Make & Model</span>
              <span className="info-value">{part.orderMakeModel || '—'}</span>
            </div>
            <div className="form-group" style={{ wordBreak: 'break-word' }}>
              <span className="form-label">Part</span>
              <span className="info-value font-bold text-slate-900">{part.orderPart || '—'}</span>
            </div>
          </div>
        </div>

        <div className="form-group form-span-3">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ wordBreak: 'break-word' }}>
              <span className="form-label">Specifications</span>
              <span className="info-value">{part.orderPartSize || '—'}</span>
            </div>
            <div className="form-group" style={{ wordBreak: 'break-word' }}>
              <span className="form-label">VIN Number</span>
              <span className="info-value font-mono uppercase">{part.orderVin || '—'}</span>
            </div>
          </div>
        </div>

        <div className="form-group form-span-3">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ wordBreak: 'break-word' }}>
              <span className="form-label">Quoted Miles and Warranty</span>
              <span className="info-value font-mono">{part.orderQuotedMilesAndWarranty || '—'}</span>
            </div>
            <div className="form-group" style={{ wordBreak: 'break-word' }}>
              <span className="form-label">Vendor Miles and Warranty</span>
              <span className="info-value font-mono">{part.orderVendorMilesAndWarranty || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-main" style={{ padding: '24px', fontFamily: 'Georgia, serif' }}>
      <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
        Part Information
      </h3>

      {allParts.length === 1 ? (
        // Single part: normal card style
        <div style={{ padding: '4px' }}>
          {renderPartFields(allParts[0])}
        </div>
      ) : (
        // Multiple parts: collapsible dropdowns per card
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {allParts.map((part, idx) => {
            const isExpanded = expandedIndices.includes(idx);
            return (
              <div
                key={part.crmOrderId || idx}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  overflow: 'hidden',
                }}
              >
                {/* Collapsible Header */}
                <div
                  onClick={() => toggleExpand(idx)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    backgroundColor: '#f1f5f9',
                    borderBottom: isExpanded ? '1px solid #cbd5e1' : 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  <h4 className="font-semibold text-slate-700 text-sm" style={{ margin: 0 }}>
                    Part #{idx + 1} {idx === 0 ? '(Primary)' : ''} - {part.orderPart || 'No Description'}
                  </h4>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    color: '#64748b',
                    transition: 'transform 0.2s ease',
                    display: 'inline-block',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    WebkitTextStroke: '1.2px currentColor'
                  }}>
                    ︾
                  </span>
                </div>

                {/* Collapsible Body */}
                {isExpanded && (
                  <div style={{ padding: '24px' }}>
                    {renderPartFields(part)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
