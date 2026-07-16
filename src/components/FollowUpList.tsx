'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { DateTime } from 'luxon';
import { hasPermission } from '../service/permission.service';
import FollowUpNotesPopup from './FollowUpNotesPopup';

interface FollowUpListProps {
  followUps: any[];
  canViewAll: boolean;
  onDelete: (id: number) => Promise<void>;
}

export default function FollowUpList({ followUps, canViewAll, onDelete }: FollowUpListProps) {
  const { data: session } = useSession();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [activeNotesFollowUp, setActiveNotesFollowUp] = useState<any | null>(null);

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

  const formatCallbackTime = (dateStr: string, timeStr: string, tz: string): string => {
    const pureDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const dt = DateTime.fromISO(`${pureDate}T${timeStr}`, { zone: tz });
    if (!dt.isValid) return `${dateStr} · ${timeStr}`;
    return `${dt.toFormat('LLL d, yyyy · h:mm a')} ${dt.offsetNameShort}`;
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

  const formatRelativeTime = (dateStr: string | Date | null): string => {
    if (!dateStr) return '—';
    const dt = typeof dateStr === 'string' ? DateTime.fromISO(dateStr) : DateTime.fromJSDate(dateStr);
    if (!dt.isValid) return '—';
    return dt.toRelative() || '—';
  };

  const formatQuotedOptions = (options: string | null): React.ReactNode => {
    if (!options) return '—';
    return (
      <div 
        style={{ 
          whiteSpace: 'pre-line', 
          fontSize: '0.74rem', 
          lineHeight: '1.3',
        }}
      >
        {options}
      </div>
    );
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this follow-up?')) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (err) {
      alert('Failed to delete follow-up.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="table-wrapper card-with-accent">
        <div className="card-table-container" style={{ padding: 0 }}>
          <table className="custom-table table-responsive">
            <thead>
              <tr>
                <th>Follow-Up Date & Time</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Part Required</th>
                <th>Quoted Options</th>
                {canViewAll && <th>Agent</th>}
                <th>Priority</th>
                <th>Status</th>
                <th>Last Contact</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {followUps.length === 0 ? (
                <tr>
                  <td colSpan={canViewAll ? 10 : 9} className="text-center text-slate-400 py-8">
                    No follow-ups found.
                  </td>
                </tr>
              ) : (
                followUps.map((f) => (
                  <tr key={f.followUpId}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="font-medium" style={{ color: 'var(--text-main)' }}>
                          {formatCallbackTime(f.followUpDate, f.followUpTime, f.customerTimezone)}
                        </span>
                        <div>
                          <span className={getDaysLabelBadgeClass(f.daysLabel)}>
                            {f.daysLabel}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-main)' }}>{f.customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {f.customerState}, {f.customerCountry}
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-main)' }}>
                      {f.customerPhone || '—'}
                    </td>
                    <td>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-main)' }}>{f.partRequired}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                          {f.vehicleYearMakeModel}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {formatQuotedOptions(f.quotedOptions)}
                    </td>
                    {canViewAll && (
                      <td className="font-medium" style={{ color: 'var(--text-main)' }}>
                        {f.agentName || '—'}
                      </td>
                    )}
                    <td>
                      <span className={getPriorityBadgeClass(f.priority)}>
                        {f.priority}
                      </span>
                    </td>
                    <td className="font-medium" style={{ color: 'var(--text-main)' }}>{f.status}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatRelativeTime(f.lastContact)}
                    </td>
                    <td className="actions-cell">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => setActiveNotesFollowUp(f)}
                          className="action-link-btn view"
                          title="View Notes"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '2px',
                            color: 'var(--accent-color)',
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                        </button>
                        <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
                          <Link
                            href={`/follow-ups/${f.followUpId}`}
                            className="action-link-btn view"
                            style={{ fontSize: '0.72rem', fontWeight: 600 }}
                            onClick={() => {
                              // Set the sessionStorage flag to enable list cache restoration on back click
                              sessionStorage.setItem('coming_from_detail', 'true');
                            }}
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {activeNotesFollowUp !== null && (
        <FollowUpNotesPopup
          customerName={activeNotesFollowUp.customerName}
          notes={activeNotesFollowUp.notes}
          onClose={() => setActiveNotesFollowUp(null)}
        />
      )}
    </>
  );
}
