import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';

export async function getSalesBetweenDates(start: Date, end: Date) {
  // Push SUM and COUNT into SQL instead of fetching all rows into Node.js
  const rows = await prisma.$queryRaw<{ amount: string | null; count: bigint }[]>`
    SELECT
      SUM(
        CAST(COALESCE(order_amount_charged, '0') AS DECIMAL(12,2)) -
        CAST(COALESCE(order_refund_amount, '0') AS DECIMAL(12,2))
      ) AS amount,
      COUNT(*) AS count
    FROM crm_orders
    WHERE sale_status IN ('1', '4')
      AND parent_order_id IS NULL
      AND order_date >= ${start}
      AND order_date < ${end}
  `;
  return {
    amount: parseFloat(rows[0]?.amount ?? '0'),
    count: Number(rows[0]?.count ?? 0),
  };
}

export async function getNetSalesBetweenDates(start: Date, end: Date) {
  // Only sold/partial-refund orders count toward net sales amount and count.
  // Refunded (2) and chargebacked (3) orders contribute 0 — they are filtered out of SUM/COUNT.
  const rows = await prisma.$queryRaw<{ amount: string | null; count: bigint }[]>`
    SELECT
      SUM(
        CAST(COALESCE(order_amount_charged, '0') AS DECIMAL(12,2)) -
        CAST(COALESCE(order_refund_amount, '0') AS DECIMAL(12,2))
      ) AS amount,
      COUNT(*) AS count
    FROM crm_orders
    WHERE sale_status IN ('1', '4')
      AND parent_order_id IS NULL
      AND order_date >= ${start}
      AND order_date < ${end}
  `;
  return {
    amount: parseFloat(rows[0]?.amount ?? '0'),
    count: Number(rows[0]?.count ?? 0),
  };
}

export async function getThisYearSales() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  return getSalesBetweenDates(start, end);
}

export async function getTotalSalesThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return getSalesBetweenDates(start, end);
}

export async function getTodaySales() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return getSalesBetweenDates(start, end);
}

export async function getChargebackThisMonth(start: Date, end: Date) {
  const rows = await prisma.$queryRaw<{ amount: string | null; count: bigint }[]>`
    SELECT
      SUM(CAST(COALESCE(order_refund_amount, '0') AS DECIMAL(12,2))) AS amount,
      COUNT(*) AS count
    FROM crm_orders
    WHERE sale_status = '3'
      AND parent_order_id IS NULL
      AND order_date >= ${start}
      AND order_date < ${end}
  `;
  return {
    amount: parseFloat(rows[0]?.amount ?? '0'),
    count: Number(rows[0]?.count ?? 0),
  };
}

export async function getRefundThisMonth(start: Date, end: Date) {
  const rows = await prisma.$queryRaw<{ amount: string | null; count: bigint }[]>`
    SELECT
      SUM(CAST(COALESCE(order_refund_amount, '0') AS DECIMAL(12,2))) AS amount,
      COUNT(*) AS count
    FROM crm_orders
    WHERE sale_status = '2'
      AND parent_order_id IS NULL
      AND order_date >= ${start}
      AND order_date < ${end}
  `;
  return {
    amount: parseFloat(rows[0]?.amount ?? '0'),
    count: Number(rows[0]?.count ?? 0),
  };
}

export async function getNetSales(whereClause?: any) {
  // getNetSales is called without a date range filter to get all-time net sales.
  // When called with a custom whereClause we fall back to JS aggregation for flexibility.
  // For the common no-filter case, push into SQL.
  if (!whereClause) {
    const rows = await prisma.$queryRaw<{ amount: string | null; count: bigint }[]>`
      SELECT
        SUM(
          CAST(COALESCE(order_amount_charged, '0') AS DECIMAL(12,2)) -
          CAST(COALESCE(order_refund_amount, '0') AS DECIMAL(12,2))
        ) AS amount,
        COUNT(*) AS count
      FROM crm_orders
      WHERE sale_status IN ('1', '4')
        AND parent_order_id IS NULL
    `;
    return {
      amount: parseFloat(rows[0]?.amount ?? '0'),
      count: Number(rows[0]?.count ?? 0),
    };
  }

  // Fallback: custom whereClause (used by some tests / edge callers)
  const orders = await prisma.crmOrders.findMany({
    where: {
      ...whereClause,
      parentOrderId: null,
    },
    select: {
      saleStatus: true,
      orderAmountCharged: true,
      orderRefundAmount: true,
    },
  });
  let amount = 0;
  let count = 0;
  for (const order of orders) {
    if (order.saleStatus === '1' || order.saleStatus === '4') {
      amount += parseFloat(order.orderAmountCharged || '0') - parseFloat(order.orderRefundAmount || '0');
      count += 1;
    }
  }
  return { amount, count };
}

export async function getTopPerformers(limit = 5, month?: number, year?: number) {
  let targetMonth = month;
  let targetYear = year;
  if (targetMonth === undefined || targetYear === undefined) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    targetMonth = targetMonth ?? parseInt(map.month);
    targetYear = targetYear ?? parseInt(map.year);
  }

  const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));

  const rows = await prisma.$queryRaw<any[]>`
    SELECT 
      MAX(order_sales_agent_name) as agentName,
      SUM(CAST(COALESCE(order_amount_charged, '0') AS DECIMAL(12, 2)) - CAST(COALESCE(order_refund_amount, '0') AS DECIMAL(12, 2))) as amount
    FROM crm_orders
    WHERE 
      sale_status IN ('1', '4')
      AND parent_order_id IS NULL
      AND order_sales_agent_id IS NOT NULL
      AND order_date >= ${start}
      AND order_date < ${end}
    GROUP BY order_sales_agent_id
    ORDER BY amount DESC
    LIMIT ${limit}
  `;

  return rows.map(r => ({
    agentName: r.agentName || 'Unknown Agent',
    amount: parseFloat(r.amount?.toString() || '0')
  }));
}

export async function getBottomPerformers(limit = 5, month?: number, year?: number) {
  let targetMonth = month;
  let targetYear = year;
  if (targetMonth === undefined || targetYear === undefined) {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'numeric',
    });
    const parts = formatter.formatToParts(now);
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    targetMonth = targetMonth ?? parseInt(map.month);
    targetYear = targetYear ?? parseInt(map.year);
  }

  const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));

  const rows = await prisma.$queryRaw<any[]>`
    SELECT 
      MAX(order_sales_agent_name) as agentName,
      SUM(CAST(COALESCE(order_amount_charged, '0') AS DECIMAL(12, 2)) - CAST(COALESCE(order_refund_amount, '0') AS DECIMAL(12, 2))) as amount
    FROM crm_orders
    WHERE 
      sale_status IN ('1', '4')
      AND parent_order_id IS NULL
      AND order_sales_agent_id IS NOT NULL
      AND order_date >= ${start}
      AND order_date < ${end}
    GROUP BY order_sales_agent_id
    ORDER BY amount ASC
    LIMIT ${limit}
  `;

  return rows.map(r => ({
    agentName: r.agentName || 'Unknown Agent',
    amount: parseFloat(r.amount?.toString() || '0')
  }));
}

export async function getRecentOrders(limit = 10) {
  const childOrdersSelect = {
    crmOrderId: true,
    orderMakeModel: true,
    orderVin: true,
    orderPart: true,
    saleStatus: true,
    orderCurrentStatus: true,
    orderAmountCharged: true,
    orderRefundAmount: true,
    orderLiftgateNeeded: true,
    orderVendorId: true,
    orderVendorName: true,
    orderVendorPrice: true,
    orderBackendExecutiveId: true,
    orderBackendExecutiveName: true,
    orderPartFoundById: true,
    orderPartFoundByName: true,
    orderVendorFeedback: true,
    backendExecutive: {
      select: {
        uid: true,
        nickname: true,
        name: true,
      }
    },
    partFoundBy: {
      select: {
        uid: true,
        nickname: true,
        name: true,
      }
    }
  };

  return await prisma.crmOrders.findMany({
    where: {
      parentOrderId: null,
    },
    take: limit,
    orderBy: [
      { orderCreatedDate: 'desc' },
      { crmOrderId: 'desc' },
    ],
    include: {
      customer: true,
      vendor: true,
      gateway: true,
      salesAgent: {
        include: {
          team: true,
        },
      },
      verifier: true,
      salesVerifier: true,
      backendExecutive: true,
      childOrders: {
        select: childOrdersSelect,
      },
    },
  });
}

export async function getAttendanceSummary(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  const records = await prisma.crmAttendance.findMany({
    where: {
      attendanceDate: {
        gte: start,
        lt: end,
      },
    },
    select: {
      attendanceStatusId: true,
    },
  });

  const summary = {
    present: 0,
    absent: 0,
    lwop: 0,
    halfDay: 0,
  };

  for (const record of records) {
    const statusId = Number(record.attendanceStatusId);
    if (statusId === 1) summary.present++;
    else if (statusId === 2 || statusId === 6) summary.absent++;
    else if (statusId === 3 || statusId === 4) summary.lwop++;
    else if (statusId === 7 || statusId === 5) summary.halfDay++;
  }
  return summary;
}

export async function getPendingCounts(filters?: {
  agentId?: number;
  teamId?: number;
  backendExecutiveId?: number;
  dateFrom?: string;
  dateTo?: string;
  saleStatus?: string;
}) {
  const where: Prisma.CrmOrdersWhereInput = {
    parentOrderId: null,
    orderCurrentStatus: {
      in: [
        'Pending Booking',
        'Pending Shipment',
        'Pending Delivery',
        'Pending Feedback',
        'Pending Resolutions',
        'Completed Orders',
        'Returned Orders',
        'Cancelled Orders',
      ],
    },
  };

  if (filters) {
    if (filters.saleStatus) {
      const statuses = filters.saleStatus.includes(',') ? filters.saleStatus.split(',') : [filters.saleStatus];
      where.saleStatus = { in: statuses };
    }
    if (filters.agentId) {
      where.orderSalesAgentId = filters.agentId;
    }
    if (filters.teamId) {
      where.salesAgent = { teamId: filters.teamId };
    }
    if (filters.backendExecutiveId) {
      where.orderBackendExecutiveId = filters.backendExecutiveId;
    }
    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: Prisma.DateTimeNullableFilter = {};
      const { convertEstToUtc } = require('../lib/date');
      if (filters.dateFrom) {
        dateFilter.gte = new Date(convertEstToUtc(filters.dateFrom, '00:00'));
      }
      if (filters.dateTo) {
        const endEstUtc = new Date(convertEstToUtc(filters.dateTo, '23:59'));
        endEstUtc.setSeconds(59);
        endEstUtc.setMilliseconds(999);
        dateFilter.lte = endEstUtc;
      }
      where.orderDate = dateFilter;
    }
  }

  const orders = await prisma.crmOrders.findMany({
    where,
    select: {
      orderCurrentStatus: true,
      saleStatus: true,
      orderAmountCharged: true,
      orderRefundAmount: true,
      childOrders: {
        select: {
          orderCurrentStatus: true,
          saleStatus: true,
        },
      },
    },
  });

  const res: Record<string, { amount: number; count: number }> = {
    'All Orders': { amount: 0, count: 0 },
    'Pending Booking': { amount: 0, count: 0 },
    'Pending Shipment': { amount: 0, count: 0 },
    'Pending Delivery': { amount: 0, count: 0 },
    'Pending Feedback': { amount: 0, count: 0 },
    'Pending Resolutions': { amount: 0, count: 0 },
    'Completed Orders': { amount: 0, count: 0 },
    'Returned Orders': { amount: 0, count: 0 },
    'Cancelled Orders': { amount: 0, count: 0 },
  };

  for (const order of orders) {
    const chargedAmountVal = parseFloat(order.orderAmountCharged || '0');
    const refundVal = parseFloat(order.orderRefundAmount || '0');
    const finalMargin = chargedAmountVal - refundVal;

    // All Orders gets everything
    res['All Orders'].amount += finalMargin;
    res['All Orders'].count += 1;

    // Returned Orders logic (same as findAll/status queues):
    const isReturned = order.orderCurrentStatus === 'Returned Orders' || 
                       order.saleStatus === '2' || 
                       order.saleStatus === '3' ||
                       order.saleStatus === '5' ||
                       (order.childOrders && order.childOrders.some(c => 
                         c.orderCurrentStatus === 'Returned Orders' || 
                         c.saleStatus === '2' || 
                         c.saleStatus === '3' ||
                         c.saleStatus === '5'
                       ));
    if (isReturned) {
      res['Returned Orders'].amount += refundVal;
      res['Returned Orders'].count += 1;
      continue; // Exclude from other statuses in tabs
    }

    // Completed Orders logic:
    const isCompleted = (order.orderCurrentStatus === 'Completed Orders' && (order.saleStatus === '1' || order.saleStatus === '4')) ||
                        (order.childOrders && order.childOrders.some(c => 
                          c.orderCurrentStatus === 'Completed Orders' && (c.saleStatus === '1' || c.saleStatus === '4')
                        ));
    if (isCompleted) {
      res['Completed Orders'].amount += finalMargin;
      res['Completed Orders'].count += 1;
      continue; // Exclude from other statuses in tabs
    }

    // Cancelled Orders logic:
    const isCancelled = order.orderCurrentStatus === 'Cancelled Orders' || 
                        order.saleStatus === '6' ||
                        (order.childOrders && order.childOrders.some(c => 
                          c.orderCurrentStatus === 'Cancelled Orders' || 
                          c.saleStatus === '6'
                        ));
    if (isCancelled) {
      res['Cancelled Orders'].amount += finalMargin;
      res['Cancelled Orders'].count += 1;
      continue; // Exclude from other statuses in tabs
    }

    // Classify into specific pending queues matching findAll
    const pendingQueues = ['Pending Booking', 'Pending Shipment', 'Pending Delivery', 'Pending Feedback', 'Pending Resolutions'];
    for (const q of pendingQueues) {
      const match = order.orderCurrentStatus === q || (order.childOrders && order.childOrders.some(c => c.orderCurrentStatus === q));
      if (match) {
        res[q].amount += finalMargin;
        res[q].count += 1;
      }
    }
  }

  return res;
}

export async function getTeamMonthlyScores(month: number, year: number) {
  // To implement "getTeamMonthlyScores(month, year) — $queryRaw joining crm_orders → users → crm_teams"
  // safely across SQL environments, we run standard query raw.
  const rawResults = await prisma.$queryRaw<any[]>`
    SELECT 
      t.team_id AS teamId, 
      t.team_name AS teamName,
      SUM(CASE WHEN o.sale_status IN ('1', '4') THEN 1 ELSE 0 END) AS soldCount,
      SUM(CASE WHEN o.sale_status = '2' THEN 1 ELSE 0 END) AS refundCount,
      SUM(CASE WHEN o.sale_status = '3' THEN 1 ELSE 0 END) AS chargebackCount,
      SUM(
        CASE 
          WHEN o.sale_status IN ('1', '4') THEN CAST(COALESCE(o.order_amount_charged, '0') AS DECIMAL(10,2)) - CAST(COALESCE(o.order_refund_amount, '0') AS DECIMAL(10,2))
          WHEN o.sale_status IN ('2', '3') THEN 0
          ELSE 0 
        END
      ) AS netAmount
    FROM crm_teams t
    LEFT JOIN users u ON u.team_id = t.team_id
    LEFT JOIN crm_orders o ON o.order_sales_agent_id = u.uid AND o.parent_order_id IS NULL AND MONTH(o.order_date) = ${month} AND YEAR(o.order_date) = ${year}
    GROUP BY t.team_id, t.team_name
  `;

  return rawResults.map(row => ({
    teamId: Number(row.teamId),
    teamName: String(row.teamName),
    soldCount: Number(row.soldCount || 0),
    refundCount: Number(row.refundCount || 0),
    chargebackCount: Number(row.chargebackCount || 0),
    netAmount: Number(row.netAmount || 0),
    month,
    year,
  }));
}

export async function getTeamMonthlyTopPerformers(teamId: number, month: number, year: number, limit = 3) {
  // Use UTC month boundaries to match how order_date is stored.
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // SQL GROUP BY replaces the previous "fetch all agents + their orders, loop in JS" pattern.
  // COALESCE(nickname, name) mirrors the JS fallback used in the old version.
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      u.uid              AS agentId,
      COALESCE(u.nickname, u.name) AS agentName,
      SUM(
        CAST(COALESCE(o.order_amount_charged, '0') AS DECIMAL(12,2)) -
        CAST(COALESCE(o.order_refund_amount,  '0') AS DECIMAL(12,2))
      ) AS amount
    FROM users u
    LEFT JOIN crm_orders o
      ON  o.order_sales_agent_id = u.uid
      AND o.sale_status IN ('1', '4')
      AND o.parent_order_id IS NULL
      AND o.order_date >= ${start}
      AND o.order_date <  ${end}
    WHERE u.team_id = ${teamId}
    GROUP BY u.uid, u.nickname, u.name
    ORDER BY amount DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    agentId:   Number(r.agentId),
    agentName: String(r.agentName),
    amount:    parseFloat(r.amount?.toString() || '0'),
  }));
}

export async function getTeamMonthlyBottomPerformers(teamId: number, month: number, year: number, limit = 3) {
  // Use UTC month boundaries to match how order_date is stored.
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // Identical to getTeamMonthlyTopPerformers but sorted ASC for bottom performers.
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      u.uid              AS agentId,
      COALESCE(u.nickname, u.name) AS agentName,
      SUM(
        CAST(COALESCE(o.order_amount_charged, '0') AS DECIMAL(12,2)) -
        CAST(COALESCE(o.order_refund_amount,  '0') AS DECIMAL(12,2))
      ) AS amount
    FROM users u
    LEFT JOIN crm_orders o
      ON  o.order_sales_agent_id = u.uid
      AND o.sale_status IN ('1', '4')
      AND o.parent_order_id IS NULL
      AND o.order_date >= ${start}
      AND o.order_date <  ${end}
    WHERE u.team_id = ${teamId}
    GROUP BY u.uid, u.nickname, u.name
    ORDER BY amount ASC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    agentId:   Number(r.agentId),
    agentName: String(r.agentName),
    amount:    parseFloat(r.amount?.toString() || '0'),
  }));
}

export async function getAdvancedChartData(teamId?: number, agentId?: number, dateFrom?: Date, dateTo?: Date) {
  const where: any = {
    saleStatus: { in: ['1', '2', '3', '4'] },
    parentOrderId: null,
  };

  if (dateFrom || dateTo) {
    where.orderDate = {};
    if (dateFrom) {
      where.orderDate.gte = dateFrom;
    }
    if (dateTo) {
      where.orderDate.lte = dateTo;
    }
  }

  if (agentId) {
    where.orderSalesAgentId = agentId;
  } else if (teamId) {
    where.salesAgent = {
      teamId: teamId,
    };
  }

  return await prisma.crmOrders.findMany({
    where,
    select: {
      orderDate: true,
      orderAmountCharged: true,
      orderRefundAmount: true,
      saleStatus: true,
    },
    orderBy: {
      orderDate: 'asc',
    },
  });
}
