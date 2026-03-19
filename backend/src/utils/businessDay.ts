/**
* Business Day Utility Functions
*
* Handles the logic for business days that can cross midnight.
* The business day is defined by businessDayEndHour - the time when one
* business day ends and the next begins.
*
* Example: If businessDayEndHour is "05:00":
*   - A transaction at 04:00 AM on Wednesday belongs to Tuesday's business day
*   - A transaction at 06:00 AM on Wednesday belongs to Wednesday's business day
*   - Wednesday's business day runs from 05:00 AM Wednesday to 05:00 AM Thursday
*/

export interface BusinessDayConfig {
  autoStartTime: string; // Format: "HH:MM" - legacy field, kept for backwards compatibility
  businessDayEndHour?: string; // Format: "HH:MM" - when business day ends and next begins
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
 * The business day starts at businessDayEndHour (when the previous day ends).
 * Example: If businessDayEndHour is "05:00", Wednesday's business day runs from
 * 05:00 AM Wednesday to 05:00 AM Thursday.
 *
 * @param date - The date to calculate business day for
 * @param config - Business day configuration
 * @returns The start and end dates of the business day
 */
export function getBusinessDayRange(
  date: Date,
  config: BusinessDayConfig
): BusinessDayRange {
  // The business day starts at businessDayEndHour (when previous day ends)
  // Default to autoStartTime if businessDayEndHour is not set (24-hour business day)
  const startTimeStr = config.businessDayEndHour || config.autoStartTime;
  const { hours: startHours, minutes: startMinutes } = parseTimeString(startTimeStr);

  // The business day ends at the same time on the next calendar day
  const endHours = startHours;
  const endMinutes = startMinutes;

  // Create start of business day
  const start = new Date(date);
  start.setHours(startHours, startMinutes, 0, 0);

  // Create end of business day (always next calendar day)
  const end = new Date(date);
  end.setDate(end.getDate() + 1);
  end.setHours(endHours, endMinutes, 59, 999);

  return { start, end };
}

/**
 * Gets the business day for a specific transaction timestamp
 *
 * The business day starts at businessDayEndHour (when the previous day ends).
 * Example: If businessDayEndHour is "05:00":
 *   - A transaction at 04:00 AM on Wednesday belongs to Tuesday's business day
 *   - A transaction at 06:00 AM on Wednesday belongs to Wednesday's business day
 *
 * @param timestamp - The transaction timestamp
 * @param config - Business day configuration
 * @returns The business day start date (used as the business day identifier)
 */
export function getTransactionBusinessDay(
  timestamp: Date,
  config: BusinessDayConfig
): Date {
  // The business day starts at businessDayEndHour (when previous day ends)
  // Default to autoStartTime if businessDayEndHour is not set (24-hour business day)
  const startTimeStr = config.businessDayEndHour || config.autoStartTime;
  const { hours: startHours, minutes: startMinutes } = parseTimeString(startTimeStr);

  const transactionDate = new Date(timestamp);

  // Business day start for the same calendar day
  const sameDayStart = new Date(transactionDate);
  sameDayStart.setHours(startHours, startMinutes, 0, 0);

  // Business day start for the previous calendar day
  const prevDayStart = new Date(transactionDate);
  prevDayStart.setDate(prevDayStart.getDate() - 1);
  prevDayStart.setHours(startHours, startMinutes, 0, 0);

  // If transaction is before today's business day start (businessDayEndHour),
  // it belongs to yesterday's business day
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
 *
 * Since the business day is defined by businessDayEndHour as both start and end
 * (start at businessDayEndHour, end at businessDayEndHour next day), a business
 * day is always 24 hours.
 *
 * @param autoStartTime - Legacy parameter, kept for backwards compatibility
 * @param businessDayEndHour - The business day cutoff time
 * @returns Always returns 24 (hours in a business day)
 */
export function getHoursInBusinessDay(
  autoStartTime: string,
  businessDayEndHour?: string
): number {
  // Business day is always 24 hours: from businessDayEndHour to businessDayEndHour next day
  // The parameters are kept for backwards compatibility but not used in the calculation
  return 24;
}
