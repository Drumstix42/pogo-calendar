import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { DATE_FORMAT } from './dateFormat';

dayjs.extend(utc);

export interface EventTypeInfo {
    name: string;
    color: string;
    bgColor: string;
    priority: number;
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
        bgColor: '#e3f2fd',
        priority: 10,
    },
    'pokemon-spotlight-hour': {
        name: 'Spotlight Hour',
        color: '#e58e26', // orange
        bgColor: '#fff3e0',
        priority: 7,
    },

    // Raid Events
    'raid-hour': {
        name: 'Raid Hour',
        color: '#c0392b', // red
        bgColor: '#ffebee',
        priority: 8,
    },
    'raid-day': {
        name: 'Raid Day',
        color: '#e74c3c', // bright red
        bgColor: '#ffebee',
        priority: 9,
    },
    'raid-weekend': {
        name: 'Raid Weekend',
        color: '#6f1e51', // purple-red
        bgColor: '#fce4ec',
        priority: 9,
    },
    'raid-battles': {
        name: 'Raid Battles',
        color: '#c0392b', // red
        bgColor: '#ffebee',
        priority: 6,
    },
    'elite-raids': {
        name: 'Elite Raids',
        color: '#a21416', // dark red
        bgColor: '#ffebee',
        priority: 10,
    },

    // Max Battles (New system)
    'max-battles': {
        name: 'Max Battles',
        color: '#811356', // purple
        bgColor: '#f3e5f5',
        priority: 8,
    },
    'max-mondays': {
        name: 'Max Monday',
        color: '#690342', // darker purple
        bgColor: '#f3e5f5',
        priority: 7,
    },

    // Research Events
    research: {
        name: 'Research',
        color: '#1abc9c', // teal
        bgColor: '#e0f2f1',
        priority: 5,
    },
    'research-day': {
        name: 'Research Day',
        color: '#159e83', // darker teal
        bgColor: '#e0f2f1',
        priority: 8,
    },
    'timed-research': {
        name: 'Timed Research',
        color: '#1abc9c', // teal
        bgColor: '#e0f2f1',
        priority: 6,
    },
    'limited-research': {
        name: 'Limited Research',
        color: '#159e83', // darker teal
        bgColor: '#e0f2f1',
        priority: 6,
    },
    'special-research': {
        name: 'Special Research',
        color: '#13a185', // blue-teal
        bgColor: '#e0f2f1',
        priority: 7,
    },
    'research-breakthrough': {
        name: 'Research Breakthrough',
        color: '#795548', // brown
        bgColor: '#efebe9',
        priority: 5,
    },

    // Major Events
    'pokemon-go-fest': {
        name: 'Pokemon GO Fest',
        color: '#153d94', // dark blue
        bgColor: '#e3f2fd',
        priority: 10,
    },
    'pokemon-go-tour': {
        name: 'Pokemon GO Tour',
        color: '#1d3a74', // darker blue
        bgColor: '#e3f2fd',
        priority: 10,
    },
    'safari-zone': {
        name: 'Safari Zone',
        color: '#3d7141', // green
        bgColor: '#e8f5e8',
        priority: 9,
    },
    'ticketed-event': {
        name: 'Ticketed Event',
        color: '#de3e9b', // pink
        bgColor: '#fce4ec',
        priority: 8,
    },

    // Regular Events
    event: {
        name: 'Event',
        color: '#27ae60', // green
        bgColor: '#e8f5e8',
        priority: 5,
    },
    'live-event': {
        name: 'Live Event',
        color: '#d63031', // red
        bgColor: '#ffebee',
        priority: 7,
    },
    'location-specific': {
        name: 'Location Specific',
        color: '#284b92', // blue
        bgColor: '#e3f2fd',
        priority: 4,
    },
    'bonus-hour': {
        name: 'Bonus Hour',
        color: '#40407a', // purple-blue
        bgColor: '#e8eaf6',
        priority: 6,
    },

    // Battle Events
    'go-battle-league': {
        name: 'GO Battle League',
        color: '#8e44ad', // purple
        bgColor: '#f3e5f5',
        priority: 5,
    },

    // Team Rocket
    'go-rocket-takeover': {
        name: 'Team GO Rocket Takeover',
        color: '#1e1e1e', // dark
        bgColor: '#fafafa',
        priority: 8,
    },
    'team-go-rocket': {
        name: 'Team GO Rocket',
        color: '#1e1e1e', // dark
        bgColor: '#fafafa',
        priority: 6,
    },
    'giovanni-special-research': {
        name: 'Giovanni Special Research',
        color: '#1e272e', // very dark
        bgColor: '#fafafa',
        priority: 7,
    },

    // Showcases & Competitions
    'pokestop-showcase': {
        name: 'PokéStop Showcase',
        color: '#3ca392', // teal-green
        bgColor: '#e0f2f1',
        priority: 5,
    },
    'global-challenge': {
        name: 'Global Challenge',
        color: '#0a64b5', // blue
        bgColor: '#e3f2fd',
        priority: 8,
    },

    // System/Meta
    season: {
        name: 'Season',
        color: '#38ada9', // teal
        bgColor: '#e0f2f1',
        priority: 3,
    },
    update: {
        name: 'Update',
        color: '#2980b9', // blue
        bgColor: '#e3f2fd',
        priority: 2,
    },
    'potential-ultra-unlock': {
        name: 'Potential Ultra Unlock',
        color: '#2c3e50', // dark blue-grey
        bgColor: '#eceff1',
        priority: 6,
    },
    'go-pass': {
        name: 'GO Pass',
        color: '#ddb22f', // yellow
        bgColor: '#fffde7',
        priority: 4,
    },
};

// Type for valid event type keys
export type EventTypeKey = keyof typeof EVENT_TYPES;

export const getEventTypeInfo = (eventType: string): EventTypeInfo => {
    return (
        EVENT_TYPES[eventType] || {
            name: eventType.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            color: '#757575', // Default grey
            bgColor: '#F5F5F5',
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

export const getEventsForDate = (events: PogoEvent[], date: Date | string | dayjs.Dayjs): PogoEvent[] => {
    const targetDate = dayjs(date);
    const targetDateStr = targetDate.format(DATE_FORMAT.CALENDAR_DATE);

    return events.filter((event: PogoEvent) => {
        if (!event.start || !event.end) return false;

        const startDate = dayjs.utc(event.start).local();
        const endDate = dayjs.utc(event.end).local();

        const startDateStr = startDate.format(DATE_FORMAT.CALENDAR_DATE);
        const endDateStr = endDate.format(DATE_FORMAT.CALENDAR_DATE);

        return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
    });
};
