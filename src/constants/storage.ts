/**
 * Application-wide constants
 */

// localStorage key prefix for consistent naming
export const STORAGE_PREFIX = 'pogo-calendar';

export const createStorageKey = (key: string): string => `${STORAGE_PREFIX}-${key}`;

export const STORAGE_KEYS = {
    CAMPFIRE_BODY_TEMPLATE: createStorageKey('campfire-body-template'),
    CAMPFIRE_INCLUDE_MAX_CP: createStorageKey('campfire-include-max-cp'),
    CAMPFIRE_INCLUDE_POKEMON_DETAILS: createStorageKey('campfire-include-pokemon-details'),
    CAMPFIRE_INCLUDE_WEAKNESS: createStorageKey('campfire-include-weakness'),
    CAMPFIRE_TITLE_TEMPLATE: createStorageKey('campfire-title-template'),
    COLLAPSIBLE_SECTIONS: createStorageKey('collapsible-sections'),
    CONDENSE_PAST_EVENT_BARS: createStorageKey('condense-past-event-bars'),
    CUSTOM_EVENT_TYPE_COLORS: createStorageKey('custom-event-type-colors'),
    DISABLED_FILTERS: createStorageKey('disabled-filters'),
    DISMISSED_MESSAGE_VERSIONS: createStorageKey('dismissed-message-versions'),
    EVENT_BAR_FONT_SIZE: createStorageKey('event-bar-font-size'),
    FILTERS_APPLY_TO_TIMELINE: createStorageKey('filters-apply-to-timeline'),
    FIRST_DAY_OF_WEEK: createStorageKey('first-day-of-week'),
    GROUP_SIMILAR_EVENTS: createStorageKey('group-similar-events'),
    HAS_VISITED_BEFORE: createStorageKey('has-visited-before'),
    HIDDEN_EVENT_IDS: createStorageKey('hidden-event-ids'),
    MANUAL_TIME_OFFSET_HOURS: createStorageKey('manual-time-offset-hours'),
    SHOW_CURRENT_RAID_BOSSES: createStorageKey('show-current-raid-bosses'),
    SHOW_SEASON_DAILY_BONUSES: createStorageKey('show-season-daily-bonuses'),
    THEME_MODE: createStorageKey('theme-mode'),
    TIMELINE_SIDEBAR_COLLAPSED: createStorageKey('timeline-sidebar-collapsed'),
    USE_ANIMATED_IMAGES: createStorageKey('use-animated-images'),
    USE_MULTI_DAY_EVENT_SPRITES: createStorageKey('use-multi-day-event-sprites'),
    USE_SINGLE_DAY_EVENT_SPRITES: createStorageKey('use-single-day-event-sprites'),
} as const;
