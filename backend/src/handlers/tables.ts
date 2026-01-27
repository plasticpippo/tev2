import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { validateTableData } from '../utils/tableValidation';

const router = Router();

// Middleware to log all table requests
router.use((req, res, next) => {
  console.log(`[Tables API] ${req.method} ${req.path}`, {
    body: req.body,
    params: req.params,
  });
  next();
});

// GET /api/tables - Retrieve all tables with room information
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        room: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// GET /api/tables/:id - Retrieve specific table
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        room: true,
      },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    res.json(table);
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
});

// POST /api/tables - Create new table
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, roomId, x, y, width, height, status, items } = req.body;

    // Validate required fields
    if (!name || !roomId) {
      return res.status(400).json({ error: 'Name and roomId are required' });
    }

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Validate table data
    const validation = validateTableData({ name, roomId, x, y, width, height, status });
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const newTable = await prisma.table.create({
      data: {
        name,
        roomId,
        x: x !== undefined ? parseFloat(x.toString()) : 50,
        y: y !== undefined ? parseFloat(y.toString()) : 50,
        width: width !== undefined ? parseFloat(width.toString()) : 100,
        height: height !== undefined ? parseFloat(height.toString()) : 100,
        status: status || 'available',
        items: items !== undefined ? items : undefined, // Include items if provided
      },
      include: {
        room: true,
      },
    });

    res.status(201).json(newTable);
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

// PUT /api/tables/:id - Update table
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, roomId, x, y, width, height, status, items } = req.body;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if room exists if roomId is being updated
    if (roomId !== undefined) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
    }

    // Validate table data if any field is provided
    const validation = validateTableData({ name, roomId, x, y, width, height, status });
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(roomId !== undefined && { roomId }),
        ...(x !== undefined && { x: parseFloat(x.toString()) }),
        ...(y !== undefined && { y: parseFloat(y.toString()) }),
        ...(width !== undefined && { width: parseFloat(width.toString()) }),
        ...(height !== undefined && { height: parseFloat(height.toString()) }),
        ...(status !== undefined && { status }),
        ...(items !== undefined && { items }), // Include items if provided
      },
      include: {
        room: true,
      },
    });

    res.json(updatedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

// DELETE /api/tables/:id - Delete table
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if table is associated with any tabs
    const tabs = await prisma.tab.findMany({
      where: {
        tableId: id,
      },
    });

    if (tabs.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete table with open tabs. Please close or reassign tabs first.',
        tabCount: tabs.length
      });
    }

    await prisma.table.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

// PUT /api/tables/:id/position - Update only table position (for drag/drop)
router.put('/:id/position', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { x, y } = req.body;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if (x === undefined || y === undefined) {
      return res.status(400).json({ error: 'x and y coordinates are required' });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        x: parseFloat(x.toString()),
        y: parseFloat(y.toString()),
      },
      include: {
        room: true,
      },
    });

    res.json(updatedTable);
  } catch (error) {
    console.error('Error updating table position:', error);
    res.status(500).json({ error: 'Failed to update table position' });
  }
});

export default router;