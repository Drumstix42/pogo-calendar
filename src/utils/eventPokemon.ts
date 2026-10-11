import {
    getEventSpriteEffect,
    resolveBossImages,
    resolveCommunityDayImages,
    resolveHatchDayImages,
    resolveMaxBattleImages,
    resolveMaxMondayImages,
    resolvePokestopShowcaseImages,
    resolveRaidBattleImages,
    resolveRaidDayImages,
    resolveRaidHourImages,
    resolveSpotlightImages,
} from './eventPokemonResolvers';
import { SPRITE_EFFECTS } from './eventPokemonTypes';
import type { EventWithExtraData, PokemonImageData, PokemonImageOptions, SpriteEffect } from './eventPokemonTypes';
import { combineSpriteEffects, getPokemonImagesFromBossList, getRecurringRaidScheduleBosses, splitSpriteEffectPrefix } from './eventSprite';
import { type EventTypeKey, type PogoEvent } from './eventTypes';

// Re-exported for backward-compatible import paths (canonical homes: eventPokemonNames.ts /
// eventPokemonTypes.ts / eventPokemonResolvers.ts).
export { parsePokemonNameAndSuffix } from './eventPokemonNames';
export { getEventSpriteEffect } from './eventPokemonResolvers';
export { SPRITE_EFFECTS } from './eventPokemonTypes';
export type { PokemonImageData, PokemonImageOptions, SpriteEffect } from './eventPokemonTypes';

// Fill in an effect on any image a resolver didn't already stamp: its name prefix (title-parsed names
// like "Mega Gengar" skip the boss-list path that reads it) combined with the event-level effect.
function applySpriteEffects(images: PokemonImageData[], effect: SpriteEffect | undefined): PokemonImageData[] {
    return images.map(image => {
        if (image.effect) return image;
        const resolved = combineSpriteEffects(splitSpriteEffectPrefix(image.name).effect, effect);
        return resolved ? { ...image, effect: resolved } : image;
    });
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
    // extraData can be entirely absent (or null) rather than just missing sub-fields; normalize it
    // so resolvers can still fall back to title-based parsing instead of getting skipped outright.
    const eventWithExtraData: EventWithExtraData = { ...event, extraData: event.extraData ?? {} };

    const effect = getEventSpriteEffect(event);
    let result = IMAGE_RESOLVERS[event.eventType]?.(eventWithExtraData, options) ?? null;

    // Spotlight sub-events (any parent eventType) fall back to the spotlight resolver when their
    // primary resolver produced nothing.
    if (!result && eventWithExtraData.extraData.isSpotlightSubEvent) {
        result = resolveSpotlightImages(eventWithExtraData, options);
    }

    // Hatch Days are plain `event`s recognized by title, which the event-level effect already did.
    if (!result && effect === SPRITE_EFFECTS.HATCH) {
        result = resolveHatchDayImages(eventWithExtraData, options);
    }

    return result ? applySpriteEffects(result, effect) : [];
}

export function hasEventPokemonImage(event: PogoEvent, options?: PokemonImageOptions): boolean {
    return getEventPokemonImages(event, options).length > 0;
}

export function getMultiDayPokemonImages(event: PogoEvent, options?: PokemonImageOptions): PokemonImageData[] {
    const raidSchedule = event.extraData?.raidSchedule;

    // A per-day raid schedule means the full boss list is day-specific and not representative of
    // the whole bar - narrow to bosses that recur on every day instead (e.g. a legendary running
    // alongside a daily-rotating Mega). No day-schedule at all just uses the regular resolution.
    if (raidSchedule && raidSchedule.length > 0) {
        const recurringBosses = getRecurringRaidScheduleBosses(raidSchedule);
        if (recurringBosses.length === 0) {
            return [];
        }
        const images = getPokemonImagesFromBossList(recurringBosses, options);
        return applySpriteEffects(images, getEventSpriteEffect(event));
    }

    return getEventPokemonImages(event, options);
}
