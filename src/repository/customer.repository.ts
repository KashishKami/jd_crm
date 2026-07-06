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

/**
 * List cards for a customer — image columns (LONGTEXT Base64) are EXCLUDED by default
 * to prevent bloating JSON responses on list views.
 * Use findCardById() to fetch a single card with full image data.
 */
export async function findCardsByCustomerId(customerId: number) {
  return prisma.crmCustomerCards.findMany({
    where: { cardCustomerId: customerId },
    select: {
      cardId: true,
      cardCustomerId: true,
      customerNameOncard: true,
      customerCardNumber: true,
      customerCardExpDate: true,
      customerCardCvv: true,
      customerCardCopyStatus: true,
      customerCardPhotoStatus: true,
      amountToCharge: true,
      // customerCardCopyImage intentionally excluded
      // customerPhotoIdImage intentionally excluded
      customerCardCreatedAt: true,
      customerCardUpdated: true,
    },
    orderBy: {
      cardId: 'asc',
    },
  });
}

/**
 * Fetch a single card record WITH the full Base64 image fields.
 * Only call this from a single-record, permission-guarded endpoint.
 */
export async function findCardById(cardId: number) {
  return prisma.crmCustomerCards.findUnique({
    where: { cardId },
  });
}

