<template>
    <div class="event-filter-options">
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Event Type Filters</h6>
        </div>

        <div class="filter-stats mb-3">
            <div class="btn-group btn-group-sm">
                <button
                    :class="eventFilter.allEventTypesEnabled ? 'btn btn-dark' : 'btn btn-outline-secondary'"
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
            <small class="text-muted"> {{ eventFilter.enabledCount }} of {{ eventFilter.totalCount }} event types enabled </small>
        </div>

        <div ref="filterGridContainer" class="filter-grid-container" :class="{ 'can-scroll-up': canScrollUp, 'can-scroll-down': canScrollDown }">
            <div class="filter-grid">
                <div v-for="group in eventGroups" :key="group.title" class="filter-group">
                    <h6 class="filter-group-title">{{ group.title }}</h6>
                    <div class="filter-group-items">
                        <label
                            v-for="eventTypeKey in group.eventTypes"
                            :key="eventTypeKey"
                            class="filter-item"
                            :class="{ 'filter-item--enabled': eventFilter.isEventTypeEnabled(eventTypeKey) }"
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
    </div>
</template>
<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';

import { useEventFilterStore } from '@/stores/eventFilter';
import { EVENT_TYPES, getEventTypeInfo } from '@/utils/eventTypes';
import type { EventTypeKey } from '@/utils/eventTypes';

const eventFilter = useEventFilterStore();
const filterGridContainer = ref<HTMLElement>();
const canScrollUp = ref(false);
const canScrollDown = ref(false);

// Check scroll position and update shadow hints
const checkScrollPosition = () => {
    const container = filterGridContainer.value?.querySelector('.filter-grid') as HTMLElement;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    canScrollUp.value = scrollTop > 0;
    canScrollDown.value = scrollTop < scrollHeight - clientHeight - 1; // -1 for rounding
};

onMounted(() => {
    nextTick(() => {
        const container = filterGridContainer.value?.querySelector('.filter-grid') as HTMLElement;
        if (container) {
            checkScrollPosition();
            container.addEventListener('scroll', checkScrollPosition);
        }
    });
});

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
.event-filter-options {
    padding: 1rem;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
}

.filter-grid-container {
    position: relative;
}

.filter-grid-container::before,
.filter-grid-container::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 5px;
    pointer-events: none;
    z-index: 10;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.filter-grid-container::before {
    top: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));
}

.filter-grid-container::after {
    bottom: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0));
}

.filter-grid-container.can-scroll-up::before {
    opacity: 1;
}

.filter-grid-container.can-scroll-down::after {
    opacity: 1;
}

.filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
    max-height: min(60vh, 422px);
    overflow-y: auto;
    padding-right: 0.5rem;
}

/* Custom scrollbar styling */
.filter-grid::-webkit-scrollbar {
    width: 8px;
}

.filter-grid::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.filter-grid::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.filter-grid::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.filter-group {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 0.375rem;
    padding: 0.5rem 1rem;
}

.filter-group-title {
    margin: 0 0 0.75rem 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #495057;
    border-bottom: 1px solid #e9ecef;
    padding: 0.5rem 0 0.5rem 0;
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 5;
}

.filter-group-items {
    display: grid;
    gap: 0.5rem;
}

.filter-item {
    position: relative;
    cursor: pointer;
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.2s ease;
}

.filter-item:hover .filter-content {
    filter: brightness(1.05) saturate(1.1);
}

.filter-item:active .filter-content {
    filter: brightness(1.2) saturate(1.1);
}

.filter-item:hover .filter-checkbox-area {
    border-color: #adb5bd;
}

.filter-item:hover .filter-content {
    border-color: rgba(0, 0, 0, 0.2);
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
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-right: none;
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
    transition: all 0.2s ease;
}

.filter-checkbox-area--checked {
    background-color: #f8f9fa;
    border-color: #dee2e6;
}

.checkbox-icon {
    color: transparent;
    transition: color 0.2s ease;
    stroke-width: 2.5;
}

.checkbox-icon--checked {
    color: #333;
}

.filter-item:hover .checkbox-icon--checked {
    color: #000;
}

.filter-content {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    flex: 1;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
}

.filter-item--enabled .filter-content {
    opacity: 1;
}

.filter-item:not(.filter-item--enabled) .filter-content {
    opacity: 0.5;
    filter: grayscale(0.6);
}

.filter-item:not(.filter-item--enabled):active .filter-content {
    opacity: 0.6;
    filter: grayscale(0.6);
}

.event-name {
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.1;
}

.filter-stats {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.btn-group-sm .btn {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
}
</style>
