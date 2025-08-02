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
        color: '#4CAF50', // Green
        bgColor: '#E8F5E8',
        priority: 10,
    },
    'pokemon-spotlight-hour': {
        name: 'Spotlight Hour',
        color: '#FF9800', // Orange
        bgColor: '#FFF3E0',
        priority: 7,
    },

    // Raid Events
    'raid-hour': {
        name: 'Raid Hour',
        color: '#F44336', // Red
        bgColor: '#FFEBEE',
        priority: 8,
    },
    'raid-day': {
        name: 'Raid Day',
        color: '#E91E63', // Pink
        bgColor: '#FCE4EC',
        priority: 9,
    },
    'raid-weekend': {
        name: 'Raid Weekend',
        color: '#E91E63',
        bgColor: '#FCE4EC',
        priority: 9,
    },
    'raid-battles': {
        name: 'Raid Battles',
        color: '#D32F2F', // Dark Red
        bgColor: '#FFEBEE',
        priority: 6,
    },
    'elite-raids': {
        name: 'Elite Raids',
        color: '#B71C1C', // Very Dark Red
        bgColor: '#FFEBEE',
        priority: 10,
    },

    // Max Battles (New system)
    'max-battles': {
        name: 'Max Battles',
        color: '#673AB7', // Deep Purple
        bgColor: '#F3E5F5',
        priority: 8,
    },
    'max-mondays': {
        name: 'Max Monday',
        color: '#9C27B0', // Purple
        bgColor: '#F3E5F5',
        priority: 7,
    },

    // Research Events
    research: {
        name: 'Research',
        color: '#2196F3', // Blue
        bgColor: '#E3F2FD',
        priority: 5,
    },
    'research-day': {
        name: 'Research Day',
        color: '#1976D2', // Dark Blue
        bgColor: '#E3F2FD',
        priority: 8,
    },
    'timed-research': {
        name: 'Timed Research',
        color: '#1565C0',
        bgColor: '#E3F2FD',
        priority: 6,
    },
    'limited-research': {
        name: 'Limited Research',
        color: '#0D47A1',
        bgColor: '#E3F2FD',
        priority: 6,
    },
    'special-research': {
        name: 'Special Research',
        color: '#0277BD',
        bgColor: '#E3F2FD',
        priority: 7,
    },
    'research-breakthrough': {
        name: 'Research Breakthrough',
        color: '#0288D1',
        bgColor: '#E3F2FD',
        priority: 5,
    },

    // Major Events
    'pokemon-go-fest': {
        name: 'Pokemon GO Fest',
        color: '#FF5722', // Deep Orange
        bgColor: '#FBE9E7',
        priority: 10,
    },
    'pokemon-go-tour': {
        name: 'Pokemon GO Tour',
        color: '#FF6F00', // Amber
        bgColor: '#FFF8E1',
        priority: 10,
    },
    'safari-zone': {
        name: 'Safari Zone',
        color: '#8BC34A', // Light Green
        bgColor: '#F1F8E9',
        priority: 9,
    },
    'ticketed-event': {
        name: 'Ticketed Event',
        color: '#FFC107', // Amber
        bgColor: '#FFFDE7',
        priority: 8,
    },

    // Regular Events
    event: {
        name: 'Event',
        color: '#607D8B', // Blue Grey
        bgColor: '#ECEFF1',
        priority: 5,
    },
    'live-event': {
        name: 'Live Event',
        color: '#795548', // Brown
        bgColor: '#EFEBE9',
        priority: 7,
    },
    'location-specific': {
        name: 'Location Specific',
        color: '#9E9E9E', // Grey
        bgColor: '#F5F5F5',
        priority: 4,
    },
    'bonus-hour': {
        name: 'Bonus Hour',
        color: '#CDDC39', // Lime
        bgColor: '#F9FBE7',
        priority: 6,
    },

    // Battle Events
    'go-battle-league': {
        name: 'GO Battle League',
        color: '#3F51B5', // Indigo
        bgColor: '#E8EAF6',
        priority: 5,
    },

    // Team Rocket
    'go-rocket-takeover': {
        name: 'Team GO Rocket Takeover',
        color: '#424242', // Dark Grey
        bgColor: '#FAFAFA',
        priority: 8,
    },
    'team-go-rocket': {
        name: 'Team GO Rocket',
        color: '#616161',
        bgColor: '#FAFAFA',
        priority: 6,
    },
    'giovanni-special-research': {
        name: 'Giovanni Special Research',
        color: '#212121', // Very Dark Grey
        bgColor: '#FAFAFA',
        priority: 7,
    },

    // Showcases & Competitions
    'pokestop-showcase': {
        name: 'PokéStop Showcase',
        color: '#00BCD4', // Cyan
        bgColor: '#E0F2F1',
        priority: 5,
    },
    'global-challenge': {
        name: 'Global Challenge',
        color: '#009688', // Teal
        bgColor: '#E0F2F1',
        priority: 8,
    },

    // System/Meta
    season: {
        name: 'Season',
        color: '#4CAF50', // Green
        bgColor: '#E8F5E8',
        priority: 3,
    },
    update: {
        name: 'Update',
        color: '#9E9E9E', // Grey
        bgColor: '#F5F5F5',
        priority: 2,
    },
    'potential-ultra-unlock': {
        name: 'Potential Ultra Unlock',
        color: '#FF9800', // Orange
        bgColor: '#FFF3E0',
        priority: 6,
    },
    'go-pass': {
        name: 'GO Pass',
        color: '#FFEB3B', // Yellow
        bgColor: '#FFFDE7',
        priority: 4,
    },
};

export const getEventTypeInfo = (eventType: string): EventTypeInfo => {
    return (
        EVENT_TYPES[eventType] || {
            name: eventType
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
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

export const getEventsForDate = (
    events: PogoEvent[],
    date: Date | string | dayjs.Dayjs,
): PogoEvent[] => {
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
