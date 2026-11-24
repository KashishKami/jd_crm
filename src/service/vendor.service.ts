import * as vendorRepository from '../repository/vendor.repository';
import { VendorWithMetrics, VendorCreateInput, VendorUpdateInput } from '../types/vendor';
import * as vendorContactRepository from '../repository/vendorContact.repository';
import { Prisma } from '@prisma/client';
import { cleanVendorName, normalizeVendorSearch, sortVendorsByName } from '../lib/vendorSort';

const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

function validatePhone(phone: string) {
  if (!PHONE_REGEX.test(phone)) {
    throw new Error('Invalid phone number format');
  }
}

// Void ('5') counts — the vendor was booked and the charge captured (same-day reversal).
// Cancel Order ('6') is excluded — no charge was processed, so the vendor was never involved.
const COUNTED_SALE_STATUSES = new Set(['1', '2', '3', '4', '5']);

/**
 * Vendor directory, sorted A–Z by name (ignoring stray spaces and case).
 * `search` matches the supplier name, phone, email, the "Contact Person" field,
 * or any of the supplier's contacts. With `page` + `limit` returns a paginated envelope.
 */
export async function getAllVendors(status?: number, page?: number, limit?: number, search?: string): Promise<any> {
  const { prisma } = await import('../lib/db');
  const q = normalizeVendorSearch(search);

  const where: Prisma.CrmVendorsWhereInput = {
    ...(status !== undefined ? { vendorStatus: status } : {}),
    ...(q
      ? {
          OR: [
            { vendorName: { contains: q } },
            { vendorContactPerson: { contains: q } },
            { vendorPhone: { contains: q } },
            { vendorAlternatePhone1: { contains: q } },
            { vendorAlternatePhone2: { contains: q } },
            { vendorEmail: { contains: q } },
            { contacts: { some: { contactName: { contains: q } } } },
          ],
        }
      : {}),
  };

  // The directory is small (tens to low hundreds of suppliers), so sort and
  // paginate in memory — the database can't sort names that start with spaces.
  const vendors = await prisma.crmVendors.findMany({
    where,
    include: {
      orders: {
        select: { crmOrderId: true, saleStatus: true, orderVendorFeedback: true },
      },
    },
  });

  const withMetrics = sortVendorsByName(vendors).map((vendor) => {
    const validOrders = vendor.orders.filter((order) => COUNTED_SALE_STATUSES.has(order.saleStatus ?? ''));
    const totalOrders = validOrders.length;
    const negativeOrders = validOrders.filter((order) => order.orderVendorFeedback === 'Negative').length;
    const { orders: _orders, ...vendorData } = vendor;
    return {
      ...vendorData,
      totalOrders,
      positiveOrders: totalOrders - negativeOrders,
      negativeOrders,
    };
  });

  if (page !== undefined && limit !== undefined) {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    const safePage = Math.max(1, page);
    const total = withMetrics.length;
    return {
      data: withMetrics.slice((safePage - 1) * safeLimit, safePage * safeLimit),
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
    };
  }

  return withMetrics;
}

export async function getVendorById(vendorId: number) {
  return vendorRepository.findById(vendorId);
}

export async function createVendor(data: VendorCreateInput) {
  if (data.vendorPhone) {
    validatePhone(data.vendorPhone);
  }
  if (data.vendorName !== undefined) data = { ...data, vendorName: cleanVendorName(data.vendorName) };
  const vendor = await vendorRepository.create(data);
  // Keep the supplier's contact list in step with the "Contact Person" field
  await vendorContactRepository.ensureContactsFromLegacyField(vendor.vendorId, vendor.vendorContactPerson);
  return vendor;
}

export async function updateVendor(vendorId: number, data: VendorUpdateInput) {
  if (data.vendorPhone) {
    validatePhone(data.vendorPhone);
  }
  if (data.vendorName !== undefined) data = { ...data, vendorName: cleanVendorName(data.vendorName) };
  const vendor = await vendorRepository.update(vendorId, data);
  if (data.vendorContactPerson !== undefined) {
    // Adds any newly typed names; never removes existing contacts
    await vendorContactRepository.ensureContactsFromLegacyField(vendorId, vendor.vendorContactPerson);
  }
  return vendor;
}

export async function toggleVendorStatus(vendorId: number, status: number) {
  if (status !== 0 && status !== 1) {
    throw new Error('Invalid status value');
  }
  return vendorRepository.toggleStatus(vendorId, status);
}

export async function getVendorOrders(vendorId: number, rating?: 'positive' | 'negative') {
  return vendorRepository.findOrdersByVendorId(vendorId, rating);
}

export async function getVendorPerformanceHistory(vendorId: number) {
  return vendorRepository.getPerformanceHistory(vendorId);
}
