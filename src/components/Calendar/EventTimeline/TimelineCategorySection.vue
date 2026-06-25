<template>
    <CollapsibleSection
        :storage-key="`timeline/category-${category.key}`"
        header-class="timeline-category-header"
        content-class="category-section-content"
        class="event-category"
    >
        <template #title>
            <div class="category-text d-flex align-items-center gap-2">
                <span class="badge rounded-pill bg-secondary">{{ totalCount }}</span>
                <span class="category-title">{{ category.title }}</span>
            </div>
        </template>

        <!-- Events in this category -->
        <!-- For today and ongoing, show events directly -->
        <TransitionGroup
            v-if="category.key === TimelineCategory.TODAY || category.key === TimelineCategory.ONGOING"
            name="fade"
            tag="div"
            class="category-events"
        >
            <TimelineEvent
                v-for="event in categoryEvents"
                :key="event.eventID"
                :event="event"
                :is-active="activeEventId === event.eventID"
                @activate="emit('activate', $event)"
            />

            <!-- Special message for Today section when no events exist -->
            <div v-if="category.key === TimelineCategory.TODAY && totalCount === 0" key="no-events-today" class="no-events-today">
                <p>No single-day events scheduled today</p>
            </div>
        </TransitionGroup>

        <!-- For upcoming and future, group by date -->
        <TransitionGroup
            v-else-if="category.key === TimelineCategory.UPCOMING || category.key === TimelineCategory.FUTURE"
            name="fade"
            tag="div"
            class="category-events"
        >
            <div v-for="dateGroup in dateGroups" :key="dateGroup.dateKey" class="date-group">
                <div class="date-divider">
                    <span class="day-of-week">{{ dateGroup.dayOfWeek }}</span> {{ dateGroup.dateStr }}
                </div>
                <TransitionGroup name="fade" tag="div" :key="dateGroup.dateKey" class="date-events">
                    <TimelineEvent
                        v-for="event in dateGroup.events"
                        :key="event.eventID"
                        :event="event"
                        :is-active="activeEventId === event.eventID"
                        @activate="emit('activate', $event)"
                    />
                </TransitionGroup>
            </div>
        </TransitionGroup>

        <!-- Hidden events indicator -->
        <div v-if="hiddenCount > 0" class="hidden-events-indicator">{{ hiddenCount }} event{{ hiddenCount === 1 ? '' : 's' }} hidden by filters</div>
    </CollapsibleSection>
</template>

<script setup lang="ts">
import { type TimelineDateGroup } from '@/composables/useTimelineCategories';
import { type PogoEvent, TimelineCategory, type TimelineCategoryKey } from '@/utils/eventTypes';

import TimelineEvent from '../TimelineEvent/TimelineEvent.vue';
import CollapsibleSection from '@/components/CollapsibleSection.vue';

interface Props {
    category: { key: TimelineCategoryKey; title: string };
    categoryEvents: PogoEvent[];
    dateGroups: TimelineDateGroup[];
    totalCount: number;
    hiddenCount: number;
    activeEventId: string | null;
}

defineProps<Props>();

const emit = defineEmits<{
    activate: [eventId: string];
}>();
</script>

<style lang="scss" scoped>
.event-category {
    margin-bottom: 1rem;
}

.event-category:last-child {
    margin-bottom: 0;
}

/* Override CollapsibleSection styles for timeline categories */
.event-category :deep(.section-content) {
    padding: 0;
}

.event-category :deep(.timeline-category-header) {
    position: sticky;
    top: var(--tl-sticky-top);
    z-index: 10;
    margin: 0;
    padding: 0 0.8rem;
    line-height: 1;
    background: var(--bs-secondary-bg);
    border-bottom: 1px solid var(--bs-border-color);
    border-radius: 0 0 5px 5px;
}

.event-category :deep(.timeline-category-header:hover) {
    background: var(--bs-tertiary-bg);
}

.event-category :deep(.section-title) {
    flex: 1;
}

.event-category :deep(.collapse-toggle) {
    margin-left: auto;
}

.event-category :deep(.collapsible-section.closed .timeline-category-header) {
    border-bottom: 1px solid var(--bs-border-color);
}

.category-section-content {
    padding: 0 !important;
}

.category-text {
    flex-shrink: 0;
    font-size: 0.85rem;
    line-height: 1.25rem;
    font-weight: 500;
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
    margin-top: 8px;
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
    margin: 4px 0 1px 0;
    padding: 0 4px;
    font-size: 0.85rem;
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

.date-events .fade-enter-active {
    /* Override to ensure no transform/position changes during enter */
    transition: opacity 0.3s ease !important;
    transform: none !important;
}
</style>
