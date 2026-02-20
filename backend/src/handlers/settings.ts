import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Settings } from '../types';
import { logError, logInfo } from '../utils/logger';
import i18n from '../i18n';
import { getSchedulerStatus, clearSettingsCache } from '../services/businessDayScheduler';
import { Settings as PrismaSettings, TaxRate as PrismaTaxRate } from '@prisma/client';

export const settingsRouter = express.Router();

// Type for settings with included defaultTaxRate relation
type SettingsWithTaxRate = PrismaSettings & {
  defaultTaxRate: PrismaTaxRate | null;
};

// Helper function to format tax rate for response
function formatTaxRate(taxRate: PrismaTaxRate | null) {
  if (!taxRate) return null;
  return {
    id: taxRate.id,
    name: taxRate.name,
    rate: taxRate.rate.toString(),
    ratePercent: `${(Number(taxRate.rate) * 100).toFixed(2)}%`,
    description: taxRate.description,
    isDefault: taxRate.isDefault,
    isActive: taxRate.isActive,
    createdAt: taxRate.createdAt.toISOString(),
    updatedAt: taxRate.updatedAt.toISOString(),
  };
}

// GET /api/settings - Get current settings
settingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    // Get the first (and should be only) settings record with default tax rate
    const settings = await prisma.settings.findFirst({
      include: {
        defaultTaxRate: true,
      },
    }) as SettingsWithTaxRate | null;
    
    if (!settings) {
      // If no settings exist, return default values
      res.json({
        tax: { 
          mode: 'none',
          defaultTaxRateId: null,
          defaultTaxRate: null,
        },
        businessDay: {
          autoStartTime: '06:00',
          businessDayEndHour: '06:00',
          lastManualClose: null,
          autoCloseEnabled: false
        }
      });
      return;
    }
    
    // Format the default tax rate if present
    const defaultTaxRate = formatTaxRate(settings.defaultTaxRate);
    
    // Convert the database format to the expected format
    const result: Settings = {
      tax: { 
        mode: settings.taxMode as 'inclusive' | 'exclusive' | 'none',
        defaultTaxRateId: settings.defaultTaxRateId,
        defaultTaxRate: defaultTaxRate,
      },
      businessDay: {
        autoStartTime: settings.autoStartTime,
        businessDayEndHour: settings.businessDayEndHour,
        lastManualClose: settings.lastManualClose?.toISOString() || null,
        autoCloseEnabled: settings.autoCloseEnabled ?? false
      }
    };
    
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching settings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:settings.fetchFailed') });
  }
});

// PUT /api/settings - Update settings
settingsRouter.put('/', async (req: Request, res: Response) => {
  try {
    const { tax, businessDay } = req.body as Settings;
    
    // Validate defaultTaxRateId if provided
    if (tax?.defaultTaxRateId !== undefined && tax.defaultTaxRateId !== null) {
      const taxRate = await prisma.taxRate.findFirst({
        where: { id: tax.defaultTaxRateId },
      });
      
      if (!taxRate) {
        res.status(400).json({ error: req.t('errors:settings.invalidDefaultTaxRate') });
        return;
      }
      
      if (!taxRate.isActive) {
        res.status(400).json({ error: req.t('errors:settings.cannotSetInactiveAsDefault') });
        return;
      }
    }
    
    // Get the first settings record or create one if it doesn't exist
    const existingSettings = await prisma.settings.findFirst();
    
    let settings: SettingsWithTaxRate;
    
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: {
          taxMode: tax?.mode,
          defaultTaxRateId: tax?.defaultTaxRateId !== undefined ? tax.defaultTaxRateId : existingSettings.defaultTaxRateId,
          autoStartTime: businessDay?.autoStartTime,
          businessDayEndHour: businessDay?.businessDayEndHour,
          autoCloseEnabled: businessDay?.autoCloseEnabled ?? false,
          lastManualClose: businessDay?.lastManualClose ? new Date(businessDay.lastManualClose) : null
        },
        include: {
          defaultTaxRate: true,
        },
      }) as SettingsWithTaxRate;
    } else {
      // Create new settings record
      settings = await prisma.settings.create({
        data: {
          taxMode: tax?.mode ?? 'none',
          defaultTaxRateId: tax?.defaultTaxRateId ?? null,
          autoStartTime: businessDay?.autoStartTime ?? '06:00',
          businessDayEndHour: businessDay?.businessDayEndHour ?? '06:00',
          autoCloseEnabled: businessDay?.autoCloseEnabled ?? false,
          lastManualClose: businessDay?.lastManualClose ? new Date(businessDay.lastManualClose) : null
        },
        include: {
          defaultTaxRate: true,
        },
      }) as SettingsWithTaxRate;
    }
    
    // Clear the scheduler's settings cache so it picks up the new settings
    clearSettingsCache();
    logInfo('Settings updated, scheduler cache cleared');
    
    // Format the default tax rate if present
    const defaultTaxRate = formatTaxRate(settings.defaultTaxRate);
    
    // Convert the database format to the expected format
    const result: Settings = {
      tax: { 
        mode: settings.taxMode as 'inclusive' | 'exclusive' | 'none',
        defaultTaxRateId: settings.defaultTaxRateId,
        defaultTaxRate: defaultTaxRate,
      },
      businessDay: {
        autoStartTime: settings.autoStartTime,
        businessDayEndHour: settings.businessDayEndHour,
        lastManualClose: settings.lastManualClose?.toISOString() || null,
        autoCloseEnabled: settings.autoCloseEnabled ?? false
      }
    };
    
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating settings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:settings.updateFailed') });
  }
});

// GET /api/settings/business-day-status - Get scheduler status
settingsRouter.get('/business-day-status', async (req: Request, res: Response) => {
  try {
    const status = getSchedulerStatus();
    
    res.json({
      scheduler: {
        isRunning: status.isRunning,
        isClosingInProgress: status.isClosingInProgress,
        lastCloseTime: status.lastCloseTime?.toISOString() || null,
        nextScheduledClose: status.nextScheduledClose?.toISOString() || null
      },
      businessDay: {
        autoCloseEnabled: status.autoCloseEnabled,
        businessDayEndHour: status.businessDayEndHour
      }
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching business day status', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:settings.fetchFailed') });
  }
});

export default settingsRouter;