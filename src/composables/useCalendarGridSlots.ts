import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { type EventSlot } from '@/composables/useCalendarDayLayout';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { type CalendarDayCell } from '@/utils/calendarGrid';
import { parseEventDate } from '@/utils/eventDate';
import { getRaidSubType, getRaidSubTypePriority } from '@/utils/eventSubtype';
import { type PogoEvent, getEventTypeInfo } from '@/utils/eventTypes';

// Multi-day event slot packing for the calendar grid: filters events overlapping the
// visible month window, then assigns each a slot index so compatible same-type bars stack
// while time-overlapping or incompatible bars get separate rows.
export function useCalendarGridSlots(getCalendarDays: () => CalendarDayCell[]) {
    const calendarSettings = useCalendarSettingsStore();
    const eventFilter = useEventFilterStore();
    const eventsStore = useEventsStore();

    // Get all multi-day events for the calendar view
    const multiDayEventsForCalendar = computed(() => {
        const calendarDays = getCalendarDays();
        return eventsStore.processedEvents.filter(event => {
            // Filter by enabled event types, individual event IDs, and multi-day events only
            const metadata = eventsStore.eventMetadata[event.eventID];
            const isSingleDay = metadata?.isSingleDayEvent ?? false;

            if (!eventFilter.isEventVisible(event.eventType, event.eventID) || isSingleDay) {
                return false;
            }

            const eventStart =
                metadata?.startDate.startOf('day') ?? parseEventDate(event.start, calendarSettings.manualTimeOffsetHours).startOf('day');
            const eventEnd = metadata?.endDate.startOf('day') ?? parseEventDate(event.end, calendarSettings.manualTimeOffsetHours).startOf('day');
            const calendarStart = calendarDays[0]?.dayInstance.startOf('day');
            const calendarEnd = calendarDays[calendarDays.length - 1]?.dayInstance.startOf('day');

            // Include event if it overlaps with the calendar view
            return (
                eventEnd.isAfter(calendarStart) ||
                (eventEnd.isSame(calendarStart) && eventStart.isBefore(calendarEnd)) ||
                eventStart.isSame(calendarEnd)
            );
        });
    });

    function shouldShareSlot(eventA: PogoEvent, eventB: PogoEvent): boolean {
        // Check if either event is a grouped event
        const aIsGrouped = eventA._isGrouped;
        const bIsGrouped = eventB._isGrouped;

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
    }

    function findAvailableSlotForEventType(event: PogoEvent, existingSlots: EventSlot[]): number {
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
    }

    function findNextAvailableSlot(event: PogoEvent, existingSlots: EventSlot[]): number {
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
    }

    function hasConflictInSlot(event: PogoEvent, slotIndex: number, existingSlots: EventSlot[]): boolean {
        const eventMetadata = eventsStore.eventMetadata[event.eventID];
        const eventStart = eventMetadata?.startDate ?? parseEventDate(event.start, calendarSettings.manualTimeOffsetHours);
        const eventEnd = eventMetadata?.endDate ?? parseEventDate(event.end, calendarSettings.manualTimeOffsetHours);
        const slotsInThisIndex = existingSlots.filter(slot => slot.slotIndex === slotIndex);

        return slotsInThisIndex.some(slot => {
            const slotMetadata = eventsStore.eventMetadata[slot.event.eventID];
            const slotStart = slotMetadata?.startDate ?? parseEventDate(slot.event.start, calendarSettings.manualTimeOffsetHours);
            const slotEnd = slotMetadata?.endDate ?? parseEventDate(slot.event.end, calendarSettings.manualTimeOffsetHours);

            // Check for actual time overlap
            const hasTimeOverlap = eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);

            // Compatible events (same type and sub-type) can share slots if they don't overlap in time
            if (shouldShareSlot(event, slot.event) && !hasTimeOverlap) {
                return false; // No conflict - compatible types, no time overlap
            }

            // Incompatible types or time overlap = conflict
            return hasTimeOverlap;
        });
    }

    // Assign slots to multi-day events
    const eventSlots = computed((): EventSlot[] => {
        const events = multiDayEventsForCalendar.value;
        if (events.length === 0) return [];

        // Events are already processed (grouping already applied)
        // Sort by event type priority (from eventTypes.ts), then grouped vs individual, then by start date
        const sortedEvents = [...events].sort((a, b) => {
            // 1. Sort by event type priority (higher priority = higher in layout)
            const aPriority = getEventTypeInfo(a.eventType).priority;
            const bPriority = getEventTypeInfo(b.eventType).priority;
            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }

            // 2. Within same priority, grouped events come before individual events
            const aIsGrouped = a._isGrouped;
            const bIsGrouped = b._isGrouped;
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
            const aStart = eventsStore.eventMetadata[a.eventID]?.startDate ?? parseEventDate(a.start, calendarSettings.manualTimeOffsetHours);
            const bStart = eventsStore.eventMetadata[b.eventID]?.startDate ?? parseEventDate(b.start, calendarSettings.manualTimeOffsetHours);
            if (!aStart.isSame(bStart)) {
                return aStart.isBefore(bStart) ? -1 : 1;
            }

            return 0;
        });

        const slots: EventSlot[] = [];

        for (const event of sortedEvents) {
            const metadata = eventsStore.eventMetadata[event.eventID];
            const eventStart = (metadata?.startDate ?? parseEventDate(event.start, calendarSettings.manualTimeOffsetHours)).startOf('day');
            const eventEnd = (metadata?.endDate ?? parseEventDate(event.end, calendarSettings.manualTimeOffsetHours)).startOf('day');

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
                shouldRenderOnDay: (day: Dayjs) => {
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

    return { eventSlots };
}
