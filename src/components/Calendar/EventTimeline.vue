<template>
    <div class="event-timeline">
        <div v-if="Object.keys(categorizedEvents).length === 0" class="no-events">
            <p>No upcoming events found</p>
        </div>
        <div v-else class="timeline-events">
            <!-- Loop through categories in order -->
            <div v-for="category in eventCategories" :key="category.key" class="event-category">
                <div v-if="categorizedEvents[category.key]?.length > 0 || category.key === 'today'" class="category-section">
                    <!-- Category header with horizontal rule -->
                    <div class="category-header">
                        <div class="category-text d-flex align-items-center gap-2">
                            <span class="badge rounded-pill bg-secondary">{{ totalEventsCounts[category.key] }}</span>
                            <span class="category-title">{{ category.title }}</span>
                        </div>
                    </div>

                    <!-- Events in this category -->
                    <div class="category-events">
                        <!-- For today and ongoing, show events directly -->
                        <template v-if="category.key === 'today' || category.key === 'ongoing'">
                            <TimelineEvent
                                v-for="event in categorizedEvents[category.key]"
                                :key="event.eventID"
                                :event="event"
                                :is-active="activeEventId === event.eventID"
                                @activate="setActiveEvent"
                            />

                            <!-- Special message for Today section when no events exist -->
                            <div v-if="category.key === 'today' && totalEventsCounts[category.key] === 0" class="no-events-today">
                                <p>No single-day events scheduled today</p>
                            </div>
                        </template>

                        <!-- For upcoming and future, group by date -->
                        <template v-else-if="category.key === 'upcoming' || category.key === 'future'">
                            <div v-for="dateGroup in groupedByDate[category.key]" :key="dateGroup.dateKey" class="date-group">
                                <div class="date-divider">
                                    <span class="day-of-week">{{ dateGroup.dayOfWeek }}</span> {{ dateGroup.dateStr }}
                                </div>
                                <TimelineEvent
                                    v-for="event in dateGroup.events"
                                    :key="event.eventID"
                                    :event="event"
                                    :is-active="activeEventId === event.eventID"
                                    @activate="setActiveEvent"
                                />
                            </div>
                        </template>
                    </div>

                    <!-- Hidden events indicator -->
                    <div v-if="hiddenEventsCounts[category.key] > 0" class="hidden-events-indicator">
                        {{ hiddenEventsCounts[category.key] }} event{{ hiddenEventsCounts[category.key] === 1 ? '' : 's' }} hidden by filters
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';

import { useCurrentTime } from '@/composables/useCurrentTime';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { type PogoEvent, sortEventsByTimingAndPriority } from '@/utils/eventTypes';

import TimelineEvent from './TimelineEvent.vue';

const eventsStore = useEventsStore();
const eventFilter = useEventFilterStore();
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
    { key: 'today', title: 'Today Only' },
    { key: 'ongoing', title: 'Ongoing Events' },
    { key: 'upcoming', title: 'Upcoming Events (Next 2 Weeks)' },
    { key: 'future', title: 'Future Events (Beyond 2 Weeks)' },
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

    const categories: Record<string, PogoEvent[]> = {
        today: [],
        ongoing: [],
        upcoming: [],
        future: [],
    };

    const totalCounts: Record<string, number> = {
        today: 0,
        ongoing: 0,
        upcoming: 0,
        future: 0,
    };

    const hiddenCounts: Record<string, number> = {
        today: 0,
        ongoing: 0,
        upcoming: 0,
        future: 0,
    };

    filteredEvents.value.forEach(event => {
        const metadata = eventsStore.eventMetadata[event.eventID];
        if (!metadata) return;

        const eventStartDay = metadata.startDate.startOf('day');

        // Determine which category this event belongs to
        let categoryKey: string;
        if (eventStartDay.isSame(today) && metadata.endDate.isSame(today, 'day')) {
            // Single-day events happening only today
            categoryKey = 'today';
        } else if (eventStartDay.isSame(today) && metadata.endDate.isAfter(today, 'day')) {
            // Multi-day events that start today
            categoryKey = 'ongoing';
        } else if (now.isAfter(metadata.startDate) && now.isBefore(metadata.endDate)) {
            // Events that are currently ongoing (started before today, end after today)
            categoryKey = 'ongoing';
        } else if (metadata.startDate.isAfter(now) && metadata.startDate.isBefore(twoWeeksFromNow)) {
            // Events starting in the future within 2 weeks
            categoryKey = 'upcoming';
        } else if (metadata.startDate.isAfter(now)) {
            // Events starting more than 2 weeks from now
            categoryKey = 'future';
        } else {
            // Past events - don't categorize them (they should be filtered out earlier)
            return; // Skip past events
        }

        // Always count total events
        totalCounts[categoryKey]++;

        // Add to visible events or hidden count based on filter
        if (eventFilter.isEventTypeEnabled(event.eventType)) {
            categories[categoryKey].push(event);
        } else {
            hiddenCounts[categoryKey]++;
        }
    });

    // Apply sorting to each category
    Object.keys(categories).forEach(key => {
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
    const grouped: Record<string, Array<{ dateKey: string; dayOfWeek: string; dateStr: string; events: PogoEvent[] }>> = {
        upcoming: [],
        future: [],
    };

    (['upcoming', 'future'] as const).forEach(categoryKey => {
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
    top: var(--navbar-height-scrolled);
    z-index: 10;
    margin: 0;
    padding: 6px 7px;
    line-height: 1;
    background: var(--bs-secondary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    border-radius: 0 0 5px 5px;
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

    .day-of-week {
        font-weight: 600;
    }
}
</style>
