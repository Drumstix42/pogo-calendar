<template>
    <CollapsibleSection title="Event Type Filters" storage-key="calendarSettings/event-filters" class="flex-grow-section">
        <!-- Timeline filter toggle -->
        <div class="form-check form-switch mb-2">
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

        <small class="text-muted mb-1 d-block">Choose which event types are displayed.</small>

        <div ref="filterGridContainer" class="filter-grid-container" @mouseleave="clearHighlight">
            <div class="filter-grid">
                <div v-for="group in eventGroups" :key="group.title" class="filter-group">
                    <h6 class="filter-group-title">{{ group.title }}</h6>
                    <div class="filter-group-items">
                        <label
                            v-for="eventTypeKey in group.eventTypes"
                            :key="eventTypeKey"
                            class="filter-item"
                            :class="{ 'filter-item--enabled': eventFilter.isEventTypeEnabled(eventTypeKey) }"
                            @mouseenter="highlightEventType(eventTypeKey)"
                            @mouseleave="clearHighlight"
                        >
                            <input
                                :id="`filter-option-${eventTypeKey}`"
                                class="filter-checkbox"
                                type="checkbox"
                                :checked="eventFilter.isEventTypeEnabled(eventTypeKey)"
                                @change="eventFilter.toggleEventType(eventTypeKey)"
                            />
                            <div class="filter-layout">
                                <div
                                    class="filter-checkbox-area"
                                    :class="{ 'filter-checkbox-area--checked': eventFilter.isEventTypeEnabled(eventTypeKey) }"
                                >
                                    <Check
                                        :size="22"
                                        class="checkbox-icon"
                                        :class="{ 'checkbox-icon--checked': eventFilter.isEventTypeEnabled(eventTypeKey) }"
                                    />
                                </div>
                                <div class="filter-content" :style="{ backgroundColor: getEventTypeInfo(eventTypeKey).color }">
                                    <span class="event-name">{{ getEventTypeInfo(eventTypeKey).name }}</span>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </CollapsibleSection>
</template>
<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { EVENT_TYPES, getEventTypeInfo } from '@/utils/eventTypes';
import type { EventTypeKey } from '@/utils/eventTypes';

import CollapsibleSection from '@/components/CollapsibleSection.vue';

const eventFilter = useEventFilterStore();
const calendarSettings = useCalendarSettingsStore();

// Timeline filter toggle handler
const handleTimelineFilterToggle = (event: Event) => {
    const target = event.target as HTMLInputElement;
    calendarSettings.setFiltersApplyToTimeline(target.checked);
};

// Event type highlighting functions
const highlightEventType = (eventTypeKey: EventTypeKey) => {
    document.body.setAttribute('data-filter-hover-event-type', eventTypeKey);
};

const clearHighlight = () => {
    document.body.removeAttribute('data-filter-hover-event-type');
};

// Category display names
const categoryDisplayNames = {
    'community-and-raids': 'Community & Raids',
    research: 'Research',
    'seasonal-and-premium': 'Seasonal & Premium',
    'events-and-misc': 'Events & Misc.',
} as const;

// Generate event groups dynamically from EVENT_TYPES categories
const eventGroups = computed(() => {
    const groups = new Map<string, EventTypeKey[]>();

    // Group event types by their category
    Object.entries(EVENT_TYPES).forEach(([eventTypeKey, eventTypeInfo]) => {
        const category = eventTypeInfo.category;
        if (!groups.has(category)) {
            groups.set(category, []);
        }
        groups.get(category)!.push(eventTypeKey as EventTypeKey);
    });

    // Convert to array format and sort alphabetically within each category
    return Array.from(groups.entries())
        .map(([category, eventTypes]) => ({
            title: categoryDisplayNames[category as keyof typeof categoryDisplayNames],
            eventTypes: eventTypes.sort((a, b) => {
                const aName = EVENT_TYPES[a].name;
                const bName = EVENT_TYPES[b].name;
                return aName.localeCompare(bName); // Sort alphabetically by display name
            }),
        }))
        .sort((a, b) => {
            // Sort categories in desired order
            const order = ['seasonal-and-premium', 'research', 'community-and-raids', 'events-and-misc'];
            const aIndex = order.indexOf(
                Object.keys(categoryDisplayNames).find(key => categoryDisplayNames[key as keyof typeof categoryDisplayNames] === a.title) || '',
            );
            const bIndex = order.indexOf(
                Object.keys(categoryDisplayNames).find(key => categoryDisplayNames[key as keyof typeof categoryDisplayNames] === b.title) || '',
            );
            return aIndex - bIndex;
        });
});
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

.filter-item {
    position: relative;
    cursor: pointer;
    border-radius: 5px;
    overflow: hidden;
    transition: all 0.2s ease;
}

.filter-item:hover .filter-content {
    filter: brightness(1.05) saturate(1.1);
    transition: none;
}

.filter-item:active .filter-content {
    filter: brightness(1.2) saturate(1.1);
}

.filter-item:hover .filter-checkbox-area {
    border-color: var(--bs-border-color-translucent);
}

.filter-item:hover .filter-content {
    border-color: var(--bs-border-color-translucent);
}

.filter-checkbox {
    position: absolute;
    opacity: 0;
    pointer-events: none;
}

.filter-layout {
    display: flex;
    min-height: 30px;
}

.filter-checkbox-area {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    background-color: #fcfcfc;
    border: 1px solid var(--bs-border-color);
    border-right: none;
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    transition: all 0.2s ease;
}

[data-bs-theme='dark'] .filter-checkbox-area {
    background-color: #8a8b8c;
}

.filter-checkbox-area--checked {
    background-color: #e4e6e7;
    border-color: var(--bs-border-color);
}

[data-bs-theme='dark'] .filter-checkbox-area--checked {
    background-color: #e2e3e4;
}

.checkbox-icon {
    color: transparent;
    transition: color 0.2s ease;
    stroke-width: 2.5;
    transform: scale(0.25);
    transition: transform 0.2s ease;
}

.checkbox-icon--checked {
    color: #1f2023;
    transform: scale(1);
}

.filter-item:hover .checkbox-icon--checked {
    transform: scale(1.06);
}

.filter-content {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    flex: 1;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
    transition: all 0.2s ease;
}

.filter-item--enabled .filter-content {
    opacity: 1;
}

.filter-item:not(.filter-item--enabled) .filter-content {
    opacity: 0.5;
    filter: grayscale(0.6);
    transition: all 0.5s ease;
}

.filter-item:not(.filter-item--enabled):active .filter-content,
.filter-item:not(.filter-item--enabled):hover .filter-content {
    opacity: 0.7;
    filter: grayscale(0.5);
}

.event-name {
    font-size: 0.8rem;
    font-weight: 500;
    line-height: 1.1;
}

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
