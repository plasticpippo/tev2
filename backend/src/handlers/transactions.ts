import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Transaction, OrderItem } from '../types';
import { Prisma, Transaction as PrismaTransaction } from '@prisma/client';
import { logPaymentEvent, logError, logInfo, logDebug } from '../utils/logger';
import { toUserReferenceDTO } from '../types/dto';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse } from '../utils/jsonParser';
import { isMoneyValid, addMoney, multiplyMoney, roundMoney, subtractMoney, formatMoney, divideMoney, decimalToNumber } from '../utils/money';
import i18n from '../i18n';
import { requireRole } from '../middleware/authorization';
import { createReceiptFromPayment, getUserReceiptPreference } from '../services/paymentModalReceiptService';
import { calculateTransactionCost } from '../services/costCalculationService';

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
// 1. Calculate transaction costs
// 2. Create transaction record (with cost data)
// 3. Decrement stock levels
// 4. Complete order session
// 5. Delete tab (if exists)
// 6. Update table status (if exists)
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

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'idempotencyKey is required and must be a valid string (8-128 alphanumeric characters, hyphens, or underscores)' });
  }

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

// 1. Calculate transaction costs (non-blocking - null if costs unavailable)
let totalCost: number | null = null;
let costCalculatedAt: Date | null = null;
let grossMargin: number | null = null;
let marginPercent: number | null = null;

try {
  const costInput = items.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity,
  }));
  const costResult = await calculateTransactionCost(costInput);
  
  if (costResult.totalCost !== null && costResult.hasAllCosts) {
    totalCost = costResult.totalCost;
    costCalculatedAt = new Date();
    
    // Calculate gross margin: subtotal - totalCost
    grossMargin = subtractMoney(calculatedSubtotal, totalCost);
    
    // Calculate margin percentage: (grossMargin / subtotal) * 100
    if (calculatedSubtotal > 0) {
      marginPercent = roundMoney(divideMoney(grossMargin, calculatedSubtotal) * 100);
    }
    
    logDebug('Transaction cost calculated', {
      correlationId,
      totalCost,
      grossMargin,
      marginPercent,
      itemCount: items.length,
    });
  } else {
    logDebug('Transaction cost calculation incomplete - missing cost data', {
      correlationId,
      hasAllCosts: costResult.hasAllCosts,
      itemCount: items.length,
    });
  }
} catch (costError) {
  logError('Cost calculation failed - transaction proceeding without cost data', {
    correlationId,
    error: costError instanceof Error ? costError.message : 'Unknown error',
  });
}

// 2. Collect stock consumptions INSIDE transaction to prevent race conditions
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
  
// 3. Create the transaction with idempotency key and cost data
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
    userId: authenticatedUserId,
    userName: authenticatedUserName,
    tillId,
    tillName,
    idempotencyKey: idempotencyKey || null,
    idempotencyCreatedAt: idempotencyKey ? new Date() : null,
    totalCost: totalCost !== null ? totalCost : null,
    costCalculatedAt,
    grossMargin: grossMargin !== null ? grossMargin : null,
    marginPercent: marginPercent !== null ? marginPercent : null,
    createdAt: new Date()
        }
      });

      // 3b. Create relational TransactionItem records for queryability and integrity
      await tx.transactionItem.createMany({
        data: items.map((item: { productId: number; variantId: number; name: string; price: number; quantity: number; effectiveTaxRate?: number }) => ({
          transactionId: transaction.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.name,
          variantName: item.name,
          price: item.price,
          quantity: item.quantity,
          effectiveTaxRate: item.effectiveTaxRate ?? null,
        })),
      });

      // 4. Decrement stock levels (if any consumptions)
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
  
      // 5. Complete order session with version-based optimistic locking
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
  
      // 6. Delete tab if exists
      if (activeTabId) {
        await tx.tab.delete({ where: { id: activeTabId } }).catch((err: Error) => {
          logDebug('Tab deletion skipped (may not exist)', { activeTabId, error: err.message, correlationId });
        });
      }
  
      // 7. Update table status if assigned
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
    // Get all non-voided transactions (completed and complimentary)
    const transactions = await prisma.transaction.findMany({
      where: { status: { in: ['completed', 'complimentary'] } },
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

// POST /:id/void - Void a transaction and restore stock
transactionsRouter.post(
  '/:id/void',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const authenticatedUserId = req.user?.id;
    const authenticatedUserName = req.user?.username;

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return res.status(400).json({ error: 'Void reason is required' });
    }

    try {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Fetch the transaction
        const transaction = await tx.transaction.findUnique({
          where: { id: Number(id) },
        });

        if (!transaction) {
          throw new Error('NOT_FOUND');
        }

        if (transaction.status === 'voided') {
          throw new Error('ALREADY_VOIDED');
        }

        if (transaction.status !== 'completed' && transaction.status !== 'complimentary') {
          throw new Error('INVALID_STATUS');
        }

        // 2. Parse the items JSON to determine what was sold
        const items = safeJsonParse<OrderItem[]>(transaction.items, [], {
          id: String(transaction.id),
          field: 'items',
        });

        // 3. Calculate stock restorations by re-reading current recipes
        const restorations = new Map<string, { name: string; quantity: number }>();

        for (const item of items) {
          if (!item.productId || !item.variantId) continue;

          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              variants: {
                where: { id: item.variantId },
                include: { stockConsumption: true },
              },
            },
          });

          if (product && product.variants[0]) {
            for (const sc of product.variants[0].stockConsumption) {
              const current = restorations.get(sc.stockItemId);
              const restorationQty = sc.quantity * item.quantity;

              if (current) {
                current.quantity += restorationQty;
              } else {
                restorations.set(sc.stockItemId, {
                  name: '',
                  quantity: restorationQty,
                });
              }
            }
          }
        }

        // 4. Restore stock quantities and create adjustment records for audit trail
        for (const [stockItemId, restoration] of restorations) {
          const stockItem = await tx.stockItem.findUnique({
            where: { id: stockItemId },
          });

          if (stockItem) {
            restoration.name = stockItem.name;

            // Increment stock back
            await tx.stockItem.update({
              where: { id: stockItemId },
              data: { quantity: { increment: restoration.quantity } },
            });

            // Create linked stock adjustment for audit trail
            await tx.stockAdjustment.create({
              data: {
                stockItemId,
                itemName: stockItem.name,
                quantity: restoration.quantity,
                reason: `Transaction #${id} voided: ${reason.trim()}`,
                userId: authenticatedUserId!,
                userName: authenticatedUserName!,
              },
            });
          }
        }

        // 5. Update transaction status to voided
        const updatedTransaction = await tx.transaction.update({
          where: { id: Number(id) },
          data: {
            status: 'voided',
            voidedAt: new Date(),
            voidReason: reason.trim(),
            voidedBy: authenticatedUserId,
          },
        });

        return {
          transaction: updatedTransaction,
          restoredItems: Array.from(restorations.entries()).map(
            ([stockItemId, data]) => ({
              stockItemId,
              ...data,
            })
          ),
        };
      });

      logInfo('Transaction voided', {
        transactionId: Number(id),
        reason,
        restoredItems: result.restoredItems.length,
        userId: authenticatedUserId,
      });

      res.json({
        message: 'Transaction voided successfully',
        transaction: {
          ...result.transaction,
          subtotal: decimalToNumber(result.transaction.subtotal),
          tax: decimalToNumber(result.transaction.tax),
          tip: decimalToNumber(result.transaction.tip),
          total: decimalToNumber(result.transaction.total),
          discount: decimalToNumber(result.transaction.discount),
        },
        restoredItems: result.restoredItems,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'NOT_FOUND') {
          return res.status(404).json({ error: 'Transaction not found' });
        }
        if (error.message === 'ALREADY_VOIDED') {
          return res.status(409).json({ error: 'Transaction is already voided' });
        }
        if (error.message === 'INVALID_STATUS') {
          return res.status(400).json({ error: 'Only completed or complimentary transactions can be voided' });
        }
      }
      logError('Error voiding transaction', { error, transactionId: id });
      res.status(500).json({ error: 'Failed to void transaction' });
    }
  }
);


export default transactionsRouter;