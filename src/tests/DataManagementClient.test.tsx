// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import DataManagementClient from '../components/DataManagementClient';

describe('DataManagementClient Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the download Excel button and create backup button', () => {
    render(<DataManagementClient />);
    const excelBtn = screen.getByTestId('export-excel-btn');
    const backupBtn = screen.getByTestId('trigger-backup-btn');

    expect(excelBtn).toBeDefined();
    expect(excelBtn.textContent).toBe('Download Excel \u2192');

    expect(backupBtn).toBeDefined();
    expect(backupBtn.textContent).toBe('Create Backup \u2192');
  });

  it('should show exporting state when Excel download button is clicked', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));

    render(<DataManagementClient />);
    const excelBtn = screen.getByTestId('export-excel-btn');

    fireEvent.click(excelBtn);

    expect(excelBtn.textContent).toBe('Exporting…');
    expect(excelBtn.hasAttribute('disabled')).toBe(true);

    fetchMock.mockRestore();
  });

  it('should show success message after successful Excel export', async () => {
    const mockBlob = new Blob(['dummy content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockResponse = {
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === 'content-disposition') {
            return 'attachment; filename="jd-crm-export-2026-07-26.xlsx"';
          }
          return null;
        }
      }
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);
    const createObjectURLMock = vi.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    render(<DataManagementClient />);
    const excelBtn = screen.getByTestId('export-excel-btn');

    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(screen.getByTestId('export-success-msg')).toBeDefined();
      expect(screen.getByTestId('export-success-msg').textContent).toBe('✓ Export complete.');
      expect(excelBtn.textContent).toBe('Download Excel \u2192');
      expect(excelBtn.hasAttribute('disabled')).toBe(false);
    });

    fetchMock.mockRestore();
  });

  it('should show error message when Excel export fails', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'Export failed' })
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);

    render(<DataManagementClient />);
    const excelBtn = screen.getByTestId('export-excel-btn');

    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(screen.getByTestId('export-error-msg')).toBeDefined();
      expect(screen.getByTestId('export-error-msg').textContent).toBe('Error: Export failed');
      expect(excelBtn.textContent).toBe('Download Excel \u2192');
      expect(excelBtn.hasAttribute('disabled')).toBe(false);
    });

    fetchMock.mockRestore();
  });

  // --- Phase 28 Backup Unit Tests ---
  it('should show creating backup state when backup button is clicked', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => {}));

    render(<DataManagementClient />);
    const backupBtn = screen.getByTestId('trigger-backup-btn');

    fireEvent.click(backupBtn);

    expect(backupBtn.textContent).toBe('Creating Backup…');
    expect(backupBtn.hasAttribute('disabled')).toBe(true);

    fetchMock.mockRestore();
  });

  it('should show success message and clear loading state after successful backup', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ success: true, filename: 'jd_crm_2026-07-26_23-00-00.sql.gz' })
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);

    render(<DataManagementClient />);
    const backupBtn = screen.getByTestId('trigger-backup-btn');

    fireEvent.click(backupBtn);

    await waitFor(() => {
      expect(screen.getByTestId('backup-success-msg')).toBeDefined();
      expect(screen.getByTestId('backup-success-msg').textContent).toBe('✓ Backup saved: jd_crm_2026-07-26_23-00-00.sql.gz');
      expect(backupBtn.textContent).toBe('Create Backup \u2192');
      expect(backupBtn.hasAttribute('disabled')).toBe(false);
    });

    fetchMock.mockRestore();
  });

  it('should show error message when backup fails', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: 'mysqldump failed: container not found' })
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any);

    render(<DataManagementClient />);
    const backupBtn = screen.getByTestId('trigger-backup-btn');

    fireEvent.click(backupBtn);

    await waitFor(() => {
      expect(screen.getByTestId('backup-error-msg')).toBeDefined();
      expect(screen.getByTestId('backup-error-msg').textContent).toBe('Error: mysqldump failed: container not found');
      expect(backupBtn.textContent).toBe('Create Backup \u2192');
      expect(backupBtn.hasAttribute('disabled')).toBe(false);
    });

    fetchMock.mockRestore();
  });
});
