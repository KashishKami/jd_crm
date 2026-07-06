import * as customerRepository from '../repository/customer.repository';
import { Prisma } from '@prisma/client';

export async function getCustomers() {
  return customerRepository.findAll();
}

export async function getCustomerById(customerId: number) {
  return customerRepository.findById(customerId);
}

export async function createCustomer(data: Prisma.CrmCustomersCreateInput) {
  return customerRepository.create(data);
}

export async function updateCustomer(customerId: number, data: Prisma.CrmCustomersUpdateInput) {
  return customerRepository.update(customerId, data);
}

/**
 * Fetch cards for a customer, conditionally masking sensitive card number and CVV.
 * Masked format: **** **** **** 1234 (replaces everything except last 4 digits)
 * Masked CVV: ***
 * Note: Base64 image fields are never returned by this function (excluded at DB query level).
 */
export async function getCards(customerId: number, maskSensitive: boolean) {
  const cards = await customerRepository.findCardsByCustomerId(customerId);
  if (!maskSensitive) {
    return cards;
  }

  return cards.map((card) => {
    const cardNumber = card.customerCardNumber || '';
    const last4 = cardNumber.slice(-4);
    const maskedCardNumber = `**** **** **** ${last4}`;
    
    return {
      ...card,
      customerCardNumber: maskedCardNumber,
      customerCardCvv: '***',
    };
  });
}

/**
 * Fetch a single card WITH full Base64 image fields.
 * Should only be called from a permission-guarded single-record endpoint.
 */
export async function getCardById(cardId: number) {
  return customerRepository.findCardById(cardId);
}

