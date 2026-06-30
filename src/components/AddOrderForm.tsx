'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fadeInPage } from '../lib/animations';

interface AddOrderFormProps {
  vendors: Array<{ vendorId: number; vendorName: string }>;
  gateways: Array<{ gatewayId: number; gatewayName: string }>;
  agents: Array<{ uid: number; name: string; nickname?: string | null }>;
}

export default function AddOrderForm({ vendors, gateways, agents }: AddOrderFormProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerBillingAddress, setCustomerBillingAddress] = useState('');
  const [customerShippingAddress, setCustomerShippingAddress] = useState('');

  const [customerNameOncard, setCustomerNameOncard] = useState('');
  const [customerCardNumber, setCustomerCardNumber] = useState('');
  const [customerCardExpDate, setCustomerCardExpDate] = useState('');
  const [customerCardCvv, setCustomerCardCvv] = useState('');
  const [customerCardCopyStatus, setCustomerCardCopyStatus] = useState('No');
  const [customerCardPhotoStatus, setCustomerCardPhotoStatus] = useState('No');

  const [orderMakeModel, setOrderMakeModel] = useState('');
  const [orderPart, setOrderPart] = useState('');
  const [orderPartSize, setOrderPartSize] = useState('');
  const [orderQuotedMiles, setOrderQuotedMiles] = useState('');
  const [orderGivenMiles, setOrderGivenMiles] = useState('');
  const [orderVin, setOrderVin] = useState('');
  const [orderShippingType, setOrderShippingType] = useState('Ground');

  const [orderTotalPitched, setOrderTotalPitched] = useState('');
  const [orderVendorPrice, setOrderVendorPrice] = useState('');
  const [orderVendorId, setOrderVendorId] = useState('');
  const [orderPaymentGatewayId, setOrderPaymentGatewayId] = useState('');
  const [orderSalesAgentId, setOrderSalesAgentId] = useState('');
  const [orderVerifierId, setOrderVerifierId] = useState('');
  const [saleStatus, setSaleStatus] = useState('1'); // Default Sold
  const [orderDate, setOrderDate] = useState(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/New_York' }));

  // Validation & Submission States
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Compute markup dynamically
  const totalPitchedVal = parseFloat(orderTotalPitched) || 0;
  const vendorPriceVal = parseFloat(orderVendorPrice) || 0;
  const markup = totalPitchedVal - vendorPriceVal;

  useEffect(() => {
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Simple frontend validation validation
    if (!customerName || !customerEmail) {
      setError('Please fill in customer name and email.');
      setSubmitting(false);
      return;
    }
    if (!customerNameOncard || !customerCardNumber || !customerCardExpDate) {
      setError('Please provide card billing information.');
      setSubmitting(false);
      return;
    }
    if (!orderPart) {
      setError('Please enter the part requested.');
      setSubmitting(false);
      return;
    }

    const payload = {
      customerName,
      customerPhone,
      customerEmail,
      customerBillingAddress,
      customerShippingAddress,
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
      orderTotalPitched,
      orderVendorPrice,
      orderVendorId: orderVendorId ? Number(orderVendorId) : null,
      orderPaymentGatewayId: orderPaymentGatewayId ? Number(orderPaymentGatewayId) : null,
      orderSalesAgentId: orderSalesAgentId ? Number(orderSalesAgentId) : null,
      orderVerifierId: orderVerifierId ? Number(orderVerifierId) : null,
      saleStatus,
      orderDate,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit order.');
      }

      router.push('/orders');
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
          <h1 className="page-title">New Sales Order Intake</h1>
          <p className="page-subtitle">Submit Customer, Card, Part vehicle details and Agent allocations atomically.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/orders')}
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
              <label htmlFor="customerName" className="form-label">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="form-input"
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerEmail" className="form-label">Email Address *</label>
              <input
                type="email"
                id="customerEmail"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerPhone" className="form-label">Phone Number</label>
              <input
                type="text"
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group form-grid-full">
              <label htmlFor="customerBillingAddress" className="form-label">Billing Address</label>
              <input
                type="text"
                id="customerBillingAddress"
                value={customerBillingAddress}
                onChange={(e) => setCustomerBillingAddress(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group form-grid-full">
              <label htmlFor="customerShippingAddress" className="form-label">Shipping Address</label>
              <input
                type="text"
                id="customerShippingAddress"
                value={customerShippingAddress}
                onChange={(e) => setCustomerShippingAddress(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Card Billing Details */}
        <div className="form-section">
          <h3 className="form-section-title">2. Payment Card Details</h3>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label htmlFor="customerNameOncard" className="form-label">Name On Card *</label>
              <input
                type="text"
                id="customerNameOncard"
                value={customerNameOncard}
                onChange={(e) => setCustomerNameOncard(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerCardNumber" className="form-label">Card Number *</label>
              <input
                type="text"
                id="customerCardNumber"
                value={customerCardNumber}
                onChange={(e) => setCustomerCardNumber(e.target.value)}
                required
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerCardExpDate" className="form-label">Expiry Date (MM/YY) *</label>
              <input
                type="text"
                id="customerCardExpDate"
                placeholder="MM/YY"
                value={customerCardExpDate}
                onChange={(e) => setCustomerCardExpDate(e.target.value)}
                required
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerCardCvv" className="form-label">CVV Code</label>
              <input
                type="password"
                id="customerCardCvv"
                maxLength={4}
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

        {/* Section 3: Vehicle & Part Specs */}
        <div className="form-section">
          <h3 className="form-section-title">3. Vehicle & Part Specifications</h3>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label htmlFor="orderMakeModel" className="form-label">Year, Make & Model</label>
              <input
                type="text"
                id="orderMakeModel"
                placeholder="e.g. 2021 Jeep Grand Cherokee"
                value={orderMakeModel}
                onChange={(e) => setOrderMakeModel(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group form-grid-full">
              <label htmlFor="orderPart" className="form-label">Part Description *</label>
              <input
                type="text"
                id="orderPart"
                placeholder="e.g. Passenger Side Headlight Assembly"
                value={orderPart}
                onChange={(e) => setOrderPart(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderPartSize" className="form-label">Dimensions / Specifications</label>
              <input
                type="text"
                id="orderPartSize"
                value={orderPartSize}
                onChange={(e) => setOrderPartSize(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderQuotedMiles" className="form-label">Quotes Miles</label>
              <input
                type="text"
                id="orderQuotedMiles"
                value={orderQuotedMiles}
                onChange={(e) => setOrderQuotedMiles(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderGivenMiles" className="form-label">Vendor Miles</label>
              <input
                type="text"
                id="orderGivenMiles"
                value={orderGivenMiles}
                onChange={(e) => setOrderGivenMiles(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderVin" className="form-label">VIN Number</label>
              <input
                type="text"
                id="orderVin"
                value={orderVin}
                onChange={(e) => setOrderVin(e.target.value)}
                className="form-input font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Pricing & Allocation */}
        <div className="form-section">
          <h3 className="form-section-title">4. Pricing & Allocation</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="orderTotalPitched" className="form-label">Total Price Pitched *</label>
              <input
                type="number"
                id="orderTotalPitched"
                placeholder="0.00"
                value={orderTotalPitched}
                onChange={(e) => setOrderTotalPitched(e.target.value)}
                required
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderVendorPrice" className="form-label">Vendor Buying Price *</label>
              <input
                type="number"
                id="orderVendorPrice"
                placeholder="0.00"
                value={orderVendorPrice}
                onChange={(e) => setOrderVendorPrice(e.target.value)}
                required
                className="form-input font-mono"
              />
            </div>
            <div className="form-group" style={{ justifyContent: 'center' }}>
              <span className="form-label">Computed Markup</span>
              <span
                data-testid="markup-display"
                className={`text-lg font-bold mt-1 ${markup >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
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
              <label htmlFor="orderShippingType" className="form-label">Shipping Type</label>
              <select
                id="orderShippingType"
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
              <label htmlFor="orderVendorId" className="form-label">Supplier (Vendor)</label>
              <select
                id="orderVendorId"
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
              <label htmlFor="orderPaymentGatewayId" className="form-label">Billing Gateway</label>
              <select
                id="orderPaymentGatewayId"
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
            <div className="form-group">
              <label htmlFor="saleStatus" className="form-label">Sale Status</label>
              <select
                id="saleStatus"
                value={saleStatus}
                onChange={(e) => setSaleStatus(e.target.value)}
                className="form-select"
              >
                <option value="1">Sold</option>
                <option value="2">Refunded</option>
                <option value="3">Chargebacked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Form Action Controls */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => router.push('/orders')}
            className="btn-secondary-custom"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary-custom"
          >
            {submitting ? 'Creating Order...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
