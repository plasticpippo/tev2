import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Tab } from '../types';

export const tabsRouter = express.Router();

// GET /api/tabs - Get all tabs
tabsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tabs = await prisma.tab.findMany();
    res.json(tabs);
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
      where: { id: Number(id) }
    });
    
    if (!tab) {
      return res.status(404).json({ error: 'Tab not found' });
    }
    
    res.json(tab);
  } catch (error) {
    console.error('Error fetching tab:', error);
    res.status(500).json({ error: 'Failed to fetch tab' });
  }
});

// POST /api/tabs - Create a new tab
tabsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, items, tillId, tillName } = req.body as Omit<Tab, 'id' | 'createdAt'>;
    
    const tab = await prisma.tab.create({
      data: {
        name,
        items: JSON.stringify(items),
        tillId,
        tillName,
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
    const { name, items, tillId, tillName } = req.body as Omit<Tab, 'id' | 'createdAt'>;
    
    const tab = await prisma.tab.update({
      where: { id: Number(id) },
      data: {
        name,
        items: JSON.stringify(items),
        tillId,
        tillName
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