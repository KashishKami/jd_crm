import { prisma } from '../lib/db';
import { CrmFollowUps } from '@prisma/client';
import {
  FollowUpCreateInput,
  FollowUpUpdateInput,
  FollowUpFilters,
  FollowUpListResult,
  FollowUpRecord,
} from '../types/followup';

export async function create(data: FollowUpCreateInput): Promise<CrmFollowUps> {
  const followUpDate = typeof data.followUpDate === 'string'
    ? new Date(data.followUpDate)
    : data.followUpDate;

  return prisma.crmFollowUps.create({
    data: {
      agentId: data.agentId,
      agentName: data.agentName,
      customerName: data.customerName,
      customerPhone: data.customerPhone ?? null,
      customerState: data.customerState,
      customerCountry: data.customerCountry,
      customerTimezone: data.customerTimezone,
      vehicleYearMakeModel: data.vehicleYearMakeModel,
      partRequired: data.partRequired,
      quotedOptions: data.quotedOptions ?? null,
      followUpDate,
      followUpTime: data.followUpTime,
      followUpReason: data.followUpReason,
      status: data.status,
      priority: data.priority,
      notes: data.notes ?? null,
      entryDate: new Date(),
      lastContact: new Date(),
      notificationSentAt: null,
    },
  });
}

export async function findById(id: number): Promise<FollowUpRecord | null> {
  return prisma.crmFollowUps.findUnique({
    where: {
      followUpId: id,
    },
    include: {
      agent: {
        select: {
          uid: true,
          name: true,
          nickname: true,
          teamId: true,
        },
      },
    },
  }) as Promise<FollowUpRecord | null>;
}

export async function findAll(filters: FollowUpFilters): Promise<FollowUpListResult> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.agentId !== undefined) {
    where.agentId = filters.agentId;
  }

  if (filters.teamId !== undefined) {
    where.agent = {
      teamId: filters.teamId,
    };
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.followUpDateFrom || filters.followUpDateTo) {
    where.followUpDate = {};
    if (filters.followUpDateFrom) {
      where.followUpDate.gte = new Date(filters.followUpDateFrom);
    }
    if (filters.followUpDateTo) {
      where.followUpDate.lte = new Date(filters.followUpDateTo);
    }
  }

  const [followUps, total] = await Promise.all([
    prisma.crmFollowUps.findMany({
      where,
      include: {
        agent: {
          select: {
            uid: true,
            name: true,
            nickname: true,
            teamId: true,
          },
        },
      },
      orderBy: [
        { followUpDate: 'asc' },
        { followUpTime: 'asc' },
      ],
      skip,
      take: limit,
    }) as Promise<FollowUpRecord[]>,
    prisma.crmFollowUps.count({ where }),
  ]);

  return { followUps, total };
}

export async function update(id: number, data: FollowUpUpdateInput): Promise<CrmFollowUps> {
  const updateData: any = { ...data };

  if (data.followUpDate && typeof data.followUpDate === 'string') {
    updateData.followUpDate = new Date(data.followUpDate);
  }

  return prisma.crmFollowUps.update({
    where: {
      followUpId: id,
    },
    data: updateData,
  });
}

export async function deleteFollowUp(id: number): Promise<CrmFollowUps> {
  return prisma.crmFollowUps.delete({
    where: {
      followUpId: id,
    },
  });
}

// Rename for export to match expected W-3104 test call structure: followupRepository.delete
export { deleteFollowUp as delete };

export async function findDueForNotification(): Promise<CrmFollowUps[]> {
  // Query for records where notification_sent_at is null and CONVERT_TZ(CONCAT(date, ' ', time, ':00'), customer_timezone, 'UTC')
  // is between UTC_TIMESTAMP() and DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)
  // Let's use prisma.$queryRaw to fetch
  return prisma.$queryRaw<CrmFollowUps[]>`
    SELECT * 
    FROM crm_follow_ups 
    WHERE notification_sent_at IS NULL 
      AND CONVERT_TZ(
        CONCAT(
          DATE_FORMAT(follow_up_date, '%Y-%m-%d'), 
          ' ', 
          follow_up_time, 
          ':00'
        ), 
        customer_timezone, 
        'UTC'
      ) BETWEEN UTC_TIMESTAMP() AND DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)
  `;
}

export async function markNotificationSent(id: number): Promise<CrmFollowUps> {
  return prisma.crmFollowUps.update({
    where: {
      followUpId: id,
    },
    data: {
      notificationSentAt: new Date(),
    },
  });
}
