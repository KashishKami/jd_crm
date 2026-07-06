'use client';

import React, { useState } from 'react';

interface LedgerCardItemProps {
  card: {
    cardId: number;
    customerNameOncard: string | null;
    customerCardNumber: string | null;
    customerCardExpDate: string | null;
    customerCardCvv: string | null;
    customerCardCopyStatus: string | null;
    customerCardPhotoStatus: string | null;
    amountToCharge: string | null;
    customerCardCopyImage: string | null;
    customerPhotoIdImage: string | null;
  };
  idx: number;
  canViewCards: boolean;
}

function maskCardNumber(num: string | null | undefined): string {
  if (!num) return '—';
  const clean = num.replace(/\s+/g, '');
  if (clean.length < 4) return '****';
  return `**** **** **** ${clean.slice(-4)}`;
}

export default function LedgerCardItem({ card, idx, canViewCards }: LedgerCardItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCopyImage, setShowCopyImage] = useState(false);
  const [showPhotoIdImage, setShowPhotoIdImage] = useState(false);

  const hasCopyImage = !!card.customerCardCopyImage;
  const hasPhotoIdImage = !!card.customerPhotoIdImage;

  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', marginBottom: '0', backgroundColor: '#f8fafc', overflow: 'hidden', boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.05)' }}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 20px', 
          backgroundColor: '#f1f5f9', 
          borderBottom: isExpanded ? '1px solid #cbd5e1' : 'none',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <h4 className="font-semibold text-slate-700 text-sm">Payment Card #{idx + 1}</h4>
        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </span>
      </div>
      
      {isExpanded && (
        <div style={{ padding: '24px' }}>
          <div className="info-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
            <div className="info-group">
              <span className="info-label">Cardholder</span>
              <span className="info-value font-mono">{card.customerNameOncard || '—'}</span>
            </div>
            
            <div className="info-group">
              <span className="info-label">Card Number</span>
              <span className="info-value font-mono">
                {canViewCards ? card.customerCardNumber || '—' : maskCardNumber(card.customerCardNumber)}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="info-group">
                <span className="info-label">Expiry</span>
                <span className="info-value font-mono">{card.customerCardExpDate || '—'}</span>
              </div>
              <div className="info-group">
                <span className="info-label">CVV</span>
                <span className="info-value font-mono">
                  {canViewCards ? card.customerCardCvv || '—' : '***'}
                </span>
              </div>
            </div>

            {card.amountToCharge && (
              <div className="info-group">
                <span className="info-label">Amount to Charge</span>
                <span className="info-value font-mono font-semibold">${card.amountToCharge}</span>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <div className="info-group">
                <span className="info-label" style={{ fontSize: '10px' }}>Card copy received</span>
                {card.customerCardCopyStatus === 'Yes' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid triggering card collapse
                      if (canViewCards && hasCopyImage) {
                        setShowCopyImage(!showCopyImage);
                      }
                    }}
                    className="status-dot-badge status-active"
                    style={{
                      marginTop: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: canViewCards && hasCopyImage ? 'pointer' : 'default',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span>Yes</span>
                    {canViewCards && hasCopyImage && (
                      <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                        {showCopyImage ? '▲ Hide' : '▼ View'}
                      </span>
                    )}
                  </button>
                ) : (
                  <span className="status-dot-badge status-inactive" style={{ marginTop: '4px', display: 'inline-block' }}>
                    No
                  </span>
                )}
              </div>

              <div className="info-group">
                <span className="info-label" style={{ fontSize: '10px' }}>Photo ID received</span>
                {card.customerCardPhotoStatus === 'Yes' ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid triggering card collapse
                      if (canViewCards && hasPhotoIdImage) {
                        setShowPhotoIdImage(!showPhotoIdImage);
                      }
                    }}
                    className="status-dot-badge status-active"
                    style={{
                      marginTop: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: canViewCards && hasPhotoIdImage ? 'pointer' : 'default',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                    }}
                  >
                    <span>Yes</span>
                    {canViewCards && hasPhotoIdImage && (
                      <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                        {showPhotoIdImage ? '▲ Hide' : '▼ View'}
                      </span>
                    )}
                  </button>
                ) : (
                  <span className="status-dot-badge status-inactive" style={{ marginTop: '4px', display: 'inline-block' }}>
                    No
                  </span>
                )}
              </div>
            </div>

            {canViewCards && (showCopyImage || showPhotoIdImage) && (
              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                {showCopyImage && card.customerCardCopyImage && (
                  <div className="info-group">
                    <span className="info-label" style={{ fontSize: '10px' }}>Card Copy Image</span>
                    <a href={card.customerCardCopyImage} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '4px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.customerCardCopyImage}
                        alt="Card Copy"
                        style={{ maxHeight: '100px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'block' }}
                      />
                    </a>
                  </div>
                )}
                {showPhotoIdImage && card.customerPhotoIdImage && (
                  <div className="info-group">
                    <span className="info-label" style={{ fontSize: '10px' }}>Photo ID Image</span>
                    <a href={card.customerPhotoIdImage} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '4px' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.customerPhotoIdImage}
                        alt="Photo ID"
                        style={{ maxHeight: '100px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'block' }}
                      />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
