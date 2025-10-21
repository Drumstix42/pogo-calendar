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

            <div ref="filterGridContainer" class="filter-grid-container" @mouseleave="clearHighlight">
                <div class="filter-grid mt-1">
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
                                    <div class="filter-content" :style="{ backgroundColor: eventTypeColorsStore.getEventTypeColor(eventTypeKey) }">
                                        <span class="event-name">{{ getEventTypeInfo(eventTypeKey).name }}</span>
                                    </div>
                                    <button
                                        type="button"
                                        class="filter-color-edit-btn"
                                        :class="{ 'has-custom-color': eventTypeColorsStore.hasCustomColor(eventTypeKey) }"
                                        :title="`Customize ${getEventTypeInfo(eventTypeKey).name} color`"
                                        @click.prevent.stop="openColorModal(eventTypeKey)"
                                    >
                                        <Palette :size="16" />
                                    </button>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hidden Events Section -->
            <div class="hidden-events-section mt-3">
                <small class="text-muted mb-2 d-block">Individually hidden events will appear here.</small>

                <div v-if="hiddenEvents.length === 0" class="text-muted text-center py-2" style="font-size: 0.85rem; font-style: italic">
                    No events hidden yet!
                </div>

                <div v-else class="hidden-events-list">
                    <div v-for="hiddenEvent in hiddenEvents" :key="hiddenEvent.id" class="hidden-event-item">
                        <div class="hidden-event-content">
                            <div class="hidden-event-color-bar" :style="{ backgroundColor: hiddenEvent.color }" :title="hiddenEvent.typeName"></div>
                            <div class="hidden-event-text">
                                <div class="hidden-event-name">{{ hiddenEvent.name }}</div>
                                <div class="hidden-event-type">{{ hiddenEvent.typeName }}</div>
                            </div>
                        </div>
                        <button
                            type="button"
                            class="btn btn-icon-ghost btn-sm hidden-event-remove"
                            :title="`Show ${hiddenEvent.name}`"
                            @click="showHiddenEvent(hiddenEvent.id, hiddenEvent.name, hiddenEvent.event)"
                        >
                            <X :size="16" />
                        </button>
                    </div>
                </div>
            </div>
        </CollapsibleSection>
    </div>
</template>
<script setup lang="ts">
import { Check, Palette, X } from 'lucide-vue-next';
import { computed } from 'vue';

import { useEditColorModal } from '@/composables/useEditColorModal';
import { useEventFilterToasts } from '@/composables/useEventFilterToasts';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventTypeColorsStore } from '@/stores/eventTypeColors';
import { useEventsStore } from '@/stores/events';
import { EVENT_TYPES, getEventTypeInfo } from '@/utils/eventTypes';
import type { EventTypeKey } from '@/utils/eventTypes';

import CollapsibleSection from '@/components/CollapsibleSection.vue';

const eventFilter = useEventFilterStore();
const calendarSettings = useCalendarSettingsStore();
const eventsStore = useEventsStore();
const eventTypeColorsStore = useEventTypeColorsStore();
const editColorModal = useEditColorModal();
const { showEventByIdWithToast } = useEventFilterToasts();

function openColorModal(eventTypeKey: EventTypeKey) {
    editColorModal.openModal(eventTypeKey);
}

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

// Hidden events management
const hiddenEvents = computed(() => {
    return eventFilter.hiddenEventIds.map(eventId => {
        const event = eventsStore.getEventById(eventId);

        if (!event) {
            // Event no longer exists in data - show fallback card with ID
            return {
                id: eventId,
                name: eventId,
                typeName: 'old/missing event data',
                color: '#6c757d', // Bootstrap secondary gray
                event: null,
            };
        }

        const typeInfo = getEventTypeInfo(event.eventType);
        const metadata = eventsStore.eventMetadata[eventId];

        return {
            id: eventId,
            name: metadata?.displayName || event.name || event.eventID,
            typeName: typeInfo.name,
            color: eventsStore.eventMetadata[eventId]?.color,
            event,
        };
    });
});

function showHiddenEvent(eventId: string, eventName: string, event: any) {
    if (event) {
        showEventByIdWithToast(eventId, eventName, event);
    } else {
        // Event no longer exists, just remove from hidden list without toast
        eventFilter.showEventById(eventId);
    }
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
    border-right: none;
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

/* Color Edit Button */
.filter-color-edit-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    min-width: 30px;
    background-color: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-top-right-radius: 5px;
    border-bottom-right-radius: 5px;
    color: var(--bs-dark);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
    opacity: 0.8;

    &.has-custom-color {
        opacity: 1;
    }
}

[data-bs-theme='dark'] .filter-color-edit-btn {
    color: var(--bs-light);
}

.filter-color-edit-btn:hover {
    background-color: rgba(255, 255, 255, 0.25);
    color: var(--bs-emphasis-color);
    transform: scale(1.05);
}

.filter-color-edit-btn:active {
    transform: scale(0.95);
}

/* .filter-color-edit-btn.has-custom-color {
    background-color: rgba(255, 255, 255, 0.3);
} */

.filter-color-edit-btn.has-custom-color::after {
    content: '';
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 5px;
    height: 5px;
    background-color: var(--bs-dark);
    border-radius: 50%;
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
    opacity: 0.85;
}
[data-bs-theme='dark'] .filter-color-edit-btn.has-custom-color::after {
    background-color: var(--bs-light);
}

.filter-item:not(.filter-item--enabled) .filter-color-edit-btn {
    opacity: 0.5;
}

.filter-item:not(.filter-item--enabled):hover .filter-color-edit-btn {
    opacity: 0.7;
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

/* Hidden Events Section */
.hidden-events-section {
    border-top: 1px solid var(--bs-border-color);
    padding-top: 1rem;
}

.hidden-events-title {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--bs-body-color);
    margin-bottom: 0.5rem;
}

.hidden-events-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.hidden-event-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: var(--bs-tertiary-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    transition: all 0.2s ease;
}

.hidden-event-item:hover {
    background-color: var(--bs-secondary-bg);
    border-color: var(--bs-border-color-translucent);
}

.hidden-event-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
}

.hidden-event-color-bar {
    width: 4px;
    height: 40px;
    border-radius: 2px;
    flex-shrink: 0;
}

.hidden-event-text {
    flex: 1;
    min-width: 0;
}

.hidden-event-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--bs-body-color);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.hidden-event-type {
    font-size: 0.75rem;
    color: var(--bs-secondary-color);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.hidden-event-remove {
    flex-shrink: 0;
    opacity: 0.6;
    transition: opacity 0.2s ease;
}

.hidden-event-remove:hover {
    opacity: 1;
}
</style>
