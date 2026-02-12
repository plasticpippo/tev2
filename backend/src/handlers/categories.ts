import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Category } from '../types';
import { validateCategory, validateCategoryName } from '../utils/validation';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';

export const categoriesRouter = express.Router();

// GET /api/categories - Get all categories
categoriesRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        visibleTillIds: true
      }
    });
    res.json(categories);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching categories', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch categories. Please try again later.' });
  }
});

// GET /api/categories/:id - Get a specific category
categoriesRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        visibleTillIds: true
      }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching category', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch category. Please try again later.' });
  }
});

// POST /api/categories - Create a new category
categoriesRouter.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, visibleTillIds } = req.body as Omit<Category, 'id'>;
    
    // Validate category data
    const validation = validateCategory({ name });
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }
    
    const category = await prisma.category.create({
      data: {
        name,
        visibleTillIds: visibleTillIds || []
      },
      select: {
        id: true,
        name: true,
        visibleTillIds: true
      }
    });
    
    res.status(201).json(category);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating category', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to create category. Please check your data and try again.' });
  }
});

// PUT /api/categories/:id - Update a category
categoriesRouter.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, visibleTillIds } = req.body as Omit<Category, 'id'>;
    
    // Validate category data if name is provided
    if (name !== undefined) {
      const nameError = validateCategoryName(name);
      if (nameError) {
        return res.status(400).json({ error: 'Validation failed', details: [nameError] });
      }
    }
    
    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name,
        visibleTillIds: visibleTillIds || []
      },
      select: {
        id: true,
        name: true,
        visibleTillIds: true
      }
    });
    
    res.json(category);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating category', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to update category. Please check your data and try again.' });
  }
});

// DELETE /api/categories/:id - Delete a category
categoriesRouter.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if category has associated products
    const products = await prisma.product.count({
      where: { categoryId: Number(id) }
    });
    
    if (products > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with associated products. Please re-assign products first.' 
      });
    }
    
    await prisma.category.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting category', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to delete category. The category may have associated products or be in use elsewhere.' });
  }
});

export default categoriesRouter;