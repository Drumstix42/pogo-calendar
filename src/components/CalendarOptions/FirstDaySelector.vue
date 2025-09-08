<template>
    <div class="option-section">
        <div class="d-flex align-items-center">
            <h6 class="section-title me-2">Week Starts On</h6>
            <VTooltip class="d-none d-md-flex align-items-center" placement="top" :delay="{ show: 300, hide: 0 }" distance="8">
                <Info :size="16" class="text-muted" />
                <template #popper>
                    <div class="calendar-options-tooltip-text">{{ tooltipText }}</div>
                </template>
            </VTooltip>
        </div>

        <div class="option-content">
            <select id="firstDayOfWeek" class="form-select" :value="calendarSettings.firstDayOfWeek" @change="handleDayChange">
                <option v-for="day in calendarSettings.allDayNames" :key="day" :value="day">
                    {{ day }}
                </option>
            </select>

            <small class="text-muted mt-2 d-block d-md-none">{{ tooltipText }}</small>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import type { FirstDayOfWeek } from '@/stores/calendarSettings';

const calendarSettings = useCalendarSettingsStore();

const tooltipText = 'Calendar week will start on the selected day.';

const handleDayChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    calendarSettings.setFirstDayOfWeek(target.value as FirstDayOfWeek);
};
</script>
