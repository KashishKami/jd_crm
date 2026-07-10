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
      className="card-with-accent"
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
        <React.Fragment>
          <div className="team-monthly-container">
          <style dangerouslySetInnerHTML={{ __html: `
            .team-monthly-container {
              display: flex;
              justify-content: center;
              align-items: stretch;
              width: 100%;
              padding: 0 16px;
              box-sizing: border-box;
              gap: 0;
              flex-wrap: nowrap !important;
            }
            .team-monthly-card {
              border: 1px solid var(--border-color);
              border-radius: 10px;
              padding: 12px;
              display: flex;
              flex-direction: column;
              gap: 6px;
              background: #f8fafc;
              transition: all 0.2s ease;
              flex: 1 1 340px;
              max-width: 360px;
              min-width: 0;
            }
            .team-monthly-vs {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0 8px;
              color: #94a3b8;
              font-weight: 800;
              font-size: 0.8rem;
              letter-spacing: 0.05em;
              flex-shrink: 0;
            }
            
            /* Responsive Font Sizes to Prevent Overflows */
            @media (max-width: 1200px) {
              .team-monthly-card h4 { font-size: 0.82rem !important; }
              .team-monthly-card .team-metric-label { font-size: 0.7rem !important; }
              .team-monthly-card .team-metric-val { font-size: 0.7rem !important; }
              .team-monthly-card .team-disputes-val { font-size: 0.62rem !important; }
              .team-monthly-card .team-net-amount { font-size: 0.82rem !important; }
              .team-monthly-card .performer-title { font-size: 0.64rem !important; }
              .team-monthly-card .performer-name { font-size: 0.68rem !important; }
              .team-monthly-card .performer-amount { font-size: 0.68rem !important; }
              .team-monthly-vs { font-size: 0.72rem !important; padding: 0 6px !important; }
            }
            @media (max-width: 900px) {
              .team-monthly-card h4 { font-size: 0.75rem !important; }
              .team-monthly-card .team-metric-label { font-size: 0.64rem !important; }
              .team-monthly-card .team-metric-val { font-size: 0.64rem !important; }
              .team-monthly-card .team-disputes-val { font-size: 0.58rem !important; }
              .team-monthly-card .team-net-amount { font-size: 0.75rem !important; }
              .team-monthly-card .performer-title { font-size: 0.58rem !important; }
              .team-monthly-card .performer-name { font-size: 0.6rem !important; }
              .team-monthly-card .performer-amount { font-size: 0.6rem !important; }
              .team-monthly-vs { font-size: 0.65rem !important; padding: 0 4px !important; }
            }
          `}} />
          {(() => {
            // Sort so that the team named 'Alex' is always in the centre position
            let sorted = [...teams];
            if (sorted.length === 3) {
              const alexIdx = sorted.findIndex(t => t.teamName === 'Alex');
              if (alexIdx !== -1 && alexIdx !== 1) {
                const [alex] = sorted.splice(alexIdx, 1);
                sorted.splice(1, 0, alex);
              }
            }
            return sorted.map((team, i) => (
              <React.Fragment key={team.teamId}>
                {i > 0 && (
                  <div className="team-monthly-vs">VS</div>
                )}
                <div className="team-monthly-card">
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{team.teamName}</h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    <span className="team-metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sales Volume</span>
                    <span className="team-metric-val" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{`${team.soldCount} Sales`}</span>
                  </div>
                  {/* Developer Note: Sales Volume represents the total number of successful transactions (orders that are sold or partially refunded) for this team during the month. */}

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                    <span className="team-metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Disputes</span>
                    <span className="team-metric-val team-disputes-val" style={{ fontSize: '0.68rem', fontWeight: 600, color: team.refundCount > 0 || team.chargebackCount > 0 ? '#ef4444' : 'inherit' }}>
                      {`${team.refundCount} Refund / ${team.chargebackCount} Cbk`}
                    </span>
                  </div>
                  {/* Developer Note: Disputes counts the number of orders that resulted in a customer refund or payment dispute (chargeback) this month. */}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
                    <span className="team-metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Margin</span>
                    <span className="team-net-amount" style={{ fontSize: '0.9rem', fontWeight: 700, color: team.netAmount >= 0 ? '#16a34a' : '#dc2626' }}>
                      ${team.netAmount.toLocaleString('en-US')}
                    </span>
                  </div>
                  {/* Developer Note: Final Margin represents the total profit/margin collected from successful sales after subtracting any issued refunds. */}

                  {/* Performers Block with Fixed Height/Layout */}
                  {(canShowTopPerformer || canShowBottomPerformer) && (
                    <div style={{
                      marginTop: '8px',
                      background: 'white',
                      borderRadius: '6px',
                      padding: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '185px',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box'
                    }}>
                      {/* Top Performers Section */}
                      {canShowTopPerformer && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '80px' }}>
                          <span className="performer-title" style={{ height: '14px', display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Top Performers
                          </span>
                          {(() => {
                            const list = [];
                            const tps = team.topPerformers || [];
                            for (let idx = 0; idx < 3; idx++) {
                              const agent = tps[idx];
                              if (agent) {
                                list.push(
                                  <div key={agent.agentId || idx} style={{ height: '18px', fontSize: '0.72rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="performer-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px', fontSize: '0.72rem' }}>
                                      {`${idx + 1}. ${agent.agentName}`}
                                    </span>
                                    <span className="performer-amount" style={{ fontWeight: 600, color: '#16a34a', flexShrink: 0, fontSize: '0.72rem' }}>
                                      {agent.amount < 0 ? `-$${Math.abs(agent.amount).toLocaleString('en-US')}` : `$${agent.amount.toLocaleString('en-US')}`}
                                    </span>
                                  </div>
                                );
                              } else {
                                list.push(<div key={`empty-top-${idx}`} style={{ height: '18px', fontSize: '0.72rem' }}>&nbsp;</div>);
                              }
                            }
                            return list;
                          })()}
                        </div>
                      )}

                      {/* Divider line if both shown */}
                      {canShowTopPerformer && canShowBottomPerformer && (
                        <div style={{ borderTop: '1px solid #f1f5f9', margin: '2px 0' }} />
                      )}

                      {/* Bottom Performers Section */}
                      {canShowBottomPerformer && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '80px' }}>
                          <span className="performer-title" style={{ height: '14px', display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Bottom Performers
                          </span>
                          {(() => {
                            const list = [];
                            const bps = team.bottomPerformers || [];
                            for (let idx = 0; idx < 3; idx++) {
                              const agent = bps[idx];
                              if (agent) {
                                list.push(
                                  <div key={agent.agentId || idx} style={{ height: '18px', fontSize: '0.72rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="performer-name" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px', fontSize: '0.72rem' }}>
                                      {`${idx + 1}. ${agent.agentName}`}
                                    </span>
                                    <span className="performer-amount" style={{ fontWeight: 600, color: '#dc2626', flexShrink: 0, fontSize: '0.72rem' }}>
                                      {agent.amount < 0 ? `-$${Math.abs(agent.amount).toLocaleString('en-US')}` : `$${agent.amount.toLocaleString('en-US')}`}
                                    </span>
                                  </div>
                                );
                              } else {
                                list.push(<div key={`empty-bot-${idx}`} style={{ height: '18px', fontSize: '0.72rem' }}>&nbsp;</div>);
                              }
                            }
                            return list;
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            ));
          })()}
        </div>
        <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Note:</span>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', listStyleType: 'disc' }}>
            <li><strong>Sales Volume:</strong> Total number of successful transactions (Sold or Partially Refunded) for this team during the month.</li>
            <li><strong>Disputes:</strong> Combined count of fully refunded sales and chargebacks.</li>
            <li><strong>Final Margin:</strong> Net profit generated from successful sales after subtracting refunds.</li>
          </ul>
        </div>
        </React.Fragment>
      )}
    </div>
  );
}
