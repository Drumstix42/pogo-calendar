import { useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { STORAGE_KEYS } from '@/constants/storage';

export type FirstDayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

/**
 * Pinia store for calendar display settings with persistent localStorage
 */
export const useCalendarSettingsStore = defineStore('calendarSettings', () => {
    // First day of week setting (full day name)
    const firstDayOfWeek = useLocalStorage<FirstDayOfWeek>(STORAGE_KEYS.FIRST_DAY_OF_WEEK, 'Sunday');

    // Event grouping setting - whether to group events of same type with identical start/end times
    const groupSimilarEvents = useLocalStorage<boolean>(STORAGE_KEYS.GROUP_SIMILAR_EVENTS, false);

    // Animated images setting - whether to use animated images in detailed views
    const useAnimatedImages = useLocalStorage<boolean>(STORAGE_KEYS.USE_ANIMATED_IMAGES, true);

    // Collapsible sections state (keyed by section identifier)
    const collapsibleSections = useLocalStorage<Record<string, boolean>>(STORAGE_KEYS.COLLAPSIBLE_SECTIONS, {});

    const optionsExpanded = ref<boolean>(false);

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

    const setGroupSimilarEvents = (enabled: boolean) => {
        groupSimilarEvents.value = enabled;
    };

    const setUseAnimatedImages = (enabled: boolean) => {
        useAnimatedImages.value = enabled;
    };

    const toggleOptionsExpanded = () => {
        optionsExpanded.value = !optionsExpanded.value;
    };

    const setOptionsExpanded = (expanded: boolean) => {
        optionsExpanded.value = expanded;
    };

    const isCollapsibleSectionCollapsed = (key: string, defaultValue = false): boolean => {
        return collapsibleSections.value[key] ?? defaultValue;
    };

    const setCollapsibleSection = (key: string, collapsed: boolean) => {
        collapsibleSections.value[key] = collapsed;
    };

    const toggleCollapsibleSection = (key: string, defaultValue = false) => {
        const currentValue = isCollapsibleSectionCollapsed(key, defaultValue);
        setCollapsibleSection(key, !currentValue);
    };

    return {
        // State
        firstDayOfWeek,
        allDayNames,
        groupSimilarEvents,
        useAnimatedImages,
        optionsExpanded,

        // Computed getters
        dayHeaders,
        fullDayHeaders,
        firstDayIndex,

        // Actions
        setFirstDayOfWeek,
        setGroupSimilarEvents,
        setUseAnimatedImages,
        toggleOptionsExpanded,
        setOptionsExpanded,
        isCollapsibleSectionCollapsed,
        setCollapsibleSection,
        toggleCollapsibleSection,
    };
});
