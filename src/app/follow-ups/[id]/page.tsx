import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { DateTime } from 'luxon';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { hasPermission } from '../../../service/permission.service';
import * as followupService from '../../../service/followup.service';
import BackButton from '../../../components/BackButton';
import DeleteFollowUpButton from '../../../components/DeleteFollowUpButton';
import DetailPageMarker from '../../../components/DetailPageMarker';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Callback Details - JD CRM',
  description: 'View callback schedules, pricing options, customer timezone metadata, and notes',
};

export default async function FollowUpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const { id } = await params;
  const followUpId = Number(id);
  if (isNaN(followUpId)) {
    notFound();
  }

  let record;
  try {
    record = await followupService.getFollowUpById(session.user as any, followUpId);
  } catch (error: any) {
    if (error.message.includes('Forbidden')) {
      redirect('/access-denied');
    }
    throw error;
  }

  if (!record) {
    notFound();
  }

  const permissions = session.user.userPermissions || '';
  const canViewAll = hasPermission(permissions, 'follow-ups:view');
  const canEdit = hasPermission(permissions, 'follow-ups:create');

  const formatCallbackTime = (dateVal: Date | string, timeStr: string, tz: string): string => {
    let dateStr = '';
    if (dateVal instanceof Date) {
      dateStr = DateTime.fromJSDate(dateVal).setZone(tz).toFormat('yyyy-MM-dd');
    } else {
      dateStr = dateVal.split('T')[0];
    }
    const dt = DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: tz });
    if (!dt.isValid) return `${dateStr} · ${timeStr}`;
    return `${dt.toFormat('LLL d, yyyy · h:mm a')} ${dt.offsetNameShort}`;
  };

  const daysLabel = followupService.computeDaysLabel(
    record.followUpDate,
    record.followUpTime,
    record.customerTimezone
  );

  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-rose-50 text-rose-700 border border-rose-200/50';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border border-amber-200/50';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/50';
      default:
        return 'bg-slate-50 text-slate-500 border border-slate-200/50';
    }
  };

  return (
    <div className="agents-page-container follow-up-details-container">
      <DetailPageMarker />
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .main-content:has(.follow-up-details-container) {
            padding-left: 20% !important;
            padding-right: 20% !important;
          }
        }
        .header-actions-flex {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          align-items: center !important;
          gap: 6px !important;
          width: auto !important;
        }
        .header-actions-flex > *,
        .header-actions-flex > button,
        .header-actions-flex > a {
          white-space: nowrap !important;
          width: auto !important;
          flex: 0 0 auto !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          
          /* Fluid typography and padding based on viewport width */
          font-size: clamp(0.66rem, 1.2vw, 0.85rem) !important;
          padding: clamp(4px, 0.8vw, 8px) clamp(8px, 1.5vw, 16px) !important;
          height: clamp(28px, 3.2vw, 36px) !important;
          border-radius: 6px !important;
        }
      `}} />
      
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Callback Details #{record.followUpId}</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Prospect callback scheduled for {record.customerName}
          </p>
        </div>
        <div className="flex gap-3 header-actions-flex">
          <BackButton label="Back to List" />
          {canEdit && (
            <Link
              href={`/follow-ups/${record.followUpId}/edit`}
              className="btn-primary-custom"
              style={{ textDecoration: 'none' }}
            >
              Edit Follow-up
            </Link>
          )}
          {canViewAll && <DeleteFollowUpButton followUpId={record.followUpId} />}
        </div>
      </div>

      <div className="order-form-layout">
        {/* Main Details Section */}
        <div className="order-form-main flex flex-col gap-6">
          {/* Section 1: Customer Details */}
          <div className="profile-main" style={{ padding: '24px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
              Customer Information
            </h3>
            <div className="form-grid-3col form-compact" style={{ padding: '4px' }}>
              <div className="form-group form-span-3">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <span className="form-label">Customer Name</span>
                    <span className="info-value">{record.customerName}</span>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Phone Number</span>
                    <span className="info-value font-mono">{record.customerPhone || '—'}</span>
                  </div>
                </div>
              </div>
              <div className="form-group form-span-3">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <span className="form-label">State / Province</span>
                    <span className="info-value">{record.customerState}</span>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Country</span>
                    <span className="info-value">{record.customerCountry}</span>
                  </div>
                </div>
              </div>
              <div className="form-group form-span-3">
                <span className="form-label">Customer Timezone</span>
                <span className="info-value font-mono">{record.customerTimezone}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle & Part specifications */}
          <div className="profile-main" style={{ padding: '24px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
              Vehicle & Part Specifications
            </h3>
            <div className="form-grid-3col form-compact" style={{ padding: '4px' }}>
              <div className="form-group form-span-3">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <span className="form-label">Year, Make & Model</span>
                    <span className="info-value">{record.vehicleYearMakeModel}</span>
                  </div>
                  <div className="form-group">
                    <span className="form-label">Part Required</span>
                    <span className="info-value italic">{record.partRequired}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Quoted Pricing Options */}
          <div className="profile-main" style={{ padding: '24px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '20px' }}>
              Quoted Pricing Options
            </h3>
            <div style={{ padding: '4px' }}>
              {!record.quotedOptions ? (
                <span className="info-value italic text-slate-400">No quoted options provided.</span>
              ) : (
                <ul className="list-disc list-inside space-y-2 font-mono text-sm text-slate-700 bg-slate-50/50 p-4 border border-slate-100 rounded-lg">
                  {record.quotedOptions.split('\n').map((line, idx) => (
                    <li key={idx} className="py-0.5">{line}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>

        {/* Sidebar Info */}
        <div className="order-form-sidebar order-details-sidebar flex flex-col gap-6">
          {/* Card 1: Classification */}
          <div className="profile-main" style={{ padding: '20px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
              Classification
            </h3>
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <span className="form-label">Status</span>
                <span className="info-value font-semibold">{record.status}</span>
              </div>
              <div className="form-group">
                <span className="form-label">Priority</span>
                <span className={`inline-block mt-1 badge ${getPriorityBadgeClass(record.priority)}`}>
                  {record.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Notes / Remarks */}
          <div className="profile-main" style={{ padding: '20px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '12px', fontSize: '0.95rem' }}>
              Notes / Callback Remarks
            </h3>
            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-lg text-sm text-slate-700 whitespace-pre-wrap min-h-[100px]">
              {record.notes || <span className="text-slate-400 italic">No notes written.</span>}
            </div>
          </div>

          {/* Card 3: Follow-Up Schedule */}
          <div className="profile-main" style={{ padding: '20px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
              Follow-Up Schedule
            </h3>
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <span className="form-label">Callback Time (Customer Timezone)</span>
                <span className="info-value font-bold text-slate-800">
                  {formatCallbackTime(record.followUpDate, record.followUpTime, record.customerTimezone)}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <span className="form-label">Relative Day</span>
                  <span className="inline-block mt-1 bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {daysLabel}
                  </span>
                </div>
                <div className="form-group">
                  <span className="form-label">Reason</span>
                  <span className="info-value">{record.followUpReason}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: System Metadata */}
          <div className="profile-main" style={{ padding: '20px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
              System Metadata
            </h3>
            <div className="flex flex-col gap-4 text-xs">
              <div className="form-group">
                <span className="form-label">Created Agent</span>
                <span className="info-value font-medium">{record.agentName}</span>
              </div>
              <div className="form-group">
                <span className="form-label">Entry Timestamp</span>
                <span className="info-value font-mono">
                  {DateTime.fromJSDate(record.entryDate || record.createdAt).toFormat('yyyy-MM-dd HH:mm:ss')}
                </span>
              </div>
              <div className="form-group">
                <span className="form-label">Last Contact Update</span>
                <span className="info-value font-mono">
                  {record.lastContact 
                    ? DateTime.fromJSDate(record.lastContact).toFormat('yyyy-MM-dd HH:mm:ss')
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
