<template>
    <div class="event-time-display">
        <!-- Standardized time row with focus styling -->
        <div class="time-row" :class="{ 'is-completed': timeDisplayParts.isCompleted }">
            <span
                v-if="timeDisplayParts.prefix"
                :class="{
                    'time-focused': timeDisplayParts.focusPrefix,
                    'time-dimmed': timeDisplayParts.startIsPast,
                }"
                >{{ timeDisplayParts.prefix }}</span
            >
            <span
                :class="{
                    'time-focused': timeDisplayParts.focusStart,
                    'time-dimmed': timeDisplayParts.startIsPast,
                }"
                >{{ timeDisplayParts.startTime }}</span
            >
            <span class="time-separator">{{ timeDisplayParts.separator }}</span>
            <span
                class="text-nowrap"
                :class="{
                    'time-focused': timeDisplayParts.focusEnd,
                    'time-dimmed': timeDisplayParts.endIsPast,
                }"
                >{{ timeDisplayParts.endTime }}</span
            >
        </div>

        <!-- Status line for relative timing -->
        <div v-if="showStatus && statusInfo" class="status-line">
            <span v-if="statusInfo.prefix" class="status-prefix">
                <ArrowLeftRight v-if="!isSingleDay" :size="11" class="duration-icon" />{{ statusInfo.prefix }}
            </span>
            <span :class="`status-label status-${statusInfo.type}`">{{ statusInfo.text }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ArrowLeftRight } from 'lucide-vue-next';
import { computed } from 'vue';

import { useCurrentTime } from '@/composables/useCurrentTime';
import { useEventsStore } from '@/stores/events';
import { type PogoEvent, formatEventTime, parseEventDate } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
    showStatus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showStatus: true,
});

const eventsStore = useEventsStore();

// Get reactive current time that updates every minute
const { liveMinute } = useCurrentTime();

const isSingleDay = computed(() => {
    return eventsStore.eventMetadata[props.event.eventID]?.isSingleDayEvent ?? false;
});

const formatSingleDayTimes = (startDateStr: string, endDateStr: string) => {
    const startTime = formatEventTime(startDateStr);
    const endTime = formatEventTime(endDateStr);

    // Parse the times to check if they're in the same AM/PM period
    const startDate = parseEventDate(startDateStr);
    const endDate = parseEventDate(endDateStr);

    const startPeriod = startDate.format('A'); // 'AM' or 'PM'
    const endPeriod = endDate.format('A'); // 'AM' or 'PM'

    // If both times are in the same AM/PM period, omit AM/PM from start time
    if (startPeriod === endPeriod) {
        const startTimeWithoutPeriod = startDate.minute() === 0 ? startDate.format('h') : startDate.format('h:mm');
        return {
            startTime: startTimeWithoutPeriod,
            endTime: endTime,
        };
    }

    // Different periods, keep both AM/PM
    return {
        startTime: startTime,
        endTime: endTime,
    };
};

const timeDisplayParts = computed(() => {
    const currentTime = liveMinute.value;
    const metadata = eventsStore.eventMetadata[props.event.eventID];
    const startDate = metadata?.startDate ?? parseEventDate(props.event.start);
    const endDate = metadata?.endDate ?? parseEventDate(props.event.end);

    if (isSingleDay.value) {
        // Single day: "Tue Oct 7 • 6–7pm"
        const dayOfWeek = startDate.format('ddd');
        const dateStr = startDate.format('MMM D');
        const datePrefix = `${dayOfWeek} ${dateStr} • `;

        const eventStart = startDate;
        const eventEnd = endDate;

        // Get formatted times with smart AM/PM handling
        const { startTime, endTime } = formatSingleDayTimes(props.event.start, props.event.end);

        if (currentTime.isAfter(eventEnd)) {
            // Event is completely over - both times are past
            return {
                prefix: datePrefix,
                startTime,
                separator: '-',
                endTime,
                focusPrefix: false,
                focusStart: false,
                focusEnd: false,
                startIsPast: true,
                endIsPast: true,
                isCompleted: true,
            };
        } else if (currentTime.isAfter(eventStart) && currentTime.isBefore(eventEnd)) {
            // Event is live - highlight end time only
            return {
                prefix: datePrefix,
                startTime,
                separator: '-',
                endTime,
                focusPrefix: false,
                focusStart: false,
                focusEnd: true,
                startIsPast: true,
                endIsPast: false,
                isCompleted: false,
            };
        } else {
            // Event hasn't started - highlight the date prefix and start hour for upcoming single-day events
            return {
                prefix: datePrefix,
                startTime,
                separator: '-',
                endTime,
                focusPrefix: true,
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

        const eventStart = startDate;
        const eventEnd = endDate;

        if (currentTime.isAfter(eventEnd)) {
            // Event is completely over - both times are past
            return {
                prefix: '',
                startTime: startDateStr,
                separator: ' → ',
                endTime: endDateStr,
                focusPrefix: false,
                focusStart: false,
                focusEnd: false,
                startIsPast: true,
                endIsPast: true,
                isCompleted: true,
            };
        } else if (currentTime.isAfter(eventStart) && currentTime.isBefore(eventEnd)) {
            // Event is live - start time is past, end time is future
            return {
                prefix: '',
                startTime: startDateStr,
                separator: ' → ',
                endTime: endDateStr,
                focusPrefix: false,
                focusStart: false,
                focusEnd: true,
                startIsPast: true,
                endIsPast: false,
                isCompleted: false,
            };
        } else {
            // Event hasn't started - highlight start time for multi-day events
            return {
                prefix: '',
                startTime: startDateStr,
                separator: ' → ',
                endTime: endDateStr,
                focusPrefix: false,
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
    const currentTime = liveMinute.value;
    const metadata = eventsStore.eventMetadata[props.event.eventID];
    const eventStart = metadata?.startDate ?? parseEventDate(props.event.start);
    const eventEnd = metadata?.endDate ?? parseEventDate(props.event.end);
    const isSingleDay = metadata?.isSingleDayEvent ?? false;

    // Check if event is completely over
    if (currentTime.isAfter(eventEnd)) {
        const totalDays = isSingleDay ? null : eventEnd.diff(eventStart, 'day') + 1;
        const prefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • ` : null;
        const text = isSingleDay ? 'Event ended' : 'event ended';
        return { prefix, text, type: 'ended' };
    }
    // Check if event hasn't started yet
    else if (eventStart.isAfter(currentTime)) {
        const daysUntilStart = eventStart.startOf('day').diff(currentTime.startOf('day'), 'day');
        const totalDays = isSingleDay ? null : eventEnd.diff(eventStart, 'day') + 1;
        const prefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • ` : null;

        if (eventStart.startOf('day').isSame(currentTime.startOf('day'))) {
            // Starts today
            const hoursUntilStart = eventStart.diff(currentTime, 'hour', true);
            if (hoursUntilStart < 1) {
                const minutesUntilStart = Math.ceil(eventStart.diff(currentTime, 'minute', true));
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
    else if (currentTime.isAfter(eventStart) && currentTime.isBefore(eventEnd)) {
        const daysUntilEnd = eventEnd.startOf('day').diff(currentTime.startOf('day'), 'day');

        // Calculate total days for multi-day events
        const totalDays = isSingleDay ? null : eventEnd.diff(eventStart, 'day') + 1;
        const prefix = totalDays ? `${totalDays} day${totalDays > 1 ? 's' : ''} • ` : null;

        if (eventEnd.startOf('day').isSame(currentTime.startOf('day'))) {
            // Ends today
            const hoursUntilEnd = eventEnd.diff(currentTime, 'hour', true);
            if (hoursUntilEnd < 1) {
                const minutesUntilEnd = Math.ceil(eventEnd.diff(currentTime, 'minute', true));
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
</script>

<style lang="scss" scoped>
.event-time-display {
    --transition--time-text: color 0.3s ease, opacity 0.3s ease;
    min-width: 140px;

    .time-row {
        font-size: 0.9rem;
        font-weight: 500;
        color: color-mix(in srgb, var(--bs-body-color) 85%, transparent);
        line-height: 1.3;
        margin-bottom: 3px;
        transition: var(--transition--time-text);

        &.is-completed {
            color: var(--bs-secondary-color);
            opacity: 0.8;
            font-weight: 400;
        }

        .time-focused {
            font-weight: 600;
            color: color-mix(in srgb, var(--bs-body-color) 95%, transparent);
            transition: var(--transition--time-text);
        }

        .time-dimmed {
            opacity: 0.8;
            color: var(--bs-secondary-color);
            font-weight: 400;
            transition: var(--transition--time-text);
        }

        .time-separator {
            opacity: 0.8;
            padding: 0 0.1rem;
            transition: var(--transition--time-text);
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

        .status-label {
            transition: var(--transition--time-text);

            &.status-ended {
                color: color-mix(in srgb, var(--bs-secondary-color) 70%, var(--bs-danger) 50%);
                font-weight: 500;
            }

            &.status-urgent {
                color: color-mix(in srgb, var(--bs-secondary-color) 40%, var(--bs-warning) 60%);
                font-weight: 500;
            }

            &.status-upcoming {
                color: color-mix(in srgb, var(--bs-secondary-color) 30%, var(--bs-success) 100%);
                font-weight: 500;
            }

            &.status-normal {
                color: var(--bs-secondary-color);
            }
        }
    }
}
</style>
