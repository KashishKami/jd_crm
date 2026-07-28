// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TeamMonthlyScoresWidget from '../components/dashboard/TeamMonthlyScoresWidget';

// Mock fetch for /api/dashboard/teams/monthly
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve([
        {
          teamId: 1,
          teamName: 'IT Park',
          soldCount: 27,
          refundCount: 1,
          chargebackCount: 1,
          netAmount: 13938,
          topPerformers: [],
          bottomPerformers: [],
        },
        {
          teamId: 2,
          teamName: 'Alex',
          soldCount: 20,
          refundCount: 0,
          chargebackCount: 0,
          netAmount: 11765,
          topPerformers: [],
          bottomPerformers: [],
        },
      ]),
  })
);

describe('W-3901 — TeamMonthlyScoresWidget Mobile Stacking', () => {
  it('should render CSS style block containing @media (max-width: 1000px) with vertical column layout', async () => {
    const permissions = 'dashboard:team-monthly-scores';
    const { container } = render(<TeamMonthlyScoresWidget permissions={permissions} />);

    // Wait for content to load
    await screen.findByText('IT Park');

    // Find the style tag inside .team-monthly-container
    const styleTag = container.querySelector('style');
    expect(styleTag).not.toBeNull();
    const styleText = styleTag?.innerHTML || '';

    // Must include media query for max-width: 1000px with column layout
    expect(styleText).toContain('@media (max-width: 1000px)');
    expect(styleText).toContain('flex-direction: column');
  });
});
