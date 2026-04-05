import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Transaction } from '../types';
import { Prisma, Transaction as PrismaTransaction } from '@prisma/client';
import { logPaymentEvent, logError, logInfo, logDebug } from '../utils/logger';
import { toUserReferenceDTO } from '../types/dto';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../utils/jsonParser';
import { isMoneyValid, addMoney, multiplyMoney, roundMoney, subtractMoney, formatMoney, divideMoney, decimalToNumber } from '../utils/money';
import i18n from '../i18n';
import { requireRole } from '../middleware/authorization';
import { createReceiptFromPayment, getUserReceiptPreference } from '../services/paymentModalReceiptService';

export const transactionsRouter = express.Router();

// Idempotency key expiration time in milliseconds (24 hours)
const IDEMPOTENCY_KEY_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Validates an idempotency key.
 * - Must be a string
 * - Must be 8-128 characters long
 * - Must contain only alphanumeric characters, dashes, or underscores
 * @param key - The key to validate
 * @returns The validated key string, or null if invalid/not provided
 */
function validateIdempotencyKey(key: unknown): string | null {
  if (!key) return null;
  if (typeof key !== 'string') return null;
  
  // Allow 8-128 alphanumeric characters, dashes, underscores
  const validPattern = /^[a-zA-Z0-9_-]{8,128}$/;
  if (!validPattern.test(key)) return null;
  
  return key;
}

// POST /api/transactions/process-payment - Atomic payment processing
// This endpoint handles the entire payment flow in a single database transaction:
// 1. Create transaction record
// 2. Decrement stock levels
// 3. Complete order session
// 4. Delete tab (if exists)
// 5. Update table status (if exists)
// If ANY step fails, ALL changes are rolled back
transactionsRouter.post('/process-payment', authenticateToken, requireRole(['ADMIN', 'CASHIER']), async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;

  try {
    // Get settings to determine tax mode
    let taxMode: 'inclusive' | 'exclusive' | 'none' = 'exclusive';
    try {
      const settings = await prisma.settings.findFirst();
      taxMode = (settings?.taxMode || 'exclusive') as 'inclusive' | 'exclusive' | 'none';
    } catch (settingsError) {
      logError('Failed to fetch settings for tax mode', { correlationId });
    }

  // Extract and validate idempotency key
  const { idempotencyKey: rawIdempotencyKey, issueReceipt, ...paymentData } = req.body;
  const idempotencyKey = validateIdempotencyKey(rawIdempotencyKey);

  const {
    items,
    subtotal,
    tax,
    tip,
    paymentMethod,
    userId,
    userName,
    tillId,
    tillName,
    discount,
    discountReason,
    activeTabId,
    tableId,
    tableName
  } = paymentData;
    
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: i18n.t('transactions.itemsMustBeArray') });
    }

    if (!tillId) {
        return res.status(400).json({ error: 'Missing tillId' });
    }

    // SECURITY FIX: Use authenticated user from JWT token instead of request body
    // This prevents user impersonation attacks (A4.5)
    const authenticatedUserId = req.user?.id;
    const authenticatedUserName = req.user?.username;

    if (!authenticatedUserId || !authenticatedUserName) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    // SECURITY FIX: Validate that tillId exists and tillName matches (A4.4)
    const till = await prisma.till.findUnique({ where: { id: tillId } });
    if (!till) {
        return res.status(400).json({ error: 'Invalid till reference: till not found' });
    }
    if (till.name !== tillName) {
        return res.status(400).json({ error: 'Till name mismatch' });
    }
    
    // Validate all items have required properties
    for (const item of items) {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        return res.status(400).json({ error: i18n.t('transactions.itemNameRequired') });
      }
      if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return res.status(400).json({ error: i18n.t('transactions.itemInvalidProperties') });
      }
    }
    
    // Recalculate and validate totals (same logic as regular transaction creation)
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    
    for (const item of items) {
      const itemPrice = item.price;
      const itemQuantity = item.quantity;
      const taxRate = item.effectiveTaxRate ?? 0;
      
      let itemSubtotal: number;
      let itemTax: number = 0;
      
      if (taxMode === 'inclusive' && taxRate > 0) {
        const preTaxPrice = divideMoney(itemPrice, 1 + taxRate);
        itemSubtotal = multiplyMoney(preTaxPrice, itemQuantity);
        itemTax = multiplyMoney(subtractMoney(itemPrice, preTaxPrice), itemQuantity);
      } else if (taxMode === 'exclusive' && taxRate > 0) {
        itemSubtotal = multiplyMoney(itemPrice, itemQuantity);
        itemTax = multiplyMoney(itemSubtotal, taxRate);
      } else {
        itemSubtotal = multiplyMoney(itemPrice, itemQuantity);
      }
      
      calculatedSubtotal = addMoney(calculatedSubtotal, itemSubtotal);
      calculatedTax = addMoney(calculatedTax, itemTax);
    }
    
    // Validate subtotal matches
    const subtotalDifference = Math.abs(subtractMoney(subtotal || 0, calculatedSubtotal));
    if (subtotalDifference > 0.01) {
      return res.status(400).json({ 
        error: `Subtotal mismatch. Expected: ${formatMoney(calculatedSubtotal)}, Received: ${formatMoney(subtotal || 0)}` 
      });
    }
    
    // Validate tax matches
    let validatedTax = calculatedTax;
    if (tax === 0) {
      validatedTax = 0;
    } else {
      const taxDifference = Math.abs(subtractMoney(tax || 0, calculatedTax));
      if (taxDifference > 0.01) {
        return res.status(400).json({ 
          error: `Tax mismatch. Expected: ${formatMoney(calculatedTax)}, Received: ${formatMoney(tax || 0)}` 
        });
      }
      validatedTax = tax || 0;
    }
    
    // Calculate final total
    const discountAmount = discount || 0;
    const preDiscountTotal = addMoney(addMoney(calculatedSubtotal, validatedTax), tip || 0);
    const finalTotal = subtractMoney(preDiscountTotal, discountAmount);
    const finalStatus = finalTotal <= 0 && discountAmount > 0 ? 'complimentary' : 'completed';
    
    // Define type for idempotent result
    type IdempotentResult = { isDuplicate: true; transaction: PrismaTransaction } | PrismaTransaction;
  
    // Execute ALL operations in a single atomic transaction
    const result: IdempotentResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 0. Idempotency check - if key provided, check for existing transaction
      if (idempotencyKey) {
        const expirationCutoff = new Date(Date.now() - IDEMPOTENCY_KEY_EXPIRATION_MS);

        const existingTransaction = await tx.transaction.findFirst({
          where: {
            idempotencyKey,
            userId: authenticatedUserId, // SECURITY: Use authenticated user ID (A4.5)
            idempotencyCreatedAt: {
              gte: expirationCutoff // Only check keys within expiration window
            }
          }
        });
  
        if (existingTransaction) {
          // Log idempotent replay for audit purposes
          logInfo('Idempotent replay detected', {
            correlationId,
            idempotencyKey,
            transactionId: existingTransaction.id,
            originalCreatedAt: existingTransaction.createdAt.toISOString(),
            userId: authenticatedUserId // SECURITY: Use authenticated user ID (A4.5)
          });
  
          // Return existing transaction - will be returned with HTTP 200
          return { isDuplicate: true, transaction: existingTransaction } as IdempotentResult;
        }
      }
  
      // 1. Collect stock consumptions INSIDE transaction to prevent race conditions
      const consumptions = new Map<string, number>();
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: { where: { id: item.variantId }, include: { stockConsumption: true } } }
        });
  
        if (product && product.variants[0]) {
          for (const sc of product.variants[0].stockConsumption) {
            const currentQty = consumptions.get(sc.stockItemId) || 0;
            consumptions.set(sc.stockItemId, currentQty + (sc.quantity * item.quantity));
          }
        }
      }
  
      // 2. Create the transaction with idempotency key
      const transaction = await tx.transaction.create({
        data: {
          items: JSON.stringify(items),
          subtotal: calculatedSubtotal,
          tax: validatedTax,
          tip: tip || 0,
          total: finalTotal,
          discount: discountAmount,
          discountReason: discountReason || null,
          status: finalStatus,
          paymentMethod,
          userId: authenticatedUserId, // SECURITY: Use authenticated user ID (A4.5)
          userName: authenticatedUserName, // SECURITY: Use authenticated user name (A4.5)
          tillId, // Already validated to exist (A4.4)
          tillName, // Already validated to match till.name (A4.4)
          idempotencyKey: idempotencyKey || null,
          idempotencyCreatedAt: idempotencyKey ? new Date() : null,
          createdAt: new Date()
        }
      });
  
      // 3. Decrement stock levels (if any consumptions)
      if (consumptions.size > 0) {
        for (const [stockItemId, quantity] of consumptions) {
          const updateResult = await tx.stockItem.updateMany({
            where: {
              id: stockItemId,
              quantity: { gte: quantity }
            },
            data: { quantity: { decrement: quantity } }
          });
          if (updateResult.count === 0) {
            // Either stock item doesn't exist or insufficient quantity
            const stockItem = await tx.stockItem.findUnique({ where: { id: stockItemId } });
            if (!stockItem) {
              throw new Error(`Stock item not found: ${stockItemId}`);
            }
            throw new Error(`Insufficient stock for item ${stockItem.name}. Available: ${stockItem.quantity}, Requested: ${quantity}`);
          }
        }
      }
  
      // 4. Complete order session with version-based optimistic locking
      const activeSession = await tx.orderSession.findFirst({
        where: { userId: authenticatedUserId, status: 'active' } // SECURITY: Use authenticated user ID (A4.5)
      });
      if (activeSession) {
        const sessionResult = await tx.orderSession.updateMany({
          where: { id: activeSession.id, version: activeSession.version },
          data: { status: 'completed', updatedAt: new Date(), version: { increment: 1 } }
        });
        if (sessionResult.count === 0) {
          throw new Error('CONFLICT: Order session was modified by another transaction');
        }
      }
  
      // 5. Delete tab if exists
      if (activeTabId) {
        await tx.tab.delete({ where: { id: activeTabId } }).catch((err: Error) => {
          logDebug('Tab deletion skipped (may not exist)', { activeTabId, error: err.message, correlationId });
        });
      }
  
      // 6. Update table status if assigned
      if (tableId) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'available' }
        });
      }
  
      return transaction as IdempotentResult;
    });
  
  // Handle the result - check if it's a duplicate or new transaction
  const isDuplicate = 'isDuplicate' in result && result.isDuplicate;
  // Extract the actual transaction object - TypeScript needs explicit type assertion
  const transaction: PrismaTransaction = isDuplicate
  ? (result as { isDuplicate: true; transaction: PrismaTransaction }).transaction
  : result as PrismaTransaction;

  // Set appropriate response headers for idempotent replays
  if (isDuplicate) {
  res.setHeader('X-Idempotent-Replay', 'true');
  res.setHeader('X-Original-Timestamp', transaction.createdAt.toISOString());
  }

  // Log payment success
  logPaymentEvent('PROCESSED', finalTotal, 'EUR', true, {
  orderId: transaction.id,
  paymentMethod,
  itemCount: items.length,
  correlationId,
  idempotentReplay: isDuplicate || undefined,
  });

  // Handle receipt creation if requested
  let receiptResult: { id: number; number?: string; status: string; pdfUrl?: string } | undefined;
  if (issueReceipt && !isDuplicate) {
  try {
    const settings = await prisma.settings.findFirst();
    const issueMode = (settings?.receiptIssueMode || 'immediate') as 'immediate' | 'draft';
    const receiptCreationResult = await createReceiptFromPayment({
    transactionId: transaction.id,
    userId: authenticatedUserId,
    issueMode,
    });
    receiptResult = receiptCreationResult.receipt;
  } catch (receiptError) {
    logError('Failed to create receipt from payment', {
    correlationId,
    transactionId: transaction.id,
    error: receiptError instanceof Error ? receiptError.message : 'Unknown error',
    });
    // Payment still succeeds, receipt creation failure is logged but not blocking
  }
  }

  // Return the transaction with converted decimals
  // Use 200 for idempotent replays, 201 for new transactions
  const statusCode = isDuplicate ? 200 : 201;
  res.status(statusCode).json({
  ...transaction,
  subtotal: decimalToNumber(transaction.subtotal),
  tax: decimalToNumber(transaction.tax),
  tip: decimalToNumber(transaction.tip),
  total: decimalToNumber(transaction.total),
  discount: decimalToNumber(transaction.discount),
  receipt: receiptResult,
  _meta: isDuplicate ? { idempotent: true } : undefined,
  });
    
	} catch (error) {
		logPaymentEvent('FAILED', req.body?.total || 0, 'EUR', false, {
			orderId: 'failed',
			reason: error instanceof Error ? error.message : 'Unknown error',
			correlationId,
		});

		logError(error instanceof Error ? error : 'Atomic payment processing failed', { correlationId });

		// If it's a known error type, return appropriate status
		if (error instanceof Error) {
			// Conflict errors - return 409 for client retry
			if (error.message.includes('CONFLICT') || error.message.includes('Order session was modified')) {
				return res.status(409).json({ 
					error: 'Payment conflict detected. Please retry.',
					code: 'CONFLICT',
					details: error.message
				});
			}
			// Insufficient stock - return 400 (client error)
			if (error.message.includes('Insufficient stock')) {
				return res.status(400).json({ error: error.message });
			}
			// Stock item not found - return 400 (configuration error)
			if (error.message.includes('Stock item not found')) {
				return res.status(400).json({ error: error.message });
			}
		}

		res.status(500).json({ error: i18n.t('transactions.createFailed') });
	}
});

// GET /api/transactions/reconcile - Reconcile transactions with stock levels (MUST be before /:id route)
transactionsRouter.get('/reconcile', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Get all completed transactions
    const transactions = await prisma.transaction.findMany({
      where: { status: 'completed' },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get all product variants with stock consumption
    const variants = await prisma.productVariant.findMany({
      include: {
        stockConsumption: true,
        product: true
      }
    });
    
    // Build stock consumption map: stockItemId -> total consumed
    const stockConsumptionMap = new Map<string, number>();
    
    for (const variant of variants) {
      for (const consumption of variant.stockConsumption) {
        const current = stockConsumptionMap.get(consumption.stockItemId) || 0;
        stockConsumptionMap.set(consumption.stockItemId, current + consumption.quantity);
      }
    }
    
    // Get all stock items
    const stockItems = await prisma.stockItem.findMany();
    const stockItemMap = new Map(stockItems.map(item => [item.id, item]));
    
    // Calculate expected vs actual stock
    const reconciliationResults = {
      totalTransactions: transactions.length,
      totalRevenue: 0,
      totalTips: 0,
      totalTax: 0,
      stockItems: [] as {
        stockItemId: string;
        name: string;
        currentQuantity: number;
        totalConsumedFromVariants: number;
        status: 'OK' | 'WARNING' | 'ERROR';
        notes: string;
      }[]
    };
    
    // Sum up transaction totals
    for (const tx of transactions) {
      reconciliationResults.totalRevenue += decimalToNumber(tx.total);
      reconciliationResults.totalTips += decimalToNumber(tx.tip);
      reconciliationResults.totalTax += decimalToNumber(tx.tax);
    }
    
    // Check each stock item
    for (const [stockItemId, consumedQuantity] of stockConsumptionMap) {
      const stockItem = stockItemMap.get(stockItemId);
      
      if (stockItem) {
        // This is just tracking what was configured to be consumed
        // We can't know the original quantity, so we mark as WARNING
        reconciliationResults.stockItems.push({
          stockItemId,
          name: stockItem.name,
          currentQuantity: stockItem.quantity,
          totalConsumedFromVariants: consumedQuantity,
          status: 'WARNING',
          notes: 'Current quantity shown. Original quantity unknown - manual verification recommended.'
        });
      } else {
        reconciliationResults.stockItems.push({
          stockItemId,
          name: 'Unknown (orphaned)',
          currentQuantity: 0,
          totalConsumedFromVariants: consumedQuantity,
          status: 'ERROR',
          notes: 'Stock item no longer exists but is referenced by product variants'
        });
      }
    }
    
    // Add stock items that have no consumption at all (potential unused stock)
    for (const stockItem of stockItems) {
      if (!stockConsumptionMap.has(stockItem.id)) {
        reconciliationResults.stockItems.push({
          stockItemId: stockItem.id,
          name: stockItem.name,
          currentQuantity: stockItem.quantity,
          totalConsumedFromVariants: 0,
          status: 'OK',
          notes: 'No consumption configured for this stock item'
        });
      }
    }
    
    res.json(reconciliationResults);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error reconciling data', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Data reconciliation failed' });
  }
});

// GET /api/transactions - Get all transactions
transactionsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        receipts: {
          select: {
            id: true,
            receiptNumber: true,
            status: true,
            issuedAt: true
          }
        }
      }
    });
    // Parse the items JSON string back to array and convert Decimal to number
    const transactionsWithParsedItems = transactions.map((transaction: PrismaTransaction & { receipts?: { id: number; receiptNumber: string; status: string; issuedAt: Date | null }[] }) => {
      const receipt = transaction.receipts && transaction.receipts.length > 0 ? transaction.receipts[0] : null;
      return {
        ...transaction,
        subtotal: decimalToNumber(transaction.subtotal),
        tax: decimalToNumber(transaction.tax),
        tip: decimalToNumber(transaction.tip),
        total: decimalToNumber(transaction.total),
        discount: decimalToNumber(transaction.discount),
        items: safeJsonParse(transaction.items, [], { id: String(transaction.id), field: 'items' }),
        createdAt: transaction.createdAt.toISOString(),
        receipt: receipt ? {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          status: receipt.status,
          issuedAt: receipt.issuedAt?.toISOString() || null
        } : null
      };
    });
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
    
    // Parse the items JSON string back to array and convert Decimal to number
    const transactionWithParsedItems = {
      ...transaction,
      subtotal: decimalToNumber(transaction.subtotal),
      tax: decimalToNumber(transaction.tax),
      tip: decimalToNumber(transaction.tip),
      total: decimalToNumber(transaction.total),
      discount: decimalToNumber(transaction.discount),
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
    tillId, tillName, discount, discountReason
  } = req.body as Omit<Transaction, 'id' | 'createdAt' | 'status' | 'total' | 'userId' | 'userName'>;

  // SECURITY FIX (A4.5): Use authenticated user from JWT token instead of request body
  const authenticatedUserId = req.user?.id;
  const authenticatedUserName = req.user?.username;

  if (!authenticatedUserId || !authenticatedUserName) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  // SECURITY FIX (A4.4): Validate that tillId exists and tillName matches
  if (!tillId) {
    return res.status(400).json({ error: 'Missing tillId' });
  }

  const till = await prisma.till.findUnique({ where: { id: tillId } });
  if (!till) {
    return res.status(400).json({ error: 'Invalid till reference: till not found' });
  }
  if (till.name !== tillName) {
    return res.status(400).json({ error: 'Till name mismatch' });
  }

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
    const subtotalDifference = Math.abs(subtractMoney(subtotal, calculatedSubtotal));
    if (subtotalDifference > 0.01) {
      return res.status(400).json({ 
        error: `Subtotal mismatch. Expected: ${formatMoney(calculatedSubtotal)}, Received: ${formatMoney(subtotal)}` 
      });
    }

    // Use calculated subtotal for consistency
    const validatedSubtotal = calculatedSubtotal;

    // Validate tax matches calculated value (with 1 cent tolerance)
    // Skip validation if frontend sends tax = 0 (handles 'no tax' mode)
    const taxDifference = Math.abs(subtractMoney(tax, calculatedTax));
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
    const preDiscountTotal = addMoney(addMoney(validatedSubtotal, validatedTax), tip);

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
    const finalTotal = subtractMoney(preDiscountTotal, discountAmount);

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
      userId: authenticatedUserId, // SECURITY: Use authenticated user ID (A4.5)
      userName: authenticatedUserName, // SECURITY: Use authenticated user name (A4.5)
      tillId, // Already validated to exist (A4.4)
      tillName, // Already validated to match till.name (A4.4)
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
    
    // Convert Decimal to number for JSON response
    const response = {
      ...transaction,
      subtotal: decimalToNumber(transaction.subtotal),
      tax: decimalToNumber(transaction.tax),
      tip: decimalToNumber(transaction.tip),
      total: decimalToNumber(transaction.total),
      discount: decimalToNumber(transaction.discount),
    };
    
    res.status(201).json(response);
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