import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { verifyLayoutOwnership } from '../middleware/authorization';
import { writeLimiter } from '../middleware/rateLimiter';
import { sanitizeName, SanitizationError } from '../utils/sanitization';
import { logInfo, logError } from '../utils/logger';

export const layoutsRouter = express.Router();

// ============================================
// TILL-SPECIFIC LAYOUTS (VariantLayout)
// ============================================

// GET /api/layouts/till/:tillId/category/:categoryId
// Get layout for a specific till and category
layoutsRouter.get('/till/:tillId/category/:categoryId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { tillId, categoryId } = req.params;
    
    logInfo(`Fetching layout for tillId: ${tillId}, categoryId: ${categoryId}`, {
      correlationId: (req as any).correlationId,
    });
    
    // Parse categoryId to ensure it's a number
    const parsedCategoryId = Number(categoryId);
    
    const layouts = await prisma.variantLayout.findMany({
      where: {
        tillId: Number(tillId),
        categoryId: parsedCategoryId
      },
      orderBy: [
        { gridRow: 'asc' },
        { gridColumn: 'asc' }
      ]
    });
    
    res.json(layouts);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching till layout', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch layout. Please try again later.' });
  }
});

// POST /api/layouts/till/:tillId/category/:categoryId
// Save/update layout for a specific till and category
layoutsRouter.post('/till/:tillId/category/:categoryId', authenticateToken, writeLimiter, async (req: Request, res: Response) => {
  try {
    const { tillId, categoryId } = req.params;
    const { positions } = req.body as {
      positions: Array<{ variantId: number; gridColumn: number; gridRow: number }>
    };
    
    logInfo(`Saving layout for tillId: ${tillId}, categoryId: ${categoryId}`, {
      correlationId: (req as any).correlationId,
    });
    
    // Validate input
    if (!Array.isArray(positions)) {
      return res.status(400).json({ error: 'Positions must be an array' });
    }
    
    // Validate each position
    for (const pos of positions) {
      if (!pos.variantId || !pos.gridColumn || !pos.gridRow) {
        return res.status(400).json({
          error: 'Each position must have variantId, gridColumn, and gridRow'
        });
      }
      
      if (pos.gridColumn < 1 || pos.gridColumn > 4) {
        return res.status(400).json({
          error: 'gridColumn must be between 1 and 4'
        });
      }
      
      if (pos.gridRow < 1) {
        return res.status(400).json({
          error: 'gridRow must be at least 1'
        });
      }
    }
    
    // Verify till exists
    const till = await prisma.till.findUnique({
      where: { id: Number(tillId) }
    });
    
    if (!till) {
      return res.status(404).json({ error: 'Till not found' });
    }
    
    // Parse categoryId to ensure it's a number
    const parsedCategoryId = Number(categoryId);
    
    // Note: We allow negative category IDs for pseudo-categories like Favourites (ID: -1)
    // Verify category exists only for positive IDs
    if (parsedCategoryId > 0) {
      const category = await prisma.category.findUnique({
        where: { id: parsedCategoryId }
      });
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }
    // If categoryId is -1, it's the Favourites pseudo-category - allow it
    
    // Use transaction to replace all positions for this till+category
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing layouts for this till+category
      await tx.variantLayout.deleteMany({
        where: {
          tillId: Number(tillId),
          categoryId: parsedCategoryId
        }
      });
      
      // Create new layouts
      const createdLayouts = await Promise.all(
        positions.map(pos =>
          tx.variantLayout.create({
            data: {
              tillId: Number(tillId),
              categoryId: parsedCategoryId,
              variantId: pos.variantId,
              gridColumn: pos.gridColumn,
              gridRow: pos.gridRow,
              ownerId: req.user?.id // Set ownerId from authenticated user
            }
          })
        )
      );
      
      return createdLayouts;
    });
    
    res.status(201).json(result);
  } catch (error) {
    logError('Error saving till layout', {
      error,
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to save layout. Please check your data and try again.' });
  }
});

// DELETE /api/layouts/till/:tillId/category/:categoryId
// Reset layout for a specific till and category (delete all positions)
layoutsRouter.delete('/till/:tillId/category/:categoryId', authenticateToken, writeLimiter, async (req: Request, res: Response) => {
  try {
    const { tillId, categoryId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    logInfo(`Deleting layout for tillId: ${tillId}, categoryId: ${categoryId}`, {
      correlationId: (req as any).correlationId,
    });
    
    // Parse categoryId to ensure it's a number
    const parsedCategoryId = Number(categoryId);
    const parsedTillId = Number(tillId);
    
    // Check ownership: find one layout to verify ownership
    const existingLayout = await prisma.variantLayout.findFirst({
      where: {
        tillId: parsedTillId,
        categoryId: parsedCategoryId
      }
    }) as { ownerId: number | null } | null;
    
    // If layouts exist, verify ownership
    if (existingLayout) {
      const isOwner = existingLayout.ownerId !== null && existingLayout.ownerId === userId;
      const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';
      
      if (!isOwner && !isAdmin && existingLayout.ownerId !== null) {
        return res.status(403).json({ error: 'Access denied. You do not own this layout.' });
      }
    }
    
    // Note: We allow negative category IDs for pseudo-categories like Favourites (ID: -1)
    await prisma.variantLayout.deleteMany({
      where: {
        tillId: parsedTillId,
        categoryId: parsedCategoryId
      }
    });
    
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting till layout', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to delete layout. Please try again later.' });
  }
});

// ============================================
// SHARED LAYOUTS
// ============================================

// GET /api/layouts/shared
// Get all shared layouts
layoutsRouter.get('/shared', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;
    
    let whereClause = {};
    if (categoryId) {
      const parsedCategoryId = Number(categoryId);
      whereClause = { categoryId: parsedCategoryId };
    }
    
    const sharedLayouts = await prisma.sharedLayout.findMany({
      where: whereClause,
      include: {
        positions: {
          orderBy: [
            { gridRow: 'asc' },
            { gridColumn: 'asc' }
          ]
        },
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(sharedLayouts);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching shared layouts', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch shared layouts. Please try again later.' });
  }
});

// GET /api/layouts/shared/:id
// Get a specific shared layout
layoutsRouter.get('/shared/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const sharedLayout = await prisma.sharedLayout.findUnique({
      where: { id: Number(id) },
      include: {
        positions: {
          orderBy: [
            { gridRow: 'asc' },
            { gridColumn: 'asc' }
          ]
        },
        category: true
      }
    });
    
    if (!sharedLayout) {
      return res.status(404).json({ error: 'Shared layout not found' });
    }
    
    res.json(sharedLayout);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching shared layout', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch shared layout. Please try again later.' });
  }
});

// POST /api/layouts/shared
// Create a new shared layout
layoutsRouter.post('/shared', authenticateToken, writeLimiter, async (req: Request, res: Response) => {
  try {
    const { name, categoryId, positions } = req.body as {
      name: string;
      categoryId: number;
      positions: Array<{ variantId: number; gridColumn: number; gridRow: number }>;
    };
    
    logInfo('Creating shared layout for category', {
      categoryId,
      correlationId: (req as any).correlationId,
    });
    
    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Layout name is required' });
    }

    // Sanitize name
    let sanitizedName: string;
    try {
      sanitizedName = sanitizeName(name);
    } catch (error) {
      if (error instanceof SanitizationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }

    if (categoryId === undefined || categoryId === null) {
      return res.status(400).json({ error: 'Category ID is required' });
    }
    
    if (!Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({ error: 'Positions array is required and must not be empty' });
    }
    
    // Validate each position
    for (const pos of positions) {
      if (!pos.variantId || !pos.gridColumn || !pos.gridRow) {
        return res.status(400).json({
          error: 'Each position must have variantId, gridColumn, and gridRow'
        });
      }
      
      if (pos.gridColumn < 1 || pos.gridColumn > 4) {
        return res.status(400).json({
          error: 'gridColumn must be between 1 and 4'
        });
      }
      
      if (pos.gridRow < 1) {
        return res.status(400).json({
          error: 'gridRow must be at least 1'
        });
      }
    }
    
    // Note: For shared layouts, we allow negative category IDs for pseudo-categories like Favourites (ID: -1)
    // Verify category exists only for positive IDs
    if (categoryId > 0) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      });
      
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }
    
    // Create shared layout with positions
    const sharedLayout = await prisma.sharedLayout.create({
      data: {
        name: sanitizedName,
        categoryId,
        ownerId: req.user?.id, // Set ownerId from authenticated user
        positions: {
          create: positions.map(pos => ({
            variantId: pos.variantId,
            gridColumn: pos.gridColumn,
            gridRow: pos.gridRow
          }))
        }
      },
      include: {
        positions: true,
        category: true
      }
    });
    
    res.status(201).json(sharedLayout);
  } catch (error) {
    logError('Error creating shared layout', {
      error,
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to create shared layout. Please check your data and try again.' });
  }
});

// PUT /api/layouts/shared/:id
// Update an existing shared layout
layoutsRouter.put('/shared/:id', authenticateToken, verifyLayoutOwnership, writeLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, positions } = req.body as {
      name?: string;
      positions?: Array<{ variantId: number; gridColumn: number; gridRow: number }>;
    };
    
    // Check if shared layout exists
    const existing = await prisma.sharedLayout.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Shared layout not found' });
    }
    
    // Validate name if provided
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'Layout name cannot be empty' });
    }

    // Sanitize name if provided
    let sanitizedName: string | undefined;
    if (name !== undefined) {
      try {
        sanitizedName = sanitizeName(name);
      } catch (error) {
        if (error instanceof SanitizationError) {
          res.status(400).json({ error: error.message });
          return;
        }
        throw error;
      }
    }

    // Validate positions if provided
    if (positions !== undefined) {
      if (!Array.isArray(positions) || positions.length === 0) {
        return res.status(400).json({ error: 'Positions must be a non-empty array' });
      }
      
      for (const pos of positions) {
        if (!pos.variantId || !pos.gridColumn || !pos.gridRow) {
          return res.status(400).json({
            error: 'Each position must have variantId, gridColumn, and gridRow'
          });
        }
        
        if (pos.gridColumn < 1 || pos.gridColumn > 4) {
          return res.status(400).json({
            error: 'gridColumn must be between 1 and 4'
          });
        }
        
        if (pos.gridRow < 1) {
          return res.status(400).json({
            error: 'gridRow must be at least 1'
          });
        }
      }
    }
    
    // Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update name if provided
      const updateData: any = {};
      if (sanitizedName !== undefined) {
        updateData.name = sanitizedName;
      }
      
      let result = await tx.sharedLayout.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          positions: true,
          category: true
        }
      });
      
      // Update positions if provided
      if (positions !== undefined) {
        // Delete existing positions
        await tx.sharedLayoutPosition.deleteMany({
          where: { sharedLayoutId: Number(id) }
        });
        
        // Create new positions
        await tx.sharedLayoutPosition.createMany({
          data: positions.map(pos => ({
            sharedLayoutId: Number(id),
            variantId: pos.variantId,
            gridColumn: pos.gridColumn,
            gridRow: pos.gridRow
          }))
        });
        
        // Fetch updated result with new positions
        result = await tx.sharedLayout.findUnique({
          where: { id: Number(id) },
          include: {
            positions: true,
            category: true
          }
        }) as any;
      }
      
      return result;
    });
    
    res.json(updated);
  } catch (error) {
    logError('Error updating shared layout', {
      error,
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to update shared layout. Please check your data and try again.' });
  }
});

// DELETE /api/layouts/shared/:id
// Delete a shared layout
layoutsRouter.delete('/shared/:id', authenticateToken, verifyLayoutOwnership, writeLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if exists
    const existing = await prisma.sharedLayout.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Shared layout not found' });
    }
    
    // Delete (positions will cascade delete)
    await prisma.sharedLayout.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    logError('Error deleting shared layout', {
      error,
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to delete shared layout. Please try again later.' });
  }
});

// POST /api/layouts/shared/:id/load-to-till/:tillId
// Load a shared layout into a specific till (creates copy as till-specific layout)
layoutsRouter.post('/shared/:id/load-to-till/:tillId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, tillId } = req.params;
    
    // Fetch shared layout with positions
    const sharedLayout = await prisma.sharedLayout.findUnique({
      where: { id: Number(id) },
      include: { positions: true }
    });
    
    if (!sharedLayout) {
      return res.status(404).json({ error: 'Shared layout not found' });
    }
    
    // Verify till exists
    const till = await prisma.till.findUnique({
      where: { id: Number(tillId) }
    });
    
    if (!till) {
      return res.status(404).json({ error: 'Till not found' });
    }
    
    // Copy shared layout positions to till-specific layout
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing layouts for this till+category
      await tx.variantLayout.deleteMany({
        where: {
          tillId: Number(tillId),
          categoryId: sharedLayout.categoryId
        }
      });
      
      // Create new layouts from shared layout positions
      const createdLayouts = await Promise.all(
        sharedLayout.positions.map(pos =>
          tx.variantLayout.create({
            data: {
              tillId: Number(tillId),
              categoryId: sharedLayout.categoryId,
              variantId: pos.variantId,
              gridColumn: pos.gridColumn,
              gridRow: pos.gridRow
            }
          })
        )
      );
      
      return createdLayouts;
    });
    
    res.status(201).json({
      message: 'Shared layout loaded successfully',
      layouts: result
    });
  } catch (error) {
    logError('Error loading shared layout to till', {
      error,
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to load shared layout. Please try again later.' });
  }
});

export default layoutsRouter;