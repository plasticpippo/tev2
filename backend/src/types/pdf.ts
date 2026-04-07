export interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Receipt';
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  width?: string;
  height?: string;
}

export interface TemplateData {
  [key: string]: unknown;
}

export interface ReceiptTemplateData extends TemplateData {
  receipt: {
    receiptNumber: string;
    issuedAt: string;
    business: {
      name: string;
      address: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
      phone: string | null;
      email: string | null;
      vatNumber: string | null;
    };
    customer: {
      name: string;
      email: string | null;
      phone: string | null;
      vatNumber: string | null;
      address: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
    } | null;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
      taxRateName?: string;
      taxRatePercent?: number;
    }>;
    subtotal: number;
    tax: number;
    taxBreakdown: Array<{
      rateName: string;
      ratePercent: number;
      taxableAmount: number;
      taxAmount: number;
    }> | null;
    discount: number;
    discountReason: string | null;
    tip: number;
    total: number;
    paymentMethod: string;
    notes: string | null;
  };
  locale: string;
  currency: string;
}

export interface PDFGenerationResult {
  buffer: Buffer;
  filename: string;
  generatedAt: Date;
  sizeBytes: number;
}

export interface PDFCacheEntry {
  buffer: Buffer;
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
}

export interface FontConfig {
  regular: {
    path: string;
    family: string;
    weight: number;
  };
  bold: {
    path: string;
    family: string;
    weight: number;
  };
}

export const DEFAULT_PDF_OPTIONS: PDFOptions = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm',
  },
};

export const RECEIPT_PDF_OPTIONS: PDFOptions = {
  format: 'Receipt',
  printBackground: true,
  width: '80mm',
  margin: {
    top: '5mm',
    right: '5mm',
    bottom: '5mm',
    left: '5mm',
  },
};

export interface InvoiceTemplateData extends TemplateData {
  invoice: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string | null;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    business: {
      name: string;
      address: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
      phone: string | null;
      email: string | null;
      vatNumber: string | null;
      logoPath: string | null;
    };
    customer: {
      name: string;
      email: string | null;
      phone: string | null;
      vatNumber: string | null;
      address: string | null;
      city: string | null;
      postalCode: string | null;
      country: string | null;
    } | null;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
      taxRateName?: string;
      taxRatePercent?: number;
    }>;
    subtotal: number;
    tax: number;
    taxBreakdown: Array<{
      rateName: string;
      ratePercent: number;
      taxableAmount: number;
      taxAmount: number;
    }> | null;
    discount: number;
    discountReason: string | null;
    total: number;
    paymentMethod: string;
    notes: string | null;
    legalText: string | null;
    paymentInstructions: string | null;
  };
  locale: string;
  currency: string;
}

export const INVOICE_PDF_OPTIONS: PDFOptions = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '15mm',
    right: '15mm',
    bottom: '15mm',
    left: '15mm',
  },
};
