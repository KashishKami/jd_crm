export interface Vendor {
  vendorId: number;
  vendorName: string;
  vendorPhone: string;
  vendorAlternatePhone1?: string | null;
  vendorAlternatePhone2?: string | null;
  vendorFax?: string | null;
  vendorEmail?: string | null;
  vendorContactPerson: string;
  vendorRemark?: string | null;
  vendorStatus: number;
  vendorCountry?: string | null;
  vendorState?: string | null;
  vendorPaymentMode?: string | null;
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
  vendorAlternatePhone1?: string | null;
  vendorAlternatePhone2?: string | null;
  vendorFax?: string | null;
  vendorEmail?: string | null;
  vendorContactPerson: string;
  vendorRemark?: string | null;
  vendorStatus?: number;
  vendorCountry?: string | null;
  vendorState?: string | null;
  vendorPaymentMode?: string | null;
}

export interface VendorUpdateInput {
  vendorName?: string;
  vendorPhone?: string;
  vendorAlternatePhone1?: string | null;
  vendorAlternatePhone2?: string | null;
  vendorFax?: string | null;
  vendorEmail?: string | null;
  vendorContactPerson?: string;
  vendorRemark?: string | null;
  vendorStatus?: number;
  vendorCountry?: string | null;
  vendorState?: string | null;
  vendorPaymentMode?: string | null;
}

