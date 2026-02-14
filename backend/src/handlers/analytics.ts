import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { validateAnalyticsParams } from '../utils/validation';
import { aggregateProductPerformance } from '../services/analyticsService';
import { logError } from '../utils/logger';
import i18n from '../i18n';

export const analyticsRouter = express.Router();

// GET /api/analytics/product-performance - Get detailed product performance metrics
analyticsRouter.get('/product-performance', async (req: Request, res: Response) => {
  try {
    // Validate and parse query parameters
    const params = validateAnalyticsParams(req.query);
    
    // Execute aggregation query
    const results = await aggregateProductPerformance(params);
    
    // Format response
    res.json(results);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching product performance', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.analytics.productPerformance.fetchFailed') });
  }
});

// GET /api/analytics/top-performers - Maintains backward compatibility with existing functionality
analyticsRouter.get('/top-performers', async (req: Request, res: Response) => {
  try {
    // Validate and parse query parameters
    const params = validateAnalyticsParams(req.query);
    
    // Execute aggregation query with default limit of 5 for backward compatibility
    const results = await aggregateProductPerformance({
      ...params,
      limit: params.limit || 5,
      includeAllProducts: false
    });
    
    // Format response to maintain backward compatibility
    res.json(results);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching top performers', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.analytics.topPerformers.fetchFailed') });
  }
});