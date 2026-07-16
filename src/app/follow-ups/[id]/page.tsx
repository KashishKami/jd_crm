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
import { formatPhoneNumber } from '../../../lib/formatPhone';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Follow Up Details - JD CRM',
  description: 'View follow-up schedules, pricing options, customer timezone metadata, and notes',
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

  const formatFollowUpTime = (dateVal: Date | string, timeStr: string, tz: string) => {
    let dateStr = '';
    if (dateVal instanceof Date) {
      dateStr = DateTime.fromJSDate(dateVal).setZone(tz).toFormat('yyyy-MM-dd');
    } else {
      dateStr = dateVal.split('T')[0];
    }
    const dt = DateTime.fromISO(`${dateStr}T${timeStr}`, { zone: tz });
    if (!dt.isValid) return { time: timeStr, date: dateStr, offset: '' };
    return {
      time: dt.toFormat('h:mm a'),
      date: dt.toFormat('LLL d, yyyy'),
      offset: dt.offsetNameShort
    };
  };

  const daysLabel = followupService.computeDaysLabel(
    record.followUpDate,
    record.followUpTime,
    record.customerTimezone
  );

  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'status-dot-badge priority-high';
      case 'medium':
        return 'status-dot-badge priority-medium';
      case 'low':
        return 'status-dot-badge priority-low';
      default:
        return 'status-dot-badge badge-future';
    }
  };

  const getDaysLabelBadgeClass = (label: string): string => {
    if (label?.startsWith('Due by')) {
      return 'status-dot-badge badge-overdue';
    }
    if (label === 'Today') {
      return 'status-dot-badge badge-today';
    }
    if (label === 'Tomorrow') {
      return 'status-dot-badge badge-tomorrow';
    }
    return 'status-dot-badge badge-future';
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
        @media (min-width: 1025px) {
          .order-form-sidebar {
            width: 410px !important;
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
         .follow-up-details-container,
        .follow-up-details-container * {
          font-family: Georgia, serif !important;
        }
        .status-dot-badge {
          display: inline-flex !important;
          align-items: center !important;
          font-weight: 600 !important;
          font-size: 0.75rem !important;
          padding: 4px 10px !important;
          border-radius: 50px !important;
          width: fit-content !important;
        }
      `}} />
      
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Follow Up Details #{record.followUpId}</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Prospect follow-up scheduled for {record.customerName}
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
                    <span className="info-value font-mono">
                      {record.customerPhone ? formatPhoneNumber(record.customerPhone) : '—'}
                    </span>
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
                  <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                    <span className="form-label">Description of the Part</span>
                    <span className="info-value text-slate-700 whitespace-pre-wrap">
                      {record.partDescription || <span className="text-slate-400 italic">No description provided.</span>}
                    </span>
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
          {/* Card 1: Notes / Remarks */}
          <div className="profile-main" style={{ padding: '20px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '12px', fontSize: '0.95rem' }}>
              Notes or Remarks
            </h3>
            <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-lg text-sm text-slate-700 whitespace-pre-wrap min-h-[100px]">
              {record.notes || <span className="text-slate-400 italic">No notes written.</span>}
            </div>
          </div>

          {/* Card 2: Classification & Schedule */}
          <div className="profile-main" style={{ padding: '20px' }}>
            <h3 className="form-section-title" style={{ marginBottom: '16px', fontSize: '0.95rem' }}>
              Classification and Schedule
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px 20px' }}>
              <div className="form-group">
                <span className="form-label">Status</span>
                <span className="info-value font-semibold">{record.status}</span>
              </div>
              <div className="form-group">
                <span className="form-label">Priority</span>
                <span className={getPriorityBadgeClass(record.priority)} style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  {record.priority}
                </span>
              </div>
              <div className="form-group">
                <span className="form-label">Follow-Up Time</span>
                <span className="info-value font-bold text-slate-800" style={{ fontSize: '0.85rem', display: 'block', lineHeight: '1.4' }}>
                  {(() => {
                    const formatted = formatFollowUpTime(record.followUpDate, record.followUpTime, record.customerTimezone);
                    return (
                      <>
                        <div>{formatted.time} on {formatted.date}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b', marginTop: '2px' }}>({formatted.offset})</div>
                      </>
                    );
                  })()}
                </span>
              </div>
              <div className="form-group">
                <span className="form-label">Relative Day</span>
                <span className={getDaysLabelBadgeClass(daysLabel)} style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  {daysLabel}
                </span>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <span className="form-label">Reason</span>
                <span className="info-value">{record.followUpReason}</span>
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
                  {DateTime.fromJSDate(record.entryDate || record.createdAt).setZone('America/New_York').toFormat('LLL d, yyyy · h:mm a') + ' EST'}
                </span>
              </div>
              <div className="form-group">
                <span className="form-label">Last Contact Update</span>
                <span className="info-value font-mono">
                  {record.lastContact 
                    ? DateTime.fromJSDate(record.lastContact).setZone('America/New_York').toFormat('LLL d, yyyy · h:mm a') + ' EST'
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
