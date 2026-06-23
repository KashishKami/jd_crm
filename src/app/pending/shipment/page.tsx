import React from 'react';
import OrderListContainer from '../../../components/OrderListContainer';

export const metadata = {
  title: 'Pending Shipment Queue - JD CRM',
  description: 'View orders awaiting shipment tracking updates',
};

export default function PendingShipmentPage() {
  return <OrderListContainer initialStatus="Pending Shipment" />;
}
