import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

export async function findAll(status?: number) {
  return prisma.crmVendors.findMany({
    where: status !== undefined ? { vendorStatus: status } : undefined,
    include: {
      orders: {
        select: {
          crmOrderId: true,
          saleStatus: true,
          orderVendorFeedback: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function findById(vendorId: number) {
  return prisma.crmVendors.findUnique({
    where: { vendorId },
  });
}

export async function create(data: Prisma.CrmVendorsCreateInput) {
  return prisma.crmVendors.create({
    data,
  });
}

export async function update(vendorId: number, data: Prisma.CrmVendorsUpdateInput) {
  return prisma.crmVendors.update({
    where: { vendorId },
    data,
  });
}

export async function toggleStatus(vendorId: number, status: number) {
  return prisma.crmVendors.update({
    where: { vendorId },
    data: { vendorStatus: status },
  });
}

export async function findOrdersByVendorId(vendorId: number) {
  return prisma.crmOrders.findMany({
    where: { orderVendorId: vendorId },
    include: {
      customer: true,
    },
    orderBy: {
      orderCreatedDate: 'desc',
    },
  });
}
