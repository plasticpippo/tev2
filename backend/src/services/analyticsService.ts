import { prisma } from '../prisma';
import { AnalyticsParams } from '../utils/validation';
import { OrderItem } from '../types';

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
      whereClause.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      whereClause.createdAt.lte = new Date(endDate);
    }
  }

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
  products.forEach(product => {
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
      productMetrics.totalRevenue += item.price * item.quantity; // Use price * quantity for revenue
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
      product.averagePrice = product.totalRevenue / product.totalQuantity;
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
  const totalRevenue = productMetricsArray.reduce((sum, product) => sum + product.totalRevenue, 0);
  const totalUnitsSold = productMetricsArray.reduce((sum, product) => sum + product.totalQuantity, 0);
  
  // Find top product
  const topProduct = productMetricsArray.length > 0
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