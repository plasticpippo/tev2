import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { Settings } from '../types';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { logError, logInfo } from '../utils/logger';
import i18n from '../i18n';
import { getSchedulerStatus, clearSettingsCache } from '../services/businessDayScheduler';
import { Settings as PrismaSettings, TaxRate as PrismaTaxRate } from '@prisma/client';
import { spawn } from 'child_process';

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
    rate: Number(taxRate.rate),
    ratePercent: `${(Number(taxRate.rate) * 100).toFixed(2)}%`,
    description: taxRate.description,
    isDefault: taxRate.isDefault,
    isActive: taxRate.isActive,
    createdAt: taxRate.createdAt.toISOString(),
    updatedAt: taxRate.updatedAt.toISOString(),
  };
}

// GET /api/settings - Get current settings
settingsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
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

// PUT /api/settings - Update settings (requires admin role)
settingsRouter.put('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
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

// POST /api/settings/backup - Create database backup (requires admin role)
// Uses spawn with array arguments to prevent command injection
settingsRouter.post('/backup', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const backupTimeout = 120000; // 2 minutes timeout
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      res.status(500).json({ error: 'Database configuration not found' });
      return;
    }
    
    // Parse the database URL to extract connection parameters
    // Format: postgresql://user:password@host:port/database?query_params
    const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    
    if (!urlMatch) {
      logError('Failed to parse database URL for backup', { correlationId: (req as any).correlationId });
      res.status(500).json({ error: 'Invalid database configuration' });
      return;
    }
    
    const [, user, password, host, port, database] = urlMatch;
    
    // Validate and sanitize database URL components to prevent command injection
    // Only allow alphanumeric characters, underscores, hyphens, and dots
    const sanitizeParam = (param: string, name: string): string | null => {
      if (!param || !/^[a-zA-Z0-9_.-]+$/.test(param)) {
        logError(`Invalid ${name} in database URL`, { correlationId: (req as any).correlationId });
        return null;
      }
      return param;
    };

    const safeUser = sanitizeParam(user, 'username');
    const safeHost = sanitizeParam(host, 'host');
    const safePort = sanitizeParam(port, 'port');
    const safeDatabase = sanitizeParam(database, 'database');

    // If sanitization failed, return error
    if (!safeUser || !safeHost || !safePort || !safeDatabase) {
      res.status(500).json({ error: 'Invalid database configuration' });
      return;
    }
    
    // Set PGPASSWORD environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: password };
    
    // Use spawn with array arguments to prevent command injection (no shell interpretation)
    const pgDumpArgs = [
      '-h', safeHost,
      '-p', safePort,
      '-U', safeUser,
      '-d', safeDatabase,
      '--format=p',
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges'
    ];
    
    // Create promise-based pg_dump execution with timeout
    const pgDumpPromise = new Promise<{ stdout: string; stderr: string; exitCode: number }>((resolve, reject) => {
      const pgDump = spawn('pg_dump', pgDumpArgs, { env });
      
      let stdout = '';
      let stderr = '';
      
      pgDump.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      pgDump.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      pgDump.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      });
      
      pgDump.on('error', (err) => {
        reject(err);
      });
    });
    
    // Set up timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Backup operation timed out'));
      }, backupTimeout);
    });
    
    // Race between backup and timeout
    const { stdout, stderr, exitCode } = await Promise.race([pgDumpPromise, timeoutPromise]);
    
    // Clear timeout after successful completion
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // Check exit code
    if (exitCode !== 0) {
      logError(`pg_dump failed with exit code ${exitCode}: ${stderr}`, { correlationId: (req as any).correlationId });
      res.status(500).json({ error: i18n.t('errors:settings.backupFailed') });
      return;
    }
    
    if (stderr && !stderr.includes('WARNING')) {
      logError('pg_dump stderr: ' + stderr, { correlationId: (req as any).correlationId });
    }
    
    logInfo('Database backup created successfully', { correlationId: (req as any).correlationId });
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename=database_backup.sql');
    
    // Send the backup content
    res.send(stdout);
  } catch (error) {
    // Clear timeout on error
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(errorMessage, {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:settings.backupFailed') });
  }
});

export default settingsRouter;
