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
  vendors?: Array<{ vendorId: number; vendorName: string }>;
}

export default function DealSummarySidebar({
  customerName,
  customerEmail,
  customerPhone,
  customerNameOncard,
  customerCardNumber,
  customerCardExpDate,
  orderPaymentGatewayId,
  orderTotalPitched,
  orderVendorPrice,
  orderAmountCharged,
  orderRefundAmount = '0',
  orderSalesAgentId,
  orderBackendExecutiveId,
  saleStatus,
  parts,
  vendors,
}: DealSummarySidebarProps) {
  const [breakdownOpen, setBreakdownOpen] = React.useState(false);

  const sellingPrice = parseFloat(orderTotalPitched) || 0;
  const buyingPrice = parseFloat(orderVendorPrice) || 0;
  const netMargin = sellingPrice - buyingPrice;
  const chargedAmount = parseFloat(orderAmountCharged) || 0;
  const refundAmount = parseFloat(orderRefundAmount) || 0;

  const balanceDue = netMargin - chargedAmount;

  const formatCurrency = (val: number) => {
    const sign = val < 0 ? '-' : '';
    return `${sign}$${Math.abs(val).toFixed(2)}`;
  };

  const isFilled = (val: any) => {
    if (val === undefined || val === null) return false;
    return String(val).trim().length > 0;
  };

  const isCardFilled = (val: any) => {
    if (!val) return false;
    const stripped = String(val).replace(/\s+/g, '');
    return stripped.length >= 4;
  };

  const partsList = parts || [];

  // Group vendor prices by vendor name
  const vendorMap: Record<string, { parts: string[]; total: number }> = {};
  partsList.forEach((p, idx) => {
    const vId = p.orderVendorId;
    const vendorObj = vendors?.find((v) => String(v.vendorId) === String(vId));
    const vName = vendorObj ? vendorObj.vendorName : 'Unassigned';
    const partDesc = p.orderPart || `Part ${idx + 1}`;
    const price = parseFloat(p.orderVendorPrice) || 0;

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

  const isCustomerFilled =
    isFilled(customerName) &&
    isFilled(customerEmail) &&
    isFilled(customerPhone);

  const isCardFilledFlag =
    isFilled(customerNameOncard) &&
    isCardFilled(customerCardNumber) &&
    isFilled(customerCardExpDate) &&
    isFilled(orderPaymentGatewayId);

  const isPartsFilled =
    partsList.length > 0 &&
    partsList.every((p) => isFilled(p.orderPart) && isFilled(p.orderVendorPrice));

  const isPricingStatusFilled =
    isFilled(orderTotalPitched) && isFilled(saleStatus);

  const isTeamAllocFilled =
    isFilled(orderSalesAgentId) && isFilled(orderBackendExecutiveId);

  // Generate dynamic 5 flat list of sections for the progress bar segments
  const progressSections = [
    { label: 'Customer Information', filled: isCustomerFilled },
    { label: 'Payment Card Details', filled: isCardFilledFlag },
    { label: 'Part Information', filled: isPartsFilled },
    { label: 'Pricing & Status', filled: isPricingStatusFilled },
    { label: 'Team Allocation', filled: isTeamAllocFilled },
  ];

  const filledCount = progressSections.filter((s) => s.filled).length;

  const showRefund =
    saleStatus === '2' || saleStatus === '3' || saleStatus === '4' || saleStatus === '5';

  return (
    <div
      style={{
        fontFamily: 'Georgia, serif',
        backgroundColor: '#ffffff',
        color: '#475569',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <h3
        style={{
          fontSize: '1.75rem',
          fontWeight: 'bold',
          color: '#0f172a',
          margin: '0 0 4px 0',
        }}
      >
        Deal Summary
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0 0 24px 0' }}>
        Updates live as you fill the form
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Total Pitched</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a' }}>
            {formatCurrency(sellingPrice)}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setBreakdownOpen(!breakdownOpen)}
            title="Click to toggle vendor price distribution"
          >
            <span style={{ fontSize: '0.9rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Vendor Price
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {breakdownOpen ? '▲' : '▼'}
              </span>
            </span>
            <span style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a' }}>
              {formatCurrency(buyingPrice)}
            </span>
          </div>

          {breakdownOpen && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '0.8rem',
                marginTop: '4px',
              }}
            >
              {vendorBreakdown.length === 0 ? (
                <div style={{ color: '#94a3b8' }}>No parts added yet</div>
              ) : (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 1.8fr 1.2fr',
                    gap: '8px',
                    borderBottom: '1px solid #cbd5e1',
                    paddingBottom: '6px',
                    fontWeight: 'bold',
                    color: '#64748b'
                  }}>
                    <span>Vendor</span>
                    <span>Part(s)</span>
                    <span style={{ textAlign: 'right' }}>Price</span>
                  </div>
                  {vendorBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.8fr 1.8fr 1.2fr',
                        gap: '8px',
                        color: '#475569',
                        borderBottom: idx === vendorBreakdown.length - 1 ? 'none' : '1px solid #e2e8f0',
                        paddingBottom: idx === vendorBreakdown.length - 1 ? 0 : '8px',
                        alignItems: 'center',
                        wordBreak: 'break-word',
                      }}
                    >
                      <span>{item.vendorName}</span>
                      <span>{item.parts}</span>
                      <span style={{ fontWeight: 'bold', textAlign: 'right' }}>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Charged Amount</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#0f172a' }}>
            {formatCurrency(chargedAmount)}
          </span>
        </div>

        {showRefund && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: '500' }}>Refund Amount</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#ef4444' }}>
              {formatCurrency(refundAmount)}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div
          style={{
            flex: 1,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#16a34a', letterSpacing: '0.05em', marginBottom: '4px' }}>
            CHARGED NOW
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#16a34a' }}>
            {formatCurrency(chargedAmount)}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '14px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#ea580c', letterSpacing: '0.05em', marginBottom: '4px' }}>
            BALANCE DUE
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ea580c' }}>
            {formatCurrency(balanceDue)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '16px',
          margin: '0 0 20px 0',
        }}
      >
        <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Projected margin (full deal)</span>
        <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#10b981' }}>
          {formatCurrency(netMargin)}
        </span>
      </div>

      {/* Progress Bar Segments */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '24px',
        }}
      >
        {progressSections.map((s, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              backgroundColor: s.filled ? '#10b981' : '#e2e8f0',
              transition: 'background-color 0.25s ease',
            }}
            title={`${s.label}: ${s.filled ? 'Completed' : 'Incomplete'}`}
          />
        ))}
      </div>

      {/* Progress Checklist */}
      <div>
        <h4
          style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 16px 0',
          }}
        >
          Progress ({filledCount}/{progressSections.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
          {/* Customer Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isCustomerFilled ? (
              <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
            ) : (
              <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>○</span>
            )}
            <span style={{ color: isCustomerFilled ? '#1e293b' : '#64748b', fontWeight: isCustomerFilled ? '500' : 'normal' }}>
              Customer Information
            </span>
          </div>

          {/* Payment Card Details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isCardFilledFlag ? (
              <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
            ) : (
              <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>○</span>
            )}
            <span style={{ color: isCardFilledFlag ? '#1e293b' : '#64748b', fontWeight: isCardFilledFlag ? '500' : 'normal' }}>
              Payment Card Details
            </span>
          </div>

          {/* Part Information Dynamic Checklist */}
          {partsList.length <= 1 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isPartsFilled ? (
                <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
              ) : (
                <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>○</span>
              )}
              <span style={{ color: isPartsFilled ? '#1e293b' : '#64748b', fontWeight: isPartsFilled ? '500' : 'normal' }}>
                Part Information
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isPartsFilled ? (
                  <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
                ) : (
                  <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>○</span>
                )}
                <span style={{ color: isPartsFilled ? '#1e293b' : '#64748b', fontWeight: 'bold' }}>
                  Part Information
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '22px' }}>
                {partsList.map((p, idx) => {
                  const partFilled = isFilled(p.orderPart) && isFilled(p.orderVendorPrice);
                  const partLabel = p.orderPart || `Part ${idx + 1}`;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                      <span style={{ color: partFilled ? '#10b981' : '#cbd5e1', fontWeight: 'bold' }}>
                        {partFilled ? '✓' : '•'}
                      </span>
                      <span style={{ color: partFilled ? '#475569' : '#94a3b8' }}>
                        Part {idx + 1}: {partLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPricingStatusFilled ? (
              <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
            ) : (
              <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>○</span>
            )}
            <span style={{ color: isPricingStatusFilled ? '#1e293b' : '#64748b', fontWeight: isPricingStatusFilled ? '500' : 'normal' }}>
              Pricing & Status
            </span>
          </div>

          {/* Team Allocation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isTeamAllocFilled ? (
              <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>
            ) : (
              <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>○</span>
            )}
            <span style={{ color: isTeamAllocFilled ? '#1e293b' : '#64748b', fontWeight: isTeamAllocFilled ? '500' : 'normal' }}>
              Team Allocation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
