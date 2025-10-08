<template>
    <div
        class="timeline-event-card calendar-event"
        :class="{ 'is-active': props.isActive }"
        :data-event-type="event.eventType"
        :style="{
            borderColor: eventColor,
            '--event-color-dark': eventColorDark,
        }"
        @click="toggleActive"
    >
        <!-- Colored header with event type -->
        <div class="event-header" :style="{ backgroundColor: eventColor }">
            <div class="header-content">
                <span class="event-type">{{ eventTypeName }}</span>
                <component :is="props.isActive ? ChevronsDownUp : ChevronsUpDown" :size="14" class="chevron-icon" />
            </div>
            <!-- Hide event type button -->
            <div v-if="props.isActive" class="event-toggle-container">
                <div class="header-action-text">Hide type?</div>
                <EventToggleButton :event-type="event.eventType" @hide="hideEventType" />
            </div>
        </div>

        <!-- Event body with event name and details -->
        <div class="event-body">
            <div class="event-name">{{ formatEventName(event.name) }}</div>

            <div class="event-content">
                <div class="event-details">
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
                    :height="40"
                    :use-animated="props.isActive ? true : false"
                    :show-placeholder="true"
                    :show-tooltips="true"
                />
            </div>

            <div class="event-extras-wrapper">
                <EventExtras v-if="props.isActive" :event="event" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { CalendarClock, ChevronsDownUp, ChevronsUpDown } from 'lucide-vue-next';
import { computed } from 'vue';

import { useEventFilterToasts } from '@/composables/useEventFilterToasts';
import { formatEventName } from '@/utils/eventName';
import { type EventTypeKey, type PogoEvent, formatEventTime, getEventTypeInfo, isSameDayEvent, parseEventDate } from '@/utils/eventTypes';

import EventExtras from './EventExtras.vue';
import EventToggleButton from './EventToggleButton.vue';
import PokemonImages from './PokemonImages.vue';

interface Props {
    event: PogoEvent;
    isActive: boolean;
}

interface Emits {
    activate: [eventId: string];
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const { hideEventTypeWithToast } = useEventFilterToasts();

function toggleActive() {
    emit('activate', props.event.eventID);
}

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
    gap: 6px;

    .header-content {
        display: flex;
        align-items: center;
        gap: 4px;
        flex: 1;
        min-width: 0;
    }

    .event-type {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
    }

    .chevron-icon {
        opacity: 0.7;
        transition: opacity 0.2s ease;
        flex-shrink: 0;
        color: var(--bs-body-color);
    }

    .header-duration {
        font-size: 12px;
        font-weight: 400;
        opacity: 0;
        flex-shrink: 0;
        white-space: nowrap;
        transition: opacity 0.2s ease;
    }

    .header-action-text {
        font-size: 12px;
        font-weight: 400;
        line-height: 1;
        opacity: 0.9;
        flex-shrink: 0;
        white-space: nowrap;
        font-style: italic;
    }

    .event-toggle-container {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 6px;
    }
}

.event-body {
    padding: 12px 12px;
    text-align: left;

    .event-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: color-mix(in srgb, var(--bs-body-color) 90%, transparent);
        line-height: 1.3;
        margin-bottom: 3px;
    }

    .event-content {
        display: flex;
        gap: 0px;
        align-items: flex-start;
        /* flex-wrap: wrap; */

        :deep(.pokemon-images) {
            justify-content: end;
            flex-grow: 0;
            flex-shrink: 1;
            margin-left: auto;
            flex-wrap: nowrap;
        }
    }

    .event-details {
        flex-grow: 1;
        flex-shrink: 0;
        margin-top: 4px;
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

    .event-extras-wrapper {
        :deep(.event-extras) {
            margin-top: 0.5rem;
        }

        :deep(.community-day-bonuses) {
            margin-top: 1rem;
        }
    }
}
</style>
