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
  'Completed Orders'?: MetricValue;
  'Returned Orders'?: MetricValue;
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
  orderRefundAmount?: string | null;
  orderDate: string;
}

export interface MetricValue {
  amount: number;
  count: number;
}

export interface ComparisonMetricValue {
  amount: number;
  count: number;
  lastAmount: number;
  lastCount: number;
  percentageChange: number;
}

export interface DashboardMetrics {
  thisYearSales?: ComparisonMetricValue;
  totalSalesThisMonth?: ComparisonMetricValue;
  todaySales?: ComparisonMetricValue;
  chargebackThisMonth?: MetricValue;
  refundThisMonth?: MetricValue;
  netSales?: ComparisonMetricValue;
  topPerformers?: PerformerRow[];
  bottomPerformers?: PerformerRow[];
  recentOrders?: RecentOrderRow[];
  attendanceSummary?: AttendanceSummary;
  pendingCounts?: PendingCounts;
}

export interface TeamPerformerRow {
  agentId: number;
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

export interface AdvancedChartDataPoint {
  label: string;
  salesAmount: number;
  salesCount: number;
  refundsAmount: number;
  refundsCount: number;
  chargebacksAmount: number;
  chargebacksCount: number;
}
