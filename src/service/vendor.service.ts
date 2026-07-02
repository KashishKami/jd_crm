import * as vendorRepository from '../repository/vendor.repository';
import { VendorWithMetrics, VendorCreateInput, VendorUpdateInput } from '../types/vendor';

const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

function validatePhone(phone: string) {
  if (!PHONE_REGEX.test(phone)) {
    throw new Error('Invalid phone number format');
  }
}

export async function getAllVendors(status?: number, page?: number, limit?: number): Promise<any> {
  const where = status !== undefined ? { vendorStatus: status } : undefined;

  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    const { prisma } = await import('../lib/db');
    const [vendors, total] = await Promise.all([
      prisma.crmVendors.findMany({
        where,
        include: {
          orders: {
            select: {
              crmOrderId: true,
              saleStatus: true,
              orderVendorFeedback: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.crmVendors.count({ where })
    ]);

    const mappedData = vendors.map((vendor) => {
      const validOrders = vendor.orders.filter(
        (order) => order.saleStatus === '1' || order.saleStatus === '2' || order.saleStatus === '3' || order.saleStatus === '4'
      );
      const totalOrders = validOrders.length;
      const negativeOrders = validOrders.filter(
        (order) => order.orderVendorFeedback === 'Negative'
      ).length;
      const positiveOrders = totalOrders - negativeOrders;
      const { orders: _orders, ...vendorData } = vendor;
      return {
        ...vendorData,
        totalOrders,
        positiveOrders,
        negativeOrders,
      };
    });

    return {
      data: mappedData,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  const vendors = await vendorRepository.findAll(status);
  
  return vendors.map((vendor) => {
    // Filter and count orders where saleStatus is in ['1', '2', '3', '4']
    const validOrders = vendor.orders.filter(
      (order) => order.saleStatus === '1' || order.saleStatus === '2' || order.saleStatus === '3' || order.saleStatus === '4'
    );
    const totalOrders = validOrders.length;
    
    const negativeOrders = validOrders.filter(
      (order) => order.orderVendorFeedback === 'Negative'
    ).length;
    
    const positiveOrders = totalOrders - negativeOrders;

    const { orders: _orders, ...vendorData } = vendor;

    return {
      ...vendorData,
      totalOrders,
      positiveOrders,
      negativeOrders,
    };
  });
}

export async function getVendorById(vendorId: number) {
  return vendorRepository.findById(vendorId);
}

export async function createVendor(data: VendorCreateInput) {
  if (data.vendorPhone) {
    validatePhone(data.vendorPhone);
  }
  return vendorRepository.create(data);
}

export async function updateVendor(vendorId: number, data: VendorUpdateInput) {
  if (data.vendorPhone) {
    validatePhone(data.vendorPhone);
  }
  return vendorRepository.update(vendorId, data);
}

export async function toggleVendorStatus(vendorId: number, status: number) {
  if (status !== 0 && status !== 1) {
    throw new Error('Invalid status value');
  }
  return vendorRepository.toggleStatus(vendorId, status);
}

export async function getVendorOrders(vendorId: number, rating?: 'positive' | 'negative') {
  return vendorRepository.findOrdersByVendorId(vendorId, rating);
}

export async function getVendorPerformanceHistory(vendorId: number) {
  return vendorRepository.getPerformanceHistory(vendorId);
}
