import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { validateAnalyticsParams } from '../utils/validation';
import { aggregateProductPerformance, aggregateHourlySales, compareHourlySales } from '../services/analyticsService';
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

// ============================================================================
// HOURLY SALES ENDPOINTS
// ============================================================================

// GET /api/analytics/hourly-sales - Get hourly sales for a specific business day
analyticsRouter.get('/hourly-sales', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: i18n.t('errors.analytics.hourlySales.dateRequired') });
      return;
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }
    
    // Get settings for business day configuration
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      res.status(500).json({ error: i18n.t('errors.settings.notFound') });
      return;
    }
    
    const result = await aggregateHourlySales(date, {
      autoStartTime: settings.autoStartTime,
      businessDayEndHour: settings.businessDayEndHour,
    });
    
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching hourly sales', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.analytics.hourlySales.fetchFailed') });
  }
});

// GET /api/analytics/compare - Compare hourly sales between two days
analyticsRouter.get('/compare', async (req: Request, res: Response) => {
  try {
    const { date1, date2 } = req.query;
    
    if (!date1 || !date2 || typeof date1 !== 'string' || typeof date2 !== 'string') {
      res.status(400).json({ error: i18n.t('errors.analytics.compare.datesRequired') });
      return;
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date1) || !dateRegex.test(date2)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }
    
    // Get settings for business day configuration
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      res.status(500).json({ error: i18n.t('errors.settings.notFound') });
      return;
    }
    
    const result = await compareHourlySales(date1, date2, {
      autoStartTime: settings.autoStartTime,
      businessDayEndHour: settings.businessDayEndHour,
    });
    
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error comparing hourly sales', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.analytics.compare.fetchFailed') });
  }
});