import express, { Request, Response } from 'express';
import { prisma } from '../prisma';

export const consumptionReportsRouter = express.Router();

// GET /api/consumption-reports/itemised - Get itemised consumption report with detailed filtering
consumptionReportsRouter.get('/itemised', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      categoryId,
      stockItemType
    } = req.query;

    // First, get all transactions within the date range if provided
    const transactionWhere: any = {};
    
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
    const variantConsumptionMap = new Map<number, typeof stockConsumptions>();
    stockConsumptions.forEach(consumption => {
      if (!variantConsumptionMap.has(consumption.variantId)) {
        variantConsumptionMap.set(consumption.variantId, []);
      }
      variantConsumptionMap.get(consumption.variantId)?.push(consumption);
    });

    // Calculate total consumption per variant based on transaction quantities
    const consumptionTotals: any[] = [];

    // Process each transaction to calculate actual consumption
    transactions.forEach(transaction => {
      const items = typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items;
      
      items.forEach((item: any) => {
        if (item.variantId && variantConsumptionMap.has(item.variantId)) {
          const consumptions = variantConsumptionMap.get(item.variantId)!;
          
          // For each consumption record of this variant, multiply by item quantity in transaction
          consumptions.forEach(consumption => {
            // Apply stock item type filter if specified
            if (stockItemType && consumption.stockItem.type !== stockItemType) {
              return; // Skip this consumption if it doesn't match the filter
            }
            
            consumptionTotals.push({
              id: `${transaction.createdAt.getTime()}-${consumption.id}`, // Unique ID combining transaction time and consumption ID
              productId: consumption.variant.productId,
              productName: consumption.variant.product.name,
              variantId: consumption.variant.id,
              variantName: consumption.variant.name,
              categoryId: consumption.variant.product.categoryId,
              categoryName: '', // Will populate this later
              stockItemId: consumption.stockItem.id,
              stockItemName: consumption.stockItem.name,
              stockItemType: consumption.stockItem.type,
              quantityConsumed: consumption.quantity * item.quantity, // Multiply by quantity sold
              transactionDate: transaction.createdAt
            });
          });
        }
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

    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

    // Update category names in the result
    const finalResult = consumptionTotals.map(item => ({
      ...item,
      categoryName: categoryMap.get(item.categoryId) || ''
    }));

    // Sort by transaction date (most recent first)
    finalResult.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    res.json(finalResult);
  } catch (error) {
    console.error('Error fetching itemised consumption report:', error);
    res.status(500).json({ error: 'Failed to fetch itemised consumption report. Please try again later.' });
  }
});

export default consumptionReportsRouter;