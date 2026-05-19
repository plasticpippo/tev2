import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { StockConsumption, ProductVariant, Product, StockItem, Category } from '@prisma/client';

export const consumptionReportsRouter = express.Router();

// GET /api/consumption-reports/itemised - Get itemised consumption report with detailed filtering
consumptionReportsRouter.get('/itemised', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const venueId = (req as any).venueId;
  try {
    const {
      startDate,
      endDate,
      categoryId,
      stockItemType
    } = req.query;

    // First, get all transactions within the date range if provided
    const transactionWhere: any = { venueId };
    
    if (startDate && endDate) {
      transactionWhere.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else if (startDate) {
      transactionWhere.createdAt = {
        gte: new Date(startDate as string)
      };
    } else if (endDate) {
      transactionWhere.createdAt = {
        lte: new Date(endDate as string)
      };
    }

    // Exclude voided transactions from consumption reports
    transactionWhere.status = { not: 'voided' };

    const transactions = await prisma.transaction.findMany({
      where: transactionWhere,
      select: {
        items: true,
        createdAt: true
      }
    });

    // Extract all product variant IDs from transactions
    const variantIdsInTransactions = new Set<number>();
    transactions.forEach(transaction => {
      const items = typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items;
      items.forEach((item: any) => {
        if (item.variantId) {
          variantIdsInTransactions.add(item.variantId);
        }
      });
    });

    // Get stock consumption records for these variants
    const consumptionWhere: any = {
      variantId: {
        in: Array.from(variantIdsInTransactions)
      }
    };

    // Category filter
    if (categoryId) {
      consumptionWhere.variant = {
        product: {
          categoryId: Number(categoryId)
        }
      };
    }

    const stockConsumptions = await prisma.stockConsumption.findMany({
      where: consumptionWhere,
      include: {
        variant: {
          include: {
            product: true
          }
        },
        stockItem: true
      }
    });

    // Create a map of variantId to consumption details for quick lookup
    const variantConsumptionMap = new Map<number, (StockConsumption & { variant: ProductVariant & { product: Product }; stockItem: StockItem })[]>();
    stockConsumptions.forEach((consumption: StockConsumption & { variant: ProductVariant & { product: Product }; stockItem: StockItem }) => {
      if (!variantConsumptionMap.has(consumption.variantId)) {
        variantConsumptionMap.set(consumption.variantId, []);
      }
      variantConsumptionMap.get(consumption.variantId)?.push(consumption);
    });

    // Aggregate total quantity sold for each variant across all transactions
    const variantQuantityMap = new Map<number, number>();
    transactions.forEach(transaction => {
      const items = typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items;
      items.forEach((item: any) => {
        if (item.variantId) {
          const currentQuantity = variantQuantityMap.get(item.variantId) || 0;
          variantQuantityMap.set(item.variantId, currentQuantity + item.quantity);
        }
      });
    });

    // Calculate total consumption by applying aggregate quantities to consumption records
    const consumptionTotals: any[] = [];

    variantConsumptionMap.forEach((consumptions, variantId) => {
      const totalQuantitySold = variantQuantityMap.get(variantId) || 0;

      if (totalQuantitySold === 0) return;

      consumptions.forEach(consumption => {
        if (stockItemType && consumption.stockItem.type !== stockItemType) {
          return;
        }

        consumptionTotals.push({
          id: consumption.id.toString(),
          productId: consumption.variant.productId,
          productName: consumption.variant.product.name,
          variantId: consumption.variant.id,
          variantName: consumption.variant.name,
          categoryId: consumption.variant.product.categoryId,
          categoryName: '',
          stockItemId: consumption.stockItem.id,
          stockItemName: consumption.stockItem.name,
          stockItemType: consumption.stockItem.type,
          quantityConsumed: consumption.quantity * totalQuantitySold,
        });
      });
    });

    // Get category names separately to avoid N+1 query issue
    const categoryIds = [...new Set(consumptionTotals.map(c => c.categoryId))];
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    const categoryMap = new Map(categories.map((cat: { id: number; name: string }) => [cat.id, cat.name]));

    // Update category names in the result
    const finalResult = consumptionTotals.map(item => ({
      ...item,
      categoryName: categoryMap.get(item.categoryId) || ''
    }));

    // Sort by product name, then variant name for consistent ordering
    finalResult.sort((a, b) => {
      const nameCompare = a.productName.localeCompare(b.productName);
      if (nameCompare !== 0) return nameCompare;
      return a.variantName.localeCompare(b.variantName);
    });
    
    // Calculate aggregated totals
    const aggregatedTotals: Record<string, { stockItemId: string; stockItemName: string; stockItemType: string; totalQuantity: number }> = finalResult.reduce((acc, item) => {
      if (!acc[item.stockItemName]) {
        acc[item.stockItemName] = {
          stockItemId: item.stockItemId,
          stockItemName: item.stockItemName,
          stockItemType: item.stockItemType,
          totalQuantity: 0
        };
      }
      acc[item.stockItemName].totalQuantity += item.quantityConsumed;
      return acc;
    }, {} as Record<string, { stockItemId: string; stockItemName: string; stockItemType: string; totalQuantity: number }>);

    // Convert aggregated totals to an array and sort by total quantity (descending)
    const aggregatedTotalsArray = Object.values(aggregatedTotals).sort((a, b) => b.totalQuantity - a.totalQuantity);

    res.json({
      details: finalResult,
      totals: aggregatedTotalsArray
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching itemised consumption report', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:consumptionReports.fetchFailed') });
  }
});

export default consumptionReportsRouter;