import type { Transaction, User, Till } from '../types';
import { prisma } from '../prisma';

// Import Prisma types for type checking
// Remove the import since it's not available

interface ClosingSummary {
  transactions: number;
  totalSales: number;
  totalTax: number;
  totalTips: number;
  paymentMethods: { [key: string]: { count: number; total: number } };
  tills: { [key: string]: { transactions: number; total: number } };
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
    totalSales: 0,
    totalTax: 0,
    totalTips: 0,
    paymentMethods: {},
    tills: {}
  };

  // Process each transaction to build the summary
 for (const transaction of transactions) {
    // Update basic totals
    summary.transactions++;
    summary.totalSales += transaction.total;
    summary.totalTax += transaction.tax;
    summary.totalTips += transaction.tip;

    // Update payment method stats
    if (!summary.paymentMethods[transaction.paymentMethod]) {
      summary.paymentMethods[transaction.paymentMethod] = {
        count: 0,
        total: 0
      };
    }
    summary.paymentMethods[transaction.paymentMethod].count++;
    summary.paymentMethods[transaction.paymentMethod].total += transaction.total;

    // Update till stats
    const tillKey = `${transaction.tillId}-${transaction.tillName}`;
    if (!summary.tills[tillKey]) {
      summary.tills[tillKey] = {
        transactions: 0,
        total: 0
      };
    }
    summary.tills[tillKey].transactions++;
    summary.tills[tillKey].total += transaction.total;
  }

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