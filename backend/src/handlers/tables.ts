import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { verifyTableOwnership } from '../middleware/authorization';
import { validateTableData, validateTableStatusUpdate } from '../utils/tableValidation';
import { sanitizeName, SanitizationError } from '../utils/sanitization';
import { logInfo, logError, redactSensitiveData } from '../utils/logger';
import i18n from '../i18n';

const router = Router();

// Middleware to log all table requests with minimal information
router.use((req, res, next) => {
  logInfo(`[Tables API] ${req.method} ${req.path}`, {
    correlationId: (req as any).correlationId,
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
    logError(error instanceof Error ? error : 'Error fetching tables', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:tables.fetchFailed') });
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
      return res.status(404).json({ error: i18n.t('errors:tables.notFound') });
    }

    res.json(table);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching table', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:tables.fetchOneFailed') });
  }
});

// POST /api/tables - Create new table
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, roomId, x, y, width, height, status, capacity, items } = req.body;

    // Validate required fields
    if (!name || !roomId) {
      return res.status(400).json({ error: i18n.t('errors:tables.nameAndRoomRequired') });
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

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: i18n.t('errors:tables.roomNotFound') });
    }

    // Validate table data
    const validation = validateTableData({ name, roomId, x, y, width, height, status, capacity });
    if (!validation.isValid) {
      return res.status(400).json({
        error: i18n.t('errors:tables.validationFailed'),
        details: validation.errors
      });
    }

    const newTable = await prisma.table.create({
      data: {
        name: sanitizedName,
        roomId,
        x: x !== undefined ? parseFloat(x.toString()) : 50,
        y: y !== undefined ? parseFloat(y.toString()) : 50,
        width: width !== undefined ? parseFloat(width.toString()) : 100,
        height: height !== undefined ? parseFloat(height.toString()) : 100,
        status: status || 'available',
        capacity: capacity !== undefined ? parseInt(capacity.toString(), 10) : undefined,
        items: items !== undefined ? items : undefined, // Include items if provided
        ownerId: req.user?.id, // Set ownerId from authenticated user
      },
      include: {
        room: true,
      },
    });

    res.status(201).json(newTable);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating table', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:tables.createFailed') });
  }
});

// PUT /api/tables/:id - Update table
router.put('/:id', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, roomId, x, y, width, height, status, capacity, items } = req.body;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: i18n.t('errors:tables.notFound') });
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

    // Check if room exists if roomId is being updated
    if (roomId !== undefined) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        return res.status(404).json({ error: i18n.t('errors:tables.roomNotFound') });
      }
    }

    // Validate table data if any field is provided
    const validation = validateTableData({ name, roomId, x, y, width, height, status, capacity });
    if (!validation.isValid) {
      return res.status(400).json({
        error: i18n.t('errors:tables.validationFailed'),
        details: validation.errors
      });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        ...(sanitizedName !== undefined && { name: sanitizedName }),
        ...(roomId !== undefined && { roomId }),
        ...(x !== undefined && { x: parseFloat(x.toString()) }),
        ...(y !== undefined && { y: parseFloat(y.toString()) }),
        ...(width !== undefined && { width: parseFloat(width.toString()) }),
        ...(height !== undefined && { height: parseFloat(height.toString()) }),
        ...(status !== undefined && { status }),
        ...(capacity !== undefined && { capacity: parseInt(capacity.toString(), 10) }),
        ...(items !== undefined && { items }), // Include items if provided
      },
      include: {
        room: true,
      },
    });

    res.json(updatedTable);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating table', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:tables.updateFailed') });
  }
});

// DELETE /api/tables/:id - Delete table
router.delete('/:id', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: i18n.t('errors:tables.notFound') });
    }

    // Check if table is associated with any tabs
    const tabs = await prisma.tab.findMany({
      where: {
        tableId: id,
      },
    });

    if (tabs.length > 0) {
      return res.status(400).json({
        error: i18n.t('errors:tables.cannotDeleteWithTabs'),
        tabCount: tabs.length
      });
    }

    await prisma.table.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting table', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:tables.deleteFailed') });
  }
});

// PUT /api/tables/:id/position - Update only table position (for drag/drop)
router.put('/:id/position', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { x, y } = req.body;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: i18n.t('errors:tables.notFound') });
    }

    if (x === undefined || y === undefined) {
      return res.status(400).json({ error: i18n.t('errors:tables.coordinatesRequired') });
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
    logError(error instanceof Error ? error : 'Error updating table position', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:tables.positionUpdateFailed') });
  }
});

// PUT /api/tables/:id/status - Update only table status
router.put('/:id/status', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status value
    const validStatuses = ['available', 'occupied', 'reserved', 'unavailable', 'bill_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validValues: validStatuses
      });
    }

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: i18n.t('errors:tables.notFound') });
    }

    // Validate status transition
    const validation = validateTableStatusUpdate(table.status, status);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: { status },
      include: { room: true },
    });

    res.json(updatedTable);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating table status', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:tables.statusUpdateFailed') });
  }
});

export default router;