import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

export async function findAll() {
  return prisma.crmCustomers.findMany({
    orderBy: {
      customerId: 'asc',
    },
  });
}

export async function findById(customerId: number) {
  return prisma.crmCustomers.findUnique({
    where: { customerId },
  });
}

export async function create(data: Prisma.CrmCustomersCreateInput) {
  return prisma.crmCustomers.create({
    data,
  });
}

export async function update(customerId: number, data: Prisma.CrmCustomersUpdateInput) {
  return prisma.crmCustomers.update({
    where: { customerId },
    data,
  });
}

export async function findCardsByCustomerId(customerId: number) {
  return prisma.crmCustomerCards.findMany({
    where: { cardCustomerId: customerId },
    orderBy: {
      cardId: 'asc',
    },
  });
}
