import React from 'react';
import OrderListContainer from '../../../components/OrderListContainer';

export const metadata = {
  title: 'Cancelled Orders - JD CRM',
  description: 'View orders that have been cancelled',
};

export default function CancelledOrdersPage() {
  return <OrderListContainer initialStatus="Cancelled Orders" />;
}
