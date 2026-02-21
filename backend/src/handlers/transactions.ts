import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Transaction } from '../types';
import { logPaymentEvent, logError, logInfo } from '../utils/logger';
import { toUserReferenceDTO } from '../types/dto';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../utils/jsonParser';
import i18n from '../i18n';

export const transactionsRouter = express.Router();

// GET /api/transactions - Get all transactions
transactionsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Parse the items JSON string back to array
    const transactionsWithParsedItems = transactions.map(transaction => ({
      ...transaction,
      items: safeJsonParse(transaction.items, [], { id: String(transaction.id), field: 'items' }),
      createdAt: transaction.createdAt.toISOString() // Ensure createdAt is in string format
    }));
    res.json(transactionsWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('transactions.log.fetchError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('transactions.fetchFailed') });
  }
});

// GET /api/transactions/:id - Get a specific transaction
transactionsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: i18n.t('transactions.notFound') });
    }
    
    // Parse the items JSON string back to array
    const transactionWithParsedItems = {
      ...transaction,
      items: safeJsonParse(transaction.items, [], { id: String(transaction.id), field: 'items' }),
      createdAt: transaction.createdAt.toISOString() // Ensure createdAt is in string format
    };
    
    res.json(transactionWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('transactions.log.fetchOneError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('transactions.fetchOneFailed') });
  }
});

// POST /api/transactions - Create a new transaction
transactionsRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      items, subtotal, tax, tip, paymentMethod,
      userId, userName, tillId, tillName, discount, discountReason
    } = req.body as Omit<Transaction, 'id' | 'createdAt' | 'status' | 'total'>;
    
    // Validate that all items have required properties, especially name
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: i18n.t('transactions.itemsMustBeArray') });
    }
    
    // Diagnostic logging: capture the items array being received
    logInfo('Transaction items received', {
      correlationId: (req as any).correlationId,
      itemCount: items.length,
      items: JSON.stringify(items)
    });
    
    for (const item of items) {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        logError(i18n.t('transactions.log.itemWithoutName'), {
          correlationId: (req as any).correlationId,
          item: JSON.stringify(item),
          missingProperties: {
            name: !item.name || typeof item.name !== 'string' || item.name.trim() === ''
          }
        });
        return res.status(400).json({ error: i18n.t('transactions.itemNameRequired') });
      }
      if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        logError(i18n.t('transactions.log.itemInvalidProperties'), {
          correlationId: (req as any).correlationId,
          item: JSON.stringify(item),
          missingProperties: {
            id: !item.id,
            variantId: !item.variantId,
            productId: !item.productId,
            price: typeof item.price !== 'number',
            quantity: typeof item.quantity !== 'number'
          }
        });
        return res.status(400).json({ error: i18n.t('transactions.itemInvalidProperties') });
      }
    }

    // Validate discount if provided
    const discountAmount = discount || 0;
    const discountReasonText = discountReason || null;

    // Discount must be non-negative
    if (discountAmount < 0) {
      return res.status(400).json({ error: i18n.t('transactions.discountNegative') });
    }

    // Calculate the pre-discount total
    const preDiscountTotal = subtotal + tax + tip;

    // Discount must not exceed the total
    if (discountAmount > preDiscountTotal) {
      return res.status(400).json({ error: i18n.t('transactions.discountExceedsTotal') });
    }

    // If discount > 0, check if user is admin
    if (discountAmount > 0) {
      const userRole = req.user?.role;
      const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';
      if (!isAdmin) {
        return res.status(403).json({ error: i18n.t('transactions.discountRequiresAdmin') });
      }
    }

    // Calculate the final total after discount
    const finalTotal = preDiscountTotal - discountAmount;

    // Determine status: 'complimentary' if total <= 0, otherwise 'completed'
    const status = finalTotal <= 0 ? 'complimentary' : 'completed';
    
    // Log payment initiation
    logPaymentEvent(
      'PROCESSED',
      finalTotal,
      'EUR',
      true,
      {
        orderId: 'pending',
        paymentMethod,
        itemCount: items.length,
        correlationId: (req as any).correlationId,
      }
    );
    
    const transaction = await prisma.transaction.create({
      data: {
        items: JSON.stringify(items),
        subtotal,
        tax,
        tip,
        total: finalTotal,
        paymentMethod,
        userId,
        userName,
        tillId,
        tillName,
        discount: discountAmount,
        discountReason: discountReasonText,
        status,
        createdAt: new Date()
      }
    });
    
    // Log payment success
    logPaymentEvent(
      'PROCESSED',
      finalTotal,
      'EUR',
      true,
      {
        orderId: transaction.id,
        paymentMethod,
        itemCount: items.length,
        correlationId: (req as any).correlationId,
      }
    );
    
    res.status(201).json(transaction);
  } catch (error) {
    // Log payment failure
    logPaymentEvent(
      'FAILED',
      req.body?.total || 0,
      'EUR',
      false,
      {
        orderId: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
        correlationId: (req as any).correlationId,
      }
    );
    
    logError(error instanceof Error ? error : i18n.t('transactions.log.createError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('transactions.createFailed') });
  }
});

export default transactionsRouter;