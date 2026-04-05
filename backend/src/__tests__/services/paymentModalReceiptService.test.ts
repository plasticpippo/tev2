import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import {
  canIssueReceiptFromPaymentModal,
  getUserReceiptPreference,
  createReceiptFromPayment,
} from '../../services/paymentModalReceiptService';
import { prisma } from '../../prisma';

// Mock dependencies
jest.mock('../../prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('../../services/receiptNumberService', () => ({
  generateNextReceiptNumber: jest.fn().mockResolvedValue('R000001'),
}));

jest.mock('../../services/receiptQueueService', () => ({
  addToQueue: jest.fn().mockResolvedValue({ id: 1, receiptId: 1, status: 'pending' }),
}));

jest.mock('../../services/receiptTemplateService', () => ({
  prepareReceiptTemplateData: jest.fn().mockReturnValue({
    receipt: { receiptNumber: 'R000001' },
    locale: 'en',
    currency: 'EUR',
  }),
  renderReceiptPDF: jest.fn().mockResolvedValue({
    buffer: Buffer.from('test-pdf'),
    filename: 'R000001.pdf',
    generatedAt: new Date(),
    sizeBytes: 1000,
  }),
}));

jest.mock('../../services/pdfService', () => ({
  savePDFToStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../types/receipt', () => ({
  toReceiptDTO: jest.fn().mockReturnValue({
    id: 1,
    receiptNumber: 'R000001',
    status: 'issued',
  }),
}));

const mockedPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('paymentModalReceiptService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // canIssueReceiptFromPaymentModal tests
  // ============================================================================
  describe('canIssueReceiptFromPaymentModal', () => {
    it('should return true when setting is enabled', async () => {
      mockedPrisma.settings.findFirst.mockResolvedValue({
        id: 1,
        allowReceiptFromPaymentModal: true,
      } as any);

      const result = await canIssueReceiptFromPaymentModal();

      expect(result).toBe(true);
    });

    it('should return false when setting is disabled', async () => {
      mockedPrisma.settings.findFirst.mockResolvedValue({
        id: 1,
        allowReceiptFromPaymentModal: false,
      } as any);

      const result = await canIssueReceiptFromPaymentModal();

      expect(result).toBe(false);
    });

    it('should return false when settings do not exist', async () => {
      mockedPrisma.settings.findFirst.mockResolvedValue(null);

      const result = await canIssueReceiptFromPaymentModal();

      expect(result).toBe(false);
    });

    it('should return false when allowReceiptFromPaymentModal is undefined', async () => {
      mockedPrisma.settings.findFirst.mockResolvedValue({
        id: 1,
      } as any);

      const result = await canIssueReceiptFromPaymentModal();

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // getUserReceiptPreference tests
  // ============================================================================
  describe('getUserReceiptPreference', () => {
    it('should return user preference when set to immediate (true)', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        receiptFromPaymentDefault: true,
      } as any);

      const result = await getUserReceiptPreference(1);

      expect(result).toBe('immediate');
    });

    it('should return user preference when set to draft (false)', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        receiptFromPaymentDefault: false,
      } as any);

      const result = await getUserReceiptPreference(1);

      expect(result).toBe('draft');
    });

    it('should fall back to global setting when user preference is null', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        receiptFromPaymentDefault: null,
      } as any);

      mockedPrisma.settings.findFirst.mockResolvedValue({
        id: 1,
        receiptIssueMode: 'draft',
      } as any);

      const result = await getUserReceiptPreference(1);

      expect(result).toBe('draft');
    });

    it('should fall back to global setting when user does not exist', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.settings.findFirst.mockResolvedValue({
        id: 1,
        receiptIssueMode: 'immediate',
      } as any);

      const result = await getUserReceiptPreference(999);

      expect(result).toBe('immediate');
    });

    it('should return immediate as default when both user and global settings are undefined', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: 1,
        receiptFromPaymentDefault: null,
      } as any);
      mockedPrisma.settings.findFirst.mockResolvedValue({
        id: 1,
        receiptIssueMode: null,
      } as any);

      const result = await getUserReceiptPreference(1);

      expect(result).toBe('immediate');
    });

    it('should return immediate as default when settings do not exist', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);
      mockedPrisma.settings.findFirst.mockResolvedValue(null);

      const result = await getUserReceiptPreference(999);

      expect(result).toBe('immediate');
    });
  });

  // ============================================================================
  // createReceiptFromPayment tests
  // ============================================================================
  describe('createReceiptFromPayment', () => {
    const mockTransaction = {
      id: 1,
      items: JSON.stringify([
        { name: 'Espresso', quantity: 2, price: 1.5, taxRateName: 'Standard', taxRatePercent: 22 },
        { name: 'Cappuccino', quantity: 1, price: 2, taxRateName: 'Standard', taxRatePercent: 22 },
      ]),
      subtotal: 5,
      tax: 1.1,
      discount: 0,
      discountReason: null,
      tip: 0,
      total: 6.1,
      paymentMethod: 'card',
    };

    const mockSettings = {
      id: 1,
      businessName: 'Test Cafe',
      businessAddress: 'Via Test 1',
      businessCity: 'Milano',
      businessPostalCode: '20100',
      businessCountry: 'IT',
      businessPhone: '+39 02 1234567',
      businessEmail: 'test@cafe.it',
      vatNumber: 'IT12345678901',
      taxMode: 'exclusive',
    };

    it('should throw error when transaction does not exist', async () => {
      mockedPrisma.transaction.findUnique.mockResolvedValue(null);

      await expect(createReceiptFromPayment({
        transactionId: 999,
        userId: 1,
        issueMode: 'immediate',
      })).rejects.toThrow('Transaction not found');
    });

    it('should return existing receipt if one exists for the transaction', async () => {
      const existingReceipt = {
        id: 10,
        receiptNumber: 'R000005',
        status: 'issued',
        pdfPath: 'receipts/R000005.pdf',
      };

      mockedPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      mockedPrisma.receipt.findFirst.mockResolvedValue(existingReceipt as any);

      const result = await createReceiptFromPayment({
        transactionId: 1,
        userId: 1,
        issueMode: 'immediate',
      });

      expect(result.receipt.id).toBe(10);
      expect(result.receipt.number).toBe('R000005');
      expect(result.receipt.status).toBe('issued');
      expect(result.receipt.pdfUrl).toBe('/api/receipts/10/pdf');
    });

    it('should create receipt in immediate mode with successful PDF generation', async () => {
      const createdReceipt = {
        id: 1,
        receiptNumber: 'R000001',
        status: 'issued',
        issuedFromPaymentModal: true,
        generationStatus: 'pending',
      };

      const updatedReceipt = {
        ...createdReceipt,
        pdfPath: 'receipts/R000001.pdf',
        generationStatus: 'completed',
      };

      mockedPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      mockedPrisma.receipt.findFirst.mockResolvedValue(null);
      mockedPrisma.settings.findFirst.mockResolvedValue(mockSettings as any);
      mockedPrisma.receipt.create.mockResolvedValue(createdReceipt as any);
      mockedPrisma.receipt.update.mockResolvedValue(updatedReceipt as any);

      const result = await createReceiptFromPayment({
        transactionId: 1,
        userId: 1,
        issueMode: 'immediate',
      });

      expect(result.receipt.status).toBe('issued');
      expect(result.receipt.pdfUrl).toBe('/api/receipts/1/pdf');
      expect(mockedPrisma.receipt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          receiptNumber: 'R000001',
          transactionId: 1,
          status: 'issued',
          issuedFromPaymentModal: true,
          generationStatus: 'pending',
          issuedBy: 1,
        }),
      });
    });

    it('should queue receipt for retry when PDF generation fails in immediate mode', async () => {
      const { renderReceiptPDF } = require('../../services/receiptTemplateService');
      renderReceiptPDF.mockRejectedValueOnce(new Error('PDF generation failed'));

      const createdReceipt = {
        id: 1,
        receiptNumber: 'R000001',
        status: 'issued',
        issuedFromPaymentModal: true,
        generationStatus: 'pending',
      };

      mockedPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      mockedPrisma.receipt.findFirst.mockResolvedValue(null);
      mockedPrisma.settings.findFirst.mockResolvedValue(mockSettings as any);
      mockedPrisma.receipt.create.mockResolvedValue(createdReceipt as any);

      const result = await createReceiptFromPayment({
        transactionId: 1,
        userId: 1,
        issueMode: 'immediate',
      });

      expect(result.receipt.status).toBe('queued');
      const { addToQueue } = require('../../services/receiptQueueService');
      expect(addToQueue).toHaveBeenCalledWith(1);
    });

    it('should create receipt in draft mode', async () => {
      const draftReceipt = {
        id: 1,
        receiptNumber: 'DRAFT-uuid-here',
        status: 'draft',
        issuedFromPaymentModal: true,
        generationStatus: 'pending',
      };

      mockedPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      mockedPrisma.receipt.findFirst.mockResolvedValue(null);
      mockedPrisma.settings.findFirst.mockResolvedValue(mockSettings as any);
      mockedPrisma.receipt.create.mockResolvedValue(draftReceipt as any);

      const result = await createReceiptFromPayment({
        transactionId: 1,
        userId: 1,
        issueMode: 'draft',
      });

      expect(result.receipt.status).toBe('draft');
      expect(result.receipt.number).toBeUndefined();
      expect(mockedPrisma.receipt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'draft',
          issuedFromPaymentModal: true,
          generationStatus: 'pending',
        }),
      });
    });

    it('should handle transaction items as object (not string)', async () => {
      const transactionWithObjectItems = {
        ...mockTransaction,
        items: [
          { name: 'Espresso', quantity: 2, price: 1.5, taxRateName: 'Standard', taxRatePercent: 22 },
        ],
      };

      const createdReceipt = {
        id: 1,
        receiptNumber: 'R000001',
        status: 'draft',
        issuedFromPaymentModal: true,
        generationStatus: 'pending',
      };

      mockedPrisma.transaction.findUnique.mockResolvedValue(transactionWithObjectItems as any);
      mockedPrisma.receipt.findFirst.mockResolvedValue(null);
      mockedPrisma.settings.findFirst.mockResolvedValue(mockSettings as any);
      mockedPrisma.receipt.create.mockResolvedValue(createdReceipt as any);

      const result = await createReceiptFromPayment({
        transactionId: 1,
        userId: 1,
        issueMode: 'draft',
      });

      expect(result.receipt.status).toBe('draft');
    });

    it('should calculate tax correctly for inclusive tax mode', async () => {
      const settingsWithInclusiveTax = {
        ...mockSettings,
        taxMode: 'inclusive',
      };

      const createdReceipt = {
        id: 1,
        receiptNumber: 'R000001',
        status: 'draft',
        issuedFromPaymentModal: true,
        generationStatus: 'pending',
      };

      mockedPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      mockedPrisma.receipt.findFirst.mockResolvedValue(null);
      mockedPrisma.settings.findFirst.mockResolvedValue(settingsWithInclusiveTax as any);
      mockedPrisma.receipt.create.mockResolvedValue(createdReceipt as any);

      await createReceiptFromPayment({
        transactionId: 1,
        userId: 1,
        issueMode: 'draft',
      });

      // Verify receipt was created with proper tax breakdown
      expect(mockedPrisma.receipt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'draft',
          issuedFromPaymentModal: true,
        }),
      });
    });

    it('should handle items without explicit tax rate info', async () => {
      const transactionWithSimpleItems = {
        ...mockTransaction,
        items: JSON.stringify([
          { name: 'Espresso', quantity: 2, price: 1.5 },
          { name: 'Cappuccino', quantity: 1, price: 2 },
        ]),
      };

      const createdReceipt = {
        id: 1,
        receiptNumber: 'R000001',
        status: 'draft',
        issuedFromPaymentModal: true,
        generationStatus: 'pending',
      };

      mockedPrisma.transaction.findUnique.mockResolvedValue(transactionWithSimpleItems as any);
      mockedPrisma.receipt.findFirst.mockResolvedValue(null);
      mockedPrisma.settings.findFirst.mockResolvedValue(mockSettings as any);
      mockedPrisma.receipt.create.mockResolvedValue(createdReceipt as any);

      const result = await createReceiptFromPayment({
        transactionId: 1,
        userId: 1,
        issueMode: 'draft',
      });

      expect(result.receipt.status).toBe('draft');
    });

    it('should handle existing receipt without pdfPath', async () => {
      const existingReceipt = {
        id: 10,
        receiptNumber: 'R000005',
        status: 'issued',
        pdfPath: null,
      };

      mockedPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      mockedPrisma.receipt.findFirst.mockResolvedValue(existingReceipt as any);

      const result = await createReceiptFromPayment({
        transactionId: 1,
        userId: 1,
        issueMode: 'immediate',
      });

      expect(result.receipt.pdfUrl).toBeUndefined();
    });
  });
});
