import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed } from 'vue';

import { STORAGE_KEYS } from '../constants/storage';
import { EVENT_TYPES } from '../utils/eventTypes';
import type { EventTypeInfo, EventTypeKey } from '../utils/eventTypes';

/**
 * Pinia store for managing event type filtering with persistent localStorage
 * Stores only disabled event types for efficiency
 */
export const useEventFilterStore = defineStore('eventFilter', () => {
    // Store only the disabled event types (much more efficient)
    const disabledEventTypes = useLocalStorage<EventTypeKey[]>(STORAGE_KEYS.DISABLED_FILTERS, [], {
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
                // If no event types are disabled, remove from localStorage
                if (value.length === 0) {
                    localStorage.removeItem(STORAGE_KEYS.DISABLED_FILTERS);
                    return '';
                }

                // Otherwise, save the disabled event types
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

    return {
        // State
        disabledEventTypes,

        // Computed getters
        enabledEventTypeKeys,
        disabledEventTypeKeys,
        enabledEventTypeInfos,
        allEventTypesEnabled,
        noEventTypesEnabled,
        enabledCount,
        totalCount,

        // Actions
        toggleEventType,
        enableEventType,
        disableEventType,
        enableAllEventTypes,
        disableAllEventTypes,
        isEventTypeEnabled,
    };
});
