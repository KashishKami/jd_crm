import * as orderRepository from '../repository/order.repository';
import { OrderCreateInput, OrderUpdateInput, OrderFilters } from '../types/order';

export async function createOrder(data: OrderCreateInput) {
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

  return await orderRepository.createWithCustomerAndCard(data);
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

export async function updateOrder(crmOrderId: number, data: OrderUpdateInput) {
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

  // ─── Persist the order row ────────────────────────────────────────────────────
  const updatedOrder = await orderRepository.update(crmOrderId, updatedData);

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
