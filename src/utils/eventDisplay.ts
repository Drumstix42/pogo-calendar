import { formatEventName } from '@/utils/eventName';
import { type PogoEvent, getGroupedEventsCount } from '@/utils/eventTypes';

// Display name for a calendar event bar/block.
// Grouped events carry a custom `_displayName`; individual events use their own name.
export function getEventDisplayName(event: PogoEvent): string {
    if ((event as any)._displayName) {
        return formatEventName((event as any)._displayName);
    }

    return formatEventName(event.name);
}

export function getEventCount(event: PogoEvent): number {
    return getGroupedEventsCount(event);
}

export function shouldShowBadge(event: PogoEvent): boolean {
    return getEventCount(event) > 1;
}

export function shouldShowMultiDaySprites(event: PogoEvent): boolean {
    // Raid schedule bosses are day/time-specific and not representative for the full multi-day bar.
    if (event.extraData?.raidSchedule && event.extraData.raidSchedule.length > 0) {
        return false;
    }

    return true;
}
