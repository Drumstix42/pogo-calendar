<template>
    <div class="calendar-grid mb-2">
        <!-- Calendar Grid -->
        <div class="calendar-grid-container" ref="calendarGridRef">
            <!-- Day Headers -->
            <div class="calendar-day-headers">
                <div v-for="day in dayHeaders" :key="day" class="calendar-day-header">
                    {{ day }}
                </div>
            </div>

            <!-- Calendar Days -->
            <div class="calendar-days">
                <CalendarDay
                    v-for="(day, index) in calendarDays"
                    :key="`${day.month}-${day.date}`"
                    :date="day.date"
                    :month="day.month"
                    :year="day.year"
                    :is-current-month="day.isCurrentMonth"
                    :is-today="day.isToday"
                    :day-instance="day.dayInstance"
                    :event-slots="eventSlots"
                    :show-right-border="(index + 1) % 7 !== 0"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useCalendarGridSlots } from '@/composables/useCalendarGridSlots';
import { useDisplayTime } from '@/composables/useDisplayTime';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { buildCalendarDays } from '@/utils/calendarGrid';

import CalendarDay from './CalendarDay/CalendarDay.vue';

const { urlMonth, urlYear } = useUrlSync();
const calendarSettings = useCalendarSettingsStore();
const { displayToday } = useDisplayTime();

// Day headers from settings store
const dayHeaders = computed(() => calendarSettings.dayHeaders);

const calendarDays = computed(() =>
    buildCalendarDays(displayToday.value, {
        year: urlYear.value,
        month: urlMonth.value,
        firstDayIndex: calendarSettings.firstDayIndex,
    }),
);

const { eventSlots } = useCalendarGridSlots(() => calendarDays.value);
</script>

<style scoped>
.calendar-grid-container {
    position: relative;
    background: var(--calendar-bg);
    /* border-radius: 0.5rem; */
    overflow: clip;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.08);
}

.calendar-day-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--calendar-bg);
    position: sticky;
    top: var(--navbar-height-scrolled);
    z-index: 200;
}

.calendar-day-header {
    padding: 0.25rem;
    text-align: center;
    font-weight: 500;
    font-size: 0.875rem;
    color: #5a6169;
}

[data-bs-theme='dark'] .calendar-day-header {
    color: #b7b9bb;
}

.calendar-day-header:nth-child(7n) {
    border-right: none;
}

.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    width: 100%;
}
</style>
