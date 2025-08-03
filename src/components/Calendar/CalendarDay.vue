<template>
    <div
        class="calendar-day"
        :class="{
            'other-month': !isCurrentMonth,
            today: isToday,
        }"
    >
        <div class="day-number">{{ date }}</div>

        <!-- Multi-day events (rendered first, as background bars) -->
        <div v-if="multiDayEvents.length > 0" class="multi-day-events">
            <VTooltip
                v-for="event in multiDayEvents"
                :key="`multi-${getEventKey(event)}`"
                placement="top"
                :delay="{ show: 50, hide: 0 }"
                distance="10"
            >
                <div class="multi-day-event-bar" :style="{ backgroundColor: getEventColor(event) }">
                    <span class="event-name">{{ getEventDisplayName(event) }}</span>
                    <span v-if="shouldShowBadge(event)" class="event-badge">{{ getEventCount(event) }}</span>
                </div>

                <template #popper>
                    <div class="event-tooltip">
                        <div class="event-tooltip-type">{{ getEventTypeName(event) }}</div>

                        <!-- Show individual events if grouped -->
                        <div v-if="(event as any)._isGrouped" class="grouped-events">
                            <div class="event-separator"></div>
                            <div
                                v-for="groupedEvent in getGroupedEvents(event)"
                                :key="groupedEvent.eventID"
                                class="grouped-event-item"
                                :style="{
                                    backgroundColor: getEventColor(groupedEvent),
                                    borderLeftColor: `color-mix(in srgb, ${getEventColor(groupedEvent)} 70%, black)`,
                                }"
                            >
                                <div class="grouped-event-name">{{ groupedEvent.name }}</div>
                                <div class="grouped-event-time">{{ formatEventDuration(groupedEvent) }}</div>
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
                                <div class="grouped-event-name">{{ event.name }}</div>
                                <div class="grouped-event-time">{{ formatEventDuration(event) }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </VTooltip>
        </div>

        <!-- Single-day events (rendered second, as circles on top) -->
        <div v-if="singleDayEvents.length > 0" class="single-day-events">
            <VTooltip
                v-for="event in singleDayEvents"
                :key="`single-${getEventKey(event)}`"
                placement="top"
                :delay="{ show: 50, hide: 0 }"
                distance="10"
            >
                <div class="single-day-event">
                    <div class="event-dot" :style="{ backgroundColor: getEventColor(event) }"></div>
                    <div class="event-content">
                        <div v-if="getEventTime(event)" class="event-time">{{ getEventTime(event) }}</div>
                        <div class="event-name-container">
                            <div class="event-name">{{ getEventDisplayName(event) }}</div>
                            <span v-if="shouldShowBadge(event)" class="event-badge">{{ getEventCount(event) }}</span>
                        </div>
                    </div>
                </div>

                <template #popper>
                    <div class="event-tooltip">
                        <div class="event-tooltip-type">{{ getEventTypeName(event) }}</div>

                        <!-- Show individual events if grouped -->
                        <div v-if="(event as any)._isGrouped" class="grouped-events">
                            <div class="event-separator"></div>
                            <div
                                v-for="groupedEvent in getGroupedEvents(event)"
                                :key="groupedEvent.eventID"
                                class="grouped-event-item"
                                :style="{
                                    backgroundColor: getEventColor(groupedEvent),
                                    borderLeftColor: `color-mix(in srgb, ${getEventColor(groupedEvent)} 70%, black)`,
                                }"
                            >
                                <div class="grouped-event-name">{{ groupedEvent.name }}</div>
                                <div class="grouped-event-time">{{ formatEventDuration(groupedEvent) }}</div>
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
                                <div class="grouped-event-name">{{ event.name }}</div>
                                <div class="single-event-time">{{ formatEventDuration(event) }}</div>
                            </div>
                        </div>
                    </div>
                </template>
            </VTooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { computed } from 'vue';

import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { type PogoEvent, formatEventTime, getCalendarEventsForDate, getEventTypeInfo, isSameDayEvent, parseEventDate } from '@/utils/eventTypes';

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

// Get events for this specific day using the new grouping logic
const calendarEvents = computed(() => {
    const calendarData = getCalendarEventsForDate(eventsStore.events, props.dayjs);

    // Filter by enabled event types
    const filteredSingleDay = calendarData.singleDayEvents.filter(event => eventFilter.isEventTypeEnabled(event.eventType));
    const filteredMultiDay = calendarData.multiDayEvents.filter(event => eventFilter.isEventTypeEnabled(event.eventType));
    const filteredGroups = calendarData.eventGroups.filter(group => group.events.some(event => eventFilter.isEventTypeEnabled(event.eventType)));

    return {
        singleDayEvents: filteredSingleDay,
        multiDayEvents: filteredMultiDay,
        eventGroups: filteredGroups,
    };
});

// Combine individual events with grouped events for display
const singleDayEvents = computed(() => {
    const events: PogoEvent[] = [...calendarEvents.value.singleDayEvents];

    // Add grouped single-day events
    calendarEvents.value.eventGroups.forEach(group => {
        if (!group.isMultiDay) {
            // Multiple events at same time - create a grouped representative
            const representative = { ...group.events[0] };
            (representative as any)._isGrouped = true;
            (representative as any)._groupedEvents = group.events;
            (representative as any)._displayName = group.displayName;
            events.push(representative);
        }
    });

    return events;
});

const multiDayEvents = computed(() => {
    const events: PogoEvent[] = [...calendarEvents.value.multiDayEvents];

    // Add grouped multi-day events
    calendarEvents.value.eventGroups.forEach(group => {
        if (group.isMultiDay) {
            // Multiple events - create a grouped representative
            const representative = { ...group.events[0] };
            (representative as any)._isGrouped = true;
            (representative as any)._groupedEvents = group.events;
            (representative as any)._displayName = group.displayName;
            events.push(representative);
        }
    });

    return events;
});

// Helper functions for template
const getEventKey = (event: PogoEvent): string => {
    return event.eventID;
};

const getEventDisplayName = (event: PogoEvent): string => {
    // Check if this event has a custom display name (from grouping)
    if ((event as any)._displayName) {
        return (event as any)._displayName;
    }

    // For individual events, always show the event name
    return event.name;
};

const getEventCount = (event: PogoEvent): number => {
    const groupedEvents = (event as any)._groupedEvents || [];
    return groupedEvents.length;
};

const shouldShowBadge = (event: PogoEvent): boolean => {
    return getEventCount(event) > 1;
};

const getEventColor = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).color;
};

const getEventTypeName = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).name;
};

const getEventTime = (event: PogoEvent): string => {
    // Check if this is a multi-day event
    if (!isSameDayEvent(event)) {
        // For multi-day events, don't show time
        return '';
    }

    // For single-day events, show the start time
    return formatEventTime(event.start);
};

// Helper function to format event duration for tooltips
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

// Helper function to get grouped events for tooltip
const getGroupedEvents = (event: PogoEvent): PogoEvent[] => {
    return (event as any)._groupedEvents || [event];
};
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

/* Multi-day events (background layer) */
.multi-day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 0.25rem;
    position: relative;
    z-index: 1;
}

.multi-day-event-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    line-height: 1.2;
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: opacity 0.2s ease;
    min-width: 0;
    margin-bottom: 1px;
    overflow: hidden;
}

.multi-day-event-bar:hover {
    opacity: 0.8;
}

.multi-day-event-bar .event-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    display: block;
    width: 100%;
    flex: 1;
}

.event-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background-color: rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    font-size: 0.65rem;
    font-weight: 500;
    line-height: 1;
    margin-left: 4px;
    flex-shrink: 0;
    backdrop-filter: blur(2px);
}

.multi-day-event-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    line-height: 1.2;
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: opacity 0.2s ease;
    min-width: 0;
    margin-bottom: 1px;
    overflow: hidden;
}

.multi-day-event-bar:hover {
    opacity: 0.8;
}

/* Single-day events (foreground layer) */
.single-day-events {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 0.25rem;
    position: relative;
    z-index: 2;
}

.single-day-event {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    padding: 2px 3px;
    border-radius: 3px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    min-width: 0;
    overflow: hidden;
}

.single-day-event:hover {
    background-color: rgba(0, 0, 0, 0.03);
}

.event-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 2px; /* Align with first line of text */
}

.event-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    overflow: hidden;
}

.single-day-event .event-time {
    font-weight: 600;
    font-size: 0.68rem;
    color: #444;
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.single-day-event .event-name {
    font-size: 0.68rem;
    color: #666;
    line-height: 1.1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 1px;
    flex: 1;
}

.event-name-container {
    display: flex;
    align-items: center;
    gap: 3px;
    min-width: 0;
}

.single-day-event .event-badge {
    background-color: #6c757d;
    color: white;
    font-size: 0.6rem;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
}

/* Tooltip styles */
.event-tooltip {
    max-width: 280px;
    padding: 0.5rem;
    color: #ffffff !important;
}

.event-tooltip-type {
    font-size: 0.8rem;
    /* opacity: 0.85; */
    color: #cccccc;
    margin-bottom: 0.25rem;
}

.event-time-info {
    margin-bottom: 0.4rem;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    border-left: 3px solid;
}

.event-separator {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.2);
    margin: 0.6rem 0;
}

.grouped-events {
    margin-top: 0.6rem;
}

.grouped-event-item {
    margin-bottom: 0.4rem;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    border-left: 3px solid;
}

.grouped-event-item:last-child {
    margin-bottom: 0;
}

.grouped-event-name {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.3;
    color: #ffffff;
    margin-bottom: 0.15rem;
}

.grouped-event-time {
    font-size: 0.7rem;
    color: #e0e0e0;
    font-weight: 400;
}

.single-event-time {
    font-size: 0.85rem;
    color: #e0e0e0;
    font-weight: 500;
}
</style>
