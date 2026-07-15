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
  sparklineData?: number[];
}

const getSmoothPath = (points: { x: number; y: number }[], isFill: boolean, svgHeight: number) => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  
  const line = (pointA: { x: number; y: number }, pointB: { x: number; y: number }) => {
    const lengthX = pointB.x - pointA.x;
    const lengthY = pointB.y - pointA.y;
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX),
    };
  };

  const controlPoint = (
    current: { x: number; y: number },
    previous: { x: number; y: number } | undefined,
    next: { x: number; y: number } | undefined,
    reverse: boolean
  ) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.15;
    const o = line(p, n);
    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;
    const x = current.x + Math.cos(angle) * length;
    const y = current.y + Math.sin(angle) * length;
    return { x, y };
  };

  const bezierCommand = (point: { x: number; y: number }, i: number, a: { x: number; y: number }[]) => {
    const cpStart = controlPoint(a[i - 1], a[i - 2], point, false);
    const cpEnd = controlPoint(point, a[i - 1], a[i + 1], true);
    return `C ${cpStart.x.toFixed(1)},${cpStart.y.toFixed(1)} ${cpEnd.x.toFixed(1)},${cpEnd.y.toFixed(1)} ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  };

  const d = points.reduce((acc, point, i, a) => {
    if (i === 0) {
      return `M ${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }
    return `${acc} ${bezierCommand(point, i, a)}`;
  }, '');

  if (isFill) {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    return `${d} L ${lastPoint.x.toFixed(1)},${svgHeight} L ${firstPoint.x.toFixed(1)},${svgHeight} Z`;
  }
  
  return d;
};

const getVsLabel = (periodLabel: string) => {
  const label = periodLabel.toLowerCase().trim();
  if (label === 'last year') return 'VS Last Year';
  if (label === 'last month') return 'VS Last Month';
  if (label === 'yesterday') return 'VS Yesterday';
  return `VS ${periodLabel}`;
};

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
  sparklineData,
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
  if (sparklineData && sparklineData.length >= 2) {
    const maxVal = Math.max(...sparklineData, 1);
    const minVal = Math.min(...sparklineData, 0);
    const rangeVal = maxVal - minVal;
    
    const svgWidth = 160;
    const svgHeight = 45;
    const padding = 2;
    
    const pointsData = sparklineData.map((val, idx) => {
      const x = padding + (idx / (sparklineData.length - 1)) * (svgWidth - 2 * padding);
      const y = svgHeight - padding - ((val - minVal) / rangeVal) * (svgHeight - 2 * padding);
      return { x, y };
    });

    const strokePath = getSmoothPath(pointsData, false, svgHeight);
    const fillPath = getSmoothPath(pointsData, true, svgHeight);

    const isIncrease = percentageChange !== undefined ? percentageChange >= 0 : true;
    const strokeColor = isIncrease ? '#1e8e69' : '#d35252';
    const fillGradientId = `gradient-${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;

    sparklineSvg = (
      <svg className="metric-card-sparkline" width="160" height="45" viewBox="0 0 160 45" style={{ overflow: 'visible', alignSelf: 'flex-end' }}>
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d={fillPath}
          fill={`url(#${fillGradientId})`}
        />
        <path
          d={strokePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pointsData.map((pt, idx) => (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r="3"
            fill={strokeColor}
            stroke="#ffffff"
            strokeWidth="1"
          />
        ))}
      </svg>
    );
  } else if (hasComparison) {
    const maxVal = Math.max(amount, lastAmount || 0);
    const height = 30; // Max SVG height
    const h1 = maxVal > 0 ? ((lastAmount || 0) / maxVal) * height : 0;
    const h2 = maxVal > 0 ? (amount / maxVal) * height : 0;
    
    const y1 = height - h1;
    const y2 = height - h2;
    
    const isIncrease = amount >= (lastAmount || 0);
    const fill1 = '#f1f5f9';
    const fill2 = isIncrease ? '#4b7ccd' : '#8b97a5';

    sparklineSvg = (
      <svg className="metric-card-sparkline" width="60" height="35" viewBox="0 0 60 35" style={{ overflow: 'visible', alignSelf: 'flex-end' }}>
        <rect
          x="10"
          y={y1}
          width="8"
          height={h1}
          rx="1.5"
          fill={fill1}
        />
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
      className={`metric-card ${link ? 'metric-card-interactive' : ''} ${hasComparison || (sparklineData && sparklineData.length >= 2) ? 'card-has-graph' : 'card-no-graph'}`}
      style={{
        border: '3px solid #f1f5f9',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Percentage Badge positioned absolutely at top right */}
      {percentageChange !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isIncrease ? '#1e8e69' : '#d35252',
              backgroundColor: isIncrease ? '#eafaf1' : '#fdf0f0',
              padding: '3px 8px',
              borderRadius: '50px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {isIncrease ? '↗' : '↘'} {Math.abs(percentageChange || 0)}%
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 500,
              color: '#64748b',
              marginLeft: '6px',
            }}
          >
            {getVsLabel(periodLabel)}
          </span>
        </div>
      )}

      <div className="metric-card-body" style={{ display: 'flex', flexDirection: 'column', padding: '20px', height: '100%', boxSizing: 'border-box' }}>
        {/* Title at the top */}
        <span className="metric-card-title" style={{ display: 'block', minHeight: '24px', marginRight: '140px', marginBottom: '8px' }}>
          {title}
        </span>

        {/* Content Row: Value + Sparkline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flex: 1, width: '100%' }}>
          {/* Left: Value & Count */}
          <div className="metric-card-value-wrapper" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div className="metric-card-value-container" style={{ display: 'flex', alignItems: 'baseline' }}>
              {prefix && <span className="metric-card-prefix" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', lineHeight: '1.2' }}>{prefix}</span>}
              <span className="metric-card-value" style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1e293b', lineHeight: '1.1' }}>
                {displayValue.toLocaleString('en-US')}
              </span>
            </div>
            <div className="metric-card-count" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              ({count} {countLabel})
            </div>
          </div>

          {/* Right: Sparkline SVG */}
          {sparklineSvg && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', marginLeft: '12px', height: '45px' }}>
              {sparklineSvg}
            </div>
          )}
        </div>
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
