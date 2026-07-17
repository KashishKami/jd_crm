import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DateTime } from 'luxon';
import {
  computeDaysLabel,
  getAllFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
} from '../service/followup.service';
import * as followupRepository from '../repository/followup.repository';

// Mock repository
vi.mock('../repository/followup.repository', () => ({
  create: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  findDueForNotification: vi.fn(),
  markNotificationSent: vi.fn(),
}));

describe('Follow-Up Service Layer Unit Tests (W-3105)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computeDaysLabel pure function', () => {
    it('should correctly format relative days in customer timezone', () => {
      // Mock "now" to be 2026-09-01T12:00:00 in America/New_York
      const mockNow = DateTime.fromISO('2026-09-01T12:00:00', { zone: 'America/New_York' });
      vi.spyOn(DateTime, 'now').mockReturnValue(mockNow as any);

      const tz = 'America/New_York';

      // Same day, time in future
      expect(computeDaysLabel('2026-09-01', '13:00', tz)).toBe('1h 0m left');
      expect(computeDaysLabel(new Date('2026-09-01T14:00:00Z'), '13:00', tz)).toBe('1h 0m left');

      // Same day, time in past
      expect(computeDaysLabel('2026-09-01', '11:00', tz)).toBe('Overdue by 1h 0m');

      // Next day -> Tomorrow
      expect(computeDaysLabel('2026-09-02', '12:00', tz)).toBe('Tomorrow');

      // 4 days later -> 4 Days
      expect(computeDaysLabel('2026-09-05', '12:00', tz)).toBe('4 Days');

      // Yesterday -> Due by 1 day
      expect(computeDaysLabel('2026-08-31', '12:00', tz)).toBe('Due by 1 day');

      // 7 days ago -> Due by 7 days
      expect(computeDaysLabel('2026-08-25', '12:00', tz)).toBe('Due by 7 days');

      vi.restoreAllMocks();
    });

    it('should correctly calculate days label when followUpDate is a JS Date object in western timezone without shifting day', () => {
      // Mock "now" to be 2026-07-16T20:00:00Z (July 16 at 11am in Anchorage)
      const mockNow = DateTime.fromISO('2026-07-16T20:00:00Z');
      vi.spyOn(DateTime, 'now').mockReturnValue(mockNow as any);

      const tz = 'America/Anchorage';

      // Prisma Date object representing midnight UTC on July 17:
      const dateObj = new Date('2026-07-17T00:00:00.000Z');
      
      expect(computeDaysLabel(dateObj, '17:00', tz)).toBe('Tomorrow');
      expect(computeDaysLabel('2026-07-17', '17:00', tz)).toBe('Tomorrow');

      vi.restoreAllMocks();
    });
  });

  describe('getAllFollowUps filter scoping', () => {
    const mockUserViewAll = { id: 10, userPermissions: 'follow-ups:view' };
    const mockUserCreateOwn = { id: 20, userPermissions: 'follow-ups:create' };

    it('should scoping filters correctly for admin (view all)', async () => {
      const mockResult = { followUps: [], total: 0 };
      vi.mocked(followupRepository.findAll).mockResolvedValue(mockResult);

      const filters = { agentId: 5, teamId: 2, priority: 'High' };
      await getAllFollowUps(mockUserViewAll, filters);

      expect(followupRepository.findAll).toHaveBeenCalledWith({
        agentId: 5,
        teamId: 2,
        priority: 'High',
      });
    });

    it('should enforce self-only scoping for agents (create own)', async () => {
      const mockResult = { followUps: [], total: 0 };
      vi.mocked(followupRepository.findAll).mockResolvedValue(mockResult);

      const filters = { agentId: 5, teamId: 2, priority: 'High' };
      await getAllFollowUps(mockUserCreateOwn, filters);

      expect(followupRepository.findAll).toHaveBeenCalledWith({
        agentId: 20, // Forced to user's id
        priority: 'High', // teamId is deleted
      });
    });

    it('should throw Forbidden error if user has no permissions', async () => {
      const mockUserNoPerms = { id: 30, userPermissions: '' };
      await expect(getAllFollowUps(mockUserNoPerms, {})).rejects.toThrow('Forbidden: Insufficient Permissions');
    });
  });

  describe('getFollowUpById permissions check', () => {
    const mockUserCreateOwn = { id: 20, userPermissions: 'follow-ups:create' };

    it('should throw Forbidden if agent tries to access other agent record', async () => {
      const mockRecord = { followUpId: 101, agentId: 99, customerName: 'Alice' } as any;
      vi.mocked(followupRepository.findById).mockResolvedValue(mockRecord);

      await expect(getFollowUpById(mockUserCreateOwn, 101)).rejects.toThrow('Forbidden: Insufficient Permissions');
    });

    it('should return record if agent owns it', async () => {
      const mockRecord = { followUpId: 101, agentId: 20, customerName: 'Alice' } as any;
      vi.mocked(followupRepository.findById).mockResolvedValue(mockRecord);

      const result = await getFollowUpById(mockUserCreateOwn, 101);
      expect(result).toBeDefined();
      expect(result?.customerName).toBe('Alice');
    });
  });

  describe('updateFollowUp logic rules', () => {
    const mockUserCreateOwn = { id: 20, userPermissions: 'follow-ups:create' };

    it('should set notificationSentAt to null and lastContact to now if date changes', async () => {
      const mockRecord = { followUpId: 101, agentId: 20, customerTimezone: 'America/New_York' } as any;
      vi.mocked(followupRepository.findById).mockResolvedValue(mockRecord);
      vi.mocked(followupRepository.update).mockResolvedValue({} as any);

      await updateFollowUp(mockUserCreateOwn, 101, {
        followUpDate: '2026-10-01',
      });

      expect(followupRepository.update).toHaveBeenCalledWith(
        101,
        expect.objectContaining({
          followUpDate: '2026-10-01',
          notificationSentAt: null,
          lastContact: expect.any(Date),
        })
      );
    });

    it('should not update lastContact or notificationSentAt on non-meaningful fields like priority', async () => {
      const mockRecord = { followUpId: 101, agentId: 20, customerTimezone: 'America/New_York' } as any;
      vi.mocked(followupRepository.findById).mockResolvedValue(mockRecord);
      vi.mocked(followupRepository.update).mockResolvedValue({} as any);

      await updateFollowUp(mockUserCreateOwn, 101, {
        priority: 'Low',
      });

      expect(followupRepository.update).toHaveBeenCalledWith(101, {
        priority: 'Low',
      });
    });
  });

  describe('deleteFollowUp permissions check', () => {
    it('should throw Forbidden for non-admin delete attempts', async () => {
      const mockUserCreateOwn = { id: 20, userPermissions: 'follow-ups:create' };
      await expect(deleteFollowUp(mockUserCreateOwn, 101)).rejects.toThrow('Forbidden: Insufficient Permissions');
    });
  });
});
