'use client';

import React from 'react';
import { PerformerRow } from '../../types/dashboard';
import { hasPermission } from '../../service/permission.service';

interface PerformersTableProps {
  title: string;
  performers: PerformerRow[];
  isTop?: boolean;
  permissions: string;
  month: number;
  year: number;
}

export default function PerformersTable({
  title,
  performers,
  isTop = true,
  permissions,
  month,
  year,
}: PerformersTableProps) {
  const canLinkToOrders =
    hasPermission(permissions, 'orders:view') || hasPermission(permissions, 'orders:create');

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
                <th style={{ textAlign: 'center' }}>Sales Count</th>
                <th style={{ textAlign: 'right' }}>Total Sales</th>
                <th style={{ textAlign: 'right' }}>Leakage</th>
              </tr>
            </thead>
            <tbody>
              {performers.map((row, idx) => {
                const totalSales = row.totalSales ?? row.amount ?? 0;
                const salesCount = row.salesCount ?? 0;
                const leakage = row.leakage ?? 0;

                const agentUrl = `/orders?agentId=${row.agentId}&month=${month}&year=${year}`;
                const salesUrl = `/orders?agentId=${row.agentId}&saleStatus=1,2,3,4&month=${month}&year=${year}`;
                const totalSalesUrl = `/orders?agentId=${row.agentId}&saleStatus=1,4&month=${month}&year=${year}`;
                const leakageUrl = `/orders?agentId=${row.agentId}&saleStatus=2,3&month=${month}&year=${year}`;
 
                return (
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
                        <span style={{ fontWeight: 500 }}>
                          {canLinkToOrders ? (
                            <a href={agentUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
                              {row.agentName}
                            </a>
                          ) : (
                            row.agentName
                          )}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {canLinkToOrders ? (
                        <a href={salesUrl} style={{ textDecoration: 'none', color: '#16a34a' }}>
                          {salesCount}
                        </a>
                      ) : (
                        <span style={{ color: '#16a34a' }}>{salesCount}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {canLinkToOrders ? (
                        <a href={totalSalesUrl} style={{ textDecoration: 'none', color: isTop ? '#16a34a' : '#dc2626' }}>
                          ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </a>
                      ) : (
                        <span style={{ color: isTop ? '#16a34a' : '#dc2626' }}>
                          ${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {canLinkToOrders ? (
                        <a href={leakageUrl} style={{ textDecoration: 'none', color: '#dc2626' }}>
                          ${leakage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </a>
                      ) : (
                        <span style={{ color: '#dc2626' }}>
                          ${leakage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
