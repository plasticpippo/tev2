import { prisma } from '../prisma';

const BACKOFF_DELAYS = [
  1 * 60 * 1000,
  5 * 60 * 1000,
  15 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
];

export interface ReceiptGenerationQueueEntry {
  id: number;
  receiptId: number;
  status: string;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function addToQueue(receiptId: number): Promise<ReceiptGenerationQueueEntry> {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt) {
    throw new Error('Receipt not found');
  }

  const existingEntry = await prisma.receiptGenerationQueue.findUnique({
    where: { receiptId },
  });

  if (existingEntry) {
    return existingEntry;
  }

  const queueEntry = await prisma.receiptGenerationQueue.create({
    data: {
      receiptId,
      status: 'pending',
      nextAttemptAt: new Date(),
    },
  });

  return queueEntry;
}

export async function getNextPending(): Promise<ReceiptGenerationQueueEntry | null> {
  const queueEntry = await prisma.receiptGenerationQueue.findFirst({
    where: {
      status: 'pending',
      nextAttemptAt: { lte: new Date() },
    },
    orderBy: {
      nextAttemptAt: 'asc',
    },
  });

  return queueEntry;
}

export async function markProcessing(queueId: number): Promise<ReceiptGenerationQueueEntry | null> {
  const queueEntry = await prisma.receiptGenerationQueue.findUnique({
    where: { id: queueId },
  });

  if (!queueEntry) {
    return null;
  }

  const updatedEntry = await prisma.receiptGenerationQueue.update({
    where: { id: queueId },
    data: {
      status: 'processing',
    },
  });

  return updatedEntry;
}

export async function markCompleted(queueId: number): Promise<ReceiptGenerationQueueEntry | null> {
  const queueEntry = await prisma.receiptGenerationQueue.findUnique({
    where: { id: queueId },
  });

  if (!queueEntry) {
    return null;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedEntry = await tx.receiptGenerationQueue.update({
      where: { id: queueId },
      data: {
        status: 'completed',
      },
    });

    await tx.receipt.update({
      where: { id: updatedEntry.receiptId },
      data: {
        generationStatus: 'completed',
      },
    });

    return updatedEntry;
  });

  return result;
}

export async function markFailed(queueId: number, error: string): Promise<ReceiptGenerationQueueEntry | null> {
  const queueEntry = await prisma.receiptGenerationQueue.findUnique({
    where: { id: queueId },
  });

  if (!queueEntry) {
    return null;
  }

  const newAttempts = queueEntry.attempts + 1;
  const maxAttempts = queueEntry.maxAttempts;

  if (newAttempts >= maxAttempts) {
    const result = await prisma.$transaction(async (tx) => {
      const updatedEntry = await tx.receiptGenerationQueue.update({
        where: { id: queueId },
        data: {
          status: 'failed',
          attempts: newAttempts,
          lastError: error,
        },
      });

      await tx.receipt.update({
        where: { id: updatedEntry.receiptId },
        data: {
          generationStatus: 'failed',
          generationAttempts: newAttempts,
          lastGenerationAttempt: new Date(),
          generationError: error,
        },
      });

      return updatedEntry;
    });

    return result;
  }

  const backoffIndex = Math.min(newAttempts - 1, BACKOFF_DELAYS.length - 1);
  const nextAttemptAt = new Date(Date.now() + BACKOFF_DELAYS[backoffIndex]);

  const result = await prisma.$transaction(async (tx) => {
    const updatedEntry = await tx.receiptGenerationQueue.update({
      where: { id: queueId },
      data: {
        status: 'pending',
        attempts: newAttempts,
        nextAttemptAt,
        lastError: error,
      },
    });

    await tx.receipt.update({
      where: { id: updatedEntry.receiptId },
      data: {
        generationAttempts: newAttempts,
        lastGenerationAttempt: new Date(),
        generationError: error,
      },
    });

    return updatedEntry;
  });

  return result;
}

export const receiptQueueService = {
  addToQueue,
  getNextPending,
  markProcessing,
  markCompleted,
  markFailed,
};
