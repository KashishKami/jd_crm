// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import AdvancedChartWidget from '../components/dashboard/AdvancedChartWidget';

const globalFetch = global.fetch;

describe('Debug AdvancedChartWidget', () => {
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
            { uid: 101, name: 'Alice Agent', teamId: 1 },
            { uid: 102, name: 'Bob Agent', teamId: 2 },
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

  it('debugs tooltip hover matching', async () => {
    const { container } = render(<AdvancedChartWidget />);
    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull();
    });

    const groupElement = container.querySelector('[data-testid="bar-group-0"]');
    expect(groupElement).not.toBeNull();

    fireEvent.mouseOver(groupElement!);

    await waitFor(() => {
      // Find all text elements to see what is rendered
      const texts = Array.from(document.querySelectorAll('span, div')).map(el => el.textContent);
      console.log('RENDERED TEXTS:', texts);

      const el = screen.getAllByText(/^\$500$/)[0];
      console.log('FOUND ELEMENT:', el.outerHTML);
      expect(el).toBeDefined();
    });
  });

  it('does not contain rolling window options in range select but contains calendar-aligned options', async () => {
    render(<AdvancedChartWidget />);
    await waitFor(() => {
      expect(screen.queryByText(/Last 7 days/i)).toBeNull();
      expect(screen.queryByText(/Last 30 days/i)).toBeNull();
      expect(screen.queryByText(/Last 2 days/i)).toBeNull();
      expect(screen.getByText(/This week/i)).toBeDefined();
      expect(screen.getByText(/Monthly/i)).toBeDefined();
      expect(screen.getByText(/Yearly/i)).toBeDefined();
    });
  });
});
