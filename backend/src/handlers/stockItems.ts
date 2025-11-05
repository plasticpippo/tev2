import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { StockItem } from '../types';

export const stockItemsRouter = express.Router();

// GET /api/stock-items - Get all stock items
stockItemsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const stockItems = await prisma.stockItem.findMany();
    // Parse the purchasingUnits JSON string back to array
    const stockItemsWithParsedUnits = stockItems.map(item => ({
      ...item,
      purchasingUnits: typeof item.purchasingUnits === 'string' ? JSON.parse(item.purchasingUnits) : item.purchasingUnits
    }));
    res.json(stockItemsWithParsedUnits);
  } catch (error) {
    console.error('Error fetching stock items:', error);
    res.status(500).json({ error: 'Failed to fetch stock items. Please try again later.' });
  }
});

// GET /api/stock-items/:id - Get a specific stock item
stockItemsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format (standard UUID format: 8-4-4-4-12 hex characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid stock item ID format' });
    }
    
    const stockItem = await prisma.stockItem.findUnique({
      where: { id }
    });
    
    if (!stockItem) {
      return res.status(404).json({ error: 'Stock item not found' });
    }
    
    // Parse the purchasingUnits JSON string back to array
    const stockItemWithParsedUnits = {
      ...stockItem,
      purchasingUnits: typeof stockItem.purchasingUnits === 'string' ? JSON.parse(stockItem.purchasingUnits) : stockItem.purchasingUnits
    };
    
    res.json(stockItemWithParsedUnits);
  } catch (error) {
    console.error('Error fetching stock item:', error);
    res.status(500).json({ error: 'Failed to fetch stock item. Please try again later.' });
  }
});

// POST /api/stock-items - Create a new stock item
stockItemsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, quantity, type, baseUnit, purchasingUnits } = req.body as Omit<StockItem, 'id'>;
    
    const stockItem = await prisma.stockItem.create({
      data: {
        name,
        quantity,
        type,
        baseUnit: baseUnit || 'unit',
        ...(purchasingUnits !== undefined && purchasingUnits !== null && { purchasingUnits: JSON.stringify(purchasingUnits) })
      }
    });
    
    res.status(201).json(stockItem);
  } catch (error) {
    console.error('Error creating stock item:', error);
    res.status(500).json({ error: 'Failed to create stock item. Please check your data and try again.' });
 }
});

// PUT /api/stock-items/update-levels - Update stock levels based on consumption
stockItemsRouter.put('/update-levels', async (req: Request, res: Response) => {
  try {
    const { consumptions } = req.body as { consumptions: { stockItemId: string, quantity: number }[] };
    
    if (!consumptions || !Array.isArray(consumptions)) {
      return res.status(400).json({ error: 'Invalid consumptions data' });
    }

    // Filter out invalid consumptions and get all stock item IDs to check
    const validConsumptions = consumptions.filter(c => {
      // Validate UUID format for each stockItemId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return c.stockItemId && c.quantity > 0 && uuidRegex.test(c.stockItemId);
    });
    const stockItemIds = validConsumptions.map(c => c.stockItemId);
    
    if (stockItemIds.length === 0) {
      return res.status(200).json({ message: 'No valid stock items to update' });
    }

    // Get all existing stock items in a single query
    const existingStockItems = await prisma.stockItem.findMany({
      where: { id: { in: stockItemIds } }
    });
    
    // Create a map of existing stock items for quick lookup and quantity validation
    const existingStockMap = new Map(existingStockItems.map(item => [item.id, item.quantity]));
    
    // Identify invalid stock item IDs (orphaned references)
    const invalidStockItemIds = validConsumptions
      .filter(c => !existingStockMap.has(c.stockItemId))
      .map(c => c.stockItemId);
    
    if (invalidStockItemIds.length > 0) {
      // Get names of invalid stock items for more descriptive error messages
      const invalidStockItems = await prisma.stockItem.findMany({
        where: { id: { in: invalidStockItemIds } },
        select: { id: true, name: true }
      });
      
      // Log the invalid references for debugging
      console.warn(`Invalid stock item references found: ${invalidStockItemIds.join(', ')}`);
      
      // Filter out invalid consumptions and continue with valid ones
      const validConsumptionsForExistingStock = validConsumptions.filter(c => existingStockMap.has(c.stockItemId));
      
      // Process only the valid consumptions for existing stock items
      for (const { stockItemId, quantity } of validConsumptionsForExistingStock) {
        const currentQuantity = existingStockMap.get(stockItemId)!;
        
        // Check if we have enough stock to decrement
        if (currentQuantity >= quantity) {
          await prisma.stockItem.update({
            where: { id: stockItemId },
            data: {
              quantity: {
                decrement: quantity
              }
            }
          });
          // Update the map to reflect the new quantity for potential multiple updates to the same item
          existingStockMap.set(stockItemId, currentQuantity - quantity);
        } else {
          // Get the stock item name for more descriptive error
          const stockItem = await prisma.stockItem.findUnique({
            where: { id: stockItemId },
            select: { name: true }
          });
          const stockItemName = stockItem?.name || `ID ${stockItemId}`;
          
          console.warn(`Insufficient stock for item ${stockItemName} (ID: ${stockItemId}). Required: ${quantity}, Available: ${currentQuantity}.`);
          return res.status(400).json({
            error: `Insufficient stock for item "${stockItemName}" (ID: ${stockItemId}). Required: ${quantity}, Available: ${currentQuantity}.`
          });
        }
      }
      
      // Return a warning response instead of failing completely
      return res.status(200).json({
        message: 'Stock levels updated with warnings',
        warnings: [`Found and skipped ${invalidStockItemIds.length} invalid stock item references: ${invalidStockItemIds.join(', ')}`],
        invalidStockItemIds
      });
    }
    
    // Process only the valid consumptions for existing stock items
    for (const { stockItemId, quantity } of validConsumptions) {
      const currentQuantity = existingStockMap.get(stockItemId)!;
      
      // Check if we have enough stock to decrement
      if (currentQuantity >= quantity) {
        await prisma.stockItem.update({
          where: { id: stockItemId },
          data: {
            quantity: {
              decrement: quantity
            }
          }
        });
        // Update the map to reflect the new quantity for potential multiple updates to the same item
        existingStockMap.set(stockItemId, currentQuantity - quantity);
      } else {
        // Get the stock item name for more descriptive error
        const stockItem = await prisma.stockItem.findUnique({
          where: { id: stockItemId },
          select: { name: true }
        });
        const stockItemName = stockItem?.name || `ID ${stockItemId}`;
        
        console.warn(`Insufficient stock for item ${stockItemName} (ID: ${stockItemId}). Required: ${quantity}, Available: ${currentQuantity}.`);
        return res.status(400).json({
          error: `Insufficient stock for item "${stockItemName}" (ID: ${stockItemId}). Required: ${quantity}, Available: ${currentQuantity}.`
        });
      }
    }
    
    res.status(200).json({ message: 'Stock levels updated successfully' });
 } catch (error) {
     console.error('Error updating stock levels:', error);
     res.status(500).json({ error: 'Failed to update stock levels. Please check your data and try again.' });
 }
});

// PUT /api/stock-items/:id - Update a stock item
stockItemsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format (standard format: 8-4-4-4-12 hex characters with optional dashes)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid stock item ID format' });
    }
    
    const { name, quantity, type, baseUnit, purchasingUnits } = req.body as Omit<StockItem, 'id'>;
    
    // Build update data object with only defined values
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (type !== undefined) updateData.type = type;
    if (baseUnit !== undefined) updateData.baseUnit = baseUnit || 'unit';
    if (purchasingUnits !== undefined && purchasingUnits !== null) {
      updateData.purchasingUnits = JSON.stringify(purchasingUnits);
    }
    
    // If updateData is empty, return early to avoid Prisma error
    if (Object.keys(updateData).length === 0) {
      const stockItem = await prisma.stockItem.findUnique({
        where: { id }
      });
      
      if (!stockItem) {
        return res.status(404).json({ error: 'Stock item not found' });
      }
      
      return res.json(stockItem);
    }
    
    const stockItem = await prisma.stockItem.update({
      where: { id },
      data: updateData
    });
    
    res.json(stockItem);
  } catch (error) {
    console.error('Error updating stock item:', error);
    res.status(500).json({ error: 'Failed to update stock item. Please check your data and try again.' });
  }
});

// DELETE /api/stock-items/:id - Delete a stock item
stockItemsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format (standard format: 8-4-4-4-12 hex characters with optional dashes)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid stock item ID format' });
    }
    
    // Check if this stock item is used in any product variants
    const stockConsumptions = await prisma.stockConsumption.count({
      where: { stockItemId: id }
    });
    
    if (stockConsumptions > 0) {
      return res.status(400).json({
        error: 'Cannot delete stock item. It is currently used in a product recipe.'
      });
    }
    
    await prisma.stockItem.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting stock item:', error);
    res.status(500).json({ error: 'Failed to delete stock item. The item may be in use in product recipes.' });
  }
});

// GET /api/stock-items/orphaned-references - Get stock consumption records that reference non-existent stock items
stockItemsRouter.get('/orphaned-references', async (req: Request, res: Response) => {
  try {
    // Find stock consumption records that reference stock items that don't exist
    // First get all stock consumption records
    const allStockConsumptions = await prisma.stockConsumption.findMany({
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    });
    
    // Then check which stock items exist
    const stockItemIds = [...new Set(allStockConsumptions.map(sc => sc.stockItemId))];
    const existingStockItems = await prisma.stockItem.findMany({
      where: {
        id: { in: stockItemIds }
      },
      select: {
        id: true
      }
    });
    
    const existingStockItemIds = new Set(existingStockItems.map(item => item.id));
    
    // Filter to only include orphaned references
    const orphanedConsumptions = allStockConsumptions.filter(sc => !existingStockItemIds.has(sc.stockItemId));
    
    // Format the response to match the original structure
    const formattedOrphanedConsumptions = orphanedConsumptions.map(consumption => ({
      id: consumption.id,
      variantId: consumption.variantId,
      stockItemId: consumption.stockItemId,
      quantity: consumption.quantity,
      variantName: consumption.variant.name,
      productName: consumption.variant.product.name
    }));
    
    res.json(formattedOrphanedConsumptions);
  } catch (error) {
    console.error('Error fetching orphaned stock consumption references:', error);
    res.status(500).json({ error: 'Failed to fetch orphaned stock consumption references. Please try again later.' });
  }
});

// DELETE /api/stock-items/cleanup-orphaned - Remove invalid stock consumption references
stockItemsRouter.delete('/cleanup-orphaned', async (req: Request, res: Response) => {
  try {
    // Find orphaned stock consumption records
    // Get all stock consumption records with related data
    const allStockConsumptions = await prisma.stockConsumption.findMany({
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    });
    
    // Then check which stock items exist
    const stockItemIds = [...new Set(allStockConsumptions.map(sc => sc.stockItemId))];
    const existingStockItems = await prisma.stockItem.findMany({
      where: {
        id: { in: stockItemIds }
      },
      select: {
        id: true
      }
    });
    
    const existingStockItemIds = new Set(existingStockItems.map(item => item.id));
    
    // Filter to only include orphaned references
    const orphanedConsumptions = allStockConsumptions.filter(sc => !existingStockItemIds.has(sc.stockItemId));
    
    // Format the response to match the original structure
    const formattedOrphanedConsumptions = orphanedConsumptions.map(consumption => ({
      id: consumption.id,
      variantId: consumption.variantId,
      stockItemId: consumption.stockItemId,
      quantity: consumption.quantity,
      variantName: consumption.variant.name,
      productName: consumption.variant.product.name
    }));
    
    if (formattedOrphanedConsumptions.length === 0) {
      return res.status(200).json({
        message: 'No orphaned references found',
        deletedCount: 0
      });
    }
    
    // Extract the IDs of orphaned consumption records
    const orphanedIds = formattedOrphanedConsumptions.map(oc => oc.id);
    
    // Delete the orphaned consumption records
    await prisma.stockConsumption.deleteMany({
      where: {
        id: { in: orphanedIds }
      }
    });
    
    res.status(200).json({
      message: `Successfully removed ${orphanedIds.length} orphaned stock consumption references`,
      deletedCount: orphanedIds.length,
      removedRecords: formattedOrphanedConsumptions
    });
  } catch (error) {
      console.error('Error cleaning up orphaned stock consumption references:', error);
      res.status(500).json({ error: 'Failed to clean up orphaned stock consumption references. Please try again later.' });
  }
});

// GET /api/stock-items/validate-integrity - Validate data integrity between products and stock items
stockItemsRouter.get('/validate-integrity', async (req: Request, res: Response) => {
  try {
    // Check for orphaned stock consumption references
    // Get all stock consumption records with related data
    const allStockConsumptions = await prisma.stockConsumption.findMany({
      include: {
        variant: {
          include: {
            product: true
          }
        }
      }
    });
    
    // Then check which stock items exist
    const stockItemIds = [...new Set(allStockConsumptions.map(sc => sc.stockItemId))];
    const existingStockItems = await prisma.stockItem.findMany({
      where: {
        id: { in: stockItemIds }
      },
      select: {
        id: true
      }
    });
    
    const existingStockItemIds = new Set(existingStockItems.map(item => item.id));
    
    // Filter to only include orphaned references
    const orphanedConsumptions = allStockConsumptions.filter(sc => !existingStockItemIds.has(sc.stockItemId));
    
    // Format the response to match the original structure
    const formattedOrphanedConsumptions = orphanedConsumptions.map(consumption => ({
      id: consumption.id,
      variantId: consumption.variantId,
      stockItemId: consumption.stockItemId,
      quantity: consumption.quantity,
      variantName: consumption.variant.name,
      productName: consumption.variant.product.name
    }));
    
    // Check for stock items with negative quantities
    const negativeStockItems = await prisma.stockItem.findMany({
      where: {
        quantity: {
          lt: 0
        }
      }
    });
    
    // Check for product variants that have no stock consumption records (might be valid, but worth noting)
    const variantsWithoutConsumption = await prisma.productVariant.findMany({
      where: {
        stockConsumption: {
          none: {}
        }
      },
      include: {
        product: true
      }
    });
    
    const integrityReport = {
      orphanedConsumptions: formattedOrphanedConsumptions.length,
      negativeStockItems: negativeStockItems.length,
      variantsWithoutConsumption: variantsWithoutConsumption.length,
      details: {
        orphanedConsumptions: formattedOrphanedConsumptions,
        negativeStockItems,
        variantsWithoutConsumption: variantsWithoutConsumption.map(v => ({
          id: v.id,
          name: v.name,
          productName: v.product.name
        }))
      }
    };
    
    const hasIssues = integrityReport.orphanedConsumptions > 0 ||
                     integrityReport.negativeStockItems > 0;
    
    res.status(200).json({
      message: hasIssues ? 'Data integrity issues found' : 'Data integrity validation passed',
      hasIssues,
      report: integrityReport
    });
  } catch (error) {
    console.error('Error validating data integrity:', error);
    res.status(500).json({ error: 'Failed to validate data integrity. Please try again later.' });
  }
});

export default stockItemsRouter;