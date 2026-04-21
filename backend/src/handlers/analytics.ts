import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { validateAnalyticsParams } from '../utils/validation';
import { aggregateProductPerformance, aggregateHourlySales, compareHourlySales, getProfitSummary, getProfitComparison, getMarginByCategory, getMarginByProduct, getMarginTrend, getProfitDashboard } from '../services/analyticsService';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';

export const analyticsRouter = express.Router();

// GET /api/analytics/product-performance - Get detailed product performance metrics
analyticsRouter.get('/product-performance', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
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
    res.status(500).json({ error: t('errors.analytics.productPerformance.fetchFailed') });
  }
});

// GET /api/analytics/top-performers - Maintains backward compatibility with existing functionality
analyticsRouter.get('/top-performers', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
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
    res.status(500).json({ error: t('errors.analytics.topPerformers.fetchFailed') });
  }
});

// ============================================================================
// HOURLY SALES ENDPOINTS
// ============================================================================

// GET /api/analytics/hourly-sales - Get hourly sales for a specific business day
analyticsRouter.get('/hourly-sales', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { date } = req.query;
    
    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: t('errors.analytics.hourlySales.dateRequired') });
      return;
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      res.status(400).json({ error: t('errors:analytics.invalidDateFormat') });
      return;
    }
    
    // Get settings for business day configuration
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      res.status(500).json({ error: t('errors.settings.notFound') });
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
    res.status(500).json({ error: t('errors.analytics.hourlySales.fetchFailed') });
  }
});

// GET /api/analytics/compare - Compare hourly sales between two days
analyticsRouter.get('/compare', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { date1, date2 } = req.query;
    
    if (!date1 || !date2 || typeof date1 !== 'string' || typeof date2 !== 'string') {
      res.status(400).json({ error: t('errors.analytics.compare.datesRequired') });
      return;
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date1) || !dateRegex.test(date2)) {
      res.status(400).json({ error: t('errors:analytics.invalidDateFormat') });
      return;
    }
    
    // Get settings for business day configuration
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      res.status(500).json({ error: t('errors.settings.notFound') });
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
    res.status(500).json({ error: t('errors.analytics.compare.fetchFailed') });
  }
});

// ============================================================================
// PROFIT ANALYTICS ENDPOINTS
// ============================================================================

// GET /api/analytics/profit-summary - Get profit KPIs for a date range
analyticsRouter.get('/profit-summary', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      res.status(400).json({ error: 'startDate and endDate query parameters are required (YYYY-MM-DD)' });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      res.status(400).json({ error: t('errors:analytics.invalidDateFormat') });
      return;
    }

    const result = await getProfitSummary(startDate, endDate);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching profit summary', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:analytics.failedToFetchProfitSummary') });
  }
});

// GET /api/analytics/profit-comparison - Compare current vs previous period
analyticsRouter.get('/profit-comparison', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      res.status(400).json({ error: 'startDate and endDate query parameters are required (YYYY-MM-DD)' });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      res.status(400).json({ error: t('errors:analytics.invalidDateFormat') });
      return;
    }

    const result = await getProfitComparison(startDate, endDate);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching profit comparison', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:analytics.failedToFetchProfitComparison') });
  }
});

// GET /api/analytics/margin-by-category - Margin breakdown by category
analyticsRouter.get('/margin-by-category', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      res.status(400).json({ error: 'startDate and endDate query parameters are required (YYYY-MM-DD)' });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      res.status(400).json({ error: t('errors:analytics.invalidDateFormat') });
      return;
    }

    const result = await getMarginByCategory(startDate, endDate);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching margin by category', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:analytics.failedToFetchMarginByCategory') });
  }
});

// GET /api/analytics/margin-by-product - Margin breakdown by product
analyticsRouter.get('/margin-by-product', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { startDate, endDate, limit } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      res.status(400).json({ error: 'startDate and endDate query parameters are required (YYYY-MM-DD)' });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      res.status(400).json({ error: t('errors:analytics.invalidDateFormat') });
      return;
    }

    const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
    const result = await getMarginByProduct(startDate, endDate, parsedLimit);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching margin by product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:analytics.failedToFetchMarginByProduct') });
  }
});

// GET /api/analytics/margin-trend - Daily margin trend over time
analyticsRouter.get('/margin-trend', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      res.status(400).json({ error: 'startDate and endDate query parameters are required (YYYY-MM-DD)' });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      res.status(400).json({ error: t('errors:analytics.invalidDateFormat') });
      return;
    }

    const result = await getMarginTrend(startDate, endDate);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching margin trend', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:analytics.failedToFetchMarginTrend') });
  }
});

// GET /api/analytics/profit-dashboard - Complete profit dashboard data
analyticsRouter.get('/profit-dashboard', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      res.status(400).json({ error: 'startDate and endDate query parameters are required (YYYY-MM-DD)' });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      res.status(400).json({ error: t('errors:analytics.invalidDateFormat') });
      return;
    }

    const result = await getProfitDashboard(startDate, endDate);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching profit dashboard', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:analytics.failedToFetchProfitDashboard') });
  }
});