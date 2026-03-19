

import type { Settings } from '@shared/types';

/**
 * Calculates the exact start time of the current business day.
 * The business day starts when the previous day ends, defined by businessDayEndHour.
 * For example, if businessDayEndHour is "05:00":
 *   - At 04:00 AM on Wednesday, we're still in Tuesday's business day
 *   - At 06:00 AM on Wednesday, we're in Wednesday's business day
 * It also considers the last manual day closure, returning whichever is more recent.
 * @param settings The application's settings object.
 * @returns A Date object representing the start of the current business day.
 */
export const getBusinessDayStart = (settings: Settings): Date => {
  const now = new Date();
  const [hours, minutes] = settings.businessDay.businessDayEndHour.split(':').map(Number);

  const todayAtEndHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  let mostRecentBusinessDayStart: Date;
  if (now >= todayAtEndHour) {
    // If we are at or after today's businessDayEndHour, the new business day started today at that time.
    mostRecentBusinessDayStart = todayAtEndHour;
  } else {
    // If we are before today's businessDayEndHour, we're still in the previous business day.
    // The current business day started yesterday at businessDayEndHour.
    const yesterdayAtEndHour = new Date(todayAtEndHour);
    yesterdayAtEndHour.setDate(yesterdayAtEndHour.getDate() - 1);
    mostRecentBusinessDayStart = yesterdayAtEndHour;
  }

  if (settings.businessDay.lastManualClose) {
    const lastManualCloseDate = new Date(settings.businessDay.lastManualClose);
    // Return the more recent of the two dates
    return lastManualCloseDate > mostRecentBusinessDayStart ? lastManualCloseDate : mostRecentBusinessDayStart;
  }

  return mostRecentBusinessDayStart;
};

/**
 * Checks if a given date string falls within the current business day.
 * @param dateString The ISO date string to check.
 * @param businessDayStart The start date of the current business day.
 * @returns True if the date is on or after the business day start, false otherwise.
 */
export const isWithinBusinessDay = (dateString: string, businessDayStart: Date): boolean => {
    const date = new Date(dateString);
    return date >= businessDayStart;
};