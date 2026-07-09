'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../service/permission.service';
import { staggerEntrance } from '../lib/animations';
import { gsap } from 'gsap';
import { formatDateDDMMYYYY } from '../lib/date';

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  if (phone.length < 4) return '***';
  return `***-***-${phone.slice(-4)}`;
}

interface OrderListProps {
  orders: Array<{
    crmOrderId: number;
    orderDate: string | Date | null;
    orderMakeModel: string | null;
    orderPart: string | null;
    orderTotalPitched: string | null;
    orderVendorPrice: string | null;
    orderAmountCharged: string | null;
    orderRefundAmount?: string | null;
    orderCurrentStatus: string | null;
    saleStatus?: string | null;
    orderLiftgateNeeded?: string | null;
    customer: {
      customerName: string;
      customerEmail?: string;
      customerPhone?: string | null;
    };
    orderSalesAgentId?: number | null;
    salesAgent?: {
      name: string;
      nickname?: string | null;
      team?: {
        teamId: number;
        teamName: string;
      } | null;
    } | null;
    salesVerifier?: {
      name: string;
      nickname?: string | null;
    } | null;
    backendExecutive?: {
      name: string;
      nickname?: string | null;
    } | null;
    verifier?: {
      name: string;
      nickname?: string | null;
    } | null;
    partFoundBy?: {
      name: string;
      nickname?: string | null;
    } | null;
    orderSalesVerifierName?: string | null;
    orderBackendExecutiveName?: string | null;
    orderVerifierName?: string | null;
    orderPartFoundByName?: string | null;
    childOrders?: Array<{
      crmOrderId: number;
      orderMakeModel: string | null;
      orderPart: string | null;
      orderCurrentStatus: string | null;
      saleStatus?: string | null;
      orderVendorPrice?: string | null;
      orderBackendExecutiveName?: string | null;
      backendExecutive?: {
        name: string;
        nickname?: string | null;
      } | null;
      orderPartFoundByName?: string | null;
      partFoundBy?: {
        name: string;
        nickname?: string | null;
      } | null;
    }>;
  }>;
  hideWrapper?: boolean;
}

export default function OrderList({ orders, hideWrapper }: OrderListProps) {
  const { data: session } = useSession();
  const permissions = session?.user?.userPermissions || '';
  const canView = hasPermission(permissions, 'orders:view');
  const canCreate = hasPermission(permissions, 'orders:create');
  const canEdit = hasPermission(permissions, 'orders:edit');
  const canViewPhone = hasPermission(permissions, 'customers:view-phone');

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
    if (s.includes('resolution') || s.includes('dispute') || s.includes('chargebacked') || s.includes('returned')) {
      return 'bg-rose-50 text-rose-700 border border-rose-200/50';
    }
    if (s.includes('refunded')) {
      return 'bg-amber-50 text-amber-700 border border-amber-200/50';
    }
    return 'bg-slate-50 text-slate-700 border border-slate-200/50';
  };

  const getSaleStatusLabel = (status: string | null | undefined): string => {
    switch (status) {
      case '1': return 'Sold';
      case '2': return 'Refunded';
      case '3': return 'Chargebacked';
      case '4': return 'Partial Refund';
      case '5': return 'Void';
      case '6': return 'Cancelled';
      default:  return '—';
    }
  };

  const getSaleStatusBadgeClass = (status: string | null | undefined): string => {
    switch (status) {
      case '1': return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
      case '2': return 'bg-amber-50 text-amber-700 border border-amber-200/50';
      case '3': return 'bg-rose-50 text-rose-700 border border-rose-200/50';
      case '4': return 'bg-blue-50 text-blue-700 border border-blue-200/50';
      case '5': return 'bg-purple-50 text-purple-700 border border-purple-200/50';
      case '6': return 'bg-slate-50 text-slate-600 border border-slate-200/50';
      default:  return 'bg-slate-50 text-slate-400';
    }
  };

  const tableContent = (
    <div className="card-table-container" style={{ padding: 0 }}>
        <table className="custom-table table-responsive">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Order Date</th>
              <th>Customer</th>
              <th>Vehicle & Part</th>
              <th>Agents</th>
              <th>Sale Status</th>
              <th>Pricing</th>
              <th>Workflow Status</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody ref={tableRowsRef}>
            {orders.map((order) => {
              const chargedVal = parseFloat(order.orderAmountCharged || '0');
              const refundVal = parseFloat(order.orderRefundAmount || '0');
              const finalMargin = chargedVal - refundVal;
              const isDisabled = !canView && canCreate && Number(order.orderSalesAgentId) !== Number(session?.user?.id);
              const isDisabledEdit = isDisabled || !canEdit;
              return (
                <tr key={order.crmOrderId} style={{ opacity: 0 }}>
                  <td>
                    <span className="font-mono font-semibold text-slate-500" style={{ fontSize: '0.95em' }}>
                      #{order.crmOrderId}
                    </span>
                  </td>
                  <td className="text-slate-500 font-normal" style={{ fontSize: '0.82em' }}>
                    {formatDate(order.orderDate)}
                  </td>
                  <td>
                    <div>
                      <div className="font-semibold text-slate-900" style={{ fontSize: 'inherit' }}>
                        {order.customer.customerName}
                      </div>
                      <div className="text-slate-400 font-mono" style={{ fontSize: '0.9em' }}>
                        {canViewPhone ? order.customer.customerPhone || '—' : maskPhone(order.customer.customerPhone)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <div className="font-medium text-slate-800" style={{ fontSize: 'inherit' }}>
                          {order.orderMakeModel || 'Unknown Vehicle'}
                        </div>
                        <div className="text-slate-500 font-semibold italic mt-0.5 font-sans" style={{ fontSize: '0.9em' }}>
                          {order.orderPart || '—'}
                          {order.childOrders && order.childOrders.length > 0 && (
                            <span className="text-slate-400 font-normal not-italic font-mono ml-1.5">(#1)</span>
                          )}
                        </div>
                      </div>

                      {order.childOrders && order.childOrders.map((child, idx) => (
                        <div key={child.crmOrderId} style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                          <div className="font-medium text-slate-600" style={{ fontSize: '0.9em' }}>
                            {child.orderMakeModel || order.orderMakeModel || 'Unknown Vehicle'}
                          </div>
                          <div className="text-slate-500 font-semibold italic mt-0.5 font-sans" style={{ fontSize: '0.85em' }}>
                            {child.orderPart || '—'}
                            <span className="text-slate-400 font-normal not-italic font-mono ml-1.5">(#{idx + 2})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                   <td>
                    <div className="flex flex-col gap-0.5 text-slate-600" style={{ fontSize: '0.88em', minWidth: '170px', lineHeight: '1.4' }}>
                      <div>
                        <span className="font-semibold text-slate-800">Sales Agent: </span>
                        <span>{order.salesAgent?.nickname || order.salesAgent?.name || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Sales Verifier: </span>
                        <span>{order.salesVerifier?.nickname || order.salesVerifier?.name || order.orderSalesVerifierName || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Backend Executive: </span>
                        <span>{order.backendExecutive?.nickname || order.backendExecutive?.name || order.orderBackendExecutiveName || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">QA Verifier: </span>
                        <span>{order.verifier?.nickname || order.verifier?.name || order.orderVerifierName || 'Unassigned'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Part Found By: </span>
                        <span>{(() => {
                          const names = new Set<string>();
                          const pName = order.partFoundBy?.nickname || order.partFoundBy?.name || order.orderPartFoundByName;
                          if (pName) names.add(pName);
                          if (order.childOrders) {
                            for (const child of order.childOrders) {
                              const cName = child.partFoundBy?.nickname || child.partFoundBy?.name || child.orderPartFoundByName;
                              if (cName) names.add(cName);
                            }
                          }
                          return names.size > 0 ? Array.from(names).join(', ') : 'Unassigned';
                        })()}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-dot-badge font-semibold ${getSaleStatusBadgeClass(order.saleStatus)}`}
                      style={{ fontSize: '0.85em', padding: '2px 8px' }}
                    >
                      {getSaleStatusLabel(order.saleStatus)}
                    </span>
                  </td>
                  <td>
                    {(() => {
                      const pitchNum = parseFloat(order.orderTotalPitched || '0');
                      const buyNum = (parseFloat(order.orderVendorPrice || '0')) +
                        (order.childOrders ? order.childOrders.reduce((sum: number, child: any) => sum + (parseFloat(child.orderVendorPrice || '0')), 0) : 0);
                      const chargedNum = parseFloat(order.orderAmountCharged || '0');
                      const refundNum = parseFloat(order.orderRefundAmount || '0');
                      
                      const netMargin = pitchNum - buyNum;
                      const showRemaining = netMargin > chargedNum && refundNum !== chargedNum;
                      const remaining = netMargin - chargedNum;

                      const pitch = pitchNum.toFixed(2);
                      const buy = buyNum.toFixed(2);
                      const charged = chargedNum.toFixed(2);
                      const refund = refundNum.toFixed(2);
                      
                      const isCompleted = order.orderCurrentStatus === 'Completed Orders';
                      const isReturned = order.orderCurrentStatus === 'Returned Orders';
                      
                      let showRefund = false;
                      let showFinalMargin = true;
                      
                      if (isCompleted) {
                        if (order.saleStatus === '4') {
                          showRefund = true;
                          showFinalMargin = true;
                        } else {
                          showRefund = false;
                          showFinalMargin = true;
                        }
                      } else if (isReturned) {
                        showRefund = true;
                        showFinalMargin = false;
                      } else {
                        showRefund = false;
                        showFinalMargin = true;
                      }
                      
                      return (
                        <div className="flex flex-col font-mono" style={{ fontSize: '0.92em' }}>
                          <span className="text-slate-500">Pitch: ${pitch}</span>
                          <span className="text-slate-400">Buy: ${buy}</span>
                          <span className="text-slate-500">Charged: ${charged}</span>
                          {showRemaining && (
                            <span className="text-amber-600">Balance due: ${remaining.toFixed(2)}</span>
                          )}
                          {showRefund && (
                            <span className="text-rose-600">Refund: ${refund}</span>
                          )}
                          {showFinalMargin && (
                            <span className={`font-semibold mt-0.5 ${finalMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              Final Margin: ${finalMargin.toFixed(2)}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {order.childOrders && order.childOrders.length > 0 && (
                          <span className="text-slate-400 font-semibold font-mono" style={{ fontSize: '0.75rem' }}>#1:</span>
                        )}
                        <span className={`status-dot-badge font-semibold ${getStatusBadgeClass(order.orderCurrentStatus)}`} style={{ fontSize: '0.85em', padding: '2px 8px' }}>
                          {order.orderCurrentStatus || 'Unknown'}
                        </span>
                      </div>

                      {order.childOrders && order.childOrders.map((child, idx) => (
                        <div key={child.crmOrderId} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="text-slate-400 font-semibold font-mono" style={{ fontSize: '0.75rem' }}>#{idx + 2}:</span>
                          <span className={`status-dot-badge font-semibold ${getStatusBadgeClass(child.orderCurrentStatus)}`} style={{ fontSize: '0.85em', padding: '2px 8px' }}>
                            {child.orderCurrentStatus || 'Unknown'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      {isDisabled ? (
                        <span className="action-link-btn view" style={{ fontSize: '0.92em', cursor: 'not-allowed', color: '#94a3b8' }}>
                          Details
                        </span>
                      ) : (
                        <Link href={`/orders/${order.crmOrderId}`} prefetch={false} className="action-link-btn view" style={{ fontSize: '0.92em' }}>
                          Details
                        </Link>
                      )}
                      {isDisabledEdit ? (
                        <span className="action-link-btn edit" style={{ fontSize: '0.92em', cursor: 'not-allowed', color: '#94a3b8' }}>
                          Edit
                        </span>
                      ) : (
                        <Link href={`/orders/${order.crmOrderId}/edit`} prefetch={false} className="action-link-btn edit" style={{ fontSize: '0.92em' }}>
                          Edit
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
  );

  if (hideWrapper) {
    return tableContent;
  }

  return (
    <div className="table-wrapper card-with-accent">
      {tableContent}
    </div>
  );
}
