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

  const customerPhoneDisplay = canViewPhone ? order.customer.customerPhone : maskPhone(order.customer.customerPhone);
  const customerEmailDisplay = canViewEmail ? order.customer.customerEmail : maskEmail(order.customer.customerEmail);

  // Status labels
  const saleStatuses: Record<string, string> = {
    '1': 'Sold',
    '2': 'Refunded',
    '3': 'Chargebacked',
  };

  const currentStatusDisplay = order.orderCurrentStatus || 'Pending Booking';

  return (
    <div className="agents-page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3">
            <span className="username-code">
              ORDER #{order.crmOrderId}
            </span>
            <span className={`status-dot-badge ${
              currentStatusDisplay.includes('Completed') ? 'status-active' : 'status-inactive'
            }`} style={{ marginTop: 0 }}>
              {currentStatusDisplay}
            </span>
          </div>
          <h1 className="page-title mt-2">
            {order.customer.customerName}
          </h1>
          <p className="page-subtitle flex gap-4 text-xs mt-1 text-slate-500">
            <span><strong>Sale Date:</strong> {order.orderDate ? formatDateDDMMYYYY(order.orderDate) : '—'}</span>
            <span>|</span>
            <span><strong>Registered on:</strong> {formatDateDDMMYYYY(order.orderCreatedDate)}</span>
          </p>
        </div>

        <div className="action-buttons">
          <Link href="/orders" className="btn-secondary-custom">
            Back to Pipeline
          </Link>
          {canEdit && (
            <Link href={`/orders/${order.crmOrderId}/edit`} className="btn-primary-custom">
              Edit Order
            </Link>
          )}
          {hasPermission(permissions, 'orders:delete') && (
            <DeleteOrderButton orderId={order.crmOrderId} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Columns */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Section 1: Customer Contact info */}
          <div className="profile-main" style={{ padding: '24px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
              Customer Details
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

          {/* Section 2: Vehicle / Part Specifications */}
          <div className="profile-main" style={{ padding: '24px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
              Vehicle & Part Specifications
            </h3>
            <div className="info-grid">
              <div className="info-group" style={{ gridColumn: 'span 3' }}>
                <span className="info-label">Year, Make & Model</span>
                <span className="info-value">{order.orderMakeModel || '—'}</span>
              </div>
              <div className="info-group" style={{ gridColumn: 'span 2' }}>
                <span className="info-label">Part Requested</span>
                <span className="info-value font-bold text-slate-900">{order.orderPart || '—'}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Dimensions / Specs</span>
                <span className="info-value">{order.orderPartSize || '—'}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Quoted Miles</span>
                <span className="info-value font-mono">{order.orderQuotedMiles || '—'}</span>
              </div>
              <div className="info-group">
                <span className="info-label">Vendor Miles</span>
                <span className="info-value font-mono">{order.orderGivenMiles || '—'}</span>
              </div>
              <div className="info-group">
                <span className="info-label">VIN Number</span>
                <span className="info-value font-mono uppercase">{order.orderVin || '—'}</span>
              </div>
            </div>
          </div>

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
              <div className="info-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                <div className="info-group">
                  <span className="info-label">Cardholder</span>
                  <span className="info-value font-mono">{order.customer.cards[0].customerNameOncard}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Card Number</span>
                  <span className="info-value font-mono">
                    {canViewCards ? order.customer.cards[0].customerCardNumber : maskCardNumber(order.customer.cards[0].customerCardNumber)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="info-group">
                    <span className="info-label">Expiry</span>
                    <span className="info-value font-mono">{order.customer.cards[0].customerCardExpDate}</span>
                  </div>
                  <div className="info-group">
                    <span className="info-label">CVV</span>
                    <span className="info-value font-mono">
                      {canViewCards ? order.customer.cards[0].customerCardCvv || '—' : '***'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="profile-main" style={{ padding: '24px', backgroundColor: 'var(--bg-sidebar)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}>
            <h3 className="form-section-title" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)', marginBottom: '20px' }}>
              Financial Breakdown
            </h3>
            <div className="info-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <span className="info-label" style={{ color: 'var(--text-sidebar-inactive)' }}>Selling Price</span>
                <span className="info-value font-mono" style={{ color: 'white' }}>${parseFloat(order.orderTotalPitched || '0').toFixed(2)}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <span className="info-label" style={{ color: 'var(--text-sidebar-inactive)' }}>Buying Price</span>
                <span className="info-value font-mono" style={{ color: 'rgba(255,255,255,0.8)' }}>${parseFloat(order.orderVendorPrice || '0').toFixed(2)}</span>
              </div>
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <span className="info-label" style={{ fontWeight: 'bold', color: 'var(--text-sidebar-inactive)' }}>Markup Margin</span>
                <span className="info-value font-mono" style={{ fontWeight: 'bold', color: parseFloat(order.orderMarkup || '0') >= 0 ? '#10b981' : '#ef4444' }}>
                  ${parseFloat(order.orderMarkup || '0').toFixed(2)}
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
              <div className="info-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                <span className="info-label">Intake Classification</span>
                <span className="info-value" style={{ fontWeight: '600' }}>{saleStatuses[order.saleStatus || '1']}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
