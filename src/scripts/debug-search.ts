import * as searchRepository from '../repository/search.repository';

async function main() {
  const query = 'Alan';
  const customers = await searchRepository.searchCustomers(query);
  const orders = await searchRepository.searchOrders(query);
  console.log('--- CUSTOMERS MATCHED ---');
  console.log(customers.map(c => ({ id: c.customerId, name: `${c.firstName} ${c.lastName}`, email: c.customerEmail, phone: c.customerPhone, billing: c.customerBillingAddress })));
  console.log('--- ORDERS MATCHED ---');
  console.log(orders.map(o => ({ id: o.crmOrderId, customerName: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'none' })));
}

main().catch(console.error);
