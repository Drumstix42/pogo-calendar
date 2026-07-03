import type { Dayjs } from 'dayjs';

import { formatEventTime, parseEventDate } from './eventDate';
import { formatEventName } from './eventName';
import { type EventMetadata, type PogoEvent, getEventTypeInfo } from './eventTypes';
import { buildTierGroupsFromBosses } from './raidTierGroups';
import { getSpotlightBonusInfo, getSpotlightBonusTypeIcon } from './spotlightBonus';

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
    const spotlightBonus = getSpotlightBonusInfo(event);

    return {
        displayName: formatEventName(event.name),
        startDate,
        endDate,
        typeInfo: getEventTypeInfo(event.eventType),
        color,
        formattedStartTime: formatEventTime(event.start, manualOffsetHours),
        isMultiDayEvent: isMultiDay,
        isSingleDayEvent: !isMultiDay,
        isPastEvent: endDate.isBefore(now),
        isFutureEvent: startDate.isAfter(now),
        spotlightBonus,
        spotlightBonusIconUrl: spotlightBonus ? getSpotlightBonusTypeIcon(spotlightBonus.bonusType) : null,
        raidBossTierGroups: buildTierGroupsFromBosses(event.extraData?.raidbattles?.bosses),
    };
}
