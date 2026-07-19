<template>
    <div
        class="calendar-day"
        :class="{
            loading: eventsStore.loading,
            'other-month': !isCurrentMonth,
            today: isToday,
        }"
    >
        <!-- border overlay -->
        <div v-if="showRightBorder" class="calendar-day-border-overlay"></div>

        <div class="day-number-row">
            <div class="day-number">{{ date }}</div>

            <!-- Pokemon GO anniversary marker (July 6, every year) -->
            <BirthdayBadge v-if="isBirthday" :is-today="isToday" :year="year" />
        </div>

        <!-- Season "Daily Discovery" chip (current week only) -->
        <SeasonDailyChip :day-instance="dayInstance" />

        <!-- Loading skeleton -->
        <div v-if="eventsStore.loading" class="loading-skeleton">
            <div class="skeleton-multi-day placeholder-glow">
                <span
                    class="placeholder"
                    :style="{ height: `${multiDayEventBarHeight}px`, borderRadius: '6px', width: '100%', display: 'block' }"
                ></span>
            </div>

            <!-- <div class="skeleton-single-day placeholder-glow">
                <span class="placeholder" style="height: 30px; border-radius: 3px; width: 100%; display: block"></span>
            </div> -->
        </div>

        <!-- Multi-day events (day-spanning bars) -->
        <div v-if="weekCompactSlots.size > 0" class="multi-day-events" :style="{ height: `${multiDayEventsHeight}px` }">
            <TransitionGroup name="fade" tag="div">
                <div
                    v-for="event in multiDayEvents"
                    :key="`multi-${event.eventID}`"
                    class="multi-day-event-slot"
                    :style="{
                        position: 'absolute',
                        top: `${getEventSlotTop(event)}px`,
                        left: '0',
                        right: '0',
                        height: `${multiDayEventBarHeight}px`,
                        pointerEvents: 'none',
                    }"
                >
                    <MultiDayEventBar
                        :event="event"
                        :day-instance="props.dayInstance"
                        :bar-class="getMultiDayEventBarClass(event, props.dayInstance)"
                        :position="getEventPosition(event, props.dayInstance)"
                        :slot-top="getEventSlotTop(event)"
                        :slot-index="getEventSlotData(event)?.slotIndex"
                    />
                </div>
            </TransitionGroup>
        </div>

        <!-- Single-day events (vertically stacked event blocks with timestamps) -->
        <div>
            <TransitionGroup name="fade" tag="div" class="single-day-events">
                <SingleDayEvent
                    v-for="event in singleDayEvents"
                    :key="`single-${event.eventID}`"
                    :event="event"
                    :day-instance="props.dayInstance"
                    :is-today="isToday"
                />
            </TransitionGroup>
        </div>
    </div>
</template>

<script setup lang="ts">
import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { type EventSlot, useCalendarDayLayout } from '@/composables/useCalendarDayLayout';
import { useCalendarDaySingleEvents } from '@/composables/useCalendarDaySingleEvents';
import { useEventsStore } from '@/stores/events';
import { isPokemonGoBirthday } from '@/utils/specialDates';

import BirthdayBadge from '@/components/Calendar/CalendarDay/BirthdayBadge.vue';
import MultiDayEventBar from '@/components/Calendar/CalendarDay/MultiDayEventBar.vue';
import SingleDayEvent from '@/components/Calendar/CalendarDay/SingleDayEvent.vue';
import SeasonDailyChip from '@/components/Calendar/SeasonDailyChip.vue';

interface Props {
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    dayInstance: Dayjs;
    showRightBorder: boolean;
    eventSlots: EventSlot[];
}

const props = defineProps<Props>();
const eventsStore = useEventsStore();

const isBirthday = computed(() => isPokemonGoBirthday(props.dayInstance));

// Multi-day bar layout (slot packing + positioning across week boundaries)
const {
    multiDayEventBarHeight,
    weekCompactSlots,
    multiDayEvents,
    multiDayEventsHeight,
    getEventSlotData,
    getEventSlotTop,
    getMultiDayEventBarClass,
    getEventPosition,
} = useCalendarDayLayout(
    () => props.dayInstance,
    () => props.eventSlots,
);

// Single-day events + per-day projections of major multi-day events
const { singleDayEvents } = useCalendarDaySingleEvents(() => props.dayInstance);
</script>

<style scoped>
.calendar-day {
    min-height: 70px;
    background: var(--calendar-cell-bg);
    min-width: 0;
    overflow: visible;
    position: relative;
    transition: min-height 0.3s ease;
    border-radius: 7px;
    box-shadow: 0px 0px 0px 1px var(--calendar-bg) inset;

    &.loading {
        min-height: 70px;
    }
}

.calendar-day:nth-child(7n) {
    border-right: none;
}

.calendar-day.other-month {
    background-color: var(--calendar-other-month-bg);
    color: var(--calendar-other-month-color);
}

.calendar-day.today {
    background-color: var(--calendar-today-bg);
}

.calendar-day.today .day-number {
    background-color: #2196f3;
    color: white;
    font-weight: 600;
}

[data-bs-theme='dark'] .calendar-day.today .day-number {
    background-color: #0d6efd;
    color: white;
}

.day-number-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 2px 0 2px 2px;
    font-size: 0; /* removes some extra spacing between the day number row and the multi-day event bars */
}

.day-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 21px;
    height: 21px;
    border-radius: 50%;
    font-size: 0.875rem;
    flex-shrink: 0;
}

/* Multi-day events (background layer) */
.multi-day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;
    position: relative;
    z-index: 1;
    overflow: visible;
    pointer-events: none; /* Allow events to pass through the container */
    transition: height 0.3s ease;
}

/* Single-day events (foreground layer) */
.single-day-events {
    z-index: 2;
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 5px; /* leave empty space below multi-day events, for better perceived margin before next visible week */
    gap: 5px;
    margin: 0.25rem 0.1rem 0.1rem 0.1rem;
}

.calendar-day-border-overlay {
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    right: -1px;
    width: 2px;
    background-color: var(--calendar-day-border-overlay);
    pointer-events: none;
    z-index: 2;
}

/* Loading skeleton layout */
.loading-skeleton {
    position: absolute;
    height: 100%;
    width: 100%;
    padding: 0 0.3rem 0 0.3rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    opacity: 0.15;
}

.skeleton-multi-day {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.skeleton-single-day {
    margin-top: 4px;
}
</style>
