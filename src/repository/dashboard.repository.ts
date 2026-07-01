import { prisma } from '../lib/db';

export async function getSalesBetweenDates(start: Date, end: Date) {
  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: { in: ['1', '4'] },
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: { orderMarkup: true, orderRefundAmount: true },
  });
  let amount = 0;
  for (const order of orders) {
    const markup = parseFloat(order.orderMarkup || '0');
    const refund = parseFloat(order.orderRefundAmount || '0');
    amount += (markup - refund);
  }
  return { amount, count: orders.length };
}

export async function getNetSalesBetweenDates(start: Date, end: Date) {
  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: { in: ['1', '2', '3', '4'] },
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: {
      saleStatus: true,
      orderMarkup: true,
      orderRefundAmount: true,
    },
  });

  let amount = 0;
  let count = 0;
  for (const order of orders) {
    if (order.saleStatus === '1' || order.saleStatus === '4') {
      const markup = parseFloat(order.orderMarkup || '0');
      const refund = parseFloat(order.orderRefundAmount || '0');
      amount += (markup - refund);
      count += 1;
    } else if (order.saleStatus === '2' || order.saleStatus === '3') {
      // Refunded/Chargebacked contribute 0 to net sales, count is not decremented
    }
  }
  return { amount, count };
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
  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: '3',
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: { orderRefundAmount: true },
  });
  let amount = 0;
  for (const order of orders) {
    amount += parseFloat(order.orderRefundAmount || '0');
  }
  return { amount, count: orders.length };
}

export async function getRefundThisMonth(start: Date, end: Date) {
  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: '2',
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: { orderRefundAmount: true },
  });
  let amount = 0;
  for (const order of orders) {
    amount += parseFloat(order.orderRefundAmount || '0');
  }
  return { amount, count: orders.length };
}

export async function getNetSales(whereClause?: any) {
  const orders = await prisma.crmOrders.findMany({
    where: whereClause || {
      saleStatus: { in: ['1', '2', '3', '4'] },
    },
    select: {
      saleStatus: true,
      orderMarkup: true,
      orderRefundAmount: true,
    },
  });

  let amount = 0;
  let count = 0;
  for (const order of orders) {
    if (order.saleStatus === '1' || order.saleStatus === '4') {
      const markup = parseFloat(order.orderMarkup || '0');
      const refund = parseFloat(order.orderRefundAmount || '0');
      amount += (markup - refund);
      count += 1;
    } else if (order.saleStatus === '2' || order.saleStatus === '3') {
      // Contribute 0, count is not decremented
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

  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: { in: ['1', '4'] },
      orderSalesAgentId: { not: null },
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: {
      orderSalesAgentId: true,
      orderSalesAgentName: true,
      orderMarkup: true,
      orderRefundAmount: true,
    },
  });

  const agentMap = new Map<number, { agentName: string; amount: number }>();
  for (const order of orders) {
    const agentId = order.orderSalesAgentId!;
    const name = order.orderSalesAgentName || 'Unknown Agent';
    const markup = parseFloat(order.orderMarkup || '0');
    const refund = parseFloat(order.orderRefundAmount || '0');
    const finalMargin = markup - refund;

    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, { agentName: name, amount: 0 });
    }
    agentMap.get(agentId)!.amount += finalMargin;
  }

  return Array.from(agentMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
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

  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: { in: ['1', '4'] },
      orderSalesAgentId: { not: null },
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: {
      orderSalesAgentId: true,
      orderSalesAgentName: true,
      orderMarkup: true,
      orderRefundAmount: true,
    },
  });

  const agentMap = new Map<number, { agentName: string; amount: number }>();
  for (const order of orders) {
    const agentId = order.orderSalesAgentId!;
    const name = order.orderSalesAgentName || 'Unknown Agent';
    const markup = parseFloat(order.orderMarkup || '0');
    const refund = parseFloat(order.orderRefundAmount || '0');
    const finalMargin = markup - refund;

    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, { agentName: name, amount: 0 });
    }
    agentMap.get(agentId)!.amount += finalMargin;
  }

  return Array.from(agentMap.values())
    .sort((a, b) => a.amount - b.amount)
    .slice(0, limit);
}

export async function getRecentOrders(limit = 10) {
  return await prisma.crmOrders.findMany({
    take: limit,
    orderBy: [
      { orderCreatedDate: 'desc' },
      { crmOrderId: 'desc' },
    ],
    select: {
      crmOrderId: true,
      orderDate: true,
      orderMarkup: true,
      orderRefundAmount: true,
      saleStatus: true,
      customer: {
        select: {
          customerName: true,
        },
      },
      salesAgent: {
        select: {
          name: true,
          nickname: true,
        },
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

export async function getPendingCounts() {
  const orders = await prisma.crmOrders.findMany({
    where: {
      orderCurrentStatus: {
        in: [
          'Pending Booking',
          'Pending Shipment',
          'Pending Delivery',
          'Pending Feedback',
          'Pending Resolutions',
          'Completed Orders',
          'Returned Orders',
        ],
      },
    },
    select: {
      orderCurrentStatus: true,
      orderMarkup: true,
      orderRefundAmount: true,
    },
  });

  const res: Record<string, { amount: number; count: number }> = {
    'Pending Booking': { amount: 0, count: 0 },
    'Pending Shipment': { amount: 0, count: 0 },
    'Pending Delivery': { amount: 0, count: 0 },
    'Pending Feedback': { amount: 0, count: 0 },
    'Pending Resolutions': { amount: 0, count: 0 },
    'Completed Orders': { amount: 0, count: 0 },
    'Returned Orders': { amount: 0, count: 0 },
  };

  for (const order of orders) {
    const status = order.orderCurrentStatus;
    if (status && status in res) {
      const markupVal = parseFloat(order.orderMarkup || '0');
      const refundVal = parseFloat(order.orderRefundAmount || '0');
      const finalMargin = markupVal - refundVal;
      res[status].amount += finalMargin;
      res[status].count += 1;
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
          WHEN o.sale_status IN ('1', '4') THEN CAST(COALESCE(o.order_markup, '0') AS DECIMAL(10,2)) - CAST(COALESCE(o.order_refund_amount, '0') AS DECIMAL(10,2))
          WHEN o.sale_status IN ('2', '3') THEN 0
          ELSE 0 
        END
      ) AS netAmount
    FROM crm_teams t
    LEFT JOIN users u ON u.team_id = t.team_id
    LEFT JOIN crm_orders o ON o.order_sales_agent_id = u.uid AND MONTH(o.order_date) = ${month} AND YEAR(o.order_date) = ${year}
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
  // Use UTC month boundaries to avoid machine-timezone drift
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const agents = await prisma.users.findMany({
    where: { teamId },
    include: {
      salesOrders: {
        where: {
          saleStatus: { in: ['1', '2', '3', '4'] },
          orderDate: {
            gte: start,
            lt: end,
          },
        },
        select: {
          saleStatus: true,
          orderMarkup: true,
          orderRefundAmount: true,
        },
      },
    },
  });

  const agentScores = [];
  for (const agent of agents) {
    let total = 0;
    for (const order of agent.salesOrders) {
      if (order.saleStatus === '1' || order.saleStatus === '4') {
        const markup = parseFloat(order.orderMarkup || '0');
        const refund = parseFloat(order.orderRefundAmount || '0');
        total += (markup - refund);
      }
    }
    agentScores.push({
      agentId: agent.uid,
      agentName: agent.nickname || agent.name,
      amount: total,
    });
  }

  return agentScores.sort((a, b) => b.amount - a.amount).slice(0, limit);
}

export async function getTeamMonthlyBottomPerformers(teamId: number, month: number, year: number, limit = 3) {
  // Use UTC month boundaries to avoid machine-timezone drift
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const agents = await prisma.users.findMany({
    where: { teamId },
    include: {
      salesOrders: {
        where: {
          saleStatus: { in: ['1', '2', '3', '4'] },
          orderDate: {
            gte: start,
            lt: end,
          },
        },
        select: {
          saleStatus: true,
          orderMarkup: true,
          orderRefundAmount: true,
        },
      },
    },
  });

  const agentScores = [];
  for (const agent of agents) {
    let total = 0;
    for (const order of agent.salesOrders) {
      if (order.saleStatus === '1' || order.saleStatus === '4') {
        const markup = parseFloat(order.orderMarkup || '0');
        const refund = parseFloat(order.orderRefundAmount || '0');
        total += (markup - refund);
      }
    }
    agentScores.push({
      agentId: agent.uid,
      agentName: agent.nickname || agent.name,
      amount: total,
    });
  }

  return agentScores.sort((a, b) => a.amount - b.amount).slice(0, limit);
}

export async function getAdvancedChartData(teamId?: number, agentId?: number, dateFrom?: Date, dateTo?: Date) {
  const where: any = {
    saleStatus: { in: ['1', '2', '3', '4'] },
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
      orderMarkup: true,
      orderRefundAmount: true,
      saleStatus: true,
    },
    orderBy: {
      orderDate: 'asc',
    },
  });
}
