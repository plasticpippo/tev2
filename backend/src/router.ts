import express from 'express';
import { STORAGE_PATH } from './config/storage';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from './prisma';
import { logError, logInfo } from './utils/logger';
import { productsRouter } from './handlers/products';
import { usersRouter } from './handlers/users';
import { categoriesRouter } from './handlers/categories';
import { settingsRouter } from './handlers/settings';
import { transactionsRouter } from './handlers/transactions';
import { tabsRouter } from './handlers/tabs';
import { tillsRouter } from './handlers/tills';
import { stockItemsRouter } from './handlers/stockItems';
import { stockAdjustmentsRouter } from './handlers/stockAdjustments';
import { orderActivityLogsRouter } from './handlers/orderActivityLogs';
import { orderSessionsRouter } from './handlers/orderSessions';
import tablesRouter from './handlers/tables';
import roomsRouter from './handlers/rooms';
import { dailyClosingsRouter } from './handlers/dailyClosings';
import { consumptionReportsRouter } from './handlers/consumptionReports';
import { analyticsRouter } from './handlers/analytics';
import { layoutsRouter } from './handlers/layouts';
import { taxRatesRouter } from './handlers/taxRates';
import { customersRouter } from './handlers/customerHandler';
import { customerRateLimiter } from './middleware/rateLimiter';
import { receiptsRouter } from './handlers/receiptHandler';
import { costManagementRouter } from './handlers/costManagement';
import { backupRouter } from './handlers/backup';

export const router = express.Router();

router.use('/products', productsRouter);
router.use('/users', usersRouter);
router.use('/categories', categoriesRouter);
router.use('/settings', settingsRouter);
router.use('/transactions', transactionsRouter);
router.use('/tabs', tabsRouter);
router.use('/tills', tillsRouter);
router.use('/stock-items', stockItemsRouter);
router.use('/stock-adjustments', stockAdjustmentsRouter);
router.use('/order-activity-logs', orderActivityLogsRouter);
router.use('/order-sessions', orderSessionsRouter);
router.use('/tables', tablesRouter);
router.use('/rooms', roomsRouter);
router.use('/daily-closings', dailyClosingsRouter);
router.use('/consumption-reports', consumptionReportsRouter);
router.use('/analytics', analyticsRouter);
router.use('/layouts', layoutsRouter);
router.use('/tax-rates', taxRatesRouter);
router.use('/customers', customerRateLimiter, customersRouter);
router.use('/receipts', receiptsRouter);
router.use('/cost-management', costManagementRouter);
router.use('/backup', backupRouter);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is running', timestamp: new Date().toISOString() });
});

router.get('/health/pdfs', async (req, res) => {
  try {
    const HEALTH_CHECK_MISSING_PDF_THRESHOLD = parseInt(
      process.env.HEALTH_CHECK_MISSING_PDF_THRESHOLD || '10',
      10
    );

    const receiptsWithPDF = await prisma.receipt.count({
      where: {
        status: 'issued',
        pdfPath: { not: null },
      },
    });

    const pdfFiles = await fs.readdir(STORAGE_PATH);
    const pdfFileCount = pdfFiles.filter(f => f.endsWith('.pdf')).length;

    const recentReceipts = await prisma.receipt.findMany({
      where: {
        status: 'issued',
        pdfPath: { not: null },
        issuedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: {
        id: true,
        receiptNumber: true,
        pdfPath: true,
        issuedAt: true,
      },
      take: 100,
      orderBy: { issuedAt: 'desc' },
    });

    // Check file existence in parallel for better performance
    const fileChecks = recentReceipts.map(async (receipt) => {
      if (!receipt.pdfPath) return true;
      const fullPath = path.join(STORAGE_PATH, receipt.pdfPath);
      try {
        await fs.access(fullPath, fs.constants.R_OK);
        return true;
      } catch {
        return false;
      }
    });

    const checkResults = await Promise.all(fileChecks);
    const missingPDFCount = checkResults.filter(result => !result).length;

    const health = {
      status: 'OK' as const,
      receiptsWithPDF,
      pdfFileCount,
      missingPDFCount,
      missingPDFPercentage: receiptsWithPDF > 0 ? (missingPDFCount / receiptsWithPDF * 100).toFixed(2) : 0,
      timestamp: new Date().toISOString(),
    };

    if (missingPDFCount > HEALTH_CHECK_MISSING_PDF_THRESHOLD) {
      logError('PDF health check: Too many missing PDF files', health as any);
    } else if (missingPDFCount > 0) {
      logInfo('PDF health check: Some PDF files missing', health);
    }

    res.json(health);
  } catch (error) {
    logError('PDF health check failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Version endpoint - returns application version information
router.get('/version', (req, res) => {
  res.json({
    name: 'assopos-backend',
    version: process.env.APP_VERSION || 'unknown',
    buildDate: process.env.BUILD_DATE || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

export default router;