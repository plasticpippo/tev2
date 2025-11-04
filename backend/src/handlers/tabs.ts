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
    const { name, items, tillId, tillName, tableId } = req.body;
    
    // If tableId is provided, verify that the table exists
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });
      
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
    }
    
    const tab = await prisma.tab.create({
      data: {
        name,
        items: JSON.stringify(items),
        tillId,
        tillName,
        tableId: tableId || null,
        createdAt: new Date()
      }
    });
    
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
        name,
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