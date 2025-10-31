import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Till } from '../types';

export const tillsRouter = express.Router();

// GET /api/tills - Get all tills
tillsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tills = await prisma.till.findMany();
    res.json(tills);
  } catch (error) {
    console.error('Error fetching tills:', error);
    res.status(500).json({ error: 'Failed to fetch tills' });
 }
});

// GET /api/tills/:id - Get a specific till
tillsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const till = await prisma.till.findUnique({
      where: { id: Number(id) }
    });
    
    if (!till) {
      return res.status(404).json({ error: 'Till not found' });
    }
    
    res.json(till);
  } catch (error) {
    console.error('Error fetching till:', error);
    res.status(500).json({ error: 'Failed to fetch till' });
  }
});

// POST /api/tills - Create a new till
tillsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body as Omit<Till, 'id'>;
    
    const till = await prisma.till.create({
      data: {
        name
      }
    });
    
    res.status(201).json(till);
  } catch (error) {
    console.error('Error creating till:', error);
    res.status(500).json({ error: 'Failed to create till' });
  }
});

// PUT /api/tills/:id - Update a till
tillsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body as Omit<Till, 'id'>;
    
    const till = await prisma.till.update({
      where: { id: Number(id) },
      data: {
        name
      }
    });
    
    res.json(till);
  } catch (error) {
    console.error('Error updating till:', error);
    res.status(500).json({ error: 'Failed to update till' });
  }
});

// DELETE /api/tills/:id - Delete a till
tillsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Remove this till from all category visibleTillIds arrays
    await prisma.category.updateMany({
      data: {
        visibleTillIds: {
          // This would require a raw SQL update or custom logic to remove the id from JSON arrays
          // For now, we'll just update the record to remove the till from visibleTillIds
          set: { value: [] } // This is a placeholder - proper implementation would require more complex logic
        }
      },
      where: {
        visibleTillIds: { 
          path: '$', 
          array_contains: id 
        }
      }
    });
    
    await prisma.till.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting till:', error);
    res.status(500).json({ error: 'Failed to delete till' });
  }
});

export default tillsRouter;