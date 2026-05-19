import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Till } from '../types';
import { validateTill, validateTillName } from '../utils/validation';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';

export const tillsRouter = express.Router();

// GET /api/tills - Get all tills
tillsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const venueId = (req as any).venueId;
  try {
    const tills = await prisma.till.findMany({ where: { venueId } });
    res.json(tills);
  } catch (error) {
    logError(error instanceof Error ? error : t('tills.log.fetchError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tills.fetchFailed') });
  }
});

// GET /api/tills/:id - Get a specific till
tillsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const venueId = (req as any).venueId;
  try {
    const { id } = req.params;
    const till = await prisma.till.findUnique({
      where: { id: Number(id) }
    });
    
    if (!till) {
      return res.status(404).json({ error: t('tills.notFound') });
    }
    
    if (till.venueId !== venueId) {
      return res.status(404).json({ error: t('tills.notFound') });
    }
    
    res.json(till);
  } catch (error) {
    logError(error instanceof Error ? error : t('tills.log.fetchOneError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tills.fetchOneFailed') });
  }
});

// POST /api/tills - Create a new till
tillsRouter.post('/', authenticateToken, requirePermission('tills:create'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const venueId = (req as any).venueId;
  try {
    const { name } = req.body as Omit<Till, 'id'>;
    
    // Validate till data
    const validation = validateTill({ name });
    if (!validation.isValid) {
      return res.status(400).json({ error: t('tills.validationFailed'), details: validation.errors });
    }
    
    const till = await prisma.till.create({
      data: {
        venueId,
        name
      }
    });
    
    res.status(201).json(till);
  } catch (error) {
    logError(error instanceof Error ? error : t('tills.log.createError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tills.createFailed') });
  }
});

// PUT /api/tills/:id - Update a till
tillsRouter.put('/:id', authenticateToken, requirePermission('tills:update'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const venueId = (req as any).venueId;
  try {
    const { id } = req.params;
    const { name } = req.body as Omit<Till, 'id'>;
    
    // Validate till data if name is provided
    if (name !== undefined) {
      const nameError = validateTillName(name);
      if (nameError) {
        return res.status(400).json({ error: t('tills.validationFailed'), details: [nameError] });
      }
    }
    
    const existing = await prisma.till.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ error: t('tills.notFound') });
    }
    if (existing.venueId !== venueId) {
      return res.status(404).json({ error: t('tills.notFound') });
    }
    
    const till = await prisma.till.update({
      where: { id: Number(id) },
      data: {
        name
      }
    });
    
    res.json(till);
  } catch (error) {
    logError(error instanceof Error ? error : t('tills.log.updateError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tills.updateFailed') });
  }
});

// DELETE /api/tills/:id - Delete a till
tillsRouter.delete('/:id', authenticateToken, requirePermission('tills:delete'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const venueId = (req as any).venueId;
  try {
    const { id } = req.params;
    
    const existing = await prisma.till.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ error: t('tills.notFound') });
    }
    if (existing.venueId !== venueId) {
      return res.status(404).json({ error: t('tills.notFound') });
    }
    
    // Remove this till from all category visibleTillIds arrays
    const allCategories = await prisma.category.findMany({
      where: { venueId },
      select: {
        id: true,
        visibleTillIds: true
      }
    });

    // Update each category to remove the till ID from visibleTillIds
    if (Array.isArray(allCategories)) {
      for (const category of allCategories) {
        if (category.visibleTillIds) {
          let visibleTillIdsArray: number[];
          
          if (Array.isArray(category.visibleTillIds)) {
            visibleTillIdsArray = category.visibleTillIds as number[];
          } else {
            // If it's a JSON string, parse it
            try {
              visibleTillIdsArray = JSON.parse(category.visibleTillIds as unknown as string);
            } catch (e) {
              // If parsing fails, treat as empty array
              visibleTillIdsArray = [];
            }
          }
          
          const updatedVisibleTillIds = visibleTillIdsArray.filter((tillId: number) => tillId !== Number(id));
          
          await prisma.category.update({
            where: { id: category.id },
            data: {
              visibleTillIds: JSON.stringify(updatedVisibleTillIds)
            }
          });
        }
      }
    }
    
    await prisma.till.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : t('tills.log.deleteError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('tills.deleteFailed') });
  }
});

export default tillsRouter;