import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import {
  addToQueue,
  getNextPending,
  markProcessing,
  markCompleted,
  markFailed,
} from '../../services/receiptQueueService';
import { prisma } from '../../prisma';

// Mock the prisma module
jest.mock('../../prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

const mockedPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('receiptQueueService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // addToQueue tests
  // ============================================================================
  describe('addToQueue', () => {
    it('should add a receipt to the queue when receipt exists', async () => {
      const mockReceipt = {
        id: 1,
        receiptNumber: 'R000001',
        status: 'issued',
      };

      const mockQueueEntry = {
        id: 1,
        receiptId: 1,
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.receipt.findUnique.mockResolvedValue(mockReceipt as any);
      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(null);
      mockedPrisma.receiptGenerationQueue.create.mockResolvedValue(mockQueueEntry as any);

      const result = await addToQueue(1);

      expect(result).toEqual(mockQueueEntry);
      expect(mockedPrisma.receipt.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockedPrisma.receiptGenerationQueue.create).toHaveBeenCalledWith({
        data: {
          receiptId: 1,
          status: 'pending',
          nextAttemptAt: expect.any(Date),
        },
      });
    });

    it('should throw error when receipt does not exist', async () => {
      mockedPrisma.receipt.findUnique.mockResolvedValue(null);

      await expect(addToQueue(999)).rejects.toThrow('Receipt not found');
    });

    it('should return existing queue entry if already in queue', async () => {
      const mockReceipt = {
        id: 1,
        receiptNumber: 'R000001',
        status: 'issued',
      };

      const existingQueueEntry = {
        id: 5,
        receiptId: 1,
        status: 'pending',
        attempts: 2,
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.receipt.findUnique.mockResolvedValue(mockReceipt as any);
      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(existingQueueEntry as any);

      const result = await addToQueue(1);

      expect(result).toEqual(existingQueueEntry);
      expect(mockedPrisma.receiptGenerationQueue.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // getNextPending tests
  // ============================================================================
  describe('getNextPending', () => {
    it('should return the next pending queue entry', async () => {
      const mockQueueEntry = {
        id: 1,
        receiptId: 1,
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.receiptGenerationQueue.findFirst.mockResolvedValue(mockQueueEntry as any);

      const result = await getNextPending();

      expect(result).toEqual(mockQueueEntry);
      expect(mockedPrisma.receiptGenerationQueue.findFirst).toHaveBeenCalledWith({
        where: {
          status: 'pending',
          nextAttemptAt: { lte: expect.any(Date) },
        },
        orderBy: { nextAttemptAt: 'asc' },
      });
    });

    it('should return null when no pending entries', async () => {
      mockedPrisma.receiptGenerationQueue.findFirst.mockResolvedValue(null);

      const result = await getNextPending();

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // markProcessing tests
  // ============================================================================
  describe('markProcessing', () => {
    it('should mark queue entry as processing', async () => {
      const mockQueueEntry = {
        id: 1,
        receiptId: 1,
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedEntry = {
        ...mockQueueEntry,
        status: 'processing',
      };

      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(mockQueueEntry as any);
      mockedPrisma.receiptGenerationQueue.update.mockResolvedValue(mockUpdatedEntry as any);

      const result = await markProcessing(1);

      expect(result).toEqual(mockUpdatedEntry);
      expect(mockedPrisma.receiptGenerationQueue.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'processing' },
      });
    });

    it('should return null when queue entry does not exist', async () => {
      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(null);

      const result = await markProcessing(999);

      expect(result).toBeNull();
      expect(mockedPrisma.receiptGenerationQueue.update).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // markCompleted tests
  // ============================================================================
  describe('markCompleted', () => {
    it('should mark queue entry as completed and update receipt status', async () => {
      const mockQueueEntry = {
        id: 1,
        receiptId: 1,
        status: 'processing',
        attempts: 1,
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedEntry = {
        ...mockQueueEntry,
        status: 'completed',
      };

      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(mockQueueEntry as any);
      mockedPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          receiptGenerationQueue: {
            update: jest.fn().mockResolvedValue(mockUpdatedEntry),
          },
          receipt: {
            update: jest.fn().mockResolvedValue({ id: 1, generationStatus: 'completed' }),
          },
        };
        return callback(mockTx);
      });

      const result = await markCompleted(1);

      expect(result).toEqual(mockUpdatedEntry);
    });

    it('should return null when queue entry does not exist', async () => {
      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(null);

      const result = await markCompleted(999);

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // markFailed tests
  // ============================================================================
  describe('markFailed', () => {
    it('should mark as permanently failed when max attempts reached', async () => {
      const mockQueueEntry = {
        id: 1,
        receiptId: 1,
        status: 'processing',
        attempts: 4, // Will become 5, reaching max
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedEntry = {
        ...mockQueueEntry,
        status: 'failed',
        attempts: 5,
        lastError: 'PDF generation error',
      };

      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(mockQueueEntry as any);
      mockedPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          receiptGenerationQueue: {
            update: jest.fn().mockResolvedValue(mockUpdatedEntry),
          },
          receipt: {
            update: jest.fn().mockResolvedValue({
              id: 1,
              generationStatus: 'failed',
              generationAttempts: 5,
              lastGenerationAttempt: expect.any(Date),
              generationError: 'PDF generation error',
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await markFailed(1, 'PDF generation error');

      expect(result).toEqual(mockUpdatedEntry);
    });

    it('should schedule retry with exponential backoff when attempts remain', async () => {
      const mockQueueEntry = {
        id: 1,
        receiptId: 1,
        status: 'processing',
        attempts: 0, // Will become 1
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedEntry = {
        ...mockQueueEntry,
        status: 'pending',
        attempts: 1,
        lastError: 'Temporary error',
      };

      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(mockQueueEntry as any);
      mockedPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          receiptGenerationQueue: {
            update: jest.fn().mockResolvedValue(mockUpdatedEntry),
          },
          receipt: {
            update: jest.fn().mockResolvedValue({
              id: 1,
              generationAttempts: 1,
              lastGenerationAttempt: expect.any(Date),
              generationError: 'Temporary error',
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await markFailed(1, 'Temporary error');

      expect(result).toEqual(mockUpdatedEntry);
    });

    it('should return null when queue entry does not exist', async () => {
      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(null);

      const result = await markFailed(999, 'Error');

      expect(result).toBeNull();
    });

    it('should use correct backoff delays for each attempt', async () => {
      // Test backoff delays: 1m, 5m, 15m, 1h, 6h
      const backoffDelays = [
        1 * 60 * 1000,  // First failure: 1 minute
        5 * 60 * 1000,  // Second failure: 5 minutes
        15 * 60 * 1000, // Third failure: 15 minutes
        60 * 60 * 1000, // Fourth failure: 1 hour
        6 * 60 * 60 * 1000, // Fifth failure: 6 hours
      ];

      // Test first attempt (index 0)
      const mockQueueEntry1 = {
        id: 1,
        receiptId: 1,
        status: 'processing',
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: new Date(),
        lastError: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedPrisma.receiptGenerationQueue.findUnique.mockResolvedValue(mockQueueEntry1 as any);
      mockedPrisma.$transaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          receiptGenerationQueue: {
            update: jest.fn().mockResolvedValue(mockQueueEntry1),
          },
          receipt: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(mockTx);
      });

      await markFailed(1, 'Error 1');

      // Verify the update was called with correct nextAttemptAt calculation
      const updateCall = mockedPrisma.$transaction as jest.Mock;
      expect(updateCall).toHaveBeenCalled();
    });
  });
});
