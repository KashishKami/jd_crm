import React from 'react';
import OrderListContainer from '../../../components/OrderListContainer';

export const metadata = {
  title: 'Pending Feedback Queue - JD CRM',
  description: 'Manage completed orders requiring customer/supplier feedback rating',
};

export default function PendingFeedbackPage() {
  return <OrderListContainer initialStatus="Pending Feedback" />;
}
