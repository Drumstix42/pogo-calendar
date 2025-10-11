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

        <div class="day-number">{{ date }}</div>

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
                    :key="`multi-${getEventKey(event)}`"
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
                    <div
                        class="multi-day-event-bar calendar-event"
                        :class="[
                            getMultiDayEventBarClass(event, props.dayInstance),
                            {
                                'event-id-highlighted': eventHighlight.hoveredEventID === event.eventID,
                                'event-past': eventsStore.eventMetadata[event.eventID]?.isPastEvent,
                            },
                        ]"
                        :data-event-type="event.eventType"
                        :data-event-id="event.eventID"
                        :style="{
                            '--event-bg-color': eventsStore.eventMetadata[event.eventID]?.color,
                            backgroundColor: eventsStore.eventMetadata[event.eventID]?.color,
                            fontSize: `${calendarSettings.eventBarFontSize}px`,
                            left: getEventPosition(event, props.dayInstance).left,
                            width: getEventPosition(event, props.dayInstance).width,
                            position: 'absolute',
                            pointerEvents: 'auto',
                            zIndex: 20 + getEventSlotTop(event),
                        }"
                        :data-debug="`Event: ${event.name} | ID: ${event.eventID} | Slot: ${getEventSlotData(event)?.slotIndex} | Grouped: ${(event as any)._isGrouped || false}`"
                        @mouseenter="debouncedHighlightEventID(event.eventID)"
                        @mouseleave="debouncedClearEventIDHighlight"
                        @click="handleEventClick(event)"
                    >
                        <VMenu
                            :disabled="isMobile"
                            placement="top"
                            :delay="tooltipOptionsDefaults.delay"
                            :distance="tooltipOptionsDefaults.distance"
                            :auto-hide="tooltipOptionsDefaults.autoHide"
                            @apply-show="handleMenuShow(event)"
                            @apply-hide="handleMenuHide(event)"
                        >
                            <div class="multi-day-event-bar--inner">
                                <!-- Show Pokemon images for grouped or individual events -->
                                <template v-if="calendarSettings.useMultiDayEventSprites">
                                    <template v-if="calendarSettings.groupSimilarEvents && hasGroupedEvents(event)">
                                        <PokemonImages
                                            :event="event"
                                            :event-name="formatEventName(event.name)"
                                            :height="multiDayEventIconHeight"
                                            :limit="2"
                                        />
                                    </template>
                                    <template v-else>
                                        <PokemonImages :event="event" :event-name="getEventDisplayName(event)" :height="multiDayEventIconHeight" />
                                    </template>
                                </template>

                                <span class="event-name">{{ getEventDisplayName(event) }}</span>
                                <span v-if="shouldShowBadge(event)" class="event-badge">{{ getEventCount(event) }}</span>

                                <!-- Toggle event type button (shows on hover) (hide on touch devices) -->
                                <!-- <div v-if="!isTouchDevice" class="ms-auto d-flex align-items-center">
                                    <EventToggleButton :event-type="event.eventType" @hide="hideEventType" />
                                </div> -->
                            </div>

                            <template #popper>
                                <EventTooltip :event="event" />
                            </template>
                        </VMenu>
                    </div>
                </div>
            </TransitionGroup>
        </div>

        <!-- Single-day events (vertically stacked event blocks with timestamps) -->
        <div>
            <TransitionGroup name="fade" tag="div" class="single-day-events">
                <VMenu
                    v-for="event in singleDayEvents"
                    :key="`single-${getEventKey(event)}`"
                    :disabled="isMobile"
                    placement="top"
                    :delay="tooltipOptionsDefaults.delay"
                    :distance="tooltipOptionsDefaults.distance"
                    :auto-hide="tooltipOptionsDefaults.autoHide"
                    @apply-show="handleMenuShow(event)"
                    @apply-hide="handleMenuHide(event)"
                >
                    <div
                        class="single-day-event calendar-event"
                        :class="{
                            'event-past': eventsStore.eventMetadata[event.eventID]?.isPastEvent,
                            'event-id-highlighted': eventHighlight.hoveredEventID === event.eventID,
                        }"
                        :data-event-type="event.eventType"
                        :data-event-id="event.eventID"
                        @mouseenter="debouncedHighlightEventID(event.eventID)"
                        @mouseleave="debouncedClearEventIDHighlight"
                        @click="handleEventClick(event)"
                    >
                        <div class="event-dot" :style="{ backgroundColor: eventsStore.eventMetadata[event.eventID]?.color }"></div>
                        <div class="event-content">
                            <div class="event-name-container">
                                <div class="event-name">{{ getEventDisplayName(event) }}</div>
                                <!-- Toggle event type button (shows on hover) (hide on touch devices) -->
                                <!-- <div v-if="!isTouchDevice" class="ms-auto d-flex align-items-center">
                                    <EventToggleButton :event-type="event.eventType" @hide="hideEventType" />
                                </div> -->
                            </div>
                            <div v-if="getEventTime(event)" class="event-time">{{ getEventTime(event) }}</div>
                            <PokemonImages
                                v-if="calendarSettings.useSingleDayEventSprites"
                                :event="event"
                                :event-name="getEventDisplayName(event)"
                                :height="singleDayPokemonHeight"
                                :show-placeholder="true"
                            />
                        </div>
                    </div>

                    <template #popper>
                        <EventTooltip :event="event" :is-single-day="true" />
                    </template>
                </VMenu>
            </TransitionGroup>
        </div>
    </div>
</template>

<script setup lang="ts">
import { breakpointsBootstrapV5, useBreakpoints } from '@vueuse/core';
import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useDeviceDetection } from '@/composables/useDeviceDetection';
import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventHighlightStore } from '@/stores/eventHighlight';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import {
    type PogoEvent,
    formatEventTime,
    getCalendarEventsForDate,
    getEventsForDate,
    getGroupedEventsCount,
    hasGroupedEvents,
    isSameDayEvent,
    parseEventDate,
    sortEventsByPriority,
} from '@/utils/eventTypes';

import EventTooltip from './EventTooltip.vue';
import PokemonImages from './PokemonImages.vue';

interface Props {
    date: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    dayInstance: Dayjs;
    showRightBorder: boolean;
    eventSlots: Array<{
        event: PogoEvent;
        slotIndex: number;
        startDay: Dayjs;
        endDay: Dayjs;
        shouldRenderOnDay: (day: Dayjs) => boolean;
    }>;
}

const MULTI_DAY_EVENT_BAR_MARGIN = 1; // px margin between bars

const props = defineProps<Props>();
const eventFilter = useEventFilterStore();
const eventsStore = useEventsStore();
const calendarSettings = useCalendarSettingsStore();
const eventHighlight = useEventHighlightStore();
const { isTouchDevice } = useDeviceDetection();
const { selectEvent, clearEvent, selectedEventId } = useUrlSync();

// Breakpoints
const breakpoints = useBreakpoints(breakpointsBootstrapV5);
const isMobile = breakpoints.smaller('md'); // < 768px

// Reactive values for multi-day event bar sizing
const multiDayEventBarHeight = computed(() => calendarSettings.eventBarHeight);
const multiDayEventIconHeight = computed(() => multiDayEventBarHeight.value - 2);

// Single-day event Pokemon image height based on breakpoint
const singleDayPokemonHeight = computed(() => {
    if (breakpoints.greaterOrEqual('xxl').value) {
        return 50; // >= 1400px
    } else if (breakpoints.greaterOrEqual('xl').value) {
        return 45; // >= 1200px
    }
    return 40; // < 1200px
});

const tooltipOptionsDefaults = computed(() => ({
    autoHide: isTouchDevice.value,
    delay: { show: 100, hide: 100 },
    distance: 4,
}));

// calculate week boundaries based on configured first day
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
        const calendarData = getCalendarEventsForDate(eventsStore.events, props.dayInstance);

        // Filter by enabled event types and individual event IDs
        const filteredSingleDay = calendarData.singleDayEvents.filter(event => eventFilter.isEventVisible(event.eventType, event.eventID));
        const filteredMultiDay = calendarData.multiDayEvents.filter(event => eventFilter.isEventVisible(event.eventType, event.eventID));
        const filteredGroups = calendarData.eventGroups.filter(group =>
            group.events.some(event => eventFilter.isEventVisible(event.eventType, event.eventID)),
        );

        return {
            singleDayEvents: filteredSingleDay,
            multiDayEvents: filteredMultiDay,
            eventGroups: filteredGroups,
        };
    } else {
        // No grouping - get individual events for the date
        const eventsForDate = getEventsForDate(eventsStore.events, props.dayInstance);

        // Filter by enabled event types and individual event IDs, then separate by single/multi-day
        const enabledEvents = eventsForDate.filter((event: PogoEvent) => eventFilter.isEventVisible(event.eventType, event.eventID));
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
    const eventsOnThisDay = props.eventSlots.filter(slot => slot.shouldRenderOnDay(props.dayInstance));

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
    const { weekStart, weekEnd } = getWeekBoundaries(props.dayInstance);

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
    // +1 because index is 0-based
    return (maxCompactIndex + 1) * (multiDayEventBarHeight.value + MULTI_DAY_EVENT_BAR_MARGIN);
});

// Helper functions for template
const getEventKey = (event: PogoEvent): string => {
    return event.eventID;
};

const getEventDisplayName = (event: PogoEvent): string => {
    // Check if this event has a custom display name (from grouping)
    if ((event as any)._displayName) {
        return formatEventName((event as any)._displayName);
    }

    // For individual events, always show the event name
    return formatEventName(event.name);
};

const getEventCount = (event: PogoEvent): number => {
    return getGroupedEventsCount(event);
};

const shouldShowBadge = (event: PogoEvent): boolean => {
    return getEventCount(event) > 1;
};

/* const getEventColor = (event: PogoEvent): string => {
    return getEventTypeInfo(event.eventType).color;
}; */

const getEventTime = (event: PogoEvent): string => {
    // Check if this is a multi-day event
    if (!isSameDayEvent(event)) {
        // For multi-day events, don't show time
        return '';
    }

    // For single-day events, show the start time
    return formatEventTime(event.start);
};

/* const hideEventType = (eventType: EventTypeKey): void => {
    hideEventTypeWithToast(eventType);
}; */

const highlightEventID = (eventID: string): void => {
    eventHighlight.highlightEventID(eventID);
};

const clearEventIDHighlight = (): void => {
    eventHighlight.clearEventIDHighlight();
};

let highlightTimeout: number | null = null;

const debouncedHighlightEventID = (eventID: string): void => {
    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
    }

    highlightTimeout = setTimeout(() => {
        highlightEventID(eventID);
        highlightTimeout = null;
    }, 200);
};

const debouncedClearEventIDHighlight = (): void => {
    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
        highlightTimeout = null;
    }

    clearEventIDHighlight();
};

// Mobile: opens drawer on tap
function handleEventClick(event: PogoEvent) {
    if (!isMobile.value) return;
    selectEvent(event.eventID);
}

// Desktop: updates URL when tooltip shows
function handleMenuShow(event: PogoEvent) {
    selectEvent(event.eventID);
}

// Clears URL when tooltip closes
function handleMenuHide(event: PogoEvent) {
    if (selectedEventId.value === event.eventID) {
        clearEvent();
    }
}

const getMultiDayEventBarClass = (event: PogoEvent, currentDay: Dayjs): string => {
    const slotData = getEventSlotData(event);
    if (!slotData || !slotData.shouldRenderOnDay(currentDay)) return '';

    const today = currentDay.startOf('day');
    const { weekEnd } = getWeekBoundaries(props.dayInstance);
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

    // Uses height + margin to calculate the top position
    return compactSlot.compactSlotIndex * (multiDayEventBarHeight.value + MULTI_DAY_EVENT_BAR_MARGIN);
};

const getEventPosition = (event: PogoEvent, currentDay: Dayjs): { left: string; width: string } => {
    const slotData = getEventSlotData(event);
    if (!slotData || !slotData.shouldRenderOnDay(currentDay)) {
        return { left: '0%', width: '100%' };
    }

    const today = currentDay.startOf('day');
    const eventStart = parseEventDate(event.start);
    const eventEnd = parseEventDate(event.end);

    // This function only handles multi-day events that render as bars
    const eventStartDay = eventStart.startOf('day');
    const { weekEnd } = getWeekBoundaries(props.dayInstance);
    const weekEndDay = weekEnd.endOf('day');
    const eventEndDay = eventEnd.startOf('day');
    const actualEndDay = eventEndDay.isBefore(weekEndDay) ? eventEndDay : weekEndDay;

    // Calculate left offset - if event starts on this day, account for start time
    let leftPercentage: number;
    if (today.isSame(eventStartDay, 'day')) {
        // Event starts on this day - calculate offset from event start time
        const startHours = eventStart.diff(today, 'hour', true);
        leftPercentage = (startHours / 24) * 100;
    } else {
        // Event started before this day - start from beginning of day
        leftPercentage = 0;
    }

    // Calculate end position and span days
    let endPositionPercentage: number;
    const spanDays = actualEndDay.diff(today, 'day') + 1;

    // If the event ends on the last day we're spanning to, check if it ends at a specific time
    if (eventEndDay.isSame(actualEndDay, 'day') && eventEndDay.isSameOrBefore(weekEndDay, 'day')) {
        // Event ends on the final day - calculate end position as total hours from rendering start
        const totalHours = eventEnd.diff(today, 'hour', true);
        endPositionPercentage = (totalHours / 24) * 100;
    } else {
        // Event continues beyond the week or ends at day boundary
        endPositionPercentage = spanDays * 100;
    }

    const widthPercentage = endPositionPercentage - leftPercentage;

    // Check if this event is followed by another event in the same slot for gap adjustment
    const hasFollowingEvent = props.eventSlots.some(slot => {
        if (slot.slotIndex !== slotData.slotIndex || slot.event.eventID === event.eventID || slot.event.eventType !== event.eventType) {
            return false;
        }

        const otherStart = parseEventDate(slot.event.start);

        // Check if other event starts at or shortly after this one ends (within 2 hours)
        // AND starts within this same week
        return otherStart.isSameOrAfter(eventEnd) && otherStart.diff(eventEnd, 'hour') <= 2 && otherStart.isSameOrBefore(weekEndDay);
    });

    const gapAdjustment = hasFollowingEvent ? ' - 1px' : '';

    return {
        left: `${leftPercentage}%`,
        width: `calc(${Math.max(widthPercentage, 5)}% + 0px${gapAdjustment})`,
    };
};
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
        min-height: 100px;
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

.day-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 23px;
    height: 23px;
    border-radius: 50%;
    font-size: 0.875rem;
    margin: 2px 0 2px 2px;
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

.multi-day-event-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    border-radius: 6px;
    font-size: 11px;
    line-height: 1.2;
    color: #f2f2f2;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    height: 100%;
    min-width: 0;
    margin-bottom: 1px;
    overflow: hidden;
    position: relative;
    box-sizing: border-box; /* Use border-box for predictable sizing */
    pointer-events: auto; /* Ensure bars are interactive */
    transform: translate3d(0, 0, 0); /* Fixes some rendering issues in Chrome */
    transition: background-color 0.5s ease;
}

.multi-day-event-bar:hover {
    color: #ffffff;
    background-color: color-mix(in srgb, var(--event-bg-color) 80%, black) !important;
}

.multi-day-event-bar--inner {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding-left: 4px;
    padding-right: 2px;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    gap: 4px;
    transform: translate3d(0, 0, 0); /* Fixes some rendering issues in Chrome */
}

:deep(.multi-day-event-bar--inner .pokemon-images) {
    flex-shrink: 0;
}

.multi-day-event-bar .event-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 400;
    line-height: 1.2;
    min-width: 28px;
}

.multi-day-event-bar:hover {
    .event-name {
        font-weight: 500;
    }
}

.multi-day-event-bar .v-popper--theme-tooltip,
.multi-day-event-bar .v-popper--theme-dropdown {
    width: 100%;
    height: 100%;
}

.single-day-event.event-past {
    .event-content {
        transition:
            filter 0.3s ease,
            opacity 0.3s ease;
    }

    &:not(:hover) {
        .event-content {
            opacity: 0.6;
            filter: grayscale(30%);

            .event-name {
                text-shadow: none;
            }
        }
    }
}

.multi-day-event-bar.event-past {
    .event-name {
        transition:
            opacity 0.3s ease,
            color 0.3s ease;
    }
    &:not(:hover) {
        opacity: 0.9;
        .event-name {
            color: #ccc;
            text-shadow: none;
        }
        .pokemon-images {
            opacity: 0.9;
            filter: grayscale(100%);
        }
    }
}

.event-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 1;
    min-width: 15px;
    height: 15px;
    padding: 0 4px;
    margin-left: -2px;
    font-size: 0.65rem;
    font-weight: 500;
    line-height: 15px;
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.9);
    background-color: rgba(255, 255, 255, 0.25);
}

/* Hide toggle button by default */
.single-day-event :deep(.event-toggle-button),
.multi-day-event-bar :deep(.event-toggle-button) {
    display: none;
}

/* Show toggle button on hover using deep selector */
.single-day-event:hover :deep(.event-toggle-button),
.multi-day-event-bar:hover :deep(.event-toggle-button) {
    display: inline-flex;
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
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 5px; /* leave empty space below multi-day events, for better perceived margin before next visible week */
    gap: 3px;
    margin: 0.25rem 0.1rem 0.1rem 0.1rem;
}

.single-day-event {
    position: relative;
    min-height: 40px;
    display: flex;
    align-items: flex-start;
    gap: 5px;
    padding: 2px 1px 2px 3px;
    border-radius: 3px;
    cursor: pointer;
    min-width: 0;
    overflow: hidden;
}

.single-day-event:hover {
    background-color: var(--calendar-hover-bg);
}

.event-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 4px; /* Align with first line of text */
}

.event-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    max-height: 130px;
    /* overflow: hidden; */
}

.event-content :deep(.pokemon-images) {
    margin-left: -6px;
}

/* @media (min-width: 768px) {
    .event-content :deep(.pokemon-images) {
        margin-left: -6px;
    }
} */

.single-day-event .event-name {
    font-size: 0.7rem;
    font-weight: 400;
    color: #333;
    min-height: 15px;
    line-height: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    margin-top: 1px;
    flex: 1;
}

[data-bs-theme='dark'] .single-day-event .event-name {
    color: #e9ecef;
}

.single-day-event .event-time {
    flex-shrink: 0;
    font-size: 0.7rem;
    font-weight: 600;
    color: #444;
    line-height: 0.8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 8px;
}

[data-bs-theme='dark'] .single-day-event .event-time {
    color: #adb5bd;
}

.event-name-container {
    display: flex;
    align-items: center;
    /* gap: 3px; */
    min-width: 0;
}

.single-day-event:hover .event-name-container,
.multi-day-event-bar:hover .event-name-container {
    gap: 3px;
}

.single-day-event .event-badge {
    background-color: #6c757d;
    color: white;
    font-size: 0.6rem;
    min-width: 14px;
    height: 14px;
    padding: 0 3px;
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
