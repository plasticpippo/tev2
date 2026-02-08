import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Settings } from '../types';
import { logError } from '../utils/logger';

export const settingsRouter = express.Router();

// GET /api/settings - Get current settings
settingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Get the first (and should be only) settings record
    const settings = await prisma.settings.findFirst();
    
    if (!settings) {
      // If no settings exist, return default values
      res.json({
        tax: { mode: 'none' },
        businessDay: {
          autoStartTime: '06:00',
          lastManualClose: null
        }
      });
      return;
    }
    
    // Convert the database format to the expected format
    const result: Settings = {
      tax: { 
        mode: settings.taxMode as 'inclusive' | 'exclusive' | 'none' 
      },
      businessDay: {
        autoStartTime: settings.autoStartTime,
        lastManualClose: settings.lastManualClose?.toISOString() || null
      }
    };
    
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching settings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update settings
settingsRouter.put('/', async (req: Request, res: Response) => {
  try {
    const { tax, businessDay } = req.body as Settings;
    
    // Get the first settings record or create one if it doesn't exist
    let settings = await prisma.settings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          taxMode: tax.mode,
          autoStartTime: businessDay.autoStartTime,
          lastManualClose: businessDay.lastManualClose ? new Date(businessDay.lastManualClose) : null
        }
      });
    } else {
      // Create new settings record
      settings = await prisma.settings.create({
        data: {
          taxMode: tax.mode,
          autoStartTime: businessDay.autoStartTime,
          lastManualClose: businessDay.lastManualClose ? new Date(businessDay.lastManualClose) : null
        }
      });
    }
    
    // Convert the database format to the expected format
    const result: Settings = {
      tax: { 
        mode: settings.taxMode as 'inclusive' | 'exclusive' | 'none' 
      },
      businessDay: {
        autoStartTime: settings.autoStartTime,
        lastManualClose: settings.lastManualClose?.toISOString() || null
      }
    };
    
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating settings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default settingsRouter;