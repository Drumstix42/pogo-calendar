<template>
    <CollapsibleSection title="Event Grouping" :tooltip-text="tooltipText" storage-key="event-grouping">
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
    </CollapsibleSection>
</template>

<script setup lang="ts">
import { useCalendarSettingsStore } from '@/stores/calendarSettings';

import CollapsibleSection from './CollapsibleSection.vue';

const calendarSettings = useCalendarSettingsStore();

const tooltipText = 'When enabled, events with identical type and start/times will be grouped into a single bar with a count badge.';

const handleToggleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    calendarSettings.setGroupSimilarEvents(target.checked);
};
</script>

<style scoped></style>
