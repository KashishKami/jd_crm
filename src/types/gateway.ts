export interface Gateway {
  gatewayId: number;
  gatewayName: string;
  gatewayStatus: number;
  gatewayCreatedAt: Date | string;
  gatewayUpdatedAt: Date | string;
}

export interface GatewayCreateInput {
  gatewayName: string;
  gatewayStatus?: number;
}

export interface GatewayUpdateInput {
  gatewayName?: string;
  gatewayStatus?: number;
}

export interface GatewayMonthlyReport {
  month: number;
  year: number;
  completedCount: number;
  completedAmount: number;
  refundCount: number;
  refundAmount: number;
  chargebackCount: number;
  chargebackAmount: number;
  netAmount: number;
}

export interface GatewayReportResponse {
  gateway: Gateway;
  monthly: GatewayMonthlyReport[];
}
