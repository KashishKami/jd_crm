import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { OrderCreateInput, OrderUpdateInput, OrderFilters } from '../types/order';

function toUtcNoonDate(dateVal: string | Date | null | undefined): Date {
  if (!dateVal) return new Date();
  const dateStr = (dateVal instanceof Date ? dateVal.toISOString() : String(dateVal)).split('T')[0];
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) {
    return new Date();
  }
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export const GLOBAL_FIELDS = [
  'orderSalesAgentId',
  'orderSalesAgentName',
  'orderVerifierId',
  'orderVerifierName',
  'orderSalesVerifierId',
  'orderSalesVerifierName',
  'orderPaymentGatewayId',
  'orderDate',
  'orderShippingType',
  'orderLiftgateNeeded',
  'orderChecklist',
  'orderTotalPitched',
  'orderAmountCharged',
  'orderRefundAmount'
];

export async function createWithCustomerAndCard(
  data: OrderCreateInput,
  actingUser?: { uid: number; name: string; nickname?: string | null }
) {
  // Collect all parts. If data.parts is not defined or empty, fall back to a single part.
  const partsToCreate: any[] = (data.parts && data.parts.length > 0)
    ? data.parts
    : [{
        orderMakeModel: data.orderMakeModel,
        orderPart: data.orderPart,
        orderPartSize: data.orderPartSize,
        orderQuotedMilesAndWarranty: data.orderQuotedMilesAndWarranty,
        orderVendorMilesAndWarranty: data.orderVendorMilesAndWarranty,
        orderVin: data.orderVin,
        orderTotalPitched: data.orderTotalPitched,
        orderVendorPrice: data.orderVendorPrice,
        orderVendorId: data.orderVendorId,
        orderShippingType: data.orderShippingType,
        orderPaymentGatewayId: data.orderPaymentGatewayId,
        orderSalesAgentId: data.orderSalesAgentId,
        orderVerifierId: data.orderVerifierId,
        orderSalesVerifierId: data.orderSalesVerifierId,
        orderBackendExecutiveId: data.orderBackendExecutiveId,
        orderPartFoundById: data.orderPartFoundById,
        saleStatus: data.saleStatus,
        orderDate: data.orderDate,
        orderRefundAmount: data.orderRefundAmount,
        orderCurrentStatus: data.orderCurrentStatus,
        orderAmountCharged: data.orderAmountCharged,
        orderVendorFeedback: data.orderVendorFeedback,
        orderChecklist: data.orderChecklist,
        orderLiftgateNeeded: data.orderLiftgateNeeded,
      }];

  // Resolve all lookup names in parallel (Session 56 optimization scaled to batch query)
  const userIdsSet = new Set<number>();
  const vendorIdsSet = new Set<number>();

  for (const part of partsToCreate) {
    if (part.orderSalesAgentId) userIdsSet.add(part.orderSalesAgentId);
    if (part.orderVerifierId) userIdsSet.add(part.orderVerifierId);
    if (part.orderSalesVerifierId) userIdsSet.add(part.orderSalesVerifierId);
    if (part.orderBackendExecutiveId) userIdsSet.add(part.orderBackendExecutiveId);
    if (part.orderPartFoundById) userIdsSet.add(part.orderPartFoundById);
    if (part.orderVendorId) vendorIdsSet.add(part.orderVendorId);
  }

  // Also include global IDs from root data in userIdsSet/vendorIdsSet if they exist
  if (data.orderSalesAgentId) userIdsSet.add(data.orderSalesAgentId);
  if (data.orderVerifierId) userIdsSet.add(data.orderVerifierId);
  if (data.orderSalesVerifierId) userIdsSet.add(data.orderSalesVerifierId);
  if (data.orderPaymentGatewayId) {
    // Gateways are handled separately, not in users
  }

  const [usersList, vendorsList] = await Promise.all([
    userIdsSet.size > 0
      ? prisma.users.findMany({ where: { uid: { in: Array.from(userIdsSet) } } })
      : Promise.resolve([]),
    vendorIdsSet.size > 0
      ? prisma.crmVendors.findMany({ where: { vendorId: { in: Array.from(vendorIdsSet) } } })
      : Promise.resolve([]),
  ]);

  const userMap = new Map(usersList.map((u) => [u.uid, u.nickname || u.name]));
  const vendorMap = new Map(vendorsList.map((v) => [v.vendorId, v.vendorName]));

  // Perform database inserts in an atomic transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Create customer
    const customer = await tx.crmCustomers.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone || null,
        customerAlternatePhone1: data.customerAlternatePhone1 || null,
        customerAlternatePhone2: data.customerAlternatePhone2 || null,
        customerEmail: data.customerEmail,
        customerBillingAddress: data.customerBillingAddress || null,
        customerShippingAddress: data.customerShippingAddress || null,
        dateCreated: new Date(),
        dateUpdated: new Date(),
      },
    });

    // 2. Create customer card(s)
    const cardsToCreate = (data.cards && data.cards.length > 0)
      ? data.cards
      : (data.customerNameOncard && data.customerCardNumber && data.customerCardExpDate)
        ? [{
            customerNameOncard: data.customerNameOncard,
            customerCardNumber: data.customerCardNumber,
            customerCardExpDate: data.customerCardExpDate,
            customerCardCvv: data.customerCardCvv || null,
            customerCardCopyStatus: data.customerCardCopyStatus || 'No',
            customerCardPhotoStatus: data.customerCardPhotoStatus || 'No',
            amountToCharge: data.amountToCharge || null,
          }]
        : [];

    if (cardsToCreate.length === 0) {
      throw new Error('At least one payment card is required');
    }

    await tx.crmCustomerCards.createMany({
      data: cardsToCreate.map((c) => ({
        cardCustomerId: customer.customerId,
        customerNameOncard: c.customerNameOncard,
        customerCardNumber: c.customerCardNumber,
        customerCardExpDate: c.customerCardExpDate,
        customerCardCvv: c.customerCardCvv || null,
        customerCardCopyStatus: c.customerCardCopyStatus || 'No',
        customerCardPhotoStatus: c.customerCardPhotoStatus || 'No',
        amountToCharge: c.amountToCharge || null,
        customerCardCopyImage: c.customerCardCopyImage || null,
        customerPhotoIdImage: c.customerPhotoIdImage || null,
        customerCardCreatedAt: new Date(),
        customerCardUpdated: new Date(),
      })),
    });

    // 3. Create parent order (index 0)
    const parentPart = partsToCreate[0];
    
    // Resolve global fields (prefer top-level data, fallback to parentPart)
    const orderSalesAgentId = data.orderSalesAgentId ?? parentPart.orderSalesAgentId ?? null;
    const orderVerifierId = data.orderVerifierId ?? parentPart.orderVerifierId ?? null;
    const orderSalesVerifierId = data.orderSalesVerifierId ?? parentPart.orderSalesVerifierId ?? null;
    const orderPaymentGatewayId = data.orderPaymentGatewayId ?? parentPart.orderPaymentGatewayId ?? null;
    const orderDateVal = data.orderDate ?? parentPart.orderDate ?? null;
    const orderShippingType = data.orderShippingType ?? parentPart.orderShippingType ?? null;
    const orderLiftgateNeeded = data.orderLiftgateNeeded ?? parentPart.orderLiftgateNeeded ?? 'No';
    const orderChecklist = data.orderChecklist ?? parentPart.orderChecklist ?? 'No';
    const orderTotalPitched = data.orderTotalPitched ?? parentPart.orderTotalPitched ?? null;
    const orderAmountCharged = data.orderAmountCharged ?? parentPart.orderAmountCharged ?? null;
    const orderRefundAmountInput = data.orderRefundAmount ?? parentPart.orderRefundAmount ?? null;
    const orderMakeModel = data.orderMakeModel ?? parentPart.orderMakeModel ?? null;
    const orderVin = data.orderVin ?? parentPart.orderVin ?? null;

    const parentSalesAgentName = orderSalesAgentId ? userMap.get(orderSalesAgentId) || null : null;
    const parentVerifierName = orderVerifierId ? userMap.get(orderVerifierId) || null : null;
    const parentSalesVerifierName = orderSalesVerifierId ? userMap.get(orderSalesVerifierId) || null : null;
    const parentBackendExecutiveName = parentPart.orderBackendExecutiveId ? userMap.get(parentPart.orderBackendExecutiveId) || null : null;
    const parentPartFoundByName = parentPart.orderPartFoundById ? userMap.get(parentPart.orderPartFoundById) || null : null;
    const parentVendorName = parentPart.orderVendorId ? vendorMap.get(parentPart.orderVendorId) || null : null;

    const parentOrder = await tx.crmOrders.create({
      data: {
        orderCustomerId: customer.customerId,
        orderMakeModel: orderMakeModel,
        orderPart: parentPart.orderPart || null,
        orderPartSize: parentPart.orderPartSize || null,
        orderQuotedMilesAndWarranty: parentPart.orderQuotedMilesAndWarranty || null,
        orderVendorMilesAndWarranty: parentPart.orderVendorMilesAndWarranty || null,
        orderChecklist: orderChecklist,
        orderVin: orderVin,
        orderTotalPitched: orderTotalPitched,
        orderVendorPrice: parentPart.orderVendorPrice || null,
        orderVendorId: parentPart.orderVendorId || null,
        orderVendorName: parentVendorName,
        orderShippingType: orderShippingType,
        orderAmountCharged: orderAmountCharged,
        orderPaymentGatewayId: orderPaymentGatewayId,
        orderSalesAgentId: orderSalesAgentId,
        orderSalesAgentName: parentSalesAgentName,
        orderVerifierId: orderVerifierId,
        orderVerifierName: parentVerifierName,
        orderSalesVerifierId: orderSalesVerifierId,
        orderSalesVerifierName: parentSalesVerifierName,
        orderBackendExecutiveId: parentPart.orderBackendExecutiveId || null,
        orderBackendExecutiveName: parentBackendExecutiveName,
        orderPartFoundById: parentPart.orderPartFoundById || null,
        orderPartFoundByName: parentPartFoundByName,
        orderLiftgateNeeded: orderLiftgateNeeded,
        saleStatus: parentPart.saleStatus || '1',
        orderCurrentStatus: parentPart.orderCurrentStatus
          ? parentPart.orderCurrentStatus
          : (parentPart.saleStatus === '2' || parentPart.saleStatus === '3' || parentPart.saleStatus === '5')
            ? 'Returned Orders'
            : (parentPart.orderVendorId ? 'Pending Shipment' : 'Pending Booking'),
        orderRefundAmount: (parentPart.saleStatus === '2' || parentPart.saleStatus === '3' || parentPart.saleStatus === '5')
          ? (orderAmountCharged || null)
          : (orderRefundAmountInput || null),
        orderCurrentStatusUpdateDate: new Date(),
        orderDate: toUtcNoonDate(orderDateVal),
        orderVendorFeedback: parentPart.orderVendorFeedback || 'Positive',
        orderClientFeedback: 'Positive',
        orderResolution: 'Resolved',
        orderCreatedDate: new Date(),
        orderUpdatedDate: new Date(),
        parentOrderId: null,
      },
    });

    // 4. Create child orders (indexes 1..N) if any
    const childIds: number[] = [];
    if (partsToCreate.length > 1) {
      for (let i = 1; i < partsToCreate.length; i++) {
        const childPart = partsToCreate[i];
        const childBackendExecutiveName = childPart.orderBackendExecutiveId ? userMap.get(childPart.orderBackendExecutiveId) || null : null;
        const childPartFoundByName = childPart.orderPartFoundById ? userMap.get(childPart.orderPartFoundById) || null : null;
        const childVendorName = childPart.orderVendorId ? vendorMap.get(childPart.orderVendorId) || null : null;

        const childOrder = await tx.crmOrders.create({
          data: {
            orderCustomerId: customer.customerId,
            orderPart: childPart.orderPart || null,
            orderPartSize: childPart.orderPartSize || null,
            orderQuotedMilesAndWarranty: childPart.orderQuotedMilesAndWarranty || null,
            orderVendorMilesAndWarranty: childPart.orderVendorMilesAndWarranty || null,
            orderVendorPrice: childPart.orderVendorPrice || null,
            orderVendorId: childPart.orderVendorId || null,
            orderVendorName: childVendorName,
            orderBackendExecutiveId: childPart.orderBackendExecutiveId || null,
            orderBackendExecutiveName: childBackendExecutiveName,
            orderPartFoundById: childPart.orderPartFoundById || null,
            orderPartFoundByName: childPartFoundByName,
            saleStatus: childPart.saleStatus || '1',
            orderCurrentStatus: childPart.orderCurrentStatus
              ? childPart.orderCurrentStatus
              : (childPart.saleStatus === '2' || childPart.saleStatus === '3' || childPart.saleStatus === '5')
                ? 'Returned Orders'
                : (childPart.orderVendorId ? 'Pending Shipment' : 'Pending Booking'),
            orderCurrentStatusUpdateDate: new Date(),
            orderVendorFeedback: childPart.orderVendorFeedback || 'Positive',
            orderClientFeedback: 'Positive',
            orderResolution: 'Resolved',
            orderCreatedDate: new Date(),
            orderUpdatedDate: new Date(),
            parentOrderId: parentOrder.crmOrderId,
            orderMakeModel: childPart.orderMakeModel || null,
            orderVin: childPart.orderVin || null,
            // Explicitly NULL for global fields on child rows
            orderChecklist: null,
            orderTotalPitched: null,
            orderAmountCharged: null,
            orderPaymentGatewayId: null,
            orderSalesAgentId: null,
            orderSalesAgentName: null,
            orderVerifierId: null,
            orderVerifierName: null,
            orderSalesVerifierId: null,
            orderSalesVerifierName: null,
            orderLiftgateNeeded: null,
            orderRefundAmount: null,
            orderDate: null,
            orderShippingType: null,
          },
        });
        childIds.push(childOrder.crmOrderId);
      }
    }

    // 5. Fetch first card for return values compatibility
    const firstCard = await tx.crmCustomerCards.findFirst({
      where: { cardCustomerId: customer.customerId },
      orderBy: { cardId: 'asc' },
      select: { cardId: true },
    });

    // 6. Create initial histories if actingUser is provided
    if (actingUser) {
      const saleChangedAt = data.saleStatusChangeDate
        ? new Date(data.saleStatusChangeDate)
        : new Date();
      
      // Parent history
      await tx.crmSaleStatusHistory.create({
        data: {
          orderId: parentOrder.crmOrderId,
          oldValue: null,
          newValue: parentOrder.saleStatus || '1',
          changedById: actingUser.uid,
          changedByName: actingUser.nickname || actingUser.name,
          changedAt: saleChangedAt,
        },
      });
      await tx.crmOrderCurrentStatusHistory.create({
        data: {
          orderId: parentOrder.crmOrderId,
          oldValue: null,
          newValue: parentOrder.orderCurrentStatus || 'Pending Booking',
          changedById: actingUser.uid,
          changedByName: actingUser.nickname || actingUser.name,
          changedAt: new Date(),
        },
      });

      // Children history
      for (let idx = 0; idx < childIds.length; idx++) {
        const cId = childIds[idx];
        const pData = partsToCreate[idx + 1];
        await tx.crmSaleStatusHistory.create({
          data: {
            orderId: cId,
            oldValue: null,
            newValue: pData.saleStatus || '1',
            changedById: actingUser.uid,
            changedByName: actingUser.nickname || actingUser.name,
            changedAt: new Date(),
          },
        });
        await tx.crmOrderCurrentStatusHistory.create({
          data: {
            orderId: cId,
            oldValue: null,
            newValue: pData.orderCurrentStatus || (pData.orderVendorId ? 'Pending Shipment' : 'Pending Booking'),
            changedById: actingUser.uid,
            changedByName: actingUser.nickname || actingUser.name,
            changedAt: new Date(),
          },
        });
      }
    }

    return {
      orderId: parentOrder.crmOrderId,
      crmOrderId: parentOrder.crmOrderId,
      customerId: customer.customerId,
      cardId: firstCard?.cardId ?? null,
      partOrderIds: [parentOrder.crmOrderId, ...childIds],
    };
  });
}

export async function findAll(filters: OrderFilters): Promise<any> {
  const andConditions: Prisma.CrmOrdersWhereInput[] = [
    { parentOrderId: null },
  ];

  if (filters.status) {
    if (filters.status === 'Completed Orders') {
      andConditions.push({
        OR: [
          { orderCurrentStatus: 'Completed Orders', saleStatus: { in: ['1', '4'] } },
          { childOrders: { some: { orderCurrentStatus: 'Completed Orders', saleStatus: { in: ['1', '4'] } } } }
        ]
      });
    } else if (filters.status === 'Returned Orders') {
      andConditions.push({
        OR: [
          { orderCurrentStatus: 'Returned Orders' },
          { saleStatus: { in: ['2', '3', '5'] } },
          { childOrders: { some: { orderCurrentStatus: 'Returned Orders' } } },
          { childOrders: { some: { saleStatus: { in: ['2', '3', '5'] } } } }
        ]
      });
    } else {
      andConditions.push({
        OR: [
          { orderCurrentStatus: filters.status },
          { childOrders: { some: { orderCurrentStatus: filters.status } } }
        ]
      });
    }
  }

  if (filters.saleStatus) {
    const statuses = filters.saleStatus.includes(',') ? filters.saleStatus.split(',') : [filters.saleStatus];
    andConditions.push({
      OR: [
        { saleStatus: { in: statuses } },
        { childOrders: { some: { saleStatus: { in: statuses } } } }
      ]
    });
  }

  if (filters.agentId) {
    andConditions.push({ orderSalesAgentId: filters.agentId });
  }

  if (filters.teamId) {
    andConditions.push({
      salesAgent: {
        teamId: filters.teamId,
      }
    });
  }

  if (filters.backendExecutiveId) {
    andConditions.push({ orderBackendExecutiveId: filters.backendExecutiveId });
  }

  if (filters.partFoundById) {
    andConditions.push({
      OR: [
        { orderPartFoundById: filters.partFoundById },
        {
          childOrders: {
            some: {
              orderPartFoundById: filters.partFoundById,
            },
          },
        },
      ],
    });
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
    andConditions.push({ orderDate: dateFilter });
  }

  const where: Prisma.CrmOrdersWhereInput = {
    AND: andConditions,
  };

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
          childOrders: {
            select: childOrdersSelect,
          },
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
      childOrders: {
        select: childOrdersSelect,
      },
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
      partFoundBy: {
        select: {
          uid: true,
          nickname: true,
          name: true,
        },
      },
      comments: true,
      childOrders: {
        include: {
          salesAgent: {
            select: {
              uid: true,
              nickname: true,
              name: true,
            },
          },
          verifier: {
            select: {
              uid: true,
              nickname: true,
              name: true,
            },
          },
          salesVerifier: {
            select: {
              uid: true,
              nickname: true,
              name: true,
            },
          },
          backendExecutive: {
            select: {
              uid: true,
              nickname: true,
              name: true,
            },
          },
          partFoundBy: {
            select: {
              uid: true,
              nickname: true,
              name: true,
            },
          },
          vendor: {
            select: {
              vendorId: true,
              vendorName: true,
            },
          },
          gateway: {
            select: {
              gatewayId: true,
              gatewayName: true,
            },
          },
        },
      },
    },
  });
}

export async function update(crmOrderId: number, data: OrderUpdateInput) {
  const updateData = { ...data };
  if (updateData.orderDate) {
    // Use noon UTC for @db.Date to avoid EST midnight rollback
    updateData.orderDate = toUtcNoonDate(updateData.orderDate);
  }

  // If it is a child order (non-null parentOrderId), strip out GLOBAL_FIELDS
  const existing = await prisma.crmOrders.findUnique({
    where: { crmOrderId },
    select: { parentOrderId: true },
  });
  if (existing && existing.parentOrderId !== null) {
    GLOBAL_FIELDS.forEach((f) => {
      delete (updateData as any)[f];
    });
  }

  if (updateData.orderPartFoundById !== undefined) {
    if (updateData.orderPartFoundById === null) {
      updateData.orderPartFoundByName = null;
    } else {
      const pfb = await prisma.users.findUnique({
        where: { uid: updateData.orderPartFoundById },
      });
      if (pfb) {
        updateData.orderPartFoundByName = pfb.nickname || pfb.name;
      }
    }
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

export async function addPartToExistingOrder(parentOrderId: number, data: any) {
  const parent = await prisma.crmOrders.findUnique({
    where: { crmOrderId: parentOrderId },
    select: { parentOrderId: true, orderCustomerId: true },
  });
  if (!parent) {
    throw new Error(`Parent order with ID ${parentOrderId} not found`);
  }
  if (parent.parentOrderId !== null) {
    throw new Error('Use the parent order ID, not a child order ID');
  }

  // Filter out any GLOBAL_FIELDS keys from child data
  const childData = { ...data };
  GLOBAL_FIELDS.forEach((f) => {
    delete childData[f];
  });

  const [
    backendExecRecord,
    partFoundByRecord,
    vendorRecord,
  ] = await Promise.all([
    childData.orderBackendExecutiveId
      ? prisma.users.findUnique({ where: { uid: childData.orderBackendExecutiveId } })
      : Promise.resolve(null),
    childData.orderPartFoundById
      ? prisma.users.findUnique({ where: { uid: childData.orderPartFoundById } })
      : Promise.resolve(null),
    childData.orderVendorId
      ? prisma.crmVendors.findUnique({ where: { vendorId: childData.orderVendorId } })
      : Promise.resolve(null),
  ]);

  const backendExecutiveName = backendExecRecord ? (backendExecRecord.nickname || backendExecRecord.name) : null;
  const partFoundByName = partFoundByRecord ? (partFoundByRecord.nickname || partFoundByRecord.name) : null;
  const vendorName = vendorRecord ? vendorRecord.vendorName : null;

  return await prisma.crmOrders.create({
    data: {
      orderCustomerId: parent.orderCustomerId,
      orderPart: childData.orderPart || null,
      orderPartSize: childData.orderPartSize || null,
      orderQuotedMilesAndWarranty: childData.orderQuotedMilesAndWarranty || null,
      orderVendorMilesAndWarranty: childData.orderVendorMilesAndWarranty || null,
      orderVendorPrice: childData.orderVendorPrice || null,
      orderVendorId: childData.orderVendorId || null,
      orderVendorName: vendorName,
      orderBackendExecutiveId: childData.orderBackendExecutiveId || null,
      orderBackendExecutiveName: backendExecutiveName,
      orderPartFoundById: childData.orderPartFoundById || null,
      orderPartFoundByName: partFoundByName,
      saleStatus: childData.saleStatus || '1',
      orderCurrentStatus: childData.orderCurrentStatus
        ? childData.orderCurrentStatus
        : (childData.saleStatus === '2' || childData.saleStatus === '3' || childData.saleStatus === '5')
          ? 'Returned Orders'
          : (childData.orderVendorId ? 'Pending Shipment' : 'Pending Booking'),
      orderCurrentStatusUpdateDate: new Date(),
      orderVendorFeedback: childData.orderVendorFeedback || 'Positive',
      orderClientFeedback: 'Positive',
      orderResolution: 'Resolved',
      orderCreatedDate: new Date(),
      orderUpdatedDate: new Date(),
      parentOrderId: parentOrderId,
      orderMakeModel: childData.orderMakeModel || null,
      orderVin: childData.orderVin || null,
      // Explicitly NULL for global fields on child rows
      orderChecklist: null,
      orderTotalPitched: null,
      orderAmountCharged: null,
      orderPaymentGatewayId: null,
      orderSalesAgentId: null,
      orderSalesAgentName: null,
      orderVerifierId: null,
      orderVerifierName: null,
      orderSalesVerifierId: null,
      orderSalesVerifierName: null,
      orderLiftgateNeeded: null,
      orderRefundAmount: null,
      orderDate: null,
      orderShippingType: null,
    },
  });
}

export async function removeChildPart(parentOrderId: number, childOrderId: number) {
  const child = await prisma.crmOrders.findUnique({
    where: { crmOrderId: childOrderId },
    select: { parentOrderId: true },
  });
  if (!child || child.parentOrderId !== parentOrderId) {
    throw new Error(`Child order ${childOrderId} not found or does not belong to parent ${parentOrderId}`);
  }
  return await prisma.crmOrders.delete({
    where: { crmOrderId: childOrderId },
  });
}

export async function countChildren(parentOrderId: number) {
  return await prisma.crmOrders.count({
    where: { parentOrderId },
  });
}

export async function promotePrimaryPart(currentParentId: number, newPrimaryPartId: number) {
  return await prisma.$transaction(async (tx) => {
    const targetChild = await tx.crmOrders.findUnique({
      where: { crmOrderId: newPrimaryPartId },
      select: { parentOrderId: true, orderCustomerId: true },
    });
    if (!targetChild || targetChild.parentOrderId !== currentParentId) {
      throw new Error(`Order ${newPrimaryPartId} does not belong to this order group`);
    }

    // 1. Fetch current global fields from the old parent
    const oldParent = await tx.crmOrders.findUnique({
      where: { crmOrderId: currentParentId },
      select: {
        orderSalesAgentId: true,
        orderSalesAgentName: true,
        orderVerifierId: true,
        orderVerifierName: true,
        orderSalesVerifierId: true,
        orderSalesVerifierName: true,
        orderPaymentGatewayId: true,
        orderDate: true,
        orderShippingType: true,
        orderLiftgateNeeded: true,
        orderChecklist: true,
        orderTotalPitched: true,
        orderAmountCharged: true,
        orderRefundAmount: true,
      },
    });

    if (!oldParent) {
      throw new Error(`Current parent order ${currentParentId} not found`);
    }

    // 2. Promote the target child and assign global fields to it
    await tx.crmOrders.update({
      where: { crmOrderId: newPrimaryPartId },
      data: {
        parentOrderId: null,
        ...oldParent,
      },
    });

    // 3. Demote the old parent and clear global fields on it
    await tx.crmOrders.update({
      where: { crmOrderId: currentParentId },
      data: {
        parentOrderId: newPrimaryPartId,
        orderSalesAgentId: null,
        orderSalesAgentName: null,
        orderVerifierId: null,
        orderVerifierName: null,
        orderSalesVerifierId: null,
        orderSalesVerifierName: null,
        orderPaymentGatewayId: null,
        orderDate: null,
        orderShippingType: null,
        orderLiftgateNeeded: null,
        orderChecklist: null,
        orderTotalPitched: null,
        orderAmountCharged: null,
        orderRefundAmount: null,
      },
    });

    // 4. Update parentOrderId for siblings
    await tx.crmOrders.updateMany({
      where: {
        parentOrderId: currentParentId,
        crmOrderId: { not: newPrimaryPartId },
      },
      data: { parentOrderId: newPrimaryPartId },
    });
  });
}

