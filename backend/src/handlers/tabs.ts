import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Tab } from '../types';
import { logInfo, logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { safeJsonParse } from '../utils/jsonParser';

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
    logError(error instanceof Error ? error : 'Error fetching tabs', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch tabs' });
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
      return res.status(404).json({ error: 'Tab not found' });
    }
    
    // Parse the items JSON string back to array
    const tabWithParsedItems = {
      ...tab,
      items: safeJsonParse(tab.items, [], { id: String(tab.id), field: 'items' }),
      createdAt: tab.createdAt.toISOString() // Ensure createdAt is in string format
    };
    
    res.json(tabWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching tab', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch tab' });
  }
});

// POST /api/tabs - Create a new tab
tabsRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
 try {
    logInfo('POST /api/tabs called', {
      correlationId: (req as any).correlationId,
    });
    const { name, items, tillId, tillName, tableId } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      logInfo('Tab name validation failed', {
        correlationId: (req as any).correlationId,
      });
      return res.status(400).json({ error: 'Tab name is required and must be a non-empty string' });
    }
    
    // Validate items array
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          logError('Invalid item without name', {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: 'All items must have a valid name' });
        }
        if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
          logError('Invalid item properties', {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: 'All items must have valid id, variantId, productId, price, and quantity' });
        }
      }
    }
    
    // Check if a tab with the same name already exists
    const existingTab = await prisma.tab.findFirst({
      where: { name: name.trim() }
    });
    
    if (existingTab) {
      logInfo('Duplicate tab name detected', {
        correlationId: (req as any).correlationId,
      });
      return res.status(409).json({ error: 'A tab with this name already exists' });
    }
    
    // If tableId is provided, verify that the table exists
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });
      
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
    }
    
    logInfo('Creating new tab', {
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
    
    logInfo('Tab created successfully', {
      correlationId: (req as any).correlationId,
    });
    res.status(201).json(tab);
 } catch (error) {
    logError(error instanceof Error ? error : 'Error creating tab', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to create tab' });
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
        return res.status(400).json({ error: 'Tab name must be a non-empty string' });
      }
      
      // Check if a tab with the same name already exists (excluding the current tab)
      const existingTab = await prisma.tab.findFirst({
        where: {
          name: name.trim(),
          id: { not: Number(id) } // Exclude current tab from check
        }
      });
      
      if (existingTab) {
        return res.status(409).json({ error: 'A tab with this name already exists' });
      }
    }
    
    // Validate items array if provided
    if (items !== undefined && Array.isArray(items)) {
      for (const item of items) {
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          logError('Invalid item without name', {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: 'All items must have a valid name' });
        }
        if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
          logError('Invalid item properties', {
            correlationId: (req as any).correlationId,
          });
          return res.status(400).json({ error: 'All items must have valid id, variantId, productId, price, and quantity' });
        }
      }
    }
    
    // If tableId is provided, verify that the table exists
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });
      
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
    }
    
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
    
    res.json(tab);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating tab', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to update tab' });
  }
});

// DELETE /api/tabs/:id - Delete a tab
tabsRouter.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.tab.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting tab', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to delete tab' });
  }
});

export default tabsRouter;