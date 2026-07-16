import { describe, it, expect, vi, afterEach } from 'vitest';
import { findDueForNotification } from '../repository/followup.repository';
import { prisma } from '../lib/db';

vi.mock('../lib/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe('FollowUp Repository Unit Tests (W-3159)', () => {
  it('should format raw SQL snake_case keys into camelCase keys and not leak snake_case', async () => {
    const rawMock = [
      {
        follow_up_id: 7,
        agent_id: 1,
        agent_name: 'Sarah',
        customer_name: 'Alice',
        customer_phone: '555-123-4567',
        customer_state: 'California',
        customer_country: 'USA',
        customer_timezone: 'America/New_York',
        vehicle_year_make_model: '2020 Toyota Camry',
        part_required: 'Bumper',
        part_description: 'Front bumper cover',
        quoted_options: '$100 - Used',
        follow_up_date: new Date('2026-09-10'),
        follow_up_time: '09:00',
        follow_up_reason: 'Follow up',
        status: 'Interested',
        priority: 'High',
        notes: 'Called customer',
        entry_date: new Date(),
        last_contact: new Date(),
        notification_sent_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    vi.mocked(prisma.$queryRaw).mockResolvedValue(rawMock);

    const result = await findDueForNotification();

    expect(result.length).toBe(1);
    expect(result[0].followUpId).toBe(7);
    expect(result[0].agentId).toBe(1);
    expect(result[0].customerName).toBe('Alice');
    expect(result[0].partRequired).toBe('Bumper');
    expect(result[0].followUpTime).toBe('09:00');
    expect(result[0].customerTimezone).toBe('America/New_York');
    expect(result[0].notificationSentAt).toBeNull();

    // Verify snake_case properties are not leaked/present
    expect(result[0]).not.toHaveProperty('follow_up_id');
    expect(result[0]).not.toHaveProperty('customer_name');
    expect(result[0]).not.toHaveProperty('part_required');
  });
});
