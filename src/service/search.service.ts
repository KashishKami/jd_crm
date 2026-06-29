import * as searchRepository from '../repository/search.repository';
import { prisma } from '../lib/db';

export async function search(query: string) {
  if (!query) {
    return { orders: [], customers: [] };
  }

  const [orders, customers] = await Promise.all([
    searchRepository.searchOrders(query),
    searchRepository.searchCustomers(query),
  ]);

  // Merge and deduplicate
  const uniqueCustomers = Array.from(
    new Map(customers.map((c) => [c.customerId, c])).values()
  );

  const uniqueOrders = Array.from(
    new Map(orders.map((o) => [o.crmOrderId, o])).values()
  );

  // Attach latest crmOrderId to customers so clicking customer goes to their order details
  const customersWithOrder = await Promise.all(
    uniqueCustomers.map(async (customer) => {
      const latestOrder = await prisma.crmOrders.findFirst({
        where: { orderCustomerId: customer.customerId },
        orderBy: { orderCreatedDate: 'desc' },
        select: { crmOrderId: true }
      });
      return {
        ...customer,
        crmOrderId: latestOrder?.crmOrderId || null
      };
    })
  );

  return {
    orders: uniqueOrders,
    customers: customersWithOrder,
  };
}
