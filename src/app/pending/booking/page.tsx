import React from 'react';
import OrderListContainer from '../../../components/OrderListContainer';

export const metadata = {
  title: 'Pending Booking Queue - JD CRM',
  description: 'View orders awaiting supplier/vendor booking assignments',
};

export default function PendingBookingPage() {
  return <OrderListContainer initialStatus="Pending Booking" />;
}
