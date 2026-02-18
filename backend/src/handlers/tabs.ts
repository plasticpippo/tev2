import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Tab } from '../types';
import { logInfo, logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { safeJsonParse } from '../utils/jsonParser';
import i18n from '../i18n';

// Table status constants
const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  BILL_REQUESTED: 'bill_requested'
} as const;

// Helper function to update table status
async function updateTableStatus(tableId: string | null, status: string): Promise<void> {
  if (!tableId) return;
  
  try {
    await prisma.table.update({
      where: { id: tableId },
      data: { status }
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating table status', {
      correlationId: undefined,
    });
  }
}

// Helper function to check if table has other active tabs
async function tableHasOtherTabs(tableId: string, excludeTabId?: number): Promise<boolean> {
  const where: any = { tableId };
  if (excludeTabId) {
    where.id = { not: excludeTabId };
  }
  const count = await prisma.tab.count({ where });
  return count > 0;
}

export const tabsRouter = express.Router();

// GET /api/tabs - Get all tabs
tabsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tabs = await prisma.tab.findMany({
      include: {
        table: true
      }
    });
    // Parse the items JSON string back to array
    const tabsWithParsedItems = tabs.map(tab => ({
      ...tab,
      items: safeJsonParse(tab.items, [], { id: String(tab.id), field: 'items' }),
      createdAt: tab.createdAt.toISOString() // Ensure createdAt is in string format
    }));
    res.json(tabsWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('tabs.log.fetchError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('tabs.fetchFailed') });
  }
});

// GET /api/tabs/:id - Get a specific tab
tabsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tab = await prisma.tab.findUnique({
      where: { id: Number(id) },
      include: {
        table: true
      }
    });
    
    if (!tab) {
      return res.status(404).json({ error: i18n.t('tabs.notFound') });
    }
    
    // Parse the items JSON string back to array
    const tabWithParsedItems = {
      ...tab,
      items: safeJsonParse(tab.items, [], { id: String(tab.id), field: 'items' }),
      createdAt: tab.createdAt.toISOString() // Ensure createdAt is in string format
    };
    
    res.json(tabWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('tabs.log.fetchOneError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('tabs.fetchOneFailed') });
  }
});

// POST /api/tabs - Create a new tab
tabsRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    logInfo(i18n.t('tabs.log.createCalled'), {
      correlationId: (req as any).correlationId,
    });
    const { name, items, tillId, tillName, tableId } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      logInfo(i18n.t('tabs.log.nameValidationFailed'), {
        correlationId: (req as any).correlationId,
      });
      return res.status(400).json({ error: i18n.t('tabs.nameRequired') });
    }
    
    // Validate items array
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          logError(i18n.t('tabs.log.itemWithoutName'), {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: i18n.t('tabs.itemNameRequired') });
        }
        if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
          logError(i18n.t('tabs.log.itemInvalidProperties'), {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: i18n.t('tabs.itemInvalidProperties') });
        }
      }
    }
    
    // Check if a tab with the same name already exists
    const existingTab = await prisma.tab.findFirst({
      where: { name: name.trim() }
    });
    
    if (existingTab) {
      logInfo(i18n.t('tabs.log.duplicateNameDetected'), {
        correlationId: (req as any).correlationId,
      });
      return res.status(409).json({ error: i18n.t('tabs.duplicateName') });
    }
    
    // If tableId is provided, verify that the table exists
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });
      
      if (!table) {
        return res.status(404).json({ error: i18n.t('tabs.tableNotFound') });
      }
    }
    
    logInfo(i18n.t('tabs.log.creating'), {
      correlationId: (req as any).correlationId,
    });
    const tab = await prisma.tab.create({
      data: {
        name: name.trim(), // Trim whitespace
        items: JSON.stringify(items || []),
        tillId,
        tillName,
        tableId: tableId || null,
        createdAt: new Date()
      }
    });
    
    // Update table status to occupied if tableId is provided
    if (tableId) {
      await updateTableStatus(tableId, TABLE_STATUS.OCCUPIED);
    }
    
    logInfo(i18n.t('tabs.log.created'), {
      correlationId: (req as any).correlationId,
    });
    res.status(201).json(tab);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('tabs.log.createError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('tabs.createFailed') });
  }
});

// PUT /api/tabs/:id - Update a tab
tabsRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, items, tillId, tillName, tableId } = req.body;
    
    // Validate name if it's provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: i18n.t('tabs.nameNonEmpty') });
      }
      
      // Check if a tab with the same name already exists (excluding the current tab)
      const existingTab = await prisma.tab.findFirst({
        where: {
          name: name.trim(),
          id: { not: Number(id) } // Exclude current tab from check
        }
      });
      
      if (existingTab) {
        return res.status(409).json({ error: i18n.t('tabs.duplicateName') });
      }
    }
    
    // Validate items array if provided
    if (items !== undefined && Array.isArray(items)) {
      for (const item of items) {
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          logError(i18n.t('tabs.log.itemWithoutName'), {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: i18n.t('tabs.itemNameRequired') });
        }
        if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
          logError(i18n.t('tabs.log.itemInvalidProperties'), {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: i18n.t('tabs.itemInvalidProperties') });
        }
      }
    }
    
    // If tableId is provided, verify that the table exists
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });
      
      if (!table) {
        return res.status(404).json({ error: i18n.t('tabs.tableNotFound') });
      }
    }
    
    // Get the existing tab to check for table assignment changes
    const existingTab = await prisma.tab.findUnique({
      where: { id: Number(id) }
    });

    const tab = await prisma.tab.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name.trim() : undefined, // Only trim if name is provided
        items: JSON.stringify(items || []),
        tillId,
        tillName,
        tableId: tableId || null
      }
    });
    
    // Handle table status changes
    if (existingTab?.tableId !== tableId) {
      // If table was unassigned, check if it has other tabs
      if (existingTab?.tableId) {
        const hasOtherTabs = await tableHasOtherTabs(existingTab.tableId, Number(id));
        if (!hasOtherTabs) {
          await updateTableStatus(existingTab.tableId, TABLE_STATUS.AVAILABLE);
        }
      }
      // If new table assigned, set to occupied
      if (tableId) {
        await updateTableStatus(tableId, TABLE_STATUS.OCCUPIED);
      }
    }
    
    res.json(tab);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('tabs.log.updateError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('tabs.updateFailed') });
  }
});

// DELETE /api/tabs/:id - Delete a tab
tabsRouter.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the tab before deleting to check table assignment
    const tab = await prisma.tab.findUnique({
      where: { id: Number(id) }
    });

    await prisma.tab.delete({
      where: { id: Number(id) }
    });
    
    // Update table status if this was the last tab for the table
    if (tab?.tableId) {
      const hasOtherTabs = await tableHasOtherTabs(tab.tableId);
      if (!hasOtherTabs) {
        await updateTableStatus(tab.tableId, TABLE_STATUS.AVAILABLE);
      }
    }
    
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('tabs.log.deleteError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('tabs.deleteFailed') });
  }
});

export default tabsRouter;