import { CrmOrders, CrmCustomers } from '@prisma/client';

export interface OrderSearchResult extends CrmOrders {
  customer: CrmCustomers;
}

export interface CustomerSearchResult extends CrmCustomers {}

export interface SearchResults {
  orders: OrderSearchResult[];
  customers: CustomerSearchResult[];
}
