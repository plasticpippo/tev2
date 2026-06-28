import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { CONSUMED_TRANSACTION_STATUSES_MUTABLE } from '../utils/transaction';

export const consumptionReportsRouter = express.Router();

// GET /api/consumption-reports/itemised - Get itemised consumption report with detailed filtering
consumptionReportsRouter.get('/itemised', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const {
      startDate,
      endDate,
      categoryId,
      stockItemType
    } = req.query;

    // Build where conditions for ledger query
    const where: any = {
      transaction: {
        status: { in: CONSUMED_TRANSACTION_STATUSES_MUTABLE }
      }
    };
    
    if (startDate && endDate) {
      where.transaction.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else if (startDate) {
      where.transaction.createdAt = {
        gte: new Date(startDate as string)
      };
    } else if (endDate) {
      where.transaction.createdAt = {
        lte: new Date(endDate as string)
      };
    }

    // Category filter (using snapshot column)
    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    const ledgerRows = await prisma.stockConsumptionLedger.findMany({
      where,
      include: {
        stockItem: true
      }
    });

    // Filter by stockItemType if provided
    const filteredRows = stockItemType 
      ? ledgerRows.filter(row => row.stockItem.type === stockItemType)
      : ledgerRows;

    // Aggregate details grouped by (variantId, stockItemId)
    const detailsMap = new Map<string, any>();
    
    for (const row of filteredRows) {
      const key = `${row.variantId}-${row.stockItemId}`;
      const existing = detailsMap.get(key);
      
      if (existing) {
        existing.quantityConsumed += row.quantity;
      } else {
        detailsMap.set(key, {
          id: `${row.variantId}-${row.stockItemId}`,
          productId: row.productId,
          productName: row.productName,
          variantId: row.variantId,
          variantName: row.variantName,
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          stockItemId: row.stockItemId,
          stockItemName: row.stockItemName,
          stockItemType: row.stockItem.type,
          quantityConsumed: row.quantity,
        });
      }
    }

    // Sort details by product name, then variant name for consistent ordering
    const details = Array.from(detailsMap.values()).sort((a, b) => {
      const nameCompare = a.productName.localeCompare(b.productName);
      if (nameCompare !== 0) return nameCompare;
      return a.variantName.localeCompare(b.variantName);
    });
    
    // Calculate aggregated totals
    const totalsMap = new Map<string, { stockItemId: string; stockItemName: string; stockItemType: string; totalQuantity: number }>();
    
    for (const row of filteredRows) {
      const existing = totalsMap.get(row.stockItemName);
      
      if (existing) {
        existing.totalQuantity += row.quantity;
      } else {
        totalsMap.set(row.stockItemName, {
          stockItemId: row.stockItemId,
          stockItemName: row.stockItemName,
          stockItemType: row.stockItem.type,
          totalQuantity: row.quantity
        });
      }
    }

    const totals = Array.from(totalsMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);

    res.json({ details, totals });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching itemised consumption report', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:consumptionReports.fetchFailed') });
  }
});

export default consumptionReportsRouter;