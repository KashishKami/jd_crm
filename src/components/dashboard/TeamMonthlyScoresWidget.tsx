'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { hasPermission } from '../../service/permission.service';
import { TeamMonthlyReport } from '../../types/dashboard';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface TeamMonthlyScoresWidgetProps {
  permissions: string;
}

export default function TeamMonthlyScoresWidget({ permissions }: TeamMonthlyScoresWidgetProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [teams, setTeams] = useState<TeamMonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lastFetchedRef = React.useRef<{ month: number; year: number; permissions: string } | null>(null);

  const fetchTeamScores = useCallback(async (month: number, year: number) => {
    if (
      lastFetchedRef.current &&
      lastFetchedRef.current.month === month &&
      lastFetchedRef.current.year === year &&
      lastFetchedRef.current.permissions === permissions
    ) {
      return;
    }
    lastFetchedRef.current = { month, year, permissions };

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/teams/monthly?month=${month}&year=${year}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Forbidden');
        }
        throw new Error('Failed to fetch team data');
      }
      const data = await res.json();
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [permissions]);

  useEffect(() => {
    if (hasPermission(permissions, 'dashboard:team-monthly-scores')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTeamScores(currentMonth, currentYear);
    }
  }, [currentMonth, currentYear, permissions, fetchTeamScores]);

  if (!hasPermission(permissions, 'dashboard:team-monthly-scores')) {
    return null;
  }

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

  const canShowTopPerformer = hasPermission(permissions, 'dashboard:team-top-performer');
  const canShowBottomPerformer = hasPermission(permissions, 'dashboard:team-bottom-performer');

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>
          Team Monthly Scores
        </h3>

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
      ) : teams.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No team performance data for this month.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {teams.map((team) => (
            <div
              key={team.teamId}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: '#f8fafc',
                transition: 'all 0.2s ease',
              }}
            >
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{team.teamName}</h4>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sales Volume</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{`${team.soldCount} Sales`}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Disputes</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: team.refundCount > 0 || team.chargebackCount > 0 ? '#ef4444' : 'inherit' }}>
                  {`${team.refundCount} Ref / ${team.chargebackCount} Chg`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Net Margin</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: team.netAmount >= 0 ? '#16a34a' : '#dc2626' }}>
                  ${team.netAmount.toLocaleString()}
                </span>
              </div>

              {/* Performers Block */}
              {(canShowTopPerformer || canShowBottomPerformer) && (
                <div style={{ marginTop: '12px', background: 'white', borderRadius: '6px', padding: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {canShowTopPerformer && team.topPerformer && (
                    <div style={{ fontSize: '0.78rem', color: '#16a34a', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{`Top Performer: ${team.topPerformer.agentName} ($${team.topPerformer.amount.toLocaleString()})`}</span>
                    </div>
                  )}
                  {canShowBottomPerformer && team.bottomPerformer && (
                    <div style={{ fontSize: '0.78rem', color: '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{`Bottom Performer: ${team.bottomPerformer.agentName} ($${team.bottomPerformer.amount.toLocaleString()})`}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
