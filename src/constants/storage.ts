/**
 * Application-wide constants
 */

// localStorage key prefix for consistent naming
export const STORAGE_PREFIX = 'pogo-calendar';

export const createStorageKey = (key: string): string => `${STORAGE_PREFIX}-${key}`;

export const STORAGE_KEYS = {
    COLLAPSIBLE_SECTIONS: createStorageKey('collapsible-sections'),
    DISABLED_FILTERS: createStorageKey('disabled-filters'),
    FIRST_DAY_OF_WEEK: createStorageKey('first-day-of-week'),
    GROUP_SIMILAR_EVENTS: createStorageKey('group-similar-events'),
    THEME_MODE: createStorageKey('theme-mode'),
    USE_ANIMATED_IMAGES: createStorageKey('use-animated-images'),
    USE_MULTI_DAY_EVENT_SPRITES: createStorageKey('use-multi-day-event-sprites'),
    USE_SINGLE_DAY_EVENT_SPRITES: createStorageKey('use-single-day-event-sprites'),
} as const;
