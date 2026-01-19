import express, { Request, Response } from 'express';
import { prisma } from '../prisma';

export const layoutCrudRouter = express.Router();

// POST /api/tills/:tillId/grid-layouts - Create a new layout for a till
layoutCrudRouter.post('/tills/:tillId/grid-layouts', async (req: Request, res: Response) => {
  try {
    const { tillId } = req.params;
    const { name, layout, isDefault, filterType, categoryId: providedCategoryId, shared } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Layout name is required' });
    }
    
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Layout name must be a non-empty string' });
    }
    
    if (!layout) {
      return res.status(400).json({ error: 'Layout structure is required' });
    }
    
    if (typeof layout !== 'object') {
      return res.status(400).json({ error: 'Layout must be an object' });
    }
    
    // Validate filterType if provided
    if (filterType && !['all', 'favorites', 'category'].includes(filterType)) {
      return res.status(400).json({ error: 'Invalid filterType. Must be one of: all, favorites, category' });
    }
    
    // Validate isDefault if provided
    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
      return res.status(400).json({ error: 'isDefault must be a boolean' });
    }
    
    // Validate shared if provided
    if (shared !== undefined && typeof shared !== 'boolean') {
      return res.status(400).json({ error: 'shared must be a boolean' });
    }
    
    // Parse tillId if it's not creating a shared layout
    let parsedTillId: number | null = null;
    if (!shared) {
      parsedTillId = parseInt(tillId, 10);
      if (isNaN(parsedTillId)) {
        return res.status(400).json({ error: 'Invalid till ID' });
      }
      
      // Check if the till exists
      const tillExists = await prisma.till.findUnique({
        where: { id: parsedTillId }
      });
      
      if (!tillExists) {
        return res.status(404).json({ error: `Till with ID ${parsedTillId} does not exist` });
      }
    }

    // Determine the categoryId based on filterType for backward compatibility and new approach
    let finalCategoryId: number | null = providedCategoryId || null;
    if (filterType === 'all') {
      finalCategoryId = null; // Special "All Products" category - use null
    } else if (filterType === 'favorites') {
      finalCategoryId = null; // Special "Favorites" category - use null
    } else if (filterType === 'category' && providedCategoryId !== undefined && providedCategoryId !== null) {
      // Validate that the category exists
      const categoryExists = await prisma.category.findUnique({
        where: { id: providedCategoryId }
      });
      
      if (!categoryExists) {
        return res.status(404).json({ error: `Category with ID ${providedCategoryId} does not exist` });
      }
      
      finalCategoryId = providedCategoryId;
    }

    // If setting as default, unset other defaults for this till and filter type
    if (isDefault && !shared) {
      const whereClause: any = {
        OR: [
          { tillId: parsedTillId },
          { shared: true }
        ],
        isDefault: true,
        categoryId: finalCategoryId // Use categoryId instead of filterType for the default logic
      };
      
      await prisma.productGridLayout.updateMany({
        where: whereClause,
        data: { isDefault: false }
      });
    }

    // Prepare the data object with proper typing
    const createData: any = {
      name: name.trim(), // Trim whitespace from name
      layout,
      isDefault: isDefault || false,
      filterType: filterType || 'all',
      categoryId: finalCategoryId,
      shared: shared || false
    };

    // Only add tillId if not creating a shared layout
    if (!shared) {
      createData.tillId = parsedTillId;
    } else {
      createData.tillId = null;
    }

    const newLayout = await prisma.productGridLayout.create({
      data: createData
    });

    res.status(201).json(newLayout);
  } catch (error: any) {
    console.error('Error creating layout:', error);
    // Provide more specific error information for debugging
    if (error.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json({ error: 'A layout with this name already exists', details: error.meta?.target });
    } else {
      res.status(500).json({ error: 'Failed to create layout', details: error.message || 'Unknown error' });
    }
  }
});

// GET /api/:layoutId - Get a specific layout
layoutCrudRouter.get('/:layoutId', async (req: Request, res: Response) => {
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
     res.status(500).json({ error: 'Failed to fetch layout' });
   }
});

// PUT /api/:layoutId - Update an existing layout
layoutCrudRouter.put('/:layoutId', async (req: Request, res: Response) => {
  try {
    const { layoutId } = req.params;
    const { name, layout, isDefault, filterType, categoryId: providedCategoryId, shared } = req.body;
    
    const parsedLayoutId = parseInt(layoutId, 10);
    if (isNaN(parsedLayoutId)) {
      return res.status(400).json({ error: 'Invalid layout ID' });
    }

    // Update the layout with all fields
    const existingLayout = await prisma.productGridLayout.findUnique({
      where: { id: parsedLayoutId }
    });

    if (!existingLayout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Validate filterType if provided
    if (filterType && !['all', 'favorites', 'category'].includes(filterType)) {
      return res.status(400).json({ error: 'Invalid filterType. Must be one of: all, favorites, category' });
    }
    
    // Validate isDefault if provided
    if (isDefault !== undefined && typeof isDefault !== 'boolean') {
      return res.status(400).json({ error: 'isDefault must be a boolean' });
    }
    
    // Validate shared if provided
    if (shared !== undefined && typeof shared !== 'boolean') {
      return res.status(400).json({ error: 'shared must be a boolean' });
    }

    // Determine the categoryId based on filterType for backward compatibility and new approach
    let finalCategoryId: number | null = providedCategoryId !== undefined ? providedCategoryId : existingLayout.categoryId;
    if (filterType === 'all') {
      finalCategoryId = null; // Special "All Products" category - use null
    } else if (filterType === 'favorites') {
      finalCategoryId = null; // Special "Favorites" category - use null
    } else if (filterType === 'category' && providedCategoryId !== undefined) {
      // Validate that the category exists
      const categoryExists = await prisma.category.findUnique({
        where: { id: providedCategoryId }
      });
      
      if (!categoryExists) {
        return res.status(404).json({ error: `Category with ID ${providedCategoryId} does not exist` });
      }
      
      finalCategoryId = providedCategoryId;
    }

    // If setting as default, unset other defaults for the same context (till or shared) and category
    if (isDefault) {
      const whereClause: any = {
        isDefault: true,
        categoryId: finalCategoryId
      };
      
      // For shared layouts, match shared=true, for till-specific layouts, match the tillId
      if (existingLayout.shared) {
        whereClause.shared = true;
      } else {
        whereClause.tillId = existingLayout.tillId;
      }
      
      await prisma.productGridLayout.updateMany({
        where: whereClause,
        data: { isDefault: false }
      });
    }

    // Prepare update data with proper type assertion
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update fields that are provided in the request
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Layout name must be a non-empty string' });
      }
      updateData.name = name.trim();
    }
    if (layout !== undefined) {
      if (typeof layout !== 'object') {
        return res.status(400).json({ error: 'Layout must be an object' });
      }
      updateData.layout = layout;
    }
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;
    }

    // Only add filterType, categoryId, and shared to update if they are provided in the request
    if (filterType !== undefined) {
      updateData.filterType = filterType;
    }
    if (providedCategoryId !== undefined) {
      updateData.categoryId = finalCategoryId;
    }
    if (shared !== undefined) {
      updateData.shared = shared;
    }

    const updatedLayout = await prisma.productGridLayout.update({
      where: { id: parsedLayoutId },
      data: updateData
    });

    res.json(updatedLayout);
  } catch (error: any) {
    console.error('Error updating layout:', error);
    // Provide more specific error information for debugging
    if (error.code === 'P2002') {
      // Unique constraint violation
      res.status(409).json({ error: 'A layout with this name already exists', details: error.meta?.target });
    } else {
      res.status(500).json({ error: 'Failed to update layout', details: error.message || 'Unknown error' });
    }
  }
});

// DELETE /api/grid-layouts/:layoutId - Delete a layout
layoutCrudRouter.delete('/:layoutId', async (req: Request, res: Response) => {
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

    // Enhanced check: prevent deletion of default layout if it's the only one for the same context (till or shared) and category
    if (layout.isDefault) {
      // Count total layouts (both default and non-default) for this context and category
      const totalLayoutsCount = await prisma.productGridLayout.count({
        where: {
          AND: [
            { categoryId: layout.categoryId },
            layout.shared
              ? { shared: true }
              : { tillId: layout.tillId }
          ]
        }
      });
      
      // If there's only one layout in total for this context and category, prevent deletion
      if (totalLayoutsCount <= 1) {
        return res.status(400).json({
          error: `Cannot delete the only layout for this ${layout.categoryId === 0 ? 'All Products' : layout.categoryId === -1 ? 'Favorites' : 'Category'} filter in this ${layout.shared ? 'shared' : 'till-specific'} context`
        });
      }
    }

    await prisma.productGridLayout.delete({
      where: { id: parsedLayoutId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting layout:', error);
    res.status(500).json({ error: 'Failed to delete layout', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// PUT /api/:layoutId/set-default - Set a layout as default for its till
layoutCrudRouter.put('/:layoutId/set-default', async (req: Request, res: Response) => {
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

    // Get the category ID of the layout being set as default
    const targetCategoryId = layout.categoryId;
    
    // Unset other defaults for the same context (till or shared) and category
    const whereClause: any = {
      isDefault: true,
      categoryId: targetCategoryId
    };
    
    // For shared layouts, match shared=true, for till-specific layouts, match the tillId
    if (layout.shared) {
      whereClause.shared = true;
    } else {
      whereClause.tillId = layout.tillId;
    }
    
    await prisma.productGridLayout.updateMany({
      where: whereClause,
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

export default layoutCrudRouter;
