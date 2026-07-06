export interface Customer {
  customerId: number;
  customerName: string;
  customerPhone?: string | null;
  customerAlternatePhone1?: string | null;
  customerAlternatePhone2?: string | null;
  customerEmail: string;
  customerBillingAddress?: string | null;
  customerShippingAddress?: string | null;
  dateCreated?: Date | string | null;
  dateUpdated?: Date | string | null;
}

export interface CustomerCard {
  cardId: number;
  cardCustomerId: number;
  customerNameOncard: string;
  customerCardNumber: string;
  customerCardExpDate: string;
  customerCardCvv?: string | null;
  customerCardCopyStatus?: string | null;
  customerCardPhotoStatus?: string | null;
  amountToCharge?: string | null;
  customerCardCopyImage?: string | null;
  customerPhotoIdImage?: string | null;
  customerCardCreatedAt?: Date | string | null;
  customerCardUpdated?: Date | string | null;
}

