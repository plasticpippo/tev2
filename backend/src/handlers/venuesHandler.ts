import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/requirePermission';
import { logError, logAuditEvent } from '../utils/logger';

export const venuesRouter = express.Router();

venuesRouter.get('/', authenticateToken, requirePermission('venues:read'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const venues = await prisma.venue.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    res.json(venues);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching venues', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('venues.fetchFailed') });
  }
});

venuesRouter.post('/', authenticateToken, requirePermission('venues:create'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { name, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: t('venues.nameRequired') });
    }

    const venue = await prisma.venue.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
      },
    });

    logAuditEvent('CONFIG_CHANGED', 'Venue created', {
      venueName: venue.name,
      correlationId: (req as any).correlationId,
    }, 'medium', { userId: req.user?.id, username: req.user?.username });

    res.status(201).json(venue);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating venue', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('venues.createFailed') });
  }
});

venuesRouter.get('/:id', authenticateToken, requirePermission('venues:read'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: t('venues.invalidId') });
    }

    const venue = await prisma.venue.findUnique({ where: { id } });

    if (!venue) {
      return res.status(404).json({ error: t('venues.notFound') });
    }

    res.json(venue);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching venue', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('venues.fetchOneFailed') });
  }
});

venuesRouter.put('/:id', authenticateToken, requirePermission('venues:update'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: t('venues.invalidId') });
    }

    const existing = await prisma.venue.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: t('venues.notFound') });
    }

    const { name, address } = req.body;

    const venue = await prisma.venue.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(address !== undefined && { address: address?.trim() || null }),
      },
    });

    logAuditEvent('CONFIG_CHANGED', 'Venue updated', {
      venueId: id,
      venueName: venue.name,
      correlationId: (req as any).correlationId,
    }, 'medium', { userId: req.user?.id, username: req.user?.username });

    res.json(venue);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating venue', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('venues.updateFailed') });
  }
});

venuesRouter.delete('/:id', authenticateToken, requirePermission('venues:delete'), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: t('venues.invalidId') });
    }

    const existing = await prisma.venue.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: t('venues.notFound') });
    }

    if (!existing.isActive) {
      return res.status(400).json({ error: t('venues.alreadyDeactivated') });
    }

    const venue = await prisma.venue.update({
      where: { id },
      data: { isActive: false },
    });

    logAuditEvent('CONFIG_CHANGED', 'Venue deactivated', {
      venueId: id,
      venueName: venue.name,
      correlationId: (req as any).correlationId,
    }, 'high', { userId: req.user?.id, username: req.user?.username });

    res.json(venue);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deactivating venue', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('venues.deactivateFailed') });
  }
});

export default venuesRouter;
