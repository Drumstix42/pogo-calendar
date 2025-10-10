<template>
    <CollapsibleSection title="Event Options" storage-key="calendarSettings/event-options">
        <div class="d-flex flex-column event-bar-size-container slider-container">
            <label for="eventBarFontSize" class="form-label"
                >Calendar event bar font size: <span class="bar-size--label">{{ localFontSize }}px</span></label
            >
            <input
                id="eventBarFontSize"
                class="form-range"
                type="range"
                min="10"
                max="18"
                step="1"
                :value="localFontSize"
                @input="handleFontSizeChange"
            />
            <div class="d-flex justify-content-between">
                <small class="text-muted">10</small>
                <small class="text-muted">18</small>
            </div>
        </div>

        <div class="form-check form-switch mt-3">
            <input
                id="groupSimilarEvents"
                class="form-check-input"
                type="checkbox"
                role="switch"
                :checked="calendarSettings.groupSimilarEvents"
                @change="handleToggleChange"
            />
            <label for="groupSimilarEvents" class="form-check-label">Group similar event bars</label>
        </div>
        <small class="text-muted mt-1 d-block"
            >When enabled, events with identical type and start/times will be grouped into a single bar with a count badge.</small
        >
    </CollapsibleSection>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core';
import { nextTick, ref, watch } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';

import CollapsibleSection from '@/components/CollapsibleSection.vue';

const calendarSettings = useCalendarSettingsStore();

const localFontSize = ref(calendarSettings.eventBarFontSize);

// Debounced font size: immediate UI feedback with delayed store persistence
const debouncedUpdateFontSize = useDebounceFn((size: number) => {
    calendarSettings.setEventBarFontSize(size);
}, 50);

watch(localFontSize, newSize => {
    debouncedUpdateFontSize(newSize);

    // Open calendar section if collapsed to show the changes
    const wasCollapsed = calendarSettings.isCollapsibleSectionCollapsed('main/calendar-section');
    if (wasCollapsed) {
        calendarSettings.setCollapsibleSection('main/calendar-section', false);
    }

    // Scroll to calendar section after expansion animation completes
    setTimeout(
        () => {
            nextTick(() => {
                const calendarSection = document.querySelector('.calendar-section');
                if (calendarSection) {
                    calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        },
        wasCollapsed ? 400 : 100,
    );
});

watch(
    () => calendarSettings.eventBarFontSize,
    newSize => {
        if (localFontSize.value !== newSize) {
            localFontSize.value = newSize;
        }
    },
);

const handleToggleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    calendarSettings.setGroupSimilarEvents(target.checked);
};

const handleFontSizeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    localFontSize.value = Number(target.value);
};
</script>

<style scoped>
.form-label {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0;
}

.bar-size--label {
    font-size: 0.875rem;
    font-weight: 600;
    margin-left: 0.25rem;
}

.event-bar-size-container {
    width: 250px;
    max-width: 100%;
}

.slider-container {
    position: relative;
    z-index: 1001;
    transition: all 0.2s ease;
}
</style>
