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

export interface OrderCreateInput {
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

  // Legacy single-card flat fields (kept for backward compat with existing callers)
  customerNameOncard?: string;
  customerCardNumber?: string;
  customerCardExpDate?: string;
  customerCardCvv?: string;
  customerCardCopyStatus?: string;
  customerCardPhotoStatus?: string;
  amountToCharge?: string | null;

  // Order Details
  orderMakeModel?: string; // Merged field containing Year, Make, & Model (from legacy order_year migration)
  orderPart?: string;
  orderPartSize?: string;
  orderQuotedMilesAndWarranty?: string;
  orderVendorMilesAndWarranty?: string;
  orderVin?: string;
  orderTotalPitched?: string;
  orderVendorPrice?: string;
  orderVendorId?: number | null;
  orderShippingType?: string;
  orderPaymentGatewayId?: number | null;
  orderSalesAgentId?: number | null;
  orderVerifierId?: number | null;
  orderSalesVerifierId?: number | null;
  orderBackendExecutiveId?: number | null;
  saleStatus?: string;
  orderDate?: string | Date;
  orderRefundAmount?: string | null;
  orderCurrentStatus?: string | null;
  orderAmountCharged?: string | null;
  saleStatusChangeDate?: string | null;
  orderVendorFeedback?: string;
  orderChecklist?: string;
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
}

export interface OrderFilters {
  status?: string;
  saleStatus?: string;
  agentId?: number;
  teamId?: number;
  backendExecutiveId?: number;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
