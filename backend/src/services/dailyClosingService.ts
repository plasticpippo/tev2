import type { Transaction, User, Till } from '../types';
import { prisma } from '../prisma';
import { addMoney, subtractMoney, roundMoney } from '../utils/money';

const VALID_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'other', 'split'] as const;

interface ClosingSummary {
  transactions: number;
  grossSales: number;      // Total before discounts
  totalDiscounts: number;  // Sum of all discounts
  netSales: number;        // grossSales - totalDiscounts (final total)
  totalTax: number;
  totalTips: number;
  paymentMethods: { [key: string]: { count: number; total: number } };
  tills: { [key: string]: { transactions: number; total: number } };
}

function normalizePaymentMethod(method: string | null | undefined): string {
  if (!method) return 'other';
  const normalized = method.toLowerCase();
  return VALID_PAYMENT_METHODS.includes(normalized as any) ? normalized : 'other';
}

function generateTillKey(tillId: string | number | null, tillName: string | null | undefined): string {
  const sanitizedId = String(tillId ?? 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
  const sanitizedName = String(tillName || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
  return `till_${sanitizedId}_${sanitizedName}`;
}

/**
 * Calculates the summary for a daily closing based on transactions
 * that occurred between the specified start and end times.
 */
export const calculateDailyClosingSummary = async (
  startDate: Date,
  endDate: Date
): Promise<ClosingSummary> => {
  // Get all transactions within the specified date range
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lt: endDate
      }
    }
  });

  // Initialize the summary object
  const summary: ClosingSummary = {
    transactions: 0,
    grossSales: 0,
    totalDiscounts: 0,
    netSales: 0,
    totalTax: 0,
    totalTips: 0,
    paymentMethods: {},
    tills: {}
  };

  // Process each transaction to build the summary
  for (const transaction of transactions) {
    // Update basic totals
    summary.transactions++;
    
    // Track gross sales (total before discount)
    summary.grossSales = addMoney(summary.grossSales, transaction.total);
    
    // Track discounts
    summary.totalDiscounts = addMoney(summary.totalDiscounts, transaction.discount || 0);
    
    summary.totalTax = addMoney(summary.totalTax, transaction.tax);
    summary.totalTips = addMoney(summary.totalTips, transaction.tip);

    // Update payment method stats
    const normalizedPaymentMethod = normalizePaymentMethod(transaction.paymentMethod);
    if (!summary.paymentMethods[normalizedPaymentMethod]) {
      summary.paymentMethods[normalizedPaymentMethod] = {
        count: 0,
        total: 0
      };
    }
    summary.paymentMethods[normalizedPaymentMethod].count++;
    summary.paymentMethods[normalizedPaymentMethod].total = addMoney(
      summary.paymentMethods[normalizedPaymentMethod].total, 
      transaction.total
    );

    // Update till stats
    const tillKey = generateTillKey(transaction.tillId, transaction.tillName);
    if (!summary.tills[tillKey]) {
      summary.tills[tillKey] = {
        transactions: 0,
        total: 0
      };
    }
    summary.tills[tillKey].transactions++;
    summary.tills[tillKey].total = addMoney(summary.tills[tillKey].total, transaction.total);
  }

  // Calculate net sales (gross - discounts)
  summary.netSales = subtractMoney(summary.grossSales, summary.totalDiscounts);

  return summary;
};

/**
 * Creates a daily closing record with the calculated summary
 */
export const createDailyClosing = async (
  closedAt: Date,
  userId: number,
  startDate?: Date
): Promise<number> => {
  // If startDate is not provided, use the beginning of the day
  const summaryStartDate = startDate || new Date(closedAt);
  if (!startDate) {
    summaryStartDate.setHours(0, 0, 0, 0);
  }

  // Calculate the summary for transactions since the start date
  const summary = await calculateDailyClosingSummary(summaryStartDate, closedAt);

  // Create the daily closing record
  const dailyClosing = await prisma.dailyClosing.create({
    data: {
      closedAt,
      summary: summary as any, // Type assertion to handle JSON serialization
      userId
    }
  });

  return dailyClosing.id;
};
