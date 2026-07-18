import { type Dayjs } from 'dayjs';
import { computed } from 'vue';

import { useCalendarSettingsStore } from '@/stores/calendarSettings';
import { useEventFilterStore } from '@/stores/eventFilter';
import { useEventsStore } from '@/stores/events';
import { parseEventDate } from '@/utils/eventDate';
import { getEventsForDate } from '@/utils/eventGrouping';
import { isMajorCalendarEventType } from '@/utils/eventMajor';
import { getRaidScheduleSectionsForDate } from '@/utils/eventRaidHours';
import { sortEventsByPriority } from '@/utils/eventSort';
import { type PogoEvent } from '@/utils/eventTypes';

// A major multi-day event projected onto a single day so it renders in its own daily lane.
export type DailyMajorDisplayEvent = PogoEvent & {
    _isMajorDailyDisplay: true;
    _sourceEventID: string;
};

// Builds the single-day event list for one CalendarDay cell: the day's individual single-day
// events plus per-day projections of major multi-day events.
// Per-event rendering helpers for these entries live in useDailyEventDisplay.
export function useCalendarDaySingleEvents(getDayInstance: () => Dayjs) {
    const eventsStore = useEventsStore();
    const eventFilter = useEventFilterStore();
    const calendarSettings = useCalendarSettingsStore();

    // Get events for this specific day using preprocessed data from store
    const calendarEvents = computed(() => {
        // Use processed events from store (grouping already applied)
        const eventsForDate = getEventsForDate(eventsStore.processedEvents, getDayInstance(), calendarSettings.manualTimeOffsetHours);

        // Filter by enabled event types and individual event IDs
        const enabledEvents = eventsForDate.filter((event: PogoEvent) => eventFilter.isEventVisible(event.eventType, event.eventID));

        const singleDay = enabledEvents.filter((event: PogoEvent) => {
            // Major event types are always projected per-day via majorDailyDisplayEvents below,
            // even when the event itself only spans a single day (e.g. a single-day GO Fest raid
            // makeup event still carries a time-boxed raidSchedule that needs day-scoping).
            if (isMajorCalendarEventType(event.eventType)) {
                return false;
            }

            return eventsStore.eventMetadata[event.eventID]?.isSingleDayEvent ?? false;
        });

        return {
            singleDayEvents: sortEventsByPriority(singleDay),
            enabledEvents,
        };
    });

    const majorDailyDisplayEvents = computed<DailyMajorDisplayEvent[]>(() => {
        const targetDay = getDayInstance().startOf('day');

        return calendarEvents.value.enabledEvents
            .filter((event: PogoEvent) => {
                if (!isMajorCalendarEventType(event.eventType)) {
                    return false;
                }

                const metadata = eventsStore.eventMetadata[event.eventID];
                const startDay = (metadata?.startDate ?? parseEventDate(event.start, calendarSettings.manualTimeOffsetHours)).startOf('day');
                const endDay = (metadata?.endDate ?? parseEventDate(event.end, calendarSettings.manualTimeOffsetHours)).startOf('day');

                return targetDay.isSameOrAfter(startDay, 'day') && targetDay.isSameOrBefore(endDay, 'day');
            })
            .map(event => {
                const dateKey = targetDay.format('YYYY-MM-DD');

                // Only day-scope bosses when a raidSchedule exists to scope them by - without one,
                // leave extraData untouched so the event's own raidbattles.bosses still renders as-is.
                let nextExtraData = event.extraData;
                if (event.extraData?.raidSchedule) {
                    const scheduleSections = getRaidScheduleSectionsForDate(event, targetDay);
                    const allDayBosses = scheduleSections.filter(section => section.isAllDay).flatMap(section => section.bosses);
                    const dedupedAllDayBosses = Array.from(
                        new Map(allDayBosses.map(boss => [`${boss.name.toLowerCase()}|${(boss.raidType ?? '').toLowerCase()}`, boss])).values(),
                    );

                    nextExtraData = {
                        ...event.extraData,
                        raidbattles: {
                            ...(event.extraData?.raidbattles ?? {}),
                            bosses: dedupedAllDayBosses,
                        },
                    };
                }

                return {
                    ...event,
                    eventID: `${event.eventID}-daily-${dateKey}`,
                    extraData: nextExtraData,
                    _isMajorDailyDisplay: true,
                    _sourceEventID: event.eventID,
                };
            });
    });

    // Use individual single-day events without grouping.
    // Major daily display entries are appended to the end so they stand out in a separate lane.
    const singleDayEvents = computed<PogoEvent[]>(() => {
        return [...calendarEvents.value.singleDayEvents, ...majorDailyDisplayEvents.value];
    });

    return {
        singleDayEvents,
    };
}
