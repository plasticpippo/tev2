/**
 * Business Day Utility Functions
 * 
 * Handles the logic for business days that can cross midnight.
 * Example: A bar open from 22:00 to 05:00 has a "business day" that spans
 * two calendar days. Transactions at 02:00 on Wednesday belong to Tuesday's
 * business day.
 */

export interface BusinessDayConfig {
  autoStartTime: string;      // Format: "HH:MM" - when business day starts
  businessDayEndHour?: string; // Format: "HH:MM" - when business day ends
}

export interface BusinessDayRange {
  start: Date;
  end: Date;
}

/**
 * Parses a time string "HH:MM" into hours and minutes
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

/**
 * Calculates the business day range for a given date
 * 
 * @param date - The date to calculate business day for
 * @param config - Business day configuration
 * @returns The start and end dates of the business day
 */
export function getBusinessDayRange(
  date: Date, 
  config: BusinessDayConfig
): BusinessDayRange {
  const { hours: startHours, minutes: startMinutes } = parseTimeString(config.autoStartTime);
  
  // Default end hour is the same as start (24-hour business day)
  // If businessDayEndHour is provided, use that; otherwise use start time
  const endTimeStr = config.businessDayEndHour || config.autoStartTime;
  const { hours: endHours, minutes: endMinutes } = parseTimeString(endTimeStr);
  
  // Create start of business day
  const start = new Date(date);
  start.setHours(startHours, startMinutes, 0, 0);
  
  // Create end of business day
  // If end hour is less than start hour, it means the business day crosses midnight
  const end = new Date(date);
  if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
    // Business day ends on the next calendar day
    end.setDate(end.getDate() + 1);
  }
  end.setHours(endHours, endMinutes, 59, 999);
  
  return { start, end };
}

/**
 * Gets the business day for a specific transaction timestamp
 * 
 * @param timestamp - The transaction timestamp
 * @param config - Business day configuration
 * @returns The business day start date (used as the business day identifier)
 */
export function getTransactionBusinessDay(
  timestamp: Date, 
  config: BusinessDayConfig
): Date {
  const { hours: startHours, minutes: startMinutes } = parseTimeString(config.autoStartTime);
  
  // Create the potential business day starts
  const transactionDate = new Date(timestamp);
  
  // Business day start for the same calendar day
  const sameDayStart = new Date(transactionDate);
  sameDayStart.setHours(startHours, startMinutes, 0, 0);
  
  // Business day start for the previous calendar day
  const prevDayStart = new Date(transactionDate);
  prevDayStart.setDate(prevDayStart.getDate() - 1);
  prevDayStart.setHours(startHours, startMinutes, 0, 0);
  
  // If transaction is before today's business day start, it belongs to yesterday's business day
  if (transactionDate < sameDayStart) {
    return prevDayStart;
  }
  
  return sameDayStart;
}

/**
 * Gets all business day ranges within a date range
 * Useful for generating comparison data
 */
export function getBusinessDaysInRange(
  startDate: Date, 
  endDate: Date, 
  config: BusinessDayConfig
): BusinessDayRange[] {
  const ranges: BusinessDayRange[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    ranges.push(getBusinessDayRange(current, config));
    current.setDate(current.getDate() + 1);
  }
  
  return ranges;
}

/**
 * Calculate the number of hours in a business day
 */
export function getHoursInBusinessDay(
  autoStartTime: string,
  businessDayEndHour?: string
): number {
  const { hours: startHours } = parseTimeString(autoStartTime);
  const endTimeStr = businessDayEndHour || autoStartTime;
  const { hours: endHours } = parseTimeString(endTimeStr);
  
  let hoursInDay = endHours - startHours;
  if (hoursInDay <= 0) {
    hoursInDay += 24; // Crosses midnight
  }
  
  return hoursInDay;
}
