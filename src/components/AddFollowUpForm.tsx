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

export default function AddFollowUpForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerCountry: 'USA',
    customerState: '',
    vehicleYearMakeModel: '',
    partRequired: '',
    partDescription: '',
    quotedOptions: '',
    followUpDate: '',
    followUpTime: '',
    followUpReason: REASON_OPTIONS[0],
    customReason: '',
    status: STATUS_OPTIONS[0],
    priority: PRIORITY_OPTIONS[1], // Medium default
    notes: '',
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
      const response = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone || null,
          customerState: formData.customerState,
          customerCountry: formData.customerCountry,
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
        throw new Error(errData.error || 'Failed to create follow-up.');
      }

      router.push('/follow-ups');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="follow-up-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gridTemplateAreas: '"title actions" "fields fields"', gap: '16px 24px', alignItems: 'start' }}>
      <div className="follow-up-title-area" style={{ gridArea: 'title' }}>
        <h1 className="page-title">Schedule New Follow-Up</h1>
        <p className="page-subtitle">
          Create a follow-up record. The timezone is automatically calculated based on state.
        </p>
      </div>

      <div className="follow-up-fields-area" style={{ gridArea: 'fields' }}>
        <div className="order-form-layout">
        <div className="order-form-main flex flex-col gap-6 form-compact">
          {error && (


          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Section 1: Customer Information */}
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
                placeholder="e.g. John Smith"
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
                placeholder="e.g. 555-123-4567"
              />
            </div>

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
          </div>
        </div>

        {/* Section 2: Vehicle & Part Specs */}
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
                placeholder="e.g. 2018 Honda Civic"
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
                placeholder="e.g. Front Bumper"
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

        {/* Section 3: Pricing Options */}
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

      </div>

      {/* Sidebar Info */}
      <div className="order-form-sidebar flex flex-col gap-6" style={{ height: 'fit-content' }}>

        {/* Card 2: Classification & Schedule */}
        <div className="profile-main" style={{ padding: '20px' }}>
          <h3 className="form-section-title" style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
            Classification and Schedule
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stacked Date and Time inputs */}
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
                  style={{ display: 'none' }}
                  required
                />
                {(() => {
                  const parseFollowUpTime = (timeStr: string) => {
                    if (!timeStr) return { hour12: '12', minute: '00', ampm: 'AM' };
                    const [h24, m] = timeStr.split(':');
                    const h24Num = parseInt(h24, 10);
                    const mStr = m || '00';
                    
                    let hour12 = h24Num % 12;
                    if (hour12 === 0) hour12 = 12;
                    const ampm = h24Num >= 12 ? 'PM' : 'AM';
                    
                    return {
                      hour12: String(hour12),
                      minute: mStr,
                      ampm
                    };
                  };

                  const build24HourTime = (h12: string, m: string, ap: string): string => {
                    let h12Num = parseInt(h12, 10);
                    if (ap === 'PM') {
                      if (h12Num !== 12) h12Num += 12;
                    } else {
                      if (h12Num === 12) h12Num = 0;
                    }
                    return `${String(h12Num).padStart(2, '0')}:${m}`;
                  };

                  const timeParts = parseFollowUpTime(formData.followUpTime);

                  const handlePartChange = (part: 'hour12' | 'minute' | 'ampm', val: string) => {
                    const newParts = { ...timeParts, [part]: val };
                    const new24Time = build24HourTime(newParts.hour12, newParts.minute, newParts.ampm);
                    setFormData(prev => ({ ...prev, followUpTime: new24Time }));
                  };

                  return (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        value={timeParts.hour12}
                        onChange={(e) => handlePartChange('hour12', e.target.value)}
                        className="form-select"
                        style={{ flex: 1 }}
                        aria-label="Follow-Up Hour"
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select
                        value={timeParts.minute}
                        onChange={(e) => handlePartChange('minute', e.target.value)}
                        className="form-select"
                        style={{ flex: 1 }}
                        aria-label="Follow-Up Minute"
                      >
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select
                        value={timeParts.ampm}
                        onChange={(e) => handlePartChange('ampm', e.target.value)}
                        className="form-select"
                        style={{ width: '80px' }}
                        aria-label="Follow-Up AM/PM"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  );
                })()}
              </div>
            {/* End Stacked Date and Time */}

            <div className="form-group">
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
              <div className="form-group">
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
        </div>

        {/* Card 3: Notes / Remarks */}
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
    </div>
  </div>

      <div className="follow-up-actions-area" style={{ gridArea: 'actions', display: 'flex', alignItems: 'center', gap: '12px' }}>


        <Link href="/follow-ups" className="btn-secondary-custom">
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary-custom"
        >
          {submitting ? 'Creating...' : 'Create Follow-Up'}
        </button>
      </div>
    </form>


  );
}
