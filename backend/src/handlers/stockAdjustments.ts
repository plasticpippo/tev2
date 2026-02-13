import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { StockAdjustment } from '../types';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import i18n from '../i18n';

export const stockAdjustmentsRouter = express.Router();

// GET /api/stock-adjustments - Get all stock adjustments
stockAdjustmentsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stockAdjustments = await prisma.stockAdjustment.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(stockAdjustments);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching stock adjustments', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockAdjustments.fetchFailed') });
  }
});

// GET /api/stock-adjustments/:id - Get a specific stock adjustment
stockAdjustmentsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Stock adjustment ID is integer-based, so convert to number
    const stockAdjustment = await prisma.stockAdjustment.findUnique({
      where: { id: Number(id) }
    });
    
    if (!stockAdjustment) {
      return res.status(404).json({ error: i18n.t('errors:stockAdjustments.notFound') });
    }
    
    res.json(stockAdjustment);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching stock adjustment', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockAdjustments.fetchOneFailed') });
  }
});

// POST /api/stock-adjustments - Create a new stock adjustment
stockAdjustmentsRouter.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { stockItemId, itemName, quantity, reason, userId, userName } = req.body as Omit<StockAdjustment, 'id' | 'createdAt'>;
    
    // Validate UUID format (standard format: 8-4-4-4-12 hex characters with optional dashes)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (typeof stockItemId === 'string' && !uuidRegex.test(stockItemId)) {
      return res.status(400).json({ error: i18n.t('errors:stockAdjustments.invalidStockItemIdFormat') });
    }
    
    // Validate that the stock item exists
    const stockItem = await prisma.stockItem.findUnique({
      where: { id: stockItemId }
    });
    
    if (!stockItem) {
      return res.status(400).json({ error: i18n.t('errors:stockAdjustments.invalidStockItemId', { stockItemId }) });
    }
    
    // Update the stock item quantity
    await prisma.stockItem.update({
      where: { id: stockItemId },
      data: {
        quantity: {
          increment: quantity // This can be positive or negative
        }
      }
    });
    
    // Create the stock adjustment record
    const stockAdjustment = await prisma.stockAdjustment.create({
      data: {
        stockItemId,
        itemName,
        quantity,
        reason,
        userId,
        userName,
        createdAt: new Date()
      }
    });
    
    res.status(201).json(stockAdjustment);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating stock adjustment', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockAdjustments.createFailed') });
  }
});

// GET /api/stock-adjustments/orphaned-references - Get stock adjustment records that reference non-existent stock items
stockAdjustmentsRouter.get('/orphaned-references', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Find all stock adjustment records
    const allStockAdjustments = await prisma.stockAdjustment.findMany({
      select: {
        id: true,
        stockItemId: true,
        itemName: true,
        quantity: true,
        reason: true,
        userName: true
      }
    });
    
    // Extract the stock item IDs referenced in stock adjustments
    const referencedStockItemIds = allStockAdjustments.map(adjustment => adjustment.stockItemId);
    
    // Find all stock items that exist in the database
    const existingStockItems = await prisma.stockItem.findMany({
      where: {
        id: { in: referencedStockItemIds }
      },
      select: { id: true }
    });
    
    // Create a set of existing stock item IDs for quick lookup
    const existingStockItemIds = new Set(existingStockItems.map(item => item.id));
    
    // Filter the stock adjustments to find those that reference non-existent stock items
    const orphanedAdjustments = allStockAdjustments.filter(adjustment => !existingStockItemIds.has(adjustment.stockItemId));
    
    res.json(orphanedAdjustments);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching orphaned stock adjustment references', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockAdjustments.fetchOrphanedFailed') });
  }
});

// DELETE /api/stock-adjustments/cleanup-orphaned - Remove invalid stock adjustment references
stockAdjustmentsRouter.delete('/cleanup-orphaned', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Find all stock adjustment records
    const allStockAdjustments = await prisma.stockAdjustment.findMany({
      select: {
        id: true,
        stockItemId: true,
        itemName: true,
        quantity: true,
        reason: true,
        userName: true
      }
    });
    
    // Extract the stock item IDs referenced in stock adjustments
    const referencedStockItemIds = allStockAdjustments.map(adjustment => adjustment.stockItemId);
    
    // Find all stock items that exist in the database
    const existingStockItems = await prisma.stockItem.findMany({
      where: {
        id: { in: referencedStockItemIds }
      },
      select: { id: true }
    });
    
    // Create a set of existing stock item IDs for quick lookup
    const existingStockItemIds = new Set(existingStockItems.map(item => item.id));
    
    // Filter the stock adjustments to find those that reference non-existent stock items
    const orphanedAdjustments = allStockAdjustments.filter(adjustment => !existingStockItemIds.has(adjustment.stockItemId));
    
    if (orphanedAdjustments.length === 0) {
      return res.status(200).json({
        message: i18n.t('errors:stockAdjustments.noOrphanedReferences'),
        deletedCount: 0
      });
    }
    
    // Extract the IDs of orphaned adjustment records
    const orphanedIds = orphanedAdjustments.map(oc => oc.id);
    
    // Delete the orphaned adjustment records
    await prisma.stockAdjustment.deleteMany({
      where: {
        id: { in: orphanedIds }
      }
    });
    
    res.status(200).json({
      message: i18n.t('errors:stockAdjustments.orphanedReferencesRemoved', { count: orphanedIds.length }),
      deletedCount: orphanedIds.length,
      removedRecords: orphanedAdjustments
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error cleaning up orphaned stock adjustment references', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockAdjustments.cleanupOrphanedFailed') });
  }
});

// GET /api/stock-adjustments/validate-integrity - Validate data integrity for stock adjustments
stockAdjustmentsRouter.get('/validate-integrity', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Find all stock adjustment records
    const allStockAdjustments = await prisma.stockAdjustment.findMany({
      select: {
        id: true,
        stockItemId: true,
        itemName: true,
        quantity: true,
        reason: true,
        userName: true
      }
    });
    
    // Extract the stock item IDs referenced in stock adjustments
    const referencedStockItemIds = allStockAdjustments.map(adjustment => adjustment.stockItemId);
    
    // Find all stock items that exist in the database
    const existingStockItems = await prisma.stockItem.findMany({
      where: {
        id: { in: referencedStockItemIds }
      },
      select: { id: true }
    });
    
    // Create a set of existing stock item IDs for quick lookup
    const existingStockItemIds = new Set(existingStockItems.map(item => item.id));
    
    // Filter the stock adjustments to find those that reference non-existent stock items
    const orphanedAdjustments = allStockAdjustments.filter(adjustment => !existingStockItemIds.has(adjustment.stockItemId));
    
    const integrityReport = {
      orphanedAdjustments: orphanedAdjustments.length,
      details: {
        orphanedAdjustments: orphanedAdjustments
      }
    };
    
    const hasIssues = integrityReport.orphanedAdjustments > 0;
    
    res.status(200).json({
      message: hasIssues ? i18n.t('errors:stockAdjustments.dataIntegrityIssues') : i18n.t('errors:stockAdjustments.dataIntegrityPassed'),
      hasIssues,
      report: integrityReport
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error validating data integrity', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockAdjustments.validateIntegrityFailed') });
  }
});

export default stockAdjustmentsRouter;