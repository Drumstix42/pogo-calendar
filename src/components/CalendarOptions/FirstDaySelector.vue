<template>
    <div class="first-day-selector">
        <h6 class="mb-3">Week Starts On</h6>

        <select class="form-select" :value="calendarSettings.firstDayOfWeek" @change="handleDayChange">
            <option v-for="day in calendarSettings.allDayNames" :key="day" :value="day">
                {{ day }}
            </option>
        </select>

        <small class="text-muted mt-2 d-block">Calendar week will start on the selected day.</small>
    </div>
</template>

<script setup lang="ts">
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
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
}
</style>
