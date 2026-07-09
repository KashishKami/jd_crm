'use client';

import React, { useState } from 'react';

interface FinancialBreakdownCardProps {
  sellingPrice: number;
  buyingPrice: number;
  netMargin: number;
  chargedAmount: number;
  refundAmount: number;
  balanceDue: number;
  finalMargin: number;
  vendorBreakdown: Array<{ vendorName: string; parts: string; total: number }>;
}

export default function FinancialBreakdownCard({
  sellingPrice,
  buyingPrice,
  netMargin,
  chargedAmount,
  refundAmount,
  balanceDue,
  finalMargin,
  vendorBreakdown,
}: FinancialBreakdownCardProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  return (
    <div style={{
      fontFamily: 'Georgia, serif',
      backgroundColor: '#1e293b',
      color: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      width: '100%',
    }}>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#ffffff',
        margin: '0 0 20px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '16px',
        textTransform: 'capitalize'
      }}>
        Financial Breakdown
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'capitalize' }}>Selling Price</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${sellingPrice.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={() => setBreakdownOpen(!breakdownOpen)}
            title="Click to toggle vendor price distribution"
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Buying Price
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {breakdownOpen ? '▲' : '▼'}
              </span>
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${buyingPrice.toFixed(2)}</span>
          </div>

          {breakdownOpen && (
            <div
              style={{
                backgroundColor: '#0f172a',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.75rem',
                marginTop: '4px',
              }}
            >
              {vendorBreakdown.length === 0 ? (
                <div style={{ color: '#94a3b8' }}>No parts added yet</div>
              ) : (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 1.8fr 1.2fr',
                    gap: '8px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    paddingBottom: '6px',
                    fontWeight: 'bold',
                    color: '#94a3b8'
                  }}>
                    <span>Vendor</span>
                    <span>Part(s)</span>
                    <span style={{ textAlign: 'right' }}>Price</span>
                  </div>
                  {vendorBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.8fr 1.8fr 1.2fr',
                        gap: '8px',
                        color: '#cbd5e1',
                        borderBottom: idx === vendorBreakdown.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        paddingBottom: idx === vendorBreakdown.length - 1 ? 0 : '8px',
                        alignItems: 'center',
                        wordBreak: 'break-word',
                      }}
                    >
                      <span>{item.vendorName}</span>
                      <span>{item.parts}</span>
                      <span style={{ fontWeight: 'bold', textAlign: 'right' }}>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'capitalize' }}>Net Margin</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${netMargin.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'capitalize' }}>Charged Amount</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${chargedAmount.toFixed(2)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'capitalize' }}>Refund Amount</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f87171' }}>${refundAmount.toFixed(2)}</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'capitalize' }}>Balance Due</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${balanceDue.toFixed(2)}</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'capitalize' }}>Final Margin</span>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: finalMargin >= 0 ? '#10b981' : '#f87171'
          }}>
            ${finalMargin.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
