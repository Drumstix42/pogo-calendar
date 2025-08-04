/**
 * Application-wide constants
 */

// localStorage key prefix for consistent naming
export const STORAGE_PREFIX = 'pogo-calendar';

// Helper function to create consistent localStorage keys
export const createStorageKey = (key: string): string => `${STORAGE_PREFIX}-${key}`;

// Predefined storage keys
export const STORAGE_KEYS = {
    DISABLED_FILTERS: createStorageKey('disabled-filters'),
    FIRST_DAY_OF_WEEK: createStorageKey('first-day-of-week'),
    GROUP_SIMILAR_EVENTS: createStorageKey('group-similar-events'),
} as const;
