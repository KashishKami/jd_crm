import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';
import { prisma } from '../../../lib/db';
import OrderCommentsSection from '../../../components/OrderCommentsSection';
import { formatDateDDMMYYYY } from '../../../lib/date';
import SaleStatusTimeline from '../../../components/SaleStatusTimeline';
import WorkflowStatusTimeline from '../../../components/WorkflowStatusTimeline';
import DeleteOrderButton from '../../../components/DeleteOrderButton';
import OrderViewLog from '../../../components/OrderViewLog';
import OrderAuditLog from '../../../components/OrderAuditLog';
import LedgerCardItem from '../../../components/LedgerCardItem';
import PartSpecsViewer from '../../../components/PartSpecsViewer';

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

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const permissions = session.user.userPermissions || '';
  if (!hasPermission(permissions, 'orders:view')) {
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

  const order = await prisma.crmOrders.findUnique({
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
      childOrders: {
        include: {
          vendor: true,
          gateway: true,
        }
      }
    },
  });

  if (!order) {
    notFound();
  }

  // Fire-and-forget: log the view event in the database
  const orderRepo = await import('../../../repository/order.repository');
  orderRepo.logOrderView(
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
  const canViewSaleHistory = hasPermission(permissions, 'orders:view-sale-status-history');
  const canViewWorkflowHistory = hasPermission(permissions, 'orders:view-workflow-history');

  const saleHistory = canViewSaleHistory ? await prisma.crmSaleStatusHistory.findMany({
    where: { orderId: crmOrderId },
    orderBy: { changedAt: 'asc' },
  }) : [];

  const workflowHistory = canViewWorkflowHistory ? await prisma.crmOrderCurrentStatusHistory.findMany({
    where: { orderId: crmOrderId },
    orderBy: { changedAt: 'asc' },
  }) : [];

  const canViewLog = hasPermission(permissions, 'orders:view-log');
  const canViewAuditLog = hasPermission(permissions, 'orders:view-audit-log');
  let viewLogs: any[] = [];
  if (canViewLog) {
    try {
      const { headers } = await import('next/headers');
      const reqHeaders = await headers();
      const cookie = reqHeaders.get('cookie') || '';
      
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const viewsRes = await fetch(`${baseUrl}/api/orders/${crmOrderId}/views`, {
        headers: {
          cookie,
        },
      });
      if (viewsRes.ok) {
        viewLogs = await viewsRes.json();
      } else {
        // Fallback directly to DB
        const orderRepository = await import('../../../repository/order.repository');
        viewLogs = JSON.parse(JSON.stringify(await orderRepository.getOrderViews(crmOrderId)));
      }
    } catch (e) {
      // Fallback directly to DB
      const orderRepository = await import('../../../repository/order.repository');
      viewLogs = JSON.parse(JSON.stringify(await orderRepository.getOrderViews(crmOrderId)));
    }
  }

  let auditLogs: any[] = [];
  if (canViewAuditLog) {
    try {
      const { headers } = await import('next/headers');
      const reqHeaders = await headers();
      const cookie = reqHeaders.get('cookie') || '';
      
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const auditRes = await fetch(`${baseUrl}/api/orders/${crmOrderId}/audit-log`, {
        headers: {
          cookie,
        },
      });
      if (auditRes.ok) {
        auditLogs = await auditRes.json();
      } else {
        const orderRepository = await import('../../../repository/order.repository');
        auditLogs = JSON.parse(JSON.stringify(await orderRepository.getAuditLogByOrderId(crmOrderId)));
      }
    } catch (e) {
      const orderRepository = await import('../../../repository/order.repository');
      auditLogs = JSON.parse(JSON.stringify(await orderRepository.getAuditLogByOrderId(crmOrderId)));
    }
  }
  
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

  const customerPhoneDisplay = order.customer.customerPhone || '—';
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

  return (
    <div className="agents-page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">Order Details #{order.crmOrderId}</h1>
            <span className="status-dot-badge status-active">
              {order.orderCurrentStatus}
            </span>
          </div>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Placed on {order.orderDate ? formatDateDDMMYYYY(order.orderDate) : '—'} • Created {formatDateDDMMYYYY(order.orderCreatedDate)}
          </p>
        </div>
        <div className="flex gap-3">
          {canEdit && (
            <Link href={`/orders/${order.crmOrderId}/edit`} className="btn-primary-custom" style={{ textDecoration: 'none' }}>
              Edit Order
            </Link>
          )}
          <DeleteOrderButton orderId={order.crmOrderId} />
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
            <div className="info-grid">
              <div className="info-group" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Customer Name</span>
                <span className="info-value">{order.customer.customerName}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Email Address</span>
                <span className="info-value font-mono">{customerEmailDisplay}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Phone Number</span>
                <span className="info-value font-mono">{customerPhoneDisplay}</span>
              </div>
              {order.customer.customerAlternatePhone1 && (
                <div className="info-group">
                  <span className="info-label">Alternate Phone 1</span>
                  <span className="info-value font-mono">
                    {order.customer.customerAlternatePhone1}
                  </span>
                </div>
              )}
              {order.customer.customerAlternatePhone2 && (
                <div className="info-group">
                  <span className="info-label">Alternate Phone 2</span>
                  <span className="info-value font-mono">
                    {order.customer.customerAlternatePhone2}
                  </span>
                </div>
              )}
              <div className="info-group" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Billing Address</span>
                <span className="info-value">{order.customer.customerBillingAddress || '—'}</span>
              </div>
              <div className="info-group" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Shipping Address</span>
                <span className="info-value">{order.customer.customerShippingAddress || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Part specifications (Using PartSpecsViewer client component) */}
          <PartSpecsViewer parentOrder={order} childOrders={order.childOrders || []} />

          {/* Section 3: Comments & Timeline */}
          <OrderCommentsSection orderId={order.crmOrderId} />

          {canViewSaleHistory && (
            <div className="profile-main" style={{ padding: '24px' }}>
              <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
                Sale Status History
              </h3>
              <SaleStatusTimeline history={saleHistory} />
            </div>
          )}

          {canViewWorkflowHistory && (
            <div className="profile-main" style={{ padding: '24px' }}>
              <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
                Order Workflow History
              </h3>
              <WorkflowStatusTimeline history={workflowHistory} />
            </div>
          )}

          {canViewLog && (
            <OrderViewLog entries={viewLogs} />
          )}

          {canViewAuditLog && (
            <OrderAuditLog entries={auditLogs} />
          )}
        </div>

        {/* Sidebar Info */}
        <div className="flex flex-col gap-6">
          {/* Card Billing details */}
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
                <span className="info-label" style={{ fontSize: '10px' }}>Checklist by backend</span>
                <span className={`status-dot-badge ${order.orderChecklist === 'Yes' ? 'status-active' : 'status-inactive'}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                  {order.orderChecklist === 'Yes' ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="info-group">
                <span className="info-label" style={{ fontSize: '10px' }}>Liftgate Needed</span>
                <span className={`status-dot-badge ${order.orderLiftgateNeeded === 'Yes' ? 'status-active' : 'status-inactive'}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                  {order.orderLiftgateNeeded === 'Yes' ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Summary (Aggregate Financial Breakdown Card in Premium Dark UI) */}
          <div style={{
            fontFamily: 'Georgia, serif',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
            width: '100%',
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#ffffff',
              margin: '0 0 20px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '16px'
            }}>
              Financial Breakdown
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Selling Price</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${sellingPrice.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Buying Price</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${buyingPrice.toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Net Margin</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${netMargin.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Charged Amount</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${chargedAmount.toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Balance Due</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>${balanceDue.toFixed(2)}</span>
              </div>

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Final Margin</span>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: finalMargin >= 0 ? '#10b981' : '#f87171'
                }}>
                  ${finalMargin.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Allocations info */}
          <div className="profile-main" style={{ padding: '24px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
              Staff Allocations
            </h3>
            <div className="info-grid" style={{ gridTemplateColumns: '1fr', gap: '14px' }}>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="info-label">Sales Representative</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{order.orderSalesAgentName || 'Unassigned'}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="info-label">Sales Verifier</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{order.orderSalesVerifierName || 'Unassigned'}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="info-label">Backend Executive</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{order.orderBackendExecutiveName || 'Unassigned'}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="info-label">Part Found By</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{order.orderPartFoundByName || '—'}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="info-label">Quality Verifier</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{order.orderVerifierName || 'Unassigned'}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="info-label">Billing Gateway</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{order.gateway?.gatewayName || 'Unassigned'}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="info-label">Parts Supplier</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{order.orderVendorName || 'Unassigned'}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                <span className="info-label">Sales Status</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{saleStatuses[order.saleStatus || '1']}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <span className="info-label">Vendor Feedback</span>
                <span className="info-value" style={{ fontWeight: '600', color: order.orderVendorFeedback === 'Negative' ? '#ef4444' : '#10b981' }}>{order.orderVendorFeedback || 'Positive'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
