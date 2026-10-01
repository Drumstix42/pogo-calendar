import { type PogoEvent, hasEventType } from './eventTypes';

export const MAJOR_CALENDAR_EVENT_TYPES = ['pokemon-go-fest', 'pokemon-go-tour', 'wild-area'] as const;
export type MajorCalendarEventType = (typeof MAJOR_CALENDAR_EVENT_TYPES)[number];
export type MajorCalendarEventVariant = 'global' | 'location-specific';

// Secondary type tags that mark an event as tied to a physical place.
const LOCATION_EVENT_TYPE_TAGS = ['location-specific', 'in-person-event'];

export function isMajorCalendarEventType(eventType: string): eventType is MajorCalendarEventType {
    return MAJOR_CALENDAR_EVENT_TYPES.includes(eventType as MajorCalendarEventType);
}

// Only a positive signal: LeekDuck doesn't tag every city event (e.g. 2025 GO Fest cities), so a
// missing tag doesn't mean the event is global.
export function isLocationSpecificEvent(event: PogoEvent) {
    return LOCATION_EVENT_TYPE_TAGS.some(tag => hasEventType(event, tag));
}

function getMajorEventSearchText(event: PogoEvent) {
    return [event.eventID ?? '', event.name ?? '', event.link ?? ''].join(' ').toLowerCase();
}

export function getMajorCalendarEventVariant(event: PogoEvent): MajorCalendarEventVariant {
    if (!isMajorCalendarEventType(event.eventType) || isLocationSpecificEvent(event)) {
        return 'location-specific';
    }

    const text = getMajorEventSearchText(event);

    // GO Fest "Finale" events (e.g. "Max Finale", "Mega Finale") are the free global
    // wrap-up event, not one of the ticketed city-specific events earlier in the year.
    if (text.includes('global') || text.includes('finale')) {
        return 'global';
    }

    return 'location-specific';
}

// Corner watermark for detailed views: major events always get one (globe or pin); other events
// only get the pin, and only when tagged location-specific.
function getEventWatermarkVariant(event: PogoEvent): MajorCalendarEventVariant | null {
    if (isMajorCalendarEventType(event.eventType)) {
        return getMajorCalendarEventVariant(event);
    }

    return isLocationSpecificEvent(event) ? 'location-specific' : null;
}

/** Classes for the shared watermark styles in src/styles/_event-watermark.scss. */
export function getEventWatermarkClass(event: PogoEvent): string[] | undefined {
    const variant = getEventWatermarkVariant(event);
    if (!variant) {
        return undefined;
    }

    return ['event-watermark', variant === 'global' ? 'event-watermark--global' : 'event-watermark--location'];
}

export function getMajorCalendarEventVariantLabel(event: PogoEvent): string {
    const variant = getMajorCalendarEventVariant(event);

    if (variant === 'global') {
        return 'Global';
    }

    return 'Location-specific';
}
