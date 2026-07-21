'use client';

import React from 'react';
import { CallDispositionRecord } from '../types/callDisposition';
import { DateTime } from 'luxon';

interface CallDispositionListProps {
  dispositions: CallDispositionRecord[];
  isLoading: boolean;
  onEditClick: (id: number) => void;
  onDeleteClick: (id: number) => void;
  isAdmin: boolean;
}

export default function CallDispositionList({
  dispositions,
  isLoading,
  onEditClick,
  onDeleteClick,
  isAdmin,
}: CallDispositionListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '48px' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span style={{ marginLeft: '12px', color: '#64748b' }}>Loading call dispositions...</span>
      </div>
    );
  }

  if (dispositions.length === 0) {
    return (
      <div 
        style={{ 
          textAlign: 'center', 
          padding: '48px 16px', 
          color: '#64748b', 
          backgroundColor: 'rgba(241, 245, 249, 0.5)', 
          borderRadius: '8px', 
          border: '1px dashed #cbd5e1',
          margin: '24px'
        }}
      >
        No call dispositions found.
      </div>
    );
  }

  return (
    <table className="custom-table table-responsive">
      <thead>
        <tr>
          <th>Date (EST)</th>
          <th>Customer Phone</th>
          <th>Customer Name</th>
          {isAdmin && <th>Agent Name</th>}
          {isAdmin && <th>Center/Team</th>}
          <th>Disposition</th>
          <th style={{ textAlign: 'center' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {dispositions.map((r) => {
          const formattedDate = DateTime.fromJSDate(new Date(r.createdAt))
            .setZone('America/New_York')
            .toFormat('dd-MM-yyyy');

          return (
            <tr key={r.callId}>
              <td>{formattedDate}</td>
              <td style={{ fontFamily: 'monospace' }}>{r.customerPhone}</td>
              <td>{r.customerName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>—</span>}</td>
              {isAdmin && <td>{r.agentName}</td>}
              {isAdmin && (
                <td>
                  {r.teamId === 1 ? 'IT Park' : r.teamId === 2 ? 'DB Park' : r.teamId === 3 ? 'Alex' : `Team ${r.teamId}`}
                </td>
              )}
              <td>
                <span className="status-dot-badge badge-disposition">
                  {r.disposition}
                </span>
              </td>
              <td style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => onEditClick(r.callId)}
                    className="btn-secondary-custom"
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    Edit
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDeleteClick(r.callId)}
                      className="btn-secondary-custom"
                      style={{ padding: '4px 10px', fontSize: '0.8rem', backgroundColor: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
