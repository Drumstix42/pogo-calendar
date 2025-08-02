<template>
    <div
        class="calendar-day"
        :class="{
            'other-month': !isCurrentMonth,
            today: isToday,
        }"
    >
        <div class="day-number">{{ date }}</div>

        <!-- Events for this day -->
        <div v-if="dayEvents.length > 0" class="day-events">
            <VTooltip v-for="event in dayEvents" :key="event.eventID" placement="top" :delay="{ show: 50, hide: 0 }">
                <div class="event-item" :style="{ backgroundColor: getEventTypeInfo(event.eventType).color }">
                    <span class="event-text">{{ event.name }}</span>
                </div>

                <template #popper>
                    <div class="event-tooltip">
                        <div class="event-tooltip-title">{{ event.name }}</div>
                        <div class="event-tooltip-type">{{ getEventTypeInfo(event.eventType).name }}</div>
                    </div>
                </template>
            </VTooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { getEventTypeInfo, getEventsForDate } from '@/utils/eventTypes';

interface Props {
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    dayjs: Dayjs;
}

const props = defineProps<Props>();
const eventFilter = useEventFilterStore();
const eventsStore = useEventsStore();

// Get events for this specific day and apply filtering
const dayEvents = computed(() => {
    const eventsForDay = getEventsForDate(eventsStore.events, props.dayjs);
    return eventsForDay.filter(event => eventFilter.isEventTypeEnabled(event.eventType));
});
</script>

<style scoped>
.calendar-day {
    min-height: 120px;
    border-right: 1px solid #e9ecef;
    border-bottom: 1px solid #e9ecef;
    padding: 0.5rem;
    background: white;
    min-width: 0;
    overflow: hidden;
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

.day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 0.25rem;
    min-width: 0; /* Allow container to shrink */
    overflow: hidden; /* Prevent overflow */
}

.event-item {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    line-height: 1.2;
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: opacity 0.2s ease;
    margin-bottom: 1px;
    min-width: 0; /* Allow item to shrink below content size */
    width: 100%; /* Take full width of parent */
}

.event-item:hover {
    opacity: 0.8;
}

.event-text {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
}

/* Tooltip styles */
.event-tooltip {
    max-width: 250px;
    padding: 0.5rem;
}

.event-tooltip-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
    line-height: 1.3;
}

.event-tooltip-type {
    font-size: 0.8rem;
    opacity: 0.8;
}
</style>
