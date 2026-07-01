'use client';

import React, { useState } from 'react';
import { formatDateTimeDDMMYYYY } from '../lib/date';

interface AuditEntry {
  id: number;
  orderId: number;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedById: number;
  changedByName: string;
  changedAt: string | Date;
}

interface OrderAuditLogProps {
  entries: AuditEntry[];
}

const fieldLabels: Record<string, string> = {
  orderMakeModel: 'Year, Make & Model',
  orderPart: 'Order Part',
  orderPartSize: 'Part Size',
  orderQuotedMiles: 'Quoted Miles',
  orderGivenMiles: 'Vendor Miles',
  orderVin: 'VIN',
  orderTotalPitched: 'Total Price Pitched',
  orderVendorPrice: 'Vendor Price',
  orderVendorId: 'Vendor ID',
  orderVendorName: 'Vendor Name',
  orderShippingType: 'Shipping Type',
  orderAmountCharged: 'Amount Charged',
  orderPaymentGatewayId: 'Payment Gateway',
  orderSalesAgentId: 'Sales Agent ID',
  orderSalesAgentName: 'Sales Representative',
  orderVerifierId: 'QA Verifier ID',
  orderVerifierName: 'QA Verifier',
  orderSalesVerifierId: 'Sales Verifier ID',
  orderSalesVerifierName: 'Sales Verifier',
  orderBackendExecutiveId: 'Backend Executive ID',
  orderBackendExecutiveName: 'Backend Executive',
  saleStatus: 'Sales Status',
  orderCurrentStatus: 'Workflow Queue',
  orderTrackingNumber: 'Tracking Number',
  orderDeliveryStatus: 'Delivery Status',
  orderVendorFeedback: 'Vendor Feedback',
  orderClientFeedback: 'Client Feedback',
  orderResolution: 'Resolution',
  orderDate: 'Sale Date',
  customerName: 'Customer Name',
  customerPhone: 'Phone Number',
  customerEmail: 'Email Address',
  customerBillingAddress: 'Billing Address',
  customerShippingAddress: 'Shipping Address',
  customerNameOncard: 'Name on Card',
  customerCardNumber: 'Card Number',
  customerCardExpDate: 'Card Expiry',
  customerCardCvv: 'CVV',
  customerCardCopyStatus: 'Card Copy Status',
  customerCardPhotoStatus: 'Card Photo Status',
  orderDocumentation: 'Documentation Status',
  orderBooked: 'Booking Status',
  orderQualifiedIncentiveStatus: 'Incentive Eligibility',
  orderQualifiedIncentiveAmount: 'Incentive Amount',
  orderStatus: 'General Status'
};

export default function OrderAuditLog({ entries }: OrderAuditLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getFieldLabel = (fieldName: string) => {
    return (
      fieldLabels[fieldName] ||
      fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())
    );
  };

  const formatValue = (val: string | null) => {
    if (val === null || val === undefined || val.trim() === '') {
      return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>[empty]</span>;
    }
    return val;
  };

  return (
    <div className="profile-main" style={{ padding: '24px', marginTop: '24px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          outline: 'none',
        }}
        aria-expanded={isExpanded}
      >
        <h3 className="form-section-title" style={{ margin: 0, border: 'none', width: 'auto' }}>
          Change History — Detailed Edit Log
        </h3>
        <span style={{ fontSize: '1.25rem', color: '#64748b', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
          {entries.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
              No change log entries available.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#334155' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px', fontWeight: '600', color: '#475569' }}>Date/Time</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600', color: '#475569' }}>Field</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600', color: '#475569' }}>Old Value</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600', color: '#475569' }}>New Value</th>
                  <th style={{ padding: '10px 8px', fontWeight: '600', color: '#475569' }}>Agent</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDateTimeDDMMYYYY(entry.changedAt)}
                    </td>
                    <td style={{ padding: '10px 8px', fontWeight: '500', color: '#1e293b' }}>
                      {getFieldLabel(entry.fieldName)}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#475569', wordBreak: 'break-all' }}>
                      {formatValue(entry.oldValue)}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#1e293b', wordBreak: 'break-all', fontWeight: '500' }}>
                      {formatValue(entry.newValue)}
                    </td>
                    <td style={{ padding: '10px 8px', color: '#64748b' }}>
                      {entry.changedByName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
