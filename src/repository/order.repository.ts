import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { OrderCreateInput, OrderUpdateInput, OrderFilters } from '../types/order';

export async function createWithCustomerAndCard(
  data: OrderCreateInput,
  actingUser?: { uid: number; name: string; nickname?: string | null }
) {
  // Resolve sales agent name if present
  let salesAgentName: string | null = null;
  if (data.orderSalesAgentId) {
    const agent = await prisma.users.findUnique({
      where: { uid: data.orderSalesAgentId },
    });
    if (agent) {
      salesAgentName = agent.nickname || agent.name;
    }
  }

  // Resolve verifier name if present
  let verifierName: string | null = null;
  if (data.orderVerifierId) {
    const verifier = await prisma.users.findUnique({
      where: { uid: data.orderVerifierId },
    });
    if (verifier) {
      verifierName = verifier.nickname || verifier.name;
    }
  }

  // Resolve sales verifier name if present
  let salesVerifierName: string | null = null;
  if (data.orderSalesVerifierId) {
    const sv = await prisma.users.findUnique({
      where: { uid: data.orderSalesVerifierId },
    });
    if (sv) {
      salesVerifierName = sv.nickname || sv.name;
    }
  }

  // Resolve backend executive name if present
  let backendExecutiveName: string | null = null;
  if (data.orderBackendExecutiveId) {
    const be = await prisma.users.findUnique({
      where: { uid: data.orderBackendExecutiveId },
    });
    if (be) {
      backendExecutiveName = be.nickname || be.name;
    }
  }

  // Resolve vendor name if present
  let vendorName: string | null = null;
  if (data.orderVendorId) {
    const vendor = await prisma.crmVendors.findUnique({
      where: { vendorId: data.orderVendorId },
    });
    if (vendor) {
      vendorName = vendor.vendorName;
    }
  }

  // Calculate markup: Total Pitched - Vendor Price
  const totalPitched = parseFloat(data.orderTotalPitched || '0');
  const vendorPrice = parseFloat(data.orderVendorPrice || '0');
  const markup = (totalPitched - vendorPrice).toString();

  // Perform database inserts in an atomic transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Create customer
    const customer = await tx.crmCustomers.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        customerEmail: data.customerEmail,
        customerBillingAddress: data.customerBillingAddress || null,
        customerShippingAddress: data.customerShippingAddress || null,
        dateCreated: new Date(),
        dateUpdated: new Date(),
      },
    });

    // 2. Create customer card
    const card = await tx.crmCustomerCards.create({
      data: {
        cardCustomerId: customer.customerId,
        customerNameOncard: data.customerNameOncard,
        customerCardNumber: data.customerCardNumber,
        customerCardExpDate: data.customerCardExpDate,
        customerCardCvv: data.customerCardCvv || null,
        customerCardCopyStatus: data.customerCardCopyStatus || 'No',
        customerCardPhotoStatus: data.customerCardPhotoStatus || 'No',
        customerCardCreatedAt: new Date(),
        customerCardUpdated: new Date(),
      },
    });

    // 3. Create order
    const order = await tx.crmOrders.create({
      data: {
        orderCustomerId: customer.customerId,
        orderMakeModel: data.orderMakeModel || null,
        orderPart: data.orderPart || null,
        orderPartSize: data.orderPartSize || null,
        orderQuotedMiles: data.orderQuotedMiles || null,
        orderGivenMiles: data.orderGivenMiles || null,
        orderVin: data.orderVin || null,
        orderTotalPitched: data.orderTotalPitched || null,
        orderVendorPrice: data.orderVendorPrice || null,
        orderVendorId: data.orderVendorId || null,
        orderVendorName: vendorName,
        orderShippingType: data.orderShippingType || null,
        orderMarkup: markup,
        orderPaymentGatewayId: data.orderPaymentGatewayId || null,
        orderSalesAgentId: data.orderSalesAgentId || null,
        orderSalesAgentName: salesAgentName,
        orderVerifierId: data.orderVerifierId || null,
        orderVerifierName: verifierName,
        orderSalesVerifierId: data.orderSalesVerifierId || null,
        orderSalesVerifierName: salesVerifierName,
        orderBackendExecutiveId: data.orderBackendExecutiveId || null,
        orderBackendExecutiveName: backendExecutiveName,
        saleStatus: data.saleStatus || '1', // Default to Sold
        orderCurrentStatus: data.orderCurrentStatus
          ? data.orderCurrentStatus
          : (data.saleStatus === '2' || data.saleStatus === '3')
            ? 'Returned Orders'
            : (data.orderVendorId ? 'Pending Shipment' : 'Pending Booking'), // Initial state
        orderRefundAmount: (data.saleStatus === '2' || data.saleStatus === '3')
          ? markup
          : (data.saleStatus === '4' ? data.orderRefundAmount || null : null),
        orderCurrentStatusUpdateDate: new Date(),
        orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
        orderVendorFeedback: 'Positive',
        orderClientFeedback: 'Positive',
        orderResolution: 'Resolved',
        orderCreatedDate: new Date(),
        orderUpdatedDate: new Date(),
      },
    });

    // 4. Create initial histories if actingUser is provided
    if (actingUser) {
      const saleChangedAt = data.saleStatusChangeDate
        ? new Date(data.saleStatusChangeDate)
        : new Date();
      await tx.crmSaleStatusHistory.create({
        data: {
          orderId: order.crmOrderId,
          oldValue: null,
          newValue: order.saleStatus || '1',
          changedById: actingUser.uid,
          changedByName: actingUser.nickname || actingUser.name,
          changedAt: saleChangedAt,
        },
      });

      await tx.crmOrderCurrentStatusHistory.create({
        data: {
          orderId: order.crmOrderId,
          oldValue: null,
          newValue: order.orderCurrentStatus || 'Pending Booking',
          changedById: actingUser.uid,
          changedByName: actingUser.nickname || actingUser.name,
          changedAt: new Date(),
        },
      });
    }

    return {
      orderId: order.crmOrderId,
      customerId: customer.customerId,
      cardId: card.cardId,
    };
  });
}

export async function findAll(filters: OrderFilters): Promise<any> {
  const where: Prisma.CrmOrdersWhereInput = {};

  if (filters.status) {
    if (filters.status === 'Completed Orders') {
      where.orderCurrentStatus = 'Completed Orders';
      where.saleStatus = { in: ['1', '4'] };
    } else if (filters.status === 'Returned Orders') {
      where.OR = [
        { orderCurrentStatus: 'Returned Orders' },
        { saleStatus: { in: ['2', '3'] } }
      ];
    } else {
      where.orderCurrentStatus = filters.status;
    }
  }
  if (filters.saleStatus) {
    if (filters.saleStatus.includes(',')) {
      where.saleStatus = { in: filters.saleStatus.split(',') };
    } else {
      where.saleStatus = filters.saleStatus;
    }
  }
  if (filters.agentId) {
    where.orderSalesAgentId = filters.agentId;
  }
  if (filters.teamId) {
    where.salesAgent = {
      teamId: filters.teamId,
    };
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

  if (filters.page !== undefined && filters.limit !== undefined) {
    const skip = (filters.page - 1) * filters.limit;
    const [orders, total] = await Promise.all([
      prisma.crmOrders.findMany({
        where,
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
        },
        orderBy: {
          orderCreatedDate: 'desc',
        },
        skip,
        take: filters.limit,
      }),
      prisma.crmOrders.count({ where })
    ]);
    return {
      data: orders,
      total,
      pages: Math.ceil(total / filters.limit),
    };
  }

  return await prisma.crmOrders.findMany({
    where,
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
    },
    orderBy: {
      orderCreatedDate: 'desc',
    },
  });
}

export async function findById(crmOrderId: number) {
  return await prisma.crmOrders.findUnique({
    where: { crmOrderId },
    include: {
      customer: {
        include: {
          cards: true,
        },
      },
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
      comments: true,
    },
  });
}

export async function update(crmOrderId: number, data: OrderUpdateInput) {
  const updateData = { ...data };
  if (updateData.orderDate) {
    updateData.orderDate = new Date(updateData.orderDate);
  }
  return await prisma.crmOrders.update({
    where: { crmOrderId },
    data: {
      ...updateData,
      orderUpdatedDate: new Date(),
    },
  });
}

export async function remove(crmOrderId: number) {
  return await prisma.crmOrders.delete({
    where: { crmOrderId },
  });
}

// ─── Sale Status History ──────────────────────────────────────────────────────

export async function createSaleStatusHistoryEntry(data: {
  orderId: number;
  oldValue: string | null;
  newValue: string;
  changedById: number;
  changedByName: string;
  changedAt?: Date; // optional override — used for Refund/Chargeback event dates
}) {
  return await prisma.crmSaleStatusHistory.create({
    data: {
      orderId:       data.orderId,
      oldValue:      data.oldValue ?? null,
      newValue:      data.newValue,
      changedById:   data.changedById,
      changedByName: data.changedByName,
      changedAt:     data.changedAt ?? new Date(), // defaults to NOW() if no override
    },
  });
}

export async function getSaleStatusHistoryByOrderId(orderId: number) {
  return await prisma.crmSaleStatusHistory.findMany({
    where: { orderId },
    orderBy: { changedAt: 'asc' },
  });
}

// ─── Order Workflow (Current Status) History ──────────────────────────────────

export async function createWorkflowStatusHistoryEntry(data: {
  orderId: number;
  oldValue: string | null;
  newValue: string;
  changedById: number;
  changedByName: string;
}) {
  return await prisma.crmOrderCurrentStatusHistory.create({
    data: {
      orderId:       data.orderId,
      oldValue:      data.oldValue ?? null,
      newValue:      data.newValue,
      changedById:   data.changedById,
      changedByName: data.changedByName,
      changedAt:     new Date(), // always current time — no override possible
    },
  });
}

export async function getWorkflowStatusHistoryByOrderId(orderId: number) {
  return await prisma.crmOrderCurrentStatusHistory.findMany({
    where: { orderId },
    orderBy: { changedAt: 'asc' },
  });
}

// ─── Order View Logs ─────────────────────────────────────────────────────────

export async function logOrderView(orderId: number, viewerId: number, viewerName: string) {
  const viewerExists = await prisma.users.findUnique({
    where: { uid: viewerId },
    select: { uid: true },
  });
  if (!viewerExists) {
    console.warn(`[OrderView] Skip logging view for non-existent viewer ID: ${viewerId}`);
    return null;
  }

  return await prisma.crmOrderViews.create({
    data: { orderId, viewerId, viewerName, viewedAt: new Date() },
  });
}

export async function getOrderViews(orderId: number) {
  return await prisma.crmOrderViews.findMany({
    where: { orderId },
    orderBy: { viewedAt: 'desc' },
    take: 100, // cap at last 100 view events
  });
}

// ─── Order Audit Logs ────────────────────────────────────────────────────────

export async function createAuditLogEntries(
  orderId: number,
  entries: { fieldName: string; oldValue: string | null; newValue: string | null }[],
  changedById: number,
  changedByName: string
) {
  if (entries.length === 0) return;
  const data = entries.map((entry) => ({
    orderId,
    fieldName:     entry.fieldName,
    oldValue:      entry.oldValue,
    newValue:      entry.newValue,
    changedById,
    changedByName,
    changedAt:     new Date(),
  }));
  return await prisma.crmOrderAuditLog.createMany({ data });
}

export async function getAuditLogByOrderId(orderId: number) {
  return await prisma.crmOrderAuditLog.findMany({
    where: { orderId },
    orderBy: { id: 'desc' },
  });
}

