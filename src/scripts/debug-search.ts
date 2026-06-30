import * as searchRepository from '../repository/search.repository';

async function main() {
  const query = 'Alan';
  const customers = await searchRepository.searchCustomers(query);
  const orders = await searchRepository.searchOrders(query);
  console.log('--- CUSTOMERS MATCHED ---');
  console.log(customers.map(c => ({ id: c.customerId, name: c.customerName, email: c.customerEmail, phone: c.customerPhone, billing: c.customerBillingAddress })));
  console.log('--- ORDERS MATCHED ---');
  console.log(orders.map(o => ({ id: o.crmOrderId, customerName: o.customer ? o.customer.customerName : 'none' })));
}

main().catch(console.error);
