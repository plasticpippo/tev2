import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { logError } from '../utils/logger';
import i18n from '../i18n';

export const stockReconciliationsRouter = express.Router();

// Types for StockReconciliation
type StockReconciliationStatus = 'PENDING' | 'RESOLVED' | 'MANUAL';

interface StockReconciliationQueryParams {
  page?: string;
  limit?: string;
  status?: StockReconciliationStatus;
  errorType?: string;
}

// GET /api/stock-reconciliations - List all reconciliation records
stockReconciliationsRouter.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', status, errorType } = req.query as StockReconciliationQueryParams;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (errorType) {
      where.errorType = errorType;
    }

    // Execute query with pagination
    const [reconciliations, total] = await Promise.all([
      prisma.stockReconciliation.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.stockReconciliation.count({ where })
    ]);

    // Format response with pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      data: reconciliations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching stock reconciliations', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockReconciliations.fetchFailed') });
  }
});

// GET /api/stock-reconciliations/:id - Get a single reconciliation record by ID
stockReconciliationsRouter.get('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reconciliation = await prisma.stockReconciliation.findUnique({
      where: { id }
    });

    if (!reconciliation) {
      return res.status(404).json({ error: i18n.t('errors:stockReconciliations.notFound') });
    }

    res.json(reconciliation);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching stock reconciliation', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockReconciliations.fetchOneFailed') });
  }
});

// PUT /api/stock-reconciliations/:id/resolve - Mark a reconciliation as resolved
stockReconciliationsRouter.put('/:id/resolve', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body as { resolution?: string };

    // Check if reconciliation exists
    const existingReconciliation = await prisma.stockReconciliation.findUnique({
      where: { id }
    });

    if (!existingReconciliation) {
      return res.status(404).json({ error: i18n.t('errors:stockReconciliations.notFound') });
    }

    // Check if already resolved
    if (existingReconciliation.status === 'RESOLVED') {
      return res.status(400).json({ error: i18n.t('errors:stockReconciliations.alreadyResolved') });
    }

    // Get current user ID from auth middleware
    const userId = req.user?.id;
    // Handle different user ID types (could be number or string)
    const userIdString = userId !== undefined ? String(userId) : 'unknown';

    // Update the reconciliation as resolved
    const updatedReconciliation = await prisma.stockReconciliation.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: userIdString,
        resolution: resolution || null
      }
    });

    res.json(updatedReconciliation);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error resolving stock reconciliation', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockReconciliations.resolveFailed') });
  }
});

// POST /api/stock-reconciliations/:id/escalate - Escalate a reconciliation to manual
stockReconciliationsRouter.post('/:id/escalate', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { escalationNotes } = req.body as { escalationNotes?: string };

    // Check if reconciliation exists
    const existingReconciliation = await prisma.stockReconciliation.findUnique({
      where: { id }
    });

    if (!existingReconciliation) {
      return res.status(404).json({ error: i18n.t('errors:stockReconciliations.notFound') });
    }

    // Check if already manual
    if (existingReconciliation.status === 'MANUAL') {
      return res.status(400).json({ error: i18n.t('errors:stockReconciliations.alreadyManual') });
    }

    // Check if already resolved (cannot escalate resolved items)
    if (existingReconciliation.status === 'RESOLVED') {
      return res.status(400).json({ error: i18n.t('errors:stockReconciliations.cannotEscalateResolved') });
    }

    // Update the reconciliation to manual status
    const updatedReconciliation = await prisma.stockReconciliation.update({
      where: { id },
      data: {
        status: 'MANUAL',
        resolution: escalationNotes || null
      }
    });

    res.json(updatedReconciliation);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error escalating stock reconciliation', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockReconciliations.escalateFailed') });
  }
});

export default stockReconciliationsRouter;
