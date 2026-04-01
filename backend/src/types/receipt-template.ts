export interface ReceiptTemplateBusiness {
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  vatNumber: string | null;
  logoPath?: string | null;
}

export interface ReceiptTemplateCustomer {
  name: string;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface ReceiptTemplateItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
  taxRateId?: number;
  taxRateName?: string;
  taxRatePercent?: number;
}

export interface ReceiptTemplateTaxBreakdown {
  rateName: string;
  ratePercent: number;
  taxableAmount: number;
  taxAmount: number;
}

export type ReceiptTemplateStatus = 'draft' | 'issued' | 'voided' | 'emailed';

export interface ReceiptTemplateData {
  receipt: {
    receiptNumber: string;
    transactionRef?: string;
    status: ReceiptTemplateStatus;
    issuedAt: string | Date;
    business: ReceiptTemplateBusiness;
    customer: ReceiptTemplateCustomer | null;
    items: ReceiptTemplateItem[];
    subtotal: number;
    tax: number;
    taxBreakdown: ReceiptTemplateTaxBreakdown[] | null;
    discount: number;
    discountReason: string | null;
    tip: number;
    total: number;
    paymentMethod: string;
    notes: string | null;
    legalText?: string | null;
  };
  locale: string;
  currency: string;
  basePath?: string;
}

export interface ReceiptPDFOptions {
  format?: 'A4' | 'Letter' | 'Receipt';
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface ReceiptPDFResult {
  buffer: Buffer;
  filename: string;
  generatedAt: Date;
  sizeBytes: number;
}

export function prepareReceiptTemplateData(receipt: {
  receiptNumber: string;
  status: ReceiptTemplateStatus;
  issuedAt: Date | null;
  businessSnapshot: {
    name: string;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
  };
  customerSnapshot: {
    name: string;
    email: string | null;
    phone: string | null;
    vatNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
  itemsSnapshot: Array<{
    name: string;
    quantity: number;
    price: number;
    taxRateId?: number;
    taxRateName?: string;
    taxRatePercent?: number;
  }>;
  subtotal: number;
  tax: number;
  taxBreakdown: ReceiptTemplateTaxBreakdown[] | null;
  discount: number;
  discountReason: string | null;
  tip: number;
  total: number;
  paymentMethod: string;
  notes: string | null;
}, locale: string = 'en', currency: string = 'EUR'): ReceiptTemplateData {
  const items: ReceiptTemplateItem[] = receipt.itemsSnapshot.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: Number(item.price),
    total: Number(item.price) * item.quantity,
    taxRateId: item.taxRateId,
    taxRateName: item.taxRateName,
    taxRatePercent: item.taxRatePercent,
  }));

  return {
    receipt: {
      receiptNumber: receipt.receiptNumber,
      status: receipt.status,
      issuedAt: receipt.issuedAt || new Date(),
      business: {
        name: receipt.businessSnapshot.name,
        address: receipt.businessSnapshot.address,
        city: receipt.businessSnapshot.city,
        postalCode: receipt.businessSnapshot.postalCode,
        country: receipt.businessSnapshot.country,
        phone: receipt.businessSnapshot.phone,
        email: receipt.businessSnapshot.email,
        vatNumber: receipt.businessSnapshot.vatNumber,
      },
      customer: receipt.customerSnapshot ? {
        name: receipt.customerSnapshot.name,
        email: receipt.customerSnapshot.email,
        phone: receipt.customerSnapshot.phone,
        vatNumber: receipt.customerSnapshot.vatNumber,
        address: receipt.customerSnapshot.address,
        city: receipt.customerSnapshot.city,
        postalCode: receipt.customerSnapshot.postalCode,
        country: receipt.customerSnapshot.country,
      } : null,
      items,
      subtotal: Number(receipt.subtotal),
      tax: Number(receipt.tax),
      taxBreakdown: receipt.taxBreakdown,
      discount: Number(receipt.discount),
      discountReason: receipt.discountReason,
      tip: Number(receipt.tip),
      total: Number(receipt.total),
      paymentMethod: receipt.paymentMethod,
      notes: receipt.notes,
    },
    locale,
    currency,
  };
}
