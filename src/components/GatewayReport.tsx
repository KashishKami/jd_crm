'use client';

import React from 'react';
import { GatewayMonthlyReport } from '../types/gateway';

const MONTH_NAMES = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface GatewayReportProps {
  monthly: GatewayMonthlyReport[];
}

export default function GatewayReport({ monthly }: GatewayReportProps) {
  if (monthly.length === 0) {
    return (
      <div className="error-box" style={{ textAlign: 'center', padding: '40px', marginTop: '20px' }}>
        <p>No report data available for this gateway.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Month</th>
            <th style={{ textAlign: 'center' }}>Completed</th>
            <th style={{ textAlign: 'right' }}>Completed ($)</th>
            <th style={{ textAlign: 'center' }}>Refunds</th>
            <th style={{ textAlign: 'right' }}>Refunded ($)</th>
            <th style={{ textAlign: 'center' }}>Chargebacks</th>
            <th style={{ textAlign: 'right' }}>Chargebacked ($)</th>
            <th style={{ textAlign: 'right' }}>Net ($)</th>
          </tr>
        </thead>
        <tbody>
          {monthly.map((row) => {
            const isNegative = row.netAmount < 0;
            const monthLabel = `${MONTH_NAMES[row.month]} ${row.year}`;
            return (
              <tr key={`${row.year}-${row.month}`}>
                <td style={{ fontWeight: '600' }}>{monthLabel}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className="status-dot-badge status-active" style={{ padding: '2px 10px' }}>
                    {row.completedCount}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                  ${row.completedAmount.toFixed(2)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {row.refundCount > 0 ? (
                    <span
                      className="status-dot-badge"
                      style={{ padding: '2px 10px', backgroundColor: '#fef3c7', color: '#92400e' }}
                    >
                      {row.refundCount}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>0</span>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: row.refundAmount > 0 ? '#b45309' : '#94a3b8' }}>
                  ${row.refundAmount.toFixed(2)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {row.chargebackCount > 0 ? (
                    <span className="status-dot-badge status-inactive" style={{ padding: '2px 10px' }}>
                      {row.chargebackCount}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>0</span>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: row.chargebackAmount > 0 ? '#dc2626' : '#94a3b8' }}>
                  ${row.chargebackAmount.toFixed(2)}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '700' }}>
                  <span
                    className={isNegative ? 'negative' : 'positive'}
                    style={{ color: isNegative ? '#dc2626' : '#059669' }}
                  >
                    {isNegative ? '-' : ''}${Math.abs(row.netAmount).toFixed(2)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
