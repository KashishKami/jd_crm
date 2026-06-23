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
