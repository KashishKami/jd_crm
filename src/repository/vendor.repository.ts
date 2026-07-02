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

export async function findOrdersByVendorId(vendorId: number, rating?: 'positive' | 'negative') {
  const where: Prisma.CrmOrdersWhereInput = {
    orderVendorId: vendorId,
    // Void ('5') is included — a vendor was booked and the charge was captured, even though it was reversed same-day.
    // Cancel Order ('6') is excluded — no charge was ever processed, so no vendor booking took place.
    saleStatus: { in: ['1', '2', '3', '4', '5'] },
  };

  if (rating === 'positive') {
    where.orderVendorFeedback = 'Positive';
  } else if (rating === 'negative') {
    where.orderVendorFeedback = 'Negative';
  }

  return prisma.crmOrders.findMany({
    where,
    include: {
      customer: true,
    },
    orderBy: {
      orderCreatedDate: 'desc',
    },
  });
}

export interface VendorPerformanceHistoryRow {
  month: number;
  year: number;
  totalOrders: number;
  positiveOrders: number;
  negativeOrders: number;
}

export async function getPerformanceHistory(vendorId: number): Promise<VendorPerformanceHistoryRow[]> {
  const rows = await prisma.$queryRaw<
    {
      yr: number;
      mo: number;
      total_orders: bigint;
      positive_orders: bigint;
      negative_orders: bigint;
    }[]
  >`
    SELECT
      YEAR(order_date)  AS yr,
      MONTH(order_date) AS mo,
      COUNT(crm_order_id) AS total_orders,
      SUM(CASE WHEN order_vendor_feedback = 'Positive' THEN 1 ELSE 0 END) AS positive_orders,
      SUM(CASE WHEN order_vendor_feedback = 'Negative' THEN 1 ELSE 0 END) AS negative_orders
    FROM crm_orders
    WHERE
      order_vendor_id = ${vendorId}
      -- Void ('5') included: vendor was booked and charge was captured (same-day reversal).
      -- Cancel Order ('6') excluded: no charge ever processed, vendor was not involved.
      AND sale_status IN ('1', '2', '3', '4', '5')
      AND order_date IS NOT NULL
    GROUP BY YEAR(order_date), MONTH(order_date)
    ORDER BY yr DESC, mo DESC
  `;

  return rows.map((r) => ({
    year: Number(r.yr),
    month: Number(r.mo),
    totalOrders: Number(r.total_orders),
    positiveOrders: Number(r.positive_orders),
    negativeOrders: Number(r.negative_orders),
  }));
}
