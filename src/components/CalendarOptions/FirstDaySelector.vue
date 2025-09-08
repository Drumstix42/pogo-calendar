<template>
    <CollapsibleSection title="Week Starts On" :tooltip-text="tooltipText" storage-key="first-day-selector">
        <select id="firstDayOfWeek" class="form-select" :value="calendarSettings.firstDayOfWeek" @change="handleDayChange">
            <option v-for="day in calendarSettings.allDayNames" :key="day" :value="day">
                {{ day }}
            </option>
        </select>
    </CollapsibleSection>
</template>

<script setup lang="ts">
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import type { FirstDayOfWeek } from '@/stores/calendarSettings';

import CollapsibleSection from './CollapsibleSection.vue';

const calendarSettings = useCalendarSettingsStore();

const tooltipText = 'Calendar week will start on the selected day.';

const handleDayChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    calendarSettings.setFirstDayOfWeek(target.value as FirstDayOfWeek);
};
</script>
