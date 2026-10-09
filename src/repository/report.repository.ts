import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import { RawAgentAggregateRow, ReportAgentInfo } from '../types/report';

export const SALES_DESIGNATIONS = [
  'Sales Supervisor',
  'Sales Team Lead',
  'Sales Specialist',
  'Sales Expert',
  'Sales Associate',
  'Backend Specialist',
  'Backend Associate',
];

export async function getReportAgentsList(
  teamIds?: number[],
  agentIds?: number[],
  status?: number
): Promise<ReportAgentInfo[]> {
  const where: Prisma.UsersWhereInput = {
    designation: { in: SALES_DESIGNATIONS },
  };

  if (teamIds && teamIds.length > 0) {
    where.teamId = { in: teamIds };
  }

  if (agentIds && agentIds.length > 0) {
    where.uid = { in: agentIds };
  }

  if (status !== undefined) {
    where.status = status;
  }

  const users = await prisma.users.findMany({
    where,
    select: {
      uid: true,
      name: true,
      nickname: true,
      teamId: true,
      designation: true,
      status: true,
      team: {
        select: {
          teamName: true,
        },
      },
    },
    orderBy: [
      { status: 'desc' },
      { name: 'asc' },
    ],
  });

  return users.map((u) => ({
    uid: u.uid,
    name: u.name || '',
    nickname: u.nickname || null,
    teamId: u.teamId || null,
    teamName: u.team?.teamName || null,
    designation: u.designation || null,
    status: u.status ?? 1,
  }));
}

export interface ReportAggregateParams {
  dateFrom: Date;
  dateTo: Date;
  granularity: 'daily' | 'monthly' | 'yearly';
  teamIds?: number[];
  agentIds?: number[];
}

export async function getAgentSalesAggregates({
  dateFrom,
  dateTo,
  granularity,
  teamIds,
  agentIds,
}: ReportAggregateParams): Promise<RawAgentAggregateRow[]> {
  const dateFormatSql =
    granularity === 'daily'
      ? Prisma.raw("'%Y-%m-%d'")
      : granularity === 'monthly'
      ? Prisma.raw("'%Y-%m'")
      : Prisma.raw("'%Y'");

  let teamFilterClause = Prisma.sql``;
  if (teamIds && teamIds.length > 0) {
    teamFilterClause = Prisma.sql`AND u.team_id IN (${Prisma.join(teamIds)})`;
  }

  let agentFilterClause = Prisma.sql``;
  if (agentIds && agentIds.length > 0) {
    agentFilterClause = Prisma.sql`AND o.order_sales_agent_id IN (${Prisma.join(agentIds)})`;
  }

  const rows = await prisma.$queryRaw<
    {
      agent_id: number;
      period_key: string;
      sale_status: string | null;
      total_charged: string | number;
      total_refund: string | number;
      order_count: string | number | bigint;
    }[]
  >`
    SELECT
      o.order_sales_agent_id AS agent_id,
      DATE_FORMAT(o.order_date, ${dateFormatSql}) AS period_key,
      o.sale_status AS sale_status,
      SUM(COALESCE(CAST(o.order_amount_charged AS DECIMAL(12, 2)), 0)) AS total_charged,
      SUM(COALESCE(CAST(o.order_refund_amount AS DECIMAL(12, 2)), 0)) AS total_refund,
      COUNT(o.crm_order_id) AS order_count
    FROM crm_orders o
    LEFT JOIN users u ON o.order_sales_agent_id = u.uid
    WHERE o.order_date IS NOT NULL
      AND o.order_date >= ${dateFrom}
      AND o.order_date <= ${dateTo}
      AND o.order_sales_agent_id IS NOT NULL
      ${teamFilterClause}
      ${agentFilterClause}
    GROUP BY
      o.order_sales_agent_id,
      DATE_FORMAT(o.order_date, ${dateFormatSql}),
      o.sale_status
    ORDER BY
      period_key ASC,
      o.order_sales_agent_id ASC
  `;

  return rows.map((r) => ({
    agentId: Number(r.agent_id),
    periodKey: String(r.period_key),
    saleStatus: r.sale_status ? String(r.sale_status) : null,
    totalCharged: parseFloat(String(r.total_charged || '0')),
    totalRefund: parseFloat(String(r.total_refund || '0')),
    orderCount: Number(r.order_count || 0),
  }));
}

export async function getEarliestOrderYear(): Promise<number | null> {
  const earliest = await prisma.crmOrders.findFirst({
    where: { orderDate: { not: null } },
    orderBy: { orderDate: 'asc' },
    select: { orderDate: true },
  });
  if (earliest?.orderDate) {
    return new Date(earliest.orderDate).getUTCFullYear();
  }
  return null;
}

