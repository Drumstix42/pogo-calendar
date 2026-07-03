import {
    getEventSpriteEffect,
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
import type { EventWithExtraData, PokemonImageData, PokemonImageOptions, SpriteEffect } from './eventPokemonTypes';
import { type EventTypeKey, type PogoEvent } from './eventTypes';

// Re-exported for backward-compatible import paths (canonical homes: eventPokemonNames.ts /
// eventPokemonTypes.ts / eventPokemonResolvers.ts).
export { parsePokemonNameAndSuffix } from './eventPokemonNames';
export { getEventSpriteEffect } from './eventPokemonResolvers';
export { SPRITE_EFFECTS } from './eventPokemonTypes';
export type { PokemonImageData, PokemonImageOptions, SpriteEffect } from './eventPokemonTypes';

function hasExtraData(event: PogoEvent): event is EventWithExtraData {
    return event.extraData != null;
}

// Fill in the event-level effect on any image a resolver didn't already stamp per-sprite.
function applyEventEffect(images: PokemonImageData[], effect: SpriteEffect | undefined): PokemonImageData[] {
    if (!effect) return images;
    return images.map(image => (image.effect ? image : { ...image, effect }));
}

type ImageResolver = (event: EventWithExtraData, options?: PokemonImageOptions) => PokemonImageData[] | null;

// eventType → resolver. Several types share a resolver (major events + `event` use raid-schedule boss
// data). Spotlight sub-events are handled separately below, since they can carry any parent eventType.
const IMAGE_RESOLVERS: Partial<Record<EventTypeKey, ImageResolver>> = {
    'pokemon-go-fest': resolveBossImages,
    'pokemon-go-tour': resolveBossImages,
    'wild-area': resolveBossImages,
    'raid-battles': resolveRaidBattleImages,
    'raid-weekend': resolveRaidBattleImages,
    'raid-hour': resolveRaidHourImages,
    event: resolveBossImages,
    'raid-day': resolveRaidDayImages,
    'max-mondays': resolveMaxMondayImages,
    'pokemon-spotlight-hour': resolveSpotlightImages,
    'community-day': resolveCommunityDayImages,
    'max-battles': resolveMaxBattleImages,
    'pokestop-showcase': resolvePokestopShowcaseImages,
};

// Dispatches to per-event-type resolvers in priority order. A resolver returns an image array
// (the result, possibly empty) or `null` to fall through to the next matching branch.
export function getEventPokemonImages(event: PogoEvent, options?: PokemonImageOptions): PokemonImageData[] {
    if (!hasExtraData(event)) return [];

    const effect = getEventSpriteEffect(event);
    let result = IMAGE_RESOLVERS[event.eventType]?.(event, options) ?? null;

    // Spotlight sub-events (any parent eventType) fall back to the spotlight resolver when their
    // primary resolver produced nothing.
    if (!result && event.extraData.isSpotlightSubEvent) {
        result = resolveSpotlightImages(event, options);
    }

    return result ? applyEventEffect(result, effect) : [];
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
