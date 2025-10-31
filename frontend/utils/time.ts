

import type { Settings } from '../../shared/types';

/**
 * Calculates the exact start time of the current business day.
 * It considers the automatic daily cutoff time and the last manual day closure,
 * returning whichever is more recent.
 * @param settings The application's settings object.
 * @returns A Date object representing the start of the current business day.
 */
export const getBusinessDayStart = (settings: Settings): Date => {
    const now = new Date();
    const [hours, minutes] = settings.businessDay.autoStartTime.split(':').map(Number);

    const todayAtCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
    
    let mostRecentAutoCutoff: Date;
    if (now >= todayAtCutoff) {
        // If we are past today's cutoff time, the business day started today.
        mostRecentAutoCutoff = todayAtCutoff;
    } else {
        // If we are before today's cutoff, the business day started yesterday.
        const yesterdayAtCutoff = new Date(todayAtCutoff);
        yesterdayAtCutoff.setDate(yesterdayAtCutoff.getDate() - 1);
        mostRecentAutoCutoff = yesterdayAtCutoff;
    }

    if (settings.businessDay.lastManualClose) {
        const lastManualCloseDate = new Date(settings.businessDay.lastManualClose);
        // Return the more recent of the two dates
        return lastManualCloseDate > mostRecentAutoCutoff ? lastManualCloseDate : mostRecentAutoCutoff;
    }

    return mostRecentAutoCutoff;
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