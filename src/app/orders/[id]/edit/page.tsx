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

// Mask helpers
function maskCardNumber(num: string | null | undefined): string {
  if (!num) return '';
  const clean = num.replace(/\s+/g, '');
  if (clean.length < 4) return '****';
  return `**** **** **** ${clean.slice(-4)}`;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  if (phone.length < 4) return '***';
  return `***-***-${phone.slice(-4)}`;
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.***';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

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

  const canViewPhone = hasPermission(permissions, 'customers:view-phone');
  const canViewEmail = hasPermission(permissions, 'customers:view-email');
  const canViewCards = hasPermission(permissions, 'customers:view-cards');

  if (order && order.customer) {
    if (!canViewPhone) {
      order.customer.customerPhone = maskPhone(order.customer.customerPhone);
      if (order.customer.customerAlternatePhone1) {
        order.customer.customerAlternatePhone1 = maskPhone(order.customer.customerAlternatePhone1);
      }
      if (order.customer.customerAlternatePhone2) {
        order.customer.customerAlternatePhone2 = maskPhone(order.customer.customerAlternatePhone2);
      }
    }
    if (!canViewEmail) {
      order.customer.customerEmail = maskEmail(order.customer.customerEmail);
    }
    if (!canViewCards && order.customer.cards) {
      order.customer.cards = order.customer.cards.map((c) => ({
        ...c,
        customerCardNumber: maskCardNumber(c.customerCardNumber),
        customerCardCvv: c.customerCardCvv ? '***' : null,
        customerCardCopyImage: null,
        customerPhotoIdImage: null,
      }));
    }
  }

  return (
    <div className="w-full">
      <EditOrderForm order={order} vendors={vendors} gateways={gateways} agents={agents} canViewCards={canViewCards} />
    </div>
  );
}
