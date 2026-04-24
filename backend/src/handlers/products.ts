import express, { Request, Response } from 'express';
import { Prisma, ProductVariant, StockConsumption, TaxRate } from '@prisma/client';
import { prisma } from '../prisma';
import type { Product, ProductVariant as ProductVariantType } from '../types';
import { validateProduct, validateProductName, validateCategoryId, validateProductVariant } from '../utils/validation';
import { logError } from '../utils/logger';
import { multiplyMoney } from '../utils/money';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';


export const productsRouter = express.Router();

// Helper: Format product variant for API response
function formatProductVariant(variant: ProductVariant & { stockConsumption: StockConsumption[]; taxRate: TaxRate | null }) {
  return {
    id: variant.id,
    productId: variant.productId,
    name: variant.name,
    price: Number(variant.price),
    isFavourite: variant.isFavourite,
    themeColor: variant.themeColor,
    stockConsumption: variant.stockConsumption || [],
    taxRateId: variant.taxRateId,
    taxRate: variant.taxRate ? {
      id: variant.taxRate.id,
      name: variant.taxRate.name,
      rate: Number(variant.taxRate.rate),
      ratePercent: multiplyMoney(Number(variant.taxRate.rate), 100).toFixed(2) + '%',
      description: variant.taxRate.description,
      isDefault: variant.taxRate.isDefault,
      isActive: variant.taxRate.isActive,
      createdAt: variant.taxRate.createdAt.toISOString(),
      updatedAt: variant.taxRate.updatedAt.toISOString()
    } : null
  };
}

// GET /api/products/search - Search products by name
productsRouter.get('/search', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { q, limit } = req.query;
    const searchQuery = typeof q === 'string' ? q : '';
    const limitNum = typeof limit === 'string' ? Math.min(parseInt(limit, 10), 100) : 50;

    if (!searchQuery.trim()) {
      return res.json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { 
            variants: { 
              some: { 
                name: { contains: searchQuery, mode: 'insensitive' } 
              } 
            } 
          }
        ]
      },
      include: {
        variants: {
          include: {
            stockConsumption: true,
            taxRate: true
          }
        }
      },
      take: limitNum,
      orderBy: { name: 'asc' }
    });

    // Format products with tax rate info
    const formattedProducts = products.map(product => ({
      ...product,
      variants: product.variants.map(formatProductVariant)
    }));

    res.json(formattedProducts);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error searching products', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:products.searchFailed') });
  }
});

// GET /api/products - Get all products
productsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            stockConsumption: true,
            taxRate: true
          }
        }
      }
    });
    
    // Format products with tax rate info
    const formattedProducts = products.map(product => ({
      ...product,
      variants: product.variants.map(formatProductVariant)
    }));
    
    res.json(formattedProducts);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching products', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:products.fetchFailed') });
  }
});

// GET /api/products/:id - Get a specific product
productsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        variants: {
          include: {
            stockConsumption: true,
            taxRate: true
          }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: t('errors:products.notFound') });
    }
    
    // Format product with tax rate info
    const formattedProduct = {
      ...product,
      variants: product.variants.map(formatProductVariant)
    };
    
    res.json(formattedProduct);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:products.fetchOneFailed') });
  }
});

// POST /api/products - Create a new product
productsRouter.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { name, categoryId, variants } = req.body as Omit<Product, 'id'> & { variants: Omit<ProductVariant, 'id' | 'productId'>[] };
    
    // Validate product data
    const validation = validateProduct({ name, categoryId, variants });
    if (!validation.isValid) {
      return res.status(400).json({ error: t('errors:products.validationFailed'), details: validation.errors });
    }
    
    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return res.status(400).json({ error: t('errors:products.invalidCategoryId', { categoryId }) });
    }
    
    // Validate tax rate IDs if provided
    if (variants && variants.length > 0) {
      const taxRateIds = variants
        .map(v => (v as any).taxRateId)
        .filter((id): id is number => id !== undefined && id !== null);
      
      if (taxRateIds.length > 0) {
        const taxRates = await prisma.taxRate.findMany({
          where: { id: { in: taxRateIds } }
        });
        
        const invalidIds = taxRateIds.filter(id => !taxRates.find(tr => tr.id === id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            error: t('errors:products.invalidTaxRateReferences', { ids: invalidIds.join(', ') })
          });
        }
        
        // Check if any tax rates are inactive
        const inactiveRates = taxRates.filter(tr => !tr.isActive);
        if (inactiveRates.length > 0) {
          return res.status(400).json({
            error: t('errors:products.cannotUseInactiveTaxRate'),
            details: inactiveRates.map(tr => tr.name)
          });
        }
      }
    }
    
    // If variants have stock consumption, validate stock item references
    if (variants && variants.length > 0) {
      // Collect all stock item IDs from all variants
      const allStockItemIds: string[] = [];
      variants.forEach(v => {
        if (v.stockConsumption && Array.isArray(v.stockConsumption)) {
          v.stockConsumption.forEach(sc => {
            if (sc.stockItemId) {
              allStockItemIds.push(sc.stockItemId);
            }
          });
        }
      });
      
      // Check if all referenced stock items exist
      if (allStockItemIds.length > 0) {
        const existingStockItems = await prisma.stockItem.findMany({
          where: { id: { in: allStockItemIds } },
          select: { id: true }
        });
        
        const existingStockItemIds = existingStockItems.map(item => item.id);
        const invalidStockItemIds = allStockItemIds.filter(id => !existingStockItemIds.includes(id));
        
        if (invalidStockItemIds.length > 0) {
          return res.status(400).json({
            error: t('errors:products.invalidStockItemReferences', { ids: invalidStockItemIds.join(', ') })
          });
        }
      }
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        categoryId,
        variants: {
          create: variants.map(v => ({
            name: v.name,
            price: v.price,
            isFavourite: v.isFavourite || false,
            themeColor: (v as any).themeColor || 'slate',
            taxRateId: (v as any).taxRateId || null,
            stockConsumption: {
              create: v.stockConsumption.map((sc: { stockItemId: string; quantity: number }) => ({
                stockItemId: sc.stockItemId,
                quantity: sc.quantity
              }))
            }
          }))
        }
      },
      include: {
        variants: {
          include: {
            stockConsumption: true,
            taxRate: true
          }
        }
      }
    });
    
    // Format response
    const formattedProduct = {
      ...product,
      variants: product.variants.map(formatProductVariant)
    };
    
    res.status(201).json(formattedProduct);
  } catch (error) {
   logError(error instanceof Error ? error : 'Error creating product', {
     correlationId: (req as any).correlationId,
   });
   res.status(500).json({ error: t('errors:products.createFailed') });
  }
});

// PUT /api/products/:id - Update a product
productsRouter.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const { name, categoryId, variants } = req.body as Omit<Product, 'id'> & { variants?: Omit<ProductVariant, 'id' | 'productId'>[] };
    
    // Validate product data if provided
    if (name !== undefined || categoryId !== undefined || variants !== undefined) {
      const productToValidate = {
        name: name !== undefined ? name : '',
        categoryId: categoryId !== undefined ? categoryId : 0,
        variants: variants !== undefined ? variants : []
      };
      
      // Only validate fields that are provided
      const validationErrors = [];
      
      if (name !== undefined) {
        const nameError = validateProductName(name);
        if (nameError) validationErrors.push(nameError);
      }
      
      if (categoryId !== undefined) {
        const categoryIdError = validateCategoryId(categoryId);
        if (categoryIdError) validationErrors.push(categoryIdError);
      }
      
      if (variants !== undefined && Array.isArray(variants)) {
        for (let i = 0; i < variants.length; i++) {
          const variant = variants[i];
          const variantError = validateProductVariant(variant);
          if (variantError) {
            validationErrors.push(t('errors:products.variantError', { index: i + 1, error: variantError }));
          }
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: t('errors:products.validationFailed'), details: validationErrors });
      }
    }
    
    // If categoryId is provided, validate that it exists
    if (categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!category) {
        return res.status(400).json({ error: t('errors:products.invalidCategoryId', { categoryId }) });
      }
    }
    
    // Validate tax rate IDs if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const taxRateIds = variants
        .map(v => (v as any).taxRateId)
        .filter((id): id is number => id !== undefined && id !== null);
      
      if (taxRateIds.length > 0) {
        const taxRates = await prisma.taxRate.findMany({
          where: { id: { in: taxRateIds } }
        });
        
        const invalidIds = taxRateIds.filter(id => !taxRates.find(tr => tr.id === id));
        if (invalidIds.length > 0) {
          return res.status(400).json({
            error: t('errors:products.invalidTaxRateReferences', { ids: invalidIds.join(', ') })
          });
        }
        
        // Check if any tax rates are inactive
        const inactiveRates = taxRates.filter(tr => !tr.isActive);
        if (inactiveRates.length > 0) {
          return res.status(400).json({
            error: t('errors:products.cannotUseInactiveTaxRate'),
            details: inactiveRates.map(tr => tr.name)
          });
        }
      }
    }
    
    // If variants are provided with stock consumption, validate stock item references
    if (variants && Array.isArray(variants) && variants.length > 0) {
      // Collect all stock item IDs from all variants
      const allStockItemIds: string[] = [];
      variants.forEach(v => {
        if (v.stockConsumption && Array.isArray(v.stockConsumption)) {
          v.stockConsumption.forEach(sc => {
            if (sc.stockItemId) {
              allStockItemIds.push(sc.stockItemId);
            }
          });
        }
      });
      
      // Check if all referenced stock items exist
      if (allStockItemIds.length > 0) {
        const existingStockItems = await prisma.stockItem.findMany({
          where: { id: { in: allStockItemIds } },
          select: { id: true }
        });
        
        const existingStockItemIds = existingStockItems.map(item => item.id);
        const invalidStockItemIds = allStockItemIds.filter(id => !existingStockItemIds.includes(id));
        
        if (invalidStockItemIds.length > 0) {
          return res.status(400).json({
            error: t('errors:products.invalidStockItemReferences', { ids: invalidStockItemIds.join(', ') })
          });
        }
      }
    }
    
    // Start a transaction to ensure data consistency
    const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update the product fields
      const updatedProduct = await tx.product.update({
        where: { id: Number(id) },
        data: {
          name: name !== undefined ? name : undefined,
          categoryId: categoryId !== undefined ? categoryId : undefined,
        },
        include: {
          variants: {
            include: {
              stockConsumption: true,
              taxRate: true
            }
          }
        }
      });
      
      // If variants are provided, update them as well
      if (variants && Array.isArray(variants) && variants.length > 0) {
        // Snapshot existing stock consumption records into version history before deletion
        const existingConsumptions = await tx.stockConsumption.findMany({
          where: {
            variant: {
              productId: Number(id),
            },
          },
          include: {
            variant: {
              include: { product: true },
            },
            stockItem: true,
          },
        });

        if (existingConsumptions.length > 0) {
          await tx.stockConsumptionVersion.createMany({
            data: existingConsumptions.map((sc) => ({
              variantId: sc.variantId,
              variantName: sc.variant.name,
              productId: sc.variant.productId,
              productName: sc.variant.product.name,
              stockItemId: sc.stockItemId,
              stockItemName: sc.stockItem.name,
              quantity: sc.quantity,
              changeReason: 'product_update',
              changedBy: req.user?.id ?? null,
            })),
          });
        }

        // Delete existing stock consumption records for this product's variants
        await tx.stockConsumption.deleteMany({
          where: {
            variant: {
              productId: Number(id),
            },
          },
        });

        // Then delete existing variants for this product
        await tx.productVariant.deleteMany({
          where: { productId: Number(id) },
        });
        
        // Create new variants
        const updatedProductWithVariants = await tx.product.update({
          where: { id: Number(id) },
          data: {
            variants: {
      create: variants.map(v => ({
              name: v.name,
              price: v.price,
              isFavourite: v.isFavourite || false,
              themeColor: (v as any).themeColor || 'slate',
              taxRateId: (v as any).taxRateId || null,
              stockConsumption: {
                create: v.stockConsumption.map((sc) => ({
                  stockItemId: sc.stockItemId,
                  quantity: sc.quantity
                }))
              }
            }))
            }
          },
          include: {
            variants: {
              include: {
                stockConsumption: true,
                taxRate: true
              }
            }
          }
        });
        
        return updatedProductWithVariants;
      }
      
      return updatedProduct;
    });
    
    // Format response
    const formattedProduct = {
      ...product,
      variants: product.variants.map(formatProductVariant)
    };
    
    res.json(formattedProduct);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:products.updateFailed') });
  }
});

// DELETE /api/products/:id - Delete a product
productsRouter.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { id } = req.params;
    const productId = Number(id);

    // Check existence first - return 404 if not found
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            stockConsumption: {
              include: {
                stockItem: true,
                variant: { include: { product: true } }
              }
            }
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: t('errors:products.notFound') });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Snapshot stock consumptions to version history (audit trail)
      const allConsumptions = product.variants.flatMap(v =>
        v.stockConsumption.map(sc => ({
          variantId: sc.variantId,
          variantName: v.name,
          productId: productId,
          productName: product.name,
          stockItemId: sc.stockItemId,
          stockItemName: sc.stockItem?.name || 'Unknown',
          quantity: sc.quantity,
          changeReason: 'product_deletion',
          changedBy: req.user?.id ?? null,
        }))
      );

      if (allConsumptions.length > 0) {
        await tx.stockConsumptionVersion.createMany({ data: allConsumptions });
      }

      // Delete in correct order: StockConsumption → ProductVariant → Product
      // VariantLayout and SharedLayoutPosition cascade-delete automatically via DB constraints
      await tx.stockConsumption.deleteMany({
        where: {
          variant: {
            productId
          }
        }
      });
      await tx.productVariant.deleteMany({
        where: { productId }
      });
      await tx.product.delete({
        where: { id: productId }
      });
    });

    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:products.deleteFailed') });
  }
});

export default productsRouter;
