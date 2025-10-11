import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed } from 'vue';

import { STORAGE_KEYS } from '../constants/storage';
import { EVENT_TYPES } from '../utils/eventTypes';
import type { EventTypeInfo, EventTypeKey } from '../utils/eventTypes';

const defaultFilteredEventTypes: EventTypeKey[] = ['go-pass', 'season'];

/**
 * Pinia store for managing event type filtering with persistent localStorage
 * Stores only disabled event types for efficiency
 */
export const useEventFilterStore = defineStore('eventFilter', () => {
    // Store only the disabled event types (much more efficient)
    const disabledEventTypes = useLocalStorage<EventTypeKey[]>(STORAGE_KEYS.DISABLED_FILTERS, defaultFilteredEventTypes, {
        serializer: {
            read: (value: string) => {
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            },
            write: (value: EventTypeKey[]) => {
                return JSON.stringify(value);
            },
        },
    });

    // Store hidden individual event IDs
    const hiddenEventIds = useLocalStorage<string[]>(STORAGE_KEYS.HIDDEN_EVENT_IDS, [], {
        serializer: {
            read: (value: string) => {
                try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [];
                } catch {
                    return [];
                }
            },
            write: (value: string[]) => {
                return JSON.stringify(value);
            },
        },
    });

    // Computed getters
    const enabledEventTypeKeys = computed((): EventTypeKey[] =>
        (Object.keys(EVENT_TYPES) as EventTypeKey[]).filter(key => !disabledEventTypes.value.includes(key)),
    );
    const disabledEventTypeKeys = computed((): EventTypeKey[] => disabledEventTypes.value);
    const enabledEventTypeInfos = computed(() => enabledEventTypeKeys.value.map(key => EVENT_TYPES[key] as EventTypeInfo));
    const allEventTypesEnabled = computed(() => disabledEventTypes.value.length === 0);
    const noEventTypesEnabled = computed(() => disabledEventTypes.value.length === Object.keys(EVENT_TYPES).length);
    const enabledCount = computed(() => enabledEventTypeKeys.value.length);
    const totalCount = computed(() => Object.keys(EVENT_TYPES).length);

    // Actions to manage filters
    const toggleEventType = (eventType: EventTypeKey) => {
        const currentDisabled = disabledEventTypes.value;
        const isCurrentlyDisabled = currentDisabled.includes(eventType);

        if (isCurrentlyDisabled) {
            // Remove from disabled list (enable it)
            disabledEventTypes.value = currentDisabled.filter(type => type !== eventType);
        } else {
            // Add to disabled list (disable it)
            disabledEventTypes.value = [...currentDisabled, eventType];
        }
    };

    const enableEventType = (eventType: EventTypeKey) => {
        disabledEventTypes.value = disabledEventTypes.value.filter(type => type !== eventType);
    };

    const disableEventType = (eventType: EventTypeKey) => {
        if (!disabledEventTypes.value.includes(eventType)) {
            disabledEventTypes.value = [...disabledEventTypes.value, eventType];
        }
    };

    const enableAllEventTypes = () => {
        disabledEventTypes.value = [];
    };

    const disableAllEventTypes = () => {
        disabledEventTypes.value = Object.keys(EVENT_TYPES) as EventTypeKey[];
    };

    const isEventTypeEnabled = (eventType: EventTypeKey): boolean => {
        return !disabledEventTypes.value.includes(eventType);
    };

    // Individual event filtering actions
    const hideEventById = (eventId: string) => {
        if (!hiddenEventIds.value.includes(eventId)) {
            hiddenEventIds.value = [...hiddenEventIds.value, eventId];
        }
    };

    const showEventById = (eventId: string) => {
        hiddenEventIds.value = hiddenEventIds.value.filter(id => id !== eventId);
    };

    const isEventHiddenById = (eventId: string): boolean => {
        return hiddenEventIds.value.includes(eventId);
    };

    const showAllHiddenEventsById = () => {
        hiddenEventIds.value = [];
    };

    const hiddenEventCount = computed(() => hiddenEventIds.value.length);

    // Combined helper to check if an event should be visible (both type and ID checks)
    const isEventVisible = (eventType: EventTypeKey, eventId: string): boolean => {
        return isEventTypeEnabled(eventType) && !isEventHiddenById(eventId);
    };

    return {
        // State
        disabledEventTypes,
        hiddenEventIds,

        // Computed getters
        enabledEventTypeKeys,
        disabledEventTypeKeys,
        enabledEventTypeInfos,
        allEventTypesEnabled,
        noEventTypesEnabled,
        enabledCount,
        totalCount,
        hiddenEventCount,

        // Actions
        toggleEventType,
        enableEventType,
        disableEventType,
        enableAllEventTypes,
        disableAllEventTypes,
        isEventTypeEnabled,
        hideEventById,
        showEventById,
        isEventHiddenById,
        showAllHiddenEventsById,
        isEventVisible,
    };
});
