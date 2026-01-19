import express, { Request, Response } from 'express';
import { prisma } from '../prisma';

export const layoutSharingRouter = express.Router();

// POST /api/:layoutId/copy-to/:targetTillId - Copy a layout to another till
layoutSharingRouter.post('/:layoutId/copy-to/:targetTillId', async (req: Request, res: Response) => {
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

// POST /api/:layoutId/apply-to/:targetTillId - Apply a layout (shared or specific) to another till
layoutSharingRouter.post('/:layoutId/apply-to/:targetTillId', async (req: Request, res: Response) => {
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
layoutSharingRouter.get('/shared', async (req: Request, res: Response) => {
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

export default layoutSharingRouter;