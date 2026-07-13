import React from 'react';
import { prisma } from '../../../lib/db';
import AddOrderForm from '../../../components/AddOrderForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'New Order - JD CRM',
  description: 'Intake new sales booking, customer, and card details',
};

export default async function NewOrderPage() {
  // Fetch active vendors, gateways, and users/agents
  const [vendors, gateways, agents] = await Promise.all([
    prisma.crmVendors.findMany({
      select: { vendorId: true, vendorName: true, vendorStatus: true },
      orderBy: { vendorName: 'asc' },
    }),
    prisma.crmGateway.findMany({
      where: { gatewayStatus: 1 },
      select: { gatewayId: true, gatewayName: true },
      orderBy: { gatewayName: 'asc' },
    }),
    prisma.users.findMany({
      select: { uid: true, name: true, nickname: true, designation: true, status: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="w-full">
      <AddOrderForm vendors={vendors} gateways={gateways} agents={agents} />
    </div>
  );
}
