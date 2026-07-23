'use client';

import React, { useState } from 'react';

export default function DataManagementClient() {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const handleExport = async () => {
    setExportLoading(true);
    setExportStatus(null);
    setExportError(null);

    try {
      const res = await fetch('/api/admin/export');
      if (!res.ok) {
        const data = await res.json();
        setExportError(data.error ?? 'Export failed');
        setExportLoading(false);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? 'jd-crm-export.xlsx';

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportStatus('Export complete.');
    } catch (err: any) {
      setExportError(err.message ?? 'Unknown export error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupStatus(null);
    setBackupError(null);
    try {
      const res = await fetch('/api/admin/backup/trigger', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setBackupStatus(data.filename as string);
      } else {
        setBackupError((data.error as string) ?? 'Unknown error');
      }
    } catch (err: any) {
      setBackupError(String(err.message ?? err));
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
      {/* Card 1 — Excel Export */}
      <div 
        className="metric-card metric-card-interactive" 
        onClick={!exportLoading ? handleExport : undefined}
        style={{ 
          flex: '1 1 350px', 
          minHeight: '200px',
          cursor: exportLoading ? 'not-allowed' : 'pointer'
        }}
      >
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>
              Export All Data
            </span>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
              Downloads a snapshot of all CRM tables as a single .xlsx file. One sheet per table.
            </p>
          </div>
          
          {(exportStatus || exportError) && (
            <div style={{ marginTop: '1rem' }}>
              {exportStatus && (
                <p data-testid="export-success-msg" style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>
                  ✓ {exportStatus}
                </p>
              )}
              {exportError && (
                <p data-testid="export-error-msg" style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>
                  Error: {exportError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="metric-card-footer-band" style={{ justifyContent: 'flex-end' }}>
          <button
            data-testid="export-excel-btn"
            disabled={exportLoading}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: exportLoading ? 'not-allowed' : 'pointer',
              opacity: exportLoading ? 0.7 : 1,
              fontFamily: 'inherit',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#3b82f6',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {exportLoading ? 'Exporting…' : 'Download Excel \u2192'}
          </button>
        </div>
      </div>

      {/* Card 2 — Database Backup */}
      <div 
        className="metric-card metric-card-interactive" 
        onClick={!backupLoading ? handleBackup : undefined}
        style={{ 
          flex: '1 1 350px', 
          minHeight: '200px',
          cursor: backupLoading ? 'not-allowed' : 'pointer'
        }}
      >
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>
              Backup Database
            </span>
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
              Runs a MySQL dump and saves a compressed .sql.gz file. Retains the last 4 backups on the production server.
            </p>
          </div>

          {(backupStatus || backupError) && (
            <div style={{ marginTop: '1rem' }}>
              {backupStatus && (
                <p data-testid="backup-success-msg" style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>
                  ✓ Backup saved: {backupStatus}
                </p>
              )}
              {backupError && (
                <p data-testid="backup-error-msg" style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 500, margin: 0 }}>
                  Error: {backupError}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="metric-card-footer-band" style={{ justifyContent: 'flex-end' }}>
          <button
            data-testid="trigger-backup-btn"
            disabled={backupLoading}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: backupLoading ? 'not-allowed' : 'pointer',
              opacity: backupLoading ? 0.7 : 1,
              fontFamily: 'inherit',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#3b82f6',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {backupLoading ? 'Creating Backup…' : 'Create Backup \u2192'}
          </button>
        </div>
      </div>
    </div>
  );
}
