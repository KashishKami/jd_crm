'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { DateTime } from 'luxon';
import { hasPermission } from '../service/permission.service';
import FollowUpNotesPopup from './FollowUpNotesPopup';
import { formatPhoneNumber } from '../lib/formatPhone';

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

  const getDaysLabelBadgeClass = (label: string): string => {
    if (label?.startsWith('Due by') || label?.startsWith('Overdue by')) {
      return 'status-dot-badge badge-overdue';
    }
    if (label === 'Today' || label?.endsWith('left')) {
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
                <th>Customer Information</th>
                <th>Location</th>
                <th>Part Required</th>
                {canViewAll && <th>Agent</th>}
                <th>Priority</th>
                <th>Status</th>
                <th>Last Contact</th>
                <th className="actions-cell" style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {followUps.length === 0 ? (
                <tr>
                  <td colSpan={canViewAll ? 9 : 8} className="text-center text-slate-400 py-8">
                    No follow-ups found.
                  </td>
                </tr>
              ) : (
                followUps.map((f) => (
                  <tr key={f.followUpId}>
                    <td>
                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
                        {f.status !== 'Not Interested' && (
                          <div>
                            <span className={getDaysLabelBadgeClass(f.daysLabel)}>
                              {f.daysLabel}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          {(() => {
                            const pureDate = f.followUpDate.includes('T') ? f.followUpDate.split('T')[0] : f.followUpDate;
                            const dt = DateTime.fromISO(`${pureDate}T${f.followUpTime}`, { zone: f.customerTimezone });
                            if (!dt.isValid) {
                              return (
                                <>
                                  <span className="font-medium" style={{ color: 'var(--text-main)' }}>{f.followUpTime}</span>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.followUpDate}</span>
                                </>
                              );
                            }
                            return (
                              <>
                                <span className="font-medium" style={{ color: 'var(--text-main)' }}>
                                  {dt.toFormat('h:mm a')}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                  {dt.toFormat('LLL d, yyyy')}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-bold" style={{ color: 'var(--text-main)' }}>{f.customerName}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {f.customerPhone ? formatPhoneNumber(f.customerPhone) : '—'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-main)' }}>{f.customerState || '—'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {f.customerCountry || '—'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text-main)' }}>{f.partRequired}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>
                          {f.vehicleYearMakeModel}
                        </div>
                      </div>
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
                          <Link
                            href={`/follow-ups/${f.followUpId}/edit`}
                            className="action-link-btn edit"
                            style={{ fontSize: '0.72rem', fontWeight: 600 }}
                          >
                            Edit
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
