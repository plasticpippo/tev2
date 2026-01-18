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
    
    // Include both till-specific and shared layouts
    const whereClause: any = {
      OR: [
        { tillId: parsedTillId },
        { shared: true }
      ]
    };
    
    // If filterType is provided, map it to the appropriate categoryId
    if (filterType) {
      if (filterType === 'all') {
        whereClause.categoryId = 0; // Special "All Products" category
      } else if (filterType === 'favorites') {
        whereClause.categoryId = -1; // Special "Favorites" category
      } else if (filterType === 'category') {
        // If filterType is 'category', we expect a categoryId in the query
        const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : null;
        if (categoryId !== null && !isNaN(categoryId)) {
          whereClause.categoryId = categoryId;
        }
      } else {
        // For other filter types, match them directly if needed
        whereClause.filterType = filterType as string;
      }
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
      finalCategoryId = 0; // Special "All Products" category
    } else if (filterType === 'favorites') {
      finalCategoryId = -1; // Special "Favorites" category
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
layoutRouter.get('/:layoutId', async (req: Request, res: Response) => {
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

// PUT /api/:layoutId - Update an existing layout
layoutRouter.put('/:layoutId', async (req: Request, res: Response) => {
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
      finalCategoryId = 0; // Special "All Products" category
    } else if (filterType === 'favorites') {
      finalCategoryId = -1; // Special "Favorites" category
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
layoutRouter.delete('/:layoutId', async (req: Request, res: Response) => {
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
layoutRouter.put('/:layoutId/set-default', async (req: Request, res: Response) => {
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

// POST /api/:layoutId/copy-to/:targetTillId - Copy a layout to another till
layoutRouter.post('/:layoutId/copy-to/:targetTillId', async (req: Request, res: Response) => {
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
    const { filterType = 'all', categoryId, layoutId } = req.query;
    const parsedTillId = parseInt(tillId, 10);
    
    if (isNaN(parsedTillId)) {
      return res.status(400).json({ error: 'Invalid till ID' });
    }

    // If a specific layoutId is provided, return that layout (if it belongs to the till and matches filter type)
    if (layoutId) {
      const specificLayoutId = parseInt(layoutId as string, 10);
      if (isNaN(specificLayoutId)) {
        return res.status(400).json({ error: 'Invalid layout ID' });
      }
      
      const specificLayout = await prisma.productGridLayout.findUnique({
        where: { id: specificLayoutId }
      });
      
      // Map filterType to categoryId for comparison
      let targetCategoryId: number | null = null;
      if (filterType === 'all') {
        targetCategoryId = 0; // Special "All Products" category
      } else if (filterType === 'favorites') {
        targetCategoryId = -1; // Special "Favorites" category
      } else if (filterType === 'category' && categoryId !== undefined) {
        const categoryIdParam = categoryId ? parseInt(categoryId as string, 10) : null;
        if (categoryIdParam !== null && !isNaN(categoryIdParam)) {
          targetCategoryId = categoryIdParam;
        }
      }
      
      if (specificLayout &&
          specificLayout.tillId === parsedTillId &&
          specificLayout.categoryId === targetCategoryId) {
        return res.json(specificLayout);
      }
    }
    
    // Otherwise, use new default logic based on category
    let targetCategoryId: number | null = null;
    if (filterType === 'all') {
      targetCategoryId = 0; // Special "All Products" category
    } else if (filterType === 'favorites') {
      targetCategoryId = -1; // Special "Favorites" category
    } else if (filterType === 'category') {
      const categoryIdParam = categoryId ? parseInt(categoryId as string, 10) : null;
      if (categoryIdParam !== null && !isNaN(categoryIdParam)) {
        targetCategoryId = categoryIdParam;
      }
    }
    
    // Try to get the default layout for the specific category
    const whereClauseForDefault: any = {
      tillId: parsedTillId,
      isDefault: true,
      categoryId: targetCategoryId
    };
    
    let layout = await prisma.productGridLayout.findFirst({
      where: whereClauseForDefault
    });

    // If no default layout exists for the category, get the first layout for that category
    if (!layout) {
      const whereClauseForFirst: any = {
        tillId: parsedTillId,
        categoryId: targetCategoryId
      };
      
      layout = await prisma.productGridLayout.findFirst({
        where: whereClauseForFirst,
        orderBy: { createdAt: 'asc' }
      });
    }

    // If no layouts exist for the category, return a default/fallback layout
    if (!layout) {
      let parsedCategoryId: number | null = null;
      if (filterType === 'all') {
        parsedCategoryId = 0; // Special "All Products" category
      } else if (filterType === 'favorites') {
        parsedCategoryId = -1; // Special "Favorites" category
      } else if (filterType === 'category' && categoryId !== undefined) {
        const categoryIdParam = categoryId ? parseInt(categoryId as string, 10) : null;
        if (categoryIdParam !== null && !isNaN(categoryIdParam)) {
          parsedCategoryId = categoryIdParam;
        }
      }
      
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
    const { categoryId } = req.query;
    const parsedTillId = parseInt(tillId, 10);
    
    if (isNaN(parsedTillId)) {
      return res.status(400).json({ error: 'Invalid till ID' });
    }

    // Validate filterType
    const validFilterTypes = ['all', 'favorites', 'category'];
    if (!validFilterTypes.includes(filterType)) {
      return res.status(400).json({ error: 'Invalid filter type. Valid types: all, favorites, category' });
    }

    // Determine the categoryId based on filterType
    let targetCategoryId: number | null = null;
    if (filterType === 'all') {
      targetCategoryId = 0; // Special "All Products" category
    } else if (filterType === 'favorites') {
      targetCategoryId = -1; // Special "Favorites" category
    } else if (filterType === 'category') {
      const categoryIdParam = categoryId ? parseInt(categoryId as string, 10) : null;
      if (categoryIdParam !== null && !isNaN(categoryIdParam)) {
        targetCategoryId = categoryIdParam;
      } else {
        // If filter type is category but no categoryId provided, return an error
        return res.status(400).json({ error: 'categoryId is required when filterType is "category"' });
      }
    }

    // Build the where clause based on category ID
    const whereClause: any = { tillId: parsedTillId, categoryId: targetCategoryId };

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
 
 // GET /api/tills/:tillId/current-layout-with-id/:layoutId - Get a specific layout by ID with till context
 layoutRouter.get('/tills/:tillId/current-layout-with-id/:layoutId', async (req: Request, res: Response) => {
   try {
     const { tillId, layoutId } = req.params;
     const parsedTillId = parseInt(tillId, 10);
     const parsedLayoutId = parseInt(layoutId, 10);
     
     if (isNaN(parsedTillId)) {
       return res.status(400).json({ error: 'Invalid till ID' });
     }
     
     if (isNaN(parsedLayoutId)) {
       return res.status(400).json({ error: 'Invalid layout ID' });
     }
 
     const layout = await prisma.productGridLayout.findUnique({
       where: { id: parsedLayoutId }
     });
 
     if (!layout) {
       return res.status(404).json({ error: 'Layout not found' });
     }
 
     // Verify that the layout belongs to the specified till
     if (layout.tillId !== parsedTillId) {
       return res.status(404).json({ error: 'Layout does not belong to the specified till' });
     }
 
     res.json(layout);
   } catch (error) {
     console.error('Error fetching layout by ID with till context:', error);
     res.status(500).json({ error: 'Failed to fetch layout' });
   }
 });

 // POST /api/:layoutId/apply-to/:targetTillId - Apply a layout (shared or specific) to another till
 layoutRouter.post('/:layoutId/apply-to/:targetTillId', async (req: Request, res: Response) => {
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
     const newLayoutName = newName || `${sourceLayout.name} (Applied from ${sourceLayout.shared ? 'shared' : 'till ' + sourceLayout.tillId})`;
     
     // Check if name already exists for this till
     let layoutName = newLayoutName;
     let counter = 1;
     while (await prisma.productGridLayout.findFirst({
       where: { tillId: parsedTargetTillId, name: layoutName }
     })) {
       layoutName = `${newLayoutName} (${counter})`;
       counter++;
     }

     const appliedLayout = await prisma.productGridLayout.create({
       data: {
         tillId: parsedTargetTillId,
         name: layoutName,
         layout: sourceLayout.layout as any, // Type assertion to handle JsonValue
         isDefault: false, // New applied layouts are not defaults by default
         filterType: sourceLayout.filterType,
         categoryId: sourceLayout.categoryId,
         shared: false // Applied layouts become till-specific
       }
     });

     res.status(201).json(appliedLayout);
   } catch (error) {
     console.error('Error applying layout to till:', error);
     res.status(500).json({ error: 'Failed to apply layout to till' });
   }
 });

 // GET /api/grid-layouts/shared - Get all shared layouts
 layoutRouter.get('/shared', async (req: Request, res: Response) => {
   try {
     // Return only layouts that are marked as shared
     const layouts = await prisma.productGridLayout.findMany({
       where: { shared: true },
       orderBy: { createdAt: 'asc' }
     });

     res.json(layouts);
   } catch (error) {
     console.error('Error fetching shared layouts:', error);
     res.status(500).json({ error: 'Failed to fetch shared layouts' });
   }
 });