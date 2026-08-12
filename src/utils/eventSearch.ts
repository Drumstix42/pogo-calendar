import { decodeHtmlEntities } from './eventName';
import { type PogoEvent, type PokemonBoss, type SeasonData, getEventTypeInfo } from './eventTypes';

function namesOf(bosses?: PokemonBoss[] | PokemonBoss | null): string[] {
    if (!bosses) return [];
    return (Array.isArray(bosses) ? bosses : [bosses]).map(boss => boss.name);
}

// communityday.bonuses is typed `any[]` upstream but is BonusItem-shaped at runtime (see CommunityDayBonuses.vue).
function bonusTexts(items?: Array<{ text?: string }> | null): string[] {
    if (!items) return [];
    return items.map(item => item?.text).filter((text): text is string => Boolean(text));
}

function seasonBonusTexts(season: SeasonData): string[] {
    const terms: string[] = [];
    season.dailyBonuses.forEach(daily => {
        daily.bonuses.forEach(group => {
            if (group.title) terms.push(group.title);
            terms.push(...group.items);
        });
    });
    season.seasonBonuses.forEach(bonus => terms.push(bonus.text));
    return terms;
}

// Pulls every Pokemon name and bonus/text value relevant to a card so search can match without caring how deep it lives in extraData.
function getEventSearchTerms(event: PogoEvent): string[] {
    const terms = [event.name, event.heading, getEventTypeInfo(event.eventType).name];

    const extraData = event.extraData;
    if (extraData) {
        terms.push(...namesOf(extraData.raidbattles?.bosses));
        terms.push(...namesOf(extraData.raidbattles?.shinies));

        extraData.raidSchedule?.forEach(entry => {
            terms.push(...namesOf(entry.bosses));
            entry.raidHours.forEach(hour => terms.push(...namesOf(hour.bosses)));
        });

        extraData.spotlightSchedule?.forEach(entry => terms.push(entry.pokemon.name));

        if (extraData.spotlight) {
            terms.push(extraData.spotlight.name);
            terms.push(...namesOf(extraData.spotlight.list));
        }

        if (extraData.communityday) {
            terms.push(...namesOf(extraData.communityday.spawns));
            terms.push(...namesOf(extraData.communityday.featured));
            terms.push(...namesOf(extraData.communityday.shinies));
            terms.push(...bonusTexts(extraData.communityday.bonuses));
            terms.push(...(extraData.communityday.bonusDisclaimers ?? []));
        }

        if (extraData.maxbattles) {
            terms.push(...namesOf(extraData.maxbattles.featured));
        }

        extraData.bonuses?.forEach(group => terms.push(...bonusTexts(group.items)));
        terms.push(...(extraData.raidHourBonuses ?? []));

        if (extraData.season) {
            terms.push(...seasonBonusTexts(extraData.season));
        }
    }

    return terms.filter((term): term is string => Boolean(term));
}

// Some fields (disclaimers especially) carry literal HTML — match against what's actually
// displayed, not the raw markup, so a tag sitting mid-word can't split a word apart.
function cleanForSearch(text: string): string {
    return decodeHtmlEntities(text.replace(/<[^>]*>/g, ' '));
}

/** `query` must already be trimmed/lowercased by the caller (see useTimelineSearch). */
export function eventMatchesSearch(event: PogoEvent, query: string): boolean {
    const words = query.split(/\s+/).filter(Boolean);
    if (!words.length) return true;

    // Word order doesn't matter — "stardust catch" and "catch stardust" match the same events.
    const searchText = cleanForSearch(getEventSearchTerms(event).join(' ')).toLowerCase();
    return words.every(word => searchText.includes(word));
}
