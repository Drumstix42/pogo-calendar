import { type DailyMajorDisplayEvent } from '@/composables/useCalendarDaySingleEvents';
import { useEventsStore } from '@/stores/events';
import { getEventDisplayName } from '@/utils/eventDisplay';
import { type MajorCalendarEventVariant, getMajorCalendarEventVariant } from '@/utils/eventMajor';
import { formatEventName } from '@/utils/eventName';
import { type PogoEvent } from '@/utils/eventTypes';

// Per-event rendering helpers for single-day calendar entries. Resolves the per-day projections
// of major multi-day events (see useCalendarDaySingleEvents) back to their source event.
export function useDailyEventDisplay() {
    const eventsStore = useEventsStore();

    function getSourceEventID(event: PogoEvent): string {
        return ((event as Partial<DailyMajorDisplayEvent>)._sourceEventID ?? event.eventID) as string;
    }

    function isMajorDailyDisplayEvent(event: PogoEvent): event is DailyMajorDisplayEvent {
        return (event as Partial<DailyMajorDisplayEvent>)._isMajorDailyDisplay === true;
    }

    function getEventMetadataForDisplay(event: PogoEvent) {
        return eventsStore.eventMetadata[getSourceEventID(event)];
    }

    function getMajorDailyVariant(event: PogoEvent): MajorCalendarEventVariant {
        if (!isMajorDailyDisplayEvent(event)) {
            return 'location-specific';
        }

        return getMajorCalendarEventVariant({
            ...event,
            eventID: getSourceEventID(event),
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

        return eventsStore.getEventById(getSourceEventID(event)) ?? event;
    }

    return {
        getSourceEventID,
        isMajorDailyDisplayEvent,
        getEventMetadataForDisplay,
        getMajorDailyVariant,
        getEventDisplayNameForSingleDay,
        getEventForDetails,
    };
}
