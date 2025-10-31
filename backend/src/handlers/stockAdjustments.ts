import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { StockAdjustment } from '../types';

export const stockAdjustmentsRouter = express.Router();

// GET /api/stock-adjustments - Get all stock adjustments
stockAdjustmentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const stockAdjustments = await prisma.stockAdjustment.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(stockAdjustments);
  } catch (error) {
    console.error('Error fetching stock adjustments:', error);
    res.status(500).json({ error: 'Failed to fetch stock adjustments' });
 }
});

// GET /api/stock-adjustments/:id - Get a specific stock adjustment
stockAdjustmentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stockAdjustment = await prisma.stockAdjustment.findUnique({
      where: { id: Number(id) }
    });
    
    if (!stockAdjustment) {
      return res.status(404).json({ error: 'Stock adjustment not found' });
    }
    
    res.json(stockAdjustment);
  } catch (error) {
    console.error('Error fetching stock adjustment:', error);
    res.status(500).json({ error: 'Failed to fetch stock adjustment' });
  }
});

// POST /api/stock-adjustments - Create a new stock adjustment
stockAdjustmentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { stockItemId, itemName, quantity, reason, userId, userName } = req.body as Omit<StockAdjustment, 'id' | 'createdAt'>;
    
    // Update the stock item quantity
    await prisma.stockItem.update({
      where: { id: stockItemId },
      data: {
        quantity: {
          increment: quantity  // This can be positive or negative
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
    console.error('Error creating stock adjustment:', error);
    res.status(500).json({ error: 'Failed to create stock adjustment' });
  }
});

export default stockAdjustmentsRouter;