import { type EventBonusGroup, type PogoEvent } from './eventTypes';
import { getSpotlightBonusInfo, getSpotlightBonusText, getSpotlightBonusTypeIcon } from './spotlightBonus';

/**
 * The bonus groups an event's detail views show. Spotlight Hour builds its group from `spotlight.bonus`
 * so it keeps our local bonus-type icon (the feed's item has no image), and Season is skipped because
 * SeasonBonuses already renders the same items from `extraData.season`.
 */
export function getEventBonusGroups(event: PogoEvent): EventBonusGroup[] {
    if (event.eventType === 'pokemon-spotlight-hour') {
        const text = getSpotlightBonusText(event);
        if (!text) return [];

        const info = getSpotlightBonusInfo(event);
        const image = info ? getSpotlightBonusTypeIcon(info.bonusType) : '';
        return [{ title: null, description: null, startTime: null, endTime: null, items: [{ text, image }], notes: [] }];
    }

    if (event.eventType === 'season') return [];

    return (event.extraData?.bonuses ?? []).filter(group => group.items?.length);
}

/** Whether the event has any bonuses to show: its bonus groups, or a Raid Hour sub-event's day notes. */
export function hasEventBonuses(event: PogoEvent): boolean {
    const extra = event.extraData;
    return getEventBonusGroups(event).length > 0 || Boolean(extra?.isRaidHourSubEvent && extra.raidHourBonuses?.length);
}
