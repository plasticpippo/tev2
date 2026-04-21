import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prisma';
import type { Settings } from '../types';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { logError, logInfo, logWarn, logAuditEvent } from '../utils/logger';
import { getSchedulerStatus, clearSettingsCache } from '../services/businessDayScheduler';
import { Settings as PrismaSettings, TaxRate as PrismaTaxRate } from '@prisma/client';
import { spawn } from 'child_process';
import { testSmtpConnection, getEmailConfig } from '../services/emailService';
import { upload } from '../middleware/upload';
import { processLogo, deleteLogo, getLogoUrl } from '../services/logoUploadService';

export const settingsRouter = express.Router();

const emailTestRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req: any) => ({ error: req.t('errors:settings.tooManyEmailTestRequests') }),
  keyGenerator: (req: any) => {
    return req.user?.id?.toString() || req.ip;
  },
});

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
  const t = req.t.bind(req);
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
        },
        business: {
          name: null,
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
          logoPath: null,
          legalText: null
        },
        receipt: {
          prefix: 'R',
          numberLength: 6,
          startNumber: 1,
          sequenceYear: false,
          currentYear: null,
          currentNumber: 0
        },
email: {
        smtpHost: null,
        smtpPort: 587,
        smtpUser: null,
        smtpPassword: null,
        fromAddress: null,
        fromName: null,
        smtpSecure: false,
        enabled: false
      },
      receiptFromPaymentModal: {
        allowReceiptFromPaymentModal: false,
        receiptIssueDefaultSelected: false,
        receiptIssueMode: 'immediate'
      }
      });
      return;
    }

    // Format the default tax rate if present
    const defaultTaxRate = formatTaxRate(settings.defaultTaxRate);

    // Convert the database format to the expected format
    const logoUrl = settings.businessLogoPath ? getLogoUrl(settings.businessLogoPath) : null;

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
      },
      business: {
        name: settings.businessName,
        address: settings.businessAddress,
        city: settings.businessCity,
        postalCode: settings.businessPostalCode,
        country: settings.businessCountry,
        phone: settings.businessPhone,
        email: settings.businessEmail,
        vatNumber: settings.vatNumber,
        logoPath: logoUrl,
        legalText: settings.businessLegalText
      },
      receipt: {
        prefix: settings.receiptPrefix,
        numberLength: settings.receiptNumberLength,
        startNumber: settings.receiptStartNumber,
        sequenceYear: settings.receiptSequenceYear,
        currentYear: settings.receiptCurrentYear,
        currentNumber: settings.receiptCurrentNumber
      },
email: {
      smtpHost: settings.emailSmtpHost,
      smtpPort: settings.emailSmtpPort,
      smtpUser: settings.emailSmtpUser,
      smtpPassword: settings.emailSmtpPassword ? '********' : null,
      fromAddress: settings.emailFromAddress,
      fromName: settings.emailFromName,
      smtpSecure: settings.emailSmtpSecure,
      enabled: settings.emailEnabled
    },
    receiptFromPaymentModal: {
      allowReceiptFromPaymentModal: settings.allowReceiptFromPaymentModal ?? false,
      receiptIssueDefaultSelected: settings.receiptIssueDefaultSelected ?? false,
      receiptIssueMode: (settings.receiptIssueMode ?? 'immediate') as 'immediate' | 'draft'
    }
  };

  res.json(result);
} catch (error) {
  logError(error instanceof Error ? error : 'Error fetching settings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:settings.fetchFailed') });
  }
});

// POST /api/settings/logo - Upload business logo
settingsRouter.post('/logo', authenticateToken, requireAdmin, upload.single('logo') as any, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    if (!req.file) {
      res.status(400).json({ error: t('errors:settings.noFileUploaded') });
      return;
    }

    const file = req.file as Express.Multer.File;
    const uploadResult = await processLogo({
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    });

    if (!uploadResult.success) {
      res.status(400).json({ error: uploadResult.error });
      return;
    }

    const existingSettings = await prisma.settings.findFirst();
    let settings;

    if (existingSettings) {
      settings = await prisma.settings.update({
        where: { id: existingSettings.id },
        data: { businessLogoPath: uploadResult.path },
      });
    } else {
      settings = await prisma.settings.create({
        data: {
          taxMode: 'none',
          autoStartTime: '06:00',
          businessDayEndHour: '06:00',
          businessLogoPath: uploadResult.path,
        },
      });
    }

    clearSettingsCache();
    logInfo('Business logo uploaded', { correlationId: (req as any).correlationId });

    const logoUrl = uploadResult.path ? getLogoUrl(uploadResult.path) : '';
    res.json({
      success: true,
      path: uploadResult.path,
      url: logoUrl,
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error uploading logo', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:settings.failedToUploadLogo') });
  }
});

// DELETE /api/settings/logo - Delete business logo
settingsRouter.delete('/logo', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const existingSettings = await prisma.settings.findFirst();

    if (!existingSettings || !existingSettings.businessLogoPath) {
      res.status(404).json({ error: t('errors:settings.noLogoFound') });
      return;
    }

    const oldLogoPath = existingSettings.businessLogoPath;
    await deleteLogo(oldLogoPath);

    await prisma.settings.update({
      where: { id: existingSettings.id },
      data: { businessLogoPath: null },
    });

    clearSettingsCache();
    logInfo('Business logo deleted', { correlationId: (req as any).correlationId });

    res.json({ success: true });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting logo', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:settings.failedToDeleteLogo') });
  }
});

// PUT /api/settings - Update settings (requires admin role)
settingsRouter.put('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { tax, businessDay, business, receipt, email, receiptFromPaymentModal } = req.body as Settings;

    // Validate receiptIssueMode if provided
    if (receiptFromPaymentModal?.receiptIssueMode !== undefined) {
      if (receiptFromPaymentModal.receiptIssueMode !== 'immediate' && receiptFromPaymentModal.receiptIssueMode !== 'draft') {
        res.status(400).json({ error: t('errors:settings.invalidReceiptIssueMode') });
        return;
      }
    }

    // Validate defaultTaxRateId if provided
    if (tax?.defaultTaxRateId !== undefined && tax.defaultTaxRateId !== null) {
      const taxRate = await prisma.taxRate.findFirst({
        where: { id: tax.defaultTaxRateId },
      });

      if (!taxRate) {
        res.status(400).json({ error: t('errors:settings.invalidDefaultTaxRate') });
        return;
      }

      if (!taxRate.isActive) {
        res.status(400).json({ error: t('errors:settings.cannotSetInactiveAsDefault') });
        return;
      }
    }

    // Validate email configuration if email is enabled
    if (email?.enabled) {
      if (!email.smtpHost || !email.smtpUser || !email.fromAddress) {
        res.status(400).json({ error: t('errors:settings.emailConfigIncomplete') });
        return;
      }
      if (email.smtpPort < 1 || email.smtpPort > 65535) {
        res.status(400).json({ error: t('errors:settings.invalidSmtpPort') });
        return;
      }
    }

    // Validate receipt configuration
    if (receipt) {
      if (receipt.numberLength < 1 || receipt.numberLength > 20) {
        res.status(400).json({ error: t('errors:settings.invalidReceiptNumberLength') });
        return;
      }
      if (receipt.startNumber < 1) {
        res.status(400).json({ error: t('errors:settings.invalidReceiptStartNumber') });
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
          lastManualClose: businessDay?.lastManualClose ? new Date(businessDay.lastManualClose) : null,
          businessName: business?.name !== undefined ? business.name : existingSettings.businessName,
          businessAddress: business?.address !== undefined ? business.address : existingSettings.businessAddress,
          businessCity: business?.city !== undefined ? business.city : existingSettings.businessCity,
          businessPostalCode: business?.postalCode !== undefined ? business.postalCode : existingSettings.businessPostalCode,
          businessCountry: business?.country !== undefined ? business.country : existingSettings.businessCountry,
          businessPhone: business?.phone !== undefined ? business.phone : existingSettings.businessPhone,
          businessEmail: business?.email !== undefined ? business.email : existingSettings.businessEmail,
          vatNumber: business?.vatNumber !== undefined ? business.vatNumber : existingSettings.vatNumber,
          businessLegalText: business?.legalText !== undefined ? business.legalText : existingSettings.businessLegalText,
          receiptPrefix: receipt?.prefix !== undefined ? receipt.prefix : existingSettings.receiptPrefix,
          receiptNumberLength: receipt?.numberLength !== undefined ? receipt.numberLength : existingSettings.receiptNumberLength,
          receiptStartNumber: receipt?.startNumber !== undefined ? receipt.startNumber : existingSettings.receiptStartNumber,
          receiptSequenceYear: receipt?.sequenceYear !== undefined ? receipt.sequenceYear : existingSettings.receiptSequenceYear,
          receiptCurrentYear: receipt?.currentYear !== undefined ? receipt.currentYear : existingSettings.receiptCurrentYear,
          receiptCurrentNumber: receipt?.currentNumber !== undefined ? receipt.currentNumber : existingSettings.receiptCurrentNumber,
          emailSmtpHost: email?.smtpHost !== undefined ? email.smtpHost : existingSettings.emailSmtpHost,
          emailSmtpPort: email?.smtpPort !== undefined ? email.smtpPort : existingSettings.emailSmtpPort,
          emailSmtpUser: email?.smtpUser !== undefined ? email.smtpUser : existingSettings.emailSmtpUser,
          emailSmtpPassword: email?.smtpPassword !== undefined ? email.smtpPassword : existingSettings.emailSmtpPassword,
          emailFromAddress: email?.fromAddress !== undefined ? email.fromAddress : existingSettings.emailFromAddress,
          emailFromName: email?.fromName !== undefined ? email.fromName : existingSettings.emailFromName,
emailSmtpSecure: email?.smtpSecure !== undefined ? email.smtpSecure : existingSettings.emailSmtpSecure,
      emailEnabled: email?.enabled !== undefined ? email.enabled : existingSettings.emailEnabled,
      allowReceiptFromPaymentModal: receiptFromPaymentModal?.allowReceiptFromPaymentModal !== undefined ? receiptFromPaymentModal.allowReceiptFromPaymentModal : existingSettings.allowReceiptFromPaymentModal,
      receiptIssueDefaultSelected: receiptFromPaymentModal?.receiptIssueDefaultSelected !== undefined ? receiptFromPaymentModal.receiptIssueDefaultSelected : existingSettings.receiptIssueDefaultSelected,
      receiptIssueMode: receiptFromPaymentModal?.receiptIssueMode !== undefined ? receiptFromPaymentModal.receiptIssueMode : existingSettings.receiptIssueMode,
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
          lastManualClose: businessDay?.lastManualClose ? new Date(businessDay.lastManualClose) : null,
          businessName: business?.name ?? null,
          businessAddress: business?.address ?? null,
          businessCity: business?.city ?? null,
          businessPostalCode: business?.postalCode ?? null,
          businessCountry: business?.country ?? null,
          businessPhone: business?.phone ?? null,
          businessEmail: business?.email ?? null,
          vatNumber: business?.vatNumber ?? null,
          businessLegalText: business?.legalText ?? null,
          receiptPrefix: receipt?.prefix ?? 'R',
          receiptNumberLength: receipt?.numberLength ?? 6,
          receiptStartNumber: receipt?.startNumber ?? 1,
          receiptSequenceYear: receipt?.sequenceYear ?? false,
          receiptCurrentYear: receipt?.currentYear ?? null,
          receiptCurrentNumber: receipt?.currentNumber ?? 0,
          emailSmtpHost: email?.smtpHost ?? null,
          emailSmtpPort: email?.smtpPort ?? 587,
          emailSmtpUser: email?.smtpUser ?? null,
          emailSmtpPassword: email?.smtpPassword ?? null,
          emailFromAddress: email?.fromAddress ?? null,
          emailFromName: email?.fromName ?? null,
emailSmtpSecure: email?.smtpSecure ?? false,
      emailEnabled: email?.enabled ?? false,
      allowReceiptFromPaymentModal: receiptFromPaymentModal?.allowReceiptFromPaymentModal ?? false,
      receiptIssueDefaultSelected: receiptFromPaymentModal?.receiptIssueDefaultSelected ?? false,
      receiptIssueMode: receiptFromPaymentModal?.receiptIssueMode ?? 'immediate',
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
      },
      business: {
        name: settings.businessName,
        address: settings.businessAddress,
        city: settings.businessCity,
        postalCode: settings.businessPostalCode,
        country: settings.businessCountry,
        phone: settings.businessPhone,
        email: settings.businessEmail,
        vatNumber: settings.vatNumber,
        logoPath: settings.businessLogoPath ? getLogoUrl(settings.businessLogoPath) : null,
        legalText: settings.businessLegalText
      },
      receipt: {
        prefix: settings.receiptPrefix,
        numberLength: settings.receiptNumberLength,
        startNumber: settings.receiptStartNumber,
        sequenceYear: settings.receiptSequenceYear,
        currentYear: settings.receiptCurrentYear,
        currentNumber: settings.receiptCurrentNumber
      },
email: {
      smtpHost: settings.emailSmtpHost,
      smtpPort: settings.emailSmtpPort,
      smtpUser: settings.emailSmtpUser,
      smtpPassword: settings.emailSmtpPassword ? '********' : null,
      fromAddress: settings.emailFromAddress,
      fromName: settings.emailFromName,
      smtpSecure: settings.emailSmtpSecure,
      enabled: settings.emailEnabled
    },
    receiptFromPaymentModal: {
      allowReceiptFromPaymentModal: settings.allowReceiptFromPaymentModal ?? false,
      receiptIssueDefaultSelected: settings.receiptIssueDefaultSelected ?? false,
      receiptIssueMode: (settings.receiptIssueMode ?? 'immediate') as 'immediate' | 'draft'
    }
  };

  res.json(result);
} catch (error) {
  logError(error instanceof Error ? error : 'Error updating settings', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: t('errors:settings.updateFailed') });
  }
});

// GET /api/settings/business-day-status - Get scheduler status
settingsRouter.get('/business-day-status', async (req: Request, res: Response) => {
  const t = req.t.bind(req);
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
    res.status(500).json({ error: t('errors:settings.fetchFailed') });
  }
});

// POST /api/settings/backup - Create database backup (requires admin role)
// Uses spawn with array arguments to prevent command injection
settingsRouter.post('/backup', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  const backupTimeout = 120000; // 2 minutes timeout
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      res.status(500).json({ error: t('errors:settings.databaseConfigNotFound') });
      return;
    }
    
    // Parse the database URL to extract connection parameters
    // Format: postgresql://user:password@host:port/database?query_params
    const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    
    if (!urlMatch) {
      logError('Failed to parse database URL for backup', { correlationId: (req as any).correlationId });
      res.status(500).json({ error: t('errors:settings.invalidDatabaseConfig') });
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
      res.status(500).json({ error: t('errors:settings.invalidDatabaseConfig') });
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
      res.status(500).json({ error: t('errors:settings.backupFailed') });
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
    res.status(500).json({ error: t('errors:settings.backupFailed') });
  }
});

settingsRouter.post('/email/test', authenticateToken, requireAdmin, emailTestRateLimiter, async (req: Request, res: Response) => {
  const t = req.t.bind(req);
  try {
    const { recipient } = req.body;

    const config = await getEmailConfig();

    let testRecipient: string | undefined;
    if (recipient) {
      if (typeof recipient !== 'string') {
        res.status(400).json({ error: t('errors:settings.invalidRecipientEmailFormat') });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipient)) {
        res.status(400).json({ error: t('errors:settings.invalidRecipientEmailAddress') });
        return;
      }
      testRecipient = recipient;
    } else if (config.fromAddress) {
      testRecipient = config.fromAddress;
    }

    if (!config.enabled) {
      res.status(400).json({
        success: false,
        message: t('errors:settings.emailServiceDisabled'),
        error: t('errors:settings.emailDisabledCode'),
      });
      return;
    }

    logInfo('SMTP test requested', {
      userId: (req as any).user?.id,
      hasCustomRecipient: !!recipient,
      correlationId: (req as any).correlationId,
    });

    const result = await testSmtpConnection(testRecipient);

    logAuditEvent(
      'CONFIG_CHANGED',
      'SMTP configuration test',
      {
        success: result.success,
        host: config.host,
        port: config.port,
        responseTime: result.details?.responseTime,
      },
      result.success ? 'low' : 'medium',
      {
        userId: (req as any).user?.id,
        username: (req as any).user?.username,
        correlationId: (req as any).correlationId,
      }
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        details: result.details,
      });
    } else {
      const statusCode = result.error === 'SMTP_AUTH_FAILED' ? 401 :
                         result.error === 'SMTP_CONNECTION_FAILED' ? 503 :
                         result.error === 'SMTP_TIMEOUT' ? 504 :
                         400;
      res.status(statusCode).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }
  } catch (error) {
    logError('SMTP test endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({
      success: false,
      message: t('errors:settings.failedToTestSmtp'),
      error: t('errors:settings.internalErrorCode'),
    });
  }
});

export default settingsRouter;
