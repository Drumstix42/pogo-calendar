import dayjs from 'dayjs';

import { DATE_FORMAT } from './dateFormat';
import { parseEventDate } from './eventDate';
import { formatEventName, getSmartGroupDisplayName } from './eventName';
import { getRaidSubType, isEventWithSubtype } from './eventSubtype';
import { type PogoEvent, getEventTypeInfo } from './eventTypes';

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

/**
 * Collapses identical events (same type + start + end, accounting for raid subtypes) into a single
 * representative carrying `_isGrouped`/`_groupedEvents`/`_displayName`. Returns events as-is when
 * grouping is disabled. Pure: the `groupSimilarEvents` setting is passed in by the events store.
 */
export function groupEventsBySimilarity(events: PogoEvent[], enabled: boolean): PogoEvent[] {
    if (!enabled) {
        return events; // No grouping - return events as-is
    }

    // Group events by: eventType + start + end (accounting for raid subtypes)
    const eventGroups = new Map<string, PogoEvent[]>();

    events.forEach(event => {
        // Create more specific grouping key for events with subtypes
        let groupingType = event.eventType;
        if (isEventWithSubtype(event.eventType)) {
            const raidSubType = getRaidSubType(event);
            if (raidSubType) {
                groupingType = raidSubType;
            }
        }

        const timeKey = `${groupingType}:${event.start}:${event.end}`;
        if (!eventGroups.has(timeKey)) {
            eventGroups.set(timeKey, []);
        }
        eventGroups.get(timeKey)!.push(event);
    });

    // Convert groups to representative events
    return Array.from(eventGroups.values()).map(group => {
        if (group.length === 1) {
            return group[0]; // Single event - no grouping needed
        }

        // Multiple identical events - create grouped representative
        // Sort the group to ensure consistent representative selection
        const sortedGroup = [...group].sort((a, b) => {
            // First by event type priority
            const aPriority = getEventTypeInfo(a.eventType).priority;
            const bPriority = getEventTypeInfo(b.eventType).priority;
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }

            // Then by extraData richness (more keys = more complete event data)
            const aDataCount = a.extraData ? Object.keys(a.extraData).length : 0;
            const bDataCount = b.extraData ? Object.keys(b.extraData).length : 0;
            if (aDataCount !== bDataCount) {
                return bDataCount - aDataCount; // More data first
            }

            // Finally by event name for consistency
            return formatEventName(a.name).localeCompare(formatEventName(b.name));
        });

        const representative = { ...sortedGroup[0] };
        representative._isGrouped = true;
        representative._groupedEvents = sortedGroup;
        representative._displayName = getSmartGroupDisplayName(sortedGroup);

        return representative;
    });
}

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
