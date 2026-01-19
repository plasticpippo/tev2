import express, { Request, Response } from 'express';
import { prisma } from '../prisma';

export const layoutFilteringRouter = express.Router();

// GET /api/tills/:tillId/grid-layouts - Get all layouts for a specific till
layoutFilteringRouter.get('/tills/:tillId/grid-layouts', async (req: Request, res: Response) => {
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

// GET /api/tills/:tillId/current-layout - Get the default layout for a till
layoutFilteringRouter.get('/tills/:tillId/current-layout', async (req: Request, res: Response) => {
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
        targetCategoryId = null; // Special "All Products" category - use null
      } else if (filterType === 'favorites') {
        targetCategoryId = null; // Special "Favorites" category - use null
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
      targetCategoryId = null; // Special "All Products" category - use null
    } else if (filterType === 'favorites') {
      targetCategoryId = null; // Special "Favorites" category - use null
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
        parsedCategoryId = null; // Special "All Products" category - use null
      } else if (filterType === 'favorites') {
        parsedCategoryId = null; // Special "Favorites" category - use null
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
layoutFilteringRouter.get('/tills/:tillId/layouts-by-filter/:filterType', async (req: Request, res: Response) => {
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
layoutFilteringRouter.get('/tills/:tillId/current-layout-with-id/:layoutId', async (req: Request, res: Response) => {
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

export default layoutFilteringRouter;