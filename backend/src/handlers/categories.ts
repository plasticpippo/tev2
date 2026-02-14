import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Category } from '../types';
import { validateCategory, validateCategoryName } from '../utils/validation';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import i18n from '../i18n';

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
    logError(error instanceof Error ? error : i18n.t('categories.log.fetchError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('categories.fetchFailed') });
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
      return res.status(404).json({ error: i18n.t('categories.notFound') });
    }
    
    res.json(category);
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('categories.log.fetchOneError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('categories.fetchOneFailed') });
  }
});

// POST /api/categories - Create a new category
categoriesRouter.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, visibleTillIds } = req.body as Omit<Category, 'id'>;
    
    // Validate category data
    const validation = validateCategory({ name });
    if (!validation.isValid) {
      return res.status(400).json({ error: i18n.t('categories.validationFailed'), details: validation.errors });
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
    logError(error instanceof Error ? error : i18n.t('categories.log.createError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('categories.createFailed') });
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
        return res.status(400).json({ error: i18n.t('categories.validationFailed'), details: [nameError] });
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
    logError(error instanceof Error ? error : i18n.t('categories.log.updateError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('categories.updateFailed') });
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
        error: i18n.t('categories.cannotDeleteWithProducts')
      });
    }
    
    await prisma.category.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : i18n.t('categories.log.deleteError'), {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('categories.deleteFailedInUse') });
  }
});

export default categoriesRouter;