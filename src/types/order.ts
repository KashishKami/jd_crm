export interface CardInput {
  customerNameOncard: string;
  customerCardNumber: string;
  customerCardExpDate: string;
  customerCardCvv?: string | null;
  customerCardCopyStatus?: string | null;
  customerCardPhotoStatus?: string | null;
  amountToCharge?: string | null;
  customerCardCopyImage?: string | null;
  customerPhotoIdImage?: string | null;
}

export interface DealGlobalFields {
  orderSalesAgentId?: number | null;
  orderVerifierId?: number | null;
  orderSalesVerifierId?: number | null;
  orderPaymentGatewayId?: number | null;
  orderDate?: string | Date | null;
  orderShippingType?: string | null;
  orderLiftgateNeeded?: string | null;
  orderChecklist?: string | null;
  orderTotalPitched?: string | null;
  orderAmountCharged?: string | null;
  orderRefundAmount?: string | null;
  orderBackendExecutiveId?: number | null;
}

export interface OrderCreateInput extends DealGlobalFields {
  // Customer Info
  customerName: string;
  customerPhone?: string;
  customerAlternatePhone1?: string | null;
  customerAlternatePhone2?: string | null;
  customerEmail: string;
  customerBillingAddress?: string;
  customerShippingAddress?: string;

  // Multi-card support (preferred path — replaces flat card fields below)
  cards?: CardInput[];
  parts?: OrderPartInput[];
  parentOrderId?: number | null;

  // Legacy single-card flat fields (kept for backward compat with existing callers)
  customerNameOncard?: string;
  customerCardNumber?: string;
  customerCardExpDate?: string;
  customerCardCvv?: string;
  customerCardCopyStatus?: string;
  customerCardPhotoStatus?: string;
  amountToCharge?: string | null;

  // Order Details
  orderPart?: string;
  orderPartSize?: string;
  orderQuotedMilesAndWarranty?: string;
  orderVendorMilesAndWarranty?: string;
  orderVendorPrice?: string;
  orderVendorId?: number | null;
  orderSalesAgentId?: number | null;
  orderVerifierId?: number | null;
  orderSalesVerifierId?: number | null;
  orderBackendExecutiveId?: number | null;
  saleStatus?: string;
  orderCurrentStatus?: string | null;
  saleStatusChangeDate?: string | null;
  orderVendorFeedback?: string;
  orderPartFoundById?: number | null;
  orderPartFoundByName?: string | null;
  orderMakeModel?: string | null;
  orderVin?: string | null;
}

export interface OrderUpdateInput {
  // --- Order-level fields (written to crm_orders) ---
  orderMakeModel?: string; // Merged field containing Year, Make, & Model (from legacy order_year migration)
  orderPart?: string;
  orderPartSize?: string;
  orderQuotedMilesAndWarranty?: string;
  orderVendorMilesAndWarranty?: string;
  orderVin?: string;
  orderChecklist?: string;
  orderTotalPitched?: string;
  orderVendorPrice?: string;
  orderVendorId?: number | null;
  orderVendorName?: string | null;
  orderShippingType?: string;
  orderPaymentGatewayId?: number | null;
  orderSalesAgentId?: number | null;
  orderSalesAgentName?: string | null;
  orderVerifierId?: number | null;
  orderVerifierName?: string | null;
  orderSalesVerifierId?: number | null;
  orderSalesVerifierName?: string | null;
  orderBackendExecutiveId?: number | null;
  orderBackendExecutiveName?: string | null;
  orderPartFoundById?: number | null;
  orderPartFoundByName?: string | null;
  orderLiftgateNeeded?: string | null;
  orderDocumentation?: string;
  orderBooked?: string;
  orderAmountCharged?: string;
  orderTrackingNumber?: string | null;
  orderDeliveryStatus?: string | null;
  orderQualifiedIncentiveStatus?: string;
  orderQualifiedIncentiveAmount?: string;
  orderStatus?: string;
  saleStatus?: string;
  orderCurrentStatus?: string;
  orderCurrentStatusUpdateDate?: Date | null;
  orderDate?: string | Date;
  saleStatusChangeDate?: string | null;
  orderRefundAmount?: string | null;
  orderVendorFeedback?: string;

  // --- Customer fields (written to crm_customers via separate update) ---
  customerName?: string;
  customerPhone?: string | null;
  customerAlternatePhone1?: string | null;
  customerAlternatePhone2?: string | null;
  customerEmail?: string;
  customerBillingAddress?: string | null;
  customerShippingAddress?: string | null;

  // --- Card fields (written to crm_customer_cards via separate update) ---
  customerNameOncard?: string;
  customerCardNumber?: string;
  customerCardExpDate?: string;
  customerCardCvv?: string | null;
  customerCardCopyStatus?: string;
  customerCardPhotoStatus?: string;
  amountToCharge?: string | null;
  customerCardCopyImage?: string | null;
  customerPhotoIdImage?: string | null;
  cards?: Array<{
    cardId?: number;
    customerNameOncard?: string;
    customerCardNumber?: string;
    customerCardExpDate?: string;
    customerCardCvv?: string | null;
    customerCardCopyStatus?: string;
    customerCardPhotoStatus?: string;
    amountToCharge?: string | null;
    customerCardCopyImage?: string | null;
    customerPhotoIdImage?: string | null;
  }>;
  parentOrderId?: number | null;
}

export interface OrderFilters {
  status?: string;
  saleStatus?: string;
  agentId?: number;
  teamId?: number;
  backendExecutiveId?: number;
  partFoundById?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface OrderPartInput {
  orderPart?: string;
  orderPartSize?: string;
  orderQuotedMilesAndWarranty?: string;
  orderVendorMilesAndWarranty?: string;
  orderVendorPrice?: string;
  orderVendorId?: number | null;
  orderVendorName?: string | null;
  orderBackendExecutiveId?: number | null;
  orderPartFoundById?: number | null;
  saleStatus?: string;
  orderCurrentStatus?: string | null;
  orderVendorFeedback?: string;
  orderMakeModel?: string | null;
  orderVin?: string | null;
  orderRefundAmount?: string | null;
}

export interface ChildPartSummary {
  crmOrderId: number;
  orderPart: string | null;
  saleStatus: string | null;
  orderCurrentStatus: string | null;
  orderAmountCharged: string | null;
  orderRefundAmount: string | null;
  orderLiftgateNeeded: string | null;
  orderVendorId?: number | null;
  orderVendorName?: string | null;
  orderVendorPrice?: string | null;
  orderBackendExecutiveId?: number | null;
  orderPartFoundById?: number | null;
  orderVendorFeedback?: string | null;
  orderMakeModel?: string | null;
  orderVin?: string | null;
}

export interface ChildPartDetail {
  crmOrderId: number;
  parentOrderId: number | null;
  orderCustomerId: number;
  orderMakeModel: string | null;
  orderPart: string | null;
  orderPartSize: string | null;
  orderQuotedMilesAndWarranty: string | null;
  orderVendorMilesAndWarranty: string | null;
  orderVin: string | null;
  orderTotalPitched: string | null;
  orderVendorPrice: string | null;
  orderVendorId: number | null;
  orderVendorName: string | null;
  orderShippingType: string | null;
  orderAmountCharged: string | null;
  orderRefundAmount: string | null;
  orderPaymentGatewayId: number | null;
  orderSalesAgentId: number | null;
  orderSalesAgentName: string | null;
  orderVerifierId: number | null;
  orderVerifierName: string | null;
  orderSalesVerifierId: number | null;
  orderSalesVerifierName: string | null;
  orderBackendExecutiveId: number | null;
  orderBackendExecutiveName: string | null;
  orderPartFoundById: number | null;
  orderPartFoundByName: string | null;
  orderLiftgateNeeded: string | null;
  orderDocumentation: string | null;
  orderBooked: string | null;
  orderChecklist: string | null;
  orderTrackingNumber: string | null;
  orderDeliveryStatus: string | null;
  orderQualifiedIncentiveStatus: string | null;
  orderQualifiedIncentiveAmount: string | null;
  orderStatus: string | null;
  saleStatus: string | null;
  orderCurrentStatus: string | null;
  orderCurrentStatusUpdateDate: Date | null;
  orderDate: Date | null;
  orderVendorFeedback: string;
  orderClientFeedback: string;
  orderResolution: string;
  orderCreatedDate: Date;
  orderUpdatedDate: Date;
  salesAgent?: {
    uid: number;
    name: string;
    nickname?: string | null;
  } | null;
  verifier?: {
    uid: number;
    name: string;
    nickname?: string | null;
  } | null;
  salesVerifier?: {
    uid: number;
    name: string;
    nickname?: string | null;
  } | null;
  backendExecutive?: {
    uid: number;
    name: string;
    nickname?: string | null;
  } | null;
  partFoundBy?: {
    uid: number;
    name: string;
    nickname?: string | null;
  } | null;
  vendor?: {
    vendorId: number;
    vendorName: string;
  } | null;
  gateway?: {
    gatewayId: number;
    gatewayName: string;
  } | null;
}

