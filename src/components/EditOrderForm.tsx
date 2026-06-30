'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fadeInPage } from '../lib/animations';

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
  const [firstName, setFirstName] = useState(order.customer.firstName || '');
  const [lastName, setLastName] = useState(order.customer.lastName || '');
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
  const [orderVerifierId, setOrderVerifierId] = useState(order.orderVerifierId ? String(order.orderVerifierId) : '');
  const [saleStatus, setSaleStatus] = useState(order.saleStatus || '1');
  const [orderCurrentStatus, setOrderCurrentStatus] = useState(order.orderCurrentStatus || 'Pending Booking');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

    if (!firstName || !lastName || !customerEmail) {
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
      firstName,
      lastName,
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
      orderVerifierId: orderVerifierId ? Number(orderVerifierId) : null,
      saleStatus,
      orderCurrentStatus,
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
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
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
              <label className="form-label">Quoted Mileage</label>
              <input
                type="text"
                value={orderQuotedMiles}
                onChange={(e) => setOrderQuotedMiles(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vendor Mileage</label>
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
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sale Classification</label>
              <select
                value={saleStatus}
                onChange={(e) => setSaleStatus(e.target.value)}
                className="form-select"
              >
                <option value="1">Sold</option>
                <option value="2">Prospect</option>
                <option value="3">Call Back</option>
                <option value="4">Not Interested</option>
                <option value="5">Out Of Scope</option>
                <option value="6">Enquiry</option>
                <option value="7">Refunded</option>
                <option value="8">Chargebacked</option>
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
              <label className="form-label">Sales Agent</label>
              <select
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
              <label className="form-label">QA Verifier</label>
              <select
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
    </div>
  );
}
