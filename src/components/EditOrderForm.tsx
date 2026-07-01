'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { fadeInPage } from '../lib/animations';
import { getCurrentEstDateTime, convertEstToUtc } from '../lib/date';

interface EditOrderFormProps {
  order: any;
  vendors: Array<{ vendorId: number; vendorName: string }>;
  gateways: Array<{ gatewayId: number; gatewayName: string }>;
  agents: Array<{ uid: number; name: string; nickname?: string | null }>;
}

export default function EditOrderForm({ order, vendors, gateways, agents }: EditOrderFormProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Form states initialized with existing order info
  const [customerName, setCustomerName] = useState(order.customer.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(order.customer.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(order.customer.customerEmail || '');
  const [customerBillingAddress, setCustomerBillingAddress] = useState(order.customer.customerBillingAddress || '');
  const [customerShippingAddress, setCustomerShippingAddress] = useState(order.customer.customerShippingAddress || '');

  const firstCard = order.customer.cards[0] || {};
  const [customerNameOncard, setCustomerNameOncard] = useState(firstCard.customerNameOncard || '');
  const [customerCardNumber, setCustomerCardNumber] = useState(firstCard.customerCardNumber || '');
  const [customerCardExpDate, setCustomerCardExpDate] = useState(firstCard.customerCardExpDate || '');
  const [customerCardCvv, setCustomerCardCvv] = useState(firstCard.customerCardCvv || '');
  const [customerCardCopyStatus, setCustomerCardCopyStatus] = useState(firstCard.customerCardCopyStatus || 'No');
  const [customerCardPhotoStatus, setCustomerCardPhotoStatus] = useState(firstCard.customerCardPhotoStatus || 'No');

  const [orderMakeModel, setOrderMakeModel] = useState(order.orderMakeModel || '');
  const [orderPart, setOrderPart] = useState(order.orderPart || '');
  const [orderPartSize, setOrderPartSize] = useState(order.orderPartSize || '');
  const [orderQuotedMiles, setOrderQuotedMiles] = useState(order.orderQuotedMiles || '');
  const [orderGivenMiles, setOrderGivenMiles] = useState(order.orderGivenMiles || '');
  const [orderVin, setOrderVin] = useState(order.orderVin || '');
  const [orderShippingType, setOrderShippingType] = useState(order.orderShippingType || 'Ground');
  const [orderTrackingNumber, setOrderTrackingNumber] = useState(order.orderTrackingNumber || '');
  const [orderDeliveryStatus, setOrderDeliveryStatus] = useState(order.orderDeliveryStatus || '');

  const [orderTotalPitched, setOrderTotalPitched] = useState(order.orderTotalPitched || '');
  const [orderVendorPrice, setOrderVendorPrice] = useState(order.orderVendorPrice || '');
  const [orderVendorId, setOrderVendorId] = useState(order.orderVendorId ? String(order.orderVendorId) : '');
  const [orderPaymentGatewayId, setOrderPaymentGatewayId] = useState(order.orderPaymentGatewayId ? String(order.orderPaymentGatewayId) : '');
  const [orderSalesAgentId, setOrderSalesAgentId] = useState(order.orderSalesAgentId ? String(order.orderSalesAgentId) : '');
  const [orderSalesVerifierId, setOrderSalesVerifierId] = useState(order.orderSalesVerifierId ? String(order.orderSalesVerifierId) : '');
  const [orderBackendExecutiveId, setOrderBackendExecutiveId] = useState(order.orderBackendExecutiveId ? String(order.orderBackendExecutiveId) : '');
  const [orderVerifierId, setOrderVerifierId] = useState(order.orderVerifierId ? String(order.orderVerifierId) : '');
  const [saleStatus, setSaleStatus] = useState(order.saleStatus || '1');
  const [orderRefundAmount, setOrderRefundAmount] = useState(order.orderRefundAmount || '');
  const [showStatusDateModal, setShowStatusDateModal] = useState(false);
  const [saleStatusChangeDateInput, setSaleStatusChangeDateInput] = useState('');
  const [saleStatusChangeTimeInput, setSaleStatusChangeTimeInput] = useState('');
  const [saleStatusChangeDate, setSaleStatusChangeDate] = useState('');
  const [orderCurrentStatus, setOrderCurrentStatus] = useState(order.orderCurrentStatus || 'Pending Booking');
  const [orderDate, setOrderDate] = useState(() => order?.orderDate ? new Date(order.orderDate).toLocaleDateString('sv-SE', { timeZone: 'UTC' }) : new Date().toLocaleDateString('sv-SE', { timeZone: 'America/New_York' }));

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalPitchedVal = parseFloat(orderTotalPitched) || 0;
  const vendorPriceVal = parseFloat(orderVendorPrice) || 0;
  const markup = totalPitchedVal - vendorPriceVal;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!customerName || !customerEmail) {
      setError('Please fill in customer name and email.');
      setSubmitting(false);
      return;
    }
    if (!orderPart) {
      setError('Please enter the part requested.');
      setSubmitting(false);
      return;
    }

    const payload = {
      // Customer fields — sent to the service to update crm_customers
      customerName,
      customerPhone,
      customerEmail,
      customerBillingAddress,
      customerShippingAddress,
      // Card fields — sent to the service to update crm_customer_cards
      customerNameOncard,
      customerCardNumber,
      customerCardExpDate,
      customerCardCvv,
      customerCardCopyStatus,
      customerCardPhotoStatus,
      orderMakeModel,
      orderPart,
      orderPartSize,
      orderQuotedMiles,
      orderGivenMiles,
      orderVin,
      orderShippingType,
      orderTrackingNumber: orderTrackingNumber || null,
      orderDeliveryStatus: orderDeliveryStatus || null,
      orderTotalPitched,
      orderVendorPrice,
      orderVendorId: orderVendorId ? Number(orderVendorId) : null,
      orderPaymentGatewayId: orderPaymentGatewayId ? Number(orderPaymentGatewayId) : null,
      orderSalesAgentId: orderSalesAgentId ? Number(orderSalesAgentId) : null,
      orderSalesVerifierId: orderSalesVerifierId ? Number(orderSalesVerifierId) : null,
      orderBackendExecutiveId: orderBackendExecutiveId ? Number(orderBackendExecutiveId) : null,
      orderVerifierId: orderVerifierId ? Number(orderVerifierId) : null,
      saleStatus,
      orderRefundAmount: saleStatus === '4' ? orderRefundAmount : null,
      orderCurrentStatus,
      orderDate,
      saleStatusChangeDate: saleStatusChangeDate || null,
    };

    try {
      const res = await fetch(`/api/orders/${order.crmOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update order.');
      }

      router.push(`/orders/${order.crmOrderId}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="agents-page-container" style={{ opacity: 0 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Sales Order #{order.crmOrderId}</h1>
          <p className="page-subtitle">Modify order details, updates, status, and tracking info.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/orders/${order.crmOrderId}`)}
          className="btn-secondary-custom"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="error-box" style={{ margin: '0', padding: '16px', textAlign: 'left' }}>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        {/* Section 1: Customer Info */}
        <div className="form-section">
          <h3 className="form-section-title">1. Customer Information</h3>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label htmlFor="customerName" className="form-label">Customer Name</label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group form-grid-full">
              <label className="form-label">Billing Address</label>
              <input
                type="text"
                value={customerBillingAddress}
                onChange={(e) => setCustomerBillingAddress(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group form-grid-full">
              <label className="form-label">Shipping Address</label>
              <input
                type="text"
                value={customerShippingAddress}
                onChange={(e) => setCustomerShippingAddress(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Card Details */}
        <div className="form-section">
          <h3 className="form-section-title">2. Payment Card Details</h3>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Name On Card</label>
              <input
                type="text"
                value={customerNameOncard}
                onChange={(e) => setCustomerNameOncard(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Card Number</label>
              <input
                type="text"
                value={customerCardNumber}
                onChange={(e) => setCustomerCardNumber(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date (MM/YY)</label>
              <input
                type="text"
                value={customerCardExpDate}
                onChange={(e) => setCustomerCardExpDate(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">CVV Code</label>
              <input
                type="password"
                value={customerCardCvv}
                onChange={(e) => setCustomerCardCvv(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group form-grid-full flex-row gap-6 items-center pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerCardCopyStatus === 'Yes'}
                  onChange={(e) => setCustomerCardCopyStatus(e.target.checked ? 'Yes' : 'No')}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span className="form-label" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Card Copy Verified</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerCardPhotoStatus === 'Yes'}
                  onChange={(e) => setCustomerCardPhotoStatus(e.target.checked ? 'Yes' : 'No')}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span className="form-label" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Photo ID Checked</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Vehicle Specs */}
        <div className="form-section">
          <h3 className="form-section-title">3. Vehicle & Part Specifications</h3>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label className="form-label">Year, Make & Model</label>
              <input
                id="orderMakeModel"
                type="text"
                value={orderMakeModel}
                onChange={(e) => setOrderMakeModel(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group form-grid-full">
              <label className="form-label">Part Description *</label>
              <input
                type="text"
                value={orderPart}
                onChange={(e) => setOrderPart(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Specs / Size</label>
              <input
                type="text"
                value={orderPartSize}
                onChange={(e) => setOrderPartSize(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderQuotedMiles" className="form-label">Quoted Miles</label>
              <input
                id="orderQuotedMiles"
                type="text"
                value={orderQuotedMiles}
                onChange={(e) => setOrderQuotedMiles(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderGivenMiles" className="form-label">Vendor Miles</label>
              <input
                type="text"
                value={orderGivenMiles}
                onChange={(e) => setOrderGivenMiles(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">VIN Number</label>
              <input
                type="text"
                value={orderVin}
                onChange={(e) => setOrderVin(e.target.value)}
                className="form-input font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Pricing & Allocation */}
        <div className="form-section">
          <h3 className="form-section-title">4. Pricing, Workflow & Tracking</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Total Price Pitched *</label>
              <input
                type="number"
                value={orderTotalPitched}
                onChange={(e) => setOrderTotalPitched(e.target.value)}
                required
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vendor Buying Price *</label>
              <input
                type="number"
                value={orderVendorPrice}
                onChange={(e) => setOrderVendorPrice(e.target.value)}
                required
                className="form-input font-mono"
              />
            </div>
            <div className="form-group" style={{ justifyContent: 'center' }}>
              <span className="form-label">Computed Markup</span>
              <span className={`text-lg font-bold mt-1 ${markup >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ${markup.toFixed(2)}
              </span>
            </div>
            <div className="form-group">
              <label htmlFor="orderDate" className="form-label">
                Sale Date
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                  (defaults to today)
                </span>
              </label>
              <input
                type="date"
                id="orderDate"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Shipping Type</label>
              <select
                value={orderShippingType}
                onChange={(e) => setOrderShippingType(e.target.value)}
                className="form-select"
              >
                <option value="Ground">Ground</option>
                <option value="Air">Air</option>
                <option value="Express">Express</option>
                <option value="Freight">Freight</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Carrier Tracking #</label>
              <input
                type="text"
                placeholder="e.g. FedEx 1234..."
                value={orderTrackingNumber}
                onChange={(e) => setOrderTrackingNumber(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Stage Status</label>
              <input
                type="text"
                placeholder="e.g. Out for Delivery / Delivered"
                value={orderDeliveryStatus}
                onChange={(e) => setOrderDeliveryStatus(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Workflow Queue</label>
              <select
                value={orderCurrentStatus}
                onChange={(e) => setOrderCurrentStatus(e.target.value)}
                className="form-select"
              >
                {order.orderCurrentStatus === 'Pending Booking' && (
                  <option value="Pending Booking" disabled>Pending Booking</option>
                )}
                <option value="Pending Shipment">Pending Shipment</option>
                <option value="Pending Delivery">Pending Delivery</option>
                <option value="Pending Feedback">Pending Feedback</option>
                <option value="Pending Resolutions">Pending Resolutions</option>
                <option value="Completed Orders">Completed Orders</option>
                <option value="Returned Orders">Returned Orders</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="saleStatus" className="form-label">Sale Status</label>
              <select
                id="saleStatus"
                value={saleStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setSaleStatus(val);
                  if (val === '2' || val === '3' || val === '4') {
                    const est = getCurrentEstDateTime();
                    setSaleStatusChangeDateInput(est.date);
                    setSaleStatusChangeTimeInput(est.time);
                    setShowStatusDateModal(true);
                  } else {
                    setSaleStatusChangeDate('');
                  }
                }}
                className="form-select"
              >
                <option value="1">Sold</option>
                <option value="2">Refunded</option>
                <option value="3">Chargebacked</option>
                <option value="4">Partial Refund</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Supplier (Vendor)</label>
              <select
                value={orderVendorId}
                onChange={(e) => setOrderVendorId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Assign Supplier --</option>
                {vendors.map((v) => (
                  <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Billing Gateway</label>
              <select
                value={orderPaymentGatewayId}
                onChange={(e) => setOrderPaymentGatewayId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Select Gateway --</option>
                {gateways.map((g) => (
                  <option key={g.gatewayId} value={g.gatewayId}>{g.gatewayName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orderSalesAgentId" className="form-label">Sales Agent</label>
              <select
                id="orderSalesAgentId"
                value={orderSalesAgentId}
                onChange={(e) => setOrderSalesAgentId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Assign Sales Agent --</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orderSalesVerifierId" className="form-label">Sales Verifier</label>
              <select
                id="orderSalesVerifierId"
                value={orderSalesVerifierId}
                onChange={(e) => setOrderSalesVerifierId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Assign Sales Verifier --</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orderBackendExecutiveId" className="form-label">Backend Executive</label>
              <select
                id="orderBackendExecutiveId"
                value={orderBackendExecutiveId}
                onChange={(e) => setOrderBackendExecutiveId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Assign Backend Executive --</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orderVerifierId" className="form-label">QA Verifier</label>
              <select
                id="orderVerifierId"
                value={orderVerifierId}
                onChange={(e) => setOrderVerifierId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Assign QA --</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form Action Controls */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => router.push(`/orders/${order.crmOrderId}`)}
            className="btn-secondary-custom"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary-custom"
          >
            {submitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {mounted && showStatusDateModal && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            padding: '24px',
            width: '90%',
            maxWidth: '450px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Record {saleStatus === '2' ? 'Refund' : saleStatus === '3' ? 'Chargeback' : 'Partial Refund'} Details
              </h3>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
              {saleStatus === '4'
                ? 'Enter the date, time, and refund amount for this partial refund.'
                : 'When did this refund/chargeback actually occur?'
              }
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Date:</label>
                <input 
                  type="date" 
                  value={saleStatusChangeDateInput}
                  onChange={(e) => setSaleStatusChangeDateInput(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Time:</label>
                <input 
                  type="time" 
                  value={saleStatusChangeTimeInput}
                  onChange={(e) => setSaleStatusChangeTimeInput(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              {saleStatus === '4' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="orderRefundAmount" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Refund Amount *:</label>
                  <input 
                    id="orderRefundAmount"
                    type="number" 
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={orderRefundAmount}
                    onChange={(e) => setOrderRefundAmount(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '1rem', color: '#64748b' }}>ⓘ</span>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                {saleStatus === '4'
                  ? 'All fields are required. If date/time are left blank, current time is used.'
                  : 'If left blank, the current date and time will be recorded automatically.'
                }
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (saleStatus === '4') {
                    setSaleStatus(order.saleStatus || '1');
                    setOrderRefundAmount(order.orderRefundAmount || '');
                  }
                  setSaleStatusChangeDate('');
                  setShowStatusDateModal(false);
                }}
                className="btn-secondary-custom"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {saleStatus === '4' ? 'Cancel' : 'Skip — Use Current Time'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (saleStatus === '4' && !orderRefundAmount) {
                    alert('Refund amount is required');
                    return;
                  }
                  if (saleStatusChangeDateInput && saleStatusChangeTimeInput) {
                    const combined = convertEstToUtc(saleStatusChangeDateInput, saleStatusChangeTimeInput);
                    setSaleStatusChangeDate(combined);
                  } else {
                    setSaleStatusChangeDate('');
                  }
                  setShowStatusDateModal(false);
                }}
                className="btn-primary-custom"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
