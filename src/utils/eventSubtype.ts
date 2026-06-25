import type { EventTypeKey, PogoEvent } from './eventTypes';

// Event types that support sub-typing/categorization
export const EVENTS_WITH_SUBTYPE = ['raid-battles', 'raid-weekend', 'raid-day'] as const;
export type EventWithSubtype = (typeof EVENTS_WITH_SUBTYPE)[number];

/** Subtypes are a custom categorization for specific event types */
export function isEventWithSubtype(eventType: EventTypeKey) {
    return EVENTS_WITH_SUBTYPE.includes(eventType as EventWithSubtype);
}

export function getRaidSubType(event: PogoEvent): string {
    // Check for raid hour sub-events (pseudo events generated from parent events)
    const isRaidHourSubEvent = event.extraData?.isRaidHourSubEvent === true;

    if (!isEventWithSubtype(event.eventType) && !isRaidHourSubEvent) {
        return ''; // Not applicable for non-raid events
    }

    const eventName = event.name.toLowerCase();

    if (eventName.includes('shadow')) {
        return 'shadow-raids';
    } else if (eventName.includes('super mega')) {
        return 'super-mega-raids';
    } else if (eventName.includes('primal')) {
        return 'primal-raids';
    } else if (eventName.includes('mega')) {
        return 'mega-raids';
    } else if (eventName.includes('raid battles') || eventName.includes('raid weekend')) {
        return 'raid-battles';
    }
    return ''; // Default case, no specific sub-type
}

/** Whether the event has any bonus content for EventExtras to render. */
export function hasEventExtras(event: PogoEvent): boolean {
    const extra = event.extraData;
    if (!extra) return false;

    const hasSpotlightBonus = event.eventType === 'pokemon-spotlight-hour' && Boolean(extra.spotlight?.bonus);
    const hasRaidHourBonuses = Boolean(extra.isRaidHourSubEvent && extra.raidHourBonuses);
    const hasCommunityDayBonuses = event.eventType === 'community-day' && Boolean(extra.communityday?.bonuses);
    const hasSeason = event.eventType === 'season' && Boolean(extra.season);
    const hasEventBonuses = Boolean(extra.bonuses?.some(group => group.items?.length));

    return hasSpotlightBonus || hasRaidHourBonuses || hasCommunityDayBonuses || hasSeason || hasEventBonuses;
}

/** Higher number = higher priority for raid sub-type sorting */
export function getRaidSubTypePriority(event: PogoEvent): number {
    if (!isEventWithSubtype(event.eventType)) {
        return 0; // Not applicable for non-raid events
    }

    const subType = getRaidSubType(event);
    switch (subType) {
        case 'super-mega-raids':
            return 4;
        case 'shadow-raids':
            return 3;
        case 'raid-battles':
            return 2;
        case 'mega-raids':
        case 'primal-raids':
            return 1;
        default:
            return 0;
    }
}
