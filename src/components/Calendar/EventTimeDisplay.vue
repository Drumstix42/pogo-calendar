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
import { ArrowLeftRight } from '@lucide/vue';
import { computed } from 'vue';

import { useDisplayTime } from '@/composables/useDisplayTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';
import { parseEventDate } from '@/utils/eventDate';
import { buildEventStatusInfo, buildTimeDisplayParts } from '@/utils/eventTimeDisplay';
import { type PogoEvent } from '@/utils/eventTypes';

interface Props {
    event: PogoEvent;
    showStatus?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showStatus: true,
});

const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();

const { displayNow } = useDisplayTime();

const isSingleDay = computed(() => {
    return eventsStore.eventMetadata[props.event.eventID]?.isSingleDayEvent ?? false;
});

const resolvedDates = computed(() => {
    const metadata = eventsStore.eventMetadata[props.event.eventID];
    const startDate = metadata?.startDate ?? parseEventDate(props.event.start, calendarSettings.manualTimeOffsetHours);
    const endDate = metadata?.endDate ?? parseEventDate(props.event.end, calendarSettings.manualTimeOffsetHours);
    return { startDate, endDate };
});

const timeDisplayParts = computed(() =>
    buildTimeDisplayParts(resolvedDates.value.startDate, resolvedDates.value.endDate, displayNow.value, isSingleDay.value),
);

// Status text for relative timing info
const statusInfo = computed(() =>
    buildEventStatusInfo(resolvedDates.value.startDate, resolvedDates.value.endDate, displayNow.value, isSingleDay.value),
);
</script>

<style lang="scss" scoped>
.event-time-display {
    --transition--time-text: color 0.3s ease, opacity 0.3s ease;
    min-width: 140px;
    flex-basis: 75%;

    .time-row {
        font-size: 0.9rem;
        font-weight: 500;
        color: color-mix(in srgb, var(--bs-body-color) 85%, transparent);
        line-height: 1.4;
        margin-bottom: 2px;
        transition: var(--transition--time-text);

        &.is-completed {
            color: var(--bs-secondary-color);
            opacity: 0.8;
            font-weight: 400;
        }

        .time-focused {
            font-weight: 500;
            color: color-mix(in srgb, var(--bs-body-color) 100%, transparent);
            transition: var(--transition--time-text);
        }

        .time-dimmed {
            opacity: 0.8;
            font-size: 0.8rem;
            color: var(--bs-secondary-color);
            font-weight: 300;
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
