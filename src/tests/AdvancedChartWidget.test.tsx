// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import AdvancedChartWidget from '../components/dashboard/AdvancedChartWidget';

const globalFetch = global.fetch;

describe('AdvancedChartWidget Redesigned Unit Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/teams')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { teamId: 1, teamName: 'IT Park' },
            { teamId: 2, teamName: 'DB Park' },
          ],
        });
      }
      if (url.includes('/api/agents')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { uid: 101, name: 'Alice Agent', teamId: 1, designation: 'Sales Specialist', status: 1 },
            { uid: 102, name: 'Bob Agent', teamId: 2, designation: 'Sales Specialist', status: 1 },
          ],
        });
      }
      if (url.includes('/api/dashboard/advanced-chart')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              label: '2026-06-25',
              salesAmount: 500,
              salesCount: 2,
              refundsAmount: 100,
              refundsCount: 1,
              chargebacksAmount: 50,
              chargebacksCount: 1,
            },
            {
              label: '2026-06-26',
              salesAmount: 800,
              salesCount: 3,
              refundsAmount: 0,
              refundsCount: 0,
              chargebacksAmount: 150,
              chargebacksCount: 1,
            },
          ],
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  afterEach(() => {
    cleanup();
    global.fetch = globalFetch;
  });

  it('should render Center (team) dropdown and dynamic Agent dropdown', async () => {
    render(<AdvancedChartWidget />);

    // Wait for Center and Agent dropdowns to load
    await waitFor(() => {
      expect(screen.getByLabelText(/center/i)).toBeDefined();
      expect(screen.getByLabelText(/agent/i)).toBeDefined();
    });

    const centerSelect = screen.getByLabelText(/center/i) as HTMLSelectElement;
    const agentSelect = screen.getByLabelText(/agent/i) as HTMLSelectElement;

    // Center select should have IT Park (value 1) and DB Park (value 2)
    expect(centerSelect.querySelector('option[value="1"]')).not.toBeNull();
    expect(centerSelect.querySelector('option[value="2"]')).not.toBeNull();

    // Verify all agents display initially (or no filter)
    expect(agentSelect.querySelector('option[value="101"]')).not.toBeNull();
    expect(agentSelect.querySelector('option[value="102"]')).not.toBeNull();

    // Select IT Park (value 1)
    fireEvent.change(centerSelect, { target: { value: '1' } });

    // Alice (teamId 1) should remain, Bob (teamId 2) should be filtered out
    expect(agentSelect.querySelector('option[value="101"]')).not.toBeNull();
    expect(agentSelect.querySelector('option[value="102"]')).toBeNull();
  });

  it('should render Custom Range date fields and Apply/Cancel buttons only when custom range is selected', async () => {
    render(<AdvancedChartWidget />);

    await waitFor(() => {
      expect(screen.getByLabelText(/range/i)).toBeDefined();
    });

    const rangeSelect = screen.getByLabelText(/range/i) as HTMLSelectElement;

    // Date inputs and buttons should not be visible initially
    expect(screen.queryByLabelText(/start date/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();

    // Change to custom range
    fireEvent.change(rangeSelect, { target: { value: 'custom' } });

    // Now inputs and buttons must render
    expect(screen.getByLabelText(/start date/i)).toBeDefined();
    expect(screen.getByLabelText(/end date/i)).toBeDefined();
    
    const applyBtn = screen.getByRole('button', { name: /apply/i });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });

    expect(applyBtn).toBeDefined();
    expect(cancelBtn).toBeDefined();

    // Click cancel should revert selection to default (this-week)
    fireEvent.click(cancelBtn);
    expect(rangeSelect.value).toBe('this-week');
    expect(screen.queryByLabelText(/start date/i)).toBeNull();
  });

  it('should display hover tooltip card with correct aggregated sales, refunds, and chargeback amounts/counts', async () => {
    const { container } = render(<AdvancedChartWidget />);

    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull();
    });

    // Verify SVG rect columns are rendered (3 columns per data point * 2 data points = 6 rects)
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(6);

    // Tooltip should be hidden initially
    expect(screen.queryByText(/Sales amount:/i)).toBeNull();

    // Hover over the first bar group (we can trigger mouseover on the first circle or group wrapper)
    const groupElement = container.querySelector('[data-testid="bar-group-0"]');
    expect(groupElement).not.toBeNull();

    fireEvent.mouseOver(groupElement!);

    // Tooltip should appear containing the values for salesAmount (500, count 2), refundsAmount (100, count 1), chargebacksAmount (50, count 1)
    await waitFor(() => {
      const texts = Array.from(document.querySelectorAll('span, div')).map(el => el.textContent);
      console.log('ADVANCED CHART WIDGET TEST RENDERED TEXTS:', texts);
      expect(screen.getByText(/^\$500$/)).toBeDefined();
      expect(screen.getByText(/\(2 sales\)/i)).toBeDefined();
      expect(screen.getByText(/^\$100$/)).toBeDefined();
      expect(screen.getByText(/\(1 refund\)/i)).toBeDefined();
      expect(screen.getByText(/^\$50$/)).toBeDefined();
      expect(screen.getByText(/\(1 chargeback\)/i)).toBeDefined();
    });

    // Move mouse out
    fireEvent.mouseOut(groupElement!);
    expect(screen.queryByText(/Sales amount:/i)).toBeNull();
  });
});
