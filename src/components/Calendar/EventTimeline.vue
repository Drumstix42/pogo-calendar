<template>
    <div class="event-timeline" :class="{ 'sidebar-mode': isSidebarMode }">
        <div v-if="Object.keys(categorizedEvents).length === 0" class="no-events">
            <p>No upcoming events found</p>
        </div>
        <TransitionGroup v-else name="fade" tag="div" class="timeline-events">
            <!-- Loop through categories in order -->
            <div v-for="category in eventCategories" :key="category.key" class="event-category">
                <div class="category-section">
                    <!-- Category header with horizontal rule -->
                    <div class="category-header">
                        <div class="category-text d-flex align-items-center gap-2">
                            <span class="badge rounded-pill bg-secondary">{{ totalEventsCounts[category.key] }}</span>
                            <span class="category-title">{{ category.title }}</span>
                        </div>
                    </div>

                    <!-- Events in this category -->
                    <!-- For today and ongoing, show events directly -->
                    <TransitionGroup
                        v-if="category.key === TimelineCategory.TODAY || category.key === TimelineCategory.ONGOING"
                        name="fade"
                        tag="div"
                        class="category-events"
                        :key="`${category.key}-simple`"
                    >
                        <TimelineEvent
                            v-for="event in categorizedEvents[category.key]"
                            :key="event.eventID"
                            :event="event"
                            :is-active="activeEventId === event.eventID"
                            @activate="setActiveEvent"
                        />

                        <!-- Special message for Today section when no events exist -->
                        <div
                            v-if="category.key === TimelineCategory.TODAY && totalEventsCounts[category.key] === 0"
                            key="no-events-today"
                            class="no-events-today"
                        >
                            <p>No single-day events scheduled today</p>
                        </div>
                    </TransitionGroup>

                    <!-- For upcoming and future, group by date -->
                    <TransitionGroup
                        v-else-if="category.key === TimelineCategory.UPCOMING || category.key === TimelineCategory.FUTURE"
                        name="fade"
                        tag="div"
                        class="category-events"
                        :key="`${category.key}-grouped`"
                    >
                        <div v-for="dateGroup in groupedByDate[category.key]" :key="dateGroup.dateKey" class="date-group">
                            <div class="date-divider">
                                <span class="day-of-week">{{ dateGroup.dayOfWeek }}</span> {{ dateGroup.dateStr }}
                            </div>
                            <TransitionGroup name="fade" tag="div" :key="dateGroup.dateKey" class="date-events">
                                <TimelineEvent
                                    v-for="event in dateGroup.events"
                                    :key="event.eventID"
                                    :event="event"
                                    :is-active="activeEventId === event.eventID"
                                    @activate="setActiveEvent"
                                />
                            </TransitionGroup>
                        </div>
                    </TransitionGroup>

                    <!-- Hidden events indicator -->
                    <div v-if="hiddenEventsCounts[category.key] > 0" class="hidden-events-indicator">
                        {{ hiddenEventsCounts[category.key] }} event{{ hiddenEventsCounts[category.key] === 1 ? '' : 's' }} hidden by filters
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';

import { useCurrentTime } from '@/composables/useCurrentTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { type PogoEvent, TimelineCategory, type TimelineCategoryKey, sortEventsByTimingAndPriority } from '@/utils/eventTypes';

import TimelineEvent from './TimelineEvent.vue';

interface Props {
    isSidebarMode?: boolean;
}

defineProps<Props>();

const eventsStore = useEventsStore();
const eventFilter = useEventFilterStore();
const calendarSettings = useCalendarSettingsStore();
const { liveMinute } = useCurrentTime();

const activeEventId = ref<string | null>(null);

const setActiveEvent = (eventId: string): void => {
    const previousActiveId = activeEventId.value;
    activeEventId.value = activeEventId.value === eventId ? null : eventId;

    // scrollIntoView if we're expanding an event
    if (activeEventId.value && activeEventId.value !== previousActiveId) {
        // Wait for DOM update and animation
        setTimeout(() => {
            nextTick(() => {
                const element = document.querySelector(`[data-timeline-event-id="${eventId}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }, 200);
    }
};

// Event categories in order (updated order and descriptions)
const eventCategories = [
    { key: TimelineCategory.TODAY, title: 'Today Only' },
    { key: TimelineCategory.ONGOING, title: 'Ongoing Events' },
    { key: TimelineCategory.UPCOMING, title: 'Upcoming Events (Next 2 Weeks)' },
    { key: TimelineCategory.FUTURE, title: 'Future Events (Beyond 2 Weeks)' },
];

// Get filtered events
const filteredEvents = computed(() => {
    // Use liveMinute to ensure reactivity to time changes
    const now = liveMinute.value;
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
    const now = liveMinute.value;
    const today = now.startOf('day');
    const twoWeeksFromNow = now.add(2, 'weeks');

    const categories: Record<TimelineCategoryKey, PogoEvent[]> = {
        [TimelineCategory.TODAY]: [],
        [TimelineCategory.ONGOING]: [],
        [TimelineCategory.UPCOMING]: [],
        [TimelineCategory.FUTURE]: [],
    };

    const totalCounts: Record<TimelineCategoryKey, number> = {
        [TimelineCategory.TODAY]: 0,
        [TimelineCategory.ONGOING]: 0,
        [TimelineCategory.UPCOMING]: 0,
        [TimelineCategory.FUTURE]: 0,
    };

    const hiddenCounts: Record<TimelineCategoryKey, number> = {
        [TimelineCategory.TODAY]: 0,
        [TimelineCategory.ONGOING]: 0,
        [TimelineCategory.UPCOMING]: 0,
        [TimelineCategory.FUTURE]: 0,
    };

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

// Group upcoming and future events by date
const groupedByDate = computed(() => {
    type DateGroup = { dateKey: string; dayOfWeek: string; dateStr: string; events: PogoEvent[] };
    const grouped: Record<TimelineCategoryKey, DateGroup[]> = {
        [TimelineCategory.TODAY]: [],
        [TimelineCategory.ONGOING]: [],
        [TimelineCategory.UPCOMING]: [],
        [TimelineCategory.FUTURE]: [],
    };

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

// Extract individual computed properties for template convenience
const categorizedEvents = computed(() => eventData.value.categorizedEvents);
const totalEventsCounts = computed(() => eventData.value.totalEventsCounts);
const hiddenEventsCounts = computed(() => eventData.value.hiddenEventsCounts);
</script>

<style lang="scss" scoped>
.event-timeline {
    padding: 0;
}

.no-events {
    text-align: center;
    padding: 2rem;
    color: var(--bs-secondary-color);
}

.no-events p {
    margin: 0;
    font-style: italic;
}

.timeline-events {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.category-section {
    margin-bottom: 1rem;
}

.event-category:last-child .category-section {
    margin-bottom: 0;
}

.category-header {
    position: sticky;
    top: 0;
    z-index: 10;
    margin: 0;
    padding: 6px 7px;
    line-height: 1;
    background: var(--bs-secondary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    border-radius: 0 0 5px 5px;
}

/* When not in sidebar mode, stick relative to viewport */
.event-timeline:not(.sidebar-mode) .category-header {
    top: var(--navbar-height-scrolled);
}

.category-text {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--bs-body-color);
    white-space: nowrap;

    .badge {
        font-size: 0.75rem;
        line-height: 1;
        padding: 0.25em 0.5em;
    }
}

.category-events {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 12px;
    padding: 0 4px;
}

.date-events {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.hidden-events-indicator {
    margin: 12px 16px 0 16px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--bs-secondary-color);
    text-align: center;
    font-style: italic;
    background: var(--bs-tertiary-bg);
    border-radius: 4px;
    border: 1px dashed var(--bs-tertiary-color);
}

.no-events-today {
    text-align: center;
    padding: 0.5rem;
    color: var(--bs-secondary-color);
    font-style: italic;
    font-size: 0.9rem;
}

.no-events-today p {
    margin: 0;
}

.date-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
    transition: all 0.3s ease;

    &:last-child {
        margin-bottom: 0;
    }
}

.date-divider {
    margin: 0 0 2px 0;
    padding: 0 4px;
    font-size: 0.8rem;
    letter-spacing: 0.5px;
    color: var(--bs-secondary-color);
    line-height: 1.3;
    transition: all 0.3s ease;

    .day-of-week {
        font-weight: 600;
    }
}

/* Improve fade transitions for timeline events */
.category-events > *,
.date-events > * {
    transition: all 0.3s ease;
}

.category-events,
.date-events {
    position: relative;
    transition: all 0.3s ease;
}

/* Ensure fade-in happens at final position without sliding */
.category-events .fade-enter-active,
.date-events .fade-enter-active {
    transition: opacity 0.3s ease;
}

.category-events .fade-enter-from,
.date-events .fade-enter-from {
    opacity: 0;
}

/* Use absolute positioning during leave to prevent layout shift */
.category-events .fade-leave-active,
.date-events .fade-leave-active {
    position: absolute;
    width: 100%;
}

/* Prevent date-group from animating height changes that cause sliding */
/* .date-group {
    overflow: hidden;
} */

.date-events .fade-enter-active {
    /* Override to ensure no transform/position changes during enter */
    transition: opacity 0.3s ease !important;
    transform: none !important;
}
</style>
