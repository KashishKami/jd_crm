export type MetricType = 'sales' | 'refunds' | 'chargebacks' | 'net';
export type MetricViewType = 'all' | 'net' | 'sales' | 'refunds' | 'chargebacks' | MetricType[];

export type GranularityType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'summary';

export interface AgentSalesFilterParams {
  range?: string; // 'today' | 'yesterday' | 'this-week' | 'last-week' | 'monthly' | 'yearly' | 'all-time' | 'custom'
  startDate?: string;
  endDate?: string;
  teamIds?: number[];
  agentIds?: number[];
  metricView?: MetricViewType;
  year?: number;
  month?: number; // 1 - 12
  granularity?: GranularityType;
}

export interface PeriodMetrics {
  salesAmount: number;
  salesCount: number;
  refundsAmount: number;
  refundsCount: number;
  chargebacksAmount: number;
  chargebacksCount: number;
  netSales: number;
  netSalesCount: number;
}

export interface PeriodDefinition {
  key: string;
  label: string;
  startDate: string;
  endDate: string;
}

export interface AgentSalesRowData {
  agentId: number;
  agentName: string;
  nickname: string | null;
  teamId: number | null;
  teamName: string | null;
  designation: string | null;
  status: number; // 1 = active, 0 = inactive
  periods: Record<string, PeriodMetrics>;
  grandTotal: PeriodMetrics;
}

export interface OrgTotalSummary {
  periods: Record<string, PeriodMetrics>;
  grandTotal: PeriodMetrics;
}

export interface ReportMatrixResponse {
  periods: PeriodDefinition[];
  agents: AgentSalesRowData[];
  orgTotal: OrgTotalSummary;
  globalStartDate: string;
  globalEndDate: string;
  rangeLabel?: string;
}

export interface RawAgentAggregateRow {
  agentId: number;
  periodKey: string;
  saleStatus: string | null;
  totalCharged: number;
  totalRefund: number;
  orderCount: number;
}

export interface ReportAgentInfo {
  uid: number;
  name: string;
  nickname: string | null;
  teamId: number | null;
  teamName: string | null;
  designation: string | null;
  status: number;
}

export type ReportAgentOption = ReportAgentInfo;

