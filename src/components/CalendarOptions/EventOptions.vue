<template>
    <CollapsibleSection title="Event Options" storage-key="event-options">
        <div class="form-check form-switch">
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

        <div class="d-flex flex-column mt-3 slider-container">
            <label for="eventBarFontSize" class="form-label"
                >Event bar font size: <span class="bar-size--label">{{ calendarSettings.eventBarFontSize }}px</span></label
            >
            <input
                id="eventBarFontSize"
                class="form-range"
                type="range"
                min="10"
                max="18"
                step="1"
                :value="calendarSettings.eventBarFontSize"
                @input="handleFontSizeChange"
            />
            <div class="d-flex justify-content-between">
                <small class="text-muted">10</small>
                <small class="text-muted">18</small>
            </div>
        </div>
    </CollapsibleSection>
</template>

<script setup lang="ts">
import { useCalendarSettingsStore } from '@/stores/calendarSettings';

import CollapsibleSection from './CollapsibleSection.vue';

const calendarSettings = useCalendarSettingsStore();

const handleToggleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    calendarSettings.setGroupSimilarEvents(target.checked);
};

const handleFontSizeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    calendarSettings.setEventBarFontSize(Number(target.value));
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

.slider-container {
    position: relative;
    z-index: 1001;
    transition: all 0.2s ease;
}
</style>
