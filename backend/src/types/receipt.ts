export type ReceiptStatus = 'draft' | 'issued' | 'voided' | 'emailed';
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'bounced';

export interface BusinessSnapshot {
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  vatNumber: string | null;
}

export interface CustomerSnapshot {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface TaxBreakdownItem {
  rateName: string;
  ratePercent: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface ReceiptItemSnapshot {
  id: number;
  variantId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  taxRateId?: number;
  taxRateName?: string;
  taxRatePercent?: number;
}

export interface Receipt {
  id: number;
  receiptNumber: string;
  transactionId: number;
  customerId: number | null;
  status: ReceiptStatus;
  businessSnapshot: BusinessSnapshot;
  customerSnapshot: CustomerSnapshot | null;
  subtotal: number;
  tax: number;
  taxBreakdown: TaxBreakdownItem[] | null;
  discount: number;
  discountReason: string | null;
  tip: number;
  total: number;
  paymentMethod: string;
  itemsSnapshot: ReceiptItemSnapshot[];
  notes: string | null;
  internalNotes: string | null;
  pdfPath: string | null;
  pdfGeneratedAt: Date | null;
  issuedAt: Date | null;
  issuedBy: number;
  emailedAt: Date | null;
  emailRecipient: string | null;
  emailStatus: EmailStatus | null;
  emailErrorMessage: string | null;
  emailAttempts: number;
  voidedAt: Date | null;
  voidReason: string | null;
  voidedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface CreateReceiptInput {
  transactionId: number;
  customerId?: number | null;
  notes?: string | null;
  internalNotes?: string | null;
}

export interface UpdateReceiptInput {
  customerId?: number | null;
  notes?: string | null;
  internalNotes?: string | null;
}

export interface IssueReceiptInput {
  customerId?: number | null;
  notes?: string | null;
}

export interface VoidReceiptInput {
  reason: string;
}

export interface ReceiptFilters {
  search?: string;
  receiptNumber?: string;
  transactionId?: number;
  customerId?: number;
  status?: ReceiptStatus | ReceiptStatus[];
  issuedAtFrom?: Date;
  issuedAtTo?: Date;
  createdAtFrom?: Date;
  createdAtTo?: Date;
  emailStatus?: EmailStatus;
}

export interface ReceiptPagination {
  page: number;
  limit: number;
  sortBy?: 'receiptNumber' | 'createdAt' | 'issuedAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ReceiptListResult {
  receipts: ReceiptResponseDTO[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ReceiptResponseDTO {
  id: number;
  receiptNumber: string;
  transactionId: number;
  customerId: number | null;
  status: ReceiptStatus;
  businessSnapshot: BusinessSnapshot;
  customerSnapshot: CustomerSnapshot | null;
  subtotal: number;
  tax: number;
  taxBreakdown: TaxBreakdownItem[] | null;
  discount: number;
  discountReason: string | null;
  tip: number;
  total: number;
  paymentMethod: string;
  itemsSnapshot: ReceiptItemSnapshot[];
  notes: string | null;
  internalNotes: string | null;
  pdfPath: string | null;
  pdfGeneratedAt: Date | null;
  issuedAt: Date | null;
  issuedBy: number;
  emailedAt: Date | null;
  emailRecipient: string | null;
  emailStatus: EmailStatus | null;
  emailAttempts: number;
  voidedAt: Date | null;
  voidReason: string | null;
  voidedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export function toReceiptDTO(receipt: any): ReceiptResponseDTO {
  return {
    id: receipt.id,
    receiptNumber: receipt.receiptNumber,
    transactionId: receipt.transactionId,
    customerId: receipt.customerId,
    status: receipt.status,
    businessSnapshot: receipt.businessSnapshot,
    customerSnapshot: receipt.customerSnapshot,
    subtotal: Number(receipt.subtotal),
    tax: Number(receipt.tax),
    taxBreakdown: receipt.taxBreakdown,
    discount: Number(receipt.discount),
    discountReason: receipt.discountReason,
    tip: Number(receipt.tip),
    total: Number(receipt.total),
    paymentMethod: receipt.paymentMethod,
    itemsSnapshot: receipt.itemsSnapshot,
    notes: receipt.notes,
    internalNotes: receipt.internalNotes,
    pdfPath: receipt.pdfPath,
    pdfGeneratedAt: receipt.pdfGeneratedAt,
    issuedAt: receipt.issuedAt,
    issuedBy: receipt.issuedBy,
    emailedAt: receipt.emailedAt,
    emailRecipient: receipt.emailRecipient,
    emailStatus: receipt.emailStatus,
    emailAttempts: receipt.emailAttempts,
    voidedAt: receipt.voidedAt,
    voidReason: receipt.voidReason,
    voidedBy: receipt.voidedBy,
    createdAt: receipt.createdAt,
    updatedAt: receipt.updatedAt,
    version: receipt.version,
  };
}

export function toReceiptDTOArray(receipts: any[]): ReceiptResponseDTO[] {
  return receipts.map(toReceiptDTO);
}
