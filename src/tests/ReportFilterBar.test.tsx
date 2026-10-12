// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportFilterBar from '../components/reports/ReportFilterBar';
import { ReportAgentOption } from '../types/report';

const mockTeams = [
  { teamId: 1, teamName: 'IT Park' },
  { teamId: 2, teamName: 'Mohali Phase 7' },
  { teamId: 3, teamName: 'Delhi HQ' },
];

const mockAgents: ReportAgentOption[] = [
  {
    uid: 101,
    name: 'John Doe',
    nickname: 'Johnny',
    teamId: 1,
    teamName: 'IT Park',
    designation: 'Sales Specialist',
    status: 1,
  },
  {
    uid: 102,
    name: 'Jane Smith',
    nickname: 'Janey',
    teamId: 1,
    teamName: 'IT Park',
    designation: 'Sales Associate',
    status: 0,
  },
  {
    uid: 201,
    name: 'Bob Ross',
    nickname: 'Painter',
    teamId: 2,
    teamName: 'Mohali Phase 7',
    designation: 'Sales Supervisor',
    status: 1,
  },
];

describe('W-4403: ReportFilterBar Component (Advance Performance Chart Style)', () => {
  let onFilterChange: any;
  let onMetricViewChange: any;
  let onExportExcel: any;

  beforeEach(() => {
    onFilterChange = vi.fn();
    onMetricViewChange = vi.fn();
    onExportExcel = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Center multi-select dropdown with All Centers and available teams', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const centerBtn = screen.getByText('All Centers');
    expect(centerBtn).toBeDefined();

    // Click to open dropdown
    fireEvent.click(centerBtn);

    // Select IT Park
    const itParkOption = screen.getByText('IT Park');
    expect(itParkOption).toBeDefined();
    fireEvent.click(itParkOption);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        teamIds: [1],
        agentIds: [],
      })
    );
  });

  it('scopes Agent dropdown to selected Center with Active and Inactive sections', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[1]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const agentBtn = screen.getByText('All Agents');
    expect(agentBtn).toBeDefined();

    // Click to open agent dropdown
    fireEvent.click(agentBtn);

    // Johnny (Active) and Janey (Inactive) in Team 1 should be present
    expect(screen.getByText('Johnny')).toBeDefined();
    expect(screen.getByText('Janey')).toBeDefined();

    // Painter in Team 2 should NOT be in the options
    expect(screen.queryByText('Painter')).toBeNull();

    // Select Johnny
    fireEvent.click(screen.getByText('Johnny'));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        teamIds: [1],
        agentIds: [101],
      })
    );
  });

  it('changes range to "this-week", "all-time", etc. via Range dropdown', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const rangeSelect = screen.getByLabelText(/range/i) as HTMLSelectElement;
    fireEvent.change(rangeSelect, { target: { value: 'this-week' } });

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        range: 'this-week',
      })
    );

    // Test All Time option
    fireEvent.change(rangeSelect, { target: { value: 'all-time' } });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        range: 'all-time',
      })
    );
  });

  it('handles Custom Range with Apply and Cancel buttons correctly', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="custom"
        startDate="2026-01-01"
        endDate="2026-01-15"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/end date/i) as HTMLInputElement;
    expect(startDateInput.value).toBe('2026-01-01');
    expect(endDateInput.value).toBe('2026-01-15');

    // Change start date and click Apply
    fireEvent.change(startDateInput, { target: { value: '2026-01-05' } });
    const applyBtn = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyBtn);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        range: 'custom',
        startDate: '2026-01-05',
        endDate: '2026-01-15',
      })
    );

    // Click Cancel -> reverts to this-week
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        range: 'this-week',
        startDate: undefined,
        endDate: undefined,
      })
    );
  });

  it('switches metric views when clicking metric switcher pills', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const netBtn = screen.getByRole('button', { name: /net sales/i });
    fireEvent.click(netBtn);
    expect(onMetricViewChange).toHaveBeenCalled();

    const allBtn = screen.getByRole('button', { name: /all 4 metrics/i });
    fireEvent.click(allBtn);
    expect(onMetricViewChange).toHaveBeenCalledWith('all');
  });

  it('invokes onExportExcel when clicking Export XLS', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const exportBtn = screen.getByRole('button', { name: /export xls/i });
    fireEvent.click(exportBtn);
    expect(onExportExcel).toHaveBeenCalledTimes(1);
  });

  it('renders Month, Year, and Granularity selectors when range is "monthly"', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="monthly"
        year={2026}
        month={10}
        granularity="summary"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    // Month selector present with 'Oct'
    const monthSelect = screen.getByLabelText(/month/i) || screen.getByDisplayValue('Oct');
    expect(monthSelect).toBeDefined();

    // Year selector present with '2026'
    const yearSelect = screen.getByLabelText(/year/i) || screen.getByDisplayValue('2026');
    expect(yearSelect).toBeDefined();

    // Granularity selector present with 'Monthly Summary'
    const granSelect = screen.getByLabelText(/granularity/i) || screen.getByDisplayValue(/Monthly Summary/i);
    expect(granSelect).toBeDefined();
  });

  it('renders Year and Granularity selectors when range is "yearly"', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="yearly"
        year={2025}
        granularity="summary"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    expect(screen.getByDisplayValue('2025')).toBeDefined();
    expect(screen.getByDisplayValue(/Yearly Summary/i)).toBeDefined();
    // Month should NOT be shown in yearly
    expect(screen.queryByDisplayValue('Oct')).toBeNull();
  });

  it('omits Export XLS button when canExport is false', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
        canExport={false}
      />
    );

    expect(screen.queryByRole('button', { name: /export xls/i })).toBeNull();
  });

  it('renders Export XLS button when canExport is true', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
        canExport={true}
      />
    );

    expect(screen.getByRole('button', { name: /export xls/i })).toBeDefined();
  });
});
