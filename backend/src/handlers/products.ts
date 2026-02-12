import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Product, ProductVariant } from '../types';
import { validateProduct, validateProductName, validateCategoryId, validateProductVariant } from '../utils/validation';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';

export const productsRouter = express.Router();

// GET /api/products - Get all products
productsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            stockConsumption: true
          }
        }
      }
    });
    res.json(products);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching products', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch products. Please try again later.' });
  }
});

// GET /api/products/:id - Get a specific product
productsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        variants: {
          include: {
            stockConsumption: true
          }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch product. Please try again later.' });
  }
});

// POST /api/products - Create a new product
productsRouter.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, categoryId, variants } = req.body as Omit<Product, 'id'> & { variants: Omit<ProductVariant, 'id' | 'productId'>[] };
    
    // Validate product data
    const validation = validateProduct({ name, categoryId, variants });
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return res.status(400).json({ error: `Invalid category ID: ${categoryId}` });
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
            error: `Invalid stock item references: ${invalidStockItemIds.join(', ')}`
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
            backgroundColor: v.backgroundColor,
            textColor: v.textColor,
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
            stockConsumption: true
          }
        }
      }
    });
    
    res.status(201).json(product);
  } catch (error) {
   logError(error instanceof Error ? error : 'Error creating product', {
     correlationId: (req as any).correlationId,
   });
   res.status(500).json({ error: 'Failed to create product. Please check your data and try again.' });
  }
});

// PUT /api/products/:id - Update a product
productsRouter.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
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
            validationErrors.push(`Variant ${i + 1}: ${variantError}`);
          }
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ error: 'Validation failed', details: validationErrors });
      }
    }
    
    // If categoryId is provided, validate that it exists
    if (categoryId !== undefined) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!category) {
        return res.status(400).json({ error: `Invalid category ID: ${categoryId}` });
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
            error: `Invalid stock item references: ${invalidStockItemIds.join(', ')}`
          });
        }
      }
    }
    
    // Start a transaction to ensure data consistency
    const product = await prisma.$transaction(async (tx) => {
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
              stockConsumption: true
            }
          }
        }
      });
      
      // If variants are provided, update them as well
      if (variants && Array.isArray(variants) && variants.length > 0) {
        // First, delete existing stock consumption records for this product's variants
        await tx.stockConsumption.deleteMany({
          where: {
            variant: {
              productId: Number(id)
            }
          }
        });
        
        // Then delete existing variants for this product
        await tx.productVariant.deleteMany({
          where: { productId: Number(id) }
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
                backgroundColor: v.backgroundColor,
                textColor: v.textColor,
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
                stockConsumption: true
              }
            }
          }
        });
        
        return updatedProductWithVariants;
      }
      
      return updatedProduct;
    });
    
    res.json(product);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to update product. Please check your data and try again.' });
  }
});

// DELETE /api/products/:id - Delete a product
productsRouter.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First, delete stock consumption records for this product's variants
      await tx.stockConsumption.deleteMany({
        where: {
          variant: {
            productId: Number(id)
          }
        }
      });
      
      // Then delete the variants
      await tx.productVariant.deleteMany({
        where: { productId: Number(id) }
      });
      
      // Finally delete the product
      await tx.product.delete({
        where: { id: Number(id) }
      });
    });
    
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting product', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to delete product. The product may be in use or referenced elsewhere.' });
  }
});

export default productsRouter;