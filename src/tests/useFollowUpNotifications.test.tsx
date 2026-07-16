// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { useFollowUpNotifications } from '../lib/useFollowUpNotifications';

describe('useFollowUpNotifications Hook Unit Tests (W-3113)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should call fetch immediately on mount', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any);

    renderHook(() => useFollowUpNotifications());

    expect(global.fetch).toHaveBeenCalledWith('/api/follow-ups/due');
  });

  it('should poll every 60 seconds', async () => {
    vi.useFakeTimers();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any);

    renderHook(() => useFollowUpNotifications());

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Fast-forward 60s
    await act(async () => {
      vi.advanceTimersByTime(60000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should add notifications and fire OS notification if permitted', async () => {
    const mockDue = [
      {
        followUpId: 101,
        customerName: 'Sammy Davis',
        followUpTime: '10:00',
        customerTimezone: 'America/New_York',
        partRequired: 'Transmission',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockDue,
    } as any);

    // Mock global Notification class
    const mockNotificationConstructor = vi.fn();
    vi.stubGlobal('Notification', mockNotificationConstructor);
    (Notification as any).permission = 'granted';

    const { result } = renderHook(() => useFollowUpNotifications());

    await waitFor(() => {
      expect(result.current.activeNotifications.length).toBe(1);
    });

    expect(result.current.activeNotifications[0]).toEqual({
      followUpId: 101,
      customerName: 'Sammy Davis',
      followUpTime: '10:00',
      customerTimezone: 'America/New_York',
      partRequired: 'Transmission',
    });

    expect(mockNotificationConstructor).toHaveBeenCalledWith(
      'Follow-Up Due',
      expect.objectContaining({
        body: 'Sammy Davis — Transmission',
      })
    );
  });

  it('should call PATCH on dismiss and remove from active list', async () => {
    const mockDue = [
      {
        followUpId: 101,
        customerName: 'Sammy Davis',
        followUpTime: '10:00',
        customerTimezone: 'America/New_York',
        partRequired: 'Transmission',
      },
    ];

    vi.mocked(global.fetch).mockImplementation(async (url, options) => {
      if (url === '/api/follow-ups/due') {
        return {
          ok: true,
          json: async () => mockDue,
        } as any;
      }
      if (url === '/api/follow-ups/101' && options?.method === 'PATCH') {
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as any;
      }
      return { ok: false } as any;
    });

    const { result } = renderHook(() => useFollowUpNotifications());

    await waitFor(() => {
      expect(result.current.activeNotifications.length).toBe(1);
    });

    await act(async () => {
      await result.current.dismissNotification(101);
    });

    // Should call PATCH with _markNotified: true
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/follow-ups/101',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ _markNotified: true }),
      })
    );

    // Active notifications should be empty
    expect(result.current.activeNotifications.length).toBe(0);
  });
});
