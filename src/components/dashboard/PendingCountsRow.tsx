'use client';

import React from 'react';
import Link from 'next/link';
import { PendingCounts } from '../../types/dashboard';

interface PendingCountsRowProps {
  pendingCounts: PendingCounts;
}

export default function PendingCountsRow({ pendingCounts }: PendingCountsRowProps) {
  const steps = [
    { label: 'Pending Booking', count: pendingCounts['Pending Booking'] || 0, route: '/pending/booking', color: '#f59e0b', bg: '#fef3c7' },
    { label: 'Pending Shipment', count: pendingCounts['Pending Shipment'] || 0, route: '/pending/shipment', color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Pending Delivery', count: pendingCounts['Pending Delivery'] || 0, route: '/pending/delivery', color: '#6366f1', bg: '#e0e7ff' },
    { label: 'Pending Feedback', count: pendingCounts['Pending Feedback'] || 0, route: '/pending/feedback', color: '#10b981', bg: '#d1fae5' },
    { label: 'Pending Resolutions', count: pendingCounts['Pending Resolutions'] || 0, route: '/pending/resolutions', color: '#ef4444', bg: '#fee2e2' },
  ];

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
      }}
    >
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
        Sales Pipeline Stages
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
        }}
        className="pipeline-grid"
      >
        {steps.map((step, idx) => (
          <Link
            key={idx}
            href={step.route}
            style={{
              textDecoration: 'none',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              transition: 'all 0.2s ease',
              position: 'relative',
            }}
            className="pipeline-card"
          >
            <div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: step.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                }}
              >
                {step.label}
              </span>
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginTop: '8px',
                }}
              >
                {step.count}
              </div>
            </div>

            {idx < 4 && (
              <div
                style={{
                  position: 'absolute',
                  right: '-12px',
                  top: 'calc(50% - 8px)',
                  zIndex: 10,
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                }}
                className="pipeline-arrow"
              >
                &rarr;
              </div>
            )}
          </Link>
        ))}
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .pipeline-grid {
            grid-template-columns: 1fr !important;
          }
          .pipeline-arrow {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
