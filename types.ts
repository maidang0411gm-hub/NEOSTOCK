export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  variant?: string;
  quantity: number;
  minStock: number;
  recommendedStock: number;
  price: number;
  costPrice?: number;
  imageUrl?: string;
  lastUpdated: string;
  sortOrder: number;
  isHeader?: boolean;
  note?: string;
  userId: string;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  type: 'in' | 'out';
  quantity: number;
  timestamp: string;
  note?: string;
  userId: string;
  orderNumber?: string;
  orderSource?: 'direct' | 'online';
  shippingCode?: string;
  productSku?: string;
  price?: number;
  totalPrice?: number;
  paymentMethod?: 'cash' | 'transfer';
  batchId?: string;
  batchName?: string;
}
