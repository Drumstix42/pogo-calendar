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
                        <TimelineEvent v-for="event in categorizedEvents[category.key]" :key="event.eventID" :event="event" />

                        <!-- Special message for Today section when no events exist -->
                        <div v-if="category.key === 'today' && totalEventsCounts[category.key] === 0" class="no-events-today">
                            <p>No single-day events scheduled today</p>
                        </div>
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
import dayjs from 'dayjs';
import { computed } from 'vue';

import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { type PogoEvent, parseEventDate } from '@/utils/eventTypes';

import TimelineEvent from './TimelineEvent.vue';

const eventsStore = useEventsStore();
const eventFilter = useEventFilterStore();

// Event categories in order (updated order and descriptions)
const eventCategories = [
    { key: 'today', title: 'Today Only' },
    { key: 'ongoing', title: 'Ongoing Events' },
    { key: 'upcoming', title: 'Upcoming Events (Next 2 Weeks)' },
    { key: 'future', title: 'Future Events (Beyond 2 Weeks)' },
];

// Get filtered events
const filteredEvents = computed(() => {
    const startDate = dayjs().subtract(1, 'day'); // Include yesterday for ongoing events
    const endDate = dayjs().add(60, 'days'); // Show next 60 days

    return eventsStore.events
        .filter(event => {
            // Filter by date range - include events that overlap with our date range
            const eventStart = parseEventDate(event.start);
            const eventEnd = parseEventDate(event.end);

            // Include if event starts before endDate AND ends after startDate
            return eventStart.isBefore(endDate) && eventEnd.isAfter(startDate);
        })
        .sort((a, b) => {
            // Sort by start time (chronological)
            const aStart = parseEventDate(a.start);
            const bStart = parseEventDate(b.start);
            return aStart.diff(bStart);
        });
});

// Process all event data in a single pass for efficiency
const eventData = computed(() => {
    const now = dayjs();
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
        const eventStart = parseEventDate(event.start);
        const eventEnd = parseEventDate(event.end);
        const eventStartDay = eventStart.startOf('day');

        // Determine which category this event belongs to
        let categoryKey: string;
        if (eventStartDay.isSame(today) && eventEnd.isSame(today, 'day')) {
            // Single-day events happening only today
            categoryKey = 'today';
        } else if (eventStartDay.isSame(today) && eventEnd.isAfter(today, 'day')) {
            // Multi-day events that start today
            categoryKey = 'ongoing';
        } else if (now.isAfter(eventStart) && now.isBefore(eventEnd)) {
            // Events that are currently ongoing (started before today, end after today)
            categoryKey = 'ongoing';
        } else if (eventStart.isAfter(now) && eventStart.isBefore(twoWeeksFromNow)) {
            // Events starting in the future within 2 weeks
            categoryKey = 'upcoming';
        } else if (eventStart.isAfter(now)) {
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
</script>

<style scoped>
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
    margin: 0 0 12px 0;
    padding: 8px;
    background: var(--bs-secondary-bg);
    border-bottom: 1px solid var(--bs-border-color);
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
}

.hidden-events-indicator {
    margin-top: 8px;
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
</style>
