import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Transaction, OrderItem } from '../types';
import { Prisma, Transaction as PrismaTransaction } from '@prisma/client';
import { logPaymentEvent, logError, logInfo, logDebug } from '../utils/logger';
import { toUserReferenceDTO } from '../types/dto';
import { authenticateToken } from '../middleware/auth';
import { safeJsonParse, parseTransactionItems } from '../utils/jsonParser';
import { isMoneyValid, addMoney, multiplyMoney, roundMoney, subtractMoney, formatMoney, divideMoney, decimalToNumber, roundCost } from '../utils/money';
import { requireRole } from '../middleware/authorization';
import { createReceiptFromPayment, getUserReceiptPreference } from '../services/paymentModalReceiptService';
import { calculateTransactionCost } from '../services/costCalculationService';
import { CONSUMED_TRANSACTION_STATUSES, CONSUMED_TRANSACTION_STATUSES_MUTABLE } from '../utils/transaction';

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

class TransactionError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
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
  const t = req.t.bind(req);
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
        return res.status(400).json({ error: t('transactions.itemsMustBeArray') });
    }

    if (!tillId) {
        return res.status(400).json({ error: t('errors:transactions.missingTillId') });
    }

    // SECURITY FIX: Use authenticated user from JWT token instead of request body
    // This prevents user impersonation attacks (A4.5)
    const authenticatedUserId = req.user?.id;
    const authenticatedUserName = req.user?.username;

    if (!authenticatedUserId || !authenticatedUserName) {
        return res.status(401).json({ error: t('errors:transactions.userNotAuthenticated') });
    }

    // SECURITY FIX: Validate that tillId exists and tillName matches (A4.4)
    const till = await prisma.till.findUnique({ where: { id: tillId } });
    if (!till) {
        return res.status(400).json({ error: t('errors:transactions.invalidTillReference') });
    }
    if (till.name !== tillName) {
        return res.status(400).json({ error: t('errors:transactions.tillNameMismatch') });
    }
    
    // Validate all items have required properties
    for (const item of items) {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        return res.status(400).json({ error: t('transactions.itemNameRequired') });
      }
      if (!item.id || !item.variantId || !item.productId || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return res.status(400).json({ error: t('transactions.itemInvalidProperties') });
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
        error: t('errors:transactions.subtotalMismatch', { expected: formatMoney(calculatedSubtotal), received: formatMoney(subtotal || 0) }) 
      });
    }
    
    // Validate tax matches
    let validatedTax = calculatedTax;
    const clientTax = tax || 0;
    const taxDifference = Math.abs(subtractMoney(clientTax, calculatedTax));
    if (taxDifference > 0.01) {
      return res.status(400).json({ 
        error: t('errors:transactions.taxMismatch', { expected: formatMoney(calculatedTax), received: formatMoney(clientTax) }) 
      });
    }
    validatedTax = clientTax;
    
    // Calculate final total
    if (discount !== undefined && discount !== null && discount < 0) {
      return res.status(400).json({ error: t('errors:transactions.negativeDiscount') });
    }
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
const itemCostMap = new Map<number, { unitCost: number | null; totalCost: number | null }>();

try {
  const costInput = items.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity,
  }));
  const costResult = await calculateTransactionCost(costInput);
  
  // Build per-variant cost lookup for TransactionItem records
  for (const itemCost of costResult.items) {
    itemCostMap.set(itemCost.variantId, {
      unitCost: itemCost.unitCost,
      totalCost: itemCost.totalCost,
    });
  }
  
  if (costResult.totalCost !== null && costResult.hasAllCosts) {
    totalCost = roundMoney(costResult.totalCost);
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
//    AND build ledger rows for the consumption ledger AND build product/variant name map
const consumptions = new Map<string, number>();
const ledgerRows: Array<{
  stockItemId: string;
  variantId: number;
  productId: number;
  quantity: number;
  productName: string;
  variantName: string;
  stockItemName: string;
  categoryId: number;
  categoryName: string;
  estimated: boolean;
}> = [];
const productVariantNames = new Map<number, { productName: string; variantName: string; categoryId: number; categoryName: string }>();

for (const item of items) {
  const product = await tx.product.findUnique({
    where: { id: item.productId },
    include: { 
      variants: { 
        where: { id: item.variantId }, 
        include: { stockConsumption: { include: { stockItem: true } } } 
      },
      category: true
    }
  });

  if (product && product.variants[0]) {
    const variant = product.variants[0];
    
    // Store product/variant names for C3 fix (TransactionItem creation)
    productVariantNames.set(variant.id, {
      productName: product.name,
      variantName: variant.name,
      categoryId: product.categoryId,
      categoryName: product.category.name
    });
    
    for (const sc of variant.stockConsumption) {
      const currentQty = consumptions.get(sc.stockItemId) || 0;
      const consumedQty = sc.quantity * item.quantity;
      consumptions.set(sc.stockItemId, currentQty + consumedQty);
      
      // Push ledger row data (transactionId will be set after transaction.create)
      ledgerRows.push({
        stockItemId: sc.stockItemId,
        variantId: variant.id,
        productId: product.id,
        quantity: consumedQty,
        productName: product.name,
        variantName: variant.name,
        stockItemName: sc.stockItem.name,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        estimated: false
      });
    }
  }
}
  
// 3. Create the transaction with idempotency key and cost data
const transaction = await tx.transaction.create({
  data: {
    items: items,
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
    totalCost: totalCost !== null ? totalCost : 0,
    costCalculatedAt,
    grossMargin: grossMargin !== null ? grossMargin : null,
    marginPercent: marginPercent !== null ? marginPercent : null,
    createdAt: new Date()
        }
      });

// 3a. Write ledger rows after transaction.create (using the transaction.id)
if (ledgerRows.length > 0) {
  await tx.stockConsumptionLedger.createMany({
    data: ledgerRows.map(row => ({
      ...row,
      transactionId: transaction.id
    }))
  });
}

      // 3b. Create relational TransactionItem records for queryability and integrity
      await tx.transactionItem.createMany({
        data: items.map((item: { productId: number; variantId: number; name: string; price: number; quantity: number; effectiveTaxRate?: number }) => {
          const itemCost = itemCostMap.get(item.variantId);
          const names = productVariantNames.get(item.variantId);
          return {
            transactionId: transaction.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: names?.productName || item.name,
            variantName: names?.variantName || item.name,
            price: item.price,
            quantity: item.quantity,
            effectiveTaxRate: item.effectiveTaxRate ?? null,
            unitCost: itemCost?.unitCost ?? null,
            totalCost: itemCost?.totalCost ?? null,
          };
        }),
      });

      // 3c. Create audit log for transaction creation
      await tx.transactionAuditLog.create({
        data: {
          transactionId: transaction.id,
          action: 'create',
          newValues: {
            subtotal: calculatedSubtotal,
            tax: validatedTax,
            tip: tip || 0,
            total: finalTotal,
            discount: discountAmount,
            paymentMethod,
            itemCount: items.length,
            totalCost: totalCost ?? 0,
          },
          userId: authenticatedUserId,
          userName: authenticatedUserName,
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null,
        },
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
              throw new TransactionError(t('errors:transactions.stockItemNotFound', { stockItemId }), 'STOCK_NOT_FOUND');
            }
            throw new TransactionError(t('errors:transactions.insufficientStock', { itemName: stockItem.name, available: String(stockItem.quantity), requested: String(quantity) }), 'INSUFFICIENT_STOCK');
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
          throw new TransactionError(t('errors:transactions.orderSessionConflict'), 'CONFLICT');
        }
      }
  
      // 6. Delete tab if exists
      if (activeTabId) {
        const tab = await tx.tab.findUnique({ where: { id: activeTabId } });
        if (tab) {
          await tx.tab.delete({ where: { id: activeTabId } }).catch((err: Error) => {
            logDebug('Tab deletion skipped (may not exist)', { activeTabId, error: err.message, correlationId });
          });

          // Only set table to available if this was the last tab for the table
          if (tab.tableId) {
            const hasOtherTabs = await tx.tab.count({
              where: { tableId: tab.tableId }
            }) > 0;

            if (!hasOtherTabs) {
              await tx.table.update({
                where: { id: tab.tableId },
                data: { status: 'available' }
              });
            }
          }
        } else {
          await tx.tab.delete({ where: { id: activeTabId } }).catch((err: Error) => {
            logDebug('Tab deletion skipped (may not exist)', { activeTabId, error: err.message, correlationId });
          });
        }
      }

      // 7. Update table status if assigned (and no active tab)
      if (tableId && !activeTabId) {
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
		if (error instanceof TransactionError) {
			if (error.code === 'CONFLICT') {
				return res.status(409).json({ 
					error: t('errors:transactions.paymentConflict'),
					code: 'CONFLICT',
					details: error.message
				});
			}
			if (error.code === 'INSUFFICIENT_STOCK') {
				return res.status(400).json({ error: error.message });
			}
			if (error.code === 'STOCK_NOT_FOUND') {
				return res.status(400).json({ error: error.message });
			}
		}

		res.status(500).json({ error: t('transactions.createFailed') });
	}
});

// GET /api/transactions/reconcile - Reconcile transactions with stock levels (MUST be before /:id route)
transactionsRouter.get('/reconcile', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
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
    res.status(500).json({ error: t('errors:transactions.dataReconciliationFailed') });
  }
});

// GET /api/transactions/:id/consumption - Get inventory consumption for a transaction (MUST be before /:id route)
transactionsRouter.get('/:id/consumption', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const correlationId = (req as any).correlationId;

  try {
    const { id } = req.params;
    const transactionId = Number(id);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        status: true,
        items: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: t('transactions.notFound') });
    }

    const items = safeJsonParse(transaction.items, [], { id: String(transaction.id), field: 'items' });

    const consumed = await prisma.stockConsumptionLedger.findMany({
      where: { transactionId },
      orderBy: { stockItemName: 'asc' },
    });

    const totalConsumed = consumed.reduce((sum: number, row: any) => sum + row.quantity, 0);

    const variantIds = items.map((item: any) => item.variantId).filter((id: number) => id);
    const currentConsumption: any[] = await prisma.stockConsumption.findMany({
      where: { variantId: { in: variantIds } },
      include: {
        stockItem: true,
      },
    });

    const expectedMap = new Map<string, number>();
    const typedItems: any[] = items;
    for (const item of typedItems) {
      const itemConsumption = currentConsumption.filter((sc: any) => sc.variantId === item.variantId);
      if (itemConsumption.length > 0) {
        for (const sc of itemConsumption as any[]) {
          const current = expectedMap.get(sc.stockItemId) || 0;
          expectedMap.set(sc.stockItemId, current + sc.quantity * item.quantity);
        }
      }
    }

    const expected = Array.from(expectedMap.entries()).map(([stockItemId, quantity]) => {
      const stockItem = currentConsumption.find((sc: any) => sc.stockItemId === stockItemId);
      return {
        stockItemId,
        stockItemName: stockItem?.stockItem.name || 'Unknown',
        quantity,
      };
    });

    const consumedMap = new Map<string, typeof consumed[0]>();
    for (const c of consumed) {
      consumedMap.set(`${c.variantId}:${c.stockItemId}`, c);
    }

    const itemFlags = items.map((item: any) => {
      const itemConsumption = currentConsumption.filter(sc => sc.variantId === item.variantId);
      const hasRecipe = itemConsumption.length > 0;
      const ledgerForItem = consumed.filter((c: any) => c.variantId === item.variantId);
      const deducted = ledgerForItem.length > 0;
      return {
        productName: item.name || 'Unknown',
        variantName: item.variantName || 'Unknown',
        hasRecipe,
        deducted,
      };
    });

    const issues: string[] = [];

    const anyItemHasRecipeNow = items.some((item: any) => {
      const itemConsumption = currentConsumption.filter(sc => sc.variantId === item.variantId);
      return itemConsumption.length > 0;
    });

  if (consumed.length === 0) {
    if (anyItemHasRecipeNow) {
      for (const item of items) {
        const itemConsumption = currentConsumption.filter((sc: any) => sc.variantId === (item as any).variantId);
        if ((itemConsumption as any[]).length > 0) {
          issues.push(`recipe_item_zero_deduction:${(item as any).name}`);
        }
      }
    } else {
      issues.push('none_no_recipe');
    }
  }

    const orphanedRefs = consumed.filter((c: any) => !c.stockItem);
    if (orphanedRefs.length > 0) {
      issues.push('orphaned_reference');
    }

    let verdict: 'ok' | 'none_no_recipe' | 'review';
    if (issues.includes('none_no_recipe') && issues.length === 1) {
      verdict = 'none_no_recipe';
    } else if (issues.length === 0) {
      verdict = 'ok';
    } else {
      verdict = 'review';
    }

    res.json({
      transactionId,
      status: transaction.status,
      consumed: consumed.map(c => ({
        stockItemId: c.stockItemId,
        stockItemName: c.stockItemName,
        quantity: c.quantity,
        variantName: c.variantName,
        productName: c.productName,
        estimated: c.estimated,
      })),
      totalConsumed,
      expected,
      itemFlags,
      verdict,
      issues,
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching transaction consumption', {
      correlationId,
    });
    res.status(500).json({ error: t('errors:transactions.fetchConsumptionFailed') });
  }
});


// GET /api/transactions/inventory-audit - Audit transactions for inventory issues (MUST be before /:id route)
transactionsRouter.get('/inventory-audit', authenticateToken, requireRole(['ADMIN']), async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const correlationId = (req as any).correlationId;

  try {
    const { from, to } = req.query;

    const dateFilter: any = {};
    if (from) {
      dateFilter.gte = new Date(from as string);
    }
    if (to) {
      dateFilter.lte = new Date(to as string);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        status: { in: CONSUMED_TRANSACTION_STATUSES_MUTABLE },
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        userName: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const allLedgerRows = await prisma.stockConsumptionLedger.findMany({
      where: {
        transactionId: { in: transactions.map(t => t.id) },
      },
      include: {
        stockItem: true,
      },
    });

    const allStockConsumption = await prisma.stockConsumption.findMany({
      include: {
        stockItem: true,
      },
    });

    const ledgerByTransaction = new Map<number, typeof allLedgerRows>();
    for (const row of allLedgerRows) {
      const existing = ledgerByTransaction.get(row.transactionId) || [];
      existing.push(row);
      ledgerByTransaction.set(row.transactionId, existing);
    }

    const consumptionByVariant = new Map<number, typeof allStockConsumption>();
    for (const sc of allStockConsumption) {
      const existing = consumptionByVariant.get(sc.variantId) || [];
      existing.push(sc);
      consumptionByVariant.set(sc.variantId, existing);
    }

    const flagged: Array<{
      transactionId: number;
      createdAt: string;
      status: string;
      userName: string;
      issues: string[];
    }> = [];

    for (const transaction of transactions) {
    const items = safeJsonParse(transaction.items, [], { id: String(transaction.id), field: 'items' }) as any[];
      const ledgerRows = ledgerByTransaction.get(transaction.id) || [];

      const issues: string[] = [];

      const anyItemHasRecipeNow = items.some((item: any) => {
        const consumption = consumptionByVariant.get(item.variantId);
        return consumption && consumption.length > 0;
      });

      if (ledgerRows.length === 0) {
        if (!anyItemHasRecipeNow) {
          continue;
        } else {
          for (const item of items) {
            const consumption = consumptionByVariant.get(item.variantId);
            if (consumption && consumption.length > 0) {
              issues.push(`recipe_item_zero_deduction:${item.name}`);
            }
          }
        }
      }

      const orphanedRefs = ledgerRows.filter(row => !row.stockItem);
      if (orphanedRefs.length > 0) {
        issues.push('orphaned_reference');
      }

      for (const item of items) {
        const consumption = consumptionByVariant.get(item.variantId);
        if (!consumption || consumption.length === 0) {
          continue;
        }

        const ledgerForItem = ledgerRows.filter((row: any) => row.variantId === item.variantId);
        const expectedQty = consumption.reduce((sum: number, sc: any) => sum + sc.quantity * item.quantity, 0);
        const actualQty = ledgerForItem.reduce((sum: number, row: any) => sum + row.quantity, 0);

        if (expectedQty > 0 && actualQty === 0) {
          issues.push(`recipe_item_zero_deduction:${item.name}`);
        }
      }

      if (issues.length > 0) {
        flagged.push({
          transactionId: transaction.id,
          createdAt: transaction.createdAt.toISOString(),
          status: transaction.status,
          userName: transaction.userName || 'Unknown',
          issues,
        });
      }
    }

    res.json({
      totalScanned: transactions.length,
      flagged,
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error running inventory audit', {
      correlationId,
    });
    res.status(500).json({ error: t('errors:transactions.inventoryAuditFailed') });
  }
});

// GET /api/transactions - Get all transactions
transactionsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
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
    logError(error instanceof Error ? error : t('transactions.log.fetchError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('transactions.fetchFailed') });
  }
});

// GET /api/transactions/:id - Get a specific transaction
transactionsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: t('transactions.notFound') });
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
    logError(error instanceof Error ? error : t('transactions.log.fetchOneError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('transactions.fetchOneFailed') });
  }
});

// POST /:id/void - Void a transaction and restore stock
transactionsRouter.post(
  '/:id/void',
  authenticateToken,
  requireRole(['ADMIN']),
  async (req: Request, res: Response) => {
    const t = req.t.bind(req);
    const { id } = req.params;
    const { reason } = req.body;
    const authenticatedUserId = req.user?.id;
    const authenticatedUserName = req.user?.username;

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return res.status(400).json({ error: t('errors:transactions.voidReasonRequired') });
    }

    try {
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 1. Fetch the transaction
        const transaction = await tx.transaction.findUnique({
          where: { id: Number(id) },
        });

        if (!transaction) {
          throw new Error(t('errors:transactions.notFoundCode'));
        }

        if (transaction.status === 'voided') {
          throw new Error(t('errors:transactions.alreadyVoidedCode'));
        }

        if (!CONSUMED_TRANSACTION_STATUSES.includes(transaction.status as any)) {
          throw new Error(t('errors:transactions.invalidStatusCode'));
        }

        // 2. Parse the items JSON to determine what was sold
        const items = safeJsonParse<OrderItem[]>(transaction.items, [], {
          id: String(transaction.id),
          field: 'items',
        });

        // 3. Calculate stock restorations from the ledger (B2 fix)
        //    Fall back to legacy recipe-based restoration for pre-migration transactions
        const ledgerRows = await tx.stockConsumptionLedger.findMany({
          where: { transactionId: Number(id) },
        });

        const restorations = new Map<string, { name: string; quantity: number }>();

        if (ledgerRows.length > 0) {
          // Use ledger for restoration (accurate, recipe-independent)
          for (const row of ledgerRows) {
            const current = restorations.get(row.stockItemId) || { name: row.stockItemName, quantity: 0 };
            restorations.set(row.stockItemId, {
              name: row.stockItemName,
              quantity: current.quantity + row.quantity,
            });
          }
        } else {
          // Legacy fallback: re-derive from current recipe (for pre-migration transactions)
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

        // 5. Update transaction status to voided and reverse cost fields
        const updatedTransaction = await tx.transaction.update({
          where: { id: Number(id) },
          data: {
            status: 'voided',
            voidedAt: new Date(),
            voidReason: reason.trim(),
            voidedBy: authenticatedUserId,
            totalCost: 0,
            grossMargin: null,
            marginPercent: null,
            costCalculatedAt: null,
          },
        });

        // 6. Create audit log for transaction void
        await tx.transactionAuditLog.create({
          data: {
            transactionId: Number(id),
            action: 'void',
            oldValues: {
              status: transaction.status,
              totalCost: decimalToNumber(transaction.totalCost),
              grossMargin: transaction.grossMargin ? decimalToNumber(transaction.grossMargin) : null,
            },
            newValues: {
              status: 'voided',
              voidReason: reason.trim(),
              totalCost: 0,
              restoredItems: Array.from(restorations.entries()).map(([sid, d]) => ({
                stockItemId: sid,
                quantity: d.quantity,
              })),
            },
            userId: authenticatedUserId!,
            userName: authenticatedUserName!,
            ipAddress: req.ip || null,
            userAgent: req.headers['user-agent'] || null,
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
        message: t('errors:transactions.voidSuccess'),
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
        if (error.message === t('errors:transactions.notFoundCode')) {
          return res.status(404).json({ error: t('errors:transactions.notFound') });
        }
        if (error.message === t('errors:transactions.alreadyVoidedCode')) {
          return res.status(409).json({ error: t('errors:transactions.alreadyVoided') });
        }
        if (error.message === t('errors:transactions.invalidStatusCode')) {
          return res.status(400).json({ error: t('errors:transactions.invalidVoidStatus') });
        }
      }
      logError('Error voiding transaction', { error, transactionId: id });
      res.status(500).json({ error: t('errors:transactions.voidFailed') });
    }
  }
);


export default transactionsRouter;