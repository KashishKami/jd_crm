import { CrmFollowUps } from '@prisma/client';

export type FollowUpRecord = CrmFollowUps & {
  agent: {
    uid: number;
    name: string;
    nickname: string | null;
    teamId: number;
  };
};

export interface FollowUpCreateInput {
  agentId: number;
  agentName: string;
  customerName: string;
  customerPhone?: string | null;
  customerState: string;
  customerCountry: string;
  customerTimezone: string;
  vehicleYearMakeModel: string;
  partRequired: string;
  partDescription?: string | null;
  quotedOptions?: string | null;
  followUpDate: Date | string;
  followUpTime: string;
  followUpReason: string;
  status: string;
  priority: string;
  notes?: string | null;
}

export interface FollowUpUpdateInput {
  customerName?: string;
  customerPhone?: string | null;
  customerState?: string;
  customerCountry?: string;
  customerTimezone?: string;
  vehicleYearMakeModel?: string;
  partRequired?: string;
  partDescription?: string | null;
  quotedOptions?: string | null;
  followUpDate?: Date | string;
  followUpTime?: string;
  followUpReason?: string;
  status?: string;
  priority?: string;
  notes?: string | null;
  lastContact?: Date | null;
  notificationSentAt?: Date | null;
}

export interface FollowUpFilters {
  agentId?: number;
  teamId?: number;
  priority?: string;
  status?: string;
  followUpDateFrom?: string;
  followUpDateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FollowUpListResult {
  followUps: FollowUpRecord[];
  total: number;
}
