'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { staggerEntrance } from '../lib/animations';
import { gsap } from 'gsap';
import { formatDateDDMMYYYY } from '../lib/date';

interface OrderListProps {
  orders: Array<{
    crmOrderId: number;
    orderDate: string | Date | null;
    orderYear: string | null;
    orderMakeModel: string | null;
    orderPart: string | null;
    orderTotalPitched: string | null;
    orderVendorPrice: string | null;
    orderMarkup: string | null;
    orderCurrentStatus: string | null;
    customer: {
      firstName: string;
      lastName: string;
      customerEmail: string;
    };
    salesAgent?: {
      name: string;
      nickname?: string | null;
      team?: {
        teamId: number;
        teamName: string;
      } | null;
    } | null;
  }>;
}

export default function OrderList({ orders }: OrderListProps) {
  const tableRowsRef = useRef<HTMLTableSectionElement>(null);

  // Stagger table rows entrance
  useEffect(() => {
    if (tableRowsRef.current && orders.length > 0) {
      const rows = tableRowsRef.current.querySelectorAll('tr');
      const ctx = gsap.context(() => {
        staggerEntrance(rows);
      });
      return () => ctx.revert();
    }
  }, [orders]);

  // Format date helper
  const formatDate = (dateVal: string | Date | null) => {
    return formatDateDDMMYYYY(dateVal);
  };

  // Status badge styling helper
  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('everything') || s.includes('sold')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
    }
    if (s.includes('feedback')) {
      return 'bg-blue-50 text-blue-700 border border-blue-200/50';
    }
    if (s.includes('delivery') || s.includes('delievery')) {
      return 'bg-indigo-50 text-indigo-700 border border-indigo-200/50';
    }
    if (s.includes('booking')) {
      return 'bg-amber-50 text-amber-700 border border-amber-200/50';
    }
    if (s.includes('shipment') || s.includes('tracking')) {
      return 'bg-sky-50 text-sky-700 border border-sky-200/50';
    }
    if (s.includes('resolution') || s.includes('dispute') || s.includes('chargebacked')) {
      return 'bg-rose-50 text-rose-700 border border-rose-200/50';
    }
    if (s.includes('refunded')) {
      return 'bg-amber-50 text-amber-700 border border-amber-200/50';
    }
    return 'bg-slate-50 text-slate-700 border border-slate-200/50';
  };

  return (
    <div className="table-wrapper card-with-accent">
      <div className="card-table-container" style={{ padding: 0 }}>
        <table className="custom-table table-responsive">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Vehicle & Part</th>
              <th>Agent</th>
              <th>Team</th>
              <th>Pricing</th>
              <th>Workflow Status</th>
              <th>Order Date</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody ref={tableRowsRef}>
            {orders.map((order) => {
              const markupVal = parseFloat(order.orderMarkup || '0');
              return (
                <tr key={order.crmOrderId} style={{ opacity: 0 }}>
                  <td>
                    <span className="font-mono font-semibold text-slate-500" style={{ fontSize: '0.95em' }}>
                      #{order.crmOrderId}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div className="font-semibold text-slate-900" style={{ fontSize: 'inherit' }}>
                        {order.customer.firstName} {order.customer.lastName}
                      </div>
                      <div className="text-slate-400 font-mono" style={{ fontSize: '0.9em' }}>
                        {order.customer.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="font-medium text-slate-800" style={{ fontSize: 'inherit' }}>
                        {order.orderYear ? `${order.orderYear} ` : ''}
                        {order.orderMakeModel || 'Unknown Vehicle'}
                      </div>
                      <div className="text-slate-500 font-semibold italic mt-0.5 font-sans" style={{ fontSize: '0.9em' }}>
                        {order.orderPart || '—'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-team bg-slate-100 text-slate-700 font-medium" style={{ fontSize: '0.92em', padding: '2px 6px' }}>
                      {order.salesAgent?.nickname || order.salesAgent?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td>
                    <span className="badge-team font-medium" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontSize: '0.92em', padding: '2px 6px' }}>
                      {order.salesAgent?.team?.teamName || '—'}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col font-mono" style={{ fontSize: '0.92em' }}>
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
                        <span className={`status-dot-badge font-semibold ${getStatusBadgeClass(statusText)}`} style={{ fontSize: '0.92em', padding: '2px 8px' }}>
                          {statusText}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="text-slate-500 font-normal" style={{ fontSize: '0.82em' }}>
                    {formatDate(order.orderDate)}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Link href={`/orders/${order.crmOrderId}`} className="action-link-btn view" style={{ fontSize: '0.92em' }}>
                        Details
                      </Link>
                      <Link href={`/orders/${order.crmOrderId}/edit`} className="action-link-btn edit" style={{ fontSize: '0.92em' }}>
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
