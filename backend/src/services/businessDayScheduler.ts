/**
 * Business Day Scheduler Service
 * 
 * Handles automatic business day closing based on configured business hours.
 * Supports overnight business days (e.g., 10 PM to 4 AM for hospitality venues).
 * 
 * Uses Europe/Berlin timezone for scheduling.
 */

import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../prisma';
import { createDailyClosing } from './dailyClosingService';
import { getBusinessDayRange, parseTimeString } from '../utils/businessDay';
import { logInfo, logError } from '../utils/logger';

// Scheduler state
let scheduledJob: ScheduledTask | null = null;
let isClosingInProgress = false;
let lastCloseTime: Date | null = null;

// Timezone for scheduling
const TIMEZONE = 'Europe/Berlin';

/**
 * Initialize the business day scheduler
 * Should be called when the server starts
 */
export function initializeScheduler(): void {
  logInfo('Initializing business day scheduler...');
  
  // Schedule a check every minute
  scheduledJob = cron.schedule('* * * * *', async () => {
    await checkAndPerformAutoClose();
  }, {
    timezone: TIMEZONE
  });
  
  logInfo('Business day scheduler initialized (checking every minute)');
}

/**
 * Stop the scheduler
 * Should be called during graceful shutdown
 */
export function stopScheduler(): void {
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
    logInfo('Business day scheduler stopped');
  }
}

/**
 * Get the current status of the scheduler
 */
export function getSchedulerStatus(): {
  isRunning: boolean;
  isClosingInProgress: boolean;
  lastCloseTime: Date | null;
  autoCloseEnabled: boolean;
  businessDayEndHour: string;
  nextScheduledClose: Date | null;
} {
  // Calculate next scheduled close time
  let nextScheduledClose: Date | null = null;
  
  if (scheduledJob) {
    const now = new Date();
    const settings = getSettingsSync();
    
    if (settings && settings.autoCloseEnabled) {
      const { hours, minutes } = parseTimeString(settings.businessDayEndHour);
      
      // Create a date for today's scheduled close time
      nextScheduledClose = new Date(now);
      nextScheduledClose.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, it's scheduled for tomorrow
      if (nextScheduledClose <= now) {
        nextScheduledClose.setDate(nextScheduledClose.getDate() + 1);
      }
    }
  }
  
  const settings = getSettingsSync();
  
  return {
    isRunning: scheduledJob !== null,
    isClosingInProgress,
    lastCloseTime,
    autoCloseEnabled: settings?.autoCloseEnabled ?? false,
    businessDayEndHour: settings?.businessDayEndHour ?? '06:00',
    nextScheduledClose
  };
}

// Cache for settings to avoid repeated database queries
let settingsCache: {
  autoCloseEnabled: boolean;
  businessDayEndHour: string;
} | null = null;
let settingsCacheTime: number = 0;
const SETTINGS_CACHE_TTL = 60000; // 1 minute cache

/**
 * Get settings with caching
 */
function getSettingsSync(): { autoCloseEnabled: boolean; businessDayEndHour: string } | null {
  return settingsCache;
}

/**
 * Get settings from database with caching
 */
async function getSettings(): Promise<{ 
  autoCloseEnabled: boolean; 
  businessDayEndHour: string;
  autoStartTime: string;
} | null> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (settingsCache && (now - settingsCacheTime) < SETTINGS_CACHE_TTL) {
    return {
      ...settingsCache,
      autoStartTime: '06:00' // Default, not cached
    };
  }
  
  const settings = await prisma.settings.findFirst();
  
  if (settings) {
    settingsCache = {
      autoCloseEnabled: settings.autoCloseEnabled ?? false,
      businessDayEndHour: settings.businessDayEndHour ?? '06:00'
    };
    settingsCacheTime = now;
    
    return {
      ...settingsCache,
      autoStartTime: settings.autoStartTime
    };
  }
  
  return null;
}

/**
 * Clear the settings cache
 * Should be called when settings are updated
 */
export function clearSettingsCache(): void {
  settingsCache = null;
  settingsCacheTime = 0;
  logInfo('Settings cache cleared');
}

/**
 * Check if auto-close should be performed and execute it
 */
async function checkAndPerformAutoClose(): Promise<void> {
  // Prevent concurrent closing operations
  if (isClosingInProgress) {
    return;
  }
  
  try {
    const settings = await getSettings();
    
    // If auto-close is disabled, nothing to do
    if (!settings || !settings.autoCloseEnabled) {
      return;
    }
    
    const now = new Date();
    const { hours, minutes } = parseTimeString(settings.businessDayEndHour);
    
    // Check if current time matches the scheduled close time (within 1 minute)
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    
    if (currentHours === hours && currentMinutes === minutes) {
      // Check if we already closed in the last minute to prevent duplicates
      if (lastCloseTime && (now.getTime() - lastCloseTime.getTime()) < 60000) {
        logInfo('Skipping auto-close - already closed within the last minute');
        return;
      }
      
      await performAutomaticClosing(settings.autoStartTime, settings.businessDayEndHour);
    }
  } catch (error) {
    logError(error instanceof Error ? error : 'Error in auto-close check');
  }
}

/**
 * Perform the automatic business day closing
 */
async function performAutomaticClosing(autoStartTime: string, businessDayEndHour: string): Promise<void> {
  isClosingInProgress = true;
  
  try {
    logInfo('Starting automatic business day closing...');
    
    // Get the business day range that just ended
    const now = new Date();
    const config = {
      autoStartTime,
      businessDayEndHour
    };
    
    // Calculate the business day range
    // The closing is for the business day that just ended
    // We need to get the range for the previous business day
    const { hours: endHours, minutes: endMinutes } = parseTimeString(businessDayEndHour);
    const { hours: startHours, minutes: startMinutes } = parseTimeString(autoStartTime);
    
    // Determine which business day just ended
    // If end time is before start time (overnight), the business day started yesterday
    let businessDayStart: Date;
    
    if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
      // Overnight business day - started yesterday
      businessDayStart = new Date(now);
      businessDayStart.setDate(businessDayStart.getDate() - 1);
      businessDayStart.setHours(startHours, startMinutes, 0, 0);
    } else {
      // Same-day business day - started today
      businessDayStart = new Date(now);
      businessDayStart.setHours(startHours, startMinutes, 0, 0);
    }
    
    // The end time is now
    const businessDayEnd = new Date(now);
    
    logInfo(`Closing business day from ${businessDayStart.toISOString()} to ${businessDayEnd.toISOString()}`);
    
    // Get or create a system user for automatic closings
    let systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });
    
    if (!systemUser) {
      // Find any admin user to attribute the closing to
      const adminUser = await prisma.user.findFirst({
        where: { role: 'Admin' }
      });
      
      if (!adminUser) {
        logError('No admin user found for automatic closing');
        return;
      }
      
      systemUser = adminUser;
    }
    
    // Create the daily closing
    const closingId = await createDailyClosing(
      businessDayEnd,
      systemUser.id,
      businessDayStart
    );
    
    lastCloseTime = new Date();
    
    logInfo(`Automatic business day closing completed. Closing ID: ${closingId}`);
    
    // Update lastManualClose to track this closing
    await prisma.settings.updateMany({
      data: {
        lastManualClose: lastCloseTime
      }
    });
    
  } catch (error) {
    logError(error instanceof Error ? error : 'Error during automatic closing');
  } finally {
    isClosingInProgress = false;
  }
}

/**
 * Force an immediate business day close
 * Used for testing or manual intervention
 */
export async function forceBusinessDayClose(): Promise<number | null> {
  if (isClosingInProgress) {
    logInfo('Cannot force close - closing already in progress');
    return null;
  }
  
  const settings = await getSettings();
  
  if (!settings) {
    logError('No settings found for forced closing');
    return null;
  }
  
  await performAutomaticClosing(settings.autoStartTime, settings.businessDayEndHour);
  
  return lastCloseTime?.getTime() ?? null;
}

export default {
  initializeScheduler,
  stopScheduler,
  getSchedulerStatus,
  clearSettingsCache,
  forceBusinessDayClose
};
