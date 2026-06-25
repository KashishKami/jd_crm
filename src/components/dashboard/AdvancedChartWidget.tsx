'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdvancedChartDataPoint } from '../../types/dashboard';

interface TeamOption {
  teamId: number;
  teamName: string;
}

interface AgentOption {
  uid: number;
  name: string;
  teamId: number;
}

export default function AdvancedChartWidget() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [agents, setAgents] = useState<AgentOption[]>([]);
  // selectedAgent is stored as raw user choice; effectiveAgent is derived (cleared when filtered out)
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [range, setRange] = useState<string>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');
  const [data, setData] = useState<AdvancedChartDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Fetch teams and agents on mount
  useEffect(() => {
    fetch('/api/teams')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTeams(data))
      .catch((err) => console.error('Error fetching teams:', err));

    fetch('/api/agents')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAgents(data))
      .catch((err) => console.error('Error fetching agents:', err));
  }, []);

  // Filter agents client-side based on the selected team (Center)
  const filteredAgents = useMemo(() => {
    return agents.filter((a) => !selectedTeam || a.teamId === Number(selectedTeam));
  }, [agents, selectedTeam]);

  // Derive effective agent: if current selection is no longer in the filtered list, treat as unselected.
  // This avoids calling setState inside a useEffect (lint: react-hooks/set-state-in-effect).
  const effectiveAgent = useMemo(() => {
    if (!selectedTeam || !selectedAgent) return selectedAgent;
    const exists = filteredAgents.some((a) => a.uid === Number(selectedAgent));
    return exists ? selectedAgent : '';
  }, [selectedTeam, selectedAgent, filteredAgents]);

  // Fetch chart data — all setState calls are inside the inner async `load()` callback,
  // never directly in the synchronous effect body (satisfies react-hooks/set-state-in-effect).
  useEffect(() => {
    if (range === 'custom' && (!appliedStartDate || !appliedEndDate)) {
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      let url = `/api/dashboard/advanced-chart?range=${range}`;
      if (selectedTeam) url += `&teamId=${selectedTeam}`;
      if (effectiveAgent) url += `&agentId=${effectiveAgent}`;
      if (range === 'custom') url += `&startDate=${appliedStartDate}&endDate=${appliedEndDate}`;

      try {
        const res = await fetch(url);
        const json = res.ok ? await res.json() : [];
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching chart data:', err);
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [range, selectedTeam, effectiveAgent, appliedStartDate, appliedEndDate]);

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setRange(val);
    if (val !== 'custom') {
      setCustomStartDate('');
      setCustomEndDate('');
      setAppliedStartDate('');
      setAppliedEndDate('');
    }
  };

  const handleApplyCustom = () => {
    if (customStartDate && customEndDate) {
      setAppliedStartDate(customStartDate);
      setAppliedEndDate(customEndDate);
    }
  };

  const handleCancelCustom = () => {
    setRange('7d');
    setCustomStartDate('');
    setCustomEndDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const getClientGranularity = () => {
    if (range === 'custom') {
      if (!appliedStartDate || !appliedEndDate) return 'daily';
      const diffTime = Math.abs(new Date(appliedEndDate).getTime() - new Date(appliedStartDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 31) return 'daily';
      if (diffDays <= 365) return 'monthly';
      return 'yearly';
    }
    if (range === '6m' || range === 'this-year') {
      return 'monthly';
    }
    return 'daily';
  };

  const granularity = getClientGranularity();

  // SVG Chart Setup
  const svgWidth = 800;
  const svgHeight = 350;
  const paddingX = 65;
  const paddingY = 40;
  const chartWidth = svgWidth - 2 * paddingX;
  const chartHeight = svgHeight - 2 * paddingY;

  // Max value calculation across all clustered columns (sales, refunds, chargebacks)
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.salesAmount, d.refundsAmount, d.chargebacksAmount]),
    0
  );
  const maxValue = maxVal > 0 ? maxVal * 1.15 : 100;

  // Generate SVG elements for clustered columns
  const numBins = Math.max(data.length, 1);
  const binWidth = chartWidth / numBins;
  const rawGroupW = binWidth * 0.7;
  const groupW = rawGroupW > 120 ? 120 : rawGroupW; // limit group width if very few bins
  const barGap = 2;
  const singleBarW = Math.max((groupW - 2 * barGap) / 3, 2);

  // Helper to format currency
  const formatYLabel = (val: number) => {
    return `$${Math.round(val).toLocaleString()}`;
  };

  // Helper to thin out date labels
  const shouldShowLabel = (idx: number) => {
    if (data.length <= 12) return true;
    const interval = Math.ceil(data.length / 8);
    return idx % interval === 0 || idx === data.length - 1;
  };

  // Horizontal grid lines
  const gridLines = [];
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const val = (i / gridCount) * maxValue;
    const y = paddingY + chartHeight - (i / gridCount) * chartHeight;
    gridLines.push({ val, y });
  }

  // Mouse event handlers for tooltip positioning
  const handleMouseOver = (idx: number, e: React.MouseEvent<SVGElement>) => {
    setHoveredIdx(idx);
    
    const svg = e.currentTarget.closest('svg');
    const parent = svg?.parentElement;
    if (!svg || !parent) return;

    const svgRect = svg.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const d = data[idx];
    const hSales = Math.max((d.salesAmount / maxValue) * chartHeight, 0) || 0;
    const hRefunds = Math.max((d.refundsAmount / maxValue) * chartHeight, 0) || 0;
    const hChargebacks = Math.max((d.chargebacksAmount / maxValue) * chartHeight, 0) || 0;
    const maxBarH = Math.max(hSales, hRefunds, hChargebacks);

    const yMax = paddingY + chartHeight - maxBarH;
    const centerX = paddingX + idx * binWidth + binWidth / 2;

    const xPixel = (centerX / svgWidth) * svgRect.width + (svgRect.left - parentRect.left);
    const yPixel = (yMax / svgHeight) * svgRect.height + (svgRect.top - parentRect.top);

    setTooltipPos({ x: xPixel, y: yPixel });
  };

  const handleMouseOut = () => {
    setHoveredIdx(null);
  };

  const formatTooltipDate = (label: string) => {
    if (label.length === 10) {
      const dateObj = new Date(label);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
      }
    }
    return label;
  };

  return (
    <div className="advanced-chart-card form-card" style={{ position: 'relative' }}>
      <div className="advanced-chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="form-section-title" style={{ border: 'none', padding: 0, margin: 0 }}>Advanced Performance Analytics</h2>
          <p className="page-subtitle" style={{ margin: 0 }}>Analyze aggregate sales, refunds, and chargebacks simultaneously</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="filters-row" style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="filter-select-wrapper">
          <label htmlFor="center-select" className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Center</label>
          <select
            id="center-select"
            className="filter-select-custom"
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="">All Centers</option>
            {teams.map((t) => (
              <option key={t.teamId} value={t.teamId}>
                {t.teamName}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrapper">
          <label htmlFor="agent-select" className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Agent</label>
          <select
            id="agent-select"
            className="filter-select-custom"
            value={effectiveAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="">All Agents</option>
            {filteredAgents.map((a) => (
              <option key={a.uid} value={a.uid}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-select-wrapper">
          <label htmlFor="range-select" className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Range</label>
          <select
            id="range-select"
            className="filter-select-custom"
            value={range}
            onChange={handleRangeChange}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="2d">Last 2 days</option>
            <option value="7d">Last 7 days</option>
            <option value="this-week">This week</option>
            <option value="last-week">Last week</option>
            <option value="30d">Last 30 days</option>
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
            <option value="6m">Last 6 months</option>
            <option value="this-year">This year</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {range === 'custom' && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="filter-select-wrapper">
              <label htmlFor="start-date-input" className="form-label" style={{ marginBottom: '4px', display: 'block' }}>Start Date</label>
              <input
                id="start-date-input"
                type="date"
                className="filter-select-custom"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="filter-select-wrapper">
              <label htmlFor="end-date-input" className="form-label" style={{ marginBottom: '4px', display: 'block' }}>End Date</label>
              <input
                id="end-date-input"
                type="date"
                className="filter-select-custom"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                role="button"
                className="btn-primary-custom"
                onClick={handleApplyCustom}
                style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.85rem' }}
              >
                Apply
              </button>
              <button
                type="button"
                role="button"
                className="btn-secondary-custom"
                onClick={handleCancelCustom}
                style={{ padding: '8px 16px', minHeight: '38px', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div className="chart-canvas-container" style={{ position: 'relative', width: '100%', overflowX: 'auto', marginTop: '16px' }}>
        {loading ? (
          <div className="loader-box" style={{ border: 'none', height: `${svgHeight}px` }}>
            <div className="spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="empty-box" style={{ border: 'none', height: `${svgHeight}px` }}>
            <p>No activity found matching these filters.</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height={svgHeight} style={{ minWidth: '650px', overflow: 'visible' }}>
              {/* Grid Lines */}
              {gridLines.map((line, idx) => (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={line.y}
                    x2={svgWidth - paddingX}
                    y2={line.y}
                    stroke="#f1f5f9"
                    strokeWidth="1.5"
                    strokeDasharray={idx === 0 ? '0' : '4 4'}
                  />
                  <text
                    x={paddingX - 10}
                    y={line.y + 4}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {formatYLabel(line.val)}
                  </text>
                </g>
              ))}

              {/* Clustered Column Bars */}
              {data.map((d, i) => {
                const centerX = paddingX + i * binWidth + binWidth / 2;
                const groupStartX = centerX - groupW / 2;

                const hSales = Math.max((d.salesAmount / maxValue) * chartHeight, 0) || 0;
                const hRefunds = Math.max((d.refundsAmount / maxValue) * chartHeight, 0) || 0;
                const hChargebacks = Math.max((d.chargebacksAmount / maxValue) * chartHeight, 0) || 0;

                const ySales = paddingY + chartHeight - hSales;
                const yRefunds = paddingY + chartHeight - hRefunds;
                const yChargebacks = paddingY + chartHeight - hChargebacks;

                const xSales = groupStartX;
                const xRefunds = groupStartX + singleBarW + barGap;
                const xChargebacks = groupStartX + 2 * (singleBarW + barGap);

                return (
                  <g
                    key={i}
                    data-testid={`bar-group-${i}`}
                    onMouseOver={(e) => handleMouseOver(i, e)}
                    onMouseOut={handleMouseOut}
                  >
                    {/* Invisible backing rect to capture hover events reliably */}
                    <rect
                      x={centerX - binWidth / 2}
                      y={paddingY}
                      width={binWidth}
                      height={chartHeight}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                    />

                    {/* Sales Column - Soft Blue */}
                    <rect
                      x={xSales}
                      y={ySales}
                      width={singleBarW}
                      height={hSales}
                      fill="#4b7ccd"
                      rx="2"
                    />

                    {/* Refunds Column - Soft Red */}
                    <rect
                      x={xRefunds}
                      y={yRefunds}
                      width={singleBarW}
                      height={hRefunds}
                      fill="#b25353"
                      rx="2"
                    />

                    {/* Chargebacks Column - Soft Tan */}
                    <rect
                      x={xChargebacks}
                      y={yChargebacks}
                      width={singleBarW}
                      height={hChargebacks}
                      fill="#a47c5c"
                      rx="2"
                    />
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {data.map((d, idx) => {
                const x = paddingX + idx * binWidth + binWidth / 2;
                const y = paddingY + chartHeight + 20;

                if (!shouldShowLabel(idx)) return null;

                let labelText = d.label;
                if (granularity === 'daily' && d.label.length === 10) {
                  const dateObj = new Date(d.label);
                  if (!isNaN(dateObj.getTime())) {
                    labelText = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                  }
                } else if (granularity === 'monthly' && d.label.length === 7) {
                  const [yPart, mPart] = d.label.split('-');
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const mIdx = parseInt(mPart, 10) - 1;
                  if (mIdx >= 0 && mIdx < 12) {
                    labelText = `${monthNames[mIdx]} '${yPart.slice(2)}`;
                  }
                }

                return (
                  <text
                    key={idx}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {labelText}
                  </text>
                );
              })}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredIdx !== null && data[hoveredIdx] && (
              <div
                className="chart-tooltip-card"
                style={{
                  position: 'absolute',
                  left: `${tooltipPos.x}px`,
                  top: `${tooltipPos.y}px`,
                  transform: tooltipPos.y < 130 ? 'translate(15px, 10px)' : 'translate(15px, -100%)',
                  pointerEvents: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.98)',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  zIndex: 50,
                  minWidth: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', marginBottom: '2px' }}>
                  {formatTooltipDate(data[hoveredIdx].label)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>Sales amount:</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>
                    <span>{"$" + data[hoveredIdx].salesAmount.toLocaleString()}</span>{' '}
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>
                      ({data[hoveredIdx].salesCount} {data[hoveredIdx].salesCount === 1 ? 'sale' : 'sales'})
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>Refunds:</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>
                    <span>{"$" + data[hoveredIdx].refundsAmount.toLocaleString()}</span>{' '}
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>
                      ({data[hoveredIdx].refundsCount} {data[hoveredIdx].refundsCount === 1 ? 'refund' : 'refunds'})
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', gap: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#64748b' }}>Chargebacks:</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>
                    <span>{"$" + data[hoveredIdx].chargebacksAmount.toLocaleString()}</span>{' '}
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748b' }}>
                      ({data[hoveredIdx].chargebacksCount} {data[hoveredIdx].chargebacksCount === 1 ? 'chargeback' : 'chargebacks'})
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
