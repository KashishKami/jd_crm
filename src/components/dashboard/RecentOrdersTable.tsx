'use client';

import React from 'react';
import Link from 'next/link';
import OrderList from '../OrderList';

interface RecentOrdersTableProps {
  orders: any[];
}

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  // Normalize the orders data to be compatible with both the legacy flat structure
  // (used in tests) and the new full nested structure returned by the database.
  const normalizedOrders = orders.map((o) => {
    if (o.customer && typeof o.customer === 'object') {
      return o;
    }
    return {
      ...o,
      customer: {
        customerName: o.customerName || 'Unknown Customer',
        customerPhone: o.customerPhone || null,
        customerEmail: o.customerEmail || null,
      },
      salesAgent: o.salesAgent || {
        name: o.salesAgentName || 'Unknown Agent',
        nickname: o.salesAgentName || 'Unknown Agent',
      },
      // Fallbacks for other expected fields in OrderList
      orderDate: o.orderDate || null,
      orderMakeModel: o.orderMakeModel || null,
      orderPart: o.orderPart || null,
      orderTotalPitched: o.orderTotalPitched || null,
      orderVendorPrice: o.orderVendorPrice || null,
      orderAmountCharged: o.orderAmountCharged || null,
      orderRefundAmount: o.orderRefundAmount || null,
      orderCurrentStatus: o.orderCurrentStatus || 'Unknown',
      orderCurrentStatusUpdateDate: o.orderCurrentStatusUpdateDate || null,
      saleStatus: o.saleStatus || null,
    };
  });

  return (
    <div className="table-wrapper card-with-accent" style={{ width: '100%' }}>
      {normalizedOrders.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No recent orders found.
        </div>
      ) : (
        <OrderList orders={normalizedOrders} hideWrapper />
      )}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <Link href="/orders" className="action-link-btn view" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          View All Orders &rarr;
        </Link>
      </div>
    </div>
  );
}
