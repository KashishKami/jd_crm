'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ToastNotification {
  followUpId: number;
  customerName: string;
  followUpTime: string;
  customerTimezone: string;
  partRequired: string;
}

export function useFollowUpNotifications() {
  const [activeNotifications, setActiveNotifications] = useState<ToastNotification[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());

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
          // Skip if already shown/dismissed in the current tab session
          if (shownIdsRef.current.has(key)) return;

          shownIdsRef.current.add(key);

          const toast: ToastNotification = {
            followUpId: id,
            customerName: record.customerName,
            followUpTime: record.followUpTime,
            customerTimezone: record.customerTimezone,
            partRequired: record.partRequired,
          };

          newToasts.push(toast);

          // Fire OS Notification if permitted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const n = new Notification('Follow-Up Due', {
              body: `${record.customerName} — ${record.partRequired}`,
            });
            n.onclick = () => {
              window.focus();
              window.location.href = `/follow-ups/${record.followUpId}`;
            };
          }
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
      // Mark as notified in DB
      await fetch(`/api/follow-ups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ _markNotified: true }),
      });
    } catch (err) {
      console.error('Error marking follow-up as notified:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Request Notification permission if not set
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Initial poll
    pollDueFollowUps();

    // 60-second polling interval
    const intervalId = setInterval(pollDueFollowUps, 60000);

    // Immediate poll on tab visibility change
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
