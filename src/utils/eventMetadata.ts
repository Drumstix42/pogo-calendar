import type { Dayjs } from 'dayjs';

import { formatEventTime, parseEventDate } from './eventDate';
import { formatEventName } from './eventName';
import { type EventMetadata, type PogoEvent, getEventTypeInfo } from './eventTypes';
import { buildTierGroupsFromBosses } from './raidTierGroups';
import { getSpotlightBonusInfo, getSpotlightBonusTypeIcon } from './spotlightBonus';

// A bar this short is mostly too narrow to read, so these show as a single-day box instead
const OVERNIGHT_EVENT_MAX_HOURS = 12;

interface BuildEventMetadataContext {
    now: Dayjs;
    manualOffsetHours: number;
    color: string;
}

/**
 * Derives the cached per-event metadata for a single event. Pure — the reactive color
 * override and the offset-adjusted "now" are resolved by the events store and passed in.
 * Grouping fields (isGrouped/groupedEvents/groupCount) are added by the store's second pass.
 */
export function buildEventMetadata(event: PogoEvent, { now, manualOffsetHours, color }: BuildEventMetadataContext): EventMetadata {
    const startDate = parseEventDate(event.start, manualOffsetHours);
    const endDate = parseEventDate(event.end, manualOffsetHours);
    const isMultiDay = !startDate.startOf('day').isSame(endDate.startOf('day'));
    // Ending exactly at midnight would leave an empty end-day bar
    const isOvernight = isMultiDay && endDate.isAfter(endDate.startOf('day')) && endDate.diff(startDate, 'hour', true) < OVERNIGHT_EVENT_MAX_HOURS;
    const spotlightBonus = getSpotlightBonusInfo(event);

    return {
        displayName: formatEventName(event.name),
        startDate,
        endDate,
        barStartDate: isOvernight ? endDate.startOf('day') : startDate,
        typeInfo: getEventTypeInfo(event.eventType),
        color,
        formattedStartTime: formatEventTime(event.start, manualOffsetHours),
        isMultiDayEvent: isMultiDay,
        isSingleDayEvent: !isMultiDay,
        isOvernightEvent: isOvernight,
        isPastEvent: endDate.isBefore(now),
        isFutureEvent: startDate.isAfter(now),
        spotlightBonus,
        spotlightBonusIconUrl: spotlightBonus ? getSpotlightBonusTypeIcon(spotlightBonus.bonusType) : null,
        raidBossTierGroups: buildTierGroupsFromBosses(event.extraData?.raidbattles?.bosses),
    };
}
