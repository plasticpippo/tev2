export interface OrderItem {
  id: string; 
  variantId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  effectiveTaxRate: number;
}

export interface TaxRate {
  id: number;
  name: string;
  rate: number; // Decimal value (0-1), e.g., 0.19 for 19%
  description?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input types for CRUD operations
export interface CreateTaxRateInput {
  name: string;
  rate: number;
  description?: string;
}

export interface UpdateTaxRateInput {
  name?: string;
  rate?: number;
  description?: string | null;
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
  taxRateId?: number | null;
  taxRate?: TaxRate | null;
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
  visibleTillIds: number[] | null;
}

export interface User {
  id: number;
  name: string;
  username: string;
  password_HACK: string;
  role: 'Admin' | 'Cashier';
}

export interface TransactionReceiptInfo {
  id: number;
  receiptNumber: string;
  status: string;
  issuedAt: string | null;
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
  tableId?: string;
  tableName?: string;
  discount: number;
  discountReason?: string;
  status: 'completed' | 'complimentary';
  createdAt: string;
  receipt?: TransactionReceiptInfo | null;
}

export interface TaxSettings {
  mode: 'inclusive' | 'exclusive' | 'none';
  defaultTaxRateId?: number | null;
  defaultTaxRate?: TaxRate | null;
}

export interface Settings {
  tax: TaxSettings;
  businessDay: {
    autoStartTime: string; // e.g., "06:00"
    businessDayEndHour: string; // e.g., "04:00" - when business day ends (for overnight business days)
    lastManualClose: string | null; // ISO string
    autoCloseEnabled: boolean; // Enable automatic business day closing
  };
  business?: {
    name: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
  };
  receipt?: {
    prefix: string;
    numberLength: number;
    startNumber: number;
    sequenceYear: boolean;
    currentYear: number | null;
    currentNumber: number;
  };
  email?: {
    smtpHost: string | null;
    smtpPort: number;
    smtpUser: string | null;
    smtpPassword: string | null;
    fromAddress: string | null;
    fromName: string | null;
    smtpSecure: boolean;
    enabled: boolean;
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

export interface OrderActivityLog {
    id: number;
    action: 'Item Removed' | 'Order Cleared';
    details: string | OrderItem[];
    userId: number;
    userName: string;
    createdAt: string;
}

export interface Room {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    tables: Table[];
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

export interface Table {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    status: 'available' | 'occupied' | 'bill_requested' | 'reserved' | 'unavailable';
    roomId: string;
    items?: any[]; // Added for storing order items directly on tables
    createdAt: string;
    updatedAt: string;
    room: Room;
    tabs: any[]; // Can be refined later based on actual tab type
}

export interface Tab {
    id: number;
    name: string;
    items: OrderItem[];
    createdAt: string;
    tillId: number;
    tillName: string;
    tableId?: string;
}

export interface ConsumptionReportItem {
    id: string;
    productId: number;
    productName: string;
    variantId: number;
    variantName: string;
    categoryId: number;
    categoryName: string;
    stockItemId: string;
    stockItemName: string;
    stockItemType: string;
    quantityConsumed: number;
    transactionDate: string;
}

export interface ConsumptionReportTotal {
    stockItemId: string;
    stockItemName: string;
    stockItemType: string;
    totalQuantity: number;
}

export interface ConsumptionReportResponse {
  details: ConsumptionReportItem[];
  totals: ConsumptionReportTotal[];
}

// ============================================================================
// RECEIPT INVOICING TYPES
// ============================================================================

export type ReceiptStatus = 'draft' | 'issued' | 'voided' | 'emailed';
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    name: string;
  };
}

export interface CreateCustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  vatNumber?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface TaxBreakdownItem {
  rateName: string;
  ratePercent: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface ReceiptItemSnapshot {
  id: string;
  name: string;
  quantity: number;
  price: number;
  effectiveTaxRate: number;
}

export interface BusinessSnapshot {
  name: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  vatNumber: string | null;
}

export interface CustomerSnapshot {
  name: string;
  email: string | null;
  vatNumber: string | null;
  address: string | null;
  city: string | null;
}

export interface Receipt {
  id: number;
  receiptNumber: string;
  transactionId: number;
  customerId: number | null;
  status: ReceiptStatus;
  businessSnapshot: BusinessSnapshot;
  customerSnapshot: CustomerSnapshot | null;
  itemsSnapshot: ReceiptItemSnapshot[];
  subtotal: number;
  tax: number;
  taxBreakdown: TaxBreakdownItem[] | null;
  discount: number;
  discountReason: string | null;
  tip: number;
  total: number;
  paymentMethod: string;
  notes: string | null;
  internalNotes: string | null;
  pdfPath: string | null;
  pdfGeneratedAt: string | null;
  issuedAt: string | null;
  issuedBy: {
    id: number;
    name: string;
  };
  emailedAt: string | null;
  emailRecipient: string | null;
  emailStatus: EmailStatus | null;
  voidedAt: string | null;
  voidReason: string | null;
  voidedBy: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer | null;
  transaction: {
    id: number;
    createdAt: string;
    tillName: string;
  };
  canIssue: boolean;
  canVoid: boolean;
  canEmail: boolean;
  canEdit: boolean;
}

export interface CreateReceiptInput {
  transactionId: number;
  customerId?: number | null;
  notes?: string;
  internalNotes?: string;
}

export interface UpdateReceiptInput {
  customerId?: number | null;
  notes?: string | null;
  internalNotes?: string | null;
}

export interface IssueReceiptInput {
  generatePdf?: boolean;
  language?: string;
}

export interface VoidReceiptInput {
  reason: string;
}

export interface SendReceiptEmailInput {
  email: string;
  includePdf?: boolean;
  message?: string;
}

export interface ReceiptListFilters {
  page?: number;
  pageSize?: number;
  status?: ReceiptStatus;
  customerId?: number;
  startDate?: string;
  endDate?: string;
  receiptNumber?: string;
  search?: string;
  sortBy?: 'createdAt' | 'issuedAt' | 'receiptNumber' | 'total';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CustomerListFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}