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

// ============================================================================
// SHARED TYPES - Re-exported for backward compatibility
// Canonical source: shared/types.ts (copied into src/ at build time)
// ============================================================================
import type {
  ThemeColor as SharedThemeColor,
  Product,
  Category,
  Till,
  PurchasingUnit,
  StockItem,
  StockAdjustment,
  OrderActivityLog,
  Room,
  DailyClosing,
} from './shared-types';

export type {
  Product,
  Category,
  Till,
  PurchasingUnit,
  StockItem,
  StockAdjustment,
  OrderActivityLog,
  Room,
  DailyClosing,
  SharedThemeColor as ThemeColor,
};

// ============================================================================
// BACKEND-SPECIFIC TYPES
// ============================================================================

/**
 * Backend OrderItem extends shared OrderItem with additional tax rate information
 * and includes productId and variantId which are used internally
 */
export interface OrderItem {
  id: string;
  variantId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  effectiveTaxRate: number;
  taxRateId?: number | null;
  taxRateName: string;
  taxRatePercent: number;
}

/**
 * Backend ProductVariant
 * Backend version does not include taxRateId and taxRate fields from shared
 * ThemeColor matches the full shared ThemeColor type (24 colors) to match Prisma schema
 */
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
  themeColor: SharedThemeColor;
}

/**
 * Backend User extends shared User with password field
 * Password should only be used internally, never exposed in API responses
 */
export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  role: 'Admin' | 'Cashier';
}

/**
 * Backend Tab
 * Backend version does not include tableId field
 */
export interface Tab {
  id: number;
  name: string;
  items: OrderItem[];
  createdAt: string;
  tillId: number;
  tillName: string;
}

/**
 * Backend Transaction
 * Backend version does not include tableId, tableName, or receipt fields
 */
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

/**
 * Backend TaxRate
 * Backend-specific representation with ratePercent (string) and isActive (boolean)
 */
export interface TaxRate {
  id: number;
  name: string;
  rate: number;
  ratePercent: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend TaxSettings
 * Backend makes defaultTaxRateId and defaultTaxRate required
 */
export interface TaxSettings {
  mode: 'inclusive' | 'exclusive' | 'none';
  defaultTaxRateId: number | null;
  defaultTaxRate: TaxRate | null;
}

/**
 * BusinessSettings - extracted from Settings for backend use
 */
export interface BusinessSettings {
  name: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  vatNumber: string | null;
  logoPath?: string | null;
  legalText?: string | null;
}

/**
 * ReceiptConfig - extracted from Settings for backend use
 */
export interface ReceiptConfig {
  prefix: string;
  numberLength: number;
  startNumber: number;
  sequenceYear: boolean;
  currentYear: number | null;
  currentNumber: number;
}

/**
 * EmailConfig - extracted from Settings for backend use
 */
export interface EmailConfig {
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpPassword: string | null;
  fromAddress: string | null;
  fromName: string | null;
  smtpSecure: boolean;
  enabled: boolean;
  autoEmailReceipts: boolean;
}

/**
 * Backend Settings
 * Backend extracts sub-objects into their own interfaces and makes them required
 */
export interface Settings {
  tax: TaxSettings;
  businessDay: {
    autoStartTime: string;
    businessDayEndHour: string;
    lastManualClose: string | null;
    autoCloseEnabled: boolean;
  };
  business: BusinessSettings;
  receipt: ReceiptConfig;
  email: EmailConfig;
  receiptFromPaymentModal: {
    allowReceiptFromPaymentModal: boolean;
    receiptIssueDefaultSelected: boolean;
    receiptIssueMode: 'immediate' | 'draft';
  };
}

/**
 * Backend Table - matches shared Table status including 'bill_requested'
 */
export interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'available' | 'occupied' | 'bill_requested' | 'reserved' | 'unavailable';
  roomId: string;
  items?: any[];
  createdAt: string;
  updatedAt: string;
  room: Room;
  tabs: any[];
}

// Backend-only types

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

export interface ProcessPaymentRequest {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  paymentMethod: string;
  userId: number;
  userName: string;
  tillId: number;
  tillName: string;
  discount: number;
  discountReason?: string;
  activeTabId?: number;
  tableId?: string;
  tableName?: string;
  idempotencyKey?: string;
  issueReceipt?: boolean;
}

export interface ProcessPaymentResponse {
  transaction: {
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
    status: string;
    createdAt: string;
  };
  receipt?: {
    id: number;
    number?: string;
    status: string;
    pdfUrl?: string;
  };
}
