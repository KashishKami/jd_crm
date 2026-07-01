import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

export async function findAll(status?: number) {
  return prisma.crmGateway.findMany({
    where: status !== undefined ? { gatewayStatus: status } : undefined,
    orderBy: { gatewayName: 'asc' },
  });
}

export async function findById(gatewayId: number) {
  return prisma.crmGateway.findUnique({
    where: { gatewayId },
  });
}

export async function create(data: Prisma.CrmGatewayCreateInput) {
  return prisma.crmGateway.create({ data });
}

export async function update(gatewayId: number, data: Prisma.CrmGatewayUpdateInput) {
  return prisma.crmGateway.update({
    where: { gatewayId },
    data,
  });
}

export interface MonthlyReportRow {
  month: number;
  year: number;
  completedCount: number;
  completedAmount: number;
  refundCount: number;
  refundAmount: number;
  chargebackCount: number;
  chargebackAmount: number;
}

/**
 * Returns monthly aggregated order metrics for a given gateway.
 * Groups crm_orders by year/month, filtering sale_status IN ('1','2','3').
 * Uses $queryRaw because Prisma does not natively support GROUP BY with
 * conditional SUMs in a single query without raw SQL.
 */
export async function getMonthlyReport(gatewayId: number): Promise<MonthlyReportRow[]> {
  const rows = await prisma.$queryRaw<
    {
      yr: number;
      mo: number;
      completed_count: bigint;
      completed_amount: string | null;
      refund_count: bigint;
      refund_amount: string | null;
      chargeback_count: bigint;
      chargeback_amount: string | null;
    }[]
  >`
    SELECT
      YEAR(order_date)  AS yr,
      MONTH(order_date) AS mo,
      SUM(CASE WHEN sale_status = '1' THEN 1 ELSE 0 END) AS completed_count,
      SUM(CASE WHEN sale_status = '1' THEN CAST(order_amount_charged AS DECIMAL(10,2)) ELSE 0 END) AS completed_amount,
      SUM(CASE WHEN sale_status = '2' THEN 1 ELSE 0 END) AS refund_count,
      SUM(CASE WHEN sale_status = '2' THEN CAST(order_amount_charged AS DECIMAL(10,2)) ELSE 0 END) AS refund_amount,
      SUM(CASE WHEN sale_status = '3' THEN 1 ELSE 0 END) AS chargeback_count,
      SUM(CASE WHEN sale_status = '3' THEN CAST(order_amount_charged AS DECIMAL(10,2)) ELSE 0 END) AS chargeback_amount
    FROM crm_orders
    WHERE
      order_payment_gateway = ${gatewayId}
      AND sale_status IN ('1', '2', '3')
      AND order_date IS NOT NULL
    GROUP BY YEAR(order_date), MONTH(order_date)
    ORDER BY yr DESC, mo DESC
  `;

  return rows.map((r) => ({
    year: Number(r.yr),
    month: Number(r.mo),
    completedCount: Number(r.completed_count),
    completedAmount: parseFloat(r.completed_amount ?? '0'),
    refundCount: Number(r.refund_count),
    refundAmount: parseFloat(r.refund_amount ?? '0'),
    chargebackCount: Number(r.chargeback_count),
    chargebackAmount: parseFloat(r.chargeback_amount ?? '0'),
  }));
}
