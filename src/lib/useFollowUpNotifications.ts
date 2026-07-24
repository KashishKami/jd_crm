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

interface NotifState {
  toastShown: boolean;
  bucket1Fired: boolean;
  bucket2Fired: boolean;
  bucket3Fired: boolean;
}

export function useFollowUpNotifications() {
  const [activeNotifications, setActiveNotifications] = useState<ToastNotification[]>([]);

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

          const state: NotifState = shownStateRef.current.get(key) ?? {
            toastShown: false,
            bucket1Fired: false,
            bucket2Fired: false,
            bucket3Fired: false,
          };

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

          const inBucket1 = roundedMinutes <= 5 && roundedMinutes > 3;
          const inBucket2 = roundedMinutes <= 3 && roundedMinutes > 0;
          const inBucket3 = roundedMinutes <= 0;

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
    setActiveNotifications((prev) => prev.filter((n) => n.followUpId !== id));

    try {
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

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    pollDueFollowUps();

    const intervalId = setInterval(pollDueFollowUps, 60000);

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
