import { computed } from 'vue';

import { useCalendarGridSlots } from '@/composables/useCalendarGridSlots';
import { useCurrentMonthDisplay } from '@/composables/useCurrentMonthDisplay';
import { useDisplayTime } from '@/composables/useDisplayTime';
import { buildDateGroups, isDateGroupedCategory, useTimelineCategories } from '@/composables/useTimelineCategories';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { buildCalendarDays } from '@/utils/calendarGrid';
import { getGroupedEvents } from '@/utils/eventGrouping';

export const ALL_MONTH_EVENT_LIST = 'all-month';

// Contents of the event list drawer: the viewed month's all-month events, or one timeline category,
// including the events the filters would normally hide.
export function useEventList(getListKey: () => string | undefined) {
    const eventsStore = useEventsStore();
    const eventFilter = useEventFilterStore();
    const calendarSettings = useCalendarSettingsStore();
    const { displayToday } = useDisplayTime();
    const { urlMonth, urlYear } = useUrlSync();
    const { currentMonthDisplay } = useCurrentMonthDisplay();
    const { eventCategories, unfilteredCategorizedEvents } = useTimelineCategories();

    const calendarDays = computed(() =>
        buildCalendarDays(displayToday.value, { year: urlYear.value, month: urlMonth.value, firstDayIndex: calendarSettings.firstDayIndex }),
    );
    const { unfilteredAllMonthEvents } = useCalendarGridSlots(() => calendarDays.value);

    const isAllMonth = computed(() => getListKey() === ALL_MONTH_EVENT_LIST);
    const category = computed(() => eventCategories.find(item => item.key === getListKey()));

    // Undefined for an unknown list key
    const title = computed(() => (isAllMonth.value ? `All Month · ${currentMonthDisplay.value}` : category.value?.title));

    const events = computed(() => {
        // Grouped bars are split back out, since each event gets its own card
        if (isAllMonth.value) return unfilteredAllMonthEvents.value.flatMap(event => getGroupedEvents(event));
        return category.value ? unfilteredCategorizedEvents.value[category.value.key] : [];
    });

    const dateGroups = computed(() =>
        category.value && isDateGroupedCategory(category.value.key) ? buildDateGroups(events.value, eventsStore.eventMetadata) : undefined,
    );

    const filteredOutIds = computed(
        () => new Set(events.value.filter(event => !eventFilter.isEventVisible(event.eventType, event.eventID)).map(event => event.eventID)),
    );

    return { title, events, dateGroups, filteredOutIds };
}
