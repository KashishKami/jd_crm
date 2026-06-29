'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { PendingCounts } from '../../types/dashboard';

interface PendingCountsRowProps {
  pendingCounts: PendingCounts;
}

export default function PendingCountsRow({ pendingCounts }: PendingCountsRowProps) {
  // Refs and active index for mobile swipable combo columns slider
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (gridRef.current) {
      const { scrollLeft, clientWidth } = gridRef.current;
      if (clientWidth > 0) {
        setActiveIndex(Math.round(scrollLeft / clientWidth));
      }
    }
  };

  const steps = [
    {
      label: 'Pending Booking',
      amount: pendingCounts['Pending Booking']?.amount || 0,
      count: pendingCounts['Pending Booking']?.count || 0,
      route: '/pending/booking',
      color: '#a47c5c',
      bg: '#faf5eb',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      label: 'Pending Shipment',
      amount: pendingCounts['Pending Shipment']?.amount || 0,
      count: pendingCounts['Pending Shipment']?.count || 0,
      route: '/pending/shipment',
      color: '#5f758d',
      bg: '#f0f5fa',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      )
    },
    {
      label: 'Pending Delivery',
      amount: pendingCounts['Pending Delivery']?.amount || 0,
      count: pendingCounts['Pending Delivery']?.count || 0,
      route: '/pending/delivery',
      color: '#5f658c',
      bg: '#f0f1fa',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124l-.321-5.128a2.25 2.25 0 00-2.23-2.114H18.75V5.25A2.25 2.25 0 0016.5 3H6.622a2.25 2.25 0 00-2.25 2.25v9m15 0H3.375m15 0V14.25m-12-9.75h-.008v.008H6V4.5z" />
        </svg>
      )
    },
    {
      label: 'Pending Feedback',
      amount: pendingCounts['Pending Feedback']?.amount || 0,
      count: pendingCounts['Pending Feedback']?.count || 0,
      route: '/pending/feedback',
      color: '#5a866c',
      bg: '#f2f7f4',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      )
    },
    {
      label: 'Pending Resolutions',
      amount: pendingCounts['Pending Resolutions']?.amount || 0,
      count: pendingCounts['Pending Resolutions']?.count || 0,
      route: '/pending/resolutions',
      color: '#b25353',
      bg: '#faf2f2',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
        </svg>
      )
    },
    {
      label: 'Completed Orders',
      amount: pendingCounts['Completed Orders']?.amount || 0,
      count: pendingCounts['Completed Orders']?.count || 0,
      route: '/orders?saleStatus=1&status=Completed+Orders',
      color: '#4b7ccd',
      bg: '#f0f5fa',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '20px', height: '20px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  // Group steps into columns/combos
  const combos = [
    {
      top: steps.find(s => s.label === 'Pending Booking'),
      bottom: steps.find(s => s.label === 'Pending Shipment'),
    },
    {
      top: steps.find(s => s.label === 'Pending Delivery'),
      bottom: steps.find(s => s.label === 'Pending Feedback'),
    },
    {
      top: steps.find(s => s.label === 'Pending Resolutions'),
      bottom: steps.find(s => s.label === 'Completed Orders'),
    }
  ].filter(combo => combo.top || combo.bottom);

  return (
    <div className="kpi-swipe-container" style={{ position: 'relative', width: '100%' }}>
      <div
        ref={gridRef}
        onScroll={handleScroll}
        className="kpi-cards-grid kpi-cards-swipeable"
      >
        {combos.map((combo, idx) => (
          <div 
            key={idx} 
            className="kpi-combo-column" 
          >
            {combo.top && (
              <Link
                href={combo.top.route}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div className="metric-card metric-card-interactive" style={{ border: '3px solid #f1f5f9', height: '100%' }}>
                  <div className="metric-card-body">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="metric-card-title" style={{ display: 'block', minHeight: '38px' }}>
                        {combo.top.label}
                      </span>
                      <div className="metric-card-value-wrapper">
                        <div className="metric-card-value-container">
                          <span className="metric-card-prefix">$</span>
                          <span className="metric-card-value">
                            {combo.top.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="metric-card-count">
                          ({combo.top.count} Sales)
                        </div>
                      </div>
                    </div>
                    {combo.top.icon && (
                      <div
                        className="metric-card-icon-container"
                        style={{
                          background: combo.top.bg,
                          color: combo.top.color,
                          borderRadius: '10px',
                          alignSelf: 'center',
                        }}
                      >
                        {combo.top.icon}
                      </div>
                    )}
                  </div>
                  <div className="metric-card-footer-band" style={{ backgroundColor: '#f1f5f9', borderTop: '3px solid #f1f5f9' }}>
                    <span className="metric-card-footer">View Details &rarr;</span>
                  </div>
                </div>
              </Link>
            )}

            {combo.bottom && (
              <Link
                href={combo.bottom.route}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div className="metric-card metric-card-interactive" style={{ border: '3px solid #f1f5f9', height: '100%' }}>
                  <div className="metric-card-body">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span className="metric-card-title" style={{ display: 'block', minHeight: '38px' }}>
                        {combo.bottom.label}
                      </span>
                      <div className="metric-card-value-wrapper">
                        <div className="metric-card-value-container">
                          <span className="metric-card-prefix">$</span>
                          <span className="metric-card-value">
                            {combo.bottom.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="metric-card-count">
                          ({combo.bottom.count} Sales)
                        </div>
                      </div>
                    </div>
                    {combo.bottom.icon && (
                      <div
                        className="metric-card-icon-container"
                        style={{
                          background: combo.bottom.bg,
                          color: combo.bottom.color,
                          borderRadius: '10px',
                          alignSelf: 'center',
                        }}
                      >
                        {combo.bottom.icon}
                      </div>
                    )}
                  </div>
                  <div className="metric-card-footer-band" style={{ backgroundColor: '#f1f5f9', borderTop: '3px solid #f1f5f9' }}>
                    <span className="metric-card-footer">View Details &rarr;</span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="kpi-swipe-indicators">
        {combos.map((_, idx) => (
          <span
            key={idx}
            className={`swipe-dot ${idx === activeIndex ? 'active' : ''}`}
            onClick={() => {
              if (gridRef.current) {
                gridRef.current.scrollTo({
                  left: idx * gridRef.current.clientWidth,
                  behavior: 'smooth'
                });
              }
            }}
            title={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
