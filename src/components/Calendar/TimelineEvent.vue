<template>
    <div
        class="timeline-event-card calendar-event"
        :class="{ 'is-active': isActive }"
        :data-event-type="event.eventType"
        :style="{
            borderColor: eventColor,
            '--event-color-dark': eventColorDark,
        }"
        @click="toggleActive"
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
            <div class="event-content">
                <div class="event-text">
                    <div class="event-name">{{ formatEventName(event.name) }}</div>

                    <!-- Standardized time row with focus styling -->
                    <div class="time-row" :class="{ 'is-completed': timeDisplayParts.isCompleted }">
                        <span v-if="timeDisplayParts.prefix">{{ timeDisplayParts.prefix }}</span>
                        <span
                            :class="{
                                'time-focused': timeDisplayParts.focusStart,
                                'time-dimmed': timeDisplayParts.startIsPast,
                            }"
                            >{{ timeDisplayParts.startTime }}</span
                        >
                        <span class="time-separator">{{ timeDisplayParts.separator }}</span>
                        <span
                            :class="{
                                'time-focused': timeDisplayParts.focusEnd,
                                'time-dimmed': timeDisplayParts.endIsPast,
                            }"
                            >{{ timeDisplayParts.endTime }}</span
                        >
                    </div>

                    <!-- Status line for relative timing -->
                    <div v-if="statusInfo" class="status-line">
                        <span v-if="statusInfo.prefix" class="status-prefix">
                            <CalendarClock v-if="!isSameDayEvent(event)" :size="11" class="duration-icon" />{{ statusInfo.prefix }}
                        </span>
                        <span :class="`status-${statusInfo.type}`">{{ statusInfo.text }}</span>
                    </div>
                </div>

                <PokemonImages
                    :event="event"
                    :event-name="formatEventName(event.name)"
                    :height="55"
                    :use-animated="isActive ? true : false"
                    :show-placeholder="true"
                    :show-tooltips="true"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { CalendarClock } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import { useEventFilterToasts } from '@/composables/useEventFilterToasts';
import { formatEventName } from '@/utils/eventName';
import { type EventTypeKey, type PogoEvent, formatEventTime, getEventTypeInfo, isSameDayEvent, parseEventDate } from '@/utils/eventTypes';

import EventToggleButton from './EventToggleButton.vue';
import PokemonImages from './PokemonImages.vue';

interface Props {
    event: PogoEvent;
}

const props = defineProps<Props>();
const { hideEventTypeWithToast } = useEventFilterToasts();

const isActive = ref(false);

const toggleActive = (): void => {
    isActive.value = !isActive.value;
};

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

// Standardized time display for all events
const timeDisplayParts = computed(() => {
    const startTime = formatEventTime(props.event.start);
    const endTime = formatEventTime(props.event.end);
    const startDate = parseEventDate(props.event.start);
    const endDate = parseEventDate(props.event.end);
    const now = dayjs();

    if (isSameDayEvent(props.event)) {
        // Single day: "Tue Oct 7 • 6–7pm"
        const dayOfWeek = startDate.format('ddd');
        const dateStr = startDate.format('MMM D');
        const datePrefix = `${dayOfWeek} ${dateStr} • `;

        const eventStart = parseEventDate(props.event.start);
        const eventEnd = parseEventDate(props.event.end);

        if (now.isAfter(eventEnd)) {
            // Event is completely over - both times are past
            return {
                prefix: datePrefix,
                startTime,
                separator: '–',
                endTime,
                focusStart: false,
                focusEnd: false,
                startIsPast: true,
                endIsPast: true,
                isCompleted: true,
            };
        } else if (now.isAfter(eventStart) && now.isBefore(eventEnd)) {
            // Event is live - start time is past, end time is future
            return {
                prefix: datePrefix,
                startTime,
                separator: '–',
                endTime,
                focusStart: false,
                focusEnd: true,
                startIsPast: true,
                endIsPast: false,
                isCompleted: false,
            };
        } else {
            // Event hasn't started - both times are future
            return {
                prefix: datePrefix,
                startTime,
                separator: '–',
                endTime,
                focusStart: true,
                focusEnd: false,
                startIsPast: false,
                endIsPast: false,
                isCompleted: false,
            };
        }
    } else {
        // Multi-day: "Sep 7, 12am → Nov 30, 11:59pm"
        const startDateStr = startDate.format('MMM D, h:mma').replace(':00', '');
        const endDateStr = endDate.format('MMM D, h:mma').replace(':00', '');

        const eventStart = parseEventDate(props.event.start);
        const eventEnd = parseEventDate(props.event.end);

        if (now.isAfter(eventEnd)) {
            // Event is completely over - both times are past
            return {
                prefix: '',
                startTime: startDateStr,
                separator: ' → ',
                endTime: endDateStr,
                focusStart: false,
                focusEnd: false,
                startIsPast: true,
                endIsPast: true,
                isCompleted: true,
            };
        } else if (now.isAfter(eventStart) && now.isBefore(eventEnd)) {
            // Event is live - start time is past, end time is future
            return {
                prefix: '',
                startTime: startDateStr,
                separator: ' → ',
                endTime: endDateStr,
                focusStart: false,
                focusEnd: true,
                startIsPast: true,
                endIsPast: false,
                isCompleted: false,
            };
        } else {
            // Event hasn't started - both times are future
            return {
                prefix: '',
                startTime: startDateStr,
                separator: ' → ',
                endTime: endDateStr,
                focusStart: true,
                focusEnd: false,
                startIsPast: false,
                endIsPast: false,
                isCompleted: false,
            };
        }
    }
});

// Status text for relative timing info
const statusInfo = computed(() => {
    const now = dayjs();
    const eventStart = parseEventDate(props.event.start);
    const eventEnd = parseEventDate(props.event.end);

    // Check if event is completely over
    if (now.isAfter(eventEnd)) {
        const isSingleDay = isSameDayEvent(props.event);
        const totalDays = isSingleDay ? null : eventEnd.diff(eventStart, 'day') + 1;
        const prefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • ` : null;
        const text = isSingleDay ? 'Event ended' : 'event ended';
        return { prefix, text, type: 'ended' };
    }
    // Check if event hasn't started yet
    else if (eventStart.isAfter(now)) {
        const daysUntilStart = eventStart.startOf('day').diff(now.startOf('day'), 'day');
        const isSingleDay = isSameDayEvent(props.event);
        const totalDays = isSingleDay ? null : eventEnd.diff(eventStart, 'day') + 1;
        const prefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • ` : null;

        if (eventStart.startOf('day').isSame(now.startOf('day'))) {
            // Starts today
            const hoursUntilStart = eventStart.diff(now, 'hour', true);
            if (hoursUntilStart < 1) {
                const minutesUntilStart = Math.ceil(eventStart.diff(now, 'minute', true));
                const text = isSingleDay ? `Starts in ${minutesUntilStart}m` : `starts in ${minutesUntilStart}m`;
                return { prefix, text, type: 'upcoming' };
            } else {
                const roundedHours = Math.ceil(hoursUntilStart);
                const text = isSingleDay ? `Starts in ${roundedHours}h` : `starts in ${roundedHours}h`;
                return { prefix, text, type: 'upcoming' };
            }
        } else if (daysUntilStart === 1) {
            const text = isSingleDay ? 'Starts tomorrow' : 'starts tomorrow';
            return { prefix, text, type: 'upcoming' };
        } else {
            const text = isSingleDay ? `Starts in ${daysUntilStart}d` : `starts in ${daysUntilStart}d`;
            return { prefix, text, type: 'normal' };
        }
    }
    // Check if event is currently live
    else if (now.isAfter(eventStart) && now.isBefore(eventEnd)) {
        const daysUntilEnd = eventEnd.startOf('day').diff(now.startOf('day'), 'day');
        const isSingleDay = isSameDayEvent(props.event);

        // Calculate total days for multi-day events
        const totalDays = isSingleDay ? null : eventEnd.diff(eventStart, 'day') + 1;
        const prefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • ` : null;

        if (eventEnd.startOf('day').isSame(now.startOf('day'))) {
            // Ends today
            const hoursUntilEnd = eventEnd.diff(now, 'hour', true);
            if (hoursUntilEnd < 1) {
                const minutesUntilEnd = Math.ceil(eventEnd.diff(now, 'minute', true));
                if (isSingleDay) {
                    const livePrefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • Live • ` : 'Live • ';
                    return { prefix: livePrefix, text: `ends in ${minutesUntilEnd}m`, type: 'urgent' };
                } else {
                    return { prefix, text: `ends in ${minutesUntilEnd}m`, type: 'urgent' };
                }
            } else {
                const roundedHours = Math.ceil(hoursUntilEnd);
                if (isSingleDay) {
                    const livePrefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • Live • ` : 'Live • ';
                    return { prefix: livePrefix, text: `ends in ${roundedHours}h`, type: 'urgent' };
                } else {
                    return { prefix, text: `ends in ${roundedHours}h`, type: 'urgent' };
                }
            }
        } else if (daysUntilEnd === 1) {
            if (isSingleDay) {
                const livePrefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • Live • ` : 'Live • ';
                return { prefix: livePrefix, text: 'ends tomorrow', type: 'urgent' };
            } else {
                return { prefix, text: 'ends tomorrow', type: 'urgent' };
            }
        } else if (daysUntilEnd > 1) {
            if (isSingleDay) {
                const livePrefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • Live • ` : 'Live • ';
                return { prefix: livePrefix, text: `ends in ${daysUntilEnd}d`, type: 'normal' };
            } else {
                return { prefix, text: `ends in ${daysUntilEnd}d`, type: 'normal' };
            }
        } else {
            if (isSingleDay) {
                const livePrefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • Live • ` : 'Live • ';
                return { prefix: livePrefix, text: 'ends today', type: 'urgent' };
            } else {
                return { prefix, text: 'ends today', type: 'urgent' };
            }
        }
    }

    return null;
});

const hideEventType = (eventType: EventTypeKey): void => {
    hideEventTypeWithToast(eventType);
};
</script>

<style lang="scss" scoped>
.timeline-event-card {
    background: var(--calendar-cell-bg);
    border: 2px solid;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition:
        transform 0.15s ease,
        border-color 0.15s ease;

    &:hover {
        border-color: var(--event-color-dark);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .header-duration {
            opacity: 0.9;
        }
    }

    &.is-active {
        transform: scale(1.02);
        border-color: var(--event-color-dark);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .header-duration {
            opacity: 0.9;
        }
    }

    &:focus-within {
        .header-duration {
            opacity: 0.9;
        }
    }
}

.event-header {
    padding: 8px 12px;
    color: white;
    font-weight: 500;
    font-size: 0.9rem;
    line-height: 1.2;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

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

    .event-toggle-container {
        flex-shrink: 0;
    }
}

.event-body {
    padding: 12px 12px;
    text-align: left;

    .event-content {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }

    .event-text {
        flex: 1;
        min-width: 0;
    }

    .event-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
        margin-bottom: 4px;
        line-height: 1.3;
    }

    .time-row {
        font-size: 0.9rem;
        font-weight: 500;
        color: color-mix(in srgb, var(--bs-body-color) 85%, transparent);
        line-height: 1.3;
        margin-bottom: 4px;

        &.is-completed {
            color: var(--bs-secondary-color);
            opacity: 0.8;
            font-weight: 400;
        }

        .time-focused {
            font-weight: 600;
            color: color-mix(in srgb, var(--bs-body-color) 95%, transparent);
        }

        .time-dimmed {
            opacity: 0.8;
            color: var(--bs-secondary-color);
            font-weight: 400;
        }

        .time-separator {
            opacity: 0.8;
        }

        .time-suffix {
            font-size: 0.7rem;
            opacity: 1;
            font-weight: 400;
        }
    }

    .status-line {
        font-size: 0.7rem;
        font-weight: 400;
        color: var(--bs-secondary-color);
        line-height: 1.2;
        font-style: italic;

        .status-prefix {
            color: var(--bs-secondary-color);
            font-style: normal;

            .duration-icon {
                margin-top: -2px;
                margin-right: 4px;
                opacity: 0.7;
                vertical-align: middle;
            }
        }

        .status-ended {
            color: color-mix(in srgb, var(--bs-secondary-color) 70%, var(--bs-danger) 50%);
            font-weight: 500;
        }

        .status-urgent {
            color: color-mix(in srgb, var(--bs-secondary-color) 40%, var(--bs-warning) 60%);
            font-weight: 500;
        }

        .status-upcoming {
            color: color-mix(in srgb, var(--bs-secondary-color) 30%, var(--bs-success) 100%);
            font-weight: 500;
        }
    }
}
</style>
