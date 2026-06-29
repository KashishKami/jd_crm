'use client';

import React from 'react';
import Link from 'next/link';
import { RecentOrderRow } from '../../types/dashboard';
import { formatDateDDMMYYYY } from '../../lib/date';

interface RecentOrdersTableProps {
  orders: RecentOrderRow[];
}

export function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string; bg?: string; color?: string }> = {
    '1': { label: 'Sold', className: 'status-active' },
    '2': { label: 'Prospect', className: '', bg: '#f1f5f9', color: '#475569' },
    '3': { label: 'Call Back', className: '', bg: '#faf5eb', color: '#a47c5c' },
    '4': { label: 'Not Interested', className: 'status-inactive' },
    '5': { label: 'Out Of Scope', className: 'status-inactive' },
    '6': { label: 'Enquiry', className: '', bg: '#f0f5fa', color: '#5f758d' },
    '7': { label: 'Refunded', className: 'status-inactive', bg: '#faf2f2', color: '#b25353' },
    '8': { label: 'Chargebacked', className: 'status-inactive', bg: '#f5e6e6', color: '#8a3d3d' },
  };

  const current = map[status] || { label: status, className: '', bg: '#f1f5f9', color: '#475569' };
  return (
    <span
      className={`status-dot-badge ${current.className}`}
      style={
        current.bg
          ? { backgroundColor: current.bg, color: current.color, border: 'none' }
          : undefined
      }
    >
      {current.label}
    </span>
  );
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  return (
    <div className="table-wrapper card-with-accent" style={{ width: '100%' }}>
      {orders.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No recent orders found.
        </div>
      ) : (
        <div className="card-table-container">
          <table className="custom-table table-responsive" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Sales Agent</th>
                <th style={{ textAlign: 'right' }}>Markup</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.crmOrderId}>
                  <td style={{ fontWeight: 600 }}>#{order.crmOrderId}</td>
                  <td style={{ fontSize: '0.82em' }}>{formatDateDDMMYYYY(order.orderDate)}</td>
                  <td>{order.customerName}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="avatar-circle">
                        {order.salesAgentName[0]?.toUpperCase()}
                      </div>
                      <span>{order.salesAgentName}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${parseFloat(order.orderMarkup || '0').toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>{getStatusBadge(order.saleStatus)}</td>
                  <td style={{ textAlign: 'right' }} className="actions-cell">
                    <div className="action-buttons">
                      <Link href={`/orders/${order.crmOrderId}`} className="action-link-btn view">
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <Link href="/orders" className="action-link-btn view" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          View All Orders &rarr;
        </Link>
      </div>
    </div>
  );
}
