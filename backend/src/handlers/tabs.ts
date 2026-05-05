import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Tab } from '../types';
import { logInfo, logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { safeJsonParse } from '../utils/jsonParser';
import { TABLE_STATUS, isValidStatusTransition } from '../utils/tableStatus';

// Helper function to validate and update table status within a transaction
async function validateAndUpdateTableStatus(
  tx: any,
  tableId: string,
  newStatus: string
): Promise<void> {
  const table = await tx.table.findUnique({
    where: { id: tableId },
    select: { status: true }
  });

  if (!table) {
    throw new Error('Table not found');
  }

  if (!isValidStatusTransition(table.status, newStatus)) {
    throw new Error(`Invalid status transition from ${table.status} to ${newStatus}`);
  }

  await tx.table.update({
    where: { id: tableId },
    data: { status: newStatus }
  });
}

export const tabsRouter = express.Router();

// GET /api/tabs - Get all tabs
tabsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const tabs = await prisma.tab.findMany({
      include: {
        table: true
      }
    });
    // Parse the items JSON string back to array
    // Use type assertion to handle the raw JSON string from database
    const tabsWithParsedItems = tabs.map((tab: typeof tabs[number]) => {
      const tabWithItems = tab as unknown as { items: string | null; createdAt: Date };
      return {
        ...tab,
        items: safeJsonParse(tabWithItems.items, [], { id: String(tab.id), field: 'items' }),
        createdAt: tabWithItems.createdAt.toISOString() // Ensure createdAt is in string format
      };
    });
    res.json(tabsWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : t('tabs.log.fetchError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tabs.fetchFailed') });
  }
});

// GET /api/tabs/:id - Get a specific tab
tabsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const tab = await prisma.tab.findUnique({
      where: { id: Number(id) },
      include: {
        table: true
      }
    });
    
    if (!tab) {
      return res.status(404).json({ error: t('tabs.notFound') });
    }
    
    // Parse the items JSON string back to array
    const tabWithParsedItems = {
      ...tab,
      items: safeJsonParse(tab.items, [], { id: String(tab.id), field: 'items' }),
      createdAt: tab.createdAt.toISOString() // Ensure createdAt is in string format
    };
    
    res.json(tabWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : t('tabs.log.fetchOneError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tabs.fetchOneFailed') });
  }
});

// POST /api/tabs - Create a new tab
tabsRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    logInfo(t('tabs.log.createCalled'), {
      correlationId: (req as any).correlationId,
    });
    const { name, items, tillId, tillName, tableId } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      logInfo(t('tabs.log.nameValidationFailed'), {
        correlationId: (req as any).correlationId,
      });
      return res.status(400).json({ error: t('tabs.nameRequired') });
    }

    // Validate items array
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          logError(t('tabs.log.itemWithoutName'), {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: t('tabs.itemNameRequired') });
        }
        if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
          logError(t('tabs.log.itemInvalidProperties'), {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: t('tabs.itemInvalidProperties') });
        }
      }
    }

    // If tableId is provided, verify that the table exists
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        return res.status(404).json({ error: t('tabs.tableNotFound') });
      }
    }

    logInfo(t('tabs.log.creating'), {
      correlationId: (req as any).correlationId,
    });

    // Wrap tab creation and table status update in a transaction
    const tab = await prisma.$transaction(async (tx) => {
      // Check for duplicate name within the transaction
      const existingTab = await tx.tab.findFirst({
        where: { name: name.trim() }
      });

      if (existingTab) {
        logInfo(t('tabs.log.duplicateNameDetected'), {
          correlationId: (req as any).correlationId,
        });
        throw new Error(t('tabs.duplicateName'));
      }

      // Check table availability if tableId is provided
      if (tableId) {
        const table = await tx.table.findUnique({
          where: { id: tableId },
          select: { status: true }
        });

        if (!table) {
          throw new Error(t('tabs.tableNotFound'));
        }

        if (table.status !== TABLE_STATUS.AVAILABLE) {
          throw new Error(t('tabs.tableNotAvailable'));
        }
      }

      // Create the tab
      const newTab = await tx.tab.create({
        data: {
          name: name.trim(),
          items: JSON.stringify(items || []),
          tillId,
          tillName,
          tableId: tableId || null,
          createdAt: new Date()
        }
      });

      // Update table status to occupied if tableId is provided
      if (tableId) {
        await validateAndUpdateTableStatus(tx, tableId, TABLE_STATUS.OCCUPIED);
      }

      return newTab;
    });

    logInfo(t('tabs.log.created'), {
      correlationId: (req as any).correlationId,
    });
    res.status(201).json(tab);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === t('tabs.duplicateName')) {
        return res.status(409).json({ error: t('tabs.duplicateName') });
      }
      if (error.message === t('tabs.tableNotFound')) {
        return res.status(404).json({ error: t('tabs.tableNotFound') });
      }
      if (error.message === t('tabs.tableNotAvailable')) {
        return res.status(409).json({ error: t('tabs.tableNotAvailable') });
      }
    }

    logError(error instanceof Error ? error : t('tabs.log.createError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tabs.createFailed') });
  }
});

// PUT /api/tabs/transfer - Atomically transfer items between tabs (MUST be before /:id)
tabsRouter.put('/transfer', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { sourceTabId, destination, itemsToMove } = req.body;

    // Validate required fields
    if (!sourceTabId || typeof sourceTabId !== 'number') {
      return res.status(400).json({ error: t('tabs.sourceTabIdRequired') });
    }

    if (!destination || !destination.type) {
      return res.status(400).json({ error: t('tabs.destinationRequired') });
    }

    if (!itemsToMove || !Array.isArray(itemsToMove) || itemsToMove.length === 0) {
      return res.status(400).json({ error: t('tabs.itemsToMoveRequired') });
    }

    // Validate items array
    for (const item of itemsToMove) {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        return res.status(400).json({ error: t('tabs.itemNameRequired') });
      }
      if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return res.status(400).json({ error: t('tabs.itemInvalidProperties') });
      }
    }

    // Validate destination
    if (destination.type === 'existing') {
      if (!destination.id || typeof destination.id !== 'number') {
        return res.status(400).json({ error: t('tabs.destinationIdRequired') });
      }
    } else if (destination.type === 'new') {
      if (!destination.name || typeof destination.name !== 'string' || destination.name.trim() === '') {
        return res.status(400).json({ error: t('tabs.nameRequired') });
      }
      if (!destination.tillId || typeof destination.tillId !== 'number') {
        return res.status(400).json({ error: t('tabs.tillIdRequired') });
      }
      if (!destination.tillName || typeof destination.tillName !== 'string') {
        return res.status(400).json({ error: t('tabs.tillNameRequired') });
      }
    } else {
      return res.status(400).json({ error: t('tabs.invalidDestinationType') });
    }

    // Execute atomic transfer within a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Fetch source tab
      const sourceTab = await tx.tab.findUnique({
        where: { id: sourceTabId },
        include: { table: true }
      });

      if (!sourceTab) {
        throw new Error(t('tabs.sourceTabNotFound'));
      }

      let destinationTab;
      if (destination.type === 'new') {
        // Check if a tab with the same name already exists
        const existingTab = await tx.tab.findFirst({
          where: { name: destination.name.trim() }
        });

        if (existingTab) {
          throw new Error(t('tabs.duplicateName'));
        }

        // Create new destination tab
        destinationTab = await tx.tab.create({
          data: {
            name: destination.name.trim(),
            items: JSON.stringify([]),
            tillId: destination.tillId,
            tillName: destination.tillName,
            createdAt: new Date()
          }
        });

        // Update table status if tableId provided
        if (destination.tableId) {
          await validateAndUpdateTableStatus(tx, destination.tableId, TABLE_STATUS.OCCUPIED);
        }
      } else {
        // Fetch existing destination tab
        destinationTab = await tx.tab.findUnique({
          where: { id: destination.id },
          include: { table: true }
        });

        if (!destinationTab) {
          throw new Error(t('tabs.destinationTabNotFound'));
        }
      }

      // Parse current items from both tabs
      const sourceItems = safeJsonParse<any[]>(sourceTab.items, [], { id: String(sourceTab.id), field: 'items' });
      const destItems = safeJsonParse<any[]>(destinationTab.items, [], { id: String(destinationTab.id), field: 'items' });

      // Add items to destination (merge by variantId)
      itemsToMove.forEach(movingItem => {
        const existing = destItems.find(i => i.variantId === movingItem.variantId);
        if (existing) {
          existing.quantity += movingItem.quantity;
        } else {
          destItems.push({ ...movingItem, id: movingItem.id });
        }
      });

      // Remove items from source (decrement quantities, remove if quantity becomes 0)
      itemsToMove.forEach(movingItem => {
        const existingIndex = sourceItems.findIndex(i => i.id === movingItem.id);
        if (existingIndex > -1) {
          sourceItems[existingIndex].quantity -= movingItem.quantity;
        }
      });
      const finalSourceItems = sourceItems.filter(i => i.quantity > 0);

      // Update destination tab
      await tx.tab.update({
        where: { id: destinationTab.id },
        data: { items: JSON.stringify(destItems) }
      });

      // Update source tab or delete if empty
      if (finalSourceItems.length === 0) {
        // Delete empty source tab
        await tx.tab.delete({ where: { id: sourceTabId } });

        // Update table status if source was the last tab
        if (sourceTab.tableId) {
          const hasOtherTabs = await tx.tab.count({
            where: { tableId: sourceTab.tableId }
          }) > 0;

          if (!hasOtherTabs) {
            await validateAndUpdateTableStatus(tx, sourceTab.tableId, TABLE_STATUS.AVAILABLE);
          }
        }
      } else {
        // Update source tab with remaining items
        await tx.tab.update({
          where: { id: sourceTabId },
          data: { items: JSON.stringify(finalSourceItems) }
        });
      }

      return {
        destinationTab,
        sourceTabDeleted: finalSourceItems.length === 0
      };
    });

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : t('tabs.log.transferError'), {
      correlationId: (req as any).correlationId,
    });

    if (error instanceof Error) {
      if (error.message === t('tabs.duplicateName')) {
        return res.status(409).json({ error: t('tabs.duplicateName') });
      }
      if (error.message === t('tabs.sourceTabNotFound')) {
        return res.status(404).json({ error: t('tabs.sourceTabNotFound') });
      }
      if (error.message === t('tabs.destinationTabNotFound')) {
        return res.status(404).json({ error: t('tabs.destinationTabNotFound') });
      }
    }

    res.status(500).json({ error: t('tabs.transferFailed') });
  }
});

// PUT /api/tabs/:id - Update a tab
tabsRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const { name, items, tillId, tillName, tableId, version } = req.body;

    // Validate version for optimistic locking
    if (version === undefined || typeof version !== 'number' || version < 0) {
      return res.status(400).json({ error: t('validation.invalidFormat') });
    }

    // Validate name if it's provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: t('tabs.nameNonEmpty') });
      }
    }

    // Validate items array if provided
    if (items !== undefined && Array.isArray(items)) {
      for (const item of items) {
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          logError(t('tabs.log.itemWithoutName'), {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: t('tabs.itemNameRequired') });
        }
        if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
          logError(t('tabs.log.itemInvalidProperties'), {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: t('tabs.itemInvalidProperties') });
        }
      }
    }

    // If tableId is provided, verify that the table exists
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        return res.status(404).json({ error: t('tabs.tableNotFound') });
      }
    }

    // Wrap tab update and table status changes in a transaction
    const tab = await prisma.$transaction(async (tx) => {
      // Get the existing tab to check for table assignment changes
      const existingTab = await tx.tab.findUnique({
        where: { id: Number(id) }
      });

      if (!existingTab) {
        throw new Error(t('tabs.notFound'));
      }

      // Check for duplicate name if name is being changed
      if (name !== undefined) {
        const duplicateTab = await tx.tab.findFirst({
          where: {
            name: name.trim(),
            id: { not: Number(id) }
          }
        });

        if (duplicateTab) {
          throw new Error(t('tabs.duplicateName'));
        }
      }

      // Use updateMany with version check for optimistic locking
      const updateResult = await tx.tab.updateMany({
        where: {
          id: Number(id),
          version: version
        },
        data: {
          name: name !== undefined ? name.trim() : undefined,
          items: items !== undefined ? JSON.stringify(items) : undefined,
          tillId,
          tillName,
          tableId: tableId || null,
          version: { increment: 1 }
        }
      });

      // Check if the update succeeded (version matched)
      if (updateResult.count === 0) {
        throw new Error(t('tabs.conflict'));
      }

      // Handle table status changes
      if (existingTab.tableId !== tableId) {
        // If table was unassigned, check if it has other tabs
        if (existingTab.tableId) {
          const hasOtherTabs = await tx.tab.count({
            where: { tableId: existingTab.tableId, id: { not: Number(id) } }
          }) > 0;

          if (!hasOtherTabs) {
            await validateAndUpdateTableStatus(tx, existingTab.tableId, TABLE_STATUS.AVAILABLE);
          }
        }
        // If new table assigned, set to occupied
        if (tableId) {
          // Check table availability before assigning
          const table = await tx.table.findUnique({
            where: { id: tableId },
            select: { status: true }
          });

          if (!table) {
            throw new Error(t('tabs.tableNotFound'));
          }

          if (table.status !== TABLE_STATUS.AVAILABLE) {
            throw new Error(t('tabs.tableNotAvailable'));
          }

          await validateAndUpdateTableStatus(tx, tableId, TABLE_STATUS.OCCUPIED);
        }
      }

      // Fetch the updated tab
      return await tx.tab.findUnique({
        where: { id: Number(id) }
      });
    });

    res.json(tab);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === t('tabs.duplicateName')) {
        return res.status(409).json({ error: t('tabs.duplicateName') });
      }
      if (error.message === t('tabs.notFound')) {
        return res.status(404).json({ error: t('tabs.notFound') });
      }
      if (error.message === t('tabs.conflict')) {
        return res.status(409).json({ error: t('tabs.conflict') });
      }
      if (error.message === t('tabs.tableNotFound')) {
        return res.status(404).json({ error: t('tabs.tableNotFound') });
      }
      if (error.message === t('tabs.tableNotAvailable')) {
        return res.status(409).json({ error: t('tabs.tableNotAvailable') });
      }
    }

    logError(error instanceof Error ? error : t('tabs.log.updateError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tabs.updateFailed') });
  }
});

// DELETE /api/tabs/:id - Delete a tab
tabsRouter.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;

    // Wrap tab deletion and table status update in a transaction
    await prisma.$transaction(async (tx) => {
      // Get the tab before deleting to check table assignment
      const tab = await tx.tab.findUnique({
        where: { id: Number(id) }
      });

      if (!tab) {
        throw new Error(t('tabs.notFound'));
      }

      // Delete the tab
      await tx.tab.delete({
        where: { id: Number(id) }
      });

      // Update table status if this was the last tab for the table
      if (tab.tableId) {
        const hasOtherTabs = await tx.tab.count({
          where: { tableId: tab.tableId }
        }) > 0;

        if (!hasOtherTabs) {
          await validateAndUpdateTableStatus(tx, tab.tableId, TABLE_STATUS.AVAILABLE);
        }
      }
    });

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === t('tabs.notFound')) {
      return res.status(404).json({ error: t('tabs.notFound') });
    }

    logError(error instanceof Error ? error : t('tabs.log.deleteError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tabs.deleteFailed') });
  }
});

// PUT /api/tabs/:id/request-bill - Request bill for a tab (sets table to bill_requested)
tabsRouter.put('/:id/request-bill', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';
    
    // Get the tab to check if it exists and has a table
    const tab = await prisma.tab.findUnique({
      where: { id: Number(id) },
      include: { table: true }
    });
    
    if (!tab) {
      return res.status(404).json({ error: t('tabs.notFound') });
    }
    
    if (!tab.tableId) {
      return res.status(400).json({ error: t('tabs.noTableAssigned') });
    }
    
    // Authorization check: user must own the table or be admin
    // Tab ownership is through the associated table's ownerId
    if (tab.table && tab.table.ownerId !== null && tab.table.ownerId !== undefined) {
      const isOwner = tab.table.ownerId === userId;
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: t('errors.authorization.tableAccessDenied') });
      }
    }
    
    // Update table status to bill_requested with transition validation within a transaction
    await prisma.$transaction(async (tx) => {
      await validateAndUpdateTableStatus(tx, tab.tableId!, TABLE_STATUS.BILL_REQUESTED);
    });

    logInfo(t('tabs.log.billRequested'), {
      correlationId: (req as any).correlationId,
      tabId: tab.id,
      tableId: tab.tableId
    });

    res.json({ message: t('tabs.billRequested'), tableId: tab.tableId });
  } catch (error) {
    logError(error instanceof Error ? error : t('tabs.log.billRequestError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tabs.billRequestFailed') });
  }
});

export default tabsRouter;
