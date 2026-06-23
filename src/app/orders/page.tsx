import React from 'react';
import OrderListContainer from '../../components/OrderListContainer';

export const metadata = {
  title: 'Orders Pipeline - JD CRM',
  description: 'Manage sales intake, bookings, margins, and status queues',
};

export default function OrdersPage() {
  return <OrderListContainer />;
}
