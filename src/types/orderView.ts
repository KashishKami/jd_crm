export interface OrderViewEntry {
  id: number;
  orderId: number;
  viewerId: number;
  viewerName: string;
  viewedAt: string; // ISO string from API
}
