'use client';

import React from 'react';
import { AttendanceSummary } from '../../types/dashboard';

interface AttendanceSummaryRowProps {
  summary: AttendanceSummary;
}

export default function AttendanceSummaryRow({ summary }: AttendanceSummaryRowProps) {
  const total = summary.present + summary.absent + summary.lwop + summary.halfDay;

  const items = [
    { label: 'Present', count: summary.present, color: '#16a34a', bg: '#f0fdf4', border: '#bkey-green' },
    { label: 'Absent', count: summary.absent, color: '#dc2626', bg: '#fef2f2', border: '#fkey-red' },
    { label: 'LWOP', count: summary.lwop, color: '#d97706', bg: '#fffbeb', border: '#fkey-amber' },
    { label: 'Half Day / PL', count: summary.halfDay, color: '#2563eb', bg: '#eff6ff', border: '#fkey-blue' },
  ];

  return (
    <div
      className="card-with-accent"
      style={{
        background: 'white',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Total Agents Tracked: <strong>{total}</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: item.bg,
              border: `1px solid rgba(0,0,0,0.03)`,
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: item.color, marginTop: '4px' }}>
                {item.count}
              </div>
            </div>
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: item.color,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
