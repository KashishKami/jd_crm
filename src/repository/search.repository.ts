import { prisma } from '../lib/db';

export async function searchOrders(query: string) {
  const orConditions: any[] = [];

  // Exact Order ID match if query contains digits
  const numericQuery = query.trim().replace(/[^0-9]/g, '');
  if (numericQuery !== '' && /^\d+$/.test(numericQuery)) {
    orConditions.push({ crmOrderId: parseInt(numericQuery, 10) });
  }

  // Match by linked customer fields: Name, Phone, Email
  const customerOr: any[] = [
    { customerName: { contains: query } },
    { customerEmail: { contains: query } },
    { customerPhone: { contains: query } }
  ];

  // Only match zipcode/addresses if the query contains digits (like a zipcode)
  if (/\d+/.test(query)) {
    customerOr.push({ customerBillingAddress: { contains: query } });
    customerOr.push({ customerShippingAddress: { contains: query } });
  }

  orConditions.push({
    customer: {
      OR: customerOr
    }
  });

  return await prisma.crmOrders.findMany({
    where: {
      OR: orConditions
    },
    include: {
      customer: true
    }
  });
}

export async function searchCustomers(query: string) {
  const orConditions: any[] = [
    { customerName: { contains: query } },
    { customerEmail: { contains: query } },
    { customerPhone: { contains: query } }
  ];

  // Only match zipcode/addresses if the query contains digits (like a zipcode)
  if (/\d+/.test(query)) {
    orConditions.push({ customerBillingAddress: { contains: query } });
    orConditions.push({ customerShippingAddress: { contains: query } });
  }

  // If query is an order ID, include customers who placed that order
  const numericQuery = query.trim().replace(/[^0-9]/g, '');
  if (numericQuery !== '' && /^\d+$/.test(numericQuery)) {
    orConditions.push({
      orders: {
        some: {
          crmOrderId: parseInt(numericQuery, 10)
        }
      }
    });
  }

  return await prisma.crmCustomers.findMany({
    where: {
      OR: orConditions
    }
  });
}
