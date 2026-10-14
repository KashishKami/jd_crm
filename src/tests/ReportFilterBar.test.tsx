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

    // Click IT Park while All Centers is active -> unchecks IT Park, selecting remaining teams [2, 3]
    const itParkOption = screen.getByText('IT Park');
    expect(itParkOption).toBeDefined();
    fireEvent.click(itParkOption);

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        teamIds: [2, 3],
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

    // Expand both active and inactive accordions
    fireEvent.click(screen.getByLabelText(/toggle active agents accordion/i));
    fireEvent.click(screen.getByLabelText(/toggle inactive agents accordion/i));

    // Johnny (Active) and Janey (Inactive) in Team 1 should be present
    expect(screen.getByText('Johnny')).toBeDefined();
    expect(screen.getByText('Janey')).toBeDefined();

    // Painter in Team 2 should NOT be in the options
    expect(screen.queryByText('Painter')).toBeNull();

    // Click Johnny while All Agents in Team 1 is active -> unchecks Johnny, leaving Janey [102]
    fireEvent.click(screen.getByText('Johnny'));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        teamIds: [1],
        agentIds: [102],
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

  it('hides Center dropdown when showTeamFilter is false (team-scoped user)', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[2]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        showTeamFilter={false}
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    // Center dropdown button must NOT be present in DOM
    expect(screen.queryByText(/Centers Selected/i)).toBeNull();
    expect(screen.queryByText('All Centers')).toBeNull();
  });

  it('does NOT render "Weekly (Calendar Weeks)" option in Granularity dropdown when range is "yearly"', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="yearly"
        year={2026}
        granularity="summary"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const granSelect = screen.getByLabelText(/granularity/i) as HTMLSelectElement;
    expect(granSelect).toBeDefined();
    const options = Array.from(granSelect.options).map((o) => o.text);
    expect(options).toContain('Yearly Summary');
    expect(options).toContain('Monthly (12 Months)');
    expect(options).not.toContain('Weekly (Calendar Weeks)');
  });

  it('renders Sort selector and triggers onFilterChange with selected sort', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="monthly"
        metricView="all"
        sortBy="net"
        sortOrder="desc"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const sortSelect = screen.getByLabelText(/sort by/i) as HTMLSelectElement;
    expect(sortSelect).toBeDefined();

    // Change sort to 'sales'
    fireEvent.change(sortSelect, { target: { value: 'sales:desc' } });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'sales',
        sortOrder: 'desc',
      })
    );
  });

  it('defaults start and end date to today when switching to custom range', () => {
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
    fireEvent.change(rangeSelect, { target: { value: 'custom' } });

    const todayStr = new Date().toISOString().split('T')[0];
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        range: 'custom',
        startDate: todayStr,
        endDate: todayStr,
      })
    );
  });

  it('does NOT render "Weekly (Calendar Weeks)" option in Granularity dropdown when range is "custom"', () => {
    render(
      <ReportFilterBar
        teams={mockTeams}
        agents={mockAgents}
        selectedTeamIds={[]}
        selectedAgentIds={[]}
        range="custom"
        startDate="2026-09-01"
        endDate="2026-10-13"
        granularity="summary"
        metricView="all"
        onFilterChange={onFilterChange}
        onMetricViewChange={onMetricViewChange}
        onExportExcel={onExportExcel}
      />
    );

    const granSelect = screen.getByLabelText(/granularity/i) as HTMLSelectElement;
    expect(granSelect).toBeDefined();
    const options = Array.from(granSelect.options).map((o) => o.text);
    expect(options).toContain('Period Summary');
    expect(options).toContain('Daily');
    expect(options).toContain('Monthly');
    expect(options).not.toContain('Weekly (Calendar Weeks)');
  });

  describe('Phase 46 — Synchronized "All" Checkboxes & Active/Inactive Group Filters', () => {
    it('renders all individual Center checkboxes as checked when selectedTeamIds is empty (All Centers)', () => {
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

      // Open Center dropdown via select button
      fireEvent.click(document.getElementById('center-select')!);

      // The "All Centers" checkbox in the dropdown list should be checked
      const allCentersDiv = screen.getAllByText('All Centers').find((el) => el.tagName === 'SPAN')?.closest('div');
      const allCentersCheckbox = allCentersDiv?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(allCentersCheckbox.checked).toBe(true);

      // Every individual center checkbox must also be checked
      for (const t of mockTeams) {
        const teamDiv = screen.getByText(t.teamName).closest('div');
        const teamCheckbox = teamDiv?.querySelector('input[type="checkbox"]') as HTMLInputElement;
        expect(teamCheckbox.checked).toBe(true);
      }
    });

    it('unchecks one center when clicked from "All Centers", setting selectedTeamIds to all remaining teams', () => {
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

      fireEvent.click(document.getElementById('center-select')!);

      // Click "IT Park" (teamId 1) to uncheck it
      const itParkDiv = screen.getByText('IT Park').closest('div')!;
      fireEvent.click(itParkDiv);

      // Should call onFilterChange with teams EXCEPT IT Park: [2, 3]
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          teamIds: [2, 3],
        })
      );
    });

    it('renders all individual Agent checkboxes as checked when selectedAgentIds is empty (All Agents)', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);

      const allAgentsDiv = screen.getAllByText('All Agents').find((el) => el.tagName === 'SPAN')?.closest('div');
      const allAgentsCheckbox = allAgentsDiv?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(allAgentsCheckbox.checked).toBe(true);

      // Expand both accordions to inspect individual checkboxes
      fireEvent.click(screen.getByLabelText(/toggle active agents accordion/i));
      fireEvent.click(screen.getByLabelText(/toggle inactive agents accordion/i));

      // Every individual agent checkbox must be checked
      for (const a of mockAgents) {
        const agentDiv = screen.getByText(a.nickname || a.name).closest('div');
        const agentCheckbox = agentDiv?.querySelector('input[type="checkbox"]') as HTMLInputElement;
        expect(agentCheckbox.checked).toBe(true);
      }
    });

    it('unchecks one agent when clicked from "All Agents", setting selectedAgentIds to all remaining agents', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);

      // Expand active agents accordion
      fireEvent.click(screen.getByLabelText(/toggle active agents accordion/i));

      // Click "Johnny" (uid 101) to uncheck him
      const johnnyDiv = screen.getByText('Johnny').closest('div')!;
      fireEvent.click(johnnyDiv);

      // Should call onFilterChange with agents EXCEPT Johnny: [102, 201]
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          agentIds: [102, 201],
        })
      );
    });

    it('renders interactive Active and Inactive group checkboxes in the Agent dropdown that reflect full selection', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);

      const activeGroupCheckbox = screen.getByLabelText(/select all active agents/i) as HTMLInputElement;
      const inactiveGroupCheckbox = screen.getByLabelText(/select all inactive agents/i) as HTMLInputElement;

      expect(activeGroupCheckbox).toBeDefined();
      expect(inactiveGroupCheckbox).toBeDefined();
      expect(activeGroupCheckbox.checked).toBe(true);
      expect(inactiveGroupCheckbox.checked).toBe(true);
    });

    it('toggles off all Active agents in one click when clicking Active group checkbox', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);

      const activeGroupCheckbox = screen.getByLabelText(/select all active agents/i);
      fireEvent.click(activeGroupCheckbox);

      // Active agents are 101 (Johnny) and 201 (Painter). Inactive is 102 (Janey).
      // Unchecking active group should leave only inactive agents: [102]
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          agentIds: [102],
        })
      );
    });

    it('toggles on all Active agents in one click when clicking Active group checkbox while active agents are unselected', () => {
      // Starting with only Janey (102, inactive) selected
      render(
        <ReportFilterBar
          teams={mockTeams}
          agents={mockAgents}
          selectedTeamIds={[]}
          selectedAgentIds={[102]}
          range="monthly"
          metricView="all"
          onFilterChange={onFilterChange}
          onMetricViewChange={onMetricViewChange}
          onExportExcel={onExportExcel}
        />
      );

      fireEvent.click(document.getElementById('agent-select')!);

      const activeGroupCheckbox = screen.getByLabelText(/select all active agents/i);
      expect((activeGroupCheckbox as HTMLInputElement).checked).toBe(false);

      fireEvent.click(activeGroupCheckbox);

      // Should now select active agents 101 and 201 while retaining 102 -> all 3 agents selected (normalized to [])
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          agentIds: [],
        })
      );
    });

    it('toggles off all Inactive agents in one click when clicking Inactive group checkbox', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);

      const inactiveGroupCheckbox = screen.getByLabelText(/select all inactive agents/i);
      fireEvent.click(inactiveGroupCheckbox);

      // Inactive agent is 102 (Janey). Active agents are 101 (Johnny) and 201 (Painter).
      // Unchecking inactive should retain only active agents: [101, 201]
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          agentIds: [101, 201],
        })
      );
    });

    it('toggles on all Inactive agents in one click when clicking Inactive group checkbox while inactive agents are unselected', () => {
      // Starting with only active agents [101, 201] selected
      render(
        <ReportFilterBar
          teams={mockTeams}
          agents={mockAgents}
          selectedTeamIds={[]}
          selectedAgentIds={[101, 201]}
          range="monthly"
          metricView="all"
          onFilterChange={onFilterChange}
          onMetricViewChange={onMetricViewChange}
          onExportExcel={onExportExcel}
        />
      );

      fireEvent.click(document.getElementById('agent-select')!);

      const inactiveGroupCheckbox = screen.getByLabelText(/select all inactive agents/i);
      expect((inactiveGroupCheckbox as HTMLInputElement).checked).toBe(false);

      fireEvent.click(inactiveGroupCheckbox);

      // Should add 102 (inactive) to [101, 201] -> all 3 agents (normalized to [])
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          agentIds: [],
        })
      );
    });

    it('scopes Active/Inactive toggling when search query is typed in agent filter', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);

      // Search for "John" -> only Johnny (101) matches in active
      const searchInput = screen.getByPlaceholderText(/search agents/i);
      fireEvent.change(searchInput, { target: { value: 'John' } });

      const activeGroupCheckbox = screen.getByLabelText(/select all active agents/i);
      fireEvent.click(activeGroupCheckbox);

      // Unchecking active group while searching "John" should only remove Johnny (101),
      // retaining Painter (201) and Janey (102)
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          agentIds: [102, 201],
        })
      );
    });

    it('correctly re-checks "All Centers" and "All Agents" when clicked again', () => {
      // Starting with partial centers selected
      render(
        <ReportFilterBar
          teams={mockTeams}
          agents={mockAgents}
          selectedTeamIds={[2]}
          selectedAgentIds={[101]}
          range="monthly"
          metricView="all"
          onFilterChange={onFilterChange}
          onMetricViewChange={onMetricViewChange}
          onExportExcel={onExportExcel}
        />
      );

      // Click center button
      fireEvent.click(document.getElementById('center-select')!);
      const allCentersOption = screen
        .getAllByText('All Centers')
        .find((el) => el.parentElement?.querySelector('input[type="checkbox"]'))?.parentElement!;
      fireEvent.click(allCentersOption);

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          teamIds: [],
        })
      );

      // Click agent button
      fireEvent.click(document.getElementById('agent-select')!);
      const allAgentsOption = screen
        .getAllByText('All Agents')
        .find((el) => el.parentElement?.querySelector('input[type="checkbox"]'))?.parentElement!;
      fireEvent.click(allAgentsOption);

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          agentIds: [],
        })
      );
    });
  });

  describe('W-4802: Agent Filter Collapsible Accordions & Scroll Containment', () => {
    it('opens with Active and Inactive sections collapsed by default and group checkboxes checked', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);

      const activeGroupCheckbox = screen.getByLabelText(/select all active agents/i) as HTMLInputElement;
      const inactiveGroupCheckbox = screen.getByLabelText(/select all inactive agents/i) as HTMLInputElement;

      expect(activeGroupCheckbox.checked).toBe(true);
      expect(inactiveGroupCheckbox.checked).toBe(true);

      // Accordion toggle buttons exist
      expect(screen.getByLabelText(/toggle active agents accordion/i)).toBeDefined();
      expect(screen.getByLabelText(/toggle inactive agents accordion/i)).toBeDefined();

      // By default collapsed, individual agent names are not displayed
      expect(screen.queryByText('Johnny')).toBeNull();
      expect(screen.queryByText('Janey')).toBeNull();
    });

    it('expands Active Agents accordion when clicking toggle button', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);
      const toggleActiveBtn = screen.getByLabelText(/toggle active agents accordion/i);
      fireEvent.click(toggleActiveBtn);

      // Now active agents are visible
      expect(screen.getByText('Johnny')).toBeDefined();
      expect(screen.getByText('Painter')).toBeDefined();
      // Inactive agent still hidden
      expect(screen.queryByText('Janey')).toBeNull();
    });

    it('unchecking "All Agents" deselects all agents and sets selectedAgentIds to [-1] (empty)', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);

      const allAgentsCheckbox = screen.getByLabelText(/select all agents/i) as HTMLInputElement;
      expect(allAgentsCheckbox.checked).toBe(true);

      fireEvent.click(allAgentsCheckbox);

      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          agentIds: [-1],
        })
      );
    });

    it('displays "Select Agents..." button text when selectedAgentIds is [-1]', () => {
      render(
        <ReportFilterBar
          teams={mockTeams}
          agents={mockAgents}
          selectedTeamIds={[]}
          selectedAgentIds={[-1]}
          range="monthly"
          metricView="all"
          onFilterChange={onFilterChange}
          onMetricViewChange={onMetricViewChange}
          onExportExcel={onExportExcel}
        />
      );

      expect(screen.getByText('Select Agents...')).toBeDefined();
    });

    it('dropdown container contains overscroll-behavior contain', () => {
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

      fireEvent.click(document.getElementById('agent-select')!);
      const dropdownMenu = screen.getByTestId('agent-dropdown-menu');
      expect(dropdownMenu.style.overscrollBehavior).toBe('contain');
    });

    it('shows correct selected agent count in "Showing sales aggregates across X sales agents"', () => {
      // 1. All agents selected by default -> 3 mock agents
      const { rerender } = render(
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
      expect(screen.getByText(/showing sales aggregates across/i).textContent).toContain('3 sales agents');

      // 2. Subset selected: only 2 active agents [101, 201]
      rerender(
        <ReportFilterBar
          teams={mockTeams}
          agents={mockAgents}
          selectedTeamIds={[]}
          selectedAgentIds={[101, 201]}
          range="monthly"
          metricView="all"
          onFilterChange={onFilterChange}
          onMetricViewChange={onMetricViewChange}
          onExportExcel={onExportExcel}
        />
      );
      expect(screen.getByText(/showing sales aggregates across/i).textContent).toContain('2 sales agents');

      // 3. Single agent selected [101]
      rerender(
        <ReportFilterBar
          teams={mockTeams}
          agents={mockAgents}
          selectedTeamIds={[]}
          selectedAgentIds={[101]}
          range="monthly"
          metricView="all"
          onFilterChange={onFilterChange}
          onMetricViewChange={onMetricViewChange}
          onExportExcel={onExportExcel}
        />
      );
      expect(screen.getByText(/showing sales aggregates across/i).textContent).toContain('1 sales agent');

      // 4. Zero agents selected (isExplicitNone: [-1])
      rerender(
        <ReportFilterBar
          teams={mockTeams}
          agents={mockAgents}
          selectedTeamIds={[]}
          selectedAgentIds={[-1]}
          range="monthly"
          metricView="all"
          onFilterChange={onFilterChange}
          onMetricViewChange={onMetricViewChange}
          onExportExcel={onExportExcel}
        />
      );
      expect(screen.getByText(/showing sales aggregates across/i).textContent).toContain('0 sales agents');

      // 5. Scoped by Center: Team 1 has 2 agents (101, 102). With selectedAgentIds=[] (all in team 1)
      rerender(
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
      expect(screen.getByText(/showing sales aggregates across/i).textContent).toContain('2 sales agents');
    });
  });
});


