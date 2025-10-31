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

export const router = express.Router();

// Mount individual route handlers
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

// Health check for the API
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is running', timestamp: new Date().toISOString() });
});

export default router;