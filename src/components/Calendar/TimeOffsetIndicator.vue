<template>
    <div class="time-offset-indicator">
        <div class="time-offset-indicator__content">
            <span class="time-offset-indicator__label">Adjusted timezone:</span>
            <span class="time-offset-indicator__value">{{ calendarSettings.manualTimeOffsetLabel }}</span>
            <span class="time-offset-indicator__subvalue">({{ effectiveTimezoneLabel() }})</span>
        </div>
        <button type="button" class="btn btn-link btn-sm p-0 fw-bold" @click="calendarSettings.resetManualTimeOffsetHours">Reset</button>
    </div>
</template>

<script setup lang="ts">
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { getEffectiveTimezoneLabel } from '@/utils/timezoneLabel';

const calendarSettings = useCalendarSettingsStore();

function effectiveTimezoneLabel() {
    return getEffectiveTimezoneLabel(calendarSettings.manualTimeOffsetHours);
}
</script>

<style scoped>
.time-offset-indicator {
    margin: 0.25rem 0 0.5rem;
    padding: 0.45rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--bs-info) 35%, var(--bs-border-color));
    border-radius: 0.4rem;
    background-color: color-mix(in srgb, var(--bs-info) 10%, var(--bs-body-bg));
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.time-offset-indicator__content {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex-wrap: wrap;
    line-height: 1.5rem;
}

.time-offset-indicator__label {
    font-size: 0.82rem;
    color: var(--bs-secondary-color);
}

.time-offset-indicator__value {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--bs-body-color);
}

.time-offset-indicator__subvalue {
    font-size: 0.78rem;
    color: var(--bs-secondary-color);
}
</style>
