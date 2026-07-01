'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface MetricCardProps {
  title: string;
  amount: number;
  count: number;
  countLabel?: string;
  link?: string;
  prefix?: string;
  description?: string;
  lastAmount?: number;
  lastCount?: number;
  percentageChange?: number;
  periodLabel?: string;
}

export default function MetricCard({
  title,
  amount,
  count,
  countLabel = 'orders',
  link,
  prefix = '',
  description,
  lastAmount,
  lastCount,
  percentageChange,
  periodLabel = 'last period',
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = React.useState(amount);

  useEffect(() => {
    const end = amount;

    // In test environments, skip animation entirely — initial state already equals amount
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    if (displayValue === end) return;

    const duration = 1200; // 1.2 seconds animation
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress);
      const currentValue = Math.floor(easeProgress * end);

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
  }, [amount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sparkline calculations
  const hasComparison = lastAmount !== undefined && percentageChange !== undefined;
  
  let sparklineSvg = null;
  if (hasComparison) {
    const maxVal = Math.max(amount, lastAmount || 0);
    const height = 30; // Max SVG height
    const h1 = maxVal > 0 ? ((lastAmount || 0) / maxVal) * height : 0;
    const h2 = maxVal > 0 ? (amount / maxVal) * height : 0;
    
    // SVG Coordinate y starts from top, so we subtract from height
    const y1 = height - h1;
    const y2 = height - h2;
    
    const isIncrease = amount >= (lastAmount || 0);
    const strokeColor = isIncrease ? '#5c8f76' : '#b85b5b'; // Sage Green or Soft Red
    const fill1 = '#f1f5f9'; // Soft desaturated grey
    const fill2 = isIncrease ? '#4b7ccd' : '#8b97a5'; // Muted blue or Muted grey for current

    sparklineSvg = (
      <svg className="metric-card-sparkline" width="60" height="35" viewBox="0 0 60 35" style={{ overflow: 'visible', alignSelf: 'center' }}>
        {/* Previous Period Bar */}
        <rect
          x="10"
          y={y1}
          width="8"
          height={h1}
          rx="1.5"
          fill={fill1}
        />
        {/* Current Period Bar */}
        <rect
          x="40"
          y={y2}
          width="8"
          height={h2}
          rx="1.5"
          fill={fill2}
        />
      </svg>
    );
  }

  const isIncrease = percentageChange !== undefined && percentageChange >= 0;

  const cardContent = (
    <div
      className={`metric-card ${link ? 'metric-card-interactive' : ''} ${hasComparison ? 'card-has-graph' : 'card-no-graph'}`}
      style={{
        border: '3px solid #f1f5f9',
        height: '100%',
      }}
    >
      <div className="metric-card-body">
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="metric-card-title" style={{ display: 'block', minHeight: '38px' }}>
            {title}
          </span>
          <div className="metric-card-value-wrapper">
            <div className="metric-card-value-container">
              {prefix && <span className="metric-card-prefix">{prefix}</span>}
              <span className="metric-card-value">
                {displayValue.toLocaleString('en-US')}
              </span>
            </div>
            <div className="metric-card-count">
              ({count} {countLabel})
            </div>
          </div>
        </div>

        {/* Dynamic comparison elements */}
        {hasComparison ? (
          <div className="metric-card-comparison-aside">
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isIncrease ? '#10b981' : '#ef4444',
                backgroundColor: isIncrease ? '#f0fdf4' : '#fef2f2',
                padding: '3px 8px',
                borderRadius: '50px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {isIncrease ? '↗' : '↘'} {Math.abs(percentageChange || 0)}%
            </span>
            {sparklineSvg}
          </div>
        ) : null}
      </div>

      <div
        className="metric-card-footer-band"
        style={{
          backgroundColor: '#f1f5f9',
          borderTop: '3px solid #f1f5f9',
        }}
      >
        <span className="metric-card-period-label">
        </span>
        {link && (
          <span className="metric-card-footer">
            View Details &rarr;
          </span>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} prefetch={false} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
