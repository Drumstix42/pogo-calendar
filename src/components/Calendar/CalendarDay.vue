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
        <div
            v-if="weekCompactSlots.size > 0"
            class="multi-day-events"
            :xclass="{ 'no-single-day-events': !singleDayEvents.length }"
            :style="{ height: `${multiDayEventsHeight}px` }"
        >
            <template v-for="event in multiDayEvents" :key="`multi-${getEventKey(event)}`">
                <div
                    class="multi-day-event-slot"
                    :style="{
                        position: 'absolute',
                        top: `${getEventSlotTop(event)}px`,
                        left: '0',
                        right: '0',
                        height: '20px',
                        pointerEvents: 'none',
                    }"
                >
                    <div
                        class="multi-day-event-bar"
                        :class="getMultiDayEventBarClass(event, props.dayjs)"
                        :style="{
                            backgroundColor: getEventColor(event),
                            left: getEventPosition(event, props.dayjs).left,
                            width: getEventPosition(event, props.dayjs).width,
                            position: 'absolute',
                            pointerEvents: 'auto',
                            zIndex: 20 + getEventSlotTop(event),
                        }"
                        :data-debug="`Event: ${event.name} | ID: ${event.eventID} | Slot: ${getEventSlotData(event)?.slotIndex} | Grouped: ${(event as any)._isGrouped || false}`"
                    >
                        <VTooltip placement="top" :delay="{ show: 50, hide: 0 }" distance="10" :triggers="['hover']" :auto-hide="true">
                            <div class="multi-day-event-bar--inner">
                                <span class="event-name">{{ getEventDisplayName(event) }}</span>
                                <span v-if="shouldShowBadge(event)" class="event-badge">{{ getEventCount(event) }}</span>
                            </div>

                            <template #popper>
                                <EventTooltip :event="event" />
                            </template>
                        </VTooltip>
                    </div>
                </div>
            </template>
        </div>

        <!-- Single-day events (rendered second, as circles on top) -->
        <div xv-if="singleDayEvents.length > 0" class="single-day-events">
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
                    <EventTooltip :event="event" :is-single-day="true" />
                </template>
            </VTooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import {
    type PogoEvent,
    formatEventTime,
    getCalendarEventsForDate,
    getEventTypeInfo,
    getEventsForDate,
    isSameDayEvent,
    parseEventDate,
    sortEventsByPriority,
} from '@/utils/eventTypes';

import EventTooltip from './EventTooltip.vue';

interface Props {
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    dayjs: Dayjs;
    eventSlots: Array<{
        event: PogoEvent;
        slotIndex: number;
        startDay: Dayjs;
        endDay: Dayjs;
        shouldRenderOnDay: (day: Dayjs) => boolean;
    }>;
}

const props = defineProps<Props>();
const eventFilter = useEventFilterStore();
const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();

// Helper function to calculate week boundaries based on configured first day
const getWeekBoundaries = (referenceDay: Dayjs) => {
    const firstDayIndex = calendarSettings.firstDayIndex;
    
    // Find the start of the week for this day
    let weekStart = referenceDay.clone();
    while (weekStart.day() !== firstDayIndex) {
        weekStart = weekStart.subtract(1, 'day');
    }
    
    const weekEnd = weekStart.add(6, 'day');
    
    return { weekStart, weekEnd };
};

// Get events for this specific day using the new grouping logic
const calendarEvents = computed(() => {
    if (calendarSettings.groupSimilarEvents) {
        // Use the existing grouping logic
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
    } else {
        // No grouping - get individual events for the date
        const eventsForDate = getEventsForDate(eventsStore.events, props.dayjs);

        // Filter by enabled event types and separate by single/multi-day
        const enabledEvents = eventsForDate.filter((event: PogoEvent) => eventFilter.isEventTypeEnabled(event.eventType));
        const singleDay = enabledEvents.filter((event: PogoEvent) => isSameDayEvent(event));
        const multiDay = enabledEvents.filter((event: PogoEvent) => !isSameDayEvent(event));

        return {
            singleDayEvents: sortEventsByPriority(singleDay),
            multiDayEvents: sortEventsByPriority(multiDay),
            eventGroups: [], // No groups when grouping is disabled
        };
    }
});

// Use individual single-day events without grouping
const singleDayEvents = computed(() => {
    return calendarEvents.value.singleDayEvents;
});

const multiDayEvents = computed(() => {
    const eventsOnThisDay = props.eventSlots.filter(slot => slot.shouldRenderOnDay(props.dayjs));

    // Sort by compact slot index instead of original slot index
    return eventsOnThisDay
        .map(slot => {
            const compactSlot = weekCompactSlots.value.get(slot.event.eventID);
            return {
                event: slot.event,
                compactIndex: compactSlot?.compactSlotIndex ?? 999,
            };
        })
        .sort((a, b) => a.compactIndex - b.compactIndex)
        .map(item => item.event);
});

// Compact slot assignments for this specific week to remove gaps
const weekCompactSlots = computed(() => {
    // Calculate week start properly based on configured first day
    const { weekStart, weekEnd } = getWeekBoundaries(props.dayjs);

    // Find all events that actually render on at least one day in this week
    const eventsRenderingInThisWeek = props.eventSlots.filter(slot => {
        // Check if this slot renders on any day of this week
        for (let day = weekStart.clone(); day.isSameOrBefore(weekEnd); day = day.add(1, 'day')) {
            if (slot.shouldRenderOnDay(day)) {
                return true;
            }
        }
        return false;
    });

    // Group events by their original slot index to maintain slot sharing
    const eventsBySlotIndex = new Map<number, typeof props.eventSlots>();
    eventsRenderingInThisWeek.forEach(slot => {
        if (!eventsBySlotIndex.has(slot.slotIndex)) {
            eventsBySlotIndex.set(slot.slotIndex, []);
        }
        eventsBySlotIndex.get(slot.slotIndex)!.push(slot);
    });

    // Sort slot indexes and assign compact indexes
    const sortedSlotIndexes = Array.from(eventsBySlotIndex.keys()).sort((a, b) => a - b);

    const compactSlots = new Map();
    sortedSlotIndexes.forEach((slotIndex, compactIndex) => {
        // Assign the same compact index to all events in the same original slot
        const eventsInSlot = eventsBySlotIndex.get(slotIndex)!;
        eventsInSlot.forEach(slot => {
            compactSlots.set(slot.event.eventID, {
                ...slot,
                compactSlotIndex: compactIndex,
            });
        });
    });

    return compactSlots;
});

const multiDayEventsHeight = computed(() => {
    // Get the maximum compact slot index used in this week
    const compactSlots = Array.from(weekCompactSlots.value.values());
    if (compactSlots.length === 0) return 0;

    const maxCompactIndex = Math.max(...compactSlots.map(slot => slot.compactSlotIndex));
    return (maxCompactIndex + 1) * 24; // 24px per slot, +1 because index is 0-based
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

const getEventTime = (event: PogoEvent): string => {
    // Check if this is a multi-day event
    if (!isSameDayEvent(event)) {
        // For multi-day events, don't show time
        return '';
    }

    // For single-day events, show the start time
    return formatEventTime(event.start);
};

// Multi-day event bar state helpers
const getMultiDayEventBarClass = (event: PogoEvent, currentDay: Dayjs): string => {
    const slotData = getEventSlotData(event);
    if (!slotData || !slotData.shouldRenderOnDay(currentDay)) return '';

    const today = currentDay.startOf('day');
    const { weekEnd } = getWeekBoundaries(props.dayjs);
    const weekEndDay = weekEnd.endOf('day');

    // Use the actual event's dates, not the composite slot's extended dates
    const eventStartDay = parseEventDate(event.start).startOf('day');
    const eventEndDay = parseEventDate(event.end).startOf('day');

    // Start positioning (2 permutations)
    const isStartDay = today.isSame(eventStartDay, 'day');
    const isFirstDayOfWeek = today.day() === calendarSettings.firstDayIndex;

    // End positioning (1 condition)
    const eventEndsThisWeek = eventEndDay.isSameOrBefore(weekEndDay, 'day');

    // Special case: single day span
    if (isStartDay && eventEndsThisWeek && today.isSame(eventEndDay, 'day')) {
        return 'single-day-span';
    }

    // Build classes
    const classes: string[] = [];

    // Start cap logic
    if (isStartDay) {
        classes.push('start-cap');
    } else if (isFirstDayOfWeek) {
        classes.push('week-continue');
    } else {
        classes.push('middle-continue');
    }

    // End cap logic
    if (eventEndsThisWeek) {
        classes.push('end-cap');
    }

    return classes.join(' ');
};

const getEventSlotData = (event: PogoEvent) => {
    return props.eventSlots.find(slot => slot.event.eventID === event.eventID);
};

const getEventSlotTop = (event: PogoEvent): number => {
    const compactSlot = weekCompactSlots.value.get(event.eventID);
    if (!compactSlot) return 0;

    // Each slot is 24px high (20px bar + 4px margin)
    return compactSlot.compactSlotIndex * 24;
};

const getEventPosition = (event: PogoEvent, currentDay: Dayjs): { left: string; width: string } => {
    const slotData = getEventSlotData(event);
    if (!slotData || !slotData.shouldRenderOnDay(currentDay)) {
        return { left: '0%', width: '100%' };
    }

    const today = currentDay.startOf('day');
    const dayStart = today.clone();
    const dayEnd = today.clone().add(1, 'day');

    const eventStart = parseEventDate(event.start);
    const eventEnd = parseEventDate(event.end);

    // Calculate left offset based on start time within the day
    const segmentStart = eventStart.isBefore(dayStart) ? dayStart : eventStart;
    const startHours = segmentStart.diff(dayStart, 'hour', true);
    const leftPercentage = (startHours / 24) * 100;

    // Calculate end position and span
    let endPercentage: number;
    let spanDays: number;

    // Check if this is a multi-day event
    if (eventEnd.startOf('day').isAfter(eventStart.startOf('day'))) {
        // Multi-day event - calculate span from current rendering day to event end
        // Use consistent week boundaries based on the calendar row
        const { weekEnd } = getWeekBoundaries(props.dayjs);
        const weekEndDay = weekEnd.endOf('day');
        const eventEndDay = eventEnd.startOf('day');
        const actualEndDay = eventEndDay.isBefore(weekEndDay) ? eventEndDay : weekEndDay;

        // Calculate how many days to span from today to the end
        spanDays = actualEndDay.diff(today, 'day') + 1;

        // If the event ends on the last day we're spanning to, check if it ends at a specific time
        if (eventEndDay.isSame(actualEndDay, 'day') && eventEndDay.isSameOrBefore(weekEndDay, 'day')) {
            // Event ends on the final day - calculate partial day width
            const finalDayStart = actualEndDay.clone();
            const finalDayEnd = finalDayStart.clone().add(1, 'day');
            const segmentEnd = eventEnd.isAfter(finalDayEnd) ? finalDayEnd : eventEnd;
            const endHours = segmentEnd.diff(finalDayStart, 'hour', true);
            const finalDayPercentage = (endHours / 24) * 100;

            // Width spans full days plus partial final day
            endPercentage = (spanDays - 1) * 100 + finalDayPercentage;
        } else {
            // Event continues beyond the week or ends at day boundary
            endPercentage = spanDays * 100;
        }
    } else {
        // Single day event: calculate duration within the day
        const segmentEnd = eventEnd.isAfter(dayEnd) ? dayEnd : eventEnd;
        const endHours = segmentEnd.diff(dayStart, 'hour', true);
        endPercentage = (endHours / 24) * 100;
        spanDays = 1;
    }

    const widthPercentage = endPercentage - leftPercentage;

    // Check if this event is followed by another event in the same slot
    let gapAdjustment = '';
    if (slotData) {
        const { weekEnd } = getWeekBoundaries(props.dayjs);
        const weekEndDay = weekEnd.endOf('day');

        // Find other events in the same slot that start after this one ends
        const hasFollowingEvent = props.eventSlots.some(slot => {
            if (slot.slotIndex !== slotData.slotIndex || slot.event.eventID === event.eventID || slot.event.eventType !== event.eventType) {
                return false;
            }

            const otherStart = parseEventDate(slot.event.start);

            // Check if other event starts at or shortly after this one ends (within 2 hours)
            // AND starts within this same week
            return otherStart.isSameOrAfter(eventEnd) && otherStart.diff(eventEnd, 'hour') <= 2 && otherStart.isSameOrBefore(weekEndDay);
        });

        if (hasFollowingEvent) {
            gapAdjustment = ' - 4px';
        }
    }

    return {
        left: `${leftPercentage}%`,
        width: `calc(${Math.max(widthPercentage, 5)}% + ${spanDays}px${gapAdjustment})`,
    };
};
</script>

<style scoped>
.calendar-day {
    min-height: 120px;
    border-right: 1px solid #e9ecef;
    border-bottom: 1px solid #e9ecef;
    background: white;
    min-width: 0;
    overflow: visible;
    position: relative;
    /* Remove padding to allow precise event positioning */
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
    margin: 0.5rem 0 0.5rem 0.5rem; /* Add margin to replace the removed padding */
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
}

.multi-day-events.no-single-day-events {
    margin-bottom: 1rem; /* Add spacing if no single-day events */
}

.multi-day-event-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: 3px;
    font-size: 0.7rem;
    line-height: 1.2;
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: opacity 0.2s ease;
    min-width: 0;
    margin-bottom: 1px;
    overflow: visible;
    position: relative;
    height: 20px; /* Set explicit height instead of relying on padding */

    box-sizing: border-box; /* Use border-box for predictable sizing */
    pointer-events: auto; /* Ensure bars are interactive */
}

.multi-day-event-bar:hover {
    opacity: 0.8;
}

.multi-day-event-bar--inner {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding-left: 6px;
    padding-right: 6px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}

.multi-day-event-bar .event-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
}

.multi-day-event-bar .v-popper--theme-tooltip {
    width: 100%;
    height: 100%;
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
    line-height: 16px;
    margin-left: 4px;
    flex-shrink: 0;
    backdrop-filter: blur(2px);
}

/* Multi-day event bar cap styles */
.multi-day-event-bar.start-cap {
    border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.multi-day-event-bar.end-cap {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

/* When both start-cap and end-cap are present, make it fully rounded */
.multi-day-event-bar.start-cap.end-cap {
    border-radius: 6px;
}

/* When week-continue has end-cap, add right border radius */
.multi-day-event-bar.week-continue.end-cap {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
}

.multi-day-event-bar.week-continue {
    border-radius: 0;
}

.multi-day-event-bar.middle-continue {
    border-radius: 0;
}

.multi-day-event-bar.single-day-span {
    border-radius: 6px;
}

/* Composite event styles */
.composite-event-container {
    height: 20px; /* Match multi-day-event-bar height */
    margin-bottom: 1px;
    /* No flexbox needed - segments are absolutely positioned */
}

.composite-segment {
    overflow: hidden;
    height: 20px; /* Ensure segments have consistent height */
}

.tooltip-wrapper {
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
    overflow: hidden;
}

.segment-content {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    min-width: 0;
    overflow: hidden;
}

.segment-content .event-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    flex: 1;
    min-width: 0;
}

.segment-content .event-badge {
    flex-shrink: 0;
}

/* Composite segment border radius - default to no radius between segments */
.composite-first {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.composite-second {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
}

/* Cap styles for composite segments - these override the composite defaults */
.multi-day-event-bar.start-cap.composite-first {
    border-top-left-radius: 6px !important;
    border-bottom-left-radius: 6px !important;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.multi-day-event-bar.end-cap.composite-first {
    border-top-right-radius: 6px !important;
    border-bottom-right-radius: 6px !important;
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
}

/* When composite first segment has both start and end caps */
.multi-day-event-bar.start-cap.end-cap.composite-first {
    border-radius: 6px !important;
}

.multi-day-event-bar.start-cap.composite-second {
    border-top-left-radius: 6px !important;
    border-bottom-left-radius: 6px !important;
    border-top-right-radius: 0 !important;
    border-bottom-right-radius: 0 !important;
}

.multi-day-event-bar.end-cap.composite-second {
    border-top-right-radius: 6px !important;
    border-bottom-right-radius: 6px !important;
    border-top-left-radius: 0 !important;
    border-bottom-left-radius: 0 !important;
}

/* When composite second segment has both start and end caps */
.multi-day-event-bar.start-cap.end-cap.composite-second {
    border-radius: 6px !important;
}

.multi-day-event-bar.single-day-span.composite-first,
.multi-day-event-bar.single-day-span.composite-second {
    border-radius: 6px !important;
}

/* Single-day events (foreground layer) */
.single-day-events {
    z-index: 2;
    display: flex;
    flex-direction: column;
    min-height: 28px; /* leave empty space below multi-day events, for better perceived margin before next visible week */
    gap: 3px;
    margin: 0.25rem 0.5rem 0.5rem 0.5rem; /* Add margin to replace padding */
    position: relative;
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
</style>
