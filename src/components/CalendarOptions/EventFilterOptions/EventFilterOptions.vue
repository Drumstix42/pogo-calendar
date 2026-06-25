<template>
    <div>
        <CollapsibleSection
            id="event-type-filters-section"
            title="Event Type Filters"
            storage-key="calendarSettings/event-filters"
            class="flex-grow-section"
        >
            <!-- Timeline filter toggle -->
            <div class="form-check form-switch">
                <input
                    id="filtersApplyToTimeline"
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    :checked="calendarSettings.filtersApplyToTimeline"
                    @change="handleTimelineFilterToggle"
                />
                <label for="filtersApplyToTimeline" class="form-check-label">Apply filters to Timeline</label>
            </div>
            <small class="text-muted d-block mt-2 mb-4">Control whether hidden events are also filtered from the Timeline.</small>

            <div class="filter-stats mb-2">
                <div class="btn-group btn-group-sm">
                    <button
                        :class="eventFilter.allEventTypesEnabled ? 'btn btn-secondary' : 'btn btn-outline-secondary'"
                        @click="eventFilter.enableAllEventTypes()"
                    >
                        All
                    </button>
                    <button
                        :class="eventFilter.noEventTypesEnabled ? 'btn btn-secondary' : 'btn btn-outline-secondary'"
                        @click="eventFilter.disableAllEventTypes()"
                    >
                        None
                    </button>
                </div>
                <div v-if="eventFilter.enabledCount === eventFilter.totalCount" class="text-muted">
                    All {{ eventFilter.totalCount }} event types enabled
                </div>
                <div v-else-if="eventFilter.enabledCount === 0" class="text-muted">
                    <i>All {{ eventFilter.totalCount }} event types disabled</i>
                </div>
                <div v-else class="text-muted">{{ eventFilter.enabledCount }} of {{ eventFilter.totalCount }} event types enabled</div>
            </div>

            <small class="text-muted d-block">Choose which event types are displayed.</small>
            <small v-if="hiddenEvents.length > 0" class="text-muted d-block"
                ><span class="fw-bold">{{ hiddenEvents.length }} specific event(s) hidden</span> (see bottom of list).</small
            >

            <EventTypeFilterGrid />

            <!-- Hidden Events Section -->
            <HiddenEventsList />
        </CollapsibleSection>
    </div>
</template>
<script setup lang="ts">
import { useHiddenEvents } from '@/composables/useHiddenEvents';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';

import EventTypeFilterGrid from './EventTypeFilterGrid.vue';
import HiddenEventsList from './HiddenEventsList.vue';
import CollapsibleSection from '@/components/CollapsibleSection.vue';

const eventFilter = useEventFilterStore();
const calendarSettings = useCalendarSettingsStore();
const { hiddenEvents } = useHiddenEvents();

// Timeline filter toggle handler
function handleTimelineFilterToggle(event: Event) {
    const target = event.target as HTMLInputElement;
    calendarSettings.setFiltersApplyToTimeline(target.checked);
}
</script>

<style scoped>
.filter-stats {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.75rem;
}

.btn-group-sm .btn {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
}

.form-check.form-switch {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-check-input {
    margin-top: 0;
}

.form-check-input:checked {
    background-color: var(--bs-success);
    border-color: var(--bs-success);
}

.form-check-input:focus {
    box-shadow: 0 0 0 0.25rem rgba(var(--bs-success-rgb), 0.25);
    border-color: var(--bs-focus-ring-color);
}
</style>
