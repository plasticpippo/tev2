import { Request } from 'express';
import { Table as PrismaTable } from '@prisma/client';
import { SharedLayout, VariantLayout } from '@prisma/client';

// Extend Express Request interface to include user, table, and layout properties
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
      table?: PrismaTable;
      layout?: VariantLayout | SharedLayout;
    }
  }
}

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
 visibleTillIds: number[] | null;  // Made nullable to match frontend types
}

export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: 'Admin' | 'Cashier';
}

export interface Tab {
  id: number;
  name:string;
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
  discount: number;
  discountReason?: string;
  status: 'completed' | 'complimentary';
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

export interface VariantLayoutPosition {
  variantId: number;
  gridColumn: number;
  gridRow: number;
}

export interface SharedLayoutData {
  id?: number;
  name: string;
  categoryId: number;
  positions: VariantLayoutPosition[];
}

// Table and Room interfaces for table management
export interface Room {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tables: Table[];
}

export interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'available' | 'occupied' | 'reserved' | 'unavailable';
  roomId: string;
  items?: any[]; // Added for storing order items directly on tables
  createdAt: string;
  updatedAt: string;
  room: Room;
  tabs: any[]; // Can be refined later based on actual tab type
}