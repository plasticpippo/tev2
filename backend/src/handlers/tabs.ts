import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Tab } from '../types';

export const tabsRouter = express.Router();

// GET /api/tabs - Get all tabs
tabsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tabs = await prisma.tab.findMany({
      include: {
        table: true
      }
    });
    // Parse the items JSON string back to array
    const tabsWithParsedItems = tabs.map(tab => ({
      ...tab,
      items: typeof tab.items === 'string' ? JSON.parse(tab.items) : tab.items,
      createdAt: tab.createdAt.toISOString() // Ensure createdAt is in string format
    }));
    res.json(tabsWithParsedItems);
  } catch (error) {
    console.error('Error fetching tabs:', error);
    res.status(500).json({ error: 'Failed to fetch tabs' });
  }
});

// GET /api/tabs/:id - Get a specific tab
tabsRouter.get('/:id', async (req: Request, res: Response) => {
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
      items: typeof tab.items === 'string' ? JSON.parse(tab.items) : tab.items,
      createdAt: tab.createdAt.toISOString() // Ensure createdAt is in string format
    };
    
    res.json(tabWithParsedItems);
  } catch (error) {
    console.error('Error fetching tab:', error);
    res.status(500).json({ error: 'Failed to fetch tab' });
  }
});

// POST /api/tabs - Create a new tab
tabsRouter.post('/', async (req: Request, res: Response) => {
 try {
    console.log('Backend: POST /api/tabs called with body:', req.body);
    const { name, items, tillId, tillName, tableId } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      console.log('Backend: Tab name validation failed:', { name, type: typeof name, trimmed: name?.trim() });
      return res.status(400).json({ error: 'Tab name is required and must be a non-empty string' });
    }
    
    // Check if a tab with the same name already exists
    const existingTab = await prisma.tab.findFirst({
      where: { name: name.trim() }
    });
    
    if (existingTab) {
      console.log('Backend: Duplicate tab name detected:', name.trim());
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
    
    console.log('Backend: Creating new tab with data:', { name: name.trim(), items, tillId, tillName, tableId });
    const tab = await prisma.tab.create({
      data: {
        name: name.trim(), // Trim whitespace
        items: JSON.stringify(items),
        tillId,
        tillName,
        tableId: tableId || null,
        createdAt: new Date()
      }
    });
    
    console.log('Backend: Tab created successfully:', tab);
    res.status(201).json(tab);
 } catch (error) {
    console.error('Error creating tab:', error);
    res.status(500).json({ error: 'Failed to create tab' });
  }
});

// PUT /api/tabs/:id - Update a tab
tabsRouter.put('/:id', async (req: Request, res: Response) => {
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
        items: JSON.stringify(items),
        tillId,
        tillName,
        tableId: tableId || null
      }
    });
    
    res.json(tab);
  } catch (error) {
    console.error('Error updating tab:', error);
    res.status(500).json({ error: 'Failed to update tab' });
  }
});

// DELETE /api/tabs/:id - Delete a tab
tabsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.tab.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tab:', error);
    res.status(500).json({ error: 'Failed to delete tab' });
  }
});

export default tabsRouter;