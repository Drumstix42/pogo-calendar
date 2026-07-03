<template>
    <div class="filter-grid-container" @mouseleave="clearHighlight">
        <div class="filter-grid mt-1">
            <div v-for="group in eventGroups" :key="group.title" class="filter-group">
                <h6 class="filter-group-title">{{ group.title }}</h6>
                <div class="filter-group-items">
                    <EventTypeFilterItem
                        v-for="eventTypeKey in group.eventTypes"
                        :key="eventTypeKey"
                        :event-type-key="eventTypeKey"
                        @mouseenter="highlightEventType(eventTypeKey)"
                        @mouseleave="clearHighlight"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { groupEventTypesByCategory } from '@/utils/eventTypeGroups';
import type { EventTypeKey } from '@/utils/eventTypes';

import EventTypeFilterItem from './EventTypeFilterItem.vue';

// Event type groups (by category), built once from the static EVENT_TYPES record.
const eventGroups = groupEventTypesByCategory();

// Hovering a filter item highlights matching events elsewhere via a body data-attribute
// (consumed by global styles in src/styles/style.scss).
function highlightEventType(eventTypeKey: EventTypeKey) {
    document.body.setAttribute('data-filter-hover-event-type', eventTypeKey);
}

function clearHighlight() {
    document.body.removeAttribute('data-filter-hover-event-type');
}
</script>

<style scoped>
.filter-grid-container {
    position: relative;
}

.filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.5rem;
}

.filter-group {
    border-radius: 0.375rem;
}

.filter-group-title {
    z-index: 5;
    position: sticky;
    top: 0;
    margin: 0;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--bs-body-color);
    padding: 0.5rem 0 0.5rem 0.5rem;
    border-bottom: 1px solid var(--bs-border-color);
    border-radius: 5px 5px 0 0;
    background-color: var(--bs-tertiary-bg);
}

.filter-group-items {
    display: grid;
    gap: 1px;
    padding: 5px;
}
</style>
