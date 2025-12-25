export interface OrderItem {
  id: string; 
  variantId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  effectiveTaxRate: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string; 
  price: number;
  isFavourite?: boolean;
  stockConsumption: {
    stockItemId: string;
    quantity: number;
  }[];
  backgroundColor: string;
  textColor: string; 
}

export interface Product {
  id: number;
  name: string; 
  categoryId: number;
  variants: ProductVariant[];
}

export interface Category {
  id: number;
  name: string;
 visibleTillIds: number[];
}

export interface User {
  id: number;
  name: string;
  username: string;
  password_HACK: string;
  role: 'Admin' | 'Cashier';
}

export interface Tab {
  id: number;
  name: string;
  items: OrderItem[];
  createdAt: string;
  tillId: number;
  tillName: string;
}

export interface Transaction {
  id: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: string;
  userId: number;
  userName: string;
  tillId: number;
  tillName: string;
  createdAt: string;
}

export interface TaxSettings {
  mode: 'inclusive' | 'exclusive' | 'none';
}

export interface Settings {
  tax: TaxSettings;
  businessDay: {
    autoStartTime: string; // e.g., "06:00"
    lastManualClose: string | null; // ISO string
 };
}

export interface Till {
  id: number;
  name: string;
}

export interface PurchasingUnit {
  id: string;
  name: string; 
  multiplier: number; 
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  type: 'Ingredient' | 'Sellable Good';
  baseUnit: string;
  purchasingUnits: PurchasingUnit[];
}

export interface StockAdjustment {
  id: number;
  stockItemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  userId: number;
  userName: string;
  createdAt: string;
}

export interface DailyClosing {
  id: number;
  createdAt: string;
  closedAt: string;
  summary: {
    transactions: number;
    totalSales: number;
    totalTax: number;
    totalTips: number;
    paymentMethods: Record<string, { count: number; total: number }>;
    tills: Record<string, { transactions: number; total: number }>;
  };
 userId: number;
  userName: string;
}

export interface OrderActivityLog {
  id: number;
  action: 'Item Removed' | 'Order Cleared';
  details: string | OrderItem[];
  userId: number;
  userName: string;
  createdAt: string;
}

export interface OrderSession {
  id: string;
  userId: number;
  items: OrderItem[];
  status: 'active' | 'pending_logout' | 'completed';
  createdAt: string;
  updatedAt: string;
  logoutTime: string | null;
}

// Define filter type for layout customization
export type FilterType = 'all' | 'favorites' | 'category';

export interface ProductGridLayout {
  columns: number;
  gridItems: {
    id: string;
    variantId: number;
    productId: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  version: string;
}

export interface ProductGridLayoutData {
  id?: string | number;
 name: string;
 tillId: number;
  layout: ProductGridLayout;
  isDefault: boolean;
  filterType?: FilterType;
  categoryId?: number | null;
}