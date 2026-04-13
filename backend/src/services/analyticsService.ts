import { prisma } from '../prisma';
import { AnalyticsParams } from '../utils/validation';
import { OrderItem } from '../types';
import { getBusinessDayRange, parseTimeString, getHoursInBusinessDay } from '../utils/businessDay';
import { addMoney, roundMoney, divideMoney, multiplyMoney, subtractMoney, decimalToNumber } from '../utils/money';
import { Product, Category, Transaction } from '@prisma/client';

interface ProductPerformance {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  transactionCount: number;
}

interface ProductPerformanceResult {
  products: ProductPerformance[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalRevenue: number;
    totalUnitsSold: number;
    topProduct: {
      name: string;
      revenue: number;
      quantity: number;
    } | null;
  };
}

/**
 * Aggregates product performance data based on the provided parameters
 */
export const aggregateProductPerformance = async (
  params: AnalyticsParams
): Promise<ProductPerformanceResult> => {
  const {
    startDate,
    endDate,
    startTime,
    endTime,
    productId,
    categoryId,
    sortBy = 'revenue',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
    includeAllProducts = true,
  } = params;

  // Build where clause for filtering transactions
  const whereClause: any = {};

  // Add date range filter if provided
  if (startDate || endDate) {
    whereClause.createdAt = {};
    
    if (startDate) {
      // Check if startTime contains a datetime (YYYY-MM-DDTHH:MM format)
      // The startTime param is the full datetime string if provided
      if (startTime && startTime.includes('T')) {
        // Use exact datetime from startTime parameter
        whereClause.createdAt.gte = new Date(startTime);
      } else {
        // Date-only: use start of day (00:00:00)
        whereClause.createdAt.gte = new Date(`${startDate}T00:00:00`);
      }
    }
    
    if (endDate) {
      // Check if endTime contains a datetime (YYYY-MM-DDTHH:MM format)
      // The endTime param is the full datetime string if provided
      if (endTime && endTime.includes('T')) {
        // Use exact datetime from endTime parameter (add 59 seconds for inclusive end)
        const endDateTime = new Date(endTime);
        endDateTime.setSeconds(59);
        endDateTime.setMilliseconds(999);
        whereClause.createdAt.lte = endDateTime;
      } else {
        // Date-only: use end of day (23:59:59.999)
        const endDateTime = new Date(`${endDate}T23:59:59.999`);
        whereClause.createdAt.lte = endDateTime;
      }
    }
  } else if (startTime && startTime.includes('T')) {
    // Handle case where only time parameters are provided without dates
    whereClause.createdAt = {};
    whereClause.createdAt.gte = new Date(startTime);
    
    if (endTime && endTime.includes('T')) {
      const endDateTime = new Date(endTime);
      endDateTime.setSeconds(59);
      endDateTime.setMilliseconds(999);
      whereClause.createdAt.lte = endDateTime;
    }
  } else if (endTime && endTime.includes('T')) {
    // Handle case where only endTime is provided
    whereClause.createdAt = {};
    whereClause.createdAt.lte = new Date(endTime);
  }

  // Exclude voided transactions from analytics
  whereClause.status = { not: 'voided' };

  // Get all transactions that match the criteria
  const transactions = await prisma.transaction.findMany({
    where: whereClause,
  });

  // Extract products and categories to map product IDs to names and categories
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
  });

  // Create a map of product data for quick lookup
  const productMap = new Map<number, { name: string; categoryId: number; categoryName: string }>();
  products.forEach((product: Product & { category: Category | null }) => {
    productMap.set(product.id, {
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.category?.name || 'Uncategorized',
    });
  });

  // Group transaction items by product and calculate metrics
  const productMetricsMap = new Map<number, ProductPerformance>();

  for (const transaction of transactions) {
    // Safely parse the JSON items from the transaction
    let items: any[] = [];
    if (Array.isArray(transaction.items)) {
      // If it's already an array, use it directly
      items = transaction.items as any;
    } else if (typeof transaction.items === 'string') {
      // If it's a string, parse it
      try {
        const parsed = JSON.parse(transaction.items);
        if (Array.isArray(parsed)) {
          items = parsed;
        }
      } catch (e) {
        console.error('Error parsing transaction items:', e);
        continue;
      }
    } else if (typeof transaction.items === 'object' && transaction.items !== null) {
      // If it's already a JSON object (Prisma handles JSON differently based on the driver)
      items = (transaction.items as unknown) as any[];
    }

    for (const item of items) {
      // Skip if item doesn't have the required structure
      if (!item.productId || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        continue;
      }

      const prodId = item.productId;
      
      // Get product info from our map
      const productInfo = productMap.get(prodId);
      if (!productInfo) {
        continue; // Skip if product doesn't exist
      }
      
      if (!productMetricsMap.has(prodId)) {
        productMetricsMap.set(prodId, {
          id: prodId,
          name: productInfo.name,
          categoryId: productInfo.categoryId,
          categoryName: productInfo.categoryName,
          totalQuantity: 0,
          totalRevenue: 0,
          averagePrice: 0,
          transactionCount: 0,
        });
      }

      const productMetrics = productMetricsMap.get(prodId)!;
      productMetrics.totalQuantity += item.quantity;
      productMetrics.totalRevenue = addMoney(productMetrics.totalRevenue, multiplyMoney(item.price, item.quantity)); // Use price * quantity for revenue
      productMetrics.transactionCount += 1;
    }
  }

  // Convert map to array and filter by category if specified
  let productMetricsArray = Array.from(productMetricsMap.values());

  if (categoryId) {
    productMetricsArray = productMetricsArray.filter(p => p.categoryId === categoryId);
  }

  if (productId) {
    productMetricsArray = productMetricsArray.filter(p => p.id === productId);
  }

  // Calculate average price for each product
  productMetricsArray.forEach(product => {
    if (product.totalQuantity > 0) {
      product.averagePrice = roundMoney(divideMoney(product.totalRevenue, product.totalQuantity));
    }
  });

  // Apply sorting
  productMetricsArray.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'revenue':
        comparison = a.totalRevenue - b.totalRevenue;
        break;
      case 'quantity':
        comparison = a.totalQuantity - b.totalQuantity;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }
    
    // Apply sort order
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Calculate totals for summary
  const totalRevenue = roundMoney(productMetricsArray.reduce((sum, product) => addMoney(sum, product.totalRevenue), 0));
  const totalUnitsSold = productMetricsArray.reduce((sum, product) => sum + product.totalQuantity, 0);
  
  // Find top product (with bounds checking)
  const topProduct = productMetricsArray.length > 0 && productMetricsArray[0]
    ? {
        name: productMetricsArray[0].name,
        revenue: productMetricsArray[0].totalRevenue,
        quantity: productMetricsArray[0].totalQuantity,
      }
    : null;

  // Apply pagination if needed
  const totalCount = productMetricsArray.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  let paginatedProducts = productMetricsArray.slice(startIndex, endIndex);

  // If includeAllProducts is false, limit to top 5 for backward compatibility
  if (!includeAllProducts) {
    paginatedProducts = productMetricsArray.slice(0, 5);
  }

  const totalPages = Math.ceil(totalCount / limit);

  return {
    products: paginatedProducts,
    metadata: {
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: endIndex < totalCount,
      hasPrevPage: startIndex > 0,
    },
    summary: {
      totalRevenue,
      totalUnitsSold,
      topProduct,
    },
  };
};

// ============================================================================
// HOURLY SALES AGGREGATION
// ============================================================================

export interface HourlyDataPoint {
  hour: string;           // Format: "HH:00"
  total: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface HourlySalesResult {
  date: string;
  businessDayStart: Date;
  businessDayEnd: Date;
  hourlyData: HourlyDataPoint[];
  summary: {
    totalSales: number;
    totalTransactions: number;
    peakHour: string;
    peakHourTotal: number;
    averageHourly: number;
  };
}

export interface ComparisonResult {
  period1: HourlySalesResult;
  period2: HourlySalesResult;
  comparison: {
    hourlyDifferences: {
      hour: string;
      difference: number;
      percentChange: number;
    }[];
    summaryDifference: {
      totalSalesDifference: number;
      totalSalesPercentChange: number;
      transactionCountDifference: number;
      transactionCountPercentChange: number;
    };
  };
}

interface SettingsConfig {
  autoStartTime: string;
  businessDayEndHour?: string;
}

/**
 * Safely calculates percentage change with guards against division by zero and invalid values
 */
function safePercentage(value: number, total: number): number {
  if (total === 0 || !isFinite(total) || !isFinite(value)) {
    return value > 0 ? 100 : 0;
  }
  return roundMoney(multiplyMoney(divideMoney(value, total), 100));
}

/**
 * Aggregates hourly sales data for a specific business day
 */
export const aggregateHourlySales = async (
  date: string,  // ISO date string "YYYY-MM-DD"
  settings: SettingsConfig
): Promise<HourlySalesResult> => {
  // Get business day range
  const targetDate = new Date(date);
  const { start, end } = getBusinessDayRange(targetDate, {
    autoStartTime: settings.autoStartTime,
    businessDayEndHour: settings.businessDayEndHour,
  });
  
  // Fetch transactions within the business day (excluding voided)
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      status: {
        not: 'voided',
      },
    },
  });
  
  // Get start hour and calculate hours in business day
  const { hours: startHours, minutes: startMinutes } = parseTimeString(settings.autoStartTime);
  const hoursInDay = getHoursInBusinessDay(
    settings.autoStartTime, 
    settings.businessDayEndHour
  );
  
  // Initialize hourly buckets
  const hourlyBuckets: Map<string, { total: number; count: number }> = new Map();
  for (let i = 0; i < hoursInDay; i++) {
    const hour = (startHours + i) % 24;
    const label = `${hour.toString().padStart(2, '0')}:00`;
    hourlyBuckets.set(label, { total: 0, count: 0 });
  }
  
  // Aggregate transactions into hourly buckets
  let totalSales = 0;
  let totalTransactions = 0;

  for (const transaction of transactions) {
    const transactionDate = new Date(transaction.createdAt);
    const transactionHour = transactionDate.getHours();

    // Calculate which hour bucket this belongs to
    let hoursSinceStart = transactionHour - startHours;
    if (hoursSinceStart < 0) {
      hoursSinceStart += 24; // Crosses midnight
    }

    const bucketHour = (startHours + hoursSinceStart) % 24;
    const label = `${bucketHour.toString().padStart(2, '0')}:00`;

    // Convert Decimal fields to numbers for calculations
    const txTotal = decimalToNumber(transaction.total);
    const txSubtotal = decimalToNumber(transaction.subtotal);
    const txTax = decimalToNumber(transaction.tax);
    const txTip = decimalToNumber(transaction.tip);
    const txDiscount = decimalToNumber(transaction.discount);

    // For complimentary orders (total is 0 but discount > 0), use pre-discount amount for gross sales
    // This ensures analytics shows actual money in till (0) while tracking the full value of items given
    const isComplimentary = transaction.status === 'complimentary' || (txTotal === 0 && txDiscount > 0);
    const grossAmount = isComplimentary
      ? addMoney(addMoney(txSubtotal, txTax), txTip) // Pre-discount total for complimentary
      : txTotal; // Regular orders use actual total

    const bucket = hourlyBuckets.get(label);
    if (bucket) {
      bucket.total = addMoney(bucket.total, grossAmount);
      bucket.count += 1;
    }

    totalSales = addMoney(totalSales, grossAmount);
    totalTransactions += 1;
  }
  
  // Convert to array and calculate summary
  const hourlyData: HourlyDataPoint[] = [];
  let peakHour = '';
  let peakHourTotal = 0;
  
  for (const [hour, data] of hourlyBuckets) {
    hourlyData.push({
      hour,
      total: roundMoney(data.total),
      transactionCount: data.count,
      averageTransaction: data.count > 0 ? roundMoney(divideMoney(data.total, data.count)) : 0,
    });
    
    if (data.total > peakHourTotal) {
      peakHour = hour;
      peakHourTotal = data.total;
    }
  }
  
  return {
    date,
    businessDayStart: start,
    businessDayEnd: end,
    hourlyData,
    summary: {
      totalSales: roundMoney(totalSales),
      totalTransactions,
      peakHour,
      peakHourTotal,
      averageHourly: roundMoney(divideMoney(totalSales, hoursInDay)),
    },
  };
};

/**
 * Compares hourly sales between two business days
 */
export const compareHourlySales = async (
  date1: string,
  date2: string,
  settings: SettingsConfig
): Promise<ComparisonResult> => {
  const [period1, period2] = await Promise.all([
    aggregateHourlySales(date1, settings),
    aggregateHourlySales(date2, settings),
  ]);
  
  // Calculate hourly differences
  const hourlyDifferences = period1.hourlyData.map((hour1, index) => {
    const hour2 = period2.hourlyData?.[index];
    if (!hour2) {
      return {
        hour: hour1.hour,
        difference: hour1.total,
        percentChange: hour1.total > 0 ? 100 : 0,
      };
    }
    const difference = subtractMoney(hour1.total, hour2.total);
    const percentChange = safePercentage(subtractMoney(hour1.total, hour2.total), hour2.total);
    
    return {
      hour: hour1.hour,
      difference: roundMoney(difference),
      percentChange,
    };
  });
  
  // Calculate summary differences
  const totalSalesDifference = roundMoney(subtractMoney(period1.summary.totalSales, period2.summary.totalSales));
  const totalSalesPercentChange = safePercentage(
    subtractMoney(period1.summary.totalSales, period2.summary.totalSales),
    period2.summary.totalSales
  );

  const transactionCountDifference = period1.summary.totalTransactions - period2.summary.totalTransactions;
  const transactionCountPercentChange = safePercentage(
    period1.summary.totalTransactions - period2.summary.totalTransactions,
    period2.summary.totalTransactions
  );
  
  return {
    period1,
    period2,
    comparison: {
      hourlyDifferences,
      summaryDifference: {
        totalSalesDifference,
        totalSalesPercentChange,
        transactionCountDifference,
        transactionCountPercentChange,
      },
    },
  };
};

// ============================================================================
// PROFIT ANALYTICS
// ============================================================================

export interface ProfitPeriod {
  start: string;
  end: string;
}

export interface ProfitSummary {
  period: ProfitPeriod;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  transactionCount: number;
  averageTransaction: number;
  averageMargin: number;
  transactionsWithCosts: number;
  costCoveragePercent: number;
}

export interface ProfitComparison {
  current: ProfitSummary;
  previous: ProfitSummary;
  changes: {
    revenueChange: number;
    revenueChangePercent: number;
    cogsChange: number;
    cogsChangePercent: number;
    grossProfitChange: number;
    grossProfitChangePercent: number;
    marginChangePp: number;
  };
}

export interface CategoryMargin {
  categoryId: number;
  categoryName: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  transactionCount: number;
  itemsSold: number;
}

export interface ProductMargin {
  productId: number;
  productName: string;
  variantId: number;
  variantName: string;
  categoryId: number;
  categoryName: string;
  revenue: number;
  cogs: number | null;
  grossProfit: number | null;
  marginPercent: number | null;
  quantitySold: number;
  hasCostData: boolean;
}

export interface MarginTrendPoint {
  date: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  transactionCount: number;
}

export interface ProfitDashboardData {
  summary: ProfitSummary;
  comparison: ProfitComparison | null;
  byCategory: CategoryMargin[];
  byProduct: ProductMargin[];
  trend: MarginTrendPoint[];
}

function parseTransactionItems(transaction: Transaction): any[] {
  let items: any[] = [];
  if (Array.isArray(transaction.items)) {
    items = transaction.items as any;
  } else if (typeof transaction.items === 'string') {
    try {
      const parsed = JSON.parse(transaction.items);
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    } catch (e) {
      console.error('Error parsing transaction items:', e);
    }
  } else if (typeof transaction.items === 'object' && transaction.items !== null) {
    items = (transaction.items as unknown) as any[];
  }
  return items;
}

function computePeriodDates(startDate: string, endDate: string): { start: Date; end: Date } {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);
  return { start, end };
}

function computePreviousPeriod(startDate: string, endDate: string): { prevStart: string; prevEnd: string } {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  return {
    prevStart: prevStart.toISOString().split('T')[0],
    prevEnd: prevEnd.toISOString().split('T')[0],
  };
}

export const getProfitSummary = async (
  startDate: string,
  endDate: string
): Promise<ProfitSummary> => {
  const { start, end } = computePeriodDates(startDate, endDate);

  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: 'completed',
    },
  });

  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalGrossProfit = 0;
  let totalTransactions = 0;
  let transactionsWithCosts = 0;
  let sumMarginsWithCosts = 0;

  for (const transaction of transactions) {
    const revenue = decimalToNumber(transaction.subtotal);
    const cost = transaction.totalCost ? decimalToNumber(transaction.totalCost) : 0;
    const hasCost = transaction.totalCost !== null && cost > 0;

    totalRevenue = addMoney(totalRevenue, revenue);
    totalCOGS = addMoney(totalCOGS, cost);
    totalTransactions += 1;

    if (hasCost) {
      transactionsWithCosts += 1;
      const margin = safePercentage(subtractMoney(revenue, cost), revenue);
      sumMarginsWithCosts = addMoney(sumMarginsWithCosts, margin);
    }

    totalTransactions += 0;
  }

  totalGrossProfit = subtractMoney(totalRevenue, totalCOGS);
  const marginPercent = totalRevenue > 0
    ? safePercentage(totalGrossProfit, totalRevenue)
    : 0;
  const averageTransaction = totalTransactions > 0
    ? roundMoney(divideMoney(totalRevenue, totalTransactions))
    : 0;
  const averageMargin = transactionsWithCosts > 0
    ? roundMoney(divideMoney(sumMarginsWithCosts, transactionsWithCosts))
    : 0;
  const costCoveragePercent = totalTransactions > 0
    ? roundMoney(multiplyMoney(divideMoney(transactionsWithCosts, totalTransactions), 100))
    : 0;

  return {
    period: { start: startDate, end: endDate },
    revenue: roundMoney(totalRevenue),
    cogs: roundMoney(totalCOGS),
    grossProfit: roundMoney(totalGrossProfit),
    marginPercent,
    transactionCount: totalTransactions,
    averageTransaction,
    averageMargin,
    transactionsWithCosts,
    costCoveragePercent,
  };
};

export const getProfitComparison = async (
  startDate: string,
  endDate: string
): Promise<ProfitComparison> => {
  const current = await getProfitSummary(startDate, endDate);
  const { prevStart, prevEnd } = computePreviousPeriod(startDate, endDate);
  const previous = await getProfitSummary(prevStart, prevEnd);

  const revenueChange = roundMoney(subtractMoney(current.revenue, previous.revenue));
  const revenueChangePercent = safePercentage(revenueChange, previous.revenue);
  const cogsChange = roundMoney(subtractMoney(current.cogs, previous.cogs));
  const cogsChangePercent = safePercentage(cogsChange, previous.cogs);
  const grossProfitChange = roundMoney(subtractMoney(current.grossProfit, previous.grossProfit));
  const grossProfitChangePercent = safePercentage(grossProfitChange, previous.grossProfit);
  const marginChangePp = roundMoney(subtractMoney(current.marginPercent, previous.marginPercent));

  return {
    current,
    previous,
    changes: {
      revenueChange,
      revenueChangePercent,
      cogsChange,
      cogsChangePercent,
      grossProfitChange,
      grossProfitChangePercent,
      marginChangePp,
    },
  };
};

export const getMarginByCategory = async (
  startDate: string,
  endDate: string
): Promise<CategoryMargin[]> => {
  const { start, end } = computePeriodDates(startDate, endDate);

  const [transactions, products] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'completed',
      },
    }),
    prisma.product.findMany({
      include: { category: true },
    }),
  ]);

  const productMap = new Map<number, { categoryId: number; categoryName: string }>();
  for (const product of products) {
    productMap.set(product.id, {
      categoryId: product.categoryId,
      categoryName: product.category?.name || 'Uncategorized',
    });
  }

  const categoryMap = new Map<number, {
    categoryId: number;
    categoryName: string;
    revenue: number;
    cogs: number;
    transactionCount: Set<number>;
    itemsSold: number;
  }>();

  for (const transaction of transactions) {
    const items = parseTransactionItems(transaction);
    const subtotal = decimalToNumber(transaction.subtotal);
    const txCost = transaction.totalCost ? decimalToNumber(transaction.totalCost) : 0;

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        continue;
      }

      const productInfo = productMap.get(item.productId);
      if (!productInfo) continue;

      const itemRevenue = multiplyMoney(item.price, item.quantity);
      let itemCogs = 0;
      if (txCost > 0 && subtotal > 0) {
        itemCogs = multiplyMoney(txCost, divideMoney(itemRevenue, subtotal));
      }

      if (!categoryMap.has(productInfo.categoryId)) {
        categoryMap.set(productInfo.categoryId, {
          categoryId: productInfo.categoryId,
          categoryName: productInfo.categoryName,
          revenue: 0,
          cogs: 0,
          transactionCount: new Set(),
          itemsSold: 0,
        });
      }

      const cat = categoryMap.get(productInfo.categoryId)!;
      cat.revenue = addMoney(cat.revenue, itemRevenue);
      cat.cogs = addMoney(cat.cogs, itemCogs);
      cat.transactionCount.add(transaction.id);
      cat.itemsSold += item.quantity;
    }
  }

  const results: CategoryMargin[] = [];
  for (const [, cat] of categoryMap) {
    const grossProfit = subtractMoney(cat.revenue, cat.cogs);
    results.push({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      revenue: roundMoney(cat.revenue),
      cogs: roundMoney(cat.cogs),
      grossProfit: roundMoney(grossProfit),
      marginPercent: cat.revenue > 0 ? safePercentage(grossProfit, cat.revenue) : 0,
      transactionCount: cat.transactionCount.size,
      itemsSold: cat.itemsSold,
    });
  }

  results.sort((a, b) => b.revenue - a.revenue);
  return results;
};

export const getMarginByProduct = async (
  startDate: string,
  endDate: string,
  limit?: number
): Promise<ProductMargin[]> => {
  const { start, end } = computePeriodDates(startDate, endDate);

  const [transactions, variants] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'completed',
      },
    }),
    prisma.productVariant.findMany({
      include: {
        product: {
          include: { category: true },
        },
      },
    }),
  ]);

  const variantMap = new Map<number, {
    productId: number;
    productName: string;
    variantName: string;
    categoryId: number;
    categoryName: string;
    theoreticalCost: number | null;
  }>();

  for (const variant of variants) {
    variantMap.set(variant.id, {
      productId: variant.productId,
      productName: variant.product?.name || 'Unknown',
      variantName: variant.name,
      categoryId: variant.product?.categoryId || 0,
      categoryName: variant.product?.category?.name || 'Uncategorized',
      theoreticalCost: variant.theoreticalCost ? decimalToNumber(variant.theoreticalCost) : null,
    });
  }

  const productMetricsMap = new Map<string, {
    productId: number;
    productName: string;
    variantId: number;
    variantName: string;
    categoryId: number;
    categoryName: string;
    revenue: number;
    cogs: number;
    quantitySold: number;
    hasCostData: boolean;
  }>();

  for (const transaction of transactions) {
    const items = parseTransactionItems(transaction);

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        continue;
      }

      const variantId: number = item.variantId ?? item.productId;
      const variantInfo = variantMap.get(variantId);
      if (!variantInfo) continue;

      const key = `${item.productId}_${variantId}`;

      if (!productMetricsMap.has(key)) {
        productMetricsMap.set(key, {
          productId: item.productId,
          productName: variantInfo.productName,
          variantId,
          variantName: variantInfo.variantName,
          categoryId: variantInfo.categoryId,
          categoryName: variantInfo.categoryName,
          revenue: 0,
          cogs: 0,
          quantitySold: 0,
          hasCostData: variantInfo.theoreticalCost !== null,
        });
      }

      const metrics = productMetricsMap.get(key)!;
      const itemRevenue = multiplyMoney(item.price, item.quantity);
      metrics.revenue = addMoney(metrics.revenue, itemRevenue);
      metrics.quantitySold += item.quantity;

      if (variantInfo.theoreticalCost !== null) {
        metrics.cogs = addMoney(metrics.cogs, multiplyMoney(variantInfo.theoreticalCost, item.quantity));
      }
    }
  }

  const results: ProductMargin[] = [];
  for (const [, m] of productMetricsMap) {
    const grossProfit = m.hasCostData ? subtractMoney(m.revenue, m.cogs) : null;
    const marginPercent = m.hasCostData && m.revenue > 0
      ? safePercentage(grossProfit!, m.revenue)
      : null;

    results.push({
      productId: m.productId,
      productName: m.productName,
      variantId: m.variantId,
      variantName: m.variantName,
      categoryId: m.categoryId,
      categoryName: m.categoryName,
      revenue: roundMoney(m.revenue),
      cogs: m.hasCostData ? roundMoney(m.cogs) : null,
      grossProfit: grossProfit !== null ? roundMoney(grossProfit) : null,
      marginPercent,
      quantitySold: m.quantitySold,
      hasCostData: m.hasCostData,
    });
  }

  results.sort((a, b) => b.revenue - a.revenue);
  return limit ? results.slice(0, limit) : results;
};

export const getMarginTrend = async (
  startDate: string,
  endDate: string
): Promise<MarginTrendPoint[]> => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T23:59:59.999`);

  // Build day list using local date strings to avoid timezone issues
  const days: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
    current.setDate(current.getDate() + 1);
  }

  // Single query for the entire period
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      status: 'completed',
    },
    select: {
      createdAt: true,
      subtotal: true,
      totalCost: true,
    },
  });

  // Group by day using local date strings
  const dayMap = new Map<string, { revenue: number; cogs: number; count: number }>();
  for (const day of days) {
    dayMap.set(day, { revenue: 0, cogs: 0, count: 0 });
  }

  for (const tx of transactions) {
    const txDate = new Date(tx.createdAt);
    const dayKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
    const entry = dayMap.get(dayKey);
    if (!entry) continue;

    entry.revenue = addMoney(entry.revenue, decimalToNumber(tx.subtotal));
    if (tx.totalCost) {
      entry.cogs = addMoney(entry.cogs, decimalToNumber(tx.totalCost));
    }
    entry.count += 1;
  }

  const trend: MarginTrendPoint[] = [];
  for (const day of days) {
    const entry = dayMap.get(day)!;
    const grossProfit = subtractMoney(entry.revenue, entry.cogs);
    const marginPercent = entry.revenue > 0 ? safePercentage(grossProfit, entry.revenue) : 0;

    trend.push({
      date: day,
      revenue: roundMoney(entry.revenue),
      cogs: roundMoney(entry.cogs),
      grossProfit: roundMoney(grossProfit),
      marginPercent,
      transactionCount: entry.count,
    });
  }

  return trend;
};

export const getProfitDashboard = async (
  startDate: string,
  endDate: string
): Promise<ProfitDashboardData> => {
  const [summary, byCategory, byProduct, trend] = await Promise.all([
    getProfitSummary(startDate, endDate),
    getMarginByCategory(startDate, endDate),
    getMarginByProduct(startDate, endDate),
    getMarginTrend(startDate, endDate),
  ]);

  let comparison: ProfitComparison | null = null;
  try {
    comparison = await getProfitComparison(startDate, endDate);
  } catch {
    comparison = null;
  }

  return {
    summary,
    comparison,
    byCategory,
    byProduct,
    trend,
  };
};