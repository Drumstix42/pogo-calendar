<template>
    <div class="first-day-selector">
        <div class="d-flex align-items-center mb-3">
            <h6 class="mb-0 me-2" style="line-height: 1">Week Starts On</h6>
            <VTooltip class="d-none d-md-flex align-items-center" placement="top" :delay="{ show: 300, hide: 0 }" distance="8">
                <Info :size="16" class="text-muted" />
                <template #popper>
                    <div class="calendar-options-tooltip-text">Calendar week will start on the selected day.</div>
                </template>
            </VTooltip>
        </div>

        <select id="firstDayOfWeek" class="form-select" :value="calendarSettings.firstDayOfWeek" @change="handleDayChange">
            <option v-for="day in calendarSettings.allDayNames" :key="day" :value="day">
                {{ day }}
            </option>
        </select>

        <small class="text-muted mt-2 d-block d-md-none">Calendar week will start on the selected day.</small>
    </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import type { FirstDayOfWeek } from '@/stores/calendarSettings';

const calendarSettings = useCalendarSettingsStore();

const handleDayChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    calendarSettings.setFirstDayOfWeek(target.value as FirstDayOfWeek);
};
</script>

<style scoped>
.first-day-selector {
    padding: 1rem;
    background-color: var(--calendar-options-item-bg);
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
}
</style>
