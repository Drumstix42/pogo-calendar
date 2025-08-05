<template>
    <div class="event-tooltip">
        <div class="event-tooltip-type">{{ getEventTypeName(event) }}</div>

        <!-- Show individual events if grouped -->
        <div v-if="(event as any)._isGrouped" class="grouped-events">
            <div class="event-separator"></div>
            <div
                v-for="groupedEvent in getGroupedEvents(event)"
                :key="groupedEvent.eventID"
                class="event-time-info"
                :style="{
                    backgroundColor: getEventColor(groupedEvent),
                    borderLeftColor: `color-mix(in srgb, ${getEventColor(groupedEvent)} 70%, black)`,
                }"
            >
                <div class="event-content">
                    <!-- Pokemon images -->
                    <PokemonImages :event="groupedEvent" :event-name="groupedEvent.name" :height="50" />

                    <!-- Event text content -->
                    <div class="event-text">
                        <div class="grouped-event-name">{{ groupedEvent.name }}</div>
                        <div class="grouped-event-time">{{ formatEventDuration(groupedEvent) }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Show time for single events -->
        <div v-else>
            <div class="event-separator"></div>
            <div
                class="event-time-info"
                :style="{
                    backgroundColor: getEventColor(event),
                    borderLeftColor: `color-mix(in srgb, ${getEventColor(event)} 70%, black)`,
                }"
            >
                <div class="event-content">
                    <!-- Pokemon images -->
                    <PokemonImages :event="event" :event-name="event.name" :height="50" />

                    <!-- Event text content -->
                    <div class="event-text">
                        <div class="grouped-event-name">{{ event.name }}</div>
                        <div :class="isSingleDay ? 'single-event-time' : 'grouped-event-time'">{{ formatEventDuration(event) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';

import { type PogoEvent, formatEventTime, getEventTypeInfo, getGroupedEvents, isSameDayEvent, parseEventDate } from '@/utils/eventTypes';

import PokemonImages from './PokemonImages.vue';

interface Props {
    event: PogoEvent;
    isSingleDay?: boolean;
}

withDefaults(defineProps<Props>(), {
    isSingleDay: false,
});

const getEventColor = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).color;
};

const getEventTypeName = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).name;
};

const formatEventDuration = (event: PogoEvent): string => {
    const startTime = formatEventTime(event.start);
    const endTime = formatEventTime(event.end);

    if (isSameDayEvent(event)) {
        return `${startTime} - ${endTime}`;
    } else {
        // For multi-day events, show date and time range
        const startDate = parseEventDate(event.start).format('MMM D');
        const endDate = parseEventDate(event.end).format('MMM D');
        const totalDays = dayjs(event.end).diff(dayjs(event.start), 'day') + 1;
        return `${startDate}, ${startTime} - ${endDate}, ${endTime} (${totalDays} day${totalDays > 1 ? 's' : ''})`;
    }
};
</script>

<style scoped>
.event-tooltip {
    max-width: 330px;
    padding: 0.4rem;
}

.event-tooltip-type {
    font-size: 0.8rem;
    line-height: 1.2;
    font-weight: 600;
    color: color-mix(in srgb, var(--bs-body-color) 80%, transparent);
    margin-bottom: 0.25rem;
}

.event-time-info {
    margin-bottom: 0.4rem;
    padding: 0.4rem 0.6rem 0.4rem 0.5rem;
    border-radius: 4px;
    border-left: 3px solid;
}

.event-content {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.event-text {
    flex: 1;
    min-width: 0; /* Allow text to shrink */
}

.event-time-info:last-child {
    margin-bottom: 0;
}

.event-separator {
    height: 1px;
    background-color: color-mix(in srgb, var(--bs-body-color) 40%, transparent);
    margin-bottom: 0.5rem;
}

.grouped-events {
    margin-top: 0.6rem;
}

.grouped-event-name {
    font-size: 0.75rem;
    font-weight: 400;
    line-height: 1.3;
    color: #ffffff;
    margin-bottom: 0.15rem;
}

.grouped-event-time {
    font-size: 0.8rem;
    color: #e5e5e5;
    font-weight: 500;
    text-shadow: 1px 2px 2px rgba(0, 0, 0, 0.3);
}

.single-event-time {
    font-size: 0.8rem;
    color: #e5e5e5;
    font-weight: 500;
    text-shadow: 1px 2px 2px rgba(0, 0, 0, 0.3);
}
</style>
