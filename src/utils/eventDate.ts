import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type { PogoEvent } from './eventTypes';

dayjs.extend(utc);

export const parseEventDate = (dateStr: string, manualOffsetHours: number = 0): dayjs.Dayjs => {
    // Check if the date string is in UTC format (ends with Z)
    let parsedDate: dayjs.Dayjs;
    if (dateStr.endsWith('Z')) {
        parsedDate = dayjs.utc(dateStr).local();
    } else {
        // If not UTC, treat as local time
        parsedDate = dayjs(dateStr);
    }

    if (manualOffsetHours === 0) {
        return parsedDate;
    }

    return parsedDate.add(manualOffsetHours * 60, 'minute');
};

export const formatEventTime = (dateStr: string, manualOffsetHours: number = 0): string => {
    const eventDate = parseEventDate(dateStr, manualOffsetHours);
    const minutes = eventDate.minute();

    // Only show minutes if they're not zero
    if (minutes === 0) {
        return eventDate.format('ha');
    } else {
        return eventDate.format('h:mma');
    }
};

// Event classification utilities
export const isMultiDayEvent = (event: PogoEvent): boolean => {
    const startDate = parseEventDate(event.start).startOf('day');
    const endDate = parseEventDate(event.end).startOf('day');
    return !startDate.isSame(endDate, 'day');
};

export const isSameDayEvent = (event: PogoEvent): boolean => {
    return !isMultiDayEvent(event);
};
