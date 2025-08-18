<template>
    <div
        class="timeline-event-card"
        :style="{
            borderColor: eventColor,
            '--event-color-dark': eventColorDark,
        }"
    >
        <!-- Colored header with event type -->
        <div class="event-header" :style="{ backgroundColor: eventColor }">
            <span class="event-type">{{ eventTypeName }}</span>
            <div v-if="headerDuration" class="header-duration">{{ headerDuration }}</div>
            <!-- Hide event type button -->
            <div class="event-toggle-container">
                <EventToggleButton :event-type="event.eventType" @hide="hideEventType" />
            </div>
        </div>

        <!-- Event body with event name and details -->
        <div class="event-body">
            <div class="event-name">{{ event.name }}</div>
            <div v-if="isSameDayEvent(event)" class="single-day-datetime">
                <div class="single-day-times">{{ formatEventTime(event.start) }} - {{ formatEventTime(event.end) }}</div>
                <div class="single-day-date-line">
                    <div class="single-day-date">{{ parseEventDate(event.start).format('ddd MMM D') }}</div>
                    <div v-if="startsEndsText" class="event-timing-info">{{ startsEndsText }}</div>
                </div>
            </div>
            <template v-else>
                <!-- Start date - emphasized for future events, secondary for ongoing events -->
                <div v-if="startDateTime" :class="hasEventStarted ? 'secondary-datetime' : 'emphasized-datetime'">{{ startDateTime }}</div>
                <div class="bottom-line">
                    <!-- End date - secondary for future events, emphasized for ongoing events -->
                    <div v-if="endDateTime" :class="hasEventStarted ? 'emphasized-datetime' : 'secondary-datetime'">{{ endDateTime }}</div>
                    <div v-if="startsEndsText" class="event-timing-info">{{ startsEndsText }}</div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed } from 'vue';

import { useEventFilterStore } from '@/stores/eventFilter';
import { type EventTypeKey, type PogoEvent, formatEventTime, getEventTypeInfo, isSameDayEvent, parseEventDate } from '@/utils/eventTypes';

import EventToggleButton from './EventToggleButton.vue';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();
const eventFilter = useEventFilterStore();

// Event type color and name
const eventColor = computed(() => {
    return getEventTypeInfo(props.event.eventType).color;
});

const eventTypeName = computed(() => {
    return getEventTypeInfo(props.event.eventType).name;
});

// Darker color for active state
const eventColorDark = computed(() => {
    return `color-mix(in srgb, ${eventColor.value} 80%, black)`;
});

// Header duration display (day count for multi-day, hours for single-day)
const headerDuration = computed(() => {
    const startDate = parseEventDate(props.event.start);
    const endDate = parseEventDate(props.event.end);

    if (isSameDayEvent(props.event)) {
        // For single-day events, show hours duration
        const hours = endDate.diff(startDate, 'hour', true);
        if (hours < 1) {
            const minutes = endDate.diff(startDate, 'minute');
            return `${minutes} min${minutes !== 1 ? 's' : ''}`;
        } else if (hours === Math.floor(hours)) {
            const wholeHours = Math.floor(hours);
            return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
        } else {
            return `${hours.toFixed(1)} hours`;
        }
    } else {
        // For multi-day events, show day count
        const totalDays = endDate.diff(startDate, 'day') + 1;
        return `${totalDays} day${totalDays > 1 ? 's' : ''}`;
    }
});

// Start date/time display
const startDateTime = computed(() => {
    const startTime = formatEventTime(props.event.start);
    const eventDate = parseEventDate(props.event.start);
    const dayOfWeek = eventDate.format('ddd');
    const dateStr = eventDate.format('MMM D');

    if (isSameDayEvent(props.event)) {
        return `${dayOfWeek} ${dateStr}, ${startTime}`;
    } else {
        return `${dayOfWeek} ${dateStr}, ${startTime}`;
    }
});

// End date/time display (only for multi-day events)
const endDateTime = computed(() => {
    if (isSameDayEvent(props.event)) {
        const endTime = formatEventTime(props.event.end);
        return `- ${endTime}`;
    } else {
        const endTime = formatEventTime(props.event.end);
        const eventDate = parseEventDate(props.event.end);
        const dayOfWeek = eventDate.format('ddd');
        const dateStr = eventDate.format('MMM D');
        return `${dayOfWeek} ${dateStr}, ${endTime}`;
    }
});

// "Starts in X days" or "Ends in X days" display for events
const startsEndsText = computed(() => {
    const now = dayjs();
    const eventStart = parseEventDate(props.event.start);
    const eventEnd = parseEventDate(props.event.end);

    // Check if event hasn't started yet by comparing start day to current day
    if (eventStart.startOf('day').isAfter(now.startOf('day'))) {
        const daysUntilStart = eventStart.startOf('day').diff(now.startOf('day'), 'day');

        if (daysUntilStart === 1) {
            return 'Starts tomorrow';
        } else {
            return `Starts in ${daysUntilStart} days`;
        }
    }
    // For events that start today but haven't started yet (later today)
    else if (eventStart.startOf('day').isSame(now.startOf('day')) && eventStart.isAfter(now)) {
        const hoursUntilStart = eventStart.diff(now, 'hour', true);

        if (hoursUntilStart < 1) {
            const minutesUntilStart = Math.ceil(eventStart.diff(now, 'minute', true));
            return `Starts in ${minutesUntilStart} min${minutesUntilStart !== 1 ? 's' : ''}`;
        } else {
            const roundedHours = Math.ceil(hoursUntilStart);
            return `Starts in ${roundedHours} hour${roundedHours !== 1 ? 's' : ''}`;
        }
    }
    // For multi-day events that have started, show end information
    else if (!isSameDayEvent(props.event) && eventEnd.isAfter(now)) {
        const daysUntilEnd = eventEnd.startOf('day').diff(now.startOf('day'), 'day');

        if (daysUntilEnd === 0) {
            return 'Ends today';
        } else if (daysUntilEnd === 1) {
            return 'Ends tomorrow';
        } else {
            return `Ends in ${daysUntilEnd} days`;
        }
    }

    return null;
});

// Check if event has started (for ongoing multi-day events)
const hasEventStarted = computed(() => {
    const now = dayjs();
    const eventStart = parseEventDate(props.event.start);
    const eventEnd = parseEventDate(props.event.end);

    // Only for multi-day events that have started and are still ongoing
    return !isSameDayEvent(props.event) && now.isAfter(eventStart) && eventEnd.isAfter(now);
});

// Hide event type function
const hideEventType = (eventType: EventTypeKey): void => {
    eventFilter.disableEventType(eventType);
};
</script>

<style scoped>
.timeline-event-card {
    background: white;
    border: 2px solid;
    border-radius: 8px;
    overflow: hidden;
    transition:
        transform 0.15s ease,
        border-color 0.15s ease;
}

.timeline-event-card:active,
.timeline-event-card:hover {
    transform: scale(1.02);
    border-color: var(--event-color-dark);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.event-header {
    padding: 8px 12px;
    color: white;
    font-weight: 500;
    font-size: 14px;
    line-height: 1.2;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
}

.event-type {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
}

.header-duration {
    font-size: 12px;
    font-weight: 400;
    opacity: 0;
    flex-shrink: 0;
    white-space: nowrap;
    transition: opacity 0.2s ease;
}

.timeline-event-card:hover .header-duration,
.timeline-event-card:focus-within .header-duration {
    opacity: 0.9;
}

.event-toggle-container {
    flex-shrink: 0;
}

.event-body {
    padding: 10px 12px;
    text-align: left;
}

.event-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--bs-body-color);
    margin-bottom: 5px;
    line-height: 1.3;
}

.start-datetime {
    font-size: 15px;
    font-weight: 500;
    color: var(--bs-body-color);
    line-height: 1.3;
    margin-bottom: 2px;
}

.emphasized-datetime {
    font-size: 15px;
    font-weight: 400;
    color: var(--bs-body-color);
    line-height: 1.3;
    margin-bottom: 2px;
}

.secondary-datetime {
    font-size: 13px;
    font-weight: 400;
    color: var(--bs-secondary-color);
    line-height: 1.2;
}

.single-day-datetime {
    font-size: 14px;
    font-weight: 500;
    color: var(--bs-body-color);
    line-height: 1.3;
}

.single-day-times {
    font-size: 15px;
    font-weight: 500;
    color: var(--bs-body-color);
    line-height: 1.3;
    margin-bottom: 2px;
}

.single-day-date-line {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8px;
    min-height: 16px;
}

.single-day-date {
    font-size: 13px;
    font-weight: 400;
    color: var(--bs-secondary-color);
    line-height: 1.2;
}

.event-timing-info {
    font-size: 11px;
    font-weight: 400;
    color: var(--bs-tertiary-color);
    line-height: 1.2;
    font-style: italic;
    text-align: right;
    flex-shrink: 0;
}

/* Add margin-top only when in bottom-line (multi-day events) */
.bottom-line .event-timing-info {
    margin-top: 2px;
}

.bottom-line {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 8px;
    min-height: 16px;
}

.end-datetime {
    font-size: 13px;
    font-weight: 400;
    color: var(--bs-secondary-color);
    line-height: 1.2;
}
</style>
