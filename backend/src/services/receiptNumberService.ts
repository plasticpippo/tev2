import { prisma } from '../prisma';
import { Settings } from '@prisma/client';

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

const RECEIPT_NUMBER_LOCK_ID = 12345;

interface ReceiptNumberConfig {
  prefix: string;
  numberLength: number;
  startNumber: number;
  sequenceYear: boolean;
  currentYear: number | null;
  currentNumber: number;
}

async function getReceiptConfig(): Promise<ReceiptNumberConfig> {
  const settings = await prisma.settings.findFirst();
  
  if (!settings) {
    return {
      prefix: 'R',
      numberLength: 6,
      startNumber: 1,
      sequenceYear: false,
      currentYear: null,
      currentNumber: 0,
    };
  }
  
  return {
    prefix: settings.receiptPrefix,
    numberLength: settings.receiptNumberLength,
    startNumber: settings.receiptStartNumber,
    sequenceYear: settings.receiptSequenceYear,
    currentYear: settings.receiptCurrentYear,
    currentNumber: settings.receiptCurrentNumber,
  };
}

function formatReceiptNumber(prefix: string, number: number, length: number): string {
  const paddedNumber = number.toString().padStart(length, '0');
  return `${prefix}${paddedNumber}`;
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

async function generateNextReceiptNumberInternal(tx: TransactionClient): Promise<string> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${RECEIPT_NUMBER_LOCK_ID})`;

  const settings = await tx.settings.findFirst();

  if (!settings) {
    throw new Error('Settings not found');
  }

  const currentYear = getCurrentYear();
  let nextNumber: number;
  let updateData: Partial<Settings> = {};

  if (settings.receiptSequenceYear) {
    if (settings.receiptCurrentYear !== currentYear) {
      nextNumber = settings.receiptStartNumber;
      updateData = {
        receiptCurrentYear: currentYear,
        receiptCurrentNumber: nextNumber,
      };
    } else {
      nextNumber = settings.receiptCurrentNumber + 1;
      updateData = {
        receiptCurrentNumber: nextNumber,
      };
    }
  } else {
    nextNumber = settings.receiptCurrentNumber + 1;
    updateData = {
      receiptCurrentNumber: nextNumber,
    };

    if (settings.receiptCurrentYear !== currentYear) {
      updateData.receiptCurrentYear = currentYear;
    }
  }

  await tx.settings.update({
    where: { id: settings.id },
    data: updateData,
  });

  return formatReceiptNumber(settings.receiptPrefix, nextNumber, settings.receiptNumberLength);
}

export async function generateNextReceiptNumber(): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    return generateNextReceiptNumberInternal(tx);
  });
}

export async function generateNextReceiptNumberWithTx(tx: TransactionClient): Promise<string> {
  return await generateNextReceiptNumberInternal(tx);
}

export async function peekNextReceiptNumber(): Promise<string> {
  const config = await getReceiptConfig();
  const currentYear = getCurrentYear();
  
  let nextNumber: number;
  
  if (config.sequenceYear) {
    if (config.currentYear !== currentYear) {
      nextNumber = config.startNumber;
    } else {
      nextNumber = config.currentNumber + 1;
    }
  } else {
    nextNumber = config.currentNumber + 1;
  }
  
  return formatReceiptNumber(config.prefix, nextNumber, config.numberLength);
}

export async function initializeReceiptSequence(): Promise<void> {
  const settings = await prisma.settings.findFirst();
  
  if (!settings) {
    return;
  }
  
  if (settings.receiptCurrentYear === null) {
    await prisma.settings.update({
      where: { id: settings.id },
      data: {
        receiptCurrentYear: getCurrentYear(),
      },
    });
  }
}
