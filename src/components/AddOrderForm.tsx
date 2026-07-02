'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { fadeInPage } from '../lib/animations';
import { getCurrentEstDateTime, convertEstToUtc } from '../lib/date';

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
  const [orderQuotedMilesAndWarranty, setOrderQuotedMilesAndWarranty] = useState('');
  const [orderVendorMilesAndWarranty, setOrderVendorMilesAndWarranty] = useState('');
  const [orderChecklist, setOrderChecklist] = useState('No');
  const [orderVin, setOrderVin] = useState('');
  const [orderShippingType, setOrderShippingType] = useState('Ground');

  const [orderTotalPitched, setOrderTotalPitched] = useState('');
  const [orderVendorPrice, setOrderVendorPrice] = useState('');
  const [orderAmountCharged, setOrderAmountCharged] = useState('');
  const [orderVendorId, setOrderVendorId] = useState('');
  const [orderPaymentGatewayId, setOrderPaymentGatewayId] = useState('');
  const [orderSalesAgentId, setOrderSalesAgentId] = useState('');
  const [orderSalesVerifierId, setOrderSalesVerifierId] = useState('');
  const [orderBackendExecutiveId, setOrderBackendExecutiveId] = useState('');
  const [orderVerifierId, setOrderVerifierId] = useState('');
  const [saleStatus, setSaleStatus] = useState('1'); // Default Sold
  const [priorSaleStatus, setPriorSaleStatus] = useState('1');
  const [orderRefundAmount, setOrderRefundAmount] = useState('');
  const [showStatusDateModal, setShowStatusDateModal] = useState(false);
  const [saleStatusChangeDateInput, setSaleStatusChangeDateInput] = useState('');
  const [saleStatusChangeTimeInput, setSaleStatusChangeTimeInput] = useState('');
  const [saleStatusChangeDate, setSaleStatusChangeDate] = useState('');
  const [orderCurrentStatus, setOrderCurrentStatus] = useState('Pending Booking');
  const [orderDate, setOrderDate] = useState(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/New_York' }));
  const [orderVendorFeedback, setOrderVendorFeedback] = useState('Positive');

  // Validation & Submission States
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Compute markup dynamically
  const totalPitchedVal = parseFloat(orderTotalPitched) || 0;
  const vendorPriceVal = parseFloat(orderVendorPrice) || 0;
  const markup = totalPitchedVal - vendorPriceVal;

  useEffect(() => {
    setMounted(true);
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  // Auto-advance workflow queue if vendor is selected
  // Auto-advance workflow queue if sale status is refunded/chargebacked/void
  useEffect(() => {
    if (saleStatus === '2' || saleStatus === '3' || saleStatus === '5') {
      setOrderCurrentStatus('Returned Orders');
    } else if (saleStatus === '6') {
      setOrderCurrentStatus('Cancelled Orders');
    } else if (saleStatus === '1' || saleStatus === '4') {
      if (orderCurrentStatus === 'Returned Orders' || orderCurrentStatus === 'Cancelled Orders') {
        setOrderCurrentStatus('Pending Booking');
      }
    }
  }, [saleStatus, orderCurrentStatus]);

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
      orderQuotedMilesAndWarranty,
      orderVendorMilesAndWarranty,
      orderChecklist,
      orderVin,
      orderShippingType,
      orderTotalPitched,
      orderVendorPrice,
      orderAmountCharged,
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
      orderVendorFeedback,
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

      <form onSubmit={handleSubmit} className="form-card form-card-georgia">
        <style dangerouslySetInnerHTML={{ __html: `
          .form-card-georgia, .form-card-georgia input, .form-card-georgia select, .form-card-georgia textarea {
            font-family: Georgia, serif !important;
          }
        `}} />
        {/* Section 1: Customer Info */}
        <div className="form-section">
          <h3 className="form-section-title">1. Customer Information</h3>
          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label htmlFor="customerName" className="form-label">
                Customer Name <span className="text-red-500">*</span>
              </label>
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
              <label htmlFor="customerEmail" className="form-label">
                Email Address <span className="text-red-500">*</span>
              </label>
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
              <label htmlFor="customerPhone" className="form-label">
                Phone Number
              </label>
              <input
                type="text"
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group form-grid-full">
              <label htmlFor="customerBillingAddress" className="form-label">
                Billing Address
              </label>
              <textarea
                id="customerBillingAddress"
                value={customerBillingAddress}
                onChange={(e) => setCustomerBillingAddress(e.target.value)}
                className="form-textarea"
                rows={3}
              />
            </div>
            <div className="form-group form-grid-full">
              <label htmlFor="customerShippingAddress" className="form-label">
                Shipping Address
              </label>
              <textarea
                id="customerShippingAddress"
                value={customerShippingAddress}
                onChange={(e) => setCustomerShippingAddress(e.target.value)}
                className="form-textarea"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Card Billing Details */}
        <div className="form-section">
          <h3 className="form-section-title">2. Payment Card Details</h3>
          
          {/* Checkboxes placed under heading */}
          <div className="flex gap-6 items-center py-2 mb-4 border-b border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={customerCardCopyStatus === 'Yes'}
                onChange={(e) => setCustomerCardCopyStatus(e.target.checked ? 'Yes' : 'No')}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span className="form-label text-slate-700 font-medium" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Card Copy Verified</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={customerCardPhotoStatus === 'Yes'}
                onChange={(e) => setCustomerCardPhotoStatus(e.target.checked ? 'Yes' : 'No')}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span className="form-label text-slate-700 font-medium" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Photo ID Checked</span>
            </label>
          </div>

          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label htmlFor="customerNameOncard" className="form-label">
                Name On Card <span className="text-red-500">*</span>
              </label>
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
              <label htmlFor="customerCardNumber" className="form-label">
                Card Number <span className="text-red-500">*</span>
              </label>
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
              <label htmlFor="customerCardExpDate" className="form-label">
                Expiry Date (MM/YY) <span className="text-red-500">*</span>
              </label>
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
              <label htmlFor="customerCardCvv" className="form-label">
                CVV Code
              </label>
              <input
                type="password"
                id="customerCardCvv"
                maxLength={4}
                value={customerCardCvv}
                onChange={(e) => setCustomerCardCvv(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderPaymentGatewayId" className="form-label">
                Billing Gateway
              </label>
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
          </div>
        </div>

        {/* Section 3: Vehicle & Part Specs */}
        <div className="form-section">
          <h3 className="form-section-title">3. Vehicle & Part Specifications</h3>
          
          {/* Checklist checkbox under heading */}
          <div className="flex gap-6 items-center py-2 mb-4 border-b border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={orderChecklist === 'Yes'}
                onChange={(e) => setOrderChecklist(e.target.checked ? 'Yes' : 'No')}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span className="form-label text-slate-700 font-medium" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Checklist</span>
            </label>
          </div>

          <div className="form-grid">
            <div className="form-group form-grid-full">
              <label htmlFor="orderMakeModel" className="form-label">
                Year, Make & Model
              </label>
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
              <label htmlFor="orderPart" className="form-label">
                Part Description <span className="text-red-500">*</span>
              </label>
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
              <label htmlFor="orderPartSize" className="form-label">
                Dimensions / Specifications
              </label>
              <input
                type="text"
                id="orderPartSize"
                value={orderPartSize}
                onChange={(e) => setOrderPartSize(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderQuotedMilesAndWarranty" className="form-label">
                Quoted Miles and Warranty
              </label>
              <input
                type="text"
                id="orderQuotedMilesAndWarranty"
                value={orderQuotedMilesAndWarranty}
                onChange={(e) => setOrderQuotedMilesAndWarranty(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderVendorMilesAndWarranty" className="form-label">
                Vendor Miles and Warranty
              </label>
              <input
                type="text"
                id="orderVendorMilesAndWarranty"
                value={orderVendorMilesAndWarranty}
                onChange={(e) => setOrderVendorMilesAndWarranty(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label htmlFor="orderVin" className="form-label">
                VIN Number
              </label>
              <input
                type="text"
                id="orderVin"
                value={orderVin}
                onChange={(e) => setOrderVin(e.target.value)}
                className="form-input font-mono uppercase"
                maxLength={17}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                {orderVin.length}/17 characters
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Pricing & Allocation */}
        <div className="form-section">
          <h3 className="form-section-title">4. Pricing & Allocation</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="orderTotalPitched" className="form-label">
                Total Price Pitched <span className="text-red-500">*</span>
              </label>
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
              <label htmlFor="orderVendorPrice" className="form-label">
                Vendor Buying Price <span className="text-red-500">*</span>
              </label>
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
            <div className="form-group">
              <label htmlFor="orderAmountCharged" className="form-label">
                Charged Amount
              </label>
              <input
                type="number"
                id="orderAmountCharged"
                placeholder="0.00"
                value={orderAmountCharged}
                onChange={(e) => setOrderAmountCharged(e.target.value)}
                className="form-input font-mono"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                Computed Gross Spread
              </label>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  data-testid="markup-display"
                  className={`text-2xl font-bold ${markup >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  ${markup.toFixed(2)}
                </span>
              </div>
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
              <label htmlFor="orderShippingType" className="form-label">
                Shipping Type
              </label>
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
              <label htmlFor="orderVendorId" className="form-label">
                Supplier (Vendor)
              </label>
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
              <label htmlFor="orderVendorFeedback" className="form-label">
                Vendor Feedback
              </label>
              <select
                id="orderVendorFeedback"
                value={orderVendorFeedback}
                onChange={(e) => setOrderVendorFeedback(e.target.value)}
                className="form-select"
              >
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Team Allocation */}
        <div className="form-section">
          <h3 className="form-section-title">5. Team Allocation</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="orderSalesAgentId" className="form-label">
                Sales Agent
              </label>
              <select
                id="orderSalesAgentId"
                value={orderSalesAgentId}
                onChange={(e) => setOrderSalesAgentId(e.target.value)}
                className="form-select"
              >
                <option value="">Select or type name</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orderSalesVerifierId" className="form-label">
                Sales Verifier
              </label>
              <select
                id="orderSalesVerifierId"
                value={orderSalesVerifierId}
                onChange={(e) => setOrderSalesVerifierId(e.target.value)}
                className="form-select"
              >
                <option value="">Select or type name</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orderBackendExecutiveId" className="form-label">
                Backend Executive
              </label>
              <select
                id="orderBackendExecutiveId"
                value={orderBackendExecutiveId}
                onChange={(e) => setOrderBackendExecutiveId(e.target.value)}
                className="form-select"
              >
                <option value="">Select or type name</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orderVerifierId" className="form-label">
                QA Verifier
              </label>
              <select
                id="orderVerifierId"
                value={orderVerifierId}
                onChange={(e) => setOrderVerifierId(e.target.value)}
                className="form-select"
              >
                <option value="">Select or type name</option>
                {agents.map((a) => (
                  <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 6: Order Status */}
        <div className="form-section">
          <h3 className="form-section-title">6. Order Status</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="saleStatus" className="form-label">
                Sale Status
              </label>
              <select
                id="saleStatus"
                value={saleStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '2' || val === '3' || val === '4' || val === '5') {
                    setPriorSaleStatus(saleStatus);
                    setSaleStatus(val);
                    const est = getCurrentEstDateTime();
                    setSaleStatusChangeDateInput(est.date);
                    setSaleStatusChangeTimeInput(est.time);
                    setShowStatusDateModal(true);
                  } else {
                    setPriorSaleStatus(val);
                    setSaleStatus(val);
                    setSaleStatusChangeDate('');
                  }
                }}
                className="form-select"
              >
                <option value="1">Sold</option>
                <option value="2">Refunded</option>
                <option value="3">Chargebacked</option>
                <option value="4">Partial Refund</option>
                <option value="5">Void</option>
                <option value="6">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="orderCurrentStatus" className="form-label">
                Workflow Queue
              </label>
              <select
                id="orderCurrentStatus"
                value={orderCurrentStatus}
                onChange={(e) => setOrderCurrentStatus(e.target.value)}
                className="form-select"
              >
                <option value="Pending Booking">Pending Booking</option>
                <option value="Pending Shipment">Pending Shipment</option>
                <option value="Pending Delivery">Pending Delivery</option>
                <option value="Pending Feedback">Pending Feedback</option>
                <option value="Pending Resolutions">Pending Resolutions</option>
                <option value="Completed Orders">Completed Orders</option>
                <option value="Returned Orders">Returned Orders</option>
                <option value="Cancelled Orders">Cancelled Orders</option>
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

      {mounted && showStatusDateModal && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSaleStatus(priorSaleStatus);
              if (priorSaleStatus !== '4') {
                setOrderRefundAmount('');
              }
              setSaleStatusChangeDate('');
              setShowStatusDateModal(false);
            }
          }}
          style={{
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
          }}
        >
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
            gap: '16px',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => {
                setSaleStatus(priorSaleStatus);
                if (priorSaleStatus !== '4') {
                  setOrderRefundAmount('');
                }
                setSaleStatusChangeDate('');
                setShowStatusDateModal(false);
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                transition: 'all 0.2s',
                padding: 0,
                lineHeight: 1
              }}
              title="Close"
              aria-label="Close"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              &times;
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Record {saleStatus === '2' ? 'Refund' : saleStatus === '3' ? 'Chargeback' : saleStatus === '5' ? 'Void' : 'Partial Refund'} Details
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
                  setSaleStatus(priorSaleStatus);
                  if (priorSaleStatus !== '4') {
                    setOrderRefundAmount('');
                  }
                  setSaleStatusChangeDate('');
                  setShowStatusDateModal(false);
                }}
                className="btn-secondary-custom"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Cancel
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
