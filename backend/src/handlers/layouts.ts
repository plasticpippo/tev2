import express, { Request, Response } from 'express';
import { prisma } from '../prisma';

export const layoutsRouter = express.Router();

// ============================================
// TILL-SPECIFIC LAYOUTS (VariantLayout)
// ============================================

// GET /api/layouts/till/:tillId/category/:categoryId
// Get layout for a specific till and category
layoutsRouter.get('/till/:tillId/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const { tillId, categoryId } = req.params;
    
    const layouts = await prisma.variantLayout.findMany({
      where: {
        tillId: Number(tillId),
        categoryId: Number(categoryId)
      },
      orderBy: [
        { gridRow: 'asc' },
        { gridColumn: 'asc' }
      ]
    });
    
    res.json(layouts);
  } catch (error) {
    console.error('Error fetching till layout:', error);
    res.status(500).json({ error: 'Failed to fetch layout. Please try again later.' });
  }
});

// POST /api/layouts/till/:tillId/category/:categoryId
// Save/update layout for a specific till and category
layoutsRouter.post('/till/:tillId/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const { tillId, categoryId } = req.params;
    const { positions } = req.body as {
      positions: Array<{ variantId: number; gridColumn: number; gridRow: number }>
    };
    
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
    
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Use transaction to replace all positions for this till+category
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing layouts for this till+category
      await tx.variantLayout.deleteMany({
        where: {
          tillId: Number(tillId),
          categoryId: Number(categoryId)
        }
      });
      
      // Create new layouts
      const createdLayouts = await Promise.all(
        positions.map(pos =>
          tx.variantLayout.create({
            data: {
              tillId: Number(tillId),
              categoryId: Number(categoryId),
              variantId: pos.variantId,
              gridColumn: pos.gridColumn,
              gridRow: pos.gridRow
            }
          })
        )
      );
      
      return createdLayouts;
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error saving till layout:', error);
    res.status(500).json({ error: 'Failed to save layout. Please check your data and try again.' });
  }
});

// DELETE /api/layouts/till/:tillId/category/:categoryId
// Reset layout for a specific till and category (delete all positions)
layoutsRouter.delete('/till/:tillId/category/:categoryId', async (req: Request, res: Response) => {
  try {
    const { tillId, categoryId } = req.params;
    
    await prisma.variantLayout.deleteMany({
      where: {
        tillId: Number(tillId),
        categoryId: Number(categoryId)
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting till layout:', error);
    res.status(500).json({ error: 'Failed to delete layout. Please try again later.' });
  }
});

// ============================================
// SHARED LAYOUTS
// ============================================

// GET /api/layouts/shared
// Get all shared layouts
layoutsRouter.get('/shared', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;
    
    const whereClause = categoryId ? { categoryId: Number(categoryId) } : {};
    
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
    console.error('Error fetching shared layouts:', error);
    res.status(500).json({ error: 'Failed to fetch shared layouts. Please try again later.' });
  }
});

// GET /api/layouts/shared/:id
// Get a specific shared layout
layoutsRouter.get('/shared/:id', async (req: Request, res: Response) => {
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
    console.error('Error fetching shared layout:', error);
    res.status(500).json({ error: 'Failed to fetch shared layout. Please try again later.' });
  }
});

// POST /api/layouts/shared
// Create a new shared layout
layoutsRouter.post('/shared', async (req: Request, res: Response) => {
  try {
    const { name, categoryId, positions } = req.body as {
      name: string;
      categoryId: number;
      positions: Array<{ variantId: number; gridColumn: number; gridRow: number }>;
    };
    
    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Layout name is required' });
    }
    
    if (!categoryId) {
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
    
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Create shared layout with positions
    const sharedLayout = await prisma.sharedLayout.create({
      data: {
        name: name.trim(),
        categoryId,
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
    console.error('Error creating shared layout:', error);
    res.status(500).json({ error: 'Failed to create shared layout. Please check your data and try again.' });
  }
});

// PUT /api/layouts/shared/:id
// Update an existing shared layout
layoutsRouter.put('/shared/:id', async (req: Request, res: Response) => {
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
      if (name !== undefined) {
        updateData.name = name.trim();
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
    console.error('Error updating shared layout:', error);
    res.status(500).json({ error: 'Failed to update shared layout. Please check your data and try again.' });
  }
});

// DELETE /api/layouts/shared/:id
// Delete a shared layout
layoutsRouter.delete('/shared/:id', async (req: Request, res: Response) => {
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
    console.error('Error deleting shared layout:', error);
    res.status(500).json({ error: 'Failed to delete shared layout. Please try again later.' });
  }
});

// POST /api/layouts/shared/:id/load-to-till/:tillId
// Load a shared layout into a specific till (creates copy as till-specific layout)
layoutsRouter.post('/shared/:id/load-to-till/:tillId', async (req: Request, res: Response) => {
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
    console.error('Error loading shared layout to till:', error);
    res.status(500).json({ error: 'Failed to load shared layout. Please try again later.' });
  }
});

export default layoutsRouter;