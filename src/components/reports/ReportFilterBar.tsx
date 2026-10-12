import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AgentSalesFilterParams, MetricType, MetricViewType, ReportAgentOption } from '../../types/report';

interface TeamOption {
  teamId: number;
  teamName: string;
}

interface ReportFilterBarProps {
  teams: TeamOption[];
  agents: ReportAgentOption[];
  selectedTeamIds: number[];
  selectedAgentIds: number[];
  range: AgentSalesFilterParams['range'];
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  granularity?: AgentSalesFilterParams['granularity'];
  availableYears?: number[];
  metricView: MetricViewType;
  onFilterChange: (filters: {
    teamIds?: number[];
    agentIds?: number[];
    range?: AgentSalesFilterParams['range'];
    startDate?: string;
    endDate?: string;
    year?: number;
    month?: number;
    granularity?: AgentSalesFilterParams['granularity'];
  }) => void;
  onMetricViewChange: (metricView: MetricViewType) => void;
  onExportExcel: () => void;
  isExporting?: boolean;
  canExport?: boolean;
}

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

export default function ReportFilterBar({
  teams,
  agents,
  selectedTeamIds,
  selectedAgentIds,
  range = 'this-week',
  startDate,
  endDate,
  year,
  month,
  granularity,
  availableYears,
  metricView,
  onFilterChange,
  onMetricViewChange,
  onExportExcel,
  isExporting = false,
  canExport = true,
}: ReportFilterBarProps) {
  const [customStartDate, setCustomStartDate] = useState<string>(startDate || '');
  const [customEndDate, setCustomEndDate] = useState<string>(endDate || '');
  const [prevDates, setPrevDates] = useState({ startDate, endDate });
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');

  const centerRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<HTMLDivElement>(null);

  if (startDate !== prevDates.startDate || endDate !== prevDates.endDate) {
    setPrevDates({ startDate, endDate });
    setCustomStartDate(startDate || '');
    setCustomEndDate(endDate || '');
  }

  // Handle outside click to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (centerRef.current && !centerRef.current.contains(e.target as Node)) {
        setIsCenterOpen(false);
      }
      if (agentRef.current && !agentRef.current.contains(e.target as Node)) {
        setIsAgentOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter agents client-side based on selected Center(s)
  const filteredAgents = useMemo(() => {
    if (!Array.isArray(agents)) return [];
    if (selectedTeamIds.length === 0) return agents;
    const teamSet = new Set(selectedTeamIds);
    return agents.filter((a) => a.teamId && teamSet.has(a.teamId));
  }, [agents, selectedTeamIds]);

  // Filter agents by search query
  const searchedAgents = useMemo(() => {
    if (!agentSearch.trim()) return filteredAgents;
    const q = agentSearch.toLowerCase();
    return filteredAgents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.nickname && a.nickname.toLowerCase().includes(q))
    );
  }, [filteredAgents, agentSearch]);

  // Derived active vs inactive scoped agents
  const { activeAgents, inactiveAgents } = useMemo(() => {
    const active = searchedAgents
      .filter((a) => a.status === 1)
      .sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
    const inactive = searchedAgents
      .filter((a) => a.status !== 1)
      .sort((a, b) => (a.nickname || a.name).localeCompare(b.nickname || b.name));
    return { activeAgents: active, inactiveAgents: inactive };
  }, [searchedAgents]);

  // Center multi-select toggle
  const toggleCenter = (teamId: number) => {
    let nextTeamIds: number[];
    if (selectedTeamIds.includes(teamId)) {
      nextTeamIds = selectedTeamIds.filter((id) => id !== teamId);
    } else {
      nextTeamIds = [...selectedTeamIds, teamId];
    }

    // Filter out agents that are not in nextTeamIds
    let nextAgentIds = selectedAgentIds;
    if (nextTeamIds.length > 0) {
      const allowedAgentUids = new Set(
        agents.filter((a) => a.teamId && nextTeamIds.includes(a.teamId)).map((a) => a.uid)
      );
      nextAgentIds = nextAgentIds.filter((id) => allowedAgentUids.has(id));
    }

    onFilterChange({
      teamIds: nextTeamIds,
      agentIds: nextAgentIds,
      range,
      startDate: range === 'custom' ? startDate : undefined,
      endDate: range === 'custom' ? endDate : undefined,
    });
  };

  const selectAllCenters = () => {
    onFilterChange({
      teamIds: [],
      agentIds: selectedAgentIds,
      range,
      startDate: range === 'custom' ? startDate : undefined,
      endDate: range === 'custom' ? endDate : undefined,
    });
  };

  // Agent multi-select toggle
  const toggleAgent = (agentUid: number) => {
    let nextAgentIds: number[];
    if (selectedAgentIds.includes(agentUid)) {
      nextAgentIds = selectedAgentIds.filter((id) => id !== agentUid);
    } else {
      nextAgentIds = [...selectedAgentIds, agentUid];
    }
    onFilterChange({
      teamIds: selectedTeamIds,
      agentIds: nextAgentIds,
      range,
      startDate: range === 'custom' ? startDate : undefined,
      endDate: range === 'custom' ? endDate : undefined,
    });
  };

  const selectAllAgents = () => {
    onFilterChange({
      teamIds: selectedTeamIds,
      agentIds: [],
      range,
      startDate: range === 'custom' ? startDate : undefined,
      endDate: range === 'custom' ? endDate : undefined,
    });
  };

  // Center button label
  const centerButtonLabel = useMemo(() => {
    if (selectedTeamIds.length === 0) return 'All Centers';
    if (selectedTeamIds.length === 1) {
      const t = teams.find((x) => x.teamId === selectedTeamIds[0]);
      return t ? t.teamName : '1 Center';
    }
    return `${selectedTeamIds.length} Centers Selected`;
  }, [selectedTeamIds, teams]);

  // Agent button label
  const agentButtonLabel = useMemo(() => {
    if (selectedAgentIds.length === 0) return 'All Agents';
    if (selectedAgentIds.length === 1) {
      const a = agents.find((x) => x.uid === selectedAgentIds[0]);
      return a ? a.nickname || a.name : '1 Agent';
    }
    return `${selectedAgentIds.length} Agents Selected`;
  }, [selectedAgentIds, agents]);

  const currentYear = useMemo(() => new Date().getUTCFullYear(), []);
  const currentMonth = useMemo(() => new Date().getUTCMonth() + 1, []);

  const activeYear = year !== undefined ? year : currentYear;
  const activeMonth = month !== undefined ? month : currentMonth;
  const activeGranularity = granularity || 'summary';

  const yearOptions = useMemo(() => {
    if (availableYears && availableYears.length > 0) return availableYears;
    const yrs: number[] = [];
    for (let y = currentYear; y >= currentYear - 4; y--) {
      yrs.push(y);
    }
    return yrs;
  }, [availableYears, currentYear]);

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value as AgentSalesFilterParams['range'];
    if (newRange === 'custom') {
      onFilterChange({
        teamIds: selectedTeamIds,
        agentIds: selectedAgentIds,
        range: 'custom',
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
        granularity: 'summary',
      });
    } else if (newRange === 'monthly') {
      setCustomStartDate('');
      setCustomEndDate('');
      onFilterChange({
        teamIds: selectedTeamIds,
        agentIds: selectedAgentIds,
        range: 'monthly',
        year: activeYear,
        month: activeMonth,
        granularity: 'summary',
        startDate: undefined,
        endDate: undefined,
      });
    } else if (newRange === 'yearly') {
      setCustomStartDate('');
      setCustomEndDate('');
      onFilterChange({
        teamIds: selectedTeamIds,
        agentIds: selectedAgentIds,
        range: 'yearly',
        year: activeYear,
        granularity: 'summary',
        startDate: undefined,
        endDate: undefined,
      });
    } else if (newRange === 'all-time') {
      setCustomStartDate('');
      setCustomEndDate('');
      onFilterChange({
        teamIds: selectedTeamIds,
        agentIds: selectedAgentIds,
        range: 'all-time',
        granularity: 'summary',
        startDate: undefined,
        endDate: undefined,
      });
    } else {
      setCustomStartDate('');
      setCustomEndDate('');
      onFilterChange({
        teamIds: selectedTeamIds,
        agentIds: selectedAgentIds,
        range: newRange,
        granularity: (newRange === 'today' || newRange === 'yesterday') ? 'daily' : 'summary',
        startDate: undefined,
        endDate: undefined,
      });
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextM = parseInt(e.target.value, 10);
    onFilterChange({
      teamIds: selectedTeamIds,
      agentIds: selectedAgentIds,
      range,
      year: activeYear,
      month: nextM,
      granularity: activeGranularity,
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextY = parseInt(e.target.value, 10);
    onFilterChange({
      teamIds: selectedTeamIds,
      agentIds: selectedAgentIds,
      range,
      year: nextY,
      month: range === 'monthly' ? activeMonth : undefined,
      granularity: activeGranularity,
    });
  };

  const handleGranularityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextG = e.target.value as AgentSalesFilterParams['granularity'];
    onFilterChange({
      teamIds: selectedTeamIds,
      agentIds: selectedAgentIds,
      range,
      year: range === 'monthly' || range === 'yearly' ? activeYear : undefined,
      month: range === 'monthly' ? activeMonth : undefined,
      granularity: nextG,
      startDate: range === 'custom' ? customStartDate || startDate : undefined,
      endDate: range === 'custom' ? customEndDate || endDate : undefined,
    });
  };

  const handleApplyCustom = () => {
    if (customStartDate && customEndDate) {
      onFilterChange({
        teamIds: selectedTeamIds,
        agentIds: selectedAgentIds,
        range: 'custom',
        startDate: customStartDate,
        endDate: customEndDate,
        granularity: activeGranularity,
      });
    }
  };

  const handleCancelCustom = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    onFilterChange({
      teamIds: selectedTeamIds,
      agentIds: selectedAgentIds,
      range: 'this-week',
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <div className="reports-filter-card form-card">
      {/* Top Filter Controls Row */}
      <div className="reports-filter-top-row">
        <div className="reports-filter-controls-group">
          {/* Centers Multi-Select */}
          <div className="filter-select-wrapper" ref={centerRef} style={{ position: 'relative', width: '160px' }}>
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
              Center
            </label>
            <button
              type="button"
              id="center-select"
              onClick={() => setIsCenterOpen(!isCenterOpen)}
              className="filter-select-custom"
              style={{
                fontSize: '0.75rem',
                height: '34px',
                padding: '0 8px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {centerButtonLabel}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '4px' }}>▼</span>
            </button>

            {isCenterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  width: '200px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  zIndex: 50,
                  padding: '6px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                <div
                  onClick={selectAllCenters}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    background: selectedTeamIds.length === 0 ? '#f1f5f9' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.length === 0}
                    onChange={() => {}}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>All Centers</span>
                </div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                {teams.map((t) => {
                  const isChecked = selectedTeamIds.includes(t.teamId);
                  return (
                    <div
                      key={t.teamId}
                      onClick={() => toggleCenter(t.teamId)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: '#334155',
                        background: isChecked ? '#f8fafc' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.teamName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Agents Multi-Select */}
          <div className="filter-select-wrapper" ref={agentRef} style={{ position: 'relative', width: '180px' }}>
            <label className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
              Agent
            </label>
            <button
              type="button"
              id="agent-select"
              onClick={() => setIsAgentOpen(!isAgentOpen)}
              className="filter-select-custom"
              style={{
                fontSize: '0.75rem',
                height: '34px',
                padding: '0 8px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                textAlign: 'left',
                background: '#ffffff',
                cursor: 'pointer',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {agentButtonLabel}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '4px' }}>▼</span>
            </button>

            {isAgentOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  width: '240px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  zIndex: 50,
                  padding: '6px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '2px 4px 6px' }}>
                  <input
                    type="text"
                    placeholder="Search agents..."
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div
                  onClick={selectAllAgents}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    background: selectedAgentIds.length === 0 ? '#f1f5f9' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedAgentIds.length === 0}
                    onChange={() => {}}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>All Agents</span>
                </div>

                {activeAgents.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', padding: '6px 8px 2px', textTransform: 'uppercase' }}>
                      Active
                    </div>
                    {activeAgents.map((a) => {
                      const isChecked = selectedAgentIds.includes(a.uid);
                      return (
                        <div
                          key={a.uid}
                          onClick={() => toggleAgent(a.uid)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '5px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: '#334155',
                            background: isChecked ? '#f8fafc' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.nickname || a.name}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}

                {inactiveAgents.length > 0 && (
                  <>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', padding: '6px 8px 2px', textTransform: 'uppercase' }}>
                      Inactive
                    </div>
                    {inactiveAgents.map((a) => {
                      const isChecked = selectedAgentIds.includes(a.uid);
                      return (
                        <div
                          key={a.uid}
                          onClick={() => toggleAgent(a.uid)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '5px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: '#64748b',
                            background: isChecked ? '#f8fafc' : 'transparent',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.nickname || a.name}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Range Selector */}
          <div className="filter-select-wrapper" style={{ width: '130px' }}>
            <label htmlFor="range-select" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
              Range
            </label>
            <select
              id="range-select"
              className="filter-select-custom"
              value={range}
              onChange={handleRangeChange}
              style={{ fontSize: '0.75rem', height: '34px', padding: '0 8px', width: '100%' }}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this-week">This week</option>
              <option value="last-week">Last week</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="all-time">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Month Selector (when range === 'monthly') */}
          {range === 'monthly' && (
            <div className="filter-select-wrapper" style={{ width: '85px' }}>
              <label htmlFor="month-select" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                Month
              </label>
              <select
                id="month-select"
                aria-label="Month"
                className="filter-select-custom"
                value={activeMonth}
                onChange={handleMonthChange}
                style={{ fontSize: '0.75rem', height: '34px', padding: '0 8px', width: '100%' }}
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Year Selector (when range === 'monthly' || range === 'yearly') */}
          {(range === 'monthly' || range === 'yearly') && (
            <div className="filter-select-wrapper" style={{ width: '90px' }}>
              <label htmlFor="year-select" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                Year
              </label>
              <select
                id="year-select"
                aria-label="Year"
                className="filter-select-custom"
                value={activeYear}
                onChange={handleYearChange}
                style={{ fontSize: '0.75rem', height: '34px', padding: '0 8px', width: '100%' }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Granularity Selector (when range !== 'today' && range !== 'yesterday') */}
          {range !== 'today' && range !== 'yesterday' && (
            <div className="filter-select-wrapper" style={{ width: '185px' }}>
              <label htmlFor="granularity-select" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                Granularity
              </label>
              <select
                id="granularity-select"
                aria-label="Granularity"
                className="filter-select-custom"
                value={activeGranularity}
                onChange={handleGranularityChange}
                style={{ fontSize: '0.75rem', height: '34px', padding: '0 8px', width: '100%' }}
              >
                {range === 'monthly' && (
                  <>
                    <option value="summary">Monthly Summary</option>
                    <option value="weekly">Weekly (Calendar Weeks)</option>
                    <option value="daily">Daily (Days of Month)</option>
                  </>
                )}
                {range === 'yearly' && (
                  <>
                    <option value="summary">Yearly Summary</option>
                    <option value="monthly">Monthly (12 Months)</option>
                    <option value="weekly">Weekly (Calendar Weeks)</option>
                  </>
                )}
                {range === 'all-time' && (
                  <>
                    <option value="summary">All-Time Summary</option>
                    <option value="yearly">Yearly (All Years)</option>
                  </>
                )}
                {(range === 'this-week' || range === 'last-week') && (
                  <>
                    <option value="summary">Weekly Summary</option>
                    <option value="daily">Daily (Days of Week)</option>
                  </>
                )}
                {range === 'custom' && (
                  <>
                    <option value="summary">Period Summary</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly (Calendar Weeks)</option>
                    <option value="monthly">Monthly</option>
                  </>
                )}
              </select>
            </div>
          )}

          {/* Custom Date Pickers */}
          {range === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="filter-select-wrapper" style={{ width: '130px' }}>
                <label htmlFor="start-date-input" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                  Start Date
                </label>
                <input
                  id="start-date-input"
                  type="date"
                  className="filter-select-custom"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px', padding: '0 8px', width: '100%' }}
                />
              </div>
              <div className="filter-select-wrapper" style={{ width: '130px' }}>
                <label htmlFor="end-date-input" className="form-label" style={{ marginBottom: '4px', display: 'block', fontSize: '0.72rem', fontWeight: 600 }}>
                  End Date
                </label>
                <input
                  id="end-date-input"
                  type="date"
                  className="filter-select-custom"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  style={{ fontSize: '0.75rem', height: '34px', padding: '0 8px', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-primary-custom"
                  onClick={handleApplyCustom}
                  style={{ padding: '6px 12px', minHeight: '34px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="btn-secondary-custom"
                  onClick={handleCancelCustom}
                  style={{ padding: '6px 12px', minHeight: '34px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Button: Export XLS */}
        {canExport && (
          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              onClick={onExportExcel}
              disabled={isExporting}
              className="reports-export-btn"
            >
              <svg
                style={{ width: '15px', height: '15px' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>{isExporting ? 'Exporting...' : 'Export XLS'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Row: Metric View Switcher Pills */}
      <div className="reports-metric-switcher-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em' }}>
            Metric View:
          </span>
          <div className="reports-metric-tabs-group">
            {(() => {
              const activeList: MetricType[] =
                metricView === 'all'
                  ? ['sales', 'refunds', 'chargebacks', 'net']
                  : metricView === 'sales'
                  ? ['sales']
                  : metricView === 'refunds'
                  ? ['refunds']
                  : metricView === 'chargebacks'
                  ? ['chargebacks']
                  : metricView === 'net'
                  ? ['net']
                  : Array.isArray(metricView)
                  ? metricView
                  : ['sales', 'refunds', 'chargebacks', 'net'];

              const isAllActive = activeList.length === 4;

              const handleToggleMetric = (m: MetricType) => {
                if (isAllActive) {
                  // If all 4 were selected, isolate this single metric
                  onMetricViewChange([m]);
                } else if (activeList.includes(m)) {
                  const next = activeList.filter((x) => x !== m);
                  if (next.length === 0) {
                    onMetricViewChange('all');
                  } else {
                    onMetricViewChange(next);
                  }
                } else {
                  const next = [...activeList, m];
                  if (next.length === 4) {
                    onMetricViewChange('all');
                  } else {
                    onMetricViewChange(next);
                  }
                }
              };

              const handleToggleAll = () => {
                onMetricViewChange('all');
              };

              return (
                <>
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className={`reports-metric-tab-btn ${isAllActive ? 'active-all' : ''}`}
                  >
                    All 4 Metrics
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMetric('sales')}
                    className={`reports-metric-tab-btn ${!isAllActive && activeList.includes('sales') ? 'active-sales' : ''}`}
                  >
                    Gross Sales
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMetric('refunds')}
                    className={`reports-metric-tab-btn ${!isAllActive && activeList.includes('refunds') ? 'active-refunds' : ''}`}
                  >
                    Refunds
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMetric('chargebacks')}
                    className={`reports-metric-tab-btn ${!isAllActive && activeList.includes('chargebacks') ? 'active-chargebacks' : ''}`}
                  >
                    Chargebacks
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMetric('net')}
                    className={`reports-metric-tab-btn ${!isAllActive && activeList.includes('net') ? 'active-net' : ''}`}
                  >
                    Net Sales
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
          Showing sales aggregates across <strong style={{ color: '#0f172a', fontWeight: 700 }}>{filteredAgents.length}</strong> sales agents
        </div>
      </div>
    </div>
  );
}
