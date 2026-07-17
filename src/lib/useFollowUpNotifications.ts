'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DateTime } from 'luxon';

export interface ToastNotification {
  followUpId: number;
  customerName: string;
  followUpTime: string;
  customerTimezone: string;
  partRequired: string;
}

/**
 * Tracks the notification state for a single follow-up key within a browser session.
 *
 * toastShown  — in-app toast has been added to state (only ever shown once per session).
 * bucket1Fired — OS notification fired for the ~5-minute warning.
 * bucket2Fired — OS notification fired for the ~3-minute warning.
 * bucket3Fired — OS notification fired for the due-now alert.
 *
 * Buckets are only fired when the app is in the background (document.visibilityState === 'hidden').
 * Each bucket fires exactly once regardless of how many 60-second polls occur.
 */
interface NotifState {
  toastShown: boolean;
  bucket1Fired: boolean;
  bucket2Fired: boolean;
  bucket3Fired: boolean;
}

export function useFollowUpNotifications() {
  const [activeNotifications, setActiveNotifications] = useState<ToastNotification[]>([]);

  // Map<key, NotifState> — persists for the lifetime of the browser session (tab open).
  // Resets on page reload / new tab, which is intentional: the user should be re-alerted
  // in a new session if they never acknowledged the notification.
  const shownStateRef = useRef<Map<string, NotifState>>(new Map());

  const pollDueFollowUps = useCallback(async () => {
    try {
      const res = await fetch('/api/follow-ups/due');
      if (!res.ok) return;
      const dueRecords: any[] = await res.json();

      if (dueRecords && dueRecords.length > 0) {
        const newToasts: ToastNotification[] = [];

        dueRecords.forEach((record) => {
          const id = record.followUpId;
          const key = `${id}-${record.followUpDate}-${record.followUpTime}`;

          // Get or initialise the state for this follow-up key
          const state: NotifState = shownStateRef.current.get(key) ?? {
            toastShown: false,
            bucket1Fired: false,
            bucket2Fired: false,
            bucket3Fired: false,
          };

          // ── Calculate minutes remaining until due ─────────────────────────
          // Normalise the date field regardless of whether Prisma returns a Date
          // object or an ISO string.
          const dateStr =
            typeof record.followUpDate === 'string'
              ? record.followUpDate.split('T')[0]
              : record.followUpDate
              ? new Date(record.followUpDate).toISOString().split('T')[0]
              : DateTime.now().setZone(record.customerTimezone).toFormat('yyyy-MM-dd');

          const followUpDt = DateTime.fromISO(`${dateStr}T${record.followUpTime}`, {
            zone: record.customerTimezone,
          });
          const minutesUntilDue = followUpDt.diff(DateTime.now(), 'minutes').minutes;
          const roundedMinutes = Math.round(minutesUntilDue);

          // ── Bucket thresholds ─────────────────────────────────────────────
          // Bucket 1: 4–5 minutes away (rounded to 4 or 5)
          // Bucket 2: 2–3 minutes away (rounded to 2 or 3)
          // Bucket 3: ≤ 1 minute away (rounded to 0 or less, or due now)
          const inBucket1 = roundedMinutes <= 5 && roundedMinutes > 3;
          const inBucket2 = roundedMinutes <= 3 && roundedMinutes > 0;
          const inBucket3 = roundedMinutes <= 0;

          // ── In-app toast ──────────────────────────────────────────────────
          // Added once on first encounter; stays in UI until user dismisses it.
          if (!state.toastShown) {
            newToasts.push({
              followUpId: id,
              customerName: record.customerName,
              followUpTime: record.followUpTime,
              customerTimezone: record.customerTimezone,
              partRequired: record.partRequired,
            });
            state.toastShown = true;
          }

          // ── OS browser notifications (background only) ────────────────────
          // Each bucket fires at most once per session. No OS notification is
          // sent when the app is in the foreground — the in-app toast covers it.
          const canFireOS =
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.visibilityState === 'hidden';

          if (canFireOS) {
            let title: string | null = null;
            let body: string | null = null;

            if (inBucket1 && !state.bucket1Fired) {
              title = `⏰ Follow-Up in ${roundedMinutes}m`;
              body = `${record.customerName} — ${record.partRequired}`;
              state.bucket1Fired = true;
            } else if (inBucket2 && !state.bucket2Fired) {
              title = `⚠️ Follow-Up in ${roundedMinutes}m`;
              body = `${record.customerName} — ${record.partRequired}`;
              state.bucket2Fired = true;
            } else if (inBucket3 && !state.bucket3Fired) {
              title = '🔔 Follow-Up Due Now!';
              body = `${record.customerName} — Call now! (${record.partRequired})`;
              state.bucket3Fired = true;
            }

            if (title && body) {
              const n = new Notification(title, { body });
              n.onclick = () => {
                window.focus();
                window.location.href = `/follow-ups/${record.followUpId}`;
              };
            }
          }

          // Write updated state back to the map
          shownStateRef.current.set(key, state);
        });

        if (newToasts.length > 0) {
          setActiveNotifications((prev) => [...prev, ...newToasts]);
        }
      }
    } catch (err) {
      console.error('Error polling due follow-ups:', err);
    }
  }, []);

  const dismissNotification = useCallback(async (id: number) => {
    // Remove from UI immediately
    setActiveNotifications((prev) => prev.filter((n) => n.followUpId !== id));

    try {
      // Mark as notified in DB — prevents this follow-up from ever appearing again
      await fetch(`/api/follow-ups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _markNotified: true }),
      });
    } catch (err) {
      console.error('Error marking follow-up as notified:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Request OS notification permission on first mount if not yet decided
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial poll on mount
    pollDueFollowUps();

    // Poll every 60 seconds — matches the bucket granularity (each poll advances ~1 min)
    const intervalId = setInterval(pollDueFollowUps, 60000);

    // Also poll immediately when the user returns to the tab (visibility change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pollDueFollowUps();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pollDueFollowUps]);

  return {
    activeNotifications,
    dismissNotification,
  };
}
