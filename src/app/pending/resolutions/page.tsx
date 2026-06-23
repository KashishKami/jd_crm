import React from 'react';
import OrderListContainer from '../../../components/OrderListContainer';

export const metadata = {
  title: 'Pending Resolutions Queue - JD CRM',
  description: 'Manage disputed, returned, or ticketed orders in conflict resolution',
};

export default function PendingResolutionsPage() {
  return <OrderListContainer initialStatus="Pending Resolutions" />;
}
