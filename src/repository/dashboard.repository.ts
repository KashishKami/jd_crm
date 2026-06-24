import { prisma } from '../lib/db';

export async function getTotalSales() {
  const orders = await prisma.crmOrders.findMany({
    where: { saleStatus: '1' },
    select: { orderMarkup: true },
  });
  let amount = 0;
  for (const order of orders) {
    amount += parseFloat(order.orderMarkup || '0');
  }
  return { amount, count: orders.length };
}

export async function getTotalSalesThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: '1',
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: { orderMarkup: true },
  });
  let amount = 0;
  for (const order of orders) {
    amount += parseFloat(order.orderMarkup || '0');
  }
  return { amount, count: orders.length };
}

export async function getTodaySales() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: '1',
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: { orderMarkup: true },
  });
  let amount = 0;
  for (const order of orders) {
    amount += parseFloat(order.orderMarkup || '0');
  }
  return { amount, count: orders.length };
}

export async function getChargebackThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: '8',
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: { orderMarkup: true },
  });
  let amount = 0;
  for (const order of orders) {
    amount += parseFloat(order.orderMarkup || '0');
  }
  return { amount, count: orders.length };
}

export async function getRefundThisMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: '7',
      orderDate: {
        gte: start,
        lt: end,
      },
    },
    select: { orderMarkup: true },
  });
  let amount = 0;
  for (const order of orders) {
    amount += parseFloat(order.orderMarkup || '0');
  }
  return { amount, count: orders.length };
}

export async function getNetSales() {
  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: { in: ['1', '7', '8'] },
    },
    select: {
      saleStatus: true,
      orderMarkup: true,
    },
  });

  let amount = 0;
  let count = 0;
  for (const order of orders) {
    const val = parseFloat(order.orderMarkup || '0');
    if (order.saleStatus === '1') {
      amount += val;
      count += 1;
    } else if (order.saleStatus === '7' || order.saleStatus === '8') {
      amount -= val;
      count -= 1;
    }
  }
  return { amount, count };
}

export async function getTopPerformers(limit = 5) {
  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: '1',
      orderSalesAgentId: { not: null },
    },
    select: {
      orderSalesAgentId: true,
      orderSalesAgentName: true,
      orderMarkup: true,
    },
  });

  const agentMap = new Map<number, { agentName: string; amount: number }>();
  for (const order of orders) {
    const agentId = order.orderSalesAgentId!;
    const name = order.orderSalesAgentName || 'Unknown Agent';
    const markup = parseFloat(order.orderMarkup || '0');

    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, { agentName: name, amount: 0 });
    }
    agentMap.get(agentId)!.amount += markup;
  }

  return Array.from(agentMap.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export async function getBottomPerformers(limit = 5) {
  const orders = await prisma.crmOrders.findMany({
    where: {
      saleStatus: '1',
      orderSalesAgentId: { not: null },
    },
    select: {
      orderSalesAgentId: true,
      orderSalesAgentName: true,
      orderMarkup: true,
    },
  });

  const agentMap = new Map<number, { agentName: string; amount: number }>();
  for (const order of orders) {
    const agentId = order.orderSalesAgentId!;
    const name = order.orderSalesAgentName || 'Unknown Agent';
    const markup = parseFloat(order.orderMarkup || '0');

    if (!agentMap.has(agentId)) {
      agentMap.set(agentId, { agentName: name, amount: 0 });
    }
    agentMap.get(agentId)!.amount += markup;
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
      saleStatus: true,
      customer: {
        select: {
          firstName: true,
          lastName: true,
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
        ],
      },
    },
    select: {
      orderCurrentStatus: true,
      orderMarkup: true,
    },
  });

  const res: Record<string, { amount: number; count: number }> = {
    'Pending Booking': { amount: 0, count: 0 },
    'Pending Shipment': { amount: 0, count: 0 },
    'Pending Delivery': { amount: 0, count: 0 },
    'Pending Feedback': { amount: 0, count: 0 },
    'Pending Resolutions': { amount: 0, count: 0 },
  };

  for (const order of orders) {
    const status = order.orderCurrentStatus;
    if (status && status in res) {
      const markupVal = parseFloat(order.orderMarkup || '0');
      res[status].amount += markupVal;
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
      SUM(CASE WHEN o.sale_status = '1' THEN 1 ELSE 0 END) AS soldCount,
      SUM(CASE WHEN o.sale_status = '7' THEN 1 ELSE 0 END) AS refundCount,
      SUM(CASE WHEN o.sale_status = '8' THEN 1 ELSE 0 END) AS chargebackCount,
      SUM(
        CASE 
          WHEN o.sale_status = '1' THEN CAST(COALESCE(o.order_markup, '0') AS DECIMAL(10,2))
          WHEN o.sale_status IN ('7', '8') THEN -CAST(COALESCE(o.order_markup, '0') AS DECIMAL(10,2))
          ELSE 0 
        END
      ) AS netAmount
    FROM crm_teams t
    JOIN users u ON u.team_id = t.team_id
    JOIN crm_orders o ON o.order_sales_agent_id = u.uid
    WHERE MONTH(o.order_date) = ${month} AND YEAR(o.order_date) = ${year}
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

export async function getTeamMonthlyTopPerformer(teamId: number, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const agents = await prisma.users.findMany({
    where: { teamId },
    include: {
      salesOrders: {
        where: {
          saleStatus: '1',
          orderDate: {
            gte: start,
            lt: end,
          },
        },
        select: {
          orderMarkup: true,
        },
      },
    },
  });

  let topAgent: { agentName: string; amount: number } | null = null;

  for (const agent of agents) {
    let total = 0;
    for (const order of agent.salesOrders) {
      total += parseFloat(order.orderMarkup || '0');
    }
    if (total > 0 && (!topAgent || total > topAgent.amount)) {
      topAgent = { agentName: agent.name, amount: total };
    }
  }

  return topAgent;
}

export async function getTeamMonthlyBottomPerformer(teamId: number, month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const agents = await prisma.users.findMany({
    where: { teamId },
    include: {
      salesOrders: {
        where: {
          saleStatus: '1',
          orderDate: {
            gte: start,
            lt: end,
          },
        },
        select: {
          orderMarkup: true,
        },
      },
    },
  });

  let bottomAgent: { agentName: string; amount: number } | null = null;

  for (const agent of agents) {
    let total = 0;
    for (const order of agent.salesOrders) {
      total += parseFloat(order.orderMarkup || '0');
    }
    if (total > 0 && (!bottomAgent || total < bottomAgent.amount)) {
      bottomAgent = { agentName: agent.name, amount: total };
    }
  }

  return bottomAgent;
}
