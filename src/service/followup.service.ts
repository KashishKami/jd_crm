import { DateTime } from 'luxon';
import * as followupRepository from '../repository/followup.repository';
import { hasPermission } from './permission.service';
import { CrmFollowUps } from '@prisma/client';
import {
  FollowUpCreateInput,
  FollowUpUpdateInput,
  FollowUpFilters,
  FollowUpListResult,
  FollowUpRecord,
} from '../types/followup';

export function computeDaysLabel(followUpDate: Date | string, followUpTime: string, customerTimezone: string): string {
  let dateStr = '';
  if (followUpDate instanceof Date) {
    dateStr = followUpDate.toISOString().split('T')[0];
  } else {
    dateStr = followUpDate.split('T')[0];
  }

  const nowInTz = DateTime.now().setZone(customerTimezone);
  const today = nowInTz.startOf('day');
  const target = DateTime.fromISO(dateStr, { zone: customerTimezone }).startOf('day');
  const delta = Math.round(target.diff(today, 'days').days);

  if (delta === 0) {
    const [hours, minutes] = followUpTime.split(':').map(Number);
    const scheduledTime = today.set({ hour: hours, minute: minutes });
    if (nowInTz > scheduledTime) {
      const diff = nowInTz.diff(scheduledTime, ['hours', 'minutes']).toObject();
      const h = Math.floor(diff.hours || 0);
      const m = Math.round(diff.minutes || 0);
      let finalH = h;
      let finalM = m;
      if (finalM === 60) {
        finalH += 1;
        finalM = 0;
      }
      if (finalH > 0) {
        return `Overdue by ${finalH}h ${finalM}m`;
      }
      return `Overdue by ${finalM}m`;
    } else {
      const diff = scheduledTime.diff(nowInTz, ['hours', 'minutes']).toObject();
      const h = Math.floor(diff.hours || 0);
      const m = Math.round(diff.minutes || 0);
      let finalH = h;
      let finalM = m;
      if (finalM === 60) {
        finalH += 1;
        finalM = 0;
      }
      if (finalH > 0) {
        return `${finalH}h ${finalM}m left`;
      }
      return `${finalM}m left`;
    }
  }
  if (delta === 1) return 'Tomorrow';
  if (delta > 1) return `${delta} Days`;
  if (delta === -1) return 'Due by 1 day';
  if (delta < -1) return `Due by ${Math.abs(delta)} days`;
  
  return 'Today';
}

export async function getAllFollowUps(
  sessionUser: { id: string | number; userPermissions: string | null | undefined },
  rawFilters: FollowUpFilters
): Promise<FollowUpListResult & { followUps: Array<FollowUpRecord & { daysLabel: string }> }> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'follow-ups:view');
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'follow-ups:create');

  if (!isViewAll && !isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const filters: FollowUpFilters = { ...rawFilters };

  // Enforce self-only scoping if not view-all admin
  if (!isViewAll) {
    filters.agentId = Number(sessionUser.id);
    delete filters.teamId;
  }

  const result = await followupRepository.findAll(filters);

  const followUpsWithLabels = result.followUps.map((f) => ({
    ...f,
    daysLabel: computeDaysLabel(f.followUpDate, f.followUpTime, f.customerTimezone),
  }));

  return {
    followUps: followUpsWithLabels,
    total: result.total,
  };
}

export async function getFollowUpById(
  sessionUser: { id: string | number; userPermissions: string | null | undefined },
  id: number
): Promise<FollowUpRecord | null> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'follow-ups:view');
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'follow-ups:create');

  if (!isViewAll && !isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const record = await followupRepository.findById(id);
  if (!record) {
    return null;
  }

  if (!isViewAll && record.agentId !== Number(sessionUser.id)) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  return record;
}

export async function createFollowUp(
  sessionUser: { id: string | number; nickname?: string | null; name?: string | null; userPermissions: string | null | undefined },
  data: Omit<FollowUpCreateInput, 'agentId' | 'agentName'>
): Promise<CrmFollowUps> {
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'follow-ups:create');
  if (!isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const agentName = sessionUser.nickname || sessionUser.name || 'Unknown';
  return followupRepository.create({
    ...data,
    agentId: Number(sessionUser.id),
    agentName,
  });
}

export async function updateFollowUp(
  sessionUser: { id: string | number; userPermissions: string | null | undefined },
  id: number,
  data: FollowUpUpdateInput
): Promise<CrmFollowUps> {
  // getFollowUpById checks permission and ownership
  const existing = await getFollowUpById(sessionUser, id);
  if (!existing) {
    throw new Error('Follow-up record not found');
  }

  const updateData: FollowUpUpdateInput = { ...data };

  // Reset notificationSentAt to null if date or time changes
  if (data.followUpDate !== undefined || data.followUpTime !== undefined) {
    updateData.notificationSentAt = null;
  }

  // Update lastContact on meaningful agent action
  const isMeaningful =
    data.notes !== undefined ||
    data.status !== undefined ||
    data.followUpReason !== undefined ||
    data.followUpDate !== undefined ||
    data.followUpTime !== undefined;

  if (isMeaningful) {
    updateData.lastContact = new Date();
  }

  return followupRepository.update(id, updateData);
}

export async function deleteFollowUp(
  sessionUser: { id: string | number; userPermissions: string | null | undefined },
  id: number
): Promise<CrmFollowUps> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'follow-ups:view');
  if (!isViewAll) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const existing = await followupRepository.findById(id);
  if (!existing) {
    throw new Error('Follow-up record not found');
  }

  return followupRepository.delete(id);
}

export async function getDueFollowUps(
  sessionUser: { id: string | number; userPermissions: string | null | undefined }
): Promise<CrmFollowUps[]> {
  const isViewAll = hasPermission(sessionUser.userPermissions, 'follow-ups:view');
  const isCreateOwn = hasPermission(sessionUser.userPermissions, 'follow-ups:create');

  if (!isViewAll && !isCreateOwn) {
    throw new Error('Forbidden: Insufficient Permissions');
  }

  const due = await followupRepository.findDueForNotification();

  // Notifications are ALWAYS scoped to the logged-in user's own follow-ups,
  // regardless of role. follow-ups:view grants access to the list page for all
  // agents — it does NOT mean the admin should receive everyone's notifications.
  // Without this filter, an admin could dismiss a notification and write
  // notified=true to the DB, causing the agent to never see their own alert.
  return due.filter((f) => f.agentId === Number(sessionUser.id));
}

export async function markNotificationSent(id: number): Promise<CrmFollowUps> {
  return followupRepository.markNotificationSent(id);
}
