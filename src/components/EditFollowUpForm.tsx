'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRY_STATE_MAP, STATE_TIMEZONE_MAP } from '../lib/geography';
import { formatPhoneNumber } from '../lib/formatPhone';

const REASON_OPTIONS = [
  'Waiting for customer decision',
  'Customer asked to call tomorrow',
  'Waiting for paycheck',
  'Waiting for mechanic approval',
  'Waiting for spouse approval',
  'Waiting for VIN',
  'Sent invoice',
  'Payment reminder',
  'Other (Please specify)',
];

const STATUS_OPTIONS = [
  'Interested',
  'Call Back Later',
  'No Answer',
  'Busy',
  'Voicemail',
  'Waiting for Paycheck',
  'Sale Closed',
  'Not Interested',
  'Price Too High',
  'Purchased Elsewhere',
  'Wrong Number',
  'Spanish',
];

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

const timezoneLabels: Record<string, string> = {
  'America/New_York': 'Eastern Time — America/New_York',
  'America/Chicago': 'Central Time — America/Chicago',
  'America/Denver': 'Mountain Time — America/Denver',
  'America/Phoenix': 'Mountain Standard Time — America/Phoenix',
  'America/Los_Angeles': 'Pacific Time — America/Los_Angeles',
  'America/Anchorage': 'Alaska Time — America/Anchorage',
  'Pacific/Honolulu': 'Hawaii Time — Pacific/Honolulu',
  'America/Halifax': 'Atlantic Time — America/Halifax',
  'America/St_Johns': 'Newfoundland Time — America/St_Johns',
  'America/Regina': 'Central Standard Time — America/Regina',
  'America/Toronto': 'Eastern Time — America/Toronto',
  'America/Vancouver': 'Pacific Time — America/Vancouver',
  'America/Winnipeg': 'Central Time — America/Winnipeg',
  'America/Edmonton': 'Mountain Time — America/Edmonton',
  'America/Indiana/Indianapolis': 'Eastern Time — America/Indiana/Indianapolis',
};

interface EditFollowUpFormProps {
  record: any;
}

export default function EditFollowUpForm({ record }: EditFollowUpFormProps) {
  const router = useRouter();

  const isOtherReason = record.followUpReason?.startsWith('Other: ');
  const initialReason = isOtherReason ? 'Other (Please specify)' : record.followUpReason;
  const initialCustomReason = isOtherReason ? record.followUpReason.substring(7) : '';

  const [formData, setFormData] = useState({
    customerName: record.customerName || '',
    customerPhone: formatPhoneNumber(record.customerPhone || ''),
    customerCountry: record.customerCountry || 'USA',
    customerState: record.customerState || '',
    vehicleYearMakeModel: record.vehicleYearMakeModel || '',
    partRequired: record.partRequired || '',
    partDescription: record.partDescription || '',
    quotedOptions: record.quotedOptions || '',
    followUpDate: record.followUpDate
      ? (record.followUpDate instanceof Date
          ? record.followUpDate.toISOString().split('T')[0]
          : String(record.followUpDate).split('T')[0])
      : '',
    followUpTime: record.followUpTime || '',
    followUpReason: initialReason || REASON_OPTIONS[0],
    customReason: initialCustomReason || '',
    status: record.status || STATUS_OPTIONS[0],
    priority: record.priority || PRIORITY_OPTIONS[1],
    notes: record.notes || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'customerCountry') {
      setFormData((prev) => ({
        ...prev,
        customerCountry: value,
        customerState: '',
      }));
    } else if (name === 'customerPhone') {
      setFormData((prev) => ({
        ...prev,
        customerPhone: formatPhoneNumber(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      followUpReason: value,
      customReason: value === 'Other (Please specify)' ? '' : prev.customReason,
    }));
  };

  const selectedState = formData.customerState;
  const inferredIana = STATE_TIMEZONE_MAP[selectedState] || '';
  const inferredTzDisplay = inferredIana
    ? timezoneLabels[inferredIana] || inferredIana
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!formData.customerName) {
      setError('Customer Name is required.');
      setSubmitting(false);
      return;
    }

    if (!formData.customerState) {
      setError('Customer State/Province is required.');
      setSubmitting(false);
      return;
    }

    const finalReason =
      formData.followUpReason === 'Other (Please specify)'
        ? `Other: ${formData.customReason}`
        : formData.followUpReason;

    try {
      const response = await fetch(`/api/follow-ups/${record.followUpId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone || null,
          customerState: formData.customerState,
          customerCountry: formData.customerCountry,
          customerTimezone: inferredIana || record.customerTimezone,
          vehicleYearMakeModel: formData.vehicleYearMakeModel,
          partRequired: formData.partRequired,
          partDescription: formData.partDescription || null,
          quotedOptions: formData.quotedOptions || null,
          followUpDate: formData.followUpDate,
          followUpTime: formData.followUpTime,
          followUpReason: finalReason,
          status: formData.status,
          priority: formData.priority,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update follow-up.');
      }

      // Clear list cache since we modified data
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('cached_followups_')) {
          sessionStorage.removeItem(key);
        }
      }

      router.push(`/follow-ups/${record.followUpId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const isCustomerFilled = !!formData.customerName;
  const isVehicleFilled = !!formData.vehicleYearMakeModel && !!formData.partRequired;
  const isLocationFilled = !!formData.customerState;
  const isPricingFilled = !!formData.quotedOptions;
  const isScheduleFilled = !!formData.followUpDate && !!formData.followUpTime && !!formData.followUpReason;
  const filledCount = [isCustomerFilled, isVehicleFilled, isLocationFilled, isPricingFilled, isScheduleFilled].filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="order-form-layout">
      <div className="order-form-main flex flex-col gap-6 form-compact">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Section 1: Customer Info */}
        <div className="profile-main" style={{ padding: '24px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '20px' }}>Customer Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerName" className="form-label">
                Customer Name *
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerPhone" className="form-label">
                Phone Number
              </label>
              <input
                type="text"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className="form-input font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Vehicle & Part */}
        <div className="profile-main" style={{ padding: '24px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '20px' }}>Vehicle & Part</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="vehicleYearMakeModel" className="form-label">
                Year, Make & Model *
              </label>
              <input
                type="text"
                id="vehicleYearMakeModel"
                name="vehicleYearMakeModel"
                value={formData.vehicleYearMakeModel}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="partRequired" className="form-label">
                Part Required *
              </label>
              <input
                type="text"
                id="partRequired"
                name="partRequired"
                value={formData.partRequired}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="partDescription" className="form-label">
                Part Description
              </label>
              <textarea
                id="partDescription"
                name="partDescription"
                value={formData.partDescription}
                onChange={handleChange}
                className="form-input min-h-[80px] py-2"
                placeholder="e.g. Color preference, condition details, specific trim requirements, etc."
              />
            </div>
          </div>
        </div>

        {/* Section 3: Location */}
        <div className="profile-main" style={{ padding: '24px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '20px' }}>Location</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerCountry" className="form-label">
                Country
              </label>
              <select
                id="customerCountry"
                name="customerCountry"
                value={formData.customerCountry}
                onChange={handleChange}
                className="form-select"
              >
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customerState" className="form-label">
                State/Province *
              </label>
              <select
                id="customerState"
                name="customerState"
                value={formData.customerState}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">-- Select State/Province --</option>
                {COUNTRY_STATE_MAP[formData.customerCountry]?.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            {inferredTzDisplay && (
              <div className="form-group form-grid-full">
                <label className="form-label">Inferred Customer Timezone</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium">
                  {inferredTzDisplay}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Pricing Options */}
        <div className="profile-main" style={{ padding: '24px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '20px' }}>Pricing Options</h3>
          <div className="form-group form-grid-full">
            <label htmlFor="quotedOptions" className="form-label">
              Quoted Options
            </label>
            <textarea
              id="quotedOptions"
              name="quotedOptions"
              value={formData.quotedOptions}
              onChange={handleChange}
              className="form-textarea min-h-[100px] font-mono"
              placeholder={"Price - miles/warranty\nPrice - miles/warranty"}
            />
            <p className="text-xs text-slate-500 mt-1 italic">
              * Press Enter to write multiple follow-up pricing options.
            </p>
          </div>
        </div>

        {/* Section 5: Follow-Up Schedule */}
        <div className="profile-main" style={{ padding: '24px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '20px' }}>Follow-Up Schedule</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="followUpDate" className="form-label">
                Follow-Up Date *
              </label>
              <input
                type="date"
                id="followUpDate"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="followUpTime" className="form-label">
                Follow-Up Time *
              </label>
              <input
                type="time"
                id="followUpTime"
                name="followUpTime"
                value={formData.followUpTime}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group form-grid-full">
              <label htmlFor="followUpReason" className="form-label">
                Follow-Up Reason *
              </label>
              <select
                id="followUpReason"
                name="followUpReason"
                value={formData.followUpReason}
                onChange={handleReasonChange}
                className="form-select"
                required
              >
                {REASON_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {formData.followUpReason === 'Other (Please specify)' && (
              <div className="form-group form-grid-full">
                <label htmlFor="customReason" className="form-label">
                  Specify Reason *
                </label>
                <input
                  type="text"
                  id="customReason"
                  name="customReason"
                  value={formData.customReason}
                  onChange={handleChange}
                  className="form-input"
                  required
                  placeholder="Write specific follow-up reason..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Classification */}
        <div className="profile-main" style={{ padding: '24px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '20px' }}>Classification</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
                required
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority *
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
                required
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="form-actions desktop-actions-only" style={{ marginTop: '24px' }}>
          <Link
            href={`/follow-ups/${record.followUpId}`}
            className="btn-secondary-custom"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary-custom"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="order-form-sidebar flex flex-col gap-6" style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
        {/* Card 1: Form Progress */}
        <div className="profile-main" style={{ padding: '20px' }}>
          <h4 style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 16px 0',
          }}>
            Progress ({filledCount}/5)
          </h4>

          {/* Progress Bar Segments */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: isCustomerFilled ? '#10b981' : '#e2e8f0', transition: 'background-color 0.25s ease' }} />
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: isVehicleFilled ? '#10b981' : '#e2e8f0', transition: 'background-color 0.25s ease' }} />
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: isLocationFilled ? '#10b981' : '#e2e8f0', transition: 'background-color 0.25s ease' }} />
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: isPricingFilled ? '#10b981' : '#e2e8f0', transition: 'background-color 0.25s ease' }} />
            <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: isScheduleFilled ? '#10b981' : '#e2e8f0', transition: 'background-color 0.25s ease' }} />
          </div>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: isCustomerFilled ? '#10b981' : '#cbd5e1', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {isCustomerFilled ? '✓' : '○'}
              </span>
              <span style={{ color: isCustomerFilled ? '#1e293b' : '#64748b' }}>Customer Name & Contact</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: isVehicleFilled ? '#10b981' : '#cbd5e1', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {isVehicleFilled ? '✓' : '○'}
              </span>
              <span style={{ color: isVehicleFilled ? '#1e293b' : '#64748b' }}>Vehicle & Part Specs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: isLocationFilled ? '#10b981' : '#cbd5e1', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {isLocationFilled ? '✓' : '○'}
              </span>
              <span style={{ color: isLocationFilled ? '#1e293b' : '#64748b' }}>State / Province Location</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: isPricingFilled ? '#10b981' : '#cbd5e1', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {isPricingFilled ? '✓' : '○'}
              </span>
              <span style={{ color: isPricingFilled ? '#1e293b' : '#64748b' }}>Pricing Options</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: isScheduleFilled ? '#10b981' : '#cbd5e1', fontSize: '1.1rem', fontWeight: 'bold' }}>
                {isScheduleFilled ? '✓' : '○'}
              </span>
              <span style={{ color: isScheduleFilled ? '#1e293b' : '#64748b' }}>Follow-Up Time & Reason</span>
            </div>
          </div>
        </div>

        {/* Card 2: Notes / Remarks */}
        <div className="profile-main" style={{ padding: '20px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '12px', fontSize: '0.95rem' }}>
            Notes / Follow-Up Remarks
          </h3>
          <div className="form-group form-grid-full">
            <label htmlFor="notes" className="form-label" style={{ display: 'none' }}>
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-textarea min-h-[150px]"
              placeholder="Write free-form follow-up remarks..."
            />
          </div>
        </div>
      </div>

      <div className="form-actions mobile-actions-only" style={{ marginTop: '24px' }}>
        <Link
          href={`/follow-ups/${record.followUpId}`}
          className="btn-secondary-custom"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary-custom"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
