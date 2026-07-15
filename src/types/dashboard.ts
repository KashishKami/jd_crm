export interface PerformerRow {
  agentId: number;
  agentName: string;
  salesCount: number;
  totalSales: number;
  leakage: number;
  amount?: number;
}

export interface PendingCounts {
  'Pending Booking': MetricValue;
  'Pending Shipment': MetricValue;
  'Pending Delivery': MetricValue;
  'Pending Feedback': MetricValue;
  'Pending Resolutions': MetricValue;
  'Completed Orders'?: MetricValue;
  'Resolved Orders'?: MetricValue;
  'Returned Orders'?: MetricValue;
  'Cancelled Orders'?: MetricValue;
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
  orderAmountCharged: string | null;
  orderRefundAmount?: string | null;
  orderDate: string;
  orderSalesAgentId?: number | null;
}

export interface MetricValue {
  amount: number;
  count: number;
  sparklineData?: number[];
}

export interface ComparisonMetricValue {
  amount: number;
  count: number;
  lastAmount: number;
  lastCount: number;
  percentageChange: number;
  sparklineData?: number[];
}

export interface DashboardMetrics {
  thisYearSales?: ComparisonMetricValue;
  totalSalesThisMonth?: ComparisonMetricValue;
  todaySales?: ComparisonMetricValue;
  chargebackThisMonth?: ComparisonMetricValue;
  refundThisMonth?: ComparisonMetricValue;
  netSales?: ComparisonMetricValue;
  topPerformers?: PerformerRow[];
  bottomPerformers?: PerformerRow[];
  recentOrders?: any[];
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
  topPerformers?: TeamPerformerRow[];
  bottomPerformers?: TeamPerformerRow[];
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
