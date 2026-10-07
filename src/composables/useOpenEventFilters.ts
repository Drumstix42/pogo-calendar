import { nextTick } from 'vue';

import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';

const FILTERS_COLLAPSIBLE_KEY = 'calendarSettings/event-filters';

// Opens the Settings panel with the event type filters expanded and scrolled into view
export function useOpenEventFilters() {
    const calendarSettings = useCalendarSettingsStore();
    const { openSettings } = useUrlSync();

    function openEventFilters() {
        if (calendarSettings.isCollapsibleSectionCollapsed(FILTERS_COLLAPSIBLE_KEY)) {
            calendarSettings.toggleCollapsibleSection(FILTERS_COLLAPSIBLE_KEY);
        }

        openSettings();

        nextTick(() => {
            setTimeout(() => {
                const element = document.getElementById('event-type-filters-section');
                element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 350); // Wait for offcanvas slide-in animation (300ms + buffer)
        });
    }

    return { openEventFilters };
}
