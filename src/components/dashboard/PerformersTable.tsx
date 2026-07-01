'use client';

import React from 'react';
import { PerformerRow } from '../../types/dashboard';

interface PerformersTableProps {
  title: string;
  performers: PerformerRow[];
  isTop?: boolean;
}

export default function PerformersTable({ title, performers, isTop = true }: PerformersTableProps) {
  return (
    <div className="table-wrapper card-with-accent" style={{ flex: 1, minWidth: '300px' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>{title}</h3>
        <span
          className={`status-badge ${isTop ? 'status-leaders' : 'status-needs-review'}`}
        >
          {isTop ? 'Leaders' : 'Needs Review'}
        </span>
      </div>
      {performers.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No data available
        </div>
      ) : (
        <div className="card-table-container">
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '45px' }}>Rank</th>
                <th>Agent</th>
                <th style={{ textAlign: 'right' }}>Total Volume</th>
              </tr>
            </thead>
            <tbody>
              {performers.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: idx === 0 && isTop ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                    #{idx + 1}
                  </td>
                  <td>
                    <div className="name-cell">
                      <div
                        className="avatar-circle"
                        style={{
                          background: idx === 0 && isTop ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : '#e2e8f0',
                          color: idx === 0 && isTop ? 'white' : 'var(--text-main)',
                        }}
                      >
                        {row.agentName[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{row.agentName}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: isTop ? '#16a34a' : '#dc2626' }}>
                    ${row.amount.toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
