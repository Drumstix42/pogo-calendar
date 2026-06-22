import { type DailyMajorDisplayEvent } from '@/composables/useCalendarDaySingleEvents';
import { useEventsStore } from '@/stores/events';
import { getEventDisplayName } from '@/utils/eventDisplay';
import { formatEventName } from '@/utils/eventName';
import { type MajorCalendarEventVariant, type PogoEvent, getMajorCalendarEventVariant } from '@/utils/eventTypes';

// Per-event rendering helpers for single-day calendar entries. Resolves the per-day projections
// of major multi-day events (see useCalendarDaySingleEvents) back to their source event.
export function useDailyEventDisplay() {
    const eventsStore = useEventsStore();

    function getCanonicalEventID(event: PogoEvent): string {
        return ((event as Partial<DailyMajorDisplayEvent>)._sourceEventID ?? event.eventID) as string;
    }

    function isMajorDailyDisplayEvent(event: PogoEvent): event is DailyMajorDisplayEvent {
        return (event as Partial<DailyMajorDisplayEvent>)._isMajorDailyDisplay === true;
    }

    function getEventMetadataForDisplay(event: PogoEvent) {
        return eventsStore.eventMetadata[getCanonicalEventID(event)];
    }

    function getMajorDailyVariant(event: PogoEvent): MajorCalendarEventVariant {
        if (!isMajorDailyDisplayEvent(event)) {
            return 'location-specific';
        }

        return getMajorCalendarEventVariant({
            ...event,
            eventID: getCanonicalEventID(event),
        });
    }

    function getEventDisplayNameForSingleDay(event: PogoEvent): string {
        if (isMajorDailyDisplayEvent(event)) {
            return formatEventName(event.name);
        }

        return getEventDisplayName(event);
    }

    function getEventForDetails(event: PogoEvent): PogoEvent {
        if (!isMajorDailyDisplayEvent(event)) {
            return event;
        }

        return eventsStore.getEventById(getCanonicalEventID(event)) ?? event;
    }

    return {
        getCanonicalEventID,
        isMajorDailyDisplayEvent,
        getEventMetadataForDisplay,
        getMajorDailyVariant,
        getEventDisplayNameForSingleDay,
        getEventForDetails,
    };
}
