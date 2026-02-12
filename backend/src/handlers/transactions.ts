import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Transaction } from '../types';
import { logPaymentEvent, logError } from '../utils/logger';
import { toUserReferenceDTO } from '../types/dto';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../utils/jsonParser';

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
    logError(error instanceof Error ? error : 'Error fetching transactions', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch transactions. Please try again later.' });
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
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Parse the items JSON string back to array
    const transactionWithParsedItems = {
      ...transaction,
      items: safeJsonParse(transaction.items, [], { id: String(transaction.id), field: 'items' }),
      createdAt: transaction.createdAt.toISOString() // Ensure createdAt is in string format
    };
    
    res.json(transactionWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching transaction', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch transaction. Please try again later.' });
  }
});

// POST /api/transactions - Create a new transaction
transactionsRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      items, subtotal, tax, tip, total, paymentMethod,
      userId, userName, tillId, tillName
    } = req.body as Omit<Transaction, 'id' | 'createdAt'>;
    
    // Validate that all items have required properties, especially name
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }
    
    for (const item of items) {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        logError('Invalid item without name', {
          correlationId: (req as any).correlationId,
        });
        return res.status(400).json({ error: 'All items must have a valid name' });
      }
      if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        logError('Invalid item properties', {
          correlationId: (req as any).correlationId,
        });
        return res.status(400).json({ error: 'All items must have valid id, variantId, productId, price, and quantity' });
      }
    }
    
    // Log payment initiation
    logPaymentEvent(
      'PROCESSED',
      total,
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
        total,
        paymentMethod,
        userId,
        userName,
        tillId,
        tillName,
        createdAt: new Date()
      }
    });
    
    // Log payment success
    logPaymentEvent(
      'PROCESSED',
      total,
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
    
    logError(error instanceof Error ? error : 'Error creating transaction', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to create transaction. Please check your data and try again.' });
  }
});

export default transactionsRouter;