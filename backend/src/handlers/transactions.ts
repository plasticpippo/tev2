import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Transaction } from '../types';
import { logPaymentEvent, logError, logInfo } from '../utils/logger';
import { toUserReferenceDTO } from '../types/dto';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../utils/jsonParser';
import { isMoneyValid, addMoney, multiplyMoney, roundMoney, subtractMoney, formatMoney, divideMoney } from '../utils/money';
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
    // Get settings to determine tax mode
    let taxMode: 'inclusive' | 'exclusive' | 'none' = 'exclusive';
    try {
      const settings = await prisma.settings.findFirst();
      taxMode = (settings?.taxMode || 'exclusive') as 'inclusive' | 'exclusive' | 'none';
    } catch (settingsError) {
      logError('Failed to fetch settings for tax mode', {
        correlationId: (req as any).correlationId,
        error: settingsError instanceof Error ? settingsError.message : 'Unknown error'
      });
      // Fall back to default 'exclusive' mode
    }
    
    const {
      items, subtotal, tax, tip, paymentMethod,
      userId, userName, tillId, tillName, discount, discountReason
    } = req.body as Omit<Transaction, 'id' | 'createdAt' | 'status' | 'total'>;
    
    // Validate monetary values are valid numbers
    if (!isMoneyValid(subtotal)) {
      return res.status(400).json({ error: 'Invalid subtotal value' });
    }
    if (!isMoneyValid(tax)) {
      return res.status(400).json({ error: 'Invalid tax value' });
    }
    if (!isMoneyValid(tip)) {
      return res.status(400).json({ error: 'Invalid tip value' });
    }

    // Validate non-negative values
    if (subtotal < 0) {
      return res.status(400).json({ error: 'Subtotal cannot be negative' });
    }
    if (tax < 0) {
      return res.status(400).json({ error: 'Tax cannot be negative' });
    }
    if (tip < 0) {
      return res.status(400).json({ error: 'Tip cannot be negative' });
    }
    
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

      // Validate item price
      if (!isMoneyValid(item.price)) {
        return res.status(400).json({ error: `Invalid price value for item: ${item.name}` });
      }
      if (item.price < 0) {
        return res.status(400).json({ error: `Price cannot be negative for item: ${item.name}` });
      }

      // Validate item quantity
      if (!isMoneyValid(item.quantity)) {
        return res.status(400).json({ error: `Invalid quantity value for item: ${item.name}` });
      }
      if (item.quantity <= 0) {
        return res.status(400).json({ error: `Quantity must be positive for item: ${item.name}` });
      }
    }

    // Calculate expected subtotal and tax from items in a single pass
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    for (const item of items) {
      const itemPrice = item.price;
      const itemQuantity = item.quantity;
      const taxRate = item.effectiveTaxRate ?? 0;
      
      let itemSubtotal: number;
      let itemTax: number = 0;
      
      if (taxMode === 'inclusive' && taxRate > 0) {
        // In inclusive mode, the price already includes tax
        // Extract the pre-tax price: price / (1 + taxRate)
        const preTaxPrice = divideMoney(itemPrice, 1 + taxRate);
        itemSubtotal = multiplyMoney(preTaxPrice, itemQuantity);
        // Extract the tax from the inclusive price: price - (price / (1 + taxRate))
        itemTax = multiplyMoney(subtractMoney(itemPrice, preTaxPrice), itemQuantity);
      } else if (taxMode === 'exclusive' && taxRate > 0) {
        // In exclusive mode, calculate tax on top of the price
        itemSubtotal = multiplyMoney(itemPrice, itemQuantity);
        itemTax = multiplyMoney(itemSubtotal, taxRate);
      } else {
        // In 'none' mode or taxRate = 0, use price as-is with no tax
        itemSubtotal = multiplyMoney(itemPrice, itemQuantity);
      }
      
      calculatedSubtotal = addMoney(calculatedSubtotal, itemSubtotal);
      calculatedTax = addMoney(calculatedTax, itemTax);
    }

    // Validate subtotal matches calculated value (with 1 cent tolerance)
    const subtotalDifference = Math.abs(subtotal - calculatedSubtotal);
    if (subtotalDifference > 0.01) {
      return res.status(400).json({ 
        error: `Subtotal mismatch. Expected: ${formatMoney(calculatedSubtotal)}, Received: ${formatMoney(subtotal)}` 
      });
    }

    // Use calculated subtotal for consistency
    const validatedSubtotal = calculatedSubtotal;

    // Validate tax matches calculated value (with 1 cent tolerance)
    // Skip validation if frontend sends tax = 0 (handles 'no tax' mode)
    const taxDifference = Math.abs(tax - calculatedTax);
    let validatedTax: number;
    if (tax === 0) {
      // Accept frontend's tax = 0 (no tax mode) without forcing calculation from items
      validatedTax = 0;
    } else if (taxDifference > 0.01) {
      return res.status(400).json({ 
        error: `Tax mismatch. Expected: ${formatMoney(calculatedTax)}, Received: ${formatMoney(tax)}` 
      });
    } else {
      // Use the validated tax value from frontend when it matches calculation
      validatedTax = tax;
    }

    // Validate discount if provided
    const discountAmount = discount || 0;
    const discountReasonText = discountReason || null;

    // Discount must be non-negative
    if (discountAmount < 0) {
      return res.status(400).json({ error: i18n.t('transactions.discountNegative') });
    }

    // Calculate the pre-discount total
    const preDiscountTotal = validatedSubtotal + validatedTax + tip;

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
        subtotal: validatedSubtotal,
        tax: validatedTax,
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