import * as orderRepository from '../repository/order.repository';
import { OrderCreateInput, OrderUpdateInput, OrderFilters } from '../types/order';

export async function createOrder(data: OrderCreateInput) {
  // Input validations
  if (!data.firstName || !data.lastName) {
    throw new Error('Customer first name and last name are required');
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

  const updatedData: OrderUpdateInput = { ...data };

  // Calculate markup if pricing fields are updated
  if (data.orderTotalPitched !== undefined || data.orderVendorPrice !== undefined) {
    const totalPitched = parseFloat(data.orderTotalPitched ?? existingOrder.orderTotalPitched ?? '0');
    const vendorPrice = parseFloat(data.orderVendorPrice ?? existingOrder.orderVendorPrice ?? '0');
    updatedData.orderMarkup = (totalPitched - vendorPrice).toString();
  }

  // State machine logic
  // 1. If vendor is set/updated and status is Pending Booking, transition to Pending Shipment
  if (data.orderVendorId && !existingOrder.orderVendorId && existingOrder.orderCurrentStatus === 'Pending Booking') {
    updatedData.orderCurrentStatus = 'Pending Shipment';
    updatedData.orderCurrentStatusUpdateDate = new Date();
  }

  // 2. If tracking number is set/updated and order is not already in a later status
  if (data.orderTrackingNumber && !existingOrder.orderTrackingNumber) {
    updatedData.orderCurrentStatus = 'Pending Delivery';
    updatedData.orderCurrentStatusUpdateDate = new Date();
  }

  // 3. If delivery status is confirmed, transition to Pending Feedback
  if (data.orderDeliveryStatus && data.orderDeliveryStatus.toLowerCase().includes('delivered')) {
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

  return await orderRepository.update(crmOrderId, updatedData);
}

export async function deleteOrder(crmOrderId: number) {
  return await orderRepository.remove(crmOrderId);
}
