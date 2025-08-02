<template>
    <div
        class="calendar-day"
        :class="{
            'other-month': !isCurrentMonth,
            today: isToday,
        }"
    >
        <div class="day-number">{{ date }}</div>
        <!-- Events will go here later -->
    </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs';

interface Props {
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    dayjs: Dayjs;
}

defineProps<Props>();
</script>

<style scoped>
.calendar-day {
    min-height: 120px;
    border-right: 1px solid #e9ecef;
    border-bottom: 1px solid #e9ecef;
    padding: 0.5rem;
    background: white;
}

.calendar-day:nth-child(7n) {
    border-right: none;
}

.calendar-day.other-month {
    background-color: #f8f9fa;
    color: #6c757d;
}

.calendar-day.today {
    background-color: #e3f2fd;
}

.calendar-day.today .day-number {
    background-color: #2196f3;
    color: white;
    font-weight: 600;
}

.day-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
}

.calendar-day:hover {
    background-color: #f8f9fa;
}

.calendar-day.other-month:hover {
    background-color: #e9ecef;
}
</style>
