'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { hasPermission } from '../service/permission.service';
import { fadeInStagger } from '../lib/animations';
import { gsap } from 'gsap';
import { formatDateDDMMYYYY, getEstCalendarDaysDiff } from '../lib/date';
import OrderCommentsPopup from './OrderCommentsPopup';

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
    orderCurrentStatusUpdateDate?: string | Date | null;
    saleStatus?: string | null;
    orderLiftgateNeeded?: string | null;
    orderCurrency?: string | null;
    orderExchangeRate?: string | null;
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
      orderCurrentStatusUpdateDate?: string | Date | null;
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
  skipAnimation?: boolean;
}

export default function OrderList({ orders, hideWrapper, skipAnimation }: OrderListProps) {
  const { data: session } = useSession();
  const permissions = session?.user?.userPermissions || '';
  const canView = hasPermission(permissions, 'orders:view');
  const canCreate = hasPermission(permissions, 'orders:create');
  const canEdit = hasPermission(permissions, 'orders:edit');
  const canViewPhone = hasPermission(permissions, 'customers:view-phone');
  const [activeCommentsOrderId, setActiveCommentsOrderId] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(() => {
    if (skipAnimation) return true;
    if (typeof window !== 'undefined') {
      const comingFromDetailPath = sessionStorage.getItem('coming_from_detail');
      if (comingFromDetailPath === '/orders' || Boolean(comingFromDetailPath && comingFromDetailPath.startsWith('/orders'))) {
        return true;
      }
      const key = `scroll_position_${window.location.pathname}${window.location.search}`;
      const savedScroll = sessionStorage.getItem(key);
      if (savedScroll && parseInt(savedScroll, 10) > 0) {
        return true;
      }
    }
    return false;
  });


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

  const [sortBy, setSortBy] = useState<string | null>('orderDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getDaysInStatus = (order: any) => {
    const getSingleDays = (o: any, parentSaleDate?: string | Date | null) => {
      const status = o.orderCurrentStatus || '';
      const isTerminal = status === 'Completed Orders' || status === 'Returned Orders' || status === 'Cancelled Orders';
      if (isTerminal) return -1;
      // Pending Booking: days are measured from the actual sale date (orderDate),
      // not the entry/status-update timestamp, to handle late-entry orders correctly.
      if (status === 'Pending Booking') {
        const saleDate = parentSaleDate ?? o.orderDate ?? null;
        if (!saleDate) return -1;
        const raw = new Date(saleDate as string | Date);
        if (isNaN(raw.getTime())) return -1;
        // orderDate is a @db.Date (timezone-naive). Prisma returns it as midnight UTC,
        // which EST converts to the previous evening. Normalize to noon UTC so that
        // getEstCalendarDaysDiff sees the correct EST calendar day.
        const refDate = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate(), 12, 0, 0));
        return getEstCalendarDaysDiff(refDate);
      }
      if (!o.orderCurrentStatusUpdateDate) return -1;
      const updateDate = new Date(o.orderCurrentStatusUpdateDate);
      if (isNaN(updateDate.getTime())) return -1;
      return getEstCalendarDaysDiff(updateDate);
    };

    let maxDays = getSingleDays(order);
    if (order.childOrders) {
      for (const child of order.childOrders) {
        const childDays = getSingleDays(child, order.orderDate);
        if (childDays > maxDays) {
          maxDays = childDays;
        }
      }
    }
    return maxDays;
  };

  const getFinalMargin = (order: any) => {
    const allParts = [order, ...(order.childOrders || [])];
    const chargedAmount = allParts.reduce((sum, p) => sum + (parseFloat(p.orderAmountCharged || '0')), 0);
    const refundAmount = allParts.reduce((sum, p) => sum + (parseFloat(p.orderRefundAmount || '0')), 0);
    return chargedAmount - refundAmount;
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      if (field === 'orderDate' || field === 'pricing' || field === 'daysInStatus') {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
  };

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (!sortBy) return 0;
      
      let comparison = 0;
      switch (sortBy) {
        case 'crmOrderId': {
          comparison = a.crmOrderId - b.crmOrderId;
          break;
        }
        case 'orderDate': {
          const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
          const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
        }
        case 'customerName': {
          const nameA = (a.customer?.customerName || '').toLowerCase();
          const nameB = (b.customer?.customerName || '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'salesAgent': {
          const agentA = (a.salesAgent?.nickname || a.salesAgent?.name || '').toLowerCase();
          const agentB = (b.salesAgent?.nickname || b.salesAgent?.name || '').toLowerCase();
          comparison = agentA.localeCompare(agentB);
          break;
        }
        case 'saleStatus': {
          const labelA = getSaleStatusLabel(a.saleStatus).toLowerCase();
          const labelB = getSaleStatusLabel(b.saleStatus).toLowerCase();
          comparison = labelA.localeCompare(labelB);
          break;
        }
        case 'pricing': {
          comparison = getFinalMargin(a) - getFinalMargin(b);
          break;
        }
        case 'daysInStatus': {
          comparison = getDaysInStatus(a) - getDaysInStatus(b);
          break;
        }
        default:
          break;
      }
      
      if (comparison === 0) {
        return b.crmOrderId - a.crmOrderId;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [orders, sortBy, sortOrder]);

  const tableRowsRef = useRef<HTMLTableSectionElement>(null);
  const animCtxRef = useRef<gsap.Context | null>(null);

  // Stagger table rows entrance
  useEffect(() => {
    if (tableRowsRef.current && sortedOrders.length > 0 && !hasAnimated) {
      const rows = tableRowsRef.current.querySelectorAll('tr');
      animCtxRef.current = gsap.context(() => {
        fadeInStagger(rows, 0.05, () => {
          setHasAnimated(true);
        });
      });
    }
  }, [sortedOrders, hasAnimated]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animCtxRef.current) {
        animCtxRef.current.revert();
      }
    };
  }, []);

  const renderSortableHeader = (label: string, field: string) => {
    const isSorted = sortBy === field;
    return (
      <th 
        onClick={() => handleSort(field)} 
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>{label}</span>
          <span style={{ fontSize: '0.62rem', opacity: isSorted ? 1 : 0.4, color: isSorted ? '#0284c7' : '#94a3b8' }}>
            {isSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  const tableContent = (
    <div className="card-table-container" style={{ padding: 0 }}>
        <table className="custom-table table-responsive">
          <thead>
            <tr>
              {renderSortableHeader('Order ID', 'crmOrderId')}
              {renderSortableHeader('Order Date', 'orderDate')}
              {renderSortableHeader('Customer', 'customerName')}
              <th>Vehicle & Part</th>
              {renderSortableHeader('Agents', 'salesAgent')}
              {renderSortableHeader('Sale Status', 'saleStatus')}
              {renderSortableHeader('Pricing', 'pricing')}
              {renderSortableHeader('Workflow Status', 'daysInStatus')}
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody ref={tableRowsRef}>
            {sortedOrders.map((order) => {
              const chargedVal = parseFloat(order.orderAmountCharged || '0');
              const refundVal = parseFloat(order.orderRefundAmount || '0');
              const finalMargin = chargedVal - refundVal;
              const isDisabled = !canView && canCreate && Number(order.orderSalesAgentId) !== Number(session?.user?.id);
              const isDisabledEdit = isDisabled || !canEdit;
              return (
                <tr key={order.crmOrderId} style={{ opacity: hasAnimated ? 1 : 0 }}>
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
                      {isDisabled ? (
                        <span className="font-semibold text-slate-900" style={{ fontSize: 'inherit' }}>
                          {order.customer.customerName}
                        </span>
                      ) : (
                        <Link
                          href={`/orders/${order.crmOrderId}`}
                          prefetch={false}
                          onClick={() => {
                            const scrollKey = `scroll_position_${window.location.pathname}${window.location.search}`;
                            sessionStorage.setItem(scrollKey, String(window.scrollY));
                            sessionStorage.setItem('coming_from_detail', '/orders');
                          }}


                          className="font-semibold text-slate-900 hover:text-blue-600 hover:underline"
                          style={{ fontSize: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                        >
                          {order.customer.customerName}
                        </Link>
                      )}
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
                        </div>
                      </div>

                      {order.childOrders && order.childOrders.map((child, idx) => (
                        <div key={child.crmOrderId} style={{ borderTop: '1px solid #cbd5e1', paddingTop: '6px' }}>
                          <div className="font-medium text-slate-600" style={{ fontSize: '0.9em' }}>
                            {child.orderMakeModel || order.orderMakeModel || 'Unknown Vehicle'}
                          </div>
                          <div className="text-slate-500 font-semibold italic mt-0.5 font-sans" style={{ fontSize: '0.85em' }}>
                            {child.orderPart || '—'}
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
                          {order.orderCurrency === 'CAD' && (
                            <span className="text-amber-700 font-sans font-semibold text-xs mb-1">
                              CAD @ {order.orderExchangeRate || '0.74'}
                            </span>
                          )}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', width: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <span className={`status-dot-badge font-semibold ${getStatusBadgeClass(order.orderCurrentStatus)}`} style={{ fontSize: '0.85em', padding: '2px 8px' }}>
                          {order.orderCurrentStatus || 'Unknown'}
                        </span>
                        {(() => {
                          const status = order.orderCurrentStatus || '';
                          const isTerminal = status === 'Completed Orders' || status === 'Returned Orders' || status === 'Cancelled Orders';
                          if (isTerminal) return null;
                          // Pending Booking: count EST calendar days from the actual sale date
                          let refDate: Date | null = null;
                          if (status === 'Pending Booking') {
                            if (order.orderDate) {
                              const raw = new Date(order.orderDate as string | Date);
                              // Normalize @db.Date midnight UTC → noon UTC to prevent EST day rollback
                              if (!isNaN(raw.getTime())) {
                                refDate = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate(), 12, 0, 0));
                              }
                            }
                          } else if (order.orderCurrentStatusUpdateDate) {
                            refDate = new Date(order.orderCurrentStatusUpdateDate);
                          }
                          if (!refDate || isNaN(refDate.getTime())) return null;
                          const diffDays = getEstCalendarDaysDiff(refDate);
                          return (
                            <span style={{ fontSize: '0.7rem', color: '#1e293b', marginTop: '2px', fontWeight: 500, textAlign: 'center' }}>
                              (for {diffDays} day{diffDays === 1 ? '' : 's'})
                            </span>
                          );
                        })()}
                      </div>

                      {order.childOrders && order.childOrders.map((child, idx) => (
                        <div key={child.crmOrderId} style={{ borderTop: '1px solid #cbd5e1', paddingTop: '6px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <span className={`status-dot-badge font-semibold ${getStatusBadgeClass(child.orderCurrentStatus)}`} style={{ fontSize: '0.85em', padding: '2px 8px' }}>
                            {child.orderCurrentStatus || 'Unknown'}
                          </span>
                          {(() => {
                            const status = child.orderCurrentStatus || '';
                            const isTerminal = status === 'Completed Orders' || status === 'Returned Orders' || status === 'Cancelled Orders';
                            if (isTerminal) return null;
                            // Pending Booking child: use parent's sale date (child has no orderDate)
                            let refDate: Date | null = null;
                            if (status === 'Pending Booking') {
                              if (order.orderDate) {
                                const raw = new Date(order.orderDate as string | Date);
                                // Normalize @db.Date midnight UTC → noon UTC to prevent EST day rollback
                                if (!isNaN(raw.getTime())) {
                                  refDate = new Date(Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate(), 12, 0, 0));
                                }
                              }
                            } else if (child.orderCurrentStatusUpdateDate) {
                              refDate = new Date(child.orderCurrentStatusUpdateDate);
                            }
                            if (!refDate || isNaN(refDate.getTime())) return null;
                            const diffDays = getEstCalendarDaysDiff(refDate);
                            return (
                              <span style={{ fontSize: '0.7rem', color: '#1e293b', marginTop: '2px', fontWeight: 500, textAlign: 'center' }}>
                                (for {diffDays} day{diffDays === 1 ? '' : 's'})
                              </span>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="actions-cell">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => setActiveCommentsOrderId(order.crmOrderId)}
                        className="action-link-btn view"
                        title="View Comments"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px',
                          color: 'var(--accent-color)',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                      <div className="action-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', width: '100%' }}>
                        {isDisabled ? (
                          <span className="action-link-btn view" style={{ fontSize: '0.92em', cursor: 'not-allowed', color: '#94a3b8' }}>
                            Details
                          </span>
                        ) : (
                          <Link
                            href={`/orders/${order.crmOrderId}`}
                            prefetch={false}
                            onClick={() => {
                              const scrollKey = `scroll_position_${window.location.pathname}${window.location.search}`;
                              sessionStorage.setItem(scrollKey, String(window.scrollY));
                              sessionStorage.setItem('coming_from_detail', '/orders');
                            }}


                            className="action-link-btn view"
                            style={{ fontSize: '0.92em' }}
                          >
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
    return (
      <>
        {tableContent}
        {activeCommentsOrderId !== null && (
          <OrderCommentsPopup
            orderId={activeCommentsOrderId}
            onClose={() => setActiveCommentsOrderId(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className="table-wrapper card-with-accent">
        {tableContent}
      </div>
      {activeCommentsOrderId !== null && (
        <OrderCommentsPopup
          orderId={activeCommentsOrderId}
          onClose={() => setActiveCommentsOrderId(null)}
        />
      )}
    </>
  );
}
