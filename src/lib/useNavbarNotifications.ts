'use client';

import { useState, useEffect, useCallback } from 'react';

export interface OverdueNavbarItem {
  followUpId: number;
  customerName: string;
  followUpTime: string;
  customerTimezone: string;
  partRequired: string;
  daysLabel?: string;
  priority?: string;
}

export function useNavbarNotifications() {
  const [overdueList, setOverdueList] = useState<OverdueNavbarItem[]>([]);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch('/api/follow-ups/overdue');
      if (!res.ok) return;
      const dueRecords: any[] = await res.json();
      if (Array.isArray(dueRecords)) {
        const formattedList: OverdueNavbarItem[] = dueRecords.map((record) => ({
          followUpId: record.followUpId,
          customerName: record.customerName,
          followUpTime: record.followUpTime,
          customerTimezone: record.customerTimezone,
          partRequired: record.partRequired,
          daysLabel: record.daysLabel,
          priority: record.priority,
        }));
        setOverdueList(formattedList);
      }
    } catch (err) {
      console.error('Error refetching navbar overdue follow-ups:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ignore = false;

    const loadOverdueFollowUps = async () => {
      try {
        const res = await fetch('/api/follow-ups/overdue');
        if (!res.ok) return;
        const dueRecords: any[] = await res.json();

        if (!ignore && Array.isArray(dueRecords)) {
          const formattedList: OverdueNavbarItem[] = dueRecords.map((record) => ({
            followUpId: record.followUpId,
            customerName: record.customerName,
            followUpTime: record.followUpTime,
            customerTimezone: record.customerTimezone,
            partRequired: record.partRequired,
            daysLabel: record.daysLabel,
            priority: record.priority,
          }));

          setOverdueList(formattedList);
        }
      } catch (err) {
        console.error('Error fetching navbar overdue follow-ups:', err);
      }
    };

    loadOverdueFollowUps();

    const intervalId = setInterval(loadOverdueFollowUps, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadOverdueFollowUps();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      ignore = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    overdueList,
    dueCount: overdueList.length,
    refetch,
  };
}
