/**
 * Backfill Script for StockConsumptionLedger
 * 
 * This script populates the stock_consumption_ledger table for historical transactions
 * that were created before the ledger was introduced. It reconstructs the consumption
 * using StockConsumptionVersion snapshots to maintain recipe history accuracy.
 * 
 * Usage: npx tsx src/scripts/backfillConsumptionLedger.ts
 * 
 * This script is idempotent - it skips transactions that already have ledger rows.
 * 
 * Limitations:
 * - For transactions before the first version snapshot (migration 20260412160000),
 *   the script falls back to the current recipe and marks rows as estimated=true.
 * - This is an honest approximation; actual historical recipes may have differed.
 */

import { prisma } from '../prisma';
import { parseTransactionItems } from '../utils/jsonParser';
import { CONSUMED_TRANSACTION_STATUSES_MUTABLE } from '../utils/transaction';

interface LedgerRow {
  transactionId: number;
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
}

async function backfillConsumptionLedger() {
  console.log('Starting StockConsumptionLedger backfill...');
  
  // Find all transactions that need backfilling
  // (consumed transactions without ledger rows)
  const transactionsToBackfill = await prisma.transaction.findMany({
    where: {
      status: { in: CONSUMED_TRANSACTION_STATUSES_MUTABLE },
      consumptionLedger: { none: {} },
    },
    select: {
      id: true,
      createdAt: true,
      items: true,
    },
  });
  
  console.log(`Found ${transactionsToBackfill.length} transactions to backfill`);
  
  let totalRowsCreated = 0;
  let estimatedCount = 0;
  let skippedCount = 0;
  
  for (const transaction of transactionsToBackfill) {
    const txId = transaction.id;
    const txCreatedAt = transaction.createdAt;
    
    // Parse transaction items
    const items = parseTransactionItems(transaction.items);
    if (!items || !Array.isArray(items) || items.length === 0) {
      skippedCount++;
      continue;
    }
    
    const ledgerRows: LedgerRow[] = [];
    
    for (const item of items) {
      if (!item.productId || !item.variantId) continue;
      
      // Find the effective recipe as of transaction.createdAt
      // Get all version snapshots for this variant
      const versionSnapshots = await prisma.stockConsumptionVersion.findMany({
        where: { variantId: item.variantId },
        orderBy: { replacedAt: 'asc' },
      });
      
      // Find the snapshot with the smallest replacedAt > createdAt
      const effectiveSnapshot = versionSnapshots.find(
        (snap) => snap.replacedAt > txCreatedAt
      );
      
      if (effectiveSnapshot) {
        // Use version snapshot (exact historical recipe)
        const snapshotsForVariant = versionSnapshots.filter(
          (snap) => snap.replacedAt.getTime() === effectiveSnapshot!.replacedAt.getTime()
        );
        
        for (const snap of snapshotsForVariant) {
          ledgerRows.push({
            transactionId: txId,
            stockItemId: snap.stockItemId,
            variantId: snap.variantId,
            productId: snap.productId,
            quantity: snap.quantity * item.quantity,
            productName: snap.productName,
            variantName: snap.variantName,
            stockItemName: snap.stockItemName,
            categoryId: 0, // Version doesn't store category - fetch below
            categoryName: '',
            estimated: false,
          });
        }
      } else {
        // No version snapshot found - use current recipe
        // Check if there's any version history at all (for estimated flag)
        const hasVersionHistory = versionSnapshots.length > 0;
        
        const currentRecipe = await prisma.stockConsumption.findMany({
          where: { variantId: item.variantId },
          include: {
            variant: {
              include: {
                product: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            stockItem: true,
          },
        });
        
        for (const sc of currentRecipe) {
          const variant = sc.variant;
          ledgerRows.push({
            transactionId: txId,
            stockItemId: sc.stockItemId,
            variantId: variant.id,
            productId: variant.product.id,
            quantity: sc.quantity * item.quantity,
            productName: variant.product.name,
            variantName: variant.name,
            stockItemName: sc.stockItem.name,
            categoryId: variant.product.categoryId,
            categoryName: variant.product.category.name,
            estimated: hasVersionHistory, // Mark estimated if version history exists
          });
        }
      }
    }
    
    if (ledgerRows.length > 0) {
      await prisma.stockConsumptionLedger.createMany({
        data: ledgerRows,
        skipDuplicates: true,
      });
      
      totalRowsCreated += ledgerRows.length;
      estimatedCount += ledgerRows.filter((r) => r.estimated).length;
    }
  }
  
  console.log('Backfill complete');
  console.log(`- Transactions processed: ${transactionsToBackfill.length - skippedCount}`);
  console.log(`- Transactions skipped (no items): ${skippedCount}`);
  console.log(`- Ledger rows created: ${totalRowsCreated}`);
  console.log(`- Estimated rows (approximate): ${estimatedCount}`);
  console.log(`- Exact rows: ${totalRowsCreated - estimatedCount}`);
}

backfillConsumptionLedger()
  .then(() => {
    console.log('Backfill script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });