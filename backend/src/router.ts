import express from 'express';
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

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// Version endpoint - returns application version information
router.get('/version', (req, res) => {
  res.json({
    name: 'bar-pos-backend',
    version: process.env.APP_VERSION || 'unknown',
    buildDate: process.env.BUILD_DATE || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

export default router;