import React from 'react';
import OrderListContainer from '../../../components/OrderListContainer';

export const metadata = {
  title: 'Pending Delivery Queue - JD CRM',
  description: 'Track orders in transit and monitor carrier updates',
};

export default function PendingDeliveryPage() {
  return <OrderListContainer initialStatus="Pending Delivery" />;
}
