import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed } from 'vue';

import { STORAGE_KEYS } from '@/constants/storage';
import { EVENT_TYPES, type EventTypeKey } from '@/utils/eventTypes';

export const useEventTypeColorsStore = defineStore('eventTypeColors', () => {
    // Store custom colors as an object mapping eventTypeKey to hex color
    const customColors = useLocalStorage<Record<string, string>>(STORAGE_KEYS.CUSTOM_EVENT_TYPE_COLORS, {});

    // Get custom color for an event type, or undefined if using default
    function getCustomColor(eventTypeKey: EventTypeKey): string | undefined {
        return customColors.value[eventTypeKey];
    }

    // Set custom color for an event type
    function setCustomColor(eventTypeKey: EventTypeKey, color: string) {
        customColors.value[eventTypeKey] = color;
    }

    // Reset event type to default color (remove from custom colors)
    function resetToDefault(eventTypeKey: EventTypeKey) {
        const { [eventTypeKey]: _, ...rest } = customColors.value;
        customColors.value = rest;
    }

    // Check if an event type has a custom color
    function hasCustomColor(eventTypeKey: EventTypeKey): boolean {
        return eventTypeKey in customColors.value;
    }

    // Get the effective color (custom or default) for an event type
    function getEventTypeColor(eventTypeKey: EventTypeKey): string {
        return customColors.value[eventTypeKey] || EVENT_TYPES[eventTypeKey]?.color || '#757575';
    }

    // Count of customized event types
    const customizedCount = computed(() => Object.keys(customColors.value).length);

    // Reset all custom colors
    function resetAll() {
        customColors.value = {};
    }

    return {
        customColors,
        getCustomColor,
        setCustomColor,
        resetToDefault,
        hasCustomColor,
        getEventTypeColor,
        customizedCount,
        resetAll,
    };
});
