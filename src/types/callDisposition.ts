// The 13 allowed disposition values. Used in service-layer validation and UI dropdowns.
export const DISPOSITION_OPTIONS = [
  'Wrong Number',
  'Spam Call',
  'Local Pickup',
  'Part Not Available',
  'Spanish Call',
  'Price Quoted',
  'Sale Closed',
  'Follow-up',
  'Not Interested',
  'No Voice',
  'Low Ad Price',
  'Automated Call',
  'Small Parts',
] as const;

export type DispositionOption = typeof DISPOSITION_OPTIONS[number];

export interface CallDispositionRecord {
  callId: number;
  customerPhone: string;
  customerName: string | null;
  agentId: number;
  agentName: string;
  teamId: number;
  disposition: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Fields accepted from the client on CREATE. agentId, agentName, teamId are NEVER in this type — always from session.
export interface CallDispositionCreateInput {
  customerPhone: string;
  customerName?: string | null;
  disposition: string;
}

// Fields accepted from the client on UPDATE. Same restriction — no agent/team fields.
export interface CallDispositionUpdateInput {
  customerPhone?: string;
  customerName?: string | null;
  disposition?: string;
}

export interface CallDispositionFilters {
  agentId?: number;
  teamId?: number;
  disposition?: string;
  dateFrom?: string;  // ISO date string 'YYYY-MM-DD'
  dateTo?: string;    // ISO date string 'YYYY-MM-DD'
  page?: number;
  limit?: number;
}

export interface CallDispositionListResult {
  dispositions: CallDispositionRecord[];
  total: number;
}
