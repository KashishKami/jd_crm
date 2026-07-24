// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNavbarNotifications } from '../lib/useNavbarNotifications';

global.fetch = vi.fn();

describe('useNavbarNotifications Hook Unit Tests (W-3702)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch overdue followups from /api/follow-ups/overdue and return overdueList and dueCount', async () => {
    const mockOverdue = [
      {
        followUpId: 10,
        customerName: 'John Doe',
        followUpTime: '09:00',
        customerTimezone: 'America/New_York',
        partRequired: 'Transmission',
        daysLabel: 'Overdue by 15m',
        priority: 'High',
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOverdue,
    } as Response);

    const { result } = renderHook(() => useNavbarNotifications());

    await waitFor(() => {
      expect(result.current.dueCount).toBe(1);
    });

    expect(result.current.overdueList.length).toBe(1);
    expect(result.current.overdueList[0].customerName).toBe('John Doe');
    expect(global.fetch).toHaveBeenCalledWith('/api/follow-ups/overdue');
  });
});
