'use client';

import React, { useEffect, useRef } from 'react';
import { countUp } from '../../lib/animations';

interface MetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: string;
}

export default function MetricCard({
  title,
  value,
  prefix = '',
  description,
  icon,
  gradient = 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
}: MetricCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (valueRef.current && process.env.NODE_ENV !== 'test') {
      countUp(valueRef.current, value, 1.2);
    }
  }, [value]);

  return (
    <div
      className="metric-card"
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '140px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '8px', gap: '2px' }}>
            {prefix && <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{prefix}</span>}
            <span
              ref={valueRef}
              style={{ fontSize: '2.25rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}
            >
              {process.env.NODE_ENV === 'test' ? value : 0}
            </span>
          </div>
        </div>
        {icon && (
          <div
            style={{
              background: gradient,
              color: 'white',
              borderRadius: '10px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            }}
          >
            {icon}
          </div>
        )}
      </div>
      {description && (
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '12px' }}>
          {description}
        </div>
      )}
    </div>
  );
}
