'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { countUp } from '../../lib/animations';

interface MetricCardProps {
  title: string;
  amount: number;
  count: number;
  countLabel?: string;
  link?: string;
  prefix?: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: string;
}

export default function MetricCard({
  title,
  amount,
  count,
  countLabel = 'orders',
  link,
  prefix = '',
  description,
  icon,
  gradient = 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = React.useState(amount);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayValue(amount);
      return;
    }

    const start = 0;
    const end = amount;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 1200; // 1.2 seconds matching old duration
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.floor(start + easeProgress * (end - start));
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [amount]);

  const cardContent = (
    <div
      className="metric-card"
      style={{
        cursor: link ? 'pointer' : 'default',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        if (link) {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(0, 0, 0, 0.12), 0 8px 12px -6px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.borderColor = '#94a3b8';
        }
      }}
      onMouseLeave={(e) => {
        if (link) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.borderColor = 'var(--border-color)';
        }
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <span className="metric-card-title">
            {title}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '8px' }}>
            <div className="metric-card-value-container">
              {prefix && <span className="metric-card-prefix">{prefix}</span>}
              <span className="metric-card-value">
                {displayValue}
              </span>
            </div>
            <div className="metric-card-count">
              ({count} {countLabel})
            </div>
          </div>
        </div>
        {icon && (
          <div
            className="metric-card-icon-container"
            style={{
              background: gradient,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      {link ? (
        <div className="metric-card-footer">
          View Details &rarr;
        </div>
      ) : description ? (
        <div className="metric-card-description">
          {description}
        </div>
      ) : null}
    </div>
  );

  if (link) {
    return (
      <Link href={link} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
