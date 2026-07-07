'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fadeInPage } from '../lib/animations';
import { getCurrentEstDateTime, convertEstToUtc } from '../lib/date';
import DealSummarySidebar from './DealSummarySidebar';

interface AddOrderFormProps {
  vendors: Array<{ vendorId: number; vendorName: string }>;
  gateways: Array<{ gatewayId: number; gatewayName: string }>;
  agents: Array<{ uid: number; name: string; nickname?: string | null }>;
}

interface PartFormState {
  orderMakeModel: string;
  orderPart: string;
  orderPartSize: string;
  orderQuotedMilesAndWarranty: string;
  orderVendorMilesAndWarranty: string;
  orderChecklist: string;
  orderVin: string;
  orderShippingType: string;
  orderTotalPitched: string;
  orderVendorPrice: string;
  orderAmountCharged: string;
  orderVendorId: string;
  orderPaymentGatewayId: string;
  orderSalesAgentId: string;
  orderSalesVerifierId: string;
  orderBackendExecutiveId: string;
  orderVerifierId: string;
  orderPartFoundById: string;
  orderLiftgateNeeded: string;
  saleStatus: string;
  orderRefundAmount: string;
  orderCurrentStatus: string;
  orderVendorFeedback: string;
}

export default function AddOrderForm({ vendors, gateways, agents }: AddOrderFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultAgentSet = useRef(false);

  // Customer states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAlternatePhone1, setCustomerAlternatePhone1] = useState('');
  const [customerAlternatePhone2, setCustomerAlternatePhone2] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerBillingAddress, setCustomerBillingAddress] = useState('');
  const [customerShippingAddress, setCustomerShippingAddress] = useState('');

  const [cards, setCards] = useState([
    {
      customerNameOncard: '',
      customerCardNumber: '',
      customerCardExpDate: '',
      customerCardCvv: '',
      customerCardCopyStatus: 'No',
      customerCardPhotoStatus: 'No',
      amountToCharge: '',
      customerCardCopyImage: null as string | null,
      customerPhotoIdImage: null as string | null,
    }
  ]);

  const [parts, setParts] = useState<PartFormState[]>([
    {
      orderMakeModel: '',
      orderPart: '',
      orderPartSize: '',
      orderQuotedMilesAndWarranty: '',
      orderVendorMilesAndWarranty: '',
      orderChecklist: 'No',
      orderVin: '',
      orderShippingType: 'Residential',
      orderTotalPitched: '',
      orderVendorPrice: '',
      orderAmountCharged: '',
      orderVendorId: '',
      orderPaymentGatewayId: '',
      orderSalesAgentId: '',
      orderSalesVerifierId: '',
      orderBackendExecutiveId: '',
      orderVerifierId: '',
      orderPartFoundById: '',
      orderLiftgateNeeded: 'No',
      saleStatus: '1',
      orderRefundAmount: '',
      orderCurrentStatus: 'Pending Booking',
      orderVendorFeedback: 'Positive',
    }
  ]);

  const [primaryPartIndex, setPrimaryPartIndex] = useState(0);

  // Status modal states
  const [priorSaleStatus, setPriorSaleStatus] = useState('1');
  const [showStatusDateModal, setShowStatusDateModal] = useState(false);
  const [saleStatusChangeDateInput, setSaleStatusChangeDateInput] = useState('');
  const [saleStatusChangeTimeInput, setSaleStatusChangeTimeInput] = useState('');
  const [saleStatusChangeDate, setSaleStatusChangeDate] = useState('');
  const [activeStatusPartIndex, setActiveStatusPartIndex] = useState<number | null>(null);

  const [orderDate, setOrderDate] = useState(() =>
    new Date().toLocaleDateString('sv-SE', { timeZone: 'America/New_York' })
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (containerRef.current) {
      fadeInPage(containerRef.current);
    }
  }, []);

  // Pre-fill default sales agent from session
  useEffect(() => {
    if (session?.user && agents.length > 0 && !defaultAgentSet.current) {
      const userId = (session.user as any).uid || (session.user as any).id;
      if (userId) {
        const matched = agents.find((a) => a.uid === Number(userId));
        if (matched) {
          setParts((prevParts) =>
            prevParts.map((p, idx) =>
              idx === 0 ? { ...p, orderSalesAgentId: String(matched.uid) } : p
            )
          );
          defaultAgentSet.current = true;
        }
      }
    }
  }, [session, agents]);

  const handleAddPart = () => {
    // Shared defaults copied from primary / first card
    const source = parts[0];
    setParts([
      ...parts,
      {
        orderMakeModel: source.orderMakeModel || '',
        orderPart: '',
        orderPartSize: '',
        orderQuotedMilesAndWarranty: '',
        orderVendorMilesAndWarranty: '',
        orderChecklist: 'No',
        orderVin: source.orderVin || '',
        orderShippingType: 'Residential',
        orderTotalPitched: '',
        orderVendorPrice: '',
        orderAmountCharged: '',
        orderVendorId: '',
        orderPaymentGatewayId: source.orderPaymentGatewayId || '',
        orderSalesAgentId: source.orderSalesAgentId || '',
        orderSalesVerifierId: source.orderSalesVerifierId || '',
        orderBackendExecutiveId: source.orderBackendExecutiveId || '',
        orderVerifierId: source.orderVerifierId || '',
        orderPartFoundById: '',
        orderLiftgateNeeded: source.orderLiftgateNeeded || 'No',
        saleStatus: '1',
        orderRefundAmount: '',
        orderCurrentStatus: 'Pending Booking',
        orderVendorFeedback: 'Positive',
      }
    ]);
  };

  const handleRemovePart = (index: number) => {
    if (parts.length <= 1) return;
    const newParts = [...parts];
    newParts.splice(index, 1);
    setParts(newParts);

    if (primaryPartIndex === index) {
      setPrimaryPartIndex(0);
    } else if (primaryPartIndex > index) {
      setPrimaryPartIndex(primaryPartIndex - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!customerName || !customerEmail) {
      setError('Please fill in customer name and email.');
      setSubmitting(false);
      return;
    }
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].orderPart) {
        setError(`Please enter the part requested for Part #${i + 1}.`);
        setSubmitting(false);
        return;
      }
      if (!parts[i].orderTotalPitched || !parts[i].orderVendorPrice) {
        setError(`Please fill out price and vendor cost details for Part #${i + 1}.`);
        setSubmitting(false);
        return;
      }
    }

    try {
      // Reorder parts so that the primary part (at primaryPartIndex) is at index 0
      const orderedParts = [...parts];
      if (primaryPartIndex > 0 && primaryPartIndex < orderedParts.length) {
        const primary = orderedParts.splice(primaryPartIndex, 1)[0];
        orderedParts.unshift(primary);
      }

      const payload = {
        customerName,
        customerPhone,
        customerAlternatePhone1: customerAlternatePhone1 || null,
        customerAlternatePhone2: customerAlternatePhone2 || null,
        customerEmail,
        customerBillingAddress,
        customerShippingAddress,
        cards: cards.map((c) => ({
          customerNameOncard: c.customerNameOncard,
          customerCardNumber: c.customerCardNumber,
          customerCardExpDate: c.customerCardExpDate,
          customerCardCvv: c.customerCardCvv,
          customerCardCopyStatus: c.customerCardCopyStatus,
          customerCardPhotoStatus: c.customerCardPhotoStatus,
          amountToCharge: c.amountToCharge || null,
          customerCardCopyImage: c.customerCardCopyImage || null,
          customerPhotoIdImage: c.customerPhotoIdImage || null,
        })),
        orderDate,
        saleStatusChangeDate: saleStatusChangeDate || null,
        primaryPartIndex: 0, // Since we reordered it to index 0

        // Root level fields for primary deal order
        orderMakeModel: orderedParts[0].orderMakeModel || null,
        orderPart: orderedParts[0].orderPart || null,
        orderPartSize: orderedParts[0].orderPartSize || null,
        orderQuotedMilesAndWarranty: orderedParts[0].orderQuotedMilesAndWarranty || null,
        orderVendorMilesAndWarranty: orderedParts[0].orderVendorMilesAndWarranty || null,
        orderChecklist: orderedParts[0].orderChecklist || 'No',
        orderVin: orderedParts[0].orderVin || null,
        orderShippingType: orderedParts[0].orderShippingType || 'Residential',
        orderTotalPitched: orderedParts[0].orderTotalPitched || null,
        orderVendorPrice: orderedParts[0].orderVendorPrice || null,
        orderAmountCharged: orderedParts[0].orderAmountCharged || null,
        orderVendorId: orderedParts[0].orderVendorId ? Number(orderedParts[0].orderVendorId) : null,
        orderPaymentGatewayId: orderedParts[0].orderPaymentGatewayId ? Number(orderedParts[0].orderPaymentGatewayId) : null,
        orderSalesAgentId: orderedParts[0].orderSalesAgentId ? Number(orderedParts[0].orderSalesAgentId) : null,
        orderSalesVerifierId: orderedParts[0].orderSalesVerifierId ? Number(orderedParts[0].orderSalesVerifierId) : null,
        orderBackendExecutiveId: orderedParts[0].orderBackendExecutiveId ? Number(orderedParts[0].orderBackendExecutiveId) : null,
        orderVerifierId: orderedParts[0].orderVerifierId ? Number(orderedParts[0].orderVerifierId) : null,
        orderPartFoundById: orderedParts[0].orderPartFoundById ? Number(orderedParts[0].orderPartFoundById) : null,
        orderLiftgateNeeded: orderedParts[0].orderLiftgateNeeded || 'No',
        saleStatus: orderedParts[0].saleStatus || '1',
        orderRefundAmount: orderedParts[0].saleStatus === '4' ? orderedParts[0].orderRefundAmount : null,
        orderCurrentStatus: orderedParts[0].orderCurrentStatus || 'Pending Booking',
        orderVendorFeedback: orderedParts[0].orderVendorFeedback || 'Positive',

        parts: orderedParts.map((p) => ({
          orderMakeModel: p.orderMakeModel || null,
          orderPart: p.orderPart || null,
          orderPartSize: p.orderPartSize || null,
          orderQuotedMilesAndWarranty: p.orderQuotedMilesAndWarranty || null,
          orderVendorMilesAndWarranty: p.orderVendorMilesAndWarranty || null,
          orderChecklist: p.orderChecklist || 'No',
          orderVin: p.orderVin || null,
          orderShippingType: p.orderShippingType || 'Residential',
          orderTotalPitched: p.orderTotalPitched || null,
          orderVendorPrice: p.orderVendorPrice || null,
          orderAmountCharged: p.orderAmountCharged || null,
          orderVendorId: p.orderVendorId ? Number(p.orderVendorId) : null,
          orderPaymentGatewayId: p.orderPaymentGatewayId ? Number(p.orderPaymentGatewayId) : null,
          orderSalesAgentId: p.orderSalesAgentId ? Number(p.orderSalesAgentId) : null,
          orderSalesVerifierId: p.orderSalesVerifierId ? Number(p.orderSalesVerifierId) : null,
          orderBackendExecutiveId: p.orderBackendExecutiveId ? Number(p.orderBackendExecutiveId) : null,
          orderVerifierId: p.orderVerifierId ? Number(p.orderVerifierId) : null,
          orderPartFoundById: p.orderPartFoundById ? Number(p.orderPartFoundById) : null,
          orderLiftgateNeeded: p.orderLiftgateNeeded || 'No',
          saleStatus: p.saleStatus || '1',
          orderRefundAmount: p.saleStatus === '4' ? p.orderRefundAmount : null,
          orderCurrentStatus: p.orderCurrentStatus || 'Pending Booking',
          orderVendorFeedback: p.orderVendorFeedback || 'Positive',
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create orders');
      }

      router.push('/orders');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      setSubmitting(false);
    }
  };

  const combinedPitched = parts.reduce((sum, p) => sum + (parseFloat(p.orderTotalPitched) || 0), 0);
  const combinedCost = parts.reduce((sum, p) => sum + (parseFloat(p.orderVendorPrice) || 0), 0);
  const combinedMargin = combinedPitched - combinedCost;
  const combinedCharged = parts.reduce((sum, p) => sum + (parseFloat(p.orderAmountCharged) || 0), 0);
  const combinedRefund = parts.reduce((sum, p) => sum + (parseFloat(p.orderRefundAmount) || 0), 0);

  return (
    <div ref={containerRef} className="agents-page-container" style={{ opacity: 0 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Create New Sales Order</h1>
          <p className="page-subtitle">Add customer details, payment cards, and parts deal structures.</p>
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

      <div className="order-form-layout">
        <form id="add-order-form" onSubmit={handleSubmit} className="form-card form-card-georgia order-form-main">
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
                  className="form-input"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="form-group">
                <label htmlFor="customerEmail" className="form-label">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  id="customerEmail"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
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
              <div className="form-group">
                <label htmlFor="customerAlternatePhone1" className="form-label">Alternate Phone 1</label>
                <input
                  type="text"
                  id="customerAlternatePhone1"
                  value={customerAlternatePhone1}
                  onChange={(e) => setCustomerAlternatePhone1(e.target.value)}
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group">
                <label htmlFor="customerAlternatePhone2" className="form-label">Alternate Phone 2</label>
                <input
                  type="text"
                  id="customerAlternatePhone2"
                  value={customerAlternatePhone2}
                  onChange={(e) => setCustomerAlternatePhone2(e.target.value)}
                  className="form-input font-mono"
                />
              </div>
              <div className="form-group form-grid-full">
                <label htmlFor="customerBillingAddress" className="form-label">Billing Address</label>
                <textarea
                  id="customerBillingAddress"
                  value={customerBillingAddress}
                  onChange={(e) => setCustomerBillingAddress(e.target.value)}
                  className="form-textarea"
                  rows={3}
                />
              </div>
              <div className="form-group form-grid-full">
                <label htmlFor="customerShippingAddress" className="form-label">Shipping Address</label>
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

          {/* Section 2: Payment Cards */}
          <div className="form-section">
            <h3 className="form-section-title">2. Payment Card Details</h3>
            {cards.map((card, index) => (
              <div key={index} style={{ position: 'relative', border: '1px solid #cbd5e1', borderRadius: '10px', marginBottom: '24px', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <h4 className="font-semibold text-slate-700 text-sm">Payment Card #{index + 1}</h4>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newCards = [...cards];
                        newCards.splice(index, 1);
                        setCards(newCards);
                      }}
                      title="Remove Card"
                      className="text-red-500 hover:text-red-700 font-semibold text-xs"
                      style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                    >
                      Remove Card
                    </button>
                  )}
                </div>

                <div style={{ padding: '24px' }}>
                  <div className="form-grid">
                    <div className="form-group form-grid-full">
                      <label htmlFor={`customerNameOncard-${index}`} className="form-label">Name On Card <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        id={`customerNameOncard-${index}`}
                        value={card.customerNameOncard}
                        onChange={(e) => {
                          const newCards = [...cards];
                          newCards[index].customerNameOncard = e.target.value;
                          setCards(newCards);
                        }}
                        required
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`customerCardNumber-${index}`} className="form-label">Card Number <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        id={`customerCardNumber-${index}`}
                        value={card.customerCardNumber}
                        onChange={(e) => {
                          const newCards = [...cards];
                          newCards[index].customerCardNumber = e.target.value;
                          setCards(newCards);
                        }}
                        required
                        className="form-input font-mono"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`customerCardExpDate-${index}`} className="form-label">Expiry Date (MM/YY) <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        id={`customerCardExpDate-${index}`}
                        value={card.customerCardExpDate}
                        onChange={(e) => {
                          const newCards = [...cards];
                          newCards[index].customerCardExpDate = e.target.value;
                          setCards(newCards);
                        }}
                        required
                        className="form-input font-mono"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`customerCardCvv-${index}`} className="form-label">CVV Code</label>
                      <input
                        type="password"
                        maxLength={4}
                        id={`customerCardCvv-${index}`}
                        value={card.customerCardCvv}
                        onChange={(e) => {
                          const newCards = [...cards];
                          newCards[index].customerCardCvv = e.target.value;
                          setCards(newCards);
                        }}
                        className="form-input font-mono"
                      />
                    </div>
                    {cards.length > 1 && (
                      <div className="form-group">
                        <label htmlFor={`amountToCharge-${index}`} className="form-label">Amount to Charge</label>
                        <input
                          type="text"
                          id={`amountToCharge-${index}`}
                          placeholder="0.00"
                          value={card.amountToCharge || ''}
                          onChange={(e) => {
                            const newCards = [...cards];
                            newCards[index].amountToCharge = e.target.value;
                            setCards(newCards);
                          }}
                          className="form-input font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <div className="flex flex-col gap-2">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={card.customerCardCopyStatus === 'Yes'}
                          onChange={(e) => {
                            const newCards = [...cards];
                            const checked = e.target.checked;
                            newCards[index].customerCardCopyStatus = checked ? 'Yes' : 'No';
                            if (!checked) newCards[index].customerCardCopyImage = null;
                            setCards(newCards);
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span className="text-sm font-semibold text-slate-700">Card copy received</span>
                      </label>
                      {card.customerCardCopyStatus === 'Yes' && (
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', border: '1px dashed #94a3b8', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}>
                            Upload Card Scan
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newCards = [...cards];
                                    newCards[index].customerCardCopyImage = reader.result as string;
                                    setCards(newCards);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {card.customerCardCopyImage && (
                            <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                              <img src={card.customerCardCopyImage} alt="Card Copy Preview" style={{ maxHeight: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={card.customerCardPhotoStatus === 'Yes'}
                          onChange={(e) => {
                            const newCards = [...cards];
                            const checked = e.target.checked;
                            newCards[index].customerCardPhotoStatus = checked ? 'Yes' : 'No';
                            if (!checked) newCards[index].customerPhotoIdImage = null;
                            setCards(newCards);
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span className="text-sm font-semibold text-slate-700">Photo ID received</span>
                      </label>
                      {card.customerCardPhotoStatus === 'Yes' && (
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px', border: '1px dashed #94a3b8', borderRadius: '6px', backgroundColor: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '0.82rem' }}>
                            Upload Photo ID
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newCards = [...cards];
                                    newCards[index].customerPhotoIdImage = reader.result as string;
                                    setCards(newCards);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {card.customerPhotoIdImage && (
                            <div style={{ marginTop: '12px', position: 'relative', display: 'inline-block' }}>
                              <img src={card.customerPhotoIdImage} alt="Photo ID Preview" style={{ maxHeight: '80px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                setCards([...cards, {
                  customerNameOncard: '',
                  customerCardNumber: '',
                  customerCardExpDate: '',
                  customerCardCvv: '',
                  customerCardCopyStatus: 'No',
                  customerCardPhotoStatus: 'No',
                  amountToCharge: '',
                  customerCardCopyImage: null,
                  customerPhotoIdImage: null
                }]);
              }}
              className="btn-secondary-custom w-full mt-2 py-2"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <span>+ Add Another Card</span>
            </button>
          </div>

          {/* Section: Sale Date */}
          <div className="form-section">
            <h3 className="form-section-title">Global Sale Configurations</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="orderDate" className="form-label">Sale Date</label>
                <input
                  type="date"
                  id="orderDate"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Hidden elements for compatibility with existing tests */}
          <span data-testid="combined-pitched-display" style={{ display: 'none' }}>${combinedPitched.toFixed(2)}</span>
          <span data-testid="combined-margin-display" style={{ display: 'none' }}>${combinedMargin.toFixed(2)}</span>

          {/* Section 3-6: Loop for parts */}
          {parts.map((part, index) => {
            const pitchedVal = parseFloat(part.orderTotalPitched) || 0;
            const vendorVal = parseFloat(part.orderVendorPrice) || 0;
            const partMarkup = pitchedVal - vendorVal;

            return (
              <div key={index} className="part-card-container" style={{ position: 'relative', border: '1px solid #cbd5e1', borderRadius: '10px', marginBottom: '32px', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                  <h4 className="font-semibold text-slate-700 text-sm" style={{ margin: 0 }}>Part Specification #{index + 1}</h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569', cursor: 'pointer', margin: 0 }}>
                      <input
                        type="radio"
                        name="primaryPartIndex"
                        checked={primaryPartIndex === index}
                        onChange={() => setPrimaryPartIndex(index)}
                        aria-label="Primary"
                        style={{ cursor: 'pointer' }}
                      />
                      <span className="font-semibold text-slate-700">Primary Deal Order</span>
                    </label>

                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePart(index)}
                        title="Remove Part"
                        className="text-red-500 hover:text-red-700 font-semibold text-xs"
                        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                      >
                        Remove Part
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Subcategory 1: Vehicle & part Specs */}
                  <div className="part-subcategory-group" style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      Vehicle & part Specs
                    </h4>
                    <div className="form-grid">
                      <div className="form-group form-grid-full">
                        <label htmlFor={index === 0 ? "orderPart" : `orderPart-${index}`} className="form-label">
                          Part Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={index === 0 ? "orderPart" : `orderPart-${index}`}
                          placeholder="e.g. Passenger Side Headlight Assembly"
                          value={part.orderPart}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderPart = e.target.value;
                            setParts(newParts);
                          }}
                          required
                          className="form-input"
                        />
                      </div>

                      <div className="form-group form-grid-full">
                        <label htmlFor={index === 0 ? "orderMakeModel" : `orderMakeModel-${index}`} className="form-label">
                          Year, Make & Model
                        </label>
                        <input
                          type="text"
                          id={index === 0 ? "orderMakeModel" : `orderMakeModel-${index}`}
                          placeholder="e.g. 2021 Jeep Grand Cherokee"
                          value={part.orderMakeModel}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderMakeModel = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`orderPartSize-${index}`} className="form-label">
                          Dimensions / Specifications
                        </label>
                        <input
                          type="text"
                          id={`orderPartSize-${index}`}
                          value={part.orderPartSize}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderPartSize = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`orderQuotedMilesAndWarranty-${index}`} className="form-label">
                          Quoted Miles and Warranty
                        </label>
                        <input
                          type="text"
                          id={`orderQuotedMilesAndWarranty-${index}`}
                          value={part.orderQuotedMilesAndWarranty}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderQuotedMilesAndWarranty = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-input font-mono"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={`orderVendorMilesAndWarranty-${index}`} className="form-label">
                          Vendor Miles and Warranty
                        </label>
                        <input
                          type="text"
                          id={`orderVendorMilesAndWarranty-${index}`}
                          value={part.orderVendorMilesAndWarranty}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderVendorMilesAndWarranty = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-input font-mono"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderVin" : `orderVin-${index}`} className="form-label">
                          VIN Number
                        </label>
                        <input
                          type="text"
                          id={index === 0 ? "orderVin" : `orderVin-${index}`}
                          value={part.orderVin}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderVin = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-input font-mono uppercase"
                          maxLength={17}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subcategory 2: Pricing & Allocation */}
                  <div className="part-subcategory-group" style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      Pricing $ Allocation
                    </h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderTotalPitched" : `orderTotalPitched-${index}`} className="form-label">
                          Total Price Pitched <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id={index === 0 ? "orderTotalPitched" : `orderTotalPitched-${index}`}
                          placeholder="0.00"
                          value={part.orderTotalPitched}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderTotalPitched = e.target.value;
                            setParts(newParts);
                          }}
                          required
                          className="form-input font-mono"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderVendorPrice" : `orderVendorPrice-${index}`} className="form-label">
                          Vendor Buying Price <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id={index === 0 ? "orderVendorPrice" : `orderVendorPrice-${index}`}
                          placeholder="0.00"
                          value={part.orderVendorPrice}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderVendorPrice = e.target.value;
                            setParts(newParts);
                          }}
                          required
                          className="form-input font-mono"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderAmountCharged" : `orderAmountCharged-${index}`} className="form-label">
                          Charged Amount
                        </label>
                        <input
                          type="number"
                          id={index === 0 ? "orderAmountCharged" : `orderAmountCharged-${index}`}
                          placeholder="0.00"
                          value={part.orderAmountCharged}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderAmountCharged = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-input font-mono"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Net Margin</label>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span
                            data-testid={index === 0 ? "markup-display" : `markup-display-${index}`}
                            className={`text-2xl font-bold ${partMarkup >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            ${partMarkup.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderPaymentGatewayId" : `orderPaymentGatewayId-${index}`} className="form-label">
                          Payment Gateway
                        </label>
                        <select
                          id={index === 0 ? "orderPaymentGatewayId" : `orderPaymentGatewayId-${index}`}
                          value={part.orderPaymentGatewayId}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderPaymentGatewayId = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-select"
                        >
                          <option value="">-- Select Gateway --</option>
                          {gateways.map((g) => (
                            <option key={g.gatewayId} value={g.gatewayId}>{g.gatewayName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderVendorId" : `orderVendorId-${index}`} className="form-label">
                          Supplier (Vendor)
                        </label>
                        <select
                          id={index === 0 ? "orderVendorId" : `orderVendorId-${index}`}
                          value={part.orderVendorId}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderVendorId = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-select"
                        >
                          <option value="">-- Assign Supplier --</option>
                          {vendors.map((v) => (
                            <option key={v.vendorId} value={v.vendorId}>{v.vendorName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderShippingType" : `orderShippingType-${index}`} className="form-label">
                          Shipping Type
                        </label>
                        <select
                          id={index === 0 ? "orderShippingType" : `orderShippingType-${index}`}
                          value={part.orderShippingType}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderShippingType = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-select"
                        >
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={`orderVendorFeedback-${index}`} className="form-label">
                          Vendor Feedback
                        </label>
                        <select
                          id={`orderVendorFeedback-${index}`}
                          value={part.orderVendorFeedback}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderVendorFeedback = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-select"
                        >
                          <option value="Positive">Positive</option>
                          <option value="Negative">Negative</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Subcategory 3: Team Allocation */}
                  <div className="part-subcategory-group" style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      Team Allocation
                    </h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderSalesAgentId" : `orderSalesAgentId-${index}`} className="form-label">
                          Sales Agent
                        </label>
                        <select
                          id={index === 0 ? "orderSalesAgentId" : `orderSalesAgentId-${index}`}
                          value={part.orderSalesAgentId}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderSalesAgentId = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-select"
                        >
                          <option value="">Select or type name</option>
                          {agents.map((a) => (
                            <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderSalesVerifierId" : `orderSalesVerifierId-${index}`} className="form-label">
                          Sales Verifier
                        </label>
                        <select
                          id={index === 0 ? "orderSalesVerifierId" : `orderSalesVerifierId-${index}`}
                          value={part.orderSalesVerifierId}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderSalesVerifierId = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-select"
                        >
                          <option value="">Select or type name</option>
                          {agents.map((a) => (
                            <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderBackendExecutiveId" : `orderBackendExecutiveId-${index}`} className="form-label">
                          Backend Executive
                        </label>
                        <select
                          id={index === 0 ? "orderBackendExecutiveId" : `orderBackendExecutiveId-${index}`}
                          value={part.orderBackendExecutiveId}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderBackendExecutiveId = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-select"
                        >
                          <option value="">Select or type name</option>
                          {agents.map((a) => (
                            <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderPartFoundById" : `orderPartFoundById-${index}`} className="form-label">
                          Part Found By
                        </label>
                        <select
                          id={index === 0 ? "orderPartFoundById" : `orderPartFoundById-${index}`}
                          value={part.orderPartFoundById}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderPartFoundById = e.target.value;
                            setParts(newParts);
                          }}
                          className="form-select"
                        >
                          <option value="">Select or type name</option>
                          {agents.map((a) => (
                            <option key={a.uid} value={a.uid}>{a.nickname || a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor={index === 0 ? "orderVerifierId" : `orderVerifierId-${index}`} className="form-label">
                          QA Verifier
                        </label>
                        <select
                          id={index === 0 ? "orderVerifierId" : `orderVerifierId-${index}`}
                          value={part.orderVerifierId}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderVerifierId = e.target.value;
                            setParts(newParts);
                          }}
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

                  {/* Subcategory 4: Order Status */}
                  <div className="part-subcategory-group" style={{ marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      Order Status
                    </h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor={index === 0 ? "saleStatus" : `saleStatus-${index}`} className="form-label">
                          Sale Status
                        </label>
                        <select
                          id={index === 0 ? "saleStatus" : `saleStatus-${index}`}
                          value={part.saleStatus}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newParts = [...parts];
                            newParts[index].saleStatus = val;
                            if (val === '2' || val === '3' || val === '4' || val === '5') {
                              setPriorSaleStatus(part.saleStatus);
                              newParts[index].orderCurrentStatus = 'Returned Orders';
                              if (val === '2' || val === '3' || val === '5') {
                                newParts[index].orderRefundAmount = part.orderAmountCharged || '';
                              }
                              const est = getCurrentEstDateTime();
                              setSaleStatusChangeDateInput(est.date);
                              setSaleStatusChangeTimeInput(est.time);
                              setActiveStatusPartIndex(index);
                              setShowStatusDateModal(true);
                            } else if (val === '6') {
                              newParts[index].orderCurrentStatus = 'Cancelled Orders';
                              newParts[index].orderRefundAmount = '';
                            } else {
                              newParts[index].orderCurrentStatus = 'Pending Booking';
                              newParts[index].orderRefundAmount = '';
                            }
                            setParts(newParts);
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
                        <label htmlFor={index === 0 ? "orderCurrentStatus" : `orderCurrentStatus-${index}`} className="form-label">
                          Workflow Queue
                        </label>
                        <select
                          id={index === 0 ? "orderCurrentStatus" : `orderCurrentStatus-${index}`}
                          value={part.orderCurrentStatus}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderCurrentStatus = e.target.value;
                            setParts(newParts);
                          }}
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    <div className="flex flex-col gap-2">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          id={index === 0 ? "orderChecklist" : `orderChecklist-${index}`}
                          checked={part.orderChecklist === 'Yes'}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderChecklist = e.target.checked ? 'Yes' : 'No';
                            setParts(newParts);
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span className="text-sm font-semibold text-slate-700">Checklist by backend</span>
                      </label>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          id={index === 0 ? "orderLiftgateNeeded" : `orderLiftgateNeeded-${index}`}
                          checked={part.orderLiftgateNeeded === 'Yes'}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[index].orderLiftgateNeeded = e.target.checked ? 'Yes' : 'No';
                            setParts(newParts);
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span className="text-sm font-semibold text-slate-700">Liftgate Needed</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddPart}
            className="btn-secondary-custom w-full mt-2 py-3"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: '2px dashed #cbd5e1' }}
          >
            <span>+ Add Another Part</span>
          </button>

          {/* Form Action Controls */}
          <div className="form-actions desktop-actions-only" style={{ marginTop: '32px' }}>
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

        <div className="order-form-sidebar">
          <DealSummarySidebar
            customerName={customerName}
            customerEmail={customerEmail}
            customerPhone={customerPhone}
            customerBillingAddress={customerBillingAddress}
            customerShippingAddress={customerShippingAddress}
            customerCardCopyStatus={cards[0]?.customerCardCopyStatus || 'No'}
            customerCardPhotoStatus={cards[0]?.customerCardPhotoStatus || 'No'}
            customerNameOncard={cards[0]?.customerNameOncard || ''}
            customerCardNumber={cards[0]?.customerCardNumber || ''}
            customerCardExpDate={cards[0]?.customerCardExpDate || ''}
            customerCardCvv={cards[0]?.customerCardCvv || ''}
            orderPaymentGatewayId={parts[0]?.orderPaymentGatewayId || ''}
            orderChecklist={parts[0]?.orderChecklist || 'No'}
            orderMakeModel={parts[0]?.orderMakeModel || ''}
            orderPart={parts[0]?.orderPart || ''}
            orderPartSize={parts[0]?.orderPartSize || ''}
            orderQuotedMilesAndWarranty={parts[0]?.orderQuotedMilesAndWarranty || ''}
            orderVendorMilesAndWarranty={parts[0]?.orderVendorMilesAndWarranty || ''}
            orderVin={parts[0]?.orderVin || ''}
            orderTotalPitched={String(combinedPitched)}
            orderVendorPrice={String(combinedCost)}
            orderAmountCharged={String(combinedCharged)}
            orderRefundAmount={String(combinedRefund)}
            orderDate={orderDate}
            orderShippingType={parts[0]?.orderShippingType || 'Residential'}
            orderVendorId={parts[0]?.orderVendorId || ''}
            orderVendorFeedback={parts[0]?.orderVendorFeedback || 'Positive'}
            orderSalesAgentId={parts[0]?.orderSalesAgentId || ''}
            orderSalesVerifierId={parts[0]?.orderSalesVerifierId || ''}
            orderBackendExecutiveId={parts[0]?.orderBackendExecutiveId || ''}
            orderVerifierId={parts[0]?.orderVerifierId || ''}
            saleStatus={parts[0]?.saleStatus || '1'}
            orderCurrentStatus={parts[0]?.orderCurrentStatus || 'Pending Booking'}
            parts={parts}
          />
        </div>
      </div>

      {mounted && showStatusDateModal && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if (activeStatusPartIndex !== null) {
                const newParts = [...parts];
                newParts[activeStatusPartIndex].saleStatus = priorSaleStatus;
                newParts[activeStatusPartIndex].orderRefundAmount = '';
                setParts(newParts);
              }
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
                if (activeStatusPartIndex !== null) {
                  const newParts = [...parts];
                  newParts[activeStatusPartIndex].saleStatus = priorSaleStatus;
                  newParts[activeStatusPartIndex].orderRefundAmount = '';
                  setParts(newParts);
                }
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
            >
              &times;
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Record Sale Status Details
              </h3>
            </div>

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

              {activeStatusPartIndex !== null && parts[activeStatusPartIndex]?.saleStatus === '4' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="orderRefundAmount" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase' }}>Refund Amount *:</label>
                  <input 
                    id="orderRefundAmount"
                    type="number" 
                    step="0.01"
                    placeholder="e.g. 50.00"
                    value={activeStatusPartIndex !== null ? parts[activeStatusPartIndex].orderRefundAmount : ''}
                    onChange={(e) => {
                      if (activeStatusPartIndex !== null) {
                        const newParts = [...parts];
                        newParts[activeStatusPartIndex].orderRefundAmount = e.target.value;
                        setParts(newParts);
                      }
                    }}
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
                If left blank, the current date and time will be recorded automatically.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (activeStatusPartIndex !== null) {
                    const newParts = [...parts];
                    newParts[activeStatusPartIndex].saleStatus = priorSaleStatus;
                    newParts[activeStatusPartIndex].orderRefundAmount = '';
                    setParts(newParts);
                  }
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
                  if (activeStatusPartIndex !== null && parts[activeStatusPartIndex].saleStatus === '4' && !parts[activeStatusPartIndex].orderRefundAmount) {
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
