'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SearchResults as SearchResultsType } from '../types/search';

interface SearchResultsProps {
  results: SearchResultsType;
}

export default function SearchResults({ results }: SearchResultsProps) {
  const router = useRouter();

  const orders = results.orders || [];
  const hasOrders = orders.length > 0;

  if (!hasOrders) {
    return (
      <div className="card-with-accent py-12 text-center" style={{ border: '3px solid #f1f5f9', borderRadius: '16px' }}>
        <p className="text-slate-500 font-medium font-serif">No results found matching your query.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    if (status.includes('Completed') || status.includes('Delivered')) return 'status-active';
    if (status.includes('Cancelled') || status.includes('Refunded') || status.includes('Chargebacked')) return 'status-inactive';
    return 'bg-slate-50 text-slate-700 border border-slate-200/50';
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return '—';
    try {
      const date = new Date(dateInput);
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return '—';
    }
  };

  return (
    <div className="table-wrapper">
      <table className="custom-table table-responsive">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Vehicle & Part</th>
            <th>Pricing</th>
            <th>Workflow Status</th>
            <th>Order Date</th>
            <th className="actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const markupVal = parseFloat(order.orderMarkup || '0');
            const customerName = order.customer
              ? order.customer.customerName
              : 'Unknown Customer';
            const customerEmail = order.customer?.customerEmail || '—';
            const customerPhone = order.customer?.customerPhone || '—';

            return (
              <tr key={order.crmOrderId}>
                <td>
                  <span className="font-mono text-[11px] font-semibold text-slate-500">
                    #{order.crmOrderId}
                  </span>
                </td>
                <td>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      {customerName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {customerEmail}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {customerPhone}
                    </div>
                  </div>
                </td>
                <td>
                  <div>
                    <div className="text-xs font-medium text-slate-800">
                      {order.orderMakeModel || 'Unknown Vehicle'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold italic mt-0.5">
                      {order.orderPart || '—'}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col text-[10px] font-mono">
                    <span className="text-slate-500">Pitch: ${parseFloat(order.orderTotalPitched || '0').toFixed(2)}</span>
                    <span className="text-slate-400">Buy: ${parseFloat(order.orderVendorPrice || '0').toFixed(2)}</span>
                    <span className={`font-semibold mt-0.5 ${markupVal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Margin: ${markupVal.toFixed(2)}
                    </span>
                  </div>
                </td>
                <td>
                  {(() => {
                    const statusText = order.orderCurrentStatus || 'Unknown';
                    return (
                      <span className={`status-dot-badge font-semibold ${getStatusBadgeClass(statusText)}`} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                        {statusText}
                      </span>
                    );
                  })()}
                </td>
                <td className="text-[11px] text-slate-500 font-medium">
                  {formatDate(order.orderDate)}
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button
                      onClick={() => router.push(`/orders/${order.crmOrderId}`)}
                      className="action-link-btn view"
                      style={{ fontSize: '0.725rem', border: 'none', cursor: 'pointer' }}
                    >
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
