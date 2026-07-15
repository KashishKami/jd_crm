import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';
import { prisma } from '../../../lib/db';
import * as orderRepository from '../../../repository/order.repository';
import OrderCommentsSection from '../../../components/OrderCommentsSection';
import { formatDateDDMMYYYY } from '../../../lib/date';
import SaleStatusTimeline from '../../../components/SaleStatusTimeline';
import WorkflowStatusTimeline from '../../../components/WorkflowStatusTimeline';
import DeleteOrderButton from '../../../components/DeleteOrderButton';
import BackButton from '../../../components/BackButton';
import DetailPageMarker from '../../../components/DetailPageMarker';
import OrderViewLog from '../../../components/OrderViewLog';
import OrderAuditLog from '../../../components/OrderAuditLog';
import LedgerCardItem from '../../../components/LedgerCardItem';
import PartSpecsViewer from '../../../components/PartSpecsViewer';
import FinancialBreakdownCard from '../../../components/FinancialBreakdownCard';


export const metadata = {
  title: 'Order Details - JD CRM',
  description: 'View order specifications, customer ledger, and allocations',
};

// Mask helpers
function maskCardNumber(num: string | null | undefined): string {
  if (!num) return '—';
  const clean = num.replace(/\s+/g, '');
  if (clean.length < 4) return '****';
  return `**** **** **** ${clean.slice(-4)}`;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  if (phone.length < 4) return '***';
  return `***-***-${phone.slice(-4)}`;
}

function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  if (phone.includes('*')) return phone;
  const clean = phone.replace(/\D/g, '').slice(0, 10);
  if (clean.length === 0) return phone;
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return '—';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

const saleStatuses: Record<string, string> = {
  '1': 'Sold',
  '2': 'Refunded',
  '3': 'Chargebacked',
  '4': 'Partial Refund',
  '5': 'Void',
  '6': 'Cancelled',
};

const getWorkflowStatusColors = (status: string | null) => {
  if (!status) return { text: '#cbd5e1', border: '#475569' };
  const s = status.toLowerCase();
  if (s.includes('completed') || s.includes('everything') || s.includes('sold')) {
    return { text: '#34d399', border: '#059669' }; // Emerald/Green
  }
  if (s.includes('feedback')) {
    return { text: '#60a5fa', border: '#3b82f6' }; // Blue
  }
  if (s.includes('delivery') || s.includes('delievery')) {
    return { text: '#a5b4fc', border: '#6366f1' }; // Indigo
  }
  if (s.includes('booking')) {
    return { text: '#fcd34d', border: '#d97706' }; // Amber/Orange-yellow
  }
  if (s.includes('shipment') || s.includes('tracking')) {
    return { text: '#7dd3fc', border: '#0284c7' }; // Sky
  }
  if (s.includes('resolution') || s.includes('dispute') || s.includes('chargebacked') || s.includes('returned')) {
    return { text: '#f87171', border: '#dc2626' }; // Rose/Red
  }
  if (s.includes('refunded')) {
    return { text: '#fcd34d', border: '#d97706' }; // Amber/Orange-yellow
  }
  return { text: '#cbd5e1', border: '#475569' }; // Slate
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const permissions = session.user.userPermissions || '';
  const canView = hasPermission(permissions, 'orders:view');
  const canCreate = hasPermission(permissions, 'orders:create');

  if (!canView && !canCreate) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-red-50 text-red-700 border border-red-200 rounded-2xl">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm mt-2">You do not have the required permissions to view order details.</p>
      </div>
    );
  }

  const { id } = await params;
  const crmOrderId = Number(id);
  if (isNaN(crmOrderId)) {
    notFound();
  }

  const canViewSaleHistory = hasPermission(permissions, 'orders:view-sale-status-history');
  const canViewWorkflowHistory = hasPermission(permissions, 'orders:view-workflow-history');
  const canViewLog = hasPermission(permissions, 'orders:view-log');
  const canViewAuditLog = hasPermission(permissions, 'orders:view-audit-log');

  const [order, saleHistory, workflowHistory, rawViewLogs, rawAuditLogs] = await Promise.all([
    prisma.crmOrders.findUnique({
      where: { crmOrderId },
      include: {
        customer: {
          include: {
            cards: true,
          },
        },
        vendor: true,
        gateway: true,
        salesAgent: true,
        verifier: true,
        backendExecutive: true,
        partFoundBy: true,
        childOrders: {
          include: {
            vendor: true,
            gateway: true,
            backendExecutive: true,
            partFoundBy: true,
          }
        }
      },
    }),
    canViewSaleHistory ? prisma.crmSaleStatusHistory.findMany({
      where: { orderId: crmOrderId },
      orderBy: { changedAt: 'asc' },
    }) : Promise.resolve([]),
    canViewWorkflowHistory ? prisma.crmOrderCurrentStatusHistory.findMany({
      where: { orderId: crmOrderId },
      orderBy: { changedAt: 'asc' },
    }) : Promise.resolve([]),
    canViewLog ? orderRepository.getOrderViews(crmOrderId) : Promise.resolve([]),
    canViewAuditLog ? orderRepository.getAuditLogByOrderId(crmOrderId) : Promise.resolve([]),
  ]);

  if (!order) {
    notFound();
  }

  // If they don't have orders:view but have orders:create, they must be the sales agent of the order
  if (!canView && canCreate && Number(order.orderSalesAgentId) !== Number(session.user.id)) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-red-50 text-red-700 border border-red-200 rounded-2xl">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm mt-2">You do not have the required permissions to view order details.</p>
      </div>
    );
  }

  if (order.parentOrderId !== null) {
    redirect(`/orders/${order.parentOrderId}`);
  }

  // Fire-and-forget: log the view event in the database
  orderRepository.logOrderView(
    crmOrderId,
    Number(session.user.id),
    session.user.nickname || session.user.name || 'Agent'
  ).catch((err) => console.error('[OrderView] Failed to log page view:', err));

  // Check detail-level permissions
  const canViewPhone = hasPermission(permissions, 'customers:view-phone');
  const canViewEmail = hasPermission(permissions, 'customers:view-email');
  const canViewCards = hasPermission(permissions, 'customers:view-cards');

  if (order && order.customer) {
    if (!canViewPhone) {
      order.customer.customerPhone = maskPhone(order.customer.customerPhone);
      if (order.customer.customerAlternatePhone1) {
        order.customer.customerAlternatePhone1 = maskPhone(order.customer.customerAlternatePhone1);
      }
      if (order.customer.customerAlternatePhone2) {
        order.customer.customerAlternatePhone2 = maskPhone(order.customer.customerAlternatePhone2);
      }
    }
    if (!canViewEmail) {
      order.customer.customerEmail = maskEmail(order.customer.customerEmail);
    }
    if (!canViewCards && order.customer.cards) {
      order.customer.cards = order.customer.cards.map((c) => ({
        ...c,
        customerCardNumber: maskCardNumber(c.customerCardNumber),
        customerCardCvv: c.customerCardCvv ? '***' : null,
        customerCardCopyImage: null,
        customerPhotoIdImage: null,
      }));
    }
  }
  const canEdit = hasPermission(permissions, 'orders:edit');
  const canDelete = hasPermission(permissions, 'orders:delete');
  const canViewVendors = hasPermission(permissions, 'vendors:view');

  const viewLogs = JSON.parse(JSON.stringify(rawViewLogs));
  let auditLogs: any[] = JSON.parse(JSON.stringify(rawAuditLogs));
  
  if (auditLogs.length > 0) {
    const maskCardNumHelper = (num: string | null) => {
      if (!num) return null;
      const clean = num.replace(/\s+/g, '');
      const last4 = clean.slice(-4);
      return `**** **** **** ${last4}`;
    };
    auditLogs = auditLogs.map((log: any) => {
      if (log.fieldChanged === 'customerCardNumber' && !canViewCards) {
        return {
          ...log,
          oldValue: maskCardNumHelper(log.oldValue),
          newValue: maskCardNumHelper(log.newValue),
        };
      }
      return log;
    });
  }

  const customerPhoneDisplay = formatPhone(order.customer.customerPhone);
  const customerEmailDisplay = order.customer.customerEmail || '—';

  // Aggregate Financial Calculations
  const allParts = [order, ...(order.childOrders || [])];
  const sellingPrice = allParts.reduce((sum, p) => sum + (parseFloat(p.orderTotalPitched || '0')), 0);
  const buyingPrice = allParts.reduce((sum, p) => sum + (parseFloat(p.orderVendorPrice || '0')), 0);
  const chargedAmount = allParts.reduce((sum, p) => sum + (parseFloat(p.orderAmountCharged || '0')), 0);
  const refundAmount = allParts.reduce((sum, p) => sum + (parseFloat(p.orderRefundAmount || '0')), 0);

  const netMargin = sellingPrice - buyingPrice;
  const balanceDue = netMargin - chargedAmount;
  const finalMargin = chargedAmount - refundAmount;

  // Group vendor prices by vendor name for the vendor price dropdown
  const vendorMap: Record<string, { parts: string[]; total: number }> = {};
  allParts.forEach((p, idx) => {
    const vName = p.vendor?.vendorName || p.orderVendorName || 'Unassigned';
    const partDesc = p.orderPart || `Part ${idx + 1}`;
    const price = parseFloat(p.orderVendorPrice || '0');

    if (!vendorMap[vName]) {
      vendorMap[vName] = { parts: [], total: 0 };
    }
    vendorMap[vName].parts.push(partDesc);
    vendorMap[vName].total += price;
  });

  const vendorBreakdown = Object.entries(vendorMap).map(([vName, data]) => {
    return {
      vendorName: vName,
      parts: data.parts.join(' + '),
      total: data.total,
    };
  });

  // Group Part Found By for dropdown details
  const agentFoundMap: Record<string, string[]> = {};
  allParts.forEach((part, idx) => {
    const agentName = part.orderPartFoundByName || part.partFoundBy?.nickname || part.partFoundBy?.name || '—';
    const partName = part.orderPart || `Part #${idx + 1}`;
    if (!agentFoundMap[agentName]) {
      agentFoundMap[agentName] = [];
    }
    agentFoundMap[agentName].push(partName);
  });
  const agentFoundRows = Object.entries(agentFoundMap).map(([agentName, parts]) => ({
    agentName,
    partsFound: parts.join(', '),
  }));

  // Group Parts Supplier for dropdown details
  const supplierRows = allParts.map((part, idx) => {
    const vendor = part.vendor;
    const vendorName = part.vendor?.vendorName || part.orderVendorName || 'Unassigned';
    const partName = part.orderPart || `Part #${idx + 1}`;
    const feedback = part.orderVendorFeedback || 'Positive';
    return {
      vendor,
      vendorName,
      partName,
      feedback,
    };
  });

  return (
    <div className="agents-page-container">
      <DetailPageMarker />
      <style dangerouslySetInnerHTML={{ __html: `
        details summary::-webkit-details-marker {
          display: none !important;
        }
        details summary {
          list-style: none !important;
        }
        .info-label {
          text-transform: none !important;
        }
        .form-label {
          text-transform: none !important;
        }
        .agents-page-container,
        .agents-page-container * {
          font-family: Georgia, serif !important;
        }
        .details-arrow {
          display: inline-block;
          transition: transform 0.2s ease;
          font-weight: bold;
          font-size: 1.1rem;
          -webkit-text-stroke: 1.2px currentColor;
        }
        details[open] summary .details-arrow {
          transform: rotate(180deg);
        }
        details:not([open]) summary .details-arrow {
          transform: rotate(0deg);
        }
        .vendor-hover-container {
          position: relative;
          display: inline-block;
          color: #0284c7;
          border-bottom: 1px dotted #0284c7;
          cursor: pointer;
          transition: color 0.15s ease-in-out, border-color 0.15s ease-in-out;
        }
        .vendor-hover-container:hover {
          color: #0369a1;
          border-bottom-style: solid;
        }
        .vendor-hover-container:hover .vendor-popover {
          visibility: visible !important;
          opacity: 1 !important;
        }
      `}} />

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Order Details #{order.crmOrderId}</h1>
          </div>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Order placed on {order.orderDate ? formatDateDDMMYYYY(order.orderDate) : '—'} • Order entry on {formatDateDDMMYYYY(order.orderCreatedDate)}
          </p>
        </div>
        <div className="flex gap-3">
          <BackButton label="Back to Orders" />
          {canEdit && (
            <Link href={`/orders/${order.crmOrderId}/edit`} className="btn-primary-custom" style={{ textDecoration: 'none' }}>
              Edit Order
            </Link>
          )}
          {canDelete && (
            <DeleteOrderButton orderId={order.crmOrderId} />
          )}
        </div>
      </div>

      <div className="order-form-layout">
        {/* Main Details Section */}
        <div className="order-form-main flex flex-col gap-6">
          {/* Section 1: Customer Details */}
          <div className="profile-main" style={{ padding: '24px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
              Customer Information
            </h3>
            <div className="form-grid-3col form-compact" style={{ padding: '4px' }}>
              <div className="form-group form-span-3">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <span className="form-label">Customer Name</span>
                    <span className="info-value">{order.customer.customerName}</span>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Email Address</span>
                    <span className="info-value font-mono">{customerEmailDisplay}</span>
                  </div>
                </div>
              </div>
              
              <div className="form-group form-span-3">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <span className="form-label">Phone Number</span>
                    <span className="info-value font-mono">{customerPhoneDisplay}</span>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Alternate Number</span>
                    <span className="info-value font-mono">{formatPhone(order.customer.customerAlternatePhone1)}</span>
                  </div>
                </div>
              </div>
              <div className="form-group form-span-3">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <span className="form-label">Billing Address</span>
                    <span className="info-value" style={{ whiteSpace: 'pre-wrap' }}>{order.customer.customerBillingAddress || '—'}</span>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Shipping Address</span>
                    <span className="info-value" style={{ whiteSpace: 'pre-wrap' }}>{order.customer.customerShippingAddress || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Part specifications */}
          <PartSpecsViewer parentOrder={order} childOrders={order.childOrders || []} />

          {/* Section 3: Comments & Timeline */}
          <OrderCommentsSection orderId={order.crmOrderId} />

          {canViewLog && (
            <OrderViewLog entries={viewLogs} />
          )}

          {canViewAuditLog && (
            <OrderAuditLog entries={auditLogs} />
          )}
        </div>

        {/* Sidebar Info */}
        <div className="order-form-sidebar order-details-sidebar flex flex-col gap-6">
          {/* Card 1: Deal Status Summary */}
          <div style={{
            fontFamily: 'Georgia, serif',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1.5px solid #3b82f6',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.2)',
            width: '100%',
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: '0 0 16px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '10px',
              textTransform: 'capitalize'
            }}>
              Deal Status Summary
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#93c5fd', textTransform: 'capitalize' }}>Sale Status</span>
                <span className="status-dot-badge status-active" style={{ backgroundColor: '#1e293b', color: '#60a5fa', border: '1px solid #3b82f6', fontSize: '0.7rem' }}>
                  {saleStatuses[order.saleStatus || '1'] || 'Unassigned'}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#93c5fd', textTransform: 'capitalize' }}>Workflow Status</span>
                  {allParts.length === 1 && (
                    <span className="status-dot-badge status-active" style={{
                      backgroundColor: '#1e293b',
                      color: getWorkflowStatusColors(order.orderCurrentStatus || 'Pending Booking').text,
                      border: `1px solid ${getWorkflowStatusColors(order.orderCurrentStatus || 'Pending Booking').border}`,
                      fontSize: '0.7rem'
                    }}>
                      {order.orderCurrentStatus || 'Pending Booking'}
                    </span>
                  )}
                </div>
                
                {allParts.length > 1 && (
                  <div style={{
                    marginTop: '8px',
                    paddingLeft: '16px',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '0.75rem',
                  }}>
                    {allParts.map((part, idx) => {
                      const colors = getWorkflowStatusColors(part.orderCurrentStatus || 'Pending Booking');
                      return (
                        <div key={part.crmOrderId || idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#cbd5e1', alignItems: 'center' }}>
                          <span style={{ fontStyle: 'italic', wordBreak: 'break-word', minWidth: 0, flex: 1 }}>{part.orderPart || `Part #${idx + 1}`}:</span>
                          <span className="status-dot-badge status-active" style={{
                            backgroundColor: '#1e293b',
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            fontSize: '0.65rem',
                            padding: '2px 8px',
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}>
                            {part.orderCurrentStatus || 'Pending Booking'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Pricing Summary (Financial Breakdown) */}
          <FinancialBreakdownCard
            sellingPrice={sellingPrice}
            buyingPrice={buyingPrice}
            netMargin={netMargin}
            chargedAmount={chargedAmount}
            refundAmount={refundAmount}
            balanceDue={balanceDue}
            finalMargin={finalMargin}
            vendorBreakdown={vendorBreakdown}
          />

          {/* Card 3: Ledger Billing details */}
          <div className="profile-main" style={{ padding: '24px', backgroundColor: 'var(--bg-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="form-section-title" style={{ border: 'none', padding: 0, margin: 0 }}>
                Ledger Billing
              </h3>
              <span className={`status-dot-badge ${
                canViewCards ? 'status-active' : 'status-inactive'
              }`}>
                {canViewCards ? 'Decrypted' : 'Encrypted'}
              </span>
            </div>

            {order.customer.cards.length === 0 ? (
              <p className="text-xs text-slate-400">No payment card recorded for this customer.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.customer.cards.map((card, idx) => {
                  const sanitizedCard = {
                    ...card,
                    customerCardCopyImage: canViewCards ? card.customerCardCopyImage : null,
                    customerPhotoIdImage: canViewCards ? card.customerPhotoIdImage : null,
                  };
                  return (
                    <LedgerCardItem
                      key={card.cardId}
                      card={sanitizedCard}
                      idx={idx}
                      canViewCards={canViewCards}
                    />
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-4" style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px' }}>
              <div className="info-group">
                <span className="form-label" style={{ fontSize: '10px' }}>Checklist by Backend</span>
                <span className={`status-dot-badge ${order.orderChecklist === 'Yes' ? 'status-active' : 'status-inactive'}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                  {order.orderChecklist === 'Yes' ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="info-group">
                <span className="form-label" style={{ fontSize: '10px' }}>Liftgate Needed</span>
                <span className={`status-dot-badge ${order.orderLiftgateNeeded === 'Yes' ? 'status-active' : 'status-inactive'}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                  {order.orderLiftgateNeeded === 'Yes' ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Collapsible Staff allocations */}
          <details className="profile-main" style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', overflow: 'visible' }}>
            <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', listStyle: 'none' }}>
              <h3 className="form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                Staff Allocations
              </h3>
              <span className="details-arrow" style={{ color: 'var(--text-muted)' }}>︾</span>
            </summary>
            <div style={{ marginTop: '20px' }}>
              <div className="info-grid" style={{ gridTemplateColumns: '1fr', gap: '14px' }}>
                <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="form-label">Sales Representative</span>
                  <span className="info-value" style={{ fontWeight: '600' }}>{order.orderSalesAgentName || 'Unassigned'}</span>
                </div>
                <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="form-label">Sales Verifier</span>
                  <span className="info-value" style={{ fontWeight: '600' }}>{order.orderSalesVerifierName || 'Unassigned'}</span>
                </div>
                <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="form-label">Backend Executive</span>
                  <span className="info-value" style={{ fontWeight: '600' }}>{(() => {
                    const names = new Set<string>();
                    const pName = order.backendExecutive?.nickname || order.backendExecutive?.name || order.orderBackendExecutiveName;
                    if (pName) names.add(pName);
                    if (order.childOrders) {
                      for (const child of order.childOrders) {
                        const cName = child.backendExecutive?.nickname || child.backendExecutive?.name || child.orderBackendExecutiveName;
                        if (cName) names.add(cName);
                      }
                    }
                    return names.size > 0 ? Array.from(names).join(', ') : 'Unassigned';
                  })()}</span>
                </div>
                <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="form-label">Quality Verifier</span>
                  <span className="info-value" style={{ fontWeight: '600' }}>{order.orderVerifierName || 'Unassigned'}</span>
                </div>
                <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="form-label">Billing Gateway</span>
                  <span className="info-value" style={{ fontWeight: '600' }}>{order.gateway?.gatewayName || 'Unassigned'}</span>
                </div>
                <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span className="form-label">Sales Status</span>
                  <span className="info-value" style={{ fontWeight: '600' }}>
                    {saleStatuses[order.saleStatus || '1'] || 'Unassigned'}
                  </span>
                </div>

                {allParts.length === 1 ? (
                  // Single Part: normal static fields
                  <>
                    <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', alignItems: 'flex-start' }}>
                      <span className="form-label" style={{ flexShrink: 0, marginRight: '16px' }}>Part Found By</span>
                      <span className="info-value" style={{ fontWeight: '600' }}>{order.orderPartFoundByName || '—'}</span>
                    </div>
                    <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', alignItems: 'flex-start' }}>
                      <span className="form-label" style={{ flexShrink: 0, marginRight: '16px' }}>Parts Supplier</span>
                      <span className="info-value" style={{ fontWeight: '600', fontSize: '0.85rem', textAlign: 'right' }}>
                        {order.vendor ? (
                          <span className="vendor-hover-container">
                            {order.vendor.vendorName}
                            <span className="vendor-popover" style={{
                              visibility: 'hidden',
                              opacity: 0,
                              position: 'absolute',
                              bottom: '125%',
                              right: 0,
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '12px',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              zIndex: 9999,
                              width: '260px',
                              transition: 'opacity 0.2s, visibility 0.2s',
                              textAlign: 'left',
                              fontWeight: 'normal',
                              lineHeight: '1.4',
                              pointerEvents: 'auto',
                              textTransform: 'none',
                            }}>
                              <div style={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', color: '#0f172a' }}>
                                {order.vendor.vendorName}
                              </div>
                              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div><strong>Email:</strong> {order.vendor.vendorEmail || '—'}</div>
                                <div><strong>Phone:</strong> {order.vendor.vendorPhone || '—'}</div>
                                <div><strong>State:</strong> {order.vendor.vendorState || '—'}</div>
                              </div>
                              {canViewVendors && (
                                <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px', textAlign: 'right' }}>
                                  <Link href={`/vendors/${order.vendor.vendorId}`} style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>
                                    View Vendor Details →
                                  </Link>
                                </div>
                              )}
                            </span>
                          </span>
                        ) : (
                          order.orderVendorName || 'Unassigned'
                        )}
                      </span>
                    </div>
                    <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="form-label" style={{ flexShrink: 0, marginRight: '16px' }}>Vendor Feedback</span>
                      <span className="info-value" style={{ fontWeight: '600', color: order.orderVendorFeedback === 'Negative' ? '#ef4444' : '#10b981' }}>
                        {order.orderVendorFeedback || 'Positive'}
                      </span>
                    </div>
                  </>
                ) : (
                  // Multi Part: Dropdowns for Part Found By and Parts Supplier
                  <>
                    <div className="info-group" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <details className="custom-details" style={{ width: '100%' }}>
                        <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', listStyle: 'none' }}>
                          <span className="form-label">Part Found By</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Click to view details ▼</span>
                        </summary>
                        <div style={{ marginTop: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                          {agentFoundRows.map((row, idx) => (
                            <div key={idx} style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 2fr',
                              gap: '12px',
                              marginBottom: idx === agentFoundRows.length - 1 ? 0 : '10px',
                              borderBottom: idx === agentFoundRows.length - 1 ? 'none' : '1px solid #cbd5e1',
                              paddingBottom: idx === agentFoundRows.length - 1 ? 0 : '10px',
                              alignItems: 'center'
                            }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-main)', wordBreak: 'break-word' }}>{row.agentName}</span>
                              <span style={{ color: 'var(--text-muted)', wordBreak: 'break-word', textAlign: 'right' }}>{row.partsFound}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                    
                    <div className="info-group">
                      <details className="custom-details" style={{ width: '100%' }}>
                        <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', listStyle: 'none' }}>
                          <span className="form-label">Parts Supplier</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Click to view details ▼</span>
                        </summary>
                        <div style={{ marginTop: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.8fr 1.4fr', gap: '8px', borderBottom: '1.5px solid #cbd5e1', paddingBottom: '6px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                            <span>Vendor</span>
                            <span>Part</span>
                            <span>Feedback</span>
                          </div>
                          {supplierRows.map((row, idx) => (
                            <div key={idx} style={{
                              display: 'grid',
                              gridTemplateColumns: '1.8fr 1.8fr 1.4fr',
                              gap: '8px',
                              marginBottom: idx === supplierRows.length - 1 ? 0 : '10px',
                              borderBottom: idx === supplierRows.length - 1 ? 'none' : '1px solid #cbd5e1',
                              paddingBottom: idx === supplierRows.length - 1 ? 0 : '10px',
                              color: 'var(--text-main)',
                              alignItems: 'center',
                              wordBreak: 'break-word'
                            }}>
                              <span>
                                {row.vendor ? (
                                  <span className="vendor-hover-container">
                                    {row.vendor.vendorName}
                                    <span className="vendor-popover" style={{
                                      visibility: 'hidden',
                                      opacity: 0,
                                      position: 'absolute',
                                      bottom: '125%',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      backgroundColor: '#ffffff',
                                      color: '#334155',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '8px',
                                      padding: '12px',
                                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                      zIndex: 9999,
                                      width: '260px',
                                      transition: 'opacity 0.2s, visibility 0.2s',
                                      textAlign: 'left',
                                      fontWeight: 'normal',
                                      lineHeight: '1.4',
                                      pointerEvents: 'auto',
                                      textTransform: 'none',
                                    }}>
                                      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', color: '#0f172a' }}>
                                        {row.vendor.vendorName}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div><strong>Email:</strong> {row.vendor.vendorEmail || '—'}</div>
                                        <div><strong>Phone:</strong> {row.vendor.vendorPhone || '—'}</div>
                                        <div><strong>State:</strong> {row.vendor.vendorState || '—'}</div>
                                      </div>
                                      {canViewVendors && (
                                        <div style={{ marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '6px', textAlign: 'right' }}>
                                          <Link href={`/vendors/${row.vendor.vendorId}`} style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 'bold', textDecoration: 'none' }}>
                                            View Vendor Details →
                                          </Link>
                                        </div>
                                      )}
                                    </span>
                                  </span>
                                ) : (
                                  row.vendorName
                                )}
                              </span>
                              <span>{row.partName}</span>
                              <span style={{ color: row.feedback === 'Negative' ? '#ef4444' : '#10b981', fontWeight: '600', whiteSpace: 'nowrap' }}>{row.feedback}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  </>
                )}
              </div>
            </div>
          </details>

          {/* Card 5: Collapsible Sale Status History */}
          {canViewSaleHistory && (
            <details className="profile-main" style={{ padding: '24px', backgroundColor: 'var(--bg-primary)' }}>
              <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', listStyle: 'none' }}>
                <h3 className="form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                  Sale Status History
                </h3>
                <span className="details-arrow" style={{ color: 'var(--text-muted)' }}>︾</span>
              </summary>
              <div style={{ marginTop: '20px' }}>
                <SaleStatusTimeline history={saleHistory} />
              </div>
            </details>
          )}

          {/* Card 6: Collapsible Order Workflow History */}
          {canViewWorkflowHistory && (
            <details className="profile-main" style={{ padding: '24px', backgroundColor: 'var(--bg-primary)' }}>
              <summary style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', listStyle: 'none' }}>
                <h3 className="form-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                  Order Workflow History
                </h3>
                <span className="details-arrow" style={{ color: 'var(--text-muted)' }}>︾</span>
              </summary>
              <div style={{ marginTop: '20px' }}>
                <WorkflowStatusTimeline history={workflowHistory} partsList={allParts} />
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
