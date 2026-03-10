import { prisma } from '../prisma';
import { roundMoney, addMoney, subtractMoney } from '../utils/money';
import { logInfo, logWarn, logError } from '../utils/logger';

/**
 * Purchasing unit type definition
 */
interface PurchasingUnit {
  id: string;
  name: string;
  multiplier: number;
  costPerUnit: number;
  isDefault: boolean;
  minOrderQuantity?: number;
}

/**
 * Cost breakdown item for a single stock consumption
 */
export interface CostBreakdownItem {
  stockItemName: string;
  recipeQuantity: number;
  recipeUnit: string;
  purchasingUnitName: string;
  costPerBaseUnit: number;
  baseUnit: string;
  taxRate: number;
  subtotal: number;
}

/**
 * Result of cost calculation for a single variant
 */
export interface VariantCostResult {
  variantId: number;
  variantName: string;
  sellingPrice: number;
  taxRate: number;
  sellingPriceExclVAT: number;
  costBreakdown: CostBreakdownItem[];
  calculatedCost: number;
  manualCostOverride: number | null;
  grossProfit: number;
  profitMargin: number | null;
  netEarnings: number;
}

/**
 * Product cost result containing all variants
 */
export interface ProductCostResult {
  productId: number;
  productName: string;
  categoryName: string;
  variants: VariantCostResult[];
}

/**
 * Profit calculation result
 */
export interface ProfitCalculation {
  sellingPriceExclVAT: number;
  taxAmount: number;
  costPrice: number;
  grossProfit: number;
  profitMargin: number | null;
  netEarnings: number;
}

/**
 * Get cost per base unit from purchasing unit
 * Cost Per Base Unit = purchasingUnit.costPerUnit / purchasingUnit.multiplier
 * Example: Bottle €20.00 / 750ml = €0.02667 per ml
 */
function getCostPerBaseUnit(purchasingUnit: PurchasingUnit): number {
  if (!purchasingUnit || purchasingUnit.multiplier <= 0) {
    return 0;
  }
  return (purchasingUnit.costPerUnit ?? 0) / purchasingUnit.multiplier;
}

/**
 * Get the active purchasing unit from stock item
 * Priority: activePurchasingUnitId > isDefault > first available
 */
function getActivePurchasingUnit(stockItem: any): PurchasingUnit | null {
  // Handle JSON field from Prisma - it might be an object or null
  let units: PurchasingUnit[] = [];
  
  if (stockItem.purchasingUnits) {
    // If it's already an array, use it directly
    if (Array.isArray(stockItem.purchasingUnits)) {
      units = stockItem.purchasingUnits as PurchasingUnit[];
    } else {
      // If it's a JSON object, try to parse it
      try {
        const parsed = stockItem.purchasingUnits;
        if (Array.isArray(parsed)) {
          units = parsed as PurchasingUnit[];
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
  
  if (!units || units.length === 0) {
    return null;
  }

  // 1. Find by activePurchasingUnitId
  if (stockItem.activePurchasingUnitId) {
    const active = units.find((u: PurchasingUnit) => u.id === stockItem.activePurchasingUnitId);
    if (active) return active;
  }

  // 2. Find default
  const defaultUnit = units.find((u: PurchasingUnit) => u.isDefault);
  if (defaultUnit) return defaultUnit;

  // 3. First available
  return units[0];
}

/**
 * Calculate cost for a single stock consumption with UOM support
 */
function calculateConsumptionCost(
  consumption: any,
  stockItem: any,
  taxRate: number
): CostBreakdownItem {
  const quantity = consumption.quantity;
  const baseUnit = stockItem.baseUnit || 'units';

  let costPerBaseUnit = 0;
  let purchasingUnitName = 'Legacy';

  // Try to get from purchasing units (UOM system)
  const activeUnit = getActivePurchasingUnit(stockItem);
  if (activeUnit && activeUnit.costPerUnit !== undefined && activeUnit.costPerUnit !== null) {
    costPerBaseUnit = getCostPerBaseUnit(activeUnit);
    purchasingUnitName = activeUnit.name;
  } else {
    // No valid UOM - cost is 0 (require proper UOM configuration)
    purchasingUnitName = 'NO_UOM';
  }

  // Formula: quantity × costPerBaseUnit × (1 + taxRate)
  const subtotal = roundMoney(quantity * costPerBaseUnit * (1 + taxRate));

  return {
    stockItemName: stockItem.name,
    recipeQuantity: quantity,
    recipeUnit: baseUnit,
    purchasingUnitName,
    costPerBaseUnit,
    baseUnit,
    taxRate,
    subtotal
  };
}
/**
 * Calculate profit metrics for a variant
 * @param variantPrice - The selling price (including or excluding VAT based on settings)
 * @param variantTaxRate - The tax rate as decimal (e.g., 0.19 for 19%)
 * @param costPrice - The calculated or manual cost price
 * @returns Profit calculation with all metrics
 */
export function calculateProfit(
  variantPrice: number,
  variantTaxRate: number,
  costPrice: number
): ProfitCalculation {
  // Validate inputs to prevent division by zero
  if (variantPrice < 0) {
    variantPrice = 0;
  }
  if (costPrice < 0) {
    costPrice = 0;
  }
  
  // Calculate price excluding VAT (only if tax rate is valid and not -100%)
  const sellingPriceExclVAT = variantTaxRate > 0 && variantTaxRate < 1
    ? roundMoney(variantPrice / (1 + variantTaxRate))
    : variantPrice;
  
  // Calculate tax amount
  const taxAmount = roundMoney(variantPrice - sellingPriceExclVAT);
  
  // Calculate gross profit (selling price excl VAT - cost)
  const grossProfit = subtractMoney(sellingPriceExclVAT, costPrice);
  
  // Calculate profit margin percentage
  // Only show margin if cost is set (greater than 0) and there's revenue
  const profitMargin = costPrice > 0 && sellingPriceExclVAT > 0
    ? roundMoney((grossProfit / sellingPriceExclVAT) * 100)
    : null;
  
  // Calculate net earnings (selling price - tax - cost)
  const netEarnings = subtractMoney(subtractMoney(variantPrice, taxAmount), costPrice);
  
  return {
    sellingPriceExclVAT,
    taxAmount,
    costPrice,
    grossProfit,
    profitMargin,
    netEarnings
  };
}

/**
 * Calculate cost for a product variant from stock consumption
 * Uses formula: costPerUnit × quantityConsumed × (1 + taxRate)
 * @param variantId - The ID of the product variant
 * @returns Variant cost result with breakdown and profit metrics
 */
export async function calculateVariantCost(
  variantId: number
): Promise<VariantCostResult> {
  // Get variant with stock consumption and tax rate
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        include: {
          category: true
        }
      },
      stockConsumption: {
        include: {
          stockItem: {
            include: {
              taxRate: true
            }
          }
        }
      },
      taxRate: true
    }
  });

  if (!variant) {
    throw new Error(`Variant with ID ${variantId} not found`);
  }

  const variantTaxRate = variant.taxRate ? Number(variant.taxRate.rate) : 0;
  
  // Check for manual cost override
  if (variant.costPrice !== null && variant.costPrice !== undefined) {
    const manualCost = Number(variant.costPrice);
    const profit = calculateProfit(Number(variant.price), variantTaxRate, manualCost);
    
    return {
      variantId: variant.id,
      variantName: variant.name,
      sellingPrice: Number(variant.price),
      taxRate: variantTaxRate,
      sellingPriceExclVAT: profit.sellingPriceExclVAT,
      costBreakdown: [],
      calculatedCost: manualCost,
      manualCostOverride: manualCost,
      grossProfit: profit.grossProfit,
      profitMargin: profit.profitMargin,
      netEarnings: profit.netEarnings
    };
  }

  // Calculate cost from stock consumption with UOM
  const costBreakdown: CostBreakdownItem[] = [];
  let totalCost = 0;

  for (const consumption of variant.stockConsumption) {
    const stockItem = consumption.stockItem;
    const itemTaxRate = stockItem.taxRate
      ? Number(stockItem.taxRate.rate)
      : 0;

    const breakdown = calculateConsumptionCost(
      consumption,
      stockItem,
      itemTaxRate
    );

    costBreakdown.push(breakdown);
    totalCost = addMoney(totalCost, breakdown.subtotal);
  }

  const calculatedCost = roundMoney(totalCost);
  const profit = calculateProfit(Number(variant.price), variantTaxRate, calculatedCost);

  return {
    variantId: variant.id,
    variantName: variant.name,
    sellingPrice: Number(variant.price),
    taxRate: variantTaxRate,
    sellingPriceExclVAT: profit.sellingPriceExclVAT,
    costBreakdown,
    calculatedCost,
    manualCostOverride: null,
    grossProfit: profit.grossProfit,
    profitMargin: profit.profitMargin,
    netEarnings: profit.netEarnings
  };
}

/**
 * Calculate costs for all variants of a product
 * @param productId - The ID of the product
 * @returns Product cost result with all variants
 */
export async function calculateProductCosts(
  productId: number
): Promise<ProductCostResult> {
  // Get product with all variants
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true
    }
  });

  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  // Get all variants for this product
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    include: {
      stockConsumption: {
        include: {
          stockItem: {
            include: {
              taxRate: true
            }
          }
        }
      },
      taxRate: true
    }
  });

  // Calculate cost for each variant
  const variantResults: VariantCostResult[] = [];

  for (const variant of variants) {
    const variantTaxRate = variant.taxRate ? Number(variant.taxRate.rate) : 0;
    
    // Check for manual cost override
    if (variant.costPrice !== null && variant.costPrice !== undefined) {
      const manualCost = Number(variant.costPrice);
      const profit = calculateProfit(Number(variant.price), variantTaxRate, manualCost);
      
      variantResults.push({
        variantId: variant.id,
        variantName: variant.name,
        sellingPrice: Number(variant.price),
        taxRate: variantTaxRate,
        sellingPriceExclVAT: profit.sellingPriceExclVAT,
        costBreakdown: [],
        calculatedCost: manualCost,
        manualCostOverride: manualCost,
        grossProfit: profit.grossProfit,
        profitMargin: profit.profitMargin,
        netEarnings: profit.netEarnings
      });
      continue;
    }

    // Calculate from stock consumption with UOM
    const costBreakdown: CostBreakdownItem[] = [];
    let totalCost = 0;

    for (const consumption of variant.stockConsumption) {
      const stockItem = consumption.stockItem;
      const itemTaxRate = stockItem.taxRate
        ? Number(stockItem.taxRate.rate)
        : 0;

      const breakdown = calculateConsumptionCost(
        consumption,
        stockItem,
        itemTaxRate
      );

      costBreakdown.push(breakdown);
      totalCost = addMoney(totalCost, breakdown.subtotal);
    }

    const calculatedCost = roundMoney(totalCost);
    const profit = calculateProfit(Number(variant.price), variantTaxRate, calculatedCost);

    variantResults.push({
      variantId: variant.id,
      variantName: variant.name,
      sellingPrice: Number(variant.price),
      taxRate: variantTaxRate,
      sellingPriceExclVAT: profit.sellingPriceExclVAT,
      costBreakdown,
      calculatedCost,
      manualCostOverride: null,
      grossProfit: profit.grossProfit,
      profitMargin: profit.profitMargin,
      netEarnings: profit.netEarnings
    });
  }

  return {
    productId: product.id,
    productName: product.name,
    categoryName: product.category.name,
    variants: variantResults
  };
}

/**
 * Query parameters for product cost analytics
 */
export interface ProductCostAnalyticsParams {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  sortBy?: 'cost' | 'revenue' | 'profit' | 'margin';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Transaction item structure from JSON
 */
interface TransactionItem {
  variantId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  effectiveTaxRate: number;
}

/**
 * Single product cost analytics entry
 */
export interface ProductCostAnalyticsEntry {
  productId: number;
  productName: string;
  categoryName: string;
  variantId: number;
  variantName: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number | null;
  netEarnings: number;
}

/**
 * Analytics summary
 */
export interface ProductCostAnalyticsSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  averageMargin: number | null;
  totalProducts: number;
  totalVariants: number;
}

/**
 * Full product cost analytics result
 */
export interface ProductCostAnalyticsResult {
  products: ProductCostAnalyticsEntry[];
  summary: ProductCostAnalyticsSummary;
}

/**
 * Get cost and profit analytics for products
 * @param params - Query parameters for filtering and sorting
 * @returns Analytics with cost breakdown and summary
 */
export async function getProductCostAnalytics(
  params: ProductCostAnalyticsParams
): Promise<ProductCostAnalyticsResult> {
  const {
    startDate,
    endDate,
    categoryId,
    sortBy = 'profit',
    sortOrder = 'desc'
  } = params;

  // Build date filter for transactions
  const dateFilter: any = {};
  if (startDate) {
    dateFilter.gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.lte = new Date(endDate);
  }

  // Build where clause for categories
  const categoryFilter: any = {};
  if (categoryId) {
    categoryFilter.id = categoryId;
  }

  // Get all products with their variants and categories
  // Using any type to bypass Prisma type inference issues with includes
  const products: any = await prisma.product.findMany({
    where: {
      ...(categoryId && { categoryId })
    },
    include: {
      category: true,
      variants: {
        include: {
          taxRate: true,
          stockConsumption: {
            include: {
              stockItem: {
                include: {
                  taxRate: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Get transactions in date range
  const transactions = await prisma.transaction.findMany({
    where: {
      status: 'completed',
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
    },
    select: {
      items: true,
      createdAt: true
    }
  });

  // Parse transaction items from JSON
  const parseTransactionItems = (itemsJson: any): TransactionItem[] => {
    if (typeof itemsJson === 'string') {
      return JSON.parse(itemsJson) as TransactionItem[];
    }
    if (Array.isArray(itemsJson)) {
      return itemsJson as TransactionItem[];
    }
    return [];
  };

  // PERFORMANCE OPTIMIZATION: Pre-aggregate sales data by variantId
  // This avoids O(products × variants × transactions) nested loops
  const salesByVariant = new Map<number, { quantity: number; revenue: number }>();
  for (const transaction of transactions) {
    const items = parseTransactionItems(transaction.items);
    for (const item of items) {
      const existing = salesByVariant.get(item.variantId) || { quantity: 0, revenue: 0 };
      salesByVariant.set(item.variantId, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity)
      });
    }
  }

  // Calculate analytics for each product/variant using pre-aggregated data
  const analyticsEntries: ProductCostAnalyticsEntry[] = [];

  for (const product of products) {
    for (const variant of product.variants) {
      // Get pre-aggregated sales data directly from Map - O(1) lookup
      const sales = salesByVariant.get(variant.id) || { quantity: 0, revenue: 0 };
      const totalSold = sales.quantity;
      const totalRevenue = sales.revenue;

      // Calculate cost
      const variantTaxRate = variant.taxRate ? Number(variant.taxRate.rate) : 0;
      let calculatedCost = 0;

      // Check for manual cost override
      if (variant.costPrice !== null && variant.costPrice !== undefined) {
        calculatedCost = Number(variant.costPrice) * totalSold;
      } else {
        // Calculate from stock consumption using UOM system
        for (const consumption of variant.stockConsumption) {
          const stockItem = consumption.stockItem;
          const taxRate = stockItem.taxRate
            ? Number(stockItem.taxRate.rate)
            : 0;
          const quantity = consumption.quantity * totalSold;
          
          // Get cost per base unit using UOM system
          // REQUIRE UOM: Must have valid purchasing unit with costPerUnit - no legacy fallback
          let costPerBaseUnit = 0;
          let costSource = 'none';
          
          // Try to get from purchasing units (UOM system)
          const activeUnit = getActivePurchasingUnit(stockItem);
          if (activeUnit && activeUnit.costPerUnit !== undefined && activeUnit.costPerUnit !== null) {
            costPerBaseUnit = getCostPerBaseUnit(activeUnit);
            costSource = `UOM:${activeUnit.name} costPerUnit=${activeUnit.costPerUnit} mult=${activeUnit.multiplier}`;
          } else {
            // No valid UOM - cost is 0 (require proper UOM configuration)
            costSource = 'NO_UOM:costPerUnit is required on purchasing unit';
            logWarn(`[COST_DEBUG] StockItem ${stockItem.name} has no valid purchasing unit with costPerUnit - cost set to 0`);
          }
          
          // DEBUG: Log cost calculation details
          logInfo(`[COST_DEBUG] StockItem: ${stockItem.name}, Source: ${costSource}, costPerBaseUnit: ${costPerBaseUnit}, quantity: ${quantity}, taxRate: ${taxRate}, subtotal: ${costPerBaseUnit * quantity * (1 + taxRate)}`);
          
          calculatedCost += costPerBaseUnit * quantity * (1 + taxRate);
        }
      }

      const totalCost = roundMoney(calculatedCost);
      const grossProfit = subtractMoney(totalRevenue, totalCost);
      // Only calculate margin if there's revenue
      const profitMargin = totalRevenue > 0 && totalRevenue !== 0
        ? roundMoney((grossProfit / totalRevenue) * 100)
        : null;
      const netEarnings = grossProfit; // Simplified for now

      if (totalSold > 0) {
        analyticsEntries.push({
          productId: product.id,
          productName: product.name,
          categoryName: product.category.name,
          variantId: variant.id,
          variantName: variant.name,
          totalSold,
          totalRevenue: roundMoney(totalRevenue),
          totalCost,
          grossProfit,
          profitMargin,
          netEarnings
        });
      }
    }
  }

  // Sort results
  const sortKeyMap: Record<string, keyof ProductCostAnalyticsEntry> = {
    cost: 'totalCost',
    revenue: 'totalRevenue',
    profit: 'grossProfit',
    margin: 'profitMargin'
  };

  const sortKey = sortKeyMap[sortBy] || 'grossProfit';
  const sortMultiplier = sortOrder === 'desc' ? -1 : 1;

  analyticsEntries.sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * sortMultiplier;
    }
    return 0;
  });

  // Calculate summary
  const totalRevenue = analyticsEntries.reduce((sum, entry) => sum + entry.totalRevenue, 0);
  const totalCost = analyticsEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
  const totalProfit = analyticsEntries.reduce((sum, entry) => sum + entry.grossProfit, 0);
  // Calculate average margin from entries that have margin set (not null)
  const entriesWithMargin = analyticsEntries.filter(e => e.profitMargin !== null);
  const averageMargin = entriesWithMargin.length > 0
    ? roundMoney(entriesWithMargin.reduce((sum, entry) => sum + (entry.profitMargin || 0), 0) / entriesWithMargin.length)
    : null;

  const summary: ProductCostAnalyticsSummary = {
    totalRevenue,
    totalCost,
    totalProfit,
    averageMargin,
    totalProducts: new Set(analyticsEntries.map(e => e.productId)).size,
    totalVariants: analyticsEntries.length
  };

  return {
    products: analyticsEntries,
    summary
  };
}
