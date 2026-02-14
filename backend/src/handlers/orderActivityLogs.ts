import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { OrderActivityLog } from '../types';
import { logWarn, logError } from '../utils/logger';
import { toUserReferenceDTO } from '../types/dto';
import i18n from '../i18n';

export const orderActivityLogsRouter = express.Router();

// GET /api/order-activity-logs - Get all order activity logs
orderActivityLogsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const orderActivityLogs = await prisma.orderActivityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100  // Limit to last 10 logs for performance
    });
    // Parse the details JSON string back to appropriate type
    const logsWithParsedDetails = orderActivityLogs.map(log => {
      // Handle details field - it might be stored as a JSON string or plain string
      let parsedDetails = log.details;
      if (typeof log.details === 'string') {
        // Check if the string looks like JSON (starts with {, [, or ")
        const trimmedDetails = log.details.trim();
        if ((trimmedDetails.startsWith('{') && trimmedDetails.endsWith('}')) ||
            (trimmedDetails.startsWith('[') && trimmedDetails.endsWith(']')) ||
            (trimmedDetails.startsWith('"') && trimmedDetails.endsWith('"'))) {
          try {
            parsedDetails = JSON.parse(log.details);
          } catch (e) {
            // If it looks like JSON but parsing fails, return as string
            logWarn(i18n.t('orderActivityLogs.log.parseDetailsError'), {
              correlationId: (req as any).correlationId,
            });
            parsedDetails = log.details;
          }
        } else {
          // If it doesn't look like JSON, return as string
          parsedDetails = log.details;
        }
      }
      return {
        ...log,
        details: parsedDetails,
        createdAt: log.createdAt.toISOString() // Ensure createdAt is in string format
      };
    });
    res.json(logsWithParsedDetails);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('orderActivityLogs.log.fetchError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('orderActivityLogs.fetchFailed') });
  }
});

// GET /api/order-activity-logs/:id - Get a specific order activity log
orderActivityLogsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderActivityLog = await prisma.orderActivityLog.findUnique({
      where: { id: Number(id) }
    });
    
    if (!orderActivityLog) {
      return res.status(404).json({ error: i18n.t('orderActivityLogs.notFound') });
    }
    
    // Parse the details JSON string back to appropriate type
    let parsedDetails = orderActivityLog.details;
    if (typeof orderActivityLog.details === 'string') {
      // Check if the string looks like JSON (starts with {, [, or ")
      const trimmedDetails = orderActivityLog.details.trim();
      if ((trimmedDetails.startsWith('{') && trimmedDetails.endsWith('}')) ||
          (trimmedDetails.startsWith('[') && trimmedDetails.endsWith(']')) ||
          (trimmedDetails.startsWith('"') && trimmedDetails.endsWith('"'))) {
        try {
            parsedDetails = JSON.parse(orderActivityLog.details);
          } catch (e) {
            // If it looks like JSON but parsing fails, return as string
            logWarn(i18n.t('orderActivityLogs.log.parseDetailsError'), {
              correlationId: (req as any).correlationId,
            });
            parsedDetails = orderActivityLog.details;
          }
      } else {
        // If it doesn't look like JSON, return as string
        parsedDetails = orderActivityLog.details;
      }
    }
    const logWithParsedDetails = {
      ...orderActivityLog,
      details: parsedDetails,
      createdAt: orderActivityLog.createdAt.toISOString() // Ensure createdAt is in string format
    };
    
    res.json(logWithParsedDetails);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('orderActivityLogs.log.fetchOneError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('orderActivityLogs.fetchOneFailed') });
  }
});

// POST /api/order-activity-logs - Create a new order activity log
orderActivityLogsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { action, details, userId, userName } = req.body as Omit<OrderActivityLog, 'id' | 'createdAt'>;
    
    const orderActivityLog = await prisma.orderActivityLog.create({
      data: {
        action,
        // Store details as JSON string if it's an object/array, otherwise store as string
        details: typeof details === 'string' ? details : JSON.stringify(details),
        userId,
        userName,
        createdAt: new Date()
      }
    });
    
    res.status(201).json(orderActivityLog);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('orderActivityLogs.log.createError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('orderActivityLogs.createFailed') });
  }
});

export default orderActivityLogsRouter;