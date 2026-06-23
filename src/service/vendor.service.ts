import * as vendorRepository from '../repository/vendor.repository';
import { VendorWithMetrics, VendorCreateInput, VendorUpdateInput } from '../types/vendor';

const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

function validatePhone(phone: string) {
  if (!PHONE_REGEX.test(phone)) {
    throw new Error('Invalid phone number format');
  }
}

export async function getAllVendors(status?: number): Promise<VendorWithMetrics[]> {
  const vendors = await vendorRepository.findAll(status);
  
  return vendors.map((vendor) => {
    // Filter and count orders where saleStatus is in ['1', '7', '8']
    const validOrders = vendor.orders.filter(
      (order) => order.saleStatus === '1' || order.saleStatus === '7' || order.saleStatus === '8'
    );
    const totalOrders = validOrders.length;
    
    const negativeOrders = validOrders.filter(
      (order) => order.orderVendorFeedback === 'Negative'
    ).length;
    
    const positiveOrders = totalOrders - negativeOrders;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { orders, ...vendorData } = vendor;

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

export async function getVendorOrders(vendorId: number) {
  return vendorRepository.findOrdersByVendorId(vendorId);
}
