import { prisma } from '../prisma';
import { logInfo, logError } from '../utils/logger';
import { randomUUID } from 'crypto';
import {
  CreateReceiptInput,
  UpdateReceiptInput,
  IssueReceiptInput,
  VoidReceiptInput,
  ReceiptFilters,
  ReceiptPagination,
  ReceiptListResult,
  ReceiptResponseDTO,
  BusinessSnapshot,
  CustomerSnapshot,
  TaxBreakdownItem,
  ReceiptItemSnapshot,
  toReceiptDTO,
  toReceiptDTOArray,
} from '../types/receipt';
import { Prisma } from '@prisma/client';
import { generateNextReceiptNumber } from './receiptNumberService';
import { renderReceiptPDF, prepareReceiptTemplateData } from './receiptTemplateService';
import { savePDFToStorage, deletePDFFromStorage } from './pdfService';
import { getLogoUrl } from './logoUploadService';
import { renderEmailHtml, renderEmailText } from './emailTemplateService';

async function getBusinessSnapshot(): Promise<BusinessSnapshot> {
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    return {
      name: '',
      address: null,
      city: null,
      postalCode: null,
      country: null,
      phone: null,
      email: null,
      vatNumber: null,
      logoPath: null,
      legalText: null,
    };
  }

  // For PDF generation, we need an absolute URL for the logo
  // Puppeteer can't load relative URLs when generating PDFs
  let logoPath: string | null = null;
  if (settings.businessLogoPath) {
    const baseUrl = process.env.URL || 'http://localhost:3001';
    const relativeLogoPath = getLogoUrl(settings.businessLogoPath);
    logoPath = `${baseUrl}${relativeLogoPath}`;
  }

  return {
    name: settings.businessName || '',
    address: settings.businessAddress,
    city: settings.businessCity,
    postalCode: settings.businessPostalCode,
    country: settings.businessCountry,
    phone: settings.businessPhone,
    email: settings.businessEmail,
    vatNumber: settings.vatNumber,
    logoPath,
    legalText: settings.businessLegalText,
  };
}

async function getCustomerSnapshot(customerId: number): Promise<CustomerSnapshot | null> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, deletedAt: null },
  });
  
  if (!customer) {
    return null;
  }
  
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    vatNumber: customer.vatNumber,
    address: customer.address,
    city: customer.city,
    postalCode: customer.postalCode,
    country: customer.country,
  };
}

function calculateTaxBreakdown(items: any, taxMode: 'inclusive' | 'exclusive' | 'none' = 'exclusive'): TaxBreakdownItem[] | null {
  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  const breakdown: Map<string, TaxBreakdownItem> = new Map();

  for (const item of parsedItems) {
    const taxRateName = item.taxRateName || 'Standard';
    const taxRatePercent = item.taxRatePercent ?? Math.round((item.effectiveTaxRate || 0.22) * 100);
    const effectiveTaxRate = taxRatePercent / 100;
    const key = `${taxRateName}-${taxRatePercent}`;

    const itemTotal = Number(item.price) * item.quantity;
    let taxableAmount: number;
    let taxAmount: number;

    if (taxMode === 'inclusive' && effectiveTaxRate > 0) {
      taxableAmount = itemTotal / (1 + effectiveTaxRate);
      taxAmount = itemTotal - taxableAmount;
    } else if (taxMode === 'exclusive' && effectiveTaxRate > 0) {
      taxableAmount = itemTotal;
      taxAmount = taxableAmount * effectiveTaxRate;
    } else {
      taxableAmount = itemTotal;
      taxAmount = 0;
    }

    taxableAmount = Math.round(taxableAmount * 100) / 100;
    taxAmount = Math.round(taxAmount * 100) / 100;

    if (breakdown.has(key)) {
      const existing = breakdown.get(key)!;
      existing.taxableAmount = Math.round((existing.taxableAmount + taxableAmount) * 100) / 100;
      existing.taxAmount = Math.round((existing.taxAmount + taxAmount) * 100) / 100;
    } else {
      breakdown.set(key, {
        rateName: taxRateName,
        ratePercent: taxRatePercent,
        taxableAmount,
        taxAmount,
      });
    }
  }

  const result = Array.from(breakdown.values());
  return result.length > 0 ? result : null;
}

function transformItemsSnapshot(items: any): ReceiptItemSnapshot[] {
  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  return parsedItems.map((item: any) => ({
    id: item.id,
    variantId: item.variantId,
    productId: item.productId,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
    taxRateId: item.taxRateId,
    taxRateName: item.taxRateName,
    taxRatePercent: item.taxRatePercent,
  }));
}

export async function createReceiptFromTransaction(
  transactionId: number,
  userId: number,
  input: CreateReceiptInput
): Promise<ReceiptResponseDTO> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const existingReceipt = await prisma.receipt.findFirst({
    where: { transactionId },
  });

  if (existingReceipt) {
    throw new Error('Receipt already exists for this transaction');
  }

  const settings = await prisma.settings.findFirst();
  const taxMode = (settings?.taxMode || 'exclusive') as 'inclusive' | 'exclusive' | 'none';

  const businessSnapshot = await getBusinessSnapshot();
  const customerSnapshot = input.customerId ? await getCustomerSnapshot(input.customerId) : null;
  const itemsSnapshot = transformItemsSnapshot(transaction.items as any[]);
  const taxBreakdown = calculateTaxBreakdown(transaction.items as any[], taxMode);
  
  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber: `DRAFT-${randomUUID()}`,
      transactionId,
      customerId: input.customerId ?? null,
      status: 'draft',
      businessSnapshot: businessSnapshot as any,
      customerSnapshot: customerSnapshot as any,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      taxBreakdown: taxBreakdown as any,
      discount: transaction.discount,
      discountReason: transaction.discountReason,
      tip: transaction.tip,
      total: transaction.total,
      paymentMethod: transaction.paymentMethod,
      itemsSnapshot: itemsSnapshot as any,
      notes: input.notes ?? null,
      internalNotes: input.internalNotes ?? null,
      issuedBy: userId,
      version: 0,
    },
  });
  
  return toReceiptDTO(receipt);
}

export async function getReceiptById(id: number): Promise<ReceiptResponseDTO | null> {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
  });
  
  return receipt ? toReceiptDTO(receipt) : null;
}

export async function getReceiptByNumber(receiptNumber: string): Promise<ReceiptResponseDTO | null> {
  const receipt = await prisma.receipt.findFirst({
    where: { receiptNumber },
  });
  
  return receipt ? toReceiptDTO(receipt) : null;
}

export async function getReceiptByTransactionId(transactionId: number): Promise<ReceiptResponseDTO | null> {
  const receipt = await prisma.receipt.findFirst({
    where: { transactionId },
  });
  
  return receipt ? toReceiptDTO(receipt) : null;
}

export async function listReceipts(
  filters: ReceiptFilters = {},
  pagination: ReceiptPagination = { page: 1, limit: 20 }
): Promise<ReceiptListResult> {
  const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  
  const where: Prisma.ReceiptWhereInput = {};
  
  if (filters.receiptNumber) {
    where.receiptNumber = { contains: filters.receiptNumber, mode: 'insensitive' };
  }
  
  if (filters.transactionId) {
    where.transactionId = filters.transactionId;
  }
  
  if (filters.customerId) {
    where.customerId = filters.customerId;
  }
  
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      where.status = { in: filters.status };
    } else {
      where.status = filters.status;
    }
  }
  
  if (filters.emailStatus) {
    where.emailStatus = filters.emailStatus;
  }

  if (filters.generationStatus) {
    if (Array.isArray(filters.generationStatus)) {
      where.generationStatus = { in: filters.generationStatus };
    } else {
      where.generationStatus = filters.generationStatus;
    }
  }

  if (filters.issuedAtFrom || filters.issuedAtTo) {
    where.issuedAt = {};
    if (filters.issuedAtFrom) {
      where.issuedAt.gte = filters.issuedAtFrom;
    }
    if (filters.issuedAtTo) {
      where.issuedAt.lte = filters.issuedAtTo;
    }
  }
  
  if (filters.createdAtFrom || filters.createdAtTo) {
    where.createdAt = {};
    if (filters.createdAtFrom) {
      where.createdAt.gte = filters.createdAtFrom;
    }
    if (filters.createdAtTo) {
      where.createdAt.lte = filters.createdAtTo;
    }
  }
  
  if (filters.search) {
    where.OR = [
      { receiptNumber: { contains: filters.search, mode: 'insensitive' } },
      { customerSnapshot: { path: ['name'], string_contains: filters.search } },
      { emailRecipient: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  
  const totalCount = await prisma.receipt.count({ where });
  const totalPages = Math.ceil(totalCount / limit);
  
  const receipts = await prisma.receipt.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return {
    receipts: toReceiptDTOArray(receipts),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function issueDraftReceipt(
  id: number,
  userId: number,
  input?: IssueReceiptInput
): Promise<ReceiptResponseDTO> {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
  });
  
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  
  if (receipt.status !== 'draft') {
    throw new Error('Only draft receipts can be issued');
  }
  
  const receiptNumber = await generateNextReceiptNumber();
  
  let customerSnapshot = receipt.customerSnapshot as any;
  let customerId = receipt.customerId;
  
  if (input?.customerId && input.customerId !== receipt.customerId) {
    customerId = input.customerId;
    customerSnapshot = await getCustomerSnapshot(input.customerId);
  }
  
  // First update to issued status with receipt number
  const updatedReceipt = await prisma.receipt.update({
    where: { id },
    data: {
      receiptNumber,
      status: 'issued',
      issuedAt: new Date(),
      issuedBy: userId,
      customerId,
      customerSnapshot: customerSnapshot as any,
      notes: input?.notes ?? receipt.notes,
      version: { increment: 1 },
    },
  });
  
  // Generate PDF automatically on issue
  try {
    const receiptDTO = toReceiptDTO(updatedReceipt);
    const templateData = prepareReceiptTemplateData(receiptDTO);
    const pdfResult = await renderReceiptPDF(templateData);
    const savedPath = await savePDFToStorage(pdfResult.buffer, pdfResult.filename);
    
    // Update receipt with PDF path
    const finalReceipt = await prisma.receipt.update({
      where: { id },
      data: {
        pdfPath: pdfResult.filename,
        pdfGeneratedAt: pdfResult.generatedAt,
        version: { increment: 1 },
      },
    });
    
    // Auto-email (fire-and-forget) if customer has email and setting is enabled
    triggerAutoEmail(id, customerSnapshot as any, userId, 'issued receipt');

    return toReceiptDTO(finalReceipt);
  } catch (pdfError) {
    console.error('Failed to generate PDF on receipt issue:', pdfError);

    // Auto-email (fire-and-forget) even if PDF generation failed
    triggerAutoEmail(id, customerSnapshot as any, userId, 'issued receipt (PDF failed)');

    return toReceiptDTO(updatedReceipt);
  }
}

function triggerAutoEmail(
  receiptId: number,
  customerSnapshot: any,
  userId: number,
  context: string
): void {
  if (!customerSnapshot?.email) return;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customerSnapshot.email)) return;

  // Fire-and-forget: do not await, errors are caught internally
  (async () => {
    try {
      const emailSettings = await prisma.settings.findFirst();
      if (!emailSettings?.autoEmailReceipts || !emailSettings.emailEnabled) return;

      await sendReceiptEmail(receiptId, { email: customerSnapshot.email }, userId);
      logInfo(`Auto-email queued for ${context}`, { receiptId });
    } catch (error) {
      logError(`Failed to auto-email ${context}`, {
        receiptId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })();
}

export async function voidReceipt(
  id: number,
  userId: number,
  input: VoidReceiptInput
): Promise<ReceiptResponseDTO> {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
  });
  
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  
  if (receipt.status !== 'issued') {
    throw new Error('Only issued receipts can be voided');
  }
  
  if (!input.reason || input.reason.trim() === '') {
    throw new Error('Void reason is required');
  }
  
  const updatedReceipt = await prisma.receipt.update({
    where: { id },
    data: {
      status: 'voided',
      voidedAt: new Date(),
      voidReason: input.reason.trim(),
      voidedBy: userId,
      version: { increment: 1 },
    },
  });
  
  // Clean up PDF file when voiding (optional - can be kept for archival)
  if (receipt.pdfPath) {
    try {
      await deletePDFFromStorage(receipt.pdfPath);
    } catch (error) {
      // Log error but don't fail the void operation
      console.error('Failed to delete PDF on void:', error);
    }
  }
  
  return toReceiptDTO(updatedReceipt);
}

export async function updateDraftReceipt(
  id: number,
  data: UpdateReceiptInput
): Promise<ReceiptResponseDTO> {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
  });
  
  if (!receipt) {
    throw new Error('Receipt not found');
  }
  
  if (receipt.status !== 'draft') {
    throw new Error('Only draft receipts can be updated');
  }
  
  let customerSnapshot = receipt.customerSnapshot as any;
  
  if (data.customerId !== undefined && data.customerId !== receipt.customerId) {
    customerSnapshot = data.customerId ? await getCustomerSnapshot(data.customerId) : null;
  }
  
  const updatedReceipt = await prisma.receipt.update({
    where: { id },
    data: {
      ...(data.customerId !== undefined && { customerId: data.customerId }),
      customerSnapshot: customerSnapshot as any,
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.internalNotes !== undefined && { internalNotes: data.internalNotes }),
    },
  });
  
  return toReceiptDTO(updatedReceipt);
}

export async function checkForConcurrentUpdate(
  id: number,
  expectedVersion: number
): Promise<boolean> {
  const receipt = await prisma.receipt.findUnique({
    where: { id },
    select: { version: true },
  });
  
  return receipt?.version === expectedVersion;
}

export async function updateReceiptPdfPath(
  id: number,
  pdfPath: string,
  pdfGeneratedAt: Date
): Promise<ReceiptResponseDTO> {
  const receipt = await prisma.receipt.update({
    where: { id },
    data: {
      pdfPath,
      pdfGeneratedAt,
    },
  });

  return toReceiptDTO(receipt);
}

export interface SendReceiptEmailInput {
  email: string;
  includePdf?: boolean;
  message?: string;
}

export interface SendReceiptEmailResult {
  jobId: string;
  status: string;
  recipientEmail: string;
  receiptId: number;
  receiptNumber: string;
  createdAt: Date;
}

export async function sendReceiptEmail(
  receiptId: number,
  input: SendReceiptEmailInput,
  userId: number
): Promise<SendReceiptEmailResult> {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt) {
    throw new Error('Receipt not found');
  }

  if (receipt.status === 'draft') {
    throw new Error('RECEIPT_NOT_ISSUED');
  }

  if (receipt.status === 'voided') {
    throw new Error('RECEIPT_VOIDED');
  }

  const settings = await prisma.settings.findFirst();
  if (!settings || !settings.emailEnabled) {
    throw new Error('EMAIL_SERVICE_DISABLED');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new Error('INVALID_EMAIL');
  }

  const businessSnapshot = receipt.businessSnapshot as any;
  const customerSnapshot = receipt.customerSnapshot as any;
  const itemsSnapshot = receipt.itemsSnapshot as any[];
  const taxBreakdown = receipt.taxBreakdown as any[];

  const formatAmount = (val: any) => {
    const num = typeof val === 'object' && val !== null && typeof val.toNumber === 'function'
      ? val.toNumber()
      : Number(val);
    return `EUR ${num.toFixed(2)}`;
  };

  const templateData = {
    business: {
      name: businessSnapshot?.name || 'Business',
      address: businessSnapshot?.address || null,
      city: businessSnapshot?.city || null,
      postalCode: businessSnapshot?.postalCode || null,
      country: businessSnapshot?.country || null,
      phone: businessSnapshot?.phone || null,
      email: businessSnapshot?.email || null,
      vatNumber: businessSnapshot?.vatNumber || null,
    },
    customer: {
      name: customerSnapshot?.name || 'Valued Customer',
      email: input.email,
    },
    receipt: {
      number: receipt.receiptNumber,
      date: receipt.issuedAt ? new Date(receipt.issuedAt).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('it-IT'),
      itemsCount: Array.isArray(itemsSnapshot) ? itemsSnapshot.length : 0,
      total: formatAmount(receipt.total),
      transactionId: receipt.transactionId,
      paymentMethod: receipt.paymentMethod,
      subtotal: formatAmount(receipt.subtotal),
      tax: formatAmount(receipt.tax),
      taxBreakdown: Array.isArray(taxBreakdown)
        ? taxBreakdown.map((tb: any) => ({
            rateName: tb.rateName || tb.name || 'Standard',
            ratePercent: tb.ratePercent || tb.percent || 0,
            taxableAmount: formatAmount(tb.taxableAmount),
            taxAmount: formatAmount(tb.taxAmount),
          }))
        : [],
      discount: formatAmount(receipt.discount),
      discountReason: receipt.discountReason,
      tip: formatAmount(receipt.tip),
      items: Array.isArray(itemsSnapshot)
        ? itemsSnapshot.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: formatAmount(item.price || item.unitPrice),
            total: formatAmount(item.total || (Number(item.price || item.unitPrice) * item.quantity)),
          }))
        : [],
    },
    customMessage: input.message,
    locale: 'en',
  };

  const htmlContent = await renderEmailHtml(templateData);
  const textContent = await renderEmailText(templateData);

  const subject = `Receipt ${receipt.receiptNumber} - ${businessSnapshot?.name || 'Business'}`;

  const includePdf = input.includePdf !== false;

  const emailJob = await prisma.emailQueue.create({
    data: {
      receiptId,
      recipientEmail: input.email,
      subject,
      htmlContent,
      textContent,
      attachmentPath: includePdf && receipt.pdfPath ? receipt.pdfPath : null,
      attachmentFilename: includePdf && receipt.pdfPath ? `${receipt.receiptNumber}.pdf` : null,
      status: 'pending',
      priority: 0,
    },
  });

  return {
    jobId: emailJob.id,
    status: emailJob.status,
    recipientEmail: emailJob.recipientEmail,
    receiptId,
    receiptNumber: receipt.receiptNumber,
    createdAt: emailJob.createdAt,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
