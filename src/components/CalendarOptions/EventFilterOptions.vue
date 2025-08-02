<template>
    <div class="event-filter-options">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Event Type Filters</h6>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-success" @click="eventFilter.enableAllEventTypes()" :disabled="eventFilter.allEventTypesEnabled">
                    All
                </button>
                <button class="btn btn-outline-danger" @click="eventFilter.disableAllEventTypes()" :disabled="eventFilter.noEventTypesEnabled">
                    None
                </button>
            </div>
        </div>

        <div class="filter-stats mb-3">
            <small class="text-muted"> {{ eventFilter.enabledCount }} of {{ eventFilter.totalCount }} event types enabled </small>
        </div>

        <div class="filter-grid">
            <div v-for="eventTypeKey in allEventTypes" :key="eventTypeKey" class="filter-item">
                <div class="form-check form-check-inline">
                    <input
                        :id="`filter-option-${eventTypeKey}`"
                        class="form-check-input"
                        type="checkbox"
                        :checked="eventFilter.isEventTypeEnabled(eventTypeKey)"
                        @change="eventFilter.toggleEventType(eventTypeKey)"
                    />
                    <label :for="`filter-option-${eventTypeKey}`" class="form-check-label d-flex align-items-center">
                        <span class="event-color-indicator me-2" :style="{ backgroundColor: getEventTypeInfo(eventTypeKey).color }"></span>
                        <span class="event-name">{{ getEventTypeInfo(eventTypeKey).name }}</span>
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useEventFilterStore } from '@/stores/eventFilter';
import { EVENT_TYPES, getEventTypeInfo } from '@/utils/eventTypes';
import type { EventTypeKey } from '@/utils/eventTypes';

const eventFilter = useEventFilterStore();

// Show all event types in a single grid
const allEventTypes = computed((): EventTypeKey[] => {
    return Object.keys(EVENT_TYPES) as EventTypeKey[];
});
</script>

<style scoped>
.event-filter-options {
    padding: 1rem;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
}

.filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.5rem;
}

.filter-item {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 0.25rem;
    padding: 0.375rem 0.5rem;
}

.filter-item:hover {
    background-color: #f8f9fa;
    border-color: #dee2e6;
}

.event-color-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.event-name {
    font-size: 0.8rem;
    line-height: 1.2;
}

.filter-stats {
    padding: 0.5rem;
    background-color: white;
    border: 1px solid #e9ecef;
    border-radius: 0.25rem;
    text-align: center;
}

.btn-group-sm .btn {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}
</style>
