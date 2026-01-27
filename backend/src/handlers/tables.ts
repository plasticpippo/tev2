import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

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
    const { name, capacity, roomId, positionX, positionY, status, width, height } = req.body;

    // Validate required fields
    if (!name || roomId === undefined) {
      return res.status(400).json({ error: 'Name and roomId are required' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const newTable = await prisma.table.create({
      data: {
        name,
        roomId,
        x: positionX || 0,
        y: positionY || 0,
        width: width || 100,
        height: height || 100,
        status: status || 'available',
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
    const { name, capacity, roomId, positionX, positionY, status, width, height } = req.body;

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

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(roomId !== undefined && { roomId }),
        ...(positionX !== undefined && { x: parseFloat(positionX) }),
        ...(positionY !== undefined && { y: parseFloat(positionY) }),
        ...(width !== undefined && { width: parseFloat(width) }),
        ...(height !== undefined && { height: parseFloat(height) }),
        ...(status !== undefined && { status }),
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
      return res.status(400).json({ error: 'Cannot delete table with open tabs' });
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
    const { positionX, positionY, x, y } = req.body;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if ((positionX === undefined && x === undefined) || (positionY === undefined && y === undefined)) {
      return res.status(400).json({ error: 'Either positionX/positionY or x/y coordinates are required' });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        x: parseFloat(positionX ?? x),
        y: parseFloat(positionY ?? y),
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