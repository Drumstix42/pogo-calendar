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
    const groupSimilarEvents = useLocalStorage<boolean>(STORAGE_KEYS.GROUP_SIMILAR_EVENTS, true);

    // Animated images setting - whether to use animated images in detailed views
    const useAnimatedImages = useLocalStorage<boolean>(STORAGE_KEYS.USE_ANIMATED_IMAGES, true);

    // Multi-day event sprites setting - whether to show Pokemon sprites in multi-day event bars
    const useMultiDayEventSprites = useLocalStorage<boolean>(STORAGE_KEYS.USE_MULTI_DAY_EVENT_SPRITES, true);

    // Single-day event sprites setting - whether to show Pokemon sprites in single-day events
    const useSingleDayEventSprites = useLocalStorage<boolean>(STORAGE_KEYS.USE_SINGLE_DAY_EVENT_SPRITES, true);

    // Event bar font size setting - font size for multi-day event bars in pixels
    const eventBarFontSize = useLocalStorage<number>(STORAGE_KEYS.EVENT_BAR_FONT_SIZE, 12);

    // Collapsed sections state - only stores sections that are collapsed (expanded is default)
    const collapsedSections = useLocalStorage<Record<string, true>>(STORAGE_KEYS.COLLAPSIBLE_SECTIONS, {});

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

    // Font size to bar height mapping - precise control over each size
    const fontSizeToHeightMap: Record<number, number> = {
        10: 16,
        11: 18,
        12: 18,
        13: 19,
        14: 20,
        15: 21,
        16: 21,
        17: 22,
        18: 23,
    };

    // Computed event bar height based on font size using precise mapping
    const eventBarHeight = computed(() => fontSizeToHeightMap[eventBarFontSize.value] ?? 20);

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

    const setUseMultiDayEventSprites = (enabled: boolean) => {
        useMultiDayEventSprites.value = enabled;
    };

    const setUseSingleDayEventSprites = (enabled: boolean) => {
        useSingleDayEventSprites.value = enabled;
    };

    const setEventBarFontSize = (size: number) => {
        eventBarFontSize.value = Math.max(10, Math.min(18, size)); // Clamp between 10-18px
    };

    const toggleOptionsExpanded = () => {
        optionsExpanded.value = !optionsExpanded.value;
    };

    const setOptionsExpanded = (expanded: boolean) => {
        optionsExpanded.value = expanded;
    };

    const isCollapsibleSectionCollapsed = (key: string): boolean => {
        return key in collapsedSections.value;
    };

    const setCollapsibleSection = (key: string, collapsed: boolean) => {
        if (collapsed) {
            collapsedSections.value[key] = true;
        } else {
            delete collapsedSections.value[key];
        }
    };

    const toggleCollapsibleSection = (key: string) => {
        const currentValue = isCollapsibleSectionCollapsed(key);
        setCollapsibleSection(key, !currentValue);
    };

    return {
        // State
        firstDayOfWeek,
        allDayNames,
        groupSimilarEvents,
        useAnimatedImages,
        useMultiDayEventSprites,
        useSingleDayEventSprites,
        eventBarFontSize,
        optionsExpanded,

        // Computed getters
        dayHeaders,
        fullDayHeaders,
        firstDayIndex,
        eventBarHeight,

        // Actions
        setFirstDayOfWeek,
        setGroupSimilarEvents,
        setUseAnimatedImages,
        setUseMultiDayEventSprites,
        setUseSingleDayEventSprites,
        setEventBarFontSize,
        toggleOptionsExpanded,
        setOptionsExpanded,
        isCollapsibleSectionCollapsed,
        setCollapsibleSection,
        toggleCollapsibleSection,
    };
});
