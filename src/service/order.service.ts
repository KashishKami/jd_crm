import * as orderRepository from '../repository/order.repository';
import { prisma } from '../lib/db';
import { OrderCreateInput, OrderUpdateInput, OrderFilters } from '../types/order';

export async function createOrder(
  data: OrderCreateInput,
  actingUser?: { uid: number; name: string; nickname?: string | null }
) {
  // Input validations
  if (!data.customerName) {
    throw new Error('Customer name is required');
  }
  if (!data.customerEmail) {
    throw new Error('Customer email is required');
  }
  if (!data.customerNameOncard || !data.customerCardNumber || !data.customerCardExpDate) {
    throw new Error('Sensitive payment details (name on card, card number, expiry date) are required');
  }
  if (!data.orderPart) {
    throw new Error('Order vehicle part description is required');
  }

  // Sale Status & Refund Auto-Rules for creation
  if (data.saleStatus === '4' && !data.orderRefundAmount) {
    throw new Error('Refund amount is required for Partial Refund status');
  }

  return await orderRepository.createWithCustomerAndCard(data, actingUser);
}

export async function getOrderDetails(crmOrderId: number) {
  const order = await orderRepository.findById(crmOrderId);
  if (!order) {
    throw new Error('Order not found');
  }
  return order;
}

export async function getAllOrders(filters: OrderFilters) {
  return await orderRepository.findAll(filters);
}

export async function updateOrder(
  crmOrderId: number,
  data: OrderUpdateInput,
  changedByUserId: number,
  changedByName: string,
) {
  const existingOrder = await orderRepository.findById(crmOrderId);
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  // ─── Separate customer & card fields from the order-level payload ───────────
  const {
    // Customer fields
    customerName,
    customerPhone,
    customerEmail,
    customerBillingAddress,
    customerShippingAddress,
    // Card fields
    customerNameOncard,
    customerCardNumber,
    customerCardExpDate,
    customerCardCvv,
    customerCardCopyStatus,
    customerCardPhotoStatus,
    // Audit fields
    saleStatusChangeDate,
    // Everything else belongs to the crm_orders row
    ...orderFields
  } = data;

  const updatedData: OrderUpdateInput = { ...orderFields };

  // Calculate markup if pricing fields are updated
  if (data.orderTotalPitched !== undefined || data.orderVendorPrice !== undefined) {
    const totalPitched = parseFloat(data.orderTotalPitched ?? existingOrder.orderTotalPitched ?? '0');
    const vendorPrice = parseFloat(data.orderVendorPrice ?? existingOrder.orderVendorPrice ?? '0');
    updatedData.orderMarkup = (totalPitched - vendorPrice).toString();
  }

  // ─── Sale Status & Refund Auto-Rules (Phase 17) ───
  if (data.saleStatus !== undefined) {
    if (data.saleStatus === '2' || data.saleStatus === '3') {
      const markup = updatedData.orderMarkup !== undefined 
        ? updatedData.orderMarkup 
        : (existingOrder.orderMarkup ?? '0');
      updatedData.orderRefundAmount = markup;
      updatedData.orderCurrentStatus = 'Returned Orders';
      updatedData.orderCurrentStatusUpdateDate = new Date();
    } else if (data.saleStatus === '1') {
      updatedData.orderRefundAmount = '0';
    } else if (data.saleStatus === '4') {
      if (!data.orderRefundAmount) {
        throw new Error('Refund amount is required for Partial Refund status');
      }
      updatedData.orderRefundAmount = data.orderRefundAmount;
    }
  } else if (existingOrder.saleStatus === '4' && data.orderRefundAmount !== undefined) {
    updatedData.orderRefundAmount = data.orderRefundAmount;
  }

  // ─── State machine: auto-advance only when a specific trigger fires ──────────
  // The user's manually selected orderCurrentStatus (from the dropdown) is used
  // as the base. Auto-transitions only fire when the trigger condition is met AND
  // the user hasn't manually set a later status themselves.
  const manualStatus = orderFields.orderCurrentStatus;

  // 1. Newly assigning a vendor on a Pending Booking order → Pending Shipment
  if (
    data.orderVendorId &&
    !existingOrder.orderVendorId &&
    existingOrder.orderCurrentStatus === 'Pending Booking' &&
    (!manualStatus || manualStatus === 'Pending Booking')
  ) {
    updatedData.orderCurrentStatus = 'Pending Shipment';
    updatedData.orderCurrentStatusUpdateDate = new Date();
  }

  // 2. Newly setting a tracking number on a Pending Shipment order → Pending Delivery
  if (
    data.orderTrackingNumber &&
    !existingOrder.orderTrackingNumber &&
    existingOrder.orderCurrentStatus === 'Pending Shipment' &&
    (!manualStatus || manualStatus === 'Pending Shipment')
  ) {
    updatedData.orderCurrentStatus = 'Pending Delivery';
    updatedData.orderCurrentStatusUpdateDate = new Date();
  }

  // 3. Delivery status confirmed → Pending Feedback
  if (
    data.orderDeliveryStatus &&
    data.orderDeliveryStatus.toLowerCase().includes('delivered') &&
    (!manualStatus || manualStatus === 'Pending Delivery')
  ) {
    updatedData.orderCurrentStatus = 'Pending Feedback';
    updatedData.orderCurrentStatusUpdateDate = new Date();
  }

  // 3. Resolve sales agent nickname snapshot if ID is changed
  if (data.orderSalesAgentId && data.orderSalesAgentId !== existingOrder.orderSalesAgentId) {
    const { prisma } = await import('../lib/db');
    const agent = await prisma.users.findUnique({
      where: { uid: data.orderSalesAgentId },
    });
    if (agent) {
      updatedData.orderSalesAgentName = agent.nickname || agent.name;
    }
  }

  // 4. Resolve verifier nickname snapshot if ID is changed
  if (data.orderVerifierId && data.orderVerifierId !== existingOrder.orderVerifierId) {
    const { prisma } = await import('../lib/db');
    const verifier = await prisma.users.findUnique({
      where: { uid: data.orderVerifierId },
    });
    if (verifier) {
      updatedData.orderVerifierName = verifier.nickname || verifier.name;
    }
  }

  // 4.5. Resolve Sales Verifier nickname snapshot if ID is changed
  if (data.orderSalesVerifierId !== undefined && data.orderSalesVerifierId !== existingOrder.orderSalesVerifierId) {
    if (data.orderSalesVerifierId === null) {
      updatedData.orderSalesVerifierId = null;
      updatedData.orderSalesVerifierName = null;
    } else {
      const { prisma } = await import('../lib/db');
      const sv = await prisma.users.findUnique({
        where: { uid: data.orderSalesVerifierId },
      });
      if (sv) {
        updatedData.orderSalesVerifierName = sv.nickname || sv.name;
      }
    }
  }

  // 4.6. Resolve Backend Executive nickname snapshot if ID is changed
  if (data.orderBackendExecutiveId !== undefined && data.orderBackendExecutiveId !== existingOrder.orderBackendExecutiveId) {
    if (data.orderBackendExecutiveId === null) {
      updatedData.orderBackendExecutiveId = null;
      updatedData.orderBackendExecutiveName = null;
    } else {
      const { prisma } = await import('../lib/db');
      const be = await prisma.users.findUnique({
        where: { uid: data.orderBackendExecutiveId },
      });
      if (be) {
        updatedData.orderBackendExecutiveName = be.nickname || be.name;
      }
    }
  }

  // 5. Resolve vendor name snapshot if ID is changed
  if (data.orderVendorId && data.orderVendorId !== existingOrder.orderVendorId) {
    const { prisma } = await import('../lib/db');
    const vendor = await prisma.crmVendors.findUnique({
      where: { vendorId: data.orderVendorId },
    });
    if (vendor) {
      updatedData.orderVendorName = vendor.vendorName;
    }
  }

  // ─── Diff and write change audit log entries ──────────────────────────────────
  const auditEntries: { fieldName: string; oldValue: string | null; newValue: string | null }[] = [];

  const isSameDate = (d1: any, d2: any) => {
    if (!d1 && !d2) return true;
    if (!d1 || !d2) return false;
    try {
      const t1 = new Date(d1).toISOString().slice(0, 10);
      const t2 = new Date(d2).toISOString().slice(0, 10);
      return t1 === t2;
    } catch {
      return false;
    }
  };

  const checkStrDiff = (fieldName: string, oldVal: any, newVal: any, isDate = false) => {
    if (newVal === undefined) return;
    if (isDate) {
      if (!isSameDate(oldVal, newVal)) {
        const oldStr = oldVal ? new Date(oldVal).toISOString().slice(0, 10) : null;
        const newStr = newVal ? new Date(newVal).toISOString().slice(0, 10) : null;
        auditEntries.push({ fieldName, oldValue: oldStr, newValue: newStr });
      }
      return;
    }
    const oldStr = oldVal !== null && oldVal !== undefined ? String(oldVal) : null;
    const newStr = newVal !== null && newVal !== undefined ? String(newVal) : null;
    if ((oldStr || '') !== (newStr || '')) {
      auditEntries.push({ fieldName, oldValue: oldStr, newValue: newStr });
    }
  };

  const orderKeysToAudit = [
    'orderMakeModel', 'orderPart', 'orderPartSize', 'orderQuotedMiles', 'orderGivenMiles',
    'orderVin', 'orderTotalPitched', 'orderVendorPrice', 'orderVendorName',
    'orderShippingType', 'orderMarkup', 'orderRefundAmount',
    'orderSalesAgentName', 'orderVerifierName',
    'orderSalesVerifierName', 'orderBackendExecutiveName',
    'orderCurrentStatus', 'orderTrackingNumber', 'orderDeliveryStatus',
    'orderVendorFeedback', 'orderClientFeedback', 'orderResolution', 'orderDocumentation',
    'orderBooked', 'orderAmountCharged', 'orderQualifiedIncentiveStatus', 'orderQualifiedIncentiveAmount',
    'orderStatus'
  ];

  for (const key of orderKeysToAudit) {
    checkStrDiff(key, (existingOrder as any)[key], (updatedData as any)[key]);
  }

  // ─── Custom Checks for User-Side Values (mapping IDs/codes to Names/Labels) ───
  if (updatedData.orderPaymentGatewayId !== undefined && existingOrder.orderPaymentGatewayId !== updatedData.orderPaymentGatewayId) {
    const oldGatewayName = existingOrder.gateway?.gatewayName || null;
    let newGatewayName = null;
    if (updatedData.orderPaymentGatewayId) {
      const gw = await prisma.crmGateway.findUnique({ where: { gatewayId: updatedData.orderPaymentGatewayId } });
      newGatewayName = gw ? gw.gatewayName : null;
    }
    if ((oldGatewayName || '') !== (newGatewayName || '')) {
      auditEntries.push({ fieldName: 'orderPaymentGatewayId', oldValue: oldGatewayName, newValue: newGatewayName });
    }
  }

  const mapSaleStatus = (status: any) => {
    if (status === '1' || status === 1) return 'Sold';
    if (status === '2' || status === 2) return 'Refunded';
    if (status === '3' || status === 3) return 'Chargebacked';
    if (status === '4' || status === 4) return 'Partial Refund';
    return status ? String(status) : null;
  };

  if (updatedData.saleStatus !== undefined) {
    const oldStatusMapped = mapSaleStatus(existingOrder.saleStatus);
    const newStatusMapped = mapSaleStatus(updatedData.saleStatus);
    if ((oldStatusMapped || '') !== (newStatusMapped || '')) {
      auditEntries.push({ fieldName: 'saleStatus', oldValue: oldStatusMapped, newValue: newStatusMapped });
    }
  }

  checkStrDiff('orderDate', existingOrder.orderDate, updatedData.orderDate, true);

  if (existingOrder.customer) {
    checkStrDiff('customerName', existingOrder.customer.customerName, customerName);
    checkStrDiff('customerPhone', existingOrder.customer.customerPhone, customerPhone);
    checkStrDiff('customerEmail', existingOrder.customer.customerEmail, customerEmail);
    checkStrDiff('customerBillingAddress', existingOrder.customer.customerBillingAddress, customerBillingAddress);
    checkStrDiff('customerShippingAddress', existingOrder.customer.customerShippingAddress, customerShippingAddress);
  }

  const firstCard = existingOrder.customer?.cards?.[0];
  if (firstCard) {
    checkStrDiff('customerNameOncard', firstCard.customerNameOncard, customerNameOncard);
    checkStrDiff('customerCardNumber', firstCard.customerCardNumber, customerCardNumber);
    checkStrDiff('customerCardExpDate', firstCard.customerCardExpDate, customerCardExpDate);
    checkStrDiff('customerCardCvv', firstCard.customerCardCvv, customerCardCvv);
    checkStrDiff('customerCardCopyStatus', firstCard.customerCardCopyStatus, customerCardCopyStatus);
    checkStrDiff('customerCardPhotoStatus', firstCard.customerCardPhotoStatus, customerCardPhotoStatus);
  }

  if (auditEntries.length > 0) {
    await orderRepository.createAuditLogEntries(crmOrderId, auditEntries, changedByUserId, changedByName);
  }

  // ─── Persist the order row ────────────────────────────────────────────────────
  const updatedOrder = await orderRepository.update(crmOrderId, updatedData);

  // ── Sale Status History: write if value actually changed ──────────────────────
  if (data.saleStatus && data.saleStatus !== existingOrder.saleStatus) {
    const saleChangedAt = data.saleStatusChangeDate
      ? new Date(data.saleStatusChangeDate)
      : new Date();

    await orderRepository.createSaleStatusHistoryEntry({
      orderId:       crmOrderId,
      oldValue:      existingOrder.saleStatus ?? null,
      newValue:      data.saleStatus,
      changedById:   changedByUserId,
      changedByName: changedByName,
      changedAt:     saleChangedAt,
    });
  }

  // ── Workflow Status History: write if value actually changed ──────────────────
  if (
    updatedData.orderCurrentStatus &&
    updatedData.orderCurrentStatus !== existingOrder.orderCurrentStatus
  ) {
    await orderRepository.createWorkflowStatusHistoryEntry({
      orderId:       crmOrderId,
      oldValue:      existingOrder.orderCurrentStatus ?? null,
      newValue:      updatedData.orderCurrentStatus,
      changedById:   changedByUserId,
      changedByName: changedByName,
    });
  }

  // ─── Persist customer fields ──────────────────────────────────────────────────
  const customerUpdate: Record<string, unknown> = {};
  if (customerName !== undefined) customerUpdate.customerName = customerName;
  if (customerPhone !== undefined) customerUpdate.customerPhone = customerPhone;
  if (customerEmail !== undefined) customerUpdate.customerEmail = customerEmail;
  if (customerBillingAddress !== undefined) customerUpdate.customerBillingAddress = customerBillingAddress;
  if (customerShippingAddress !== undefined) customerUpdate.customerShippingAddress = customerShippingAddress;

  if (Object.keys(customerUpdate).length > 0 && existingOrder.orderCustomerId) {
    const { prisma } = await import('../lib/db');
    customerUpdate.dateUpdated = new Date();
    await prisma.crmCustomers.update({
      where: { customerId: existingOrder.orderCustomerId },
      data: customerUpdate,
    });
  }

  // ─── Persist card fields (first card only) ───────────────────────────────────
  const cardUpdate: Record<string, unknown> = {};
  if (customerNameOncard !== undefined) cardUpdate.customerNameOncard = customerNameOncard;
  if (customerCardNumber !== undefined) cardUpdate.customerCardNumber = customerCardNumber;
  if (customerCardExpDate !== undefined) cardUpdate.customerCardExpDate = customerCardExpDate;
  if (customerCardCvv !== undefined) cardUpdate.customerCardCvv = customerCardCvv;
  if (customerCardCopyStatus !== undefined) cardUpdate.customerCardCopyStatus = customerCardCopyStatus;
  if (customerCardPhotoStatus !== undefined) cardUpdate.customerCardPhotoStatus = customerCardPhotoStatus;

  if (Object.keys(cardUpdate).length > 0 && existingOrder.customer?.cards?.length) {
    const { prisma } = await import('../lib/db');
    const firstCardId = existingOrder.customer.cards[0].cardId;
    cardUpdate.customerCardUpdated = new Date();
    await prisma.crmCustomerCards.update({
      where: { cardId: firstCardId },
      data: cardUpdate,
    });
  }

  return updatedOrder;
}

export async function deleteOrder(crmOrderId: number) {
  return await orderRepository.remove(crmOrderId);
}
