import React from 'react';
import { prisma } from '../../../lib/db';
import AddOrderForm from '../../../components/AddOrderForm';

export const metadata = {
  title: 'New Order - JD CRM',
  description: 'Intake new sales booking, customer, and card details',
};

export default async function NewOrderPage() {
  // Fetch active vendors, gateways, and users/agents
  const [vendors, gateways, agents] = await Promise.all([
    prisma.crmVendors.findMany({
      where: { vendorStatus: 1 },
      select: { vendorId: true, vendorName: true },
      orderBy: { vendorName: 'asc' },
    }),
    prisma.crmGateway.findMany({
      where: { gatewayStatus: 1 },
      select: { gatewayId: true, gatewayName: true },
      orderBy: { gatewayName: 'asc' },
    }),
    prisma.users.findMany({
      where: { status: 1 },
      select: { uid: true, name: true, nickname: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="w-full">
      <AddOrderForm vendors={vendors} gateways={gateways} agents={agents} />
    </div>
  );
}
