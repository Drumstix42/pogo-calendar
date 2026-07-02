import type { Dayjs } from 'dayjs';

import type { SpotlightBonusInfo } from './spotlightBonus';

export interface EventTypeInfo {
    name: string;
    color: string;
    priority: number;
    category: 'community-and-raids' | 'research' | 'seasonal-and-premium' | 'events-and-misc';
}

export type EventTypeInfoWithoutColor = Omit<EventTypeInfo, 'color'>;

export interface PokemonBoss {
    name: string;
    image: string;
    canBeShiny: boolean;
    raidType?: string;
}

export interface RaidBattlesData {
    bosses: PokemonBoss[];
    shinies?: PokemonBoss[];
}

export interface SpotlightData {
    name: string;
    image?: string;
    canBeShiny: boolean;
    bonus?: string;
    list?: PokemonBoss[];
}

export interface CommunityDayData {
    spawns?: PokemonBoss[];
    featured?: PokemonBoss | PokemonBoss[];
    bonuses?: any[];
    shinies?: PokemonBoss[];
    specialresearch?: any[];
    bonusDisclaimers?: string[];
}

export interface MaxBattlesData {
    featured: PokemonBoss | PokemonBoss[];
}

export interface BonusItem {
    text: string;
    image: string;
}

export interface EventBonusGroup {
    startTime?: string;
    endTime?: string;
    description?: string;
    items: BonusItem[];
}

/** A titled group of daily-discovery bonus lines (a single day can stack multiple groups). */
export interface SeasonDailyBonusGroup {
    title: string | null;
    items: string[];
}

/** One day-of-week's daily-discovery bonuses. Days without bonuses are omitted from the feed. */
export interface SeasonDailyBonus {
    day: string;
    dayOfWeek: number; // 0=Sunday .. 6=Saturday (matches dayjs().day())
    bonuses: SeasonDailyBonusGroup[];
    footnote: string | null;
}

/** A season-long bonus. `milestone` is the GO Pass rank that unlocks it, or null for a flat list. */
export interface SeasonBonusEntry {
    milestone: string | null;
    text: string;
    image: string | null;
}

/** Season bonus block — rides on the `season` event as `extraData.season`. */
export interface SeasonData {
    note: string | null;
    dailyBonuses: SeasonDailyBonus[];
    seasonBonuses: SeasonBonusEntry[];
}

/** A standalone season.json array entry — `SeasonData` plus the season's own identity/dates. */
export interface Season extends SeasonData {
    name: string;
    eventID: string;
    link: string;
    start: string;
    end: string;
}

export interface RaidScheduleEntry {
    date: string;
    time?: string;
    label?: string;
    bosses: PokemonBoss[];
    raidHours: Array<{
        time: string;
        label?: string;
        bosses: PokemonBoss[];
    }>;
    bonuses?: string[];
}

export interface SpotlightScheduleEntry {
    date: string;
    time: string;
    pokemon: PokemonBoss;
}

export interface PogoEvent {
    eventID: string;
    name: string;
    eventType: EventTypeKey | string;
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
        raidbattles?: RaidBattlesData;
        raidSchedule?: RaidScheduleEntry[];
        spotlightSchedule?: SpotlightScheduleEntry[];
        spotlight?: SpotlightData;
        communityday?: CommunityDayData;
        maxbattles?: MaxBattlesData;
        bonuses?: EventBonusGroup[];
        season?: SeasonData;
        // Plain-text bonus lines for generated raid-hour sub-events (distinct from `bonuses`).
        raidHourBonuses?: string[];
        isRaidHourSubEvent?: boolean;
        isSpotlightSubEvent?: boolean;
        parentEventId?: string;
        [key: string]: any;
    };

    // Internal markers stamped at runtime by the events store when grouping is enabled
    // (a representative event carries the collapsed group). Not present in the scraped feed.
    _isGrouped?: boolean;
    _groupedEvents?: PogoEvent[];
    _displayName?: string;
}

export interface RaidBossTierGroup {
    label: string;
    bosses: PokemonBoss[];
}

/** Precomputed, cached per-event metadata derived by the events store. */
export interface EventMetadata {
    // Precomputed dates
    startDate: Dayjs;
    endDate: Dayjs;

    // Classifications
    isMultiDayEvent: boolean;
    isSingleDayEvent: boolean;
    isPastEvent: boolean;
    isFutureEvent: boolean;

    // Type information
    typeInfo: EventTypeInfoWithoutColor;
    color: string;

    // Display helpers
    formattedStartTime: string;
    displayName: string;

    // Spotlight bonus (for spotlight hour events)
    spotlightBonus?: SpotlightBonusInfo | null;
    spotlightBonusIconUrl?: string | null;

    // Raid boss groupings by tier (for events with raidbattles data)
    raidBossTierGroups?: RaidBossTierGroup[];

    // Grouping metadata (for when grouping is enabled)
    isGrouped?: boolean;
    groupedEvents?: PogoEvent[];
    groupCount?: number;
}

// Note: When adding new event types, also update the $event-types list in src/styles/style.scss
// to enable hover highlighting for the new event type in the filter options
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
        priority: 43,
        category: 'community-and-raids',
    },

    // Raid Events
    'raid-hour': {
        name: 'Raid Hour',
        color: '#c0392b', // red
        priority: 48,
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
        priority: 37,
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
        priority: 53,
        category: 'community-and-raids',
    },

    // Research Events
    research: {
        name: 'Research',
        color: '#12836d', // teal
        priority: 57,
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
    'choose-your-path': {
        name: 'Choose Your Path',
        color: '#1b9b7f', // teal-green
        priority: 48,
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
        priority: 20,
        category: 'seasonal-and-premium',
    },
    'pokemon-go-tour': {
        name: 'Pokemon GO Tour',
        color: '#1d3a74', // darker blue
        priority: 21,
        category: 'seasonal-and-premium',
    },
    'safari-zone': {
        name: 'Safari Zone',
        color: '#3d7141', // green
        priority: 22,
        category: 'seasonal-and-premium',
    },
    'ticketed-event': {
        name: 'Ticketed Event',
        color: '#c7378b', // pink
        priority: 90,
        category: 'seasonal-and-premium',
    },
    'wild-area': {
        name: 'Wild Area',
        color: '#155a4a', // darker teal-green
        priority: 19,
        category: 'seasonal-and-premium',
    },

    // Regular Events
    event: {
        name: 'Event',
        color: '#1d8247', // green
        priority: 58,
        category: 'events-and-misc',
    },
    'live-event': {
        name: 'Live Event',
        color: '#d63031', // red
        priority: 75,
        category: 'events-and-misc',
    },
    'city-safari': {
        name: 'City Safari',
        color: '#1a6d5b', // darker green
        priority: 33,
        category: 'events-and-misc',
    },
    'location-specific': {
        name: 'Location Specific',
        color: '#284b92', // blue
        priority: 45,
        category: 'events-and-misc',
    },
    'bonus-hour': {
        name: 'Bonus Hour',
        color: '#40407a', // purple-blue
        priority: 62,
        category: 'events-and-misc',
    },

    // Battle Events
    'go-battle-league': {
        name: 'GO Battle League',
        color: '#8e44ad', // purple
        priority: 99,
        category: 'seasonal-and-premium',
    },

    // Team Rocket
    'go-rocket-takeover': {
        name: 'Team GO Rocket Takeover',
        color: '#1e1e1e', // dark
        priority: 84,
        category: 'events-and-misc',
    },
    'team-go-rocket': {
        name: 'Team GO Rocket',
        color: '#1e1e1e', // dark
        priority: 55,
        category: 'events-and-misc',
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
        category: 'events-and-misc',
    },
    'global-challenge': {
        name: 'Global Challenge',
        color: '#0a64b5', // blue
        priority: 82,
        category: 'seasonal-and-premium',
    },

    // System/Meta
    season: {
        name: 'Season',
        color: '#29817e', // teal
        priority: 100,
        category: 'seasonal-and-premium',
    },
    update: {
        name: 'Update',
        color: '#2679af', // blue
        priority: 10,
        category: 'events-and-misc',
    },
    'potential-ultra-unlock': {
        name: 'Potential Ultra Unlock',
        color: '#2c3e50', // dark blue-grey
        priority: 42,
        category: 'events-and-misc',
    },
    'go-pass': {
        name: 'GO Pass',
        color: '#896e17', // yellow/gold
        priority: 95,
        category: 'seasonal-and-premium',
    },
};

// Type for valid event type keys
export type EventTypeKey = keyof typeof EVENT_TYPES;

// Timeline category constants for EventTimeline component
export const TimelineCategory = {
    TODAY: 'today',
    ONGOING: 'ongoing',
    UPCOMING: 'upcoming',
    FUTURE: 'future',
} as const;

export type TimelineCategoryKey = (typeof TimelineCategory)[keyof typeof TimelineCategory];

export const getEventTypeInfo = (eventType: string): EventTypeInfoWithoutColor => {
    const info = EVENT_TYPES[eventType] || {
        // replaces dashes with spaces and capitalizes each word
        name: eventType.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        priority: 5,
        category: 'events-and-misc',
    };

    return {
        name: info.name,
        priority: info.priority,
        category: info.category,
    };
};
