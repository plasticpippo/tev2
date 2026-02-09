import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { DailyClosing } from '../types';
import { calculateDailyClosingSummary, createDailyClosing } from '../services/dailyClosingService';
import { logError } from '../utils/logger';
import { toUserReferenceDTO } from '../types/dto';

export const dailyClosingsRouter = express.Router();

// GET /api/daily-closings - Get all daily closings (with optional filters)
dailyClosingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, dateFrom, dateTo } = req.query;

    // Build filter object
    const filter: any = {};
    if (userId) {
      filter.userId = Number(userId);
    }
    if (dateFrom || dateTo) {
      filter.closedAt = {};
      if (dateFrom) {
        filter.closedAt.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        filter.closedAt.lte = new Date(dateTo as string);
      }
    }

    // Get daily closings without including user data to avoid potential sensitive data exposure
    const dailyClosings = await prisma.dailyClosing.findMany({
      where: filter,
      // Remove user inclusion to prevent potential sensitive data exposure
      orderBy: {
        closedAt: 'desc'
      }
    });

    // For each daily closing, fetch only the necessary user data safely
    const result: DailyClosing[] = await Promise.all(dailyClosings.map(async (closing: any) => {
      // Fetch only the safe user data we need
      const user = await prisma.user.findUnique({
        where: { id: closing.userId },
        select: {
          id: true,
          name: true
        }
      });

      return {
        id: closing.id,
        createdAt: closing.createdAt.toISOString(),
        closedAt: closing.closedAt.toISOString(),
        summary: closing.summary as any,
        userId: closing.userId,
        userName: user?.name || 'Unknown User' // Fallback to 'Unknown User' if user not found
      };
    }));

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching daily closings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch daily closings' });
  }
});

// GET /api/daily-closings/:id - Get a specific daily closing
dailyClosingsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dailyClosing = await prisma.dailyClosing.findUnique({
      where: { id: Number(id) }
    });

    if (!dailyClosing) {
      res.status(404).json({ error: 'Daily closing not found' });
      return;
    }

    // Fetch only the safe user data we need
    const user = await prisma.user.findUnique({
      where: { id: dailyClosing.userId },
      select: {
        id: true,
        name: true
      }
    });

    const result: DailyClosing = {
      id: dailyClosing.id,
      createdAt: dailyClosing.createdAt.toISOString(),
      closedAt: dailyClosing.closedAt.toISOString(),
      summary: dailyClosing.summary as any,
      userId: dailyClosing.userId,
      userName: user?.name || 'Unknown User' // Fallback to 'Unknown User' if user not found
    };

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching daily closing', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch daily closing' });
  }
});

// POST /api/daily-closings - Create a new daily closing
dailyClosingsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { closedAt, userId } = req.body;

    // Validate required fields
    if (!closedAt || !userId) {
      res.status(400).json({ error: 'Missing required fields: closedAt or userId' });
      return;
    }

    // Get current settings to determine the business day start
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      res.status(500).json({ error: 'Settings not found' });
      return;
    }

    // Create settings object to match the expected interface
    const settingsObj = {
      tax: {
        mode: settings.taxMode as 'inclusive' | 'exclusive' | 'none'
      },
      businessDay: {
        autoStartTime: settings.autoStartTime,
        lastManualClose: settings.lastManualClose?.toISOString() || null
      }
    };

    // Calculate the start of the current business day
    const now = new Date(closedAt);
    const [hours, minutes] = settingsObj.businessDay.autoStartTime.split(':').map(Number);
    const todayAtCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    
    let businessDayStart: Date;
    if (now >= todayAtCutoff) {
      // If we are past today's cutoff time, the business day started today.
      businessDayStart = todayAtCutoff;
    } else {
      // If we are before today's cutoff, the business day started yesterday.
      const yesterdayAtCutoff = new Date(todayAtCutoff);
      yesterdayAtCutoff.setDate(yesterdayAtCutoff.getDate() - 1);
      businessDayStart = yesterdayAtCutoff;
    }

    // Check if there was a more recent manual close
    if (settingsObj.businessDay.lastManualClose) {
      const lastManualCloseDate = new Date(settingsObj.businessDay.lastManualClose);
      // Use the more recent of the two dates
      if (lastManualCloseDate > businessDayStart) {
        businessDayStart = lastManualCloseDate;
      }
    }

    // Calculate the summary for transactions since the business day start
    const summary = await calculateDailyClosingSummary(businessDayStart, new Date(closedAt));

    const dailyClosing = await prisma.dailyClosing.create({
      data: {
        closedAt: new Date(closedAt),
        summary: summary as any, // Type assertion to handle JSON serialization
        userId: userId
      }
    });

    // Fetch only the safe user data we need
    const user = await prisma.user.findUnique({
      where: { id: dailyClosing.userId },
      select: {
        id: true,
        name: true
      }
    });

    const result: DailyClosing = {
      id: dailyClosing.id,
      createdAt: dailyClosing.createdAt.toISOString(),
      closedAt: dailyClosing.closedAt.toISOString(),
      summary: dailyClosing.summary as any,
      userId: dailyClosing.userId,
      userName: user?.name || 'Unknown User' // Fallback to 'Unknown User' if user not found
    };

    res.status(201).json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating daily closing', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to create daily closing' });
  }
});

export default dailyClosingsRouter;