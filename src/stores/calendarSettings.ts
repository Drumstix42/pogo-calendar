import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed } from 'vue';

import { STORAGE_KEYS } from '@/constants/storage';

export type FirstDayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

/**
 * Pinia store for calendar display settings with persistent localStorage
 */
export const useCalendarSettingsStore = defineStore('calendarSettings', () => {
    // First day of week setting (full day name)
    const firstDayOfWeek = useLocalStorage<FirstDayOfWeek>(STORAGE_KEYS.FIRST_DAY_OF_WEEK, 'Sunday');

    // Day name constants
    const allDayNames: FirstDayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Helper to get day index (0-6) from day name
    const getDayIndex = (dayName: string): number => {
        const normalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
        const index = allDayNames.findIndex(day => day === normalizedDay);
        return index !== -1 ? index : 0; // Fallback to Sunday if not found
    };

    // Computed getters
    const dayHeaders = computed(() => {
        const startIndex = getDayIndex(firstDayOfWeek.value);
        if (startIndex === -1) return shortDayNames; // fallback

        return [...shortDayNames.slice(startIndex), ...shortDayNames.slice(0, startIndex)];
    });

    const fullDayHeaders = computed(() => {
        const startIndex = getDayIndex(firstDayOfWeek.value);
        if (startIndex === -1) return allDayNames; // fallback

        return [...allDayNames.slice(startIndex), ...allDayNames.slice(0, startIndex)];
    });

    const firstDayIndex = computed(() => getDayIndex(firstDayOfWeek.value));

    // Actions
    const setFirstDayOfWeek = (day: FirstDayOfWeek) => {
        firstDayOfWeek.value = day;
    };

    return {
        // State
        firstDayOfWeek,
        allDayNames,

        // Computed getters
        dayHeaders,
        fullDayHeaders,
        firstDayIndex,

        // Actions
        setFirstDayOfWeek,
    };
});
