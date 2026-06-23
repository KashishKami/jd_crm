export interface Vendor {
  vendorId: number;
  vendorName: string;
  vendorPhone: string;
  vendorFax?: string | null;
  vendorEmail?: string | null;
  vendorContactPerson: string;
  vendorRemark?: string | null;
  vendorStatus: number;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface VendorWithMetrics extends Vendor {
  totalOrders: number;
  positiveOrders: number;
  negativeOrders: number;
}

export interface VendorCreateInput {
  vendorName: string;
  vendorPhone: string;
  vendorFax?: string | null;
  vendorEmail?: string | null;
  vendorContactPerson: string;
  vendorRemark?: string | null;
  vendorStatus?: number;
}

export interface VendorUpdateInput {
  vendorName?: string;
  vendorPhone?: string;
  vendorFax?: string | null;
  vendorEmail?: string | null;
  vendorContactPerson?: string;
  vendorRemark?: string | null;
  vendorStatus?: number;
}
