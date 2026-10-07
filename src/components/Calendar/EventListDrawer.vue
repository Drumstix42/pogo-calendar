<template>
    <BaseDrawer :show="show && !!title" close-label="Close event list" @close="emit('close')">
        <template #title>
            <TimelineCategoryTitle :title="title ?? ''" :count="events.length" />
        </template>

        <div ref="bodyRef" class="event-list-body">
            <div class="event-list-content">
                <TimelineNoEvents v-if="events.length === 0" message="No events found" />
                <TimelineCategoryEvents
                    v-else
                    :events="events"
                    :date-groups="dateGroups"
                    :active-event-id="activeEventId"
                    :filtered-out-ids="filteredOutIds"
                    @activate="setActiveEvent"
                />
            </div>
        </div>

        <div v-if="filteredOutIds.size > 0" class="event-list-footer">
            <FilterSummary :hidden-event-count="filteredOutIds.size" @open-filters="openFilters" />
        </div>
    </BaseDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import { useEventList } from '@/composables/useEventList';
import { useOpenEventFilters } from '@/composables/useOpenEventFilters';
import { useTimelineActiveEvent } from '@/composables/useTimelineActiveEvent';
import { useUrlSync } from '@/composables/useUrlSync';

import BaseDrawer from '@/components/BaseDrawer.vue';
import TimelineCategoryEvents from '@/components/Calendar/EventTimeline/TimelineCategoryEvents.vue';
import TimelineCategoryTitle from '@/components/Calendar/EventTimeline/TimelineCategoryTitle.vue';
import TimelineNoEvents from '@/components/Calendar/EventTimeline/TimelineNoEvents.vue';
import FilterSummary from '@/components/Calendar/FilterSummary.vue';

interface Props {
    show: boolean;
    /** `all-month`, or a timeline category key */
    listKey?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
    close: [];
}>();

const bodyRef = ref<HTMLElement>();

const { title, events, dateGroups, filteredOutIds } = useEventList(() => props.listKey);
const { activeEventId, setActiveEvent } = useTimelineActiveEvent(() => bodyRef.value);
const { closeEventList } = useUrlSync();
const { openEventFilters } = useOpenEventFilters();

watch(
    () => props.listKey,
    () => {
        activeEventId.value = null;
    },
);

async function openFilters() {
    // Wait for the drawer's URL update, or opening Settings would carry its query param over
    await closeEventList();
    openEventFilters();
}
</script>

<style scoped>
.event-list-body {
    /* Nothing sticky sits above the list in here, so the schedule headers park at the very top */
    --tl-sticky-top: 0px;
    --tl-category-header-h: 0px;

    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    padding: 0.25rem 0.5rem 1rem 0.5rem;
}

/* Same max width as the timeline */
.event-list-content {
    max-width: 800px;
    margin: 0 auto;
}

.event-list-footer {
    flex: 0 0 auto;
    padding: 0 1rem calc(0.5rem + env(safe-area-inset-bottom)) 1rem;
    border-top: 1px solid var(--bs-border-color);
    background-color: var(--bs-body-bg);
}
</style>
