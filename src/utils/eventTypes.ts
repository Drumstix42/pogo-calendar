import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { DATE_FORMAT } from './dateFormat';

dayjs.extend(utc);

export interface EventTypeInfo {
    name: string;
    color: string;
    priority: number;
    category: 'community-and-raids' | 'research' | 'seasonal-premium' | 'misc-and-events';
}

export interface PogoEvent {
    eventID: string;
    name: string;
    eventType: string;
    heading: string;
    link: string;
    image: string;
    start: string;
    end: string;
    extraData?: {
        generic?: {
            hasSpawns: boolean;
            hasFieldResearchTasks: boolean;
        };
        [key: string]: any;
    };
}

export const EVENT_TYPES: Record<string, EventTypeInfo> = {
    // Community & Social Events
    'community-day': {
        name: 'Community Day',
        color: '#1660a9', // blue
        priority: 88,
        category: 'community-and-raids',
    },
    'pokemon-spotlight-hour': {
        name: 'Spotlight Hour',
        color: '#ae6318', // orange
        priority: 63,
        category: 'community-and-raids',
    },

    // Raid Events
    'raid-hour': {
        name: 'Raid Hour',
        color: '#c0392b', // red
        priority: 68,
        category: 'community-and-raids',
    },
    'raid-day': {
        name: 'Raid Day',
        color: '#cf4435', // red
        priority: 78,
        category: 'community-and-raids',
    },
    'raid-weekend': {
        name: 'Raid Weekend',
        color: '#6f1e51', // purple-red
        priority: 77,
        category: 'community-and-raids',
    },
    'raid-battles': {
        name: 'Raid Battles',
        color: '#c0392b', // red
        priority: 54,
        category: 'community-and-raids',
    },
    'elite-raids': {
        name: 'Elite Raids',
        color: '#a21416', // dark red
        priority: 86,
        category: 'community-and-raids',
    },

    // Max Battles (New system)
    'max-battles': {
        name: 'Max Battles',
        color: '#811356', // purple
        priority: 67,
        category: 'community-and-raids',
    },
    'max-mondays': {
        name: 'Max Monday',
        color: '#690342', // darker purple
        priority: 65,
        category: 'community-and-raids',
    },

    // Research Events
    research: {
        name: 'Research',
        color: '#12836d', // teal
        priority: 51,
        category: 'research',
    },
    'research-day': {
        name: 'Research Day',
        color: '#11866f', // teal
        priority: 76,
        category: 'research',
    },
    'timed-research': {
        name: 'Timed Research',
        color: '#12836d', // teal
        priority: 50,
        category: 'research',
    },
    'limited-research': {
        name: 'Limited Research',
        color: '#11866f', // teal
        priority: 49,
        category: 'research',
    },
    'special-research': {
        name: 'Special Research',
        color: '#0f806a', // blue-teal
        priority: 72,
        category: 'research',
    },
    'research-breakthrough': {
        name: 'Research Breakthrough',
        color: '#795548', // brown
        priority: 48,
        category: 'research',
    },

    // Major Events
    'pokemon-go-fest': {
        name: 'Pokemon GO Fest',
        color: '#153d94', // dark blue
        priority: 94,
        category: 'seasonal-premium',
    },
    'pokemon-go-tour': {
        name: 'Pokemon GO Tour',
        color: '#1d3a74', // darker blue
        priority: 93,
        category: 'seasonal-premium',
    },
    'safari-zone': {
        name: 'Safari Zone',
        color: '#3d7141', // green
        priority: 87,
        category: 'seasonal-premium',
    },
    'ticketed-event': {
        name: 'Ticketed Event',
        color: '#c7378b', // pink
        priority: 90,
        category: 'seasonal-premium',
    },

    // Regular Events
    event: {
        name: 'Event',
        color: '#1d8247', // green
        priority: 58,
        category: 'misc-and-events',
    },
    'live-event': {
        name: 'Live Event',
        color: '#d63031', // red
        priority: 75,
        category: 'misc-and-events',
    },
    'location-specific': {
        name: 'Location Specific',
        color: '#284b92', // blue
        priority: 45,
        category: 'misc-and-events',
    },
    'bonus-hour': {
        name: 'Bonus Hour',
        color: '#40407a', // purple-blue
        priority: 62,
        category: 'misc-and-events',
    },

    // Battle Events
    'go-battle-league': {
        name: 'GO Battle League',
        color: '#8e44ad', // purple
        priority: 56,
        category: 'community-and-raids',
    },

    // Team Rocket
    'go-rocket-takeover': {
        name: 'Team GO Rocket Takeover',
        color: '#1e1e1e', // dark
        priority: 84,
        category: 'misc-and-events',
    },
    'team-go-rocket': {
        name: 'Team GO Rocket',
        color: '#1e1e1e', // dark
        priority: 55,
        category: 'misc-and-events',
    },
    'giovanni-special-research': {
        name: 'Giovanni Special Research',
        color: '#1e272e', // very dark
        priority: 71,
        category: 'research',
    },

    // Showcases & Competitions
    'pokestop-showcase': {
        name: 'PokéStop Showcase',
        color: '#2f8274', // teal-green
        priority: 52,
        category: 'misc-and-events',
    },
    'global-challenge': {
        name: 'Global Challenge',
        color: '#0a64b5', // blue
        priority: 82,
        category: 'seasonal-premium',
    },

    // System/Meta
    season: {
        name: 'Season',
        color: '#29817e', // teal
        priority: 100,
        category: 'seasonal-premium',
    },
    update: {
        name: 'Update',
        color: '#2679af', // blue
        priority: 10,
        category: 'misc-and-events',
    },
    'potential-ultra-unlock': {
        name: 'Potential Ultra Unlock',
        color: '#2c3e50', // dark blue-grey
        priority: 42,
        category: 'misc-and-events',
    },
    'go-pass': {
        name: 'GO Pass',
        color: '#896e17', // yellow/gold
        priority: 95,
        category: 'seasonal-premium',
    },
};

// Type for valid event type keys
export type EventTypeKey = keyof typeof EVENT_TYPES;

export const getEventTypeInfo = (eventType: string): EventTypeInfo => {
    return (
        EVENT_TYPES[eventType] || {
            name: eventType.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            color: '#757575', // Default grey
            priority: 5,
        }
    );
};

// Sort events by priority (higher number = higher priority)
export const sortEventsByPriority = (events: PogoEvent[]): PogoEvent[] => {
    return events.sort((a: PogoEvent, b: PogoEvent) => {
        const aPriority = getEventTypeInfo(a.eventType).priority;
        const bPriority = getEventTypeInfo(b.eventType).priority;
        return bPriority - aPriority;
    });
};

// Event display types
export interface EventGroup {
    eventType: string;
    events: PogoEvent[];
    displayName: string;
    color: string;
    isMultiDay: boolean;
    startDate: dayjs.Dayjs;
    endDate: dayjs.Dayjs;
}

export interface CalendarEventDisplay {
    singleDayEvents: PogoEvent[];
    multiDayEvents: PogoEvent[];
    eventGroups: EventGroup[];
}

// Event classification utilities
export const isMultiDayEvent = (event: PogoEvent): boolean => {
    const startDate = parseEventDate(event.start).startOf('day');
    const endDate = parseEventDate(event.end).startOf('day');
    return !startDate.isSame(endDate, 'day');
};

export const isSameDayEvent = (event: PogoEvent): boolean => {
    return !isMultiDayEvent(event);
};

// Event grouping for events that occur at the same time
export const shouldGroupEvents = (events: PogoEvent[]): boolean => {
    // Only group if there are 2 or more events
    if (events.length < 2) return false;

    // For single-day events, only group if they have identical start AND end times
    const firstEvent = events[0];
    if (isSameDayEvent(firstEvent)) {
        const firstStartTime = parseEventDate(firstEvent.start);
        const firstEndTime = parseEventDate(firstEvent.end);
        return events.every(event => {
            const eventStartTime = parseEventDate(event.start);
            const eventEndTime = parseEventDate(event.end);
            return isSameDayEvent(event) && firstStartTime.isSame(eventStartTime, 'minute') && firstEndTime.isSame(eventEndTime, 'minute');
        });
    }

    // For multi-day events, group if they have identical start AND end times
    const firstEventType = firstEvent.eventType;
    const firstStartTime = parseEventDate(firstEvent.start);
    const firstEndTime = parseEventDate(firstEvent.end);
    return events.every(event => {
        const eventStartTime = parseEventDate(event.start);
        const eventEndTime = parseEventDate(event.end);
        return (
            event.eventType === firstEventType &&
            isMultiDayEvent(event) &&
            firstStartTime.isSame(eventStartTime, 'minute') &&
            firstEndTime.isSame(eventEndTime, 'minute')
        );
    });
};

export const groupEventsByType = (events: PogoEvent[]): EventGroup[] => {
    const groups = new Map<string, PogoEvent[]>();

    // First, group by event type
    events.forEach(event => {
        if (!groups.has(event.eventType)) {
            groups.set(event.eventType, []);
        }
        groups.get(event.eventType)!.push(event);
    });

    const result: EventGroup[] = [];

    // Then, within each type, group by timing
    groups.forEach((typeEvents, eventType) => {
        if (typeEvents.length === 1) {
            // Single event, no grouping needed
            const event = typeEvents[0];
            result.push({
                eventType,
                events: [event],
                displayName: event.name, // Use actual event name for single events
                color: getEventTypeInfo(eventType).color,
                isMultiDay: isMultiDayEvent(event),
                startDate: parseEventDate(event.start),
                endDate: parseEventDate(event.end),
            });
        } else {
            // Multiple events of same type - group by timing
            const sortedEvents = typeEvents.sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());

            // For single-day events, group by exact start AND end time
            if (isSameDayEvent(sortedEvents[0])) {
                const timeGroups = new Map<string, PogoEvent[]>();

                sortedEvents.forEach(event => {
                    const startTime = parseEventDate(event.start).format('YYYY-MM-DD HH:mm');
                    const endTime = parseEventDate(event.end).format('YYYY-MM-DD HH:mm');
                    const timeKey = `${startTime}_${endTime}`;
                    if (!timeGroups.has(timeKey)) {
                        timeGroups.set(timeKey, []);
                    }
                    timeGroups.get(timeKey)!.push(event);
                });

                timeGroups.forEach(timeEvents => {
                    if (timeEvents.length === 1) {
                        // Single event at this time
                        const event = timeEvents[0];
                        result.push({
                            eventType,
                            events: [event],
                            displayName: event.name,
                            color: getEventTypeInfo(eventType).color,
                            isMultiDay: false,
                            startDate: parseEventDate(event.start),
                            endDate: parseEventDate(event.end),
                        });
                    } else {
                        // Multiple events at same time - group them
                        result.push({
                            eventType,
                            events: timeEvents,
                            displayName: getEventTypeInfo(eventType).name, // Use type name for grouped events
                            color: getEventTypeInfo(eventType).color,
                            isMultiDay: false,
                            startDate: parseEventDate(timeEvents[0].start),
                            endDate: parseEventDate(timeEvents[timeEvents.length - 1].end),
                        });
                    }
                });
            } else {
                // For multi-day events, group by exact start AND end time (same as single-day)
                const timeGroups = new Map<string, PogoEvent[]>();

                sortedEvents.forEach(event => {
                    const startTime = parseEventDate(event.start).format('YYYY-MM-DD HH:mm');
                    const endTime = parseEventDate(event.end).format('YYYY-MM-DD HH:mm');
                    const timeKey = `${startTime}_${endTime}`;
                    if (!timeGroups.has(timeKey)) {
                        timeGroups.set(timeKey, []);
                    }
                    timeGroups.get(timeKey)!.push(event);
                });

                timeGroups.forEach(timeEvents => {
                    if (timeEvents.length === 1) {
                        // Single event at this time
                        const event = timeEvents[0];
                        result.push({
                            eventType,
                            events: [event],
                            displayName: event.name,
                            color: getEventTypeInfo(eventType).color,
                            isMultiDay: true,
                            startDate: parseEventDate(event.start),
                            endDate: parseEventDate(event.end),
                        });
                    } else {
                        // Multiple events at same time - group them
                        result.push({
                            eventType,
                            events: timeEvents,
                            displayName: getEventTypeInfo(eventType).name, // Use type name for grouped events
                            color: getEventTypeInfo(eventType).color,
                            isMultiDay: true,
                            startDate: parseEventDate(timeEvents[0].start),
                            endDate: parseEventDate(timeEvents[timeEvents.length - 1].end),
                        });
                    }
                });
            }
        }
    });

    return result;
};

// Helper function to parse dates consistently
export const parseEventDate = (dateStr: string): dayjs.Dayjs => {
    // Check if the date string is in UTC format (ends with Z)
    if (dateStr.endsWith('Z')) {
        return dayjs.utc(dateStr).local();
    }
    // If not UTC, treat as local time
    return dayjs(dateStr);
};

export const formatEventTime = (dateStr: string): string => {
    return parseEventDate(dateStr).format('ha');
};

export const getEventsForDate = (events: PogoEvent[], date: Date | string | dayjs.Dayjs): PogoEvent[] => {
    const targetDate = dayjs(date);
    const targetDateStr = targetDate.format(DATE_FORMAT.CALENDAR_DATE);

    return events.filter((event: PogoEvent) => {
        if (!event.start || !event.end) return false;

        const startDate = parseEventDate(event.start);
        const endDate = parseEventDate(event.end);

        const startDateStr = startDate.format(DATE_FORMAT.CALENDAR_DATE);
        const endDateStr = endDate.format(DATE_FORMAT.CALENDAR_DATE);

        return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
    });
};

// Get events organized for calendar display
export const getCalendarEventsForDate = (events: PogoEvent[], date: Date | string | dayjs.Dayjs): CalendarEventDisplay => {
    const eventsForDate = getEventsForDate(events, date);

    // Group all events by type first, then apply intelligent grouping
    const eventGroups = groupEventsByType(eventsForDate);

    // Separate individual events from grouped events
    const singleDayEvents: PogoEvent[] = [];
    const multiDayEvents: PogoEvent[] = [];
    const groupedEvents: EventGroup[] = [];

    eventGroups.forEach(group => {
        if (group.events.length === 1) {
            // Single event - add to appropriate category
            const event = group.events[0];
            if (isSameDayEvent(event)) {
                singleDayEvents.push(event);
            } else {
                multiDayEvents.push(event);
            }
        } else {
            // Multiple events - this is a true group
            groupedEvents.push(group);
        }
    });

    return {
        singleDayEvents: sortEventsByPriority(singleDayEvents),
        multiDayEvents: sortEventsByPriority(multiDayEvents),
        eventGroups: groupedEvents,
    };
};
