<template>
    <div class="calendar-grid">
        <!-- Calendar Grid -->
        <div class="calendar-grid-container">
            <!-- Day Headers -->
            <div class="calendar-day-headers">
                <div v-for="day in dayHeaders" :key="day" class="calendar-day-header">
                    {{ day }}
                </div>
            </div>

            <!-- Calendar Days -->
            <div class="calendar-days">
                <CalendarDay
                    v-for="day in calendarDays"
                    :key="`${day.month}-${day.date}`"
                    :date="day.date"
                    :month="day.month"
                    :year="day.year"
                    :is-current-month="day.isCurrentMonth"
                    :is-today="day.isToday"
                    :dayjs="day.dayjs"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed } from 'vue';

import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';

import CalendarDay from './CalendarDay.vue';

const { urlMonth, urlYear } = useUrlSync();
const calendarSettings = useCalendarSettingsStore();

// Day headers from settings store
const dayHeaders = computed(() => calendarSettings.dayHeaders);

// Calendar days calculation
const calendarDays = computed(() => {
    const currentDate = dayjs().year(urlYear.value).month(urlMonth.value);
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');

    // Calculate start date based on custom first day of week
    const firstDayIndex = calendarSettings.firstDayIndex;
    let startDate = startOfMonth.clone();

    // Find the first day of the week that contains the start of month
    while (startDate.day() !== firstDayIndex) {
        startDate = startDate.subtract(1, 'day');
    }

    // Calculate end date - end of week containing last day of month
    let endDate = endOfMonth.clone();
    const lastDayIndex = (firstDayIndex + 6) % 7; // Last day of week
    while (endDate.day() !== lastDayIndex) {
        endDate = endDate.add(1, 'day');
    }

    const days = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
        days.push({
            date: day.date(),
            month: day.month(),
            year: day.year(),
            isCurrentMonth: day.isSame(currentDate, 'month'),
            isToday: day.isSame(dayjs(), 'day'),
            dayjs: day,
        });
        day = day.add(1, 'day');
    }

    return days;
});
</script>

<style scoped>
.calendar-grid-container {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
}

.calendar-day-headers {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
}

.calendar-day-header {
    padding: 0.75rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.875rem;
    color: #495057;
}

.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
}
</style>
