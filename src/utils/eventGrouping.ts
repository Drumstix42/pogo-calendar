import dayjs from 'dayjs';

import { DATE_FORMAT } from './dateFormat';
import { parseEventDate } from './eventDate';
import { type PogoEvent } from './eventTypes';

export const getGroupedEvents = (event: PogoEvent, options?: { limit?: number }): PogoEvent[] => {
    const groupedEvents = event._groupedEvents || [event];

    if (options?.limit && options.limit > 0) {
        return groupedEvents.slice(0, options.limit);
    }

    return groupedEvents;
};

export const hasGroupedEvents = (event: PogoEvent): boolean => {
    return event._isGrouped === true;
};

export const getGroupedEventsCount = (event: PogoEvent): number => {
    const groupedEvents = event._groupedEvents;
    return Array.isArray(groupedEvents) ? groupedEvents.length : 1;
};

export const getEventsForDate = (events: PogoEvent[], date: Date | string | dayjs.Dayjs, manualOffsetHours: number = 0): PogoEvent[] => {
    const targetDate = dayjs(date);
    const targetDateStr = targetDate.format(DATE_FORMAT.CALENDAR_DATE);

    return events.filter((event: PogoEvent) => {
        if (!event.start || !event.end) return false;

        const startDate = parseEventDate(event.start, manualOffsetHours);
        const endDate = parseEventDate(event.end, manualOffsetHours);

        const startDateStr = startDate.format(DATE_FORMAT.CALENDAR_DATE);
        const endDateStr = endDate.format(DATE_FORMAT.CALENDAR_DATE);

        return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
    });
};
