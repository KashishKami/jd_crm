export interface Customer {
  customerId: number;
  customerName: string;
  customerPhone?: string | null;
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
  customerCardCreatedAt?: Date | string | null;
  customerCardUpdated?: Date | string | null;
}
