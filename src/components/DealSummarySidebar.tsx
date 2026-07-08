'use client';

import React from 'react';

interface DealSummarySidebarProps {
  // Customer Information (optional)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerBillingAddress?: string;
  customerShippingAddress?: string;

  // Payment Card Details (optional)
  customerCardCopyStatus?: string;
  customerCardPhotoStatus?: string;
  customerNameOncard?: string;
  customerCardNumber?: string;
  customerCardExpDate?: string;
  customerCardCvv?: string;
  orderPaymentGatewayId?: string;

  // Vehicle & part Specs (optional)
  orderChecklist?: string;
  orderMakeModel?: string;
  orderPart?: string;
  orderPartSize?: string;
  orderQuotedMilesAndWarranty?: string;
  orderVendorMilesAndWarranty?: string;
  orderVin?: string;

  // Pricing $ Allocation
  orderTotalPitched: string;
  orderVendorPrice: string;
  orderAmountCharged: string;
  orderRefundAmount?: string;
  orderDate?: string;
  orderShippingType?: string;
  orderVendorId?: string;
  orderVendorFeedback?: string;

  // Team Allocation (optional)
  orderSalesAgentId?: string;
  orderSalesVerifierId?: string;
  orderBackendExecutiveId?: string;
  orderVerifierId?: string;

  // Order Status (optional)
  saleStatus?: string;
  orderCurrentStatus?: string;

  // Dynamic Multi-Part Array
  parts?: Array<any>;
}

export default function DealSummarySidebar({
  customerName,
  customerEmail,
  customerPhone,
  customerBillingAddress,
  customerShippingAddress,
  customerCardCopyStatus,
  customerCardPhotoStatus,
  customerNameOncard,
  customerCardNumber,
  customerCardExpDate,
  customerCardCvv,
  orderPaymentGatewayId,
  orderChecklist,
  orderMakeModel,
  orderPart,
  orderPartSize,
  orderQuotedMilesAndWarranty,
  orderVendorMilesAndWarranty,
  orderVin,
  orderTotalPitched,
  orderVendorPrice,
  orderAmountCharged,
  orderRefundAmount = '0',
  orderDate,
  orderShippingType,
  orderVendorId,
  orderVendorFeedback,
  orderSalesAgentId,
  orderSalesVerifierId,
  orderBackendExecutiveId,
  orderVerifierId,
  saleStatus,
  orderCurrentStatus,
  parts,
}: DealSummarySidebarProps) {
  const sellingPrice = parseFloat(orderTotalPitched) || 0;
  const buyingPrice = parseFloat(orderVendorPrice) || 0;
  const netMargin = sellingPrice - buyingPrice;
  const chargedAmount = parseFloat(orderAmountCharged) || 0;
  const refundAmount = parseFloat(orderRefundAmount) || 0;

  const balanceDue = netMargin - chargedAmount;
  const finalMargin = chargedAmount - refundAmount;

  const formatCurrency = (val: number) => {
    const sign = val < 0 ? '-' : '';
    return `${sign}$${Math.abs(val).toFixed(2)}`;
  };

  const isFilled = (val: any) => {
    if (val === undefined || val === null) return false;
    return String(val).trim().length > 0;
  };

  const isChecked = (val: any) => {
    return val === 'Yes';
  };

  const isCardFilled = (val: any) => {
    if (!val) return false;
    const stripped = String(val).replace(/\s+/g, '');
    return stripped.length >= 4;
  };

  const partsList = parts || [{
    orderChecklist,
    orderMakeModel,
    orderPart,
    orderPartSize,
    orderQuotedMilesAndWarranty,
    orderVendorMilesAndWarranty,
    orderVin,
    orderTotalPitched,
    orderVendorPrice,
    orderAmountCharged,
    orderVendorId,
    orderVendorFeedback,
    orderSalesAgentId,
    orderSalesVerifierId,
    orderBackendExecutiveId,
    orderVerifierId,
    saleStatus,
    orderCurrentStatus,
  }];

  const isCustomerFilled =
    isFilled(customerName) &&
    isFilled(customerEmail) &&
    isFilled(customerPhone) &&
    isFilled(customerBillingAddress) &&
    isFilled(customerShippingAddress);

  const isCardFilledFlag =
    isChecked(customerCardCopyStatus) &&
    isChecked(customerCardPhotoStatus) &&
    isFilled(customerNameOncard) &&
    isCardFilled(customerCardNumber) &&
    isFilled(customerCardExpDate) &&
    isFilled(customerCardCvv) &&
    isFilled(orderPaymentGatewayId);

  // Generate dynamic flat list of sections for the progress bar segments
  const allSections: { label: string; filled: boolean }[] = [
    { label: 'Customer Information', filled: isCustomerFilled },
    { label: 'Payment Card Details', filled: isCardFilledFlag },
  ];

  partsList.forEach((p, idx) => {
    const partLabel = idx === 0 ? 'Order #1 (Primary)' : `Order #${idx + 1}`;
    allSections.push({
      label: `${partLabel} - Vehicle & part Specs`,
      filled:
        isChecked(p.orderChecklist) &&
        isFilled(p.orderMakeModel) &&
        isFilled(p.orderPart) &&
        isFilled(p.orderPartSize) &&
        isFilled(p.orderQuotedMilesAndWarranty) &&
        isFilled(p.orderVendorMilesAndWarranty) &&
        isFilled(p.orderVin),
    });
    allSections.push({
      label: `${partLabel} - Pricing $ Allocation`,
      filled:
        isFilled(p.orderTotalPitched) &&
        isFilled(p.orderVendorPrice) &&
        isFilled(p.orderAmountCharged) &&
        isFilled(p.orderVendorId) &&
        isFilled(p.orderVendorFeedback),
    });
    allSections.push({
      label: `${partLabel} - Team Allocation`,
      filled:
        isFilled(p.orderSalesAgentId) &&
        isFilled(p.orderSalesVerifierId) &&
        isFilled(p.orderBackendExecutiveId) &&
        isFilled(p.orderVerifierId),
    });
    allSections.push({
      label: `${partLabel} - Order Status`,
      filled:
        isFilled(p.saleStatus) &&
        isFilled(p.orderCurrentStatus),
    });
  });

  const filledCount = allSections.filter((s) => s.filled).length;

  return (
    <div style={{
      fontFamily: 'Georgia, serif',
      backgroundColor: '#1e293b',
      color: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      width: '100%',
      maxWidth: '400px'
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
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(sellingPrice)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Buying Price</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(buyingPrice)}</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Net Margin</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(netMargin)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Charged Amount</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(chargedAmount)}</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Balance Due</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(balanceDue)}</span>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase' }}>Final Margin</span>
          <span style={{
            fontSize: '1.1rem',
            fontWeight: 'bold',
            color: finalMargin >= 0 ? '#10b981' : '#f87171'
          }}>
            {formatCurrency(finalMargin)}
          </span>
        </div>
      </div>

      {/* Progress Bar Segments */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginTop: '24px',
        marginBottom: '24px'
      }}>
        {allSections.map((s, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              backgroundColor: s.filled ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
              transition: 'background-color 0.2s'
            }}
            title={`${s.label}: ${s.filled ? 'Completed' : 'Incomplete'}`}
          />
        ))}
      </div>

      {/* Progress checklist list */}
      <div style={{
        marginTop: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        paddingTop: '20px'
      }}>
        <h4 style={{
          fontSize: '0.85rem',
          fontWeight: 'bold',
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 16px 0'
        }}>
          Completion Progress ({filledCount}/{allSections.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
          {/* Customer & Card Global Items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCustomerFilled ? (
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
            ) : (
              <span style={{ color: '#64748b' }}>○</span>
            )}
            <span style={{ color: isCustomerFilled ? '#ffffff' : '#94a3b8' }}>Customer Information</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isCardFilledFlag ? (
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
            ) : (
              <span style={{ color: '#64748b' }}>○</span>
            )}
            <span style={{ color: isCardFilledFlag ? '#ffffff' : '#94a3b8' }}>Payment Card Details</span>
          </div>

          {/* Dynamic Parts List */}
          {partsList.map((p, idx) => {
            const partLabel = idx === 0 ? 'Order #1 (Primary)' : `Order #${idx + 1}`;
            const isSpecs = isChecked(p.orderChecklist) && isFilled(p.orderMakeModel) && isFilled(p.orderPart) && isFilled(p.orderPartSize) && isFilled(p.orderQuotedMilesAndWarranty) && isFilled(p.orderVendorMilesAndWarranty) && isFilled(p.orderVin);
            const isPricing = isFilled(p.orderTotalPitched) && isFilled(p.orderVendorPrice) && isFilled(p.orderAmountCharged) && isFilled(p.orderVendorId) && isFilled(p.orderVendorFeedback);
            const isTeam = isFilled(p.orderSalesAgentId) && isFilled(p.orderSalesVerifierId) && isFilled(p.orderBackendExecutiveId) && isFilled(p.orderVerifierId);
            const isStatus = isFilled(p.saleStatus) && isFilled(p.orderCurrentStatus);

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>{partLabel}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isSpecs ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> : <span style={{ color: '#64748b' }}>○</span>}
                    <span style={{ color: isSpecs ? '#ffffff' : '#94a3b8' }}>Vehicle & Part Specs</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isPricing ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> : <span style={{ color: '#64748b' }}>○</span>}
                    <span style={{ color: isPricing ? '#ffffff' : '#94a3b8' }}>Pricing & Allocation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isTeam ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> : <span style={{ color: '#64748b' }}>○</span>}
                    <span style={{ color: isTeam ? '#ffffff' : '#94a3b8' }}>Team Allocation</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isStatus ? <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> : <span style={{ color: '#64748b' }}>○</span>}
                    <span style={{ color: isStatus ? '#ffffff' : '#94a3b8' }}>Order Status</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
