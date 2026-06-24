export interface PerformerRow {
  agentName: string;
  amount: number;
}

export interface PendingCounts {
  'Pending Booking': MetricValue;
  'Pending Shipment': MetricValue;
  'Pending Delivery': MetricValue;
  'Pending Feedback': MetricValue;
  'Pending Resolutions': MetricValue;
}

export interface AttendanceSummary {
  present: number;
  absent: number;
  lwop: number;
  halfDay: number;
}

export interface RecentOrderRow {
  crmOrderId: number;
  customerName: string;
  salesAgentName: string;
  saleStatus: string;
  orderMarkup: string;
  orderDate: string;
}

export interface MetricValue {
  amount: number;
  count: number;
}

export interface DashboardMetrics {
  totalSales?: MetricValue;
  totalSalesThisMonth?: MetricValue;
  todaySales?: MetricValue;
  chargebackThisMonth?: MetricValue;
  refundThisMonth?: MetricValue;
  netSales?: MetricValue;
  topPerformers?: PerformerRow[];
  bottomPerformers?: PerformerRow[];
  recentOrders?: RecentOrderRow[];
  attendanceSummary?: AttendanceSummary;
  pendingCounts?: PendingCounts;
}

export interface TeamPerformerRow {
  agentName: string;
  amount: number;
}

export interface TeamMonthlyReport {
  teamId: number;
  teamName: string;
  soldCount: number;
  refundCount: number;
  chargebackCount: number;
  netAmount: number;
  month: number;
  year: number;
  topPerformer?: TeamPerformerRow;
  bottomPerformer?: TeamPerformerRow;
}
