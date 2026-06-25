<template>
    <div class="event-timeline" :class="{ 'sidebar-mode': isSidebarMode }">
        <div v-if="!hasAnyEvents" class="no-events">
            <p>No upcoming events found</p>
        </div>

        <TransitionGroup v-else name="fade" tag="div" class="timeline-events">
            <!-- Loop through categories in order -->
            <TimelineCategorySection
                v-for="category in eventCategories"
                :key="category.key"
                :category="category"
                :category-events="categorizedEvents[category.key]"
                :date-groups="groupedByDate[category.key] ?? []"
                :total-count="totalEventsCounts[category.key]"
                :hidden-count="hiddenEventsCounts[category.key]"
                :active-event-id="activeEventId"
                @activate="setActiveEvent"
            />
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import { useTimelineActiveEvent } from '@/composables/useTimelineActiveEvent';
import { useTimelineCategories } from '@/composables/useTimelineCategories';

import TimelineCategorySection from './TimelineCategorySection.vue';

interface Props {
    isSidebarMode?: boolean;
}

defineProps<Props>();

const { eventCategories, categorizedEvents, totalEventsCounts, hiddenEventsCounts, groupedByDate, hasAnyEvents } = useTimelineCategories();
const { activeEventId, setActiveEvent } = useTimelineActiveEvent();
</script>

<style lang="scss" scoped>
.event-timeline {
    padding: 0;

    /* Sticky offsets shared with the nested schedule headers in TimelineRaidSchedule (inherited via
       CSS custom props). --tl-sticky-top is where the category header parks; the day + section
       headers stack below it. Heights are approximate — nudge if headers gap or overlap. */
    --tl-sticky-top: 0px;
    --tl-category-header-h: 1.8rem;
    --tl-day-header-h: 1.7rem;
}

.event-timeline:not(.sidebar-mode) {
    --tl-sticky-top: var(--navbar-height-scrolled);
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
    margin: 0 auto 1rem auto;
    max-width: 800px;
}
</style>
