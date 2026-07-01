'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { hasPermission } from '../../service/permission.service';
import { PerformerRow } from '../../types/dashboard';
import PerformersTable from './PerformersTable';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ChampionsLeagueWidgetProps {
  permissions: string;
  initialTopPerformers?: PerformerRow[];
  initialBottomPerformers?: PerformerRow[];
}

export default function ChampionsLeagueWidget({
  permissions,
  initialTopPerformers = [],
  initialBottomPerformers = [],
}: ChampionsLeagueWidgetProps) {
  // Derive current month/year from America/New_York timezone
  const getEstMonthYear = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    return { month: parseInt(map.month), year: parseInt(map.year) };
  };

  const estNow = getEstMonthYear();
  const [currentMonth, setCurrentMonth] = useState(estNow.month); // 1-indexed
  const [currentYear, setCurrentYear] = useState(estNow.year);
  const [topPerformers, setTopPerformers] = useState<PerformerRow[]>(initialTopPerformers);
  const [bottomPerformers, setBottomPerformers] = useState<PerformerRow[]>(initialBottomPerformers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInitialMount = useRef(true);

  const fetchPerformers = useCallback(async (month: number, year: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/champions-league?month=${month}&year=${year}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Forbidden');
        }
        throw new Error('Failed to fetch performers data');
      }
      const data = await res.json();
      setTopPerformers(data.topPerformers || []);
      setBottomPerformers(data.bottomPerformers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Skip fetching on the very first mount if we already have the initial props
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (currentMonth === estNow.month && currentYear === estNow.year) {
        return;
      }
    }
    fetchPerformers(currentMonth, currentYear);
  }, [currentMonth, currentYear, estNow.month, estNow.year, fetchPerformers]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const canShowTop = hasPermission(permissions, 'dashboard:top-performer');
  const canShowBottom = hasPermission(permissions, 'dashboard:bottom-performer');

  if (!canShowTop && !canShowBottom) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Widget Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Champions League
        </h2>

        {/* Month Navigator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px' }}>
          <button
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              fontSize: '1rem',
              padding: '0 6px',
            }}
          >
            &larr;
          </button>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', minWidth: '120px', textAlign: 'center' }}>
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            aria-label="Next Month"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: 'var(--text-main)',
              fontSize: '1rem',
              padding: '0 6px',
            }}
          >
            &rarr;
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>
          {error === 'Forbidden' ? 'Insufficient Permissions' : error}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {canShowTop && (
            <PerformersTable title="Top Performers" performers={topPerformers} isTop={true} />
          )}
          {canShowBottom && (
            <PerformersTable title="Bottom Performers" performers={bottomPerformers} isTop={false} />
          )}
        </div>
      )}
    </div>
  );
}
