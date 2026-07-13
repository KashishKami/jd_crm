import React from 'react';
import GatewayList from '../../components/GatewayList';
import * as gatewayRepository from '../../repository/gateway.repository';

export const metadata = {
  title: 'Payment Gateways - JD CRM',
  description: 'Manage payment processors and view performance reports',
};

export default async function GatewaysPage() {
  const gateways = await gatewayRepository.findAll();
  return <GatewayList initialGateways={gateways} />;
}
