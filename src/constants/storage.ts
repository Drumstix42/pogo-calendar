/**
 * Application-wide constants
 */

// localStorage key prefix for consistent naming
export const STORAGE_PREFIX = 'pogo-calendar';

export const createStorageKey = (key: string): string => `${STORAGE_PREFIX}-${key}`;

export const STORAGE_KEYS = {
    COLLAPSIBLE_SECTIONS: createStorageKey('collapsible-sections'),
    DISABLED_FILTERS: createStorageKey('disabled-filters'),
    DISMISSED_MESSAGE_VERSIONS: createStorageKey('dismissed-message-versions'),
    EVENT_BAR_FONT_SIZE: createStorageKey('event-bar-font-size'),
    FILTERS_APPLY_TO_TIMELINE: createStorageKey('filters-apply-to-timeline'),
    FIRST_DAY_OF_WEEK: createStorageKey('first-day-of-week'),
    GROUP_SIMILAR_EVENTS: createStorageKey('group-similar-events'),
    HIDDEN_EVENT_IDS: createStorageKey('hidden-event-ids'),
    THEME_MODE: createStorageKey('theme-mode'),
    TIMELINE_SIDEBAR_COLLAPSED: createStorageKey('timeline-sidebar-collapsed'),
    USE_ANIMATED_IMAGES: createStorageKey('use-animated-images'),
    USE_MULTI_DAY_EVENT_SPRITES: createStorageKey('use-multi-day-event-sprites'),
    USE_SINGLE_DAY_EVENT_SPRITES: createStorageKey('use-single-day-event-sprites'),
} as const;
