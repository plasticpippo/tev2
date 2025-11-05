import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Transaction } from '../types';

export const transactionsRouter = express.Router();

// GET /api/transactions - Get all transactions
transactionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Parse the items JSON string back to array
    const transactionsWithParsedItems = transactions.map(transaction => ({
      ...transaction,
      items: typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items,
      createdAt: transaction.createdAt.toISOString() // Ensure createdAt is in string format
    }));
    res.json(transactionsWithParsedItems);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions. Please try again later.' });
  }
});

// GET /api/transactions/:id - Get a specific transaction
transactionsRouter.get('/:id', async (req: Request, res: Response) => {
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
      items: typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items,
      createdAt: transaction.createdAt.toISOString() // Ensure createdAt is in string format
    };
    
    res.json(transactionWithParsedItems);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction. Please try again later.' });
  }
});

// POST /api/transactions - Create a new transaction
transactionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { 
      items, subtotal, tax, tip, total, paymentMethod, 
      userId, userName, tillId, tillName 
    } = req.body as Omit<Transaction, 'id' | 'createdAt'>;
    
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
    
    res.status(201).json(transaction);
 } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction. Please check your data and try again.' });
  }
});

export default transactionsRouter;