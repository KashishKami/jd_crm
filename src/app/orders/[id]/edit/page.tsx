import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { hasPermission } from '../../../../service/permission.service';
import { prisma } from '../../../../lib/db';
import EditOrderForm from '../../../../components/EditOrderForm';

export const metadata = {
  title: 'Edit Order - JD CRM',
  description: 'Modify sales order parameters, customer contact details, and allocations',
};

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login');
  }

  const permissions = session.user.userPermissions || '';
  if (!hasPermission(permissions, 'orders:edit')) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-red-50 text-red-700 border border-red-200 rounded-2xl">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-sm mt-2">You do not have the required permissions to edit order details.</p>
      </div>
    );
  }

  const { id } = await params;
  const crmOrderId = Number(id);
  if (isNaN(crmOrderId)) {
    notFound();
  }

  const [order, vendors, gateways, agents] = await Promise.all([
    prisma.crmOrders.findUnique({
      where: { crmOrderId },
      include: {
        customer: {
          include: {
            cards: true,
          },
        },
      },
    }),
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

  if (!order) {
    notFound();
  }

  const canViewCards = hasPermission(permissions, 'customers:view-cards');

  return (
    <div className="w-full">
      <EditOrderForm order={order} vendors={vendors} gateways={gateways} agents={agents} canViewCards={canViewCards} />
    </div>
  );
}
