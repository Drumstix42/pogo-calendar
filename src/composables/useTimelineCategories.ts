import { computed } from 'vue';

import { useDisplayTime } from '@/composables/useDisplayTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { type PogoEvent, TimelineCategory, type TimelineCategoryKey, sortEventsByTimingAndPriority } from '@/utils/eventTypes';

export interface TimelineDateGroup {
    dateKey: string;
    dayOfWeek: string;
    dateStr: string;
    events: PogoEvent[];
}

// Event categories in display order
export const eventCategories = [
    { key: TimelineCategory.TODAY, title: 'Today Only' },
    { key: TimelineCategory.ONGOING, title: 'Ongoing Events' },
    { key: TimelineCategory.UPCOMING, title: 'Upcoming Events (Next 2 Weeks)' },
    { key: TimelineCategory.FUTURE, title: 'Future Events (Beyond 2 Weeks)' },
];

// Build a record keyed by every timeline category, each seeded with a fresh value.
function emptyCategoryRecord<T>(fill: () => T): Record<TimelineCategoryKey, T> {
    return {
        [TimelineCategory.TODAY]: fill(),
        [TimelineCategory.ONGOING]: fill(),
        [TimelineCategory.UPCOMING]: fill(),
        [TimelineCategory.FUTURE]: fill(),
    };
}

export function useTimelineCategories() {
    const eventsStore = useEventsStore();
    const eventFilter = useEventFilterStore();
    const calendarSettings = useCalendarSettingsStore();
    const { displayNow } = useDisplayTime();

    // Get filtered events
    const filteredEvents = computed(() => {
        // Use liveMinute to ensure reactivity to time changes
        const now = displayNow.value;
        const startDate = now.subtract(1, 'day'); // Include yesterday for ongoing events
        const endDate = now.add(60, 'days'); // Show next 60 days

        return eventsStore.events
            .filter(event => {
                const metadata = eventsStore.eventMetadata[event.eventID];
                if (!metadata) return false;

                // Include if event starts before endDate AND ends after startDate
                return metadata.startDate.isBefore(endDate) && metadata.endDate.isAfter(startDate);
            })
            .sort((a, b) => {
                // Sort by start time (chronological)
                const aMetadata = eventsStore.eventMetadata[a.eventID];
                const bMetadata = eventsStore.eventMetadata[b.eventID];
                return aMetadata.startDate.diff(bMetadata.startDate);
            });
    });

    const eventData = computed(() => {
        // Use liveMinute to ensure reactivity to time changes
        const now = displayNow.value;
        const today = now.startOf('day');
        const twoWeeksFromNow = now.add(2, 'weeks');

        const categories = emptyCategoryRecord<PogoEvent[]>(() => []);
        const totalCounts = emptyCategoryRecord<number>(() => 0);
        const hiddenCounts = emptyCategoryRecord<number>(() => 0);

        filteredEvents.value.forEach(event => {
            const metadata = eventsStore.eventMetadata[event.eventID];
            if (!metadata) return;

            const eventStartDay = metadata.startDate.startOf('day');

            // Determine which category this event belongs to
            let categoryKey: TimelineCategoryKey;
            if (eventStartDay.isSame(today) && metadata.endDate.isSame(today, 'day')) {
                // Single-day events happening only today
                categoryKey = TimelineCategory.TODAY;
            } else if (eventStartDay.isSame(today) && metadata.endDate.isAfter(today, 'day')) {
                // Multi-day events that start today
                categoryKey = TimelineCategory.ONGOING;
            } else if (now.isAfter(metadata.startDate) && now.isBefore(metadata.endDate)) {
                // Events that are currently ongoing (started before today, end after today)
                categoryKey = TimelineCategory.ONGOING;
            } else if (metadata.startDate.isAfter(now) && metadata.startDate.isBefore(twoWeeksFromNow)) {
                // Events starting in the future within 2 weeks
                categoryKey = TimelineCategory.UPCOMING;
            } else if (metadata.startDate.isAfter(now)) {
                // Events starting more than 2 weeks from now
                categoryKey = TimelineCategory.FUTURE;
            } else {
                // Past events - don't categorize them (they should be filtered out earlier)
                return; // Skip past events
            }

            // Always count total events
            totalCounts[categoryKey]++;

            // Add to visible events or hidden count based on filter setting
            const shouldFilter = calendarSettings.filtersApplyToTimeline;
            const isVisible = !shouldFilter || eventFilter.isEventVisible(event.eventType, event.eventID);

            if (isVisible) {
                categories[categoryKey].push(event);
            } else {
                hiddenCounts[categoryKey]++;
            }
        });

        // Apply sorting to each category
        (Object.keys(categories) as TimelineCategoryKey[]).forEach(key => {
            categories[key] = sortEventsByTimingAndPriority(categories[key], eventsStore.eventMetadata);
        });

        return {
            categorizedEvents: categories,
            totalEventsCounts: totalCounts,
            hiddenEventsCounts: hiddenCounts,
        };
    });

    // Extract individual computed properties for template convenience
    const categorizedEvents = computed(() => eventData.value.categorizedEvents);
    const totalEventsCounts = computed(() => eventData.value.totalEventsCounts);
    const hiddenEventsCounts = computed(() => eventData.value.hiddenEventsCounts);

    // Whether any event (visible or hidden by filters) falls into the timeline window. Drives the
    // empty-state message; based on totals so a fully-filtered view still shows its hidden indicators.
    const hasAnyEvents = computed(() => Object.values(totalEventsCounts.value).some(count => count > 0));

    // Group upcoming and future events by date (only these two categories are grouped)
    const groupedByDate = computed(() => {
        const grouped: Partial<Record<TimelineCategoryKey, TimelineDateGroup[]>> = {};

        ([TimelineCategory.UPCOMING, TimelineCategory.FUTURE] as const).forEach(categoryKey => {
            const events = categorizedEvents.value[categoryKey] || [];
            const dateGroups = new Map<string, PogoEvent[]>();

            events.forEach(event => {
                const metadata = eventsStore.eventMetadata[event.eventID];
                if (!metadata) return;

                const dateKey = metadata.startDate.format('YYYY-MM-DD');
                if (!dateGroups.has(dateKey)) {
                    dateGroups.set(dateKey, []);
                }
                dateGroups.get(dateKey)!.push(event);
            });

            // Convert map to sorted array
            const sortedDates = Array.from(dateGroups.keys()).sort();
            grouped[categoryKey] = sortedDates.map(dateKey => {
                const firstEvent = dateGroups.get(dateKey)![0];
                const metadata = eventsStore.eventMetadata[firstEvent.eventID];
                const dayOfWeek = metadata.startDate.format('dddd').toUpperCase();
                const dateStr = metadata.startDate.format('MMM D, YYYY');

                return {
                    dateKey,
                    dayOfWeek,
                    dateStr,
                    events: dateGroups.get(dateKey)!,
                };
            });
        });

        return grouped;
    });

    return {
        eventCategories,
        categorizedEvents,
        totalEventsCounts,
        hiddenEventsCounts,
        groupedByDate,
        hasAnyEvents,
    };
}
