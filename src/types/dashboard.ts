export interface PerformerRow {
  agentName: string;
  amount: number;
}

export interface PendingCounts {
  'Pending Booking': number;
  'Pending Shipment': number;
  'Pending Delivery': number;
  'Pending Feedback': number;
  'Pending Resolutions': number;
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

export interface DashboardMetrics {
  totalSales?: number;
  totalSalesThisMonth?: number;
  todaySales?: number;
  chargebackThisMonth?: number;
  refundThisMonth?: number;
  netSales?: number;
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
