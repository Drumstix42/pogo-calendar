<template>
    <CollapsibleSection
        :storage-key="`timeline/category-${category.key}`"
        header-class="timeline-category-header"
        content-class="category-section-content"
        class="event-category"
    >
        <template #title>
            <TimelineCategoryTitle :title="category.title" :count="totalCount" />
        </template>

        <!-- Events in this category: flat for today/ongoing, grouped by date for upcoming/future -->
        <TimelineCategoryEvents
            :events="categoryEvents"
            :date-groups="isDateGroupedCategory(category.key) ? dateGroups : undefined"
            :active-event-id="activeEventId"
            @activate="emit('activate', $event)"
        >
            <!-- Special message for Today section when no events exist -->
            <div
                v-if="category.key === TimelineCategory.TODAY && totalCount === 0 && !searchActive"
                key="no-events-today"
                class="category-empty-message"
            >
                <p>No single-day events scheduled today</p>
            </div>
        </TimelineCategoryEvents>

        <!-- No matches for the active search within this category -->
        <div v-if="searchActive && categoryEvents.length === 0" class="category-empty-message">
            <p>No matching events in this category</p>
        </div>

        <!-- Hidden events indicator: opens the whole category, unfiltered -->
        <button v-if="hiddenCount > 0" type="button" class="hidden-events-indicator" @click="openEventList(category.key)">
            {{ hiddenCount }} event{{ hiddenCount === 1 ? '' : 's' }} hidden by filters
        </button>
    </CollapsibleSection>
</template>

<script setup lang="ts">
import { type TimelineDateGroup, isDateGroupedCategory } from '@/composables/useTimelineCategories';
import { useUrlSync } from '@/composables/useUrlSync';
import { type PogoEvent, TimelineCategory, type TimelineCategoryKey } from '@/utils/eventTypes';

import TimelineCategoryEvents from './TimelineCategoryEvents.vue';
import TimelineCategoryTitle from './TimelineCategoryTitle.vue';
import CollapsibleSection from '@/components/CollapsibleSection.vue';

interface Props {
    category: { key: TimelineCategoryKey; title: string };
    categoryEvents: PogoEvent[];
    dateGroups: TimelineDateGroup[];
    totalCount: number;
    hiddenCount: number;
    activeEventId: string | null;
    searchActive: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
    activate: [eventId: string];
}>();

const { openEventList } = useUrlSync();
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

.hidden-events-indicator {
    display: block;
    width: calc(100% - 32px);
    margin: 12px 16px 0 16px;
    padding: 8px 12px;
    font-size: 12px;
    color: var(--bs-secondary-color);
    text-align: center;
    font-style: italic;
    background: var(--bs-tertiary-bg);
    border-radius: 4px;
    border: 1px dashed var(--bs-tertiary-color);
    cursor: pointer;
    transition:
        color 0.2s ease,
        background-color 0.2s ease,
        border-color 0.2s ease;

    &:hover {
        color: var(--bs-body-color);
        background: var(--bs-secondary-bg);
        border-color: var(--bs-secondary-color);
    }
}

.category-empty-message {
    text-align: center;
    padding: 0.5rem;
    color: var(--bs-secondary-color);
    font-style: italic;
    font-size: 0.9rem;
}

.category-empty-message p {
    margin: 0;
}
</style>
