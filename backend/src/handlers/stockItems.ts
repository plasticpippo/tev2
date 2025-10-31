import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { StockItem } from '../types';

export const stockItemsRouter = express.Router();

// GET /api/stock-items - Get all stock items
stockItemsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const stockItems = await prisma.stockItem.findMany();
    res.json(stockItems);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    res.status(500).json({ error: 'Failed to fetch stock items' });
 }
});

// GET /api/stock-items/:id - Get a specific stock item
stockItemsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stockItem = await prisma.stockItem.findUnique({
      where: { id: Number(id) }
    });
    
    if (!stockItem) {
      return res.status(404).json({ error: 'Stock item not found' });
    }
    
    res.json(stockItem);
  } catch (error) {
    console.error('Error fetching stock item:', error);
    res.status(500).json({ error: 'Failed to fetch stock item' });
 }
});

// POST /api/stock-items - Create a new stock item
stockItemsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, quantity, type, purchasingUnits } = req.body as Omit<StockItem, 'id'>;
    
    const stockItem = await prisma.stockItem.create({
      data: {
        name,
        quantity,
        type,
        purchasingUnits: purchasingUnits ? JSON.stringify(purchasingUnits) : undefined
      }
    });
    
    res.status(201).json(stockItem);
  } catch (error) {
    console.error('Error creating stock item:', error);
    res.status(500).json({ error: 'Failed to create stock item' });
  }
});

// PUT /api/stock-items/:id - Update a stock item
stockItemsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, quantity, type, purchasingUnits } = req.body as Omit<StockItem, 'id'>;
    
    const stockItem = await prisma.stockItem.update({
      where: { id: Number(id) },
      data: {
        name,
        quantity,
        type,
        purchasingUnits: purchasingUnits ? JSON.stringify(purchasingUnits) : undefined
      }
    });
    
    res.json(stockItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    res.status(500).json({ error: 'Failed to update stock item' });
  }
});

// DELETE /api/stock-items/:id - Delete a stock item
stockItemsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if this stock item is used in any product variants
    const stockConsumptions = await prisma.stockConsumption.count({
      where: { stockItemId: Number(id) }
    });
    
    if (stockConsumptions > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete stock item. It is currently used in a product recipe.' 
      });
    }
    
    await prisma.stockItem.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting stock item:', error);
    res.status(500).json({ error: 'Failed to delete stock item' });
  }
});

// PUT /api/stock-items/update-levels - Update stock levels based on consumption
stockItemsRouter.put('/update-levels', async (req: Request, res: Response) => {
 try {
    const { consumptions } = req.body as { consumptions: { stockItemId: number, quantity: number }[] };
    
    // Update each stock item by reducing its quantity
    for (const { stockItemId, quantity } of consumptions) {
      await prisma.stockItem.update({
        where: { id: stockItemId },
        data: {
          quantity: {
            decrement: quantity
          }
        }
      });
    }
    
    res.status(200).json({ message: 'Stock levels updated successfully' });
  } catch (error) {
    console.error('Error updating stock levels:', error);
    res.status(500).json({ error: 'Failed to update stock levels' });
  }
});

export default stockItemsRouter;