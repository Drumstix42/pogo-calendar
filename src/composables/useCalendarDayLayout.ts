import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useDisplayTime } from '@/composables/useDisplayTime';
import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventsStore } from '@/stores/events';
import { parseEventDate } from '@/utils/eventDate';
import { isMajorCalendarEventType } from '@/utils/eventMajor';
import { type PogoEvent } from '@/utils/eventTypes';

export interface EventSlot {
    event: PogoEvent;
    slotIndex: number;
    startDay: Dayjs;
    endDay: Dayjs;
    shouldRenderOnDay: (day: Dayjs) => boolean;
    /** Pinned above the grid as an all-month event, so drawn only in the weeks it starts or ends */
    isPinned?: boolean;
}

// 'start-stub-adjacent' = a start stub in the week right before the current one (see getWeekBarDisplay)
export type WeekBarDisplay = 'start-stub' | 'start-stub-adjacent' | 'end-stub' | 'hidden';

const MULTI_DAY_EVENT_BAR_MARGIN = 1; // px margin between bars
const MULTI_DAY_EVENT_BAR_ICON_PADDING = 6; // px around the icon (bar's inner start-cap padding + room)

// Layout math for the multi-day event bars rendered in a single CalendarDay cell:
// week-relative slot packing and per-event left/width/top positioning across week boundaries.
export function useCalendarDayLayout(getDayInstance: () => Dayjs, getEventSlots: () => EventSlot[]) {
    const eventsStore = useEventsStore();
    const calendarSettings = useCalendarSettingsStore();
    const { displayToday } = useDisplayTime();

    const multiDayEventBarHeight = computed(() => calendarSettings.eventBarHeight);
    const multiDayEventIconHeight = computed(() => multiDayEventBarHeight.value - 2);

    // calculate week boundaries based on configured first day
    function getWeekBoundaries(referenceDay: Dayjs) {
        const firstDayIndex = calendarSettings.firstDayIndex;

        // Find the start of the week for this day
        let weekStart = referenceDay.clone();
        while (weekStart.day() !== firstDayIndex) {
            weekStart = weekStart.subtract(1, 'day');
        }

        const weekEnd = weekStart.add(6, 'day');

        return { weekStart, weekEnd };
    }

    // A pinned all-month event only keeps a bar (and a row) in the neighbor-month week it starts or ends in
    function isPinnedAwayFromWeek(slot: EventSlot, weekStart: Dayjs, weekEnd: Dayjs) {
        if (!slot.isPinned) return false;

        const startsThisWeek = !slot.startDay.isBefore(weekStart, 'day') && !slot.startDay.isAfter(weekEnd, 'day');
        const endsThisWeek = !slot.endDay.isBefore(weekStart, 'day') && !slot.endDay.isAfter(weekEnd, 'day');
        return !startsThisWeek && !endsThisWeek;
    }

    // Long-running events repeat a full-width bar through every week they span, which clutters weeks
    // already past. There, the start and end weeks collapse to title-sized stubs (torn edge toward the
    // rest of the event) and the weeks between are hidden, all restored while the event is hovered or
    // highlighted. Bars keep their full size and row either way, so nothing shifts on reveal.
    // The tear marks a gap, so a start stub right before the current week (whose full bar is visible)
    // may drop it and flow straight into that week instead.
    // Pinned all-month events get the same stubs in their start/end week, past or not, since the rest
    // of the event lives in the header; the current week shows its full bar instead.
    function getWeekBarDisplay(event: PogoEvent): WeekBarDisplay | null {
        const { weekStart, weekEnd } = getWeekBoundaries(getDayInstance());

        const metadata = eventsStore.eventMetadata[event.eventID];
        const eventStartDay = (metadata?.barStartDate ?? parseEventDate(event.start, calendarSettings.manualTimeOffsetHours)).startOf('day');
        const eventEndDay = (metadata?.endDate ?? parseEventDate(event.end, calendarSettings.manualTimeOffsetHours)).startOf('day');
        const startsThisWeek = !eventStartDay.isBefore(weekStart, 'day');
        const endsThisWeek = !eventEndDay.isAfter(weekEnd, 'day');

        if (getEventSlotData(event)?.isPinned) {
            const isCurrentWeek = !displayToday.value.isBefore(weekStart, 'day') && !displayToday.value.isAfter(weekEnd, 'day');
            if (isCurrentWeek) return null;
            return startsThisWeek ? 'start-stub' : 'end-stub';
        }

        if (!calendarSettings.condensePastEventBars) return null;
        if (!weekEnd.isBefore(displayToday.value, 'day')) return null;

        if (startsThisWeek && endsThisWeek) return null;
        if (startsThisWeek) {
            if (weekEnd.add(7, 'day').isBefore(displayToday.value, 'day')) return 'start-stub';
            // Starting on the week's last day, the bar is at most one cell, so a stub would save nothing
            if (eventStartDay.isSame(weekEnd, 'day')) return null;
            return 'start-stub-adjacent';
        }
        if (endsThisWeek) return 'end-stub';
        return 'hidden';
    }

    // Compact slot assignments for this specific week to remove gaps
    const weekCompactSlots = computed(() => {
        // Calculate week start properly based on configured first day
        const { weekStart, weekEnd } = getWeekBoundaries(getDayInstance());

        // Find all events that actually render on at least one day in this week
        const eventsRenderingInThisWeek = getEventSlots().filter(slot => {
            if (isMajorCalendarEventType(slot.event.eventType) || isPinnedAwayFromWeek(slot, weekStart, weekEnd)) {
                return false;
            }

            // Check if this slot renders on any day of this week
            for (let day = weekStart.clone(); day.isSameOrBefore(weekEnd); day = day.add(1, 'day')) {
                if (slot.shouldRenderOnDay(day)) {
                    return true;
                }
            }
            return false;
        });

        // Group events by their original slot index to maintain slot sharing
        const eventsBySlotIndex = new Map<number, EventSlot[]>();
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

    const multiDayEvents = computed(() => {
        const { weekStart, weekEnd } = getWeekBoundaries(getDayInstance());
        const eventsOnThisDay = getEventSlots().filter(slot => {
            return (
                slot.shouldRenderOnDay(getDayInstance()) &&
                !isMajorCalendarEventType(slot.event.eventType) &&
                !isPinnedAwayFromWeek(slot, weekStart, weekEnd)
            );
        });

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

    const multiDayEventsHeight = computed(() => {
        // Get the maximum compact slot index used in this week
        const compactSlots = Array.from(weekCompactSlots.value.values());
        if (compactSlots.length === 0) return 0;

        const maxCompactIndex = Math.max(...compactSlots.map(slot => slot.compactSlotIndex));
        // +1 because index is 0-based
        return (maxCompactIndex + 1) * (multiDayEventBarHeight.value + MULTI_DAY_EVENT_BAR_MARGIN);
    });

    function getEventSlotData(event: PogoEvent) {
        return getEventSlots().find(slot => slot.event.eventID === event.eventID);
    }

    function getEventSlotTop(event: PogoEvent) {
        const compactSlot = weekCompactSlots.value.get(event.eventID);
        if (!compactSlot) return 0;

        // Uses height + margin to calculate the top position
        return compactSlot.compactSlotIndex * (multiDayEventBarHeight.value + MULTI_DAY_EVENT_BAR_MARGIN);
    }

    function getMultiDayEventBarClass(event: PogoEvent, currentDay: Dayjs) {
        const slotData = getEventSlotData(event);
        if (!slotData || !slotData.shouldRenderOnDay(currentDay)) return '';

        const today = currentDay.startOf('day');
        const { weekEnd } = getWeekBoundaries(getDayInstance());
        const weekEndDay = weekEnd.endOf('day');

        // Use the actual event's dates, not the composite slot's extended dates. The real start (not
        // barStartDate) gives an overnight event's end-day bar a square left edge, as a continuation.
        const metadata = eventsStore.eventMetadata[event.eventID];
        const eventStartDay = (metadata?.startDate ?? parseEventDate(event.start, calendarSettings.manualTimeOffsetHours)).startOf('day');
        const eventEndDay = (metadata?.endDate ?? parseEventDate(event.end, calendarSettings.manualTimeOffsetHours)).startOf('day');

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
    }

    function getEventPosition(event: PogoEvent, currentDay: Dayjs) {
        const slotData = getEventSlotData(event);
        if (!slotData || !slotData.shouldRenderOnDay(currentDay)) {
            return { left: '0%', width: '100%' };
        }

        const today = currentDay.startOf('day');
        const metadata = eventsStore.eventMetadata[event.eventID];
        const eventStart = metadata?.barStartDate ?? parseEventDate(event.start, calendarSettings.manualTimeOffsetHours);
        const eventEnd = metadata?.endDate ?? parseEventDate(event.end, calendarSettings.manualTimeOffsetHours);

        // This function only handles multi-day events that render as bars
        const eventStartDay = eventStart.startOf('day');
        const { weekEnd } = getWeekBoundaries(getDayInstance());
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

        // Calculate end position based on whether event ends within this week
        if (eventEndDay.isSame(actualEndDay, 'day') && eventEndDay.isSameOrBefore(weekEndDay, 'day')) {
            // Event ends on the final day within this week - calculate precise position
            // Use calendar day difference to avoid DST issues when crossing time zone transitions
            const daysDiff = eventEndDay.diff(today, 'day');
            const hoursIntoFinalDay = eventEnd.hour() + eventEnd.minute() / 60;
            const totalDays = daysDiff + hoursIntoFinalDay / 24;
            endPositionPercentage = totalDays * 100;
        } else {
            // Event continues beyond the week or ends at day boundary
            endPositionPercentage = spanDays * 100;
        }

        const widthPercentage = endPositionPercentage - leftPercentage;

        // Check if this event is followed by another event in the same slot for gap adjustment
        const hasFollowingEvent = getEventSlots().some(slot => {
            if (slot.slotIndex !== slotData.slotIndex || slot.event.eventID === event.eventID || slot.event.eventType !== event.eventType) {
                return false;
            }

            const otherMetadata = eventsStore.eventMetadata[slot.event.eventID];
            const otherStart = otherMetadata?.barStartDate ?? parseEventDate(slot.event.start, calendarSettings.manualTimeOffsetHours);

            // Check if other event starts at or shortly after this one ends (within 2 hours)
            // AND starts within this same week
            return otherStart.isSameOrAfter(eventEnd) && otherStart.diff(eventEnd, 'hour') <= 2 && otherStart.isSameOrBefore(weekEndDay);
        });

        const gapAdjustment = hasFollowingEvent ? ' - 1px' : '';

        // Never narrower than the leading icon; it grows right only, so the start time stays accurate
        const minWidthPx = multiDayEventIconHeight.value + MULTI_DAY_EVENT_BAR_ICON_PADDING;

        return {
            left: `${leftPercentage}%`,
            width: `max(calc(${Math.max(widthPercentage, 5)}% + 0px${gapAdjustment}), ${minWidthPx}px)`,
        };
    }

    return {
        multiDayEventBarHeight,
        multiDayEventIconHeight,
        weekCompactSlots,
        multiDayEvents,
        multiDayEventsHeight,
        getEventSlotData,
        getEventSlotTop,
        getMultiDayEventBarClass,
        getEventPosition,
        getWeekBarDisplay,
    };
}
