<template>
    <div class="calendar-grid">
        <!-- Calendar Grid -->
        <div class="calendar-grid-container" ref="calendarGridRef">
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
                    :event-slots="eventSlots"
                    :show-right-border="(index + 1) % 7 !== 0"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { computed } from 'vue';

import { useUrlSync } from '@/composables/useUrlSync';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { formatEventName } from '@/utils/eventName';
import { getRaidSubType, getRaidSubTypePriority, isEventWithSubtype } from '@/utils/eventTypes';
import { type PogoEvent, getEventTypeInfo, isSameDayEvent, parseEventDate } from '@/utils/eventTypes';

import CalendarDay from './CalendarDay.vue';

const { urlMonth, urlYear } = useUrlSync();
const calendarSettings = useCalendarSettingsStore();
const eventFilter = useEventFilterStore();
const eventsStore = useEventsStore();

// Types for slot-based layout
interface EventSlot {
    event: PogoEvent;
    slotIndex: number;
    startDay: dayjs.Dayjs;
    endDay: dayjs.Dayjs;
    shouldRenderOnDay: (day: dayjs.Dayjs) => boolean;
}

// Day headers from settings store
const dayHeaders = computed(() => calendarSettings.dayHeaders);

// Calendar days calculation
const calendarDays = computed(() => {
    const currentDate = dayjs().year(urlYear.value).month(urlMonth.value);
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');

    // Calculate start date based on custom first day of week
    const firstDayIndex = calendarSettings.firstDayIndex;
    let startDate = startOfMonth.clone();

    // Find the first day of the week that contains the start of month
    while (startDate.day() !== firstDayIndex) {
        startDate = startDate.subtract(1, 'day');
    }

    // Calculate end date - end of week containing last day of month
    let endDate = endOfMonth.clone();
    const lastDayIndex = (firstDayIndex + 6) % 7; // Last day of week
    while (endDate.day() !== lastDayIndex) {
        endDate = endDate.add(1, 'day');
    }

    const days = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
        days.push({
            date: day.date(),
            month: day.month(),
            year: day.year(),
            isCurrentMonth: day.isSame(currentDate, 'month'),
            isToday: day.isSame(dayjs(), 'day'),
            dayInstance: day,
        });
        day = day.add(1, 'day');
    }

    return days;
});

// Get all multi-day events for the calendar view
const multiDayEventsForCalendar = computed(() => {
    return eventsStore.events.filter(event => {
        // Filter by enabled event types, individual event IDs, and multi-day events only
        if (!eventFilter.isEventVisible(event.eventType, event.eventID) || isSameDayEvent(event)) {
            return false;
        }

        const eventStart = parseEventDate(event.start).startOf('day');
        const eventEnd = parseEventDate(event.end).startOf('day');
        const calendarStart = calendarDays.value[0]?.dayInstance.startOf('day');
        const calendarEnd = calendarDays.value[calendarDays.value.length - 1]?.dayInstance.startOf('day');

        // Include event if it overlaps with the calendar view
        return (
            eventEnd.isAfter(calendarStart) || (eventEnd.isSame(calendarStart) && eventStart.isBefore(calendarEnd)) || eventStart.isSame(calendarEnd)
        );
    });
});

// Assign slots to multi-day events
const eventSlots = computed((): EventSlot[] => {
    const events = multiDayEventsForCalendar.value;
    if (events.length === 0) return [];

    // Conditionally group events with identical start/end times based on setting
    let representativeEvents: PogoEvent[];

    if (calendarSettings.groupSimilarEvents) {
        // Group events with identical start/end times
        const eventGroups = new Map<string, PogoEvent[]>();
        events.forEach(event => {
            // Create more specific grouping key for events with subtypes
            let groupingType = event.eventType;
            if (isEventWithSubtype(event.eventType)) {
                const raidSubType = getRaidSubType(event);
                if (raidSubType) {
                    groupingType = raidSubType;
                }
            }

            const timeKey = `${groupingType}:${event.start}:${event.end}`;
            if (!eventGroups.has(timeKey)) {
                eventGroups.set(timeKey, []);
            }
            eventGroups.get(timeKey)!.push(event);
        });

        // Convert groups to representative events
        representativeEvents = Array.from(eventGroups.values()).map(group => {
            if (group.length === 1) {
                return group[0]; // Single event
            } else {
                // Multiple identical events - create grouped representative
                // Sort the group to ensure consistent representative selection
                const sortedGroup = group.sort((a, b) => {
                    // First by event type priority
                    const aPriority = getEventTypeInfo(a.eventType).priority;
                    const bPriority = getEventTypeInfo(b.eventType).priority;
                    if (aPriority !== bPriority) {
                        return bPriority - aPriority; // Higher priority first
                    }

                    // Then by event name for consistency
                    return formatEventName(a.name).localeCompare(formatEventName(b.name));
                });

                const representative = { ...sortedGroup[0] };
                (representative as any)._isGrouped = true;
                (representative as any)._groupedEvents = group;
                (representative as any)._displayName = getEventTypeInfo(sortedGroup[0].eventType).name;

                return representative;
            }
        });
    } else {
        // No grouping - use events as-is
        representativeEvents = events;
    }

    // Sort by event type priority (from eventTypes.ts), then grouped vs individual, then by start date
    const sortedEvents = representativeEvents.sort((a, b) => {
        // 1. Sort by event type priority (higher priority = higher in layout)
        const aPriority = getEventTypeInfo(a.eventType).priority;
        const bPriority = getEventTypeInfo(b.eventType).priority;
        if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
        }

        // 2. Within same priority, grouped events come before individual events
        const aIsGrouped = (a as any)._isGrouped;
        const bIsGrouped = (b as any)._isGrouped;
        if (aIsGrouped !== bIsGrouped) {
            return aIsGrouped ? -1 : 1;
        }

        // 3. For raid-battles, sort by sub-type priority (regular > mega > shadow)
        if (a.eventType === 'raid-battles' && b.eventType === 'raid-battles') {
            const aSubPriority = getRaidSubTypePriority(a);
            const bSubPriority = getRaidSubTypePriority(b);
            if (aSubPriority !== bSubPriority) {
                return bSubPriority - aSubPriority; // Higher sub-priority first
            }
        }

        // 4. Then sort by start date (earlier events first)
        const aStart = parseEventDate(a.start);
        const bStart = parseEventDate(b.start);
        if (!aStart.isSame(bStart)) {
            return aStart.isBefore(bStart) ? -1 : 1;
        }

        return 0;
    });

    const slots: EventSlot[] = [];

    for (const event of sortedEvents) {
        const eventStart = parseEventDate(event.start).startOf('day');
        const eventEnd = parseEventDate(event.end).startOf('day');

        // Try to find a slot where this event can fit without conflicts and with same event type
        let slotIndex = 0;
        if (slots.length > 0) {
            // First, try to find a slot with the same event type that has no conflicts
            const sameTypeSlot = findAvailableSlotForEventType(event, slots);
            if (sameTypeSlot !== -1) {
                slotIndex = sameTypeSlot;
            } else {
                // Find the first completely available slot
                slotIndex = findNextAvailableSlot(event, slots);
            }
        }

        const newSlot = {
            event,
            slotIndex,
            startDay: eventStart,
            endDay: eventEnd,
            shouldRenderOnDay: (day: dayjs.Dayjs) => {
                const dayStart = day.startOf('day');
                const isStartDay = dayStart.isSame(eventStart, 'day');
                const isFirstDayOfWeek = dayStart.day() === calendarSettings.firstDayIndex;
                const eventIsOngoing = dayStart.isAfter(eventStart) && dayStart.isBefore(eventEnd.add(1, 'day'));

                return isStartDay || (isFirstDayOfWeek && eventIsOngoing);
            },
        };
        slots.push(newSlot);
    }

    return slots;
});

const shouldShareSlot = (eventA: PogoEvent, eventB: PogoEvent): boolean => {
    // Check if either event is a grouped event
    const aIsGrouped = (eventA as any)._isGrouped;
    const bIsGrouped = (eventB as any)._isGrouped;

    // If both are grouped events of the same base type, they can share slots
    if (aIsGrouped && bIsGrouped && eventA.eventType === eventB.eventType) {
        return true;
    }

    // If one is grouped and matches the other's type, they can share
    if ((aIsGrouped || bIsGrouped) && eventA.eventType === eventB.eventType) {
        return true;
    }

    // Must be same event type for non-grouped logic
    if (eventA.eventType !== eventB.eventType) {
        return false;
    }

    // For raid-battles, also check sub-type compatibility (only for non-grouped events)
    if (eventA.eventType === 'raid-battles' && !aIsGrouped && !bIsGrouped) {
        const subTypeA = getRaidSubType(eventA);
        const subTypeB = getRaidSubType(eventB);
        return subTypeA === subTypeB;
    }

    // For other event types, same type is sufficient
    return true;
};

const findAvailableSlotForEventType = (event: PogoEvent, existingSlots: EventSlot[]): number => {
    // Group existing slots by slot index
    const slotsByIndex = new Map<number, EventSlot[]>();
    existingSlots.forEach(slot => {
        if (!slotsByIndex.has(slot.slotIndex)) {
            slotsByIndex.set(slot.slotIndex, []);
        }
        slotsByIndex.get(slot.slotIndex)!.push(slot);
    });

    // Check each slot index to find one with compatible event types and no conflicts
    for (const [slotIndex, slotsInIndex] of slotsByIndex) {
        // Check if this slot contains only compatible event types (considering sub-types for raids)
        const allCompatible = slotsInIndex.every(slot => shouldShareSlot(event, slot.event));

        if (allCompatible && !hasConflictInSlot(event, slotIndex, existingSlots)) {
            return slotIndex;
        }
    }

    return -1; // No suitable same-type slot found
};

const findNextAvailableSlot = (event: PogoEvent, existingSlots: EventSlot[]): number => {
    let slotIndex = 0;
    while (true) {
        if (!hasConflictInSlot(event, slotIndex, existingSlots)) {
            // Also check that this slot doesn't have incompatible event types
            const slotsInThisIndex = existingSlots.filter(slot => slot.slotIndex === slotIndex);
            const hasIncompatibleTypes = slotsInThisIndex.some(slot => !shouldShareSlot(event, slot.event));

            if (!hasIncompatibleTypes) {
                return slotIndex;
            }
        }
        slotIndex++;
    }
};

const hasConflictInSlot = (event: PogoEvent, slotIndex: number, existingSlots: EventSlot[]): boolean => {
    const eventStart = parseEventDate(event.start);
    const eventEnd = parseEventDate(event.end);
    const slotsInThisIndex = existingSlots.filter(slot => slot.slotIndex === slotIndex);

    return slotsInThisIndex.some(slot => {
        const slotStart = parseEventDate(slot.event.start);
        const slotEnd = parseEventDate(slot.event.end);

        // Check for actual time overlap
        const hasTimeOverlap = eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);

        // Compatible events (same type and sub-type) can share slots if they don't overlap in time
        if (shouldShareSlot(event, slot.event) && !hasTimeOverlap) {
            return false; // No conflict - compatible types, no time overlap
        }

        // Incompatible types or time overlap = conflict
        return hasTimeOverlap;
    });
};
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
    font-weight: 600;
    font-size: 0.875rem;
    color: #495057;
}

[data-bs-theme='dark'] .calendar-day-header {
    color: #e9ecef;
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
