import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { validateRoomName } from '../utils/validation';
import { sanitizeName, sanitizeDescription, SanitizationError } from '../utils/sanitization';

const router = Router();

// Middleware to log all room requests
router.use((req, res, next) => {
  console.log(`[Rooms API] ${req.method} ${req.path}`, {
    body: req.body,
    params: req.params,
  });
  next();
});

// GET /api/rooms - Retrieve all rooms
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        tables: true, // Include associated tables
      },
      orderBy: {
        id: 'asc',
      },
    });

    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/rooms/:id - Retrieve specific room
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        tables: true, // Include associated tables
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
 } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ error: 'Failed to fetch room', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/rooms - Create new room
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Sanitize name and description
    let sanitizedName: string;
    let sanitizedDescription: string | undefined;
    try {
      sanitizedName = sanitizeName(name);
      if (description !== undefined) {
        sanitizedDescription = sanitizeDescription(description);
      }
    } catch (error) {
      if (error instanceof SanitizationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }

    // Validate room name
    const nameValidationError = validateRoomName(sanitizedName);
    if (nameValidationError) {
      return res.status(400).json({ error: nameValidationError });
    }

    // Check for duplicate room names
    const existingRoomWithSameName = await prisma.room.findFirst({
      where: {
        name: {
          equals: sanitizedName,
          mode: 'insensitive' // Case insensitive comparison
        }
      }
    });

    if (existingRoomWithSameName) {
      return res.status(400).json({ error: 'A room with this name already exists' });
    }

    // Validate description length
    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description must be 500 characters or less' });
    }

    const newRoom = await prisma.room.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
      },
      include: {
        tables: true, // Include associated tables in response
      },
    });

    res.status(201).json(newRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// PUT /api/rooms/:id - Update room
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Find the room to update
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Sanitize name and description if provided
    let sanitizedName: string | undefined;
    let sanitizedDescription: string | undefined;
    if (name !== undefined || description !== undefined) {
      try {
        if (name !== undefined) {
          sanitizedName = sanitizeName(name);
        }
        if (description !== undefined) {
          sanitizedDescription = sanitizeDescription(description);
        }
      } catch (error) {
        if (error instanceof SanitizationError) {
          res.status(400).json({ error: error.message });
          return;
        }
        throw error;
      }
    }

    // If name is provided, validate it
    if (sanitizedName !== undefined) {
      const nameValidationError = validateRoomName(sanitizedName);
      if (nameValidationError) {
        return res.status(400).json({ error: nameValidationError });
      }

      // Check for duplicate room names (excluding the current room)
      const existingRoomWithSameName = await prisma.room.findFirst({
        where: {
          name: {
            equals: sanitizedName,
            mode: 'insensitive' // Case insensitive comparison
          },
          id: {
            not: id // Exclude current room from duplicate check
          }
        }
      });

      if (existingRoomWithSameName) {
        return res.status(400).json({ error: 'A room with this name already exists' });
      }
    }

    // If description is provided and too long, return error
    if (description !== undefined && description.length > 500) {
      return res.status(400).json({ error: 'Description must be 500 characters or less' });
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        ...(sanitizedName !== undefined && { name: sanitizedName }),
        ...(sanitizedDescription !== undefined && { description: sanitizedDescription }),
      },
      include: {
        tables: true, // Include associated tables in response
      },
    });

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DELETE /api/rooms/:id - Delete room (with validation to prevent deletion of rooms with assigned tables)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room has any tables assigned to it
    const tables = await prisma.table.count({
      where: {
        roomId: id,
      },
    });

    if (tables > 0) {
      return res.status(400).json({
        error: `Cannot delete room with ${tables} assigned table(s). Please delete or reassign tables first.`,
        tableCount: tables
      });
    }

    await prisma.room.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;