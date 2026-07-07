import * as orderRepository from '../repository/order.repository';
import { prisma } from '../lib/db';
import { OrderCreateInput, OrderUpdateInput, OrderFilters } from '../types/order';
import { hasPermission } from './permission.service';

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

  // W-2404: Accept either multi-card array or legacy flat card fields
  const hasCardsArray = Array.isArray(data.cards);
  const hasFlatCard = data.customerNameOncard && data.customerCardNumber && data.customerCardExpDate;

  if (hasCardsArray && data.cards!.length === 0) {
    throw new Error('At least one payment card is required');
  }
  if (!hasCardsArray && !hasFlatCard) {
    throw new Error('Sensitive payment details (name on card, card number, expiry date) are required');
  }

  if (data.parts && data.parts.length > 0) {
    for (const part of data.parts) {
      if (!part.orderPart) {
        throw new Error('Order vehicle part description is required');
      }
      if (part.saleStatus === '4' && !part.orderRefundAmount) {
        throw new Error('Refund amount is required for Partial Refund status');
      }
    }
  } else {
    if (!data.orderPart) {
      throw new Error('Order vehicle part description is required');
    }
    if (data.saleStatus === '4' && !data.orderRefundAmount) {
      throw new Error('Refund amount is required for Partial Refund status');
    }
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
  userPermissions: string | null | undefined = 'super-admin'
) {
  const existingOrder = await orderRepository.findById(crmOrderId);
  if (!existingOrder) {
    throw new Error('Order not found');
  }

  const canViewPhone = hasPermission(userPermissions, 'customers:view-phone');
  const canViewEmail = hasPermission(userPermissions, 'customers:view-email');
  const canViewCards = hasPermission(userPermissions, 'customers:view-cards');

  // ─── Separate customer & card fields from the order-level payload ───────────
  const {
    // Customer fields
    customerName,
    customerPhone,
    customerAlternatePhone1,
    customerAlternatePhone2,
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
    amountToCharge,
    customerCardCopyImage,
    customerPhotoIdImage,
    cards, // New: support list of cards
    // Audit fields
    saleStatusChangeDate,
    // Everything else belongs to the crm_orders row
    ...orderFields
  } = data;

  const updatedData: OrderUpdateInput = { ...orderFields };

  // ─── Sale Status & Refund Auto-Rules (Phase 17) ───
  if (data.saleStatus !== undefined) {
    if (data.saleStatus === '2' || data.saleStatus === '3' || data.saleStatus === '5') {
      const chargedAmount = updatedData.orderAmountCharged !== undefined 
        ? updatedData.orderAmountCharged 
        : (existingOrder.orderAmountCharged ?? '0');
      updatedData.orderRefundAmount = chargedAmount;
      updatedData.orderCurrentStatus = 'Returned Orders';
      updatedData.orderCurrentStatusUpdateDate = new Date();
    } else if (data.saleStatus === '6') {
      updatedData.orderRefundAmount = null;
      updatedData.orderCurrentStatus = 'Cancelled Orders';
      updatedData.orderCurrentStatusUpdateDate = new Date();
    } else if (data.saleStatus === '1') {
      updatedData.orderRefundAmount = null;
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

  // 4.7. Resolve Part Found By nickname snapshot if ID is changed
  if (data.orderPartFoundById !== undefined && data.orderPartFoundById !== existingOrder.orderPartFoundById) {
    if (data.orderPartFoundById === null) {
      updatedData.orderPartFoundById = null;
      updatedData.orderPartFoundByName = null;
    } else {
      const { prisma } = await import('../lib/db');
      const pfb = await prisma.users.findUnique({
        where: { uid: data.orderPartFoundById },
      });
      if (pfb) {
        updatedData.orderPartFoundByName = pfb.nickname || pfb.name;
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
    'orderMakeModel', 'orderPart', 'orderPartSize', 'orderQuotedMilesAndWarranty', 'orderVendorMilesAndWarranty',
    'orderVin', 'orderTotalPitched', 'orderVendorPrice', 'orderVendorName',
    'orderShippingType', 'orderRefundAmount',
    'orderSalesAgentName', 'orderVerifierName',
    'orderSalesVerifierName', 'orderBackendExecutiveName',
    'orderPartFoundById', 'orderPartFoundByName',
    'orderCurrentStatus', 'orderTrackingNumber', 'orderDeliveryStatus',
    'orderVendorFeedback', 'orderClientFeedback', 'orderResolution', 'orderDocumentation',
    'orderBooked', 'orderAmountCharged', 'orderQualifiedIncentiveStatus', 'orderQualifiedIncentiveAmount',
    'orderStatus', 'orderChecklist', 'orderLiftgateNeeded'
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
    if (status === '5' || status === 5) return 'Void';
    if (status === '6' || status === 6) return 'Cancelled';
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
    if (customerPhone !== undefined && customerPhone !== null && !customerPhone.includes('*')) {
      checkStrDiff('customerPhone', existingOrder.customer.customerPhone, customerPhone);
    }
    if (customerAlternatePhone1 !== undefined && customerAlternatePhone1 !== null && (!customerAlternatePhone1 || !customerAlternatePhone1.includes('*'))) {
      checkStrDiff('customerAlternatePhone1', existingOrder.customer.customerAlternatePhone1, customerAlternatePhone1);
    }
    if (customerAlternatePhone2 !== undefined && customerAlternatePhone2 !== null && (!customerAlternatePhone2 || !customerAlternatePhone2.includes('*'))) {
      checkStrDiff('customerAlternatePhone2', existingOrder.customer.customerAlternatePhone2, customerAlternatePhone2);
    }
    if (customerEmail !== undefined && customerEmail !== null && (!customerEmail || !customerEmail.includes('*'))) {
      checkStrDiff('customerEmail', existingOrder.customer.customerEmail, customerEmail);
    }
    checkStrDiff('customerBillingAddress', existingOrder.customer.customerBillingAddress, customerBillingAddress);
    checkStrDiff('customerShippingAddress', existingOrder.customer.customerShippingAddress, customerShippingAddress);
  }

  if (cards !== undefined && Array.isArray(cards)) {
    const existingCards = existingOrder.customer?.cards || [];
    const incomingCardIds = cards.map((c: any) => c.cardId).filter(Boolean);

    // 1. Process updates and additions
    cards.forEach((c: any, index: number) => {
      const label = ` (Card #${index + 1})`;
      
      const checkCardField = (field: string, oldVal: any, newVal: any) => {
        if (newVal === undefined) return;
        const oldStr = oldVal !== null && oldVal !== undefined ? String(oldVal) : null;
        const newStr = newVal !== null && newVal !== undefined ? String(newVal) : null;
        if ((oldStr || '') !== (newStr || '')) {
          auditEntries.push({ fieldName: `${field}${label}`, oldValue: oldStr, newValue: newStr });
        }
      };

      if (c.cardId) {
        const existingCard = existingCards.find(ec => ec.cardId === c.cardId);
        if (existingCard) {
          checkCardField('customerNameOncard', existingCard.customerNameOncard, c.customerNameOncard);
          
          // Card number check: only compare and update if not masked placeholder
          if (c.customerCardNumber !== undefined && !c.customerCardNumber.includes('*')) {
            checkCardField('customerCardNumber', existingCard.customerCardNumber, c.customerCardNumber);
          }
          
          checkCardField('customerCardExpDate', existingCard.customerCardExpDate, c.customerCardExpDate);
          
          // CVV check: only compare and update if not masked placeholder
          if (c.customerCardCvv !== undefined && !c.customerCardCvv.includes('*')) {
            checkCardField('customerCardCvv', existingCard.customerCardCvv, c.customerCardCvv);
          }
          
          checkCardField('customerCardCopyStatus', existingCard.customerCardCopyStatus, c.customerCardCopyStatus);
          checkCardField('customerCardPhotoStatus', existingCard.customerCardPhotoStatus, c.customerCardPhotoStatus);
          checkCardField('amountToCharge', existingCard.amountToCharge, c.amountToCharge);

          // Card image changes: compare and audit if we have permission OR if a new image was uploaded
          if (c.customerCardCopyImage !== undefined) {
            if (canViewCards || c.customerCardCopyImage) {
              if (existingCard.customerCardCopyImage !== c.customerCardCopyImage) {
                const oldImg = existingCard.customerCardCopyImage ? '[Uploaded]' : null;
                const newImg = c.customerCardCopyImage 
                  ? (existingCard.customerCardCopyImage ? '[Changed]' : '[Uploaded]') 
                  : null;
                auditEntries.push({ fieldName: `customerCardCopyImage${label}`, oldValue: oldImg, newValue: newImg });
              }
            }
          }
          if (c.customerPhotoIdImage !== undefined) {
            if (canViewCards || c.customerPhotoIdImage) {
              if (existingCard.customerPhotoIdImage !== c.customerPhotoIdImage) {
                const oldImg = existingCard.customerPhotoIdImage ? '[Uploaded]' : null;
                const newImg = c.customerPhotoIdImage 
                  ? (existingCard.customerPhotoIdImage ? '[Changed]' : '[Uploaded]') 
                  : null;
                auditEntries.push({ fieldName: `customerPhotoIdImage${label}`, oldValue: oldImg, newValue: newImg });
              }
            }
          }
        }
      } else {
        // Newly added card
        checkCardField('customerNameOncard', null, c.customerNameOncard);
        checkCardField('customerCardNumber', null, c.customerCardNumber);
        checkCardField('customerCardExpDate', null, c.customerCardExpDate);
        checkCardField('customerCardCvv', null, c.customerCardCvv);
        checkCardField('customerCardCopyStatus', 'No', c.customerCardCopyStatus || 'No');
        checkCardField('customerCardPhotoStatus', 'No', c.customerCardPhotoStatus || 'No');
        checkCardField('amountToCharge', null, c.amountToCharge);

        if (c.customerCardCopyImage) {
          auditEntries.push({ fieldName: `customerCardCopyImage${label}`, oldValue: null, newValue: '[Uploaded]' });
        }
        if (c.customerPhotoIdImage) {
          auditEntries.push({ fieldName: `customerPhotoIdImage${label}`, oldValue: null, newValue: '[Uploaded]' });
        }
      }
    });

    // 2. Process deletions
    existingCards.forEach((existingCard, index: number) => {
      if (!incomingCardIds.includes(existingCard.cardId)) {
        const label = ` (Card #${index + 1})`;
        const addDeletionEntry = (field: string, oldVal: any) => {
          const oldStr = oldVal !== null && oldVal !== undefined ? String(oldVal) : null;
          auditEntries.push({ fieldName: `${field}${label}`, oldValue: oldStr, newValue: null });
        };

        addDeletionEntry('customerNameOncard', existingCard.customerNameOncard);
        addDeletionEntry('customerCardNumber', existingCard.customerCardNumber);
        addDeletionEntry('addDeletionEntryExpDate', existingCard.customerCardExpDate);
        addDeletionEntry('customerCardCvv', existingCard.customerCardCvv);
        addDeletionEntry('customerCardCopyStatus', existingCard.customerCardCopyStatus);
        addDeletionEntry('customerCardPhotoStatus', existingCard.customerCardPhotoStatus);
        addDeletionEntry('amountToCharge', existingCard.amountToCharge);

        if (existingCard.customerCardCopyImage) {
          auditEntries.push({ fieldName: `customerCardCopyImage${label}`, oldValue: '[Uploaded]', newValue: null });
        }
        if (existingCard.customerPhotoIdImage) {
          auditEntries.push({ fieldName: `customerPhotoIdImage${label}`, oldValue: '[Uploaded]', newValue: null });
        }
      }
    });
  } else {
    // Legacy fallback
    const firstCard = existingOrder.customer?.cards?.[0];
    checkStrDiff('customerNameOncard', firstCard?.customerNameOncard ?? null, customerNameOncard);
    if (customerCardNumber !== undefined && customerCardNumber !== null && !customerCardNumber.includes('*')) {
      checkStrDiff('customerCardNumber', firstCard?.customerCardNumber ?? null, customerCardNumber);
    }
    checkStrDiff('customerCardExpDate', firstCard?.customerCardExpDate ?? null, customerCardExpDate);
    if (customerCardCvv !== undefined && customerCardCvv !== null && !customerCardCvv.includes('*')) {
      checkStrDiff('customerCardCvv', firstCard?.customerCardCvv ?? null, customerCardCvv);
    }
    checkStrDiff('customerCardCopyStatus', firstCard?.customerCardCopyStatus ?? 'No', customerCardCopyStatus);
    checkStrDiff('customerCardPhotoStatus', firstCard?.customerCardPhotoStatus ?? 'No', customerCardPhotoStatus);
    checkStrDiff('amountToCharge', firstCard?.amountToCharge ?? null, amountToCharge);

    if (customerCardCopyImage !== undefined) {
      if (canViewCards || customerCardCopyImage) {
        if (firstCard?.customerCardCopyImage !== customerCardCopyImage) {
          const oldImg = firstCard?.customerCardCopyImage ? '[Uploaded]' : null;
          const newImg = customerCardCopyImage 
            ? (firstCard?.customerCardCopyImage ? '[Changed]' : '[Uploaded]') 
            : null;
          auditEntries.push({ fieldName: 'customerCardCopyImage', oldValue: oldImg, newValue: newImg });
        }
      }
    }
    if (customerPhotoIdImage !== undefined) {
      if (canViewCards || customerPhotoIdImage) {
        if (firstCard?.customerPhotoIdImage !== customerPhotoIdImage) {
          const oldImg = firstCard?.customerPhotoIdImage ? '[Uploaded]' : null;
          const newImg = customerPhotoIdImage 
            ? (firstCard?.customerPhotoIdImage ? '[Changed]' : '[Uploaded]') 
            : null;
          auditEntries.push({ fieldName: 'customerPhotoIdImage', oldValue: oldImg, newValue: newImg });
        }
      }
    }
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
  if (customerPhone !== undefined && (!customerPhone || !customerPhone.includes('*'))) customerUpdate.customerPhone = customerPhone;
  if (customerAlternatePhone1 !== undefined && (!customerAlternatePhone1 || !customerAlternatePhone1.includes('*'))) customerUpdate.customerAlternatePhone1 = customerAlternatePhone1;
  if (customerAlternatePhone2 !== undefined && (!customerAlternatePhone2 || !customerAlternatePhone2.includes('*'))) customerUpdate.customerAlternatePhone2 = customerAlternatePhone2;
  if (customerEmail !== undefined && (!customerEmail || !customerEmail.includes('*'))) customerUpdate.customerEmail = customerEmail;
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

  // ─── Persist card fields ───────────────────────────────────
  if (cards !== undefined && Array.isArray(cards)) {
    const { prisma } = await import('../lib/db');
    if (existingOrder.orderCustomerId) {
      // 1. Delete cards that are no longer in the list
      const incomingCardIds = cards.map((c: any) => c.cardId).filter(Boolean);
      const existingCardIds = existingOrder.customer?.cards.map((c: any) => c.cardId) || [];
      const cardIdsToDelete = existingCardIds.filter(id => !incomingCardIds.includes(id));
      if (cardIdsToDelete.length > 0) {
        await prisma.crmCustomerCards.deleteMany({
          where: { cardId: { in: cardIdsToDelete } }
        });
      }

      // 2. Update existing cards and create new ones
      for (const c of cards) {
        const cardData = {
          customerNameOncard: c.customerNameOncard,
          customerCardExpDate: c.customerCardExpDate,
          customerCardCopyStatus: c.customerCardCopyStatus || 'No',
          customerCardPhotoStatus: c.customerCardPhotoStatus || 'No',
          amountToCharge: c.amountToCharge || null,
          customerCardUpdated: new Date()
        } as Record<string, any>;

        if (c.customerCardNumber && !c.customerCardNumber.includes('*')) cardData.customerCardNumber = c.customerCardNumber;
        if (c.customerCardCvv && !c.customerCardCvv.includes('*')) cardData.customerCardCvv = c.customerCardCvv;

        if (c.cardId) {
          const existingCard = existingOrder.customer?.cards.find(ec => ec.cardId === c.cardId);
          
          // Only update images if truthy (meaning a new file was uploaded), keeping original otherwise
          if (canViewCards) {
            cardData.customerCardCopyImage = c.customerCardCopyImage || null;
            cardData.customerPhotoIdImage = c.customerPhotoIdImage || null;
          } else {
            if (c.customerCardCopyImage) {
              cardData.customerCardCopyImage = c.customerCardCopyImage;
            } else if (existingCard) {
              cardData.customerCardCopyImage = existingCard.customerCardCopyImage;
            }
            
            if (c.customerPhotoIdImage) {
              cardData.customerPhotoIdImage = c.customerPhotoIdImage;
            } else if (existingCard) {
              cardData.customerPhotoIdImage = existingCard.customerPhotoIdImage;
            }
          }

          await prisma.crmCustomerCards.update({
            where: { cardId: c.cardId },
            data: cardData,
          });
        } else {
          // New card copy/photo ID
          cardData.customerCardCopyImage = c.customerCardCopyImage || null;
          cardData.customerPhotoIdImage = c.customerPhotoIdImage || null;

          await prisma.crmCustomerCards.create({
            data: {
              ...cardData,
              cardCustomerId: existingOrder.orderCustomerId,
              customerCardCreatedAt: new Date(),
            } as any,
          });
        }
      }
    }
  } else {
    // Legacy fallback (first card only)
    const cardUpdate: Record<string, any> = {};
    if (customerNameOncard !== undefined) cardUpdate.customerNameOncard = customerNameOncard;
    if (customerCardNumber !== undefined && customerCardNumber !== null && !customerCardNumber.includes('*')) cardUpdate.customerCardNumber = customerCardNumber;
    if (customerCardExpDate !== undefined) cardUpdate.customerCardExpDate = customerCardExpDate;
    if (customerCardCvv !== undefined && customerCardCvv !== null && !customerCardCvv.includes('*')) cardUpdate.customerCardCvv = customerCardCvv;
    if (customerCardCopyStatus !== undefined) cardUpdate.customerCardCopyStatus = customerCardCopyStatus;
    if (customerCardPhotoStatus !== undefined) cardUpdate.customerCardPhotoStatus = customerCardPhotoStatus;
    if (amountToCharge !== undefined) cardUpdate.amountToCharge = amountToCharge;
    
    const { prisma } = await import('../lib/db');
    const firstCard = existingOrder.customer?.cards?.[0];

    if (firstCard) {
      if (canViewCards) {
        cardUpdate.customerCardCopyImage = customerCardCopyImage !== undefined ? customerCardCopyImage : firstCard.customerCardCopyImage;
        cardUpdate.customerPhotoIdImage = customerPhotoIdImage !== undefined ? customerPhotoIdImage : firstCard.customerPhotoIdImage;
      } else {
        if (customerCardCopyImage) {
          cardUpdate.customerCardCopyImage = customerCardCopyImage;
        } else {
          cardUpdate.customerCardCopyImage = firstCard.customerCardCopyImage;
        }
        if (customerPhotoIdImage) {
          cardUpdate.customerPhotoIdImage = customerPhotoIdImage;
        } else {
          cardUpdate.customerPhotoIdImage = firstCard.customerPhotoIdImage;
        }
      }

      if (Object.keys(cardUpdate).length > 0) {
        cardUpdate.customerCardUpdated = new Date();
        await prisma.crmCustomerCards.update({
          where: { cardId: firstCard.cardId },
          data: cardUpdate,
        });
      }
    }
  }

  return updatedOrder;
}

export async function deleteOrder(crmOrderId: number) {
  const childCount = await orderRepository.countChildren(crmOrderId);
  if (childCount > 0) {
    throw new Error('Please remove all child parts before deleting the primary order.');
  }
  return await orderRepository.remove(crmOrderId);
}

export async function addPart(
  parentOrderId: number,
  partData: any,
  actingUser?: { uid: number; name: string; nickname?: string | null }
) {
  if (!partData.orderPart) {
    throw new Error('Order vehicle part description is required');
  }
  const newPart = await orderRepository.addPartToExistingOrder(parentOrderId, partData);

  if (actingUser) {
    await orderRepository.createAuditLogEntries(
      parentOrderId,
      [{
        fieldName: 'childPart',
        oldValue: null,
        newValue: `Added ${newPart.orderPart}`,
      }],
      actingUser.uid,
      actingUser.nickname || actingUser.name
    );
  }
  return newPart;
}

export async function removePart(
  parentOrderId: number,
  childOrderId: number,
  actingUser?: { uid: number; name: string; nickname?: string | null }
) {
  const child = await prisma.crmOrders.findUnique({
    where: { crmOrderId: childOrderId },
    select: { orderPart: true },
  });
  if (!child) {
    throw new Error(`Child order ${childOrderId} not found`);
  }

  await orderRepository.removeChildPart(parentOrderId, childOrderId);

  if (actingUser) {
    await orderRepository.createAuditLogEntries(
      parentOrderId,
      [{
        fieldName: 'childPart',
        oldValue: `Removed ${child.orderPart}`,
        newValue: null,
      }],
      actingUser.uid,
      actingUser.nickname || actingUser.name
    );
  }
}

export async function promotePrimary(
  currentParentId: number,
  newPrimaryPartId: number,
  actingUser?: { uid: number; name: string; nickname?: string | null }
) {
  const [parent, child] = await Promise.all([
    prisma.crmOrders.findUnique({ where: { crmOrderId: currentParentId }, select: { orderPart: true } }),
    prisma.crmOrders.findUnique({ where: { crmOrderId: newPrimaryPartId }, select: { orderPart: true } }),
  ]);
  if (!parent || !child) {
    throw new Error('Order not found');
  }

  await orderRepository.promotePrimaryPart(currentParentId, newPrimaryPartId);

  if (actingUser) {
    const uId = actingUser.uid;
    const uName = actingUser.nickname || actingUser.name;
    
    await orderRepository.createAuditLogEntries(
      currentParentId,
      [{
        fieldName: 'primaryPart',
        oldValue: `Primary Part: ${parent.orderPart}`,
        newValue: `Demoted to child. New Primary Part: ${child.orderPart}`,
      }],
      uId,
      uName
    );
    await orderRepository.createAuditLogEntries(
      newPrimaryPartId,
      [{
        fieldName: 'primaryPart',
        oldValue: `Child Part: ${child.orderPart}`,
        newValue: `Promoted to primary root part`,
      }],
      uId,
      uName
    );
  }
}
