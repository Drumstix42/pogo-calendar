import type { PogoEvent } from './eventTypes';

export const MAJOR_CALENDAR_EVENT_TYPES = ['pokemon-go-fest', 'pokemon-go-tour', 'wild-area'] as const;
export type MajorCalendarEventType = (typeof MAJOR_CALENDAR_EVENT_TYPES)[number];
export type MajorCalendarEventVariant = 'global' | 'location-specific';

export function isMajorCalendarEventType(eventType: string): eventType is MajorCalendarEventType {
    return MAJOR_CALENDAR_EVENT_TYPES.includes(eventType as MajorCalendarEventType);
}

function getMajorEventSearchText(event: PogoEvent) {
    return [event.eventID ?? '', event.name ?? '', event.link ?? ''].join(' ').toLowerCase();
}

export function getMajorCalendarEventVariant(event: PogoEvent): MajorCalendarEventVariant {
    if (!isMajorCalendarEventType(event.eventType)) {
        return 'location-specific';
    }

    const text = getMajorEventSearchText(event);

    if (text.includes('global')) {
        return 'global';
    }

    return 'location-specific';
}

export function getMajorCalendarEventVariantLabel(event: PogoEvent): string {
    const variant = getMajorCalendarEventVariant(event);

    if (variant === 'global') {
        return 'Global';
    }

    return 'Location-specific';
}
