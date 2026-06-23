export interface OrderCreateInput {
  // Customer Info
  firstName: string;
  lastName: string;
  customerPhone?: string;
  customerEmail: string;
  customerBillingAddress?: string;
  customerShippingAddress?: string;

  // Customer Card Details
  customerNameOncard: string;
  customerCardNumber: string;
  customerCardExpDate: string;
  customerCardCvv?: string;
  customerCardCopyStatus?: string;
  customerCardPhotoStatus?: string;

  // Order Details
  orderYear?: string;
  orderMakeModel?: string;
  orderPart?: string;
  orderPartSize?: string;
  orderQuotedMiles?: string;
  orderGivenMiles?: string;
  orderVin?: string;
  orderTotalPitched?: string;
  orderVendorPrice?: string;
  orderVendorId?: number | null;
  orderShippingType?: string;
  orderPaymentGatewayId?: number | null;
  orderSalesAgentId?: number | null;
  orderVerifierId?: number | null;
  saleStatus?: string;
  orderDate?: string | Date;
}

export interface OrderUpdateInput {
  orderYear?: string;
  orderMakeModel?: string;
  orderPart?: string;
  orderPartSize?: string;
  orderQuotedMiles?: string;
  orderGivenMiles?: string;
  orderVin?: string;
  orderTotalPitched?: string;
  orderVendorPrice?: string;
  orderVendorId?: number | null;
  orderVendorName?: string | null;
  orderShippingType?: string;
  orderMarkup?: string;
  orderPaymentGatewayId?: number | null;
  orderSalesAgentId?: number | null;
  orderSalesAgentName?: string | null;
  orderVerifierId?: number | null;
  orderVerifierName?: string | null;
  orderDocumentation?: string;
  orderBooked?: string;
  orderAmountCharged?: string;
  orderTrackingNumber?: string;
  orderDeliveryStatus?: string;
  orderQualifiedIncentiveStatus?: string;
  orderQualifiedIncentiveAmount?: string;
  orderStatus?: string;
  saleStatus?: string;
  orderCurrentStatus?: string;
  orderCurrentStatusUpdateDate?: Date | null;
}

export interface OrderFilters {
  status?: string;
  saleStatus?: string;
  agentId?: number;
  dateFrom?: string;
  dateTo?: string;
}
