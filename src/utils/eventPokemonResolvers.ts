import { formatEventName } from './eventName.ts';
import {
    extractPokemonNameFromMaxMonday,
    extractPokemonNameFromRaidBattle,
    extractPokemonNamesFromRaidHour,
    extractPokemonNamesFromSpotlightHour,
    parseDynamaxMaxBattleName,
    parseEventPokemonNames,
    parseGigantamaxMaxBattleName,
    parsePokemonNameAndSuffix,
} from './eventPokemonNames';
import { SPRITE_EFFECTS } from './eventPokemonTypes';
import type { EventWithExtraData, PokemonImageData, PokemonImageOptions, SpriteEffect } from './eventPokemonTypes';
import { getPokemonImagesFromBosses, getRaidBossesWithTierFallback, getSpriteImagesFromNames, getSpriteUrl } from './eventSprite';
import { getRaidSubType } from './eventSubtype';
import { type PogoEvent } from './eventTypes';
import { getGigantamaxSpriteUrl } from './pokemonMapper.ts';

// Each resolver maps one event-type branch to its Pokemon images, returning `null` to signal
// "this branch produced nothing — fall through to the next" (preserving getEventPokemonImages'
// original ordered fall-through). An empty array is a deliberate result and stops the dispatch.

// Event-level sprite effect, derived from the event (not a caller-supplied display string). The
// dispatcher applies this to resolved images that don't already carry a per-sprite effect, and the
// rendering component reads it for its placeholder (which has no image to carry one). Gigantamax is
// deliberately absent: it's asset-dependent per Pokemon, so `resolveMaxBattleImages` stamps it
// per-sprite instead (a named Pokemon with no Gigantamax asset gets a plain sprite, no overlay).
export function getEventSpriteEffect(event: PogoEvent): SpriteEffect | undefined {
    if (getRaidSubType(event) === 'shadow-raids') return SPRITE_EFFECTS.SHADOW;
    if (event.eventType === 'max-mondays') return SPRITE_EFFECTS.DYNAMAX;
    if (event.eventType === 'max-battles' && parseDynamaxMaxBattleName(formatEventName(event.name))) return SPRITE_EFFECTS.DYNAMAX;
    return undefined;
}

const RAID_DAY_TITLE_EXCEPTIONS = new Set(['fashion raid day']);

// Multi-form Gigantamax forms as they appear in titles (e.g. "Toxtricity Low Key",
// "Urshifu (Rapid Strike Form)"). Capture group 1 is normalized to a slug for the sprite lookup.
const GMAX_FORM_IN_TITLE = /[\s(]+(low[\s-]?key|single[\s-]?strike|rapid[\s-]?strike)[\s)]*(?:form)?[\s)]*/i;

// Major events (GO Fest / GO Tour / Wild Area) and generic `event` type: raid schedule boss data
// pre-mapped into raidbattles.
export function resolveBossImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    if (!event.extraData.raidbattles?.bosses?.length) {
        return null;
    }
    const images = getPokemonImagesFromBosses(event, options);
    return images.length > 0 ? images : null;
}

// Raid battles - check bosses data FIRST, then fall back to event name extraction, then LeekDuck images.
export function resolveRaidBattleImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    // First try to use bosses data from extraData
    if (event.extraData.raidbattles?.bosses && event.extraData.raidbattles.bosses.length > 0) {
        const images = getPokemonImagesFromBosses(event, options);
        if (images.length > 0) {
            return images;
        }
    }

    // Fallback to event name extraction if bosses data doesn't work
    const pokemonName = extractPokemonNameFromRaidBattle(event);
    if (pokemonName) {
        const raidSubType = getRaidSubType(event);
        const isMega = raidSubType === 'mega-raids' || raidSubType === 'super-mega-raids';
        const pokemonNames = parseEventPokemonNames(pokemonName);
        const images = getSpriteImagesFromNames(pokemonNames, options, isMega);

        if (images.length > 0) {
            return images;
        }
    }

    // Final fallback to LeekDuck's provided images
    if (event.extraData.raidbattles?.bosses) {
        const bosses = getRaidBossesWithTierFallback(event, options);
        if (bosses.length > 0) {
            return bosses.map(boss => ({ name: boss.name, imageUrl: boss.image || null }));
        }
    }

    return null;
}

// Raid-hour events - parse Pokemon names from title and generate sprite URLs.
export function resolveRaidHourImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    const pokemonNames = extractPokemonNamesFromRaidHour(formatEventName(event.name));
    if (pokemonNames.length === 0) {
        return null;
    }

    const images = getSpriteImagesFromNames(pokemonNames, options);
    return images.length > 0 ? images : null;
}

// Raid-day events - prefer bosses data, then fall back to title parsing.
export function resolveRaidDayImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    if (event.extraData.raidbattles?.bosses && event.extraData.raidbattles.bosses.length > 0) {
        const images = getPokemonImagesFromBosses(event, options);
        if (images.length > 0) {
            return images;
        }
    }

    const eventName = formatEventName(event.name);
    if (RAID_DAY_TITLE_EXCEPTIONS.has(eventName.toLowerCase())) {
        return [];
    }

    // Pattern: "<Pokemon Name> [Modifier] Raid Day"
    // Modifiers: "Fusion", "Mega", "Super Mega", "Shadow", etc.
    // "Mega"/"Super Mega" after the name indicates a Mega form (e.g. "Falinks Super Mega Raid Day")
    const match = eventName.match(/^(.+?)\s+((?:Super\s+)?Mega\s+|Fusion\s+)?Raid\s+Day$/i);
    if (match) {
        const pokemonNameString = match[1].trim();
        const raidModifier = match[2]?.trim().toLowerCase() ?? '';

        // Skip generic raid days without a Pokemon name (e.g. future events without complete data)
        if (pokemonNameString.toLowerCase() === 'shadow' || pokemonNameString.toLowerCase() === 'raid') {
            return [];
        }

        const parsedData = parsePokemonNameAndSuffix(pokemonNameString);
        if (parsedData) {
            const isMegaModifier = raidModifier.includes('mega');
            // Prefer suffix from name parsing; fall back to modifier-derived suffix
            const suffix = parsedData.suffix ?? (isMegaModifier ? '-mega' : undefined);
            const spriteUrl = getSpriteUrl(parsedData.pokemonName, suffix, options);
            // Reflect the actual Pokemon form in the display name
            const displayName = isMegaModifier ? `Mega ${pokemonNameString}` : pokemonNameString;

            // Always return, even if spriteUrl is null
            return [{ name: displayName, imageUrl: spriteUrl }];
        }
    }

    return null;
}

// Max-mondays events - parse Pokemon name from title and generate sprite URL.
export function resolveMaxMondayImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    const pokemonName = extractPokemonNameFromMaxMonday(formatEventName(event.name));
    if (!pokemonName) {
        return null;
    }
    const spriteUrl = getSpriteUrl(pokemonName, undefined, options);
    // Always return, even if spriteUrl is null (let component handle placeholder)
    return [{ name: pokemonName, imageUrl: spriteUrl }];
}

// Spotlight hours (and spotlight sub-events) - prefer structured spotlight payloads, then title parsing.
export function resolveSpotlightImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    const images: PokemonImageData[] = [];

    const spotlight = event.extraData.spotlight;
    if (spotlight) {
        // Prefer structured spotlight payloads when present.
        if (spotlight.list && spotlight.list.length > 0) {
            for (const pokemon of spotlight.list) {
                const spriteUrl = getSpriteUrl(pokemon.name, undefined, options, pokemon.image);
                images.push({ name: pokemon.name, imageUrl: spriteUrl });
            }
        } else if (spotlight.name) {
            const fallbackImage = spotlight.image || null;
            const spriteUrl = getSpriteUrl(spotlight.name, undefined, options, fallbackImage);
            images.push({ name: spotlight.name, imageUrl: spriteUrl });
        } else if (spotlight.image) {
            images.push({ name: 'Spotlight Pokemon', imageUrl: spotlight.image });
        }

        if (images.length > 0) {
            return images;
        }
    }

    const pokemonNames = extractPokemonNamesFromSpotlightHour(event.name);
    images.push(...getSpriteImagesFromNames(pokemonNames, options));

    return images.length > 0 ? images : null;
}

// Community day events - use spawns data and generate sprites.
export function resolveCommunityDayImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    const spawns = event.extraData.communityday?.spawns;
    if (!spawns) {
        return null;
    }

    const images: PokemonImageData[] = [];

    for (const spawn of spawns) {
        if (spawn.name) {
            const fallbackImage = spawn.image || null;
            const spriteUrl = getSpriteUrl(spawn.name, undefined, options, fallbackImage);
            images.push({ name: spawn.name, imageUrl: spriteUrl });
        }
    }

    return images.length > 0 ? images : null;
}

// Resolve a single Gigantamax-named Pokemon to its sprite. Returns a Gmax sprite (stamped with the
// `gigantamax` effect) when a Gmax asset exists for the Pokemon; otherwise falls back to the plain
// sprite with no effect, so events naming a mix of Gmax and non-Gmax Pokemon render correctly.
function resolveGigantamaxImage(pokemonName: string, options?: PokemonImageOptions): PokemonImageData {
    // Detect and strip a known multi-form suffix (e.g. "Toxtricity Low Key" → base "Toxtricity",
    // slug "low-key") so the mapper can pick the right Gmax sprite.
    const formMatch = pokemonName.match(GMAX_FORM_IN_TITLE);
    const formSlug = formMatch ? formMatch[1].toLowerCase().replace(/[\s-]+/g, '-') : undefined;
    const basePokemonName = formMatch ? pokemonName.replace(GMAX_FORM_IN_TITLE, '').trim() : pokemonName;

    const gmaxUrl = getGigantamaxSpriteUrl(basePokemonName, formSlug);
    if (gmaxUrl) {
        return { name: `Gigantamax ${pokemonName}`, imageUrl: gmaxUrl, effect: SPRITE_EFFECTS.GIGANTAMAX };
    }

    // No Gigantamax asset for this Pokemon - fall back to its plain sprite (no overlay).
    const parsed = parsePokemonNameAndSuffix(pokemonName);
    const spriteUrl = parsed ? getSpriteUrl(parsed.pokemonName, parsed.suffix, options) : null;
    return { name: pokemonName, imageUrl: spriteUrl };
}

// Max battles - Gigantamax/Dynamax title patterns, then the main event image.
export function resolveMaxBattleImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    const eventName = formatEventName(event.name);

    // Gigantamax pattern: "Gigantamax <Pokemon Name(s)> Max Battle Day" (may name multiple Pokemon).
    const gigantamaxName = parseGigantamaxMaxBattleName(eventName);
    if (gigantamaxName) {
        const images = parseEventPokemonNames(gigantamaxName).map(name => resolveGigantamaxImage(name, options));
        if (images.length > 0) {
            return images;
        }
    }

    // Check for regular Dynamax pattern: "Dynamax <Pokemon> Max Battle Weekend/Day"
    const dynamaxName = parseDynamaxMaxBattleName(eventName);
    if (dynamaxName) {
        const spriteUrl = getSpriteUrl(dynamaxName, undefined, options);
        return [{ name: dynamaxName, imageUrl: spriteUrl }];
    }

    // Fallback to event image if available (e.g., "Max Battle Weekend" with no specific Pokemon)
    if (event.image) {
        return [{ name: 'Max Battle', imageUrl: event.image }];
    }

    return null;
}

// Pokestop showcases - parse Pokemon name(s) from title and generate sprite URLs.
export function resolvePokestopShowcaseImages(event: EventWithExtraData, options?: PokemonImageOptions): PokemonImageData[] | null {
    const eventName = formatEventName(event.name);

    // Pattern: "<Pokemon Name(s)> PokéStop Showcase(s)"
    const match = eventName.match(/^(.+?)\s+PokéStop\s+Showcases?$/i);
    if (!match) {
        return null;
    }

    const pokemonNameString = match[1].trim();

    // Skip if it's a general type-based showcase (contains "-type" or " type")
    if (/(?:\w+-type|\s+type)\b/i.test(pokemonNameString)) {
        return [];
    }

    // Always return all parsed Pokemon, even those whose sprite URL resolves to null.
    const pokemonNames = parseEventPokemonNames(pokemonNameString);
    return getSpriteImagesFromNames(pokemonNames, options);
}
