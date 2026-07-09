'use client';

import React from 'react';
import Link from 'next/link';
import { RecentOrderRow } from '../../types/dashboard';
import { formatDateDDMMYYYY } from '../../lib/date';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../../service/permission.service';

interface RecentOrdersTableProps {
  orders: RecentOrderRow[];
}

export function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string; bg?: string; color?: string }> = {
    '1': { label: 'Sold', className: 'status-active' },
    '2': { label: 'Refunded', className: 'status-inactive', bg: '#faf2f2', color: '#b25353' },
    '3': { label: 'Chargebacked', className: 'status-inactive', bg: '#f5e6e6', color: '#8a3d3d' },
    '4': { label: 'Partial Refund', className: 'status-active', bg: '#faf2eb', color: '#a47c5c' },
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
  const { data: session } = useSession();
  const permissions = session?.user?.userPermissions || '';
  const canView = hasPermission(permissions, 'orders:view');
  const canCreate = hasPermission(permissions, 'orders:create');

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
                <th style={{ textAlign: 'right' }}>Final Margin</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const chargedVal = parseFloat(order.orderAmountCharged || '0');
                const refundVal = parseFloat(order.orderRefundAmount || '0');
                const finalMargin = chargedVal - refundVal;
                const isDisabled = !canView && canCreate && Number(order.orderSalesAgentId) !== Number(session?.user?.id);

                return (
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
                      ${finalMargin.toLocaleString('en-US')}
                    </td>
                    <td style={{ textAlign: 'center' }}>{getStatusBadge(order.saleStatus)}</td>
                    <td style={{ textAlign: 'right' }} className="actions-cell">
                      <div className="action-buttons">
                        {isDisabled ? (
                          <span className="action-link-btn view" style={{ fontSize: '0.85rem', cursor: 'not-allowed', color: '#94a3b8' }}>
                            Details
                          </span>
                        ) : (
                          <Link href={`/orders/${order.crmOrderId}`} prefetch={false} className="action-link-btn view">
                            Details
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
