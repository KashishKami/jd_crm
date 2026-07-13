import React from 'react';
import CustomerList from '../../components/CustomerList';
import * as customerRepository from '../../repository/customer.repository';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Customer Directory - JD CRM',
  description: 'View customers and manage cards',
};

export default async function CustomersPage() {
  const customers = await customerRepository.findAll();
  return <CustomerList initialCustomers={customers} />;
}
