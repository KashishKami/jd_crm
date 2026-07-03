'use client';

import React from 'react';

interface DealSummarySidebarProps {
  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerBillingAddress: string;
  customerShippingAddress: string;

  // Payment Card Details
  customerCardCopyStatus: string;
  customerCardPhotoStatus: string;
  customerNameOncard: string;
  customerCardNumber: string;
  customerCardExpDate: string;
  customerCardCvv: string;
  orderPaymentGatewayId: string;

  // Vehicle & part Specs
  orderChecklist: string;
  orderMakeModel: string;
  orderPart: string;
  orderPartSize: string;
  orderQuotedMilesAndWarranty: string;
  orderVendorMilesAndWarranty: string;
  orderVin: string;

  // Pricing $ Allocation
  orderTotalPitched: string;
  orderVendorPrice: string;
  orderAmountCharged: string;
  orderDate: string;
  orderShippingType: string;
  orderVendorId: string;
  orderVendorFeedback: string;

  // Team Allocation
  orderSalesAgentId: string;
  orderSalesVerifierId: string;
  orderBackendExecutiveId: string;
  orderVerifierId: string;

  // Order Status
  saleStatus: string;
  orderCurrentStatus: string;
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
}: DealSummarySidebarProps) {
  // Calculations
  const totalPitched = parseFloat(orderTotalPitched) || 0;
  const vendorPrice = parseFloat(orderVendorPrice) || 0;
  const chargedAmount = parseFloat(orderAmountCharged) || 0;

  const chargedNow = chargedAmount;
  const projectedMargin = totalPitched - vendorPrice;
  const balanceDue = projectedMargin - chargedAmount;
  const marginPercent = totalPitched > 0 ? (projectedMargin / totalPitched) * 100 : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  // Helper functions to check fields
  const isFilled = (val: any) => {
    if (val === undefined || val === null) return false;
    return String(val).trim().length > 0;
  };

  const isChecked = (val: string) => {
    return val === 'Yes';
  };

  const isCardFilled = (val: string) => {
    if (!val) return false;
    const stripped = val.replace(/\s+/g, '');
    return stripped.length >= 4;
  };

  // 6 Categories Checklist
  const categories = [
    {
      label: 'Customer Information',
      filled:
        isFilled(customerName) &&
        isFilled(customerEmail) &&
        isFilled(customerPhone) &&
        isFilled(customerBillingAddress) &&
        isFilled(customerShippingAddress),
    },
    {
      label: 'Payment Card Details',
      filled:
        isChecked(customerCardCopyStatus) &&
        isChecked(customerCardPhotoStatus) &&
        isFilled(customerNameOncard) &&
        isCardFilled(customerCardNumber) &&
        isFilled(customerCardExpDate) &&
        isFilled(customerCardCvv) &&
        isFilled(orderPaymentGatewayId),
    },
    {
      label: 'Vehicle & part Specs',
      filled:
        isChecked(orderChecklist) &&
        isFilled(orderMakeModel) &&
        isFilled(orderPart) &&
        isFilled(orderPartSize) &&
        isFilled(orderQuotedMilesAndWarranty) &&
        isFilled(orderVendorMilesAndWarranty) &&
        isFilled(orderVin),
    },
    {
      label: 'Pricing $ Allocation',
      filled:
        isFilled(orderTotalPitched) &&
        isFilled(orderVendorPrice) &&
        isFilled(orderAmountCharged) &&
        isFilled(orderDate) &&
        isFilled(orderShippingType) &&
        isFilled(orderVendorId) &&
        isFilled(orderVendorFeedback),
    },
    {
      label: 'Team Allocation',
      filled:
        isFilled(orderSalesAgentId) &&
        isFilled(orderSalesVerifierId) &&
        isFilled(orderBackendExecutiveId) &&
        isFilled(orderVerifierId),
    },
    {
      label: 'Order Status',
      filled:
        isFilled(saleStatus) &&
        isFilled(orderCurrentStatus),
    },
  ];

  const filledCount = categories.filter((c) => c.filled).length;

  return (
    <div className="deal-summary-card">
      <div className="deal-summary-header">
        <h3 className="deal-summary-title">Deal Summary</h3>
        <p className="deal-summary-subtitle">Updates live as you fill the form</p>
      </div>

      <div className="deal-summary-metrics">
        <div className="metric-row">
          <span className="metric-label">Total Pitched</span>
          <span className="metric-value font-mono">{formatCurrency(totalPitched)}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Vendor Price</span>
          <span className="metric-value font-mono">{formatCurrency(vendorPrice)}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Charged Amount</span>
          <span className="metric-value font-mono">{formatCurrency(chargedAmount)}</span>
        </div>
      </div>

      <div className="summary-boxes-row">
        <div className="summary-box charged-now-box">
          <span className="box-label">CHARGED NOW</span>
          <span className="box-amount font-mono">{formatCurrency(chargedNow)}</span>
        </div>
        <div className="summary-box balance-due-box">
          <span className="box-label">BALANCE DUE</span>
          <span className="box-amount font-mono">{formatCurrency(balanceDue)}</span>
        </div>
      </div>

      <div className="projected-margin-row">
        <span className="margin-label">Projected margin (full deal)</span>
        <span className={`margin-value font-mono ${projectedMargin >= 0 ? 'margin-pos' : 'margin-neg'}`}>
          {formatCurrency(projectedMargin)}
          {totalPitched > 0 && (
            <span className="margin-pct text-xs font-normal ml-1">
              ({marginPercent.toFixed(1)}%)
            </span>
          )}
        </span>
      </div>

      {/* Progress Bar Segments */}
      <div className="progress-segments">
        {categories.map((c, idx) => (
          <div
            key={idx}
            className={`progress-segment ${idx < filledCount ? 'active' : ''}`}
            title={`${filledCount}/6 sections completed`}
          />
        ))}
      </div>

      <div className="required-fields-section">
        <span className="required-fields-header">Progress</span>
        <ul className="required-fields-list">
          {categories.map((c, idx) => (
            <li key={idx} className={`field-item ${c.filled ? 'filled' : 'empty'}`}>
              <span className="field-status-icon">
                {c.filled ? (
                  <svg className="w-4.5 h-4.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="empty-circle-dot" />
                )}
              </span>
              <span className="field-label">{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
