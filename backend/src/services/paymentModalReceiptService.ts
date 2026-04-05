import { prisma } from '../prisma';
import { randomUUID } from 'crypto';
import { generateNextReceiptNumber } from './receiptNumberService';
import { addToQueue } from './receiptQueueService';
import { toReceiptDTO } from '../types/receipt';
import { renderReceiptPDF, prepareReceiptTemplateData } from './receiptTemplateService';
import { savePDFToStorage } from './pdfService';

interface CreateReceiptFromPaymentOptions {
  transactionId: number;
  userId: number;
  issueMode: 'immediate' | 'draft';
}

interface ReceiptCreationResult {
  receipt: {
    id: number;
    number?: string;
    status: string;
    pdfUrl?: string;
  };
}

export async function canIssueReceiptFromPaymentModal(): Promise<boolean> {
  const settings = await prisma.settings.findFirst();
  return settings?.allowReceiptFromPaymentModal ?? false;
}

export async function getUserReceiptPreference(userId: number): Promise<'immediate' | 'draft' | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { receiptFromPaymentDefault: true },
  });

  if (user?.receiptFromPaymentDefault !== null && user?.receiptFromPaymentDefault !== undefined) {
    return user.receiptFromPaymentDefault ? 'immediate' : 'draft';
  }

  const settings = await prisma.settings.findFirst();
  if (settings?.receiptIssueMode) {
    return settings.receiptIssueMode as 'immediate' | 'draft';
  }

  return 'immediate';
}

export async function createReceiptFromPayment(
  options: CreateReceiptFromPaymentOptions
): Promise<ReceiptCreationResult> {
  const { transactionId, userId, issueMode } = options;

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
    return {
      receipt: {
        id: existingReceipt.id,
        number: existingReceipt.receiptNumber,
        status: existingReceipt.status,
        pdfUrl: existingReceipt.pdfPath ? `/api/receipts/${existingReceipt.id}/pdf` : undefined,
      },
    };
  }

  const settings = await prisma.settings.findFirst();
  const taxMode = (settings?.taxMode || 'exclusive') as 'inclusive' | 'exclusive' | 'none';

  const businessSnapshot = {
    name: settings?.businessName || '',
    address: settings?.businessAddress,
    city: settings?.businessCity,
    postalCode: settings?.businessPostalCode,
    country: settings?.businessCountry,
    phone: settings?.businessPhone,
    email: settings?.businessEmail,
    vatNumber: settings?.vatNumber,
  };

  const items = typeof transaction.items === 'string' 
    ? JSON.parse(transaction.items) 
    : transaction.items;

  const itemsSnapshot = items.map((item: any) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    total: Number(item.price) * item.quantity,
    taxRateName: item.taxRateName || 'Standard',
    taxRatePercent: item.taxRatePercent ?? Math.round((item.effectiveTaxRate || 0.22) * 100),
  }));

  const taxBreakdown: any[] = [];
  const taxMap = new Map<string, { taxableAmount: number; taxAmount: number }>();

  for (const item of items) {
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

    const existing = taxMap.get(key);
    if (existing) {
      existing.taxableAmount += taxableAmount;
      existing.taxAmount += taxAmount;
    } else {
      taxMap.set(key, { taxableAmount, taxAmount });
    }
  }

  taxMap.forEach((value, key) => {
    const [name, percentStr] = key.split('-');
    taxBreakdown.push({
      name,
      percent: parseInt(percentStr, 10),
      taxableAmount: Math.round(value.taxableAmount * 100) / 100,
      taxAmount: Math.round(value.taxAmount * 100) / 100,
    });
  });

  if (issueMode === 'immediate') {
    const receiptNumber = await generateNextReceiptNumber();

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        transactionId,
        status: 'issued',
        businessSnapshot: businessSnapshot as any,
        customerSnapshot: {},
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        taxBreakdown: taxBreakdown as any,
        discount: transaction.discount,
        discountReason: transaction.discountReason,
        tip: transaction.tip,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        itemsSnapshot: itemsSnapshot as any,
        issuedBy: userId,
        issuedAt: new Date(),
        issuedFromPaymentModal: true,
        generationStatus: 'pending',
        version: 0,
      },
    });

    try {
      const receiptDTO = toReceiptDTO(receipt);
      const templateData = prepareReceiptTemplateData(receiptDTO);
      const pdfResult = await renderReceiptPDF(templateData);
      await savePDFToStorage(pdfResult.buffer, pdfResult.filename);

      const updatedReceipt = await prisma.receipt.update({
        where: { id: receipt.id },
        data: {
          pdfPath: pdfResult.filename,
          pdfGeneratedAt: pdfResult.generatedAt,
          generationStatus: 'completed',
          version: { increment: 1 },
        },
      });

      return {
        receipt: {
          id: updatedReceipt.id,
          number: updatedReceipt.receiptNumber,
          status: 'issued',
          pdfUrl: `/api/receipts/${updatedReceipt.id}/pdf`,
        },
      };
    } catch (pdfError) {
      console.error('Failed to generate PDF immediately, queuing for retry:', pdfError);

      await addToQueue(receipt.id);

      return {
        receipt: {
          id: receipt.id,
          number: receipt.receiptNumber,
          status: 'queued',
        },
      };
    }
  } else {
    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber: `DRAFT-${randomUUID()}`,
        transactionId,
        status: 'draft',
        businessSnapshot: businessSnapshot as any,
        customerSnapshot: {},
        subtotal: transaction.subtotal,
        tax: transaction.tax,
        taxBreakdown: taxBreakdown as any,
        discount: transaction.discount,
        discountReason: transaction.discountReason,
        tip: transaction.tip,
        total: transaction.total,
        paymentMethod: transaction.paymentMethod,
        itemsSnapshot: itemsSnapshot as any,
        issuedBy: userId,
        issuedFromPaymentModal: true,
        generationStatus: 'pending',
        version: 0,
      },
    });

    return {
      receipt: {
        id: receipt.id,
        status: 'draft',
      },
    };
  }
}

export const paymentModalReceiptService = {
  canIssueReceiptFromPaymentModal,
  getUserReceiptPreference,
  createReceiptFromPayment,
};
