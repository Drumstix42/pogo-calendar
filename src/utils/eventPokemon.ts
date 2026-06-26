import {
    resolveBossImages,
    resolveCommunityDayImages,
    resolveMaxBattleImages,
    resolveMaxMondayImages,
    resolvePokestopShowcaseImages,
    resolveRaidBattleImages,
    resolveRaidDayImages,
    resolveRaidHourImages,
    resolveSpotlightImages,
} from './eventPokemonResolvers';
import type { EventWithExtraData, PokemonImageData, PokemonImageOptions } from './eventPokemonTypes';
import { type PogoEvent } from './eventTypes';

// Re-exported for backward-compatible import paths (canonical homes: eventPokemonNames.ts /
// eventPokemonTypes.ts).
export { parsePokemonNameAndSuffix } from './eventPokemonNames';
export type { PokemonImageData, PokemonImageOptions } from './eventPokemonTypes';

function hasExtraData(event: PogoEvent): event is EventWithExtraData {
    return event.extraData != null;
}

// Dispatches to per-event-type resolvers in priority order. A resolver returns an image array
// (the result, possibly empty) or `null` to fall through to the next matching branch.
export function getEventPokemonImages(event: PogoEvent, options?: PokemonImageOptions): PokemonImageData[] {
    if (!hasExtraData(event)) return [];

    const eventType = event.eventType;
    let result: PokemonImageData[] | null;

    // Handle major events with raid schedule boss data pre-mapped into raidbattles.
    if (eventType === 'pokemon-go-fest' || eventType === 'pokemon-go-tour' || eventType === 'wild-area') {
        result = resolveBossImages(event, options);
        if (result) return result;
    }

    if (eventType === 'raid-battles' || eventType === 'raid-weekend') {
        result = resolveRaidBattleImages(event, options);
        if (result) return result;
    }

    if (eventType === 'raid-hour') {
        result = resolveRaidHourImages(event, options);
        if (result) return result;
    }

    if (eventType === 'event') {
        result = resolveBossImages(event, options);
        if (result) return result;
    }

    if (eventType === 'raid-day') {
        result = resolveRaidDayImages(event, options);
        if (result) return result;
    }

    if (eventType === 'max-mondays') {
        result = resolveMaxMondayImages(event, options);
        if (result) return result;
    }

    if (eventType === 'pokemon-spotlight-hour' || event.extraData.isSpotlightSubEvent) {
        result = resolveSpotlightImages(event, options);
        if (result) return result;
    }

    if (eventType === 'community-day') {
        result = resolveCommunityDayImages(event, options);
        if (result) return result;
    }

    if (eventType === 'max-battles') {
        result = resolveMaxBattleImages(event, options);
        if (result) return result;
    }

    if (eventType === 'pokestop-showcase') {
        result = resolvePokestopShowcaseImages(event, options);
        if (result) return result;
    }

    return [];
}

export function hasEventPokemonImage(event: PogoEvent, options?: PokemonImageOptions): boolean {
    return getEventPokemonImages(event, options).length > 0;
}

export function getMultiDayPokemonImages(event: PogoEvent, options?: PokemonImageOptions): PokemonImageData[] {
    // Only show images for raid-battles events for now
    if (event.eventType === 'raid-battles' || event.eventType === 'raid-weekend') {
        return getEventPokemonImages(event, options);
    }
    return [];
}
