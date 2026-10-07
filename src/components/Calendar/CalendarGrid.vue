<template>
    <div class="calendar-grid">
        <div class="calendar-grid-container">
            <!-- Pinned all-month events (opt-in), above the sticky day headers -->
            <CalendarAllMonthEvents
                v-if="cellAllMonthEvents.length > 0"
                :events="cellAllMonthEvents"
                :hidden-count="cellHiddenAllMonthEventCount"
                :reference-day="allMonthReferenceDay"
            />

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
                    :event-slots="cellEventSlots"
                    :show-right-border="(index + 1) % 7 !== 0"
                    :placeholder="placeholder"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useCalendarGridSlots } from '@/composables/useCalendarGridSlots';
import { useDisplayTime } from '@/composables/useDisplayTime';
import { provideSpriteLoading } from '@/composables/useSpriteLoading';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { buildCalendarDays } from '@/utils/calendarGrid';

import CalendarAllMonthEvents from './CalendarAllMonthEvents.vue';
import CalendarDay from './CalendarDay/CalendarDay.vue';

interface Props {
    year: number;
    month: number;
    /** Skeleton cells only, for neighbor months not rendered yet. */
    placeholder?: boolean;
    loadSprites?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: false,
    loadSprites: true,
});

const calendarSettings = useCalendarSettingsStore();
const { displayToday } = useDisplayTime();

provideSpriteLoading(() => props.loadSprites);

const dayHeaders = computed(() => calendarSettings.dayHeaders);

const calendarDays = computed(() =>
    buildCalendarDays(displayToday.value, {
        year: props.year,
        month: props.month,
        firstDayIndex: calendarSettings.firstDayIndex,
    }),
);

const { eventSlots, allMonthEvents, hiddenAllMonthEventCount } = useCalendarGridSlots(() => calendarDays.value);
// Slot packing is lazy — placeholders never read it.
const cellEventSlots = computed(() => (props.placeholder ? [] : eventSlots.value));
const cellAllMonthEvents = computed(() => (props.placeholder ? [] : allMonthEvents.value));
const cellHiddenAllMonthEventCount = computed(() => (props.placeholder ? 0 : hiddenAllMonthEventCount.value));

const allMonthReferenceDay = computed(() => {
    const days = calendarDays.value;
    return (days.find(day => day.isToday) ?? days.find(day => day.isCurrentMonth) ?? days[0]).dayInstance;
});
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
