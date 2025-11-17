import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { ProductGridLayout } from '@prisma/client';

export const layoutRouter = express.Router();

// GET /api/tills/:tillId/grid-layouts - Get all layouts for a specific till
layoutRouter.get('/tills/:tillId/grid-layouts', async (req: Request, res: Response) => {
  try {
    const { tillId } = req.params;
    const parsedTillId = parseInt(tillId, 10);
    
    if (isNaN(parsedTillId)) {
      return res.status(400).json({ error: 'Invalid till ID' });
    }

    const { filterType } = req.query;
    
    const whereClause: any = { tillId: parsedTillId };
    if (filterType) {
      whereClause.filterType = filterType as string;
    }
    
    const layouts = await prisma.productGridLayout.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    res.json(layouts);
  } catch (error) {
    console.error('Error fetching layouts:', error);
    res.status(500).json({ error: 'Failed to fetch layouts' });
  }
});

// POST /api/tills/:tillId/grid-layouts - Create a new layout for a till
layoutRouter.post('/tills/:tillId/grid-layouts', async (req: Request, res: Response) => {
  try {
    const { tillId } = req.params;
    const { name, layout, isDefault, filterType, categoryId } = req.body;
    
    const parsedTillId = parseInt(tillId, 10);
    if (isNaN(parsedTillId)) {
      return res.status(400).json({ error: 'Invalid till ID' });
    }

    // If setting as default, unset other defaults for this till and filter type
    if (isDefault) {
      const whereClause: any = { tillId: parsedTillId, isDefault: true };
      if (filterType) {
        whereClause.filterType = filterType;
      }
      
      await prisma.productGridLayout.updateMany({
        where: whereClause,
        data: { isDefault: false }
      });
    } else {
      // If no default layout exists for this till and filter type, make this one the default
      const whereClause: any = { tillId: parsedTillId };
      if (filterType) {
        whereClause.filterType = filterType;
      }
      
      const existingLayouts = await prisma.productGridLayout.findMany({
        where: whereClause
      });
      
      if (existingLayouts.length === 0) {
        // This is the first layout for this filter type, make it default
        req.body.isDefault = true;
      }
    }

    const newLayout = await prisma.productGridLayout.create({
      data: {
        tillId: parsedTillId,
        name,
        layout,
        isDefault: req.body.isDefault || isDefault || false,
        filterType: filterType || 'all',
        categoryId: categoryId || null
      } as any // Type assertion to handle filterType and categoryId
    });

    res.status(201).json(newLayout);
  } catch (error) {
    console.error('Error creating layout:', error);
    res.status(500).json({ error: 'Failed to create layout' });
  }
});

// GET /api/grid-layouts/:layoutId - Get a specific layout
layoutRouter.get('/grid-layouts/:layoutId', async (req: Request, res: Response) => {
  try {
    const { layoutId } = req.params;
    const parsedLayoutId = parseInt(layoutId, 10);
    
    if (isNaN(parsedLayoutId)) {
      return res.status(400).json({ error: 'Invalid layout ID' });
    }

    const layout = await prisma.productGridLayout.findUnique({
      where: { id: parsedLayoutId }
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    res.json(layout);
 } catch (error) {
    console.error('Error fetching layout:', error);
    res.status(50).json({ error: 'Failed to fetch layout' });
  }
});

// PUT /api/grid-layouts/:layoutId - Update an existing layout
layoutRouter.put('/grid-layouts/:layoutId', async (req: Request, res: Response) => {
  try {
    const { layoutId } = req.params;
    const { name, layout, isDefault, filterType, categoryId } = req.body;
    
    const parsedLayoutId = parseInt(layoutId, 10);
    if (isNaN(parsedLayoutId)) {
      return res.status(400).json({ error: 'Invalid layout ID' });
    }

    // If setting as default, unset other defaults for the same till and filter type
    if (isDefault) {
      const targetLayout = await prisma.productGridLayout.findUnique({
        where: { id: parsedLayoutId }
      });
      
      if (targetLayout) {
        const whereClause: any = {
          tillId: targetLayout.tillId,
          isDefault: true
        };
        
        // Only unset defaults for the same filter type if specified
        if (filterType) {
          whereClause.filterType = filterType;
        }
        
        await prisma.productGridLayout.updateMany({
          where: whereClause,
          data: { isDefault: false }
        });
      }
    }

    // Update the layout with all fields
    const existingLayout = await prisma.productGridLayout.findUnique({
      where: { id: parsedLayoutId }
    });

    if (!existingLayout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Prepare update data with proper type assertion
    const updateData: any = {
      name,
      layout,
      isDefault,
      updatedAt: new Date()
    };

    // Only add filterType and categoryId to update if they are provided in the request
    if (filterType !== undefined) {
      updateData.filterType = filterType;
    }
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId;
    }

    const updatedLayout = await prisma.productGridLayout.update({
      where: { id: parsedLayoutId },
      data: updateData
    });

    res.json(updatedLayout);
 } catch (error) {
    console.error('Error updating layout:', error);
    res.status(500).json({ error: 'Failed to update layout' });
  }
});

// DELETE /api/grid-layouts/:layoutId - Delete a layout
layoutRouter.delete('/grid-layouts/:layoutId', async (req: Request, res: Response) => {
  try {
    const { layoutId } = req.params;
    const parsedLayoutId = parseInt(layoutId, 10);
    
    if (isNaN(parsedLayoutId)) {
      return res.status(400).json({ error: 'Invalid layout ID' });
    }

    const layout = await prisma.productGridLayout.findUnique({
      where: { id: parsedLayoutId }
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Prevent deletion of default layout if it's the only one for the till
    if (layout.isDefault) {
      const otherLayouts = await prisma.productGridLayout.findMany({
        where: { 
          tillId: layout.tillId,
          id: { not: parsedLayoutId }
        }
      });
      
      if (otherLayouts.length === 0) {
        return res.status(400).json({ error: 'Cannot delete the only layout for a till' });
      }
    }

    await prisma.productGridLayout.delete({
      where: { id: parsedLayoutId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting layout:', error);
    res.status(50).json({ error: 'Failed to delete layout' });
  }
});

// PUT /api/grid-layouts/:layoutId/set-default - Set a layout as default for its till
layoutRouter.put('/grid-layouts/:layoutId/set-default', async (req: Request, res: Response) => {
  try {
    const { layoutId } = req.params;
    const parsedLayoutId = parseInt(layoutId, 10);
    
    if (isNaN(parsedLayoutId)) {
      return res.status(400).json({ error: 'Invalid layout ID' });
    }

    const layout = await prisma.productGridLayout.findUnique({
      where: { id: parsedLayoutId }
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Unset all other defaults for this till
    await prisma.productGridLayout.updateMany({
      where: { tillId: layout.tillId, isDefault: true },
      data: { isDefault: false }
    });

    // Set this layout as default
    const updatedLayout = await prisma.productGridLayout.update({
      where: { id: parsedLayoutId },
      data: { isDefault: true }
    });

    res.json(updatedLayout);
  } catch (error) {
    console.error('Error setting default layout:', error);
    res.status(500).json({ error: 'Failed to set default layout' });
  }
});

// POST /api/grid-layouts/:layoutId/copy-to/:targetTillId - Copy a layout to another till
layoutRouter.post('/grid-layouts/:layoutId/copy-to/:targetTillId', async (req: Request, res: Response) => {
  try {
    const { layoutId, targetTillId } = req.params;
    const { name: newName } = req.body;
    
    const parsedLayoutId = parseInt(layoutId, 10);
    const parsedTargetTillId = parseInt(targetTillId, 10);
    
    if (isNaN(parsedLayoutId) || isNaN(parsedTargetTillId)) {
      return res.status(400).json({ error: 'Invalid layout ID or target till ID' });
    }

    // Get the source layout
    const sourceLayout = await prisma.productGridLayout.findUnique({
      where: { id: parsedLayoutId }
    });

    if (!sourceLayout) {
      return res.status(404).json({ error: 'Source layout not found' });
    }

    // Check if target till exists
    const targetTill = await prisma.till.findUnique({
      where: { id: parsedTargetTillId }
    });

    if (!targetTill) {
      return res.status(404).json({ error: 'Target till not found' });
    }

    // Create the new layout with copied data
    const newLayoutName = newName || `Copy of ${sourceLayout.name}`;
    
    // Check if name already exists for this till
    let layoutName = newLayoutName;
    let counter = 1;
    while (await prisma.productGridLayout.findFirst({
      where: { tillId: parsedTargetTillId, name: layoutName }
    })) {
      layoutName = `${newLayoutName} (${counter})`;
      counter++;
    }

    const copiedLayout = await prisma.productGridLayout.create({
      data: {
        tillId: parsedTargetTillId,
        name: layoutName,
        layout: sourceLayout.layout as any, // Type assertion to handle JsonValue
        isDefault: false // New copied layouts are not defaults
      }
    });

    res.status(201).json(copiedLayout);
 } catch (error) {
    console.error('Error copying layout:', error);
    res.status(500).json({ error: 'Failed to copy layout' });
  }
});

// GET /api/tills/:tillId/current-layout - Get the default layout for a till
layoutRouter.get('/tills/:tillId/current-layout', async (req: Request, res: Response) => {
  try {
    const { tillId } = req.params;
    const { filterType = 'all' } = req.query;
    const parsedTillId = parseInt(tillId, 10);
    
    if (isNaN(parsedTillId)) {
      return res.status(400).json({ error: 'Invalid till ID' });
    }

    // First try to get the default layout for the specific filter type
    // If filterType is 'category', also filter by categoryId if provided
    const filterTypeStr = req.query.filterType as string || 'all';
    const categoryIdParam = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : null;
    
    let whereClauseForDefault: any = {
      tillId: parsedTillId,
      isDefault: true,
      filterType: filterTypeStr
    };
    
    // If filtering by category, also filter by categoryId
    if (filterTypeStr === 'category' && categoryIdParam !== null && !isNaN(categoryIdParam)) {
      whereClauseForDefault.categoryId = categoryIdParam;
    }
    
    let layout = await prisma.productGridLayout.findFirst({
      where: whereClauseForDefault
    });

    // If no default layout exists for the filter type, get the first layout for that filter type
    if (!layout) {
      let whereClauseForFirst: any = {
        tillId: parsedTillId,
        filterType: filterTypeStr
      };
      
      // If filtering by category, also filter by categoryId
      if (filterTypeStr === 'category' && categoryIdParam !== null && !isNaN(categoryIdParam)) {
        whereClauseForFirst.categoryId = categoryIdParam;
      }
      
      layout = await prisma.productGridLayout.findFirst({
        where: whereClauseForFirst,
        orderBy: { createdAt: 'asc' }
      });
    }

    // If no layouts exist for the filter type, return a default/fallback layout
    if (!layout) {
      const categoryIdParam = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : null;
      const parsedCategoryId = (categoryIdParam !== null && !isNaN(categoryIdParam)) ? categoryIdParam : null;
      
      res.json({
        id: null,
        tillId: parsedTillId,
        name: `Default ${filterType} Layout`,
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: true,
        filterType: filterType as string || 'all',
        categoryId: parsedCategoryId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return;
    }

    res.json(layout);
 } catch (error) {
    console.error('Error fetching current layout:', error);
    res.status(500).json({ error: 'Failed to fetch current layout' });
  }
});

// GET /api/tills/:tillId/layouts-by-filter/:filterType - Get layouts for a specific filter type
layoutRouter.get('/tills/:tillId/layouts-by-filter/:filterType', async (req: Request, res: Response) => {
  try {
    const { tillId, filterType } = req.params;
    const parsedTillId = parseInt(tillId, 10);
    
    if (isNaN(parsedTillId)) {
      return res.status(400).json({ error: 'Invalid till ID' });
    }

    // Validate filterType
    const validFilterTypes = ['all', 'favorites', 'category'];
    if (!validFilterTypes.includes(filterType)) {
      return res.status(400).json({ error: 'Invalid filter type. Valid types: all, favorites, category' });
    }

    // Build the where clause based on filter type
    const whereClause: any = { tillId: parsedTillId, filterType: filterType };
    
    // If the filterType is 'category', we might also want to filter by categoryId if provided
    // For now, just filter by filterType
    const layouts = await prisma.productGridLayout.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' }
    });

    res.json(layouts);
  } catch (error) {
     console.error('Error fetching layouts by filter type:', error);
     res.status(500).json({ error: 'Failed to fetch layouts by filter type' });
   }
});