import React from 'react';
import OrderListContainer from '../../../components/OrderListContainer';

export const metadata = {
  title: 'Returned Orders - JD CRM',
  description: 'View orders with processing failures, returns, or disputes',
};

export default function ReturnedOrdersPage() {
  return <OrderListContainer initialStatus="Returned Orders" />;
}
